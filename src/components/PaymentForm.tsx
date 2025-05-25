import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentFormProps {
  bookingId: string;
  onSuccess: () => void;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const TEST_CARDS = [
  { type: 'VISA', number: '4242424242424242', brand: 'Visa' },
  { type: 'MASTERCARD', number: '5555555555554444', brand: 'Mastercard' },
  { type: 'AMEX', number: '378282246310005', brand: 'American Express' },
  { type: 'DISCOVER', number: '6011111111111117', brand: 'Discover' },
];

// カード情報のバリデーション
const validateCardInfo = (cardNumber: string, expMonth: string, expYear: string, cvc: string) => {
  const errors: string[] = [];

  if (cardNumber && !/^\d{16}$/.test(cardNumber)) {
    errors.push('カード番号は16桁の数字を入力してください');
  }

  if (expMonth && (!/^\d{1,2}$/.test(expMonth) || parseInt(expMonth) < 1 || parseInt(expMonth) > 12)) {
    errors.push('有効期限（月）は1-12の数字を入力してください');
  }

  if (expYear && !/^\d{2}$/.test(expYear)) {
    errors.push('有効期限（年）は2桁の数字を入力してください');
  }

  if (cvc && !/^\d{3,4}$/.test(cvc)) {
    errors.push('セキュリティコードは3-4桁の数字を入力してください');
  }

  return errors;
};

export function PaymentForm({ bookingId, onSuccess }: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedCard, setSelectedCard] = useState<string>('');
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvc, setCvc] = useState('');

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      setValidationErrors([]);

      // カード情報のバリデーション
      if (!selectedCard) {
        const errors = validateCardInfo(cardNumber, expMonth, expYear, cvc);
        if (errors.length > 0) {
          setValidationErrors(errors);
          throw new Error('カード情報が正しくありません');
        }
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripeの初期化に失敗しました。ページを再読み込みしてください。');
      }

      console.log('支払い処理を開始します...');
      
      // Fetch with timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      try {
        // エッジ関数のURLを正しく構築
        const functionUrl = new URL('/functions/v1/create-payment-intent', import.meta.env.VITE_SUPABASE_URL).toString();

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ bookingId }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorMessage = '支払いの初期化に失敗しました';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || `支払いの初期化に失敗しました (HTTP ${response.status})`;
          } catch (e) {
            console.error('エラーレスポンスの解析に失敗:', e);
          }
          console.error('支払い処理の初期化に失敗:', errorMessage);
          throw new Error(errorMessage);
        }

        const data = await response.json();
        if (!data?.clientSecret) {
          console.error('クライアントシークレットが取得できません:', data);
          throw new Error('支払い情報の取得に失敗しました');
        }

        const { clientSecret } = data;
        console.log('支払い処理の初期化が完了しました');

        let paymentResult;
        if (selectedCard) {
          console.log('テストカードを使用:', selectedCard);
          paymentResult = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: {
                token: `tok_${selectedCard.toLowerCase()}`,
              },
            },
          });
        } else {
          console.log('入力されたカード情報を使用');
          paymentResult = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: {
                number: cardNumber,
                exp_month: parseInt(expMonth),
                exp_year: parseInt(expYear),
                cvc: cvc,
              },
            },
          });
        }

        if (paymentResult.error) {
          console.error('支払い確認に失敗:', paymentResult.error);
          throw new Error(getJapaneseErrorMessage(paymentResult.error.code) || '支払い処理に失敗しました');
        }

        console.log('支払いが完了しました');
        toast.success('支払いが完了しました');
        onSuccess();

      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          throw new Error('支払い処理がタイムアウトしました。ネットワーク接続を確認してください。');
        }
        throw fetchError;
      }

    } catch (error) {
      console.error('支払いエラー:', error);
      const errorMessage = error instanceof Error ? error.message : '支払い処理中にエラーが発生しました';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Stripeのエラーコードを日本語に変換
  const getJapaneseErrorMessage = (code: string): string => {
    const errorMessages: { [key: string]: string } = {
      'card_declined': 'カードが拒否されました',
      'expired_card': 'カードの有効期限が切れています',
      'incorrect_cvc': 'セキュリティコードが正しくありません',
      'incorrect_number': 'カード番号が正しくありません',
      'invalid_expiry_month': '有効期限（月）が正しくありません',
      'invalid_expiry_year': '有効期限（年）が正しくありません',
      'processing_error': '処理中にエラーが発生しました',
      'insufficient_funds': '残高不足です',
    };
    return errorMessages[code] || '支払い処理に失敗しました';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-[#DAA520]/20">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-6 h-6 text-[#B8860B]" />
        <h3 className="text-lg font-semibold text-gray-800">お支払い情報の入力</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-[#B8860B]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>支払い処理中...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium">エラーが発生しました</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800 mb-2">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">入力内容を確認してください</p>
              </div>
              <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* テストカード選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              テストカードを選択
            </label>
            <select
              value={selectedCard}
              onChange={(e) => setSelectedCard(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#B8860B] focus:border-[#B8860B]"
            >
              <option value="">カードを選択してください</option>
              {TEST_CARDS.map((card) => (
                <option key={card.type} value={card.type}>
                  {card.brand} - {card.number}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">または</span>
            </div>
          </div>

          {/* カード情報入力フォーム */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カード番号
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="1234 5678 9012 3456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#B8860B] focus:border-[#B8860B]"
                maxLength={16}
                disabled={!!selectedCard}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  有効期限（月）
                </label>
                <input
                  type="text"
                  value={expMonth}
                  onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, ''))}
                  placeholder="MM"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#B8860B] focus:border-[#B8860B]"
                  maxLength={2}
                  disabled={!!selectedCard}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  有効期限（年）
                </label>
                <input
                  type="text"
                  value={expYear}
                  onChange={(e) => setExpYear(e.target.value.replace(/\D/g, ''))}
                  placeholder="YY"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#B8860B] focus:border-[#B8860B]"
                  maxLength={2}
                  disabled={!!selectedCard}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                セキュリティコード
              </label>
              <input
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                placeholder="123"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#B8860B] focus:border-[#B8860B]"
                maxLength={4}
                disabled={!!selectedCard}
              />
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading || (!selectedCard && (!cardNumber || !expMonth || !expYear || !cvc))}
            className="w-full bg-[#B8860B] hover:bg-[#DAA520] text-white py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            支払いを確定する
          </button>

          <div className="text-sm text-gray-500 space-y-2">
            <p className="text-center">
              ※これはテスト環境です。実際の支払いは発生しません。
            </p>
            <p className="text-center">
              テストカードを選択するか、任意のカード情報を入力してください。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}