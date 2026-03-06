import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum WealthSourceCategory {
  INVESTMENT = 'investment',
  CASH = 'cash',
  PENSION = 'pension',
}

@Entity('wealth_sources')
export class WealthSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'text',
    default: WealthSourceCategory.CASH,
  })
  category: string; // 'investment' | 'cash' | 'pension'

  @Column({ nullable: true })
  color: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
