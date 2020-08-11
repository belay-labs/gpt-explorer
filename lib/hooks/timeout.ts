import { useState } from "react";

export function useStateTimeout<T>(
  revertVal: T,
  seconds: number
): [T, (arg: T) => void] {
  const [val, setVal] = useState<T>(revertVal);

  const setRevertTimeout = (newVal: T) => {
    setVal(newVal);
    setTimeout(() => setVal(revertVal), seconds);
  };

  return [val, setRevertTimeout];
}
