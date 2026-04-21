import { IsOptional, IsString } from 'class-validator';

export class QueryCalendarDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
