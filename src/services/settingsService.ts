// Mock backend settings handlers
export const settingsService = {
  clearChatHistory: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // In a real app, this would call DELETE /api/chats
    console.log('Backend: Chat history cleared');
    return true;
  },

  exportData: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Backend: Data exported');
    return { url: 'blob:mock-export-url' };
  },

  deleteAccount: async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Backend: Account deleted');
    return true;
  },
  
  updatePreferences: async (prefs: any) => {
     await new Promise(resolve => setTimeout(resolve, 400));
     console.log('Backend: Preferences updated', prefs);
     return true;
  }
};