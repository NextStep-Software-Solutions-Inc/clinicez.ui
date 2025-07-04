import React, { Children } from "react";

interface IEachProps<T> {
    of: T[];
    render: (item: T, index: number) => React.ReactNode;
    fallback?: React.ReactNode;
}
export default function Each<T>({of, render, fallback = <Fallback/>}: IEachProps<T>) {
  if(!of || !of.length) return <>{fallback}</>;
  return (
    <>
      {of.map((item, index) => (
        <React.Fragment key={(item as any).id ?? index}>
          {render(item, index)}
        </React.Fragment>
      ))}
    </>
  );
}

const Fallback = () => <div style={{
  width: "100%",
  display: "flex",
  justifyContent: "center",
  color: "gray",
}}>No items to show</div>