# Understanding-Zustand-Rerenders

Zustand はどのように再レンダリングを最適化させているのかを調べてみたのですが、それをアウトプットしたいと思い、Zustand を簡易的に再現したものを作ってみました。とはいっても、React18 が登場し、concurrent feature が導入される前、つまり Tearing 問題が起きる前の Zustand を再現しています。おそらく、100 行程度のもの(型の情報を除くと 70 行程度)ですが、自分用のメモとして Github に挙げておきます。

Subscription のデザインパターンを採用しており、再レンダリングを最適化しています。以下がそのコードです。一応、create関数に適切なGenericsを渡せば型の補完を出るように作成しましたが、見にくくなるため型の情報は省いています。

```
import { useEffect, useReducer, useRef } from "react";
import createStore from "./createStore";

export const create = (
  initializeState
) => {
  const storeApi = createStore(initializeState);

  const useStore = (
    selector
  ) => {
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const currentSliceRef = useRef();
    const selectorRef = useRef(selector);

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
```
以下は上記のコードで呼び出しているcreateStore関数の詳細
```
export const createStore = (
  initializeState
) => {
  let state;
  const listeners = new Set();

  const setState = (partial) => {
    const newState = partial(state);
    if (newState !== state) {
      state = { ...state, ...newState };
      listeners.forEach((listener) => listener());
    }
  };

  const getState = () => state;

  const subscribe = (listener) => {
    listeners.add(listener);

    return () => listeners.delete(listener);
  };

  const api = { getState, subscribe };
  state = initializeState(setState);
  return api;
};

export default createStore;
```

これでZustandを模擬的に再現できました。この簡易的な状態管理を行うコードはほとんどZustandと同じように使えます。

```
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
```
以上のcreate関数を用いることでストアを生成し、
```
import useStore from "./useStore"
const App = () => {
  const count = useStore((state) => (state.count))
  console.log("count")
  return (
    <div>{count} </div>
  )
}

export default App
```

```
import useStore from "./useStore";
const Increment = () => {
  console.log("Increment");
  const increment = useStore((state) => state.increase);
  return <div onClick={increment}>Increment</div>;
};

export default Increment;
```

以上のようにストアの値を取得できます。
もちろん、際レンダリングを最適化させているのでIncrementコンポーネントのincrement関数を呼び出しても、**Incrementコンポーネントは再レンダリングせず、Countコンポーネントのみが再レンダリングされます**

どのように際レンダリングを最適化させているかをざっくりと説明します。
1. useStoreを呼び出した各々のコンポーネントでuseEffectの処理が走る際、listener関数を、createStore関数のsetオブジェクトに登録します。
2. set関数が走ったタイミング(上記の場合でいうincrement関数が走ったタイミング)でsetオブジェクトに登録した関数を一つずつ実行させます。
3. その関数は、厳密等価演算子(「===」)を用いて、以前のデータと異なる場合はforceUpdate関数で強制的に再レンダリングを引き起こし、逆に以前のデータと同じ場合は、スキップします(ちなみに、私が確認した限り、Zustandはデフォルト状態の場合、厳密等価演算子ではなく[「Object.is」](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Object/is)関数を使っています。)

このような流れで際レンダリングを最適化させています。もっと詳細に知りたい場合は、このレポジトリのlibフォルダ配下のcreateStore.tsxファイルやindex.tsxファイルの適当な部分にdebuggerを追加して、挙動を一つずつ確認してみてください。