import { ReactNode } from "react";

import styles from "./TwoColumnLayout.module.css";

interface Props {
  leftChildren: ReactNode;
  rightChildren: ReactNode;
}

const TwoColumnLayout = ({ leftChildren, rightChildren }: Props) => {
  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <div className={styles.leftColumn}>{leftChildren}</div>
        <div className={styles.rightColumn}>{rightChildren}</div>
      </div>
    </div>
  );
};

export default TwoColumnLayout;
