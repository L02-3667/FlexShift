import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLeaveRequestDto {
  @IsString()
  shiftId!: string;

  @IsString()
  @MinLength(6)
  reason!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  clientMutationId?: string;

  @IsOptional()
  @IsString()
  dedupeKey?: string;
}
