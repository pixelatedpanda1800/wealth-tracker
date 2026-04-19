import { IsString, IsOptional, IsIn, IsUUID } from 'class-validator';

export class CreateHoldingDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  ticker?: string;

  @IsString()
  @IsIn(['fund', 'etf', 'stock', 'bond', 'crypto', 'other'])
  type: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsUUID()
  wealthSourceId: string;
}
