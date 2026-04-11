import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvestmentHolding } from './entities/investment-holding.entity';
import { InvestmentSnapshot } from './entities/investment-snapshot.entity';
import { WealthSnapshot } from '../wealth/wealth-snapshot.entity';
import { InvestmentsService } from './investments.service';
import { InvestmentsController } from './investments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvestmentHolding,
      InvestmentSnapshot,
      WealthSnapshot,
    ]),
  ],
  controllers: [InvestmentsController],
  providers: [InvestmentsService],
})
export class InvestmentsModule {}
