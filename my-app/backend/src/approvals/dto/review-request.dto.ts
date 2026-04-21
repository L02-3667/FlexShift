import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;

  @IsOptional()
  @IsString()
  clientMutationId?: string;

  @IsOptional()
  @IsString()
  dedupeKey?: string;
}
