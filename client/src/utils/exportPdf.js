/**
 * exportPdf.js — Client-side PDF generation for Scriptly study guides.
 * 
 * Uses jsPDF (lazy-loaded) to generate clean, printable study sheets
 * from structured note data. No server-side rendering needed.
 */

// Layout constants
const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;
const PAGE_WIDTH = 210; // A4 width in mm
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const LINE_HEIGHT = 6;
const SECTION_GAP = 10;

/**
 * Check if we need a new page, and add one if so.
 * Returns the (possibly reset) y position.
 */
function checkPageBreak(doc, y, needed = 20) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 20) {
    doc.addPage();
    return 25; // top margin of new page
  }
  return y;
}

/**
 * Render wrapped text and return updated y position.
 */
function renderWrappedText(doc, text, x, y, maxWidth, lineHeight = LINE_HEIGHT) {
  const lines = doc.splitTextToSize(text || '', maxWidth);
  for (const line of lines) {
    y = checkPageBreak(doc, y, lineHeight);
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

/**
 * Render a section header (uppercase label with accent underline).
 */
function renderSectionHeader(doc, title, y) {
  y = checkPageBreak(doc, y, 16);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(59, 130, 246); // accent blue
  doc.text(title.toUpperCase(), MARGIN_LEFT, y);
  y += 2;
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, y, MARGIN_LEFT + CONTENT_WIDTH, y);
  y += 6;
  doc.setTextColor(30, 30, 30); // reset to dark
  return y;
}

/**
 * Generate and download a PDF study guide from a note object.
 * jsPDF is lazy-loaded so the 280KB bundle is only fetched on demand.
 */
export async function exportNotePdf(note) {
  // Lazy-load jsPDF
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF('p', 'mm', 'a4');

  let y = 25;

  // ─── Title ───
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 17, 23);
  const titleLines = doc.splitTextToSize(note.title || 'Untitled Note', CONTENT_WIDTH);
  for (const line of titleLines) {
    doc.text(line, MARGIN_LEFT, y);
    y += 9;
  }

  // Subject badge
  if (note.subject_detected && note.subject_detected !== note.title) {
    y += 1;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(note.subject_detected, MARGIN_LEFT, y);
    y += 5;
  }

  // Date
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(`Generated: ${new Date(note.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`, MARGIN_LEFT, y);
  y += SECTION_GAP;

  // ─── Quick Recap ───
  if (note.quick_recap) {
    y = renderSectionHeader(doc, 'Quick Recap', y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    y = renderWrappedText(doc, note.quick_recap, MARGIN_LEFT, y, CONTENT_WIDTH);
    y += SECTION_GAP;
  }

  // ─── Key Concepts ───
  if (note.key_concepts && note.key_concepts.length > 0) {
    y = renderSectionHeader(doc, 'Key Concepts', y);
    for (const kc of note.key_concepts) {
      y = checkPageBreak(doc, y, 20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`• ${kc.concept}`, MARGIN_LEFT, y);
      y += LINE_HEIGHT;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      if (kc.explanation) {
        y = renderWrappedText(doc, kc.explanation, MARGIN_LEFT + 4, y, CONTENT_WIDTH - 4, 5);
      }
      if (kc.why_it_matters) {
        doc.setFont('helvetica', 'italic');
        y = renderWrappedText(doc, `Why it matters: ${kc.why_it_matters}`, MARGIN_LEFT + 4, y, CONTENT_WIDTH - 4, 5);
      }
      y += 3;
    }
    y += SECTION_GAP - 3;
  }

  // ─── Important to Remember ───
  if (note.important_to_remember && note.important_to_remember.length > 0) {
    y = renderSectionHeader(doc, 'Important to Remember', y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    for (const item of note.important_to_remember) {
      y = checkPageBreak(doc, y, 10);
      y = renderWrappedText(doc, `• ${item}`, MARGIN_LEFT + 2, y, CONTENT_WIDTH - 2, 5);
      y += 2;
    }
    y += SECTION_GAP;
  }

  // ─── Glossary ───
  if (note.key_terms && Object.keys(note.key_terms).length > 0) {
    y = renderSectionHeader(doc, 'Glossary', y);
    for (const [term, def] of Object.entries(note.key_terms)) {
      y = checkPageBreak(doc, y, 12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`${term}:`, MARGIN_LEFT + 2, y);
      const termWidth = doc.getTextWidth(`${term}: `);
      doc.setFont('helvetica', 'normal');
      const remaining = CONTENT_WIDTH - 2 - termWidth;
      if (remaining > 30) {
        // Inline if space allows
        const defLines = doc.splitTextToSize(def, remaining);
        doc.text(defLines[0], MARGIN_LEFT + 2 + termWidth, y);
        y += 5;
        for (let i = 1; i < defLines.length; i++) {
          y = checkPageBreak(doc, y, 5);
          doc.text(defLines[i], MARGIN_LEFT + 4, y);
          y += 5;
        }
      } else {
        y += 5;
        y = renderWrappedText(doc, def, MARGIN_LEFT + 4, y, CONTENT_WIDTH - 4, 5);
      }
      y += 2;
    }
    y += SECTION_GAP;
  }

  // ─── Potential Exam Questions ───
  if (note.potential_exam_questions && note.potential_exam_questions.length > 0) {
    y = renderSectionHeader(doc, 'Potential Exam Questions', y);
    note.potential_exam_questions.forEach((pq, i) => {
      y = checkPageBreak(doc, y, 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      y = renderWrappedText(doc, `${i + 1}. ${pq.question}`, MARGIN_LEFT + 2, y, CONTENT_WIDTH - 2, 5);
      if (pq.hint) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        y = renderWrappedText(doc, `Hint: ${pq.hint}`, MARGIN_LEFT + 6, y, CONTENT_WIDTH - 6, 5);
        doc.setTextColor(30, 30, 30);
      }
      y += 3;
    });
    y += SECTION_GAP;
  }

  // ─── Memory Anchors ───
  if (note.memory_anchors && note.memory_anchors.length > 0) {
    y = renderSectionHeader(doc, 'Memory Anchors', y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    for (const item of note.memory_anchors) {
      y = checkPageBreak(doc, y, 10);
      y = renderWrappedText(doc, `> ${item}`, MARGIN_LEFT + 2, y, CONTENT_WIDTH - 2, 5);
      y += 2;
    }
    y += SECTION_GAP;
  }

  // ─── Keywords ───
  if (note.keywords && note.keywords.length > 0) {
    y = renderSectionHeader(doc, 'Keywords', y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    y = renderWrappedText(doc, note.keywords.join('  •  '), MARGIN_LEFT, y, CONTENT_WIDTH, 5);
  }

  // ─── Footer on every page ───
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(170, 170, 170);
    doc.setFont('helvetica', 'normal');
    doc.text(`Scriptly Study Guide  •  Page ${i} of ${pageCount}`, MARGIN_LEFT, doc.internal.pageSize.getHeight() - 10);
  }

  // ─── Download ───
  const safeTitle = (note.title || 'Note').replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_');
  const dateStr = new Date(note.createdAt).toISOString().split('T')[0];
  doc.save(`${safeTitle}_${dateStr}.pdf`);
}
