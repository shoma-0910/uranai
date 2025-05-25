import React from 'react';
import { Link } from 'react-router-dom';
import { User, Sparkles } from 'lucide-react';
import { BackButton } from '../components/BackButton';

export function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#FDF5E6] py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <BackButton />
          </div>
          <h1 className="text-3xl font-bold text-center text-[#B8860B] mb-8">
            新規登録
          </h1>
          <div className="grid md:grid-cols-2 gap-8">
            <Link
              to="/register/user"
              className="bg-white rounded-xl p-8 shadow-lg border border-[#DAA520]/20 hover:shadow-xl transition-shadow group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#FDF5E6] rounded-full flex items-center justify-center mb-4 group-hover:bg-[#DAA520]/10 transition-colors">
                  <User className="w-8 h-8 text-[#B8860B]" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">ユーザー登録</h2>
                <p className="text-gray-600">
                  占い師に相談したい方は<br />こちらから登録してください
                </p>
              </div>
            </Link>

            <Link
              to="/register/fortune-teller"
              className="bg-white rounded-xl p-8 shadow-lg border border-[#DAA520]/20 hover:shadow-xl transition-shadow group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#FDF5E6] rounded-full flex items-center justify-center mb-4 group-hover:bg-[#DAA520]/10 transition-colors">
                  <Sparkles className="w-8 h-8 text-[#B8860B]" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">占い師登録</h2>
                <p className="text-gray-600">
                  占い師として登録して<br />お客様の相談に応えましょう
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}