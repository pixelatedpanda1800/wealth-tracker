import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from './entities/property.entity';
import { Liability } from './entities/liability.entity';
import { LiabilitySnapshot } from './entities/liability-snapshot.entity';
import { LiabilityOverpayment } from './entities/liability-overpayment.entity';
import { LiabilitiesService } from './liabilities.service';
import { LiabilitiesController } from './liabilities.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Property,
      Liability,
      LiabilitySnapshot,
      LiabilityOverpayment,
    ]),
  ],
  controllers: [LiabilitiesController],
  providers: [LiabilitiesService],
  exports: [LiabilitiesService],
})
export class LiabilitiesModule {}
