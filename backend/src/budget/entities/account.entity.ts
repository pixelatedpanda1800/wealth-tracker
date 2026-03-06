import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type AccountType = 'bank' | 'savings';

@Entity('accounts')
export class Account {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'varchar', length: 20 })
    type: AccountType;

    @Column({ type: 'varchar', length: 10, nullable: true })
    color: string | null;
}
