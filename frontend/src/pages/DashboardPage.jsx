import React from 'react';
export default function DashboardPage() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
                { label: 'Клиенты', value: 128 },
                { label: 'Контракты', value: 64 },
                { label: 'Платежи', value: '$42,000' },
                { label: 'Активы', value: 23 }
            ].map((card, i) => (
                <div key={i} className="bg-white rounded-xl shadow p-5 border hover:shadow-md transition">
                    <h3 className="text-sm text-gray-500 mb-1">{card.label}</h3>
                    <p className="text-3xl font-semibold text-blue-600">{card.value}</p>
                </div>
            ))}
        </div>
    );
}