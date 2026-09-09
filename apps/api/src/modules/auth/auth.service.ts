import { prisma } from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { UserRole } from '@real-estate/types';

export class AuthService {
  async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: UserRole;
    avatarUrl?: string;
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) {
      throw new Error('An account with this email address already exists');
    }

    const passwordHash = await hashPassword(data.password);
    const userRole = data.role || UserRole.BUYER;

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        passwordHash,
        role: userRole,
        avatarUrl: data.avatarUrl,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { user, tokens };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new Error('This account has been suspended. Please contact support.');
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    // Upsert or store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, tokens };
  }

  async refreshTokens(oldRefreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(oldRefreshToken);
    } catch {
      throw new Error('Invalid or expired refresh token');
    }

    const savedToken = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
    });

    if (!savedToken || savedToken.expiresAt < new Date()) {
      if (savedToken) {
        await prisma.refreshToken.delete({ where: { id: savedToken.id } });
      }
      throw new Error('Refresh token revoked or expired');
    }

    // Refresh token rotation: delete old, create new
    await prisma.refreshToken.delete({ where: { id: savedToken.id } });

    const newTokens = this.generateTokens({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    await prisma.refreshToken.create({
      data: {
        userId: payload.userId,
        token: newTokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return newTokens;
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }
    return true;
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        agentProfile: true,
        builderProfile: true,
      },
    });
    if (!user) throw new Error('User not found');
    return user;
  }

  async switchRole(userId: string, targetRole: UserRole) {
    if (targetRole !== UserRole.OWNER && targetRole !== UserRole.AGENT) {
      throw new Error('Can only switch account role to OWNER or AGENT');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: targetRole },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return { user, tokens };
  }

  private generateTokens(payload: { userId: string; email: string; role: UserRole }) {
    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    };
  }
}

export const authService = new AuthService();
