import { type ReactNode } from 'react';

import { Sidebar, type NavigationItem } from './Sidebar';
import { Header } from './Header';

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
    <div className="flex h-screen bg-white">
      <Sidebar title={sidebarTitle} logo={sidebarLogo} items={navigationItems} onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-relaxed">{children}</main>
      </div>
    </div>
  );
};
