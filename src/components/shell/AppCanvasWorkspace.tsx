import React, { useState } from 'react';
import {
  Search,
  Plus,
  Copy,
  Check,
  RefreshCw,
  ArrowUpDown,
  Code2,
  FolderGit2,
  Layers,
  Terminal,
  Sliders,
} from 'lucide-react';
import { useShopifyShell } from '../../context/ShopifyShellContext';

interface ResourceRow {
  id: string;
  title: string;
  handle: string;
  targetScope: string;
  status: 'Активно' | 'Черновик' | 'Пауза';
  updatedAt: string;
  itemsProcessed: number;
}

const INITIAL_ROWS: ResourceRow[] = [
  {
    id: 'RULE-1042',
    title: 'Синхронизация остатков B2B витрины',
    handle: 'b2b-inventory-sync',
    targetScope: 'Коллекция: B2B Wholesale',
    status: 'Активно',
    updatedAt: '10 мин назад',
    itemsProcessed: 1240,
  },
  {
    id: 'RULE-1039',
    title: 'Авто-тегирование VIP заказов свыше €250',
    handle: 'vip-order-tagging',
    targetScope: 'Вебхук: orders/create',
    status: 'Активно',
    updatedAt: '42 мин назад',
    itemsProcessed: 389,
  },
  {
    id: 'RULE-1035',
    title: 'Экспорт метаполей габаритов для логистики',
    handle: 'logistics-metafields-export',
    targetScope: 'Товары · 840 SKU',
    status: 'Пауза',
    updatedAt: 'Вчера, 18:15',
    itemsProcessed: 840,
  },
  {
    id: 'RULE-1028',
    title: 'Проверка региональных цен Shopify Markets',
    handle: 'markets-price-audit',
    targetScope: 'Рынки: EU + UK',
    status: 'Черновик',
    updatedAt: '2 дня назад',
    itemsProcessed: 0,
  },
];

