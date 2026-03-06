import { IsString, IsNumber, IsIn, IsUUID, IsOptional } from 'class-validator';

export class CreateAllocationDto {
    @IsString()
    description: string;

    @IsNumber()
    amount: number;

    @IsIn(['bills', 'spending', 'savings'])
    category: 'bills' | 'spending' | 'savings';

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
    @IsIn(['bills', 'spending', 'savings'])
    category?: 'bills' | 'spending' | 'savings';

    @IsOptional()
    @IsUUID()
    accountId?: string;
}
