import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    axios.get('/clients')
      .then(res => setClients(res.data))
      .catch(err => console.error(err));
  }, []);


  const filtered = clients.filter(client =>
    client.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) return;
    const newClient = {
      id: clients.length + 1,
      ...form,
    };
    setClients(prev => [...prev, newClient]);
    setForm({ name: '', email: '', phone: '' });
    setShowForm(false);
  };

  const handleAddClient = () => {
  if (!name || !email || !phone) return;

  axios.post('/clients', { name, email, phone })
    .then(res => {
      setClients(prev => [...prev, res.data]);
      setName('');
      setEmail('');
      setPhone('');
    })
    .catch(err => console.error(err));
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

      <table className="min-w-full bg-white border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Имя</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Телефон</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(client => (
            <tr key={client.id} className="hover:bg-gray-50">
              <td className="p-2 border">{client.id}</td>
              <td className="p-2 border">{client.name}</td>
              <td className="p-2 border">{client.email}</td>
              <td className="p-2 border">{client.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-md relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-red-500 text-lg"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4">Добавить клиента</h2>
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
                Сохранить
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
