import { IsString, IsIn, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class MortgageMetadataDto {
  @IsIn(['fixed', 'variable', 'tracker', 'svr'])
  rateType: 'fixed' | 'variable' | 'tracker' | 'svr';

  @IsDateString()
  @IsOptional()
  rateEndDate?: string;

  @IsIn(['repayment', 'interest_only', 'part_and_part'])
  repaymentType: 'repayment' | 'interest_only' | 'part_and_part';

  @IsOptional()
  overpaymentAnnualCapPct?: number;

  @IsBoolean()
  @IsOptional()
  ercApplies?: boolean;

  @IsDateString()
  @IsOptional()
  ercEndDate?: string;
}
