import React, { useState, useEffect } from 'react';
import { Star, Clock, Award, DollarSign, Calendar, Mail, Heart } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookingModal } from './BookingModal';
import { BackButton } from './BackButton';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

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
  user_id: string;
}

export function FortuneTellerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [fortuneTeller, setFortuneTeller] = useState<FortuneTeller | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const defaultAvatar = "https://images.unsplash.com/photo-1601441715247-ed2698874951?q=80&w=400&h=400&fit=crop";

  useEffect(() => {
    if (id) {
      loadFortuneTeller(id);
      checkAuth();
    }
  }, [id]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
    setUserId(user?.id || null);
    if (user && id) {
      // Check if fortune teller is favorited
      const { data: favorite } = await supabase
        .from('favorite_fortune_tellers')
        .select('fortune_teller_id')
        .eq('user_id', user.id)
        .eq('fortune_teller_id', id)
        .maybeSingle();
      setIsFavorite(!!favorite);
    }
  };

  const loadFortuneTeller = async (fortuneTellerId: string) => {
    try {
      const { data, error } = await supabase
        .from('fortune_tellers')
        .select('*')
        .eq('id', fortuneTellerId)
        .single();

      if (error) throw error;
      setFortuneTeller(data);
    } catch (error) {
      console.error('占い師データの取得に失敗しました:', error);
      toast.error('占い師データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingClick = async () => {
    if (!isAuthenticated) {
      toast.error('予約にはログインが必要です');
      navigate('/register');
      return;
    }

    // 自分の占い師プロフィールは予約できないようにチェック
    if (fortuneTeller?.user_id === userId) {
      toast.error('自分のプロフィールは予約できません');
      return;
    }

    setIsBookingModalOpen(true);
  };

  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      toast.error('お気に入り登録にはログインが必要です');
      navigate('/register');
      return;
    }

    // 自分をお気に入りにできないようにチェック
    if (fortuneTeller?.user_id === userId) {
      toast.error('自分をお気に入りに登録することはできません');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !fortuneTeller) return;

      if (isFavorite) {
        const { error } = await supabase
          .from('favorite_fortune_tellers')
          .delete()
          .eq('user_id', user.id)
          .eq('fortune_teller_id', fortuneTeller.id);

        if (error) throw error;
        toast.success('お気に入りから削除しました');
      } else {
        const { error } = await supabase
          .from('favorite_fortune_tellers')
          .insert({
            user_id: user.id,
            fortune_teller_id: fortuneTeller.id
          });

        if (error) throw error;
        toast.success('お気に入りに追加しました');
      }

      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('お気に入り操作エラー:', error);
      toast.error('操作に失敗しました');
    }
  };

  const handleRating = async (rating: number) => {
    if (!isAuthenticated) {
      toast.error('評価にはログインが必要です');
      navigate('/register');
      return;
    }

    // 自分を評価できないようにチェック
    if (fortuneTeller?.user_id === userId) {
      toast.error('自分を評価することはできません');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !fortuneTeller) return;

      // Update the rating in the fortune_tellers table
      const { error } = await supabase.rpc('update_fortune_teller_rating', {
        p_fortune_teller_id: fortuneTeller.id,
        p_rating: rating
      });

      if (error) throw error;

      setUserRating(rating);
      loadFortuneTeller(fortuneTeller.id);
      toast.success('評価を更新しました');
    } catch (error) {
      console.error('評価更新エラー:', error);
      toast.error('評価の更新に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8860B]"></div>
      </div>
    );
  }

  if (!fortuneTeller) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">占い師が見つかりませんでした</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <BackButton />
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-lg border border-[#DAA520]/20">
            {/* プロフィールヘッダー */}
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/3">
                <div className="relative aspect-square rounded-xl overflow-hidden">
                  <img
                    src={fortuneTeller.avatar_url || defaultAvatar}
                    alt={fortuneTeller.name}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full ${
                    fortuneTeller.available 
                      ? 'bg-green-500/90 text-white' 
                      : 'bg-red-500/90 text-white'
                  }`}>
                    {fortuneTeller.available ? '予約受付中' : '予約停止中'}
                  </div>
                </div>
              </div>

              <div className="w-full md:w-2/3">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{fortuneTeller.name}</h1>
                    <h2 className="text-xl text-gray-600">{fortuneTeller.title}</h2>
                  </div>
                  <button
                    onClick={handleFavoriteClick}
                    className={`p-2 rounded-full transition-colors ${
                      isFavorite 
                        ? 'text-red-500 hover:bg-red-50' 
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Rating Stars */}
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => handleRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            (hoverRating || userRating) >= star
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-sm text-gray-600">
                      ({fortuneTeller.review_count}件の評価)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-[#FDF5E6] rounded-lg p-4 text-center">
                    <Star className="w-6 h-6 text-[#B8860B] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-800">{fortuneTeller.rating.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">評価</div>
                  </div>
                  <div className="bg-[#FDF5E6] rounded-lg p-4 text-center">
                    <Clock className="w-6 h-6 text-[#B8860B] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-800">{fortuneTeller.experience_years}</div>
                    <div className="text-sm text-gray-600">経験年数</div>
                  </div>
                  <div className="bg-[#FDF5E6] rounded-lg p-4 text-center">
                    <DollarSign className="w-6 h-6 text-[#B8860B] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-800">{fortuneTeller.price_per_minute}</div>
                    <div className="text-sm text-gray-600">料金/分</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">得意分野</h3>
                  <div className="flex flex-wrap gap-2">
                    {fortuneTeller.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#FDF5E6] text-[#B8860B] rounded-full text-sm"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">自己紹介</h3>
              <p className="text-gray-600 whitespace-pre-line">{fortuneTeller.bio}</p>
            </div>

            {/* アクションボタン */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={handleBookingClick}
                disabled={!fortuneTeller.available}
                className="flex-1 bg-[#B8860B] hover:bg-[#DAA520] text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calendar className="w-5 h-5" />
                予約する
              </button>
              <button className="flex-1 bg-white border border-[#B8860B] text-[#B8860B] hover:bg-[#FDF5E6] py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Mail className="w-5 h-5" />
                メッセージを送る
              </button>
            </div>
          </div>

          {/* 実績セクション */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-[#DAA520]/20">
              <Award className="w-8 h-8 text-[#B8860B] mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">鑑定実績</h3>
              <p className="text-gray-600">
                {fortuneTeller.review_count}件以上の鑑定経験があり、多くのお客様から高い評価をいただいています。
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-[#DAA520]/20">
              <Star className="w-8 h-8 text-[#FFD700] mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">得意な鑑定</h3>
              <p className="text-gray-600">
                {fortuneTeller.specialties.slice(0, 3).join('、')}などの鑑定を得意としています。
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-[#DAA520]/20">
              <Clock className="w-8 h-8 text-[#B8860B] mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">対応時間</h3>
              <p className="text-gray-600">
                予約可能時間をご確認の上、ご予約ください。
              </p>
            </div>
          </div>
        </div>

        <BookingModal
          fortuneTeller={fortuneTeller}
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
        />
      </div>
    </div>
  );
}