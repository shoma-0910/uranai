import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, X, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface BookingModalProps {
  fortuneTeller: {
    id: string;
    name: string;
    price_per_minute: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

interface TimeSlot {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
}

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return [
    `${hour}:00`,
    `${hour}:30`
  ];
}).flat();

const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

// Network check function with timeout
async function checkNetworkConnection(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://www.google.com/favicon.ico', {
      mode: 'no-cors',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.type === 'opaque' || response.ok;
  } catch {
    return false;
  }
}

async function retryWithExponentialBackoff(
  fn: () => Promise<Response>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY
): Promise<Response> {
  try {
    // Check network connection before attempting fetch
    const isOnline = await checkNetworkConnection();
    if (!isOnline) {
      throw new Error('network_offline');
    }

    const response = await fn();
    
    // Log response details for debugging
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    return response;
  } catch (error) {
    if (retries === 0) {
      console.error('All retry attempts failed:', error);
      throw error;
    }
    
    console.log(`Retry attempt ${MAX_RETRIES - retries + 1} failed. Retrying in ${delay}ms...`);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryWithExponentialBackoff(
      fn,
      retries - 1,
      delay * 2
    );
  }
}

export function BookingModal({ fortuneTeller, isOpen, onClose }: BookingModalProps) {
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<TimeSlot[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [existingBookings, setExistingBookings] = useState<{start_time: string, duration_minutes: number}[]>([]);

  const loadSchedules = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 予約可能時間を取得
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('availability_schedules')
        .select('*')
        .eq('fortune_teller_id', fortuneTeller.id)
        .gte('date', today.toISOString())
        .order('date', { ascending: true });

      if (scheduleError) throw scheduleError;

      // 既存の予約を取得
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('start_time, duration_minutes')
        .eq('fortune_teller_id', fortuneTeller.id)
        .gte('start_time', today.toISOString())
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true });

      if (bookingError) throw bookingError;

      setSchedules(scheduleData || []);
      setExistingBookings(bookingData || []);
      
      const uniqueDates = [...new Set(scheduleData?.map(schedule => schedule.date) || [])];
      setAvailableDates(uniqueDates);
    } catch (error) {
      console.error('スケジュールの読み込みに失敗しました:', error);
      toast.error('スケジュールの読み込みに失敗しました');
    }
  };

  useEffect(() => {
    if (isOpen && fortuneTeller.id) {
      loadSchedules();
    }
  }, [isOpen, fortuneTeller.id]);

  useEffect(() => {
    if (date) {
      const selectedDateSchedules = schedules.filter(schedule => schedule.date === date);
      const times = selectedDateSchedules.map(schedule => {
        const startTime = new Date(`${date}T${schedule.start_time}`);
        const endTime = new Date(`${date}T${schedule.end_time}`);
        const timeSlots = [];

        // 既存の予約を考慮して利用可能な時間枠を計算
        const existingBookingsForDate = existingBookings.filter(booking => {
          const bookingDate = new Date(booking.start_time);
          return bookingDate.toDateString() === new Date(date).toDateString();
        });

        while (startTime < endTime) {
          const currentTimeStr = startTime.toTimeString().slice(0, 5);
          const currentTime = new Date(`${date}T${currentTimeStr}`);
          const endTimeWithDuration = new Date(currentTime.getTime() + duration * 60000);

          // 既存の予約と重複していないか確認
          const isTimeAvailable = existingBookingsForDate.every(booking => {
            const bookingStart = new Date(booking.start_time);
            const bookingEnd = new Date(bookingStart.getTime() + booking.duration_minutes * 60000);
            const bufferEnd = new Date(bookingEnd.getTime() + 30 * 60000); // 30分のバッファー

            // 予約時間が既存の予約時間（バッファー含む）と重複していないことを確認
            return endTimeWithDuration <= bookingStart || currentTime >= bufferEnd;
          });

          if (isTimeAvailable) {
            timeSlots.push(currentTimeStr);
          }

          startTime.setMinutes(startTime.getMinutes() + 30);
        }
        
        return timeSlots;
      }).flat();
      
      setAvailableTimes(times);
    }
  }, [date, schedules, duration, existingBookings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const handleConfirmBooking = async () => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('認証情報が見つかりません');

      const startTime = new Date(`${date}T${time}`);
      const totalPrice = fortuneTeller.price_per_minute * duration;

      // First create the booking with 'pending' status
      const { data: bookingData, error: insertError } = await supabase
        .from('bookings')
        .insert({
          user_id: session.user.id,
          fortune_teller_id: fortuneTeller.id,
          start_time: startTime.toISOString(),
          duration_minutes: duration,
          total_price: totalPrice,
          notes,
          status: 'pending'
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      if (!bookingData?.id) throw new Error('予約データの作成に失敗しました');

      // Create Google Meet link with retry mechanism
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!anonKey) {
        throw new Error('認証情報が見つかりません');
      }

      if (!supabaseUrl) {
        throw new Error('Supabase URLが設定されていません');
      }

      // Ensure the URL is properly formatted
      const functionUrl = new URL('/functions/v1/create-meeting', supabaseUrl).toString();

      try {
        console.log('Attempting to generate Meet link...');
        console.log('Function URL:', functionUrl); // Log the URL for debugging
        
        const response = await retryWithExponentialBackoff(async () => {
          const res = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
              'apikey': anonKey,
            },
            body: JSON.stringify({ 
              bookingId: bookingData.id,
              startTime: startTime.toISOString(),
              duration: duration
            }),
            signal: AbortSignal.timeout(10000), // 10 second timeout
          });

          if (!res.ok) {
            const errorText = await res.text();
            console.error('Meet link generation failed with status:', res.status, 'Error:', errorText);
            throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
          }

          return res;
        });

        const { meetLink } = await response.json();
        console.log('Meet link generated successfully:', meetLink);

        // Update booking with meet link and confirm status
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            meet_link: meetLink,
            status: 'confirmed'
          })
          .eq('id', bookingData.id);

        if (updateError) throw updateError;

      } catch (meetError) {
        console.error('Meet link generation failed:', meetError);
        
        // Create a more detailed error message for the user
        let errorMessage = 'ビデオ会議URLの生成に失敗しました。';
        if (meetError instanceof Error) {
          if (meetError.message.includes('timeout')) {
            errorMessage = 'サーバーの応答がタイムアウトしました。しばらく経ってからもう一度お試しください。';
          } else if (meetError.message.includes('network_offline')) {
            errorMessage = 'インターネット接続が切断されています。接続を確認してからもう一度お試しください。';
          } else if (meetError.message.includes('Failed to fetch')) {
            errorMessage = 'サーバーとの通信に失敗しました。しばらく経ってからもう一度お試しください。';
          }
        }
        
        toast.error(errorMessage);
        
        // Keep the booking in 'pending' status if Meet link generation fails
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            status: 'pending',
            notes: `${notes}\n[システム] Meet URL生成に失敗しました。管理者が後ほど設定します。`
          })
          .eq('id', bookingData.id);

        if (updateError) {
          console.error('Failed to update booking status:', updateError);
        }
      }

      setShowConfirmation(false);
      setShowCompletionMessage(true);
      toast.success('予約が完了しました');
    } catch (error) {
      console.error('予約エラー:', error);
      let errorMessage = '予約に失敗しました';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'サーバーとの通信に失敗しました。しばらく経ってからもう一度お試しください。';
        } else if (error.message.includes('network_offline')) {
          errorMessage = 'インターネット接続が切断されています。接続を確認してからもう一度お試しください。';
        } else if (error.message.includes('Supabase URL')) {
          errorMessage = 'システム設定に問題があります。管理者にお問い合わせください。';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToMyPage = () => {
    onClose();
    navigate('/mypage');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dayOfWeek = DAYS_OF_WEEK[date.getDay()];
    return `${date.getMonth() + 1}月${date.getDate()}日(${dayOfWeek})`;
  };

  const totalPrice = fortuneTeller.price_per_minute * duration;

  if (!isOpen) return null;

  if (showCompletionMessage) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div ref={modalRef} className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 relative shadow-xl">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-2xl font-bold text-gray-800 mb-6">予約完了</h2>

          <div className="space-y-6">
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <p className="text-green-800 font-medium mb-2">予約が完了しました</p>
              <p className="text-green-600 text-sm">
                予約内容とGoogle Meetリンクはマイページでご確認いただけます。
              </p>
            </div>

            <button
              onClick={handleGoToMyPage}
              className="w-full bg-[#B8860B] hover:bg-[#DAA520] text-white py-3 rounded-lg transition-colors"
            >
              マイページで予約を確認する
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">予約</h2>

        {showConfirmation ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">予約内容の確認</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-gray-600">
                  <Calendar className="inline-block w-4 h-4 mr-2" />
                  日時: {formatDate(date)} {time}
                </p>
                <p className="text-gray-600">
                  <Clock className="inline-block w-4 h-4 mr-2" />
                  時間: {duration}分
                </p>
                <p className="text-gray-600">
                  料金: ¥{totalPrice.toLocaleString()}
                </p>
                {notes && (
                  <p className="text-gray-600">
                    備考: {notes}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg transition-colors"
              >
                戻る
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={loading}
                className="flex-1 bg-[#B8860B] hover:bg-[#DAA520] text-white py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? '処理中...' : '予約を確定する'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  日付
                </label>
                <select
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setTime('');
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B]"
                >
                  <option value="">日付を選択</option>
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {formatDate(date)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  時間
                </label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  disabled={!date}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B] disabled:bg-gray-100"
                >
                  <option value="">時間を選択</option>
                  {availableTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  時間（分）
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B]"
                >
                  <option value="30">30分 (¥{(30 * fortuneTeller.price_per_minute).toLocaleString()})</option>
                  <option value="60">60分 (¥{(60 * fortuneTeller.price_per_minute).toLocaleString()})</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  備考（任意）
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B]"
                  placeholder="相談内容や質問などがありましたら、ご記入ください。"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!date || !time}
              className="w-full bg-[#B8860B] hover:bg-[#DAA520] text-white py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              予約内容を確認する
            </button>

            <div className="text-sm text-gray-500">
              <AlertCircle className="inline-block w-4 h-4 mr-1" />
              予約確定後のキャンセルはできません。
            </div>
          </form>
        )}
      </div>
    </div>
  );
}