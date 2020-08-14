// EXTERNAL IMPORTS
import { Button, Icon } from "semantic-ui-react";
import { useState } from "react";

// INTERNAL IMPORTS
import privateRoute from "../lib/privateRoute";
import db, { COMPLETION_REQUESTS } from "../lib/db";
import { User } from "../lib/firebase";

import styles from "./export.module.css";

interface Props {
  user: User;
}

export function Export({ user }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);

    const documents = await db
      .collection(COMPLETION_REQUESTS)
      .where("userId", "==", user.uid)
      .get();
    let data: any = [];
    documents.forEach((doc) => data.push(doc.data()));

    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const downloadElement = document.createElement("a");
    downloadElement.href = url;
    downloadElement.style.display = "none";

    const dateString = new Date().toLocaleString("en-US");
    downloadElement.download = `Explorer-${dateString}.json`;

    document.body.appendChild(downloadElement);
    downloadElement.click();
    document.body.removeChild(downloadElement);

    setLoading(false);
  };

  return (
    <div className={styles.root}>
      <h1>Export data</h1>
      <Button
        icon={true}
        labelPosition="left"
        loading={loading}
        onClick={handleExport}
        primary={true}
      >
        <Icon name="pause" />
        Download history (.json)
      </Button>
      <div className={styles.otherFormat}>
        Want a different format (e.g. CSV)? Email{" "}
        <strong>data@belaylabs.com</strong>.
      </div>
    </div>
  );
}

export default privateRoute(Export);
