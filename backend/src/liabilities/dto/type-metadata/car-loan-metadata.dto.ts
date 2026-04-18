import { IsIn, IsOptional, IsNumber, Min } from 'class-validator';

export class CarLoanMetadataDto {
  @IsIn(['hp', 'pcp', 'loan'])
  subType: 'hp' | 'pcp' | 'loan';

  @IsNumber()
  @Min(0)
  @IsOptional()
  balloonPayment?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  gmfv?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  mileageCap?: number;
}
