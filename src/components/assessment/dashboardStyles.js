/**
 * Shared dashboard styles — single source of truth.
 * Color palette from the SciFiUI landing page content containers:
 *   - Background: rgba(10, 5, 16, 0.95) (matches #0a0510)
 *   - Primary accent: #ffae00 (gold) — corners, buttons, labels
 *   - Secondary accent: #bc13fe (purple) — borders, badges, ticks
 *   - Text: #FFFEF0 (cream white)
 *   - Inspired by HoloAuth system UI layout
 */
import React from 'react';

// ── Color constants (import as C) ──
export const C = {
  gold: '#ffae00',
  purple: '#bc13fe',
  text: '#FFFEF0',
  textDim: 'rgba(255, 254, 240, 0.5)',
  bg: 'rgba(2, 0, 3, 0.3)',                  // SectorFrame exact
  bgCard: 'rgba(2, 0, 3, 0.3)',              // SectorFrame exact
  err: '#fca5a5',
  errBg: 'rgba(239, 68, 68, 0.08)',
  errBorder: 'rgba(239, 68, 68, 0.6)',
};

// ── Typography ──
export const FONT = "'Lexend Mega', Arial, Helvetica, sans-serif";

// SectorFrame exact box-shadow (single string used everywhere)
const SECTOR_SHADOW = '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(245, 158, 11, 0.06), inset 0 0 30px rgba(245, 158, 11, 0.03)';

// ── Container / Modal shell ──
export const MODAL_CONTAINER = {
  borderRadius: '0.5rem',
  backgroundColor: C.bgCard,
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  display: 'flex',
  flexDirection: 'column',
  color: C.text,
  fontFamily: FONT,
  fontSize: 'max(12px, 0.65vw)',
  padding: '1.25rem',                        // SectorFrame p-5 = 1.25rem
  maxHeight: '85vh',
  overflowY: 'auto',
  position: 'relative',
  boxShadow: SECTOR_SHADOW,
};

// ── Buttons (GlowButton gradient style) ──
export const BTN = {
  padding: '0.4rem 0.9rem',
  background: 'linear-gradient(135deg, rgba(255, 174, 0, 0.1), rgba(255, 174, 0, 0.2))',
  border: '1px solid rgba(255, 174, 0, 0.5)',
  color: C.gold,
  borderRadius: '0.15rem',
  cursor: 'pointer',
  fontFamily: FONT,
  fontSize: 'max(10px, 0.5vw)',
  transition: 'all 0.3s',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontWeight: 'bold',
};

export const BTN_LG = {
  ...BTN,
  padding: '0.7rem 1.5rem',
  fontSize: 'max(11px, 0.6vw)',
  letterSpacing: '0.15em',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
};

// ── Labels ──
export const LABEL = {
  fontSize: 'max(10px, 0.5vw)',
  color: C.gold,
  opacity: 0.7,
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  marginBottom: '0.2rem',
  fontWeight: 'bold',
};

export const FIELD_LABEL = {
  fontSize: 'max(9px, 0.48vw)',
  color: 'rgba(255, 174, 0, 0.6)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: '0.3rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
};

// ── Inputs ──
export const INPUT = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  border: '1px solid rgba(255, 174, 0, 0.2)',
  borderRadius: '0.15rem',
  color: C.text,
  fontFamily: FONT,
  fontSize: 'max(12px, 0.65vw)',
  outline: 'none',
  transition: 'all 0.25s ease',
};

export const INPUT_SM = {
  ...INPUT,
  padding: '0.4rem 0.6rem',
  fontSize: 'max(10px, 0.5vw)',
};

export const TEXTAREA = {
  ...INPUT,
  minHeight: '100px',
  padding: '0.5rem',
  fontFamily: `${FONT}, monospace`,
  fontSize: 'max(10px, 0.5vw)',
  resize: 'vertical',
};

// ── Tab buttons ──
export const TAB_STYLE = (active) => ({
  ...BTN,
  background: active
    ? 'linear-gradient(135deg, rgba(255, 174, 0, 0.2), rgba(255, 174, 0, 0.3))'
    : 'linear-gradient(135deg, rgba(255, 174, 0, 0.03), rgba(255, 174, 0, 0.06))',
  borderColor: active ? 'rgba(255, 174, 0, 0.7)' : 'rgba(255, 174, 0, 0.2)',
});

// ── Separator line ──
export const SEPARATOR = {
  height: 1,
  backgroundColor: 'rgba(255, 174, 0, 0.12)',
};

// ── Hover helpers (GlowButton-style glow) ──
export const hover = (e, on) => {
  if (on) {
    e.target.style.background = 'linear-gradient(135deg, rgba(255, 174, 0, 0.8), rgba(255, 174, 0, 0.9))';
    e.target.style.color = '#000000';
    e.target.style.boxShadow = '0 0 20px rgba(255, 174, 0, 0.6)';
  } else {
    e.target.style.background = 'linear-gradient(135deg, rgba(255, 174, 0, 0.1), rgba(255, 174, 0, 0.2))';
    e.target.style.color = '#ffae00';
    e.target.style.boxShadow = 'none';
  }
};

export const hoverDanger = (e, on) => {
  if (on) {
    e.target.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.7), rgba(239, 68, 68, 0.8))';
    e.target.style.color = '#ffffff';
    e.target.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.5)';
  } else {
    e.target.style.background = 'linear-gradient(135deg, rgba(255, 174, 0, 0.1), rgba(255, 174, 0, 0.2))';
    e.target.style.color = '#ffae00';
    e.target.style.boxShadow = 'none';
  }
};

// ── Input focus (with glow matching GlowButton) ──
export const inputFocus = (e) => {
  e.target.style.borderColor = 'rgba(255, 174, 0, 0.5)';
  e.target.style.backgroundColor = 'rgba(255, 174, 0, 0.04)';
  e.target.style.boxShadow = '0 0 15px rgba(255, 174, 0, 0.15)';
};

export const inputBlur = (e) => {
  e.target.style.borderColor = 'rgba(255, 174, 0, 0.2)';
  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
  e.target.style.boxShadow = 'none';
};

// ── Error box ──
export const ERROR_STYLE = {
  width: '100%',
  padding: '0.5rem 0.7rem',
  borderLeft: '2px solid rgba(239, 68, 68, 0.6)',
  backgroundColor: 'rgba(239, 68, 68, 0.08)',
  color: '#fca5a5',
  fontSize: 'max(10px, 0.5vw)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
};

// ── Wrapper for pages that animate in/out ──
export const PAGE_WRAPPER = (isVisible) => ({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: isVisible ? 1 : 0,
  transition: 'opacity 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
  pointerEvents: isVisible ? 'auto' : 'none',
});

// ── Corner accent brackets (renders 4 corner DIVs) ──
export const CornerAccents = ({ color = '#ffae00' }) => (
  <>
    <div style={{ position: 'absolute', top: -1, left: -1, width: 10, height: 10, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}`, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', top: -1, right: -1, width: 10, height: 10, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}`, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: -1, left: -1, width: 10, height: 10, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}`, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}`, pointerEvents: 'none' }} />
  </>
);
