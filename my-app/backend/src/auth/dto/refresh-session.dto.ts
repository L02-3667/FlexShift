import { IsOptional, IsString, MinLength } from 'class-validator';

export class RefreshSessionDto {
  @IsString()
  @MinLength(10)
  refreshToken!: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  deviceId?: string;
}
