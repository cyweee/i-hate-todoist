import React from 'react';

export default function AboutPage({ onBack }) {
    return (
        <div className="w-full max-w-4xl mt-8 mb-12 animate-fade-in">
            {/* Navigace */}
            <button
                onClick={onBack}
                className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-mono text-sm"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                [cd ..] Zpět na hlavní stránku
            </button>

            {/* Kontejner dokumentace */}
            <div className="bg-bgSec p-8 md:p-12 rounded-xl border border-acc2 shadow-2xl font-mono text-gray-300 leading-relaxed">

                <div className="border-b border-acc2 pb-6 mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                        <span className="text-acc1">~/</span>Project_Documentation
                    </h1>
                    <p className="text-gray-500 text-sm">v1.0.0 | Gamifikovaný systém pro správu úkolů</p>
                </div>

                <div className="space-y-10 text-sm md:text-base">

                    {/* Sekce 1: O projektu */}
                    <section>
                        <h2 className="text-xl font-bold text-acc1 mb-4 flex items-center gap-2">
                            <span className="text-gray-500">01.</span> Přehled projektu
                        </h2>
                        <p className="mb-4">
                            Tento projekt je moderní, gamifikovaná webová aplikace pro správu úkolů, navržená ke zvýšení produktivity pomocí okamžité vizuální zpětné vazby.
                            Uživatelé mohou spravovat úkoly, třídit je do projektů a budovat svou aktivitu ve stylu „commit-history“ (podobně jako na GitHubu).
                        </p>
                    </section>

                    {/* Sekce 2: Hlavní funkce */}
                    <section>
                        <h2 className="text-xl font-bold text-[#52b788] mb-4 flex items-center gap-2">
                            <span className="text-gray-500">02.</span> Hlavní funkce
                        </h2>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <li className="bg-bgMain p-4 rounded border border-acc2">
                                <strong className="text-white block mb-1">🎮 Gamifikační jádro</strong>
                                Získávejte XP a zvyšujte svou úroveň plněním úkolů. Různé priority přinášejí různé množství XP.
                            </li>
                            <li className="bg-bgMain p-4 rounded border border-acc2">
                                <strong className="text-white block mb-1">📈 Tracker aktivity</strong>
                                Mřížka aktivity (365 dní), která vizualizuje denní produktivitu vzhledem k nastavitelnému dennímu cíli.
                            </li>
                            <li className="bg-bgMain p-4 rounded border border-acc2">
                                <strong className="text-white block mb-1">⚡ Optimistické UI</strong>
                                Okamžité aktualizace rozhraní před potvrzením serverem, s automatickým návratem (rollback) při výpadku sítě.
                            </li>
                            <li className="bg-bgMain p-4 rounded border border-acc2">
                                <strong className="text-white block mb-1">🛡️ Správa termínů</strong>
                                Striktní ověřování termínů s automatickým vizuálním zvýrazněním zmeškaných (overdue) úkolů.
                            </li>
                        </ul>
                    </section>

                    {/* Sekce 3: Technologie */}
                    <section>
                        <h2 className="text-xl font-bold text-[#d18b47] mb-4 flex items-center gap-2">
                            <span className="text-gray-500">03.</span> Použité technologie a architektura
                        </h2>
                        <div className="bg-bgMain p-6 rounded border border-acc2 overflow-x-auto">
                            <code className="text-sm">
                                <span className="text-acc1">Frontend:</span> React.js (Hooks, Context, Optimistic State)<br/>
                                <span className="text-acc1">Styling:</span> Tailwind CSS (Custom Design System)<br/>
                                <span className="text-acc1">Backend:</span> Supabase (PostgreSQL, Row Level Security)<br/>
                                <span className="text-acc1">Autentizace:</span> Supabase Auth<br/>
                                <br/>
                                <span className="text-gray-500">// Pozoruhodná technická řešení:</span><br/>
                                - Implementace <span className="text-[#52b788]">Promise.all()</span> pro paralelní načítání dat.<br/>
                                - Prevence „race condition“ chyb pomocí zamykacích mechanismů se strukturou <span className="text-[#52b788]">Set()</span>.<br/>
                                - Vlastní SQL Views pro agresivní optimalizaci výkonu databáze.<br/>
                            </code>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}