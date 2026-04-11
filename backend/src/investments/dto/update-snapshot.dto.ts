import { IsNumber, IsOptional } from 'class-validator';

export class UpdateSnapshotDto {
  @IsNumber()
  @IsOptional()
  units?: number;

  @IsNumber()
  @IsOptional()
  costBasis?: number;

  @IsNumber()
  @IsOptional()
  value?: number;
}
