import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

export default function ClientsPage() {
  const { t } = useTranslation();
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
        // Убедиться, что documentCount берётся из documents.length если есть
        clientsData = clientsData.map(client => ({
          ...client,
          hasDocuments: client.hasDocuments || false,
          documentCount: Array.isArray(client.documents) ? client.documents.length : (typeof client.documentCount === 'number' ? client.documentCount : 0),
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
          placeholder={t('search_client')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border p-2 rounded w-1/3"
        />
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {t('addClient')}
        </button>
      </div>

      {message && <div className="mb-4 text-sm text-blue-600">{message}</div>}

      <table className="min-w-full bg-white border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">{t('clientName')}</th>
            <th className="p-2 border">{t('clientType')}</th>
            <th className="p-2 border">{t('address')}</th>
            <th className="p-2 border">{t('phone')}</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">{t('clientFiles')}</th>
            <th className="p-2 border">{t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(client => (
            <tr key={client.id} className="hover:bg-gray-50">
              <td className="p-2 border">{client.id}</td>
              <td className="p-2 border">{client.name}</td>
              <td className="p-2 border">
                {client.clientType === 'individual'
                  ? t('individual')
                  : client.clientType === 'legal'
                  ? t('legal')
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
                  📂 {t('clientFiles')}: {client.documentCount || 0}
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
  const { t } = useTranslation();
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
          {editingClientId ? t('editClient') : t('addClient')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex mb-4 space-x-4">
            <button
              type="button"
              onClick={() => setActiveTab('main')}
              className={`px-4 py-2 rounded ${activeTab === 'main' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              {t('main')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('address')}
              className={`px-4 py-2 rounded ${activeTab === 'address' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              {t('address')}
            </button>
          </div>
          {activeTab === 'main' && (
            <>
              <label className="block font-medium">{t('clientName')}</label>
              <input
                type="text"
                name="name"
                placeholder={t('clientName')}
                value={form.name}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <label className="block font-medium">{t('clientType')}</label>
              <select
                name="clientType"
                value={form.clientType}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              >
                <option value="">{t('clientType')}</option>
                <option value="individual">{t('individual')}</option>
                <option value="legal">{t('legal')}</option>
              </select>
              <label className="block font-medium">{t('phone')}</label>
              <input
                type="text"
                name="phone"
                placeholder={t('phone')}
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
              <label className="block font-medium">{t('documentType')}</label>
              <input
                type="text"
                name="documentNumber"
                placeholder={t('document_number')}
                value={form.documentNumber}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
            </>
          )}
          {activeTab === 'address' && (
            <>
              <label className="block font-medium">{t('addressCountry')}</label>
              <input
                type="text"
                name="country"
                placeholder={t('addressCountry')}
                value={form.country}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <label className="block font-medium">{t('addressCity')}</label>
              <input
                type="text"
                name="city"
                placeholder={t('addressCity')}
                value={form.city}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <label className="block font-medium">{t('addressDistrict')}</label>
              <input
                type="text"
                name="district"
                placeholder={t('addressDistrict')}
                value={form.district}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <label className="block font-medium">{t('addressStreet')}</label>
              <input
                type="text"
                name="street"
                placeholder={t('addressStreet')}
                value={form.street}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <label className="block font-medium">{t('addressHouse')}</label>
              <input
                type="text"
                name="houseNumber"
                placeholder={t('addressHouse')}
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
            {editingClientId ? t('update') : t('save')}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="ml-2 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            {t('cancel')}
          </button>
        </form>
      </div>
    </div>
  );
}

function DocumentsModal({ clientId, documents, setDocuments, onClose }) {
  const fileInputRef = useRef();
  const [docType, setDocType] = useState('passport');
  const { t } = useTranslation();

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
      alert(t('upload_error') + ': ' + (error?.response?.data?.message || error.message));
      console.error(error);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm(t('confirmDeleteClient'))) return;
    try {
      await axios.delete(`/api/clients/${clientId}/documents/${documentId}`);
      const res = await axios.get(`/api/clients/${clientId}/documents`);
      setDocuments(res.data || []);
    } catch (error) {
      alert(t('deleteClientError'));
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
        <h2 className="text-xl font-semibold mb-4">{t('client_documents') + ' #' + clientId}</h2>
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
                  📂 {t('open')}
                </a>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="text-red-600 hover:underline text-sm ml-4"
                >
                  🗑️ {t('delete')}
                </button>
              </div>
            </li>
          ))}
        </ul>
        {/* Тип документа */}
        <div className="mb-2">
          <label className="block font-medium mb-1">{t('documentType')}</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="passport">{t('passport')}</option>
            <option value="inn">{t('inn')}</option>
            <option value="tax">{t('tax_doc')}</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <input type="file" ref={fileInputRef} className="flex-1" />
          <button
            onClick={handleUpload}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            📥 {t('uploadDocument')}
          </button>
        </div>
      </div>
    </div>
  );
}