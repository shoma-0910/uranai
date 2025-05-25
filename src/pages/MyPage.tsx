import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Settings, Trash2, Clock, DollarSign, ChevronDown, ChevronUp, Bell, Video } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { supabase } from '../lib/supabase';
import { ProfileSettingsModal } from '../components/ProfileSettingsModal';
import { DeleteAccountModal } from '../components/DeleteAccountModal';
import { FortuneTellerCard } from '../components/FortuneTellerCard';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  user_type: string;
}

interface Booking {
  id: string;
  start_time: string;
  duration_minutes: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  fortune_teller: {
    id: string;
    name: string;
    title: string;
    avatar_url: string | null;
  };
  meet_link: string | null;
}

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  meet_link: string | null;
  read: boolean;
  created_at: string;
}

interface FortuneTeller {
  id: string;
  name: string;
  title: string;
  bio: string;
  experience_years: number;
  price_per_minute: number;
  avatar_url: string | null;
  specialties: string[];
  available: boolean;
  rating: number;
  review_count: number;
}

export function MyPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPastBookings, setShowPastBookings] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [favoriteFortuneTellers, setFavoriteFortuneTellers] = useState<FortuneTeller[]>([]);

  useEffect(() => {
    loadUserProfile();
    loadBookings();
    loadNotifications();
    loadFavoriteFortuneTellers();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('プロフィールの読み込みに失敗しました:', error);
    }
  };

  const loadBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          fortune_teller:fortune_tellers(
            id,
            name,
            title,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setBookings(data);
    } catch (error) {
      console.error('予約履歴の読み込みに失敗しました:', error);
      toast.error('予約履歴の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('通知の読み込みに失敗しました:', error);
    }
  };

  const loadFavoriteFortuneTellers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('favorite_fortune_tellers')
        .select(`
          fortune_teller:fortune_tellers(
            id,
            name,
            title,
            bio,
            experience_years,
            price_per_minute,
            avatar_url,
            specialties,
            available,
            rating,
            review_count
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      setFavoriteFortuneTellers(
        data
          .map(item => item.fortune_teller)
          .filter((ft): ft is FortuneTeller => ft !== null)
      );
    } catch (error) {
      console.error('お気に入り占い師の読み込みに失敗しました:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      loadNotifications();
    } catch (error) {
      console.error('通知の既読処理に失敗しました:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
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

  const upcomingBookings = bookings.filter(
    booking => new Date(booking.start_time) > new Date() && booking.status !== 'cancelled'
  );

  const pastBookings = bookings.filter(
    booking => new Date(booking.start_time) <= new Date() || booking.status === 'cancelled'
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <BackButton />
        </div>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-[#B8860B] mb-8">マイページ</h1>

          <div className="bg-white rounded-xl p-8 shadow-lg border border-[#DAA520]/20 mb-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 bg-[#FDF5E6] rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-[#B8860B]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {profile?.full_name || '名前未設定'}
                </h2>
                <p className="text-gray-600">{profile?.email}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="bg-[#FDF5E6] rounded-lg p-6 hover:bg-[#DAA520]/10 transition-colors"
              >
                <Settings className="w-8 h-8 text-[#B8860B] mb-4" />
                <h3 className="text-lg font-semibold text-gray-800">設定</h3>
                <p className="text-gray-600 mt-2">プロフィール情報の変更</p>
              </button>

              <div className="bg-[#FDF5E6] rounded-lg p-6">
                <Calendar className="w-8 h-8 text-[#B8860B] mb-4" />
                <h3 className="text-lg font-semibold text-gray-800">予約履歴</h3>
              </div>
            </div>
          </div>

          {/* お気に入り占い師 */}
          {favoriteFortuneTellers.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">お気に入りの占い師</h2>
              <div className="space-y-4">
                {favoriteFortuneTellers.map((fortuneTeller) => (
                  <FortuneTellerCard
                    key={fortuneTeller.id}
                    fortuneTeller={fortuneTeller}
                    showFavoriteButton={true}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-full bg-[#FDF5E6] hover:bg-[#DAA520]/10 text-[#B8860B] py-4 rounded-lg transition-colors mb-4 flex items-center justify-between px-6"
            >
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <span className="font-medium">通知</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-sm">
                    {unreadCount}
                  </span>
                )}
              </div>
              {showNotifications ? '閉じる' : '開く'}
            </button>

            {showNotifications && (
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    通知はありません
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`bg-white rounded-xl p-6 shadow-lg border border-[#DAA520]/20 ${
                        !notification.read ? 'bg-[#FDF5E6]/50' : ''
                      }`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-800">
                          {notification.title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {new Date(notification.created_at).toLocaleString('ja-JP')}
                        </span>
                      </div>
                      <p className="text-gray-600 whitespace-pre-line mb-4">
                        {notification.content}
                      </p>
                      {notification.meet_link && (
                        <a
                          href={notification.meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block bg-[#B8860B] hover:bg-[#DAA520] text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Google Meetで鑑定を開始
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="space-y-8 mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">今後の予約</h2>
              {upcomingBookings.length === 0 ? (
                <div className="bg-white rounded-xl p-6 shadow-lg border border-[#DAA520]/20 text-center text-gray-600">
                  予約はありません
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map(booking => (
                    <div
                      key={booking.id}
                      className="bg-white rounded-xl p-6 shadow-lg border border-[#DAA520]/20"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 mb-1">
                            {booking.fortune_teller.name}
                          </h3>
                          <p className="text-gray-600">{booking.fortune_teller.title}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#B8860B]" />
                          {formatDateTime(booking.start_time)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#B8860B]" />
                          {booking.duration_minutes}分
                        </div>
                        <div className="flex items-center gap-2">
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

                      {booking.meet_link && (
                        <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-green-800 mb-2">
                            <Video className="w-5 h-5" />
                            <p className="font-medium">鑑定URL</p>
                          </div>
                          <a
                            href={booking.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-[#B8860B] hover:bg-[#DAA520] text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            Google Meetで鑑定を開始
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <button
                onClick={() => setShowPastBookings(!showPastBookings)}
                className="flex items-center gap-2 text-[#B8860B] hover:text-[#DAA520] transition-colors mb-4"
              >
                {showPastBookings ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
                予約履歴を{showPastBookings ? '閉じる' : '表示'}
              </button>

              {showPastBookings && (
                <div className="space-y-4">
                  {pastBookings.length === 0 ? (
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-[#DAA520]/20 text-center text-gray-600">
                      予約履歴はありません
                    </div>
                  ) : (
                    pastBookings.map(booking => (
                      <div
                        key={booking.id}
                        className="bg-white rounded-xl p-6 shadow-lg border border-[#DAA520]/20"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-1">
                              {booking.fortune_teller.name}
                            </h3>
                            <p className="text-gray-600">{booking.fortune_teller.title}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#B8860B]" />
                            {formatDateTime(booking.start_time)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#B8860B]" />
                            {booking.duration_minutes}分
                          </div>
                          <div className="flex items-center gap-2">
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
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleLogout}
              className="w-full bg-white border border-[#B8860B] text-[#B8860B] hover:bg-[#FDF5E6] py-3 rounded-lg transition-colors"
            >
              ログアウト
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full bg-white border border-red-500 text-red-500 hover:bg-red-50 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              アカウントを削除
            </button>
          </div>
        </div>

        <ProfileSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          currentName={profile?.full_name || ''}
          currentEmail={profile?.email || ''}
          onUpdate={loadUserProfile}
        />

        {profile && (
          <DeleteAccountModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            userId={profile.id}
          />
        )}
      </div>
    </div>
  );
}