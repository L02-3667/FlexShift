import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(4)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(1200)
  body!: string;

  @IsOptional()
  @IsIn(['employee', 'manager', 'admin'])
  scopeRole?: 'employee' | 'manager' | 'admin';

  @IsBoolean()
  requiresAck!: boolean;
}
