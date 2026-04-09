import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { WealthSourceCategory } from '../wealth-source.entity';

export class CreateWealthSourceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsIn(Object.values(WealthSourceCategory))
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  color?: string;
}

export class UpdateWealthSourceDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsIn(Object.values(WealthSourceCategory))
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  color?: string;
}
