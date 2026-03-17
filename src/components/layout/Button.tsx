import type { ComponentProps, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
type ButtonFormat = 'icon' | 'text' | 'iconThenText' | 'textThenIcon';

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  secondary:
    'border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900',
  tertiary: 'bg-transparent text-gray-700 hover:bg-gray-100',
};

type ButtonProps = {
  variant: ButtonVariant;
  text?: string;
  icon?: ReactNode;
  format?: ButtonFormat;
} & Omit<ComponentProps<'button'>, 'children'>;

export const Button = ({
  variant,
  type = 'button',
  text,
  icon,
  format = 'text',
  disabled = false,
  className = '',
  ...rest
}: ButtonProps) => {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        'focusable flex items-center gap-normal rounded-md px-normal py-small text-sm font-medium',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        variantStyles[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {format === 'icon' && icon}
      {format === 'text' && text}
      {format === 'iconThenText' && (
        <>
          {icon}
          {text}
        </>
      )}
      {format === 'textThenIcon' && (
        <>
          {text}
          {icon}
        </>
      )}
    </button>
  );
};
