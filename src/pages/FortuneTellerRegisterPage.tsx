import React from 'react';
import { AuthForm } from '../components/AuthForm';
import { BackButton } from '../components/BackButton';
import { Clock, Video, CheckCircle } from 'lucide-react';

export function FortuneTellerRegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#FDF5E6] py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <BackButton />
          </div>
          <h1 className="text-3xl font-bold text-center text-[#B8860B] mb-8">
            占い師登録
          </h1>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-[#DAA520]/20">
            <div className="mb-8 space-y-4">
              <p className="text-gray-600 text-center">
                登録して、あなたの占いサービスを提供しましょう。
                多くのお客様があなたの鑑定を待っています。
              </p>
              <div className="bg-[#FDF5E6] rounded-lg p-4">
                <h3 className="text-[#B8860B] font-medium mb-2">登録の流れ</h3>
                <ol className="list-decimal list-inside text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="inline-block mt-1">
                      <CheckCircle className="w-4 h-4 text-[#B8860B]" />
                    </span>
                    <span>基本情報を入力</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block mt-1">
                      <CheckCircle className="w-4 h-4 text-[#B8860B]" />
                    </span>
                    <span>プロフィール情報を設定</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block mt-1">
                      <Video className="w-4 h-4 text-[#B8860B]" />
                    </span>
                    <span>管理人との面談（オンライン）</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block mt-1">
                      <Clock className="w-4 h-4 text-[#B8860B]" />
                    </span>
                    <span>承認後、予約の受付開始</span>
                  </li>
                </ol>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h4 className="text-blue-800 font-medium mb-2">管理人面談について</h4>
                <p className="text-blue-700 text-sm">
                  プロフィール設定後、管理人とのオンライン面談（30分程度）を実施させていただきます。
                  面談では、占いの経験や得意分野、お客様への対応方針などについてお話しさせていただきます。
                </p>
              </div>
            </div>
            <AuthForm initialMode="register" userType="fortune-teller" />
          </div>
        </div>
      </div>
    </div>
  );
}