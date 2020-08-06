// EXTERNAL IMPORTS
import moment from "moment";
import { GetServerSideProps } from "next";
import NextError from "next/error";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, Form, Label } from "semantic-ui-react";

// INTERNAL IMPORTS
import {
  DEFAULT_ENGINE,
  DEFAULT_FREQ,
  DEFAULT_MAX_TOKEN,
  DEFAULT_PRES,
  DEFAULT_STOP,
  DEFAULT_TEMP,
} from "../../lib/constants";
import db, {
  SharedCompletionRequest,
  SHARED_COMPLETION_REQUESTS,
} from "../../lib/db";
import { getOutputText, nullDefault } from "../../lib/utils";
import PrettyCode from "../../components/PrettyCode";

import styles from "./shared.module.css";

interface Props {
  completion: SharedCompletionRequest;
  sharedId: string;
  error: string;
}

const Shared = ({ completion, sharedId }: Props) => {
  if (!completion) return <NextError statusCode={404} />;

  const { prompt, output, settings } = completion;

  const outputTextRef = useRef<HTMLSpanElement>(null);
  const [outputOffset, setOutputOffset] = useState(0);
  const [showResponse, setShowResponse] = useState(false);

  useEffect(() => {
    if (outputTextRef?.current?.offsetTop) {
      setOutputOffset(outputTextRef?.current?.offsetTop - 15);
    }
  }, [outputTextRef?.current?.offsetTop]);

  const renderExplorerBtn = (emphasis = false) => (
    <Link href={`/?sharedId=${sharedId}`} passHref>
      <Button
        as="a"
        compact={true}
        content="Try it in Explorer"
        icon="external"
        labelPosition="right"
        secondary={emphasis}
        size="small"
        target="_blank"
      />
    </Link>
  );

  const {
    frequencyPenalty,
    languageEngine,
    maxTokens,
    presencePenalty,
    stop,
    temperature,
  } = settings;

  return (
    <div className={styles.root}>
      <div className={styles.intro}>
        <div>{moment.unix(output.created).format("LLL")}</div>
        {renderExplorerBtn(true)}
      </div>
      <div className={styles.display}>
        <div className={styles.displayHeaders}>
          <div className={styles.displayHeader}>
            <Label color="green">Prompt</Label>
          </div>
          <div
            className={styles.displayHeader}
            style={{ marginTop: `${outputOffset}px` }}
          >
            <Label color="blue">Completion</Label>
          </div>
        </div>
        <div className={styles.displaySection}>
          <span>{prompt}</span>
          <span className={styles.outputText} ref={outputTextRef}>
            <strong>{getOutputText(output)}</strong>
          </span>
        </div>
      </div>
      <div className={styles.settings}>
        <div className={styles.parameterHeading}>
          <h3>API parameters</h3>
          {renderExplorerBtn()}
        </div>
        <Form>
          <Form.Input
            label="languageEngine"
            type="string"
            readOnly={true}
            value={nullDefault(languageEngine, DEFAULT_ENGINE)}
          />
          <Form.Group widths={3} unstackable={true}>
            <Form.Input
              label="maxTokens"
              type="number"
              readOnly={true}
              value={nullDefault(maxTokens, DEFAULT_MAX_TOKEN)}
            />
            <Form.Input
              label="stop"
              readOnly={true}
              type="string"
              value={nullDefault(stop, DEFAULT_STOP)}
            />
            <Form.Input
              label="temperature"
              readOnly={true}
              type="number"
              value={nullDefault(temperature, DEFAULT_TEMP)}
            />
          </Form.Group>
          <Form.Group widths={3} unstackable={true}>
            <Form.Input
              label="frequencyPenalty"
              readOnly={true}
              type="number"
              value={nullDefault(frequencyPenalty, DEFAULT_FREQ)}
            />
            <Form.Input
              label="presencePenalty"
              readOnly={true}
              type="number"
              value={nullDefault(presencePenalty, DEFAULT_PRES)}
            />
          </Form.Group>
        </Form>
      </div>
      <div className={styles.response}>
        <Button
          basic={true}
          compact={true}
          content={showResponse ? "Hide API response" : "Show API response"}
          icon={showResponse ? "caret down" : "caret right"}
          labelPosition="left"
          onClick={() => setShowResponse(!showResponse)}
          size="small"
        />
        {showResponse && <PrettyCode data={output} />}
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params } = context;

  try {
    const sharedId = params?.sharedId;
    if (typeof sharedId !== "string") throw new Error("Can't find document");

    const data = await db
      .collection(SHARED_COMPLETION_REQUESTS)
      .doc(sharedId)
      .get();
    if (!data.exists) throw new Error("Can't find document");

    return { props: { completion: data.data(), sharedId } };
  } catch (err) {
    return { props: {} };
  }
};

export default Shared;
