import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WealthModule } from './wealth/wealth.module';
import { WealthSnapshot } from './wealth/wealth-snapshot.entity';
import { WealthSource } from './wealth/wealth-source.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'wealth.sqlite',
      entities: [WealthSnapshot, WealthSource],
      synchronize: true,
    }),
    WealthModule,
  ],
})
export class AppModule { }
