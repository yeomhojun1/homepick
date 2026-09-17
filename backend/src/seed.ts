import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from './app.module';
import { Category } from './categories/entities/category.entity';

/**
 * 카테고리 기본 시드. 빈 DB에서는 카테고리가 없으면 의뢰 등록 자체가 불가능하므로
 * 최초 1회 실행이 필요하다. 이름 기준으로 이미 있으면 건너뛰므로 여러 번 실행해도 안전하다.
 */
const SEED_CATEGORIES: Array<{ name: string; sortOrder: number }> = [
  { name: '수도/배관', sortOrder: 1 },
  { name: '전기/조명', sortOrder: 2 },
  { name: '도배/벽지', sortOrder: 3 },
  { name: '에어컨', sortOrder: 4 },
  { name: '보일러/난방', sortOrder: 5 },
  { name: '욕실/타일', sortOrder: 6 },
  { name: '문/창호/방충망', sortOrder: 7 },
  { name: '가구/조립', sortOrder: 8 },
];

async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const repository = app.get<Repository<Category>>(
      getRepositoryToken(Category),
    );

    let created = 0;
    let skipped = 0;
    for (const item of SEED_CATEGORIES) {
      const existing = await repository.findOne({
        where: { name: item.name },
      });
      if (existing) {
        skipped += 1;
        continue;
      }
      await repository.save(
        repository.create({
          name: item.name,
          sortOrder: item.sortOrder,
          isActive: true,
        }),
      );
      created += 1;
    }

    console.log(
      `[seed] 카테고리 완료 — 생성 ${created}건, 기존 유지 ${skipped}건`,
    );
  } finally {
    await app.close();
  }
}

seed().catch((error) => {
  console.error('[seed] 실패:', error);
  process.exit(1);
});
