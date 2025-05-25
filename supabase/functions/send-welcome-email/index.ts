import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { Resend } from 'npm:resend@2.1.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
};

// Resend APIキーの存在確認
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
if (!RESEND_API_KEY) {
  console.error('RESEND_API_KEY is not set in environment variables');
}

const resend = new Resend(RESEND_API_KEY);

Deno.serve(async (req) => {
  // CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // リクエストボディのパース
    const requestData = await req.json().catch((error) => {
      console.error('JSON parse error:', error);
      throw new Error('Invalid request body');
    });

    const { email, name, userType } = requestData;

    // 必須パラメータの検証
    if (!email || !name || !userType) {
      console.error('Missing required parameters:', { email, name, userType });
      return new Response(
        JSON.stringify({ 
          error: '必要な情報が不足しています',
          details: {
            email: !email ? 'メールアドレスが必要です' : null,
            name: !name ? '名前が必要です' : null,
            userType: !userType ? 'ユーザータイプが必要です' : null,
          }
        }),
        {
          headers: corsHeaders,
          status: 400,
        }
      );
    }

    const subject = userType === 'fortune-teller' 
      ? '【占いマッチング】占い師登録ありがとうございます'
      : '【占いマッチング】ご登録ありがとうございます';

    const content = userType === 'fortune-teller'
      ? `${name} 様

占いマッチングに占い師としてご登録いただき、ありがとうございます。

プロフィールを作成して、お客様からの予約受付を開始しましょう。
プロフィールは以下の情報を設定できます：

- プロフィール写真
- 得意な占い
- 自己紹介
- 鑑定料金
- 予約可能時間

ご不明な点がございましたら、お気軽にお問い合わせください。

今後ともよろしくお願いいたします。

占いマッチング運営事務局`
      : `${name} 様

占いマッチングにご登録いただき、ありがとうございます。

多くの占い師があなたの相談をお待ちしています。
以下のような悩みについて、プロの占い師に相談できます：

- 恋愛・結婚
- 仕事・キャリア
- 人間関係
- 健康・精神
- 金運・財運

ご不明な点がございましたら、お気軽にお問い合わせください。

今後ともよろしくお願いいたします。

占いマッチング運営事務局`;

    try {
      const { data, error } = await resend.emails.send({
        from: 'Fortune Matching <noreply@fortunematching.com>',
        to: email,
        subject: subject,
        text: content,
      });

      if (error) {
        console.error('Resend API error:', error);
        throw error;
      }

      return new Response(
        JSON.stringify({ 
          message: 'メールを送信しました',
          data 
        }),
        {
          headers: corsHeaders,
          status: 200,
        }
      );
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      throw new Error('メール送信に失敗しました: ' + (emailError instanceof Error ? emailError.message : '不明なエラー'));
    }

  } catch (error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'メールの送信に失敗しました',
        timestamp: new Date().toISOString(),
      }),
      {
        headers: corsHeaders,
        status: 500,
      }
    );
  }
});