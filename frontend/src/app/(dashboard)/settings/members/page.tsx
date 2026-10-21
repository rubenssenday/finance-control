'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';

interface Member {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: 'ADMINISTRATOR' | 'MEMBER';
  joinedAt: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: 'ADMINISTRATOR' | 'MEMBER';
  expiresAt: string;
  createdAt: string;
}

export default function MembersSettingsPage() {
  const { activeAccount } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Invite modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMINISTRATOR' | 'MEMBER'>('MEMBER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!activeAccount) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient<{
        data: {
          members: Member[];
          pendingInvitations: PendingInvitation[];
        };
      }>(`/accounts/${activeAccount.id}/members`);

      setMembers(res.data.members || []);
      setInvitations(res.data.pendingInvitations || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load members.');
    } finally {
      setIsLoading(false);
    }
  }, [activeAccount]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient(`/accounts/${activeAccount.id}/invitations`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      setSuccess(`Invitation successfully sent to ${inviteEmail}.`);
      setInviteEmail('');
      setIsModalOpen(false);
      fetchMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: 'ADMINISTRATOR' | 'MEMBER') => {
    if (!activeAccount) return;
    setError(null);
    setSuccess(null);

    try {
      await apiClient(`/accounts/${activeAccount.id}/members/${targetUserId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });

      setSuccess('Member role updated successfully.');
      fetchMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to update member role.');
    }
  };

  const handleRemoveMember = async (targetUserId: string, memberName: string) => {
    if (!activeAccount) return;
    if (!confirm(`Are you sure you want to remove ${memberName} from this account?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await apiClient(`/accounts/${activeAccount.id}/members/${targetUserId}`, {
        method: 'DELETE',
      });

      setSuccess(`${memberName} was removed from the account.`);
      fetchMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to remove member.');
    }
  };

  const isAdmin = activeAccount?.role === 'ADMINISTRATOR';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workspace Members</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage who has access to <span className="font-semibold text-slate-800">{activeAccount?.name}</span>
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-start space-x-2.5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start space-x-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Active Members Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Active Members ({members.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-600" />
            <p className="text-sm font-medium">Loading members...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map((member) => (
              <div
                key={member.id}
                className="p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center space-x-3.5">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.displayName}
                      className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm">
                      {member.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-bold text-slate-900">{member.displayName}</p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-auto">
                  {isAdmin ? (
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleRoleChange(member.userId, e.target.value as 'ADMINISTRATOR' | 'MEMBER')
                      }
                      className="text-xs font-semibold rounded-lg border border-slate-200 bg-white py-1.5 px-2.5 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                    </select>
                  ) : (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                        member.role === 'ADMINISTRATOR'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {member.role === 'ADMINISTRATOR' ? 'Admin' : 'Member'}
                    </span>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => handleRemoveMember(member.userId, member.displayName)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations Table */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
              <Clock className="w-4 h-4 mr-2 text-slate-400" />
              Pending Invitations ({invitations.length})
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="p-5 sm:px-6 flex items-center justify-between text-sm hover:bg-slate-50/50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-slate-800">{inv.email}</p>
                  <p className="text-xs text-slate-400">
                    Expires on {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/50 uppercase">
                    Role: {inv.role}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/50">
                    Pending
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Invite New Member</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="partner@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 text-sm text-slate-900 transition-all outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Workspace Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'ADMINISTRATOR' | 'MEMBER')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 text-sm text-slate-900 transition-all outline-hidden"
                >
                  <option value="MEMBER">Member (Can manage expenses, cards, and categories)</option>
                  <option value="ADMINISTRATOR">Administrator (Full control including members & deletion)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !inviteEmail}
                  className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Send Invitation</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
