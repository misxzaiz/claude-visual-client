/**
 * 基础布局组件
 */

import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

interface HeaderProps {
  title: string;
  children?: ReactNode;
}

interface SidebarProps {
  children: ReactNode;
  className?: string;
}

interface MainProps {
  children: ReactNode;
  className?: string;
}

/** 主布局容器 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {children}
    </div>
  );
}

/** 头部 */
export function Header({ title, children }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background-secondary">
      <h1 className="text-lg font-semibold">{title}</h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
}

/** 侧边栏 */
export function Sidebar({ children, className = '' }: SidebarProps) {
  return (
    <aside className={`flex flex-col w-64 border-r border-border bg-background-secondary ${className}`}>
      {children}
    </aside>
  );
}

/** 主内容区 */
export function Main({ children, className = '' }: MainProps) {
  return (
    <main className={`flex-1 flex flex-col overflow-hidden ${className}`}>
      {children}
    </main>
  );
}
