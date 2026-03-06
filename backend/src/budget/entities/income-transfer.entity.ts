import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from './account.entity';

@Entity('income_transfers')
export class IncomeTransfer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    description: string;

    @Column('decimal', { precision: 12, scale: 2 })
    amount: number;

    @Column({
        type: 'varchar',
        length: 20,
        default: 'bills'
    })
    category: 'bills' | 'spending' | 'savings';

    @Column('uuid')
    sourceAccountId: string;

    @Column('uuid')
    targetAccountId: string;

    @ManyToOne(() => Account, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sourceAccountId' })
    sourceAccount: Account;

    @ManyToOne(() => Account, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'targetAccountId' })
    targetAccount: Account;
}
