import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../../application/services/auth';
import { LoginRequestDto, AuthResponseDto, UserResponseDto } from '../dto/auth';
import { RegisterRequestDto } from '../dto/auth/request/register-request.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../infrastructure/auth/guards/roles.guard';
import { Roles } from '../../infrastructure/auth/decorators/roles.decorator';
import { CurrentUser } from '../../infrastructure/auth/decorators/current-user.decorator';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/shared/enums/user-role.enum';

interface RequestWithUser {
  user: Pick<User, 'id' | 'email' | 'name' | 'role' | 'createdAt' | 'updatedAt'>;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user',
    description: 'Creates a new user account (role will be set to USER)',
  })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'User with this email already exists' })
  async register(@Body() registerDto: RegisterRequestDto): Promise<UserResponseDto> {
    const user: User = await this.authService.register(registerDto);
    return UserResponseDto.fromEntity(user);
  }

  @Post('register-admin')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Register new admin',
    description: 'Creates a new admin account (only accessible by admins)',
  })
  @ApiResponse({ status: 201, description: 'Admin registered successfully', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only administrators can register other administrators',
  })
  @ApiResponse({ status: 409, description: 'User with this email already exists' })
  async registerAdmin(
    @Body() registerDto: RegisterRequestDto,
    @CurrentUser() currentUser: User,
  ): Promise<UserResponseDto> {
    const user: User = await this.authService.registerAdmin(registerDto, currentUser);
    return UserResponseDto.fromEntity(user);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login', description: 'Authenticates user and returns JWT token' })
  @ApiBody({ type: LoginRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns JWT token',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Request() req: RequestWithUser): Promise<AuthResponseDto> {
    return this.authService.login(req.user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'User logout',
    description: 'Logs out the current user and invalidates token',
  })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async logout(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token is required');
    }

    const token: string = authHeader.substring(7);
    await this.authService.logout(token);

    return { message: 'Logged out successfully' };
  }
}
