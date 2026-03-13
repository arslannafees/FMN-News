import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNews } from '@/context/NewsContextCore';


export function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useNews();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { success, role } = await login(username, password);
            if (success) {
                navigate(role === 'superadmin' ? '/superadmin' : '/admin');
            } else {
                setError('Incorrect username or password. Please try again.');
            }
        } catch {
            setError('An error occurred during login.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
                <div>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center text-sm text-gray-500 hover:text-[#e53935] transition-colors mb-6"
                    >
                        <ArrowLeft size={16} className="mr-1" />
                        Back to Home
                    </button>
                    <div className="mx-auto w-12 h-12 bg-[#e53935]/10 flex items-center justify-center rounded-xl mb-4">
                        <Lock className="text-[#e53935]" size={24} />
                    </div>
                    <h2 className="text-center font-display text-3xl font-bold text-gray-900 dark:text-zinc-100">
                        Admin Access
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-zinc-400">
                        Enter your credentials to access the dashboard
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-3">
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                className="w-full text-lg py-6 pl-9"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="w-full text-lg py-6 pl-9"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                            <AlertCircle size={16} className="shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-6 text-lg bg-[#e53935] hover:bg-[#c62828] text-white transition-colors"
                    >
                        {isLoading ? 'Verifying...' : 'Access Dashboard'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
