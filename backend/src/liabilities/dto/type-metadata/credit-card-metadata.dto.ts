import { IsOptional, IsNumber, Min, Max, IsDateString } from 'class-validator';

export class CreditCardMetadataDto {
  @IsNumber()
  @IsOptional()
  promoApr?: number;

  @IsDateString()
  @IsOptional()
  promoEndDate?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minPaymentPct?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minPaymentFloor?: number;

  @IsNumber()
  @Min(1)
  @Max(28)
  @IsOptional()
  statementDay?: number;
}
