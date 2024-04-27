import React, { Children } from "react";

interface IEachProps<T> {
    of: T[];
    render: (item: T, index: number) => React.ReactNode;
    fallback?: React.ReactNode;
}
export default function Each<T>({of, render, fallback = <Fallback/>}: IEachProps<T>) {
  if(!of || !of.length) return <>{fallback}</>;
  return <>{Children.toArray(of.map(render))}</>;
}

const Fallback = () => <div style={{
  width: "100%",
  display: "flex",
  justifyContent: "center",
  color: "gray",
}}>No items to show</div>