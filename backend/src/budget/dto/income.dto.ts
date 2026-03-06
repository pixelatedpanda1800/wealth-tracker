import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateIncomeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class UpdateIncomeDto {
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsString()
  category?: string;

  @IsNumber()
  @Min(0)
  amount?: number;
}
