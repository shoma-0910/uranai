import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { User, DollarSign, Star } from 'lucide-react';
import { SpecialtiesSelector } from '../components/SpecialtiesSelector';
import { ConcernsSelector } from '../components/ConcernsSelector';

export function FortuneTellerProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    bio: '',
    experience_years: 0,
    price_per_minute: 100,
    specialties: [] as string[],
    concerns: [] as string[],
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // First check if the user has a profile and is a fortune teller
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, user_type')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('プロフィールの読み込みに失敗しました');
      }

      if (!profile) {
        toast.error('プロフィールが見つかりません');
        navigate('/register');
        return;
      }

      if (profile.user_type !== 'fortune-teller') {
        toast.error('占い師として登録されていません');
        navigate('/');
        return;
      }

      setUserName(profile.full_name || '');

      // Check if fortune teller profile already exists
      const { data: existingProfile, error: fortuneTellerError } = await supabase
        .from('fortune_tellers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fortuneTellerError) {
        console.error('Fortune teller profile error:', fortuneTellerError);
        throw new Error('占い師プロフィールの確認に失敗しました');
      }

      if (existingProfile) {
        toast.error('プロフィールは既に作成されています');
        navigate('/mypage/fortune-teller');
        return;
      }
    } catch (error) {
      console.error('Profile loading error:', error);
      toast.error(error instanceof Error ? error.message : 'プロフィールの読み込みに失敗しました');
      navigate('/login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors: string[] = [];

    if (!formData.title.trim()) {
      validationErrors.push('肩書きを入力してください');
    }
    if (!formData.bio.trim()) {
      validationErrors.push('自己紹介を入力してください');
    }
    if (formData.experience_years < 0) {
      validationErrors.push('経験年数は0以上を入力してください');
    }
    if (formData.price_per_minute < 100) {
      validationErrors.push('料金は100円以上を入力してください');
    }
    if (formData.specialties.length === 0) {
      validationErrors.push('得意な占いを1つ以上選択してください');
    }
    if (formData.concerns.length === 0) {
      validationErrors.push('得意なお悩みを1つ以上選択してください');
    }

    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ログインが必要です');

      console.log('Creating fortune teller profile...', {
        user_id: user.id,
        name: userName,
        title: formData.title,
        specialties: [...formData.specialties, ...formData.concerns]
      });

      // Create fortune teller profile
      const { data: fortuneTeller, error: profileError } = await supabase
        .from('fortune_tellers')
        .insert([{
          user_id: user.id,
          name: userName,
          title: formData.title.trim(),
          bio: formData.bio.trim(),
          experience_years: formData.experience_years,
          price_per_minute: formData.price_per_minute,
          specialties: [...formData.specialties, ...formData.concerns],
          available: true
        }])
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      console.log('Fortune teller profile created:', fortuneTeller);

      // Create notification for admin
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([{
          user_id: '00000000-0000-0000-0000-000000000000',
          title: '新規占い師登録',
          content: `${userName}さんが占い師として登録しました。`,
          type: 'new_fortune_teller'
        }]);

      if (notificationError) {
        console.error('Notification error:', notificationError);
      }

      toast.success('プロフィールを作成しました');
      navigate('/mypage/fortune-teller');
    } catch (error) {
      console.error('Profile creation error:', error);
      toast.error(error instanceof Error ? error.message : 'プロフィールの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <BackButton />
        </div>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-[#B8860B] mb-8">プロフィール設定</h1>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 shadow-lg border border-[#DAA520]/20">
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
              disabled={loading}
              className="w-full bg-[#B8860B] hover:bg-[#DAA520] text-white py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '送信中...' : 'プロフィールを作成'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}