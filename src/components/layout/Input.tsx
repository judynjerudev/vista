import type { ComponentProps } from "react";

type InputProps = {
  label: string;
} & ComponentProps<"input">;

export const Input = ({ label, id, className = "", ...rest }: InputProps) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        className={`mt-xsmall block w-full rounded-md border border-gray-300 px-normal py-small text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none ${className}`}
        {...rest}
      />
    </div>
  );
};
