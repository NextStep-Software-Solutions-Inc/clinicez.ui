import React from 'react';

// Props when condition is true
type TrueProps = {
  children: React.ReactNode;
};

// Props when condition is false
type FalseProps = {
  fallback: React.ReactNode;
};

// Component to render when condition is true
const IfTrue: React.FC<TrueProps> = ({ children }) => <>{children}</>;

// Component to render when condition is false
const IfFalse: React.FC<FalseProps> = ({ fallback }) => <>{fallback}</>;

// Main ConditionalRender component props
type ConditionalRenderProps = {
  condition: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

// Main ConditionalRender component
const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  condition,
  children,
  fallback = <Fallback />,
}) => {
  return condition ? <IfTrue>{children}</IfTrue> : <IfFalse fallback={fallback} />;
};

// Default fallback component
const Fallback = () => null;

export default ConditionalRender;