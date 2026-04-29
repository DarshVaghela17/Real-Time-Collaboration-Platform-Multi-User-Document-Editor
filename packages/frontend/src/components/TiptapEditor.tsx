import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import {
  Box,
  Button,
  Divider,
  Paper,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  Code,
  LooksOne,
  LooksTwo,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  Undo,
  Redo,
} from '@mui/icons-material';
import './TiptapEditor.css';

interface TiptapEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  documentId?: string;
  userName?: string;
}

export const TiptapEditor = ({
  initialContent = '',
  onChange,
  onSave,
  placeholder = 'Start typing...',
  editable = true,
}: TiptapEditorProps) => {
  const [lastSaved, setLastSaved] = React.useState<string>('');
  const saveTimeoutRef = React.useRef<NodeJS.Timeout>();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'tiptap-bullet-list',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'tiptap-ordered-list',
          },
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextStyle,
    ],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);

      // Auto-save after 2 seconds of inactivity
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        if (html !== lastSaved) {
          onSave?.(html);
          setLastSaved(html);
        }
      }, 2000);
    },
  });

  if (!editor) {
    return null;
  }

  const toggleMark = (mark: string) => {
    if (mark === 'bold') editor.chain().focus().toggleBold().run();
    if (mark === 'italic') editor.chain().focus().toggleItalic().run();
    if (mark === 'underline') editor.chain().focus().toggleStrike().run();
    if (mark === 'code') editor.chain().focus().toggleCode().run();
  };

  const setHeading = (level: 1 | 2) => {
    editor
      .chain()
      .focus()
      .toggleHeading({ level })
      .run();
  };

  const toggleList = (type: 'bullet' | 'ordered') => {
    if (type === 'bullet') {
      editor.chain().focus().toggleBulletList().run();
    } else {
      editor.chain().focus().toggleOrderedList().run();
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Toolbar */}
      <Paper
        sx={{
          p: 1,
          mb: 1,
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px 4px 0 0',
        }}
      >
        {/* Text Formatting */}
        <ToggleButtonGroup size="small" sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Bold (Ctrl+B)">
            <ToggleButton
              value="bold"
              selected={editor.isActive('bold')}
              onChange={() => toggleMark('bold')}
              size="small"
            >
              <FormatBold />
            </ToggleButton>
          </Tooltip>

          <Tooltip title="Italic (Ctrl+I)">
            <ToggleButton
              value="italic"
              selected={editor.isActive('italic')}
              onChange={() => toggleMark('italic')}
              size="small"
            >
              <FormatItalic />
            </ToggleButton>
          </Tooltip>

          <Tooltip title="Strike (Ctrl+Shift+X)">
            <ToggleButton
              value="strike"
              selected={editor.isActive('strike')}
              onChange={() => toggleMark('underline')}
              size="small"
            >
              <FormatUnderlined />
            </ToggleButton>
          </Tooltip>

          <Tooltip title="Code (Ctrl+`)">
            <ToggleButton
              value="code"
              selected={editor.isActive('code')}
              onChange={() => toggleMark('code')}
              size="small"
            >
              <Code />
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>

        <Divider flexItem orientation="vertical" sx={{ my: 1 }} />

        {/* Headings */}
        <ToggleButtonGroup size="small" sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Heading 1">
            <ToggleButton
              value="h1"
              selected={editor.isActive('heading', { level: 1 })}
              onChange={() => setHeading(1)}
              size="small"
            >
              <LooksOne />
            </ToggleButton>
          </Tooltip>

          <Tooltip title="Heading 2">
            <ToggleButton
              value="h2"
              selected={editor.isActive('heading', { level: 2 })}
              onChange={() => setHeading(2)}
              size="small"
            >
              <LooksTwo />
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>

        <Divider flexItem orientation="vertical" sx={{ my: 1 }} />

        {/* Lists */}
        <ToggleButtonGroup size="small" sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Bullet List">
            <ToggleButton
              value="bullet"
              selected={editor.isActive('bulletList')}
              onChange={() => toggleList('bullet')}
              size="small"
            >
              <FormatListBulleted />
            </ToggleButton>
          </Tooltip>

          <Tooltip title="Numbered List">
            <ToggleButton
              value="ordered"
              selected={editor.isActive('orderedList')}
              onChange={() => toggleList('ordered')}
              size="small"
            >
              <FormatListNumbered />
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>

        <Divider flexItem orientation="vertical" sx={{ my: 1 }} />

        {/* Blockquote */}
        <Tooltip title="Quote">
          <ToggleButton
            value="quote"
            selected={editor.isActive('blockquote')}
            onChange={() => editor.chain().focus().toggleBlockquote().run()}
            size="small"
          >
            <FormatQuote />
          </ToggleButton>
        </Tooltip>

        <Divider flexItem orientation="vertical" sx={{ my: 1 }} />

        {/* Undo/Redo */}
        <Tooltip title="Undo (Ctrl+Z)">
          <span>
            <Button
              variant="text"
              size="small"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo />
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Redo (Ctrl+Shift+Z)">
          <span>
            <Button
              variant="text"
              size="small"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo />
            </Button>
          </span>
        </Tooltip>
      </Paper>

      {/* Editor */}
      <Paper
        sx={{
          p: 2,
          minHeight: '300px',
          borderRadius: '0 0 4px 4px',
          backgroundColor: '#ffffff',
          '& .tiptap': {
            outline: 'none',
            '& p.is-editor-empty:first-child::before': {
              color: '#adb5bd',
              content: `attr(data-placeholder)`,
              float: 'left',
              height: 0,
              pointerEvents: 'none',
            },
            '& > * + *': {
              marginTop: '0.75em',
            },
            '& h1, & h2': {
              lineHeight: '1.1',
              marginTop: '0.25em',
              marginBottom: '0.25em',
            },
            '& h1': {
              fontSize: '2em',
            },
            '& h2': {
              fontSize: '1.5em',
            },
            '& code': {
              backgroundColor: '#f3f4f6',
              padding: '0.25em 0.5em',
              borderRadius: '0.25em',
              fontFamily: 'monospace',
            },
            '& pre': {
              backgroundColor: '#1f2937',
              color: '#f3f4f6',
              padding: '1em',
              borderRadius: '0.5em',
              overflow: 'auto',
              '& code': {
                backgroundColor: 'transparent',
                padding: '0',
              },
            },
            '& ul, & ol': {
              paddingLeft: '1.5em',
            },
            '& ul li': {
              listStyleType: 'disc',
            },
            '& ol li': {
              listStyleType: 'decimal',
            },
            '& blockquote': {
              borderLeft: '4px solid #3b82f6',
              paddingLeft: '1em',
              marginLeft: '0',
              opacity: 0.8,
            },
          },
        }}
      >
        <EditorContent
          editor={editor}
          data-placeholder={placeholder}
          className="tiptap"
        />
      </Paper>
    </Box>
  );
};
