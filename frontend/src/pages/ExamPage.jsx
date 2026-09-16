import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/client';

export default function ExamPage() {
  const { scheduleId } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    startExam();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  async function startExam() {
    try {
      const res = await api.post('/exam/start', { month_no: parseInt(scheduleId) });
      const data = res.data;
      setSessionId(data.session_id);
      setQuestions(data.questions || []);
      setTimeLeft(data.time_remaining_seconds || 3600);
      if (data.saved_answers) {
        if (Array.isArray(data.saved_answers)) {
          const saved = {};
          data.saved_answers.forEach((a) => { saved[a.question_id] = a.selected_answer; });
          setAnswers(saved);
        } else {
          setAnswers(data.saved_answers);
        }
      }
      setLoading(false);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Exam start error:', err);
      setLoading(false);
    }
  }

  const saveAnswer = useCallback(async (questionId, option) => {
    if (!sessionId) return;
    try {
      await api.post('/exam/save-answer', { session_id: sessionId, question_id: questionId, selected_answer: option });
    } catch (err) { console.error('Save answer error:', err); }
  }, [sessionId]);

  function selectOption(questionId, option) {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
    saveAnswer(questionId, option);
  }

  async function handleSubmit(auto = false) {
    if (!auto) { if (!window.confirm(t('confirmSubmit'))) return; }
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const res = await api.post('/exam/submit', { session_id: sessionId });
      setResult(res.data);
    } catch (err) { console.error('Submit error:', err); } finally { setSubmitting(false); }
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  if (loading) {
    return (<div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>);
  }

  if (result) {
    return (
      <div className="container-mobile py-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">{t('examCompleted')}</h2>
          <p className="text-3xl font-bold text-primary-600 my-3">{result.total_marks}/{result.max_marks}</p>
          <p className="text-sm text-gray-500 mb-4">{result.percentage}%</p>
          <button onClick={() => navigate(`/report/${result.report_id}`)} className="w-full py-3 bg-gradient-to-r from-blood-500 to-blood-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all">{t('viewBloodReport')}</button>
          <button onClick={() => navigate('/dashboard')} className="w-full py-2 mt-2 text-gray-500 text-sm hover:text-gray-700">{t('backToDashboard')}</button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  if (!q) return <div className="text-center py-10 text-gray-400">No questions loaded</div>;

  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="container-mobile py-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-500 font-medium">{currentIdx + 1} {t('of')} {totalQ}</span>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${timeLeft < 300 ? 'bg-blood-100 text-blood-700 animate-pulse' : 'bg-primary-100 text-primary-700'}`}>{t('timeRemaining')}: {formatTime(timeLeft)}</div>
      </div>

      <div className="w-full h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary-500 to-blood-500 rounded-full transition-all duration-300" style={{ width: `${((currentIdx + 1) / totalQ) * 100}%` }}></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
        {q.image_url && (<img src={q.image_url} alt="Question" className="w-full rounded-lg mb-3 max-h-48 object-contain bg-gray-50" />)}
        <p className="text-sm text-gray-800 font-medium leading-relaxed">{q.question_text}</p>
      </div>

      <div className="space-y-2 mb-4">
        {['A', 'B', 'C', 'D'].map((opt) => {
          const optText = q[`option_${opt.toLowerCase()}`];
          if (!optText) return null;
          const selected = answers[q.id] === opt;
          return (
            <button key={opt} onClick={() => selectOption(q.id, opt)} className={`w-full p-3 rounded-xl text-left text-sm font-medium transition-all flex items-center gap-3 ${selected ? 'bg-primary-600 text-white shadow-md scale-[1.01]' : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${selected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{opt}</span>
              {optText}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium disabled:opacity-30">{t('previous')}</button>
        {currentIdx < totalQ - 1 ? (
          <button onClick={() => setCurrentIdx(currentIdx + 1)} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">{t('next')}</button>
        ) : (
          <button onClick={() => handleSubmit(false)} disabled={submitting} className="flex-1 py-2.5 bg-gradient-to-r from-blood-500 to-blood-700 text-white rounded-lg text-sm font-medium shadow disabled:opacity-50">{submitting ? '...' : t('submit')}</button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
        {questions.map((_, i) => (
          <button key={i} onClick={() => setCurrentIdx(i)} className={`w-7 h-7 rounded-full text-[10px] font-bold transition-all ${i === currentIdx ? 'bg-primary-600 text-white scale-110' : answers[questions[i]?.id] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>{i + 1}</button>
        ))}
      </div>

      <div className="text-center mt-3 text-xs text-gray-400">{t('answered')}: {answeredCount}/{totalQ} | {t('unanswered')}: {totalQ - answeredCount}</div>
    </div>
  );
}
