import React, { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { FortuneTellerCard } from '../components/FortuneTellerCard';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

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

export function FortuneTellerListPage() {
  const [searchParams] = useSearchParams();
  const [fortuneTellers, setFortuneTellers] = useState<FortuneTeller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFortuneTellers();
  }, [searchParams]);

  const loadFortuneTellers = async () => {
    try {
      const specialties = searchParams.get('specialties');
      let query = supabase
        .from('fortune_tellers')
        .select('*')
        .eq('available', true)
        .eq('approved', true)
        .order('rating', { ascending: false });

      if (specialties) {
        query = query.contains('specialties', [specialties]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFortuneTellers(data || []);
    } catch (error) {
      console.error('占い師一覧の取得に失敗しました:', error);
      toast.error('占い師一覧の取得に失敗しました');
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
          <h1 className="text-3xl font-bold text-[#B8860B] mb-8">占い師一覧</h1>

          {fortuneTellers.length === 0 ? (
            <div className="bg-white rounded-xl p-8 shadow-lg border border-[#DAA520]/20 text-center">
              <p className="text-gray-600">現在、予約可能な占い師はいません。</p>
            </div>
          ) : (
            <div className="space-y-6">
              {fortuneTellers.map((fortuneTeller) => (
                <FortuneTellerCard
                  key={fortuneTeller.id}
                  fortuneTeller={fortuneTeller}
                  showFavoriteButton={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}