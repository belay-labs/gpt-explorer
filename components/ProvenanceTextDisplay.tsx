import { forEach, map } from "lodash";

import styles from "./ProvenanceTextDisplay.module.css";

interface Props {
  content: any;
}

const ProvenanceTextDisplay = ({ content }: Props) => {
  return (
    <span>
      {map(content.blocks, (block) => {
        const { inlineStyleRanges, key, text } = block;

        const styleMap = [];
        let processedIdx = 0;

        forEach(inlineStyleRanges, (range) => {
          const { length, offset } = range;

          if (processedIdx < offset) {
            styleMap.push({
              text: text.substring(processedIdx, offset),
              provenance: "gpt3",
            });
          }

          styleMap.push({
            text: text.substring(offset, length + offset),
            provenance: "human",
          });

          processedIdx = length + offset;
        });

        if (processedIdx < text.length) {
          styleMap.push({
            text: text.substring(processedIdx, text.length),
            provenance: "gpt3",
          });
        }

        return (
          <p key={key}>
            {map(styleMap, (section) => {
              const { text, provenance } = section;
              return (
                <span className={`${provenance === "human" && styles.human}`}>
                  {text}
                </span>
              );
            })}
          </p>
        );
      })}
    </span>
  );
};

export default ProvenanceTextDisplay;
