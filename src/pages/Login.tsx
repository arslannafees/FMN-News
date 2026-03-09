import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNews } from '@/context/NewsContextCore';

export function Login() {
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
            const success = await login(password);
            if (success) {
                navigate('/admin');
            } else {
                setError('Incorrect password. Please try again.');
            }
        } catch {
            setError('An error occurred during login.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
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
                    <h2 className="text-center font-display text-3xl font-bold text-gray-900">
                        Admin Access
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Please enter the admin password to continue
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="w-full text-lg py-6"
                                placeholder="Enter password"
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
