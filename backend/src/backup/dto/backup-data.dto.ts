import { IsNumber, IsString, IsObject, ValidateNested, IsArray, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class WealthDataDto {
    @IsArray()
    sources: any[];

    @IsArray()
    snapshots: any[];
}

class BudgetDataDto {
    @IsArray()
    @IsOptional()
    incomes: any[];

    @IsArray()
    @IsOptional()
    outgoings: any[];

    @IsArray()
    @IsOptional()
    accounts: any[];

    @IsArray()
    @IsOptional()
    allocations: any[];
}

class InvestmentsDataDto {
    @IsArray()
    @IsOptional()
    holdings: any[];

    @IsArray()
    @IsOptional()
    snapshots: any[];
}

class LiabilitiesDataDto {
    @IsArray()
    @IsOptional()
    properties: any[];

    @IsArray()
    @IsOptional()
    liabilities: any[];

    @IsArray()
    @IsOptional()
    snapshots: any[];

    @IsArray()
    @IsOptional()
    overpayments: any[];
}

class DataDto {
    @IsObject()
    @ValidateNested()
    @Type(() => WealthDataDto)
    wealth: WealthDataDto;

    @IsObject()
    @ValidateNested()
    @Type(() => BudgetDataDto)
    @IsOptional()
    budget: BudgetDataDto;

    @IsObject()
    @ValidateNested()
    @Type(() => InvestmentsDataDto)
    @IsOptional()
    investments: InvestmentsDataDto;

    @IsObject()
    @ValidateNested()
    @Type(() => LiabilitiesDataDto)
    @IsOptional()
    liabilities?: LiabilitiesDataDto;
}

export class BackupDataDto {
    @IsNumber()
    version: number;

    @IsString()
    timestamp: string;

    @IsObject()
    @ValidateNested()
    @Type(() => DataDto)
    data: DataDto;
}
