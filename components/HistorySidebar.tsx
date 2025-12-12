import React from 'react';
import { X, MessageSquare, Trash2, Plus } from 'lucide-react';
import { ChatSession } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onNewChat: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onNewChat
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-80 bg-white dark:bg-gray-900 z-[60] transform transition-transform duration-300 ease-in-out shadow-2xl border-r border-gray-200 dark:border-gray-800 flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <MessageSquare className="text-blue-600" /> Chat History
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={() => { onNewChat(); onClose(); }}
            className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md font-semibold mb-4"
          >
            <Plus size={18} /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No chat history yet.
            </div>
          ) : (
            sessions.sort((a, b) => b.lastUpdated - a.lastUpdated).map((session) => (
              <div
                key={session.id}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                  currentSessionId === session.id
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                    : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => { onSelectSession(session.id); onClose(); }}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare size={16} className="shrink-0 opacity-60" />
                  <span className="truncate text-sm font-medium">{session.title || 'Untitled Chat'}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
                  title="Delete Chat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest font-bold">
            SM GAMING STUDIO
          </p>
        </div>
      </div>
    </>
  );
};

export default HistorySidebar;