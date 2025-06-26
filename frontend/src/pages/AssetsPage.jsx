import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

// --- AssetDocumentsModal: модальное окно для файлов актива ---
function AssetDocumentsModal({ assetId, show, onClose }) {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [maintenanceFile, setMaintenanceFile] = useState(null);
  const [insuranceFile, setInsuranceFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Загрузка списка файлов
  const fetchDocuments = async () => {
    if (!assetId) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/assets/${assetId}/files`);
      setDocuments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setDocuments([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (show && assetId) {
      fetchDocuments();
      setMaintenanceFile(null);
      setInsuranceFile(null);
    }
    // eslint-disable-next-line
  }, [show, assetId]);

  // Загрузка файлов
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!assetId) return;
    if (!maintenanceFile && !insuranceFile) return;
    const form = new FormData();
    if (maintenanceFile) form.append('maintenanceFile', maintenanceFile);
    if (insuranceFile) form.append('insuranceFile', insuranceFile);
    try {
      await axios.post(`/api/assets/${assetId}/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMaintenanceFile(null);
      setInsuranceFile(null);
      fetchDocuments();
    } catch (err) {
      alert('Ошибка при загрузке файлов');
    }
  };

  // Удаление документа
  const handleDeleteDoc = async (docId) => {
    if (!assetId || !docId) return;
    if (!window.confirm(t('confirmDeleteFile'))) return;
    try {
      await axios.delete(`/api/assets/${assetId}/files/${docId}`);
      fetchDocuments();
    } catch (err) {
      alert('Ошибка при удалении файла');
    }
  };

  return show ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg w-[720px] p-6">
        <h2 className="text-xl font-semibold mb-4">{t('clientFiles')}</h2>
        <form onSubmit={handleUpload} className="space-y-2 mb-4">
          <div>
            <label className="block mb-1 font-medium">{t('maintenanceDoc')}</label>
            <input
              type="file"
              onChange={e => setMaintenanceFile(e.target.files[0])}
              className="w-full border border-gray-300 rounded px-3 py-2"
              accept=".pdf,.jpg,.png"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">{t('insuranceDoc')}</label>
            <input
              type="file"
              onChange={e => setInsuranceFile(e.target.files[0])}
              className="w-full border border-gray-300 rounded px-3 py-2"
              accept=".pdf,.jpg,.png"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              disabled={loading}
            >
              {t('upload')}
            </button>
          </div>
        </form>
        {loading ? (
          <div>Загрузка...</div>
        ) : (
          <>
            {(!documents || documents.length === 0) ? (
              <p>{t('noFiles')}</p>
            ) : (
              <table className="w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-2 py-1 text-left">{t('type')}</th>
                    <th className="border px-2 py-1 text-left">{t('name')}</th>
                    <th className="border px-2 py-1 text-left">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => {
                    const docType = doc.filename.toLowerCase().includes('maintenance')
                      ? t('maintenanceDoc')
                      : doc.filename.toLowerCase().includes('insurance')
                      ? t('insuranceDoc')
                      : 'Неизвестно';
                    return (
                      <tr key={doc.id}>
                        <td className="border px-2 py-1">{docType}</td>
                        <td className="border px-2 py-1 truncate">
                          {doc.filename.length > 30 ? doc.filename.slice(0, 30) + '...' : doc.filename}
                        </td>
                        <td className="border px-2 py-1">
                          <div className="flex gap-2">
                            <a
                              href={`/api/assets/${assetId}/files/${doc.filename}?t=${Date.now()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              📂 {t('open')}
                            </a>
                            <button
                              className="text-red-600 hover:underline"
                              onClick={() => handleDeleteDoc(doc.id)}
                              type="button"
                            >
                              🗑️ {t('delete')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  ) : null;
}

export default function AssetsPage() {
  const { t } = useTranslation();
  const [assets, setAssets] = useState(() => []);
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', type: '', vin: '', maintenanceInfo: '', insuranceInfo: '', inspectionDate: '', location: '', status: '', clientId: '', maintenanceFile: null, insuranceFile: null });
  const [activeTab, setActiveTab] = useState('main');
  const [editingAssetId, setEditingAssetId] = useState(null);
  // --- AssetDocumentsModal state
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [documentsAssetId, setDocumentsAssetId] = useState(null);

  const fetchAssets = async () => {
    try {
      const res = await axios.get('/api/assets');
      console.log('Загруженные активы:', res.data);
      if (Array.isArray(res.data)) {
        setAssets(res.data);
      } else if (res.data && Array.isArray(res.data.assets)) {
        setAssets(res.data.assets);
      } else {
        console.warn('Неожиданный формат ответа при загрузке активов', res.data);
        setAssets([]);
      }
    } catch (err) {
      console.error('Ошибка при загрузке активов', err);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await axios.get('/api/clients');
      setClients(Array.isArray(res.data) ? res.data : res.data.clients || []);
    } catch (err) {
      console.error('Ошибка при загрузке клиентов', err);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchClients();
  }, []);

  if (!Array.isArray(assets)) return null;

  const filteredAssets = assets.filter(asset =>
    (asset.name && asset.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (asset.type && asset.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (asset.status && asset.status.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (clients.find(c => c.id === asset.clientId)?.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openNewAssetModal = () => {
    setNewAsset({ name: '', type: '', vin: '', maintenanceInfo: '', insuranceInfo: '', inspectionDate: '', location: '', status: '', clientId: '', maintenanceFile: null, insuranceFile: null });
    setEditingAssetId(null);
    setShowModal(true);
    setActiveTab('main');
  };

  const openEditAssetModal = (asset) => {
    setNewAsset({
      name: asset.name || '',
      type: asset.type || '',
      vin: asset.vin || '',
      maintenanceInfo: asset.maintenanceInfo || '',
      insuranceInfo: asset.insuranceInfo || '',
      inspectionDate: asset.inspectionDate || '',
      location: asset.location || '',
      status: asset.status || '',
      clientId: asset.clientId || '',
      maintenanceFile: null,
      insuranceFile: null
    });
    setEditingAssetId(asset.id);
    setShowModal(true);
    setActiveTab('main');
  };

  const resetForm = () => {
    setNewAsset({ name: '', type: '', vin: '', maintenanceInfo: '', insuranceInfo: '', inspectionDate: '', location: '', status: '', clientId: '', maintenanceFile: null, insuranceFile: null });
    setEditingAssetId(null);
    setShowModal(false);
  };

  const handleDeleteAsset = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот актив?')) {
      try {
        await axios.delete(`/api/assets/${id}`);
        fetchAssets();
      } catch (err) {
        console.error('Ошибка при удалении актива:', err);
        alert('Ошибка при удалении актива.');
      }
    }
  };

  const handleArchiveAsset = (id) => {
    alert('Архивирование актива пока не реализовано.');
  };

  const handleModalChange = (field, value) => {
    setNewAsset(prev => ({ ...prev, [field]: value }));
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!newAsset.name || !newAsset.type || !newAsset.status || !newAsset.clientId) {
      alert('Пожалуйста, заполните все обязательные поля.');
      return;
    }

    try {
      const payload = {
        name: newAsset.name,
        type: newAsset.type,
        vin: newAsset.vin,
        maintenanceInfo: newAsset.maintenanceInfo,
        insuranceInfo: newAsset.insuranceInfo,
        inspectionDate: newAsset.inspectionDate,
        location: newAsset.location,
        status: newAsset.status,
        clientId: newAsset.clientId,
      };

      let assetId;
      if (editingAssetId) {
        await axios.put(`/api/assets/${editingAssetId}`, payload);
        assetId = editingAssetId;
      } else {
        const res = await axios.post('/api/assets', payload);
        assetId = res.data?.id;
      }

      // Отдельная загрузка файлов
      if (assetId && (newAsset.maintenanceFile || newAsset.insuranceFile)) {
        const fileForm = new FormData();
        if (newAsset.maintenanceFile) {
          fileForm.append('maintenanceFile', newAsset.maintenanceFile);
        }
        if (newAsset.insuranceFile) {
          fileForm.append('insuranceFile', newAsset.insuranceFile);
        }
        await axios.post(`/api/assets/${assetId}/upload`, fileForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      fetchAssets();
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Произошла ошибка при сохранении актива.');
    }
  };

  // --- Форма загрузки файлов для модального окна файлов
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedAssetId) return;
    const fileForm = new FormData();
    if (newAsset.maintenanceFile) {
      fileForm.append('maintenanceFile', newAsset.maintenanceFile);
    }
    if (newAsset.insuranceFile) {
      fileForm.append('insuranceFile', newAsset.insuranceFile);
    }
    try {
      await axios.post(`/api/assets/${selectedAssetId}/upload`, fileForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // обновить список файлов
      const res = await axios.get(`/api/assets/${selectedAssetId}/files`);
      setSelectedAssetFiles(res.data || []);
      setNewAsset(prev => ({ ...prev, maintenanceFile: null, insuranceFile: null }));
    } catch (err) {
      console.error('Ошибка при загрузке файлов:', err);
      alert('Не удалось загрузить файлы.');
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder={t('search') || 'Поиск по активам...'}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="border rounded px-3 py-2 w-1/3"
        />
        <button
          onClick={openNewAssetModal}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
        >
          <span className="mr-2">+</span> {t('addAsset')}
        </button>
      </div>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2">{t('client')}</th>
            <th className="border border-gray-300 px-4 py-2">{t('type')}</th>
            <th className="border border-gray-300 px-4 py-2">{t('model')}</th>
            <th className="border border-gray-300 px-4 py-2">{t('vin')}</th>
            <th className="border border-gray-300 px-4 py-2">{t('status')}</th>
            <th className="border border-gray-300 px-4 py-2">{t('inspection')}</th>
            <th className="border border-gray-300 px-4 py-2">{t('maintenance')}</th>
            <th className="border border-gray-300 px-4 py-2">{t('insurance')}</th>
            <th className="border border-gray-300 px-4 py-2">{t('location')}</th>
            <th className="border border-gray-300 px-4 py-2">{t('state')}</th>
            <th className="border border-gray-300 px-4 py-2">{t('documents')}</th>
            <th className="border border-gray-300 px-4 py-2">{t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {!filteredAssets || filteredAssets.length === 0 ? (
            <tr>
              <td colSpan="12" className="text-center py-4">{t('notFound')}</td>
            </tr>
          ) : (
            filteredAssets.map(asset => (
              <tr key={asset.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{clients.find(c => c.id === asset.clientId)?.name || '—'}</td>
                <td className="border border-gray-300 px-4 py-2">{asset.type}</td>
                <td className="border border-gray-300 px-4 py-2">{asset.name}</td>
                <td className="border border-gray-300 px-4 py-2">{asset.vin || '—'}</td>
                <td className="border border-gray-300 px-4 py-2">{asset.status}</td>
                <td className="border border-gray-300 px-4 py-2">{asset.inspectionDate || '—'}</td>
                <td className="border border-gray-300 px-4 py-2">{asset.maintenanceInfo || '—'}</td>
                <td className="border border-gray-300 px-4 py-2">{asset.insuranceInfo || '—'}</td>
                <td className="border border-gray-300 px-4 py-2">{asset.location || '—'}</td>
                <td className="border border-gray-300 px-4 py-2">{asset.status || '—'}</td>
                <td className="border border-gray-300 px-4 py-2">
                  <button
                    onClick={() => { setDocumentsAssetId(asset.id); setShowDocumentsModal(true); }}
                    className="text-blue-600 hover:underline"
                  >
                    📂 {t('clientFiles')}: {asset.fileCount || 0}
                  </button>
                </td>
                <td className="border border-gray-300 px-4 py-2 space-x-2">
                  <button
                    onClick={() => openEditAssetModal(asset)}
                    title={t('editAsset')}
                    className="hover:text-blue-600"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteAsset(asset.id)}
                    title={t('delete')}
                    className="hover:text-red-600"
                  >
                    🗑️
                  </button>
                  <button
                    onClick={() => handleArchiveAsset(asset.id)}
                    title="Архивировать"
                    className="hover:text-gray-600"
                  >
                    📦
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg w-96 p-6">
            <h2 className="text-xl font-semibold mb-4">{editingAssetId ? t('editAsset') : t('addAsset')}</h2>
            <div className="flex mb-4 border-b">
              <button
                type="button"
                className={`px-4 py-2 ${activeTab === 'main' ? 'border-b-2 border-green-600 font-semibold' : ''}`}
                onClick={() => setActiveTab('main')}
              >
                {t('main')}
              </button>
              <button
                type="button"
                className={`px-4 py-2 ${activeTab === 'docs' ? 'border-b-2 border-green-600 font-semibold' : ''}`}
                onClick={() => setActiveTab('docs')}
              >
                {t('additional')}
              </button>
            </div>
            <form onSubmit={handleModalSubmit} className="space-y-4">
              {activeTab === 'main' && (
                <>
                  <div>
                    <label className="block mb-1 font-medium">{t('client')}</label>
                    <select
                      value={newAsset.clientId}
                      onChange={e => handleModalChange('clientId', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    >
                      <option value="" disabled>{t('selectClient')}</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">{t('name')}</label>
                    <input
                      type="text"
                      value={newAsset.name}
                      onChange={e => handleModalChange('model', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">{t('type')}</label>
                    <select
                      value={newAsset.type}
                      onChange={e => handleModalChange('type', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    >
                      <option value="" disabled>{t('selectType')}</option>
                      <option value={t('car')}>{t('car')}</option>
                      <option value={t('special')}>{t('special')}</option>
                      <option value={t('equipment')}>{t('equipment')}</option>
                      <option value={t('other')}>{t('other')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">{t('vin')}</label>
                    <input
                      type="text"
                      value={newAsset.vin}
                      onChange={e => handleModalChange('vin', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">{t('status')}</label>
                    <input
                      type="text"
                      value={newAsset.status}
                      onChange={e => handleModalChange('status', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>
                </>
              )}

              {activeTab === 'docs' && (
                <>
                  <div>
                    <label className="block mb-1 font-medium">{t('maintenance')}</label>
                    <input
                      type="text"
                      value={newAsset.maintenanceInfo}
                      onChange={e => handleModalChange('maintenanceInfo', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">{t('insurance')}</label>
                    <input
                      type="text"
                      value={newAsset.insuranceInfo}
                      onChange={e => handleModalChange('insuranceInfo', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">{t('inspectionDate')}</label>
                    <input
                      type="date"
                      value={newAsset.inspectionDate}
                      onChange={e => handleModalChange('inspectionDate', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">{t('location')}</label>
                    <input
                      type="text"
                      value={newAsset.location}
                      onChange={e => handleModalChange('location', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <AssetDocumentsModal
        assetId={documentsAssetId}
        show={showDocumentsModal}
        onClose={() => setShowDocumentsModal(false)}
      />
    </div>
  );
}