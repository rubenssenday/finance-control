import { ErrorMessageCatalog } from '../i18n.types';

export const ptBRMessages: ErrorMessageCatalog = {
  AUTH001: 'Credenciais inválidas. Verifique seu e-mail e senha.',
  AUTH002: 'Sessão expirada. Faça login novamente.',
  AUTH003: 'Você não tem permissão para realizar esta operação.',
  ACCT001: 'Conta ou espaço de trabalho não encontrado.',
  CAT001: 'Não é possível excluir uma categoria vinculada a despesas ou receitas existentes.',
  CARD001: 'Os dias de fechamento e vencimento devem ser dias válidos entre 1 e 31 e distintos entre si.',
  CARD002: 'Não é possível excluir cartão com faturas pendentes ou parcelas ativas.',
  EXP001: 'Por favor, preencha todos os campos obrigatórios: descrição, valor, data e método de pagamento.',
  EXP002: 'O valor da transação deve ser maior que zero.',
  EXP003: 'O número de parcelas deve ser entre 1 e 72.',
  EXP004: 'Por favor, selecione um cartão de crédito válido para transações no cartão.',
  INC001: 'O valor da receita deve ser maior que zero.',
  SETTLE001: 'Esta fatura já está marcada como paga.',
  INTERNAL_ERROR: 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.',
};
