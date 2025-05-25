import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Coffee, Users, User, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CategorySearch } from '../components/CategorySearch';
import { ContactForm } from '../components/ContactForm';
import { FortuneTellerCard } from '../components/FortuneTellerCard';
import { ConcernsCategories } from '../components/ConcernsCategories';

interface Announcement {
  id: string;
  title: string;
  content: string;
  published_at: string;
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

export function TopPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null);
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const [fortuneTellers, setFortuneTellers] = useState<FortuneTeller[]>([]);

  useEffect(() => {
    checkUser();
    loadAnnouncements();
    loadFortuneTellers();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();
        setUserType(profile?.user_type);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('お知らせの取得に失敗しました:', error);
    }
  };

  const loadFortuneTellers = async () => {
    try {
      const { data, error } = await supabase
        .from('fortune_tellers')
        .select('*')
        .eq('available', true)
        .eq('approved', true)
        .order('rating', { ascending: false })
        .limit(5);

      if (error) throw error;
      setFortuneTellers(data || []);
    } catch (error) {
      console.error('占い師一覧の取得に失敗しました:', error);
    }
  };

  const toggleAnnouncement = (id: string) => {
    setExpandedAnnouncement(expandedAnnouncement === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("https://raw.githubusercontent.com/yourusername/yourrepo/main/background.jpg")' }}>
      <div className="relative bg-white/90 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-24 relative">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-800 mb-6 relative">
              <span className="relative inline-block">
                夢見る世界をつくりにいく
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-[#DAA520] to-[#B8860B]"></div>
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              “なりたい自分”や“やりたいこと”に自信を持ち、一歩を踏み出せる未来を支える
            </p>
          </div>

          {/* お悩みカテゴリから探す */}
          <div className="max-w-4xl mx-auto mb-16">
            <ConcernsCategories />
          </div>

          {/* 人気の占い師 */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-gold border border-[#DAA520]/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">人気の占い師</h3>
                <Link
                  to="/fortune-tellers"
                  className="text-[#B8860B] hover:text-[#DAA520] transition-colors flex items-center gap-1"
                >
                  <Search className="w-5 h-5" />
                  すべての占い師を見る
                </Link>
              </div>

              <div className="space-y-4">
                {fortuneTellers.map((fortuneTeller) => (
                  <FortuneTellerCard
                    key={fortuneTeller.id}
                    fortuneTeller={fortuneTeller}
                    showFavoriteButton={isAuthenticated}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* カテゴリ検索セクション */}
          <div className="max-w-4xl mx-auto mb-16">
            <CategorySearch />
          </div>

          {/* お知らせセクション */}
          {announcements.length > 0 && (
            <div className="max-w-4xl mx-auto mb-16">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-gold border border-[#DAA520]/20">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-[#B8860B]" />
                  <h3 className="text-lg font-semibold text-gray-800">お知らせ</h3>
                </div>
                <div className="space-y-2">
                  {(showAllAnnouncements ? announcements : announcements.slice(0, 3)).map((announcement) => (
                    <div
                      key={announcement.id}
                      className="bg-white rounded-lg border border-[#DAA520]/20 overflow-hidden"
                    >
                      <button
                        onClick={() => toggleAnnouncement(announcement.id)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FDF5E6] transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500">
                            {new Date(announcement.published_at).toLocaleDateString('ja-JP')}
                          </span>
                          <span className="text-gray-800">{announcement.title}</span>
                        </div>
                        {expandedAnnouncement === announcement.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      {expandedAnnouncement === announcement.id && (
                        <div className="px-4 py-3 bg-[#FDF5E6]/50 border-t border-[#DAA520]/20">
                          <p className="text-gray-600 whitespace-pre-line">{announcement.content}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {announcements.length > 3 && (
                  <button
                    onClick={() => setShowAllAnnouncements(!showAllAnnouncements)}
                    className="mt-4 text-[#B8860B] hover:text-[#DAA520] transition-colors text-sm flex items-center gap-1"
                  >
                    {showAllAnnouncements ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        閉じる
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        もっと見る
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* お問い合わせフォーム */}
          <div className="max-w-xl mx-auto">
            <ContactForm />
          </div>

          {/* CTAセクション */}
          <div className="text-center mt-16 space-y-4">
            <Link
              to="/fortune-tellers"
              className="inline-flex items-center gap-2 bg-[#B8860B] hover:bg-[#DAA520] text-white py-4 px-10 rounded-lg transition-all transform hover:-translate-y-1 hover:shadow-lg"
            >
              <Search className="w-5 h-5" />
              占い師を探す
            </Link>
            <div className="flex items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link
                  to={userType === 'fortune-teller' ? '/mypage/fortune-teller' : '/mypage'}
                  className="inline-flex items-center gap-2 text-[#B8860B] hover:text-[#DAA520] transition-colors text-lg"
                >
                  <User className="w-5 h-5" />
                  マイページ
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 text-[#B8860B] hover:text-[#DAA520] transition-colors text-lg"
                >
                  <Users className="w-5 h-5" />
                  無料会員登録する
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}