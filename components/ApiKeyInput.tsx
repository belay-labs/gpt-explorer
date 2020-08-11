// EXTERNAL IMPORTS
import { Form, Icon, Input, Popup } from "semantic-ui-react";

// INTERNAL IMPORTS
import { API_STORAGE_KEY } from "../lib/constants";
import { useStorageState } from "../lib/hooks";

export const getApiKey = () => localStorage.getItem(API_STORAGE_KEY);

interface Props {
  passedRef?: React.Ref<Input> | null;
}

const ApiKeyInput = ({ passedRef = null }: Props) => {
  const [apiKey, setApiKey] = useStorageState(API_STORAGE_KEY);

  const handleChangeApiKey = ({ target }: { target: HTMLInputElement }) =>
    setApiKey(target.value);

  return (
    <Form.Field>
      <label>
        apiKey{" "}
        <Popup
          basic={true}
          content={
            <>
              <p>
                Your API key does not leave your browser and is only used to
                make direct requests to OpenAI.
              </p>
              <p>
                Don't have an API key? Get access{" "}
                <a href="https://beta.openai.com/" target="_blank">
                  here
                </a>
                .
              </p>
            </>
          }
          hoverable={true}
          inverted={true}
          size="small"
          trigger={<Icon name="info circle" />}
          wide={true}
        />
      </label>
      <Input
        ref={passedRef}
        type="password"
        onChange={handleChangeApiKey}
        value={apiKey}
      />
    </Form.Field>
  );
};

export default ApiKeyInput;
