import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import TodoList from './components/Todo/TodoList';
import ActivityTracker from './components/Dashboard/ActivityTracker';
import HomePage from './components/Home/HomePage';
import AboutPage from './components/About/AboutPage';
import Toast from './components/UI/Toast';

// СПЕЦИАЛЬНАЯ КНОПКА ДЛЯ УЧИТЕЛЯ
const AttentionGrabberButton = ({ onClick }) => {
    const [text, setText] = useState('about the project');

    useEffect(() => {
        const interval = setInterval(() => {
            setText(prev => prev === 'about the project' ? 'read this pls🙏🙏🙏' : 'about the project');
        }, 1500); // Меняет текст каждые 1.5 секунды
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative inline-block ml-4 mt-2 sm:mt-0">
            {/* Прыгающие курсоры, указывающие на кнопку */}
            <div className="absolute -top-3 -left-3 animate-bounce text-lg z-20 pointer-events-none">↘️</div>
            <div className="absolute -bottom-3 -right-3 animate-bounce text-lg z-20 pointer-events-none">↖️</div>
            <div className="absolute top-1/2 -translate-y-1/2 -left-6 animate-pulse text-lg z-20 pointer-events-none">👉</div>

            <button
                onClick={onClick}
                className="relative px-3 py-1.5 font-mono text-xs md:text-sm font-bold text-[#52b788] border-2 border-[#52b788] rounded-md shadow-[0_0_15px_rgba(82,183,136,0.6)] hover:bg-[#52b788] hover:text-[#121212] hover:shadow-[0_0_25px_rgba(82,183,136,0.9)] transition-all duration-300 group overflow-hidden"
            >
                {/* Эффект блика / Матрицы */}
                <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.3)] to-transparent group-hover:left-[100%] transition-all duration-700"></span>
                <span className="relative z-10 uppercase">{text}</span>
            </button>
        </div>
    );
};

function App() {
    const [session, setSession] = useState(null);
    const [view, setView] = useState('home'); // Управляем состоянием: 'home', 'auth', 'about', 'app'
    const [trackerRefreshKey, setTrackerRefreshKey] = useState(0);
    const [toast, setToast] = useState('');
    const [userData, setUserData] = useState({ xp: 0 });

    const [isInitialStatsLoad, setIsInitialStatsLoad] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) setView('app');
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
        setIsInitialStatsLoad(false);
    };

    const handleTaskStatusChange = (msg) => {
        setTrackerRefreshKey(prev => prev + 1);
        if (msg) setToast(msg);
    };

    const displayName = session?.user?.user_metadata?.username || session?.user?.email;
    const level = Math.floor(userData.xp / 100) + 1;

    return (
        <div className="min-h-screen p-4 flex flex-col items-center justify-center">

            {!session ? (
                view === 'home' ? (
                    <HomePage
                        onNavigateToAuth={() => setView('auth')}
                        onNavigateToAbout={() => setView('about')}
                    />
                ) : view === 'about' ? (
                    <AboutPage onBack={() => setView('home')} />
                ) : (
                    <div className="w-full max-w-md">
                        <Auth />
                        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
                            <button onClick={() => setView('home')} className="text-gray-500 hover:text-white text-sm transition-colors">
                                ← Back to Home
                            </button>

                            {/* Наша сумасшедшая кнопка на странице авторизации */}
                            <AttentionGrabberButton onClick={() => setView('about')} />
                        </div>
                    </div>
                )
            ) : (
                view === 'about' ? (
                    <AboutPage onBack={() => setView('app')} />
                ) : (
                    <div className="w-full max-w-4xl mt-6 animate-fade-in">
                        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-bgSec p-4 rounded-xl border border-acc2 shadow-md gap-4">
                            <div className="flex gap-6 items-center w-full sm:w-auto justify-between sm:justify-start">
                                <h1 className="text-2xl font-bold text-acc1">Tracker</h1>

                                <div className="flex gap-4 sm:ml-4">
                                    <div className="text-center flex flex-col items-center">
                                        <p className="text-[10px] text-gray-500">LVL</p>
                                        {isInitialStatsLoad ? (
                                            <div className="h-5 w-6 bg-acc2/50 animate-pulse rounded mt-0.5"></div>
                                        ) : (
                                            <p className="font-bold text-acc1">{level}</p>
                                        )}
                                    </div>
                                    <div className="text-center flex flex-col items-center">
                                        <p className="text-[10px] text-gray-500">XP</p>
                                        {isInitialStatsLoad ? (
                                            <div className="h-5 w-8 bg-acc2/50 animate-pulse rounded mt-0.5"></div>
                                        ) : (
                                            <p className="font-bold text-acc3">{userData.xp}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center sm:justify-end w-full sm:w-auto">

                                {/* Наша сумасшедшая кнопка в шапке */}
                                <AttentionGrabberButton onClick={() => setView('about')} />

                                <span className="text-gray-300 font-medium hidden sm:block">{displayName}</span>
                                <button onClick={() => supabase.auth.signOut()} className="text-sm bg-bgMain border border-acc2 px-4 py-2 rounded-lg text-gray-400 hover:text-[#a63d40] hover:border-[#a63d40] transition-colors mt-2 sm:mt-0">
                                    Log Out
                                </button>
                            </div>
                        </header>

                        <ActivityTracker user={session.user} refreshKey={trackerRefreshKey} />
                        <TodoList user={session.user} onTaskUpdated={handleTaskStatusChange} />
                    </div>
                )
            )}

            {toast && <Toast message={toast} onClose={() => setToast('')} />}
        </div>
    );
}

export default App;