import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AssetsPage() {
  const [assets, setAssets] = useState(() => []);
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', type: '', vin: '', maintenanceInfo: '', insuranceInfo: '', inspectionDate: '', location: '', status: '', clientId: '', maintenanceFile: null, insuranceFile: null });
  const [activeTab, setActiveTab] = useState('main');
  const [editingAssetId, setEditingAssetId] = useState(null);
  // --- Files modal state
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [selectedAssetFiles, setSelectedAssetFiles] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  // --- Файлы клиента для актива
  const handleOpenFilesModal = async (asset) => {
    setSelectedAssetId(asset.id);
    try {
      const res = await axios.get(`/api/assets/${asset.id}/files`);
      if (Array.isArray(res.data)) {
        setSelectedAssetFiles(res.data);
      } else {
        console.warn('Ожидался массив файлов, но получено:', res.data);
        setSelectedAssetFiles([]);
      }
      setShowFilesModal(true);
    } catch (err) {
      console.error('Ошибка при загрузке файлов:', err);
      alert('Не удалось загрузить файлы.');
    }
  };

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

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Поиск по активам..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="border rounded px-3 py-2 w-1/3"
        />
        <button
          onClick={openNewAssetModal}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
        >
          <span className="mr-2">+</span> Добавить Актив
        </button>
      </div>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2">Клиент</th>
            <th className="border border-gray-300 px-4 py-2">Тип</th>
            <th className="border border-gray-300 px-4 py-2">Модель</th>
            <th className="border border-gray-300 px-4 py-2">VIN</th>
            <th className="border border-gray-300 px-4 py-2">Статус</th>
            <th className="border border-gray-300 px-4 py-2">Осмотр</th>
            <th className="border border-gray-300 px-4 py-2">Обслуживание</th>
            <th className="border border-gray-300 px-4 py-2">Страховка</th>
            <th className="border border-gray-300 px-4 py-2">Местоположение</th>
            <th className="border border-gray-300 px-4 py-2">Состояние</th>
            <th className="border border-gray-300 px-4 py-2">Документы</th>
            <th className="border border-gray-300 px-4 py-2">Действия</th>
          </tr>
        </thead>
        <tbody>
          {!filteredAssets || filteredAssets.length === 0 ? (
            <tr>
              <td colSpan="12" className="text-center py-4">Активы не найдены.</td>
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
                    onClick={() => handleOpenFilesModal(asset)}
                    className="text-blue-600 hover:underline"
                  >
                    📂 Файлов клиента: {asset.fileCount || 0}
                  </button>
                </td>
                <td className="border border-gray-300 px-4 py-2 space-x-2">
                  <button
                    onClick={() => openEditAssetModal(asset)}
                    title="Редактировать"
                    className="hover:text-blue-600"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteAsset(asset.id)}
                    title="Удалить"
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
            <h2 className="text-xl font-semibold mb-4">{editingAssetId ? 'Редактировать Актив' : 'Добавить Актив'}</h2>
            <div className="flex mb-4 border-b">
              <button
                type="button"
                className={`px-4 py-2 ${activeTab === 'main' ? 'border-b-2 border-green-600 font-semibold' : ''}`}
                onClick={() => setActiveTab('main')}
              >
                Основное
              </button>
              <button
                type="button"
                className={`px-4 py-2 ${activeTab === 'docs' ? 'border-b-2 border-green-600 font-semibold' : ''}`}
                onClick={() => setActiveTab('docs')}
              >
                Дополнительно
              </button>
            </div>
            <form onSubmit={handleModalSubmit} className="space-y-4">
              {activeTab === 'main' && (
                <>
                  <div>
                    <label className="block mb-1 font-medium">Клиент</label>
                    <select
                      value={newAsset.clientId}
                      onChange={e => handleModalChange('clientId', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    >
                      <option value="" disabled>Выберите клиента</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Название</label>
                    <input
                      type="text"
                      value={newAsset.name}
                      onChange={e => handleModalChange('name', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Тип</label>
                    <select
                      value={newAsset.type}
                      onChange={e => handleModalChange('type', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    >
                      <option value="" disabled>Выберите тип</option>
                      <option value="Автомобиль">Автомобиль</option>
                      <option value="Спецтехника">Спецтехника</option>
                      <option value="Оборудование">Оборудование</option>
                      <option value="Прочее">Прочее</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">VIN</label>
                    <input
                      type="text"
                      value={newAsset.vin}
                      onChange={e => handleModalChange('vin', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Статус</label>
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
                    <label className="block mb-1 font-medium">Обслуживание</label>
                    <input
                      type="text"
                      value={newAsset.maintenanceInfo}
                      onChange={e => handleModalChange('maintenanceInfo', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Страховка</label>
                    <input
                      type="text"
                      value={newAsset.insuranceInfo}
                      onChange={e => handleModalChange('insuranceInfo', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Дата осмотра</label>
                    <input
                      type="date"
                      value={newAsset.inspectionDate}
                      onChange={e => handleModalChange('inspectionDate', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Местоположение</label>
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
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showFilesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg w-96 p-6">
            <h2 className="text-xl font-semibold mb-4">Файлы клиента</h2>
            {/* Форма загрузки документов */}
            <form onSubmit={handleFileUpload} className="space-y-2 mb-4">
              <div>
                <label className="block mb-1 font-medium">Документ обслуживания</label>
                <input
                  type="file"
                  onChange={e => setNewAsset(prev => ({ ...prev, maintenanceFile: e.target.files[0] }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  accept=".pdf,.jpg,.png"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Страховой документ</label>
                <input
                  type="file"
                  onChange={e => setNewAsset(prev => ({ ...prev, insuranceFile: e.target.files[0] }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  accept=".pdf,.jpg,.png"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                >
                  Загрузить
                </button>
              </div>
            </form>
            {selectedAssetFiles.length === 0 ? (
              <p>Нет прикреплённых файлов.</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                {selectedAssetFiles.map((file, idx) => (
                  <li key={idx}>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {file.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowFilesModal(false)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
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