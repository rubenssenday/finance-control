import { PaymentMethod } from '@prisma/client';

export interface CsvRawRow {
  description?: string;
  amount?: string;
  date?: string;
  method?: string;
  category?: string;
  card_nickname?: string;
  installments?: string;
  notes?: string;
}

export interface CsvParsedItem {
  description: string;
  amount: number;
  date: string; // ISO date string
  method: PaymentMethod;
  categoryName: string;
  categoryId?: string;
  cardNickname?: string;
  cardId?: string;
  installments: number;
  notes?: string;
}

export interface CsvRowValidationResult {
  rowNumber: number;
  isValid: boolean;
  errors: string[];
  parsed: CsvParsedItem | null;
}

/**
 * Parses raw CSV text into an array of objects.
 * Handles quoted fields containing commas and quotes.
 */
export function parseCsvText(csvText: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  const normalized = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const nextChar = normalized[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if (char === '\n' && !insideQuotes) {
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      lines.push(currentRow);
    }
  }

  return lines;
}

/**
 * Normalizes Brazilian and international currency strings into numeric floats.
 * E.g., "R$ 1.250,50" -> 1250.50, "150.00" -> 150.00.
 */
export function parseCurrencyAmount(rawAmount: string): number | null {
  if (!rawAmount) return null;

  let cleaned = rawAmount.replace(/[R$\s]/g, '');

  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Determine which is decimal: "1.250,50" (BR) or "1,250.50" (US)
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Normalizes date formats (YYYY-MM-DD, DD/MM/YYYY) to standard ISO Date strings.
 */
export function parseDateString(rawDate: string): string | null {
  if (!rawDate) return null;

  const trimmed = rawDate.trim();

  // Handle DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split('/').map((s) => parseInt(s, 10));
    const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  // Handle YYYY-MM-DD
  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/**
 * Normalizes payment method string into PaymentMethod enum.
 */
export function normalizePaymentMethod(rawMethod: string): PaymentMethod | null {
  if (!rawMethod) return null;
  const upper = rawMethod.trim().toUpperCase().replace(/[\s-_]/g, '');

  if (upper.includes('CREDIT') || upper.includes('CREDITO')) {
    return PaymentMethod.CREDIT_CARD;
  }
  if (upper.includes('DEBIT') || upper.includes('DEBITO')) {
    return PaymentMethod.DEBIT_CARD;
  }
  if (upper.includes('BOLETO')) {
    return PaymentMethod.BOLETO;
  }
  if (upper.includes('PIX')) {
    return PaymentMethod.PIX;
  }

  return null;
}

/**
 * Validates and maps an entire parsed CSV against the account's existing categories and cards.
 */
export function validateCsvRows(
  rows: string[][],
  existingCategories: Array<{ id: string; name: string }>,
  existingCards: Array<{ id: string; nickname: string }>,
): CsvRowValidationResult[] {
  if (rows.length === 0) return [];

  // Determine headers
  const header = rows[0].map((h) => h.toLowerCase().replace(/[\s-_]/g, ''));
  const descIdx = header.findIndex((h) => h.includes('desc'));
  const amountIdx = header.findIndex((h) => h.includes('amount') || h.includes('valor'));
  const dateIdx = header.findIndex((h) => h.includes('date') || h.includes('data'));
  const methodIdx = header.findIndex((h) => h.includes('method') || h.includes('metodo') || h.includes('pagamento'));
  const catIdx = header.findIndex((h) => h.includes('cat'));
  const cardIdx = header.findIndex((h) => h.includes('card') || h.includes('cartao'));
  const instIdx = header.findIndex((h) => h.includes('inst') || h.includes('parc'));
  const notesIdx = header.findIndex((h) => h.includes('note') || h.includes('obs'));

  const results: CsvRowValidationResult[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const errors: string[] = [];

    const rawDesc = descIdx >= 0 ? row[descIdx] : '';
    const rawAmount = amountIdx >= 0 ? row[amountIdx] : '';
    const rawDate = dateIdx >= 0 ? row[dateIdx] : '';
    const rawMethod = methodIdx >= 0 ? row[methodIdx] : '';
    const rawCat = catIdx >= 0 ? row[catIdx] : '';
    const rawCard = cardIdx >= 0 ? row[cardIdx] : '';
    const rawInst = instIdx >= 0 ? row[instIdx] : '1';
    const rawNotes = notesIdx >= 0 ? row[notesIdx] : '';

    if (!rawDesc || rawDesc.length < 3 || rawDesc.length > 100) {
      errors.push('Description must be between 3 and 100 characters.');
    }

    const amount = parseCurrencyAmount(rawAmount);
    if (amount === null || amount < 0.01 || amount > 999999.99) {
      errors.push('Amount must be a valid currency value between R$ 0.01 and R$ 999,999.99.');
    }

    const isoDate = parseDateString(rawDate);
    if (!isoDate) {
      errors.push('Date must be a valid date in YYYY-MM-DD or DD/MM/YYYY format.');
    }

    const method = normalizePaymentMethod(rawMethod);
    if (!method) {
      errors.push('Payment method must be one of: CREDIT_CARD, DEBIT_CARD, BOLETO, PIX.');
    }

    // Match category
    let matchedCategoryId: string | undefined;
    if (rawCat) {
      const match = existingCategories.find(
        (c) => c.name.toLowerCase() === rawCat.toLowerCase(),
      );
      if (match) {
        matchedCategoryId = match.id;
      } else {
        errors.push(`Category '${rawCat}' does not exist in this account.`);
      }
    } else {
      errors.push('Category is mandatory.');
    }

    // If credit card, match card
    let matchedCardId: string | undefined;
    if (method === PaymentMethod.CREDIT_CARD) {
      if (rawCard) {
        const match = existingCards.find(
          (c) => c.nickname.toLowerCase() === rawCard.toLowerCase(),
        );
        if (match) {
          matchedCardId = match.id;
        } else {
          errors.push(`Credit card with nickname '${rawCard}' was not found.`);
        }
      } else {
        errors.push('Credit card transactions require a card_nickname.');
      }
    }

    let installments = parseInt(rawInst, 10);
    if (isNaN(installments) || installments < 1 || installments > 72) {
      installments = 1;
    }

    const isValid = errors.length === 0;

    results.push({
      rowNumber: i + 1,
      isValid,
      errors,
      parsed: isValid
        ? {
            description: rawDesc,
            amount: amount!,
            date: isoDate!,
            method: method!,
            categoryName: rawCat,
            categoryId: matchedCategoryId,
            cardNickname: rawCard || undefined,
            cardId: matchedCardId,
            installments,
            notes: rawNotes || undefined,
          }
        : null,
    });
  }

  return results;
}
