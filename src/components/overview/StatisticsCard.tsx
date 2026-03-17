type StatVariant = 'default' | 'active' | 'blocked' | 'completed';

const variantStyles: Record<StatVariant, string> = {
  default: 'border-gray-200',
  active: 'border-l-4 border-l-blue-500 border-gray-200',
  blocked: 'border-l-4 border-l-red-500 border-gray-200',
  completed: 'border-l-4 border-l-green-500 border-gray-200',
};

type StatisticsCardProps = {
  label: string;
  value: number;
  variant?: StatVariant;
};

export const StatisticsCard = ({ label, value, variant = 'default' }: StatisticsCardProps) => {
  return (
    <div className={`rounded-lg border bg-white p-relaxed ${variantStyles[variant]}`}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-xsmall text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
};
