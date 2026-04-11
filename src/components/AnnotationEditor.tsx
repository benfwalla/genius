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
  type EditorState,
  type LexicalEditor,
} from "lexical";
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
    "px-2 py-1 text-xs rounded border border-zinc-200 hover:bg-zinc-50 transition-colors";

  return (
    <div className="flex gap-1 mb-2 pb-2 border-b border-zinc-100">
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
    nodes: [LinkNode, AutoLinkNode, ListNode, ListItemNode],
    onError: (error: Error) => console.error(error),
  };

  return (
    <div className="space-y-3">
      <LexicalComposer initialConfig={initialConfig}>
        <Toolbar />
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="lexical-editor rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none" />
          }
          placeholder={
            <div className="absolute top-[52px] left-3 text-sm text-zinc-400 pointer-events-none">
              Write your annotation...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <LinkPlugin />
        <OnChangePlugin onChange={handleChange} />
      </LexicalComposer>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(html)}
          disabled={!html.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
