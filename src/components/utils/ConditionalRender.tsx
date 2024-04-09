type ConditionalRenderProps = {
    condition: boolean;
    children: React.ReactNode;
    fallback?: React.ReactNode;
  };
  
const ConditionalRender: React.FC<ConditionalRenderProps> = ({ condition, children, fallback = <Fallback/> }) => {
  return <>{condition ? children : null}</>;
};
  
export default ConditionalRender;

const Fallback = () => <div>No content provided</div>;