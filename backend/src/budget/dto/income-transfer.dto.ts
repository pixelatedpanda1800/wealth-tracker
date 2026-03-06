import { IsString, IsNumber, IsUUID, IsOptional, IsEnum } from 'class-validator';

export class CreateIncomeTransferDto {
    @IsString()
    description: string;

    @IsNumber()
    amount: number;

    @IsEnum(['bills', 'spending', 'savings'])
    category: 'bills' | 'spending' | 'savings';

    @IsUUID()
    sourceAccountId: string;

    @IsUUID()
    targetAccountId: string;
}

export class UpdateIncomeTransferDto {
    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    amount?: number;

    @IsOptional()
    @IsEnum(['bills', 'spending', 'savings'])
    category?: 'bills' | 'spending' | 'savings';

    @IsOptional()
    @IsUUID()
    sourceAccountId?: string;

    @IsOptional()
    @IsUUID()
    targetAccountId?: string;
}
