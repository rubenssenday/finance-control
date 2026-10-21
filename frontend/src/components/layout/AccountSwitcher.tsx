'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ChevronDown, Check, Building2, Shield, Users } from 'lucide-react';

export function AccountSwitcher() {
  const { activeAccount, accounts, switchAccount } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectAccount = async (accountId: string) => {
    if (activeAccount && accountId === activeAccount.id) {
      setIsOpen(false);
      return;
    }

    try {
      setIsSwitching(true);
      await switchAccount(accountId);
      setIsOpen(false);
    } catch {
      alert('Failed to switch workspace context.');
    } finally {
      setIsSwitching(false);
    }
  };

  if (!activeAccount) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-500 animate-pulse">
        <Building2 className="w-4 h-4 text-slate-400" />
        <span>Loading workspace...</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium text-slate-800 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
          {activeAccount.name.charAt(0).toUpperCase()}
        </div>
        <span className="max-w-[150px] truncate text-slate-900 font-semibold">
          {activeAccount.name}
        </span>
        <span
          className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md ${
            activeAccount.role === 'ADMINISTRATOR'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {activeAccount.role === 'ADMINISTRATOR' ? 'Admin' : 'Member'}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 origin-top-left rounded-2xl bg-white shadow-xl ring-1 ring-slate-900/5 focus:outline-hidden z-50 p-2 divide-y divide-slate-100">
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Financial Workspaces
            </p>
          </div>

          <div className="py-1 max-h-64 overflow-y-auto">
            {accounts.map((acc) => {
              const isSelected = activeAccount.id === acc.id;
              return (
                <button
                  key={acc.id}
                  onClick={() => handleSelectAccount(acc.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${
                    isSelected ? 'bg-indigo-50/70 text-indigo-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {acc.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="truncate font-medium text-slate-900">{acc.name}</p>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                        {acc.role === 'ADMINISTRATOR' ? (
                          <span className="flex items-center text-amber-600">
                            <Shield className="w-3 h-3 mr-0.5" /> Admin
                          </span>
                        ) : (
                          <span className="flex items-center text-slate-500">
                            <Users className="w-3 h-3 mr-0.5" /> Member
                          </span>
                        )}
                        {acc.memberCount && acc.memberCount > 1 && (
                          <span>• {acc.memberCount} members</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
