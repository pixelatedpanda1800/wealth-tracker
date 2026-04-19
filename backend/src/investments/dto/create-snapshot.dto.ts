import {
  IsNumber,
  IsString,
  IsIn,
  IsOptional,
  IsUUID,
  Min,
  Max,
  Length,
} from 'class-validator';

export class CreateSnapshotDto {
  @IsUUID()
  holdingId: string;

  @IsNumber()
  @Min(2000)
  @Max(2100)
  year: number;

  @IsString()
  @Length(3, 3)
  @IsIn([
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ])
  month: string;

  @IsNumber()
  @IsOptional()
  units?: number;

  @IsNumber()
  @IsOptional()
  costBasis?: number;

  @IsNumber()
  value: number;
}
