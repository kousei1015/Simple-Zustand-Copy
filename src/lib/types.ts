export type SetFunction<T> = (updater: (prev: T) => Partial<T>) => void;