import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import TodoList from './components/Todo/TodoList'; // Добавили импорт

function App() {
    const [session, setSession] = useState(null);

    useEffect(() => {
        // Check active session on load
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <div className="min-h-screen p-4 flex flex-col items-center justify-center">
            {!session ? (
                <Auth />
            ) : (
                <div className="w-full max-w-2xl text-center mt-10">
                    <h1 className="text-3xl font-bold text-acc1 mb-2">Todo & Activity Tracker</h1>
                    <p className="text-gray-300 mb-8">Welcome, {session.user.email}!</p>

                    {/* Здесь теперь работает наш реальный список задач */}
                    <TodoList user={session.user} />

                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="text-gray-500 hover:text-[#a63d40] transition-colors mt-4 mb-10"
                    >
                        Log Out
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;