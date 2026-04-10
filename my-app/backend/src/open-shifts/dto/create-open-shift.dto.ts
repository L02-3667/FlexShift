import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateOpenShiftDto {
  @IsDateString()
  date!: string;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;

  @IsString()
  @MinLength(2)
  storeName!: string;

  @IsString()
  @MinLength(2)
  position!: string;

  @IsString()
  @MinLength(4)
  note!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  clientMutationId?: string;

  @IsOptional()
  @IsString()
  dedupeKey?: string;
}
