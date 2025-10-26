import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../domain/shared/enums/user-role.enum';

export const ROLES_KEY: string = 'roles';

type RolesDecorator = (...roles: UserRole[]) => ReturnType<typeof SetMetadata>;
export const Roles: RolesDecorator = (...roles) => SetMetadata(ROLES_KEY, roles);
