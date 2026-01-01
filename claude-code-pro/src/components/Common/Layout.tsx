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

interface AsideProps {
  children: ReactNode;
  className?: string;
}

/** 主布局容器 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background-base">
      {children}
    </div>
  );
}

/** 头部 */
export function Header({ title, children }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 h-14 bg-background-elevated border-b border-border shrink-0">
      <h1 className="text-base font-semibold text-text-primary">{title}</h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
}

/** 左侧边栏 - 扩展到 220px 以容纳工作区 */
export function Sidebar({ children, className = '' }: SidebarProps) {
  return (
    <aside className={`flex flex-col w-[220px] bg-background-elevated border-r border-border shrink-0 ${className}`}>
      {children}
    </aside>
  );
}

/** 主内容区 */
export function Main({ children, className = '' }: MainProps) {
  return (
    <main className={`flex-1 flex overflow-hidden bg-background-base ${className}`}>
      {children}
    </main>
  );
}

/** 右侧面板 */
export function Aside({ children, className = '' }: AsideProps) {
  return (
    <aside className={`flex flex-col w-[280px] bg-background-elevated border-l border-border shrink-0 ${className}`}>
      {children}
    </aside>
  );
}
