import React, { useState, useRef, useEffect, memo } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Plus, Trash2, Eraser, FileText, User, Hash, Receipt, Mail, Send, ChevronDown, UserPlus, X } from 'lucide-react';
import { sendFormDirect, getEmailStatus } from '../../utils/apiClient';

// ═══════════════════════════════════════════════════════════
// GFL Invoice Template — faithful replica of AI Studio layout
// Left: editor  |  Right: A4-ratio preview
// ═══════════════════════════════════════════════════════════

const INITIAL_DATA = {
  invoiceNumber: '20260002',
  clientName: 'Eastecofoods',
  clientEmail: '',
  clientAddress: 'Nijverheidsweg 23, 3534AM Utrecht',
  businessName: 'Garden For Life',
  businessEmail: 'Yuanwullink30@gfl.community',
  businessAddress: 'Zutphen, De Taxushaag 2, 7207MB',
  businessPhone: '0613126283',
  businessTagline: 'De luide stilte en de intense kalmte\nwijzen de euros\nvan de klant\nnaar mijn rekening',
  serviceDescription: 'Dienstverlening als assistent-salesmanager',
  bankAccount: 'NL63KNAB0514 5390 54',
  paymentReference: 'Bedrijfsnaam + 20260002',
  logoUrl: '/images/landingpage/logo.png',
  items: [
    { id: '1', description: 'Wk8 6 Werkuren + 1 Reisuur', quantity: 7, price: 18 },
    { id: '2', description: 'Demo Enschede', quantity: 1, price: 125 },
    { id: '3', description: 'Demo Antwerp', quantity: 1, price: 150 },
    { id: '4', description: 'Reiskosten', quantity: 1, price: 20 },
  ],
  taxRate: 21,
  notes: 'Bedankt voor uw vertrouwen.',
};

/* ── Style primitives (GFL dark theme) ── */
const ACCENT = '#bc13fe';
const GOLD   = '#ffae00';
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

/* Live date string, auto-synced like the site's TimeSync */
const useLiveDate = () => {
  const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  const [dateStr, setDateStr] = useState(fmt(new Date()));
  useEffect(() => {
    const id = setInterval(() => setDateStr(fmt(new Date())), 60000);
    return () => clearInterval(id);
  }, []);
  return dateStr;
};

const CONTACTS_KEY = 'gfl_invoice_contacts';
const loadContacts = () => { try { return JSON.parse(localStorage.getItem(CONTACTS_KEY) || '[]'); } catch { return []; } };
const persistContacts = (list) => localStorage.setItem(CONTACTS_KEY, JSON.stringify(list));

