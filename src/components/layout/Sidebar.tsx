import { type ReactNode } from 'react';
import { Button } from './Button';

export type NavigationItem = {
  label: string;
  icon: ReactNode;
  href: string;
  isActive?: boolean;
};

type SidebarProps = {
  title: string;
  logo: ReactNode;
  items: NavigationItem[];
  onNavigate: (href: string) => void;
};

export const Sidebar = ({ title, logo, items, onNavigate }: SidebarProps) => {
  return (
    <aside className="flex w-[16rem] flex-col border-r border-gray-200 bg-gray-50">
      <div className="flex h-[4rem] items-center gap-2 border-b border-gray-200 px-relaxed">
        {logo}
        <span className="text-lg font-semibold text-gray-900">{title}</span>
      </div>
      <nav className="flex-1 space-y-1 py-relaxed px-normal">
        {items.map((item) => {
          return (
            <Button
              key={item.href}
              variant="tertiary"
              text={item.label}
              icon={item.icon}
              format="iconThenText"
              className={item.isActive ? 'bg-indigo-50 text-indigo-700' : ''}
              onClick={() => onNavigate(item.href)}
            />
          );
        })}
      </nav>
    </aside>
  );
};
