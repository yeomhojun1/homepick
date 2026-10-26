import { useAuthStore } from '@/store/useAuthStore';
import { useDemoAccount } from './useDemoAccount';

export default function DemoBanner(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const { switchTo, resetData, isSwitching } = useDemoAccount();

  const roleButton = (role: 'customer' | 'worker', label: string): JSX.Element => {
    const active = user?.role === role;
    return (
      <button
        type="button"
        onClick={() => { void switchTo(role); }}
        disabled={isSwitching || active}
        className={`px-2 py-1 rounded border text-xs ${
          active
            ? 'bg-amber-600 text-white border-amber-600'
            : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-100'
        } disabled:cursor-default`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-sm" role="status">
      <div className="max-w-4xl mx-auto px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="flex-1 min-w-[16rem]">
          <strong>데모 모드:</strong> 실제 서버 없이 브라우저 안에서 가짜 데이터로 동작합니다.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-700">체험 계정</span>
          {roleButton('customer', '고객 김민지')}
          {roleButton('worker', '기사 박성수')}
          <button
            type="button"
            onClick={resetData}
            className="px-2 py-1 rounded text-xs text-amber-700 underline hover:text-amber-900"
          >
            데이터 초기화
          </button>
        </div>
      </div>
    </div>
  );
}
