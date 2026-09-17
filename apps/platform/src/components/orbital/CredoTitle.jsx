import React from 'react';

/**
 * The credo as a container title: VOLUNTAS AMOR, ELEFTHÉROS FATI in capitals, each word's first letter
 * one step up the fluid type scale (design tokens: 2xl max(16px, 0.9vw) → 3xl max(18px, 1vw)). Rendered
 * inside TechContainer's HoloWord, so the initials share the hologram fill.
 */
const INITIAL = { fontSize: 'max(18px, 1vw)' };

const Word = ({ children }) => (
  <>
    <span style={INITIAL}>{children[0]}</span>
    {children.slice(1)}
  </>
);

export default function CredoTitle() {
  return (
    <>
      <Word>VOLUNTAS</Word> <Word>AMOR,</Word> <Word>ELEFTHÉROS</Word> <Word>FATI</Word>
    </>
  );
}
