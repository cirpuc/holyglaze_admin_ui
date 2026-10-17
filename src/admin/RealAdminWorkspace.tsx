import React, { useState } from 'react';

interface RealAdminDesktopLeftProps {
  leftSheetSize: { w: number; h: number };
  zone2Size: { w: number; h: number };
  zone1Ref: (node: HTMLDivElement | null) => void;
  zone2Ref: (node: HTMLDivElement | null) => void;
  zone3Ref: (node: HTMLDivElement | null) => void;
  showXRayRulers: boolean;
  onTriggerSaveBar: () => void;
  activeStepIdx?: number;
  onChangeStepIdx?: (idx: number) => void;
}

interface RealAdminMobileViewProps {
  mobileSafeSize: { w: number; h: number };
  showXRayRulers: boolean;
  customizerState: string;
  onOpenKeyboardDemo: () => void;
  onTriggerSaveBar: () => void;
  activeStepIdx?: number;
  onChangeStepIdx?: (idx: number) => void;
}

export const ADMIN_STEPS = [
  { id: 1, title: '1. Shapes & prices', shortTitle: '1. Shapes', sub: 'Add cookie & price', nextLabel: 'Next: Dough flavours →' },
  { id: 2, title: '2. Dough flavours', shortTitle: '2. Dough', sub: 'Add dough & sizes', nextLabel: 'Next: Print & decor →' },
  { id: 3, title: '3. Print & decor', shortTitle: '3. Print', sub: 'Choose buyer options', nextLabel: 'Next: Batch & calendar →' },
  { id: 4, title: '4. Batch & calendar', shortTitle: '4. Batch', sub: 'Minimum & lead time', nextLabel: 'Publish to Storefront →' },
];

/**
 * Isolated Real Admin Workspace (Left Desktop Sheet)
 * Developing real screens here never overwrites or alters the Guide mode!
 */
