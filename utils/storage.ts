// storage.ts
import { MMKV } from "react-native-mmkv";

export const storage = new MMKV();

export const zustandStorage = {
  getItem: (name: string) => storage.getString(name) || null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
};
