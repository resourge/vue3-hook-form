const formStore = new Map<symbol, unknown>();

export function usePersistState<T>(){
    return {
        get: (key: symbol) => formStore.get(key) as T,
        set: (key: symbol, value: T) => formStore.set(key, value)
    };
}