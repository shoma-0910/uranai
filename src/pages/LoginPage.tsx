import React from 'react';
import { AuthForm } from '../components/AuthForm';
import { BackButton } from '../components/BackButton';

export function LoginPage() {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <BackButton />
          </div>
          <h1 className="text-3xl font-bold text-center text-[#B8860B] mb-8">
            ログイン
          </h1>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-[#DAA520]/20">
            <p className="text-gray-600 mb-8 text-center">
              アカウントにログインして、占い師との出会いを始めましょう。
            </p>
            <AuthForm initialMode="login" />
          </div>
        </div>
      </div>
    </div>
  );
}