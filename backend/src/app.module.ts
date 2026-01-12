import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { WealthModule } from './wealth/wealth.module';
import { WealthSnapshot } from './wealth/wealth-snapshot.entity';
import { WealthSource } from './wealth/wealth-source.entity';

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
        // Check if Postgres config is available
        const dbHost = configService.get<string>('DB_HOST');
        if (dbHost) {
          return {
            type: 'postgres',
            host: dbHost,
            port: configService.get<number>('DB_PORT', 5432),
            username: configService.get<string>('DB_USERNAME', 'postgres'),
            password: configService.get<string>('DB_PASSWORD', 'postgres'),
            database: configService.get<string>('DB_DATABASE', 'wealth_tracker'),
            entities: [WealthSnapshot, WealthSource],
            synchronize: true, // Safe for personal project
          };
        }
        // Fallback to SQLite for local dev if no env vars
        return {
          type: 'sqlite',
          database: 'wealth.sqlite',
          entities: [WealthSnapshot, WealthSource],
          synchronize: true,
        };
      },
    }),
    WealthModule,
  ],
})
export class AppModule { }
