// EXTERNAL IMPORTS
import copy from "copy-to-clipboard";
import { map } from "lodash";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { Button, Icon, Label } from "semantic-ui-react";
import { FixedSizeList } from "react-window";

// INTERNAL IMPORTS
import { URL } from "../lib/constants";
import firebase from "../lib/firebase";
import db, {
  COMPLETION_REQUESTS,
  SHARED_COMPLETION_REQUESTS,
  CompletionRequest,
  SharedCompletionRequest,
  shareCompletionRequest,
} from "../lib/db";
import { useStateTimeout, useWindowSize } from "../lib/hooks";
import {
  HISTORY_MODE,
  KEY_ENTER,
  KEY_DOWN,
  KEY_J,
  KEY_K,
  KEY_UP,
} from "../lib/shortcuts";
import { getOutputText } from "../lib/utils";

import styles from "./HistoryDrawer.module.css";

interface Props {
  handlePopulateRun: (recentRun: CompletionRequest) => void;
  handleUpdateRequest: (newResult: any) => void;
  mode: string;
  recentRequests: Array<CompletionRequest>;
}

const HistoryDrawer = ({
  handlePopulateRun,
  handleUpdateRequest,
  mode,
  recentRequests,
}: Props) => {
  const [selectedRunIdx, setSelectedRunIdx] = useState(0);

  const [justCopiedId, setJustCopiedId] = useStateTimeout<string>("", 1500);
  const [currSharingId, setCurrSharingId] = useState<string>("");
  const [currUnsharingId, setCurrUnsharingId] = useState<string>("");
  const { height, width } = useWindowSize();

  const listRef = useRef<FixedSizeList | null>(null);
  const historyRef = useRef<Array<HTMLElement>>([]);

  useEffect(() => {
    const keyListener = (e: KeyboardEvent) => {
      const maybeScroll = (idx: number) => {
        const historyItem = historyRef.current[idx];
        const { bottom, top } = historyItem.getBoundingClientRect();

        if (bottom > window.innerHeight || top < 0) {
          listRef.current!.scrollToItem(idx, "center");
        }
      };

      setSelectedRunIdx((selectedRunIdx) => {
        switch (e.keyCode) {
          case KEY_DOWN:
          case KEY_J:
            if (selectedRunIdx !== recentRequests.length - 1) {
              const newIdx = selectedRunIdx + 1;
              maybeScroll(newIdx);
              return newIdx;
            }
            break;
          case KEY_UP:
          case KEY_K:
            if (selectedRunIdx !== 0) {
              const newIdx = selectedRunIdx - 1;
              maybeScroll(newIdx);
              return newIdx;
            }
            break;
          case KEY_ENTER:
            handlePopulateRun(recentRequests[selectedRunIdx]);
            break;
        }
        return selectedRunIdx;
      });
    };

    if (mode === HISTORY_MODE) {
      document.addEventListener("keydown", keyListener);
    } else {
      document.removeEventListener("keydown", keyListener);
    }

    return () => {
      document.removeEventListener("keydown", keyListener);
    };
  }, [mode]);

  const handleClickRun = (idx: number) => {
    setSelectedRunIdx(idx);
    handlePopulateRun(recentRequests[idx]);
  };

  const handleCopyShareLink = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: string,
    shareId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const copied = copy(`${URL}p/${shareId}`);
    if (copied) setJustCopiedId(id);
  };

  const makeCompletionPrivate = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    doc: CompletionRequest
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setCurrUnsharingId(doc.id!);

    try {
      await db
        .collection(SHARED_COMPLETION_REQUESTS)
        .doc(doc.sharedId)
        .delete();

      await db
        .collection(COMPLETION_REQUESTS)
        .doc(doc.id)
        .update({ sharedId: firebase.firestore.FieldValue.delete() });

      handleUpdateRequest({ id: doc.id, sharedId: null });
    } catch (err) {
      console.log(err);
      // TODO(cathykc): Display error message
    }

    setCurrUnsharingId("");
  };

  const shareCompletion = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    doc: CompletionRequest
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setCurrSharingId(doc.id!);

    const sharedCompletionRequest: SharedCompletionRequest = {
      editorContent: doc.editorContent || null,
      output: doc.output,
      prompt: doc.prompt,
      settings: doc.settings,
    };

    try {
      const sharedId = await shareCompletionRequest(
        doc.id!,
        sharedCompletionRequest
      );

      handleUpdateRequest({ id: doc.id, sharedId });
      handleCopyShareLink(e, doc.id!, sharedId);
    } catch (err) {
      console.log(err);
      // TODO(cathykc): Display error message
    }

    setCurrSharingId("");
  };

  const settingRow = (label: string, settingValue: string | number) => (
    <div className={styles.settingRow} key={label}>
      <div>{label}</div>
      <Label horizontal>{settingValue}</Label>
    </div>
  );

  return (
    <div>
      <div className={styles.historyHeader}>
        <div className={styles.promptCol}>Prompt</div>
        <div className={styles.outputCol}>Output</div>
        <div className={styles.settingsCol}>Settings</div>
        <div className={styles.notesCol}>Notes</div>
        <div className={styles.actionCol} />
      </div>
      <FixedSizeList
        className={styles.list}
        height={height - 30}
        itemCount={recentRequests.length}
        itemSize={180}
        ref={listRef}
        width={Math.min(1000, 0.9 * width)}
      >
        {({ index, style }) => {
          const {
            annotations,
            createdAt,
            id,
            prompt,
            output,
            settings,
            sharedId,
          } = recentRequests[index];

          const {
            maxTokens,
            stop,
            temperature,
            frequencyPenalty,
            presencePenalty,
            languageEngine,
          } = settings;
          return (
            <div
              onClick={() => handleClickRun(index)}
              ref={(el) => {
                if (el) historyRef.current[index] = el;
              }}
              style={style}
            >
              <div
                className={styles.row}
                style={{
                  borderLeft:
                    index === selectedRunIdx ? "4px solid #334E68" : "none",
                }}
              >
                <div className={styles.promptCol}>
                  <div className={styles.lineClamp4}>{prompt}</div>
                  <Label
                    basic={true}
                    content={
                      createdAt.seconds
                        ? moment.unix(createdAt.seconds).format("MMM D, h:mm A")
                        : "--"
                    }
                    icon="clock outline"
                    size="tiny"
                  />
                </div>
                <div className={`${styles.lineClamp6} ${styles.outputCol}`}>
                  {!!output.error && <Icon name="attention" />}
                  {getOutputText(output)}
                </div>
                <div className={styles.settingsCol}>
                  {map(
                    [
                      ["maxTokens", maxTokens],
                      ["stop", stop],
                      ["temp", temperature],
                      ["freqPenalty", frequencyPenalty],
                      ["presPenalty", presencePenalty],
                      ["engine", languageEngine],
                    ],
                    (setting: [string, any]) => settingRow(...setting)
                  )}
                </div>
                <div className={styles.notesCol}>{annotations?.note}</div>
                <div className={styles.actionCol}>
                  {sharedId ? (
                    <>
                      <Button
                        basic={true}
                        compact={true}
                        color={justCopiedId === id ? "green" : undefined}
                        content={justCopiedId === id ? "Copied!" : "Copy link"}
                        onClick={(e) => handleCopyShareLink(e, id!, sharedId)}
                        size="mini"
                        style={{ marginBottom: "5px", width: "90px" }}
                      />
                      <Button
                        basic={true}
                        compact={true}
                        content="Make private"
                        loading={currUnsharingId === id}
                        onClick={(e) =>
                          makeCompletionPrivate(e, recentRequests[index])
                        }
                        size="mini"
                        style={{ width: "90px" }}
                      />
                    </>
                  ) : (
                    <Button
                      basic={true}
                      compact={true}
                      content="Share"
                      loading={currSharingId === id}
                      onClick={(e) => shareCompletion(e, recentRequests[index])}
                      size="mini"
                      style={{ width: "90px" }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        }}
      </FixedSizeList>
    </div>
  );
};

export default HistoryDrawer;
