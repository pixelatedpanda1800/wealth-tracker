import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InvestmentHolding } from './investment-holding.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity('investment_snapshots')
@Unique(['holdingId', 'year', 'month'])
export class InvestmentSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  holdingId: string;

  @ManyToOne(() => InvestmentHolding, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'holdingId' })
  holding: InvestmentHolding;

  @Column()
  year: number;

  @Column({ length: 3 })
  month: string;

  @Column('decimal', { precision: 14, scale: 4, nullable: true, transformer: decimalTransformer })
  units: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true, transformer: decimalTransformer })
  costBasis: number;

  @Column('decimal', { precision: 12, scale: 2, transformer: decimalTransformer })
  value: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
