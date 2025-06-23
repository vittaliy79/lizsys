import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', clientType: '', documentNumber: '', country: 'Азербайджан', city: '', district: '', street: '', houseNumber: '' });
  const [editingClientId, setEditingClientId] = useState(null);
  const [message, setMessage] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = () => {
    axios.get('/api/clients')
      .then(res => {
        let clientsData = [];
        if (Array.isArray(res.data)) {
          clientsData = res.data;
        } else if (Array.isArray(res.data.clients)) {
          clientsData = res.data.clients;
        } else {
          console.error("Неверный формат ответа от API");
          clientsData = [];
        }
        // Добавляем проверку наличия документов, если поле отсутствует, ставим false
        clientsData = clientsData.map(client => ({
          ...client,
          hasDocuments: client.hasDocuments || false,
        }));
        setClients(clientsData);
      })
      .catch(err => console.error('Ошибка запроса:', err));
  };

  const filtered = clients.filter(client =>
    client.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      setMessage('Пожалуйста, заполните все поля.');
      return;
    }

    const formData = { ...form };

    if (editingClientId) {
      axios.put(`/api/clients/${editingClientId}`, formData)
        .then(() => {
          fetchClients();
          resetForm();
          setMessage('Клиент обновлён.');
        })
        .catch(() => setMessage('Ошибка при обновлении клиента.'));
    } else {
      axios.post('/api/clients', formData)
        .then(res => {
          setClients(prev => [...prev, res.data]);
          resetForm();
          setMessage('Клиент добавлен.');
        })
        .catch(() => setMessage('Ошибка при добавлении клиента.'));
    }
  };

  const handleDelete = id => {
    if (!window.confirm('Удалить клиента?')) return;
    axios.delete(`/api/clients/${id}`)
      .then(() => {
        setClients(prev => prev.filter(c => c.id !== id));
        setMessage('Клиент удалён.');
      })
      .catch(() => setMessage('Ошибка при удалении клиента.'));
  };

  const handleEdit = client => {
    setForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      clientType: client.clientType || '',
      documentNumber: client.documentNumber || '',
      country: client.country || 'Азербайджан',
      city: client.city || '',
      district: client.district || '',
      street: client.street || '',
      houseNumber: client.houseNumber || ''
    });
    setEditingClientId(client.id);
    setShowForm(true);
  };

  const handleShowDocuments = async (clientId) => {
    console.log('Загрузка документов для клиента:', clientId);
    try {
      const res = await axios.get(`/api/clients/${clientId}/documents`);
      setDocuments(res.data || []);
      setSelectedClientId(clientId);
      setShowDocumentsModal(true);
    } catch (error) {
      console.error('Ошибка загрузки документов:', error);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      clientType: '',
      documentNumber: '',
      country: 'Азербайджан',
      city: '',
      district: '',
      street: '',
      houseNumber: ''
    });
    setEditingClientId(null);
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Поиск клиента..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border p-2 rounded w-1/3"
        />
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          + Добавить
        </button>
      </div>

      {message && <div className="mb-4 text-sm text-blue-600">{message}</div>}

      <table className="min-w-full bg-white border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Имя</th>
            <th className="p-2 border">Тип клиента</th>
            <th className="p-2 border">Адрес</th>
            <th className="p-2 border">Телефон</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Документ</th>
            <th className="p-2 border">Действия</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(client => (
            <tr key={client.id} className="hover:bg-gray-50">
              <td className="p-2 border">{client.id}</td>
              <td className="p-2 border">{client.name}</td>
              <td className="p-2 border">
                {client.clientType === 'individual'
                  ? 'Физическое лицо'
                  : client.clientType === 'legal'
                  ? 'Юридическое лицо'
                  : client.clientType}
              </td>
              <td className="p-2 border">
                {`${client.country || ''}, ${client.city || ''}, ${client.district || ''}, ${client.street || ''}, ${client.houseNumber || ''}`}
              </td>
              <td className="p-2 border">{client.phone}</td>
              <td className="p-2 border">{client.email}</td>
              <td className="p-2 border">
                <button
                  onClick={() => handleShowDocuments(client.id)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  📎 Документы
                </button>
              </td>
              <td className="border border-gray-300 p-2 text-right space-x-2">
                <button
                  onClick={() => handleEdit(client)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <ClientFormModal
          form={form}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          resetForm={resetForm}
          editingClientId={editingClientId}
        />
      )}

      {showDocumentsModal && (
        <DocumentsModal
          clientId={selectedClientId}
          documents={documents}
          setDocuments={setDocuments}
          onClose={() => setShowDocumentsModal(false)}
        />
      )}
    </div>
  );
}

