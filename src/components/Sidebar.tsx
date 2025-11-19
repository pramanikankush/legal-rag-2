import React, { useState, useEffect } from 'react';
import {
  MessageSquarePlus,
  History,
  Settings,
  LogOut,
  FileText,
  Upload,
  X,
  Menu,
  ChevronLeft,
  MessageSquare
} from 'lucide-react';
import { User, LegalDocument, ChatSession } from '../types';
import { vectorStore } from '../services/ragService';
import { chatService } from '../services/chatService';

interface SidebarProps {
  onNewChat: () => void;
  user: User | null;
  onLogout: () => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onClose: () => void;
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
}

export function Sidebar({
  onNewChat,
  user,
  onLogout,
  onOpenSettings,
  isOpen,
  onClose,
  currentChatId,
  onSelectChat
}: SidebarProps) {
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [docs, setDocs] = useState<LegalDocument[]>([]);
  const [uploading, setUploading] = useState(false);

  const loadChats = async () => {
    const chats = await chatService.getRecentChats();
    setRecentChats(chats);
  };

  useEffect(() => {
    loadChats();

    const loadDocs = async () => {
      await vectorStore.init();
      const documents = await vectorStore.getDocuments();
      setDocs(documents);
    };
    loadDocs();
  }, []);

  // Refresh chats when sidebar opens or currentChatId changes (to show new titles)
  useEffect(() => {
    if (isOpen || currentChatId) {
      loadChats();
    }
  }, [isOpen, currentChatId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;

      const newDoc: LegalDocument = {
        id: Date.now().toString(),
        title: file.name,
        type: 'CONTRACT', // Default type, could be inferred or selected
        date: new Date().toISOString().split('T')[0],
        content: text
      };

      try {
        await vectorStore.ingest(newDoc);
        // Refresh docs list
        const updatedDocs = await vectorStore.getDocuments();
        setDocs(updatedDocs);
      } catch (error) {
        console.error("Ingestion failed", error);
        alert("Failed to ingest document. Please try again.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-[#0f1419] text-slate-400 flex flex-col border-r border-slate-800/50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-200 font-semibold text-lg">
            <span className="text-lg">⚖️</span>
            LexAI
          </div>
          <button onClick={onClose} className="md:hidden p-1 hover:bg-slate-800 rounded">
            <X size={18} />
          </button>
        </div>

        {/* New Inquiry Button - RESTORED ORIGINAL */}
        <div className="px-6 pt-6 pb-4">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium border border-gray-200 shadow-sm"
          >
            <span className="text-lg">+</span>
            New Inquiry
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 space-y-6 custom-scrollbar">

          {/* Recent Inquiries - RESTORED ORIGINAL */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Recent Inquiries
            </h3>
            <div className="space-y-2">
              {recentChats.length === 0 ? (
                <div className="text-sm text-slate-600 italic">No recent chats</div>
              ) : (
                recentChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={`w-full text-left px-0 py-2 text-sm transition-colors ${currentChatId === chat.id
                      ? 'text-blue-400'
                      : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <div className="font-normal truncate">{chat.title}</div>
                    <div className="text-xs text-slate-600 truncate mt-0.5">
                      {chat.preview}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Knowledge Base - RESTORED ORIGINAL */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Knowledge Base
              </h3>
              <span className="text-xs bg-slate-800/50 px-2 py-0.5 rounded text-slate-500">
                {docs.length}
              </span>
            </div>

            {/* Document List */}
            <div className="space-y-2 mb-4">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start gap-2 py-2 text-sm"
                >
                  <span className="text-blue-400 mt-0.5">•</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-200 font-medium truncate">{doc.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                        {doc.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Upload Context Button - RESTORED ORIGINAL */}
            <label className="flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-slate-700/50 rounded-lg text-slate-500 hover:text-slate-400 hover:border-slate-600 transition-all cursor-pointer group">
              {uploading ? (
                <span className="text-sm animate-pulse">Indexing...</span>
              ) : (
                <>
                  <Upload size={20} className="mb-2 text-slate-600 group-hover:text-slate-500" />
                  <span className="text-sm uppercase tracking-wide">Upload Context</span>
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept=".txt,.md,.json"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* User Profile - RESTORED ORIGINAL */}
        <div className="px-6 py-4 border-t border-slate-800/50">
          {user ? (
            <div className="mb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-semibold text-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-3">
                <button
                  onClick={onOpenSettings}
                  className="hover:text-slate-300 transition-colors"
                >
                  Settings
                </button>
                <span>•</span>
                <button
                  onClick={onLogout}
                  className="hover:text-slate-300 transition-colors"
                >
                  Log Out
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-sm text-slate-500 mb-3">
              Not logged in
            </div>
          )}
        </div>
      </aside>
    </>
  );
}