import { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { MessageSquare, Send, Plus, Image as ImageIcon, Type, Trash, MoveUp, MoveDown, X, Smile } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { HexColorPicker } from 'react-colorful';
import EmojiPicker from 'emoji-picker-react';
import { webhookOptions } from './config/webhooks';

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

function App() {
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

    const convertMarkdownToHtml = (markdown: string): string => {
        return markdown
            .replace(/\{color:([\w#]+)}(.*?)\{\/color}/g, '<font color="$1">$2</font>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/__(.*?)__/g, '<b>$1</b>')
            .replace(/\*(.*?)\*/g, '<i>$1</i>')
            .replace(/_(.*?)_/g, '<i>$1</i>')
            .replace(/\[([^\]]+)]\(([^)]+)\)/g, '<a href="$2">$1</a>')
            .replace(/\n/g, '<br>');
    };

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
            newSections[sectionIndex].widgets[widgetIndex] = {
                ...newSections[sectionIndex].widgets[widgetIndex],
                content,
            };
            return newSections;
        });
    };

    const insertEmoji = (sectionIndex: number, widgetIndex: number, emoji: string) => {
        const widget = sections[sectionIndex].widgets[widgetIndex];
        if (widget.type !== 'textParagraph') return;

        const textarea = document.querySelector(`textarea[data-section="${sectionIndex}"][data-widget="${widgetIndex}"]`) as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const text = widget.content;
        const newContent = text.substring(0, start) + emoji + text.substring(start);
        updateWidget(sectionIndex, widgetIndex, newContent);
        setShowEmojiPicker(false);
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
                            header: `<strong>${ section.header }</strong>`,
                            widgets: section.widgets.map((widget, index) => {
                                if (widget.type === 'image') {
                                    return {
                                        image: {
                                            imageUrl: widget.content,
                                            altText: `MessageImage-${index}`,
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
            const response = await fetch(selectedWebhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            toast.success('Message sent successfully!');
        } catch (error) {
            toast.error('Failed to send message. Please check your webhook URL.');
        }
    };

    const insertColorText = (sectionIndex: number, widgetIndex: number, color: string) => {
        const widget = sections[sectionIndex].widgets[widgetIndex];
        if (widget.type !== 'textParagraph') return;

        const textarea = document.querySelector(`textarea[data-section="${sectionIndex}"][data-widget="${widgetIndex}"]`) as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = widget.content;
        const selectedText = text.substring(start, end);
        const colorTag = `{color:${color}}${selectedText}{/color}`;

        const newContent = text.substring(0, start) + colorTag + text.substring(end);
        updateWidget(sectionIndex, widgetIndex, newContent);
        setShowColorPicker(false);
    };

    const openColorPicker = (sectionIndex: number, widgetIndex: number) => {
        setActiveWidget({ section: sectionIndex, widget: widgetIndex });
        setShowColorPicker(true);
    };

    const handleFormatChange = (format: MessageFormat) => {
        if (format === 'plain') {
            setSections(current => [{
                ...current[0],
                widgets: [current[0].widgets.find(w => w.type === 'textParagraph') || current[0].widgets[0]]
            }]);
        }
        setMessageFormat(format);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-8">
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex items-center gap-3 mb-8">
                    <MessageSquare className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold text-gray-800">Google Chat Webhook Sender</h1>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Google Chat Group
                            </label>
                            <select
                                value={selectedWebhook}
                                onChange={(e) => setSelectedWebhook(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            >
                                {webhookOptions.map((option) => (
                                    <option key={option.url} value={option.url}>
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Message Format
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleFormatChange('plain')}
                                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
                                        messageFormat === 'plain'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    Plain Text
                                </button>
                                <button
                                    onClick={() => handleFormatChange('cards')}
                                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
                                        messageFormat === 'cards'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    Cards
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Section Header
                            </label>
                            <input
                                type="text"
                                value={section.header}
                                onChange={(e) => updateSectionHeader(sectionIndex, e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter section header..."
                            />
                        </div>

                        {section.widgets.map((widget, widgetIndex) => (
                            <div key={widget.id} className="mb-6 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {widget.type === 'image' ? 'Image URL' : 'Text Content'}
                  </span>
                                    {messageFormat === 'cards' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => moveWidget(sectionIndex, widgetIndex, 'up')}
                                                disabled={widgetIndex === 0}
                                                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                                            >
                                                <MoveUp size={16} />
                                            </button>
                                            <button
                                                onClick={() => moveWidget(sectionIndex, widgetIndex, 'down')}
                                                disabled={widgetIndex === section.widgets.length - 1}
                                                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                                            >
                                                <MoveDown size={16} />
                                            </button>
                                            <button
                                                onClick={() => removeWidget(sectionIndex, widgetIndex)}
                                                className="p-1 text-red-500 hover:text-red-700"
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {widget.type === 'image' ? (
                                    <input
                                        type="url"
                                        value={widget.content}
                                        onChange={(e) => updateWidget(sectionIndex, widgetIndex, e.target.value)}
                                        placeholder="Enter image URL..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            <button
                                                onClick={() => openColorPicker(sectionIndex, widgetIndex)}
                                                className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50 flex items-center gap-2"
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
                                                }}
                                                className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <Smile size={16} />
                                                Add Emoji
                                            </button>
                                            {showEmojiPicker && activeWidget?.section === sectionIndex && activeWidget?.widget === widgetIndex && (
                                                <div className="absolute z-20">
                                                    <EmojiPicker onEmojiClick={(emojiData) => insertEmoji(sectionIndex, widgetIndex, emojiData.emoji)} />
                                                </div>
                                            )}
                                            {showColorPicker && activeWidget?.section === sectionIndex && activeWidget?.widget === widgetIndex && (
                                                <div className="absolute z-10 bg-white p-4 rounded-lg shadow-lg">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-medium">Color Picker</span>
                                                        <button
                                                            onClick={() => setShowColorPicker(false)}
                                                            className="text-gray-500 hover:text-gray-700"
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
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div data-color-mode="light">
                                            <MDEditor
                                                value={widget.content}
                                                onChange={(val) => updateWidget(sectionIndex, widgetIndex, val || '')}
                                                preview="edit"
                                                textareaProps={{
                                                    'data-section': sectionIndex.toString(),
                                                    'data-widget': widgetIndex.toString()
                                                }}
                                            />
                                        </div>
                                        <div className="text-sm text-gray-600">
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
                            <div className="flex gap-2">
                                <button
                                    onClick={() => addWidget(sectionIndex, 'textParagraph')}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    <Plus size={16} />
                                    <Type size={16} />
                                    Add Text
                                </button>
                                <button
                                    onClick={() => addWidget(sectionIndex, 'image')}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    <Plus size={16} />
                                    <ImageIcon size={16} />
                                    Add Image
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                <button
                    onClick={sendMessage}
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    <Send className="w-5 h-5" />
                    Send Message
                </button>
            </div>
            <Toaster position="bottom-right" />
        </div>
    );
}

export default App;