import { IsOptional, IsString, MinLength } from 'class-validator';

export class ClaimOpenShiftDto {
  @IsOptional()
  @IsString()
  @MinLength(8)
  clientMutationId?: string;

  @IsOptional()
  @IsString()
  dedupeKey?: string;
}
