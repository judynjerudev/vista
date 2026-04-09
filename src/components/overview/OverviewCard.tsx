import type { ReactNode } from "react";
import { ArrowRight as ArrowRightIcon } from "@carbon/icons-react";
import { Button } from "../layout/Button";

type OverviewCardProps = {
  title: string;
  children: ReactNode;
  onViewAll?: () => void;
};

export const OverviewCard = ({
  title,
  children,
  onViewAll,
}: OverviewCardProps) => {
  return (
    <div className="rounded-2xl border border-[#eae5dc] bg-white p-7 shadow-[0_2px_18px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(0,0,0,0.09)]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-small">
          <span
            className="h-1.5 w-1.5 rounded-full bg-amber-400"
            aria-hidden="true"
          />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
            {title}
          </h3>
        </div>
        {onViewAll && (
          <Button
            variant="tertiary"
            text="View all"
            format="textThenIcon"
            icon={<ArrowRightIcon size={14} />}
            className="gap-xsmall px-small py-xsmall text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            onClick={onViewAll}
          />
        )}
      </div>
      {children}
    </div>
  );
};
