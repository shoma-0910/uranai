import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Star, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useFloating, useHover, useInteractions, offset, shift, flip, FloatingPortal } from '@floating-ui/react';

interface Category {
  name: string;
  subcategories?: Array<{
    name: string;
    description: string;
  }>;
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

const FORTUNE_CATEGORIES: Category[] = [
  {
    name: '占術',
    subcategories: [
      {
        name: 'タロット占い',
        description: '78枚のカードを使用して、過去・現在・未来を読み解く西洋占術。直感的なシンボルと意味解釈で、人生の様々な側面についてアドバイスを提供します。'
      },
      {
        name: '四柱推命',
        description: '生年月日から算出される四柱（年柱・月柱・日柱・時柱）を基に、運命や相性を占う東洋占術。人生の流れや適性を詳しく分析します。'
      },
      {
        name: '占星術',
        description: '惑星の動きと位置関係から、性格や運命を読み解く占術。出生時の天体配置から、人生の様々な側面について詳細な解釈を提供します。'
      },
      {
        name: '手相占い',
        description: '手のひらの線や形から、運命や性格、健康状態などを読み解く占術。生命線、感情線、頭脳線などの主要な線から、その人の人生を紐解きます。'
      },
      {
        name: '九星気学',
        description: '生年月日から導き出される九つの星を基に、運勢や相性を占う東洋占術。年運・月運・日運を組み合わせて、詳細な運勢を導き出します。'
      },
      {
        name: '姓名判断',
        description: '名前の漢字の画数から、その人の運勢や性格、相性を読み解く占術。天格、人格、地格、外格、総格の五格を分析して運命を占います。'
      }
    ]
  },
  {
    name: 'スピリチュアル',
    subcategories: [
      {
        name: 'スピリチュアルカウンセリング',
        description: '霊的な視点から人生の問題や悩みにアプローチし、魂のレベルでの癒しとガイダンスを提供。より深い自己理解と人生の目的の発見をサポートします。'
      },
      {
        name: 'チャネリング',
        description: '高次の存在やガイドからのメッセージを受け取り、クライアントに伝える技法。人生の方向性や課題について、スピリチュアルな視点からのアドバイスを提供します。'
      },
      {
        name: 'オーラリーディング',
        description: '人体を取り巻くエネルギー場（オーラ）を読み取り、心身の状態や感情、潜在的な問題を診断。エネルギーの浄化やバランス調整のアドバイスも行います。'
      }
    ]
  },
  {
    name: '数秘・カード',
    subcategories: [
      {
        name: '数秘術',
        description: '生年月日や名前を数字に変換し、その人の運命や性格、人生の課題を読み解く占術。各数字が持つ固有の意味と振動から、人生のパターンを解析します。'
      },
      {
        name: 'カードリーディング',
        description: '様々な種類のオラクルカードを使用して、質問への答えや人生の指針を導き出すリーディング。直感的なメッセージと象徴的な解釈を提供します。'
      },
      {
        name: 'ルーン占い',
        description: '古代北欧の文字体系であるルーン文字を使用した占術。各ルーン文字が持つ意味と象徴から、現状の課題や未来の展望について洞察を得ます。'
      }
    ]
  },
  {
    name: '占星術',
    subcategories: [
      {
        name: '西洋占星術',
        description: '太陽、月、惑星の配置から、性格や運命、相性を読み解く占術。ホロスコープを作成し、12星座と12ハウスの影響を詳細に分析します。'
      },
      {
        name: '東洋占星術',
        description: '陰陽五行と十二支を基礎とした東洋の占星術。生年月日時の干支や五行の組み合わせから、運命や相性、適性を読み解きます。'
      },
      {
        name: 'インド占星術',
        description: '古代インドのヴェーダ占星術。27の星宿（ナクシャトラ）と12星座（ラーシ）を用いて、詳細な運命解析と人生の指針を提供します。'
      }
    ]
  }
];

export function CategorySearch() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [fortuneTellers, setFortuneTellers] = useState<FortuneTeller[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    open: !!hoveredCategory,
    onOpenChange: (open) => {
      if (!open) setHoveredCategory(null);
    },
    middleware: [offset(10), shift(), flip()],
  });

  const hover = useHover(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  useEffect(() => {
    if (selectedCategories.length > 0) {
      searchFortuneTellers();
    } else {
      setFortuneTellers([]);
    }
  }, [selectedCategories]);

  const searchFortuneTellers = async () => {
    if (selectedCategories.length === 0) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fortune_tellers')
        .select('*')
        .eq('available', true)
        .eq('approved', true)
        .overlaps('specialties', selectedCategories)
        .order('rating', { ascending: false });

      if (error) throw error;
      setFortuneTellers(data || []);
    } catch (error) {
      console.error('占い師の検索に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategory(expandedCategory === categoryName ? null : categoryName);
  };

  const toggleSubcategory = (subcategory: string) => {
    setSelectedCategories(prev =>
      prev.includes(subcategory)
        ? prev.filter(c => c !== subcategory)
        : [...prev, subcategory]
    );
  };

  const getSubcategoryDescription = (categoryName: string): string => {
    for (const category of FORTUNE_CATEGORIES) {
      const subcategory = category.subcategories?.find(sub => sub.name === categoryName);
      if (subcategory) {
        return subcategory.description;
      }
    }
    return '';
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-gold border border-[#DAA520]/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">占術から探す</h2>
        <Link
          to="/fortune-tellers"
          className="text-[#B8860B] hover:text-[#DAA520] transition-colors flex items-center gap-1"
        >
          <Search className="w-5 h-5" />
          すべての占い師を見る
        </Link>
      </div>

      <div className="grid gap-4">
        {FORTUNE_CATEGORIES.map((category) => (
          <div key={category.name} className="border border-[#DAA520]/20 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full px-6 py-4 flex items-center justify-between bg-[#FDF5E6] hover:bg-[#FDF5E6]/80 transition-colors"
            >
              <span className="font-medium text-gray-800">{category.name}</span>
              {expandedCategory === category.name ? (
                <ChevronUp className="w-5 h-5 text-[#B8860B]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#B8860B]" />
              )}
            </button>
            
            {expandedCategory === category.name && category.subcategories && (
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-2 bg-white">
                {category.subcategories.map((subcategory) => {
                  const isSelected = selectedCategories.includes(subcategory.name);
                  return (
                    <div key={subcategory.name} className="relative group">
                      <button
                        onClick={() => toggleSubcategory(subcategory.name)}
                        className={`w-full px-4 py-2 rounded-lg text-sm transition-colors ${
                          isSelected
                            ? 'bg-[#B8860B] text-white'
                            : 'bg-[#FDF5E6] text-[#B8860B] hover:bg-[#DAA520]/10'
                        }`}
                        ref={hoveredCategory === subcategory.name ? refs.setReference : undefined}
                        {...getReferenceProps()}
                        onMouseEnter={() => setHoveredCategory(subcategory.name)}
                      >
                        <div className="flex items-center justify-between">
                          <span>{subcategory.name}</span>
                          <Info className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {hoveredCategory && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="bg-white p-4 rounded-lg shadow-lg border border-[#DAA520]/20 max-w-md z-50"
          >
            <p className="text-sm text-gray-600">{getSubcategoryDescription(hoveredCategory)}</p>
          </div>
        </FloatingPortal>
      )}

      {selectedCategories.length > 0 && (
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                検索結果 ({fortuneTellers.length}件)
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                選択した占いのいずれかができる占い師を表示しています
              </p>
            </div>
            <Link
              to={{
                pathname: '/fortune-tellers',
                search: `?categories=${selectedCategories.join(',')}`
              }}
              className="text-[#B8860B] hover:text-[#DAA520] transition-colors"
            >
              すべての結果を見る
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B8860B]"></div>
            </div>
          ) : fortuneTellers.length > 0 ? (
            <div className="space-y-4">
              {fortuneTellers.map((fortuneTeller) => (
                <Link
                  key={fortuneTeller.id}
                  to={`/fortune-teller/${fortuneTeller.id}`}
                  className="block bg-white rounded-lg p-4 hover:shadow-lg transition-shadow border border-[#DAA520]/10"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={fortuneTeller.avatar_url || "https://images.unsplash.com/photo-1601441715247-ed2698874951?q=80&w=100&h=100&fit=crop"}
                      alt={fortuneTeller.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{fortuneTeller.name}</h4>
                      <p className="text-sm text-gray-600">{fortuneTeller.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-4 h-4 text-[#FFD700] fill-current" />
                        <span className="text-sm font-medium">{fortuneTeller.rating.toFixed(1)}</span>
                        <span className="text-sm text-gray-500">({fortuneTeller.review_count}件)</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {fortuneTeller.specialties
                          .filter(specialty => selectedCategories.includes(specialty))
                          .map((specialty, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-0.5 bg-[#FDF5E6] text-[#B8860B] rounded-full text-xs"
                            >
                              {specialty}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              選択したカテゴリの占い師が見つかりませんでした
            </div>
          )}
        </div>
      )}
    </div>
  );
}