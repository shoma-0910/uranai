import { SESClient, SendEmailCommand } from "npm:@aws-sdk/client-ses@3.540.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

// SESクライアントの初期化
const sesClient = new SESClient({
  region: "ap-northeast-1", // 東京リージョン
  credentials: {
    accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') || '',
    secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') || '',
  },
});

Deno.serve(async (req) => {
  // CORSプリフライトリクエストの処理
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const formData: ContactFormData = await req.json();

    // 入力値の検証
    if (!formData.name || !formData.email || !formData.message) {
      throw new Error('必須項目が入力されていません');
    }

    // メールアドレスの形式を検証
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      throw new Error('メールアドレスの形式が正しくありません');
    }

    // AWS認証情報の検証
    if (!Deno.env.get('AWS_ACCESS_KEY_ID') || !Deno.env.get('AWS_SECRET_ACCESS_KEY')) {
      throw new Error('AWS認証情報が設定されていません');
    }

    const verifiedEmail = Deno.env.get('VERIFIED_EMAIL_ADDRESS');
    if (!verifiedEmail) {
      throw new Error('送信元メールアドレスが設定されていません');
    }

    // 管理者向けメール
    const adminEmailParams = {
      Source: verifiedEmail,
      Destination: {
        ToAddresses: ['321.trik@gmail.com'], // 管理者のメールアドレス
      },
      Message: {
        Subject: {
          Data: `新規お問い合わせ: ${formData.name}様より`,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: `
              <h2>お問い合わせ内容</h2>
              <p><strong>お名前:</strong> ${formData.name}</p>
              <p><strong>メールアドレス:</strong> ${formData.email}</p>
              <p><strong>内容:</strong></p>
              <p>${formData.message.replace(/\n/g, '<br>')}</p>
            `,
            Charset: 'UTF-8',
          },
        },
      },
    };

    // 自動返信メール
    const autoReplyParams = {
      Source: verifiedEmail,
      Destination: {
        ToAddresses: [formData.email],
      },
      Message: {
        Subject: {
          Data: 'お問い合わせありがとうございます',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: `
              <h2>${formData.name}様</h2>
              <p>お問い合わせいただき、ありがとうございます。</p>
              <p>内容を確認次第、担当者よりご連絡させていただきます。</p>
              <p>今しばらくお待ちくださいますよう、よろしくお願いいたします。</p>
              <hr>
              <h3>お問い合わせ内容</h3>
              <p>${formData.message.replace(/\n/g, '<br>')}</p>
            `,
            Charset: 'UTF-8',
          },
        },
      },
    };

    try {
      // メール送信の実行
      const sendAdminEmail = new SendEmailCommand(adminEmailParams);
      const sendAutoReply = new SendEmailCommand(autoReplyParams);

      await Promise.all([
        sesClient.send(sendAdminEmail),
        sesClient.send(sendAutoReply),
      ]);
    } catch (emailError) {
      console.error('SES error:', emailError);
      throw new Error('メール送信中にエラーが発生しました: ' + (emailError instanceof Error ? emailError.message : '不明なエラー'));
    }

    return new Response(
      JSON.stringify({ message: 'メールを送信しました' }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Error sending email:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'メールの送信に失敗しました'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});