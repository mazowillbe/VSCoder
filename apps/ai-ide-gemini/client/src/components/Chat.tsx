import { useState } from 'react';
import classNames from 'classnames';
import { useChatStore } from '../store/chatStore';

export default function Chat() {
  const { messages, sendMessage, isLoading } = useChatStore();
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>Start a conversation with the AI assistant</p>
            <p className="text-sm mt-2">Ask questions about your code or request assistance</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={classNames('p-3 rounded-lg', {
                'bg-blue-600 ml-8': msg.role === 'user',
                'bg-gray-700 mr-8': msg.role === 'assistant',
              })}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <span className="text-xs text-gray-400 mt-1 block">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
        {isLoading && (
          <div className="bg-gray-700 mr-8 p-3 rounded-lg">
            <p className="text-sm text-gray-400">AI is thinking...</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <textarea
            className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-500"
            placeholder="Ask the AI assistant..."
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            className={classNames(
              'px-4 py-2 rounded font-medium text-sm',
              isLoading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            )}
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
