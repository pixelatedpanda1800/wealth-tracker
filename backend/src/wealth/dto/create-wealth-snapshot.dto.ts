import { IsNumber, IsString, IsIn, Min, Max, Length, IsObject, IsOptional } from 'class-validator';

export class CreateWealthSnapshotDto {
    @IsNumber()
    @Min(2000)
    @Max(2100)
    year: number;

    @IsString()
    @Length(3, 3)
    @IsIn(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
    month: string;

    @IsObject()
    @IsOptional()
    values: Record<string, number>;
}
