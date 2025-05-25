import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Clock, Save, X, ChevronLeft, ChevronRight } from 'lucide-react';

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

export function AvailabilitySchedulePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fortuneTellerId, setFortuneTellerId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeRange, setTimeRange] = useState<{ start: string; end: string }>({
    start: '09:00',
    end: '17:00'
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: fortuneTeller } = await supabase
        .from('fortune_tellers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!fortuneTeller) {
        navigate('/register/fortune-teller/profile');
        return;
      }

      setFortuneTellerId(fortuneTeller.id);

      const { data: existingSchedules, error } = await supabase
        .from('availability_schedules')
        .select('*')
        .eq('fortune_teller_id', fortuneTeller.id)
        .order('date');

      if (error) throw error;

      if (existingSchedules.length > 0) {
        setSchedules(existingSchedules.map(schedule => ({
          id: schedule.id,
          date: schedule.date,
          start_time: schedule.start_time.slice(0, 5),
          end_time: schedule.end_time.slice(0, 5)
        })));
      }
    } catch (error) {
      console.error('スケジュールの読み込みに失敗しました:', error);
      toast.error('スケジュールの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTimeSlot = () => {
    if (!selectedDate) return;

    const existingSlot = schedules.find(s => s.date === selectedDate);
    if (existingSlot) {
      toast.error('この日付は既に設定されています');
      return;
    }

    if (timeRange.start >= timeRange.end) {
      toast.error('開始時間は終了時間より前である必要があります');
      return;
    }

    setSchedules(prev => [...prev, {
      date: selectedDate,
      start_time: timeRange.start,
      end_time: timeRange.end
    }]);

    setSelectedDate(null);
    setTimeRange({ start: '09:00', end: '17:00' });
    toast.success('時間枠を追加しました');
  };

  const handleRemoveTimeSlot = (date: string) => {
    setSchedules(prev => prev.filter(s => s.date !== date));
    toast.success('時間枠を削除しました');
  };

  const handleSave = async () => {
    if (!fortuneTellerId) return;

    setSaving(true);
    try {
      // Validate time ranges
      for (const schedule of schedules) {
        if (schedule.start_time >= schedule.end_time) {
          throw new Error(`${schedule.date}の時間範囲が無効です`);
        }
      }

      // Delete existing schedules
      await supabase
        .from('availability_schedules')
        .delete()
        .eq('fortune_teller_id', fortuneTellerId);

      // Insert new schedules
      const { error } = await supabase
        .from('availability_schedules')
        .insert(
          schedules.map(schedule => ({
            fortune_teller_id: fortuneTellerId,
            date: schedule.date,
            start_time: schedule.start_time,
            end_time: schedule.end_time
          }))
        );

      if (error) throw error;

      toast.success('予約可能時間を保存しました');
      navigate('/mypage/fortune-teller');
    } catch (error) {
      console.error('スケジュールの保存に失敗しました:', error);
      toast.error(error instanceof Error ? error.message : 'スケジュールの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // 前月の日付を追加
    for (let i = 0; i < firstDay.getDay(); i++) {
      const prevDate = new Date(year, month, -i);
      days.unshift({
        date: prevDate.toISOString().split('T')[0],
        isCurrentMonth: false
      });
    }

    // 当月の日付を追加
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDate = new Date(year, month, i);
      days.push({
        date: currentDate.toISOString().split('T')[0],
        isCurrentMonth: true
      });
    }

    // 次月の日付を追加
    const remainingDays = 42 - days.length; // 6週間分のグリッドを確保
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        date: nextDate.toISOString().split('T')[0],
        isCurrentMonth: false
      });
    }

    return days;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const isDateSelectable = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8860B]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <BackButton />
        </div>

        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-[#B8860B] mb-8">予約可能時間の設定</h1>

          <div className="bg-white rounded-xl p-8 shadow-lg border border-[#DAA520]/20">
            {/* カレンダー */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">日付を選択</h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                    className="p-2 hover:bg-[#FDF5E6] rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-[#B8860B]" />
                  </button>
                  <span className="text-lg font-medium">
                    {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
                  </span>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                    className="p-2 hover:bg-[#FDF5E6] rounded-full transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-[#B8860B]" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                    {day}
                  </div>
                ))}
                {getDaysInMonth(currentMonth).map(({ date, isCurrentMonth }) => {
                  const isSelected = selectedDate === date;
                  const hasSchedule = schedules.some(s => s.date === date);
                  const isSelectable = isDateSelectable(date);
                  
                  return (
                    <button
                      key={date}
                      onClick={() => isSelectable && setSelectedDate(isSelected ? null : date)}
                      disabled={!isSelectable || hasSchedule}
                      className={`
                        py-3 rounded-lg text-center transition-colors relative
                        ${!isCurrentMonth ? 'text-gray-400' : ''}
                        ${!isSelectable ? 'cursor-not-allowed opacity-50' : ''}
                        ${hasSchedule 
                          ? 'bg-[#FDF5E6] text-[#B8860B] cursor-not-allowed' 
                          : isSelected
                            ? 'bg-[#B8860B] text-white'
                            : isSelectable
                              ? 'hover:bg-[#FDF5E6] text-gray-800'
                              : ''
                        }
                      `}
                    >
                      {new Date(date).getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 時間選択 */}
            {selectedDate && (
              <div className="mb-8 bg-[#FDF5E6] p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-[#B8860B] mb-4">
                  {formatDate(selectedDate)}の予約可能時間
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">開始時間</label>
                    <select
                      value={timeRange.start}
                      onChange={(e) => setTimeRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-4 py-2 border border-[#DAA520]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B]"
                    >
                      {TIME_OPTIONS.map(time => (
                        <option key={`start-${time}`} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">終了時間</label>
                    <select
                      value={timeRange.end}
                      onChange={(e) => setTimeRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-4 py-2 border border-[#DAA520]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B]"
                    >
                      {TIME_OPTIONS.map(time => (
                        <option key={`end-${time}`} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleAddTimeSlot}
                  className="mt-4 w-full bg-[#B8860B] text-white py-2 rounded-lg hover:bg-[#DAA520] transition-colors"
                >
                  時間枠を追加
                </button>
              </div>
            )}

            {/* 設定済みの時間枠 */}
            {schedules.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">設定済みの予約可能時間</h3>
                <div className="space-y-3">
                  {schedules
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((schedule) => (
                      <div
                        key={schedule.date}
                        className="flex items-center justify-between bg-[#FDF5E6] p-4 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-medium text-[#B8860B]">
                            {formatDate(schedule.date)}
                          </span>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{schedule.start_time} - {schedule.end_time}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveTimeSlot(schedule.date)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving || schedules.length === 0}
              className="w-full bg-[#B8860B] hover:bg-[#DAA520] text-white py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  予約可能時間を保存
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}