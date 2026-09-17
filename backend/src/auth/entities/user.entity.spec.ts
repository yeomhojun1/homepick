import 'reflect-metadata';
import { instanceToPlain } from 'class-transformer';
import { User, UserRole } from './user.entity';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity';

function createUser(): User {
  const user = new User();
  user.id = 1;
  user.email = 'customer@example.com';
  user.passwordHash = '$2b$10$hashed';
  user.name = '홍길동';
  user.phone = null;
  user.role = UserRole.CUSTOMER;
  user.fcmToken = null;
  return user;
}

describe('User 직렬화 (passwordHash 노출 차단)', () => {
  it('단독 직렬화 시 passwordHash 가 빠진다', () => {
    const plain = instanceToPlain(createUser());
    expect(plain).not.toHaveProperty('passwordHash');
    expect(plain).toMatchObject({ id: 1, email: 'customer@example.com' });
  });

  it('auth 응답처럼 감싸진 객체 안에서도 passwordHash 가 빠진다', () => {
    const plain = instanceToPlain({ accessToken: 'jwt', user: createUser() });
    expect(JSON.stringify(plain)).not.toContain('passwordHash');
  });

  it('관계로 딸려오는 User 목록에서도 passwordHash 가 빠진다', () => {
    const request = new ServiceRequest();
    request.id = 10;
    request.title = '싱크대 누수';
    request.customer = createUser();

    const plain = instanceToPlain([request]);
    expect(JSON.stringify(plain)).not.toContain('passwordHash');
  });
});
