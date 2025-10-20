import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    return null;
  }
}

export async function getUserById(userId: number) {
  try {
    const result = await sql`
      SELECT id, username, email, role, created_at 
      FROM users 
      WHERE id = ${userId}
    `;
    return result[0] || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

export async function getUserByEmail(email: string) {
  try {
    const result = await sql`
      SELECT id, username, email, password_hash, role, created_at 
      FROM users 
      WHERE email = ${email}
    `;
    return result[0] || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

export async function createUser(username: string, email: string, password: string) {
  try {
    const passwordHash = await hashPassword(password);
    const result = await sql`
      INSERT INTO users (username, email, password_hash)
      VALUES (${username}, ${email}, ${passwordHash})
      RETURNING id, username, email, role, created_at
    `;
    return result[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}
