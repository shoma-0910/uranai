import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function DeleteAccountModal({ isOpen, onClose, userId }: DeleteAccountModalProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async () => {
    if (!userId) {
      toast.error('ユーザーIDが無効です');
      onClose();
      return;
    }

    setLoading(true);
    try {
      // Check for active bookings
      const { data: hasBookings } = await supabase.rpc('has_active_bookings', {
        user_id: userId
      });

      if (hasBookings) {
        toast.error('アクティブな予約があるため、アカウントを削除できません');
        onClose();
        return;
      }

      // Delete profile (this will cascade to related data)
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;

      // Sign out
      await supabase.auth.signOut();
      
      toast.success('アカウントを削除しました');
      navigate('/');
    } catch (error) {
      console.error('アカウント削除エラー:', error);
      toast.error('アカウントの削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-xl font-bold">アカウントの削除</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-gray-600">
            アカウントを削除すると、以下のデータが完全に削除され、復元することはできません：
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>プロフィール情報</li>
            <li>予約履歴</li>
            <li>メッセージ履歴</li>
            <li>その他のアカウント関連データ</li>
          </ul>
          <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <p className="text-red-800 font-medium">
              この操作は取り消すことができません。本当に削除しますか？
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading ? '削除中...' : '削除する'}
          </button>
        </div>
      </div>
    </div>
  );
}