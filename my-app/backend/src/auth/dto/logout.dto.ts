import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({
    description:
      'Refresh token hiện tại. Nếu bỏ trống, backend sẽ thu hồi toàn bộ session của người dùng.',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
