import { isDemo } from '@/config/env';
import { demoTokenFor, loadDb } from './mockAdapter';
import { DEMO_CUSTOMER_EMAIL } from './seed';

/**
 * 데모 빌드에서만 동작한다. 인증 스토어가 localStorage 를 읽기 전에 실행되어야 하므로
 * main.tsx 에서 App 보다 먼저 import 한다.
 * 처음 방문하면 데모 고객 계정으로 자동 로그인한 상태로 시작한다.
 */
if (isDemo) {
  try {
    const db = loadDb();
    if (!localStorage.getItem('accessToken')) {
      const customer = db.users.find((u) => u.email === DEMO_CUSTOMER_EMAIL);
      if (customer) localStorage.setItem('accessToken', demoTokenFor(customer.id));
    }
  } catch {
    // localStorage 를 쓸 수 없으면 로그인 화면의 원클릭 버튼으로 진행한다.
  }
}
