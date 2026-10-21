import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateMemberRoleDto {
  @IsEnum(Role, { message: 'Role must be either ADMINISTRATOR or MEMBER' })
  @IsNotEmpty()
  role: Role;
}
