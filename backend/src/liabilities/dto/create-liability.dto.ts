import {
  IsString,
  IsIn,
  IsOptional,
  IsNumber,
  IsDateString,
  IsObject,
  Min,
} from 'class-validator';
import { LiabilityType } from '../entities/liability.entity';

const LIABILITY_TYPES = Object.values(LiabilityType);

export class CreateLiabilityDto {
  @IsString()
  name: string;

  @IsIn(LIABILITY_TYPES)
  type: string;

  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  originalPrincipal?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  interestRate?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyPayment?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  recurringOverpayment?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  creditLimit?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  termMonths?: number;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsObject()
  @IsOptional()
  typeMetadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
