// src/pages/ContractsPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

export default function ContractsPage() {
    const [contracts, setContracts] = useState([]);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [clients, setClients] = useState([]);
    const [form, setForm] = useState({
        title: '',
        number: '',
        amount: '',
        startDate: '',
        endDate: '',
        type: '',
        downPayment: '',
        interestRate: '',
        termMonths: '',
        clientId: '',
    });
    const [extendModal, setExtendModal] = useState({ open: false, contract: null });
    const [transferModal, setTransferModal] = useState({ open: false, contract: null });

    const [editingContract, setEditingContract] = useState(null);
    const isEditing = Boolean(editingContract);

    const [sortBy, setSortBy] = useState('id');
    const [sortAsc, setSortAsc] = useState(false);

    useEffect(() => {
        fetchContracts();
        fetchClients();
    }, []);

    const fetchClients = useCallback(async () => {
        try {
            const res = await axios.get('/api/clients');
            setClients(res.data || []);
        } catch (err) {
            console.error('Ошибка при загрузке клиентов', err);
        }
    }, []);

    async function fetchContracts() {
        try {
            const res = await axios.get('/api/contracts');
            console.log('Contracts response:', res.data); // <-- добавлено
            if (Array.isArray(res.data)) {
                setContracts(res.data);
            } else {
                console.error('Ожидался массив контрактов, но получен:', res.data);
                setContracts([]); // безопасное значение по умолчанию
            }
        } catch (error) {
            console.error('Failed to fetch contracts', error);
            setContracts([]);
        }
    }

    function filteredContracts() {
        if (!Array.isArray(contracts)) return [];
        let result = [...contracts];

        if (search) {
            result = result.filter(
                c =>
                    c.title?.toLowerCase().includes(search.toLowerCase()) ||
                    c.number?.toLowerCase().includes(search.toLowerCase())
            );
        }

        result.sort((a, b) => {
            if (a[sortBy] < b[sortBy]) return sortAsc ? -1 : 1;
            if (a[sortBy] > b[sortBy]) return sortAsc ? 1 : -1;
            return 0;
        });

        return result;
    }

    function handleChange(e) {
        setForm(prev => ({...prev, [e.target.name]: e.target.value}));
    }

    function validateForm() {
        if (!form.title.trim()) return 'Название обязательно';
        if (!form.number.trim()) return 'Номер обязателен';
        if (!form.amount || isNaN(form.amount)) return 'Сумма должна быть числом';
        if (!form.startDate || !form.endDate) return 'Даты обязательны';
        if (new Date(form.endDate) < new Date(form.startDate)) return 'Дата окончания не может быть раньше даты начала';
        if (!form.downPayment || isNaN(form.downPayment)) return 'Первоначальный взнос должен быть числом';
        if (!form.interestRate || isNaN(form.interestRate)) return 'Процентная ставка должна быть числом';
        if (!form.termMonths || isNaN(form.termMonths)) return 'Срок должен быть числом';
        if (!form.clientId) return 'Выберите клиента';
        return null;
    }

    async function submitContract(e) {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            alert(`Ошибка: ${validationError}`);
            return;
        }

        try {
            const principal = parseFloat(form.amount) - parseFloat(form.downPayment);
            const monthlyRate = parseFloat(form.interestRate) / 100 / 12;
            const months = parseInt(form.termMonths);
            const monthlyPayment = monthlyRate === 0
                ? principal / months
                : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

            const formData = { ...form, monthlyPayment: monthlyPayment.toFixed(2) };

            if (isEditing) {
                await axios.put(`/api/contracts/${editingContract.id}`, formData);
            } else {
                await axios.post('/api/contracts', formData);
            }
            setModalOpen(false);
            setEditingContract(null);
            setForm({
                title: '',
                number: '',
                amount: '',
                startDate: '',
                endDate: '',
                type: '',
                downPayment: '',
                interestRate: '',
                termMonths: '',
                clientId: '',
            });
            fetchContracts();
        } catch (error) {
            console.error('Failed to save contract', error);
            alert('Ошибка при сохранении контракта');
        }
    }

    async function handleDeleteContract(id) {
        if (!confirm('Удалить контракт?')) return;
        try {
            await axios.delete(`/api/contracts/${id}`);
            fetchContracts();
        } catch (error) {
            console.error('Failed to delete contract', error);
            alert('Ошибка при удалении контракта');
        }
    }


    function openExtendForm(contract) {
        setExtendModal({ open: true, contract });
    }

    function openTransferModal(contract) {
        setTransferModal({ open: true, contract });
    }

    async function handleTransferOwnership(id, newClientId) {
        try {
            await axios.post(`/api/contracts/${id}/transfer-ownership`, { newClientId });
            fetchContracts();
            alert('Права переданы.');
        } catch (error) {
            console.error('Ошибка при передаче прав собственности', error);
            alert('Не удалось передать права');
        }
    }

    function openEditModal(contract) {
        setEditingContract(contract);
        setForm({
            title: contract.title,
            number: contract.number,
            amount: contract.amount,
            startDate: contract.startDate,
            endDate: contract.endDate,
            type: contract.type || '',
            downPayment: contract.downPayment || '',
            interestRate: contract.interestRate || '',
            termMonths: contract.termMonths || '',
            monthlyPayment: contract.monthlyPayment || '',
            clientId: contract.clientId || '',
        });
        setModalOpen(true);
    }

    function handleSort(column) {
        if (sortBy === column) {
            setSortAsc(!sortAsc);
        } else {
            setSortBy(column);
            setSortAsc(true);
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
                <div className="flex items-center">
                    <button
                        onClick={() => setModalOpen(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded flex items-center"
                    >
                        <span className="mr-1">＋</span> Добавить контракт
                    </button>
                    <button
                        onClick={() => alert('Функциональность загрузки документов пока не реализована')}
                        className="bg-blue-600 text-white px-4 py-2 rounded ml-2"
                    >
                        📎 Документы
                    </button>
                </div>
            </div>
            <table className="w-full border-collapse border border-gray-300">
                <thead>
                <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 cursor-pointer" onClick={() => handleSort('id')}>ID</th>
                    <th className="border border-gray-300 p-2 cursor-pointer" onClick={() => handleSort('title')}>Название</th>
                    <th className="border border-gray-300 p-2 cursor-pointer" onClick={() => handleSort('number')}>Номер</th>
                    <th className="border border-gray-300 p-2 cursor-pointer" onClick={() => handleSort('amount')}>Сумма</th>
                    <th className="border border-gray-300 p-2 cursor-pointer" onClick={() => handleSort('startDate')}>Дата начала</th>
                    <th className="border border-gray-300 p-2 cursor-pointer" onClick={() => handleSort('endDate')}>Дата окончания</th>
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
                            <button
                                onClick={() => openEditModal(contract)}
                                className="text-blue-600 hover:underline text-sm"
                            >
                                ✏️
                            </button>
                            <button
                                onClick={() => handleDeleteContract(contract.id)}
                                className="text-red-600 hover:underline text-sm"
                            >
                                🗑️
                            </button>
                            <button
                                onClick={() => alert('Архивирование документов пока не реализовано')}
                                className="text-gray-600 hover:underline text-sm"
                            >
                                🗄️
                            </button>
                            <button
                                onClick={() => openExtendForm(contract)}
                                className="text-yellow-600 hover:underline text-sm"
                            >
                                ⏳
                            </button>
                            <button
                                onClick={() => openTransferModal(contract)}
                                className="text-green-600 hover:underline text-sm"
                            >
                                ✅
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {modalOpen && (
                <ContractModalTabs
                    isEditing={isEditing}
                    setModalOpen={setModalOpen}
                    setEditingContract={setEditingContract}
                    form={form}
                    setForm={setForm}
                    clients={clients}
                    handleChange={handleChange}
                    submitContract={submitContract}
                />
            )}
        {/* Модальное окно продления контракта */}
        {extendModal.open && (
            <ExtendModalTabs
                extendModal={extendModal}
                setExtendModal={setExtendModal}
                fetchContracts={fetchContracts}
            />
        )}
        {transferModal.open && (
            <TransferModal
                contract={transferModal.contract}
                clients={clients}
                onClose={() => setTransferModal({ open: false, contract: null })}
                onTransfer={handleTransferOwnership}
            />
        )}
    </div>
    );
}
// --- ContractModalTabs компонент ---
function ContractModalTabs({
    isEditing,
    setModalOpen,
    setEditingContract,
    form,
    setForm,
    clients,
    handleChange,
    submitContract,
}) {
    const [tab, setTab] = React.useState('main');
    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-96">
                <h2 className="text-xl mb-4">
                    {isEditing ? 'Редактировать контракт' : 'Добавить контракт'}
                </h2>
                <nav className="flex mb-3 space-x-2">
                    <button
                        className={`px-3 py-1 rounded-t ${tab === 'main' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        type="button"
                        onClick={() => setTab('main')}
                    >
                        Основные
                    </button>
                    <button
                        className={`px-3 py-1 rounded-t ${tab === 'terms' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        type="button"
                        onClick={() => setTab('terms')}
                    >
                        Условия
                    </button>
                </nav>
                <form onSubmit={submitContract} className="space-y-3">
                    {tab === 'main' ? (
                        <fieldset className="border border-gray-300 rounded p-3 mb-2">
                            <legend className="text-sm font-semibold px-2">Основные данные</legend>
                            <div>
                                <label className="block mb-1">Клиент</label>
                                <select
                                    name="clientId"
                                    value={form.clientId}
                                    onChange={handleChange}
                                    required
                                    className="w-full border px-2 py-1 rounded"
                                >
                                    <option value="">Выберите клиента</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
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
                                <label className="block mb-1">Тип договора</label>
                                <select
                                    name="type"
                                    value={form.type}
                                    onChange={handleChange}
                                    required
                                    className="w-full border px-2 py-1 rounded"
                                >
                                    <option value="">Выберите тип</option>
                                    <option value="vehicle">Автомобиль</option>
                                    <option value="equipment">Оборудование</option>
                                </select>
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
                        </fieldset>
                    ) : (
                        <fieldset className="border border-gray-300 rounded p-3">
                            <legend className="text-sm font-semibold px-2">Условия договора</legend>
                            <div>
                                <label className="block mb-1">Первоначальный взнос</label>
                                <input
                                    type="number"
                                    name="downPayment"
                                    value={form.downPayment}
                                    onChange={handleChange}
                                    required
                                    className="w-full border px-2 py-1 rounded"
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Процентная ставка (%)</label>
                                <input
                                    type="number"
                                    name="interestRate"
                                    value={form.interestRate}
                                    onChange={handleChange}
                                    required
                                    className="w-full border px-2 py-1 rounded"
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Срок (в месяцах)</label>
                                <input
                                    type="number"
                                    name="termMonths"
                                    value={form.termMonths}
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
                            <div>
                                <label className="block mb-1">Документы</label>
                                <input
                                    type="file"
                                    multiple
                                    className="w-full border px-2 py-1 rounded"
                                    disabled
                                />
                                <p className="text-sm text-gray-500 mt-1">Загрузка документов будет доступна после сохранения контракта</p>
                            </div>
                        </fieldset>
                    )}
                    <div className="flex justify-between items-center space-x-2 mt-2">
                        <div>
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded"
                            >
                                {isEditing ? 'Обновить' : 'Сохранить'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setModalOpen(false);
                                    setEditingContract(null);
                                }}
                                className="ml-2 px-4 py-2 border rounded"
                            >
                                Отменить
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- ExtendModalTabs компонент ---
function ExtendModalTabs({ extendModal, setExtendModal, fetchContracts }) {
    const [tab, setTab] = React.useState('extend');
    const [calculatedDate, setCalculatedDate] = React.useState('');
    const [months, setMonths] = React.useState('12');
    // Обнулять calculatedDate при открытии модалки
    React.useEffect(() => {
        if (extendModal.open) {
            setCalculatedDate('');
            setMonths('12');
        }
    }, [extendModal.open]);

    // Обработчик изменения месяцев
    const handleMonthsChange = (e) => {
        const val = e.target.value;
        setMonths(val);
        const monthsNum = parseInt(val);
        if (!isNaN(monthsNum) && monthsNum > 0 && extendModal.contract?.endDate) {
            const newDate = new Date(extendModal.contract.endDate);
            newDate.setMonth(newDate.getMonth() + monthsNum);
            setCalculatedDate(newDate.toISOString().split('T')[0]);
        } else {
            setCalculatedDate('');
        }
    };

    // Сабмит формы
    const handleSubmit = (e) => {
        e.preventDefault();
        const monthsNum = parseInt(months);
        if (isNaN(monthsNum) || monthsNum <= 0) {
            alert('Некорректное значение');
            return;
        }
        const contract = extendModal.contract;
        const newEndDate = new Date(contract.endDate);
        newEndDate.setMonth(newEndDate.getMonth() + monthsNum);
        const formattedDate = newEndDate.toISOString().split('T')[0];
        axios
            .post(`/api/contracts/${contract.id}/extend`, { newEndDate: formattedDate })
            .then(() => {
                fetchContracts();
                setExtendModal({ open: false, contract: null });
            })
            .catch((err) => {
                console.error('Ошибка при продлении контракта', err);
                alert('Не удалось продлить контракт');
            });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-96">
                <h2 className="text-xl mb-4">Продление контракта</h2>
                <nav className="flex mb-3 space-x-2">
                    <button
                        className={`px-3 py-1 rounded-t ${tab === 'extend' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        type="button"
                        onClick={() => setTab('extend')}
                    >
                        Продление
                    </button>
                    <button
                        className={`px-3 py-1 rounded-t ${tab === 'confirm' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        type="button"
                        onClick={() => setTab('confirm')}
                    >
                        Подтверждение
                    </button>
                </nav>
                <form onSubmit={handleSubmit} className="space-y-3">
                    {tab === 'extend' ? (
                        <>
                            <div>
                                <label className="block mb-1">На сколько месяцев продлить?</label>
                                <input
                                    type="number"
                                    name="months"
                                    value={months}
                                    className="w-full border px-2 py-1 rounded"
                                    required
                                    onChange={handleMonthsChange}
                                    min={1}
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Новая дата окончания</label>
                                <input
                                    type="text"
                                    value={calculatedDate}
                                    readOnly
                                    className="w-full border px-2 py-1 rounded bg-gray-100"
                                />
                            </div>
                        </>
                    ) : (
                        <div>
                            <p className="mb-2">Проверьте информацию о продлении:</p>
                            <div className="mb-2">
                                <span className="font-semibold">Продлить на:</span> {months} мес.
                            </div>
                            <div>
                                <span className="font-semibold">Новая дата окончания:</span> {calculatedDate || '-'}
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={() => setExtendModal({ open: false, contract: null })}
                            className="px-4 py-2 border rounded"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded"
                            disabled={tab === 'extend'}
                        >
                            Продлить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
// --- TransferModal компонент ---
function TransferModal({ contract, clients, onClose, onTransfer }) {
    const [newClientId, setNewClientId] = React.useState('');
    const [tab, setTab] = React.useState('select');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newClientId === contract.clientId) {
            alert('Выберите другого клиента');
            return;
        }
        await onTransfer(contract.id, newClientId);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-96">
                <h2 className="text-xl mb-4">Передача прав собственности</h2>
                <nav className="flex mb-3 space-x-2">
                    <button
                        className={`px-3 py-1 rounded-t ${tab === 'select' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        type="button"
                        onClick={() => setTab('select')}
                    >
                        Выбор клиента
                    </button>
                    <button
                        className={`px-3 py-1 rounded-t ${tab === 'confirm' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        type="button"
                        onClick={() => setTab('confirm')}
                        disabled={!newClientId || newClientId === contract.clientId}
                    >
                        Подтверждение
                    </button>
                </nav>
                <form onSubmit={handleSubmit} className="space-y-3">
                    {tab === 'select' ? (
                        <div>
                            <label className="block mb-1">Новый клиент</label>
                            <select
                                className="w-full border px-2 py-1 rounded"
                                value={newClientId}
                                onChange={(e) => setNewClientId(e.target.value)}
                                required
                            >
                                <option value="">Выберите клиента</option>
                                {clients
                                    .filter((c) => c.id !== contract.clientId)
                                    .map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <p className="mb-2">Подтвердите передачу прав контракта ID {contract.id}</p>
                            <p>
                                Новый клиент: <strong>{clients.find(c => c.id === newClientId)?.name || ''}</strong>
                            </p>
                        </div>
                    )}
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded">
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded"
                            disabled={tab !== 'confirm' || !newClientId || newClientId === contract.clientId}
                        >
                            Передать
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}