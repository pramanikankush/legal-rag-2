import React, { useState } from 'react';
import { ModelType } from '../types';

interface ChatInputProps {
    onSend: (query: string) => void;
    isProcessing: boolean;
    placeholder?: string;
    mode: 'hero' | 'footer';
    selectedModel: ModelType;
    onModelSelect: (model: ModelType) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
    onSend,
    isProcessing,
    placeholder,
    mode,
    selectedModel,
    onModelSelect
}) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isProcessing) return;
        onSend(query);
        setQuery('');
    };

    const isHero = mode === 'hero';

    return (
        <form onSubmit={handleSubmit} className={`w-full relative z-20 ${isHero ? '' : 'max-w-4xl mx-auto'}`}>
            <div className={`relative group ${isHero ? '' : 'flex items-center gap-2'}`}>
                {/* Glow Effect (Hero Only) */}
                {isHero && (
                    <div className="absolute inset-0 bg-gradient-to-r from-legal-blue to-legal-gold rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
                )}

                <div className={`relative bg-slate-900 border border-slate-800 shadow-2xl flex ${isHero ? 'flex-col rounded-2xl' : 'flex-row items-center rounded-xl flex-1'} overflow-hidden transition-colors focus-within:border-slate-700`}>

                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={placeholder || "Describe a legal scenario..."}
                        className={`w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none ${isHero ? 'text-base md:text-lg px-4 md:px-6 py-4 md:py-6' : 'text-sm px-4 py-3'
                            }`}
                    />

                    {/* Hero Footer / Footer Actions */}
                    <div className={`${isHero ? 'flex flex-col md:flex-row items-stretch md:items-center justify-between px-4 md:px-6 py-3 bg-slate-900/50 border-t border-slate-800 gap-3 md:gap-0' : 'pr-2'}`}>

                        {/* Model Selectors */}
                        {isHero && (
                            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                                {[
                                    { id: ModelType.FLASH, label: 'Flash Lite', color: 'indigo' },
                                    { id: ModelType.THINKING, label: 'Thinking', color: 'amber' }
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => onModelSelect(m.id as ModelType)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${selectedModel === m.id
                                            ? `bg-${m.color}-500/10 text-${m.color}-400 ring-1 ring-${m.color}-500/50`
                                            : 'text-slate-500 hover:bg-slate-800'
                                            }`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full bg-${m.color}-500`}></span>
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Send Button */}
                        <button
                            type="submit"
                            disabled={isProcessing || !query.trim()}
                            className={`${isHero
                                ? 'flex items-center justify-center gap-2 bg-slate-100 hover:bg-white text-slate-900 px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-slate-100/10 w-full md:w-auto'
                                : 'p-2 text-slate-400 hover:text-legal-gold transition-colors'
                                } transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isHero ? (
                                <>
                                    {isProcessing ? 'Analyzing...' : 'Generate Analysis'}
                                    {!isProcessing && (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    )}
                                </>
                            ) : (
                                <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};
