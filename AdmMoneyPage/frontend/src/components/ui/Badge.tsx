import React from 'react';

export interface BadgeProps {
  variant?: 'emerald' | 'amber' | 'purple' | 'cyan' | 'gray' | 'rose' | 'brand' | 'terracotta' | 'caramel' | 'sage' | 'rust';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'emerald',
  children,
  icon,
  className = '',
  style
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`} style={style}>
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
};
