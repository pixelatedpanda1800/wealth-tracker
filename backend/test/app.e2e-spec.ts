import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from './../src/common/filters/http-exception.filter';

describe('API smoke tests (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/wealth returns 200 and an array', () => {
    return request(app.getHttpServer())
      .get('/api/wealth')
      .expect(200)
      .expect(res => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('GET /api/wealth/sources returns 200 and an array', () => {
    return request(app.getHttpServer())
      .get('/api/wealth/sources')
      .expect(200)
      .expect(res => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('GET /api/budget/incomes returns 200 and an array', () => {
    return request(app.getHttpServer())
      .get('/api/budget/incomes')
      .expect(200)
      .expect(res => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('POST /api/wealth/sources rejects invalid payload with 400', () => {
    return request(app.getHttpServer())
      .post('/api/wealth/sources')
      .send({ color: '#fff' }) // missing required name field
      .expect(400);
  });
});
