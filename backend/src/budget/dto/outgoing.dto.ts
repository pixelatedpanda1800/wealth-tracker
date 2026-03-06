import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsIn,
} from 'class-validator';
import type {
  OutgoingType,
  Frequency,
} from '../entities/outgoing-source.entity';

export class CreateOutgoingDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(['non-negotiable', 'required', 'optional', 'savings'])
  type: OutgoingType;

  @IsIn(['monthly', 'annual'])
  frequency: Frequency;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  paymentDate?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  wealthSourceId?: string;
}

export class UpdateOutgoingDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsIn(['non-negotiable', 'required', 'optional', 'savings'])
  type?: OutgoingType;

  @IsOptional()
  @IsIn(['monthly', 'annual'])
  frequency?: Frequency;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  paymentDate?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  wealthSourceId?: string;
}
