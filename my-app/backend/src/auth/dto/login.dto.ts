import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'manager@flexshift.app' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'FlexShift123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: 'device-android-001', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  deviceId?: string;

  @ApiPropertyOptional({ example: 'Samsung S24' })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional({ example: 'android' })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ example: '1.0.0' })
  @IsOptional()
  @IsString()
  appVersion?: string;
}
