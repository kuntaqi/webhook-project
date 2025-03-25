import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={ toggleTheme }
            className="p-2 rounded-md hover:bg-secondary transition-colors"
            aria-label="Toggle theme"
        >
            { theme === 'light' ? (
                <Moon className="w-5 h-5 text-text-primary"/>
            ) : (
                <Sun className="w-5 h-5 text-text-primary"/>
            ) }
        </button>
    );
}