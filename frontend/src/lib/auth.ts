import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
const JWT_SECRET: jwt.Secret = process.env.JWT_SECRET || 'default-secret-change-me';
const JWT_EXPIRES_IN = '7d';
const JWT_REFRESH_EXPIRES_IN = '30d';

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign({ ...payload, type: 'refresh' }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { type: string };
    if (decoded.type !== 'refresh') {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function generateTokens(user: { id: number; email: string; role: string }) {
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { accessToken, refreshToken };
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.decode(token);
    if (decoded && typeof decoded === 'object') {
      return decoded as JwtPayload;
    }
    return null;
  } catch {
    return null;
  }
}
