import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '@prisma/client';

export class InviteMemberDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty()
  email: string;

  @IsEnum(Role, { message: 'Role must be either ADMINISTRATOR or MEMBER' })
  @IsNotEmpty()
  role: Role;
}
