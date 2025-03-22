import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { Settings, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { ThemeToggle } from './ThemeToggle';

export default function Profile() {
    const navigate = useNavigate();
    const [ newEmail, setNewEmail ] = useState('');
    const [ , setCurrentPassword ] = useState('');
    const [ newPassword, setNewPassword ] = useState('');
    const [ confirmPassword, setConfirmPassword ] = useState('');
    const [ loading, setLoading ] = useState(false);

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);

            const { error } = await supabase.auth.updateUser({
                email: newEmail
            });

            if (error) throw error;

            toast.success('Email update request sent. Please check your new email for confirmation.');
            setNewEmail('');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update email');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        try {
            setLoading(true);

            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            toast.success('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-secondary transition-colors py-12">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Settings className="w-8 h-8 text-accent"/>
                        <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Profile Settings</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle/>
                        <button
                            onClick={ () => navigate('/admin/dashboard') }
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-primary bg-card border border-border rounded-md hover:bg-secondary transition-colors"
                        >
                            <ArrowLeft size={ 16 }/>
                            <span className="hidden sm:inline">Back to Dashboard</span>
                        </button>
                    </div>
                </div>

                <div className="bg-card shadow rounded-lg divide-y divide-border">
                    {/* Update Email Section */ }
                    <div className="p-6">
                        <h2 className="text-xl font-semibold text-text-primary mb-4">Update Email</h2>
                        <form onSubmit={ handleUpdateEmail } className="space-y-4">
                            <div>
                                <label htmlFor="new-email" className="block text-sm font-medium text-text-primary">
                                    New Email Address
                                </label>
                                <input
                                    type="email"
                                    id="new-email"
                                    value={ newEmail }
                                    onChange={ (e) => setNewEmail(e.target.value) }
                                    className="mt-1 block w-full rounded-md border-border bg-card text-text-primary shadow-sm focus:border-accent focus:ring-accent"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={ loading }
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 transition-colors"
                            >
                                { loading ? 'Updating...' : 'Update Email' }
                            </button>
                        </form>
                    </div>

                    {/* Update Password Section */ }
                    <div className="p-6">
                        <h2 className="text-xl font-semibold text-text-primary mb-4">Update Password</h2>
                        <form onSubmit={ handleUpdatePassword } className="space-y-4">
                            <div>
                                <label htmlFor="new-password" className="block text-sm font-medium text-text-primary">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    id="new-password"
                                    value={ newPassword }
                                    onChange={ (e) => setNewPassword(e.target.value) }
                                    className="mt-1 block w-full rounded-md border-border bg-card text-text-primary shadow-sm focus:border-accent focus:ring-accent"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="confirm-password"
                                       className="block text-sm font-medium text-text-primary">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    id="confirm-password"
                                    value={ confirmPassword }
                                    onChange={ (e) => setConfirmPassword(e.target.value) }
                                    className="mt-1 block w-full rounded-md border-border bg-card text-text-primary shadow-sm focus:border-accent focus:ring-accent"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={ loading }
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 transition-colors"
                            >
                                { loading ? 'Updating...' : 'Update Password' }
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}