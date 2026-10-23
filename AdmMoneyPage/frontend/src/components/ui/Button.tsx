import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'amber' | 'danger';
  icon?: React.ReactNode;
  hasArrow?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  icon,
  hasArrow = false,
  children,
  className = '',
  ...props
}) => {
  const variantClass = `btn-${variant}`;

  return (
    <button className={`btn ${variantClass} ${className}`} {...props}>
      {icon && <span className="btn-icon">{icon}</span>}
      <span>{children}</span>
      {hasArrow && (
        <span className="btn-nested-icon">
          <ArrowUpRight size={14} />
        </span>
      )}
    </button>
  );
};
