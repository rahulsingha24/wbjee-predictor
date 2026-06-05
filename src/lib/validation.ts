export interface CutoffDataRow {
  round: string;
  institute: string;
  program: string;
  quota: string;
  category: string;
  openingRank: number | string;
  closingRank: number | string;
  isTFW?: boolean;
  type?: string;
  district?: string;
}

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validRows: any[];
  duplicateCount: number;
}

export function validateDataset(data: any[]): ValidationReport {
  const report: ValidationReport = {
    isValid: true,
    errors: [],
    warnings: [],
    validRows: [],
    duplicateCount: 0
  };

  if (!Array.isArray(data) || data.length === 0) {
    report.isValid = false;
    report.errors.push("Dataset is empty or not a valid array.");
    return report;
  }

  const seenKeys = new Set<string>();

  data.forEach((row, index) => {
    const rowNum = index + 1;
    let hasError = false;

    // Check required fields
    if (!row.institute) {
      report.errors.push(`Row ${rowNum}: Missing institute name.`);
      hasError = true;
    }
    if (!row.program) {
      report.errors.push(`Row ${rowNum}: Missing program/branch.`);
      hasError = true;
    }
    if (!row.category) {
      report.errors.push(`Row ${rowNum}: Missing category.`);
      hasError = true;
    }
    if (!row.round) {
      report.errors.push(`Row ${rowNum}: Missing round.`);
      hasError = true;
    }

    // Parse and validate ranks
    const opening = Number(row.openingRank);
    const closing = Number(row.closingRank);

    if (isNaN(opening) || opening <= 0) {
      report.errors.push(`Row ${rowNum}: Invalid opening rank (${row.openingRank}).`);
      hasError = true;
    }
    if (isNaN(closing) || closing <= 0) {
      report.errors.push(`Row ${rowNum}: Invalid closing rank (${row.closingRank}).`);
      hasError = true;
    }
    if (opening > closing) {
      report.warnings.push(`Row ${rowNum}: Opening rank is greater than closing rank.`);
    }

    if (hasError) {
      report.isValid = false;
      return; // skip adding to validRows
    }

    // Check for duplicates
    const uniqueKey = `${row.institute}-${row.program}-${row.category}-${row.quota}-${row.round}`;
    if (seenKeys.has(uniqueKey)) {
      report.duplicateCount++;
      report.warnings.push(`Row ${rowNum}: Duplicate entry found for ${uniqueKey}. Ignored.`);
      return;
    }
    seenKeys.add(uniqueKey);

    report.validRows.push({
      ...row,
      openingRank: opening,
      closingRank: closing,
      isTFW: row.isTFW ?? (row.program?.includes('TFW') || row.category === 'Tuition Fee Waiver'),
      type: row.type || 'Private',
      district: row.district || 'Unknown'
    });
  });

  if (report.errors.length > 0) {
    report.isValid = false;
  }

  return report;
}
