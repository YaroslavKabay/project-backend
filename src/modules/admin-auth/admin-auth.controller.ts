import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AdminAuthService } from './admin-auth.service';
import { CookieService } from '../auth/services/cookie.service';
import { LoginDto } from '../auth/dto/login.dto';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import type { AuthenticatedAdmin } from '@projectua/project-core';

@Controller('admin-auth')
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly cookieService: CookieService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    message: string;
    access_token: string;
    user: AuthenticatedAdmin;
  }> {
    const userAgent = req.headers['user-agent'];
    const ip = this.getClientIp(req);

    const result = await this.adminAuthService.login(
      dto.email,
      dto.password,
      userAgent,
      ip,
    );

    this.cookieService.setAdminRefreshToken(res, result.refresh_token);

    return {
      message: 'Успішний вхід',
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Request() req: ExpressRequest,
  ): Promise<{
    message: string;
    access_token: string;
    user: AuthenticatedAdmin;
  }> {
    const refreshToken = this.cookieService.getRefreshToken(req);

    if (!refreshToken) {
      throw new UnauthorizedException({
        message: 'Refresh токен не знайдено в cookies',
        error: 'MISSING_REFRESH_TOKEN',
        statusCode: 401,
      });
    }

    const result = await this.adminAuthService.refreshAccessToken(refreshToken);

    return {
      message: 'Access токен успішно оновлено',
      access_token: result.access_token,
      user: result.user,
    };
  }

  @UseGuards(AdminJwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const refreshToken = this.cookieService.getRefreshToken(req);

    await this.adminAuthService.revokeRefreshToken(admin.id, refreshToken);

    this.cookieService.clearRefreshToken(res);

    return { message: 'Ви успішно вийшли з акаунту' };
  }

  @UseGuards(AdminJwtAuthGuard)
  @Get('me')
  getMe(@CurrentAdmin() admin: AuthenticatedAdmin): AuthenticatedAdmin {
    return admin;
  }

  private getClientIp(req: ExpressRequest): string {
    const requestIp = req.ip;
    if (requestIp && typeof requestIp === 'string') {
      return requestIp;
    }

    const forwardedFor = req.headers['x-forwarded-for'] as string | undefined;
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    return 'unknown';
  }
}
