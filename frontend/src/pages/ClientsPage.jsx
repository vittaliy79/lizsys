import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [editingClientId, setEditingClientId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = () => {
    axios.get('/api/clients')
      .then(res => {
        if (Array.isArray(res.data)) {
          setClients(res.data);
        } else if (Array.isArray(res.data.clients)) {
          setClients(res.data.clients);
        } else {
          console.error("Неверный формат ответа от API");
          setClients([]);
        }
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

    if (editingClientId) {
      axios.put(`/api/clients/${editingClientId}`, form)
        .then(() => {
          fetchClients();
          resetForm();
          setMessage('Клиент обновлён.');
        })
        .catch(() => setMessage('Ошибка при обновлении клиента.'));
    } else {
      axios.post('/api/clients', form)
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
    setForm({ name: client.name, email: client.email, phone: client.phone });
    setEditingClientId(client.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '' });
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
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Телефон</th>
            <th className="p-2 border">Действия</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(client => (
            <tr key={client.id} className="hover:bg-gray-50">
              <td className="p-2 border">{client.id}</td>
              <td className="p-2 border">{client.name}</td>
              <td className="p-2 border">{client.email}</td>
              <td className="p-2 border">{client.phone}</td>
              <td className="p-2 border">
                <button onClick={() => handleEdit(client)} className="text-blue-600 hover:underline mr-2">Редактировать</button>
                <button onClick={() => handleDelete(client.id)} className="text-red-600 hover:underline">Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
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
              <input
                type="text"
                name="name"
                placeholder="Имя"
                value={form.name}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <input
                type="text"
                name="phone"
                placeholder="Телефон"
                value={form.phone}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {editingClientId ? 'Обновить' : 'Сохранить'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
