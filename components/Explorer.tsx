// EXTERNAL IMPORTS
import copy from "copy-to-clipboard";
import { assign, filter, map } from "lodash";
import {
  Button,
  Dropdown,
  DropdownProps,
  Form,
  Icon,
  Input,
  Loader,
  Message,
  Modal,
} from "semantic-ui-react";
import { MouseEvent, SyntheticEvent, useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

// INTERNAL IMPORTS
import firebase, { User } from "../lib/firebase";
import {
  DEFAULT_ENGINE,
  DEFAULT_FREQ,
  DEFAULT_MAX_TOKEN,
  DEFAULT_PRES,
  DEFAULT_STOP,
  DEFAULT_TEMP,
  HIDE_PARAMS_KEY,
  LANGUAGE_ENGINES,
  RAW_STORAGE_KEY,
  URL,
} from "../lib/constants";
import db, {
  COMPLETION_REQUESTS,
  CompletionRequest,
  GPTSettings,
  SharedCompletionRequest,
  shareCompletionRequest,
} from "../lib/db";
import { useStateTimeout, useStorageBoolState } from "../lib/hooks";
import {
  ANNOTATION_MODE,
  DEVELOP_MODE,
  KEY_ENTER,
  KEY_I,
  KEY_N,
} from "../lib/shortcuts";
import { getOutputText } from "../lib/utils";
import ApiKeyInput, { getApiKey } from "./ApiKeyInput";
import PrettyCode from "./PrettyCode";
import TextareaInput from "./TextareaInput";
import TwoColumnLayout from "./TwoColumnLayout";

import styles from "./Explorer.module.css";

interface Props {
  handleNewRequest: (result: CompletionRequest) => void;
  handleUpdateRequest: (newResult: any) => void;
  mode: string;
  initialRequest: CompletionRequest | SharedCompletionRequest;
  user: User;
  setMode: (mode: string) => void;
}

const Explorer = ({
  handleNewRequest,
  handleUpdateRequest,
  mode,
  initialRequest,
  user,
  setMode,
}: Props) => {
  // GPT-3 Completion API parameters
  const [maxTokens, setMaxTokens] = useState(DEFAULT_MAX_TOKEN);
  const [stop, setStop] = useState(DEFAULT_STOP);
  const [temperature, setTemperature] = useState(DEFAULT_TEMP);
  const [frequencyPenalty, setFrequencyPenalty] = useState(DEFAULT_FREQ);
  const [presencePenalty, setPresencePenalty] = useState(DEFAULT_PRES);
  const [languageEngine, setLanguageEngine] = useState(DEFAULT_ENGINE);

  // Explorer fields
  const [prompt, setPrompt] = useState("");
  const [rawOutput, setRawOutput] = useState({});
  const [outputText, setOutputText] = useState("");
  const [note, setNote] = useState("");

  // Explorer state
  const [currentCompletionId, setCurrentCompletionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showRaw, setShowRaw] = useStorageBoolState(RAW_STORAGE_KEY);
  const [hideParams, setHideParams] = useStorageBoolState(HIDE_PARAMS_KEY);
  const [annotateOpen, setAnnotateOpen] = useState(false);
  const [justCopied, setJustCopied] = useStateTimeout(false, 1500);

  // TODO(cathykc): Currently prone to bugs, dynamically create refs from input count
  // Explorer field refs
  const numInputs = 6;
  const inputRefs: Array<any> = [];
  for (let i = 0; i < numInputs; i++) {
    inputRefs[i] = useRef<Input>(null);
  }

  const promptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mode !== DEVELOP_MODE) {
      map(inputRefs, (ref) => {
        ref.current?.inputRef?.current?.blur();
      });
      promptRef?.current?.blur();
    }
  }, [mode]);

  useEffect(() => {
    if (annotateOpen) {
      setMode(ANNOTATION_MODE);
    } else {
      setTimeout(() => {
        setMode(DEVELOP_MODE);
      }, 100);
    }
  }, [annotateOpen]);

  useEffect(() => {
    if (initialRequest) {
      const { annotations, id, output, prompt, settings } = initialRequest;

      setPrompt(prompt);
      setRawOutput(output);
      setOutputText(getOutputText(output));
      setNote(annotations?.note || "");
      setCurrentCompletionId(id!);

      // If settings from previous run exist update, else use default
      const {
        frequencyPenalty,
        languageEngine,
        maxTokens,
        presencePenalty,
        stop,
        temperature,
      } = settings;
      if (maxTokens != null) setMaxTokens(maxTokens);
      if (stop != null) setStop(stop);
      if (temperature != null) setTemperature(temperature);
      if (frequencyPenalty != null) setFrequencyPenalty(frequencyPenalty);
      if (presencePenalty != null) setPresencePenalty(presencePenalty);
      if (languageEngine != null) setLanguageEngine(languageEngine);
    }
  }, [initialRequest]);

  useEffect(() => {
    const keyboardListener = (e: KeyboardEvent) => {
      switch (mode) {
        case DEVELOP_MODE: {
          if (e.keyCode == KEY_ENTER && e.shiftKey) {
            e.preventDefault();
            makeCompletionRequest();
          }

          if (e.keyCode == KEY_ENTER && e.ctrlKey) {
            e.preventDefault();
            appendToPrompt();
          }

          if (e.keyCode == KEY_N && e.ctrlKey) {
            e.preventDefault();
            setAnnotateOpen(true);
          }

          if (e.keyCode == KEY_I) {
            const inputFocused = filter(inputRefs, (ref) => {
              return ref.current?.inputRef?.current?.matches(":focus");
            });

            const anyFocused = inputFocused.length || promptRef?.current?.matches(":focus");
            if (!anyFocused) {
              e.preventDefault();
              promptRef?.current?.focus();
            }
          }

          break;
        }
        case ANNOTATION_MODE: {
          if (e.keyCode == KEY_ENTER && e.shiftKey) {
            e.preventDefault();
            handleSaveNote();
          }
        }
      }
    };

    document.addEventListener("keydown", keyboardListener);
    return () => {
      document.removeEventListener("keydown", keyboardListener);
    };
  });

  const saveCompletionRequest = async (response: any) => {
    const settings: GPTSettings = {
      frequencyPenalty,
      languageEngine,
      maxTokens,
      presencePenalty,
      stop,
      temperature,
    };

    const completionRequest: CompletionRequest = {
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      output: response,
      prompt,
      userId: user.uid,
      settings,
    };

    try {
      const res = await db
        .collection(COMPLETION_REQUESTS)
        .add(completionRequest);
      setCurrentCompletionId(res.id);
      handleNewRequest(assign(completionRequest, { id: res.id }));
    } catch (err) {
      // TODO (cathykc): handle API error
      console.log(err);
    }
  };

  async function makeCompletionRequest() {
    setSubmitting(true);
    setRawOutput({});
    setOutputText("");

    // TODO(cathykc): other special characters?
    const encodedStop = stop.replace(/\\n/g, "\n");

    const requestData = {
      frequency_penalty: frequencyPenalty,
      max_tokens: maxTokens,
      presence_penalty: presencePenalty,
      prompt,
      stop: encodedStop,
      temperature,
    };

    const url = `https://api.openai.com/v1/engines/${languageEngine}/completions`;

    try {
      const response = await fetch(url, {
        body: JSON.stringify(requestData),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getApiKey()}`,
        },
        method: "POST",
        mode: "cors",
      });
      const responseJson = await response.json();

      saveCompletionRequest(responseJson);
      setRawOutput(responseJson);
      setOutputText(getOutputText(responseJson));
    } catch (err) {
      console.log(err);
      // TODO(cathykc): Display error message
    }
    setSubmitting(false);
  }

  const handleSubmit = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    makeCompletionRequest();
  };

  const handleSaveNote = async () => {
    setAnnotateOpen(false);
    try {
      await db.collection(COMPLETION_REQUESTS).doc(currentCompletionId).set(
        {
          annotations: { note },
        },
        { merge: true }
      );
      handleUpdateRequest({ id: currentCompletionId, annotations: { note } });
    } catch (err) {
      console.log(err);
      // TODO(cathykc): Display error message
    }
  };

  const copyShareLink = async () => {
    let sharedId = (initialRequest as CompletionRequest)?.sharedId;
    if (currentCompletionId !== initialRequest.id || !sharedId) {
      const sharedCompletionRequest: SharedCompletionRequest = {
        output: rawOutput,
        prompt: prompt,
        settings: {
          frequencyPenalty,
          languageEngine,
          maxTokens,
          presencePenalty,
          stop,
          temperature,
        },
      };

      try {
        sharedId = await shareCompletionRequest(currentCompletionId, sharedCompletionRequest);
      } catch (err) {
        // TODO(cathykc): Display error message
        console.error(err);
      }
    }
    const copied = copy(`${URL}p/${sharedId}`);
    if (copied) setJustCopied(true);

    handleUpdateRequest({ id: currentCompletionId, sharedId });
  }

  const appendToPrompt = () => setPrompt(prompt + outputText);

  const handleChangeMaxTokens = ({ target }: { target: HTMLInputElement }) =>
    setMaxTokens(parseInt(target.value));
  const handleChangeStop = ({ target }: { target: HTMLInputElement }) =>
    setStop(target.value);
  const handleChangeTemperature = ({ target }: { target: HTMLInputElement }) =>
    setTemperature(parseFloat(target.value));
  const handleChangeFrequencyPenalty = ({
    target,
  }: {
    target: HTMLInputElement;
  }) => setFrequencyPenalty(parseFloat(target.value));
  const handleChangePresencePenalty = ({
    target,
  }: {
    target: HTMLInputElement;
  }) => setPresencePenalty(parseFloat(target.value));
  const handleChangeLanguageEngine = (
    _e: SyntheticEvent<HTMLElement>,
    { value }: DropdownProps
  ) => setLanguageEngine(value as string);
  const handleChangePrompt = ({ target }: { target: HTMLTextAreaElement }) =>
    setPrompt(target.value);
  const handleChangeNote = ({ target }: { target: HTMLTextAreaElement }) =>
    setNote(target.value);

  const engineOptions = map(LANGUAGE_ENGINES, (engine) => {
    return { key: engine, value: engine, text: engine };
  });

  const inputSection = (
    <>
      <div className={styles.settings}>
        <Form>
          <ApiKeyInput passedRef={inputRefs[0]} />
          <div className={styles.apiParams}>
            <h3>API parameters</h3>
            <Button
              compact={true}
              content={
                hideParams ? "Show API parameters" : "Hide API parameters"
              }
              icon={hideParams ? "caret left" : "caret down"}
              labelPosition="right"
              onClick={() => setHideParams(!hideParams)}
              size="tiny"
              type="button"
            />
          </div>
          {!hideParams && (
            <>
              <Form.Group widths={3} unstackable={true}>
                <Form.Field>
                  <label>maxTokens</label>
                  <Input
                    ref={inputRefs[1]}
                    type="number"
                    onChange={handleChangeMaxTokens}
                    value={maxTokens}
                  />
                </Form.Field>
                <Form.Field>
                  <label>stop</label>
                  <Input
                    ref={inputRefs[2]}
                    type="string"
                    onChange={handleChangeStop}
                    value={stop}
                  />
                </Form.Field>
                <Form.Field>
                  <label>temperature</label>
                  <Input
                    ref={inputRefs[3]}
                    type="number"
                    onChange={handleChangeTemperature}
                    step="0.1"
                    value={temperature}
                  />
                </Form.Field>
              </Form.Group>
              <Form.Group widths={3} unstackable={true}>
                <Form.Field>
                  <label>frequencyPenalty</label>
                  <Input
                    ref={inputRefs[4]}
                    type="number"
                    onChange={handleChangeFrequencyPenalty}
                    step="0.1"
                    value={frequencyPenalty}
                  />
                </Form.Field>
                <Form.Field>
                  <label>presencePenalty</label>
                  <Input
                    ref={inputRefs[5]}
                    type="number"
                    onChange={handleChangePresencePenalty}
                    step="0.1"
                    value={presencePenalty}
                  />
                </Form.Field>
              </Form.Group>
              <Form.Field>
                <label>languageEngine</label>
                <Dropdown
                  onChange={handleChangeLanguageEngine}
                  options={engineOptions}
                  selection={true}
                  value={languageEngine}
                />
              </Form.Field>
            </>
          )}
        </Form>
      </div>
      <div className={styles.prompt}>
        <h4>Prompt</h4>
        <TextareaInput
          ref={promptRef}
          onChange={handleChangePrompt}
          maxRows={24}
          minRows={10}
          value={prompt}
        />
        <div className={styles.submitBtn}>
          <Button
            disabled={submitting}
            fluid={true}
            loading={submitting}
            primary={true}
            onClick={handleSubmit}
          >
            Submit <strong>[⇧ + Enter]</strong>
          </Button>
        </div>
      </div>
    </>
  );

  const outputSection = (
    <>
      <div className={styles.outputHeader}>
        <h4 style={{ margin: 0 }}>Output</h4>
        {rawOutput && (
          <div>
            <Button
              basic={true}
              compact={true}
              color={justCopied ? "green" : undefined}
              content={justCopied ? "Copied!" : "Copy share link"}
              onClick={copyShareLink}
              size="tiny"
              style={{ width: "110px" }}
            />
            <Button
              basic={true}
              compact={true}
              content="Add a note [Ctrl + N]"
              onClick={() => setAnnotateOpen(true)}
              size="tiny"
            />
          </div>
        )}
      </div>
      <Modal
        basic={true}
        dimmer="inverted"
        onClose={() => setAnnotateOpen(false)}
        open={annotateOpen}
        size="mini"
      >
        <TextareaAutosize
          autoFocus={true}
          className={styles.noteInput}
          onChange={handleChangeNote}
          value={note}
          minRows={3}
          maxRows={10}
        />
        <Button
          basic={true}
          color="green"
          floated="right"
          size="tiny"
          content="Save [⇧ + Enter]"
          onClick={handleSaveNote}
        />
      </Modal>
      <div className={styles.outputContainer}>
        {rawOutput ? (
          <>
            <Loader active={submitting} inline="centered" />
            <pre className={styles.outputText}>{outputText}</pre>
            <div className={styles.outputOptions}>
              <Button
                basic={true}
                compact={true}
                content="Append to prompt [Ctrl + Enter]"
                icon="arrow left"
                labelPosition="left"
                onClick={appendToPrompt}
                primary={true}
                size="tiny"
              />
              {rawOutput && (
                <Button
                  basic={true}
                  compact={true}
                  content={showRaw ? "Hide API response" : "Show API response"}
                  icon={showRaw ? "caret down" : "caret left"}
                  labelPosition="right"
                  onClick={() => setShowRaw(!showRaw)}
                  size="tiny"
                />
              )}
            </div>
            {showRaw && <PrettyCode data={rawOutput} />}
          </>
        ) : (
          <Message warning>
            <Icon name="arrow alternate circle left outline" />
            Submit a prompt on the left to get a response from the API.
          </Message>
        )}
      </div>
    </>
  );

  return (
    <TwoColumnLayout
      leftChildren={inputSection}
      rightChildren={outputSection}
    />
  );
};

export default Explorer;
