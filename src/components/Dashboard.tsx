import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';
import { MessageSquare, Send, Plus, Image as ImageIcon, Type, Trash, MoveUp, MoveDown, X, Smile, Upload, LogOut, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { HexColorPicker } from 'react-colorful';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { webhookOptions } from '../config/webhooks';
import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../hooks/useTheme';

type WidgetType = 'image' | 'textParagraph';
type MessageFormat = 'plain' | 'cards';

interface Widget {
    type: WidgetType;
    content: string;
    id: string;
}

interface Section {
    header: string;
    widgets: Widget[];
}

export default function Dashboard() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [selectedWebhook, setSelectedWebhook] = useState<string>(webhookOptions[0]?.url || '');
    const [messageFormat, setMessageFormat] = useState<MessageFormat>('cards');
    const [sections, setSections] = useState<Section[]>([
        {
            header: 'My Message',
            widgets: [
                { type: 'textParagraph', content: 'Write your message here...', id: '1' },
            ],
        },
    ]);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [currentColor, setCurrentColor] = useState("#000000");
    const [activeWidget, setActiveWidget] = useState<{ section: number; widget: number } | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            toast.success('Signed out successfully');
            navigate('/');
        } catch (error) {
            toast.error('Error signing out');
        }
    };

    const uploadImage = async (file: File, sectionIndex: number, widgetIndex: number) => {
        if (!file.type.startsWith('image/')) {
            throw new Error('Please upload an image file');
        }

        if (file.size > 5 * 1024 * 1024) {
            throw new Error('File size must be less than 5MB');
        }

        try {
            setUploading(true);

            const fileExt = file.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const filePath = `public/${fileName}`;

            await supabase.storage.from('chat-images').upload(filePath, file);

            const { data: { publicUrl } } = supabase.storage
                .from('chat-images')
                .getPublicUrl(filePath);

            updateWidget(sectionIndex, widgetIndex, publicUrl);
            toast.success('Image uploaded successfully!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, sectionIndex: number, widgetIndex: number) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadImage(file, sectionIndex, widgetIndex)
                .then();
        }
    }, []);

    const addWidget = (sectionIndex: number, type: WidgetType) => {
        if (messageFormat === 'plain') {
            toast.error('Cannot add widgets in plain text mode');
            return;
        }
        setSections(current => {
            const newSections = [...current];
            newSections[sectionIndex] = {
                ...newSections[sectionIndex],
                widgets: [
                    ...newSections[sectionIndex].widgets,
                    { type, content: type === 'image' ? '' : 'New paragraph', id: Date.now().toString() },
                ],
            };
            return newSections;
        });
    };

    const updateWidget = (sectionIndex: number, widgetIndex: number, content: string) => {
        setSections(current => {
            const newSections = [...current];
            newSections[sectionIndex] = {
                ...newSections[sectionIndex],
                widgets: newSections[sectionIndex].widgets.map((widget, index) =>
                    index === widgetIndex ? { ...widget, content } : widget
                ),
            };
            return [...newSections];
        });

        setTimeout(() => {
            setShowColorPicker(false);
            setShowEmojiPicker(false);
        }, 100);
    };


    const removeWidget = (sectionIndex: number, widgetIndex: number) => {
        if (messageFormat === 'plain') {
            toast.error('Cannot remove widgets in plain text mode');
            return;
        }
        if (sections[sectionIndex].widgets.length === 1) {
            toast.error('Must have at least one text widget');
            return;
        }
        setSections(current => {
            const newSections = [...current];
            newSections[sectionIndex].widgets.splice(widgetIndex, 1);
            return [...newSections];
        });
    };

    const moveWidget = (sectionIndex: number, widgetIndex: number, direction: 'up' | 'down') => {
        if (messageFormat === 'plain') {
            toast.error('Cannot move widgets in plain text mode');
            return;
        }
        setSections(current => {
            const newSections = [...current];
            const widgets = [...newSections[sectionIndex].widgets];
            const newIndex = direction === 'up' ? widgetIndex - 1 : widgetIndex + 1;

            if (newIndex >= 0 && newIndex < widgets.length) {
                [widgets[widgetIndex], widgets[newIndex]] = [widgets[newIndex], widgets[widgetIndex]];
                newSections[sectionIndex].widgets = widgets;
            }

            return newSections;
        });
    };

    const updateSectionHeader = (sectionIndex: number, header: string) => {
        setSections(current => {
            const newSections = [...current];
            newSections[sectionIndex] = {
                ...newSections[sectionIndex],
                header,
            };
            return newSections;
        });
    };

    const convertMarkdownToHtml = (markdown: string): string => {
        return markdown
            .replace(/\{color:([\w#]+)\}(.*?)\{\/color\}/g, '<font color="$1">$2</font>') // Color formatting
            .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>') // H3
            .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>') // H2
            .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>') // H1
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold (**text**)
            .replace(/__(.*?)__/g, '<b>$1</b>') // Bold (__text__)
            .replace(/\*(.*?)\*/g, '<i>$1</i>') // Italic (*text*)
            .replace(/_(.*?)_/g, '<i>$1</i>') // Italic (_text_)
            .replace(/\[([^\]]+)]\(([^)]+)\)/g, '<a href="$2">$1</a>') // Links
            .replace(/(?:\r\n|\r|\n)/g, '<br>'); // Newline to <br>
    };


    const handleEmojiClick = (emojiData: any, sectionIndex: number, widgetIndex: number) => {
        const widget = sections[sectionIndex].widgets[widgetIndex];
        const newContent = widget.content + emojiData.emoji;
        updateWidget(sectionIndex, widgetIndex, newContent);
        setShowEmojiPicker(false);
    };

    const insertColorText = (sectionIndex: number, widgetIndex: number, color: string) => {
        const widget = sections[sectionIndex].widgets[widgetIndex];
        if (widget.type !== 'textParagraph') return;

        const textarea = document.querySelector(`textarea[data-section="${sectionIndex}"][data-widget="${widgetIndex}"]`) as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = widget.content;
        const selectedText = text.substring(start, end) || 'colored text'; // Default text if nothing is selected
        const colorTag = `{color:${color}}${selectedText}{/color}`;

        const newContent = text.substring(0, start) + colorTag + text.substring(end);

        // Update widget content and close color picker
        updateWidget(sectionIndex, widgetIndex, newContent);

        // Delay closing the picker to ensure text update happens first
        setTimeout(() => setShowColorPicker(false), 100);
    };


    const createPlainTextMessage = (): string => {
        const header = sections[0].header || 'New Message';
        const content = sections[0].widgets
            .map(widget => widget.type === 'textParagraph' ? widget.content : '')
            .join('\n\n')
            .trim();

        return `${header}: ${content}`;
    };

    const createCardsMessage = () => {
        return {
            cardsV2: [
                {
                    cardId: `card_${Date.now()}`,
                    card: {
                        sections: sections.map(section => ({
                            header: section.header,
                            widgets: section.widgets.map(widget => {
                                if (widget.type === 'image') {
                                    return {
                                        image: {
                                            imageUrl: widget.content,
                                            altText: 'Message Image',
                                        },
                                    };
                                }
                                return {
                                    textParagraph: {
                                        text: convertMarkdownToHtml(widget.content),
                                    },
                                };
                            }),
                        })),
                    },
                },
            ],
        };
    };

    const sendMessage = async () => {
        if (!selectedWebhook) {
            toast.error('Please select a Google Chat group');
            return;
        }

        if (sections[0].widgets.length === 0) {
            toast.error('Please add at least one widget');
            return;
        }

        const message = messageFormat === 'cards'
            ? createCardsMessage()
            : { text: createPlainTextMessage() };

        try {
            await fetch(selectedWebhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            toast.success('Message sent successfully!');
        } catch (error) {
            toast.error('Failed to send message. Please check your webhook URL.');
        }
    };

    return (
        <div className="min-h-screen bg-secondary transition-colors pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <MessageSquare className="w-8 h-8 text-accent" />
                            <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Google Chat Webhook Sender</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <button
                                onClick={() => navigate('/admin/profile')}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-primary bg-card border border-border rounded-md hover:bg-secondary transition-colors"
                            >
                                <Settings size={16} />
                                <span className="hidden sm:inline">Profile Settings</span>
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-primary bg-card border border-border rounded-md hover:bg-secondary transition-colors"
                            >
                                <LogOut size={16} />
                                <span className="hidden sm:inline">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-lg shadow-md p-4 sm:p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Google Chat Group
                            </label>
                            <select
                                value={selectedWebhook}
                                onChange={(e) => setSelectedWebhook(e.target.value)}
                                className="w-full px-4 pr-10 py-2 border border-border rounded-md focus:ring-2 focus:ring-accent focus:border-transparent bg-card dark:bg-gray-800 text-text-primary"
                            >
                                {webhookOptions.map((option) => (
                                    <option key={option.url} value={option.url}>
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Message Format
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setMessageFormat('plain')}
                                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                        messageFormat === 'plain'
                                            ? 'bg-accent text-white'
                                            : 'bg-card dark:bg-gray-800 text-text-primary border border-border hover:bg-secondary'
                                    }`}
                                >
                                    Plain Text
                                </button>
                                <button
                                    onClick={() => setMessageFormat('cards')}
                                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                        messageFormat === 'cards'
                                            ? 'bg-accent text-white'
                                            : 'bg-card dark:bg-gray-800 text-text-primary border border-border hover:bg-secondary'
                                    }`}
                                >
                                    Cards
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="bg-card rounded-lg shadow-md p-4 sm:p-6 mb-6">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Section Header
                            </label>
                            <input
                                type="text"
                                value={section.header}
                                onChange={(e) => updateSectionHeader(sectionIndex, e.target.value)}
                                className="w-full px-4 py-2 border border-border rounded-md bg-card dark:bg-gray-800 text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                                placeholder="Enter section header..."
                            />
                        </div>

                        {section.widgets.map((widget, widgetIndex) => (
                            <div key={widget.id} className="mb-6 border border-border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-text-primary">
                                        {widget.type === 'image' ? 'Image Upload' : 'Text Content'}
                                    </span>
                                    <div className="flex gap-2">
                                        {messageFormat === 'cards' && (
                                            <>
                                                <button
                                                    onClick={() => moveWidget(sectionIndex, widgetIndex, 'up')}
                                                    disabled={widgetIndex === 0}
                                                    className="p-1 text-text-secondary hover:text-text-primary disabled:opacity-50 transition-colors"
                                                >
                                                    <MoveUp size={16} />
                                                </button>
                                                <button
                                                    onClick={() => moveWidget(sectionIndex, widgetIndex, 'down')}
                                                    disabled={widgetIndex === section.widgets.length - 1}
                                                    className="p-1 text-text-secondary hover:text-text-primary disabled:opacity-50 transition-colors"
                                                >
                                                    <MoveDown size={16} />
                                                </button>
                                                <button
                                                    onClick={() => removeWidget(sectionIndex, widgetIndex)}
                                                    className="p-1 text-danger hover:text-danger-hover transition-colors"
                                                >
                                                    <Trash size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {widget.type === 'image' ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <label className="flex-1">
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleFileUpload(e, sectionIndex, widgetIndex)}
                                                        className="hidden"
                                                        disabled={uploading}
                                                    />
                                                    <div className="flex items-center justify-center w-full h-32 px-4 transition bg-card dark:bg-gray-800 border-2 border-border border-dashed rounded-md appearance-none cursor-pointer hover:border-accent focus:outline-none">
                                                        <div className="flex flex-col items-center space-y-2">
                                                            <Upload className="w-6 h-6 text-text-secondary" />
                                                            <span className="text-sm text-text-secondary">
                                                                {uploading ? 'Uploading...' : 'Click to upload image'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </label>
                                            {widget.content && (
                                                <div className="w-32 h-32 relative">
                                                    <img
                                                        src={widget.content}
                                                        alt="Uploaded preview"
                                                        className="w-full h-full object-cover rounded-md"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        {widget.content && (
                                            <input
                                                type="text"
                                                value={widget.content}
                                                readOnly
                                                className="w-full px-4 py-2 text-sm bg-secondary border border-border rounded-md text-text-secondary"
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            <button
                                                onClick={() => {
                                                    setActiveWidget({ section: sectionIndex, widget: widgetIndex });
                                                    setShowColorPicker(true);
                                                    setShowEmojiPicker(false);
                                                }}
                                                className="px-3 py-1 text-sm rounded border border-border hover:bg-secondary flex items-center gap-2 bg-card dark:bg-gray-800"
                                            >
                                                <div
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: currentColor }}
                                                />
                                                Choose Color
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setActiveWidget({ section: sectionIndex, widget: widgetIndex });
                                                    setShowEmojiPicker(!showEmojiPicker);
                                                    setShowColorPicker(false);
                                                }}
                                                className="px-3 py-1 text-sm rounded border border-border hover:bg-secondary flex items-center gap-2 bg-card dark:bg-gray-800"
                                            >
                                                <Smile size={16} />
                                                Add Emoji
                                            </button>
                                            {showEmojiPicker && activeWidget?.section === sectionIndex && activeWidget?.widget === widgetIndex && (
                                                <div className="absolute z-20">
                                                    <EmojiPicker
                                                        onEmojiClick={(emojiData) => handleEmojiClick(emojiData, sectionIndex, widgetIndex)}
                                                        theme={theme === 'dark' ? 'dark' as Theme : 'light' as Theme}
                                                    />
                                                </div>
                                            )}
                                            {showColorPicker && activeWidget?.section === sectionIndex && activeWidget?.widget === widgetIndex && (
                                                <div className="absolute z-10 bg-card p-4 rounded-lg shadow-lg">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-medium text-text-primary">Color Picker</span>
                                                        <button
                                                            onClick={() => setShowColorPicker(false)}
                                                            className="text-text-secondary hover:text-text-primary"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                    <HexColorPicker
                                                        color={currentColor}
                                                        onChange={(color) => {
                                                            setCurrentColor(color);
                                                            insertColorText(sectionIndex, widgetIndex, color);
                                                        }}
                                                        onMouseLeave={() => setShowColorPicker(false)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div data-color-mode={theme}>
                                            <MDEditor
                                                value={widget.content}
                                                onChange={(val) => updateWidget(sectionIndex, widgetIndex, val || '')}
                                                preview="edit"
                                                className="bg-card dark:bg-gray-800"
                                            />
                                        </div>
                                        <div className="text-sm text-text-secondary">
                                            <p>Formatting Guide:</p>
                                            <ul className="list-disc list-inside">
                                                <li><code>**text**</code> or <code>__text__</code> for <b>bold</b></li>
                                                <li><code>*text*</code> or <code>_text_</code> for <i>italic</i></li>
                                                <li><code>[link text](URL)</code> for links</li>
                                                <li>Select text and use the color picker to add color</li>
                                                <li>Click "Add Emoji" to insert emojis anywhere in your text</li>
                                                <li>Use line breaks for new paragraphs</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {messageFormat === 'cards' && (
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => addWidget(sectionIndex, 'textParagraph')}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-primary bg-card dark:bg-gray-800 border border-border rounded-md hover:bg-secondary transition-colors"
                                >
                                    <Plus size={16} />
                                    <Type size={16} />
                                    <span className="hidden sm:inline">Add Text</span>
                                </button>
                                <button
                                    onClick={() => addWidget(sectionIndex, 'image')}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-primary bg-card dark:bg-gray-800 border border-border rounded-md hover:bg-secondary transition-colors"
                                >
                                    <Plus size={16} />
                                    <ImageIcon size={16} />
                                    <span className="hidden sm:inline">Add Image</span>
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                <button
                    onClick={sendMessage}
                    className="flex items-center justify-center gap-2 w-full bg-accent text-white py-3 px-6 rounded-md hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors"
                >
                    <Send className="w-5 h-5" />
                    Send Message
                </button>
            </div>
        </div>
    );
}