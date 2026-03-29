import React from 'react';

/** Strip "SECTIE N:" prefix + surrounding ** bold markers */
export const cleanTitle = (title) => {
  if (!title) return title;
  let t = title.trim();
  t = t.replace(/^\*\*(.+)\*\*$/, '$1').trim();
  t = t.replace(/^\*?\*?SECTIE\s+\d+\*?\*?[\s:.—-]*\s*/i, '').trim();
  t = t.replace(/^\d+[a-zA-Z]?[\s.:—-]+\s*/i, '').trim();
  t = t.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
  return t;
};

/** Map cleaned section title to accent color */
export const getSectionAccent = (title) => {
  const t = cleanTitle(title || '').toLowerCase();
  if (t.includes('identiteit') || t.includes('waarom')) return { color: '#1d9904', rgb: '29, 153, 4' };
  if (t.includes('essentie') || t.includes('schaduw')) return { color: '#a855f7', rgb: '168, 85, 247' };
  if (t.includes('vermenigvuldiging')) return { color: '#f97316', rgb: '249, 115, 22' };
  if (t.includes('blindspot')) return { color: '#ef4444', rgb: '239, 68, 68' };
  if (t.includes('visuele')) return { color: '#a855f7', rgb: '168, 85, 247' };
  if (t.includes('professionele') || t.includes('creatieve')) return { color: '#22d3ee', rgb: '34, 211, 238' };
  if (t.includes('dual') || t.includes('dynamics')) return { color: '#f97316', rgb: '249, 115, 22' };
  if (t.includes('cognitieve') || t.includes('driehoek')) return { color: '#fbbf24', rgb: '251, 191, 36' };
  if (t.includes('alchemie') || t.includes('schakelbord') || t.includes('evolutie') || t.includes('ontologi')) return { color: '#fbbf24', rgb: '251, 191, 36' };
  if (t.includes('ocean') || t.includes('persoonlijkheid')) return { color: '#00d4ff', rgb: '0, 212, 255' };
  if (t.includes('neuroticisme')) return { color: '#ef4444', rgb: '239, 68, 68' };
  if (t.includes('superkracht')) return { color: '#1d9904', rgb: '29, 153, 4' };
  if (t.includes('conflictstijl')) return { color: '#f97316', rgb: '249, 115, 22' };
  if (t.includes('relatiepatroon')) return { color: '#ec4899', rgb: '236, 72, 153' };
  if (t.includes('individuatiepad')) return { color: '#a855f7', rgb: '168, 85, 247' };
  if (t.includes('vergelijk') || t.includes('rapport')) return { color: '#00d4ff', rgb: '0, 212, 255' };
  if (t.includes('groep dynamiek') || t.includes('neurobiologisch')) return { color: '#22d3ee', rgb: '34, 211, 238' };
  return null;
};

/** Format inline markdown: **bold**, *italic* */
export function formatInline(text) {
  if (!text) return text;
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIdx = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index));
    if (m[2]) parts.push(<strong key={m.index}>{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={m.index}>{m[3]}</em>);
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts.length > 0 ? parts : text;
}

