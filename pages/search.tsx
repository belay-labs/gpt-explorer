// EXTERNAL IMPORTS
import { useState } from "react";
import { Button, Form, Loader } from "semantic-ui-react";

// INTERNAL IMPORTS
import privateRoute from "../lib/privateRoute";
import ApiKeyInput, { getApiKey } from "../components/ApiKeyInput";
import PrettyCode from "../components/PrettyCode";
import TextareaInput from "../components/TextareaInput";
import TwoColumnLayout from "../components/TwoColumnLayout";

import styles from "./search.module.css";

export function Search() {
  // GPT-3 Search API parameters
  const [query, setQuery] = useState("");
  const [documentsText, setDocumentsText] = useState("");

  // Search component state
  const [submitting, setSubmitting] = useState(false);
  const [output, setOutput] = useState({});

  const makeSearchRequest = async () => {
    setOutput({});
    setSubmitting(true);

    try {
      const requestData = {
        documents: documentsText.split(", "),
        query,
      };

      const response = await fetch(
        "https://api.openai.com/v1/engines/davinci/search",
        {
          body: JSON.stringify(requestData),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getApiKey()}`,
          },
          method: "POST",
          mode: "cors",
        }
      );

      const responseJson = await response.json();
      setOutput(responseJson);
    } catch (err) {
      // TODO(cathykc): Display error message
      console.error(err);
    }
    setSubmitting(false);
  };

  const handleQueryChange = ({ target }: React.FormEvent) => {
    setQuery((target as HTMLTextAreaElement).value);
  };
  const handleDocumentsTextChange = ({ target }: React.FormEvent) => {
    setDocumentsText((target as HTMLTextAreaElement).value);
  };

  const inputSection = (
    <>
      <div className={styles.settings}>
        <Form>
          <ApiKeyInput />
        </Form>
      </div>
      <h4>Query</h4>
      <TextareaInput
        onChange={handleQueryChange}
        value={query}
        minRows={1}
        maxRows={1}
      />
      <h4>Documents</h4>
      <TextareaInput
        onChange={handleDocumentsTextChange}
        value={documentsText}
        minRows={10}
        maxRows={24}
      />
      <Button
        disabled={submitting}
        fluid={true}
        loading={submitting}
        primary={true}
        onClick={makeSearchRequest}
      >
        Submit
      </Button>
    </>
  );

  const outputSection = (
    <>
      <div className={styles.outputHeader}>
        <h4 style={{ margin: 0 }}>Output</h4>
      </div>
      <div className={styles.outputContainer}>
        <Loader active={submitting} inline="centered" />
        <PrettyCode data={output} />
      </div>
    </>
  );

  return (
    <TwoColumnLayout
      leftChildren={inputSection}
      rightChildren={outputSection}
    />
  );
}

export default privateRoute(Search);
