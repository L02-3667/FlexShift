import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateYieldRequestDto {
  @IsString()
  shiftId!: string;

  @IsString()
  targetEmployeeId!: string;

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