/** Render markdown content string to React elements */
export function renderMarkdownContent(content, accentColor) {
  if (!content) return null;
  const lines = content.split('\n');
  const elements = [];
  let listItems = [];
  let blockquoteLines = [];
  let tableRows = [];
  let inCodeBlock = false;
  let codeLines = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} style={{ margin: '0.5rem 0', paddingLeft: '1.25rem', listStyleType: 'disc' }}>
          {listItems.map((li, j) => <li key={j} style={{ marginBottom: '0.25rem' }}>{formatInline(li)}</li>)}
        </ul>
      );
      listItems = [];
    }
  };

  const flushCode = () => {
    if (codeLines.length > 0) {
      elements.push(
        <pre key={`code-${elements.length}`} style={{
          background: 'rgba(0,0,0,0.6)', padding: '0.75rem', borderRadius: '0.5rem',
          fontSize: '0.8rem', overflowX: 'auto', margin: '0.5rem 0',
          border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {codeLines.join('\n')}
        </pre>
      );
      codeLines = [];
    }
  };

  const flushBlockquote = () => {
    if (blockquoteLines.length > 0) {
      elements.push(
        <blockquote key={`bq-${elements.length}`} style={{
          margin: '0.75rem 0', padding: '0.75rem 1rem',
          borderLeft: '3px solid rgba(168, 85, 247, 0.5)',
          background: 'rgba(168, 85, 247, 0.06)', borderRadius: '0 0.5rem 0.5rem 0',
          color: 'rgba(209, 213, 219, 0.85)', fontStyle: 'italic', fontSize: '0.88rem', lineHeight: 1.7,
        }}>
          {blockquoteLines.map((bq, j) => <p key={j} style={{ margin: '0.2rem 0' }}>{formatInline(bq)}</p>)}
        </blockquote>
      );
      blockquoteLines = [];
    }
  };

  const flushTable = () => {
    if (tableRows.length === 0) return;
    const dataRows = tableRows.filter(r => !r.match(/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/));
    if (dataRows.length === 0) { tableRows = []; return; }
    const parseCells = (row) => row.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
    const headerCells = parseCells(dataRows[0]);
    const bodyRows = dataRows.slice(1).map(parseCells);
    elements.push(
      <div key={`tbl-${elements.length}`} style={{ margin: '0.75rem 0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr>
              {headerCells.map((cell, ci) => (
                <th key={ci} style={{
                  padding: '0.4rem 0.6rem', textAlign: 'left', borderBottom: '1px solid rgba(168,85,247,0.3)',
                  color: '#a855f7', fontFamily: "'Lexend Mega', sans-serif", fontSize: '0.7rem',
                  letterSpacing: '0.05em', whiteSpace: 'nowrap',
                }}>{formatInline(cell)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((cells, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'transparent' }}>
                {cells.map((cell, ci) => (
                  <td key={ci} style={{
                    padding: '0.35rem 0.6rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    color: ci === 0 ? 'rgba(209,213,219,1)' : 'rgba(209,213,219,0.8)',
                    fontWeight: ci === 0 ? 600 : 400,
                  }}>{formatInline(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) { flushCode(); inCodeBlock = false; }
      else { flushList(); flushBlockquote(); flushTable(); inCodeBlock = true; }
      continue;
    }
    if (inCodeBlock) { codeLines.push(line); continue; }

    const bqMatch = line.match(/^>\s?(.*)/);
    if (bqMatch) { flushList(); flushTable(); blockquoteLines.push(bqMatch[1]); continue; }
    if (blockquoteLines.length > 0 && line.trim() !== '') { flushBlockquote(); }
    else if (blockquoteLines.length > 0) { flushBlockquote(); }

    if (line.trim().startsWith('|')) { flushList(); tableRows.push(line); continue; }
    if (tableRows.length > 0) flushTable();

    if (line.trim().match(/^(\*{3,}|-{3,}|_{3,})$/)) {
      flushList();
      elements.push(<hr key={`hr-${elements.length}`} style={{ border: 'none', borderTop: '1px solid rgba(168,85,247,0.2)', margin: '1rem 0' }} />);
      continue;
    }

    const subHeadingMatch = line.match(/^#{3,4}\s+(.+)/);
    if (subHeadingMatch) {
      flushList();
      elements.push(
        <h4 key={`h-${elements.length}`} style={{
          color: accentColor || '#c084fc', fontFamily: "'Lexend Mega', sans-serif",
          fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase',
          marginTop: '1rem', marginBottom: '0.4rem',
        }}>{formatInline(subHeadingMatch[1])}</h4>
      );
      continue;
    }

    const bulletMatch = line.match(/^\s*[-*]\s+(.+)/);
    if (bulletMatch) { listItems.push(bulletMatch[1]); continue; }

    const numMatch = line.match(/^\s*\d+\.\s+(.+)/);
    if (numMatch) { listItems.push(numMatch[1]); continue; }

    const indentedMatch = line.match(/^\s{4,}(.+)/);
    if (indentedMatch) {
      flushList();
      elements.push(
        <p key={`ind-${elements.length}`} style={{
          margin: '0.25rem 0', paddingLeft: '1rem',
          borderLeft: '2px solid rgba(255,255,255,0.1)',
          color: 'rgba(209, 213, 219, 0.9)', fontSize: '0.9rem',
        }}>{formatInline(indentedMatch[1])}</p>
      );
      continue;
    }

    flushList();
    if (line.trim() === '') continue;
    elements.push(<p key={`p-${elements.length}`} style={{ margin: '0.4rem 0' }}>{formatInline(line)}</p>);
  }
  flushList();
  flushCode();
  flushBlockquote();
  flushTable();

  return elements;
}
