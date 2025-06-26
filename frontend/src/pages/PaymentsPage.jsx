import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

export default function PaymentsPage() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [newPayment, setNewPayment] = useState({
    clientId: '',
    contractId: '',
    amount: '',
    date: '',
    receipt: null,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPayments();
    loadClients();
    loadContracts();
  }, []);

  const archiveReceipt = async (paymentId) => {
    try {
      await axios.post(`/api/payments/${paymentId}/archive`);
      loadPayments(); // перезагрузка данных
    } catch (error) {
      console.error('Ошибка при архивировании квитанции:', error);
    }
  };

  const loadPayments = async () => {
    try {
      const response = await axios.get('/api/payments');
      console.log('Payments loaded:', response.data); // Debugging line
      if (Array.isArray(response.data)) {
        setPayments(response.data);
      } else {
        console.error('Некорректный формат данных:', response.data);
        setPayments([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки платежей:', error);
    }
  };

  const loadClients = async () => {
    try {
      const response = await axios.get('/api/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Ошибка загрузки клиентов:', error);
    }
  };

  const loadContracts = async () => {
    try {
      const response = await axios.get('/api/contracts');
      setContracts(response.data);
    } catch (error) {
      console.error('Ошибка загрузки контрактов:', error);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (newPayment.id) {
      await axios.put(`/api/payments/${newPayment.id}`, {
        clientId: newPayment.clientId,
        contractId: newPayment.contractId,
        amount: parseFloat(newPayment.amount),
        date: newPayment.date,
      });
      setNewPayment({
        clientId: '',
        contractId: '',
        amount: '',
        date: '',
        receipt: null,
      });
      setIsModalOpen(false);
      loadPayments();
      return;
    }
    try {
      // Pre-check notify modal
      await axios.post(`/api/payments/${newPayment.contractId}/pre-check`, {
        clientId: newPayment.clientId,
        amount: parseFloat(newPayment.amount),
        date: newPayment.date,
      });
      const formData = new FormData();
      formData.append('clientId', newPayment.clientId);
      formData.append('contractId', newPayment.contractId);
      formData.append('amount', newPayment.amount);
      formData.append('date', newPayment.date);
      if (newPayment.receipt) {
        formData.append('receipt', newPayment.receipt);
      }
      await axios.post('/api/payments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await axios.post(`/api/contracts/${newPayment.contractId}/apply-payment`, {
        amount: parseFloat(newPayment.amount),
      });
      await axios.post(`/api/contracts/${newPayment.contractId}/calculate-penalty`, {
        dueDate: "2025-06-20",
        paymentDate: newPayment.date,
      });
      // Notify backend before closing modal
      await axios.post(`/api/payments/${newPayment.contractId}/notify`, {
        clientId: newPayment.clientId,
        amount: parseFloat(newPayment.amount),
        date: newPayment.date,
      });
      setNewPayment({
        clientId: '',
        contractId: '',
        amount: '',
        date: '',
        receipt: null,
      });
      setIsModalOpen(false);
      loadPayments();
    } catch (error) {
      console.error('Ошибка добавления платежа:', error);
    }
  };

  const handleEditPayment = (payment) => {
    console.log('Edit payment', payment);
    setNewPayment({
      id: payment.id,
      clientId: payment.clientId,
      contractId: payment.contractId,
      amount: payment.amount,
      date: payment.date,
      receipt: null,
    });
    setIsModalOpen(true);
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm(t('confirmDeletePayment'))) return;
    try {
      await axios.delete(`/api/payments/${paymentId}`);
      loadPayments();
    } catch (error) {
      console.error('Ошибка при удалении платежа:', error);
    }
  };

  return (
      <div className="p-4">
        <h2 className="text-2xl font-semibold mb-4">{t('payments')}</h2>
        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border px-3 py-2 rounded w-1/3"
          />
          <button
              type="button"
              onClick={() => {
                setNewPayment({
                  clientId: '',
                  contractId: '',
                  amount: '',
                  date: '',
                  receipt: null,
                });
                setIsModalOpen(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {t('addPayment')}
          </button>
        </div>
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
                <h3 className="text-xl font-semibold mb-4">{t('newPayment')}</h3>
                <form
                    onSubmit={handleAddPayment}
                    encType="multipart/form-data"
                    className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-1">{t('client')}</label>
                      <select
                          value={newPayment.clientId}
                          onChange={(e) => setNewPayment({...newPayment, clientId: e.target.value})}
                          className="border px-3 py-2 w-full"
                          required
                      >
                        <option value="">{t('client')}</option>
                        {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.name}
                            </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium mb-1">{t('contract')}</label>
                      <select
                          value={newPayment.contractId}
                          onChange={(e) => setNewPayment({...newPayment, contractId: e.target.value})}
                          className="border px-3 py-2 w-full"
                          required
                      >
                        <option value="">{t('contract')}</option>
                        {contracts.map((contract) => (
                            <option key={contract.id} value={contract.id}>
                              {contract.number}
                            </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium mb-1">{t('amount')}</label>
                      <input
                          type="number"
                          step="0.01"
                          value={newPayment.amount}
                          onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                          className="border px-3 py-2 w-full"
                          required
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">{t('date')}</label>
                      <input
                          type="date"
                          value={newPayment.date}
                          onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
                          className="border px-3 py-2 w-full"
                          required
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">{t('receipt')}</label>
                      <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => setNewPayment({...newPayment, receipt: e.target.files[0]})}
                          className="border px-3 py-2 w-full"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <button
                        type="submit"
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      {t('save')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
          <tr>
            <th className="border px-4 py-2">{t('client')}</th>
            <th className="border px-4 py-2">{t('contract')}</th>
            <th className="border px-4 py-2">{t('date')}</th>
            <th className="border px-4 py-2">{t('amount')}</th>
            <th className="border px-4 py-2">{t('receipt')}</th>
            {/* Removed Archive column header */}
            <th className="border px-4 py-2">{t('actions')}</th>
          </tr>
          </thead>
          <tbody>
          {payments
            .filter(
              (payment) =>
                payment.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                payment.contractNumber.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((payment) => (
              <tr key={payment.id}>
                <td className="border px-4 py-2">{payment.clientName}</td>
                <td className="border px-4 py-2">{payment.contractNumber}</td>
                <td className="border px-4 py-2">{payment.date}</td>
                <td className="border px-4 py-2">${payment.amount.toFixed(2)}</td>
                <td className="border px-4 py-2">
                  {payment.receiptUrl ? (
                      <a
                          href={payment.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                      >
                        {t('open')}
                      </a>
                  ) : (
                      '—'
                  )}
                </td>
                {/* Removed Archive button cell */}
                <td className="border px-4 py-2 space-x-2">
                  <button className="text-blue-600 hover:underline" onClick={() => handleEditPayment(payment)}>
                    ✏️
                  </button>
                  <button className="text-red-600 hover:underline" onClick={() => handleDeletePayment(payment.id)}>
                    🗑️
                  </button>
                  <button className="text-yellow-600 hover:underline" onClick={() => archiveReceipt(payment.id)}>
                    📦
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );
}