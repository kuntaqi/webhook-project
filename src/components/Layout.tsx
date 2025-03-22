import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

const Layout = () => {
    const location = useLocation();

    // Scroll to top on route change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [ location.pathname ]);

    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
                <Outlet/>
            </main>
        </div>
    );
};

export default Layout;