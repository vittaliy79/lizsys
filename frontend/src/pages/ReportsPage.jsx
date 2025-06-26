import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    assetType: '',
    contractStatus: '',
    clientType: ''
  });
  const [reportType, setReportType] = useState('');
  const { t } = useTranslation();

  const fetchReports = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      switch (reportType) {
        case t('reports.types.income'):
          endpoint = '/api/reports/income';
          break;
        case t('reports.types.debts'):
          endpoint = '/api/reports/debts';
          break;
        case t('reports.types.overdue'):
          endpoint = '/api/reports/overdue';
          break;
        case t('reports.types.contractsCount'):
          endpoint = '/api/reports/contracts-count';
          break;
        default:
          endpoint = '';
      }

      if (!endpoint) {
        setReports([]);
        setLoading(false);
        return;
      }

      const queryParams = Object.fromEntries(
        Object.entries({
          startDate: filters.dateFrom,
          endDate: filters.dateTo,
          assetType: filters.assetType,
          contractStatus: filters.contractStatus,
          clientType: filters.clientType,
        }).filter(([_, val]) => val !== '')
      );

      const res = await axios.get(endpoint, { params: queryParams });

      const data = res.data;
      const newReports = [{
        title: reportType,
        description: Object.entries(data).map(([key, val]) => `${key}: ${val}`).join(', '),
        id: 1 // Dummy ID for export
      }];
      setReports(newReports);
      setError('');
    } catch (err) {
      setError(t('reports.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFilter = () => {
    fetchReports();
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{t('reports.title')}</h1>

      <div className="flex gap-4 mb-4">
        {[t('reports.types.income'), t('reports.types.debts'), t('reports.types.overdue'), t('reports.types.contractsCount')].map(type => (
          <button
            key={type}
            onClick={() => setReportType(type)}
            className={`px-4 py-2 rounded ${reportType === type ? 'bg-blue-700 text-white' : 'bg-gray-200'}`}
          >
            {type}
          </button>
        ))}
      </div>

      {reportType && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleChange} className="border p-2 rounded" placeholder={t('reports.filters.dateFrom')} />
            <input type="date" name="dateTo" value={filters.dateTo} onChange={handleChange} className="border p-2 rounded" placeholder={t('reports.filters.dateTo')} />
            <input type="text" name="assetType" value={filters.assetType} onChange={handleChange} className="border p-2 rounded" placeholder={t('reports.filters.assetType')} />
            <input type="text" name="contractStatus" value={filters.contractStatus} onChange={handleChange} className="border p-2 rounded" placeholder={t('reports.filters.contractStatus')} />
            <input type="text" name="clientType" value={filters.clientType} onChange={handleChange} className="border p-2 rounded" placeholder={t('reports.filters.clientType')} />
          </div>

          <button onClick={handleFilter} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4">{t('reports.applyFilters')}</button>
        </>
      )}

      {loading && <p>{t('reports.loading')}</p>}
      {error && <p className="text-red-600">{error}</p>}

      {reportType && <h2 className="text-xl font-semibold mb-2">{t('reports.reportTypeLabel')}{reportType}</h2>}

      <table className="min-w-full bg-white border mt-4">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">{t('reports.table.headerTitle')}</th>
            <th className="p-2 border">{t('reports.table.headerDescription')}</th>
            <th className="p-2 border">{t('reports.table.headerActions')}</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report, idx) => (
            <tr key={idx}>
              <td className="p-2 border">{report.title}</td>
              <td className="p-2 border">{report.description}</td>
              <td className="p-2 border space-x-2">
                <a href={`/api/reports/${report.id}/export?format=excel`} className="text-green-600 hover:underline">{t('reports.export.excel')}</a>
                <a href={`/api/reports/${report.id}/export?format=pdf`} className="text-red-600 hover:underline">{t('reports.export.pdf')}</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
