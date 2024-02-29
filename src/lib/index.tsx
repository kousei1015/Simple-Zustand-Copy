import { useEffect, useReducer, useRef } from "react";
import createStore from "./createStore";
import { SetFunction } from "./types";

export const create = <T extends Record<string, unknown>>(
  initializeState: (set: SetFunction<T>) => T
) => {
  const storeApi = createStore<T>(initializeState);

  const useStore = <K extends keyof T, ReturnType = T[K]>(
    selector: (state: T) => ReturnType
  ): ReturnType => {
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const currentSliceRef = useRef<ReturnType | undefined>();
    const selectorRef = useRef<(state: T) => ReturnType>(selector);

    const state = storeApi.getState();
    if (currentSliceRef.current === undefined) {
      currentSliceRef.current = selector(state);
    }

    useEffect(() => {
      const listener = () => {
        const nextStateSlice = selectorRef.current(storeApi.getState());
        if (!(currentSliceRef.current === nextStateSlice)) {
          currentSliceRef.current = nextStateSlice;
          forceUpdate();
        }
      };

      const unsubscribe = storeApi.subscribe(listener);

      return unsubscribe;
    }, []);

    return currentSliceRef.current;
  };

  return useStore;
};

export default create;
