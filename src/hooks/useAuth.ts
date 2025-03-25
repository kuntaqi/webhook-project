import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { Session } from '@supabase/supabase-js';

export function useAuth() {
    const [ session, setSession ] = useState<Session | null>(null);
    const [ isLoading, setIsLoading ] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIsLoading(false);
            if (session && location.pathname === '/') {
                navigate('admin/dashboard', { replace: true });
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setIsLoading(false);
            if (session && location.pathname === '/') {
                navigate('admin/dashboard', { replace: true });
            }
        });

        return () => subscription.unsubscribe();
    }, [ navigate, location.pathname ]);

    const isAuthenticated = !!session;

    return { session, isAuthenticated, isLoading };
}