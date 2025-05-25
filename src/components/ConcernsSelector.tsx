import React from 'react';
import { Heart, Briefcase, Home, Brain, X } from 'lucide-react';

export const CONCERNS_CATEGORIES = [
  {
    id: 'love',
    name: '恋愛・結婚・人間関係の悩み',
    icon: Heart,
    description: '恋愛、結婚、復縁、不倫、人間関係など'
  },
  {
    id: 'family',
    name: '家族・家庭・子育ての悩み',
    icon: Home,
    description: '家族関係、夫婦、子育て、親子関係など'
  },
  {
    id: 'work',
    name: '仕事・キャリアの悩み',
    icon: Briefcase,
    description: '仕事、転職、起業、職場の人間関係など'
  },
  {
    id: 'mental',
    name: '心と身体の悩み',
    icon: Brain,
    description: 'メンタルヘルス、ストレス、生き方、健康など'
  }
];

interface ConcernsSelectorProps {
  selectedConcerns: string[];
  onChange: (concerns: string[]) => void;
}

export function ConcernsSelector({ selectedConcerns, onChange }: ConcernsSelectorProps) {
  const handleToggleConcern = (concern: string) => {
    const newConcerns = selectedConcerns.includes(concern)
      ? selectedConcerns.filter(c => c !== concern)
      : [...selectedConcerns, concern];
    onChange(newConcerns);
  };

  return (
    <div className="space-y-6">
      {CONCERNS_CATEGORIES.map((category) => {
        const Icon = category.icon;
        const isSelected = selectedConcerns.includes(category.name);
        return (
          <div key={category.id} className="bg-white rounded-lg p-6 border border-[#DAA520]/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FDF5E6] flex items-center justify-center">
                <Icon className="w-6 h-6 text-[#B8860B]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
            </div>

            <button
              onClick={() => handleToggleConcern(category.name)}
              className={`w-full px-4 py-2 rounded-lg text-sm transition-colors ${
                isSelected
                  ? 'bg-[#B8860B] text-white'
                  : 'bg-[#FDF5E6] text-[#B8860B] hover:bg-[#DAA520]/10'
              }`}
            >
              {isSelected ? '選択中' : '選択する'}
            </button>
          </div>
        );
      })}

      {selectedConcerns.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">選択中の得意分野:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedConcerns.map((concern) => (
              <span
                key={concern}
                className="inline-flex items-center gap-1 bg-[#FDF5E6] text-[#B8860B] px-3 py-1 rounded-full text-sm"
              >
                {concern}
                <button
                  onClick={() => handleToggleConcern(concern)}
                  className="hover:text-[#DAA520]"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}