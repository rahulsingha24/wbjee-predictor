import { jsPDF } from 'jspdf';
import { PredictionResult } from '@/types';

const LEVEL_LABELS: Record<string, string> = {
  GUARANTEED: 'Guaranteed',
  SAFE:       'Safe',
  MODERATE:   'Moderate',
  RISKY:      'Risky',
  HIGH:       'High Chance',
  LOW:        'Low Chance',
  VERY_LOW:   'Very Low Chance',
  NO_DATA:    'No Data',
};

export function generatePredictionPDF(
  results: PredictionResult[],
  userInfo: { rank: number; category: string; quota: string; tfwStatus: string; name?: string }
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const margin = 14;
  const contentW = pageW - margin * 2;

  // ── Header ──
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 32, 'F');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('WBJEE College Predictor 2026', margin, 18);
  doc.setFontSize(9);
  doc.setTextColor(200, 220, 255);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, margin, 26);

  // ── Student Info ──
  let y = 40;
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Student Profile', margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);

  const infoItems = [
    `Name: ${userInfo.name || 'Student'}`,
    `Rank: ${userInfo.rank.toLocaleString()}`,
    `Category: ${userInfo.category}`,
    `Quota: ${userInfo.quota}`,
    `TFW: ${userInfo.tfwStatus}`,
  ];

  infoItems.forEach(item => {
    doc.text(item, margin, y);
    y += 6;
  });

  y += 4;

  // ── Table Header ──
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(`Prediction Results (${results.length} matches)`, margin, y);
  y += 8;

  // Column layout
  const cols = {
    num:    { x: margin,              w: 8   },
    name:   { x: margin + 8,         w: 54  },
    branch: { x: margin + 62,        w: 42  },
    or:     { x: margin + 104,       w: 16  },
    cr:     { x: margin + 120,       w: 16  },
    cat:    { x: margin + 136,       w: 14  },
    quota:  { x: margin + 150,       w: 14  },
    tfw:    { x: margin + 164,       w: 10  },
    chance: { x: margin + 174,       w: 12  },
  };

  // Header row
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y - 4, contentW, 7, 'F');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);

  doc.text('#',        cols.num.x,    y);
  doc.text('College',  cols.name.x,   y);
  doc.text('Branch',   cols.branch.x, y);
  doc.text('OR',       cols.or.x,     y);
  doc.text('CR',       cols.cr.x,     y);
  doc.text('Cat',      cols.cat.x,    y);
  doc.text('Quota',    cols.quota.x,  y);
  doc.text('TFW',      cols.tfw.x,    y);
  doc.text('Chance',   cols.chance.x, y);
  y += 6;

  // Data rows
  const maxResults = results.length;

  for (let i = 0; i < maxResults; i++) {
    const r = results[i];

    // Page break
    if (y > pageH - 20) {
      doc.addPage();
      y = 14;
      // Re-draw header
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y - 4, contentW, 7, 'F');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text('#',        cols.num.x,    y);
      doc.text('College',  cols.name.x,   y);
      doc.text('Branch',   cols.branch.x, y);
      doc.text('OR',       cols.or.x,     y);
      doc.text('CR',       cols.cr.x,     y);
      doc.text('Cat',      cols.cat.x,    y);
      doc.text('Quota',    cols.quota.x,  y);
      doc.text('TFW',      cols.tfw.x,    y);
      doc.text('Chance',   cols.chance.x, y);
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

    const quotaShort = r.quota === 'Home State' ? 'HS' : 'AI';
    doc.text(quotaShort, cols.quota.x, y);
    doc.text(r.isTFW ? 'Yes' : 'No', cols.tfw.x, y);

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
    y = 14;
  }
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  const disclaimer = 'DISCLAIMER: This predictor is based on previous year WBJEE cutoff data and is intended only for estimation purposes. Actual counseling results may vary. This tool does not guarantee admission to any institution.';
  const splitD = doc.splitTextToSize(disclaimer, contentW);
  doc.text(splitD, margin, y);

  doc.save(`WBJEE_Predictions_Rank${userInfo.rank}.pdf`);
}
