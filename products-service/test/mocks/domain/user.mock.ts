import { User } from '@domain/entities/user.entity';
import { UserRole } from '@domain/shared/enums';

export const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  password: '$2b$10$hashedpassword',
  name: 'Test User',
  role: UserRole.USER,
  createdAt: new Date(),
  updatedAt: new Date(),
  hashPassword: jest.fn(),
  validatePassword: jest.fn().mockResolvedValue(true),
  isAdmin: jest.fn().mockReturnValue(false),
} as User;
