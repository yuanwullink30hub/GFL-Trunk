/**
 * The installed management app on a phone (owner, 23 Oct 2026): at gardenforlife.nl/admin-dashboard a phone
 * browser only logs in and offers the install; the dashboard itself opens in the installed app (standalone).
 * The desktop shell (window.gflAdmin) and desktop browsers are untouched.
 */
import { useEffect, useState } from 'react';

const ON_SITE = typeof window !== 'undefined' && window.location.protocol === 'https:'
  && window.location.pathname.startsWith('/admin-dashboard') && !window.gflAdmin;

/** A phone or tablet: narrow, or a touch screen without hover. */
export function isPhone() {
  return window.matchMedia('(max-width: 767px), (hover: none) and (pointer: coarse)').matches;
}

/** Running as the installed app (home-screen icon), not in a browser tab. */
export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

/** Phone browser on the website: the dashboard is not shown there, only the install. */
export function installOnly() {
  return ON_SITE && isPhone() && !isStandalone();
}

export function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

// beforeinstallprompt fires once, early: keep it until the install button asks for it.
let deferred = null;
let installed = false;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

export function initInstall() {
  if (!ON_SITE) return;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; notify(); });
  window.addEventListener('appinstalled', () => { deferred = null; installed = true; notify(); });
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/admin-dashboard/sw.js', { scope: '/admin-dashboard/' }).catch(() => {});
  }
}

/** { canPrompt, installed, prompt() } for the install screen. */
export function useInstall() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((n) => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return {
    canPrompt: !!deferred,
    installed,
    prompt: async () => {
      if (!deferred) return;
      const e = deferred;
      deferred = null;
      e.prompt();
      const choice = await e.userChoice.catch(() => null);
      if (choice && choice.outcome === 'accepted') installed = true;
      notify();
    },
  };
}
