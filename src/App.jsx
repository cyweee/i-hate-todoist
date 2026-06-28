import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import TodoList from './components/Todo/TodoList';
import ActivityTracker from './components/Dashboard/ActivityTracker';
import HomePage from './components/Home/HomePage'; // Импортируем новую страницу
import Toast from './components/UI/Toast';

function App() {
    const [session, setSession] = useState(null);
    const [view, setView] = useState('home'); // Управляем состоянием: 'home' или 'auth'
    const [trackerRefreshKey, setTrackerRefreshKey] = useState(0);
    const [toast, setToast] = useState('');
    const [userData, setUserData] = useState({ xp: 0 });

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) setView('app'); // Если уже залогинен — сразу в приложение
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) setView('app');
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session?.user) fetchUserStats();
    }, [session, trackerRefreshKey]);

    const fetchUserStats = async () => {
        const { data } = await supabase.from('user_settings').select('xp').eq('user_id', session.user.id).single();
        if (data) setUserData({ xp: data.xp });
    };

    const handleTaskStatusChange = (msg) => {
        setTrackerRefreshKey(prev => prev + 1);
        if (msg) setToast(msg);
    };

    const displayName = session?.user?.user_metadata?.username || session?.user?.email;
    const level = Math.floor(userData.xp / 100) + 1;

    return (
        <div className="min-h-screen p-4 flex flex-col items-center justify-center">

            {/* Если нет сессии, показываем HomePage или Auth */}
            {!session ? (
                view === 'home' ? (
                    <HomePage onNavigateToAuth={() => setView('auth')} />
                ) : (
                    <div className="w-full max-w-md">
                        <Auth />
                        <button onClick={() => setView('home')} className="mt-4 text-gray-500 hover:text-white text-sm w-full text-center">Back</button>
                    </div>
                )
            ) : (
                /* Если сессия есть - показываем приложение */
                <div className="w-full max-w-4xl mt-6">
                    <header className="flex justify-between items-center mb-8 bg-bgSec p-4 rounded-xl border border-acc2 shadow-md">
                        <div className="flex gap-6 items-center">
                            <h1 className="text-2xl font-bold text-acc1">Tracker</h1>
                            <div className="flex gap-4 ml-4">
                                <div className="text-center"><p className="text-[10px] text-gray-500">LVL</p><p className="font-bold text-acc1">{level}</p></div>
                                <div className="text-center"><p className="text-[10px] text-gray-500">XP</p><p className="font-bold text-acc3">{userData.xp}</p></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <span className="text-gray-300 font-medium">{displayName}</span>
                            <button onClick={() => supabase.auth.signOut()} className="text-sm bg-bgMain border border-acc2 px-4 py-2 rounded-lg text-gray-400 hover:text-[#a63d40] hover:border-[#a63d40] transition-colors">Log Out</button>
                        </div>
                    </header>

                    <ActivityTracker user={session.user} refreshKey={trackerRefreshKey} />
                    <TodoList user={session.user} onTaskUpdated={handleTaskStatusChange} />
                </div>
            )}

            {toast && <Toast message={toast} onClose={() => setToast('')} />}
        </div>
    );
}

export default App;