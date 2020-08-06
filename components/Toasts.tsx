import { assign, compact, concat, filter, map } from "lodash";
import { useState } from "react";
import { Message } from "semantic-ui-react";

import styles from "./Toasts.module.css";

interface Toast {
  key: string;
  content: string;
  info?: boolean;
  expired?: boolean;
}

export const useToasts = (): [Array<Toast>, (toast: Toast) => void] => {
  const [toasts, setToasts] = useState<Array<Toast>>([]);

  const addToast = (toast: Toast) => {
    setToasts((toasts) => concat(toasts, toast));
    setTimeout(() => {
      setToasts((toasts) => {
        // Set toast to expired
        const newToasts = map(toasts, (t: Toast) => {
          if (t.key === toast.key) return assign(t, { expired: true });
          if (!t.expired) return t;
        });

        return compact(newToasts);
      });

      // Clean up expired toast
      setTimeout(() => {
        setToasts((toasts) =>
          filter(toasts, (t: Toast) => t.key !== toast.key)
        );
      }, 100);
    }, 3000);
  };

  return [toasts, addToast];
};

interface Props {
  toasts: Array<Toast>;
}

const Toasts = ({ toasts }: Props) => {
  return (
    <div className={styles.toasts}>
      {map(toasts, (toast) => {
        return (
          <Message
            className={`${toast.expired && styles.expired}`}
            floating={true}
            size="small"
            {...toast}
          />
        );
      })}
    </div>
  );
};

export default Toasts;
