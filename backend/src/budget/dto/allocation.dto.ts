import { IsString, IsNumber, IsUUID, IsOptional } from 'class-validator';

export class CreateAllocationDto {
    @IsString()
    description: string;

    @IsNumber()
    amount: number;

    @IsUUID()
    accountId: string;
}

export class UpdateAllocationDto {
    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    amount?: number;

    @IsOptional()
    @IsUUID()
    accountId?: string;
}
