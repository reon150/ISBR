import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../domain/shared/constants';

export const ROLES_KEY: string = 'roles';
export const Roles: (...roles: UserRole[]) => MethodDecorator & ClassDecorator = (
  ...roles: UserRole[]
) => SetMetadata(ROLES_KEY, roles);
