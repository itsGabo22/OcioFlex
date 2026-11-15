export type DeepStr<T> = { [K in keyof T]: T[K] extends string ? string : DeepStr<T[K]> };
