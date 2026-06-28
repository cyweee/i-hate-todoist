import { useEffect } from 'react';

export default function Toast({ message, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-5 right-5 bg-acc2 text-white px-6 py-3 rounded-lg border border-acc1 shadow-2xl animate-bounce">
            {message}
        </div>
    );
}