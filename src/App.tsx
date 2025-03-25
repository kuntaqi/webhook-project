import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useTheme } from './hooks/useTheme';
import { Suspense } from "react";
import LoadingSpinner from "./components/LoadingSpinner.tsx";
import Layout from "./components/Layout.tsx";
import Auth from "./components/Auth.tsx";
import PrivateRoute from "./components/PrivateRoute.tsx";
import Dashboard from "./components/Dashboard.tsx";
import Profile from "./components/Profile.tsx";
import NotFoundPage from "./components/NotFoundPage.tsx";

function App() {
    useTheme(); // Initialize theme

    return (
        <Suspense fallback={ <LoadingSpinner/> }>
            <Routes>
                <Route path="/" element={ <Layout/> }>
                    <Route index element={ <Auth/> }/>

                    <Route path="/admin" element={ <PrivateRoute/> }>
                        <Route path="dashboard" element={ <Dashboard/> }/>
                        <Route path="profile" element={ <Profile/> }/>
                    </Route>
                </Route>
                <Route path="*" element={ <NotFoundPage/> }/>
            </Routes>

            <Toaster
                position="bottom-right"
                toastOptions={ {
                    style: {
                        background: 'var(--card-bg)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                    },
                } }
            />
        </Suspense>
    );
}

export default App;