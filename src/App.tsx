/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ArchitectureRule,
  INITIAL_ARCHITECTURE_RULES,
} from './guide/architectureRules';
import { RulesChecklistDrawer } from './guide/RulesChecklistDrawer';
import { RealAdminDesktopLeft, RealAdminMobileView } from './admin/RealAdminWorkspace';

type ViewMode = 'side-by-side' | 'desktop-focus' | 'mobile-focus';
type WorkspaceContour = 'guide-blueprint' | 'real-admin';

interface DesktopPreset {
  id: string;
  shortLabel: string;
  width: number;
  height: number;
}

interface MobilePreset {
  id: string;
  shortLabel: string;
  os: 'ios' | 'android';
  hasDynamicIsland: boolean;
  width: number;
  height: number;
  statusBarHeight: number;
  shopifyNavHeight: number;
  appBridgeAutoInset: number;
}

interface CustomizerInternalMetrics {
  viewportW: number;
  viewportH: number;
  scrollH: number;
  navH: number;
  heroH: number;
  canvasH: number;
  dockH: number;
  ctaH: number;
  ctaBottom: number;
  isClipped: boolean;
  isCanvasCramped: boolean;
}

const DESKTOP_PRESETS: DesktopPreset[] = [
  { id: '1280x720', shortLabel: '1280×720 (13" HD)', width: 1280, height: 720 },
  { id: '1320x820', shortLabel: '1320×820 (Base Ref)', width: 1320, height: 820 },
  { id: '1440x900', shortLabel: '1440×900 (MacBook)', width: 1440, height: 900 },
  { id: '1920x1080', shortLabel: '1920×1080 (Full HD)', width: 1920, height: 1080 },
];

const MOBILE_PRESETS: MobilePreset[] = [
  {
    id: 'iphone-se',
    shortLabel: 'iPhone SE (375×667)',
    os: 'ios',
    hasDynamicIsland: false,
    width: 375,
    height: 667,
    statusBarHeight: 20,
    shopifyNavHeight: 44,
    appBridgeAutoInset: 80,
  },
  {
    id: 'android-s24',
    shortLabel: 'Android (360×780)',
    os: 'android',
    hasDynamicIsland: false,
    width: 360,
    height: 780,
    statusBarHeight: 24,
    shopifyNavHeight: 56,
    appBridgeAutoInset: 72,
  },
  {
    id: 'iphone-16',
    shortLabel: 'iPhone 16 (393×852)',
    os: 'ios',
    hasDynamicIsland: true,
    width: 393,
    height: 852,
    statusBarHeight: 54,
    shopifyNavHeight: 44,
    appBridgeAutoInset: 96,
  },
  {
    id: 'iphone-16-max',
    shortLabel: '16 Pro Max (430×932)',
    os: 'ios',
    hasDynamicIsland: true,
    width: 430,
    height: 932,
    statusBarHeight: 54,
    shopifyNavHeight: 44,
    appBridgeAutoInset: 96,
  },
];

const CUSTOMIZER_VIEWS = [
  { id: 'shape', label: 'Shape (Default)' },
  { id: 'decor', label: 'Decor' },
  { id: 'text', label: 'Text' },
  { id: 'text-font', label: 'Text · Font' },
  { id: 'text-style', label: 'Text · Style' },
  { id: 'text-size', label: 'Text · Size' },
  { id: 'text-color', label: 'Text · Colour' },
  { id: 'text-finish', label: 'Text · Bend' },
  { id: 'draw', label: 'Draw' },
  { id: 'draw-size', label: 'Draw · Thickness' },
  { id: 'draw-style', label: 'Draw · Style' },
  { id: 'icons', label: 'Icons' },
  { id: 'icons-all', label: 'Icons · All' },
  { id: 'icons-love', label: 'Icons · Love' },
  { id: 'image', label: 'Image' },
  { id: 'layers', label: 'Layers' },
  { id: 'flavour', label: 'Flavour Picker' },
  { id: 'size', label: 'Size Picker' },
  { id: 'cart', label: 'Empty Cart' },
] as const;

const APP_NAV_LINKS = [
  'Menu & customizer',
  'Order rules & calendar',
  'Print & decor',
  'Dough flavours',
  'Settings',
] as const;

const STORAGE_KEY_CUSTOM_RULES = 'shopify_safe_zones_guide_rules_v1';

/**
 * Live DOM ResizeObserver hook — measures real offsetWidth & offsetHeight of any container
 */
