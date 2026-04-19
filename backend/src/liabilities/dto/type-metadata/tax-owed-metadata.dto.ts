import { IsString, IsOptional, IsDateString } from 'class-validator';

export class TaxOwedMetadataDto {
  @IsString()
  @IsOptional()
  authority?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
