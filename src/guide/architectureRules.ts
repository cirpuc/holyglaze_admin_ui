export type RuleCategory =
  | 'shopify-overlaps'
  | 'capacity-zero-scroll'
  | 'mobile-keyboard-input'
  | 'app-bridge-slots';

export interface SimulationPresetConfig {
  viewMode?: 'side-by-side' | 'desktop-focus' | 'mobile-focus';
  desktopPresetId?: string;
  mobilePresetId?: string;
  simSidebarOpen?: boolean;
  simSaveBar?: boolean;
  simBanner?: boolean;
  simSidekick?: boolean;
  simToast?: boolean;
  simMobileMoreSheet?: boolean;
  simMobileKeyboard?: boolean;
  mobileInsetMode?: 'app-bridge-auto' | 'none-overlap' | 'double-reserved-bug';
  leftZone2SimHeight?: number;
  showForbiddenHatch?: boolean;
  showInjectableSlots?: boolean;
  showXRayRulers?: boolean;
  activeRuleDemoId?: string;
}

export interface ArchitectureRule {
  id: string;
  code: string;
  category: RuleCategory;
  platform: 'Desktop & Mobile' | 'Mobile Only' | 'Desktop Only';
  title: string;
  riskSummary: string;
  solutionRule: string;
  presetLabel: string;
  preset: SimulationPresetConfig;
}

export const RULE_CATEGORY_LABELS: Record<RuleCategory, { title: string; badgeColor: string }> = {
  'shopify-overlaps': {
    title: '1. Перекрытия и границы Shopify',
    badgeColor: 'bg-[#7F1D1D] text-[#FECACA] border-[#EF4444]',
  },
  'capacity-zero-scroll': {
    title: '2. Вместимость и Capacity Check (Zero-Scroll)',
    badgeColor: 'bg-[#78350F] text-[#FDE68A] border-[#F59E0B]',
  },
  'mobile-keyboard-input': {
    title: '3. Клавиатура, инпуты и жесты на мобилке',
    badgeColor: 'bg-[#1E3A8A] text-[#BFDBFE] border-[#3B82F6]',
  },
  'app-bridge-slots': {
    title: '4. Слоты App Bridge v4 и навигация',
    badgeColor: 'bg-[#083344] text-[#67E8F9] border-[#06B6D4]',
  },
};

