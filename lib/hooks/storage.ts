import { useEffect, useState } from "react";

export const useStorageBoolState = (
  storageKey: string
): [boolean, (arg: boolean) => void] => {
  const [setting, setSetting] = useState(
    localStorage.getItem(storageKey) === "true"
  );

  useEffect(() => {
    localStorage.setItem(storageKey, setting.toString());
  }, [setting]);

  return [setting, setSetting];
};

export const useStorageState = (
  storageKey: string
): [string, (arg: string) => void] => {
  const [setting, setSetting] = useState(
    localStorage.getItem(storageKey) || ""
  );

  useEffect(() => {
    localStorage.setItem(storageKey, setting);
  }, [setting]);

  return [setting, setSetting];
};
