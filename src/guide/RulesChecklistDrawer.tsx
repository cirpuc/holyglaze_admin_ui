import React, { useState } from 'react';
import {
  ArchitectureRule,
  RULE_CATEGORY_LABELS,
  RuleCategory,
  SimulationPresetConfig,
} from './architectureRules';

interface RulesChecklistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rules: ArchitectureRule[];
  activeRuleDemoId: string | null;
  onRunRulePreset: (rule: ArchitectureRule) => void;
  onAddCustomRule: (newRule: ArchitectureRule) => void;
}

export const RulesChecklistDrawer: React.FC<RulesChecklistDrawerProps> = ({
  isOpen,
  onClose,
  rules,
  activeRuleDemoId,
  onRunRulePreset,
  onAddCustomRule,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<RuleCategory | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newRisk, setNewRisk] = useState('');
  const [newSolution, setNewSolution] = useState('');
  const [newCategory, setNewCategory] = useState<RuleCategory>('capacity-zero-scroll');
  const [newPlatform, setNewPlatform] = useState<'Desktop & Mobile' | 'Mobile Only' | 'Desktop Only'>(
    'Desktop & Mobile'
  );

  if (!isOpen) return null;

  const filteredRules =
    selectedCategory === 'all'
      ? rules
      : rules.filter((r) => r.category === selectedCategory);

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSolution.trim()) return;
    const nextNum = rules.length + 1;
    const code = `R-${String(nextNum).padStart(2, '0')}`;
    const created: ArchitectureRule = {
      id: `rule-custom-${Date.now()}`,
      code,
      category: newCategory,
      platform: newPlatform,
      title: newTitle.trim(),
      riskSummary: newRisk.trim() || 'Пользовательское ограничение вёрстки.',
      solutionRule: newSolution.trim(),
      presetLabel: '▶ Проверить на текущем экране',
      preset: {
        showXRayRulers: true,
        activeRuleDemoId: code,
      } as SimulationPresetConfig,
    };
    onAddCustomRule(created);
    setNewTitle('');
    setNewRisk('');
    setNewSolution('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[460px] max-w-full bg-[#0F131D]/98 border-l border-[#262F45] shadow-2xl z-50 flex flex-col text-[#E5E7EB]">
      {/* Header */}
      <div className="flex-none px-4 py-3 border-b border-[#22293C] flex items-center justify-between bg-[#141926]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#2563EB] text-white font-mono-tabular text-[10.5px] font-bold">
              ЗАЩИЩЁННЫЙ ГИД
            </span>
            <h2 className="text-sm font-bold text-white">
              База правил и ограничений ({rules.length})
            </h2>
          </div>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">
            Нажмите «▶ Показать», чтобы воспроизвести правило прямо на симуляторе
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-2.5 py-1 rounded-lg bg-[#10B981]/20 border border-[#10B981] text-[#6EE7B7] text-[11px] font-bold hover:bg-[#10B981]/30 transition-colors"
          >
            {showAddForm ? 'Отмена' : '+ Правило'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#1F2637] hover:bg-[#2D364D] text-[#9CA3AF] hover:text-white flex items-center justify-center text-xs font-bold"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex-none px-3 py-2 border-b border-[#1E2436] flex flex-wrap gap-1 bg-[#0B0E17]">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-2 py-1 rounded text-[10.5px] font-semibold transition-colors ${
            selectedCategory === 'all'
              ? 'bg-[#2563EB] text-white'
              : 'bg-[#151A28] text-[#9CA3AF] hover:text-white'
          }`}
        >
          Все ({rules.length})
        </button>
        {(Object.keys(RULE_CATEGORY_LABELS) as RuleCategory[]).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-2 py-1 rounded text-[10.5px] font-semibold transition-colors ${
              selectedCategory === cat
                ? 'bg-[#2563EB] text-white'
                : 'bg-[#151A28] text-[#9CA3AF] hover:text-white'
            }`}
          >
            {RULE_CATEGORY_LABELS[cat].title.split('.')[1]?.trim() || cat}
          </button>
        ))}
      </div>

      {/* Optional Add Rule Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateRule}
          className="flex-none p-3.5 bg-[#151B2B] border-b border-[#2E3852] space-y-2.5 text-xs"
        >
          <div className="font-bold text-[#6EE7B7]">
            Добавить новое правило в чеклист Гида
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as RuleCategory)}
              className="bg-[#0B0E17] border border-[#2E364F] rounded px-2 py-1 text-[11px]"
            >
              {(Object.keys(RULE_CATEGORY_LABELS) as RuleCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {RULE_CATEGORY_LABELS[cat].title}
                </option>
              ))}
            </select>
            <select
              value={newPlatform}
              onChange={(e) =>
                setNewPlatform(
                  e.target.value as 'Desktop & Mobile' | 'Mobile Only' | 'Desktop Only'
                )
              }
              className="bg-[#0B0E17] border border-[#2E364F] rounded px-2 py-1 text-[11px]"
            >
              <option value="Desktop & Mobile">Desktop & Mobile</option>
              <option value="Mobile Only">Mobile Only</option>
              <option value="Desktop Only">Desktop Only</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Короткое название правила (например: Высота дропдауна над футером)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-[#0B0E17] border border-[#2E364F] rounded px-2.5 py-1.5 text-xs text-white"
            required
          />
          <input
            type="text"
            placeholder="В чём риск / почему может сломаться..."
            value={newRisk}
            onChange={(e) => setNewRisk(e.target.value)}
            className="w-full bg-[#0B0E17] border border-[#2E364F] rounded px-2.5 py-1.5 text-xs text-white"
          />
          <input
            type="text"
            placeholder="Правило решения при вёрстке..."
            value={newSolution}
            onChange={(e) => setNewSolution(e.target.value)}
            className="w-full bg-[#0B0E17] border border-[#2E364F] rounded px-2.5 py-1.5 text-xs text-white"
            required
          />
          <button
            type="submit"
            className="w-full py-1.5 rounded-lg bg-[#10B981] text-[#052E16] font-bold text-xs"
          >
            Сохранить правило в Гид
          </button>
        </form>
      )}

      {/* Scrollable Checklist of Rules */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5">
        {filteredRules.map((rule) => {
          const isActive = activeRuleDemoId === rule.code;
          const catMeta = RULE_CATEGORY_LABELS[rule.category];
          return (
            <div
              key={rule.id}
              className={`rounded-xl p-3 border transition-all ${
                isActive
                  ? 'bg-[#172136] border-[#3B82F6] ring-1 ring-[#3B82F6]'
                  : 'bg-[#141824] border-[#22293C] hover:border-[#333E5A]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded bg-[#2563EB] text-white font-mono-tabular text-[10px] font-extrabold">
                    {rule.code}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded border text-[9.5px] font-semibold ${catMeta.badgeColor}`}
                  >
                    {catMeta.title.split('.')[1]?.trim()}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#1F2637] text-[#9CA3AF] font-mono-tabular text-[9.5px]">
                    {rule.platform}
                  </span>
                </div>
                {isActive && (
                  <span className="text-[10px] font-bold text-[#60A5FA]">
                    ● Показано на стенде
                  </span>
                )}
              </div>

              <div className="text-xs font-bold text-white leading-snug mb-1.5">
                {rule.title}
              </div>

              <div className="space-y-1 text-[11px] leading-relaxed">
                <div className="text-[#FCA5A5] bg-[#450A0A]/40 border border-[#7F1D1D]/50 rounded-lg px-2.5 py-1.5">
                  <strong className="text-[#EF4444]">⛔ Риск:</strong> {rule.riskSummary}
                </div>
                <div className="text-[#A7F3D0] bg-[#064E3B]/35 border border-[#059669]/50 rounded-lg px-2.5 py-1.5">
                  <strong className="text-[#10B981]">✅ Правило:</strong> {rule.solutionRule}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRunRulePreset(rule)}
                className={`mt-2 w-full py-1.5 px-3 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-[#1E2638] hover:bg-[#28334A] text-[#93C5FD]'
                }`}
              >
                <span>{rule.presetLabel}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
