const express = require('express');
const pool = require('../../config/db');
const { studentAuth } = require('../middleware/auth');

const router = express.Router();

const EXAM_DURATION_SECONDS = {
  3: 2400,  // 40 minutes for Grade 3
  4: 3000,  // 50 minutes for Grade 4
  5: 3600,  // 60 minutes for Grade 5
};

// Fisher-Yates shuffle — produces a SCATTERED question order
function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Medium suffix for selecting the right language columns
function mediumSuffix(medium) {
  if (medium === 'TA') return '_ta';
  if (medium === 'EN') return '_en';
  return '_si';
}

// GET /api/exam/schedule
// Get exam schedule for the student's grade
router.get('/schedule', studentAuth, async (req, res) => {
  try {
    const { grade } = req.user;
    const result = await pool.query(
      `SELECT * FROM exam_schedule WHERE grade = $1 AND is_active = true ORDER BY year, month_no`,
      [grade]
    );
    res.json({ schedule: result.rows });
  } catch (err) {
    console.error('Schedule fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch schedule.' });
  }
});

// GET /api/exam/available
// Lists available exams for the student's grade
router.get('/available', studentAuth, async (req, res) => {
  try {
    const { grade, id: studentId } = req.user;
    const currentYear = new Date().getFullYear();

    // Get all months that have questions for this grade
    const monthsWithQuestions = await pool.query(
      `SELECT DISTINCT month_no FROM questions WHERE grade = $1 AND active = true ORDER BY month_no`,
      [grade]
    );

    // Get exam schedule
    const schedules = await pool.query(
      `SELECT month_no, year, exam_date, start_time, end_time FROM exam_schedule
       WHERE grade = $1 AND year = $2 AND is_active = true`,
      [grade, currentYear]
    );
    const scheduleMap = {};
    schedules.rows.forEach(s => {
      scheduleMap[`${s.month_no}-${s.year}`] = s;
    });

    // Get completed sessions
    const completedSessions = await pool.query(
      `SELECT month_no, year, status FROM exam_sessions
       WHERE student_id = $1 AND grade = $2 AND year = $3`,
      [studentId, grade, currentYear]
    );
    const completedMap = {};
    completedSessions.rows.forEach(s => {
      completedMap[`${s.month_no}-${s.year}`] = s.status;
    });

    const questionCounts = { 3: 40, 4: 50, 5: 60 };

    const available = monthsWithQuestions.rows.map(row => {
      const key = `${row.month_no}-${currentYear}`;
      const schedule = scheduleMap[key] || null;
      return {
        month_no: row.month_no,
        year: currentYear,
        status: completedMap[key] || 'not_started',
        question_count: questionCounts[grade] || 60,
        duration_minutes: EXAM_DURATION_SECONDS[grade] / 60,
        schedule: schedule ? {
          exam_date: schedule.exam_date,
          start_time: schedule.start_time,
          end_time: schedule.end_time
        } : null
      };
    });

    res.json({ exams: available });
  } catch (err) {
    console.error('Available exams error:', err);
    res.status(500).json({ error: 'Failed to fetch available exams.' });
  }
});

