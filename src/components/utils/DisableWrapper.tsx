type DisableWrapperProps = {
    disabled?: boolean;
    children: React.ReactNode;
  };
  
const DisableWrapper: React.FC<DisableWrapperProps> = ({ disabled = false, children }) => {
  return (
    <div style={{ position: 'relative', padding: 10 }}>
      {children}
      {disabled && (
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.01)',
          cursor: 'not-allowed',
          zIndex: 2,
        }} />
      )}
    </div>
  );
};
  
export default DisableWrapper;