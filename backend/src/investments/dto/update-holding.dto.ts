import { IsString, IsOptional, IsIn, IsUUID } from 'class-validator';

export class UpdateHoldingDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  ticker?: string;

  @IsString()
  @IsIn(['fund', 'etf', 'stock', 'bond', 'other'])
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsUUID()
  @IsOptional()
  wealthSourceId?: string;
}
