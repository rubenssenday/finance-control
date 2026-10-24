import { MonthlyDashboardData } from '@/components/dashboard/dashboard-types';

/**
 * Formats a number as Brazilian Real (BRL).
 */
export function formatCurrencyBRL(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0);
}

/**
 * Formats an ISO date string to DD/MM/YYYY.
 */
export function formatDateBRL(isoStr?: string | null): string {
  if (!isoStr) return '-';
  try {
    const parts = isoStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(isoStr).toLocaleDateString('pt-BR');
  } catch {
    return isoStr;
  }
}

/**
 * Generates and downloads a client-side RFC-4180 CSV statement file with UTF-8 BOM
 * for perfect Microsoft Excel and spreadsheet software compatibility.
 */
export function exportMonthlyStatementCsv(data: MonthlyDashboardData): void {
  const delimiter = ';';
  const lines: string[] = [];

  // UTF-8 BOM
  const BOM = '\uFEFF';

  // 1. Document Header
  lines.push(`EXTRATO FINANCEIRO MENSAL - ${data.period.monthName.toUpperCase()} / ${data.period.year}`);
  lines.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
  lines.push('');

  // 2. Summary Section
  lines.push('--- RESUMO FINANCEIRO ---');
  lines.push(['Indicador', 'Valor (R$)'].join(delimiter));
  lines.push(['Receita Total Projetada', data.summary.totalIncome.toFixed(2).replace('.', ',')].join(delimiter));
  lines.push(['Despesas Totais Faturadas', data.summary.totalExpenses.toFixed(2).replace('.', ',')].join(delimiter));
  lines.push(['Total Pago / Liquidado', data.summary.totalPaid.toFixed(2).replace('.', ',')].join(delimiter));
  lines.push(['Total a Pagar / Pendente', data.summary.totalPending.toFixed(2).replace('.', ',')].join(delimiter));
  lines.push(['Saldo Líquido Projetado', data.summary.netBalance.toFixed(2).replace('.', ',')].join(delimiter));
  lines.push('');

  // 3. Transactions Table
  lines.push('--- LANÇAMENTOS DETALHADOS ---');
  lines.push(
    [
      'Tipo',
      'Data Vencimento',
      'Data Compra',
      'Descrição',
      'Categoria',
      'Forma de Pagamento',
      'Cartão / Detalhes',
      'Parcela',
      'Status',
      'Valor (R$)',
    ].join(delimiter),
  );

  // Credit Card Purchases
  data.creditCards.brandGroups.forEach((brand) => {
    brand.cards.forEach((card) => {
      if (card.invoice && card.invoice.items) {
        card.invoice.items.forEach((item) => {
          const installment = item.installmentTotal && item.installmentTotal > 1
            ? `${item.installmentNumber}/${item.installmentTotal}`
            : 'À vista';

          lines.push(
            [
              'Cartão de Crédito',
              formatDateBRL(card.invoice?.dueDate),
              formatDateBRL(item.transactionDate),
              `"${item.description.replace(/"/g, '""')}"`,
              item.category?.name || 'Geral',
              `Cartão (${brand.brandName})`,
              card.nickname,
              installment,
              card.invoice?.status === 'PAID' ? 'Pago' : 'Pendente',
              item.amount.toFixed(2).replace('.', ','),
            ].join(delimiter),
          );
        });
      }
    });
  });

  // Direct Expenses
  const directMethods = [
    { key: 'BOLETO' as const, name: 'Boleto Bancário' },
    { key: 'PIX' as const, name: 'Pix Instantâneo' },
    { key: 'DEBIT_CARD' as const, name: 'Débito em Conta' },
  ];

  directMethods.forEach((methodDef) => {
    const group = data.directExpenses.methods[methodDef.key];
    if (group && group.items) {
      group.items.forEach((item) => {
        lines.push(
          [
            'Despesa Direta',
            formatDateBRL(item.dueDate),
            formatDateBRL(item.transactionDate),
            `"${item.description.replace(/"/g, '""')}"`,
            item.category?.name || 'Geral',
            methodDef.name,
            '-',
            '-',
            item.paymentStatus === 'PAID' ? 'Pago' : 'Pendente',
            item.amount.toFixed(2).replace('.', ','),
          ].join(delimiter),
        );
      });
    }
  });

  // 4. Category Breakdown
  lines.push('');
  lines.push('--- DISTRIBUIÇÃO POR CATEGORIA ---');
  lines.push(['Categoria', 'Valor (R$)', 'Percentual (%)'].join(delimiter));
  data.categoryBreakdown.forEach((cat) => {
    lines.push(
      [
        `"${cat.name.replace(/"/g, '""')}"`,
        cat.amount.toFixed(2).replace('.', ','),
        `${cat.percentage.toFixed(2).replace('.', ',')}%`,
      ].join(delimiter),
    );
  });

  const csvContent = BOM + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `extrato_financeiro_${data.period.year}_${String(data.period.month).padStart(2, '0')}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers the browser's native print engine for clean PDF printing.
 */
export function triggerPrintPdf(): void {
  if (typeof window !== 'undefined') {
    window.print();
  }
}
