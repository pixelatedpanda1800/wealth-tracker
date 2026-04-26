import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { Account } from './account.entity';

@Entity('allocations')
export class Allocation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    description: string;

    @Column('decimal', { precision: 12, scale: 2, transformer: decimalTransformer })
    amount: number;

    @ManyToOne(() => Account, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'accountId' })
    account: Account;

    @Column()
    accountId: string;

    @Column({ default: 0 })
    sortOrder: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
