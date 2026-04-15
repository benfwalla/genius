"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkNode, AutoLinkNode, $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { ListNode, ListItemNode } from "@lexical/list";
import { QuoteNode } from "@lexical/rich-text";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $setBlocksType } from "@lexical/selection";
import {
  FORMAT_TEXT_COMMAND,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $insertNodes,
  $createParagraphNode,
  type EditorState,
  type LexicalEditor,
} from "lexical";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";

const PROTOCOL_RE = /^https?:\/\//;

function LinkEditor() {
  const [editor] = useLexicalComposerContext();
  const [showInput, setShowInput] = useState(false);
  const [url, setUrl] = useState("");
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openLinkInput = () => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const node = selection.getNodes()[0]?.getParent();
      if ($isLinkNode(node)) {
        setUrl(node.getURL());
        setIsEditingExisting(true);
      } else {
        setUrl("");
        setIsEditingExisting(false);
      }
    });
    setShowInput(true);
  };

  useEffect(() => {
    if (showInput && inputRef.current) inputRef.current.focus();
  }, [showInput]);

  const applyLink = () => {
    const trimmed = url.trim();
    if (trimmed) {
      const href = PROTOCOL_RE.test(trimmed) ? trimmed : `https://${trimmed}`;
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, href);
    }
    setShowInput(false);
    setUrl("");
  };

  const removeLink = () => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    setShowInput(false);
    setUrl("");
  };

  return { showInput, setShowInput, url, setUrl, openLinkInput, applyLink, removeLink, isEditingExisting, inputRef };
}

function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const link = LinkEditor();

  const formatBold = () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
  const formatItalic = () =>
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
  const toggleBlockquote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const anchorNode = selection.anchor.getNode();
      const parentBlock = anchorNode.getTopLevelElement();
      if (parentBlock && parentBlock.getType() === "quote") {
        $setBlocksType(selection, () => $createParagraphNode());
      } else {
        $setBlocksType(selection, () => new QuoteNode());
      }
    });
  };

  const btnClass =
    "px-3 py-2 text-sm rounded-lg border border-zinc-400";

  return (
    <div className="space-y-2 mb-3 pb-3 border-b border-zinc-300">
      <div className="flex gap-2">
        <button type="button" onClick={formatBold} className={`${btnClass} font-bold`}>
          B
        </button>
        <button type="button" onClick={formatItalic} className={`${btnClass} italic`}>
          I
        </button>
        <button type="button" onClick={link.openLinkInput} className={btnClass}>
          Link
        </button>
        <button type="button" onClick={toggleBlockquote} className={btnClass}>
          &ldquo;
        </button>
      </div>
      {link.showInput && (
        <div className="flex gap-2 items-center">
          <input
            ref={link.inputRef}
            type="text"
            value={link.url}
            onChange={(e) => link.setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); link.applyLink(); }
              if (e.key === "Escape") { link.setShowInput(false); link.setUrl(""); }
            }}
            placeholder="https://example.com"
            className="flex-1 rounded-lg border border-zinc-400 px-3 py-1.5 text-sm text-black focus:border-black focus:outline-none"
          />
          <button type="button" onClick={link.applyLink} className="rounded-lg bg-black px-3 py-1.5 text-sm text-white">
            Apply
          </button>
          {link.isEditingExisting && (
            <button type="button" onClick={link.removeLink} className="rounded-lg border border-red-400 px-3 py-1.5 text-sm text-red-600">
              Remove
            </button>
          )}
        </div>
      )}
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
  quote: "annotation-blockquote",
};

const editorNodes = [LinkNode, AutoLinkNode, ListNode, ListItemNode, QuoteNode];
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
        <ListPlugin />
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
