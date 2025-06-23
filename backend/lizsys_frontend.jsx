
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { create } from 'zustand';
import axios from 'axios';

const useAuthStore = create(set => ({
  token: localStorage.getItem('token'),
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null });
  },
}));

function PrivateRoute({ children }) {
  const token = useAuthStore(state => state.token);
  return token ? children : <Navigate to="/login" replace />;
}

function Layout({ children }) {
  const logout = useAuthStore(state => state.logout);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <span className="text-xl font-semibold">LIZSYS</span>
        <button onClick={logout} className="bg-red-600 px-3 py-1 rounded text-sm hover:bg-red-700">Выход</button>
      </header>
      <main className="flex-1 p-4 bg-gray-50">{children}</main>
      <footer className="bg-gray-200 text-center p-2 text-sm">&copy; 2025 LIZSYS</footer>
    </div>
  );
}

function LoginPage() {
  const setToken = useAuthStore(state => state.setToken);

  const handleLogin = async (e) => {
    e.preventDefault();
    const form = e.target;
    const res = await axios.post('/auth/login', {
      username: form.username.value,
      password: form.password.value,
    });
    setToken(res.data.access_token);
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-xl font-bold mb-4">Вход в систему</h2>
        <input name="username" type="text" placeholder="Логин" required className="w-full mb-3 p-2 border rounded" />
        <input name="password" type="password" placeholder="Пароль" required className="w-full mb-3 p-2 border rounded" />
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Войти</button>
      </form>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded shadow p-4">
        <h3 className="text-sm text-gray-500">Клиенты</h3>
        <p className="text-2xl font-bold">128</p>
      </div>
      <div className="bg-white rounded shadow p-4">
        <h3 className="text-sm text-gray-500">Контракты</h3>
        <p className="text-2xl font-bold">64</p>
      </div>
      <div className="bg-white rounded shadow p-4">
        <h3 className="text-sm text-gray-500">Платежи</h3>
        <p className="text-2xl font-bold">$42,000</p>
      </div>
      <div className="bg-white rounded shadow p-4">
        <h3 className="text-sm text-gray-500">Активы</h3>
        <p className="text-2xl font-bold">23</p>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    axios.defaults.baseURL = '/api';
    axios.defaults.headers.common['Authorization'] = `Bearer ${useAuthStore.getState().token}`;
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      </Routes>
    </Router>
  );
}
