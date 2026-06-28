import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import TodoList from './components/Todo/TodoList';

function App() {
    const [session, setSession] = useState(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Достаем никнейм из метаданных, если его нет — показываем email
    const displayName = session?.user?.user_metadata?.username || session?.user?.email;

    return (
        <div className="min-h-screen p-4 flex flex-col items-center">
            {!session ? (
                <div className="flex-1 flex items-center justify-center w-full">
                    <Auth />
                </div>
            ) : (
                <div className="w-full max-w-4xl mt-6">
                    {/* Header */}
                    <header className="flex justify-between items-center mb-8 bg-bgSec p-4 rounded-xl border border-acc2 shadow-md">
                        <h1 className="text-2xl font-bold text-acc1">Tracker</h1>

                        <div className="flex items-center gap-6">
              <span className="text-gray-300 font-medium">
                Welcome, {displayName}!
              </span>
                            <button
                                onClick={() => supabase.auth.signOut()}
                                className="text-sm bg-bgMain border border-acc2 px-4 py-2 rounded-lg text-gray-400 hover:text-[#a63d40] hover:border-[#a63d40] transition-colors"
                            >
                                Log Out
                            </button>
                        </div>
                    </header>

                    <div className="w-full mx-auto">
                        <TodoList user={session.user} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;