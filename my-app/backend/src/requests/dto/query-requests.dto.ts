import { IsOptional, IsString } from 'class-validator';

export class QueryRequestsDto {
  @IsOptional()
  @IsString()
  status?: string;
}
