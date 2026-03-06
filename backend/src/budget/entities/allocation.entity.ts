import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from './account.entity';

export type AllocationCategory = 'bills' | 'spending' | 'savings';

@Entity('allocations')
export class Allocation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    description: string;

    @Column('decimal', { precision: 12, scale: 2 })
    amount: number;

    @Column({ type: 'varchar', length: 20 })
    category: AllocationCategory;

    @ManyToOne(() => Account, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'accountId' })
    account: Account;

    @Column()
    accountId: string;
}
