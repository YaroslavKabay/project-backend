export interface AuthenticatedAdmin {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER';
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminJwtPayload {
  sub: number;
  email: string;
  role: 'ADMIN' | 'MANAGER';
  iat?: number;
  exp?: number;
}
