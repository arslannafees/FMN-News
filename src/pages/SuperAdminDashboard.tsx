import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Users, LogOut, AlertCircle, CheckCircle2, Eye, EyeOff, Crown, UserCog, Sun, Moon, X, ShieldCheck, KeyRound, ChevronDown } from 'lucide-react';
import { useNews } from '@/context/NewsContextCore';

interface Toast { id: string; message: string; type: 'success' | 'error'; }

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, add };
}

export function SuperAdminDashboard() {
  const { logout, adminAccounts, fetchAdminAccounts, createAdminAccount, deleteAdminAccount, currentUsername, changePassword } = useNews();
  const navigate = useNavigate();
  const { toasts, add: toast } = useToast();

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('superadmin_theme') as 'dark' | 'light') ?? 'dark';
  });
  const [showModal, setShowModal] = useState(false);
  const [newAccount, setNewAccount] = useState({ username: '', password: '', role: 'admin' });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [view, setView] = useState<'accounts' | 'profile'>('accounts');
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNext, setShowPwNext] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  const dark = theme === 'dark';

  const toggleTheme = () => {
    const next = dark ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('superadmin_theme', next);
  };

  const openModal = () => {
    setNewAccount({ username: '', password: '', role: 'admin' });
    setFormError('');
    setShowPassword(false);
    setShowModal(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setShowModal(false);
    setFormError('');
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    if (showModal) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showModal, isSubmitting]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setShowRoleDropdown(false);
      }
    };
    if (showRoleDropdown) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showRoleDropdown]);

  useEffect(() => { fetchAdminAccounts(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      await createAdminAccount(newAccount.username, newAccount.password, newAccount.role);
      toast('Account created successfully');
      setShowModal(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAdminAccount(id);
      toast('Account deleted');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to delete account', 'error');
    }
    setConfirmDeleteId(null);
  };

  const superadminCount = adminAccounts.filter(a => a.role === 'superadmin').length;
  const adminCount = adminAccounts.filter(a => a.role === 'admin').length;

  // Theme tokens
  const bg = dark ? 'bg-[#0a0a0f]' : 'bg-gray-50';
  const surface = dark ? 'bg-[#0d0d14]' : 'bg-white';
  const modalSurface = dark ? 'bg-[#13131f]' : 'bg-white';
  const border = dark ? 'border-white/5' : 'border-gray-200';
  const textPrimary = dark ? 'text-white' : 'text-gray-900';
  const textSecondary = dark ? 'text-white/50' : 'text-gray-500';
  const textMuted = dark ? 'text-white/25' : 'text-gray-400';
  const labelColor = dark ? 'text-white/40' : 'text-gray-500';
  const navSectionLabel = dark ? 'text-white/20' : 'text-gray-400';
  const navActiveBtn = dark ? 'bg-white/5 text-white' : 'bg-[#e53935]/5 text-gray-900';
  const statBg = dark ? 'bg-white/[0.03]' : 'bg-gray-50';
  const logoutBtn = dark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100';
  const headerBg = dark ? 'bg-[#0a0a0f]/80' : 'bg-gray-50/80';
  const statusBadge = dark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200';
  const statusText = dark ? 'text-white/50' : 'text-gray-500';
  const tableHeaderText = dark ? 'text-white/20' : 'text-gray-400';
  const rowHover = dark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50';
  const avatarDefault = dark ? 'bg-white/8 text-white/70' : 'bg-gray-100 text-gray-600';
  const idText = dark ? 'text-white/25' : 'text-gray-400';
  const deleteConfirmBg = dark ? 'bg-red-950/30 border-red-900/30' : 'bg-red-50 border-red-200';
  const deleteConfirmText = dark ? 'text-red-300/70' : 'text-red-500';
  const deleteYesBtn = dark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700';
  const deleteNoBtn = dark ? 'text-white/30 hover:text-white/60' : 'text-gray-400 hover:text-gray-600';
  const deleteSep = dark ? 'text-white/20' : 'text-gray-300';
  const deleteBtn = dark
    ? 'text-white/25 hover:text-red-400 hover:bg-red-950/20 border-transparent hover:border-red-900/30'
    : 'text-gray-400 hover:text-red-500 hover:bg-red-50 border-transparent hover:border-red-200';
  const toggleBg = dark ? 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10' : 'bg-white border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100';
  const inputCls = dark
    ? 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-[#e53935]/50 focus:bg-white/[0.07]'
    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#e53935]/50 focus:bg-white';
  const modalBorder = dark ? 'border-white/8' : 'border-gray-200';
  const modalOverlay = dark ? 'bg-black/70' : 'bg-black/40';

  return (
    <div className={`min-h-screen ${bg} ${textPrimary} font-sans transition-colors duration-200`}>

      {/* Toast */}
      <div className="fixed top-5 right-5 z-[60] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border backdrop-blur-xl animate-in slide-in-from-right-5 duration-300 ${
            t.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-800/50 text-emerald-300'
              : 'bg-red-950/90 border-red-800/50 text-red-300'
          }`}>
            {t.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            {t.message}
          </div>
        ))}
      </div>

      {/* Create Account Modal */}
      {showModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${modalOverlay} backdrop-blur-sm`}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div
            ref={modalRef}
            className={`w-full max-w-md ${modalSurface} border ${modalBorder} rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200`}
          >
            {/* Modal header */}
            <div className={`flex items-center justify-between px-6 py-5 border-b ${modalBorder}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#e53935]/10 flex items-center justify-center">
                  <ShieldCheck size={17} className="text-[#e53935]" />
                </div>
                <div>
                  <h2 className={`text-base font-bold ${textPrimary}`}>Create New Account</h2>
                  <p className={`text-xs ${labelColor}`}>Fill in the details below</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className={`w-8 h-8 flex items-center justify-center rounded-xl ${dark ? 'text-white/30 hover:text-white hover:bg-white/8' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'} transition-all`}
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleCreate}>
              <div className="px-6 py-5 space-y-4">

                {/* Username field */}
                <div className="space-y-1.5">
                  <label className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest ${labelColor}`}>
                    <UserCog size={11} />
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. john_doe"
                    value={newAccount.username}
                    onChange={e => setNewAccount(p => ({ ...p, username: e.target.value }))}
                    required
                    autoFocus
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${inputCls}`}
                  />
                </div>

                {/* Password field */}
                <div className="space-y-1.5">
                  <label className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest ${labelColor}`}>
                    <KeyRound size={11} />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      value={newAccount.password}
                      onChange={e => setNewAccount(p => ({ ...p, password: e.target.value }))}
                      required
                      className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none transition-all ${inputCls}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg ${dark ? 'text-white/30 hover:text-white/70 hover:bg-white/8' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'} transition-all`}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Role field — custom dropdown */}
                <div className="space-y-1.5">
                  <label className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest ${labelColor}`}>
                    <Crown size={11} />
                    Role
                  </label>
                  <div className="relative" ref={roleDropdownRef}>
                    {/* Trigger */}
                    <button
                      type="button"
                      onClick={() => setShowRoleDropdown(p => !p)}
                      className={`w-full flex items-center justify-between border rounded-xl px-4 py-3 text-sm transition-all focus:outline-none ${
                        showRoleDropdown
                          ? dark ? 'border-[#e53935]/50 bg-white/[0.07]' : 'border-[#e53935]/50 bg-white'
                          : dark ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {newAccount.role === 'superadmin' ? (
                          <>
                            <div className="w-6 h-6 rounded-lg bg-[#e53935]/15 flex items-center justify-center">
                              <Crown size={12} className="text-[#e53935]" />
                            </div>
                            <span className={`font-medium ${textPrimary}`}>Superadmin</span>
                          </>
                        ) : (
                          <>
                            <div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center">
                              <UserCog size={12} className="text-blue-500" />
                            </div>
                            <span className={`font-medium ${textPrimary}`}>Admin</span>
                          </>
                        )}
                      </div>
                      <ChevronDown size={14} className={`${textMuted} transition-transform duration-200 ${showRoleDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown panel */}
                    {showRoleDropdown && (
                      <div className={`absolute top-full left-0 right-0 mt-1.5 z-10 rounded-xl border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 ${
                        dark ? 'bg-[#1a1a2e] border-white/10 shadow-black/50' : 'bg-white border-gray-200 shadow-gray-200/80'
                      }`}>
                        {/* Admin option */}
                        <button
                          type="button"
                          onClick={() => { setNewAccount(p => ({ ...p, role: 'admin' })); setShowRoleDropdown(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                            newAccount.role === 'admin'
                              ? dark ? 'bg-blue-500/10' : 'bg-blue-50'
                              : dark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            newAccount.role === 'admin' ? 'bg-blue-500/20' : dark ? 'bg-white/5' : 'bg-gray-100'
                          }`}>
                            <UserCog size={15} className={newAccount.role === 'admin' ? 'text-blue-400' : textSecondary} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${newAccount.role === 'admin' ? 'text-blue-400' : textPrimary}`}>Admin</p>
                            <p className={`text-[11px] ${textMuted} mt-0.5`}>Create and manage articles</p>
                          </div>
                          {newAccount.role === 'admin' && (
                            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                          )}
                        </button>

                        {/* Divider */}
                        <div className={`mx-4 border-t ${border}`} />

                        {/* Superadmin option */}
                        <button
                          type="button"
                          onClick={() => { setNewAccount(p => ({ ...p, role: 'superadmin' })); setShowRoleDropdown(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                            newAccount.role === 'superadmin'
                              ? dark ? 'bg-[#e53935]/10' : 'bg-red-50'
                              : dark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            newAccount.role === 'superadmin' ? 'bg-[#e53935]/20' : dark ? 'bg-white/5' : 'bg-gray-100'
                          }`}>
                            <Crown size={15} className={newAccount.role === 'superadmin' ? 'text-[#e53935]' : textSecondary} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-semibold ${newAccount.role === 'superadmin' ? 'text-[#e53935]' : textPrimary}`}>Superadmin</p>
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#e53935]/10 text-[#e53935] border border-[#e53935]/20">Full Access</span>
                            </div>
                            <p className={`text-[11px] ${textMuted} mt-0.5`}>Account management + all admin rights</p>
                          </div>
                          {newAccount.role === 'superadmin' && (
                            <div className="w-4 h-4 rounded-full bg-[#e53935] flex items-center justify-center shrink-0">
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error */}
                {formError && (
                  <div className="flex items-center gap-2 text-red-400 bg-red-950/30 border border-red-900/30 rounded-xl px-4 py-3 text-xs">
                    <AlertCircle size={13} className="shrink-0" /> {formError}
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className={`flex items-center justify-between px-6 py-4 border-t ${modalBorder} ${dark ? 'bg-white/[0.02]' : 'bg-gray-50'} rounded-b-2xl`}>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${dark ? 'text-white/40 hover:text-white hover:bg-white/8' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-[#e53935] hover:bg-[#c62828] disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all shadow-lg shadow-red-950/30"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Create Account
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="flex min-h-screen">
        <aside className={`w-64 shrink-0 border-r ${border} ${surface} flex flex-col transition-colors duration-200`}>
          {/* Logo */}
          <div className={`px-6 py-7 border-b ${border}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#e53935] to-[#c62828] flex items-center justify-center shadow-lg shadow-red-950/50">
                <Crown size={16} className="text-white" />
              </div>
              <div>
                <p className={`text-sm font-bold ${textPrimary} tracking-tight`}>Super Admin</p>
                <p className={`text-[10px] ${navSectionLabel} uppercase tracking-widest`}>Control Panel</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            <div className="px-3 py-2 space-y-1">
              <p className={`text-[9px] font-bold uppercase tracking-widest ${navSectionLabel} mb-3`}>Management</p>
              <button
                onClick={() => setView('accounts')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${view === 'accounts' ? (dark ? 'bg-white/10 text-white' : 'bg-[#e53935]/8 text-gray-900') : (dark ? 'text-white/40 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900')}`}
              >
                <Users size={15} className={view === 'accounts' ? 'text-[#e53935]' : ''} />
                Accounts
                <span className="ml-auto text-[10px] bg-[#e53935]/20 text-[#e53935] px-2 py-0.5 rounded-full font-bold">{adminAccounts.length}</span>
              </button>
            </div>
          </nav>

          {/* Stats */}
          <div className={`px-4 py-4 border-t ${border} space-y-2`}>
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${statBg}`}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#e53935]"></div>
                <span className={`text-xs ${textSecondary}`}>Superadmins</span>
              </div>
              <span className={`text-xs font-bold ${textSecondary}`}>{superadminCount}</span>
            </div>
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${statBg}`}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span className={`text-xs ${textSecondary}`}>Admins</span>
              </div>
              <span className={`text-xs font-bold ${textSecondary}`}>{adminCount}</span>
            </div>
          </div>

          {/* Logged-in user + Logout */}
          <div className={`px-4 pb-6 pt-3 border-t ${border} space-y-2`}>
            <button
              onClick={() => setView('profile')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${dark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e53935] to-[#c62828] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {currentUsername ? currentUsername[0].toUpperCase() : 'S'}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className={`text-xs font-semibold ${textPrimary} truncate`}>{currentUsername || 'Superadmin'}</p>
                <p className={`text-[10px] ${textMuted}`}>Superadmin</p>
              </div>
            </button>
            <button
              onClick={() => { logout(); navigate('/admin/login'); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl ${logoutBtn} transition-all text-sm font-medium group`}
            >
              <LogOut size={15} className="group-hover:text-[#e53935] transition-colors" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col">
          {/* Top bar */}
          <header className={`border-b ${border} px-8 py-5 flex items-center justify-between ${headerBg} backdrop-blur-xl sticky top-0 z-10 transition-colors duration-200`}>
            <div>
              <h1 className={`text-lg font-bold ${textPrimary} tracking-tight`}>
                {view === 'profile' ? 'My Profile' : 'Account Management'}
              </h1>
              <p className={`text-xs ${textMuted} mt-0.5`}>
                {view === 'profile' ? 'View your info and change your password' : 'Create and manage admin accounts'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className={`w-8 h-8 flex items-center justify-center rounded-xl border ${toggleBg} transition-all`}
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {dark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <div className={`flex items-center gap-2 ${statusBadge} border px-3 py-1.5 rounded-xl`}>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className={`text-xs ${statusText} font-medium`}>{adminAccounts.length} total accounts</span>
              </div>
              {/* Open modal button */}
              {view === 'accounts' && (
                <button
                  onClick={openModal}
                  className="flex items-center gap-2 bg-[#e53935] hover:bg-[#c62828] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-lg shadow-red-950/30"
                >
                  <Plus size={14} />
                  New Account
                </button>
              )}
            </div>
          </header>

          <div className="flex-1 p-8">

            {/* Profile view */}
            {view === 'profile' && (
              <div className="max-w-lg space-y-5">
                {/* Who's logged in */}
                <div className={`${surface} border ${border} rounded-2xl p-6 transition-colors duration-200`}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#e53935] to-[#c62828] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-red-950/30">
                      {currentUsername ? currentUsername[0].toUpperCase() : 'S'}
                    </div>
                    <div>
                      <h2 className={`text-base font-bold ${textPrimary}`}>{currentUsername || 'Superadmin'}</h2>
                      <span className="inline-flex items-center gap-1.5 mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#e53935]/10 text-[#e53935] border border-[#e53935]/20">
                        <Crown size={9} /> Superadmin
                      </span>
                    </div>
                  </div>
                </div>

                {/* Change password */}
                <div className={`${surface} border ${border} rounded-2xl overflow-hidden transition-colors duration-200`}>
                  <div className={`px-6 py-4 border-b ${border} flex items-center gap-3`}>
                    <div className="w-8 h-8 rounded-lg bg-[#e53935]/10 flex items-center justify-center">
                      <KeyRound size={15} className="text-[#e53935]" />
                    </div>
                    <div>
                      <h3 className={`text-sm font-semibold ${textPrimary}`}>Change Password</h3>
                      <p className={`text-[11px] ${labelColor}`}>Update your account password</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Current password */}
                    <div className="space-y-1.5">
                      <label className={`text-[11px] font-bold uppercase tracking-widest ${labelColor}`}>Current Password</label>
                      <div className="relative">
                        <input
                          type={showPwCurrent ? 'text' : 'password'}
                          placeholder="Enter current password"
                          value={pwForm.current}
                          onChange={e => { setPwForm(p => ({ ...p, current: e.target.value })); setPwError(''); setPwSuccess(false); }}
                          className={`w-full border rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none transition-all ${inputCls}`}
                        />
                        <button type="button" onClick={() => setShowPwCurrent(p => !p)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${textMuted} hover:${textSecondary} transition-colors`}>
                          {showPwCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* New password */}
                    <div className="space-y-1.5">
                      <label className={`text-[11px] font-bold uppercase tracking-widest ${labelColor}`}>New Password</label>
                      <div className="relative">
                        <input
                          type={showPwNext ? 'text' : 'password'}
                          placeholder="Min. 8 characters"
                          value={pwForm.next}
                          onChange={e => { setPwForm(p => ({ ...p, next: e.target.value })); setPwError(''); setPwSuccess(false); }}
                          className={`w-full border rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none transition-all ${inputCls}`}
                        />
                        <button type="button" onClick={() => setShowPwNext(p => !p)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${textMuted} hover:${textSecondary} transition-colors`}>
                          {showPwNext ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm new password */}
                    <div className="space-y-1.5">
                      <label className={`text-[11px] font-bold uppercase tracking-widest ${labelColor}`}>Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="Repeat new password"
                        value={pwForm.confirm}
                        onChange={e => { setPwForm(p => ({ ...p, confirm: e.target.value })); setPwError(''); setPwSuccess(false); }}
                        className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${inputCls}`}
                      />
                    </div>

                    {pwError && (
                      <div className="flex items-center gap-2 text-red-400 bg-red-950/30 border border-red-900/30 rounded-xl px-4 py-2.5 text-xs">
                        <AlertCircle size={13} className="shrink-0" /> {pwError}
                      </div>
                    )}
                    {pwSuccess && (
                      <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/30 border border-emerald-900/30 rounded-xl px-4 py-2.5 text-xs">
                        <CheckCircle2 size={13} className="shrink-0" /> Password changed successfully
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        disabled={pwLoading || !pwForm.current || !pwForm.next || !pwForm.confirm}
                        onClick={async () => {
                          setPwError('');
                          if (pwForm.next !== pwForm.confirm) { setPwError('New passwords do not match'); return; }
                          if (pwForm.next.length < 8) { setPwError('New password must be at least 8 characters'); return; }
                          setPwLoading(true);
                          try {
                            await changePassword(pwForm.current, pwForm.next);
                            setPwForm({ current: '', next: '', confirm: '' });
                            setPwSuccess(true);
                          } catch (err: unknown) {
                            setPwError(err instanceof Error ? err.message : 'Failed to change password');
                          } finally {
                            setPwLoading(false);
                          }
                        }}
                        className="flex items-center gap-2 bg-[#e53935] hover:bg-[#c62828] disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-red-950/30"
                      >
                        {pwLoading ? (
                          <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                        ) : 'Update Password'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Accounts table */}
            {view === 'accounts' &&
            <div className={`${surface} border ${border} rounded-2xl overflow-hidden transition-colors duration-200`}>
              <div className={`px-6 py-4 border-b ${border} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <UserCog size={15} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className={`text-sm font-semibold ${textPrimary}`}>All Accounts</h2>
                    <p className={`text-[11px] ${labelColor}`}>{adminAccounts.length} account{adminAccounts.length !== 1 ? 's' : ''} registered</p>
                  </div>
                </div>
                <button
                  onClick={openModal}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${dark ? 'border-white/8 text-white/50 hover:text-white hover:bg-white/5 hover:border-white/15' : 'border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                >
                  <Plus size={12} /> Add Account
                </button>
              </div>

              {adminAccounts.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${dark ? 'bg-white/[0.03]' : 'bg-gray-100'} flex items-center justify-center`}>
                    <Users size={24} className={textMuted} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${textSecondary}`}>No accounts yet</p>
                    <p className={`text-xs ${textMuted} mt-0.5`}>Create your first account to get started</p>
                  </div>
                  <button
                    onClick={openModal}
                    className="flex items-center gap-2 bg-[#e53935] hover:bg-[#c62828] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                  >
                    <Plus size={13} /> Create Account
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {/* Table header */}
                  <div className={`grid grid-cols-[1fr_140px_160px] gap-4 px-6 py-3 border-b ${border}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${tableHeaderText}`}>Account</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${tableHeaderText}`}>Role</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${tableHeaderText} text-right`}>Actions</span>
                  </div>

                  {adminAccounts.map((account, i) => (
                    <div
                      key={account.id}
                      className={`grid grid-cols-[1fr_140px_160px] gap-4 items-center px-6 py-4 transition-colors ${rowHover} ${i !== adminAccounts.length - 1 ? `border-b ${border}` : ''}`}
                    >
                      {/* Account info */}
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                          account.role === 'superadmin'
                            ? 'bg-gradient-to-br from-[#e53935] to-[#c62828] text-white shadow-lg shadow-red-950/40'
                            : avatarDefault
                        }`}>
                          {account.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${textPrimary}`}>{account.username}</p>
                          <p className={`text-[10px] ${idText} font-mono`}>{account.id.slice(0, 12)}…</p>
                        </div>
                      </div>

                      {/* Role badge */}
                      <div>
                        {account.role === 'superadmin' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#e53935]/10 border border-[#e53935]/20 text-[#e53935] text-[10px] font-bold uppercase tracking-wider">
                            <Crown size={10} /> Superadmin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-bold uppercase tracking-wider">
                            <UserCog size={10} /> Admin
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2">
                        {confirmDeleteId === account.id ? (
                          <div className={`flex items-center gap-2 ${deleteConfirmBg} border rounded-xl px-3 py-1.5`}>
                            <span className={`text-xs ${deleteConfirmText}`}>Confirm delete?</span>
                            <button onClick={() => handleDelete(account.id)} className={`text-xs font-bold ${deleteYesBtn} transition-colors`}>Yes</button>
                            <span className={deleteSep}>·</span>
                            <button onClick={() => setConfirmDeleteId(null)} className={`text-xs font-bold ${deleteNoBtn} transition-colors`}>No</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(account.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${deleteBtn} transition-all text-xs font-medium`}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>}
          </div>
        </main>
      </div>
    </div>
  );
}
