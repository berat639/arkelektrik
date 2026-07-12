"use client";

import {
  MDXEditor as Editor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  UndoRedo,
  CodeToggle,
  Separator,
  type MDXEditorMethods,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { forwardRef, useCallback } from "react";
import { useUploadThing } from "@/lib/uploadthing";

interface MdxEditorProps {
  markdown: string;
  onChange: (value: string) => void;
}

const MdxEditor = forwardRef<MDXEditorMethods, MdxEditorProps>(
  ({ markdown, onChange }, ref) => {
    const { startUpload } = useUploadThing("contentImage");

    const imageUploadHandler = useCallback(
      async (image: File) => {
        const res = await startUpload([image]);
        if (res?.[0]) {
          return res[0].ufsUrl;
        }
        throw new Error("Görsel yüklenemedi.");
      },
      [startUpload]
    );

    return (
      <Editor
        ref={ref}
        markdown={markdown}
        onChange={onChange}
        contentEditableClassName="prose prose-neutral dark:prose-invert max-w-none min-h-[300px] p-4"
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          imagePlugin({ imageUploadHandler }),
          tablePlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: "js" }),
          codeMirrorPlugin({
            codeBlockLanguages: {
              js: "JavaScript",
              ts: "TypeScript",
              jsx: "JSX",
              tsx: "TSX",
              css: "CSS",
              html: "HTML",
              json: "JSON",
              python: "Python",
              bash: "Bash",
              sql: "SQL",
            },
          }),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <Separator />
                <BoldItalicUnderlineToggles />
                <CodeToggle />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <ListsToggle />
                <Separator />
                <CreateLink />
                <InsertImage />
                <InsertTable />
                <InsertThematicBreak />
              </>
            ),
          }),
        ]}
      />
    );
  }
);

MdxEditor.displayName = "MdxEditor";

export default MdxEditor;
