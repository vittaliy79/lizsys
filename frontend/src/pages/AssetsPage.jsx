import React, { useState, useEffect } from 'react';

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [clients, setClients] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newAsset, setNewAsset] = useState({ type: '', model: '', vin: '', client: '', status: '', inspectionDate: '', maintenanceInfo: '', insuranceDocs: '', location: '' });
  const [activeTab, setActiveTab] = useState('main');

  useEffect(() => {
    fetch('/api/assets')
      .then(res => res.json())
      .then(data => setAssets(data))
      .catch(err => console.error('Ошибка загрузки активов:', err));

    fetch('/api/clients')
      .then(res => res.json())
      .then(data => setClients(data.map(c => c.name))) // предполагается, что у клиента есть поле `name`
      .catch(err => console.error('Ошибка загрузки клиентов:', err));

    setContracts([]);
  }, []);

  const filteredAssets = assets.filter(asset =>
    asset.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.vin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openNewAssetModal = () => {
    setNewAsset({ type: '', model: '', vin: '', client: '', status: '', inspectionDate: '', maintenanceInfo: '', insuranceDocs: '', location: '' });
    setShowModal(true);
    setActiveTab('main');
  };

  const openEditAssetModal = (asset) => {
    setNewAsset({...asset});
    setShowModal(true);
    setActiveTab('main');
  };

  const handleDeleteAsset = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот актив?')) {
      setAssets(prev => prev.filter(asset => asset.id !== id));
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
    if (!newAsset.type || !newAsset.model || !newAsset.vin || !newAsset.client || !newAsset.status) {
      alert('Пожалуйста, заполните все поля.');
      return;
    }

    try {
      const response = await fetch(
        newAsset.id ? `/api/assets/${newAsset.id}` : '/api/assets',
        {
          method: newAsset.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAsset)
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка при сохранении актива');
      }

      // Перезагружаем активы после успешного сохранения
      const updatedAssets = await fetch('/api/assets').then(res => res.json());
      setAssets(updatedAssets);
      setShowModal(false);
      setNewAsset(null);
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
            <th className="border border-gray-300 px-4 py-2">Тип</th>
            <th className="border border-gray-300 px-4 py-2">Модель</th>
            <th className="border border-gray-300 px-4 py-2">VIN</th>
            <th className="border border-gray-300 px-4 py-2">Клиент</th>
            <th className="border border-gray-300 px-4 py-2">Статус</th>
            <th className="border border-gray-300 px-4 py-2">Осмотр</th>
            <th className="border border-gray-300 px-4 py-2">Обслуживание</th>
            <th className="border border-gray-300 px-4 py-2">Страховка</th>
            <th className="border border-gray-300 px-4 py-2">Местоположение</th>
            <th className="border border-gray-300 px-4 py-2">Действия</th>
          </tr>
        </thead>
        <tbody>
          {filteredAssets.length === 0 ? (
            <tr>
              <td colSpan="10" className="text-center py-4">Активы не найдены.</td>
            </tr>
          ) : (
            filteredAssets.map(asset => (
              <tr key={asset.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{asset.type}</td>
                <td className="border border-gray-300 px-4 py-2">{asset.model}</td>
                <td className="border border-gray-300 px-4 py-2">{asset.vin}</td>
                <td className="border border-gray-300 px-4 py-2">{asset.client}</td>
                <td className="border border-gray-300 px-4 py-2">{asset.status}</td>
                <td className="border border-gray-300 px-4 py-2">{asset.inspectionDate || '—'}</td>
                <td className="border border-gray-300 px-4 py-2">{asset.maintenanceInfo || '—'}</td>
                <td className="border border-gray-300 px-4 py-2">{asset.insuranceDocs || '—'}</td>
                <td className="border border-gray-300 px-4 py-2">{asset.location || '—'}</td>
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
            <h2 className="text-xl font-semibold mb-4">{newAsset.id ? 'Редактировать Актив' : 'Добавить Актив'}</h2>
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
                Документы
              </button>
            </div>
            <form onSubmit={handleModalSubmit} className="space-y-4">
              {activeTab === 'main' && (
                <>
                  <div>
                    <label className="block mb-1 font-medium">Тип</label>
                    <input
                      type="text"
                      value={newAsset.type}
                      onChange={e => handleModalChange('type', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Модель</label>
                    <input
                      type="text"
                      value={newAsset.model}
                      onChange={e => handleModalChange('model', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">VIN</label>
                    <input
                      type="text"
                      value={newAsset.vin}
                      onChange={e => handleModalChange('vin', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Клиент</label>
                    <select
                      value={newAsset.client}
                      onChange={e => handleModalChange('client', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    >
                      <option value="" disabled>Выберите клиента</option>
                      {clients.map(client => (
                        <option key={client} value={client}>{client}</option>
                      ))}
                    </select>
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
                    <label className="block mb-1 font-medium">Инфо об обслуживании</label>
                    <textarea
                      value={newAsset.maintenanceInfo}
                      onChange={e => handleModalChange('maintenanceInfo', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                </>
              )}

              {activeTab === 'docs' && (
                <>
                  <div>
                    <label className="block mb-1 font-medium">Страховые документы</label>
                    <input
                      type="text"
                      value={newAsset.insuranceDocs}
                      onChange={e => handleModalChange('insuranceDocs', e.target.value)}
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
                  onClick={() => {
                    setShowModal(false);
                    setNewAsset(null);
                  }}
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
    </div>
  );
}