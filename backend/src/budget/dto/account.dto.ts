import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export class CreateAccountDto {
    @IsString()
    name: string;

    @IsIn(['bank', 'savings'])
    type: 'bank' | 'savings';

    @IsOptional()
    @IsString()
    color?: string;
}

export class UpdateAccountDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsIn(['bank', 'savings'])
    type?: 'bank' | 'savings';

    @IsOptional()
    @IsString()
    color?: string;
}
