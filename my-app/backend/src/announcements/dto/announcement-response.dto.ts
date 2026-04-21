import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnnouncementResponseDto {
  @ApiProperty({ example: 'cm9m4n2n70000l5081l0a1abc' })
  id!: string;

  @ApiProperty({ example: 'Cập nhật quy trình giao ca' })
  title!: string;

  @ApiProperty({
    example:
      'Từ ngày mai, mỗi ca tối cần xác nhận handover note trước khi rời cửa hàng.',
  })
  body!: string;

  @ApiPropertyOptional({
    enum: ['employee', 'manager', 'admin'],
    nullable: true,
    example: 'employee',
  })
  scopeRole!: 'employee' | 'manager' | 'admin' | null;

  @ApiProperty({ example: true })
  requiresAck!: boolean;

  @ApiPropertyOptional({
    example: '2026-04-17T09:15:00.000Z',
    nullable: true,
  })
  acknowledgedAt!: string | null;

  @ApiProperty({ example: '2026-04-17T09:00:00.000Z' })
  publishedAt!: string;

  @ApiPropertyOptional({
    example: '2026-04-18T09:00:00.000Z',
    nullable: true,
  })
  expiresAt!: string | null;

  @ApiProperty({ example: '2026-04-17T09:00:00.000Z' })
  updatedAt!: string;
}

export class AnnouncementAcknowledgementResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: '2026-04-17T09:20:00.000Z' })
  acknowledgedAt!: string;
}

export class AnnouncementDeleteResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;
}
