import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('/api/dashboard/dashboard-stats')
            .then(res => setStats(res.data))
            .catch(err => console.error('Ошибка загрузки статистики', err));
    }, []);

    if (!stats) {
        return <div>Загрузка...</div>;
    }

    const cards = [
        { label: 'Клиенты', value: stats.clients, path: '/clients' },
        { label: 'Контракты', value: stats.contracts, path: '/contracts' },
        { label: 'Платежи', value: `$${stats.payments}`, path: '/payments' },
        { label: 'Активы', value: stats.assets, path: '/assets' }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, i) => (
                <div
                    key={i}
                    className="bg-white rounded-xl shadow p-5 border hover:shadow-md transition cursor-pointer"
                    onClick={() => navigate(card.path)}
                >
                    <h3 className="text-sm text-gray-500 mb-1">{card.label}</h3>
                    <p className="text-3xl font-semibold text-blue-600">{card.value}</p>
                </div>
            ))}
        </div>
    );
}