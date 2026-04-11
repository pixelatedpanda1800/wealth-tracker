import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { WealthModule } from './wealth/wealth.module';
import { WealthSnapshot } from './wealth/wealth-snapshot.entity';
import { WealthSource } from './wealth/wealth-source.entity';
import { BudgetModule } from './budget/budget.module';
import { IncomeSource } from './budget/entities/income-source.entity';
import { OutgoingSource } from './budget/entities/outgoing-source.entity';
import { Account } from './budget/entities/account.entity';
import { Allocation } from './budget/entities/allocation.entity';
import { BackupModule } from './backup/backup.module';
import { InvestmentsModule } from './investments/investments.module';
import { InvestmentHolding } from './investments/entities/investment-holding.entity';
import { InvestmentSnapshot } from './investments/entities/investment-snapshot.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
      exclude: ['/api{/*path}'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Check if Postgres config is available (default to localhost for single-container Docker)
        const dbHost = configService.get<string>('DB_HOST', 'localhost');
        if (dbHost && dbHost !== 'sqlite') {
          return {
            type: 'postgres',
            host: dbHost,
            port: configService.get<number>('DB_PORT', 5432),
            username: configService.get<string>('DB_USERNAME', 'postgres'),
            password: configService.get<string>('DB_PASSWORD', 'postgres'),
            database: configService.get<string>(
              'DB_DATABASE',
              'wealth_tracker',
            ),
            entities: [
              WealthSnapshot,
              WealthSource,
              IncomeSource,
              OutgoingSource,
              Account,
              Allocation,
              InvestmentHolding,
              InvestmentSnapshot,
            ],
            synchronize: true,
          };
        }
        // Fallback to SQLite for local dev if no env vars
        return {
          type: 'sqlite',
          database: 'wealth.sqlite',
          entities: [
            WealthSnapshot,
            WealthSource,
            IncomeSource,
            OutgoingSource,
            Account,
            Allocation,
            InvestmentHolding,
            InvestmentSnapshot,
          ],
          synchronize: true,
        };
      },
    }),
    WealthModule,
    BudgetModule,
    InvestmentsModule,
    BackupModule,
  ],
})
export class AppModule { }
