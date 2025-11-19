import React, { useState } from 'react';
import { User } from '../types';
import { settingsService } from '../services/settingsService';
import { authService } from '../services/authService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser: (user: User) => void;
  onClearHistory: () => void;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  onUpdateUser,
  onClearHistory,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'data' | 'system'>('account');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [nameEdit, setNameEdit] = useState(user.name);

  if (!isOpen) return null;

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    try {
      const updated = await authService.updateProfile(user, { name: nameEdit });
      onUpdateUser(updated);
      showNotify('Profile updated successfully');
    } catch (e) {
      showNotify('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all chat history? This cannot be undone.')) return;
    
    setIsLoading(true);
    try {
      await settingsService.clearChatHistory();
      onClearHistory();
      showNotify('Chat history cleared');
    } catch (e) {
      showNotify('Failed to clear history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      await settingsService.exportData();
      showNotify('Data export started. Check your email.');
    } catch (e) {
      showNotify('Export failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = prompt('To delete your account, type "DELETE"');
    if (confirmText !== 'DELETE') return;

    setIsLoading(true);
    try {
      await settingsService.deleteAccount();
      await authService.logout();
      onLogout();
    } catch (e) {
      showNotify('Failed to delete account');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-200">Settings</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar Navigation */}
          <div className="w-48 border-r border-slate-800 bg-slate-900/50 p-4 space-y-1">
            {[
              { id: 'account', label: 'Account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
              { id: 'data', label: 'Data & Privacy', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
              { id: 'system', label: 'System', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8 overflow-y-auto bg-slate-950/30">
            {notification && (
              <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {notification}
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-200 mb-4">Profile Information</h3>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200">{user.role.toUpperCase()}</div>
                      <div className="text-xs text-slate-500">{user.id}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Display Name</label>
                      <input 
                        type="text" 
                        value={nameEdit}
                        onChange={(e) => setNameEdit(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-slate-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                      <input 
                        type="email" 
                        value={user.email}
                        disabled
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    <div className="pt-2">
                      <button 
                        onClick={handleUpdateProfile}
                        disabled={isLoading}
                        className="bg-slate-100 hover:bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-medium text-slate-200 mb-2">Export Data</h3>
                  <p className="text-xs text-slate-500 mb-4">Download a copy of your legal inquiries and RAG context history.</p>
                  <button 
                    onClick={handleExportData}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export All Data (JSON)
                  </button>
                </div>

                <div className="border-t border-slate-800 pt-6">
                  <h3 className="text-sm font-medium text-red-400 mb-2">Danger Zone</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                       <div>
                         <div className="text-sm text-slate-300">Clear Chat History</div>
                         <div className="text-xs text-slate-500">Permanently remove all local chat sessions.</div>
                       </div>
                       <button 
                          onClick={handleClearHistory}
                          disabled={isLoading}
                          className="text-xs font-bold text-red-400 hover:text-red-300 border border-red-500/30 px-3 py-1.5 rounded hover:bg-red-500/10 transition-colors disabled:opacity-50"
                       >
                         Clear History
                       </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                       <div>
                         <div className="text-sm text-slate-300">Delete Account</div>
                         <div className="text-xs text-slate-500">Revoke access and delete all personal data.</div>
                       </div>
                       <button 
                          onClick={handleDeleteAccount}
                          disabled={isLoading}
                          className="text-xs font-bold text-slate-100 bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                       >
                         Delete
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6">
                 <div>
                   <h3 className="text-sm font-medium text-slate-200 mb-4">Preferences</h3>
                   <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
                      <span className="text-sm text-slate-300">Enable Thinking Model by Default</span>
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-legal-gold focus:ring-legal-gold" />
                   </label>
                 </div>
                 <div>
                   <h3 className="text-sm font-medium text-slate-200 mb-2">About</h3>
                   <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                      <p className="text-sm text-slate-400">LexAI Version 2.6.0</p>
                      <p className="text-xs text-slate-500 mt-1">Powered by Gemini 2.5 Pro & Vector Search</p>
                   </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};