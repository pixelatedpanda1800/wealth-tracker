import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  estimatedValue?: number;

  @IsDateString()
  @IsOptional()
  valuationDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
