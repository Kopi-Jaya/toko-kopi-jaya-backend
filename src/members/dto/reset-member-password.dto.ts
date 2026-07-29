import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

/// Staff-assisted password reset (BUG-2026-009).
///
/// Member login is email + password with no OTP and no email delivery configured,
/// so before this a member who forgot their password was locked out of their
/// account and their accumulated points permanently — "Lupa password?" in the app
/// only ever showed "Coming soon".
///
/// A self-service email reset needs SMTP credentials this deployment does not
/// have, so recovery is staff-assisted: the member identifies themselves at an
/// outlet and an admin sets a new password. That is a real, testable mechanism
/// rather than an unimplemented promise.
export class ResetMemberPasswordDto {
  @ApiProperty({
    description: 'New password for the member. Minimum 8 characters.',
    minLength: 8,
    example: 'PasswordBaru123',
  })
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  new_password: string;
}
