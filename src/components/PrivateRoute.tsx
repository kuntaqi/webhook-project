import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from "./LoadingSpinner.tsx";

export default function PrivateRoute() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingSpinner/>;
    }

    return isAuthenticated ? <Outlet/> : <Navigate to="/" replace/>;
}