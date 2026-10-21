import { IsEmail, IsNotEmpty, IsString, Matches, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email address format' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must contain at least 8 characters' })
  @MaxLength(64)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 numeric digit',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Display name must be at least 2 characters long' })
  @MaxLength(60)
  displayName: string;
}
