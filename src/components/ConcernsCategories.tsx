import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, Briefcase, Home, Brain } from 'lucide-react';

const CONCERNS_CATEGORIES = [
  {
    id: 'love',
    name: '恋愛・結婚・人間関係の悩み',
    icon: Heart,
    description: '恋愛、結婚、復縁、不倫、人間関係など',
  },
  {
    id: 'family',
    name: '家族・家庭・子育ての悩み',
    icon: Home,
    description: '家族関係、夫婦、子育て、親子関係など',
  },
  {
    id: 'work',
    name: '仕事・キャリアの悩み',
    icon: Briefcase,
    description: '仕事、転職、起業、職場の人間関係など',
  },
  {
    id: 'mental',
    name: '心と身体の悩み',
    icon: Brain,
    description: 'メンタルヘルス、ストレス、生き方、健康など',
  }
];

export function ConcernsCategories() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-gold border border-[#DAA520]/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">お悩みから探す</h2>
        <Link
          to="/fortune-tellers"
          className="text-[#B8860B] hover:text-[#DAA520] transition-colors flex items-center gap-1"
        >
          <Search className="w-5 h-5" />
          すべての占い師を見る
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CONCERNS_CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <div
              key={category.id}
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-[#DAA520]/10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#FDF5E6] flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[#B8860B]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{category.name}</h3>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{category.description}</p>
              
              <Link
                to={`/fortune-tellers?specialties=${encodeURIComponent(category.name)}`}
                className="inline-block w-full text-center bg-[#FDF5E6] text-[#B8860B] hover:bg-[#DAA520]/10 transition-colors py-2 rounded-lg"
              >
                この悩みの占い師を探す
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}