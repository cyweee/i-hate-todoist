import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { generateYearGrid, getContributionColor } from '../../lib/utils';

export default function ActivityTracker({ user, refreshKey }) {
    const [grid, setGrid] = useState(generateYearGrid());
    const [dailyGoal, setDailyGoal] = useState(3);
    const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

    useEffect(() => {
        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from('user_settings')
                .select('daily_goal')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching settings:', error);
            }

            if (data) {
                setDailyGoal(data.daily_goal);
            } else {
                await supabase.from('user_settings').insert([{ user_id: user.id, daily_goal: 3 }]);
            }
        };

        const fetchStats = async () => {
            const { data, error } = await supabase
                .from('daily_stats')
                .select('*')
                .eq('user_id', user.id);

            if (error) {
                console.error('Error fetching stats:', error);
                return;
            }

            if (data) {
                const statsMap = data.reduce((acc, stat) => {
                    acc[stat.day_date] = stat.completed_count;
                    return acc;
                }, {});

                setGrid(generateYearGrid().map(day => ({
                    ...day,
                    completed: statsMap[day.date] || 0
                })));
            }
        };

        if (user) {
            fetchSettings();
            fetchStats();
        }
    }, [user, refreshKey]);

    // Обновляем локальное состояние при вводе
    const handleGoalChange = (e) => {
        setDailyGoal(e.target.value);
    };

    // Сохраняем в базу только при нажатии Enter или потере фокуса (чтобы не спамить базу)
    const updateGoalInDB = async () => {
        // Защита от пустых значений или отрицательных чисел
        let finalGoal = parseInt(dailyGoal);
        if (isNaN(finalGoal) || finalGoal < 1) {
            finalGoal = 1;
            setDailyGoal(1);
        }

        const { error } = await supabase
            .from('user_settings')
            .update({ daily_goal: finalGoal })
            .eq('user_id', user.id);

        if (error) console.error('Error updating goal:', error);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur(); // Снимает фокус, что триггерит onBlur (updateGoalInDB)
        }
    };

    const handleMouseEnter = (e, day) => {
        const text = day.completed === 0
            ? `0 tasks on ${day.date}`
            : `${day.completed}/${dailyGoal} tasks on ${day.date}`;

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
                        value={dailyGoal}
                        onChange={handleGoalChange}
                        onBlur={updateGoalInDB}
                        onKeyDown={handleKeyDown}
                        className="bg-bgMain text-white text-sm px-3 py-1 w-20 rounded border border-acc2 focus:outline-none focus:border-acc1 text-center"
                        title="Press Enter to save"
                    />
                </div>
            </div>

            <div className="overflow-x-auto pb-4 custom-scrollbar">
                <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
                    {grid.map((day, idx) => (
                        <div
                            key={idx}
                            onMouseEnter={(e) => day.date >= '2026-06-28' && handleMouseEnter(e, day)}
                            onMouseLeave={() => setTooltip({ show: false })}
                            className={`w-[14px] h-[14px] rounded-sm transition-all duration-200 ${
                                day.date >= '2026-06-28' ? 'cursor-pointer hover:ring-2 hover:ring-white hover:scale-110' : ''
                            } ${getContributionColor(day.completed, parseInt(dailyGoal) || 1, day.date)}`}
                        />
                    ))}
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