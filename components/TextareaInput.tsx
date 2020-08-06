import React from "react";
import TextareaAutosize from "react-textarea-autosize";

import styles from "./TextareaInput.module.css";

interface Props {
  maxRows: number;
  minRows: number;
  onChange: (e: any) => void;
  value: string;
}

const TextareaInput = React.forwardRef(
  (props: Props, ref: React.Ref<HTMLTextAreaElement>) => {
    return (
      <TextareaAutosize className={styles.textInput} ref={ref} {...props} />
    );
  }
);

export default TextareaInput;
