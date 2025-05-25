import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Phone } from 'lucide-react';

type AuthMode = 'login' | 'register';
type UserType = 'user' | 'fortune-teller';

interface AuthFormProps {
  initialMode?: AuthMode;
  userType?: UserType;
}

export function AuthForm({ initialMode = 'login', userType = 'user' }: AuthFormProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phoneNumber: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.password.length < 6) {
        throw new Error('パスワードは6文字以上である必要があります');
      }

      if (mode === 'register') {
        console.log('Starting registration process...');
        // ユーザー登録
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              user_type: userType
            }
          }
        });
        
        if (signUpError) {
          console.error('Registration error:', signUpError);
          if (signUpError.message.includes('already registered')) {
            throw new Error('このメールアドレスは既に登録されています');
          }
          throw signUpError;
        }

        if (!authData.user) {
          throw new Error('ユーザー登録に失敗しました');
        }

        console.log('User registered successfully, creating profile...');

        // プロフィール情報の作成
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.name,
            user_type: userType,
            phone_number: formData.phoneNumber || null
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error('プロフィールの作成に失敗しました');
        }

        toast.success('登録が完了しました！');
        if (userType === 'fortune-teller') {
          navigate('/register/fortune-teller/profile');
        } else {
          navigate('/mypage');
        }
      } else {
        console.log('Starting login process...');
        // ログイン処理
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        
        if (error) {
          console.error('Login error:', error);
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('メールアドレスまたはパスワードが正しくありません');
          }
          throw error;
        }

        if (!data.user) {
          throw new Error('ログインに失敗しました');
        }

        console.log('Login successful, fetching user profile...');

        // ユーザータイプに基づいてリダイレクト
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw new Error('ユーザー情報の取得に失敗しました');
        }

        toast.success('ログインしました！');

        // ユーザータイプに基づいてリダイレクト
        if (profile?.user_type === 'admin') {
          navigate('/admin');
        } else if (profile?.user_type === 'fortune-teller') {
          navigate('/mypage/fortune-teller');
        } else {
          navigate('/mypage');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      const errorMessage = error instanceof Error ? error.message : '認証エラーが発生しました';
      toast.error(errorMessage, {
        duration: 4000,
        style: {
          background: '#fee2e2',
          color: '#991b1b',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                お名前
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B8860B] h-5 w-5" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[#DAA520]/20 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent"
                  placeholder="山田 太郎"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                電話番号（任意）
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B8860B] h-5 w-5" />
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[#DAA520]/20 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent"
                  placeholder="090-1234-5678"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                ハイフンありでも、なしでも入力できます
              </p>
            </div>
          </>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            メールアドレス
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B8860B] h-5 w-5" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#DAA520]/20 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent"
              placeholder="your@email.com"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            パスワード
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B8860B] h-5 w-5" />
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#DAA520]/20 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'register' && 'パスワードは6文字以上で入力してください'}
          </p>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-[#B8860B] hover:bg-[#DAA520] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '登録する'}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <button
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setFormData({ ...formData, name: '', phoneNumber: '' });
          }}
          className="text-[#B8860B] hover:text-[#DAA520] transition-colors"
        >
          {mode === 'login' ? '新規登録はこちら' : 'ログインはこちら'}
        </button>
      </div>
    </div>
  );
}