// POST /api/exam/start
// Start a new exam session — questions delivered SCATTERED (randomised), NOT grouped by Nipunatha
router.post('/start', studentAuth, async (req, res) => {
  try {
    const { month_no } = req.body;
    const { grade, id: studentId, medium } = req.user;
    const year = new Date().getFullYear();
    const studentMedium = medium || 'SI';

    if (!month_no) {
      return res.status(400).json({ error: 'month_no is required.' });
    }

    // Check exam schedule (if one exists, enforce the time window)
    const scheduleCheck = await pool.query(
      `SELECT * FROM exam_schedule WHERE grade = $1 AND month_no = $2 AND year = $3 AND is_active = true`,
      [grade, month_no, year]
    );
    if (scheduleCheck.rows.length > 0) {
      const sched = scheduleCheck.rows[0];
      const now = new Date();
      const examDate = new Date(sched.exam_date);
      const todayStr = now.toISOString().split('T')[0];
      const examDateStr = examDate.toISOString().split('T')[0];

      if (todayStr === examDateStr) {
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM
        if (currentTime < sched.start_time.slice(0, 5) || currentTime > sched.end_time.slice(0, 5)) {
          return res.status(403).json({
            error: `This exam is scheduled from ${sched.start_time.slice(0, 5)} to ${sched.end_time.slice(0, 5)}. Please try during the scheduled time.`
          });
        }
      }
      // If not the exam date, allow access (practice mode or flexible scheduling)
    }

    // Check if already has a session
    const existingSession = await pool.query(
      `SELECT * FROM exam_sessions WHERE student_id = $1 AND grade = $2 AND month_no = $3 AND year = $4`,
      [studentId, grade, month_no, year]
    );

    if (existingSession.rows.length > 0) {
      const session = existingSession.rows[0];
      if (session.status === 'submitted' || session.status === 'graded') {
        return res.status(409).json({ error: 'You have already completed this exam.' });
      }
      if (session.status === 'in_progress') {
        // Resume: serve questions in the SAME randomised order stored at creation
        const questions = await getSessionQuestionsFromOrder(session.question_order, studentMedium);
        const savedAnswers = await getSavedAnswers(session.id);
        return res.json({
          session_id: session.id,
          time_remaining_seconds: session.time_remaining_seconds,
          questions,
          saved_answers: savedAnswers,
          resumed: true
        });
      }
    }

    // Fetch all questions for this grade + month
    const questionsResult = await pool.query(
      `SELECT q.id, q.nipunatha_id, q.marks, q.difficulty_level,
              n.code as nipunatha_code, n.name_en as nipunatha_name
       FROM questions q
       JOIN nipunatha n ON q.nipunatha_id = n.id
       WHERE q.grade = $1 AND q.month_no = $2 AND q.active = true
       ORDER BY q.id`,
      [grade, month_no]
    );

    if (questionsResult.rows.length === 0) {
      return res.status(404).json({ error: 'No questions available for this month.' });
    }

    // SCATTER: randomise question order (not grouped by Nipunatha)
    const questionIds = questionsResult.rows.map(q => q.id);
    const shuffledIds = shuffleArray(questionIds);

    const durationSeconds = EXAM_DURATION_SECONDS[grade] || 3600;

    // Create session with the locked-in random order
    const sessionResult = await pool.query(
      `INSERT INTO exam_sessions (student_id, grade, month_no, year, medium, question_order, time_remaining_seconds)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [studentId, grade, month_no, year, studentMedium, JSON.stringify(shuffledIds), durationSeconds]
    );

    const sessionId = sessionResult.rows[0].id;

    // Serve questions in the shuffled order, in the student's medium
    const questions = await getSessionQuestionsFromOrder(shuffledIds, studentMedium);

    res.status(201).json({
      session_id: sessionId,
      time_remaining_seconds: durationSeconds,
      questions,
      saved_answers: {},
      resumed: false
    });
  } catch (err) {
    console.error('Start exam error:', err);
    res.status(500).json({ error: 'Failed to start exam.' });
  }
});

// POST /api/exam/save-answer
router.post('/save-answer', studentAuth, async (req, res) => {
  try {
    const { session_id, question_id, selected_answer } = req.body;

    if (!session_id || !question_id || !selected_answer) {
      return res.status(400).json({ error: 'session_id, question_id, and selected_answer are required.' });
    }

    if (!['A', 'B', 'C', 'D'].includes(selected_answer)) {
      return res.status(400).json({ error: 'selected_answer must be A, B, C, or D.' });
    }

    // Verify session belongs to student and is in_progress
    const session = await pool.query(
      'SELECT * FROM exam_sessions WHERE id = $1 AND student_id = $2 AND status = $3',
      [session_id, req.user.id, 'in_progress']
    );
    if (session.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid or expired session.' });
    }

    // Upsert answer
    await pool.query(
      `INSERT INTO answers (session_id, question_id, selected_answer)
       VALUES ($1, $2, $3)
       ON CONFLICT (session_id, question_id)
       DO UPDATE SET selected_answer = $3, answered_at = NOW()`,
      [session_id, question_id, selected_answer]
    );

    res.json({ message: 'Answer saved.' });
  } catch (err) {
    console.error('Save answer error:', err);
    res.status(500).json({ error: 'Failed to save answer.' });
  }
});

// POST /api/exam/save-timer
router.post('/save-timer', studentAuth, async (req, res) => {
  try {
    const { session_id, time_remaining_seconds } = req.body;

    if (!session_id || time_remaining_seconds === undefined) {
      return res.status(400).json({ error: 'session_id and time_remaining_seconds are required.' });
    }

    await pool.query(
      `UPDATE exam_sessions SET time_remaining_seconds = $1
       WHERE id = $2 AND student_id = $3 AND status = 'in_progress'`,
      [Math.max(0, time_remaining_seconds), session_id, req.user.id]
    );

    res.json({ message: 'Timer saved.' });
  } catch (err) {
    console.error('Save timer error:', err);
    res.status(500).json({ error: 'Failed to save timer.' });
  }
});

// POST /api/exam/submit
// Submit exam — auto-grade and generate per-Nipunatha blood report
router.post('/submit', studentAuth, async (req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required.' });
    }

    const sessionResult = await pool.query(
      'SELECT * FROM exam_sessions WHERE id = $1 AND student_id = $2',
      [session_id, req.user.id]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const session = sessionResult.rows[0];
    if (session.status === 'submitted' || session.status === 'graded') {
      return res.status(409).json({ error: 'This exam has already been submitted.' });
    }

    // Grade all answers
    const answersResult = await pool.query(
      `SELECT a.id as answer_id, a.question_id, a.selected_answer, q.correct_answer, q.marks
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       WHERE a.session_id = $1`,
      [session_id]
    );

    let totalMarks = 0;
    for (const answer of answersResult.rows) {
      const isCorrect = answer.selected_answer === answer.correct_answer;
      const marksObtained = isCorrect ? answer.marks : 0;
      totalMarks += marksObtained;

      await pool.query(
        'UPDATE answers SET is_correct = $1, marks_obtained = $2 WHERE id = $3',
        [isCorrect, marksObtained, answer.answer_id]
      );
    }

    // Calculate max marks for this grade
    const maxMarksResult = await pool.query(
      'SELECT SUM(max_marks_per_paper) as max_marks FROM nipunatha WHERE grade = $1',
      [session.grade]
    );
    const maxMarks = parseInt(maxMarksResult.rows[0].max_marks) || 60;

    // Update session
    await pool.query(
      `UPDATE exam_sessions SET status = 'submitted', submitted_at = NOW(), time_remaining_seconds = 0
       WHERE id = $1`,
      [session_id]
    );

    // Generate blood report
    const reportResult = await pool.query(
      `INSERT INTO blood_reports (student_id, grade, month_no, year, total_marks, max_marks)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (student_id, grade, month_no, year)
       DO UPDATE SET total_marks = $5, max_marks = $6, generated_at = NOW()
       RETURNING id`,
      [req.user.id, session.grade, session.month_no, session.year, totalMarks, maxMarks]
    );

    const reportId = reportResult.rows[0].id;

    // Calculate per-Nipunatha scores (the blood-report breakdown)
    // Questions were served scattered, but we collect marks back into 14 Nipunatha profiles
    const nipunathaScores = await pool.query(
      `SELECT n.id as nipunatha_id, n.code, n.name_en, n.max_marks_per_paper,
              COALESCE(SUM(a.marks_obtained), 0) as marks_obtained
       FROM nipunatha n
       LEFT JOIN questions q ON q.nipunatha_id = n.id AND q.grade = $1 AND q.month_no = $2 AND q.active = true
       LEFT JOIN answers a ON a.question_id = q.id AND a.session_id = $3
       WHERE n.grade = $1
       GROUP BY n.id, n.code, n.name_en, n.max_marks_per_paper
       ORDER BY n.code`,
      [session.grade, session.month_no, session_id]
    );

    // Insert nipunatha scores
    for (const ns of nipunathaScores.rows) {
      const percentage = ns.max_marks_per_paper > 0
        ? ((ns.marks_obtained / ns.max_marks_per_paper) * 100).toFixed(2)
        : 0;

      await pool.query(
        `INSERT INTO nipunatha_scores (report_id, nipunatha_id, marks_obtained, max_marks, percentage)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (report_id, nipunatha_id)
         DO UPDATE SET marks_obtained = $3, max_marks = $4, percentage = $5`,
        [reportId, ns.nipunatha_id, ns.marks_obtained, ns.max_marks_per_paper, percentage]
      );
    }

    // Update session to graded
    await pool.query("UPDATE exam_sessions SET status = 'graded' WHERE id = $1", [session_id]);

    res.json({
      message: 'Exam submitted and graded.',
      report_id: reportId,
      total_marks: totalMarks,
      max_marks: maxMarks,
      percentage: ((totalMarks / maxMarks) * 100).toFixed(2)
    });
  } catch (err) {
    console.error('Submit exam error:', err);
    res.status(500).json({ error: 'Failed to submit exam.' });
  }
});

// ==================== HELPERS ====================

// Serve questions in the stored random order, in the student's language
async function getSessionQuestionsFromOrder(questionOrder, medium) {
  const ids = typeof questionOrder === 'string' ? JSON.parse(questionOrder) : questionOrder;
  if (!ids || ids.length === 0) return [];

  const sfx = mediumSuffix(medium);

  const result = await pool.query(
    `SELECT q.id,
            q.question_text${sfx} as question_text,
            q.option_a${sfx} as option_a,
            q.option_b${sfx} as option_b,
            q.option_c${sfx} as option_c,
            q.option_d${sfx} as option_d,
            q.marks, q.difficulty_level,
            n.code as nipunatha_code, n.name_en as nipunatha_name
     FROM questions q
     JOIN nipunatha n ON q.nipunatha_id = n.id
     WHERE q.id = ANY($1)`,
    [ids]
  );

  // Re-order by the shuffled order
  const questionMap = {};
  result.rows.forEach(q => { questionMap[q.id] = q; });

  return ids.map((id, idx) => {
    const q = questionMap[id];
    if (!q) return null;
    return {
      id: q.id,
      number: idx + 1,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      marks: q.marks,
      difficulty_level: q.difficulty_level,
      // Nipunatha code hidden from student during exam (they see a normal mixed paper)
      // but we include it here for potential review-mode usage
    };
  }).filter(Boolean);
}

function mediumSuffix(medium) {
  if (medium === 'TA') return '_ta';
  if (medium === 'EN') return '_en';
  return '_si';
}

async function getSavedAnswers(sessionId) {
  const result = await pool.query(
    'SELECT question_id, selected_answer FROM answers WHERE session_id = $1',
    [sessionId]
  );
  const map = {};
  result.rows.forEach(a => { map[a.question_id] = a.selected_answer; });
  return map;
}

module.exports = router;
