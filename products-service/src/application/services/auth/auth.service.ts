import { Injectable, Inject, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../domain/repositories/user.repository.interface';
import { RegisterRequestDto } from '../../../presentation/dto/auth/request/register-request.dto';
import { User } from '../../../domain/entities/user.entity';
import { UserRole } from '../../../domain/shared/enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterRequestDto): Promise<User> {
    const existingUser: User | null = await this.userRepository.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user: User = await this.userRepository.create({
      email: registerDto.email,
      password: registerDto.password,
      name: registerDto.name,
      role: UserRole.USER,
    });

    return user;
  }

  async registerAdmin(registerDto: RegisterRequestDto, currentUser: User): Promise<User> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can register other administrators');
    }

    const existingUser: User | null = await this.userRepository.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user: User = await this.userRepository.create({
      email: registerDto.email,
      password: registerDto.password,
      name: registerDto.name,
      role: UserRole.ADMIN,
    });

    return user;
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Pick<User, 'id' | 'email' | 'name' | 'role' | 'createdAt' | 'updatedAt'> | null> {
    const user: User | null = await this.userRepository.findByEmail(email);
    if (!user) {
      return null;
    }
    const isPasswordValid: boolean = await user.validatePassword(password);
    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async login(user: Pick<User, 'id' | 'email' | 'name' | 'role' | 'createdAt' | 'updatedAt'>) {
    const payload: { email: string; sub: string; role: string } = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };
    const token: string = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async logout(token: string): Promise<void> {
    const decoded: { exp?: number } | null = this.jwtService.decode(token) as {
      exp?: number;
    } | null;
    if (decoded && decoded.exp) {
      const expirationTime: number = decoded.exp - Math.floor(Date.now() / 1000);
      if (expirationTime > 0) {
        await this.cacheManager.set(`jwt_blacklist:${token}`, true, expirationTime * 1000);
      }
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted: boolean | undefined = await this.cacheManager.get(`jwt_blacklist:${token}`);
    return blacklisted === true;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}
