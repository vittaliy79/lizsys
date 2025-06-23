
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';
import ClientsPage from './pages/ClientsPage';


function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">LIZSYS</h1>
          <nav className="space-x-4">
            <Link to="/" className="text-gray-600 hover:text-blue-600">Главная</Link>
            <Link to="/clients" className="text-gray-600 hover:text-blue-600">Клиенты</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      <footer className="bg-white border-t text-center p-2 text-sm text-gray-500">
        &copy; 2025 LIZSYS
      </footer>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { label: 'Клиенты', value: 128 },
        { label: 'Контракты', value: 64 },
        { label: 'Платежи', value: '$42,000' },
        { label: 'Активы', value: 23 }
      ].map((card, i) => (
        <div key={i} className="bg-white rounded-xl shadow p-5 border hover:shadow-md transition">
          <h3 className="text-sm text-gray-500 mb-1">{card.label}</h3>
          <p className="text-3xl font-semibold text-blue-600">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  useEffect(() => {
    axios.defaults.baseURL = 'http://localhost:3001';
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<ClientsPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
