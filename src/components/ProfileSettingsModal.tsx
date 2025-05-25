import React, { useState } from 'react';
import { X, User, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string | null;
  currentEmail: string;
  onUpdate: () => void;
}

export function ProfileSettingsModal({ isOpen, onClose, currentName, currentEmail, onUpdate }: ProfileSettingsModalProps) {
  const [name, setName] = useState(currentName || '');
  const [email, setEmail] = useState(currentEmail);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザー情報が見つかりません');

      // Update auth email if changed
      if (email !== currentEmail) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email
        });
        if (emailError) throw emailError;
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: name,
          email: email,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast.success('プロフィールを更新しました');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      toast.error(error instanceof Error ? error.message : 'プロフィールの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">プロフィール設定</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              お名前
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B8860B] h-5 w-5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#DAA520]/20 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent"
                placeholder="山田 太郎"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B8860B] h-5 w-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#DAA520]/20 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#B8860B] hover:bg-[#DAA520] text-white py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '更新中...' : '変更を保存'}
          </button>
        </form>
      </div>
    </div>
  );
}