import type { ReactNode } from 'react';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import type { NavigationItem } from './Sidebar';

type LayoutProps = {
  children: ReactNode;
  title: string;
  sidebarTitle: string;
  sidebarLogo: ReactNode;
  navigationItems: NavigationItem[];
  onNavigate: (href: string) => void;
};

export const Layout = ({
  children,
  title,
  sidebarTitle,
  sidebarLogo,
  navigationItems,
  onNavigate,
}: LayoutProps) => {
  return (
    <div className="flex h-screen bg-[#0e0e11]">
      <Sidebar title={sidebarTitle} logo={sidebarLogo} items={navigationItems} onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-y-hidden rounded-l-2xl bg-[#f5f4ef]">
        <Header title={title} />
        <main className="flex-1 overflow-auto p-relaxed">{children}</main>
      </div>
    </div>
  );
};
