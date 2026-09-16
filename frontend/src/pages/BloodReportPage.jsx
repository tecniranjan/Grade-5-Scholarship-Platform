import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/client';

const NIPUNATHA_COLORS = [
  '#DC2626', '#EA580C', '#D97706', '#CA8A04', '#65A30D', '#16A34A', '#059669',
  '#0891B2', '#0284C7', '#2563EB', '#4F46E5', '#7C3AED', '#9333EA', '#C026D3',
];

function gradeBandLabel(pct, t) {
  if (pct >= 90) return { label: t('excellent'), color: 'text-green-600', bg: 'bg-green-50' };
  if (pct >= 75) return { label: t('veryGood'), color: 'text-blue-600', bg: 'bg-blue-50' };
  if (pct >= 60) return { label: t('good'), color: 'text-primary-600', bg: 'bg-primary-50' };
  if (pct >= 40) return { label: t('satisfactory'), color: 'text-yellow-600', bg: 'bg-yellow-50' };
  return { label: t('needsImprovement'), color: 'text-blood-600', bg: 'bg-blood-50' };
}

function BarChart({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }}></div>
      </div>
      <span className="text-xs font-bold w-10 text-right" style={{ color }}>{pct}%</span>
    </div>
  );
}

export default function BloodReportPage() {
  const { attemptId } = useParams();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [attemptId]);

  async function loadReport() {
    try {
      const res = await api.get(`/report/${attemptId}`);
      setReportData(res.data);
    } catch (err) {
      console.error('Report load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function downloadPDF() {
    try {
      const res = await api.get(`/report/${attemptId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `blood-report-${attemptId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blood-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!reportData || !reportData.report) {
    return <div className="text-center py-10 text-gray-400">Report not found</div>;
  }

  const { report, nipunatha_scores, previous_report, chart_data } = reportData;
  const pct = parseFloat(report.percentage) || 0;
  const band = gradeBandLabel(pct, t);

  return (
    <div className="container-mobile py-4">
      <div className="bg-gradient-to-br from-blood-600 to-blood-800 rounded-2xl p-5 text-white shadow-xl mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-10 translate-x-10"></div>
        <p className="text-xs text-white/60 uppercase tracking-wider">{t('bloodReport')}</p>
        <h2 className="text-lg font-bold mt-1">{report.student_name}</h2>
        <p className="text-xs text-white/70 mt-0.5">
          {t('grade')} {report.grade} | {report.medium === 'SI' ? t('sinhala') : report.medium === 'TA' ? t('tamil') : t('english')}
          {report.month_no && ` | ${t('month')} ${report.month_no}`}
          {report.year && ` (${report.year})`}
        </p>

        <div className="mt-4 flex items-end gap-3">
          <span className="text-5xl font-black">{Math.round(pct)}%</span>
          <div className="mb-1">
            <p className="text-sm font-medium">{report.total_marks}/{report.max_marks}</p>
            <p className={`text-xs px-2 py-0.5 rounded-full inline-block mt-0.5 ${band.bg} ${band.color}`}>{band.label}</p>
          </div>
        </div>

        {report.grade_band && (<p className="text-xs text-white/50 mt-2">{report.grade_band}</p>)}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-4">
        <h3 className="text-sm font-bold text-gray-800 mb-3">{t('nipunathaBreakdown')}</h3>
        <div className="space-y-3">
          {(nipunatha_scores || []).map((nip, i) => {
            const color = NIPUNATHA_COLORS[i % NIPUNATHA_COLORS.length];
            const nipName = lang === 'SI' ? nip.name_si : lang === 'TA' ? nip.name_ta : nip.name_en;
            return (
              <div key={nip.nipunatha_id || i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700">{nipName || nip.name_en || nip.code}</span>
                  <span className="text-xs text-gray-400">{nip.marks_obtained}/{nip.max_marks}</span>
                </div>
                <BarChart value={nip.marks_obtained} max={nip.max_marks} color={color} />
              </div>
            );
          })}
        </div>
      </div>

      {previous_report && (
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-4">
          <h3 className="text-sm font-bold text-gray-800 mb-2">{t('trend')}</h3>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-400">Previous</p>
              <p className="text-lg font-bold text-gray-600">{previous_report.max_marks > 0 ? Math.round((previous_report.total_marks / previous_report.max_marks) * 100) : 0}%</p>
            </div>
            <div className="text-2xl text-gray-300">→</div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Current</p>
              <p className="text-lg font-bold text-primary-600">{Math.round(pct)}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <button onClick={downloadPDF} className="w-full py-3 bg-gradient-to-r from-blood-500 to-blood-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          {t('downloadPDF')}
        </button>
        <button onClick={() => navigate('/dashboard')} className="w-full py-2 text-gray-500 text-sm hover:text-gray-700">{t('backToDashboard')}</button>
      </div>
    </div>
  );
}
