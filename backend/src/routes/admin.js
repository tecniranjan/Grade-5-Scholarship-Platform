const express = require('express');
const pool = require('../../config/db');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Fixed question count for ALL grades (per Mr. Pujith's guidance)
const FIXED_QUESTION_COUNT = 50;

// ==================== QUESTIONS MANAGEMENT ====================

// GET /api/admin/questions?grade=&month_no=&nipunatha_code=
router.get('/questions', adminAuth, async (req, res) => {
  try {
    const { grade, month_no, nipunatha_code } = req.query;
    let query = `
      SELECT q.*, n.code as nipunatha_code, n.name_en as nipunatha_name, n.name_si as nipunatha_name_si
      FROM questions q
      JOIN nipunatha n ON q.nipunatha_id = n.id
      WHERE 1=1
    `;
    const params = [];

    if (grade) {
      params.push(parseInt(grade));
      query += ` AND q.grade = $${params.length}`;
    }
    if (month_no) {
      params.push(parseInt(month_no));
      query += ` AND q.month_no = $${params.length}`;
    }
    if (nipunatha_code) {
      params.push(nipunatha_code);
      query += ` AND n.code = $${params.length}`;
    }
    query += ' ORDER BY q.month_no, q.difficulty_level, n.code, q.id';

    const result = await pool.query(query, params);
    res.json({ questions: result.rows, count: result.rows.length });
  } catch (err) {
    console.error('List questions error:', err);
    res.status(500).json({ error: 'Failed to fetch questions.' });
  }
});

// POST /api/admin/questions (create with all three language fields)
router.post('/questions', adminAuth, async (req, res) => {
  try {
    const {
      nipunatha_id, grade, month_no, difficulty_level,
      question_text_si, option_a_si, option_b_si, option_c_si, option_d_si,
      question_text_ta, option_a_ta, option_b_ta, option_c_ta, option_d_ta,
      question_text_en, option_a_en, option_b_en, option_c_en, option_d_en,
      correct_answer, marks
    } = req.body;

    if (!nipunatha_id || !grade || !month_no || !question_text_si || !option_a_si || !option_b_si || !option_c_si || !option_d_si || !correct_answer) {
      return res.status(400).json({ error: 'Nipunatha, grade, month, Sinhala question text, all 4 Sinhala options, and correct answer are required.' });
    }

    const result = await pool.query(
      `INSERT INTO questions (
        nipunatha_id, grade, month_no, difficulty_level,
        question_text_si, option_a_si, option_b_si, option_c_si, option_d_si,
        question_text_ta, option_a_ta, option_b_ta, option_c_ta, option_d_ta,
        question_text_en, option_a_en, option_b_en, option_c_en, option_d_en,
        correct_answer, marks
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *`,
      [
        nipunatha_id, grade, month_no, difficulty_level || 1,
        question_text_si, option_a_si, option_b_si, option_c_si, option_d_si,
        question_text_ta || 'TRANSLATION REQUIRED', option_a_ta || 'TRANSLATION REQUIRED',
        option_b_ta || 'TRANSLATION REQUIRED', option_c_ta || 'TRANSLATION REQUIRED', option_d_ta || 'TRANSLATION REQUIRED',
        question_text_en || '', option_a_en || '', option_b_en || '', option_c_en || '', option_d_en || '',
        correct_answer, marks || 1
      ]
    );

    res.status(201).json({ question: result.rows[0] });
  } catch (err) {
    console.error('Create question error:', err);
    res.status(500).json({ error: 'Failed to create question.' });
  }
});

router.put('/questions/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;

    const allowed = [
      'question_text_si', 'option_a_si', 'option_b_si', 'option_c_si', 'option_d_si',
      'question_text_ta', 'option_a_ta', 'option_b_ta', 'option_c_ta', 'option_d_ta',
      'question_text_en', 'option_a_en', 'option_b_en', 'option_c_en', 'option_d_en',
      'correct_answer', 'marks', 'difficulty_level', 'active', 'month_no', 'nipunatha_id'
    ];

    const setClauses = [];
    const values = [];
    let paramCount = 0;

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        paramCount++;
        setClauses.push(`${key} = $${paramCount}`);
        values.push(fields[key]);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    paramCount++;
    values.push(id);
    const query = `UPDATE questions SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    res.json({ question: result.rows[0] });
  } catch (err) {
    console.error('Update question error:', err);
    res.status(500).json({ error: 'Failed to update question.' });
  }
});

router.delete('/questions/:id', adminAuth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM questions WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found.' });
    }
    res.json({ message: 'Question deleted.' });
  } catch (err) {
    console.error('Delete question error:', err);
    res.status(500).json({ error: 'Failed to delete question.' });
  }
});

// ==================== EXAM SCHEDULE MANAGEMENT ====================

router.get('/schedule', adminAuth, async (req, res) => {
  try {
    const { grade, year } = req.query;
    let query = 'SELECT * FROM exam_schedule WHERE 1=1';
    const params = [];
    if (grade) { params.push(parseInt(grade)); query += ` AND grade = $${params.length}`; }
    if (year) { params.push(parseInt(year)); query += ` AND year = $${params.length}`; }
    query += ' ORDER BY year, month_no, grade';
    const result = await pool.query(query, params);
    res.json({ schedule: result.rows });
  } catch (err) {
    console.error('List schedule error:', err);
    res.status(500).json({ error: 'Failed to fetch schedule.' });
  }
});

router.post('/schedule', adminAuth, async (req, res) => {
  try {
    const { grade, month_no, year, exam_date, start_time, end_time, notes } = req.body;
    if (!grade || !month_no || !year || !exam_date || !start_time || !end_time) {
      return res.status(400).json({ error: 'grade, month_no, year, exam_date, start_time, end_time are required.' });
    }
    const result = await pool.query(
      `INSERT INTO exam_schedule (grade, month_no, year, exam_date, start_time, end_time, question_count, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (grade, month_no, year)
       DO UPDATE SET exam_date = $4, start_time = $5, end_time = $6, question_count = $7, notes = $8
       RETURNING *`,
      [grade, month_no, year, exam_date, start_time, end_time, FIXED_QUESTION_COUNT, notes || null]
    );
    res.status(201).json({ schedule: result.rows[0] });
  } catch (err) {
    console.error('Create schedule error:', err);
    res.status(500).json({ error: 'Failed to create schedule.' });
  }
});

router.put('/schedule/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { exam_date, start_time, end_time, is_active, notes } = req.body;
    const result = await pool.query(
      `UPDATE exam_schedule SET
        exam_date = COALESCE($1, exam_date),
        start_time = COALESCE($2, start_time),
        end_time = COALESCE($3, end_time),
        is_active = COALESCE($4, is_active),
        notes = COALESCE($5, notes)
       WHERE id = $6 RETURNING *`,
      [exam_date, start_time, end_time, is_active, notes, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Schedule not found.' });
    res.json({ schedule: result.rows[0] });
  } catch (err) {
    console.error('Update schedule error:', err);
    res.status(500).json({ error: 'Failed to update schedule.' });
  }
});

// ==================== STUDENTS MANAGEMENT ====================

router.get('/students', adminAuth, async (req, res) => {
  try {
    const { grade, district, medium } = req.query;
    let query = 'SELECT id, name, grade, medium, school, district, parent_phone, parent_email, created_at FROM students WHERE 1=1';
    const params = [];
    if (grade) { params.push(parseInt(grade)); query += ` AND grade = $${params.length}`; }
    if (district) { params.push(district); query += ` AND district ILIKE $${params.length}`; }
    if (medium) { params.push(medium); query += ` AND medium = $${params.length}`; }
    query += ' ORDER BY grade, name';
    const result = await pool.query(query, params);
    res.json({ students: result.rows, count: result.rows.length });
  } catch (err) {
    console.error('List students error:', err);
    res.status(500).json({ error: 'Failed to fetch students.' });
  }
});

router.get('/students/:id/reports', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const student = await pool.query('SELECT id, name, grade, medium, school, district FROM students WHERE id = $1', [id]);
    if (student.rows.length === 0) return res.status(404).json({ error: 'Student not found.' });
    const reports = await pool.query(
      `SELECT br.*, ROUND((br.total_marks::decimal / NULLIF(br.max_marks, 0)) * 100, 2) as percentage
       FROM blood_reports br WHERE br.student_id = $1 ORDER BY br.year DESC, br.month_no DESC`,
      [id]
    );
    res.json({ student: student.rows[0], reports: reports.rows });
  } catch (err) {
    console.error('Student reports error:', err);
    res.status(500).json({ error: 'Failed to fetch student reports.' });
  }
});

// ==================== NIPUNATHA MANAGEMENT ====================

router.get('/nipunatha', adminAuth, async (req, res) => {
  try {
    const { grade } = req.query;
    let query = 'SELECT * FROM nipunatha';
    const params = [];
    if (grade) { params.push(parseInt(grade)); query += ' WHERE grade = $1'; }
    query += ' ORDER BY grade, display_order, code';
    const result = await pool.query(query, params);
    res.json({ nipunatha: result.rows });
  } catch (err) {
    console.error('List nipunatha error:', err);
    res.status(500).json({ error: 'Failed to fetch nipunatha.' });
  }
});

// ==================== DASHBOARD STATS ====================

router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const studentCount = await pool.query('SELECT COUNT(*) as count FROM students');
    const gradeBreakdown = await pool.query('SELECT grade, COUNT(*) as count FROM students GROUP BY grade ORDER BY grade');
    const mediumBreakdown = await pool.query("SELECT medium, COUNT(*) as count FROM students GROUP BY medium ORDER BY medium");
    const examCount = await pool.query("SELECT COUNT(*) as count FROM exam_sessions WHERE status IN ('submitted', 'graded')");
    const reportCount = await pool.query('SELECT COUNT(*) as count FROM blood_reports');
    const recentExams = await pool.query(
      `SELECT es.*, s.name as student_name, s.grade as student_grade, s.medium as student_medium
       FROM exam_sessions es JOIN students s ON es.student_id = s.id ORDER BY es.started_at DESC LIMIT 10`
    );
    const avgScoresByGrade = await pool.query(
      `SELECT grade, ROUND(AVG(total_marks::decimal / NULLIF(max_marks, 0) * 100), 2) as avg_percentage
       FROM blood_reports GROUP BY grade ORDER BY grade`
    );
    const questionStats = await pool.query(
      `SELECT grade, month_no, difficulty_level, COUNT(*) as count
       FROM questions WHERE active = true GROUP BY grade, month_no, difficulty_level ORDER BY grade, month_no, difficulty_level`
    );
    res.json({
      total_students: parseInt(studentCount.rows[0].count),
      grade_breakdown: gradeBreakdown.rows,
      medium_breakdown: mediumBreakdown.rows,
      total_exams_completed: parseInt(examCount.rows[0].count),
      total_reports: parseInt(reportCount.rows[0].count),
      recent_exams: recentExams.rows,
      avg_scores_by_grade: avgScoresByGrade.rows,
      question_stats: questionStats.rows
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
});

module.exports = router;
