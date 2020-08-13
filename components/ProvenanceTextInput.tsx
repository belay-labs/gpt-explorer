import {
  CharacterMetadata,
  Editor,
  EditorState,
  getDefaultKeyBinding,
} from "draft-js";
import { OrderedSet } from "immutable";
import { includes } from "lodash";

import { KEY_ENTER } from "../lib/shortcuts";

interface Props {
  editorState: EditorState;
  setEditorState: (editorState: EditorState) => void;
  passedRef: any;
}

const ProvenanceTextInput = ({
  editorState,
  setEditorState,
  passedRef,
}: Props) => {
  const createBoldStyle = () => {
    return CharacterMetadata.create({ style: OrderedSet.of("BOLD") });
  };

  const handleChange = (e: EditorState) => {
    const selection = e.getSelection();
    const key = selection.getStartKey();
    const offset = selection.getStartOffset();

    if (
      includes(
        [
          "insert-characters",
          "backspace-character",
          "delete-character",
          "remove-range",
        ],
        e.getLastChangeType()
      )
    ) {
      const content = e.getCurrentContent();
      const blocks = content.getBlockMap();

      let afterChangedBlock = false;
      const updatedBlocks = blocks.map((block, blockKey) => {
        if (afterChangedBlock) {
          return block?.set(
            "characterList",
            block.getCharacterList().map(createBoldStyle)
          );
        } else if (blockKey === key) {
          afterChangedBlock = true;
          return block?.set(
            "characterList",
            block
              .getCharacterList()
              .map(
                (
                  style: CharacterMetadata | undefined,
                  idx: number | undefined
                ) => {
                  return idx! < offset - 1 ? style : createBoldStyle();
                }
              )
          );
        } else {
          return block;
        }
      });

      const updatedContent = content.set("blockMap", updatedBlocks);

      setEditorState(
        EditorState.setInlineStyleOverride(
          EditorState.create({
            currentContent: updatedContent,
            selection: selection,
          }),
          OrderedSet.of("BOLD")
        )
      );
    } else {
      setEditorState(e);
    }
  };

  const handleKeyEvent = (e: any) => {
    // Shift + Enter key events handled in Explorer component
    if (e.keyCode == KEY_ENTER && e.shiftKey) {
      return null;
    }
    return getDefaultKeyBinding(e);
  };

  return (
    <Editor
      editorState={editorState}
      keyBindingFn={handleKeyEvent}
      onChange={handleChange}
      ref={passedRef}
    />
  );
};

export default ProvenanceTextInput;
