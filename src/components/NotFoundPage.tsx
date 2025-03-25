import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFoundPage = () => {
    return (
        <div className="min-h-screen pt-20 pb-16 flex items-center justify-center">
            <div className="container mx-auto px-4">
                <div className="max-w-lg mx-auto text-center">
                    <h1 className="text-9xl font-bold text-primary-500 dark:text-primary-400 mb-4">404</h1>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Page Not Found</h2>
                    <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
                        The page you are looking for doesn't exist or has been moved.
                    </p>
                    <Link to="/" className="btn-primary inline-flex items-center">
                        <Home size={ 18 } className="mr-2"/>
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;