import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Settings, Trash2, Clock, DollarSign, Star, X, Check, AlertCircle, Bell, Plus, Edit2 } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  user_type: string;
  created_at: string;
}

interface FortuneTeller {
  id: string;
  user_id: string;
  name: string;
  title: string;
  approved: boolean;
  profiles: {
    email: string;
  };
  created_at: string;
}

interface Booking {
  id: string;
  start_time: string;
  duration_minutes: number;
  total_price: number;
  status: string;
  notes: string | null;
  created_at: string;
  user_id: string;
  fortune_teller_id: string;
  profiles: {
    email: string;
    full_name: string | null;
  };
  fortune_teller: {
    name: string;
    title: string;
  };
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  published_at: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, { text: string; class: string }> = {
  pending: { text: '予約済み', class: 'bg-green-100 text-green-800' },
  completed: { text: '鑑定済み', class: 'bg-blue-100 text-blue-800' },
  cancelled: { text: 'キャンセル', class: 'bg-red-100 text-red-800' },
  default: { text: 'その他', class: 'bg-gray-100 text-gray-800' }
};

export function AdminPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<Profile[]>([]);
  const [fortuneTellers, setFortuneTellers] = useState<FortuneTeller[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookings' | 'users' | 'fortune-tellers' | 'announcements'>('bookings');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'user' | 'fortune-teller' | 'announcement' | null>(null);
  const [deleteData, setDeleteData] = useState<any>(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    published_at: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (profile?.user_type !== 'admin') {
        toast.error('管理者権限がありません');
        navigate('/');
        return;
      }

      loadUsers();
      loadFortuneTellers();
      loadBookings();
      loadAnnouncements();
    } catch (error) {
      console.error('管理者確認エラー:', error);
      toast.error('管理者確認に失敗しました');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'user');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('ユーザー情報の取得に失敗しました');
    }
  };

  const loadFortuneTellers = async () => {
    try {
      const { data, error } = await supabase
        .from('fortune_tellers')
        .select('*, profiles!fortune_tellers_user_id_fkey(email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFortuneTellers(data || []);
    } catch (error) {
      console.error('Failed to load fortune tellers:', error);
      toast.error('占い師情報の取得に失敗しました');
    }
  };

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles!bookings_user_id_fkey (
            email,
            full_name
          ),
          fortune_teller:fortune_tellers!bookings_fortune_teller_id_fkey (
            name,
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      toast.error('予約情報の取得に失敗しました');
    }
  };

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Failed to load announcements:', error);
      toast.error('お知らせの取得に失敗しました');
    }
  };

  const handleApproval = async (fortuneTellerId: string, approved: boolean) => {
    try {
      const { error } = await supabase.rpc(
        'approve_fortune_teller',
        { 
          fortune_teller_id: fortuneTellerId,
          should_approve: approved
        }
      );

      if (error) throw error;

      toast.success(`占い師を${approved ? '承認' : '非承認'}しました`);
      loadFortuneTellers();
    } catch (error) {
      console.error('承認処理に失敗しました:', error);
      toast.error('承認処理に失敗しました');
    }
  };

  const hasActiveBookings = async (id: string, type: 'user' | 'fortune-teller'): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc(
        type === 'user' ? 'has_active_bookings' : 'has_fortune_teller_active_bookings',
        type === 'user' ? { profile_id: id } : { fortune_teller_id: id }
      );

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('予約確認エラー:', error);
      return false;
    }
  };

  const confirmDelete = async (type: 'user' | 'fortune-teller' | 'announcement', id: string, data: any) => {
    if (type === 'announcement') {
      setShowDeleteConfirm(id);
      setDeleteType(type);
      setDeleteData(data);
      return;
    }

    const hasBookings = await hasActiveBookings(id, type);
    if (hasBookings) {
      toast.error('アクティブな予約があるため削除できません');
      return;
    }

    setShowDeleteConfirm(id);
    setDeleteType(type);
    setDeleteData(data);
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm || !deleteType || !deleteData) return;

    try {
      if (deleteType === 'user') {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', showDeleteConfirm);

        if (error) throw error;
        toast.success('ユーザーを削除しました');
        loadUsers();
      } else if (deleteType === 'fortune-teller') {
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', deleteData.user_id);

        if (profileError) throw profileError;
        toast.success('占い師を削除しました');
        loadFortuneTellers();
      } else if (deleteType === 'announcement') {
        const { error } = await supabase.rpc('manage_announcement_v2', {
          p_action: 'delete',
          p_id: showDeleteConfirm,
          p_title: null,
          p_content: null,
          p_published_at: null
        });

        if (error) throw error;
        toast.success('お知らせを削除しました');
        loadAnnouncements();
      }
    } catch (error) {
      console.error('削除に失敗しました:', error);
      toast.error('削除に失敗しました');
    } finally {
      setShowDeleteConfirm(null);
      setDeleteType(null);
      setDeleteData(null);
    }
  };

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.rpc('manage_announcement_v2', {
        p_action: editingAnnouncement ? 'update' : 'create',
        p_id: editingAnnouncement?.id || null,
        p_title: announcementForm.title,
        p_content: announcementForm.content,
        p_published_at: new Date(announcementForm.published_at).toISOString()
      });

      if (error) throw error;

      toast.success(editingAnnouncement ? 'お知らせを更新しました' : 'お知らせを作成しました');
      loadAnnouncements();
      setShowAnnouncementModal(false);
      setEditingAnnouncement(null);
      setAnnouncementForm({
        title: '',
        content: '',
        published_at: new Date().toISOString().slice(0, 16)
      });
    } catch (error) {
      console.error('お知らせの保存に失敗しました:', error);
      toast.error('お知らせの保存に失敗しました');
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      published_at: new Date(announcement.published_at).toISOString().slice(0, 16)
    });
    setShowAnnouncementModal(true);
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    
    return `${month}月${day}日(${dayOfWeek}) ${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8860B]"></div>
      </div>
    );
  }

  // 承認待ちの占い師を抽出
  const pendingFortuneTellers = fortuneTellers.filter(ft => !ft.approved);
  const approvedFortuneTellers = fortuneTellers.filter(ft => ft.approved);

  return (
    <div className="min-h-screen bg-[#FFFAF0] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <BackButton />
          <h1 className="text-3xl font-bold text-[#B8860B]">管理画面</h1>
          <div className="w-10" />
        </div>

        <div className="flex gap-4 border-b border-[#DAA520]/20">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'bookings'
                ? 'text-[#B8860B]'
                : 'text-gray-500 hover:text-[#B8860B]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              予約管理
            </div>
            {activeTab === 'bookings' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#B8860B]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'users'
                ? 'text-[#B8860B]'
                : 'text-gray-500 hover:text-[#B8860B]'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              ユーザー管理
            </div>
            {activeTab === 'users' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#B8860B]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('fortune-tellers')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'fortune-tellers'
                ? 'text-[#B8860B]'
                : 'text-gray-500 hover:text-[#B8860B]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              占い師管理
              {pendingFortuneTellers.length > 0 && (
                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
                  {pendingFortuneTellers.length}
                </span>
              )}
            </div>
            {activeTab === 'fortune-tellers' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#B8860B]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'announcements'
                ? 'text-[#B8860B]'
                : 'text-gray-500 hover:text-[#B8860B]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              お知らせ管理
            </div>
            {activeTab === 'announcements' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#B8860B]" />
            )}
          </button>
        </div>

        <div className="space-y-6">
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl p-6 shadow-lg border border-[#DAA520]/20"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm ${(STATUS_LABELS[booking.status] || STATUS_LABELS.default).class}`}>
                        {(STATUS_LABELS[booking.status] || STATUS_LABELS.default).text}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      予約日時: {formatDateTime(booking.created_at)}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <User className="w-5 h-5 text-[#B8860B]" />
                        予約者
                      </h3>
                      <div className="bg-[#FDF5E6] rounded-lg p-4">
                        <p className="font-medium text-gray-800">{booking.profiles.full_name || '未設定'}</p>
                        <p className="text-gray-600">{booking.profiles.email}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Star className="w-5 h-5 text-[#B8860B]" />
                        占い師
                      </h3>
                      <div className="bg-[#FDF5E6] rounded-lg p-4">
                        <p className="font-medium text-gray-800">{booking.fortune_teller.name}</p>
                        <p className="text-gray-600">{booking.fortune_teller.title}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-[#B8860B]" />
                      {formatDateTime(booking.start_time)}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4 text-[#B8860B]" />
                      {booking.duration_minutes}分
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign className="w-4 h-4 text-[#B8860B]" />
                      ¥{booking.total_price.toLocaleString()}
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="mt-4 text-sm text-gray-600">
                      <p className="font-medium mb-1">備考：</p>
                      <p>{booking.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#FDF5E6]">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#B8860B]">名前</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#B8860B]">メールアドレス</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#B8860B]">登録日</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-[#B8860B]">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DAA520]/20">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-[#FDF5E6]/50 transition-colors">
                        <td className="px-6 py-4">{user.full_name || '未設定'}</td>
                        <td className="px-6 py-4">{user.email}</td>
                        <td className="px-6 py-4">
                          {new Date(user.created_at).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => confirmDelete('user', user.id, user)}
                              className="text-red-500 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'fortune-tellers' && (
            <div className="space-y-8">
              {/* 承認待ちの占い師 */}
              {pendingFortuneTellers.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-2 mb-4 text-yellow-600">
                    <AlertCircle className="w-5 h-5" />
                    <h3 className="font-semibold">承認待ちの占い師 ({pendingFortuneTellers.length}名)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-yellow-50">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-800">名前</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-800">メールアドレス</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-800">肩書き</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-800">登録日時</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-yellow-800">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-yellow-100">
                        {pendingFortuneTellers.map((fortuneTeller) => (
                          <tr key={fortuneTeller.id} className="hover:bg-yellow-50/50 transition-colors">
                            <td className="px-6 py-4">{fortuneTeller.name}</td>
                            <td className="px-6 py-4">{fortuneTeller.profiles.email}</td>
                            <td className="px-6 py-4">{fortuneTeller.title}</td>
                            <td className="px-6 py-4">{formatDateTime(fortuneTeller.created_at)}</td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleApproval(fortuneTeller.id, true)}
                                  className="text-green-500 hover:bg-green-50 p-2 rounded-lg transition-colors"
                                  title="承認する"
                                >
                                  <Check className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => confirmDelete('fortune-teller', fortuneTeller.id, fortuneTeller)}
                                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                  title="削除"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 承認済みの占い師 */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="font-semibold text-gray-800 mb-4">承認済みの占い師</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#FDF5E6]">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#B8860B]">名前</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#B8860B]">メールアドレス</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#B8860B]">肩書き</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-[#B8860B]">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DAA520]/20">
                      {approvedFortuneTellers.map((fortuneTeller) => (
                        <tr key={fortuneTeller.id} className="hover:bg-[#FDF5E6]/50 transition-colors">
                          <td className="px-6 py-4">{fortuneTeller.name}</td>
                          <td className="px-6 py-4">{fortuneTeller.profiles.email}</td>
                          <td className="px-6 py-4">{fortuneTeller.title}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleApproval(fortuneTeller.id, false)}
                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                title="承認を取り消す"
                              >
                                <X className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => confirmDelete('fortune-teller', fortuneTeller.id, fortuneTeller)}
                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                title="削除"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setEditingAnnouncement(null);
                    setAnnouncementForm({
                      title: '',
                      content: '',
                      published_at: new Date().toISOString().slice(0, 16)
                    });
                    setShowAnnouncementModal(true);
                  }}
                  className="flex items-center gap-2 bg-[#B8860B] hover:bg-[#DAA520] text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  新規お知らせ作成
                </button>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#FDF5E6]">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#B8860B]">タイトル</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[#B8860B]">公開日時</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-[#B8860B]">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DAA520]/20">
                      {announcements.map((announcement) => (
                        <tr key={announcement.id} className="hover:bg-[#FDF5E6]/50 transition-colors">
                          <td className="px-6 py-4">{announcement.title}</td>
                          <td className="px-6 py-4">{formatDateTime(announcement.published_at)}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEditAnnouncement(announcement)}
                                className="text-[#B8860B] hover:bg-[#FDF5E6] p-2 rounded-lg transition-colors"
                                title="編集"
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                              <button
                                onClick={()=> confirmDelete('announcement', announcement.id, announcement)}
                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                title="削除"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* お知らせ作成/編集モーダル */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingAnnouncement ? 'お知らせを編集' : '新規お知らせ作成'}
              </h3>
              <button
                onClick={() => {
                  setShowAnnouncementModal(false);
                  setEditingAnnouncement(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAnnouncementSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent h-40"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  公開日時 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={announcementForm.published_at}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, published_at: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAnnouncementModal(false);
                    setEditingAnnouncement(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#B8860B] text-white py-2 rounded-lg hover:bg-[#DAA520] transition-colors"
                >
                  {editingAnnouncement ? '更新する' : '作成する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {deleteType === 'user' ? 'ユーザー' : deleteType === 'fortune-teller' ? '占い師' : 'お知らせ'}を削除しますか？
            </h3>
            <p className="text-gray-600 mb-6">
              この操作は取り消すことができません。すべてのデータが完全に削除されます。
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteConfirm(null);
                  setDeleteType(null);
                  setDeleteData(null);
                }}
                className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}