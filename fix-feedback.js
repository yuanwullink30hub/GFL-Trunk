const fs = require('fs');
const path = 'src/components/assessment/AssessmentResultsModal.js';
let f = fs.readFileSync(path, 'utf8');

const START_MARKER = '{!reviewSubmitted && (';
const END_MARKER = '<div data-pdf-hide style={{';

const s = f.indexOf(START_MARKER);
const e = f.indexOf(END_MARKER);

console.log('Block: chars', s, 'to', e, '(' + (e - s) + ' chars)');

const EMAIL_FORM = `{/* Email Form */}
                  <div style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(29, 153, 4, 0.2)',
                    borderRadius: '0.75rem',
                    padding: '1.25rem 1.5rem',
                  }}>
                    <label style={{
                      display: 'block',
                      color: 'rgba(148, 163, 184, 0.7)',
                      fontFamily: "'Figtree', sans-serif",
                      fontSize: '0.8rem',
                      marginBottom: '0.5rem',
                    }}>
                      E-mailadres — ontvang het volledige rapport
                    </label>
                    <input
                      type="email"
                      value={reviewFormData.email}
                      onChange={(e) => setReviewFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="jouw@email.nl"
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '0.375rem',
                        padding: '0.5rem 0.75rem',
                        color: 'rgba(148, 163, 184, 0.9)',
                        fontFamily: "'Figtree', sans-serif",
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  `;

const newContent = f.substring(0, s) + EMAIL_FORM + f.substring(e);
fs.writeFileSync(path, newContent, 'utf8');
console.log('Done. New file size:', newContent.length, '(was', f.length, ')');
