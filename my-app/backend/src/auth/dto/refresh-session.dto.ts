import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class RefreshSessionDto {
  @ApiProperty({ minLength: 10 })
  @IsString()
  @MinLength(10)
  refreshToken!: string;

  @ApiPropertyOptional({ example: 'device-android-001', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  deviceId?: string;
}
