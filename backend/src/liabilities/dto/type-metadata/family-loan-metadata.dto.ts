import { IsString, IsOptional } from 'class-validator';

export class FamilyLoanMetadataDto {
  @IsString()
  @IsOptional()
  counterparty?: string;

  @IsString()
  @IsOptional()
  agreedSchedule?: string;
}
