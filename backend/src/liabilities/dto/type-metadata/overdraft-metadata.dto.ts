import { IsNumber, Min, IsOptional } from 'class-validator';

export class OverdraftMetadataDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  arrangedLimit?: number;
}
