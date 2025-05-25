import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  try {
    if (req.method === 'POST') {
      const signature = req.headers.get('stripe-signature');
      if (!signature) throw new Error('No signature found');

      const body = await req.text();
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
      );

      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          const bookingId = paymentIntent.metadata.bookingId;

          // Update booking status
          const { error: updateError } = await supabase
            .from('bookings')
            .update({ status: 'confirmed' })
            .eq('id', bookingId);

          if (updateError) throw updateError;

          // Create notification
          const { data: booking } = await supabase
            .from('bookings')
            .select('user_id, fortune_teller_id')
            .eq('id', bookingId)
            .single();

          if (booking) {
            const notifications = [
              {
                user_id: booking.user_id,
                title: '支払いが完了しました',
                content: '予約の支払いが完了しました。鑑定をお楽しみください。',
                type: 'payment_success'
              },
              {
                user_id: booking.fortune_teller_id,
                title: '予約の支払いが完了しました',
                content: 'お客様の支払いが完了しました。鑑定の準備をお願いします。',
                type: 'payment_success'
              }
            ];

            await supabase.from('notifications').insert(notifications);
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object;
          const bookingId = paymentIntent.metadata.bookingId;

          // Update booking status
          const { error: updateError } = await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId);

          if (updateError) throw updateError;

          // Create notification
          const { data: booking } = await supabase
            .from('bookings')
            .select('user_id')
            .eq('id', bookingId)
            .single();

          if (booking) {
            await supabase.from('notifications').insert({
              user_id: booking.user_id,
              title: '支払いに失敗しました',
              content: '予約の支払いに失敗しました。別の支払い方法をお試しください。',
              type: 'payment_failed'
            });
          }
          break;
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});