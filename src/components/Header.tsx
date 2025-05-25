import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Header() {
  const navigate = useNavigate();
  const [user, setUser] = React.useState<any>(null);
  const [userType, setUserType] = React.useState<string | null>(null);

  React.useEffect(() => {
    checkUser();

    // リアルタイムでの認証状態の監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadUserType(session.user.id);
      } else {
        setUser(null);
        setUserType(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await loadUserType(user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const loadUserType = async (userId: string) => {
    try {
      // Skip loading user type for system user
      if (userId === '00000000-0000-0000-0000-000000000000') {
        setUserType(null);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading user type:', error);
        setUserType(null);
        return;
      }
      
      setUserType(profile?.user_type || null);
    } catch (error) {
      console.error('Error loading user type:', error);
      setUserType(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserType(null);
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-gold/10 sticky top-0 z-50 backdrop-blur-sm bg-white/80">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex justify-between items-center">
          <Link 
            to="/" 
            className="text-2xl font-bold text-gold relative group"
          >
            <span className="relative z-10">占い通り</span>
            <span className="absolute inset-0 bg-gold-shine opacity-0 group-hover:opacity-100 transition-opacity duration-700"></span>
          </Link>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <Link
                  to="/fortune-tellers"
                  className="text-gold hover:text-gold-light transition-colors duration-300"
                >
                  占い師を探す
                </Link>
                <Link
                  to={userType === 'fortune-teller' ? '/mypage/fortune-teller' : userType === 'admin' ? '/admin' : '/mypage'}
                  className="flex items-center gap-2 text-gold hover:text-gold-light transition-colors duration-300"
                >
                  <User className="w-5 h-5" />
                  <span>マイページ</span>
                </Link>
                {userType === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 text-gold hover:text-gold-light transition-colors duration-300"
                  >
                    <Settings className="w-5 h-5" />
                    <span>管理画面</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gold hover:text-gold-light transition-colors duration-300"
                >
                  <LogOut className="w-5 h-5" />
                  <span>ログアウト</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/fortune-tellers"
                  className="text-gold hover:text-gold-light transition-colors duration-300"
                >
                  占い師を探す
                </Link>
                <Link
                  to="/login"
                  className="text-gold hover:text-gold-light transition-colors duration-300"
                >
                  ログイン
                </Link>
                <Link
                  to="/register"
                  className="btn-gold"
                >
                  新規登録
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}