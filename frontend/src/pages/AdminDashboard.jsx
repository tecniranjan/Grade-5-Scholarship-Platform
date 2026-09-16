import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/client';

export default function AdminDashboard() {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState('schedule');
  const [schedules, setSchedules] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const [schedForm, setSchedForm] = useState({
    grade: 5, month_no: 1, year: new Date().getFullYear(),
    exam_date: '', start_time: '', end_time: '', notes: '',
  });
  const [schedMsg, setSchedMsg] = useState('');

  const [qForm, setQForm] = useState({
    nipunatha_id: '', month_no: 1, grade: 5, difficulty_level: 1,
    question_text_si: '', option_a_si: '', option_b_si: '', option_c_si: '', option_d_si: '',
    question_text_ta: '', option_a_ta: '', option_b_ta: '', option_c_ta: '', option_d_ta: '',
    question_text_en: '', option_a_en: '', option_b_en: '', option_c_en: '', option_d_en: '',
    correct_answer: 'A', marks: 1,
  });
  const [qMsg, setQMsg] = useState('');
  const [nipunathas, setNipunathas] = useState([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [schedRes, studRes, nipRes, statsRes] = await Promise.all([
        api.get('/admin/schedule'), api.get('/admin/students'),
        api.get('/admin/nipunatha'), api.get('/admin/dashboard'),
      ]);
      setSchedules(schedRes.data.schedule || []);
      setStudents(studRes.data.students || []);
      setNipunathas(nipRes.data.nipunatha || []);
      setStats(statsRes.data || {});
      if (nipRes.data.nipunatha?.length > 0) {
        setQForm((f) => ({ ...f, nipunatha_id: nipRes.data.nipunatha[0].id }));
      }
    } catch (err) { console.error('Admin load error:', err); }
    finally { setLoading(false); }
  }

  async function createSchedule(e) {
    e.preventDefault(); setSchedMsg('');
    try {
      await api.post('/admin/schedule', schedForm);
      setSchedMsg('Schedule created!');
      const r = await api.get('/admin/schedule');
      setSchedules(r.data.schedule || []);
    } catch (err) { setSchedMsg(err.response?.data?.error || 'Failed'); }
  }

  async function addQuestion(e) {
    e.preventDefault(); setQMsg('');
    try {
      await api.post('/admin/questions', qForm);
      setQMsg('Question added!');
      setQForm((f) => ({ ...f,
        question_text_si: '', option_a_si: '', option_b_si: '', option_c_si: '', option_d_si: '',
        question_text_ta: '', option_a_ta: '', option_b_ta: '', option_c_ta: '', option_d_ta: '',
        question_text_en: '', option_a_en: '', option_b_en: '', option_c_en: '', option_d_en: '',
      }));
    } catch (err) { setQMsg(err.response?.data?.error || 'Failed'); }
  }

  if (loading) {
    return (<div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>);
  }

  return (
    <div className="container-mobile py-4">
      <h1 className="text-lg font-bold text-gray-800 mb-4">Admin Panel</h1>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-primary-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-primary-700">{stats.total_students || 0}</p><p className="text-[10px] text-gray-500">Students</p></div>
        <div className="bg-blood-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-blood-700">{stats.total_exams_completed || 0}</p><p className="text-[10px] text-gray-500">Exams Done</p></div>
        <div className="bg-green-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-green-700">{stats.total_reports || 0}</p><p className="text-[10px] text-gray-500">Reports</p></div>
      </div>
      <div className="flex mb-4 bg-gray-100 rounded-lg p-1 text-xs">
        {['schedule', 'questions', 'students'].map((tb) => (<button key={tb} onClick={() => setTab(tb)} className={`flex-1 py-2 rounded-md font-medium transition-all capitalize ${tab === tb ? 'bg-white shadow text-primary-700' : 'text-gray-500'}`}>{tb}</button>))}
      </div>
      {tab === 'schedule' && (<div><form onSubmit={createSchedule} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-4 space-y-3"><h3 className="text-sm font-bold">Create Exam Schedule</h3>{schedMsg && <p className="text-xs text-green-600">{schedMsg}</p>}<div className="grid grid-cols-2 gap-2"><select value={schedForm.grade} onChange={(e) => setSchedForm({ ...schedForm, grade: parseInt(e.target.value) })} className="px-2 py-2 border border-gray-200 rounded-lg text-xs"><option value={3}>Grade 3</option><option value={4}>Grade 4</option><option value={5}>Grade 5</option></select><input type="number" placeholder="Month No" value={schedForm.month_no} onChange={(e) => setSchedForm({ ...schedForm, month_no: parseInt(e.target.value) })} className="px-2 py-2 border border-gray-200 rounded-lg text-xs" min="1" max="12" /></div><input type="number" placeholder="Year" value={schedForm.year} onChange={(e) => setSchedForm({ ...schedForm, year: parseInt(e.target.value) })} className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs" /><input type="date" value={schedForm.exam_date} onChange={(e) => setSchedForm({ ...schedForm, exam_date: e.target.value })} className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs" /><div className="grid grid-cols-2 gap-2"><input type="time" value={schedForm.start_time} placeholder="Start" onChange={(e) => setSchedForm({ ...schedForm, start_time: e.target.value })} className="px-2 py-2 border border-gray-200 rounded-lg text-xs" /><input type="time" value={schedForm.end_time} placeholder="End" onChange={(e) => setSchedForm({ ...schedForm, end_time: e.target.value })} className="px-2 py-2 border border-gray-200 rounded-lg text-xs" /></div><input type="text" value={schedForm.notes} placeholder="Notes (optional)" onChange={(e) => setSchedForm({ ...schedForm, notes: e.target.value })} className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs" /><button type="submit" className="w-full py-2 bg-primary-600 text-white rounded-lg text-xs font-medium">Create Schedule</button></form><div className="space-y-2">{schedules.map((s) => (<div key={s.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 text-xs"><div className="flex justify-between"><span className="font-medium">Grade {s.grade} | Month {s.month_no} ({s.year})</span><span className={`px-1.5 py-0.5 rounded ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></div>{s.exam_date && <p className="text-gray-400 mt-1">{new Date(s.exam_date).toLocaleDateString()} | {s.start_time?.slice(0,5)} - {s.end_time?.slice(0,5)}</p>}{s.notes && <p className="text-gray-400 mt-0.5 italic">{s.notes}</p>}</div>))}</div></div>)}
      {tab === 'questions' && (<form onSubmit={addQuestion} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 space-y-3"><h3 className="text-sm font-bold">Add Question</h3>{qMsg && <p className="text-xs text-green-600">{qMsg}</p>}<select value={qForm.nipunatha_id} onChange={(e) => setQForm({ ...qForm, nipunatha_id: parseInt(e.target.value) })} className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs">{nipunathas.map((n) => (<option key={n.id} value={n.id}>{lang === 'SI' ? n.name_si : lang === 'TA' ? n.name_ta : n.name_en} ({n.code})</option>))}</select><div className="grid grid-cols-3 gap-2"><select value={qForm.grade} onChange={(e) => setQForm({ ...qForm, grade: parseInt(e.target.value) })} className="px-2 py-2 border border-gray-200 rounded-lg text-xs"><option value={3}>Gr 3</option><option value={4}>Gr 4</option><option value={5}>Gr 5</option></select><input type="number" value={qForm.month_no} onChange={(e) => setQForm({ ...qForm, month_no: parseInt(e.target.value) })} className="px-2 py-2 border border-gray-200 rounded-lg text-xs" min="1" max="12" placeholder="Month" /><select value={qForm.difficulty_level} onChange={(e) => setQForm({ ...qForm, difficulty_level: parseInt(e.target.value) })} className="px-2 py-2 border border-gray-200 rounded-lg text-xs"><option value={1}>Easy</option><option value={2}>Medium</option><option value={3}>Hard</option></select></div><div className="border-l-2 border-primary-400 pl-2 space-y-1"><p className="text-xs font-bold text-primary-700">Sinhala (Required)</p><textarea value={qForm.question_text_si} onChange={(e) => setQForm({ ...qForm, question_text_si: e.target.value })} className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs" rows="2" placeholder="Question text (Sinhala)" required />{['a','b','c','d'].map((opt) => (<input key={opt} type="text" value={qForm[`option_${opt}_si`]} onChange={(e) => setQForm({ ...qForm, [`option_${opt}_si`]: e.target.value })} className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs" placeholder={`Option ${opt.toUpperCase()} (Sinhala)`} required />))}</div><div className="border-l-2 border-yellow-400 pl-2 space-y-1"><p className="text-xs font-bold text-yellow-700">Tamil (Optional)</p><textarea value={qForm.question_text_ta} onChange={(e) => setQForm({ ...qForm, question_text_ta: e.target.value })} className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs" rows="2" placeholder="Question text (Tamil)" />{['a','b','c','d'].map((opt) => (<input key={opt} type="text" value={qForm[`option_${opt}_ta`]} onChange={(e) => setQForm({ ...qForm, [`option_${opt}_ta`]: e.target.value })} className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs" placeholder={`Option ${opt.toUpperCase()} (Tamil)`} />))}</div><div className="border-l-2 border-blue-400 pl-2 space-y-1"><p className="text-xs font-bold text-blue-700">English (Optional)</p><textarea value={qForm.question_text_en} onChange={(e) => setQForm({ ...qForm, question_text_en: e.target.value })} className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs" rows="2" placeholder="Question text (English)" />{['a','b','c','d'].map((opt) => (<input key={opt} type="text" value={qForm[`option_${opt}_en`]} onChange={(e) => setQForm({ ...qForm, [`option_${opt}_en`]: e.target.value })} className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs" placeholder={`Option ${opt.toUpperCase()} (English)`} />))}</div><div className="grid grid-cols-2 gap-2"><select value={qForm.correct_answer} onChange={(e) => setQForm({ ...qForm, correct_answer: e.target.value })} className="px-2 py-2 border border-gray-200 rounded-lg text-xs"><option value="A">Correct: A</option><option value="B">Correct: B</option><option value="C">Correct: C</option><option value="D">Correct: D</option></select><input type="number" value={qForm.marks} onChange={(e) => setQForm({ ...qForm, marks: parseInt(e.target.value) })} className="px-2 py-2 border border-gray-200 rounded-lg text-xs" min="1" placeholder="Marks" /></div><button type="submit" className="w-full py-2 bg-primary-600 text-white rounded-lg text-xs font-medium">Add Question</button></form>)}
      {tab === 'students' && (<div className="space-y-2">{students.length === 0 ? (<div className="text-center py-8 text-gray-400 text-sm">No students registered yet</div>) : (students.map((s) => (<div key={s.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100"><div className="flex justify-between items-center"><div><p className="text-sm font-medium text-gray-800">{s.name}</p><p className="text-xs text-gray-400">Grade {s.grade} | {s.medium} | {s.district || 'N/A'}</p></div><div className="text-right"><p className="text-xs text-gray-500">{s.parent_phone}</p></div></div></div>)))}</div>)}
    </div>
  );
}