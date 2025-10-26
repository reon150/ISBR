import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../../../application/services/auth';
import { User } from '../../../domain/entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(
    email: string,
    password: string,
  ): Promise<Pick<User, 'id' | 'email' | 'name' | 'role' | 'createdAt' | 'updatedAt'> | null> {
    const user: Pick<User, 'id' | 'email' | 'name' | 'role' | 'createdAt' | 'updatedAt'> | null =
      await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
