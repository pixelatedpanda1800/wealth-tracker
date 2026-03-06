import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('income_sources')
export class IncomeSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;
}
