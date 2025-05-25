import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface FortuneTellerCardProps {
  fortuneTeller: {
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
  };
  showFavoriteButton?: boolean;
}

export function FortuneTellerCard({ fortuneTeller, showFavoriteButton = false }: FortuneTellerCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    if (showFavoriteButton) {
      checkFavoriteStatus();
    }
  }, [fortuneTeller.id, showFavoriteButton]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
    setUserId(user?.id || null);
  };

  const checkFavoriteStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('favorite_fortune_tellers')
        .select('fortune_teller_id')
        .eq('user_id', user.id)
        .eq('fortune_teller_id', fortuneTeller.id)
        .maybeSingle();

      if (error) throw error;
      setIsFavorite(!!data);
    } catch (error) {
      console.error('お気に入り状態の確認に失敗しました:', error);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); // リンクのナビゲーションを防ぐ
    if (!isAuthenticated) {
      toast.error('お気に入り登録にはログインが必要です');
      return;
    }

    // 占い師が自分をお気に入りにできないようにチェック
    const { data: fortuneTellerData } = await supabase
      .from('fortune_tellers')
      .select('user_id')
      .eq('id', fortuneTeller.id)
      .single();

    if (fortuneTellerData?.user_id === userId) {
      toast.error('自分をお気に入りに登録することはできません');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが見つかりません');

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
      console.error('お気に入り操作に失敗しました:', error);
      toast.error('操作に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link
      to={`/fortune-teller/${fortuneTeller.id}`}
      className="group block bg-white rounded-lg shadow-gold hover:shadow-gold-lg border border-gold/10 
                 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden animate-fadeIn"
    >
      <div className="flex items-center p-4">
        {/* 画像部分 */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <img
            src={fortuneTeller.avatar_url || "https://images.unsplash.com/photo-1601441715247-ed2698874951?q=80&w=400&h=400&fit=crop"}
            alt={fortuneTeller.name}
            className="w-full h-full object-cover rounded-lg"
          />
          <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs
            ${fortuneTeller.available 
              ? 'bg-green-500/90 text-white' 
              : 'bg-red-500/90 text-white'
            } backdrop-blur-sm`}
          >
            {fortuneTeller.available ? '予約受付中' : '予約停止中'}
          </div>
        </div>

        {/* 情報部分 */}
        <div className="ml-4 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800 group-hover:text-gold transition-colors">
                {fortuneTeller.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{fortuneTeller.title}</p>
            </div>
            <div className="text-right">
              <div className="text-gold font-medium">
                ¥{fortuneTeller.price_per_minute}/分
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{fortuneTeller.experience_years}年</span>
              </div>
            </div>
          </div>

          {/* 評価 */}
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-[#FFD700] fill-current" />
            <span className="font-bold text-gray-800">{fortuneTeller.rating.toFixed(1)}</span>
            <span className="text-sm text-gray-600">({fortuneTeller.review_count}件)</span>
            {showFavoriteButton && (
              <button
                onClick={toggleFavorite}
                disabled={loading}
                className={`ml-auto p-2 rounded-full transition-colors ${
                  isFavorite 
                    ? 'text-red-500 hover:bg-red-50' 
                    : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>

          {/* 得意分野 */}
          <div className="flex flex-wrap gap-1">
            {fortuneTeller.specialties.slice(0, 3).map((specialty, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-gold-50 text-gold rounded-full text-xs transition-colors
                         group-hover:bg-gold/10"
              >
                {specialty}
              </span>
            ))}
            {fortuneTeller.specialties.length > 3 && (
              <span className="text-xs text-gray-500">
                +{fortuneTeller.specialties.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}