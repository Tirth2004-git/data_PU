import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Shield, Lock, AlertTriangle, Clock, ArrowRight, Sun, Moon, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { config } from '../config';
import { useTheme } from '../context/ThemeContext';

export const PinGate = ({ children }) => {
  const { isDark, toggleTheme } = useTheme();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // 8-digit PIN state
  const [pinDigits, setPinDigits] = useState(['', '', '', '', '', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);

  // Lockout state
  const [isLocked, setIsLocked] = useState(false);
  const [lockSecondsRemaining, setLockSecondsRemaining] = useState(0);

  const inputRefs = useRef([]);

  // Check existing session and local lockout hint on mount
  useEffect(() => {
    checkInitialStatus();
  }, []);

  // Timer interval for lockout countdown
  useEffect(() => {
    if (!isLocked || lockSecondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setLockSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsLocked(false);
          localStorage.removeItem(config.storageKeys.pinLockUntil);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, lockSecondsRemaining]);

  const checkInitialStatus = async () => {
    try {
      // 1. Check local lock-until hint
      const savedLockUntil = localStorage.getItem(config.storageKeys.pinLockUntil);
      if (savedLockUntil) {
        const lockMs = parseInt(savedLockUntil, 10);
        const now = Date.now();
        if (lockMs > now) {
          const remainingSec = Math.ceil((lockMs - now) / 1000);
          setIsLocked(true);
          setLockSecondsRemaining(remainingSec);
        } else {
          localStorage.removeItem(config.storageKeys.pinLockUntil);
        }
      }

      // 2. Check if we hold a valid server-side site-access session
      const storedToken = localStorage.getItem(config.storageKeys.siteAccess);
      const headers = {};
      if (storedToken) {
        headers['x-site-access-token'] = storedToken;
      }

      const res = await axios.get('/api/site/check', {
        headers,
        withCredentials: true,
      });

      if (res.data?.success) {
        setIsUnlocked(true);
      }
    } catch (err) {
      // Not unlocked yet or token expired
      setIsUnlocked(false);
      if (err.response?.status === 423) {
        handleLockoutResponse(err.response.data);
      }
    } finally {
      setIsCheckingSession(false);
    }
  };

  const handleLockoutResponse = (data) => {
    const retrySec = data?.retryAfterSeconds || 300;
    const lockUntilTimestamp = Date.now() + retrySec * 1000;
    localStorage.setItem(config.storageKeys.pinLockUntil, lockUntilTimestamp.toString());
    setIsLocked(true);
    setLockSecondsRemaining(retrySec);
    setErrorMessage('Too many failed attempts. Portal access locked for 5 minutes.');
    setAttemptsRemaining(0);
  };

  const handleDigitChange = (index, value) => {
    if (isLocked) return;

    // Filter only numeric character
    const digit = value.replace(/\D/g, '').slice(-1);
    const updated = [...pinDigits];
    updated[index] = digit;
    setPinDigits(updated);
    setErrorMessage('');

    // Auto-advance to next input if digit entered
    if (digit && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }

    // If 8th digit filled, automatically submit
    if (digit && index === 7 && updated.every((d) => d !== '')) {
      verifyPinSubmission(updated.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (isLocked) return;

    if (e.key === 'Backspace') {
      if (!pinDigits[index] && index > 0) {
        // Move back to previous box and clear it
        const updated = [...pinDigits];
        updated[index - 1] = '';
        setPinDigits(updated);
        inputRefs.current[index - 1]?.focus();
      } else {
        const updated = [...pinDigits];
        updated[index] = '';
        setPinDigits(updated);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    if (isLocked) return;
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const numericOnly = pastedData.replace(/\D/g, '').slice(0, 8);

    if (numericOnly.length === 8) {
      const newDigits = numericOnly.split('');
      setPinDigits(newDigits);
      inputRefs.current[7]?.focus();
      verifyPinSubmission(numericOnly);
    } else if (numericOnly.length > 0) {
      const updated = [...pinDigits];
      for (let i = 0; i < numericOnly.length && i < 8; i++) {
        updated[i] = numericOnly[i];
      }
      setPinDigits(updated);
      const nextFocus = Math.min(numericOnly.length, 7);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  const verifyPinSubmission = async (fullPin) => {
    if (isLocked || loading) return;

    if (!fullPin || fullPin.length !== 8) {
      setErrorMessage('Please enter all 8 digits of the site PIN.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await axios.post(
        '/api/site/verify-pin',
        { pin: fullPin },
        { withCredentials: true }
      );

      if (res.data?.success) {
        // Save site access token to localStorage and cookie
        if (res.data.siteAccessToken) {
          localStorage.setItem(config.storageKeys.siteAccess, res.data.siteAccessToken);
        }
        localStorage.removeItem(config.storageKeys.pinLockUntil);
        setIsUnlocked(true);
      }
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 423) {
        // Lockout triggered
        handleLockoutResponse(data);
      } else if (status === 401) {
        const remaining = data?.attemptsRemaining ?? (attemptsRemaining ? attemptsRemaining - 1 : 2);
        setAttemptsRemaining(remaining);
        setErrorMessage(
          remaining > 0
            ? `Incorrect PIN. Attempts remaining: ${remaining}`
            : 'Incorrect PIN.'
        );
        // Clear digits and refocus first box
        setPinDigits(['', '', '', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setErrorMessage(data?.message || 'Failed to verify PIN. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    verifyPinSubmission(pinDigits.join(''));
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // If already unlocked, render the normal application
  if (isUnlocked) {
    return <>{children}</>;
  }

  // Initial session verification loader
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <p className="text-xs font-medium text-slate-400">Verifying secure environment...</p>
        </div>
      </div>
    );
  }

  // Render Site PIN Gate
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-slate-950 overflow-hidden selection:bg-indigo-500 selection:text-white font-sans">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Theme toggle in top right */}
      <div className="absolute top-5 right-5 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition-all shadow-md"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>
      </div>

      <div className="relative w-full max-w-lg">
        {/* Header / Brand Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-xl shadow-indigo-500/25 mb-4 border border-indigo-400/20">
            {isLocked ? (
              <AlertTriangle className="w-8 h-8 text-rose-300 animate-bounce" />
            ) : (
              <Shield className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Campus Compass
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Site-Wide Institutional Access Gate
          </p>
        </div>

        {/* Security Card */}
        <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                8-Digit Security PIN
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isLocked ? 'Access temporarily suspended' : 'Authorized personnel only'}
              </p>
            </div>
            <span
              className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                isLocked
                  ? 'text-rose-400 bg-rose-950/60 border-rose-800/60'
                  : 'text-indigo-300 bg-indigo-950/60 border-indigo-800/60'
              }`}
            >
              <Shield className="w-3 h-3" />
              {isLocked ? 'Locked' : 'Protected'}
            </span>
          </div>

          {/* Lockout Warning Banner */}
          {isLocked && (
            <div className="mb-6 p-4 bg-rose-950/60 border border-rose-700/80 rounded-2xl flex items-center gap-3.5 text-rose-200 animate-in fade-in">
              <div className="p-2 bg-rose-900/80 rounded-xl text-rose-300 shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                  Access Temporarily Locked
                </p>
                <p className="text-sm font-semibold mt-0.5 text-white">
                  Try again in {formatCountdown(lockSecondsRemaining)}
                </p>
                <p className="text-[11px] text-rose-300/80 mt-1">
                  Too many consecutive failed attempts. System administrator notified.
                </p>
              </div>
            </div>
          )}

          {/* Error / Attempts Remaining Banner */}
          {!isLocked && errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-950/50 border border-rose-800/70 rounded-2xl flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Enter 8-Digit Access PIN
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPin((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 transition-all border border-slate-700/50"
                    title={showPin ? 'Hide PIN' : 'Show PIN'}
                    aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showPin ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Show</span>
                      </>
                    )}
                  </button>
                </div>
                {attemptsRemaining !== null && !isLocked && (
                  <span className="text-[11px] font-medium text-amber-400">
                    Attempts remaining: {attemptsRemaining}
                  </span>
                )}
              </div>

              {/* 8 Single-Digit Input Boxes */}
              <div className="grid grid-cols-8 gap-1.5 sm:gap-2.5" onPaste={handlePaste}>
                {pinDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    autoComplete="off"
                    data-lpignore="true"
                    disabled={isLocked || loading}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className={`w-full aspect-square text-center text-lg sm:text-xl font-bold rounded-xl border transition-all select-none
                      ${
                        isLocked
                          ? 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                          : digit
                          ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                          : 'bg-slate-950/60 border-slate-700/80 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500'
                      }`}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLocked || loading || pinDigits.some((d) => d === '')}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Verifying PIN...</span>
                </div>
              ) : isLocked ? (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-300" />
                  <span>Locked ({formatCountdown(lockSecondsRemaining)})</span>
                </div>
              ) : (
                <>
                  <span>Unlock Campus Compass</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Security policy footer */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              🔒 Institutional Protection: 3 failed attempts result in an automatic 5-minute lockout and instantaneous administrator email alerts.
            </p>
          </div>
        </div>

        {/* Global institutional footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Campus Compass Intelligence Portal • Parul University • 2026
        </p>
      </div>
    </div>
  );
};

export default PinGate;
