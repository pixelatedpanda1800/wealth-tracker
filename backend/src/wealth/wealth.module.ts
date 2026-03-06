import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WealthSnapshot } from './wealth-snapshot.entity';
import { WealthSource } from './wealth-source.entity';
import { WealthService } from './wealth.service';
import { WealthController } from './wealth.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WealthSnapshot, WealthSource])],
  controllers: [WealthController],
  providers: [WealthService],
})
export class WealthModule {}
