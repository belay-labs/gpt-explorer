import JSONPretty from "react-json-pretty";
import JSONPrettyMon from "react-json-pretty/dist/monikai";

interface Props {
  data: any;
}

const PrettyCode = ({ data }: Props) => {
  return (
    <JSONPretty
      data={data}
      mainStyle={`
        border-radius: 5px;
        margin-top: 20px;
        padding: 10px;
        white-space: pre-wrap
      `}
      theme={JSONPrettyMon}
    />
  );
};

export default PrettyCode;
