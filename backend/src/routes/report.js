const express = require('express');
const pool = require('../../config/db');
const { studentAuth } = require('../middleware/auth');
const { generateReportPDF } = require('../services/pdfGenerator');

const router = express.Router();

// GET /api/report/list
// List all blood reports for the logged-in student
router.get('/list', studentAuth, async (req, res) => {
  try {
    const reports = await pool.query(
      `SELECT br.id, br.grade, br.month_no, br.year, br.total_marks, br.max_marks,
              br.generated_at, br.pdf_url,
              ROUND((br.total_marks::decimal / NULLIF(br.max_marks, 0)) * 100, 2) as percentage
       FROM blood_reports br
       WHERE br.student_id = $1
       ORDER BY br.year DESC, br.month_no DESC`,
      [req.user.id]
    );

    res.json({ reports: reports.rows });
  } catch (err) {
    console.error('List reports error:', err);
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
});

// GET /api/report/:id
// Get detailed blood report with nipunatha breakdown
router.get('/:id', studentAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get main report
    const reportResult = await pool.query(
      `SELECT br.*, s.name as student_name, s.school, s.district
       FROM blood_reports br
       JOIN students s ON br.student_id = s.id
       WHERE br.id = $1 AND br.student_id = $2`,
      [id, req.user.id]
    );

    if (reportResult.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const report = reportResult.rows[0];

    // Get nipunatha scores
    const scoresResult = await pool.query(
      `SELECT ns.*, n.code, n.name_en, n.name_si
       FROM nipunatha_scores ns
       JOIN nipunatha n ON ns.nipunatha_id = n.id
       WHERE ns.report_id = $1
       ORDER BY n.code`,
      [id]
    );

    const scores = scoresResult.rows;

    // Get previous month report for trend comparison
    let previousReport = null;
    if (report.month_no > 1) {
      const prevResult = await pool.query(
        `SELECT br.total_marks, br.max_marks FROM blood_reports br
         WHERE br.student_id = $1 AND br.grade = $2 AND br.month_no = $3 AND br.year = $4`,
        [req.user.id, report.grade, report.month_no - 1, report.year]
      );
      if (prevResult.rows.length > 0) {
        previousReport = prevResult.rows[0];
      }
    }

    // Calculate grade band
    const percentage = (report.total_marks / report.max_marks) * 100;
    let gradeBand;
    if (percentage >= 75) gradeBand = 'A - Excellent';
    else if (percentage >= 65) gradeBand = 'B - Very Good';
    else if (percentage >= 50) gradeBand = 'C - Good';
    else if (percentage >= 35) gradeBand = 'D - Satisfactory';
    else gradeBand = 'E - Needs Improvement';

    res.json({
      report: {
        ...report,
        percentage: percentage.toFixed(2),
        grade_band: gradeBand
      },
      nipunatha_scores: scores,
      previous_report: previousReport,
      chart_data: {
        labels: scores.map(s => s.code),
        names: scores.map(s => s.name_en),
        obtained: scores.map(s => s.marks_obtained),
        max: scores.map(s => s.max_marks),
        percentages: scores.map(s => parseFloat(s.percentage))
      }
    });
  } catch (err) {
    console.error('Get report error:', err);
    res.status(500).json({ error: 'Failed to fetch report.' });
  }
});

// GET /api/report/:id/pdf
// Generate and download PDF blood report
router.get('/:id/pdf', studentAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch report data
    const reportResult = await pool.query(
      `SELECT br.*, s.name as student_name, s.school, s.district, s.grade
       FROM blood_reports br
       JOIN students s ON br.student_id = s.id
       WHERE br.id = $1 AND br.student_id = $2`,
      [id, req.user.id]
    );

    if (reportResult.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const report = reportResult.rows[0];

    // Get nipunatha scores
    const scoresResult = await pool.query(
      `SELECT ns.*, n.code, n.name_en, n.name_si
       FROM nipunatha_scores ns
       JOIN nipunatha n ON ns.nipunatha_id = n.id
       WHERE ns.report_id = $1
       ORDER BY n.code`,
      [id]
    );

    const pdfBuffer = await generateReportPDF(report, scoresResult.rows);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=BloodReport_${report.student_name}_M${report.month_no}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF.' });
  }
});

// GET /api/report/trend/:grade
// Get multi-month trend data for charts
router.get('/trend/:grade', studentAuth, async (req, res) => {
  try {
    const { grade } = req.params;

    const reports = await pool.query(
      `SELECT month_no, year, total_marks, max_marks,
              ROUND((total_marks::decimal / NULLIF(max_marks, 0)) * 100, 2) as percentage
       FROM blood_reports
       WHERE student_id = $1 AND grade = $2
       ORDER BY year, month_no`,
      [req.user.id, parseInt(grade)]
    );

    // Get per-nipunatha trend
    const nipunathaTrend = await pool.query(
      `SELECT br.month_no, br.year, n.code, n.name_en, ns.marks_obtained, ns.max_marks, ns.percentage
       FROM blood_reports br
       JOIN nipunatha_scores ns ON ns.report_id = br.id
       JOIN nipunatha n ON ns.nipunatha_id = n.id
       WHERE br.student_id = $1 AND br.grade = $2
       ORDER BY br.year, br.month_no, n.code`,
      [req.user.id, parseInt(grade)]
    );

    res.json({
      overall_trend: reports.rows,
      nipunatha_trend: nipunathaTrend.rows
    });
  } catch (err) {
    console.error('Trend error:', err);
    res.status(500).json({ error: 'Failed to fetch trend data.' });
  }
});

module.exports = router;
