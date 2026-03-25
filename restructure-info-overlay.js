/**
 * Restructure script: Move info overlay from inside modalRef to be a sibling
 * outside the intro card conditional.
 * 
 * Run: node restructure-info-overlay.js
 * Delete after use.
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'assessment', 'AssessmentIntro.js');
const raw = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
const lines = raw.split('\n');

console.log('Total lines:', lines.length);

// === STEP 1: Find the info overlay block boundaries (0-indexed) ===
let infoStart = -1; // First line of the info overlay block (comment)
let infoEnd = -1;   // Last line (the `)}` that closes {showInfo && (})
let infoContentStart = -1; // First line of inner content (after wrapper div opens)
let infoContentEnd = -1; // Last line of inner content (before wrapper div closes)

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{/* ═══ INFO OVERLAY ═══ */}')) {
    infoStart = i;
  }
  if (infoStart >= 0 && lines[i].includes('{/* Scrollable content area')) {
    infoContentStart = i;
  }
}

// Find the closing `)}` for the info overlay conditional
// It's the first `)}` after the info overlay that's at 8-space indent
for (let i = infoStart + 1; i < lines.length; i++) {
  if (lines[i].trim() === ')}' && lines[i].match(/^        \)}/)) {
    // Check that this is the info overlay close (not consent or leave confirm)
    // It should come before the OCEAN modal
    if (i > infoStart + 50) { // info overlay is at least ~200 lines
      infoEnd = i;
      break;
    }
  }
}

// Find the inner content boundaries
// Content ends just before the closing </div> of the wrapper
// The wrapper div closes with `          </div>` (10 spaces) right before `        )}`
infoContentEnd = infoEnd - 1; // The line before `)}` is `</div>` closing the wrapper

console.log('Info overlay block: lines', infoStart, 'to', infoEnd, '(0-indexed)');
console.log('Info content starts at line:', infoContentStart);
console.log('Info content ends at line:', infoContentEnd);

// Verify
console.log('First line:', JSON.stringify(lines[infoStart]));
console.log('Last line:', JSON.stringify(lines[infoEnd]));
console.log('Content start:', JSON.stringify(lines[infoContentStart]));
console.log('Content end:', JSON.stringify(lines[infoContentEnd]));

// === STEP 2: Extract the inner content (scrollable area + back button) ===
// The inner content is everything from the scrollable div through the back button div
const innerContent = lines.slice(infoContentStart, infoContentEnd + 1);

// Re-indent: inner content was at ~12 spaces (inside absolute div inside modalRef)
// In new structure it will be at ~10 spaces (inside glass panel inside outer wrapper)
// Actually, let's keep the same indent level since both are at similar depth

console.log('\nInner content: ' + innerContent.length + ' lines');
console.log('First inner line:', JSON.stringify(innerContent[0]));
console.log('Last inner line:', JSON.stringify(innerContent[innerContent.length - 1]));

// === STEP 3: Remove the info overlay block from its current position ===
const linesRemoved = infoEnd - infoStart + 1;
lines.splice(infoStart, linesRemoved);
console.log('\nRemoved', linesRemoved, 'lines from index', infoStart);

// === STEP 4: Find new positions after removal ===
// Find the outer wrapper close (</div> at 6 spaces after modalRef close)
let outerWrapperClose = -1;
let modalRefClose = -1;
let fixedBackdropClose = -1;

// Search from the end of the file backwards
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i] === '    </>' && fixedBackdropClose === -1) {
    // Fragment close - look for </div> just before
    for (let j = i - 1; j >= i - 5; j--) {
      if (lines[j].match(/^    <\/div>$/)) {
        fixedBackdropClose = j;
        break;
      }
    }
  }
  if (fixedBackdropClose >= 0) break;
}

// Find outer wrapper close (6 spaces) and modalRef close (8 spaces)
for (let i = fixedBackdropClose - 1; i >= fixedBackdropClose - 5; i--) {
  if (lines[i].match(/^      <\/div>$/) && outerWrapperClose === -1) {
    outerWrapperClose = i;
  }
  if (lines[i].match(/^        <\/div>$/) && modalRefClose === -1) {
    modalRefClose = i;
  }
}

console.log('\nNew positions:');
console.log('modalRef close:', modalRefClose, '→', JSON.stringify(lines[modalRefClose]));
console.log('outerWrapper close:', outerWrapperClose, '→', JSON.stringify(lines[outerWrapperClose]));
console.log('fixedBackdrop close:', fixedBackdropClose, '→', JSON.stringify(lines[fixedBackdropClose]));

