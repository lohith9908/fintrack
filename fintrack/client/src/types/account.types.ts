export type AccountType =
  | "CASH"
  | "BANK_ACCOUNT"
  | "CREDIT_CARD"
  | "UPI"
  | "OTHER";

export type AccountStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface IAccount {
  _id: string;
  user: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  currentBalance: number;
  currency: string;
  status: AccountStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountsSummary {
  totalNetWorth: number;
  totalBankBalance: number;
  totalCashUpiBalance: number;
  totalCreditLiabilities: number;
  activeAccountsCount: number;
  archivedAccountsCount: number;
}

export interface CreateAccountPayload {
  name: string;
  type: AccountType;
  openingBalance?: number;
  currency?: string;
  notes?: string;
}

export interface UpdateAccountPayload {
  name?: string;
  type?: AccountType;
  currency?: string;
  status?: AccountStatus;
  notes?: string;
}
