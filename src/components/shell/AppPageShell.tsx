import React from 'react';
import {
  ChevronRight,
  Layers,
  Columns,
  Table,
  FileCode,
  SlidersHorizontal,
  Bell,
  CheckCircle2,
  AlertTriangle,
  X,
  RotateCcw,
  Maximize,
} from 'lucide-react';
import {
  useShopifyShell,
  APP_NAV_ITEMS,
  LayoutPreset,
  ViewDataState,
  ViewportWidthMode,
} from '../../context/ShopifyShellContext';

interface AppPageShellProps {
  children: React.ReactNode;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const AppPageShell: React.FC<AppPageShellProps> = ({
  children,
  primaryActionLabel = 'Создать запись',
  onPrimaryAction,
  secondaryActionLabel = 'Тест модального окна',
  onSecondaryAction,
}) => {
  const {
    activeRoute,
    setActiveRoute,
    currentNavItem,
    layoutPreset,
    setLayoutPreset,
    viewDataState,
    setViewDataState,
    viewportWidth,
    setViewportWidth,
    isDirty,
    setIsDirty,
    showToast,
    toasts,
    dismissToast,
    isModalOpen,
    modalConfig,
    openAppModal,
    closeAppModal,
    activeStore,
    inspectorOpen,
    showShopifyChrome,
    setShowShopifyChrome,
  } = useShopifyShell();

  const containerMaxWidthClass =
    viewportWidth === 'full'
      ? 'max-w-[1400px]'
      : viewportWidth === 'narrow'
      ? 'max-w-[780px]'
      : 'max-w-[1120px]';

  return (
    <div className="min-h-full flex flex-col justify-between pb-12">
      <div>
        {/* SHELL DEVELOPER SANDBOX / INSPECTOR TOOLBAR (Collapsible) */}
        {inspectorOpen && (
          <div className="bg-white border-b border-[#E3E3E3] px-6 py-3">
            <div className={`${containerMaxWidthClass} mx-auto flex flex-wrap items-center justify-between gap-4`}>
              <div className="flex items-center gap-2 text-xs text-[#4A4A4A]">
                <span className="font-semibold text-[#1A1A1A]">
                  Конструктор UI Shell:
                </span>
                <span>Макет страницы, состояния данных и события App Bridge</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Layout Preset Selector */}
                <div className="flex items-center bg-[#F1F1F1] p-0.5 rounded-lg border border-[#E3E3E3]">
                  {(
                    [
                      { id: 'two-column', label: '2 Колонки (2:1)', icon: Columns },
                      { id: 'index-table', label: 'Таблица (Index)', icon: Table },
                      { id: 'annotated', label: 'Настройки', icon: SlidersHorizontal },
                      { id: 'clean-slot', label: 'Чистый слот', icon: FileCode },
                    ] as { id: LayoutPreset; label: string; icon: React.ComponentType<{ className?: string }> }[]
                  ).map((preset) => {
                    const Icon = preset.icon;
                    const active = layoutPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setLayoutPreset(preset.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-white text-[#1A1A1A] shadow-2xs'
                            : 'text-[#616161] hover:text-[#1A1A1A]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Data State Switcher (Populated / Loading / Empty) */}
                <div className="flex items-center bg-[#F1F1F1] p-0.5 rounded-lg border border-[#E3E3E3]">
                  {(
                    [
                      { id: 'populated', label: 'Данные' },
                      { id: 'loading', label: 'Скелетон' },
                      { id: 'empty', label: 'Пусто (Empty)' },
                    ] as { id: ViewDataState; label: string }[]
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setViewDataState(st.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        viewDataState === st.id
                          ? 'bg-white text-[#1A1A1A] shadow-2xs'
                          : 'text-[#616161] hover:text-[#1A1A1A]'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Container Width Switcher */}
                <div className="flex items-center bg-[#F1F1F1] p-0.5 rounded-lg border border-[#E3E3E3]">
                  {(
                    [
                      { id: 'narrow', label: 'Узкий' },
                      { id: 'default', label: 'Стандарт' },
                      { id: 'full', label: 'Широкий' },
                    ] as { id: ViewportWidthMode; label: string }[]
                  ).map((vw) => (
                    <button
                      key={vw.id}
                      type="button"
                      onClick={() => setViewportWidth(vw.id)}
                      className={`px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        viewportWidth === vw.id
                          ? 'bg-white text-[#1A1A1A] shadow-2xs'
                          : 'text-[#616161] hover:text-[#1A1A1A]'
                      }`}
                    >
                      {vw.label}
                    </button>
                  ))}
                </div>

                {/* Trigger Unsaved Changes Bar (CSB) */}
                <button
                  type="button"
                  onClick={() => setIsDirty(!isDirty)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                    isDirty
                      ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]'
                      : 'bg-white border-[#D4D4D4] text-[#303030] hover:bg-[#F7F7F7]'
                  }`}
                >
                  {isDirty ? 'CSB Активен (Dirty)' : 'Тест Save Bar'}
                </button>

                {/* Trigger Toast */}
                <button
                  type="button"
                  onClick={() =>
                    showToast('App Bridge Toast: Операция выполнена успешно')
                  }
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-[#D4D4D4] text-[#303030] hover:bg-[#F7F7F7] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Toast</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INNER EMBEDDED APP SUB-NAVIGATION TABS BAR */}
        <div className="bg-white border-b border-[#E3E3E3] px-6">
          <div
            className={`${containerMaxWidthClass} mx-auto flex items-center justify-between gap-4 overflow-x-auto`}
          >
            <div className="flex items-center gap-1 py-2">
              {APP_NAV_ITEMS.map((item) => {
                const active = activeRoute === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveRoute(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#1A1A1A] text-white'
                        : 'text-[#4A4A4A] hover:bg-[#F1F1F1] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badgeCount !== undefined && (
                      <span
                        className={`ml-1.5 font-mono-tabular ${
                          active ? 'text-[#D4D4D4]' : 'text-[#616161]'
                        }`}
                      >
                        · {item.badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs text-[#616161] shrink-0">
              <span className="font-mono-tabular">{currentNavItem.path}</span>
              <span aria-hidden="true">·</span>
              <span>App Bridge v4 Ready</span>
            </div>
          </div>
        </div>

        {/* POLARIS PAGE HEADER (<ui-title-bar> + Page Header Pattern) */}
        <div className={`${containerMaxWidthClass} mx-auto px-6 pt-6 pb-5`}>
          {/* Breadcrumb & Quiet Unboxed Metadata (Zero-Pill Discipline) */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs text-[#616161]">
              <button
                type="button"
                onClick={() => setActiveRoute('overview')}
                className="hover:text-[#1A1A1A] transition-colors"
              >
                Наше Приложение
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-[#8A8A8A]" />
              <span className="text-[#1A1A1A] font-medium">
                {currentNavItem.label}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">{activeStore.domain}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#16A34A] font-medium">
                Связь с GraphQL Admin API активна
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowShopifyChrome(!showShopifyChrome)}
              className="text-xs text-[#616161] hover:text-[#1A1A1A] flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
            >
              <Maximize className="w-3 h-3" />
              <span>
                {showShopifyChrome ? 'Скрыть рамку Shopify' : 'Показать рамку Shopify'}
              </span>
            </button>
          </div>

          {/* Title & Primary / Secondary Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1A1A1A] text-balance">
                {currentNavItem.sectionTitle}
              </h1>
              <p className="text-xs text-[#616161] mt-1">
                {currentNavItem.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (onSecondaryAction) {
                    onSecondaryAction();
                  } else {
                    openAppModal(
                      'Модальное окно Shopify App Bridge (<ui-modal>)',
                      'Этот диалог вызывается через хук useShopifyShell().openAppModal() и готов для подтверждения действий, импорта товаров или настройки вебхуков.'
                    );
                  }
                }}
                className="px-3.5 py-2 text-xs font-semibold text-[#1A1A1A] bg-white border border-[#CFCFCF] hover:bg-[#F7F7F7] rounded-lg shadow-2xs transition-colors whitespace-nowrap shrink-0"
              >
                {secondaryActionLabel}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onPrimaryAction) {
                    onPrimaryAction();
                  } else {
                    setIsDirty(true);
                    showToast('Создан черновик. Панель сохранения (Save Bar) активирована');
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1A1A1A] hover:bg-[#303030] rounded-lg shadow-2xs transition-colors whitespace-nowrap shrink-0"
              >
                {primaryActionLabel}
              </button>
            </div>
          </div>
        </div>

        {/* MAIN PAGE WORKSPACE CONTENT */}
        <div className={`${containerMaxWidthClass} mx-auto px-6`}>
          {children}
        </div>
      </div>

      {/* SHOPIFY POLARIS FOOTER HELP */}
      <footer className={`${containerMaxWidthClass} w-full mx-auto px-6 pt-10`}>
        <div className="border-t border-[#E1E1E1] pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#616161]">
          <div>
            Оболочка приложения для Shopify Admin · Готова к подключению бизнес-логики и маршрутов
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveRoute('clean-canvas')}
              className="hover:text-[#1A1A1A] underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Перейти к чистому слоту монтирования
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => {
                setViewDataState('populated');
                setLayoutPreset('two-column');
                setIsDirty(false);
                showToast('Состояние оболочки сброшено к стандартному');
              }}
              className="hover:text-[#1A1A1A] flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Сбросить демо-состояние</span>
            </button>
          </div>
        </div>
      </footer>

      {/* SHOPIFY APP BRIDGE TOAST STACK (Bottom Center) */}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium text-white ${
                t.isError ? 'bg-[#DC2626]' : 'bg-[#1A1A1A]'
              }`}
            >
              {t.isError ? (
                <AlertTriangle className="w-4 h-4 text-white shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
              )}
              <span>{t.message}</span>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="text-[#A3A3A3] hover:text-white ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* SHOPIFY APP BRIDGE MODAL (<ui-modal>) */}
      {isModalOpen && modalConfig && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={closeAppModal}
        >
          <div
            className="w-full max-w-md bg-white rounded-xl border border-[#E3E3E3] shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[#EBEBEB] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1A1A1A]">
                {modalConfig.title}
              </h3>
              <button
                type="button"
                onClick={closeAppModal}
                className="text-[#616161] hover:text-[#1A1A1A] p-1 rounded-lg hover:bg-[#F1F1F1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-[#4A4A4A] leading-relaxed">
                {modalConfig.description}
              </p>
              <div className="bg-[#F7F7F7] rounded-lg p-3 border border-[#E5E5E5] text-xs font-mono-tabular text-[#303030]">
                const &#123; openAppModal, showToast, setIsDirty &#125; = useShopifyShell();
              </div>
            </div>
            <div className="px-5 py-3 bg-[#F7F7F7] border-t border-[#EBEBEB] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeAppModal}
                className="px-3.5 py-1.5 text-xs font-medium text-[#303030] bg-white border border-[#CFCFCF] rounded-lg hover:bg-[#F1F1F1] transition-colors whitespace-nowrap shrink-0"
              >
                Закрыть
              </button>
              <button
                type="button"
                onClick={() => {
                  closeAppModal();
                  showToast('Действие в модальном окне подтверждено');
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1A1A1A] rounded-lg hover:bg-[#303030] transition-colors whitespace-nowrap shrink-0"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