// === STEP 5: Insert `)}` after the outer wrapper close ===
lines.splice(outerWrapperClose + 1, 0, '    )}');
console.log('Inserted )} at line', outerWrapperClose + 1);

// Update positions after insertion
const insertionPoint = outerWrapperClose + 2; // After the `)}` we just inserted
// fixedBackdropClose shifted by 1

// === STEP 6: Build the new info overlay block ===
const s_ref = 's'; // Just for template reference
const newInfoBlock = [
  '',
  '    {/* ═══ INFO OVERLAY — sibling element, blurs HoloEarth directly ═══ */}',
  '    {showInfo && (',
  '      <div className="relative w-full" style={{ maxWidth: s.modalMaxWidth, transformOrigin: infoOrigin, animation: `${infoClosing ? \'infoContract\' : \'infoExpand\'} 0.375s cubic-bezier(0.4, 0, 0.2, 1) forwards` }}>',
  '        {/* Top-Left Corner */}',
  '        <div className="absolute -top-0.5 -left-0.5 w-4 h-4 z-10" style={{ border: \'1.5px solid #a855f7\', borderRadius: \'10px 0 0 0\', borderBottom: \'none\', borderRight: \'none\' }}></div>',
  '        {/* Top-Right Corner */}',
  '        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 z-10" style={{ border: \'1.5px solid #a855f7\', borderRadius: \'0 10px 0 0\', borderBottom: \'none\', borderLeft: \'none\' }}></div>',
  '        {/* Bottom-Left Corner */}',
  '        <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 z-10" style={{ border: \'1.5px solid #a855f7\', borderRadius: \'0 0 0 10px\', borderTop: \'none\', borderRight: \'none\' }}></div>',
  '        {/* Bottom-Right Corner */}',
  '        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 z-10" style={{ border: \'1.5px solid #a855f7\', borderRadius: \'0 0 10px 0\', borderTop: \'none\', borderLeft: \'none\' }}></div>',
  '',
  '        {/* Inner glass panel */}',
  '        <div',
  '          ref={infoOverlayRef}',
  '          className="relative w-full rounded-lg"',
  '          style={{',
  '            backgroundColor: \'rgba(2, 0, 3, 0.3)\',',
  '            backdropFilter: \'blur(32px)\',',
  '            WebkitBackdropFilter: \'blur(32px)\',',
  '            boxShadow: \'0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(168,85,247,0.06), inset 0 0 30px rgba(168,85,247,0.03)\',',
  '            overflow: \'hidden\',',
  '            minHeight: s.modalMinHeight,',
  '            maxHeight: s.modalMaxHeight,',
  '            display: \'flex\',',
  '            flexDirection: \'column\',',
  '            paddingTop: `calc(${s.padding.split(\' \')[0]} * 2)`,',
  '            paddingBottom: `calc(${s.padding.split(\' \')[0]} * 2)`,',
  '            paddingLeft: s.padding.split(\' \')[1],',
  '            paddingRight: 0,',
  '            boxSizing: \'border-box\',',
  '          }}',
  '        >',
  // Inner content will be inserted here
];

// Re-indent the inner content: originally at various indent levels inside the old wrapper
// The old wrapper was at 10-space indent (inside 8-space conditional block)
// The new wrapper is at 8-space indent (inside 6-space conditional block)  
// So we need to de-indent by 2 spaces
const reindentedContent = innerContent.map(line => {
  if (line.startsWith('            ')) {
    return '          ' + line.slice(12); // Remove 12, add 10
  }
  return line; // Keep as-is if indent doesn't match
});

// Actually, let me check: is the content at the right indent already?
// The content was inside a div at 10 spaces inside modalRef. 
// Now it's inside a div at 8 spaces inside the sibling wrapper.
// The scrollable div was at 12 spaces. Now it should be at 10 spaces.
// But actually, the exact indentation doesn't matter for React. Let me just keep it as-is.

const closingBlock = [
  '        </div>',
  '      </div>',
  '    )}',
  '',
];

// Combine
const fullNewBlock = [...newInfoBlock, ...innerContent, ...closingBlock];

// Insert at the insertion point
lines.splice(insertionPoint, 0, ...fullNewBlock);

console.log('\nInserted', fullNewBlock.length, 'lines at index', insertionPoint);
console.log('New total lines:', lines.length);

// === STEP 7: Write the file ===
fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('\nFile written successfully!');
