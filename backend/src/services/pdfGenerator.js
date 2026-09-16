// PDF Generator for Blood Report
// Uses basic HTML-to-text formatting for now; production would use puppeteer/pdfkit

function generateReportPDF(reportData, nipunathaScores) {
  const { student_name, grade, medium, month_no, year, total_marks, max_marks } = reportData;
  const percentage = max_marks > 0 ? ((total_marks / max_marks) * 100).toFixed(2) : 0;

  let content = '';
  content += '='.repeat(60) + '\n';
  content += '          GENIUS ONE - BLOOD REPORT\n';
  content += '='.repeat(60) + '\n\n';
  content += `Student:  ${student_name}\n`;
  content += `Grade:    ${grade}\n`;
  content += `Medium:   ${medium || 'SI'}\n`;
  content += `Month:    ${month_no} (${year})\n`;
  content += `Date:     ${new Date().toLocaleDateString()}\n\n`;
  content += '-'.repeat(40) + '\n';
  content += `Total Marks: ${total_marks} / ${max_marks}\n`;
  content += `Percentage:  ${percentage}%\n`;
  content += `Grade Band:  ${getGradeBand(parseFloat(percentage))}\n`;
  content += '-'.repeat(40) + '\n\n';

  content += 'NIPUNATHA BREAKDOWN\n';
  content += '-'.repeat(40) + '\n';

  if (nipunathaScores && nipunathaScores.length > 0) {
    nipunathaScores.forEach((nip, i) => {
      const pct = nip.max_marks > 0 ? Math.round((nip.marks_obtained / nip.max_marks) * 100) : 0;
      const bar = '#'.repeat(Math.round(pct / 5)) + '.'.repeat(20 - Math.round(pct / 5));
      content += `${(i + 1).toString().padStart(2)}. ${(nip.name_en || '').padEnd(25)} ${nip.marks_obtained}/${nip.max_marks} [${bar}] ${pct}%\n`;
    });
  }

  content += '\n' + '='.repeat(60) + '\n';
  content += 'Know Your Child\'s Exact Strength - Like a Blood Report\n';
  content += '='.repeat(60) + '\n';

  return Buffer.from(content, 'utf-8');
}

function getGradeBand(pct) {
  if (pct >= 75) return 'A - Excellent';
  if (pct >= 65) return 'B - Very Good';
  if (pct >= 50) return 'C - Good';
  if (pct >= 35) return 'D - Satisfactory';
  return 'E - Needs Improvement';
}

module.exports = { generateReportPDF };
