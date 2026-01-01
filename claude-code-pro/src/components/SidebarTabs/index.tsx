/**
 * Sidebar Tab 切换组件
 */

import { clsx } from 'clsx';

export type SidebarTab = 'chat' | 'files';

interface SidebarTabsProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}

interface TabItem {
  id: SidebarTab;
  label: string;
  icon: string;
}

const tabs: TabItem[] = [
  { id: 'chat', label: '会话', icon: '💬' },
  { id: 'files', label: '文件', icon: '📁' },
];

export function SidebarTabs({ activeTab, onTabChange }: SidebarTabsProps) {
  return (
    <div className="flex gap-1 p-2 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={clsx(
            'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'bg-background-surface text-text-primary shadow-soft'
              : 'text-text-tertiary hover:text-text-primary hover:bg-background-hover'
          )}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
