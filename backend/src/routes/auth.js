const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../../config/db');
const { generateToken, studentAuth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// ==================== STUDENT AUTH ====================

// POST /api/auth/student/register
router.post('/student/register', async (req, res) => {
  try {
    const { name, grade, medium, school, district, parent_phone, parent_email, password } = req.body;

    if (!name || !grade || !school || !district || !parent_phone || !password) {
      return res.status(400).json({ error: 'All required fields must be provided.' });
    }

    if (![3, 4, 5].includes(parseInt(grade))) {
      return res.status(400).json({ error: 'Grade must be 3, 4, or 5.' });
    }

    const studentMedium = ['SI', 'TA', 'EN'].includes(medium) ? medium : 'SI';

    // Check for existing student by phone + grade
    const existing = await pool.query(
      'SELECT id FROM students WHERE parent_phone = $1 AND grade = $2',
      [parent_phone, grade]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A student with this phone number is already registered for this grade.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO students (name, grade, medium, school, district, parent_phone, parent_email, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, grade, medium`,
      [name, parseInt(grade), studentMedium, school, district, parent_phone, parent_email || null, password_hash]
    );

    const student = result.rows[0];
    const token = generateToken({
      id: student.id, name: student.name, grade: student.grade, medium: student.medium, role: 'student'
    });

    res.status(201).json({
      message: 'Student registered successfully.',
      student: { id: student.id, name: student.name, grade: student.grade, medium: student.medium },
      token
    });
  } catch (err) {
    console.error('Student register error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// POST /api/auth/student/login
router.post('/student/login', async (req, res) => {
  try {
    const { parent_phone, password, grade } = req.body;

    if (!parent_phone || !password) {
      return res.status(400).json({ error: 'Phone number and password are required.' });
    }

    let query = 'SELECT * FROM students WHERE parent_phone = $1';
    const params = [parent_phone];
    if (grade) {
      query += ' AND grade = $2';
      params.push(parseInt(grade));
    }

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const student = result.rows[0];
    const validPassword = await bcrypt.compare(password, student.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken({
      id: student.id, name: student.name, grade: student.grade, medium: student.medium, role: 'student'
    });

    res.json({
      message: 'Login successful.',
      student: { id: student.id, name: student.name, grade: student.grade, medium: student.medium, school: student.school },
      token
    });
  } catch (err) {
    console.error('Student login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// GET /api/auth/student/profile
router.get('/student/profile', studentAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, grade, medium, school, district, parent_phone, parent_email, created_at FROM students WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    res.json({ student: result.rows[0] });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// ==================== ADMIN AUTH ====================

// POST /api/auth/admin/login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const result = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const admin = result.rows[0];
    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken({ id: admin.id, username: admin.username, role: 'admin' });

    res.json({
      message: 'Admin login successful.',
      admin: { id: admin.id, username: admin.username, role: admin.role },
      token
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

module.exports = router;
