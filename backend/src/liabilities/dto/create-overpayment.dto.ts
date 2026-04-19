import { IsString, IsNumber, IsOptional, Min, Length } from 'class-validator';

export class CreateOverpaymentDto {
  @IsString()
  liabilityId: string;

  @IsNumber()
  year: number;

  @IsString()
  @Length(3, 3)
  month: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class BulkUpsertOverpaymentsDto {
  @IsString()
  liabilityId: string;

  @IsNumber()
  @IsOptional()
  recurringOverpayment?: number;

  overpayments: CreateOverpaymentDto[];
}
