// EXTERNAL IMPORTS
import { Form, Input } from "semantic-ui-react";

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
      <label>apiKey</label>
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
