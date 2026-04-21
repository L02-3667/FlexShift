import { IsBoolean, IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateUserSettingDto {
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  approvalUpdatesEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  openShiftAlertsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  remindersEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  reminderMinutesBefore?: number;

  @IsOptional()
  @IsIn(['vi'])
  language?: 'vi';

  @IsOptional()
  @IsIn(['system', 'light'])
  theme?: 'system' | 'light';
}
