import { MMKV } from "react-native-mmkv";

export const userMMKV = new MMKV();

export const saveUserToMMKV = (user: any) => {
  userMMKV.set("userData", JSON.stringify(user));
};

export const getUserFromMMKV = () => {
  const raw = userMMKV.getString("userData");
  return raw ? JSON.parse(raw) : null;
};

export const clearUserFromMMKV = () => {
  userMMKV.delete("userData");
};
