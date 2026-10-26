import { DEMO_CUSTOMER_EMAIL, DEMO_PASSWORD, DEMO_WORKER_EMAIL } from './seed';
import { useDemoAccount } from './useDemoAccount';

export default function DemoLoginButtons(): JSX.Element {
  const { switchTo, isSwitching } = useDemoAccount();

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4 text-sm">
      <p className="font-medium text-amber-900 mb-3">클릭 한 번으로 체험해 보세요</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => { void switchTo('customer'); }}
          disabled={isSwitching}
          className="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          고객으로 시작
        </button>
        <button
          type="button"
          onClick={() => { void switchTo('worker'); }}
          disabled={isSwitching}
          className="bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          기사로 시작
        </button>
      </div>
      <p className="text-xs text-amber-800 mt-3">
        직접 입력: 고객 {DEMO_CUSTOMER_EMAIL} / 기사 {DEMO_WORKER_EMAIL} (비밀번호 {DEMO_PASSWORD})
      </p>
    </div>
  );
}
