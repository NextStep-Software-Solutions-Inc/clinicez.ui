import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useIsClient() {
  return useSyncExternalStore(noopSubscribe, getClientSnapshot, getServerSnapshot);
}
