// PDF Generator for Blood Report
// Uses basic HTML-to-text formatting for now; production would use puppeteer/pdfkit

function generateBloodReportPDF(reportData) {
  const { summary, nipunatha_breakdown, student_name, grade, medium, month_no, year } = reportData;

  // Build a simple text-based PDF content
  // In production, replace with proper PDF library (pdfkit, puppeteer, etc.)
  let content = '';
  content += '='.repeat(60) + '\n';
  content += '          GENIUS ONE - BLOOD REPORT\n';
  content += '='.repeat(60) + '\n\n';
  content += `Student:  ${student_name}\n`;
  content += `Grade:    ${grade}\n`;
  content += `Medium:   ${medium}\n`;
  content += `Month:    ${month_no} (${year})\n`;
  content += `Date:     ${new Date().toLocaleDateString()}\n\n`;
  content += '-'.repeat(40) + '\n';
  content += `Total Marks: ${summary.total_marks} / ${summary.max_marks}\n`;
  content += `Percentage:  ${summary.percentage}%\n`;
  content += `Grade Band:  ${getGradeBand(summary.percentage)}\n`;
  content += '-'.repeat(40) + '\n\n';

  content += 'NIPUNATHA BREAKDOWN\n';
  content += '-'.repeat(40) + '\n';

  if (nipunatha_breakdown && nipunatha_breakdown.length > 0) {
    nipunatha_breakdown.forEach((nip, i) => {
      const pct = nip.max_marks > 0 ? Math.round((nip.marks / nip.max_marks) * 100) : 0;
      const bar = '#'.repeat(Math.round(pct / 5)) + '.'.repeat(20 - Math.round(pct / 5));
      content += `${(i + 1).toString().padStart(2)}. ${(nip.name_en || '').padEnd(25)} ${nip.marks}/${nip.max_marks} [${bar}] ${pct}%\n`;
    });
  }

  content += '\n' + '='.repeat(60) + '\n';
  content += 'Know Your Child\'s Exact Strength - Like a Blood Report\n';
  content += '='.repeat(60) + '\n';

  return Buffer.from(content, 'utf-8');
}

function getGradeBand(pct) {
  if (pct >= 90) return 'Excellent';
  if (pct >= 75) return 'Very Good';
  if (pct >= 60) return 'Good';
  if (pct >= 40) return 'Satisfactory';
  return 'Needs Improvement';
}

module.exports = { generateBloodReportPDF };
