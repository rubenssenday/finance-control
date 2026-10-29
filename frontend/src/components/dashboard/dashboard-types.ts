export interface CategoryRef {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface PeriodInfo {
  year: number;
  month: number;
  monthName: string;
  startDate: string;
  endDate: string;
}

export interface SummaryMetrics {
  totalIncome: number;
  totalExpenses: number;
  totalPaid: number;
  totalPending: number;
  netBalance: number;
  incomeCount: number;
  expenseCount: number;
}

export interface BrandGroupCardItem {
  id: string;
  description: string;
  amount: number;
  transactionDate: string;
  installmentNumber?: number | null;
  installmentTotal?: number | null;
  category: CategoryRef;
}

export interface BrandGroupInvoice {
  id: string;
  billingMonth: number;
  billingYear: number;
  closingDate: string;
  dueDate: string;
  totalAmount: number;
  status: 'OPEN' | 'CLOSED' | 'PAID' | 'OVERDUE';
  paidAt?: string | null;
  items: BrandGroupCardItem[];
}

export interface BrandGroupCard {
  cardId: string;
  nickname: string;
  brand: string;
  closingDay: number;
  dueDay: number;
  invoice: BrandGroupInvoice | null;
}

export interface BrandGroup {
  brand: string;
  brandName: string;
  totalAmount: number;
  cardCount: number;
  cards: BrandGroupCard[];
}

export interface CreditCardsBlock {
  totalLiability: number;
  totalPaid: number;
  totalPending: number;
  brandGroups: BrandGroup[];
}

export interface DirectExpenseItem {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  transactionDate: string;
  paymentMethod: 'BOLETO' | 'PIX' | 'DEBIT_CARD';
  paymentStatus: 'PAID' | 'PENDING';
  displayStatus: 'PAID' | 'PENDING' | 'OVERDUE';
  daysOverdue: number;
  paidAt?: string | null;
  installmentNumber?: number | null;
  installmentTotal?: number | null;
  updatedAt: string;
  category: CategoryRef;
}

export interface DirectMethodGroup {
  label: string;
  itemCount: number;
  subtotal: number;
  paidAmount: number;
  pendingAmount: number;
  items: DirectExpenseItem[];
}

export interface DirectExpensesBlock {
  totalLiability: number;
  totalPaid: number;
  totalPending: number;
  methods: {
    BOLETO: DirectMethodGroup;
    PIX: DirectMethodGroup;
    DEBIT_CARD: DirectMethodGroup;
  };
}

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
}

export interface MonthlyDashboardData {
  period: PeriodInfo;
  summary: SummaryMetrics;
  creditCards: CreditCardsBlock;
  directExpenses: DirectExpensesBlock;
  categoryBreakdown: CategoryBreakdownItem[];
}
