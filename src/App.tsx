import { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { MessageSquare, Send, Plus, Image as ImageIcon, Type, Trash, MoveUp, MoveDown } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

type WidgetType = 'image' | 'textParagraph';

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
  const [webhookUrl, setWebhookUrl] = useState('');
  const [sections, setSections] = useState<Section[]>([
    {
      header: 'My Message',
      widgets: [
        { type: 'textParagraph', content: 'Write your message here...', id: '1' },
      ],
    },
  ]);

  const addWidget = (sectionIndex: number, type: WidgetType) => {
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

  const removeWidget = (sectionIndex: number, widgetIndex: number) => {
    setSections(current => {
      const newSections = [...current];
      newSections[sectionIndex].widgets.splice(widgetIndex, 1);
      return [...newSections];
    });
  };

  const moveWidget = (sectionIndex: number, widgetIndex: number, direction: 'up' | 'down') => {
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

  const sendMessage = async () => {
    if (!webhookUrl) {
      toast.error('Please enter a webhook URL');
      return;
    }

    if (sections[0].widgets.length === 0) {
      toast.error('Please add at least one widget');
      return;
    }

    const message = {
      sections: sections.map(section => ({
        header: section.header,
        collapsible: false,
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
              text: widget.content,
            },
          };
        }),
      })),
    };

    try {
      console.log(message)
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      console.log(response);

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      toast.success('Message sent successfully!');
    } catch (error) {
      toast.error('Failed to send message. Please check your webhook URL.');
      throw error
    }
  };

  return (
      <div className="min-h-screen bg-gray-50 pb-8">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Google Chat Webhook Sender</h1>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL
            </label>
            <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://chat.googleapis.com/v1/spaces/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
                          <div data-color-mode="light">
                            <MDEditor
                                value={widget.content}
                                onChange={(val) => updateWidget(sectionIndex, widgetIndex, val || '')}
                                preview="edit"
                            />
                          </div>
                      )}
                    </div>
                ))}

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