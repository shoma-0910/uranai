import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Settings, Clock, DollarSign, Star, Trash2 } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { supabase } from '../lib/supabase';
import { ProfileSettingsModal } from '../components/ProfileSettingsModal';
import { DeleteAccountModal } from '../components/DeleteAccountModal';
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
}

export function FortuneTellerMyPage() {
  const navigate = useNavigate();
  const [fortuneTeller, setFortuneTeller] = useState<FortuneTeller | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profile, setProfile] = useState<{ id: string; full_name: string | null; email: string } | null>(null);
  const defaultAvatar = "https://images.unsplash.com/photo-1601441715247-ed2698874951?q=80&w=400&h=400&fit=crop";

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('プロフィールの読み込みに失敗しました:', error);
    }
  };

  useEffect(() => {
    loadProfile();
    loadFortuneTellerProfile();
  }, []);

  const loadFortuneTellerProfile = async () => {
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

      if (profile?.user_type !== 'fortune-teller') {
        toast.error('占い師アカウントではありません');
        navigate('/');
        return;
      }

      const { data, error } = await supabase
        .from('fortune_tellers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      if (!data) {
        navigate('/register/fortune-teller/profile');
        return;
      }

      setFortuneTeller(data);
    } catch (error) {
      console.error('プロフィールの読み込みに失敗しました:', error);
      toast.error('プロフィールの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8860B]"></div>
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
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/3">
                <div className="relative aspect-square rounded-xl overflow-hidden">
                  <img
                    src={fortuneTeller?.avatar_url || defaultAvatar}
                    alt={fortuneTeller?.name}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full ${
                    fortuneTeller?.available 
                      ? 'bg-green-500/90 text-white' 
                      : 'bg-red-500/90 text-white'
                  }`}>
                    {fortuneTeller?.available ? '予約受付中' : '予約停止中'}
                  </div>
                </div>
              </div>

              <div className="w-full md:w-2/3">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{fortuneTeller?.name}</h1>
                    <h2 className="text-xl text-gray-600">{fortuneTeller?.title}</h2>
                  </div>
                  <button
                    onClick={() => navigate('/register/fortune-teller/profile/edit')}
                    className="text-[#B8860B] hover:text-[#DAA520] transition-colors p-2 rounded-lg hover:bg-[#FDF5E6]"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-[#FDF5E6] rounded-lg p-4 text-center">
                    <Star className="w-6 h-6 text-[#B8860B] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-800">{fortuneTeller?.rating.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">評価</div>
                  </div>
                  <div className="bg-[#FDF5E6] rounded-lg p-4 text-center">
                    <Clock className="w-6 h-6 text-[#B8860B] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-800">{fortuneTeller?.experience_years}</div>
                    <div className="text-sm text-gray-600">経験年数</div>
                  </div>
                  <div className="bg-[#FDF5E6] rounded-lg p-4 text-center">
                    <DollarSign className="w-6 h-6 text-[#B8860B] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-800">{fortuneTeller?.price_per_minute}</div>
                    <div className="text-sm text-gray-600">料金/分</div>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <button
                    onClick={() => navigate('/mypage/fortune-teller/availability')}
                    className="w-full bg-[#B8860B] hover:bg-[#DAA520] text-white py-3 px-6 rounded-lg transition-colors"
                  >
                    予約可能時間を設定
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
            </div>
          </div>

          <ProfileSettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            currentName={profile?.full_name || ''}
            currentEmail={profile?.email || ''}
            onUpdate={loadProfile}
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
    </div>
  );
}