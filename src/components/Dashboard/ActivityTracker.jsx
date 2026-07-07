import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { generateYearGrid, getContributionColor } from '../../lib/utils';

export default function ActivityTracker({ user, refreshKey }) {
    const [grid, setGrid] = useState(generateYearGrid());
    const [dailyGoal, setDailyGoal] = useState(3);
    const [savedGoal, setSavedGoal] = useState(3);
    const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });
    const [overdueCount, setOverdueCount] = useState(0); // Новый стейт для просроченных задач

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
                        target_goal: stat ? stat.target_goal : null
                    };
                }));
            }
        };

        // ДОБАВЛЕНО: Запрос для подсчета пропущенных дедлайнов
        const fetchOverdue = async () => {
            const todayStr = new Date().toISOString().split('T')[0];
            const { count, error } = await supabase
                .from('tasks')
                .select('id', { count: 'exact', head: true }) // head: true означает, что мы просим только число, без самих данных (экономит трафик)
                .eq('user_id', user.id)
                .eq('completed', false)
                .lt('due_date', todayStr);

            if (!error && count !== null) {
                setOverdueCount(count);
            }
        };

        if (user) {
            fetchSettings();
            fetchStats();
            fetchOverdue(); // Вызываем проверку долгов
        }
    }, [user, refreshKey]);

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
        const dayGoal = day.target_goal || savedGoal;

        const text = day.completed === 0
            ? `0 tasks on ${day.date}`
            : `${day.completed}/${dayGoal} tasks on ${day.date}`;

        setTooltip({ show: true, text, x: e.clientX, y: e.clientY - 30 });
    };

    return (
        <div className="bg-bgSec p-6 rounded-xl shadow-lg border border-acc2 mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-gray-200">2026 Activity</h2>

                    {/* ДОБАВЛЕНО: Индикатор пропущенных дедлайнов */}
                    {overdueCount > 0 && (
                        <div className="bg-[#a63d40]/10 border border-[#a63d40]/30 text-[#a63d40] text-xs px-2 py-1 rounded flex items-center gap-1 font-medium shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {overdueCount} missed {overdueCount === 1 ? 'deadline' : 'deadlines'}
                        </div>
                    )}
                </div>

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