export const INITIAL_ARCHITECTURE_RULES: ArchitectureRule[] = [
  {
    id: 'rule-01',
    code: 'R-01',
    category: 'shopify-overlaps',
    platform: 'Desktop Only',
    title: 'На компьютере 100dvh — это размер iframe, но перекрытия возможны и там',
    riskSummary:
      'Системный баннер Shopify сверху (-40px), правая панель ✦ Sidekick AI (-320px ширины) и всплывающий Toast внизу по центру сжимают или перекрывают экран приложения на десктопе.',
    solutionRule:
      'Никогда не хардкодить фиксированную высоту/ширину под 100dvh без учёта сжатия. Левый лист (1fr) должен эластично сжиматься при открытии Sidekick и баннера.',
    presetLabel: '▶ Показать Баннер + Sidekick + Toast на 1280×720',
    preset: {
      viewMode: 'desktop-focus',
      desktopPresetId: '1280x720',
      simBanner: true,
      simSidekick: true,
      simToast: true,
      showForbiddenHatch: true,
      showXRayRulers: true,
      activeRuleDemoId: 'R-01',
    },
  },
  {
    id: 'rule-02',
    code: 'R-02',
    category: 'shopify-overlaps',
    platform: 'Mobile Only',
    title: 'Авто-отступ App Bridge снизу (Запрет двойного резервирования 80px)',
    riskSummary:
      'App Bridge сам передаёт и автоматически добавляет странице фактический нижний отступ (72–96px) под капсулу Shopify Mobile. Если вручную прописать ещё padding-bottom: 80px, получится пустая дыра в 160px, крадущая высоту у печеньки.',
    solutionRule:
      'Полагаться на автоматический отступ App Bridge (не резервировать повторно 80px вручную и не отключать его, иначе бар перекроет кнопку Add to cart).',
    presetLabel: '▶ Сравнить баг двойного отступа (+80px) на iPhone SE',
    preset: {
      viewMode: 'side-by-side',
      mobilePresetId: 'iphone-se',
      mobileInsetMode: 'double-reserved-bug',
      simSidekick: false,
      simMobileKeyboard: false,
      showForbiddenHatch: true,
      showXRayRulers: true,
      activeRuleDemoId: 'R-02',
    },
  },
  {
    id: 'rule-03',
    code: 'R-03',
    category: 'capacity-zero-scroll',
    platform: 'Desktop & Mobile',
    title: 'flex: 1; min-height: 0 не гарантирует, что контент влезет (нужен Capacity Check)',
    riskSummary:
      'Эластичная середина (Zone 2) лишь распределяет оставшееся место. Например, на ноутбуке 1280×720 ей достаётся ~360px, а форме настроек в столбик нужно 533px — нижние 173px просто обрежутся.',
    solutionRule:
      'Замерять реальную высоту контейнера через ResizeObserver (availableHeight vs requiredHeight). При нехватке высоты перестраивать поля в 2 колонки или включать компактный режим.',
    presetLabel: '▶ Показать кейс 533px против 360px на ноутбуке 1280×720',
    preset: {
      viewMode: 'desktop-focus',
      desktopPresetId: '1280x720',
      simBanner: true,
      leftZone2SimHeight: 533,
      showXRayRulers: true,
      activeRuleDemoId: 'R-03',
    },
  },
  {
    id: 'rule-04',
    code: 'R-04',
    category: 'app-bridge-slots',
    platform: 'Mobile Only',
    title: 'Основное действие в шапке <ui-title-bar> на телефоне — иконка без текста',
    riskSummary:
      'На мобилке Shopify принудительно отображает главную кнопку (variant="primary") в верхней шапке только системной иконкой (✓) без вашего текста, а остальные кнопки прячет в меню «⋯».',
    solutionRule:
      'Не рассчитывать, что мерчант на телефоне прочитает длинный текст на кнопке в верхней шапке (например, «Next: Dough flavours →»). Держать основную кнопку шага в нашем нижнем футере Zone 3.',
    presetLabel: '▶ Подсветить шапку телефона и иконку без текста',
    preset: {
      viewMode: 'mobile-focus',
      mobilePresetId: 'iphone-16',
      simSaveBar: false,
      simSidekick: false,
      simMobileKeyboard: false,
      showInjectableSlots: true,
      activeRuleDemoId: 'R-04',
    },
  },
  {
    id: 'rule-05',
    code: 'R-05',
    category: 'app-bridge-slots',
    platform: 'Desktop & Mobile',
    title: 'Голубые зоны App Bridge (#1–#5) нельзя кастомизировать визуально (CSS)',
    riskSummary:
      'Слоты <ui-nav-menu>, <ui-title-bar>, <ui-save-bar> и shopify.toast рисует сам Shopify снаружи вашего iframe. Любые классы, цвета, шрифты или иконки внутри них игнорируются и вырезаются.',
    solutionRule:
      'В голубые зоны передаём только чистый текст, ссылки и обработчики onClick. Весь кастомный дизайн (шрифты, цвета, неоморфизм) строим только внутри нашего iframe.',
    presetLabel: '▶ Подсветить все 5 слотов App Bridge (SaveBar + Toast + Nav)',
    preset: {
      viewMode: 'side-by-side',
      desktopPresetId: '1320x820',
      simSidebarOpen: true,
      simSaveBar: true,
      simToast: true,
      showInjectableSlots: true,
      showForbiddenHatch: false,
      activeRuleDemoId: 'R-05',
    },
  },
  {
    id: 'rule-06',
    code: 'R-06',
    category: 'capacity-zero-scroll',
    platform: 'Desktop & Mobile',
    title: '100% свобода кастомизации внутри Zone 1, Zone 2 и Zone 3',
    riskSummary:
      'Иногда разработчики боятся менять высоту собственной внутренней шапки (Zone 1) или нижнего степпера (Zone 3), думая, что это части Shopify.',
    solutionRule:
      'Весь левый белый лист (Zone 1 / Zone 2 / Zone 3) и правая колонка находятся внутри нашего iframe. Их цвета, шрифты, высоты и наличие можно менять абсолютно свободно.',
    presetLabel: '▶ Показать чистую сетку Zone 1 / 2 / 3 внутри iframe',
    preset: {
      viewMode: 'desktop-focus',
      desktopPresetId: '1320x820',
      leftZone2SimHeight: 0,
      simBanner: false,
      simSidekick: false,
      simSaveBar: false,
      simToast: false,
      showXRayRulers: true,
      activeRuleDemoId: 'R-06',
    },
  },
  {
    id: 'rule-07',
    code: 'R-07',
    category: 'shopify-overlaps',
    platform: 'Mobile Only',
    title: '✦ Sidekick AI на мобилке: круглая кнопка в углу + выездная шторка на 62% экрана',
    riskSummary:
      'На телефоне кнопка ✦ Sidekick постоянно висит справа от нижней капсулы навигации, а при нажатии выезжает шторкой снизу (Bottom Sheet), перекрывая 60–75% высоты приложения.',
    solutionRule:
      'Никогда не размещать плавающие кнопки поверх правого нижнего угла на мобилке и учитывать временное перекрытие нижней части экрана шторкой Sidekick и всплывающим Toast.',
    presetLabel: '▶ Открыть шторку ✦ Sidekick AI на мобилке',
    preset: {
      viewMode: 'side-by-side',
      mobilePresetId: 'iphone-se',
      simSidekick: true,
      simMobileKeyboard: false,
      showForbiddenHatch: true,
      activeRuleDemoId: 'R-07',
    },
  },
  {
    id: 'rule-08',
    code: 'R-08',
    category: 'mobile-keyboard-input',
    platform: 'Mobile Only',
    title: 'Поля ввода на мобилке всегда должны подниматься над клавиатурой (Input Focus Mode)',
    riskSummary:
      'При клике в <input> на телефоне снизу поднимается системная клавиатура (~260–300px). На iPhone SE от 523px безопасной зоны остаётся всего ~260px сверху — если поле ввода было внизу, клавиатура его закроет.',
    solutionRule:
      'При фокусе в поле ввода (или сжатии visualViewport.height) временно скрывать нижний степпер Zone 3 и поднимать редактируемое поле + мини-превью в верхние 260px над клавиатурой.',
    presetLabel: '▶ Включить клавиатуру (260px) и показать поле ввода над ней',
    preset: {
      viewMode: 'side-by-side',
      mobilePresetId: 'iphone-se',
      simMobileKeyboard: true,
      simSidekick: false,
      simMobileMoreSheet: false,
      showForbiddenHatch: true,
      activeRuleDemoId: 'R-08',
    },
  },
  {
    id: 'rule-09',
    code: 'R-09',
    category: 'mobile-keyboard-input',
    platform: 'Mobile Only',
    title: 'Защита от принудительного автозума iOS Safari (font-size >= 16px у инпутов)',
    riskSummary:
      'Если у <input>, <select> или <textarea> на iPhone размер шрифта меньше 16px (например, 12px или 14px), WebView при касании поля принудительно зумит весь экран и ломает Zero-Scroll верстку.',
    solutionRule:
      'На всех полях ввода на мобилке задавать font-size: 16px (1rem). Если визуально поле должно быть компактнее — уменьшать только отступы (padding), но не шрифт.',
    presetLabel: '▶ Показать проверку font-size: 16px на мобилке',
    preset: {
      viewMode: 'mobile-focus',
      mobilePresetId: 'iphone-se',
      simMobileKeyboard: true,
      simSidekick: false,
      activeRuleDemoId: 'R-09',
    },
  },
  {
    id: 'rule-10',
    code: 'R-10',
    category: 'app-bridge-slots',
    platform: 'Mobile Only',
    title: 'На мобилке нет левого сайдбара (<ui-nav-menu> прячется в кнопку «⋯»)',
    riskSummary:
      'На десктопе разделы приложения всегда видны слева (240px), а на телефоне Shopify прячет их внутрь иконки «⋯» в шапке. Многие пользователи не догадаются искать там переход к следующему шагу.',
    solutionRule:
      'Вся навигация по шагам мастера (1. Shapes → 2. Dough → 3. Print → 4. Batch) должна быть продублирована внутри нашего собственного интерфейса (в нижнем степпере Zone 3).',
    presetLabel: '▶ Открыть мобильную шторку «⋯» (<ui-nav-menu>)',
    preset: {
      viewMode: 'side-by-side',
      mobilePresetId: 'iphone-16',
      simMobileMoreSheet: true,
      simSidekick: false,
      simMobileKeyboard: false,
      showInjectableSlots: true,
      activeRuleDemoId: 'R-10',
    },
  },
  {
    id: 'rule-11',
    code: 'R-11',
    category: 'capacity-zero-scroll',
    platform: 'Mobile Only',
    title: 'На мобилке 1 колонка: переключение «⚙️ Настройки шага ↔ 👁 Превью Cookie Maker»',
    riskSummary:
      'На десктопе помещаются 2 колонки рядом (Админка слева + Cookie Maker 390px справа). На телефоне (375px) две колонки не встанут ни рядом, ни друг под другом по высоте.',
    solutionRule:
      'В мобильной админке использовать компактную плашку мини-превью сверху + переключатель «⚙️ Настройки ↔ 👁 Живой Cookie Maker» для полноэкранной проверки.',
    presetLabel: '▶ Показать связку Настройки ↔ Превью на мобилке',
    preset: {
      viewMode: 'side-by-side',
      mobilePresetId: 'iphone-se',
      simMobileKeyboard: false,
      simSidekick: false,
      simMobileMoreSheet: false,
      activeRuleDemoId: 'R-11',
    },
  },
  {
    id: 'rule-12',
    code: 'R-12',
    category: 'mobile-keyboard-input',
    platform: 'Mobile Only',
    title: 'Защита от системного свайпа «Назад» по краям телефона (Edge Swipe Guard)',
    riskSummary:
      'В iOS и Android свайп пальцем от самого левого/правого края экрана (0–20px) вызывает системный возврат назад и закрывает страницу. Карусель вплотную к краю приводит к случайному выходу.',
    solutionRule:
      'Все горизонтальные карусели форм и слайдеры на мобилке должны иметь внутренний отступ от краёв >= 16px и CSS-свойство touch-action: pan-x.',
    presetLabel: '▶ Подсветить 16px защитные зоны свайпа по краям мобилки',
    preset: {
      viewMode: 'mobile-focus',
      mobilePresetId: 'iphone-16',
      simMobileKeyboard: false,
      simSidekick: false,
      showForbiddenHatch: true,
      activeRuleDemoId: 'R-12',
    },
  },
];
