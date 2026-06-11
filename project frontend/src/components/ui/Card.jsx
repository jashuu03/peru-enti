import React from 'react';

const Card = ({ children, className = '', hoverEffect = true }) => {
  return (
    <div
      className={`glass-panel p-6 rounded-xl flex flex-col ${
        hoverEffect ? 'glass-panel-hover' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
