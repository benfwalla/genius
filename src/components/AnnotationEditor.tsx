"use client";

import { useState, useCallback } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { ListNode, ListItemNode } from "@lexical/list";
import { $generateHtmlFromNodes } from "@lexical/html";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  FORMAT_TEXT_COMMAND,
  $getRoot,
  $insertNodes,
  type EditorState,
  type LexicalEditor,
} from "lexical";
import { $generateNodesFromDOM } from "@lexical/html";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";

function Toolbar() {
  const [editor] = useLexicalComposerContext();

  const formatBold = () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
  const formatItalic = () =>
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
  };

  const btnClass =
    "px-3 py-2 text-sm rounded-lg border border-zinc-400 hover:bg-zinc-50 transition-colors";

  return (
    <div className="flex gap-2 mb-3 pb-3 border-b border-zinc-300">
      <button type="button" onClick={formatBold} className={`${btnClass} font-bold`}>
        B
      </button>
      <button type="button" onClick={formatItalic} className={`${btnClass} italic`}>
        I
      </button>
      <button type="button" onClick={insertLink} className={btnClass}>
        Link
      </button>
    </div>
  );
}

const theme = {
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
  },
  link: "text-blue-600 underline",
};

const editorNodes = [LinkNode, AutoLinkNode, ListNode, ListItemNode];
const onError = (error: Error) => console.error(error);

export default function AnnotationEditor({
  initialHtml,
  onSave,
  onCancel,
}: {
  initialHtml?: string;
  onSave: (html: string) => void;
  onCancel: () => void;
}) {
  const [html, setHtml] = useState(initialHtml ?? "");

  const handleChange = useCallback(
    (_editorState: EditorState, editor: LexicalEditor) => {
      editor.read(() => {
        const generated = $generateHtmlFromNodes(editor);
        setHtml(generated);
      });
    },
    []
  );

  const initialConfig = {
    namespace: "AnnotationEditor",
    theme,
    nodes: editorNodes,
    onError,
    ...(initialHtml
      ? {
          editorState: (editor: LexicalEditor) => {
            const parser = new DOMParser();
            const dom = parser.parseFromString(initialHtml, "text/html");
            const nodes = $generateNodesFromDOM(editor, dom);
            $getRoot().clear();
            $getRoot().select();
            $insertNodes(nodes);
          },
        }
      : {}),
  };

  return (
    <div className="space-y-4">
      <LexicalComposer initialConfig={initialConfig}>
        <Toolbar />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="lexical-editor rounded-lg border border-zinc-400 px-4 py-3 text-base text-black focus:border-black focus:outline-none min-h-[240px]" />
            }
            placeholder={
              <div className="absolute top-3 left-4 text-base text-zinc-300 pointer-events-none -z-10">
                Write your annotation...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <LinkPlugin />
        <OnChangePlugin onChange={handleChange} />
      </LexicalComposer>
      <div className="flex gap-3">
        <button
          onClick={() => onSave(html)}
          disabled={!html.trim()}
          className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-zinc-400 px-5 py-2.5 text-sm text-black hover:bg-zinc-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
