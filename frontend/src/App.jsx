import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';
import ClientsPage from './pages/ClientsPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ContractsPage from './pages/ContractsPage';
import PaymentsPage from './pages/PaymentsPage';
import AssetsPage from './pages/AssetsPage';

function Layout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <header className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-blue-600">LIZSYS</h1>
                    <nav className="space-x-4">
                        <Link to="/" className="text-gray-600 hover:text-blue-600">Главная</Link>
                        <Link to="/clients" className="text-gray-600 hover:text-blue-600">Клиенты</Link>
                        <Link to="/contracts" className="text-gray-600 hover:text-blue-600">Контракты</Link>
                        <Link to="/payments" className="text-gray-600 hover:text-blue-600">Платежи</Link>
                        <Link to="/assets" className="text-gray-600 hover:text-blue-600">Активы</Link>
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

export default function App() {
    useEffect(() => {
        axios.defaults.baseURL = 'http://localhost:3001';
    }, []);

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                    path="/"
                    element={
                        <Layout>
                            <DashboardPage />
                        </Layout>
                    }
                />
                <Route
                    path="/clients"
                    element={
                        <Layout>
                            <ClientsPage />
                        </Layout>
                    }
                />
                <Route
                    path="/contracts"
                    element={
                        <Layout>
                            <ContractsPage />
                        </Layout>
                    }
                />
                <Route
                    path="/payments"
                    element={
                        <Layout>
                            <PaymentsPage />
                        </Layout>
                    }
                />
                <Route
                    path="/assets"
                    element={
                        <Layout>
                            <AssetsPage />
                        </Layout>
                    }
                />
            </Routes>
        </Router>
    );
}