import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty({
    example: 'Cập nhật quy trình giao ca',
    minLength: 4,
    maxLength: 120,
  })
  @IsString()
  @MinLength(4)
  @MaxLength(120)
  title!: string;

  @ApiProperty({
    example:
      'Từ ngày mai, mỗi ca tối cần xác nhận handover note trước khi rời cửa hàng.',
    minLength: 8,
    maxLength: 1200,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(1200)
  body!: string;

  @ApiPropertyOptional({
    enum: ['employee', 'manager', 'admin'],
    example: 'employee',
  })
  @IsOptional()
  @IsIn(['employee', 'manager', 'admin'])
  scopeRole?: 'employee' | 'manager' | 'admin';

  @ApiProperty({
    example: true,
    description:
      'Nếu true, người dùng trong phạm vi thông báo phải xác nhận đã đọc.',
  })
  @IsBoolean()
  requiresAck!: boolean;
}
