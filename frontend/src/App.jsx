import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en/translation.json';
import translationAZ from './locales/az/translation.json';
import translationRU from './locales/ru/translation.json';

const resources = {
  en: { translation: translationEN },
  ru: { translation: translationRU },
  az: { translation: translationAZ }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

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
import ReportsPage from './pages/ReportsPage';
import { useTranslation } from 'react-i18next';

function Layout({ children }) {
    const { t } = useTranslation();
    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <header className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-blue-600">LIZSYS</h1>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => i18n.changeLanguage('en')} className="text-xl hover:opacity-75">🇬🇧</button>
                        <button onClick={() => i18n.changeLanguage('ru')} className="text-xl hover:opacity-75">🇷🇺</button>
                        <button onClick={() => i18n.changeLanguage('az')} className="text-xl hover:opacity-75">🇦🇿</button>
                    </div>
                    {/* Desktop navigation */}
                    <nav className="hidden md:flex space-x-4">
                        <Link to="/" className="text-gray-600 hover:text-blue-600">{t('home')}</Link>
                        <Link to="/clients" className="text-gray-600 hover:text-blue-600">{t('clients')}</Link>
                        <Link to="/contracts" className="text-gray-600 hover:text-blue-600">{t('contracts')}</Link>
                        <Link to="/payments" className="text-gray-600 hover:text-blue-600">{t('payments')}</Link>
                        <Link to="/assets" className="text-gray-600 hover:text-blue-600">{t('assets')}</Link>
                        <Link to="/reports" className="text-gray-600 hover:text-blue-600">{t('reports')}</Link>
                    </nav>
                    {/* Mobile dropdown menu */}
                    <div className="md:hidden">
                        <details className="relative">
                            <summary className="cursor-pointer text-gray-600 hover:text-blue-600">☰ {t('menu')}</summary>
                            <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-md z-50">
                                <Link to="/" className="block px-4 py-2 hover:bg-gray-100">{t('home')}</Link>
                                <Link to="/clients" className="block px-4 py-2 hover:bg-gray-100">{t('clients')}</Link>
                                <Link to="/contracts" className="block px-4 py-2 hover:bg-gray-100">{t('contracts')}</Link>
                                <Link to="/payments" className="block px-4 py-2 hover:bg-gray-100">{t('payments')}</Link>
                                <Link to="/assets" className="block px-4 py-2 hover:bg-gray-100">{t('assets')}</Link>
                                <Link to="/reports" className="block px-4 py-2 hover:bg-gray-100">{t('reports')}</Link>
                            </div>
                        </details>
                    </div>
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
                <Route
                    path="/reports"
                    element={
                        <Layout>
                            <ReportsPage />
                        </Layout>
                    }
                />
            </Routes>
        </Router>
    );
}