import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: number;
    className?: string;
}

const LoadingSpinner = ({ size = 24, className = '' }: LoadingSpinnerProps) => {
    return (
        <div className="flex items-center justify-center w-full h-full min-h-[200px]">
            <Loader2 size={ size } className={ `animate-spin text-primary-500 ${ className }` }/>
        </div>
    );
};

export default LoadingSpinner;