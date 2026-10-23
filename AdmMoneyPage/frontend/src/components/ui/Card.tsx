import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  innerClassName = '',
  style,
  onClick
}) => {
  return (
    <div className={`double-bezel-card ${className}`} style={style} onClick={onClick}>
      <div className={`card-inner ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
};
