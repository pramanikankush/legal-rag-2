import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LegalResult } from './components/LegalResult';
import { Auth } from './components/Auth';
import { SettingsModal } from './components/SettingsModal';
import { ChatInput } from './components/ChatInput';
import { generateLegalAnalysis } from './services/geminiService';
import { vectorStore } from './services/ragService';
import { authService } from './services/authService';
import { chatService } from "./services/chatService";
import { ModelType, ChatMessage, LegalResponse, SearchResult, User } from './types';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // App State
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.FLASH);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [query, setQuery] = useState<string>('');
  const [retrievedDocs, setRetrievedDocs] = useState<SearchResult[]>([]);

  // Scroll ref for auto-scroll to results
  const resultsEndRef = useRef<HTMLDivElement>(null);

  // Check for existing session on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setIsCheckingAuth(false);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setMessages([]);
    setCurrentChatId(null);
    setQuery('');
  };

  const handleNewChat = async () => {
    try {
      const newChat = await chatService.createChat();
      setCurrentChatId(newChat.id);
      setMessages([]);
      setQuery('');
      setRetrievedDocs([]);
      setIsProcessing(false);
      setIsSidebarOpen(false);
    } catch (error) {
      console.error("Failed to create new chat", error);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    try {
      const chat = await chatService.getChat(chatId);
      if (chat) {
        setCurrentChatId(chat.id);
        setMessages(chat.messages || []);
        setRetrievedDocs([]); // Could store this too if needed
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error("Failed to load chat", error);
    }
  };

  const handleSend = async (query: string) => {
    if (!currentChatId) {
      // Create a chat if one doesn't exist (e.g. from Hero)
      const newChat = await chatService.createChat(query.slice(0, 30) + "...");
      setCurrentChatId(newChat.id);
    }

    const userMsg: ChatMessage = {
      role: 'user',
      content: query,
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsProcessing(true);
    setRetrievedDocs([]);

    // Save user message immediately
    if (currentChatId) {
      const chat = await chatService.getChat(currentChatId);
      if (chat) {
        chat.messages = updatedMessages;
        chat.title = chat.messages[0].content.toString().slice(0, 30) + "..."; // Update title based on first msg
        chat.preview = query.slice(0, 50) + "...";
        await chatService.saveChat(chat);
      }
    }

    try {
      // 1. Retrieve Context
      const results = await vectorStore.retrieve(query, 4);
      setRetrievedDocs(results);

      let contextText = "";
      if (results.length > 0) {
        const matches = results.map(r =>
          `[Source: ${r.title} (${r.type})] \n${r.content}`
        ).join('\n\n');

        contextText = `<RAG_CONTEXT>\n${matches}\n</RAG_CONTEXT>`;
      } else {
        contextText = "No relevant documents found in the Knowledge Base.";
      }

      // 2. Generate Analysis (Multi-turn context could be added here by passing history)
      const response = await generateLegalAnalysis(query, contextText, selectedModel);

      const modelMsg: ChatMessage = {
        role: 'model',
        content: response,
        isStructured: true,
        timestamp: Date.now(),
        sources: results // Attach sources to this specific message
      };

      const finalMessages = [...updatedMessages, modelMsg];
      setMessages(finalMessages);

      // Save model response
      if (currentChatId) {
        const chat = await chatService.getChat(currentChatId);
        if (chat) {
          chat.messages = finalMessages;
          chat.preview = (response.executiveSummary || "Analysis complete").slice(0, 50) + "...";
          await chatService.saveChat(chat);
        }
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'system',
        content: `Error: ${(error as Error).message || "Unable to generate legal analysis."}`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0 && !isProcessing) {
      resultsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isProcessing]);

  // Show loading splash while checking auth
  if (isCheckingAuth) {
    return <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-legal-gold border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  // Show Auth Screen if not logged in
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const hasContent = messages.length > 0;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <Sidebar
        onNewChat={handleNewChat}
        user={user}
        onLogout={handleLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onUpdateUser={setUser}
        onClearHistory={() => setMessages([])}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Main Scrollable Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center scroll-smooth">
          <div className={`w-full max-w-5xl px-8 flex flex-col min-h-full ${hasContent ? 'pb-32 pt-8' : 'justify-center pb-20'}`}>

            {/* 1. Hero Section (Only when empty) */}
            {!hasContent && (
              <div className="w-full max-w-3xl mx-auto mb-12 animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-10">
                  <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-slate-100 to-slate-400 mb-4">
                    Legal Intelligence, Amplified.
                  </h2>
                  <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                    Welcome back, {user.name.split(' ')[0]}. Analyze contracts and assess risks.
                  </p>
                </div>

                <ChatInput
                  onSend={handleSend}
                  isProcessing={isProcessing}
                  mode="hero"
                  selectedModel={selectedModel}
                  onModelSelect={setSelectedModel}
                />
              </div>
            )}

            {/* 2. Results Stream */}
            {messages.map((msg, idx) => {
              if (msg.role === 'user') return null;

              const promptMsg = messages[idx - 1];
              const promptText = promptMsg?.role === 'user' ? (promptMsg.content as string) : "Legal Inquiry";

              return (
                <div key={idx} className="flex-1 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 mb-12">

                  <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-800">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Analysis For</div>
                      <h2 className="text-xl font-medium text-slate-200">{promptText}</h2>
                    </div>
                  </div>

                  {msg.role === 'system' ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
                      {msg.content as string}
                    </div>
                  ) : (
                    <LegalResult data={msg.content as LegalResponse} />
                  )}

                  {/* Source Footer for this specific message */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-8">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">RAG Context Sources</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {msg.sources.map((doc, i) => (
                          <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">{doc.type}</span>
                              <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                {(doc.similarity * 100).toFixed(0)}% Match
                              </span>
                            </div>
                            <div className="text-sm font-medium text-slate-300 truncate" title={doc.title}>{doc.title}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {isProcessing && (
              <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-pulse">
                <div className="w-12 h-12 border-4 border-legal-gold border-t-transparent rounded-full animate-spin"></div>
                <div className="text-slate-400 text-sm font-medium tracking-widest uppercase">Reasoning & Analyzing Precedents...</div>
              </div>
            )}

            <div ref={resultsEndRef} />
          </div>
        </main>

        {/* 3. Sticky Footer Input (Only when content exists) */}
        {hasContent && (
          <div className="absolute bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 p-4 z-30">
            <div className="max-w-4xl mx-auto">
              <ChatInput
                onSend={handleSend}
                isProcessing={isProcessing}
                mode="footer"
                placeholder="Ask a follow-up question..."
                selectedModel={selectedModel}
                onModelSelect={setSelectedModel}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;