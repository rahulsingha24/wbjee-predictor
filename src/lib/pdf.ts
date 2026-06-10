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

const cleanText = (value?: string | number | boolean | null) =>
  String(value ?? '').trim();

const cleanProgramName = (program?: string) => {
  if (!program) return '';

  return program
    .replace(/\s*-\s*TFW\s*$/i, '')
    .replace(/\s*\(TFW\)\s*$/i, '')
    .replace(/\s+TFW\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const displayCategory = (
  category?: string,
  isTFW?: boolean,
  isPWD?: boolean
) => {
  const raw = cleanText(category);
  const upper = raw.toUpperCase();

  const rowIsTFW =
    isTFW === true ||
    upper === 'GENERAL_TFW' ||
    upper === 'TFW' ||
    upper === 'TUITION FEE WAIVER' ||
    upper.includes('TUITION FEE WAIVER');

  const rowIsPWD = isPWD === true || upper.includes('PWD');

  if (rowIsTFW) return rowIsPWD ? 'TFW (PwD)' : 'TFW';

  if (
    upper === 'GENERAL' ||
    upper === 'OPEN' ||
    upper === 'GENERAL (OPEN)'
  ) {
    return rowIsPWD ? 'General (Open) (PwD)' : 'General (Open)';
  }

  if (upper.includes('OBC') && upper.includes('A')) {
    return rowIsPWD ? 'OBC-A (PwD)' : 'OBC-A';
  }

  if (upper.includes('OBC') && upper.includes('B')) {
    return rowIsPWD ? 'OBC-B (PwD)' : 'OBC-B';
  }

  if (upper.startsWith('SC')) return rowIsPWD ? 'SC (PwD)' : 'SC';
  if (upper.startsWith('ST')) return rowIsPWD ? 'ST (PwD)' : 'ST';
  if (upper.startsWith('EWS')) return rowIsPWD ? 'EWS (PwD)' : 'EWS';

  return raw || 'N/A';
};

const displayQuota = (quota?: string) => {
  const raw = cleanText(quota);

  if (!raw || raw === 'All' || raw === 'Both' || raw === 'All Quotas') {
    return 'Home State + All India';
  }

  return raw;
};

const displayQuotaShort = (quota?: string) => {
  const raw = cleanText(quota).toLowerCase();

  if (raw === 'home state') return 'HS';
  if (raw === 'all india') return 'AI';
  if (raw === 'both' || raw === 'all' || raw === 'home state + all india') {
    return 'HS + AI';
  }

  return cleanText(quota) || 'N/A';
};

const displayInstituteType = (type?: string) => {
  const raw = cleanText(type);

  if (!raw || raw === 'All' || raw === 'All Types') {
    return 'Government + Private';
  }

  return raw;
};

const displayChance = (chance?: string) => {
  const raw = cleanText(chance);

  if (!raw || raw === 'All' || raw === 'All Chances') return 'All Chances';

  return LEVEL_LABELS[raw] || raw;
};

const displayProgram = (program?: string) => {
  const raw = cleanText(program);

  if (!raw || raw === 'All' || raw === 'All Branches') return 'All Branches';

  return cleanProgramName(raw);
};

const displayDistrict = (district?: string) => {
  const raw = cleanText(district);

  if (!raw || raw === 'All' || raw === 'All Districts') return 'All Districts';

  return raw;
};

const displayRound = (round?: string) => {
  const raw = cleanText(round);

  if (!raw || raw === 'All' || raw === 'All Rounds') return 'All Rounds';

  return raw;
};

const formatRank = (rank: number) =>
  Number(rank || 0).toLocaleString('en-IN');

export async function generatePredictionPDF(
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
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const margin = 12;
  const contentW = pageW - margin * 2;

  const colors = {
    navy: [5, 11, 26] as [number, number, number],
    blue: [37, 99, 235] as [number, number, number],
    indigo: [79, 70, 229] as [number, number, number],
    text: [15, 23, 42] as [number, number, number],
    muted: [71, 85, 105] as [number, number, number],
    subtle: [100, 116, 139] as [number, number, number],
    border: [226, 232, 240] as [number, number, number],
    soft: [248, 250, 252] as [number, number, number],
    green: [16, 185, 129] as [number, number, number],
    amber: [245, 158, 11] as [number, number, number],
    red: [239, 68, 68] as [number, number, number],
  };

  const loadImageAsDataUrl = async (src: string): Promise<string | null> => {
  try {
    const response = await fetch(src);
    const blob = await response.blob();

    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const logoDataUrl = await loadImageAsDataUrl('/future-engineers-logo-v2.png');

  const setRGB = (rgb: [number, number, number]) => {
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  };

  const setFillRGB = (rgb: [number, number, number]) => {
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  };

  const setDrawRGB = (rgb: [number, number, number]) => {
    doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  };

  const drawWatermark = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(42);
    doc.setTextColor(238, 242, 255);
    doc.text('Future Engineers', pageW / 2, pageH / 2 + 8, {
      angle: 45,
      align: 'center',
      baseline: 'middle',
    });
  };

  const drawPageBrand = () => {
    setRGB(colors.subtle);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Future Engineers', margin, 8);
  };

  const drawFirstHeader = () => {
  // Previous PDF-like premium dark blue header
  doc.setFillColor(30, 58, 138); // #1E3A8A
  doc.rect(0, 0, pageW, 30, 'F');

  // Future Engineers logo
if (logoDataUrl) {
  doc.addImage(logoDataUrl, 'PNG', margin, 5.5, 19, 19);
} else {
  // Fallback if logo cannot load
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin, 7, 16, 16, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('FE', margin + 8, 15.2, {
    align: 'center',
    baseline: 'middle',
  });
}

  // Brand title with automatic spacing
const brandX = margin + 24;
const brandY = 14;

doc.setFont('helvetica', 'bold');
doc.setFontSize(18);

doc.setTextColor(255, 255, 255);
doc.text('Future', brandX, brandY);

const futureWidth = doc.getTextWidth('Future');

doc.setTextColor(96, 165, 250); // blue accent
doc.text('Engineers', brandX + futureWidth + 1.8, brandY);

// Subtitle
doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
doc.setTextColor(191, 219, 254);
doc.text('WBJEE College Predictor 2026', brandX, 21);
};

  const addNewPage = () => {
    doc.addPage();
    drawWatermark();
    drawPageBrand();
  };

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageH - 18) {
      addNewPage();
      y = 16;
      return true;
    }

    return false;
  };

  const writeWrappedText = (
    text: string,
    x: number,
    yPos: number,
    width: number,
    options?: {
      fontSize?: number;
      bold?: boolean;
      color?: [number, number, number];
      lineHeight?: number;
    }
  ) => {
    doc.setFont('helvetica', options?.bold ? 'bold' : 'normal');
    doc.setFontSize(options?.fontSize ?? 8);
    setRGB(options?.color ?? colors.text);

    const lines = doc.splitTextToSize(cleanText(text), width) as string[];
    const lineHeight = options?.lineHeight ?? 3.7;

    lines.forEach((line, index) => {
      doc.text(line, x, yPos + index * lineHeight);
    });

    return lines.length * lineHeight;
  };

  drawWatermark();
  drawFirstHeader();

  const now = new Date();
  const timeStr = now
    .toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
    .toLowerCase();

  let y = 38;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setRGB(colors.subtle);
  doc.text(
    `Generated on ${now.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })} at ${timeStr}`,
    margin,
    y
  );

  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  setRGB(colors.text);
  doc.text('Applied Filters', margin, y);

  y += 7;

  const filterRows: [string, string, string, string][] = [
    ['Name', userInfo.name || 'Guest User', 'Your Rank (GMR)', formatRank(userInfo.rank)],
    ['Category', displayCategory(userInfo.category), 'Quota', displayQuota(userInfo.quota)],
    ['Seat Type', userInfo.seatType || 'WBJEE Seats', 'PwD Status', userInfo.pwdStatus || 'No PwD'],
    ['Round', displayRound(userInfo.round), 'Institute Type', displayInstituteType(userInfo.instituteType)],
    ['Chance Level', displayChance(userInfo.chanceLevel), 'District', displayDistrict(userInfo.district)],
  ];

  const leftX = margin;
  const rightX = margin + contentW / 2 + 4;
  const colW = contentW / 2 - 6;

  filterRows.forEach(([lKey, lValue, rKey, rValue]) => {
    const leftText = `${lKey}: ${lValue}`;
    const rightText = `${rKey}: ${rValue}`;

    const leftLines = doc.splitTextToSize(leftText, colW) as string[];
    const rightLines = doc.splitTextToSize(rightText, colW) as string[];
    const rowHeight = Math.max(leftLines.length, rightLines.length) * 4.2;

    ensureSpace(rowHeight + 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setRGB(colors.muted);

    doc.text(leftLines, leftX, y);
    doc.text(rightLines, rightX, y);

    y += rowHeight;
  });

  const programText = `Program / Branch: ${displayProgram(userInfo.program)}`;
  const programLines = doc.splitTextToSize(programText, contentW) as string[];
  const programHeight = programLines.length * 4.2;

  ensureSpace(programHeight + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setRGB(colors.muted);
  doc.text(programLines, margin, y);
  y += programHeight + 7;

  ensureSpace(16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  setRGB(colors.text);
  doc.text(`Prediction Results (${results.length} matches)`, margin, y);

  y += 8;

const cols = {
  num: { x: margin + 1, w: 5 },
  college: { x: margin + 8, w: 42 },
  branch: { x: margin + 52, w: 52 },
  or: { x: margin + 106, w: 13 },
  cr: { x: margin + 121, w: 13 },
  cat: { x: margin + 136, w: 23 },
  quota: { x: margin + 161, w: 11 },
  chance: { x: margin + 174, w: 12 },
};

  const drawTableHeader = () => {
  ensureSpace(9);

  const headerH = 6.5;
  const headerY = y - 4;

  /*
    Thin table header:
    - Light Engineers blue theme
    - Not too dark
    - Not too broad
    - Fully covers all column text
    - Same look on every page
  */

  // Full-width thin blue bar
  doc.setFillColor(219, 234, 254); // light Engineers blue
  doc.rect(margin, headerY, contentW, headerH, 'F');

  // Thin bottom border only, not full heavy box
  doc.setDrawColor(96, 165, 250);
  doc.setLineWidth(0.25);
  doc.line(margin, headerY + headerH, margin + contentW, headerY + headerH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.4);
  doc.setTextColor(37, 99, 235);

  const textY = headerY + 4.4;

  doc.text('#', cols.num.x, textY);
  doc.text('College', cols.college.x, textY);
  doc.text('Branch', cols.branch.x, textY);
  doc.text('OR', cols.or.x, textY);
  doc.text('CR', cols.cr.x, textY);
  doc.text('Cat', cols.cat.x, textY);
  doc.text('Quota', cols.quota.x, textY);
  doc.text('Chance', cols.chance.x, textY);

  y += 6.5;
};

  drawTableHeader();

  results.forEach((r, index) => {
    const collegeLines = doc.splitTextToSize(
      cleanText(r.institute),
      cols.college.w
    ) as string[];

    const branchLines = doc.splitTextToSize(
      displayProgram(r.program),
      cols.branch.w
    ) as string[];

    const catLines = doc.splitTextToSize(
      displayCategory(r.category, r.isTFW, r.isPWD),
      cols.cat.w
    ) as string[];

    const chanceText = LEVEL_LABELS[r.predictionLevel] || r.predictionLevel;

    const rowLineCount = Math.max(
      1,
      collegeLines.length,
      branchLines.length,
      catLines.length
    );

    const rowH = Math.max(9, rowLineCount * 3.3 + 4);

    if (y + rowH > pageH - 20) {
      addNewPage();
      y = 16;
      drawTableHeader();
    }

    if (index % 2 === 0) {
      setFillRGB(colors.soft);
      doc.roundedRect(margin, y - 3.8, contentW, rowH, 1.5, 1.5, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.4);
    setRGB(colors.text);

    doc.text(String(index + 1), cols.num.x, y);

    doc.text(collegeLines, cols.college.x, y);
    doc.text(branchLines, cols.branch.x, y);

    doc.setFont('helvetica', 'bold');
    doc.text(formatRank(r.openingRank), cols.or.x, y);
    doc.text(formatRank(r.closingRank), cols.cr.x, y);

    doc.setFont('helvetica', 'normal');
    doc.text(catLines, cols.cat.x, y);

    doc.text(displayQuotaShort(r.quota), cols.quota.x, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);

    if (r.predictionLevel === 'SAFE') setRGB(colors.green);
    else if (r.predictionLevel === 'MODERATE') setRGB(colors.amber);
    else if (r.predictionLevel === 'RISKY') setRGB(colors.red);
    else setRGB(colors.subtle);

    const chanceLines = doc.splitTextToSize(chanceText, cols.chance.w) as string[];
    doc.text(chanceLines, cols.chance.x, y);

    y += rowH + 2;
  });

  // ── Disclaimer ──
// Always keep disclaimer safely inside page, never at the very bottom edge.
y += 8;

const disclaimer =
  'DISCLAIMER: Predictions are based on previous-year WBJEE cutoff data and are for guidance only. Final admission depends on official WBJEE counselling results.';

doc.setFont('helvetica', 'bold');
doc.setFontSize(7.2);

const disclaimerBoxPadding = 4;
const disclaimerLines = doc.splitTextToSize(
  disclaimer,
  contentW - disclaimerBoxPadding * 2
) as string[];

const disclaimerLineHeight = 3.8;
const disclaimerBoxH =
  disclaimerLines.length * disclaimerLineHeight + disclaimerBoxPadding * 2 + 1;

// If disclaimer cannot fit comfortably, move it to a new page.
if (y + disclaimerBoxH > pageH - 18) {
  addNewPage();
  y = 18;
}

// Light disclaimer box
doc.setFillColor(248, 250, 252);
doc.setDrawColor(226, 232, 240);
doc.roundedRect(margin, y, contentW, disclaimerBoxH, 2, 2, 'FD');

doc.setFont('helvetica', 'bold');
doc.setFontSize(7.2);
doc.setTextColor(100, 116, 139);

doc.text(
  disclaimerLines,
  margin + disclaimerBoxPadding,
  y + disclaimerBoxPadding + 2
);

y += disclaimerBoxH + 6;

  const cleanRank = String(userInfo.rank || '').replace(/,/g, '');
  doc.save(`future_engineers_rank_${cleanRank}.pdf`);
}