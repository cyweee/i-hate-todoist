export default function HomePage({ onNavigateToAuth }) {
    return (
        <div className="w-full max-w-2xl text-center p-12 bg-bgSec rounded-2xl border border-acc2 shadow-xl">
            <h1 className="text-4xl font-bold text-white mb-6">
                Todo & Activity Tracker
            </h1>
            <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                Your personal productivity hub.
                Manage projects, track daily progress,
                level up, and build discipline all in one place.
            </p>

            <div className="flex justify-center gap-4">
                <button
                    onClick={() => onNavigateToAuth()}
                    className="px-8 py-3 bg-acc1 hover:bg-acc3 text-white rounded-lg transition-all font-semibold shadow-lg shadow-acc1/20"
                >
                    Get Started
                </button>
            </div>

            <div className="mt-12 flex justify-center gap-8 text-sm text-gray-500">
                <span>✓ Projects</span>
                <span>✓ XP System</span>
                <span>✓ Daily Streak</span>
            </div>
        </div>
    );
}