const InvoiceTemplate = memo(({ onSave }) => {
  const [invoice, setInvoice] = useState(INITIAL_DATA);
  const liveDate = useLiveDate();
  const sigCanvas = useRef(null);
  const [signatureData, setSignatureData] = useState(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [btwIncluded, setBtwIncluded] = useState(false);

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
    setInvoice(prev => ({ ...prev, clientName: c.name, clientAddress: c.address, clientEmail: c.email || '' }));
    setRecipientEmail(c.email || '');
    setShowContactList(false);
  };
  const saveCurrentContact = () => {
    if (!invoice.clientName.trim()) return;
    const entry = { id: Date.now().toString(), name: invoice.clientName, address: invoice.clientAddress, email: invoice.clientEmail || recipientEmail || '' };
    const updated = [entry, ...savedContacts.filter(c => c.name !== entry.name)];
    setSavedContacts(updated);
    persistContacts(updated);
  };
  const removeContact = (id) => {
    const updated = savedContacts.filter(c => c.id !== id);
    setSavedContacts(updated);
    persistContacts(updated);
  };

  // Email states
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [sendingState, setSendingState] = useState(null);
  const [sendError, setSendError] = useState('');
  const [emailConfigured, setEmailConfigured] = useState(null);

  useEffect(() => {
    getEmailStatus().then(res => setEmailConfigured(res.configured)).catch(() => setEmailConfigured(false));
  }, []);

  const itemsPerPage = 8;
  const totalPreviewPages = Math.ceil(invoice.items.length / itemsPerPage) || 1;

  /* resize fix for SignatureCanvas */
  useEffect(() => {
    const handleResize = () => {
      if (sigCanvas.current) {
        const canvas = sigCanvas.current.getCanvas();
        if (canvas) {
          const ratio = Math.max(window.devicePixelRatio || 1, 1);
          canvas.width = canvas.offsetWidth * ratio;
          canvas.height = canvas.offsetHeight * ratio;
          canvas.getContext('2d')?.scale(ratio, ratio);
          sigCanvas.current.clear();
        }
      }
    };
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 300);
    return () => { window.removeEventListener('resize', handleResize); clearTimeout(timer); };
  }, []);

  const subtotal = invoice.items.reduce((a, i) => a + i.quantity * i.price, 0);
  const taxAmount = btwIncluded ? (subtotal * 21) / 100 : 0;
  const total = subtotal + taxAmount;

  /* ── handlers ── */
  const handleAddItem = () => {
    setInvoice({
      ...invoice,
      items: [...invoice.items, { id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, price: 0 }],
    });
  };
  const handleRemoveItem = (id) => {
    if (invoice.items.length === 1) return;
    setInvoice({ ...invoice, items: invoice.items.filter(i => i.id !== id) });
  };
  const handleItemChange = (id, field, value) => {
    setInvoice({ ...invoice, items: invoice.items.map(i => i.id === id ? { ...i, [field]: value } : i) });
  };
  const clearSignature = () => { sigCanvas.current?.clear(); setSignatureData(null); };
  const saveSignature = () => {
    if (!sigCanvas.current) return;
    try {
      let data = null;
      if (typeof sigCanvas.current.toDataURL === 'function') data = sigCanvas.current.toDataURL('image/png');
      if (!data && typeof sigCanvas.current.getTrimmedCanvas === 'function') data = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      if (!data && typeof sigCanvas.current.getCanvas === 'function') data = sigCanvas.current.getCanvas().toDataURL('image/png');
      if (data) setSignatureData(data);
    } catch (e) { console.error('Signature save failed', e); }
  };

  /* ── PDF ── */
  const buildPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();

    // Helper: draw header content on a page (background must already be filled)
    const drawHeader = () => {
      // Background
      doc.setFillColor(26, 26, 26);
      doc.rect(0, 0, pw, ph, 'F');

      // Business info — left
      doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
      doc.text(invoice.businessName, 14, 25);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 200, 200);
      doc.text(invoice.businessAddress, 14, 32);
      doc.text(`Tel: ${invoice.businessPhone}`, 14, 37);
      doc.text(invoice.businessEmail, 14, 42);

      // Logo + FACTUUR — right
      if (invoice.logoUrl) {
        try { doc.addImage(invoice.logoUrl, 'JPEG', pw - 44, 15, 30, 30); } catch (e) { /* skip */ }
      }
      doc.setFontSize(20); doc.setTextColor(100, 100, 100);
      doc.text('FACTUUR', pw - 14, 55, { align: 'right' });

      // Payment info
      doc.setFontSize(8); doc.setTextColor(255, 255, 255);
      doc.text(`Rekening: ${invoice.bankAccount} (Ref: ${invoice.invoiceNumber})`, 14, 62);
      doc.setTextColor(150, 150, 150);
      doc.text('gelieve te betalen binnen 14 werkdagen', 14, 67);
      doc.setFontSize(10); doc.setTextColor(255, 255, 255);
      doc.text(`Nr: ${invoice.invoiceNumber}`, pw - 14, 62, { align: 'right' });
      doc.text(`Datum: ${liveDate}`, pw - 14, 67, { align: 'right' });
    };

    // Page 1 header
    drawHeader();

    // Table
    const tableData = invoice.items.map(item => [
      item.description || '—', item.quantity.toString(),
      `${item.price.toFixed(2)}.-`,
      `${(item.quantity * item.price).toFixed(2).replace('.', ',')}`,
    ]);

    let isFirstPage = true;
    autoTable(doc, {
      startY: 75,
      head: [['OMSCHRIJVING', 'UUR', 'TARIEF Ex.-', 'BEDRAG']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [45, 45, 45], textColor: 255, fontStyle: 'bold', halign: 'left', lineWidth: 0.1, lineColor: [60, 60, 60] },
      bodyStyles: { textColor: 255, fillColor: [26, 26, 26], fontSize: 10, lineWidth: 0.1, lineColor: [60, 60, 60] },
      columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 30, halign: 'center' }, 3: { cellWidth: 30, halign: 'right' } },
      margin: { left: 14, right: 14, bottom: 80 },
      didDrawPage: () => {
        // Only fill background on continuation pages (page 1 already drawn above)
        if (isFirstPage) { isFirstPage = false; return; }
        doc.setFillColor(26, 26, 26);
        doc.rect(0, 0, pw, ph, 'F');
      },
    });

    let finalY = doc.lastAutoTable?.finalY || 75;
    if (finalY > ph - 90) { doc.addPage(); doc.setFillColor(26, 26, 26); doc.rect(0, 0, pw, ph, 'F'); finalY = 20; }

    // Total rows
    doc.setDrawColor(60, 60, 60);
    if (btwIncluded) {
      // Subtotaal
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(200, 200, 200);
      doc.text('Subtotaal', 140, finalY + 8);
      doc.text(`€${subtotal.toFixed(2).replace('.', ',')}`, pw - 14, finalY + 8, { align: 'right' });
      // BTW 21%
      doc.text('BTW 21%', 140, finalY + 14);
      doc.text(`€${taxAmount.toFixed(2).replace('.', ',')}`, pw - 14, finalY + 14, { align: 'right' });
      // Line
      doc.line(140, finalY + 17, pw - 14, finalY + 17);
      // TOTAAL
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(255, 255, 255);
      doc.text('TOTAAL', 140, finalY + 24);
      doc.text(`€${total.toFixed(2).replace('.', ',')}`, pw - 14, finalY + 24, { align: 'right' });
    } else {
      doc.line(140, finalY + 2, pw - 14, finalY + 2);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
      doc.text('TOTAAL', 140, finalY + 10);
      doc.text(`€${total.toFixed(2).replace('.', ',')}`, pw - 14, finalY + 10, { align: 'right' });
    }

    // Footer — Factuur voor
    const footerY = ph - 60;
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(150, 150, 150);
    doc.text('Factuur voor:', 14, footerY - 15);
    doc.setTextColor(255, 255, 255); doc.text(invoice.clientName || '—', 14, footerY - 8);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 200, 200);
    doc.text(invoice.clientAddress || '', 14, footerY - 2);

    // Signature
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
    doc.text('Ondertekend door:', pw - 14, footerY - 15, { align: 'right' });
    if (signatureData) doc.addImage(signatureData, 'PNG', pw - 54, footerY - 12, 40, 15);

    // Spell
    doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont('helvetica', 'italic');
    doc.text('De luide stilte En de intense kalmte', 14, ph - 35);
    doc.text('Wijzen de euros van jouw Bank naar mijn Hart', 14, ph - 30);
    doc.setFontSize(9); doc.setTextColor(150, 150, 150);
    doc.text(invoice.notes || '', 14, ph - 20);

    return doc;
  };

  const generatePDF = () => {
    buildPDF().save(`${invoice.invoiceNumber}.pdf`);
  };

  /* ── Send invoice email with PDF attachment ── */
  const handleSendEmail = async () => {
    if (!recipientEmail.trim()) { setSendError('Vul een e-mailadres in'); return; }
    setSendingState('sending');
    setSendError('');
    try {
      const doc = buildPDF();
      const pdfBase64 = doc.output('base64');
      await sendFormDirect({
        templateId: 'factuur',
        templateLabel: 'Factuur',
        type: 'pdf',
        content: emailBody || `Factuur ${invoice.invoiceNumber}`,
        recipientEmail,
        subject: emailSubject || `Garden For Life — Factuur ${invoice.invoiceNumber}`,
        pdfBase64,
        attachmentFilename: `${invoice.invoiceNumber}.pdf`,
      });
      setSendingState('sent');
      setTimeout(() => setSendingState(null), 3000);
    } catch (err) {
      setSendError(err.message || 'Versturen mislukt');
      setSendingState('error');
      setTimeout(() => setSendingState(null), 4000);
    }
  };

  /* ── Save callback for GFL integration ── */
  const handleSaveCallback = () => {
    if (onSave) onSave({ templateId: 'factuur', templateLabel: 'Factuur', type: 'excel', content: JSON.stringify(invoice) });
  };

  /* ═══════════════════════════════════════════ */
  /*               R E N D E R                  */
  /* ═══════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Two-column grid: Editor | Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* ════════════ LEFT: EDITOR ════════════ */}
        <div style={{
          backgroundColor: CARD,
          padding: '1.6rem',
          borderRadius: '1.2rem',
          border: `1px solid ${BORDER}`,
          display: 'flex', flexDirection: 'column', gap: '2rem',
        }}>

          {/* § Factuur Gegevens */}
          <section>
            <h2 style={sectionHeading}>
              <FileText size={20} color={ACCENT} />
              Factuur Gegevens
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={labelCss}>Factuurnummer</div>
                <div style={{ position: 'relative' }}>
                  <Hash size={14} color={DIM} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input style={input} value={invoice.invoiceNumber}
                    onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })} />
                </div>
              </div>
              <div>
                <div style={labelCss}>Datum (auto-sync)</div>
                <div style={{
                  ...input,
                  paddingLeft: '0.85rem',
                  display: 'flex', alignItems: 'center',
                  color: 'rgba(21, 179, 21, 0.8)',
                  fontWeight: 600,
                  cursor: 'default',
                  letterSpacing: '0.05em',
                }}>{liveDate}</div>
              </div>
            </div>
          </section>

          {/* § Factuur Informatie */}
          <section style={{ paddingTop: '1.2rem', borderTop: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <h2 style={{ ...sectionHeading, marginBottom: 0 }}>
                <User size={20} color={ACCENT} />
                Factuur Informatie
              </h2>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button onClick={saveCurrentContact} title="Contact opslaan" style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.35rem 0.6rem', fontSize: '0.68rem', fontWeight: 700,
                  backgroundColor: 'rgba(255,174,0,0.08)', color: GOLD,
                  border: 'none', borderRadius: '0.4rem', cursor: 'pointer',
                  fontFamily: FONT, transition: 'background-color 0.2s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,174,0,0.16)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,174,0,0.08)'; }}
                >
                  <UserPlus size={13} /> Opslaan
                </button>
              </div>
            </div>

            {/* Saved contacts dropdown */}
            <div ref={contactRef} style={{ position: 'relative', marginBottom: '0.8rem' }}>
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
                    ? `${savedContacts.length} opgeslagen contact${savedContacts.length !== 1 ? 'en' : ''} — kies een klant`
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
                        <div style={{ fontSize: '0.62rem', color: DIM }}>
                          {c.address}{c.email ? ` · ${c.email}` : ''}
                        </div>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div>
                <h3 style={{ fontSize: '0.68rem', fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.6rem' }}>Factuur Voor</h3>
                <input style={inputNoPad} placeholder="Klantnaam" value={invoice.clientName}
                  onChange={(e) => setInvoice({ ...invoice, clientName: e.target.value })} />
              </div>
              <input style={inputNoPad} placeholder="Klant Adres / Contact" value={invoice.clientAddress}
                onChange={(e) => setInvoice({ ...invoice, clientAddress: e.target.value })} />
            </div>
          </section>

          {/* § Factuurregels */}
          <section style={{ paddingTop: '1.2rem', borderTop: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <h2 style={{ ...sectionHeading, marginBottom: 0 }}>
                <Receipt size={20} color={ACCENT} />
                Factuurregels
              </h2>
              <button onClick={handleAddItem} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.4rem 0.75rem', fontSize: '0.72rem', fontWeight: 700,
                backgroundColor: 'rgba(188,19,254,0.08)', color: ACCENT,
                border: 'none', borderRadius: '0.45rem', cursor: 'pointer',
                fontFamily: FONT, transition: 'background-color 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(188,19,254,0.16)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(188,19,254,0.08)'; }}
              >
                <Plus size={14} /> Regel Toevoegen
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {invoice.items.map((item) => (
                <div key={item.id} style={{
                  display: 'grid', gridTemplateColumns: '6fr 2fr 3fr 1fr',
                  gap: '0.5rem', alignItems: 'start',
                  padding: '0.75rem',
                  backgroundColor: 'rgba(255,255,255,0.015)',
                  borderRadius: '0.6rem',
                  border: `1px solid ${BORDER}`,
                }}>
                  <input style={inputNoPad} placeholder="Omschrijving" value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} />
                  <input style={{ ...inputNoPad, textAlign: 'center' }} type="number" placeholder="Aantal"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} />
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: DIM, fontSize: '0.8rem' }}>€</span>
                    <input style={{ ...input, paddingLeft: '1.6rem' }} type="number" placeholder="Prijs"
                      value={item.price}
                      onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '0.55rem' }}>
                    <button onClick={() => handleRemoveItem(item.id)} style={{
                      background: 'none', border: 'none', color: 'rgba(255,255,255,0.15)',
                      cursor: 'pointer', padding: '0.2rem', transition: 'color 0.2s',
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.15)'; }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* BTW toggle + summary */}
            <div style={{
              marginTop: '1rem', padding: '0.8rem',
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderRadius: '0.6rem',
              border: `1px solid ${BORDER}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <button
                    onClick={() => setBtwIncluded(!btwIncluded)}
                    style={{
                      padding: '0.35rem 0.7rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      fontFamily: FONT,
                      borderRadius: '0.4rem',
                      border: btwIncluded ? '1px solid rgba(34,197,94,0.4)' : `1px solid ${BORDER}`,
                      backgroundColor: btwIncluded ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.03)',
                      color: btwIncluded ? '#4ade80' : DIM,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {btwIncluded ? '✓ BTW 21%' : 'BTW 21%'}
                  </button>
                  <span style={{ fontSize: '0.65rem', color: DIM }}>
                    {btwIncluded ? 'BTW wordt berekend over het subtotaal' : 'Prijzen exclusief BTW'}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {btwIncluded && (
                    <div style={{ fontSize: '0.65rem', color: DIM, marginBottom: '0.15rem' }}>
                      Subtotaal: €{subtotal.toFixed(2).replace('.', ',')}  ·  BTW: €{taxAmount.toFixed(2).replace('.', ',')}
                    </div>
                  )}
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: GOLD }}>
                    Totaal: €{total.toFixed(2).replace('.', ',')}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* § Handtekening */}
          <section style={{ paddingTop: '1.2rem', borderTop: `1px solid ${BORDER}` }}>
            <h2 style={sectionHeading}>
              <Eraser size={20} color={ACCENT} />
              Handtekening
            </h2>
            <div style={{
              border: `2px dashed ${BORDER}`, borderRadius: '0.8rem',
              padding: '1rem', backgroundColor: 'rgba(255,255,255,0.01)',
            }}>
              <SignatureCanvas
                ref={sigCanvas}
                penColor="white"
                canvasProps={{
                  style: {
                    width: '100%', height: '160px',
                    cursor: 'crosshair',
                    backgroundColor: 'rgba(10,5,16,0.9)',
                    borderRadius: '0.6rem',
                    boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.6)',
                  },
                }}
                onEnd={saveSignature}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.7rem' }}>
                <button onClick={clearSignature} style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  background: 'none', border: 'none',
                  fontSize: '0.68rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  color: DIM, cursor: 'pointer', fontFamily: FONT,
                  transition: 'color 0.2s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = ACCENT; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = DIM; }}
                >
                  <Eraser size={14} /> Wissen
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* ════════════ RIGHT: PREVIEW (A4 ratio) ════════════ */}
        <div style={{ position: 'sticky', top: '1rem' }}>
          <div style={{
            aspectRatio: '210 / 297',
            width: '100%',
            backgroundColor: '#1a1a1a',
            borderRadius: '1.2rem',
            border: `1px solid ${BORDER}`,
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              padding: '6% 7%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              color: '#fff',
              fontFamily: FONT,
              fontSize: '1.35em',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '1.1em', fontWeight: 700, color: '#fff' }}>{invoice.businessName}</div>
                  <div style={{ paddingTop: '0.5em' }}>
                    <p style={{ fontSize: '0.55em', color: '#bbb', margin: '0.15em 0' }}>{invoice.businessAddress}</p>
                    <p style={{ fontSize: '0.55em', color: '#bbb', margin: '0.15em 0' }}>Tel: {invoice.businessPhone}</p>
                    <p style={{ fontSize: '0.55em', color: '#bbb', margin: '0.15em 0' }}>{invoice.businessEmail}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    {invoice.logoUrl && (
                      <img src={invoice.logoUrl} alt="Logo" referrerPolicy="no-referrer"
                        style={{ width: '3.5em', height: '3.5em', objectFit: 'contain', marginBottom: '0.4em', borderRadius: '0.3em' }} />
                    )}
                    <div style={{ fontSize: '1.6em', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.03em' }}>FACTUUR</div>
                  </div>
                </div>
              </div>

              {/* Payment line */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                borderBottom: '1px solid #333', paddingBottom: '0.7em', marginTop: '1em',
              }}>
                <div>
                  <p style={{ fontSize: '0.5em', color: '#fff', margin: 0 }}>Rekening: {invoice.bankAccount} (Ref: {invoice.invoiceNumber})</p>
                  <p style={{ fontSize: '0.48em', color: '#888', fontWeight: 700, margin: '0.2em 0 0' }}>gelieve te betalen binnen 14 werkdagen</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.6em', fontWeight: 700, color: '#fff', margin: 0 }}>Nr: {invoice.invoiceNumber}</p>
                  <p style={{ fontSize: '0.55em', color: '#bbb', textTransform: 'uppercase', margin: '0.15em 0 0' }}>Datum: {liveDate}</p>
                </div>
              </div>

              {/* Table */}
              <div style={{ flex: 1, paddingTop: '0.8em' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #333' }}>
                      <th style={{ textAlign: 'left', padding: '0.4em 0', fontSize: '0.48em', fontWeight: 700, textTransform: 'uppercase', color: '#888' }}>Omschrijving</th>
                      <th style={{ textAlign: 'center', padding: '0.4em 0', fontSize: '0.48em', fontWeight: 700, textTransform: 'uppercase', color: '#888' }}>Uur</th>
                      <th style={{ textAlign: 'center', padding: '0.4em 0', fontSize: '0.48em', fontWeight: 700, textTransform: 'uppercase', color: '#888' }}>Tarief Ex.-</th>
                      <th style={{ textAlign: 'right', padding: '0.4em 0', fontSize: '0.48em', fontWeight: 700, textTransform: 'uppercase', color: '#888' }}>Bedrag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items
                      .slice((previewPage - 1) * itemsPerPage, previewPage * itemsPerPage)
                      .map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #222' }}>
                        <td style={{ padding: '0.5em 0', fontSize: '0.55em', color: '#fff' }}>{item.description || 'Nieuw Item'}</td>
                        <td style={{ padding: '0.5em 0', fontSize: '0.55em', color: '#fff', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '0.5em 0', fontSize: '0.55em', color: '#fff', textAlign: 'center' }}>{item.price.toFixed(2)}.-</td>
                        <td style={{ padding: '0.5em 0', fontSize: '0.55em', color: '#fff', textAlign: 'right', fontWeight: 600 }}>{(item.quantity * item.price).toFixed(2).replace('.', ',')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {previewPage === totalPreviewPages && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: '0.8em', gap: '0.25em' }}>
                    {btwIncluded && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2em' }}>
                          <span style={{ fontSize: '0.42em', color: '#888' }}>Subtotaal</span>
                          <span style={{ fontSize: '0.65em', color: '#bbb' }}>€{subtotal.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2em' }}>
                          <span style={{ fontSize: '0.42em', color: '#888' }}>BTW 21%</span>
                          <span style={{ fontSize: '0.65em', color: '#bbb' }}>€{taxAmount.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div style={{ width: '8em', borderTop: '1px solid #444', marginTop: '0.15em', paddingTop: '0.3em' }} />
                      </>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2em' }}>
                      <span style={{ fontSize: '0.48em', fontWeight: 700, textTransform: 'uppercase', color: '#888' }}>TOTAAL</span>
                      <span style={{ fontSize: '1em', fontWeight: 700, color: '#fff' }}>€{total.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {previewPage === totalPreviewPages && (
                <div style={{ marginTop: 'auto', paddingTop: '1.2em', borderTop: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '1.2em' }}>
                  {/* Factuur voor */}
                  <div>
                    <p style={{ fontSize: '0.48em', fontWeight: 700, textTransform: 'uppercase', color: '#888', margin: 0 }}>Factuur voor:</p>
                    <p style={{ fontSize: '0.65em', fontWeight: 600, color: '#fff', margin: '0.2em 0' }}>{invoice.clientName}</p>
                    <p style={{ fontSize: '0.55em', color: '#888', lineHeight: 1.5, margin: 0 }}>{invoice.clientAddress}</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    {/* Spell + Notes */}
                    <div>
                      <p style={{ fontSize: '0.6em', fontStyle: 'italic', color: '#fff', lineHeight: 1.4, margin: 0 }}>De luide stilte En de intense kalmte</p>
                      <p style={{ fontSize: '0.6em', fontStyle: 'italic', color: '#fff', lineHeight: 1.4, margin: '0.1em 0 0' }}>Wijzen de euros van jouw Bank naar mijn Hart</p>
                      <p style={{ fontSize: '0.55em', fontStyle: 'italic', color: '#888', margin: '0.7em 0 0' }}>{invoice.notes}</p>
                    </div>

                    {/* Signature */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3em', flexShrink: 0 }}>
                      <p style={{ fontSize: '0.48em', fontWeight: 700, textTransform: 'uppercase', color: '#fff', margin: 0 }}>Ondertekend door:</p>
                      <div style={{
                        border: '2px solid rgba(188,19,254,0.35)',
                        borderRadius: '0.4em', padding: '0.3em',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        width: '9em', height: '4em',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.8)',
                        overflow: 'hidden',
                      }}>
                        {signatureData ? (
                          <img src={signatureData} alt="Handtekening"
                            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', filter: 'brightness(2) contrast(1.25)' }} />
                        ) : (
                          <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '0.35em', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block' }}>Wachten op</span>
                            <span style={{ fontSize: '0.35em', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block' }}>handtekening</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {totalPreviewPages > 1 && (
                <div style={{ marginTop: 'auto', paddingTop: '0.6em', display: 'flex', justifyContent: 'center', gap: '0.5em', borderTop: '1px solid #333' }}>
                  {[...Array(totalPreviewPages)].map((_, i) => (
                    <button key={i} onClick={() => setPreviewPage(i + 1)} style={{
                      padding: '0.2em 0.5em', fontSize: '0.5em', fontWeight: 700,
                      borderRadius: '0.3em', border: 'none', cursor: 'pointer', fontFamily: FONT,
                      backgroundColor: previewPage === i + 1 ? ACCENT : '#222',
                      color: previewPage === i + 1 ? '#fff' : '#555',
                      transition: 'all 0.2s',
                    }}>Pagina {i + 1}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════ ACTION BAR ════════════ */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.6rem 0.8rem',
        backgroundColor: 'rgba(255,174,0,0.03)',
        borderRadius: '0.5rem',
        border: `1px solid ${BORDER}`,
      }}>
        <div style={{ fontSize: '0.72rem', color: DIM }}>
          {invoice.items.length} regel{invoice.items.length !== 1 ? 's' : ''} · Totaal: €{total.toFixed(2).replace('.', ',')}
          {btwIncluded && <span style={{ color: '#4ade80', marginLeft: '0.4rem' }}>(incl. BTW)</span>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleSaveCallback} style={{
            padding: '0.4rem 0.8rem', fontSize: '0.72rem', fontWeight: 700,
            backgroundColor: 'rgba(255,174,0,0.08)', color: GOLD,
            border: '1px solid rgba(255,174,0,0.15)', borderRadius: '0.35rem',
            cursor: 'pointer', textTransform: 'uppercase', fontFamily: FONT,
          }}>OPSLAAN</button>
          <button onClick={generatePDF} style={{
            padding: '0.4rem 0.8rem', fontSize: '0.72rem', fontWeight: 700,
            backgroundColor: 'rgba(188,19,254,0.12)', color: ACCENT,
            border: '1px solid rgba(188,19,254,0.25)', borderRadius: '0.35rem',
            cursor: 'pointer', textTransform: 'uppercase', fontFamily: FONT,
          }}>📄 PDF DOWNLOADEN</button>
        </div>
      </div>

      {/* ════════════ EMAIL CARD ════════════ */}
      <div style={{
        backgroundColor: CARD,
        padding: '1.6rem',
        borderRadius: '1.2rem',
        border: `1px solid ${BORDER}`,
        display: 'flex', flexDirection: 'column', gap: '1.2rem',
      }}>
        <h2 style={sectionHeading}>
          <Mail size={20} color={ACCENT} />
          E-mail Versturen — Factuur
        </h2>

        {/* Email status */}
        {emailConfigured === false && (
          <div style={{
            padding: '0.5rem 0.8rem', borderRadius: '0.5rem',
            backgroundColor: 'rgba(250,204,21,0.06)',
            borderLeft: '2px solid #facc15',
            fontSize: '0.7rem', color: '#facc15',
          }}>⚠ E-mail niet geconfigureerd — stel SMTP in via Render omgevingsvariabelen</div>
        )}
        {emailConfigured === true && (
          <div style={{
            padding: '0.5rem 0.8rem', borderRadius: '0.5rem',
            backgroundColor: 'rgba(34,197,94,0.04)',
            borderLeft: '2px solid #4ade80',
            fontSize: '0.7rem', color: '#4ade80',
          }}>✓ E-mail geconfigureerd — PDF wordt als bijlage meegestuurd</div>
        )}

        {/* Recipient fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
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
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder={`Garden For Life — Factuur ${invoice.invoiceNumber}`}
              style={inputNoPad}
            />
          </div>
        </div>

        {/* Email body */}
        <div>
          <div style={labelCss}>E-mailtekst (optioneel)</div>
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            placeholder={`Beste ${invoice.clientName || 'klant'},\n\nBijgevoegd vindt u factuur ${invoice.invoiceNumber}.\n\nMet vriendelijke groet,\nGarden For Life`}
            rows={4}
            style={{
              ...inputNoPad,
              minHeight: '100px',
              resize: 'vertical',
              lineHeight: 1.6,
            }}
          />
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
            📎 {invoice.invoiceNumber}.pdf wordt als bijlage meegestuurd
            {sendingState === 'sent' && <span style={{ marginLeft: '0.5rem', color: '#4ade80', fontWeight: 700 }}>✓ Verstuurd!</span>}
          </div>
          <button
            onClick={handleSendEmail}
            disabled={sendingState === 'sending' || !recipientEmail.trim() || emailConfigured === false}
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
            {sendingState === 'sending' ? 'BEZIG MET VERSTUREN...' : 'VERSTUREN MET PDF'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default InvoiceTemplate;
