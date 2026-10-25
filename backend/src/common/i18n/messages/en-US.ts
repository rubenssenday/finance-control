import { ErrorMessageCatalog } from '../i18n.types';

export const enUSMessages: ErrorMessageCatalog = {
  AUTH001: 'Invalid credentials. Please verify your email and password.',
  AUTH002: 'Session expired. Please log in again.',
  AUTH003: 'You do not have permission to perform this operation.',
  ACCT001: 'Account or workspace not found.',
  CAT001: 'Cannot delete a category referenced by existing expenses or incomes.',
  CARD001: 'Closing and due days must be valid distinct calendar days between 1 and 31.',
  CARD002: 'Cannot delete card with unsettled invoices or active future installments.',
  EXP001: 'Please fill in all mandatory fields: description, amount, date, and payment method.',
  EXP002: 'Transaction amount must be greater than zero.',
  EXP003: 'Installment count must be between 1 and 72.',
  EXP004: 'Please select a valid credit card for credit card transactions.',
  INC001: 'Income amount must be greater than zero.',
  SETTLE001: 'This invoice is already settled as paid.',
  INTERNAL_ERROR: 'An internal server error occurred. Please try again later.',
};
