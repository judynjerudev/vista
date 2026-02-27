import { Notification as NotificationIcon } from '@carbon/icons-react';

import { Button } from './Button';

type HeaderProps = {
  title: string;
};

export const Header = ({ title }: HeaderProps) => {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-relaxed">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-small">
        <Button
          variant="tertiary"
          icon={<NotificationIcon size={20} className="text-gray-600" />}
          format="icon"
        />
        <div className="h-large w-large rounded-full bg-indigo-600 text-sm font-medium text-white flex items-center justify-center">
          JN
        </div>
      </div>
    </header>
  );
};
