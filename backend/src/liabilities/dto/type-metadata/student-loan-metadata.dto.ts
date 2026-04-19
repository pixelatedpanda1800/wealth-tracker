import { IsIn, IsOptional, IsNumber } from 'class-validator';

export class StudentLoanMetadataDto {
  @IsIn(['plan_1', 'plan_2', 'plan_4', 'plan_5', 'postgrad'])
  planType: 'plan_1' | 'plan_2' | 'plan_4' | 'plan_5' | 'postgrad';

  @IsNumber()
  @IsOptional()
  writeOffYear?: number;

  @IsNumber()
  @IsOptional()
  salaryThreshold?: number;
}
