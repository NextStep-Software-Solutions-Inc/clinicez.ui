"use client";

import { useState, useEffect } from 'react';

// Create a map to store the state for each key
const stateMap = new Map<string, unknown>();

// Create a map to store the listeners for each key (typed as unknown internally)
const listenerMap = new Map<string, ((state: unknown) => void)[]>();

export function useLocalStorage<T extends Record<string, unknown>>(key: string, initialValue?: T) {
  // Get the initial state from local storage or use the provided initial value
  const [state, setState] = useState<T>(() => {
    const storedValue = window.localStorage.getItem(key);
    return initialValue ?? JSON.parse(storedValue ?? "{}");
  });

  // When the state changes, update local storage and notify all listeners
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(state));
    const listeners = listenerMap.get(key) || [];
    (listeners as ((s: T) => void)[]).forEach((listener) => listener(state));
  }, [key, state]);

  // When the component mounts, add it to the listeners for the key
  useEffect(() => {
    if (!listenerMap.has(key)) {
      listenerMap.set(key, []);
    }
    const typedListener = (s: unknown) => setState(s as T);
    listenerMap.get(key)!.push(typedListener);
    // When the component unmounts, remove it from the listeners for the key
    return () => {
      const listeners = listenerMap.get(key);
      if (!listeners) return;
      const idx = listeners.indexOf(typedListener);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, [key]);

  // Return the state and a function to update it
  const setStateAndPublish = (newState: T) => {
    const combinedState = { ...state, ...newState } as T;
    stateMap.set(key, combinedState);
    setState(combinedState);
  };

  return [state, setStateAndPublish] as const;
}