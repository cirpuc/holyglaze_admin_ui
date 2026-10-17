import React, { createContext, useContext, useState, useCallback } from 'react';

export type AppRouteId =
  | 'overview'
  | 'catalog-rules'
  | 'sync-logs'
  | 'billing'
  | 'settings'
  | 'clean-canvas';

export type LayoutPreset =
  | 'two-column'
  | 'annotated'
  | 'index-table'
  | 'clean-slot';

export type ViewDataState = 'populated' | 'loading' | 'empty';

export type ViewportWidthMode = 'full' | 'default' | 'narrow';

export interface AppNavItem {
  id: AppRouteId;
  label: string;
  path: string;
  sectionTitle: string;
  subtitle: string;
  badgeCount?: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  isError?: boolean;
}

export interface StoreEnvironment {
  id: string;
  name: string;
  domain: string;
  plan: string;
  currency: string;
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    id: 'overview',
    label: 'Обзор приложения',
    path: '/app/overview',
    sectionTitle: 'Панель управления приложением',
    subtitle: 'Двухколоночный макет Polaris (Primary 2/3 + Secondary 1/3) для главного экрана админки',
  },
  {
    id: 'catalog-rules',
    label: 'Реестр объектов',
    path: '/app/catalog-rules',
    sectionTitle: 'Реестр и таблица данных (IndexTable)',
    subtitle: 'Полноширинный табличный каркас с фильтрацией, поиском и пакетными действиями',
    badgeCount: 14,
  },
  {
    id: 'sync-logs',
    label: 'Журнал событий',
    path: '/app/sync-logs',
    sectionTitle: 'Журнал вебхуков и очередей Shopify',
    subtitle: 'Мониторинг входящих событий GraphQL Admin API и фоновых задач синхронизации',
  },
  {
    id: 'billing',
    label: 'Тарифы и лимиты',
    path: '/app/billing',
    sectionTitle: 'Управление подпиской (Shopify Billing API)',
    subtitle: 'Сетка тарифных планов AppSubscription и квоты использования приложения',
  },
  {
    id: 'settings',
    label: 'Настройки',
    path: '/app/settings',
    sectionTitle: 'Конфигурация приложения (Annotated Layout)',
    subtitle: 'Аннотированные секции настроек в стандарте Shopify Polaris с поддержкой Contextual Save Bar',
  },
  {
    id: 'clean-canvas',
    label: 'Чистый слот (Mount Point)',
    path: '/app/clean-canvas',
    sectionTitle: 'Контейнер для вашего будущего UI',
    subtitle: 'Готовая точка монтирования <AppWorkspaceSlot /> с проброшенными хуками App Bridge и Shell API',
  },
];

export const STORE_ENVIRONMENTS: StoreEnvironment[] = [
  {
    id: 'prod-1',
    name: 'Nordic Atelier Flagship',
    domain: 'nordic-atelier.myshopify.com',
    plan: 'Shopify Plus',
    currency: 'EUR',
  },
  {
    id: 'stage-1',
    name: 'Nordic Dev Store (Staging)',
    domain: 'nordic-staging-dev.myshopify.com',
    plan: 'Development Store',
    currency: 'USD',
  },
  {
    id: 'prod-2',
    name: 'Baltic Home Goods',
    domain: 'baltic-home.myshopify.com',
    plan: 'Advanced',
    currency: 'EUR',
  },
];

interface ShopifyShellContextValue {
  activeRoute: AppRouteId;
  setActiveRoute: (route: AppRouteId) => void;
  currentNavItem: AppNavItem;
  layoutPreset: LayoutPreset;
  setLayoutPreset: (preset: LayoutPreset) => void;
  viewDataState: ViewDataState;
  setViewDataState: (state: ViewDataState) => void;
  viewportWidth: ViewportWidthMode;
  setViewportWidth: (mode: ViewportWidthMode) => void;
  showShopifyChrome: boolean;
  setShowShopifyChrome: (show: boolean) => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  isSaving: boolean;
  triggerSave: () => void;
  discardChanges: () => void;
  toasts: ToastMessage[];
  showToast: (message: string, isError?: boolean) => void;
  dismissToast: (id: string) => void;
  isModalOpen: boolean;
  modalConfig: { title: string; description: string } | null;
  openAppModal: (title: string, description: string) => void;
  closeAppModal: () => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  activeStore: StoreEnvironment;
  setActiveStore: (store: StoreEnvironment) => void;
  inspectorOpen: boolean;
  setInspectorOpen: (open: boolean) => void;
}

const ShopifyShellContext = createContext<ShopifyShellContextValue | null>(null);

export const ShopifyShellProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRoute, setActiveRouteState] = useState<AppRouteId>('overview');
  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>('two-column');
  const [viewDataState, setViewDataState] = useState<ViewDataState>('populated');
  const [viewportWidth, setViewportWidth] = useState<ViewportWidthMode>('default');
  const [showShopifyChrome, setShowShopifyChrome] = useState<boolean>(true);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalConfig, setModalConfig] = useState<{ title: string; description: string } | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [activeStore, setActiveStore] = useState<StoreEnvironment>(STORE_ENVIRONMENTS[0]);
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(true);

  const showToast = useCallback((message: string, isError = false) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, isError }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setActiveRoute = useCallback((route: AppRouteId) => {
    setActiveRouteState(route);
    if (route === 'overview') setLayoutPreset('two-column');
    if (route === 'catalog-rules' || route === 'sync-logs') setLayoutPreset('index-table');
    if (route === 'settings') setLayoutPreset('annotated');
    if (route === 'clean-canvas') setLayoutPreset('clean-slot');
  }, []);

  const triggerSave = useCallback(() => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsDirty(false);
      showToast('Изменения сохранены в Shopify Admin');
    }, 450);
  }, [showToast]);

  const discardChanges = useCallback(() => {
    setIsDirty(false);
    showToast('Несохраненные изменения отменены');
  }, [showToast]);

  const openAppModal = useCallback((title: string, description: string) => {
    setModalConfig({ title, description });
    setIsModalOpen(true);
  }, []);

  const closeAppModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const currentNavItem =
    APP_NAV_ITEMS.find((item) => item.id === activeRoute) || APP_NAV_ITEMS[0];

  return (
    <ShopifyShellContext.Provider
      value={{
        activeRoute,
        setActiveRoute,
        currentNavItem,
        layoutPreset,
        setLayoutPreset,
        viewDataState,
        setViewDataState,
        viewportWidth,
        setViewportWidth,
        showShopifyChrome,
        setShowShopifyChrome,
        isDirty,
        setIsDirty,
        isSaving,
        triggerSave,
        discardChanges,
        toasts,
        showToast,
        dismissToast,
        isModalOpen,
        modalConfig,
        openAppModal,
        closeAppModal,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        activeStore,
        setActiveStore,
        inspectorOpen,
        setInspectorOpen,
      }}
    >
      {children}
    </ShopifyShellContext.Provider>
  );
};

export const useShopifyShell = () => {
  const ctx = useContext(ShopifyShellContext);
  if (!ctx) {
    throw new Error('useShopifyShell must be used inside ShopifyShellProvider');
  }
  return ctx;
};
