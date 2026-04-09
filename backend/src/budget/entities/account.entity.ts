import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type AccountCategory = 'investment' | 'spending' | 'saving' | 'outgoings';

@Entity('accounts')
export class Account {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'varchar', length: 20, default: 'spending' })
    category: AccountCategory;

    @Column({ type: 'varchar', length: 10, nullable: true })
    color: string | null;

    @Column('decimal', { precision: 12, scale: 2, default: 0 })
    allocatedAmount: number;
}
