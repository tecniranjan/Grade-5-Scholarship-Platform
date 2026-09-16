import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/client';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('exams');
  const [exams, setExams] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [exRes, repRes] = await Promise.all([
        api.get('/exam/available'),
        api.get('/report/list'),
      ]);
      setExams(exRes.data.exams || []);
      setReports(repRes.data.reports || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  function getMonthLabel(m) {
    return `${t('month')} ${m}`;
  }

  function getStatusBadge(exam) {
    if (exam.status === 'submitted' || exam.status === 'graded') {
      return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">{t('completed')}</span>;
    }
    if (exam.status === 'in_progress') {
      return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">{t('inProgress')}</span>;
    }
    return <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">{t('notStarted')}</span>;
  }

  function gradeBandColor(pct) {
    if (pct >= 90) return 'text-green-600';
    if (pct >= 75) return 'text-blue-600';
    if (pct >= 60) return 'text-primary-600';
    if (pct >= 40) return 'text-yellow-600';
    return 'text-blood-600';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container-mobile py-4">
      <div className="bg-gradient-to-r from-primary-700 to-primary-500 rounded-xl p-4 text-white mb-4 shadow-lg">
        <p className="text-xs text-white/70">{t('dashboard')}</p>
        <h2 className="text-lg font-bold mt-0.5">{user?.name || 'Student'}</h2>
        <p className="text-xs text-white/60 mt-1">
          {t('grade')} {user?.grade} | {user?.medium === 'SI' ? t('sinhala') : user?.medium === 'TA' ? t('tamil') : t('english')}
        </p>
      </div>

      <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
        <button onClick={() => setActiveTab('exams')} className={`flex-1 py-2 text-sm rounded-md font-medium transition-all ${activeTab === 'exams' ? 'bg-white shadow text-primary-700' : 'text-gray-500'}`}>{t('availableExams')}</button>
        <button onClick={() => setActiveTab('reports')} className={`flex-1 py-2 text-sm rounded-md font-medium transition-all ${activeTab === 'reports' ? 'bg-white shadow text-blood-600' : 'text-gray-500'}`}>{t('myReports')}</button>
      </div>

      {activeTab === 'exams' && (
        <div className="space-y-3">
          {exams.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">{t('noExamsAvailable')}</div>
          ) : (
            exams.map((exam, idx) => {
              const isCompleted = exam.status === 'submitted' || exam.status === 'graded';
              return (
                <div key={`${exam.month_no}-${exam.year}-${idx}`} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-800">{getMonthLabel(exam.month_no)} ({exam.year})</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{exam.question_count || '?'} {t('questions')} | {exam.duration_minutes || 60} {t('minutes')}</p>
                      {exam.schedule?.exam_date && (
                        <p className="text-xs text-primary-500 mt-0.5">{new Date(exam.schedule.exam_date).toLocaleDateString()}</p>
                      )}
                    </div>
                    <div className="text-right">{getStatusBadge(exam)}</div>
                  </div>
                  <div className="mt-3">
                    {isCompleted && exam.report_id ? (
                      <button onClick={() => navigate(`/report/${exam.report_id}`)} className="w-full py-2 bg-blood-50 text-blood-600 rounded-lg text-xs font-medium hover:bg-blood-100 transition-colors">{t('viewBloodReport')}</button>
                    ) : (
                      <button onClick={() => navigate(`/exam/${exam.month_no}`)} className="w-full py-2 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors">{exam.status === 'in_progress' ? t('resumeExam') : t('startExam')}</button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">{t('noReportsYet')}</div>
          ) : (
            reports.map((rep) => (
              <div key={rep.id} onClick={() => navigate(`/report/${rep.id}`)} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:border-blood-200 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-800">{getMonthLabel(rep.month_no)} ({rep.year})</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(rep.generated_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${gradeBandColor(parseFloat(rep.percentage))}`}>{rep.percentage}%</p>
                    <p className="text-xs text-gray-400">{rep.total_marks}/{rep.max_marks}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