// --- Tabs-enabled modal form component ---
function ClientFormModal({ form, handleChange, handleSubmit, resetForm, editingClientId }) {
  const [activeTab, setActiveTab] = useState('main');
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-md relative">
        <button
          onClick={resetForm}
          className="absolute top-2 right-3 text-gray-500 hover:text-red-500 text-lg"
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-4">
          {editingClientId ? 'Редактировать клиента' : 'Добавить клиента'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex mb-4 space-x-4">
            <button
              type="button"
              onClick={() => setActiveTab('main')}
              className={`px-4 py-2 rounded ${activeTab === 'main' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              Основное
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('address')}
              className={`px-4 py-2 rounded ${activeTab === 'address' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              Адрес
            </button>
          </div>
          {activeTab === 'main' && (
            <>
              <label className="block font-medium">Имя</label>
              <input
                type="text"
                name="name"
                placeholder="Имя"
                value={form.name}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <label className="block font-medium">Тип клиента</label>
              <select
                name="clientType"
                value={form.clientType}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              >
                <option value="">Тип клиента</option>
                <option value="individual">Физическое лицо</option>
                <option value="legal">Юридическое лицо</option>
              </select>
              <label className="block font-medium">Телефон</label>
              <input
                type="text"
                name="phone"
                placeholder="Телефон"
                value={form.phone}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <label className="block font-medium">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <label className="block font-medium">Документ</label>
              <input
                type="text"
                name="documentNumber"
                placeholder="№ документа (паспорт/ИНН)"
                value={form.documentNumber}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
            </>
          )}
          {activeTab === 'address' && (
            <>
              <label className="block font-medium">Страна</label>
              <input
                type="text"
                name="country"
                placeholder="Страна"
                value={form.country}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <label className="block font-medium">Город</label>
              <input
                type="text"
                name="city"
                placeholder="Город"
                value={form.city}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <label className="block font-medium">Район</label>
              <input
                type="text"
                name="district"
                placeholder="Район"
                value={form.district}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <label className="block font-medium">Улица</label>
              <input
                type="text"
                name="street"
                placeholder="Улица"
                value={form.street}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <label className="block font-medium">Дом / квартира</label>
              <input
                type="text"
                name="houseNumber"
                placeholder="Дом / квартира"
                value={form.houseNumber}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
            </>
          )}
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {editingClientId ? 'Обновить' : 'Сохранить'}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="ml-2 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Отменить
          </button>
        </form>
      </div>
    </div>
  );
}

function DocumentsModal({ clientId, documents, setDocuments, onClose }) {
  const fileInputRef = useRef();
  const [docType, setDocType] = useState('passport');

  const handleUpload = async () => {
    const file = fileInputRef.current.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', docType);

    try {
      await axios.post(`/api/clients/${clientId}/documents`, formData);
      const res = await axios.get(`/api/clients/${clientId}/documents`);
      setDocuments(res.data || []);
    } catch (error) {
      alert('Ошибка при загрузке документа: ' + (error?.response?.data?.message || error.message));
      console.error(error);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Удалить документ?')) return;
    try {
      await axios.delete(`/api/clients/${clientId}/documents/${documentId}`);
      const res = await axios.get(`/api/clients/${clientId}/documents`);
      setDocuments(res.data || []);
    } catch (error) {
      alert('Ошибка при удалении документа');
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-500 hover:text-red-500 text-lg"
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-4">Документы клиента #{clientId}</h2>
        <ul className="mb-4 max-h-60 overflow-y-auto">
          {documents.map((doc, idx) => (
            <li key={idx} className="flex justify-between items-center border-b py-2">
              <span>{doc.filename}</span>
              <div className="flex items-center">
                <a
                  href={`/api/clients/${clientId}/documents/${doc.filename}?t=${Date.now()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm"
                >
                  📂 Открыть
                </a>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="text-red-600 hover:underline text-sm ml-4"
                >
                  🗑️ Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
        {/* Тип документа */}
        <div className="mb-2">
          <label className="block font-medium mb-1">Тип документа</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="passport">Паспорт</option>
            <option value="inn">ИНН</option>
            <option value="tax">Налоговый документ</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <input type="file" ref={fileInputRef} className="flex-1" />
          <button
            onClick={handleUpload}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            📥 Загрузить
          </button>
        </div>
      </div>
    </div>
  );
}