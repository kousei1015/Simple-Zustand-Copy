import { SetFunction } from "./types";

export const createStore = <T extends Record<string, unknown>>(
  initializeState: (set: SetFunction<T>) => T
) => {
  let state: T;
  const listeners = new Set<() => void>();

  const setState = (partial: (prevState: T) => Partial<T>) => {
    const newState = partial(state);
    if (newState !== state) {
      state = { ...state, ...newState };
      debugger
      listeners.forEach((listener) => listener());
    }
  };

  const getState = () => state;

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);

    return () => listeners.delete(listener);
  };

  const storeApi = { setState, getState, subscribe };
  state = initializeState(setState);
  return storeApi;
};

export default createStore;
