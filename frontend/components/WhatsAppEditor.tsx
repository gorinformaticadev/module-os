import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Bold,
    Italic,
    Strikethrough,
    Code,
    List,
    ListOrdered,
    Quote,
    Variable
} from 'lucide-react';

interface WhatsAppEditorProps {
    value: string;
    onChange: (value: string) => void;
    variables?: string[];
    onInsertVariable?: (variable: string) => void;
    className?: string;
    placeholder?: string;
}

export function WhatsAppEditor({
    value,
    onChange,
    variables = [],
    onInsertVariable,
    className,
    placeholder
}: WhatsAppEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertFormat = (prefix: string, suffix: string = prefix) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        const newText = `${before}${prefix}${selection}${suffix}${after}`;
        onChange(newText);

        // Restore focus and selection
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    const insertList = (ordered: boolean) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        let newSelection = selection;

        // If there's a selection, apply to each line
        if (selection.length > 0) {
            const lines = selection.split('\n');
            newSelection = lines.map((line, index) => {
                const marker = ordered ? `${index + 1}. ` : '- ';
                return `${marker}${line}`;
            }).join('\n');
        } else {
            // If no selection, just insert one marker
            newSelection = ordered ? '1. ' : '- ';
        }

        const newText = `${before}${newSelection}${after}`;
        onChange(newText);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + newSelection.length, start + newSelection.length);
        }, 0);
    };

    const handleVariableClick = (variable: string) => {
        if (onInsertVariable) {
            onInsertVariable(variable);
            return;
        }

        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end);

        const newText = `${before}{{${variable}}}${after}`;
        onChange(newText);

        setTimeout(() => {
            textarea.focus();
            const newPos = start + variable.length + 4; // {{}} is 4 chars
            textarea.setSelectionRange(newPos, newPos);
        }, 0);
    };

    return (
        <div className={`space-y-2 ${className || ''}`}>
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-1 border rounded-t-md bg-muted/50 border-b-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormat('*')} title="Negrito" type="button">
                    <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormat('_')} title="Itálico" type="button">
                    <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormat('~')} title="Rasurado" type="button">
                    <Strikethrough className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormat('```')} title="Monoespaçado" type="button">
                    <Code className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1 my-auto" />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertList(false)} title="Lista com marcas" type="button">
                    <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertList(true)} title="Lista numerada" type="button">
                    <ListOrdered className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormat('> ', '')} title="Citação" type="button">
                    <Quote className="h-4 w-4" />
                </Button>
            </div>

            <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="min-h-[150px] rounded-t-none mt-0 resize-none font-mono text-sm"
                placeholder={placeholder || "Digite sua mensagem..."}
            />

            {/* Variáveis */}
            {variables.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Variable className="h-3 w-3" />
                        Variáveis:
                    </span>
                    {variables.map((variable) => (
                        <Badge
                            key={variable}
                            variant="outline"
                            className="cursor-pointer hover:bg-muted transition-colors text-xs"
                            onClick={() => handleVariableClick(variable)}
                        >
                            {variable}
                        </Badge>
                    ))}
                </div>
            )}

            <div className="text-xs text-muted-foreground bg-muted p-2 rounded border mt-2">
                <p className="font-semibold mb-1">Dicas de formatação:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span>*negrito*</span>
                    <span>_itálico_</span>
                    <span>~rasurado~</span>
                    <span>```mono```</span>
                </div>
            </div>
        </div>
    );
}
