
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { Toggle } from "@/components/ui/toggle"
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered } from "lucide-react"

interface RichTextEditorProps {
    value: string
    onChange: (value: string) => void
    disabled?: boolean
}

export function RichTextEditor({ value, onChange, disabled }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
            }),
        ],
        content: value,
        immediatelyRender: false,
        editable: !disabled,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 p-4 prose prose-sm max-w-none',
            },
        },
    })

    // Update content if value changes externally (and editor content is different)
    // Note: This is a bit tricky with Tiptap to avoid cursor jumps, but for simple form it helps.
    // Ideally, use a useEffect only if value changed significantly.
    // For now, reliance on initial load is usually safer unless we expect real-time external updates.
    // Or handle only on mount? 
    // Let's rely on standard mounting flow for now.

    if (!editor) {
        return null
    }

    return (
        <div className="flex flex-col gap-2 rounded-md border border-input">
            <div className="flex items-center gap-1 border-b p-2">
                <Toggle
                    size="sm"
                    pressed={editor.isActive('bold')}
                    onPressedChange={() => editor.chain().focus().toggleBold().run()}
                    disabled={disabled}
                >
                    <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('italic')}
                    onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                    disabled={disabled}
                >
                    <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('underline')}
                    onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
                    disabled={disabled}
                >
                    <UnderlineIcon className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('strike')}
                    onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                    disabled={disabled}
                >
                    <Strikethrough className="h-4 w-4" />
                </Toggle>
                <div className="mx-2 h-4 w-[1px] bg-border" />
                <Toggle
                    size="sm"
                    pressed={editor.isActive('bulletList')}
                    onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                    disabled={disabled}
                >
                    <List className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('orderedList')}
                    onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                    disabled={disabled}
                >
                    <ListOrdered className="h-4 w-4" />
                </Toggle>
            </div>
            <EditorContent editor={editor} className="bg-transparent" />
        </div>
    )
}
