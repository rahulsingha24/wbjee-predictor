import { jsPDF } from 'jspdf';
import { PredictionResult } from '@/types';

const LEVEL_LABELS: Record<string, string> = {
  GUARANTEED: 'Guaranteed',
  SAFE: 'Safe',
  MODERATE: 'Moderate',
  RISKY: 'Risky',
  HIGH: 'High Chance',
  LOW: 'Low Chance',
  VERY_LOW: 'Very Low Chance',
  NO_DATA: 'No Data',
};

export function generatePredictionPDF(
  results: PredictionResult[],
  userInfo: {
    rank: number;
    category: string;
    quota: string;
    seatType: string;
    pwdStatus: string;
    round: string;
    instituteType: string;
    chanceLevel: string;
    program: string;
    district: string;
    name?: string;
  }
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const margin = 14;
  const contentW = pageW - margin * 2;

  // ── Watermark Function ──
  const drawWatermark = (pdfDoc: jsPDF) => {
    pdfDoc.setFontSize(45);
    pdfDoc.setTextColor(240, 245, 255); // very light blue/gray so it doesn't block text
    // Add text diagonally in the center
    pdfDoc.text('Future Engineers', pageW / 2, pageH / 2 + 10, { angle: 45, align: 'center', baseline: 'middle' });
  };

  // First page watermark
  drawWatermark(doc);

  // ── Header ──
  doc.setFillColor(30, 58, 138); // dark navy blue
  doc.rect(0, 0, pageW, 28, 'F');
  
  // Left side: small blue rounded icon box
  doc.setFillColor(37, 99, 235); // blue accent
  doc.roundedRect(margin, 6, 16, 16, 3, 3, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('FE', margin + 8, 15, { align: 'center', baseline: 'middle' });

  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('Future Engineers', margin + 20, 14);
  doc.setFontSize(10);
  doc.setTextColor(191, 219, 254); // soft blue
  doc.text('WBJEE College Predictor 2026', margin + 20, 20);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }).toLowerCase();
  doc.text(`Generated on ${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} at ${timeStr}`, margin, 35);

  // ── Applied Filters ──
  let y = 44;
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('Applied Filters', margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);

  const infoItems = [
    `Name: ${userInfo.name || 'Guest User'}`,
    `Your Rank (GMR): ${userInfo.rank.toLocaleString()}`,
    `Category: ${userInfo.category}`,
    `Quota: ${userInfo.quota}`,
    `Seat Type: ${userInfo.seatType}`,
    `PwD Status: ${userInfo.pwdStatus}`,
    `Round: ${userInfo.round}`,
    `Institute Type: ${userInfo.instituteType}`,
    `Chance Level: ${userInfo.chanceLevel}`,
    `Program / Branch: ${userInfo.program}`,
    `District: ${userInfo.district}`,
  ];

  const col1X = margin;
  const col2X = margin + 90;
  infoItems.forEach((item, index) => {
    const isCol2 = index % 2 !== 0;
    const xPos = isCol2 ? col2X : col1X;
    doc.text(item, xPos, y);
    if (isCol2) y += 6;
  });
  if (infoItems.length % 2 !== 0) y += 6;

  y += 6;

  // ── Table Header ──
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(`Prediction Results (${results.length} matches)`, margin, y);
  y += 8;

  // Column layout without Spl.
  const cols = {
    num: { x: margin, w: 8 },
    name: { x: margin + 8, w: 60 },
    branch: { x: margin + 68, w: 50 },
    or: { x: margin + 118, w: 16 },
    cr: { x: margin + 134, w: 16 },
    cat: { x: margin + 150, w: 14 },
    quota: { x: margin + 164, w: 12 },
    chance: { x: margin + 176, w: 12 },
  };

  const drawTableHeader = () => {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y - 4, contentW, 7, 'F');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);

    doc.text('#', cols.num.x, y);
    doc.text('College', cols.name.x, y);
    doc.text('Branch', cols.branch.x, y);
    doc.text('OR', cols.or.x, y);
    doc.text('CR', cols.cr.x, y);
    doc.text('Cat', cols.cat.x, y);
    doc.text('Quota', cols.quota.x, y);
    doc.text('Chance', cols.chance.x, y);
  };

  drawTableHeader();
  y += 6;

  // Data rows
  const maxResults = results.length;

  for (let i = 0; i < maxResults; i++) {
    const r = results[i];

    // Page break
    if (y > pageH - 20) {
      doc.addPage();
      drawWatermark(doc);
      y = 14;
      drawTableHeader();
      y += 6;
    }

    // Alternating row bg
    if (i % 2 === 0) {
      doc.setFillColor(249, 250, 252);
      doc.rect(margin, y - 3.5, contentW, 8, 'F');
    }

    doc.setFontSize(6.5);
    doc.setTextColor(51, 65, 85);

    doc.text(String(i + 1), cols.num.x, y);
    doc.text(doc.splitTextToSize(r.institute, cols.name.w)[0] || '', cols.name.x, y);
    doc.text(doc.splitTextToSize(r.program, cols.branch.w)[0] || '', cols.branch.x, y);
    doc.text(r.openingRank.toLocaleString(), cols.or.x, y);
    doc.text(r.closingRank.toLocaleString(), cols.cr.x, y);
    doc.text(r.category, cols.cat.x, y);

    const quotaShort = r.quota === 'Home State' ? 'HS' : (r.quota === 'All India' ? 'AI' : 'Both');
    doc.text(quotaShort, cols.quota.x, y);

    // Chance with color
    const chanceLabel = LEVEL_LABELS[r.predictionLevel] || r.predictionLevel;
    if (r.predictionLevel === 'SAFE') doc.setTextColor(16, 185, 129);
    else if (r.predictionLevel === 'MODERATE') doc.setTextColor(245, 158, 11);
    else if (r.predictionLevel === 'RISKY') doc.setTextColor(185, 28, 28);
    else doc.setTextColor(148, 163, 184);

    doc.text(chanceLabel.split(' ')[0], cols.chance.x, y);
    y += 8;
  }

  // ── Disclaimer ──
  y += 6;
  if (y > pageH - 20) {
    doc.addPage();
    drawWatermark(doc);
    y = 14;
  }
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const disclaimer = 'DISCLAIMER: Predictions are based on previous-year WBJEE cutoff data and are for guidance only. Final admission depends on official WBJEE counselling results.';
  const splitD = doc.splitTextToSize(disclaimer, contentW);
  doc.text(splitD, margin, y);

  const cleanRank = String(userInfo.rank).replace(/,/g, '');
  doc.save(`future_engineers_rank_${cleanRank}.pdf`);
}
