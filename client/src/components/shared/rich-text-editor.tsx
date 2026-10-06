"use client";

import { Placeholder } from "@tiptap/extension-placeholder";
import { TextAlign } from "@tiptap/extension-text-align";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import { forwardRef, useEffect, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Variant = "full" | "slim";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  variant?: Variant;
  className?: string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

const toStoredHtml = (editor: Editor) => (editor.isEmpty ? "" : editor.getHTML());

function toggleLink(editor: Editor) {
  if (editor.isActive("link")) {
    editor.chain().focus().unsetLink().run();
    return;
  }
  const previous = editor.getAttributes("link").href as string | undefined;
  const href = window.prompt("Link URL", previous ?? "https://");
  if (href === null) return;
  const trimmed = href.trim();
  if (!trimmed) {
    editor.chain().focus().unsetLink().run();
    return;
  }
  editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
}

function ToolbarButton({
  pressed,
  disabled,
  onClick,
  label,
  children,
}: {
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(pressed && "bg-accent text-accent-foreground")}
    >
      {children}
    </Button>
  );
}

function EditorToolbar({ editor, variant }: { editor: Editor; variant: Variant }) {
  const marks = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      underline: current.isActive("underline"),
      strike: current.isActive("strike"),
      heading2: current.isActive("heading", { level: 2 }),
      heading3: current.isActive("heading", { level: 3 }),
      bullet: current.isActive("bulletList"),
      ordered: current.isActive("orderedList"),
      quote: current.isActive("blockquote"),
      link: current.isActive("link"),
      left: current.isActive({ textAlign: "left" }),
      center: current.isActive({ textAlign: "center" }),
      right: current.isActive({ textAlign: "right" }),
      canUndo: current.can().undo(),
      canRedo: current.can().redo(),
    }),
  });

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-input p-1">
      <ToolbarButton
        label="Bold"
        pressed={marks.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        pressed={marks.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        pressed={marks.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline />
      </ToolbarButton>
      {variant === "full" ? (
        <ToolbarButton
          label="Strikethrough"
          pressed={marks.strike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough />
        </ToolbarButton>
      ) : null}
      <Separator orientation="vertical" className="mx-1 h-5" />
      {variant === "full" ? (
        <>
          <ToolbarButton
            label="Heading 2"
            pressed={marks.heading2}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 />
          </ToolbarButton>
          <ToolbarButton
            label="Heading 3"
            pressed={marks.heading3}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 />
          </ToolbarButton>
        </>
      ) : null}
      <ToolbarButton
        label="Bullet list"
        pressed={marks.bullet}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List />
      </ToolbarButton>
      {variant === "full" ? (
        <>
          <ToolbarButton
            label="Numbered list"
            pressed={marks.ordered}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered />
          </ToolbarButton>
          <ToolbarButton
            label="Quote"
            pressed={marks.quote}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote />
          </ToolbarButton>
        </>
      ) : null}
      <ToolbarButton label="Link" pressed={marks.link} onClick={() => toggleLink(editor)}>
        <Link2 />
      </ToolbarButton>
      {variant === "full" ? (
        <>
          <Separator orientation="vertical" className="mx-1 h-5" />
          <ToolbarButton
            label="Align left"
            pressed={marks.left}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft />
          </ToolbarButton>
          <ToolbarButton
            label="Align center"
            pressed={marks.center}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter />
          </ToolbarButton>
          <ToolbarButton
            label="Align right"
            pressed={marks.right}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight />
          </ToolbarButton>
          <Separator orientation="vertical" className="mx-1 h-5" />
          <ToolbarButton
            label="Undo"
            disabled={!marks.canUndo}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 />
          </ToolbarButton>
          <ToolbarButton
            label="Redo"
            disabled={!marks.canRedo}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 />
          </ToolbarButton>
        </>
      ) : null}
    </div>
  );
}

export const RichTextEditor = forwardRef<HTMLDivElement, RichTextEditorProps>(
  function RichTextEditor(
    {
      value,
      onChange,
      placeholder,
      disabled = false,
      variant = "full",
      className,
      id,
      "aria-invalid": ariaInvalid,
      "aria-describedby": ariaDescribedBy,
    },
    ref,
  ) {
    const editor = useEditor({
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      extensions: [
        StarterKit.configure({
          heading: variant === "slim" ? false : { levels: [2, 3] },
          blockquote: variant === "slim" ? false : undefined,
          orderedList: variant === "slim" ? false : undefined,
          code: false,
          codeBlock: false,
          horizontalRule: variant === "slim" ? false : undefined,
          link: {
            openOnClick: false,
            autolink: true,
            defaultProtocol: "https",
          },
        }),
        Placeholder.configure({ placeholder: placeholder ?? "" }),
        ...(variant === "full"
          ? [TextAlign.configure({ types: ["heading", "paragraph"] })]
          : []),
      ],
      content: value || "",
      editable: !disabled,
      editorProps: {
        attributes: {
          class: cn(
            "rich-text max-w-none px-3 py-2 text-sm outline-none",
            variant === "full" ? "min-h-48" : "min-h-28",
          ),
        },
      },
      onUpdate: ({ editor: current }) => {
        onChange(toStoredHtml(current));
      },
    });

    useEffect(() => {
      if (!editor) return;
      editor.setEditable(!disabled);
    }, [disabled, editor]);

    useEffect(() => {
      if (!editor) return;
      const current = toStoredHtml(editor);
      if ((value || "") === current) return;
      editor.commands.setContent(value || "", { emitUpdate: false });
    }, [editor, value]);

    return (
      <div
        ref={ref}
        id={id}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        className={cn(
          "rounded-md border border-input bg-transparent shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40",
          disabled && "pointer-events-none opacity-50",
          className,
        )}
      >
        {editor ? <EditorToolbar editor={editor} variant={variant} /> : null}
        <EditorContent editor={editor} />
      </div>
    );
  },
);
