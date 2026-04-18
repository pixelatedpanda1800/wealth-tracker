import { IsString, IsNumber, IsOptional, Min, Length } from 'class-validator';

export class CreateSnapshotDto {
  @IsString()
  liabilityId: string;

  @IsNumber()
  year: number;

  @IsString()
  @Length(3, 3)
  month: string;

  @IsNumber()
  @Min(0)
  balance: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  interestPaid?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  paymentMade?: number;
}
