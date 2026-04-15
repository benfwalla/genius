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
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { UNORDERED_LIST, ORDERED_LIST, QUOTE, BOLD_STAR, ITALIC_STAR } from "@lexical/markdown";
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
import { FaLink } from "react-icons/fa";

const PROTOCOL_RE = /^https?:\/\//;

function FloatingToolbar() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [linkMode, setLinkMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isExistingLink, setIsExistingLink] = useState(false);

  useEffect(() => {
    const update = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || selection.isCollapsed()) {
          if (!linkMode) setVisible(false);
          return;
        }
        const nativeSelection = window.getSelection();
        if (!nativeSelection || nativeSelection.rangeCount === 0) return;
        const range = nativeSelection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const editorEl = editor.getRootElement();
        if (!editorEl) return;
        const editorRect = editorEl.getBoundingClientRect();
        setPosition({
          top: rect.top - editorRect.top - 44,
          left: rect.left - editorRect.left + rect.width / 2,
        });
        setVisible(true);
      });
    };
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(update);
    });
  }, [editor, linkMode]);

  useEffect(() => {
    if (linkMode && linkInputRef.current) linkInputRef.current.focus();
  }, [linkMode]);

  const openLink = () => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const node = selection.getNodes()[0]?.getParent();
      if ($isLinkNode(node)) {
        setLinkUrl(node.getURL());
        setIsExistingLink(true);
      } else {
        setLinkUrl("");
        setIsExistingLink(false);
      }
    });
    setLinkMode(true);
  };

  const applyLink = () => {
    const trimmed = linkUrl.trim();
    if (trimmed) {
      const href = PROTOCOL_RE.test(trimmed) ? trimmed : `https://${trimmed}`;
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, href);
    }
    setLinkMode(false);
    setLinkUrl("");
  };

  const removeLink = () => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    setLinkMode(false);
    setLinkUrl("");
  };

  if (!visible) return null;

  const btnClass = "px-2.5 py-1.5 text-sm text-white rounded";

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50 flex items-center gap-0.5 bg-black rounded-lg px-1 py-1 shadow-lg"
      style={{
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {linkMode ? (
        <div className="flex items-center gap-1 px-1">
          <input
            ref={linkInputRef}
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); applyLink(); }
              if (e.key === "Escape") { setLinkMode(false); setLinkUrl(""); }
            }}
            placeholder="Paste link..."
            className="w-48 bg-zinc-800 text-white text-sm rounded px-2 py-1 placeholder-zinc-400 focus:outline-none"
          />
          <button type="button" onClick={applyLink} className="text-sm text-white px-2 py-1 rounded bg-zinc-700">
            ✓
          </button>
          {isExistingLink && (
            <button type="button" onClick={removeLink} className="text-sm text-red-400 px-2 py-1 rounded bg-zinc-700">
              ✕
            </button>
          )}
        </div>
      ) : (
        <>
          <button type="button" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")} className={`${btnClass} font-bold`}>
            B
          </button>
          <button type="button" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")} className={`${btnClass} italic`}>
            I
          </button>
          <button type="button" onClick={openLink} className={btnClass}>
            <FaLink size={13} />
          </button>
          <button
            type="button"
            onClick={() => {
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
            }}
            className={btnClass}
          >
            &gt;
          </button>
        </>
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
        <div className="relative">
          <FloatingToolbar />
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
        <MarkdownShortcutPlugin transformers={[UNORDERED_LIST, ORDERED_LIST, QUOTE, BOLD_STAR, ITALIC_STAR]} />
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
