import {
  Injectable,
  UnauthorizedException,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { adminRefreshTokenConfig } from '../../config/admin-jwt.config';
import { AdminJwtPayload, AuthenticatedAdmin } from '@projectua/project-core';
import { CreateAdminUserDto } from '../backoffice/dto/create-admin-user.dto';
import { UpdateAdminUserDto } from '../backoffice/dto/update-admin-user.dto';

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    email: string,
    password: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: AuthenticatedAdmin;
  }> {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email },
    });

    if (!admin) {
      this.logger.warn(`Admin login failed: User not found - ${email}`);
      throw new UnauthorizedException('Невірний email або пароль');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isPasswordValid) {
      this.logger.warn(`Admin login failed: Invalid password for - ${email}`);
      throw new UnauthorizedException('Невірний email або пароль');
    }

    const jwtPayload: AdminJwtPayload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    };

    const accessToken = this.jwtService.sign(jwtPayload);
    const refreshToken = await this.generateRefreshToken(
      admin.id,
      userAgent,
      ipAddress,
    );

    this.logger.log(`✅ Admin logged in successfully: ${email}`);

    const user: AuthenticatedAdmin = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };

    return { access_token: accessToken, refresh_token: refreshToken, user };
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    user: AuthenticatedAdmin;
  }> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const refreshTokenRecord = await this.prisma.adminRefreshToken.findFirst({
      where: {
        token: tokenHash,
        status: 'ACTIVE',
        expiresAt: {
          gte: new Date(),
        },
      },
      include: {
        adminUser: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!refreshTokenRecord) {
      this.logger.warn(
        `Admin refresh token validation failed: Invalid or expired token`,
      );
      throw new UnauthorizedException(
        'Refresh токен недійсний або прострочений',
      );
    }

    const adminUser = refreshTokenRecord.adminUser;

    const jwtPayload: AdminJwtPayload = {
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    };

    const newAccessToken = this.jwtService.sign(jwtPayload);

    await this.prisma.adminRefreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { lastUsed: new Date() },
    });

    this.logger.log(`✅ Admin access token refreshed for: ${adminUser.email}`);

    return { access_token: newAccessToken, user: adminUser };
  }

  async revokeRefreshToken(
    adminId: number,
    refreshToken?: string,
  ): Promise<void> {
    if (refreshToken) {
      const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      await this.prisma.adminRefreshToken.updateMany({
        where: {
          adminUserId: adminId,
          token: tokenHash,
          status: 'ACTIVE',
        },
        data: { status: 'REVOKED' },
      });
    } else {
      await this.prisma.adminRefreshToken.updateMany({
        where: {
          adminUserId: adminId,
          status: 'ACTIVE',
        },
        data: { status: 'REVOKED' },
      });
    }
  }

  private readonly ADMIN_SELECT = {
    id: true,
    email: true,
    name: true,
    role: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async findAllAdmins() {
    return this.prisma.adminUser.findMany({
      select: this.ADMIN_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAdmin(dto: CreateAdminUserDto) {
    const existing = await this.prisma.adminUser.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Адмін з таким email вже існує');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.adminUser.create({
      data: { email: dto.email, passwordHash, name: dto.name, role: dto.role },
      select: this.ADMIN_SELECT,
    });
  }

  async updateAdmin(id: number, dto: UpdateAdminUserDto) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id } });

    if (!admin) {
      throw new NotFoundException(`Адміна з id ${id} не знайдено`);
    }

    return this.prisma.adminUser.update({
      where: { id },
      data: dto,
      select: this.ADMIN_SELECT,
    });
  }

  async deleteAdmin(id: number, currentAdminId: number) {
    if (id === currentAdminId) {
      throw new BadRequestException('Не можна видалити самого себе');
    }

    const admin = await this.prisma.adminUser.findUnique({ where: { id } });

    if (!admin) {
      throw new NotFoundException(`Адміна з id ${id} не знайдено`);
    }

    await this.prisma.adminUser.delete({ where: { id } });
    return { message: `Адміна з id ${id} видалено` };
  }

  async resetAdminPassword(id: number, newPassword: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id } });

    if (!admin) {
      throw new NotFoundException(`Адміна з id ${id} не знайдено`);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    return this.prisma.adminUser.update({
      where: { id },
      data: { passwordHash },
      select: this.ADMIN_SELECT,
    });
  }

  private async generateRefreshToken(
    adminId: number,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<string> {
    const expiresAt = new Date();
    const expirationDays = parseInt(
      adminRefreshTokenConfig.expiresIn.replace('d', ''),
      10,
    );
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    const refreshTokenRecord = await this.prisma.adminRefreshToken.create({
      data: {
        token: crypto.randomBytes(32).toString('hex'),
        adminUserId: adminId,
        expiresAt,
        userAgent,
        ipAddress,
        status: 'ACTIVE',
      },
    });

    const tokenId = refreshTokenRecord.id;
    const payload = { sub: adminId, tokenId };

    const refreshToken = this.jwtService.sign(payload, {
      secret: adminRefreshTokenConfig.secret,
      expiresIn: adminRefreshTokenConfig.expiresIn,
    });

    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await this.prisma.adminRefreshToken.update({
      where: { id: tokenId },
      data: { token: tokenHash },
    });

    return refreshToken;
  }
}