export const AppCanvasWorkspace: React.FC = () => {
  const {
    activeRoute,
    setActiveRoute,
    layoutPreset,
    setLayoutPreset,
    viewDataState,
    setViewDataState,
    isDirty,
    setIsDirty,
    showToast,
    openAppModal,
    activeStore,
  } = useShopifyShell();

  const [rows, setRows] = useState<ResourceRow[]>(INITIAL_ROWS);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Активно' | 'Черновик' | 'Пауза'>('all');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Settings form state to demonstrate Contextual Save Bar
  const [appConfig, setAppConfig] = useState({
    appNameInStore: 'Nordic App Extension',
    webhookVersion: '2026-04 (Stable)',
    autoSyncEnabled: true,
    syncIntervalMinutes: '15',
    fallbackBehavior: 'skip_with_log',
  });

  const handleConfigChange = (key: keyof typeof appConfig, value: string | boolean) => {
    setAppConfig((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const copyMountCode = () => {
    navigator.clipboard?.writeText(
      `// Подключение вашего экрана внутри src/components/shell/AppCanvasWorkspace.tsx\nconst { setIsDirty, showToast, openAppModal, activeStore } = useShopifyShell();`
    );
    setCopiedSnippet(true);
    showToast('Код точки монтирования скопирован в буфер обмена');
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  // 1. SKELETON LOADING STATE (Polaris SkeletonPage / SkeletonBodyText equivalent)
  if (viewDataState === 'loading') {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Загрузка данных">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#E3E3E3] p-5 space-y-4">
            <div className="h-5 w-48 bg-[#E8E8E8] rounded animate-pulse" />
            <div className="space-y-2.5 pt-2">
              <div className="h-9 w-full bg-[#F1F1F1] rounded-lg animate-pulse" />
              <div className="h-9 w-full bg-[#F1F1F1] rounded-lg animate-pulse" />
              <div className="h-9 w-full bg-[#F1F1F1] rounded-lg animate-pulse" />
              <div className="h-9 w-3/4 bg-[#F1F1F1] rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#E3E3E3] p-5 space-y-4">
            <div className="h-5 w-36 bg-[#E8E8E8] rounded animate-pulse" />
            <div className="h-24 w-full bg-[#F1F1F1] rounded-lg animate-pulse" />
            <div className="h-4 w-2/3 bg-[#E8E8E8] rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 2. EMPTY STATE (Polaris EmptyState pattern)
  if (viewDataState === 'empty') {
    return (
      <div className="bg-white rounded-xl border border-[#E3E3E3] p-12 text-center max-w-2xl mx-auto my-4">
        <div className="w-12 h-12 rounded-xl bg-[#F4F4F4] border border-[#E3E3E3] flex items-center justify-center mx-auto mb-4">
          <Layers className="w-6 h-6 text-[#1A1A1A]" />
        </div>
        <h2 className="text-base font-bold text-[#1A1A1A]">
          В этом разделе пока нет созданных объектов
        </h2>
        <p className="text-xs text-[#616161] max-w-md mx-auto mt-1.5 leading-relaxed">
          Это стандартное пустое состояние (Polaris EmptyState) для новых магазинов после установки приложения. Когда пользователь добавит первую запись, здесь появится основной интерфейс.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setViewDataState('populated');
              showToast('Демо-данные загружены в рабочую область');
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#1A1A1A] hover:bg-[#303030] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Создать первую запись
          </button>
          <button
            type="button"
            onClick={() => setActiveRoute('clean-canvas')}
            className="px-3.5 py-2 text-xs font-medium text-[#303030] bg-white border border-[#CFCFCF] hover:bg-[#F7F7F7] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Перейти к чистому слоту
          </button>
        </div>
      </div>
    );
  }

  // 3. BILLING ROUTE VIEW
  if (activeRoute === 'billing') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-[#E3E3E3] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-[#616161]">
              Текущий биллинг магазина <span className="font-mono-tabular text-[#1A1A1A]">{activeStore.domain}</span>
            </div>
            <div className="text-base font-bold text-[#1A1A1A] mt-0.5">
              Тариф «Для растущих команд» · Активен через Shopify AppSubscription API
            </div>
          </div>
          <div className="text-right font-mono-tabular">
            <div className="text-lg font-bold text-[#1A1A1A]">$49.00 / мес</div>
            <div className="text-xs text-[#616161]">Лимит: 25 000 операций в месяц</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              audience: 'Для новых магазинов',
              name: 'Starter Sync',
              price: '$0',
              cadence: 'бесплатно для Development Stores',
              quota: 'До 500 SKU · Вебхуки раз в час',
              current: false,
            },
            {
              audience: 'Для растущих команд',
              name: 'Growth Automation',
              price: '$49',
              cadence: 'в месяц · 14 дней триал',
              quota: 'До 25 000 SKU · Реалтайм вебхуки GraphQL',
              current: true,
            },
            {
              audience: 'Для сетей Shopify Plus',
              name: 'Enterprise Multi-Store',
              price: '$199',
              cadence: 'в месяц · выделенный воркер',
              quota: 'Безлимитно SKU · До 10 витрин Markets',
              current: false,
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className="bg-white rounded-xl border border-[#E3E3E3] p-5 flex flex-col justify-between"
            >
              <div>
                <div className="text-xs text-[#616161] font-medium">{plan.audience}</div>
                <h3 className="text-base font-bold text-[#1A1A1A] mt-1">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1.5 font-mono-tabular">
                  <span className="text-2xl font-bold text-[#1A1A1A]">{plan.price}</span>
                  <span className="text-xs text-[#616161]">{plan.cadence}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-[#EBEBEB] text-xs text-[#303030] space-y-2">
                  <div>Квота: <span className="font-mono-tabular font-medium">{plan.quota}</span></div>
                  <div>Оплата через единый счет Shopify Admin</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  showToast(`Запрос мутации appSubscriptionCreate для тарифа «${plan.name}»`)
                }
                disabled={plan.current}
                className={`mt-6 w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  plan.current
                    ? 'bg-[#F1F1F1] text-[#616161] cursor-default'
                    : 'bg-[#1A1A1A] text-white hover:bg-[#303030]'
                }`}
              >
                {plan.current ? 'Текущий план магазина' : 'Выбрать тариф'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. LAYOUT PRESET: CLEAN SLOT / MOUNT POINT FOR FUTURE APP UI
  if (layoutPreset === 'clean-slot') {
    return (
      <div className="space-y-5">
        {/* Clean Mount Container */}
        <div className="bg-white rounded-xl border border-[#E3E3E3] p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#EBEBEB]">
            <div>
              <div className="text-xs font-mono-tabular text-[#616161]">
                src/components/shell/AppCanvasWorkspace.tsx · &lt;AppWorkspaceSlot /&gt;
              </div>
              <h2 className="text-base font-bold text-[#1A1A1A] mt-1">
                Чистая рабочая область для интерфейса вашего приложения
              </h2>
              <p className="text-xs text-[#616161] mt-0.5">
                Внешний каркас Shopify Admin, навигация App Bridge, Save Bar, модальные окна и уведомления уже подключены.
              </p>
            </div>
            <button
              type="button"
              onClick={copyMountCode}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#1A1A1A] text-white hover:bg-[#303030] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              {copiedSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSnippet ? 'Скопировано' : 'Скопировать хук useShopifyShell()'}</span>
            </button>
          </div>

          {/* Dashed Slot Placeholder where the developer will drop their components */}
          <div className="my-6 rounded-xl border-2 border-dashed border-[#D4D4D4] bg-[#FAFAFA] p-10 text-center">
            <Code2 className="w-8 h-8 text-[#616161] mx-auto mb-3" />
            <div className="text-sm font-bold text-[#1A1A1A]">
              Слот монтирования экранов приложения (&lt;YourAppFeatureView /&gt;)
            </div>
            <p className="text-xs text-[#616161] max-w-lg mx-auto mt-1 leading-relaxed">
              Замените этот блок на ваши собственные формы, графики или таблицы. Все события сохранения, тосты и переходы между вкладками управляются через контекст оболочки.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsDirty(!isDirty)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-[#CFCFCF] text-[#1A1A1A] hover:bg-[#F1F1F1] transition-colors whitespace-nowrap shrink-0"
              >
                Вызвать Contextual Save Bar
              </button>
              <button
                type="button"
                onClick={() => showToast('Тестовое уведомление из рабочей области')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-[#CFCFCF] text-[#1A1A1A] hover:bg-[#F1F1F1] transition-colors whitespace-nowrap shrink-0"
              >
                Вызвать Toast
              </button>
              <button
                type="button"
                onClick={() =>
                  openAppModal(
                    'Пример вызова модального окна из вашего компонента',
                    'Передайте заголовок и контент в openAppModal(), чтобы отобразить нативное модальное окно поверх админки.'
                  )
                }
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-[#CFCFCF] text-[#1A1A1A] hover:bg-[#F1F1F1] transition-colors whitespace-nowrap shrink-0"
              >
                Открыть Modal
              </button>
            </div>
          </div>

          {/* Architecture Reference Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A]">
                <FolderGit2 className="w-4 h-4 text-[#616161]" />
                <span>Навигация App Bridge</span>
              </div>
              <p className="text-xs text-[#616161] mt-1.5 leading-relaxed">
                Маршруты задаются в массиве <code className="font-mono-tabular text-[#1A1A1A]">APP_NAV_ITEMS</code> и автоматически синхронизируются с боковым меню Shopify и вкладками.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A]">
                <Sliders className="w-4 h-4 text-[#616161]" />
                <span>Готовые сетки Polaris</span>
              </div>
              <p className="text-xs text-[#616161] mt-1.5 leading-relaxed">
                Переключайте пресеты <code className="font-mono-tabular text-[#1A1A1A]">two-column</code>, <code className="font-mono-tabular text-[#1A1A1A]">index-table</code> и <code className="font-mono-tabular text-[#1A1A1A]">annotated</code> в панели конструктора сверху.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A]">
                <Terminal className="w-4 h-4 text-[#616161]" />
                <span>Контекст магазина</span>
              </div>
              <p className="text-xs text-[#616161] mt-1.5 leading-relaxed">
                Текущий домен <code className="font-mono-tabular text-[#1A1A1A]">{activeStore.domain}</code> и валюта <code className="font-mono-tabular text-[#1A1A1A]">{activeStore.currency}</code> доступны в любом дочернем компоненте.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. LAYOUT PRESET: ANNOTATED SETTINGS (Shopify Polaris Layout.AnnotatedSection)
  if (layoutPreset === 'annotated') {
    return (
      <div className="space-y-6">
        {/* Annotated Section 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-1 pr-2">
            <h2 className="text-sm font-bold text-[#1A1A1A]">
              Идентификация и подключение к магазину
            </h2>
            <p className="text-xs text-[#616161] mt-1 leading-relaxed">
              Базовые параметры отображения приложения внутри админки мерчанта и версия GraphQL Admin API. Любое изменение автоматически вызывает верхний Contextual Save Bar.
            </p>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl border border-[#E3E3E3] p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                Отображаемое имя модуля в админке
              </label>
              <input
                type="text"
                value={appConfig.appNameInStore}
                onChange={(e) => handleConfigChange('appNameInStore', e.target.value)}
                className="w-full px-3 py-2 text-xs text-[#1A1A1A] bg-white border border-[#CFCFCF] rounded-lg focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Версия Shopify Admin API
                </label>
                <select
                  value={appConfig.webhookVersion}
                  onChange={(e) => handleConfigChange('webhookVersion', e.target.value)}
                  className="w-full px-3 py-2 text-xs text-[#1A1A1A] bg-white border border-[#CFCFCF] rounded-lg focus:outline-none focus:border-[#1A1A1A]"
                >
                  <option value="2026-04 (Stable)">2026-04 (Stable)</option>
                  <option value="2026-01 (Supported)">2026-01 (Supported)</option>
                  <option value="Release Candidate">Release Candidate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Интервал фоновой синхронизации (мин)
                </label>
                <input
                  type="number"
                  value={appConfig.syncIntervalMinutes}
                  onChange={(e) => handleConfigChange('syncIntervalMinutes', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono-tabular text-[#1A1A1A] bg-white border border-[#CFCFCF] rounded-lg focus:outline-none focus:border-[#1A1A1A]"
                />
              </div>
            </div>
          </div>
        </div>

        <hr className="border-[#E1E1E1]" />

        {/* Annotated Section 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-1 pr-2">
            <h2 className="text-sm font-bold text-[#1A1A1A]">
              Обработка вебхуков и отказоустойчивость
            </h2>
            <p className="text-xs text-[#616161] mt-1 leading-relaxed">
              Настройте поведение очередей при получении событий <code className="font-mono-tabular">products/update</code> и <code className="font-mono-tabular">orders/create</code>.
            </p>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl border border-[#E3E3E3] p-5 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={appConfig.autoSyncEnabled}
                onChange={(e) => handleConfigChange('autoSyncEnabled', e.target.checked)}
                className="mt-0.5 rounded border-[#CFCFCF] text-[#1A1A1A] focus:ring-0"
              />
              <div>
                <div className="text-xs font-semibold text-[#1A1A1A]">
                  Автоматически подписываться на вебхуки каталога при установке
                </div>
                <div className="text-xs text-[#616161] mt-0.5">
                  Регистрирует топики в Shopify App Bridge без участия мерчанта
                </div>
              </div>
            </label>

            <div className="pt-2 border-t border-[#EBEBEB]">
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                Политика при превышении лимита GraphQL Cost
              </label>
              <select
                value={appConfig.fallbackBehavior}
                onChange={(e) => handleConfigChange('fallbackBehavior', e.target.value)}
                className="w-full px-3 py-2 text-xs text-[#1A1A1A] bg-white border border-[#CFCFCF] rounded-lg focus:outline-none focus:border-[#1A1A1A]"
              >
                <option value="skip_with_log">Отложить в очередь с экспоненциальным повтором</option>
                <option value="bulk_mutation">Переключить на BulkOperationsRunQuery</option>
                <option value="notify_admin">Отправить уведомление администратору магазина</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. LAYOUT PRESET: FULL-WIDTH INDEX TABLE (Polaris IndexTable pattern)
  if (layoutPreset === 'index-table') {
    const filteredRows = rows.filter((r) => {
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesQuery =
        r.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.handle.toLowerCase().includes(searchFilter.toLowerCase());
      return matchesStatus && matchesQuery;
    });

    return (
      <div className="bg-white rounded-xl border border-[#E3E3E3] overflow-hidden">
        {/* Table Filter & Search Bar */}
        <div className="p-3.5 border-b border-[#EBEBEB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Interactive Segmented Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#F1F1F1] p-1 rounded-lg">
            {(['all', 'Активно', 'Пауза', 'Черновик'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === tab
                    ? 'bg-white text-[#1A1A1A] shadow-2xs'
                    : 'text-[#616161] hover:text-[#1A1A1A]'
                }`}
              >
                {tab === 'all' ? 'Все записи' : tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8A8A8A] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Фильтр по ID или названию..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#CFCFCF] rounded-lg text-[#1A1A1A] placeholder-[#8A8A8A] focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const newId = `RULE-${Math.floor(1050 + Math.random() * 900)}`;
                setRows((prev) => [
                  {
                    id: newId,
                    title: 'Новое правило синхронизации каталога',
                    handle: `custom-rule-${newId.toLowerCase()}`,
                    targetScope: 'Все коллекции магазина',
                    status: 'Черновик',
                    updatedAt: 'Только что',
                    itemsProcessed: 0,
                  },
                  ...prev,
                ]);
                setIsDirty(true);
                showToast(`Добавлена строка ${newId}`);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1A1A1A] text-white hover:bg-[#303030] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить строку</span>
            </button>
          </div>
        </div>

        {/* High-Density Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EBEBEB] bg-[#F9F9F9] text-[11px] font-semibold text-[#616161]">
                <th className="py-2.5 px-4">ID</th>
                <th className="py-2.5 px-4">Название объекта</th>
                <th className="py-2.5 px-4">Область действия</th>
                <th className="py-2.5 px-4">Статус</th>
                <th className="py-2.5 px-4 text-right">
                  <span className="inline-flex items-center gap-1">
                    <span>Обработано SKU</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="py-2.5 px-4 text-right">Обновлено</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB] text-xs">
              {filteredRows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() =>
                    openAppModal(
                      `${row.title} (${row.id})`,
                      `Карточка редактирования записи ${row.handle}. Область действия: ${row.targetScope}. Статус: ${row.status}.`
                    )
                  }
                  className="hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-mono-tabular font-medium text-[#1A1A1A] whitespace-nowrap">
                    {row.id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#1A1A1A]">{row.title}</div>
                    <div className="text-[11px] text-[#616161] font-mono-tabular">
                      {row.handle}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#4A4A4A] whitespace-nowrap">
                    {row.targetScope}
                  </td>
                  {/* Unboxed clean status text (Zero-Pill Compliance) */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`font-medium ${
                        row.status === 'Активно'
                          ? 'text-[#16A34A]'
                          : row.status === 'Пауза'
                          ? 'text-[#D97706]'
                          : 'text-[#616161]'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono-tabular text-[#1A1A1A] whitespace-nowrap">
                    {row.itemsProcessed.toLocaleString('ru-RU')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-tabular text-[#616161] whitespace-nowrap">
                    {row.updatedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 7. DEFAULT LAYOUT PRESET: TWO-COLUMN POLARIS WORKSPACE (Primary 2/3 + Secondary 1/3)
  return (
    <div className="space-y-5">
      {/* Top KPI Summary Bar (Flat surface with hairline dividers, tabular numerals) */}
      <div className="bg-white rounded-xl border border-[#E3E3E3] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#EBEBEB]">
        <div className="p-4">
          <div className="text-xs text-[#616161]">Статус интеграции магазина</div>
          <div className="text-base font-bold text-[#1A1A1A] mt-1 font-mono-tabular">
            Активна · 99.98% Uptime
          </div>
          <div className="text-[11px] text-[#616161] mt-0.5">
            Магазин: {activeStore.name} ({activeStore.currency})
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-[#616161]">Синхронизировано объектов за 24ч</div>
          <div className="text-base font-bold text-[#1A1A1A] mt-1 font-mono-tabular">
            2 469 записей
          </div>
          <div className="text-[11px] text-[#16A34A] mt-0.5">
            Очередь вебхуков пуста · Задержка 180 мс
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-[#616161]">Использование квоты API</div>
          <div className="text-base font-bold text-[#1A1A1A] mt-1 font-mono-tabular">
            14.2% (3 550 / 25 000)
          </div>
          <div className="text-[11px] text-[#616161] mt-0.5">
            Следующий сброс квоты через 19 дней
          </div>
        </div>
      </div>

      {/* Polaris 2:1 Asymmetric Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Primary Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Main Workspace Card */}
          <div className="bg-white rounded-xl border border-[#E3E3E3] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#EBEBEB] flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-[#1A1A1A]">
                  Основная рабочая секция (Layout.Section Primary)
                </h2>
                <p className="text-xs text-[#616161] mt-0.5">
                  Сюда встраиваются основные таблицы, конструкторы правил или формы вашего приложения
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLayoutPreset('clean-slot')}
                className="px-3 py-1.5 text-xs font-medium text-[#1A1A1A] bg-[#F1F1F1] hover:bg-[#E5E5E5] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Открыть чистый слот
              </button>
            </div>

            <div className="divide-y divide-[#EBEBEB]">
              {rows.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-[#FAFAFA] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#1A1A1A] truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-[#616161] font-mono-tabular mt-0.5">
                      {item.id} · {item.targetScope} · Обновлено: {item.updatedAt}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-medium ${
                        item.status === 'Активно' ? 'text-[#16A34A]' : 'text-[#D97706]'
                      }`}
                    >
                      {item.status}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        openAppModal(
                          `Настройка модуля ${item.id}`,
                          `Вы открыли конфигурацию объекта «${item.title}». Здесь будет располагаться форма редактирования вашего приложения.`
                        )
                      }
                      className="px-2.5 py-1 text-xs font-medium text-[#303030] bg-white border border-[#D4D4D4] hover:bg-[#F4F4F4] rounded-md transition-colors whitespace-nowrap shrink-0"
                    >
                      Настроить
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#EBEBEB] flex items-center justify-between text-xs">
              <span className="text-[#616161]">
                Показано 3 из {rows.length} активных модулей
              </span>
              <button
                type="button"
                onClick={() => setActiveRoute('catalog-rules')}
                className="font-semibold text-[#1A1A1A] hover:underline whitespace-nowrap shrink-0"
              >
                Перейти к полному реестру →
              </button>
            </div>
          </div>

          {/* Onboarding / Setup Guide Checklist (Standard Shopify App Pattern) */}
          <div className="bg-white rounded-xl border border-[#E3E3E3] p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#EBEBEB]">
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A]">
                  Готовность каркаса приложения к разработке UI
                </h3>
                <p className="text-xs text-[#616161] mt-0.5">
                  Все системные слои Shopify Admin Shell настроены и изолированы от бизнес-логики
                </p>
              </div>
              <span className="text-xs font-mono-tabular font-semibold text-[#1A1A1A]">
                4 / 4 готово
              </span>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-[#1A1A1A] font-medium">
                  1. Внешний хост Shopify Admin (Топбар, поиск ⌘K, переключатель магазинов, сайдбар)
                </span>
                <span className="text-[#16A34A] font-mono-tabular">Подключено</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[#1A1A1A] font-medium">
                  2. App Bridge &lt;ui-nav-menu&gt; и синхронизация вкладок админки приложения
                </span>
                <span className="text-[#16A34A] font-mono-tabular">Подключено</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[#1A1A1A] font-medium">
                  3. Contextual Save Bar (несохраненные изменения), Toast и Modal менеджеры
                </span>
                <span className="text-[#16A34A] font-mono-tabular">Подключено</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[#1A1A1A] font-medium">
                  4. Скелетоны загрузки, EmptyState и 4 пресета сеток Polaris
                </span>
                <span className="text-[#16A34A] font-mono-tabular">Подключено</span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Column (1/3 width — Layout.Section Variant="oneThird") */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-[#E3E3E3] p-5 space-y-3">
            <h2 className="text-sm font-bold text-[#1A1A1A]">
              Боковая колонка (Secondary 1/3)
            </h2>
            <p className="text-xs text-[#616161] leading-relaxed">
              В стандарте Shopify Polaris правая колонка используется для статуса публикации, сводки магазина, быстрых действий и виджетов диагностики.
            </p>
            <div className="pt-2 border-t border-[#EBEBEB] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#616161]">Магазин:</span>
                <span className="font-mono-tabular font-medium text-[#1A1A1A]">
                  {activeStore.domain}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#616161]">План Shopify:</span>
                <span className="font-medium text-[#1A1A1A]">{activeStore.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#616161]">Валюта витрины:</span>
                <span className="font-mono-tabular font-medium text-[#1A1A1A]">
                  {activeStore.currency}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                showToast('Кэш метаполей магазина успешно обновлен');
              }}
              className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-medium text-[#1A1A1A] bg-[#F1F1F1] hover:bg-[#E5E5E5] flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Синхронизировать метаполя</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-[#E3E3E3] p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#1A1A1A]">
              Быстрое переключение макета
            </h3>
            <p className="text-xs text-[#616161] leading-relaxed">
              Протестируйте, как будущая админка вашего приложения адаптируется под разные типы страниц Shopify:
            </p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setLayoutPreset('index-table')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium bg-[#F7F7F7] hover:bg-[#EBEBEB] text-[#1A1A1A] transition-colors"
              >
                → Полноширинная таблица (IndexTable)
              </button>
              <button
                type="button"
                onClick={() => setLayoutPreset('annotated')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium bg-[#F7F7F7] hover:bg-[#EBEBEB] text-[#1A1A1A] transition-colors"
              >
                → Аннотированные настройки (Settings)
              </button>
              <button
                type="button"
                onClick={() => setLayoutPreset('clean-slot')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium bg-[#F7F7F7] hover:bg-[#EBEBEB] text-[#1A1A1A] transition-colors"
              >
                → Чистый холст (Mount Point)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
