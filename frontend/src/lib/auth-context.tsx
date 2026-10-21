'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from './api-client';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface Account {
  id: string;
  name: string;
  role: 'ADMINISTRATOR' | 'MEMBER';
  memberCount?: number;
}

interface AuthContextType {
  user: User | null;
  activeAccount: Account | null;
  accounts: Account[];
  isLoading: boolean;
  switchAccount: (accountId: string) => Promise<void>;
  refreshAccounts: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessionData = useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetch current authenticated user
      const userRes = await apiClient<{ data: { user: User } }>('/auth/me');
      setUser(userRes.data.user);

      // Fetch user's workspaces
      const accountsRes = await apiClient<{ data: Account[] }>('/accounts');
      const accountList = accountsRes.data || [];
      setAccounts(accountList);

      // Resolve active account from localStorage or default to first
      const storedAccountId = localStorage.getItem('active_account_id');
      const found = accountList.find((a) => a.id === storedAccountId);

      if (found) {
        setActiveAccount(found);
      } else if (accountList.length > 0) {
        setActiveAccount(accountList[0]);
        localStorage.setItem('active_account_id', accountList[0].id);
      }
    } catch {
      setUser(null);
      setActiveAccount(null);
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  const switchAccount = async (accountId: string) => {
    try {
      const res = await apiClient<{ data: { activeAccount: Account } }>(
        `/accounts/${accountId}/switch`,
        { method: 'POST' },
      );
      const newAccount = res.data.activeAccount;
      setActiveAccount(newAccount);
      localStorage.setItem('active_account_id', newAccount.id);

      // Refresh page or trigger re-render
      window.location.reload();
    } catch (err: any) {
      console.error('Failed to switch account:', err.message);
      throw err;
    }
  };

  const refreshAccounts = async () => {
    try {
      const accountsRes = await apiClient<{ data: Account[] }>('/accounts');
      setAccounts(accountsRes.data || []);
    } catch (err) {
      console.error('Failed to refresh accounts:', err);
    }
  };

  const logout = async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('active_account_id');
      setUser(null);
      setActiveAccount(null);
      setAccounts([]);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeAccount,
        accounts,
        isLoading,
        switchAccount,
        refreshAccounts,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
