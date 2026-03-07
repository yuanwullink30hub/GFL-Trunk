import React, { useState, useRef, useEffect, memo } from 'react';
import { Mail, Send, Paperclip, X, FileText, User, UserPlus, ChevronDown } from 'lucide-react';
import { sendFormDirect } from '../../utils/apiClient';

// ═══════════════════════════════════════════════════════════
// GFL Email Template — standalone email card with PDF attach
// ═══════════════════════════════════════════════════════════

const GOLD    = '#ffae00';
const ACCENT = '#bc13fe';
const CARD   = 'rgba(255,255,255,0.025)';
const BORDER = 'rgba(255,255,255,0.06)';
const DIM    = 'rgba(255,255,255,0.40)';
const TEXT   = '#e2e2e2';
const FONT   = "'Figtree', 'Lexend Mega', sans-serif";

const input = {
  width: '100%',
  padding: '0.65rem 0.85rem',
  paddingLeft: '2.2rem',
  fontSize: '0.82rem',
  backgroundColor: 'rgba(255,255,255,0.035)',
  color: TEXT,
  border: `1px solid ${BORDER}`,
  borderRadius: '0.65rem',
  outline: 'none',
  fontFamily: FONT,
  transition: 'border-color 0.2s',
};

const inputNoPad = { ...input, paddingLeft: '0.85rem' };

const sectionHeading = {
  fontSize: '1.05rem',
  fontWeight: 700,
  color: TEXT,
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '1.2rem',
};

const labelCss = {
  fontSize: '0.6rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: DIM,
  marginBottom: '0.35rem',
};

/* ── Saved contacts ── */
const EMAIL_CONTACTS_KEY = 'gfl_email_contacts';
const loadContacts = () => { try { return JSON.parse(localStorage.getItem(EMAIL_CONTACTS_KEY) || '[]'); } catch { return []; } };
const persistContacts = (list) => localStorage.setItem(EMAIL_CONTACTS_KEY, JSON.stringify(list));

