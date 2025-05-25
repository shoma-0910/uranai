import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import Stripe from 'npm:stripe@14.14.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
};

// 必要な環境変数の確認
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
  throw new Error('必要な環境変数が設定されていません');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  // CORSプリフライトリクエストの処理
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // POSTリクエストのみ許可
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: '許可されていないメソッドです' }),
        {
          headers: corsHeaders,
          status: 405,
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { bookingId } = body;

    if (!bookingId) {
      return new Response(
        JSON.stringify({ error: '予約IDが必要です' }),
        {
          headers: corsHeaders,
          status: 400,
        }
      );
    }

    // 予約情報の取得
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        fortune_teller:fortune_tellers(name)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error('Supabaseエラー:', bookingError);
      return new Response(
        JSON.stringify({ error: '予約情報の取得に失敗しました' }),
        {
          headers: corsHeaders,
          status: 400,
        }
      );
    }
    
    if (!booking) {
      return new Response(
        JSON.stringify({ error: '予約が見つかりません' }),
        {
          headers: corsHeaders,
          status: 404,
        }
      );
    }

    if (!booking.total_price || booking.total_price <= 0) {
      return new Response(
        JSON.stringify({ error: '無効な支払い金額です' }),
        {
          headers: corsHeaders,
          status: 400,
        }
      );
    }

    // PaymentIntentの作成
    const paymentIntent = await stripe.paymentIntents.create({
      amount: booking.total_price,
      currency: 'jpy',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        bookingId: booking.id,
        fortuneTellerName: booking.fortune_teller?.name || '不明',
      },
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
      }),
      {
        headers: corsHeaders,
        status: 200,
      }
    );
  } catch (error) {
    console.error('リクエスト処理エラー:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : '支払い処理の初期化に失敗しました'
      }),
      {
        headers: corsHeaders,
        status: 500,
      }
    );
  }
});