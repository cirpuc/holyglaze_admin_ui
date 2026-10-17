import React, { useState } from 'react';
import {
  Search,
  Home,
  ShoppingBag,
  Tag,
  Users,
  BarChart2,
  Percent,
  Settings,
  ChevronDown,
  Boxes,
  Pin,
  FileText,
  Megaphone,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  count?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SHOPIFY_CORE_NAV: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'orders', label: 'Orders', count: '18', icon: ShoppingBag },
  { id: 'products', label: 'Products', icon: Tag },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'discounts', label: 'Discounts', icon: Percent },
];

export const ShopifyAdminFrame: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const [activeCoreItem, setActiveCoreItem] = useState<string>('app');
  const [searchValue, setSearchValue] = useState<string>('');

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#1A1A1A] flex flex-col select-none">
      {/* Top Shopify Admin Bar */}
      <header className="h-14 bg-[#1A1A1A] px-4 flex items-center justify-between gap-8 shrink-0">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#admin"
          onClick={(e) => {
            e.preventDefault();
            setActiveCoreItem('app');
          }}
          className="text-sm font-bold tracking-tight text-white flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <span className="w-6 h-6 rounded bg-[#008060] text-white flex items-center justify-center font-bold text-xs">
            S
          </span>
          <span>Shopify</span>
        </a>

        {/* Zone 2: Global Search Input */}
        <div className="flex-1 max-w-md">
          <div className="h-8 bg-[#303030] border border-[#424242] rounded-lg px-3 flex items-center justify-between gap-2 text-xs text-[#B5B5B5]">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 text-[#8A8A8A] shrink-0" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search"
                className="w-full bg-transparent text-white placeholder-[#8A8A8A] focus:outline-none text-xs"
              />
            </div>
            <kbd className="font-mono-tabular text-[11px] text-[#999999] bg-[#242424] px-1.5 py-0.5 rounded border border-[#3D3D3D] shrink-0">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Zone 3: Store Profile Button */}
        <button
          type="button"
          onClick={() => setActiveCoreItem('app')}
          className="h-8 px-2.5 rounded-lg bg-[#303030] hover:bg-[#3A3A3A] text-white text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
        >
          <span className="w-5 h-5 rounded bg-[#008060] text-white flex items-center justify-center text-[11px] font-bold">
            MS
          </span>
          <span className="hidden sm:inline">My Store</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#A3A3A3]" />
        </button>
      </header>

      {/* Main Shopify Admin Frame (Sidebar + Empty App Viewport) */}
      <div className="flex-1 min-h-0 flex bg-[#EBEBEB] rounded-t-xl overflow-hidden">
        {/* Left Shopify Admin Sidebar */}
        <aside className="w-60 h-full bg-[#EBEBEB] border-r border-[#DCDCDC] flex flex-col justify-between py-3 px-2.5 shrink-0 overflow-hidden">
          <div className="space-y-4">
            {/* Core Shopify Store Navigation */}
            <nav className="space-y-0.5" aria-label="Shopify Admin Navigation">
              {SHOPIFY_CORE_NAV.map((item) => {
                const Icon = item.icon;
                const isSelected = activeCoreItem === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveCoreItem(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-[#FAFAFA] text-[#1A1A1A] font-semibold shadow-2xs'
                        : 'text-[#4A4A4A] hover:bg-[#E3E3E3] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 text-[#616161] shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.count && (
                      <span className="text-xs font-mono-tabular text-[#616161]">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Apps Section */}
            <div className="pt-2 border-t border-[#DCDCDC]">
              <div className="px-2.5 pb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#616161]">
                  Apps
                </span>
                <Pin className="w-3 h-3 text-[#616161]" />
              </div>

              <button
                type="button"
                onClick={() => setActiveCoreItem('app')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors whitespace-nowrap shrink-0 ${
                  activeCoreItem === 'app'
                    ? 'bg-[#FAFAFA] text-[#1A1A1A] font-semibold shadow-2xs'
                    : 'text-[#4A4A4A] font-medium hover:bg-[#E3E3E3] hover:text-[#1A1A1A]'
                }`}
              >
                <span className="w-4 h-4 rounded bg-[#1A1A1A] text-white flex items-center justify-center shrink-0">
                  <Boxes className="w-2.5 h-2.5" />
                </span>
                <span className="truncate">Custom App</span>
              </button>
            </div>
          </div>

          {/* Bottom Settings Link */}
          <div className="pt-2 border-t border-[#DCDCDC]">
            <button
              type="button"
              onClick={() => setActiveCoreItem('settings')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeCoreItem === 'settings'
                  ? 'bg-[#FAFAFA] text-[#1A1A1A] font-semibold shadow-2xs'
                  : 'text-[#4A4A4A] hover:bg-[#E3E3E3] hover:text-[#1A1A1A]'
              }`}
            >
              <Settings className="w-4 h-4 text-[#616161] shrink-0" />
              <span>Settings</span>
            </button>
          </div>
        </aside>

        {/* Empty Embedded App Viewport (No scroll, pure empty container) */}
        <main
          id="app-root-viewport"
          className="flex-1 h-full w-full bg-[#F1F1F1] overflow-hidden relative"
        >
          {children}
        </main>
      </div>
    </div>
  );
};
