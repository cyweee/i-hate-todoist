import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { generateYearGrid, getContributionColor } from '../../lib/utils';

export default function ActivityTracker({ user, refreshKey }) {
    const [grid, setGrid] = useState(generateYearGrid());
    const [dailyGoal, setDailyGoal] = useState(3);
    const [savedGoal, setSavedGoal] = useState(3);
    const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

    useEffect(() => {
        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from('user_settings')
                .select('daily_goal')
                .eq('user_id', user.id)
                .single();

            if (data) {
                setDailyGoal(data.daily_goal);
                setSavedGoal(data.daily_goal);
            } else if (error && error.code === 'PGRST116') {
                await supabase.from('user_settings').insert([{ user_id: user.id, daily_goal: 3 }]);
            }
        };

        const fetchStats = async () => {
            const { data, error } = await supabase
                .from('daily_stats')
                .select('*')
                .eq('user_id', user.id);

            if (error) return;

            if (data) {
                // ДОБАВЛЕНО: Читаем и completed, и target_goal из нового SQL View
                const statsMap = data.reduce((acc, stat) => {
                    acc[stat.day_date] = {
                        completed: stat.completed_count,
                        target_goal: stat.target_goal
                    };
                    return acc;
                }, {});

                setGrid(generateYearGrid().map(day => {
                    const stat = statsMap[day.date];
                    return {
                        ...day,
                        completed: stat ? stat.completed : 0,
                        target_goal: stat ? stat.target_goal : null // Записываем индивидуальную цель дня
                    };
                }));
            }
        };

        if (user) {
            fetchSettings();
            fetchStats();
        }
    }, [user, refreshKey]);

    // ДОБАВЛЕНО: Жесткая проверка ввода на лету
    const handleGoalChange = (e) => {
        let val = e.target.value;

        if (val === '') {
            setDailyGoal('');
            return;
        }

        let num = parseInt(val, 10);
        if (num > 10) num = 10;
        if (num < 1) num = 1;

        setDailyGoal(num);
    };

    const attemptUpdateGoal = async () => {
        if (dailyGoal === '' || parseInt(dailyGoal, 10) === savedGoal) {
            setDailyGoal(savedGoal);
            return;
        }

        let finalGoal = parseInt(dailyGoal, 10);

        // Перевел на английский для консистентности UI
        const confirmChange = window.confirm(`Are you sure you want to set your daily goal to ${finalGoal}?`);

        if (!confirmChange) {
            setDailyGoal(savedGoal);
            return;
        }

        const { error } = await supabase
            .from('user_settings')
            .upsert({ user_id: user.id, daily_goal: finalGoal }, { onConflict: 'user_id' });

        if (error) {
            console.error('Error updating goal:', error);
            alert('Error saving! Check Supabase RLS policies.');
            setDailyGoal(savedGoal);
        } else {
            setSavedGoal(finalGoal);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    const handleMouseEnter = (e, day) => {
        // ДОБАВЛЕНО: Тултип показывает цель именно того дня (или текущую, если старой нет)
        const dayGoal = day.target_goal || savedGoal;

        const text = day.completed === 0
            ? `0 tasks on ${day.date}`
            : `${day.completed}/${dayGoal} tasks on ${day.date}`;

        setTooltip({ show: true, text, x: e.clientX, y: e.clientY - 30 });
    };

    return (
        <div className="bg-bgSec p-6 rounded-xl shadow-lg border border-acc2 mb-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-200">2026 Activity</h2>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Daily Goal:</span>
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={dailyGoal}
                        onChange={handleGoalChange}
                        onBlur={attemptUpdateGoal}
                        onKeyDown={handleKeyDown}
                        className="bg-bgMain text-white text-sm px-3 py-1 w-20 rounded border border-acc2 focus:outline-none focus:border-acc1 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        title="Press Enter to save"
                    />
                </div>
            </div>

            <div className="overflow-x-auto pb-4 custom-scrollbar">
                <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
                    {grid.map((day, idx) => {
                        // ДОБАВЛЕНО: Цвет считается исходя из цели конкретного дня
                        const dayGoal = day.target_goal || savedGoal;

                        return (
                            <div
                                key={idx}
                                onMouseEnter={(e) => day.date >= '2026-06-28' && handleMouseEnter(e, day)}
                                onMouseLeave={() => setTooltip({ show: false })}
                                className={`w-[14px] h-[14px] rounded-sm transition-all duration-200 ${
                                    day.date >= '2026-06-28' ? 'cursor-pointer hover:ring-2 hover:ring-white hover:scale-110' : ''
                                } ${getContributionColor(day.completed, dayGoal, day.date)}`}
                            />
                        );
                    })}
                </div>
            </div>

            {tooltip.show && (
                <div
                    className="fixed z-50 px-3 py-1.5 text-xs font-medium bg-acc2 text-white rounded shadow-xl pointer-events-none transform -translate-x-1/2"
                    style={{ top: tooltip.y, left: tooltip.x }}
                >
                    {tooltip.text}
                </div>
            )}
        </div>
    );
}