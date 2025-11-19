import { ChatSession } from "../types";

// Mock data
const STORAGE_KEY = 'lexai_chats';

export const chatService = {
    // Helper to get all chats from storage
    getAllChats: (): ChatSession[] => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("Failed to parse chats", e);
            return [];
        }
    },

    // Save a specific chat (create or update)
    saveChat: async (chat: ChatSession): Promise<void> => {
        const chats = chatService.getAllChats();
        const index = chats.findIndex(c => c.id === chat.id);

        if (index >= 0) {
            chats[index] = chat;
        } else {
            chats.unshift(chat);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    },

    getRecentChats: async (): Promise<ChatSession[]> => {
        // Simulate network delay for realism
        await new Promise(resolve => setTimeout(resolve, 300));
        return chatService.getAllChats().sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    },

    getChat: async (id: string): Promise<ChatSession | undefined> => {
        await new Promise(resolve => setTimeout(resolve, 200));
        const chats = chatService.getAllChats();
        return chats.find(c => c.id === id);
    },

    createChat: async (title: string = "New Inquiry"): Promise<ChatSession> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        const newChat: ChatSession = {
            id: Date.now().toString(),
            title,
            date: new Date().toISOString(),
            preview: 'New inquiry started...',
            messages: []
        };

        await chatService.saveChat(newChat);
        return newChat;
    },

    deleteChat: async (id: string): Promise<void> => {
        const chats = chatService.getAllChats().filter(c => c.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    }
};