export const RealAdminDesktopLeft: React.FC<RealAdminDesktopLeftProps> = ({
  leftSheetSize,
  zone2Size,
  zone1Ref,
  zone2Ref,
  zone3Ref,
  showXRayRulers,
  onTriggerSaveBar,
  activeStepIdx: externalStepIdx,
  onChangeStepIdx,
}) => {
  const [internalStepIdx, setInternalStepIdx] = useState(0);
  const activeStepIdx = externalStepIdx ?? internalStepIdx;
  const setActiveStepIdx = (idx: number) => {
    setInternalStepIdx(idx);
    onChangeStepIdx?.(idx);
  };
  const currentStep = ADMIN_STEPS[activeStepIdx];

  return (
    <div className="flex-1 min-w-0 h-full bg-white rounded-[24px] border border-[#E6E2DA] shadow-2xs flex flex-col overflow-hidden relative text-[#1F1916]">
      {showXRayRulers && (
        <div className="absolute top-2.5 right-3 z-20 px-2 py-0.5 rounded bg-[#1E3A8A] text-[#BFDBFE] font-mono-tabular text-[10px] font-bold">
          🚀 Реальная Админка · Left Sheet: {leftSheetSize.w}×{leftSheetSize.h}px | Zone 2: {zone2Size.w}×{zone2Size.h}px
        </div>
      )}

      {/* ZONE 1: Real Step Header (flex: none) */}
      <div ref={zone1Ref} className="flex-none px-8 pt-6 pb-3 border-b border-[#F2EFE9]">
        <div className="text-[11px] font-extrabold tracking-[0.08em] text-[#5C3D2E] uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5C3D2E]" />
          <span>MENU &amp; PRICES · STEP {currentStep.id} OF 4</span>
        </div>
        <h1 className="font-serif-editorial italic text-[32px] text-[#4A2E1B] leading-tight mt-1">
          {currentStep.id === 1 && 'Add your first cookie'}
          {currentStep.id === 2 && 'Dough flavours & cutter sizes'}
          {currentStep.id === 3 && 'Print, icing & decor options'}
          {currentStep.id === 4 && 'Minimum batch & lead time'}
        </h1>
        <p className="text-[13px] text-[#6E655F] mt-0.5 max-w-xl">
          Рабочий контур для разработки реальных экранов админки (изолирован от Стенда-Гида).
        </p>
      </div>

      {/* ZONE 2: Real Step Elastic Stage (flex: 1 1 0; min-height: 0) */}
      <div
        ref={zone2Ref}
        className="flex-1 min-h-0 px-8 py-4 overflow-hidden flex flex-col justify-center items-center relative"
      >
        <div className="max-w-lg w-full rounded-2xl border-2 border-dashed border-[#D8CBB0] bg-[#FAF7F2] p-6 text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4A2E1B] text-white text-[11px] font-bold">
            <span>🚀 СЛОТ РЕАЛЬНОГО ЭКРАНА (DESKTOP): {currentStep.title}</span>
          </div>
          <div className="font-mono-tabular text-sm font-bold text-[#5C3D2E]">
            Доступная рабочая область (Zone 2): {zone2Size.w} × {zone2Size.h} CSS px
          </div>
          <p className="text-xs text-[#6E655F] leading-relaxed">
            Здесь мы будем пошагово верстать реальные поля для <strong>{currentStep.title}</strong>.
            При этом ваш <strong>📐 Стенд-Гид</strong> остаётся нетронутым в соседней вкладке топбара, а
            все проверки (Штриховка, X-Ray, Sidekick, Клавиатура) работают прямо поверх этого экрана.
          </p>
          <button
            type="button"
            onClick={onTriggerSaveBar}
            className="px-4 py-2 rounded-xl bg-white border border-[#D8CBB0] hover:border-[#4A2E1B] text-xs font-bold text-[#4A2E1B] transition-colors"
          >
            Проверить срабатывание SaveBar при изменении поля
          </button>
        </div>
      </div>

      {/* ZONE 3: Unified Footer Stepper (flex: none) */}
      <div
        ref={zone3Ref}
        className="flex-none px-8 pt-3 pb-5 border-t border-[#EAE6DF] bg-white flex items-center justify-between gap-6"
      >
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-4 gap-3">
            {ADMIN_STEPS.map((st, idx) => {
              const isCurrent = idx === activeStepIdx;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setActiveStepIdx(idx)}
                  className="text-left focus:outline-none group"
                >
                  <div
                    className={`h-[3px] rounded-full transition-colors ${
                      isCurrent ? 'bg-[#1F1916]' : 'bg-[#DFDAD2] group-hover:bg-[#C5BEB3]'
                    }`}
                  />
                  <div
                    className={`mt-2 text-[12px] truncate ${
                      isCurrent ? 'font-bold text-[#1F1916]' : 'font-medium text-[#7A7067]'
                    }`}
                  >
                    {st.title}
                  </div>
                  <div className="text-[11px] text-[#9A9086] truncate">{st.sub}</div>
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-[11.5px] text-[#7A7067]">
            0 of 4 steps ready · Buyers see nothing until you publish
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveStepIdx((activeStepIdx + 1) % ADMIN_STEPS.length)}
          className="px-5 py-3 rounded-xl bg-[#222222] hover:bg-[#333333] text-white text-[13px] font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          {currentStep.nextLabel}
        </button>
      </div>
    </div>
  );
};

/**
 * Isolated Real Admin Workspace (Mobile Screen inside Shopify Mobile WebView)
 * Follows Rules R-08, R-09, R-10, R-11, R-12
 */
export const RealAdminMobileView: React.FC<RealAdminMobileViewProps> = ({
  mobileSafeSize,
  showXRayRulers,
  customizerState,
  onOpenKeyboardDemo,
  onTriggerSaveBar,
  activeStepIdx: externalStepIdx,
  onChangeStepIdx,
}) => {
  const [internalStepIdx, setInternalStepIdx] = useState(0);
  const [mobileTab, setMobileTab] = useState<'settings' | 'preview'>('settings');
  const activeStepIdx = externalStepIdx ?? internalStepIdx;
  const setActiveStepIdx = (idx: number) => {
    setInternalStepIdx(idx);
    onChangeStepIdx?.(idx);
  };
  const currentStep = ADMIN_STEPS[activeStepIdx];

  return (
    <div className="flex-1 min-h-0 w-full bg-[#FAF7F2] text-[#1F1916] flex flex-col overflow-hidden">
      {/* Top Sub-bar: Rule R-11 Mode Switcher (⚙️ Настройки шага ↔ 👁 Превью Cookie Maker) */}
      <div className="flex-none px-3 pt-2 pb-1.5 bg-white border-b border-[#EAE6DF] flex items-center justify-between gap-2">
        <div className="inline-flex rounded-lg bg-[#F4F1EA] p-0.5 border border-[#E2DDD5]">
          <button
            type="button"
            onClick={() => setMobileTab('settings')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
              mobileTab === 'settings'
                ? 'bg-[#4A2E1B] text-white shadow-2xs'
                : 'text-[#6E655F] hover:text-[#1F1916]'
            }`}
          >
            ⚙️ Настройки шага
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
              mobileTab === 'preview'
                ? 'bg-[#4A2E1B] text-white shadow-2xs'
                : 'text-[#6E655F] hover:text-[#1F1916]'
            }`}
          >
            👁 Превью витрины
          </button>
        </div>

        {showXRayRulers && (
          <span className="font-mono-tabular text-[9.5px] font-bold text-[#1E3A8A] bg-[#DBEAFE] px-1.5 py-0.5 rounded">
            {mobileSafeSize.w}×{mobileSafeSize.h}px
          </span>
        )}
      </div>

      {/* Middle Area: either Step Form Slot or Live Customizer Preview */}
      {mobileTab === 'preview' ? (
        <div className="flex-1 min-h-0 w-full relative overflow-hidden">
          <iframe
            src={`/mobile-customizer-ui/index.html#${customizerState}`}
            title="Mobile Storefront Preview"
            className="w-full h-full border-0 block"
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 px-4 py-3 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#5C3D2E]">
              STEP {currentStep.id} OF 4 · {currentStep.title}
            </div>
            <h2 className="font-serif-editorial italic text-xl text-[#4A2E1B] leading-tight mt-0.5">
              {currentStep.id === 1 && 'Add your first cookie'}
              {currentStep.id === 2 && 'Dough flavours & sizes'}
              {currentStep.id === 3 && 'Print & decor options'}
              {currentStep.id === 4 && 'Minimum batch & lead time'}
            </h2>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-[#D8CBB0] bg-white p-3.5 text-center space-y-2 my-auto">
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#4A2E1B] text-white text-[10px] font-bold">
              🚀 МОБИЛЬНЫЙ ЭКРАН: {currentStep.shortTitle}
            </div>
            <p className="text-[11px] text-[#6E655F] leading-snug">
              Слот мобильной вёрстки с отступами 16px по краям (R-12) и авто-подъёмом полей над клавиатурой (R-08).
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={onOpenKeyboardDemo}
                className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#D8CBB0] text-[10.5px] font-bold text-[#4A2E1B]"
              >
                ⌨️ Тест фокуса поля (16px)
              </button>
              <button
                type="button"
                onClick={onTriggerSaveBar}
                className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#D8CBB0] text-[10.5px] font-bold text-[#4A2E1B]"
              >
                💾 Вызвать SaveBar
              </button>
            </div>
          </div>

          {/* Mobile Stepper Footer inside Zone 3 (Rule R-10: Duplicate step navigation inside screen) */}
          <div className="flex-none pt-2 border-t border-[#EAE6DF] space-y-2">
            <div className="grid grid-cols-4 gap-1">
              {ADMIN_STEPS.map((st, idx) => {
                const isCurrent = idx === activeStepIdx;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setActiveStepIdx(idx)}
                    className={`py-1 px-1 rounded text-center text-[10px] font-bold truncate border ${
                      isCurrent
                        ? 'bg-[#1F1916] text-white border-[#1F1916]'
                        : 'bg-white text-[#7A7067] border-[#E2DDD5]'
                    }`}
                  >
                    {st.shortTitle}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setActiveStepIdx((activeStepIdx + 1) % ADMIN_STEPS.length)}
              className="w-full py-2 rounded-xl bg-[#222222] text-white text-xs font-bold"
            >
              {currentStep.nextLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