/* Convert a File to base64 string */
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      // strip "data:...;base64," prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const EmailTemplate = memo(({ isMobile }) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [attachments, setAttachments] = useState([]); // { name, size, base64 }
  const [sendingState, setSendingState] = useState(null); // null | 'sending' | 'sent' | 'error'
  const [sendError, setSendError] = useState('');
  const fileInputRef = useRef(null);

  // Saved contacts
  const [savedContacts, setSavedContacts] = useState(loadContacts);
  const [showContactList, setShowContactList] = useState(false);
  const contactRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (contactRef.current && !contactRef.current.contains(e.target)) setShowContactList(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectContact = (c) => {
    setRecipientName(c.name);
    setRecipientEmail(c.email || '');
    setShowContactList(false);
  };
  const saveCurrentContact = () => {
    if (!recipientName.trim() && !recipientEmail.trim()) return;
    const entry = { id: Date.now().toString(), name: recipientName.trim() || recipientEmail.trim(), email: recipientEmail.trim() };
    const updated = [entry, ...savedContacts.filter(c => c.name !== entry.name)];
    setSavedContacts(updated);
    persistContacts(updated);
  };
  const removeContact = (id) => {
    const updated = savedContacts.filter(c => c.id !== id);
    setSavedContacts(updated);
    persistContacts(updated);
  };

  /* ── Handle file selection ── */
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    const pdfFiles = files.filter(f => f.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      setSendError('Alleen PDF-bestanden zijn toegestaan');
      setTimeout(() => setSendError(''), 3000);
      return;
    }

    const newAttachments = [];
    for (const file of pdfFiles) {
      try {
        const base64 = await fileToBase64(file);
        newAttachments.push({
          name: file.name,
          size: file.size,
          base64,
        });
      } catch {
        setSendError(`Fout bij inlezen van ${file.name}`);
      }
    }
    setAttachments(prev => [...prev, ...newAttachments]);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Remove attachment ── */
  const removeAttachment = (idx) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  /* ── Send email ── */
  const handleSendEmail = async () => {
    if (!recipientEmail.trim()) {
      setSendError('Vul een e-mailadres in');
      return;
    }
    setSendingState('sending');
    setSendError('');
    try {
      const payload = {
        templateId: 'email',
        templateLabel: 'E-mail',
        type: 'email',
        content: emailBody || '(geen berichttekst)',
        recipientEmail,
        subject: emailSubject || 'Garden For Life',
      };

      // Attach first PDF if present (primary attachment via existing API)
      if (attachments.length > 0) {
        payload.pdfBase64 = attachments[0].base64;
        payload.attachmentFilename = attachments[0].name;
      }

      // Additional attachments if the API supports it
      if (attachments.length > 1) {
        payload.additionalAttachments = attachments.slice(1).map(a => ({
          filename: a.name,
          content: a.base64,
        }));
      }

      await sendFormDirect(payload);
      setSendingState('sent');
      // Reset form after send
      setTimeout(() => {
        setSendingState(null);
        setRecipientEmail('');
        setEmailSubject('');
        setEmailBody('');
        setAttachments([]);
      }, 3000);
    } catch (err) {
      setSendError(err.message || 'Versturen mislukt');
      setSendingState('error');
      setTimeout(() => setSendingState(null), 4000);
    }
  };

  /* ═══════════════════════════════════════════ */
  /*               R E N D E R                  */
  /* ═══════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ════════════ EMAIL CARD ════════════ */}
      <div style={isMobile ? {
        display: 'flex', flexDirection: 'column', gap: '1.2rem',
      } : {
        backgroundColor: CARD,
        padding: '1.6rem',
        borderRadius: '1.2rem',
        border: `1px solid ${BORDER}`,
        display: 'flex', flexDirection: 'column', gap: '1.2rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0' }}>
          <h2 style={{ ...sectionHeading, marginBottom: 0 }}>
            <Mail size={20} color={ACCENT} />
            E-mail Versturen
          </h2>
          <button onClick={saveCurrentContact} title="Contact opslaan" style={{
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.35rem 0.6rem', fontSize: '0.68rem', fontWeight: 700,
            backgroundColor: 'rgba(255,174,0,0.08)', color: GOLD,
            border: 'none', borderRadius: '0.4rem', cursor: 'pointer',
            fontFamily: FONT, transition: 'background-color 0.2s',
            whiteSpace: 'nowrap',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,174,0,0.16)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,174,0,0.08)'; }}
          >
            <UserPlus size={13} /> Opslaan
          </button>
        </div>

        {/* Saved contacts dropdown */}
        <div ref={contactRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowContactList(!showContactList)}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.55rem 0.85rem',
              fontSize: '0.78rem',
              backgroundColor: showContactList ? 'rgba(188,19,254,0.08)' : 'rgba(255,255,255,0.025)',
              color: savedContacts.length ? TEXT : DIM,
              border: `1px solid ${showContactList ? 'rgba(188,19,254,0.3)' : BORDER}`,
              borderRadius: showContactList ? '0.65rem 0.65rem 0 0' : '0.65rem',
              cursor: 'pointer',
              fontFamily: FONT,
              transition: 'all 0.2s',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={14} color={DIM} />
              {savedContacts.length
                ? `${savedContacts.length} opgeslagen contact${savedContacts.length !== 1 ? 'en' : ''} — kies een ontvanger`
                : 'Geen opgeslagen contacten'}
            </span>
            <ChevronDown size={14} color={DIM} style={{ transform: showContactList ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {showContactList && savedContacts.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
              maxHeight: '200px', overflowY: 'auto',
              backgroundColor: 'rgba(18,12,28,0.97)',
              border: `1px solid rgba(188,19,254,0.2)`,
              borderTop: 'none',
              borderRadius: '0 0 0.65rem 0.65rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}>
              {savedContacts.map((c) => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.55rem 0.85rem',
                  cursor: 'pointer',
                  borderBottom: `1px solid ${BORDER}`,
                  transition: 'background-color 0.15s',
                }}
                  onClick={() => selectContact(c)}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(188,19,254,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT }}>{c.name}</div>
                    <div style={{ fontSize: '0.62rem', color: DIM }}>{c.email}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeContact(c.id); }}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.12)', cursor: 'pointer', padding: '0.2rem', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.12)'; }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recipient fields */}
        <div style={isMobile
          ? { display: 'flex', flexDirection: 'column', gap: '0.8rem' }
          : { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }
        }>
          <div>
            <div style={labelCss}>Naam</div>
            <div style={{ position: 'relative' }}>
              <User size={14} color={DIM} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Naam ontvanger"
                style={input}
              />
            </div>
          </div>
          <div>
            <div style={labelCss}>Ontvanger E-mail *</div>
            <div style={{ position: 'relative' }}>
              <Mail size={14} color={DIM} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => { setRecipientEmail(e.target.value); setSendError(''); }}
                placeholder="naam@voorbeeld.nl"
                style={input}
              />
            </div>
          </div>
          <div>
            <div style={labelCss}>Onderwerp</div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Garden For Life"
                style={inputNoPad}
              />
            </div>
          </div>
        </div>

        {/* Email body */}
        <div>
          <div style={labelCss}>E-mailtekst</div>
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            placeholder={`Beste,\n\nBijgevoegd vindt u de gevraagde documenten.\n\nMet vriendelijke groet,\nGarden For Life`}
            rows={6}
            style={{
              ...inputNoPad,
              minHeight: '140px',
              resize: 'vertical',
              lineHeight: 1.6,
            }}
          />
        </div>

        {/* ── PDF Attachments ── */}
        <div>
          <div style={labelCss}>PDF Bijlagen</div>

          {/* Attachment list */}
          {attachments.length > 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '0.4rem',
              marginBottom: '0.6rem',
            }}>
              {attachments.map((att, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.5rem 0.7rem',
                  backgroundColor: 'rgba(188,19,254,0.04)',
                  border: '1px solid rgba(188,19,254,0.12)',
                  borderRadius: '0.5rem',
                }}>
                  <FileText size={16} color={ACCENT} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.78rem', color: TEXT, fontWeight: 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {att.name}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: DIM }}>
                      {formatFileSize(att.size)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeAttachment(idx)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 24, height: 24,
                      backgroundColor: 'rgba(248,113,113,0.1)',
                      border: '1px solid rgba(248,113,113,0.2)',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      color: '#f87171',
                      flexShrink: 0,
                    }}
                    title="Verwijderen"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add attachment button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.55rem 1rem',
              fontSize: '0.75rem', fontWeight: 600,
              backgroundColor: 'rgba(255,255,255,0.035)',
              color: DIM,
              border: `1px dashed ${BORDER}`,
              borderRadius: '0.65rem',
              cursor: 'pointer',
              fontFamily: FONT,
              transition: 'all 0.2s',
              width: '100%',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(188,19,254,0.06)';
              e.currentTarget.style.borderColor = 'rgba(188,19,254,0.25)';
              e.currentTarget.style.color = ACCENT;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.035)';
              e.currentTarget.style.borderColor = BORDER;
              e.currentTarget.style.color = DIM;
            }}
          >
            <Paperclip size={14} />
            PDF Bijlage Toevoegen
          </button>
        </div>

        {/* Error */}
        {sendError && (
          <div style={{ fontSize: '0.72rem', color: '#f87171' }}>✗ {sendError}</div>
        )}

        {/* Send bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.5rem 0.7rem',
          backgroundColor: 'rgba(188,19,254,0.03)',
          borderRadius: '0.5rem',
          border: '1px solid rgba(188,19,254,0.1)',
        }}>
          <div style={{ fontSize: '0.7rem', color: DIM }}>
            {attachments.length > 0
              ? `📎 ${attachments.length} bijlage${attachments.length > 1 ? 'n' : ''}`
              : '📭 Geen bijlagen'}
            {sendingState === 'sent' && <span style={{ marginLeft: '0.5rem', color: '#4ade80', fontWeight: 700 }}>✓ Verstuurd!</span>}
          </div>
          <button
            onClick={handleSendEmail}
            disabled={sendingState === 'sending' || !recipientEmail.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.4rem 0.85rem',
              fontSize: '0.72rem', fontWeight: 700,
              backgroundColor: (!recipientEmail.trim()) ? 'rgba(188,19,254,0.06)' : 'rgba(188,19,254,0.15)',
              color: ACCENT,
              border: '1px solid rgba(188,19,254,0.3)',
              borderRadius: '0.35rem',
              cursor: (sendingState === 'sending' || !recipientEmail.trim()) ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase',
              fontFamily: FONT,
              opacity: !recipientEmail.trim() ? 0.4 : 1,
              transition: 'all 0.2s',
            }}
          >
            <Send size={14} />
            {sendingState === 'sending' ? 'BEZIG MET VERSTUREN...' : 'VERSTUREN'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default EmailTemplate;