function useLiveDomSize<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    if (!node) return;
    const measure = () => {
      setSize({
        w: Math.round(node.offsetWidth || node.clientWidth),
        h: Math.round(node.offsetHeight || node.clientHeight),
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [node]);

  return [setNode, size] as const;
}

/**
 * Measures real internal DOM elements inside same-origin /mobile-customizer-ui/index.html iframe
 */
function measureCustomizerIframe(
  iframe: HTMLIFrameElement | null
): CustomizerInternalMetrics | null {
  if (!iframe || !iframe.contentDocument || !iframe.contentWindow) return null;
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  const root = doc.querySelector('.mcm-root') as HTMLElement | null;
  if (!root) return null;

  const nav = doc.querySelector('.mcm-nav') as HTMLElement | null;
  const hero = doc.querySelector('.mcm-hero') as HTMLElement | null;
  const canvasWrap = doc.querySelector('.mcm-canvas-wrap') as HTMLElement | null;
  const dock = doc.querySelector('.mcm-dock') as HTMLElement | null;
  const ctaWrap = doc.querySelector('.mcm-cta-wrap') as HTMLElement | null;
  const ctaBtn = doc.querySelector('.mcm-cta, .mcm-cart-checkout') as HTMLElement | null;

  const viewportW = win.innerWidth || iframe.clientWidth;
  const viewportH = win.innerHeight || iframe.clientHeight;
  const scrollH = doc.documentElement.scrollHeight;

  const navH = nav ? Math.round(nav.getBoundingClientRect().height) : 0;
  const heroH = hero ? Math.round(hero.getBoundingClientRect().height) : 0;
  const canvasH = canvasWrap ? Math.round(canvasWrap.getBoundingClientRect().height) : 0;
  const dockH = dock ? Math.round(dock.getBoundingClientRect().height) : 0;
  const ctaH = ctaWrap ? Math.round(ctaWrap.getBoundingClientRect().height) : 0;
  const ctaBottom = ctaBtn ? Math.round(ctaBtn.getBoundingClientRect().bottom) : 0;

  const isClipped = scrollH > viewportH + 2 || (ctaBottom > 0 && ctaBottom > viewportH + 1);
  const isCanvasCramped = canvasH > 0 && canvasH < 155;

  return {
    viewportW,
    viewportH,
    scrollH,
    navH,
    heroH,
    canvasH,
    dockH,
    ctaH,
    ctaBottom,
    isClipped,
    isCanvasCramped,
  };
}

export default function App() {
  // 0. Global Contour Switcher: Protected Guide vs Real Admin Screens
  const [contour, setContour] = useState<WorkspaceContour>('guide-blueprint');
  const [isRulesDrawerOpen, setIsRulesDrawerOpen] = useState<boolean>(false);
  const [activeRuleDemoId, setActiveRuleDemoId] = useState<string | null>(null);
  const [rules, setRules] = useState<ArchitectureRule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_RULES);
      if (saved) {
        const parsed = JSON.parse(saved) as ArchitectureRule[];
        if (Array.isArray(parsed) && parsed.length >= INITIAL_ARCHITECTURE_RULES.length) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_ARCHITECTURE_RULES;
  });

  // Demo input value for Rule R-08 & R-09 (Mobile Input Focus Mode above 260px Keyboard)
  const [demoCookiePrice, setDemoCookiePrice] = useState<string>('£11.49');
  const [demoCookieLabel, setDemoCookieLabel] = useState<string>('Robin Bird');

  // 1. Viewport & Preset Controls
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [desktopPresetId, setDesktopPresetId] = useState<string>('1320x820');
  const [mobilePresetId, setMobilePresetId] = useState<string>('iphone-se');

  // 2. Shopify Host Simulation Toggles
  const [simSidebarOpen, setSimSidebarOpen] = useState<boolean>(true);
  const [simSaveBar, setSimSaveBar] = useState<boolean>(false);
  const [simBanner, setSimBanner] = useState<boolean>(false);
  const [simSidekick, setSimSidekick] = useState<boolean>(false);
  const [simToast, setSimToast] = useState<boolean>(false);
  const [simMobileMoreSheet, setSimMobileMoreSheet] = useState<boolean>(false);
  const [simMobileKeyboard, setSimMobileKeyboard] = useState<boolean>(false);
  const [mobileInsetMode, setMobileInsetMode] = useState<
    'app-bridge-auto' | 'none-overlap' | 'double-reserved-bug'
  >('app-bridge-auto');

  // 3. Capacity Check Simulator for Left Zone 2
  const [leftZone2SimHeight, setLeftZone2SimHeight] = useState<number>(0);

  // 4. Visual Audit Overlay Toggles
  const [showForbiddenHatch, setShowForbiddenHatch] = useState<boolean>(true);
  const [showInjectableSlots, setShowInjectableSlots] = useState<boolean>(true);
  const [showXRayRulers, setShowXRayRulers] = useState<boolean>(true);

  // 5. Active App Nav & Customizer State Jump
  const [activeNavLink, setActiveNavLink] = useState<string>('Menu & customizer');
  const [customizerState, setCustomizerState] = useState<string>('shape');
  const [realAdminStepIdx, setRealAdminStepIdx] = useState<number>(0);

  // Apply a Rule's Simulation Preset in 1 click!
  const handleRunRulePreset = (rule: ArchitectureRule) => {
    const p = rule.preset;
    if (p.viewMode) setViewMode(p.viewMode);
    if (p.desktopPresetId) setDesktopPresetId(p.desktopPresetId);
    if (p.mobilePresetId) setMobilePresetId(p.mobilePresetId);
    if (p.simSidebarOpen !== undefined) setSimSidebarOpen(p.simSidebarOpen);
    if (p.simSaveBar !== undefined) setSimSaveBar(p.simSaveBar);
    if (p.simBanner !== undefined) setSimBanner(p.simBanner);
    if (p.simSidekick !== undefined) setSimSidekick(p.simSidekick);
    if (p.simToast !== undefined) setSimToast(p.simToast);
    if (p.simMobileMoreSheet !== undefined) setSimMobileMoreSheet(p.simMobileMoreSheet);
    if (p.simMobileKeyboard !== undefined) setSimMobileKeyboard(p.simMobileKeyboard);
    if (p.mobileInsetMode !== undefined) setMobileInsetMode(p.mobileInsetMode);
    if (p.leftZone2SimHeight !== undefined) setLeftZone2SimHeight(p.leftZone2SimHeight);
    if (p.showForbiddenHatch !== undefined) setShowForbiddenHatch(p.showForbiddenHatch);
    if (p.showInjectableSlots !== undefined) setShowInjectableSlots(p.showInjectableSlots);
    if (p.showXRayRulers !== undefined) setShowXRayRulers(p.showXRayRulers);
    setActiveRuleDemoId(rule.code);
  };

  const handleAddCustomRule = (newRule: ArchitectureRule) => {
    const updated = [...rules, newRule];
    setRules(updated);
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_RULES, JSON.stringify(updated));
    } catch {
      // ignore storage errors
    }
  };

  // 6. Live DOM ResizeObserver Sensors across Desktop & Mobile Zones
  const [desktopIframeRef, desktopIframeSize] = useLiveDomSize<HTMLDivElement>();
  const [leftSheetRef, leftSheetSize] = useLiveDomSize<HTMLDivElement>();
  const [zone1Ref, zone1Size] = useLiveDomSize<HTMLDivElement>();
  const [zone2Ref, zone2Size] = useLiveDomSize<HTMLDivElement>();
  const [zone3Ref, zone3Size] = useLiveDomSize<HTMLDivElement>();
  const [rightCustomizerRef, rightCustomizerSize] = useLiveDomSize<HTMLDivElement>();
  const [mobileSafeRef, mobileSafeSize] = useLiveDomSize<HTMLDivElement>();

  const desktopCustIframeRef = useRef<HTMLIFrameElement | null>(null);
  const mobileCustIframeRef = useRef<HTMLIFrameElement | null>(null);
  const [desktopCustMetrics, setDesktopCustMetrics] = useState<CustomizerInternalMetrics | null>(
    null
  );
  const [mobileCustMetrics, setMobileCustMetrics] = useState<CustomizerInternalMetrics | null>(
    null
  );

  const refreshIframeMetrics = useCallback(() => {
    const dm = measureCustomizerIframe(desktopCustIframeRef.current);
    if (dm) setDesktopCustMetrics(dm);
    const mm = measureCustomizerIframe(mobileCustIframeRef.current);
    if (mm) setMobileCustMetrics(mm);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(refreshIframeMetrics, 350);
    refreshIframeMetrics();
    return () => window.clearInterval(timer);
  }, [
    refreshIframeMetrics,
    desktopPresetId,
    mobilePresetId,
    viewMode,
    simBanner,
    simSidekick,
    simSidebarOpen,
    simMobileKeyboard,
    mobileInsetMode,
    customizerState,
    contour,
  ]);

  // 7. Outer Workbench Auto-Scaler (Zero-Scroll)
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const [stageBounds, setStageBounds] = useState<{ width: number; height: number }>({
    width: 1280,
    height: 760,
  });

  useEffect(() => {
    const el = stageContainerRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      setStageBounds({ width: rect.width, height: rect.height });
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    window.addEventListener('resize', updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const desktopPreset = useMemo(
    () => DESKTOP_PRESETS.find((d) => d.id === desktopPresetId) || DESKTOP_PRESETS[1],
    [desktopPresetId]
  );

  const mobilePreset = useMemo(
    () => MOBILE_PRESETS.find((m) => m.id === mobilePresetId) || MOBILE_PRESETS[0],
    [mobilePresetId]
  );

  const scaleConfig = useMemo(() => {
    const padX = 28;
    const padY = 20;
    const availW = Math.max(320, stageBounds.width - padX);
    const availH = Math.max(260, stageBounds.height - padY);

    if (viewMode === 'desktop-focus') {
      const s = Math.min(availW / desktopPreset.width, availH / desktopPreset.height, 1);
      return {
        scale: Number(s.toFixed(3)),
        totalW: desktopPreset.width,
        totalH: desktopPreset.height,
      };
    }

    if (viewMode === 'mobile-focus') {
      const bezelW = mobilePreset.width + 24;
      const bezelH = mobilePreset.height + 24;
      const s = Math.min(availW / bezelW, availH / bezelH, 1.05);
      return { scale: Number(s.toFixed(3)), totalW: bezelW, totalH: bezelH };
    }

    const gap = 36;
    const mobileBezelW = mobilePreset.width + 24;
    const mobileBezelH = mobilePreset.height + 24;
    const combinedW = desktopPreset.width + gap + mobileBezelW;
    const combinedH = Math.max(desktopPreset.height, mobileBezelH);
    const s = Math.min(availW / combinedW, availH / combinedH, 1);
    return { scale: Number(s.toFixed(3)), totalW: combinedW, totalH: combinedH };
  }, [stageBounds, viewMode, desktopPreset, mobilePreset]);

  const effectiveMobilePaddingBottom = simMobileKeyboard
    ? 260
    : mobileInsetMode === 'app-bridge-auto'
    ? mobilePreset.appBridgeAutoInset
    : mobileInsetMode === 'double-reserved-bug'
    ? mobilePreset.appBridgeAutoInset + 80
    : 0;

  const leftZone2Deficit = zone2Size.h - leftZone2SimHeight;
  const leftZone2Overflows = leftZone2SimHeight > 0 && leftZone2Deficit < 0;
  const activeRuleObj = rules.find((r) => r.code === activeRuleDemoId) || null;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#090B10] text-[#E5E7EB] select-none relative">
      {/* =====================================================================
          ROW 1: BENCH CONTROL BAR (Contour Switcher + Rules Guide + Simulations)
      ===================================================================== */}
      <header className="flex-none bg-[#111520] border-b border-[#22283A] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 z-30">
        {/* Left: Protected Guide vs Real Admin Contour + Rules Drawer Trigger + View Modes */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* 1. CONTOUR SWITCHER (Protected Guide vs Real Admin Screens) */}
          <div className="flex items-center bg-[#090B10] p-0.5 rounded-lg border-2 border-[#3B82F6]/60">
            <button
              type="button"
              onClick={() => setContour('guide-blueprint')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 ${
                contour === 'guide-blueprint'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
              title="Эталонный Стенд-Гид с пустыми слотами зон (защищён от перезаписи)"
            >
              📐 Стенд-Гид (Эталон зон)
            </button>
            <button
              type="button"
              onClick={() => setContour('real-admin')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 ${
                contour === 'real-admin'
                  ? 'bg-[#10B981] text-[#052E16] shadow-xs'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
              title="Рабочие экраны реальной админки внутри тех же симуляторов"
            >
              🚀 Реальная Админка
            </button>
          </div>

          {/* 2. INTERACTIVE RULES CHECKLIST BUTTON */}
          <button
            type="button"
            onClick={() => setIsRulesDrawerOpen(!isRulesDrawerOpen)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              isRulesDrawerOpen
                ? 'bg-[#2563EB] border-[#60A5FA] text-white'
                : 'bg-[#172136] border-[#3B82F6] text-[#93C5FD] hover:bg-[#1E2B45]'
            }`}
          >
            <span>📚 База правил ({rules.length})</span>
          </button>

          {/* 3. VIEW MODES */}
          <div className="flex items-center bg-[#090B10] p-0.5 rounded-lg border border-[#262B3D]">
            {(
              [
                { id: 'desktop-focus', label: '🖥 Desktop' },
                { id: 'mobile-focus', label: '📱 Mobile' },
                { id: 'side-by-side', label: '🖥 + 📱 Оба' },
              ] as { id: ViewMode; label: string }[]
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setViewMode(mode.id)}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  viewMode === mode.id
                    ? 'bg-[#1E293B] text-white border border-[#475569]'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Desktop Matrix */}
          <div className="flex items-center bg-[#090B10] p-0.5 rounded-lg border border-[#262B3D]">
            {DESKTOP_PRESETS.map((dp) => (
              <button
                key={dp.id}
                type="button"
                onClick={() => setDesktopPresetId(dp.id)}
                className={`px-1.5 py-1 rounded-md text-[10.5px] font-mono-tabular transition-colors whitespace-nowrap shrink-0 ${
                  desktopPresetId === dp.id
                    ? 'bg-[#1E293B] text-white font-bold border border-[#475569]'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                {dp.id}
              </button>
            ))}
          </div>

          {/* Mobile Matrix */}
          <div className="flex items-center bg-[#090B10] p-0.5 rounded-lg border border-[#262B3D]">
            {MOBILE_PRESETS.map((mp) => (
              <button
                key={mp.id}
                type="button"
                onClick={() => setMobilePresetId(mp.id)}
                className={`px-1.5 py-1 rounded-md text-[10.5px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                  mobilePresetId === mp.id
                    ? 'bg-[#1E293B] text-white font-bold border border-[#475569]'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                {mp.shortLabel.split(' ')[0]} {mp.width}×{mp.height}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Shopify Host Simulations & Zone Overlays */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center bg-[#090B10] p-0.5 rounded-lg border border-[#262B3D] gap-0.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSimSidebarOpen(!simSidebarOpen)}
              className={`px-2 py-1 rounded text-[10.5px] font-semibold transition-colors ${
                simSidebarOpen
                  ? 'bg-[#1E293B] text-white border border-[#475569]'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              Sidebar
            </button>
            <button
              type="button"
              onClick={() => setSimSaveBar(!simSaveBar)}
              className={`px-2 py-1 rounded text-[10.5px] font-semibold transition-colors ${
                simSaveBar
                  ? 'bg-[#06B6D4]/25 text-[#67E8F9] border border-[#06B6D4]'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              SaveBar
            </button>
            <button
              type="button"
              onClick={() => setSimBanner(!simBanner)}
              className={`px-2 py-1 rounded text-[10.5px] font-semibold transition-colors ${
                simBanner
                  ? 'bg-[#EF4444]/25 text-[#FCA5A5] border border-[#EF4444]'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              Banner
            </button>
            <button
              type="button"
              onClick={() => setSimSidekick(!simSidekick)}
              className={`px-2 py-1 rounded text-[10.5px] font-semibold transition-colors ${
                simSidekick
                  ? 'bg-[#EF4444]/30 text-[#FECACA] border border-[#EF4444]'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              ✦ Sidekick
            </button>
            <button
              type="button"
              onClick={() => setSimToast(!simToast)}
              className={`px-2 py-1 rounded text-[10.5px] font-semibold transition-colors ${
                simToast
                  ? 'bg-[#06B6D4]/25 text-[#67E8F9] border border-[#06B6D4]'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              Toast
            </button>
            <button
              type="button"
              onClick={() => setSimMobileMoreSheet(!simMobileMoreSheet)}
              className={`px-2 py-1 rounded text-[10.5px] font-semibold transition-colors ${
                simMobileMoreSheet
                  ? 'bg-[#06B6D4]/25 text-[#67E8F9] border border-[#06B6D4]'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              📱 Меню ⋯
            </button>
            <button
              type="button"
              onClick={() => setSimMobileKeyboard(!simMobileKeyboard)}
              className={`px-2 py-1 rounded text-[10.5px] font-semibold transition-colors ${
                simMobileKeyboard
                  ? 'bg-[#EF4444]/30 text-[#FECACA] border border-[#EF4444]'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              ⌨️ Клавиатура
            </button>
          </div>

          {/* Mobile Inset Mode */}
          <div className="flex items-center bg-[#090B10] p-0.5 rounded-lg border border-[#262B3D] gap-0.5">
            <button
              type="button"
              onClick={() => setMobileInsetMode('app-bridge-auto')}
              className={`px-1.5 py-1 rounded text-[10px] font-semibold transition-colors ${
                mobileInsetMode === 'app-bridge-auto'
                  ? 'bg-[#065F46] text-[#A7F3D0] border border-[#10B981]'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              ✅ Auto-Inset
            </button>
            <button
              type="button"
              onClick={() => setMobileInsetMode('none-overlap')}
              className={`px-1.5 py-1 rounded text-[10px] font-semibold transition-colors ${
                mobileInsetMode === 'none-overlap'
                  ? 'bg-[#DC2626] text-white'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              ⛔ 0px
            </button>
            <button
              type="button"
              onClick={() => setMobileInsetMode('double-reserved-bug')}
              className={`px-1.5 py-1 rounded text-[10px] font-semibold transition-colors ${
                mobileInsetMode === 'double-reserved-bug'
                  ? 'bg-[#D97706] text-[#111827] font-bold'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              ⚠️ +80px баг
            </button>
          </div>

          {/* Zone Audit Overlays */}
          <div className="flex items-center bg-[#090B10] p-0.5 rounded-lg border border-[#262B3D] gap-0.5">
            <button
              type="button"
              onClick={() => setShowForbiddenHatch(!showForbiddenHatch)}
              className={`px-2 py-1 rounded text-[10.5px] font-semibold transition-colors ${
                showForbiddenHatch
                  ? 'bg-[#7F1D1D] text-[#FECACA] border border-[#EF4444]'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              ⛔ Штриховка
            </button>
            <button
              type="button"
              onClick={() => setShowInjectableSlots(!showInjectableSlots)}
              className={`px-2 py-1 rounded text-[10.5px] font-semibold transition-colors ${
                showInjectableSlots
                  ? 'bg-[#083344] text-[#67E8F9] border border-[#06B6D4]'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              ✨ Слоты
            </button>
            <button
              type="button"
              onClick={() => setShowXRayRulers(!showXRayRulers)}
              className={`px-2 py-1 rounded text-[10.5px] font-semibold transition-colors ${
                showXRayRulers
                  ? 'bg-[#064E3B] text-[#6EE7B7] border border-[#10B981]'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              📐 X-Ray
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          ROW 2: ACTIVE RULE BANNER OR LIVE DOM TELEMETRY
      ===================================================================== */}
      <div className="flex-none bg-[#0D1017] border-b border-[#1E2436] px-3 py-1 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-tabular">
        <div className="flex items-center gap-2 flex-wrap">
          {activeRuleObj && (
            <div className="flex items-center gap-2 px-2.5 py-0.5 rounded bg-[#1E3A8A] border border-[#3B82F6] text-white font-sans">
              <span className="font-mono-tabular font-extrabold text-[#93C5FD]">
                {activeRuleObj.code}:
              </span>
              <span className="font-semibold text-xs">{activeRuleObj.title}</span>
              <button
                type="button"
                onClick={() => setActiveRuleDemoId(null)}
                className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 hover:bg-black/50 text-[#BFDBFE]"
              >
                Сбросить демо ✕
              </button>
            </div>
          )}

          <span className="px-2 py-0.5 rounded bg-[#1E293B] text-[#E2E8F0]">
            Zone 2: <strong>{zone2Size.w}×{zone2Size.h}px</strong>
          </span>

          {desktopCustMetrics && (
            <span
              className={`px-2 py-0.5 rounded border ${
                desktopCustMetrics.isClipped
                  ? 'bg-[#7F1D1D] border-[#EF4444] text-[#FECACA] font-bold'
                  : 'bg-[#064E3B]/70 border-[#10B981]/60 text-[#A7F3D0]'
              }`}
            >
              🖥 Кастомизатор: <strong>{desktopCustMetrics.viewportW}×{desktopCustMetrics.viewportH}px</strong>{' '}
              (Canvas: <strong>{desktopCustMetrics.canvasH}px</strong>)
            </span>
          )}

          {mobileCustMetrics && (
            <span
              className={`px-2 py-0.5 rounded border ${
                mobileInsetMode === 'none-overlap' || simMobileKeyboard || simSidekick
                  ? 'bg-[#7F1D1D] border-[#EF4444] text-[#FECACA] font-bold'
                  : mobileCustMetrics.isCanvasCramped
                  ? 'bg-[#78350F] border-[#F59E0B] text-[#FDE68A] font-bold'
                  : 'bg-[#064E3B]/70 border-[#10B981]/60 text-[#A7F3D0]'
              }`}
            >
              📱 Мобилка: <strong>{mobileCustMetrics.viewportW}×{mobileCustMetrics.viewportH}px</strong>{' '}
              | Canvas: <strong>{mobileCustMetrics.canvasH}px</strong>
            </span>
          )}
        </div>

        {/* Right: Quick Capacity Check & Customizer State */}
        <div className="flex items-center gap-2 flex-wrap">
          {contour === 'guide-blueprint' && (
            <div className="flex items-center gap-1 bg-[#111520] px-2 py-0.5 rounded border border-[#262B3D]">
              <span className="text-[#9CA3AF] text-[10px]">Тест высоты Zone 2:</span>
              {[
                { h: 0, label: 'Пусто (0px)' },
                { h: 320, label: '320px' },
                { h: 533, label: '533px (Кейс R-03!)' },
              ].map((item) => (
                <button
                  key={item.h}
                  type="button"
                  onClick={() => setLeftZone2SimHeight(item.h)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                    leftZone2SimHeight === item.h
                      ? item.h === 533
                        ? 'bg-[#F59E0B] text-[#111827] font-bold'
                        : 'bg-[#2563EB] text-white'
                      : 'text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1">
            <span className="text-[#9CA3AF] text-[10.5px]">Экран кастомизатора:</span>
            <select
              value={customizerState}
              onChange={(e) => setCustomizerState(e.target.value)}
              className="bg-[#111520] text-[#E5E7EB] border border-[#2E364F] rounded px-2 py-0.5 text-[11px] font-sans focus:outline-none focus:border-[#3B82F6]"
            >
              {CUSTOMIZER_VIEWS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* =====================================================================
          INTERACTIVE RULES CHECKLIST DRAWER (Slide-over right panel)
      ===================================================================== */}
      <RulesChecklistDrawer
        isOpen={isRulesDrawerOpen}
        onClose={() => setIsRulesDrawerOpen(false)}
        rules={rules}
        activeRuleDemoId={activeRuleDemoId}
        onRunRulePreset={handleRunRulePreset}
        onAddCustomRule={handleAddCustomRule}
      />

      {/* =====================================================================
          MAIN AUTO-SCALING VIEWPORT STAGE (Zero-Scroll)
      ===================================================================== */}
      <div
        ref={stageContainerRef}
        className="flex-1 min-h-0 w-full overflow-hidden flex items-center justify-center relative bg-[#090B10]"
      >
        <div
          style={{
            width: `${scaleConfig.totalW}px`,
            height: `${scaleConfig.totalH}px`,
            transform: `scale(${scaleConfig.scale})`,
            transformOrigin: 'center center',
          }}
          className="flex items-center justify-center gap-[36px] shrink-0"
        >
          {/* =================================================================
              1. DESKTOP SHOPIFY ADMIN SHELL (Oct 2026)
          ================================================================= */}
          {(viewMode === 'side-by-side' || viewMode === 'desktop-focus') && (
            <div
              style={{
                width: `${desktopPreset.width}px`,
                height: `${desktopPreset.height}px`,
              }}
              className="bg-[#1A1A1A] rounded-2xl shadow-2xl border border-[#2E2E2E] overflow-hidden flex flex-col shrink-0 relative"
            >
              {/* A. TOP GLOBAL SHOPIFY ADMIN BAR (56px) */}
              <div
                className={`h-[56px] w-full flex-none bg-[#1A1A1A] border-b border-[#2B2B2B] px-4 flex items-center justify-between relative z-20 ${
                  showForbiddenHatch ? 'forbidden-hatch-dark' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-[#95BF47] flex items-center justify-center text-[#141414] font-black text-xs">
                      S
                    </div>
                    <span className="text-white font-bold text-[13px] tracking-tight">
                      Shopify Admin
                    </span>
                  </div>
                  {showForbiddenHatch && (
                    <span className="px-2 py-0.5 rounded bg-[#7F1D1D] border border-[#EF4444] text-[#FECACA] font-mono-tabular text-[10px] font-bold">
                      ⛔ ЧУЖАЯ ЗОНА SHOPIFY (56px Top Bar)
                    </span>
                  )}
                </div>

                {/* Center: Global Search OR ✨ SLOT #4 <ui-save-bar> */}
                {simSaveBar ? (
                  <div
                    className={`h-9 px-4 rounded-xl bg-[#262626] border border-[#06B6D4] flex items-center gap-4 ${
                      showInjectableSlots ? 'injectable-slot' : ''
                    }`}
                  >
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                      <span>Unsaved changes</span>
                    </span>
                    {showInjectableSlots && (
                      <span className="px-1.5 py-0.5 rounded bg-[#083344] text-[#67E8F9] font-mono-tabular text-[9.5px] font-bold">
                        ✨ СЛОТ #4: &lt;ui-save-bar&gt; (Только обработчики Save / Discard)
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSimSaveBar(false)}
                        className="px-2.5 py-1 rounded-lg bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white text-[11px] font-semibold"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSimSaveBar(false);
                          setSimToast(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#06B6D4] text-[#042F2E] text-[11px] font-extrabold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-[340px] h-8 rounded-lg bg-[#2A2A2A] border border-[#3D3D3D] px-3 flex items-center justify-between text-xs text-[#A3A3A3]">
                    <span>Search across store...</span>
                    <span className="font-mono-tabular text-[10px] px-1.5 py-0.5 rounded bg-[#1F1F1F] text-[#8E8E8E]">
                      ⌘K
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2.5 text-xs text-[#D4D4D4]">
                  <button
                    type="button"
                    onClick={() => setSimSidekick(!simSidekick)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${
                      simSidekick
                        ? 'bg-[#EF4444]/30 border-[#EF4444] text-white'
                        : 'bg-[#262626] border-[#3A3A3A] text-[#D4D4D4] hover:text-white'
                    }`}
                  >
                    <span>✦ Sidekick AI</span>
                  </button>
                  <div className="px-2.5 py-1 rounded-lg bg-[#262626] border border-[#3A3A3A] text-[11px] font-medium">
                    HolyGlaze Bakery
                  </div>
                </div>
              </div>

              {/* B. OPTIONAL GLOBAL SHOPIFY ADMIN BANNER (-40px) */}
              {simBanner && (
                <div
                  className={`h-[40px] w-full flex-none bg-[#451A03] border-b border-[#F59E0B] px-4 flex items-center justify-between text-xs text-[#FDE68A] z-20 ${
                    showForbiddenHatch ? 'forbidden-hatch-dark' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#FBBF24]">
                      ⛔ ПЕРЕКРЫТИЕ НА ДЕСКТОПЕ (Global Shopify Banner · -40px):
                    </span>
                    <span>
                      Системный баннер Shopify сжимает доступную высоту 100dvh вашего iframe на 40px!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSimBanner(false)}
                    className="px-2 py-0.5 rounded bg-[#78350F] text-white text-[10.5px] font-semibold"
                  >
                    Скрыть ✕
                  </button>
                </div>
              )}

              {/* C. MAIN HOST BODY */}
              <div className="flex-1 min-h-0 w-full flex overflow-hidden relative">
                {/* 1. LEFT SHOPIFY ADMIN SIDEBAR (240px) */}
                {simSidebarOpen && (
                  <aside
                    className={`w-[240px] flex-none h-full bg-[#EBEBEB] border-r border-[#D4D4D8] p-2.5 flex flex-col justify-between text-[#303030] relative z-10 ${
                      showForbiddenHatch ? 'forbidden-hatch-light' : ''
                    }`}
                  >
                    <div className="space-y-3">
                      {showForbiddenHatch && (
                        <div className="px-2 py-1 rounded bg-[#7F1D1D] text-[#FECACA] font-mono-tabular text-[9.5px] font-bold flex items-center justify-between">
                          <span>⛔ МЕНЮ SHOPIFY (240px)</span>
                          <span>ЧУЖАЯ ЗОНА</span>
                        </div>
                      )}

                      <div className="space-y-0.5 text-[12.5px] font-medium text-[#4A4A4A]">
                        {[
                          'Home',
                          'Orders',
                          'Products',
                          'Customers',
                          'Content',
                          'Analytics',
                          'Marketing',
                          'Discounts',
                        ].map((item) => (
                          <div
                            key={item}
                            className="px-2.5 py-1 rounded-lg flex items-center justify-between opacity-75"
                          >
                            <span>{item}</span>
                            {showForbiddenHatch && (
                              <span className="text-[9px] font-mono-tabular text-[#DC2626] font-bold">
                                ⛔
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* ✨ SLOT #1: <ui-nav-menu> */}
                      <div
                        className={`rounded-xl p-2 transition-all ${
                          showInjectableSlots
                            ? 'bg-[#ECFEFF] border-2 border-[#06B6D4] injectable-slot'
                            : 'bg-white/70 border border-[#D4D4D8]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10.5px] font-bold text-[#52525B] uppercase tracking-wider">
                            Apps › Cookie Maker
                          </span>
                          {showInjectableSlots && (
                            <span className="px-1.5 py-0.5 rounded bg-[#083344] text-[#67E8F9] font-mono-tabular text-[9px] font-bold">
                              ✨ СЛОТ #1: &lt;ui-nav-menu&gt;
                            </span>
                          )}
                        </div>

                        <nav className="space-y-0.5">
                          {APP_NAV_LINKS.map((label) => {
                            const active = activeNavLink === label;
                            return (
                              <button
                                key={label}
                                type="button"
                                onClick={() => setActiveNavLink(label)}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] transition-colors truncate flex items-center justify-between ${
                                  active
                                    ? 'bg-[#18181B] text-white font-semibold'
                                    : 'text-[#27272A] hover:bg-black/5 font-medium'
                                }`}
                              >
                                <span className="truncate">{label}</span>
                                {active && (
                                  <span className="text-[9px] font-mono-tabular text-[#67E8F9] ml-1">
                                    &lt;a&gt;
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </nav>
                      </div>
                    </div>

                    <div className="px-2.5 py-1.5 rounded-lg bg-black/5 flex items-center justify-between text-[12px] font-medium text-[#52525B]">
                      <span>⚙ Settings</span>
                      <span className="font-mono-tabular text-[10px]">
                        {desktopPreset.width}×{desktopPreset.height}
                      </span>
                    </div>
                  </aside>
                )}

                {/* ===========================================================
                    2. APP IFRAME SAFE ZONE (#app-iframe-viewport)
                =========================================================== */}
                <div
                  ref={desktopIframeRef}
                  className="flex-1 min-w-0 h-full bg-[#F1F2F4] flex flex-col overflow-hidden relative"
                >
                  {/* TOP 52px NATIVE APP BRIDGE <ui-title-bar> HEADER */}
                  <header className="h-[52px] w-full flex-none bg-white border-b border-[#E2E4E8] px-5 flex items-center justify-between gap-4 z-10">
                    {/* ✨ SLOT #2: <ui-title-bar title="..."> */}
                    <div
                      className={`flex items-center gap-2.5 px-2.5 py-1 rounded-xl ${
                        showInjectableSlots
                          ? 'bg-[#ECFEFF] border border-[#06B6D4] injectable-slot'
                          : ''
                      }`}
                    >
                      <span className="w-6 h-6 rounded-md bg-[#F3ECE1] text-[#5C3D2E] flex items-center justify-center text-[10px] font-extrabold">
                        CM
                      </span>
                      <span className="text-[14px] font-bold text-[#18181B]">
                        {activeNavLink}
                      </span>
                      {showInjectableSlots && (
                        <span className="px-1.5 py-0.5 rounded bg-[#083344] text-[#67E8F9] font-mono-tabular text-[9.5px] font-bold">
                          ✨ СЛОТ #2: &lt;ui-title-bar title=&quot;...&quot;&gt; (Только текст)
                        </span>
                      )}
                    </div>

                    {showXRayRulers && (
                      <div className="px-2.5 py-1 rounded-lg bg-[#ECFDF5] border border-[#10B981] text-[#065F46] font-mono-tabular text-[11px] font-bold">
                        ✅ App Iframe Area (100dvh): {desktopIframeSize.w} × {desktopIframeSize.h} CSS px
                      </div>
                    )}

                    {/* ✨ SLOT #3: Primary & Secondary Action Buttons */}
                    <div
                      className={`flex items-center gap-2 px-2.5 py-1 rounded-xl ${
                        showInjectableSlots
                          ? 'bg-[#ECFEFF] border border-[#06B6D4] injectable-slot'
                          : ''
                      }`}
                    >
                      {showInjectableSlots && (
                        <span className="px-1.5 py-0.5 rounded bg-[#083344] text-[#67E8F9] font-mono-tabular text-[9.5px] font-bold">
                          ✨ СЛОТ #3: Кнопки &lt;ui-title-bar&gt;
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setSimSaveBar(true)}
                        className="px-2.5 py-1 rounded-lg border border-[#D4D4D8] bg-white hover:bg-[#F4F4F5] text-[#18181B] text-xs font-semibold"
                      >
                        Secondary
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimToast(true)}
                        className="px-3 py-1 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-semibold"
                      >
                        Primary Action
                      </button>
                    </div>
                  </header>

                  {/* SPLIT-SCREEN WORKSPACE */}
                  <div className="flex-1 min-h-0 w-full p-[16px] flex gap-[16px] items-stretch overflow-hidden">
                    {/* =======================================================
                        LEFT COLUMN (1fr): EITHER PROTECTED GUIDE OR REAL ADMIN
                    ======================================================= */}
                    {contour === 'real-admin' ? (
                      <div ref={leftSheetRef} className="flex-1 min-w-0 h-full flex">
                        <RealAdminDesktopLeft
                          leftSheetSize={leftSheetSize}
                          zone2Size={zone2Size}
                          zone1Ref={zone1Ref}
                          zone2Ref={zone2Ref}
                          zone3Ref={zone3Ref}
                          showXRayRulers={showXRayRulers}
                          onTriggerSaveBar={() => setSimSaveBar(true)}
                          activeStepIdx={realAdminStepIdx}
                          onChangeStepIdx={setRealAdminStepIdx}
                        />
                      </div>
                    ) : (
                      /* PROTECTED GUIDE BLUEPRINT VIEW (Never overwritten by real admin screens!) */
                      <div
                        ref={leftSheetRef}
                        className="flex-1 min-w-0 h-full bg-white rounded-[24px] border border-[#E2E4E8] shadow-2xs flex flex-col overflow-hidden relative"
                      >
                        {showXRayRulers && (
                          <div className="absolute top-2.5 right-3 z-20 px-2 py-0.5 rounded bg-[#064E3B] text-[#A7F3D0] font-mono-tabular text-[10px] font-bold">
                            Left White Sheet (1fr): {leftSheetSize.w} × {leftSheetSize.h} CSS px (r=24px)
                          </div>
                        )}

                        {/* ZONE 1: Header Zone (flex: none) */}
                        <div
                          ref={zone1Ref}
                          className="h-[88px] flex-none border-b border-dashed border-[#CBD5E1] px-6 flex items-center justify-between bg-[#F8FAFC]/60"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-[#E2E8F0] text-[#334155] font-mono-tabular text-[10px] font-bold">
                                ZONE 1 · HEADER ZONE (flex: none)
                              </span>
                              {showXRayRulers && (
                                <span className="font-mono-tabular text-[11px] font-bold text-[#059669]">
                                  {zone1Size.w} × {zone1Size.h} CSS px
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#64748B]">
                              Пустой слот под заголовок и описание шага (100% кастомизируемый внутри iframe)
                            </p>
                          </div>
                        </div>

                        {/* ZONE 2: Elastic Workspace Stage (flex: 1 1 0; min-height: 0) */}
                        <div
                          ref={zone2Ref}
                          className="flex-1 min-h-0 px-6 py-4 overflow-hidden safe-zone-blueprint flex flex-col items-center justify-center relative"
                        >
                          {leftZone2SimHeight > 0 ? (
                            <div
                              style={{ height: `${leftZone2SimHeight}px` }}
                              className={`w-full rounded-2xl border-2 p-4 flex flex-col justify-between transition-all shrink-0 ${
                                leftZone2Overflows
                                  ? 'border-[#EF4444] bg-[#FEF2F2] text-[#7F1D1D]'
                                  : 'border-[#10B981] bg-[#ECFDF5]/80 text-[#064E3B]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono-tabular text-xs font-extrabold uppercase">
                                  {leftZone2Overflows
                                    ? `⛔ ПЕРЕПОЛНЕНИЕ ZONE 2 (Правило R-03): Контент ${leftZone2SimHeight}px > Доступно ${zone2Size.h}px!`
                                    : `✅ CAPACITY CHECK ОК: Контент ${leftZone2SimHeight}px <= Доступно ${zone2Size.h}px`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setLeftZone2SimHeight(0)}
                                  className="px-2 py-0.5 rounded bg-black/10 text-[10.5px] font-bold"
                                >
                                  Сбросить в пустое поле ✕
                                </button>
                              </div>

                              <div className="text-xs leading-relaxed">
                                {leftZone2Overflows ? (
                                  <>
                                    Демонстрация <strong>Правила R-03</strong>:{' '}
                                    <code>flex: 1; min-height: 0</code> выделил этой зоне{' '}
                                    <strong>{zone2Size.h}px</strong>, а блоку нужно{' '}
                                    <strong>{leftZone2SimHeight}px</strong>. Без проверки вместимости{' '}
                                    <strong>{Math.abs(leftZone2Deficit)}px</strong> снизу обрезается!
                                  </>
                                ) : (
                                  <>
                                    При текущем разрешении ({desktopPreset.shortLabel}) блок высотой{' '}
                                    <strong>{leftZone2SimHeight}px</strong> помещается с запасом{' '}
                                    <strong>+{leftZone2Deficit}px</strong>.
                                  </>
                                )}
                              </div>

                              <div className="font-mono-tabular text-[11px] opacity-80">
                                Нижняя граница тестового блока ({leftZone2SimHeight}px)
                              </div>
                            </div>
                          ) : (
                            <div className="max-w-md w-full rounded-2xl border-2 border-dashed border-[#10B981]/50 bg-[#ECFDF5]/40 p-5 text-center space-y-2.5">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#065F46] text-[#A7F3D0] font-mono-tabular text-[11px] font-bold">
                                <span>✅ ZONE 2 · ELASTIC WORKSPACE STAGE (Эталон Гида)</span>
                              </div>
                              <div className="font-mono-tabular text-lg font-extrabold text-[#064E3B]">
                                {zone2Size.w} × {zone2Size.h} CSS px
                              </div>
                              <p className="text-xs text-[#374151] leading-relaxed">
                                Эталонная пустая зона Стенда-Гида. Вы можете открыть{' '}
                                <button
                                  type="button"
                                  onClick={() => setIsRulesDrawerOpen(true)}
                                  className="underline font-bold text-[#047857] hover:text-[#065F46]"
                                >
                                  📚 Базу правил ({rules.length})
                                </button>{' '}
                                для проверки каждого кейса или переключиться в{' '}
                                <button
                                  type="button"
                                  onClick={() => setContour('real-admin')}
                                  className="underline font-bold text-[#2563EB]"
                                >
                                  🚀 Реальную Админку
                                </button>
                                .
                              </p>
                            </div>
                          )}
                        </div>

                        {/* ZONE 3: Unified Footer Stepper Zone (flex: none) */}
                        <div
                          ref={zone3Ref}
                          className="h-[84px] flex-none border-t border-dashed border-[#CBD5E1] px-6 flex items-center justify-between bg-[#F8FAFC]/60"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-[#E2E8F0] text-[#334155] font-mono-tabular text-[10px] font-bold">
                                ZONE 3 · UNIFIED FOOTER STEPPER (flex: none)
                              </span>
                              {showXRayRulers && (
                                <span className="font-mono-tabular text-[11px] font-bold text-[#059669]">
                                  {zone3Size.w} × {zone3Size.h} CSS px
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#64748B]">
                              Пустой слот под степпер и кнопку шага (100% кастомизируемый внутри iframe)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* RIGHT COLUMN (390px): REAL CUSTOMIZER (mobile-customizer-ui) */}
                    <div
                      ref={rightCustomizerRef}
                      className="w-[390px] flex-none h-full rounded-[30px] overflow-hidden relative shadow-md border border-[#DFD5C7] bg-[#F5EFE6]"
                    >
                      {showXRayRulers && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-2.5 py-0.5 rounded-full bg-[#064E3B]/90 border border-[#10B981] text-[#A7F3D0] font-mono-tabular text-[10px] font-bold shadow-sm whitespace-nowrap">
                          Customizer: {rightCustomizerSize.w}×{rightCustomizerSize.h}px
                          {desktopCustMetrics ? ` · Canvas: ${desktopCustMetrics.canvasH}px` : ''}
                        </div>
                      )}

                      <iframe
                        ref={desktopCustIframeRef}
                        key={`desktop-customizer-${customizerState}`}
                        src={`/mobile-customizer-ui/index.html#${customizerState}`}
                        onLoad={refreshIframeMetrics}
                        title="Cookie Maker Customizer (Desktop Right Column)"
                        className="w-full h-full border-0 block"
                      />
                    </div>
                  </div>

                  {/* ✨ SLOT #5: NATIVE SHOPIFY TOAST OVERLAY (Desktop Bottom Center) */}
                  {simToast && (
                    <div
                      className={`absolute bottom-5 left-1/2 -translate-x-1/2 z-30 px-4 py-2.5 rounded-xl bg-[#1A1A1A] text-white shadow-2xl border border-[#06B6D4] flex items-center gap-3 ${
                        showInjectableSlots ? 'injectable-slot' : ''
                      }`}
                    >
                      <span className="text-xs font-semibold">Changes saved</span>
                      {showInjectableSlots && (
                        <span className="px-1.5 py-0.5 rounded bg-[#083344] text-[#67E8F9] font-mono-tabular text-[9.5px] font-bold">
                          ✨ СЛОТ #5: shopify.toast.show()
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setSimToast(false)}
                        className="text-xs font-bold text-[#67E8F9] hover:underline"
                      >
                        Undo
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. OPTIONAL RIGHT SIDEKICK AI DRAWER (320px) */}
                {simSidekick && (
                  <aside
                    className={`w-[320px] flex-none h-full bg-[#18181B] border-l border-[#EF4444] p-4 flex flex-col justify-between text-white z-20 ${
                      showForbiddenHatch ? 'forbidden-hatch-dark' : ''
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-[#7F1D1D] border border-[#EF4444] text-[#FECACA] font-mono-tabular text-[10px] font-bold">
                          ⛔ SIDEKICK AI DRAWER (320px)
                        </span>
                        <button
                          type="button"
                          onClick={() => setSimSidekick(false)}
                          className="text-xs text-[#9CA3AF] hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="text-sm font-bold">
                        Панель ИИ Shopify Sidekick (Desktop)
                      </div>
                      <p className="text-xs text-[#D4D4D8] leading-relaxed">
                        На десктопе Sidekick открывается правой колонкой (<strong>320px</strong>) и сжимает
                        ширину вашего iframe до <strong>{desktopIframeSize.w}px</strong>.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-[#3F3F46] text-[11px] font-mono-tabular text-[#FCA5A5]">
                      Ширина Iframe: {desktopIframeSize.w} CSS px
                    </div>
                  </aside>
                )}
              </div>
            </div>
          )}

          {/* =================================================================
              2. MOBILE SHOPIFY SHELL (Oct 2026) + ALL MOBILE OVERLAPS & RULES
          ================================================================= */}
          {(viewMode === 'side-by-side' || viewMode === 'mobile-focus') && (
            <div
              style={{
                width: `${mobilePreset.width + 24}px`,
                height: `${mobilePreset.height + 24}px`,
              }}
              className="p-[12px] rounded-[46px] bg-[#1E222B] border-2 border-[#374151] shadow-2xl flex items-center justify-center shrink-0 relative"
            >
              <div
                style={{
                  width: `${mobilePreset.width}px`,
                  height: `${mobilePreset.height}px`,
                }}
                className="bg-[#F5EFE6] rounded-[36px] overflow-hidden flex flex-col relative text-[#1F1916]"
              >
                {/* -----------------------------------------------------------
                    1. SYSTEM STATUS BAR + NATIVE SHOPIFY MOBILE <ui-title-bar>
                ----------------------------------------------------------- */}
                <div
                  style={{
                    height: `${mobilePreset.statusBarHeight + mobilePreset.shopifyNavHeight}px`,
                  }}
                  className="flex-none flex flex-col justify-between bg-white border-b border-[#E2E4E8] z-30"
                >
                  <div
                    style={{ height: `${mobilePreset.statusBarHeight}px` }}
                    className={`w-full px-5 flex items-center justify-between text-[11px] font-semibold relative ${
                      showForbiddenHatch ? 'forbidden-hatch-light' : ''
                    }`}
                  >
                    <span className="font-mono-tabular">09:41</span>
                    {mobilePreset.hasDynamicIsland && (
                      <div className="w-24 h-5 rounded-full bg-black absolute left-1/2 -translate-x-1/2 top-1.5" />
                    )}
                    <div className="flex items-center gap-1 font-mono-tabular text-[10px]">
                      {showForbiddenHatch && (
                        <span className="text-[#DC2626] font-bold">
                          ⛔ OS {mobilePreset.statusBarHeight}px
                        </span>
                      )}
                      <span>5G</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {simSaveBar ? (
                    <div
                      style={{ height: `${mobilePreset.shopifyNavHeight}px` }}
                      className={`w-full px-2.5 bg-[#1A1A1A] text-white flex items-center justify-between gap-1 ${
                        showInjectableSlots ? 'injectable-slot' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSimSaveBar(false)}
                        className="px-2 py-1 rounded bg-[#3A3A3A] text-[10.5px] font-semibold"
                      >
                        Discard
                      </button>
                      <div className="flex flex-col items-center">
                        <span className="text-[11px] font-bold">Unsaved changes</span>
                        {showInjectableSlots && (
                          <span className="text-[8px] font-mono-tabular text-[#67E8F9]">
                            ✨ СЛОТ #4: Mobile &lt;ui-save-bar&gt;
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSimSaveBar(false);
                          setSimToast(true);
                        }}
                        className="px-2.5 py-1 rounded bg-[#06B6D4] text-[#042F2E] text-[10.5px] font-extrabold"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{ height: `${mobilePreset.shopifyNavHeight}px` }}
                      className={`w-full px-2.5 flex items-center justify-between gap-1 ${
                        showForbiddenHatch ? 'forbidden-hatch-light' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-light px-1">‹</span>
                        <span className="w-5 h-5 rounded bg-[#F3ECE1] text-[#5C3D2E] flex items-center justify-center text-[9px] font-extrabold">
                          CM
                        </span>
                      </div>

                      <div
                        className={`px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                          showInjectableSlots
                            ? 'bg-[#ECFEFF] border border-[#06B6D4] injectable-slot'
                            : ''
                        }`}
                      >
                        <span className="text-[11.5px] font-bold truncate">Cookie Maker</span>
                        {showInjectableSlots && (
                          <span className="text-[8.5px] font-mono-tabular font-bold text-[#0E7490]">
                            ✨#2
                          </span>
                        )}
                      </div>

                      <div
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg ${
                          showInjectableSlots
                            ? 'bg-[#ECFEFF] border border-[#06B6D4] injectable-slot'
                            : ''
                        }`}
                      >
                        {showInjectableSlots && (
                          <span className="text-[8.5px] font-mono-tabular font-bold text-[#0E7490]">
                            ✨#3
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setSimToast(true)}
                          className="w-6 h-6 rounded-full bg-[#18181B] text-white flex items-center justify-center text-[11px] font-bold"
                          title="Правило R-04: на телефоне основное действие отображается иконкой без текста"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => setSimMobileMoreSheet(!simMobileMoreSheet)}
                          className="w-6 h-6 rounded-full hover:bg-black/10 flex items-center justify-center text-sm font-bold"
                          title="Правило R-10: мобильное меню <ui-nav-menu> по кнопке ⋯"
                        >
                          ⋯
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* OPTIONAL MOBILE BANNER OVERLAP (-32px) */}
                {simBanner && (
                  <div
                    className={`h-[32px] w-full flex-none bg-[#451A03] border-b border-[#F59E0B] px-3 flex items-center justify-between text-[10px] text-[#FDE68A] z-20 ${
                      showForbiddenHatch ? 'forbidden-hatch-dark' : ''
                    }`}
                  >
                    <span className="font-bold truncate">
                      ⛔ Системный баннер Shopify (-32px высоты WebView)
                    </span>
                    <button
                      type="button"
                      onClick={() => setSimBanner(false)}
                      className="text-white font-bold ml-1"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* -----------------------------------------------------------
                    2. MOBILE WEBVIEW AREA
                ----------------------------------------------------------- */}
                <div className="flex-1 min-h-0 w-full relative overflow-hidden flex flex-col">
                  <div
                    ref={mobileSafeRef}
                    style={{
                      paddingBottom: `${effectiveMobilePaddingBottom}px`,
                    }}
                    className="w-full h-full flex flex-col overflow-hidden box-border relative"
                  >
                    {showXRayRulers && (
                      <div
                        className={`absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-2 py-0.5 rounded-full border font-mono-tabular text-[9.5px] font-bold shadow-sm whitespace-nowrap ${
                          mobileCustMetrics?.isCanvasCramped
                            ? 'bg-[#78350F]/95 border-[#F59E0B] text-[#FDE68A]'
                            : 'bg-[#064E3B]/90 border-[#10B981] text-[#A7F3D0]'
                        }`}
                      >
                        WebView: {mobileCustMetrics?.viewportW || mobileSafeSize.w}×
                        {mobileCustMetrics?.viewportH || mobileSafeSize.h}px
                        {mobileCustMetrics ? ` · Canvas: ${mobileCustMetrics.canvasH}px` : ''}
                      </div>
                    )}

                    {/* Edge Swipe Guard R-12 Visual Strips when R-12 is active */}
                    {activeRuleDemoId === 'R-12' && (
                      <>
                        <div className="absolute inset-y-0 left-0 w-[16px] z-30 forbidden-hatch-dark border-r border-[#EF4444] flex items-center justify-center pointer-events-none">
                          <span className="-rotate-90 font-mono-tabular text-[8px] font-bold text-[#FECACA] whitespace-nowrap">
                            ⛔ 16px EDGE SWIPE
                          </span>
                        </div>
                        <div className="absolute inset-y-0 right-0 w-[16px] z-30 forbidden-hatch-dark border-l border-[#EF4444] flex items-center justify-center pointer-events-none">
                          <span className="rotate-90 font-mono-tabular text-[8px] font-bold text-[#FECACA] whitespace-nowrap">
                            ⛔ 16px EDGE SWIPE
                          </span>
                        </div>
                      </>
                    )}

                    {/* WHEN KEYBOARD IS OPEN (Rule R-08 & R-09): Show Input Focus Mode above the 260px Keyboard! */}
                    {simMobileKeyboard ? (
                      <div className="flex-1 min-h-0 w-full bg-[#FAF7F2] p-3 flex flex-col justify-between border-b-2 border-[#10B981]">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-[#065F46] text-[#A7F3D0] font-mono-tabular text-[9.5px] font-bold">
                            ✅ ПРАВИЛО R-08 / R-09: ПОЛЯ НАД КЛАВИАТУРОЙ ({mobileSafeSize.h - 260}px)
                          </span>
                          <span className="font-mono-tabular text-[9.5px] font-bold text-[#059669]">
                            font-size: 16px (Без автозума iOS!)
                          </span>
                        </div>

                        {/* Compact Cookie Preview Strip + Focused Inputs right above the keyboard */}
                        <div className="flex items-center gap-2.5 bg-[#F3ECE1] p-2 rounded-xl border border-[#DFD5C7]">
                          <img
                            src="/mobile-customizer-ui/assets/shapes/bird.png"
                            alt="Robin Bird"
                            className="w-11 h-11 object-contain shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-[#4A2E1B] truncate">
                              {demoCookieLabel} · {demoCookiePrice}
                            </div>
                            <div className="text-[10px] text-[#7A7067]">
                              Нижний футер временно скрыт, чтобы поле ввода было прямо перед глазами
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-[#5C3D2E] mb-0.5">
                              Cookie Name (16px input)
                            </label>
                            <input
                              type="text"
                              value={demoCookieLabel}
                              onChange={(e) => setDemoCookieLabel(e.target.value)}
                              style={{ fontSize: '16px' }}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-white border-2 border-[#4A2E1B] font-semibold text-[#1F1916] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#5C3D2E] mb-0.5">
                              Unit Price (16px input)
                            </label>
                            <input
                              type="text"
                              value={demoCookiePrice}
                              onChange={(e) => setDemoCookiePrice(e.target.value)}
                              style={{ fontSize: '16px' }}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-white border-2 border-[#4A2E1B] font-semibold text-[#1F1916] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ) : contour === 'real-admin' ? (
                      <RealAdminMobileView
                        mobileSafeSize={mobileSafeSize}
                        showXRayRulers={showXRayRulers}
                        customizerState={customizerState}
                        onOpenKeyboardDemo={() => setSimMobileKeyboard(true)}
                        onTriggerSaveBar={() => setSimSaveBar(true)}
                        activeStepIdx={realAdminStepIdx}
                        onChangeStepIdx={setRealAdminStepIdx}
                      />
                    ) : (
                      <div className="flex-1 min-h-0 w-full relative overflow-hidden">
                        <iframe
                          ref={mobileCustIframeRef}
                          key={`mobile-customizer-${customizerState}-${mobileInsetMode}-${mobilePreset.id}`}
                          src={`/mobile-customizer-ui/index.html#${customizerState}`}
                          onLoad={refreshIframeMetrics}
                          title="Cookie Maker Customizer (Mobile WebView)"
                          className="w-full h-full border-0 block"
                        />
                      </div>
                    )}

                    {/* Visual Callout if Double-Reservation Bug (R-02) is active */}
                    {mobileInsetMode === 'double-reserved-bug' && !simMobileKeyboard && (
                      <div
                        style={{
                          height: '80px',
                          bottom: `${mobilePreset.appBridgeAutoInset}px`,
                        }}
                        className="absolute inset-x-0 z-20 bg-[#78350F]/95 border-t-2 border-dashed border-[#F59E0B] flex flex-col items-center justify-center px-3 text-center text-[#FDE68A]"
                      >
                        <div className="text-[10px] font-extrabold">
                          ⚠️ ПРАВИЛО R-02: ЛИШНИЕ 80px ПУСТОТЫ (Двойное резервирование!)
                        </div>
                        <div className="text-[9px] font-mono-tabular">
                          App Bridge уже отступил {mobilePreset.appBridgeAutoInset}px снизу. Ручной
                          padding-bottom: 80px украл место у печеньки!
                        </div>
                      </div>
                    )}
                  </div>

                  {/* OVERLAY A: ✨ SLOT #5 MOBILE TOAST */}
                  {simToast && (
                    <div
                      style={{ bottom: `${mobilePreset.appBridgeAutoInset + 10}px` }}
                      className={`absolute inset-x-3 z-30 px-3.5 py-2.5 rounded-xl bg-[#1A1A1A] text-white shadow-2xl border border-[#06B6D4] flex items-center justify-between ${
                        showInjectableSlots ? 'injectable-slot' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">Changes saved</div>
                        {showInjectableSlots && (
                          <div className="text-[8.5px] font-mono-tabular text-[#67E8F9]">
                            ✨ СЛОТ #5: Toast на мобилке всплывает над баром Shopify
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSimToast(false)}
                        className="text-xs font-bold text-[#67E8F9] ml-2 shrink-0"
                      >
                        Undo
                      </button>
                    </div>
                  )}

                  {/* OVERLAY B: ✨ SLOT #1 & #3 MOBILE "⋯" ACTION SHEET */}
                  {simMobileMoreSheet && (
                    <div className="absolute inset-0 bg-black/50 z-40 flex flex-col justify-end">
                      <div
                        className={`w-full rounded-t-3xl bg-white p-4 shadow-2xl border-t-2 border-[#06B6D4] space-y-2.5 ${
                          showInjectableSlots ? 'injectable-slot' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-2">
                          <div>
                            <div className="text-xs font-extrabold text-[#18181B]">
                              ✨ ПРАВИЛО R-10: СЛОТ #1 и #3 на мобилке (Меню «⋯»)
                            </div>
                            <div className="text-[10px] text-[#52525B]">
                              На телефоне нет левого сайдбара — все ссылки &lt;ui-nav-menu&gt; живут здесь:
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSimMobileMoreSheet(false)}
                            className="w-6 h-6 rounded-full bg-[#F4F4F5] text-xs font-bold"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="space-y-1">
                          {APP_NAV_LINKS.map((link) => (
                            <button
                              key={link}
                              type="button"
                              onClick={() => {
                                setActiveNavLink(link);
                                setSimMobileMoreSheet(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                                activeNavLink === link
                                  ? 'bg-[#18181B] text-white'
                                  : 'bg-[#F4F4F5] text-[#27272A]'
                              }`}
                            >
                              <span>{link}</span>
                              <span className="text-[9px] font-mono-tabular opacity-75">
                                &lt;ui-nav-menu&gt;
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OVERLAY C: ⛔ MOBILE SIDEKICK AI BOTTOM SHEET (62%) */}
                  {simSidekick && (
                    <div
                      style={{ height: '62%' }}
                      className={`absolute inset-x-0 bottom-0 z-40 rounded-t-3xl bg-[#18181B] text-white border-t-2 border-[#EF4444] p-4 flex flex-col justify-between shadow-2xl ${
                        showForbiddenHatch ? 'forbidden-hatch-dark' : ''
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="w-10 h-1 rounded-full bg-white/30 mx-auto mb-1" />
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-[#7F1D1D] border border-[#EF4444] text-[#FECACA] font-mono-tabular text-[9.5px] font-bold">
                            ⛔ ПРАВИЛО R-07: MOBILE SIDEKICK AI (62% экрана снизу!)
                          </span>
                          <button
                            type="button"
                            onClick={() => setSimSidekick(false)}
                            className="px-2 py-0.5 rounded bg-white/10 text-xs font-bold"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="text-sm font-bold">✦ Sidekick AI на мобилке</div>
                        <p className="text-[11px] text-[#D4D4D8] leading-relaxed">
                          Круглая кнопка <strong>✦</strong> всегда висит в правом нижнем углу, а при
                          нажатии выезжает эта шторка поверх нижних 62% экрана.
                        </p>
                      </div>

                      <div className="h-9 rounded-full bg-white/10 border border-white/20 px-3.5 flex items-center justify-between text-xs text-[#A1A1AA]">
                        <span>Ask Sidekick anything...</span>
                        <span>↑</span>
                      </div>
                    </div>
                  )}

                  {/* OVERLAY D: ⛔ SYSTEM KEYBOARD (260px Bottom Overlap) */}
                  {simMobileKeyboard && (
                    <div
                      style={{ height: '260px' }}
                      className={`absolute inset-x-0 bottom-0 z-40 bg-[#27272A] text-white border-t-2 border-[#EF4444] p-3 flex flex-col justify-between shadow-2xl ${
                        showForbiddenHatch ? 'forbidden-hatch-dark' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-[#7F1D1D] border border-[#EF4444] text-[#FECACA] font-mono-tabular text-[9.5px] font-bold">
                          ⛔ КЛАВИАТУРА iOS/ANDROID (260px снизу · Правила R-08 и R-09)
                        </span>
                        <button
                          type="button"
                          onClick={() => setSimMobileKeyboard(false)}
                          className="px-2 py-0.5 rounded bg-white/15 text-[11px] font-bold"
                        >
                          Done ✕
                        </button>
                      </div>

                      <div className="text-[11px] text-[#E4E4E7] leading-snug">
                        Обратите внимание на верхнюю часть экрана телефона: поля ввода{' '}
                        <strong>Cookie Name</strong> и <strong>Unit Price (16px)</strong> автоматически
                        подняты в видимую область над клавиатурой!
                      </div>

                      <div className="grid grid-cols-10 gap-1 text-center font-mono-tabular text-[11px]">
                        {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((k) => (
                          <div key={k} className="py-1.5 rounded bg-[#3F3F46] font-bold">
                            {k}
                          </div>
                        ))}
                      </div>
                      <div className="w-28 h-1 rounded-full bg-white/50 mx-auto" />
                    </div>
                  )}

                  {/* 3. FLOATING SHOPIFY MOBILE BOTTOM NAVIGATION + SIDEKICK AI BUTTON (✦) */}
                  <div
                    style={{ height: `${mobilePreset.appBridgeAutoInset}px` }}
                    className={`w-full absolute bottom-0 inset-x-0 z-30 flex flex-col justify-between px-3 pt-1 pb-1.5 ${
                      showForbiddenHatch
                        ? 'forbidden-hatch-dark border-t-2 border-[#EF4444]'
                        : 'bg-gradient-to-t from-black/25 via-black/10 to-transparent'
                    }`}
                  >
                    {showForbiddenHatch && (
                      <div className="px-2 py-0.5 rounded bg-[#7F1D1D] border border-[#EF4444] text-[#FECACA] font-mono-tabular text-[8.5px] font-bold text-center mx-auto pointer-events-none">
                        ⛔ SHOPIFY BAR + ✦ SIDEKICK ({mobilePreset.appBridgeAutoInset}px Auto-Inset)
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 my-auto">
                      <div className="flex-1 h-10 rounded-full bg-white/95 border border-[#D4D4D8] shadow-lg px-3 flex items-center justify-around text-[10.5px] font-semibold text-[#52525B] pointer-events-none">
                        <span>Home</span>
                        <span>Orders</span>
                        <span>Products</span>
                        <span className="text-[#18181B] font-bold">Apps</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSimSidekick(!simSidekick)}
                        className={`w-10 h-10 rounded-full shadow-lg border-2 flex items-center justify-center shrink-0 text-xs font-bold transition-transform active:scale-95 ${
                          simSidekick
                            ? 'bg-[#EF4444] text-white border-white'
                            : 'bg-[#18181B] text-white border-[#EF4444]'
                        }`}
                        title="Кнопка ✦ Sidekick AI в правом нижнем углу мобилки"
                      >
                        ✦
                      </button>
                    </div>

                    <div className="w-28 h-1 rounded-full bg-white/60 mx-auto pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
