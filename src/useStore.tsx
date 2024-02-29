import { create } from "./lib/index";

type Counter = {
  count: number;
  increase: () => void;
}

const useStore = create<Counter>((set) => ({
  count: 0,
  increase: () => set((state) => ({ count: state.count + 1 })),
}));

export default useStore;