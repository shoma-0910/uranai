import React from 'react';
import { X } from 'lucide-react';

interface SpecialtiesSelectorProps {
  selectedSpecialties: string[];
  onChange: (specialties: string[]) => void;
}

export const SPECIALTIES_CATEGORIES = [
  {
    name: '占術',
    items: [
      'タロット占い',
      '四柱推命',
      '手相占い',
      '九星気学',
      '姓名判断'
    ]
  },
  {
    name: 'スピリチュアル',
    items: [
      'スピリチュアルカウンセリング',
      'チャネリング',
      'オーラリーディング'
    ]
  },
  {
    name: '数秘・カード',
    items: [
      '数秘術',
      'カードリーディング',
      'ルーン占い'
    ]
  },
  {
    name: '占星術',
    items: [
      '西洋占星術',
      '東洋占星術',
      'インド占星術'
    ]
  }
];

export function SpecialtiesSelector({ selectedSpecialties, onChange }: SpecialtiesSelectorProps) {
  const handleToggleSpecialty = (specialty: string) => {
    const newSpecialties = selectedSpecialties.includes(specialty)
      ? selectedSpecialties.filter(s => s !== specialty)
      : [...selectedSpecialties, specialty];
    onChange(newSpecialties);
  };

  return (
    <div className="space-y-6">
      {SPECIALTIES_CATEGORIES.map((category) => (
        <div key={category.name} className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">{category.name}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {category.items.map((specialty) => {
              const isSelected = selectedSpecialties.includes(specialty);
              return (
                <button
                  key={specialty}
                  onClick={() => handleToggleSpecialty(specialty)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    isSelected
                      ? 'bg-[#B8860B] text-white'
                      : 'bg-[#FDF5E6] text-[#B8860B] hover:bg-[#DAA520]/10'
                  }`}
                >
                  {specialty}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selectedSpecialties.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">選択中の得意分野:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedSpecialties.map((specialty) => (
              <span
                key={specialty}
                className="inline-flex items-center gap-1 bg-[#FDF5E6] text-[#B8860B] px-3 py-1 rounded-full text-sm"
              >
                {specialty}
                <button
                  onClick={() => handleToggleSpecialty(specialty)}
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