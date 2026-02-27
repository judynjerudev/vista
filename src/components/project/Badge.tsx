type BadgeVariant = 'neutral' | 'success' | 'warning' | 'info';

const variantStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-gray-50 text-gray-700 ring-gray-600/20',
  success: 'bg-green-50 text-green-700 ring-green-600/20',
  warning: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
};

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

export const Badge = ({ label, variant = 'neutral' }: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${variantStyles[variant]}`}
    >
      {label}
    </span>
  );
};
