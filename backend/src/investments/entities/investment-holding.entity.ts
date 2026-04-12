import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WealthSource } from '../../wealth/wealth-source.entity';

export enum HoldingType {
  FUND = 'fund',
  ETF = 'etf',
  STOCK = 'stock',
  BOND = 'bond',
  CRYPTO = 'crypto',
  OTHER = 'other',
}

@Entity('investment_holdings')
export class InvestmentHolding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  ticker: string;

  @Column({ type: 'text', default: HoldingType.FUND })
  type: string;

  @Column({ nullable: true })
  color: string;

  @Column()
  wealthSourceId: string;

  @ManyToOne(() => WealthSource, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wealthSourceId' })
  wealthSource: WealthSource;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
