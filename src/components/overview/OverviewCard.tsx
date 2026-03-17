import type { ReactNode } from 'react';
import { ArrowRight as ArrowRightIcon } from '@carbon/icons-react';
import { Button } from '../layout/Button';

type OverviewCardProps = {
  title: string;
  children: ReactNode;
  onViewAll?: () => void;
};

export const OverviewCard = ({ title, children, onViewAll }: OverviewCardProps) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-relaxed">
      <div className="mb-normal flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {onViewAll && (
          <Button
            variant="tertiary"
            text="View all"
            format="textThenIcon"
            icon={<ArrowRightIcon size={16} />}
            className="text-sm text-indigo-600 hover:text-indigo-700"
            onClick={onViewAll}
          />
        )}
      </div>
      {children}
    </div>
  );
};
