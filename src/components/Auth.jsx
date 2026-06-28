import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState(''); // Новое состояние для никнейма
    const [isLogin, setIsLogin] = useState(true);
    const [message, setMessage] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                // При регистрации сохраняем никнейм в метаданные
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: username,
                        }
                    }
                });
                if (error) throw error;
                setMessage('Successfully registered! You can now log in.');
            }
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-bgSec p-8 rounded-2xl shadow-lg border border-acc2">
            <h2 className="text-2xl font-bold text-center text-white mb-6">
                {isLogin ? 'Login' : 'Sign Up'}
            </h2>

            <form onSubmit={handleAuth} className="space-y-4">
                {/* Показываем поле Username только при регистрации */}
                {!isLogin && (
                    <div>
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-bgMain border border-acc2 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-acc1 transition-colors"
                            required={!isLogin}
                        />
                    </div>
                )}
                <div>
                    <input
                        type="email"
                        placeholder="Your Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-bgMain border border-acc2 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-acc1 transition-colors"
                        required
                    />
                </div>
                <div>
                    <input
                        type="password"
                        placeholder="Password (min 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-bgMain border border-acc2 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-acc1 transition-colors"
                        required
                    />
                </div>

                {message && <p className="text-acc1 text-sm text-center">{message}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-acc1 hover:bg-acc3 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                    {loading ? 'Loading...' : (isLogin ? 'Log In' : 'Sign Up')}
                </button>
            </form>

            <div className="mt-6 text-center">
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                    {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
                </button>
            </div>
        </div>
    );
}