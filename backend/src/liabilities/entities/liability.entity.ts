import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Property } from './property.entity';

export enum LiabilityType {
  MORTGAGE = 'mortgage',
  PERSONAL_LOAN = 'personal_loan',
  CAR_LOAN = 'car_loan',
  CREDIT_CARD = 'credit_card',
  STUDENT_LOAN = 'student_loan',
  OVERDRAFT = 'overdraft',
  BNPL = 'bnpl',
  TAX_OWED = 'tax_owed',
  FAMILY_LOAN = 'family_loan',
  OTHER = 'other',
}

@Entity('liabilities')
export class Liability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  type: string;

  @Column({ nullable: true })
  propertyId: string;

  @ManyToOne(() => Property, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({ default: 'GBP', length: 3 })
  currency: string;

  @Column({ type: 'date', nullable: true })
  startDate: string;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  originalPrincipal: number;

  @Column('decimal', { precision: 6, scale: 3, nullable: true })
  interestRate: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  monthlyPayment: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  recurringOverpayment: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  creditLimit: number;

  @Column({ nullable: true })
  termMonths: number;

  @Column({ type: 'date', nullable: true })
  endDate: string;

  @Column('simple-json', { default: '{}' })
  typeMetadata: Record<string, any>;

  @Column({ nullable: true })
  color: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'datetime', nullable: true })
  archivedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
