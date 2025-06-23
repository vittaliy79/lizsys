// src/pages/ContractsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ContractsPage() {
    const [contracts, setContracts] = useState([]);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({
        title: '',
        number: '',
        amount: '',
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        fetchContracts();
    }, []);

    async function fetchContracts() {
        try {
            const res = await axios.get('/api/contracts');
            setContracts(res.data);
        } catch (error) {
            console.error('Failed to fetch contracts', error);
        }
    }

    function filteredContracts() {
        if (!search) return contracts;
        return contracts.filter(
            c =>
                c.title.toLowerCase().includes(search.toLowerCase()) ||
                c.number.toLowerCase().includes(search.toLowerCase())
        );
    }

    function handleChange(e) {
        setForm(prev => ({...prev, [e.target.name]: e.target.value}));
    }

    async function addContract(e) {
        e.preventDefault();
        try {
            await axios.post('/api/contracts', form);
            setModalOpen(false);
            setForm({
                title: '',
                number: '',
                amount: '',
                startDate: '',
                endDate: '',
            });
            fetchContracts();
        } catch (error) {
            console.error('Failed to add contract', error);
            alert('Ошибка при добавлении контракта');
        }
    }

    return (
        <div className="p-4">
            <div className="flex justify-between mb-4">
                <input
                    type="text"
                    placeholder="Поиск по названию или номеру"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="border px-2 py-1 rounded w-64"
                />
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Добавить контракт
                </button>
            </div>
            <table className="w-full border-collapse border border-gray-300">
                <thead>
                <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2">ID</th>
                    <th className="border border-gray-300 p-2">Название</th>
                    <th className="border border-gray-300 p-2">Номер</th>
                    <th className="border border-gray-300 p-2">Сумма</th>
                    <th className="border border-gray-300 p-2">Дата начала</th>
                    <th className="border border-gray-300 p-2">Дата окончания</th>
                    <th className="border border-gray-300 p-2">Действия</th>
                </tr>
                </thead>
                <tbody>
                {filteredContracts().map(contract => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2">{contract.id}</td>
                        <td className="border border-gray-300 p-2">{contract.title}</td>
                        <td className="border border-gray-300 p-2">{contract.number}</td>
                        <td className="border border-gray-300 p-2">{contract.amount}</td>
                        <td className="border border-gray-300 p-2">{contract.startDate}</td>
                        <td className="border border-gray-300 p-2">{contract.endDate}</td>
                        <td className="border border-gray-300 p-2 text-right space-x-2">
                            <button className="text-blue-600 hover:underline text-sm">✏️</button>
                            <button className="text-red-600 hover:underline text-sm">🗑️</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-96">
                        <h2 className="text-xl mb-4">Добавить контракт</h2>
                        <form onSubmit={addContract} className="space-y-3">
                            <div>
                                <label className="block mb-1">Название</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    required
                                    className="w-full border px-2 py-1 rounded"
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Номер</label>
                                <input
                                    type="text"
                                    name="number"
                                    value={form.number}
                                    onChange={handleChange}
                                    required
                                    className="w-full border px-2 py-1 rounded"
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Сумма</label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={form.amount}
                                    onChange={handleChange}
                                    required
                                    className="w-full border px-2 py-1 rounded"
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Дата начала</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={form.startDate}
                                    onChange={handleChange}
                                    required
                                    className="w-full border px-2 py-1 rounded"
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Дата окончания</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={form.endDate}
                                    onChange={handleChange}
                                    required
                                    className="w-full border px-2 py-1 rounded"
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 border rounded"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-4 py-2 rounded"
                                >
                                    Добавить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}