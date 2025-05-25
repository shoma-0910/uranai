import React from 'react';
import { AuthForm } from '../components/AuthForm';
import { BackButton } from '../components/BackButton';

export function UserRegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#FDF5E6] py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <BackButton />
          </div>
          <h1 className="text-3xl font-bold text-center text-[#B8860B] mb-8">
            ユーザー登録
          </h1>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-[#DAA520]/20">
            <p className="text-gray-600 mb-8 text-center">
              登録して、あなたに最適な占い師を見つけましょう。
              プロフェッショナルの占い師があなたをサポートします。
            </p>
            <AuthForm initialMode="register" userType="user" />
          </div>
        </div>
      </div>
    </div>
  );
}