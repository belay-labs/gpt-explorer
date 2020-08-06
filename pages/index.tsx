// EXTERNAL IMPORTS
import { assign, concat, map } from "lodash";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { Button, Dimmer, Loader, Sidebar } from "semantic-ui-react";

// INTERNAL IMPORTS
import Explorer from "../components/Explorer";
import HistoryDrawer from "../components/HistoryDrawer";
import Toasts, { useToasts } from "../components/Toasts";
import db, {
  CompletionRequest,
  SharedCompletionRequest,
  COMPLETION_REQUESTS,
  SHARED_COMPLETION_REQUESTS,
} from "../lib/db";
import { auth, User } from "../lib/firebase";
import privateRoute from "../lib/privateRoute";
import {
  ANNOTATION_MODE,
  DEVELOP_MODE,
  HISTORY_MODE,
  KEY_ESC,
} from "../lib/shortcuts";

import styles from "./index.module.css";

interface Props {
  user: User;
  sharedRequest?: SharedCompletionRequest;
}

export function Home({ user, sharedRequest }: Props) {
  const router = useRouter();

  // Data states
  const [recentRequests, setRecentRequests] = useState<
    Array<CompletionRequest>
  >([]);
  const [initialRequest, setInitialRequest] = useState<
    CompletionRequest | SharedCompletionRequest | undefined
  >(sharedRequest);

  // Component states
  const [toasts, addToast] = useToasts();
  const [mode, setMode] = useState<string>(DEVELOP_MODE);
  const [historyLoading, setHistoryLoading] = useState(true);

  const getRecentRequests = async () => {
    try {
      const completionRequestsRef = db
        .collection(COMPLETION_REQUESTS)
        .where("userId", "==", user.uid)
        .orderBy("createdAt", "desc");

      const querySnapshot = await completionRequestsRef.get();
      setRecentRequests(
        map(
          querySnapshot.docs,
          (doc) => assign(doc.data(), { id: doc.id }) as CompletionRequest
        )
      );
    } catch (err) {
      // TODO(cathykc): log error
      console.error(err);
    }
    setHistoryLoading(false);
  };

  useEffect(() => {
    getRecentRequests();

    if (sharedRequest) {
      router.push("/", undefined, { shallow: true });
      addToast({
        key: "shared-request-loaded",
        content: `Loaded settings from shared completion: ${sharedRequest.id}`,
        info: true,
      });
    }
  }, []);

  useEffect(() => {
    const keyListener = (e: KeyboardEvent) => {
      switch (e.keyCode) {
        case KEY_ESC:
          if (mode !== ANNOTATION_MODE) toggleHistoryDevelop();
          break;
      }
    };
    document.addEventListener("keydown", keyListener);

    return () => {
      document.removeEventListener("keydown", keyListener);
    };
  }, [mode]);

  const toggleHistoryDevelop = () => {
    setMode(mode === HISTORY_MODE ? DEVELOP_MODE : HISTORY_MODE);
  };

  const setDevelopMode = () => {
    if (mode !== DEVELOP_MODE) setMode(DEVELOP_MODE);
  };

  const appendResult = (result: CompletionRequest) => {
    setRecentRequests(concat([result], recentRequests));
  };

  const updateResults = (newResult: CompletionRequest) => {
    const updatedRequests = map(recentRequests, (req: CompletionRequest) => {
      if (req.id === newResult.id) {
        return assign(req, newResult);
      } else {
        return req;
      }
    });
    setRecentRequests(updatedRequests);
  };

  const populateRun = (recentRun: CompletionRequest) => {
    setMode(DEVELOP_MODE);
    setInitialRequest(recentRun);
  };

  const signOut = () => auth.signOut();

  return (
    <div className={styles.root}>
      <Toasts toasts={toasts} />
      <Sidebar.Pushable className={styles.sidebarContainer}>
        <Sidebar
          animation="overlay"
          className={styles.sidebar}
          direction="right"
          onHide={setDevelopMode}
          visible={mode === HISTORY_MODE}
        >
          <Dimmer active={historyLoading} inverted={true}>
            <Loader />
          </Dimmer>
          <HistoryDrawer
            handlePopulateRun={populateRun}
            handleUpdateRequest={updateResults}
            mode={mode}
            recentRequests={recentRequests}
          />
        </Sidebar>
        <Sidebar.Pusher className={styles.explorer}>
          <div className={styles.header}>
            <Button
              basic={true}
              onClick={toggleHistoryDevelop}
              primary={true}
              size="small"
            >
              {mode === HISTORY_MODE ? "Hide" : "Show"} history{" "}
              <strong>[Esc]</strong>
            </Button>
            <Button
              basic={true}
              className={styles.signOut}
              content="Sign out"
              icon="log out"
              labelPosition="left"
              onClick={signOut}
              size="small"
            />
          </div>
          <Explorer
            initialRequest={initialRequest || recentRequests[0]}
            handleNewRequest={appendResult}
            handleUpdateRequest={updateResults}
            mode={mode}
            setMode={setMode}
            user={user}
          />
        </Sidebar.Pusher>
      </Sidebar.Pushable>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { query } = context;
  try {
    if (query.sharedId) {
      const data = await db
        .collection(SHARED_COMPLETION_REQUESTS)
        .doc(query.sharedId as string)
        .get();

      if (!data.exists) throw new Error("Can't find document");

      const sharedRequest = data.data();
      delete sharedRequest?.output;

      return {
        props: { sharedRequest: { ...sharedRequest, id: query.sharedId } },
      };
    }
  } catch (err) {
    console.error(err);
  }

  return { props: {} };
};

export default privateRoute(Home);
