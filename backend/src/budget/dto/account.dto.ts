import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export class CreateAccountDto {
    @IsString()
    name: string;

    @IsIn(['non-negotiable', 'required', 'optional', 'savings', 'spending'])
    category: 'non-negotiable' | 'required' | 'optional' | 'savings' | 'spending';

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
    @IsIn(['non-negotiable', 'required', 'optional', 'savings', 'spending'])
    category?: 'non-negotiable' | 'required' | 'optional' | 'savings' | 'spending';

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    @IsNumber()
    allocatedAmount?: number;
}
