import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class DangNhapDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class LamMoiDto {
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}

