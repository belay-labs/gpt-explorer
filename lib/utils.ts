export const getOutputText = (rawOutput: any) => {
  if (rawOutput?.error) {
    return JSON.stringify(rawOutput.error);
  }

  return rawOutput?.choices ? rawOutput.choices[0]?.text : "";
};

export const nullDefault = (value: any, defaultValue: any) => {
  // if undefined or null then return fallback
  const returnValue = value == null ? defaultValue : value;
  return returnValue;
};
