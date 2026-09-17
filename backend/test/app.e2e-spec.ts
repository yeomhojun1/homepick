import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// 이 e2e 스위트는 실제 PostgreSQL 연결(DATABASE_URL)과 Node >= 20.19 가 있어야만 동작한다.
// AppModule 이 TypeOrmModule.forRootAsync(synchronize: true) 로 부팅 시 DB 에 접속하기 때문에
// DB 없이 실행하면 커넥션 타임아웃으로 무한 대기한다. 로컬/CI 에 DB 가 준비되면
// describe.skip -> describe 로 바꿔서 실행한다.
describe.skip('Homepick API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('GET /api/v1/categories 는 공통 응답 봉투로 카테고리 목록을 준다', () => {
    return request(app.getHttpServer())
      .get('/api/v1/categories')
      .expect(200)
      .expect((res) => {
        const body = res.body as { data: unknown; statusCode: number };
        expect(body).toHaveProperty('data');
        expect(body.statusCode).toBe(200);
        expect(Array.isArray(body.data)).toBe(true);
      });
  });

  it('GET /api/v1/service-requests 는 토큰이 없으면 401', () => {
    return request(app.getHttpServer())
      .get('/api/v1/service-requests')
      .expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
