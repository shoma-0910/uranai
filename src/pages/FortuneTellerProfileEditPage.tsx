import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { User, DollarSign, Star, Camera, Loader2 } from 'lucide-react';
import { SpecialtiesSelector, SPECIALTIES_CATEGORIES } from '../components/SpecialtiesSelector';
import { ConcernsSelector, CONCERNS_CATEGORIES } from '../components/ConcernsSelector';

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

export function FortuneTellerProfileEditPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [fortuneTeller, setFortuneTeller] = useState<FortuneTeller | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    bio: '',
    experience_years: 0,
    price_per_minute: 100,
    specialties: [] as string[],
    concerns: [] as string[],
  });

  useEffect(() => {
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
      setAvatarUrl(data.avatar_url);

      // Split specialties into specialties and concerns
      const specialties = data.specialties.filter(s => 
        SPECIALTIES_CATEGORIES.some(cat => 
          cat.items.includes(s)
        )
      );
      const concerns = data.specialties.filter(s => 
        CONCERNS_CATEGORIES.some(cat => 
          cat.name === s
        )
      );

      setFormData({
        title: data.title,
        bio: data.bio,
        experience_years: data.experience_years,
        price_per_minute: data.price_per_minute,
        specialties,
        concerns,
      });
    } catch (error) {
      console.error('プロフィールの読み込みに失敗しました:', error);
      toast.error('プロフィールの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fortuneTeller) return;

    // ファイルサイズチェック (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('画像サイズは5MB以下にしてください');
      return;
    }

    // 画像ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      toast.error('画像ファイルを選択してください');
      return;
    }

    setUploadingAvatar(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザー認証が必要です');

      // 古い画像の削除
      if (avatarUrl) {
        const oldPath = `${user.id}/${avatarUrl.split('/').pop()}`;
        await supabase.storage
          .from('profile-photos')
          .remove([oldPath]);
      }

      // 新しい画像のアップロード
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 公開URLの取得
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      // プロフィールの更新
      const { error: updateError } = await supabase
        .from('fortune_tellers')
        .update({ avatar_url: publicUrl })
        .eq('id', fortuneTeller.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success('プロフィール写真を更新しました');
    } catch (error) {
      console.error('画像アップロードエラー:', error);
      toast.error('画像のアップロードに失敗しました');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !fortuneTeller) throw new Error('ユーザー情報が見つかりません');

      const { error } = await supabase
        .from('fortune_tellers')
        .update({
          title: formData.title,
          bio: formData.bio,
          experience_years: formData.experience_years,
          price_per_minute: formData.price_per_minute,
          specialties: [...formData.specialties, ...formData.concerns],
          updated_at: new Date().toISOString()
        })
        .eq('id', fortuneTeller.id);

      if (error) throw error;

      toast.success('プロフィールを更新しました');
      navigate('/mypage/fortune-teller');
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      toast.error('プロフィールの更新に失敗しました');
    } finally {
      setSaving(false);
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
          <p className="text-gray-600 mb-4">占い師プロフィールが見つかりません</p>
          <button
            onClick={() => navigate('/register/fortune-teller/profile')}
            className="bg-[#B8860B] hover:bg-[#DAA520] text-white px-6 py-2 rounded-lg transition-colors"
          >
            プロフィールを作成する
          </button>
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

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-[#B8860B] mb-8">プロフィール編集</h1>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 shadow-lg border border-[#DAA520]/20">
            {/* プロフィール写真 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                プロフィール写真
              </label>
              <div className="flex justify-center">
                <div className="relative">
                  <div
                    onClick={handleAvatarClick}
                    className="w-32 h-32 rounded-full overflow-hidden cursor-pointer relative group"
                  >
                    <img
                      src={avatarUrl || 'https://images.unsplash.com/photo-1601441715247-ed2698874951?q=80&w=400&h=400&fit=crop'}
                      alt={fortuneTeller.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploadingAvatar ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center mt-2">
                クリックして写真を変更（5MB以下）
              </p>
            </div>

            {/* 基本情報 */}
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  肩書き <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="例: タロット占い師・占星術師"
                  className="w-full px-4 py-2 border border-[#DAA520]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  自己紹介 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-4 py-2 border border-[#DAA520]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B] h-32"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    経験年数 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.experience_years}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-[#DAA520]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    料金（1分あたり） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="10"
                    value={formData.price_per_minute}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_per_minute: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-[#DAA520]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B]"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 得意な占い */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                得意な占い（複数選択可） <span className="text-red-500">*</span>
              </label>
              <SpecialtiesSelector
                selectedSpecialties={formData.specialties}
                onChange={(specialties) => setFormData(prev => ({ ...prev, specialties }))}
              />
            </div>

            {/* 得意なお悩み */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                得意なお悩み（複数選択可） <span className="text-red-500">*</span>
              </label>
              <ConcernsSelector
                selectedConcerns={formData.concerns}
                onChange={(concerns) => setFormData(prev => ({ ...prev, concerns }))}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#B8860B] hover:bg-[#DAA520] text-white py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '更新中...' : '変更を保存'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}