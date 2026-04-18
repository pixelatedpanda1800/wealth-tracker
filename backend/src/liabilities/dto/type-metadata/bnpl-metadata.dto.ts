import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class BnplMetadataDto {
  @IsString()
  @IsOptional()
  provider?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  instalmentCount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  instalmentsPaid?: number;
}
