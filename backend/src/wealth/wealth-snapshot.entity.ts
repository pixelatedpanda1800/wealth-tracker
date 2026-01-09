import { Entity, Column, PrimaryGeneratedColumn, Unique, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('wealth_snapshots')
@Unique(['year', 'month'])
export class WealthSnapshot {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    year: number;

    @Column({ length: 3 })
    month: string;

    // Use simple-json for SQLite compatibility
    @Column('simple-json', { default: '{}' })
    values: Record<string, number>;

    // We can keeps these for backward compatibility during migration, 
    // or just rely on 'values' going forward.
    // For now, let's move to dynamic only to keep it clean.

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
