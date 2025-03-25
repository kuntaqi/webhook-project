import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { ThemeToggle } from './ThemeToggle';

export default function Auth() {
    const navigate = useNavigate();
    const [ email, setEmail ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ loading, setLoading ] = useState(false);
    const [ rememberMe, setRememberMe ] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);

            const { data } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (rememberMe && data.session) {
                await supabase.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                });
            }

            // Navigate first, then show success message
            navigate('/admin/dashboard', { replace: true });
            toast.success('Logged in successfully!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        try {
            setLoading(true);
            await supabase.auth.resetPasswordForEmail(email);

            toast.success('Password reset instructions sent to your email');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to send reset instructions');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-secondary transition-colors">
            <div className="absolute top-4 right-4">
                <ThemeToggle/>
            </div>
            <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="flex justify-center">
                        <Lock className="w-12 h-12 text-accent"/>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
                        Sign in to your account
                    </h2>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="py-8 px-4 shadow sm:rounded-lg sm:px-10 bg-white dark:bg-gray-900">
                        <form className="space-y-6" onSubmit={ handleLogin }>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-text-primary">
                                    Email address
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div
                                        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-text-secondary"/>
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={ email }
                                        onChange={ (e) => setEmail(e.target.value) }
                                        className="block w-full pl-10 sm:text-sm border-border rounded-md text-text-primary placeholder-text-secondary focus:ring-accent focus:border-accent p-2 bg-gray-100 dark:bg-gray-800"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                                    Password
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div
                                        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-text-secondary"/>
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        value={ password }
                                        onChange={ (e) => setPassword(e.target.value) }
                                        className="block w-full pl-10 sm:text-sm border-border rounded-md text-text-primary focus:ring-accent focus:border-accent p-2 bg-gray-100 dark:bg-gray-800"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        checked={ rememberMe }
                                        onChange={ (e) => setRememberMe(e.target.checked) }
                                        className="h-4 w-4 text-accent focus:ring-accent border-border rounded bg-card"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-text-primary">
                                        Remember me
                                    </label>
                                </div>

                                <div className="text-sm">
                                    <button
                                        type="button"
                                        onClick={ handleResetPassword }
                                        className="font-medium text-accent hover:text-accent-hover"
                                    >
                                        Forgot your password?
                                    </button>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={ loading }
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50"
                                >
                                    { loading ? 'Signing in...' : 'Sign in' }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}