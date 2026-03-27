import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export class CreateAccountDto {
    @IsString()
    name: string;

    @IsIn(['investment', 'spending', 'saving', 'outgoings'])
    category: 'investment' | 'spending' | 'saving' | 'outgoings';

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    @IsNumber()
    allocatedAmount?: number;
}

export class UpdateAccountDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsIn(['investment', 'spending', 'saving', 'outgoings'])
    category?: 'investment' | 'spending' | 'saving' | 'outgoings';

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    @IsNumber()
    allocatedAmount?: number;
}
