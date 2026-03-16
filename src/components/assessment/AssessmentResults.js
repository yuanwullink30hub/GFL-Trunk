import React, { useState } from 'react';
import { Download, RotateCcw, Copy, Brain, Eye, Heart, Sparkles, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { ARCHETYPES } from '../../pages/assessment/assessmentTypes';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * AssessmentResults - Results panel that appears after all layers complete
 * Displays archetype, scores, layer analysis, AI prompt, and PDF download
 */
const AssessmentResults = ({ 
  result, 
  onReset,
  onClose,
  isVisible = false 
}) => {
  const [expandedSection, setExpandedSection] = useState('archetype');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const { t } = useLanguage();

  if (!result || !isVisible) return null;

  const archetypeInfo = ARCHETYPES[result.overallArchetype];

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const content = generatePDFContent(result, archetypeInfo, t);
      const blob = new Blob([content], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          URL.revokeObjectURL(url);
        };
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(result.aiTrainingPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Updated layer colors: Zelf=green, Ander=blue, Massa=purple, Wereld=red, Mysterie=orange
  const colors = ["#22c55e", "#3b82f6", "#a855f7", "#ef4444", "#f97316"];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Results Panel */}
      <div 
        className="relative w-[90vw] max-w-4xl max-h-[85vh] overflow-y-auto rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(4, 1, 6, 0.4) 0%, rgba(1, 1, 4, 0.4) 100%)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(251, 191, 36, 0.06), inset 0 0 30px rgba(251, 191, 36, 0.03)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Corner Accents - curved brackets */}
        <div className="absolute -top-0.5 -left-0.5 w-4 h-4" style={{ border: '1.5px solid rgba(251, 191, 36, 0.6)', borderRadius: '10px 0 0 0', borderBottom: 'none', borderRight: 'none' }} />
        <div className="absolute -top-0.5 -right-0.5 w-4 h-4" style={{ border: '1.5px solid rgba(251, 191, 36, 0.6)', borderRadius: '0 10px 0 0', borderBottom: 'none', borderLeft: 'none' }} />
        <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4" style={{ border: '1.5px solid rgba(251, 191, 36, 0.6)', borderRadius: '0 0 0 10px', borderTop: 'none', borderRight: 'none' }} />
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4" style={{ border: '1.5px solid rgba(251, 191, 36, 0.6)', borderRadius: '0 0 10px 0', borderTop: 'none', borderLeft: 'none' }} />

        {/* Holographic sheen */}
        <div className="absolute inset-0 rounded-lg pointer-events-none" style={{
          background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.015) 30%, transparent 50%, rgba(255,255,255,0.01) 70%, transparent 100%)',
          backgroundSize: '400% 400%',
          backgroundRepeat: 'no-repeat',
          animation: 'holoSheen 45s ease-in-out infinite',
          mixBlendMode: 'screen',
        }} />

        {/* Scanline sweep */}
        <div className="absolute inset-0 rounded-lg pointer-events-none" style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.008) 48%, rgba(255,255,255,0.015) 50%, rgba(255,255,255,0.008) 52%, transparent 100%)',
          backgroundSize: '100% 300%',
          animation: 'holoScanline 14s linear infinite',
        }} />

        {/* Noise texture overlay */}
        <div className="absolute inset-0 rounded-lg pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-4">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs uppercase tracking-wider text-amber-300">{t('assessmentResults.coreResonanceComplete')}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-light mb-2 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
              {t('assessmentResults.yourConsciousnessProfile')}
            </h1>
            <p className="text-slate-500 text-sm font-mono">
              ID: {result.id} • {result.timestamp.toLocaleDateString()}
            </p>
          </div>

          {/* Primary Archetype Section */}
          <CollapsibleSection
            title={t('assessmentResults.primaryArchetype')}
            icon={<Brain className="w-5 h-5" />}
            color="#fbbf24"
            isExpanded={expandedSection === 'archetype'}
            onToggle={() => toggleSection('archetype')}
          >
            <div className="space-y-4">
              <h3 className="text-2xl md:text-3xl font-light text-white">
                {t(`archetypes.${result.overallArchetype}.name`) !== `archetypes.${result.overallArchetype}.name` 
                  ? t(`archetypes.${result.overallArchetype}.name`) 
                  : archetypeInfo?.name || result.overallArchetype}
              </h3>
              <p className="text-slate-300 leading-relaxed">
                {t(`archetypes.${result.overallArchetype}.description`) !== `archetypes.${result.overallArchetype}.description` 
                  ? t(`archetypes.${result.overallArchetype}.description`) 
                  : archetypeInfo?.description}
              </p>
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">
                  <span className="font-semibold">{t('assessmentResults.shadowAspect')}:</span>{' '}
                  {t(`archetypes.${result.overallArchetype}.shadow`) !== `archetypes.${result.overallArchetype}.shadow` 
                    ? t(`archetypes.${result.overallArchetype}.shadow`) 
                    : archetypeInfo?.shadow}
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Harmony Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            <MetricCard 
              icon={<Heart className="w-5 h-5" />} 
              label={t('assessmentResults.harmonyScore')}
              value={`${result.harmonyScore}%`} 
              color="#22c55e" 
            />
            <MetricCard 
              icon={<Eye className="w-5 h-5" />} 
              label={t('assessmentResults.consciousnessLevel')}
              value={result.consciousnessLevel} 
              color="#a855f7" 
            />
            <MetricCard 
              icon={<Sparkles className="w-5 h-5" />} 
              label={t('assessmentResults.quantumState')}
              value={result.overallArchetype} 
              color="#fbbf24" 
            />
          </div>

          {/* Quantum Resonance */}
          <CollapsibleSection
            title={t('assessmentResults.quantumResonance')}
            icon={<Sparkles className="w-5 h-5" />}
            color="#a855f7"
            isExpanded={expandedSection === 'quantum'}
            onToggle={() => toggleSection('quantum')}
          >
            <p className="text-slate-300 leading-relaxed italic">"{result.quantumResonance}"</p>
          </CollapsibleSection>

          {/* Layer Analysis */}
          <CollapsibleSection
            title={t('assessmentResults.layerAnalysis')}
            icon={<Eye className="w-5 h-5" />}
            color="#22c55e"
            isExpanded={expandedSection === 'layers'}
            onToggle={() => toggleSection('layers')}
          >
            <div className="space-y-4">
              {result.subjectResults.map((subject, index) => (
                <LayerResultCard 
                  key={subject.subjectId} 
                  result={subject} 
                  color={colors[index % colors.length]}
                  t={t}
                />
              ))}
            </div>
          </CollapsibleSection>

          {/* AI Training Prompt */}
          <CollapsibleSection
            title={t('assessmentResults.aiTrainingPrompt')}
            icon={<FileText className="w-5 h-5" />}
            color="#f97316"
            isExpanded={expandedSection === 'ai'}
            onToggle={() => toggleSection('ai')}
          >
            <div className="space-y-3">
              <p className="text-xs text-slate-500">{t('assessmentResults.aiTrainingDesc')}</p>
              <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700 max-h-48 overflow-y-auto">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {result.aiTrainingPrompt}
                </pre>
              </div>
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Copy className="w-3 h-3" />
                {copiedPrompt ? t('assessmentResults.copied') : t('assessmentResults.copyToClipboard')}
              </button>
            </div>
          </CollapsibleSection>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 pt-6 border-t border-slate-700/50">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg text-white font-medium hover:from-amber-500 hover:to-orange-500 transition-all disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              {isGeneratingPDF ? t('assessmentResults.generating') : t('assessmentResults.downloadPDF')}
            </button>
            <button
              onClick={onReset}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-600 rounded-lg text-slate-300 hover:border-slate-400 hover:text-white transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              {t('assessmentResults.newAssessment')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Collapsible Section Component
const CollapsibleSection = ({ title, icon, color, isExpanded, onToggle, children }) => (
  <div 
    className="mb-4 rounded-lg overflow-hidden"
    style={{ border: `1px solid ${color}30`, background: `${color}05` }}
  >
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span style={{ color }}>{icon}</span>
        <span className="font-light" style={{ color }}>{title}</span>
      </div>
      {isExpanded ? (
        <ChevronUp className="w-4 h-4" style={{ color }} />
      ) : (
        <ChevronDown className="w-4 h-4" style={{ color }} />
      )}
    </button>
    {isExpanded && (
      <div className="px-4 pb-4 animate-fadeIn">
        {children}
      </div>
    )}
  </div>
);

// Metric Card Component
const MetricCard = ({ icon, label, value, color }) => (
  <div 
    className="rounded-xl p-4 border text-center backdrop-blur-sm"
    style={{ borderColor: `${color}30`, background: `${color}10` }}
  >
    <div 
      className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {icon}
    </div>
    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-xl font-light" style={{ color }}>{value}</p>
  </div>
);

// Layer Result Card Component
const LayerResultCard = ({ result, color, t }) => (
  <div 
    className="rounded-lg p-4 border border-slate-700/50 hover:border-slate-600 transition-colors"
    style={{ background: 'rgba(15, 7, 22, 0.6)' }}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} 
        />
        <h4 className="font-medium text-slate-200">{result.subjectName}</h4>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">{t('assessmentResults.integration')}:</span>
        <span className="text-sm font-mono" style={{ color }}>{result.percentage}%</span>
      </div>
    </div>

    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
      <div 
        className="h-full rounded-full transition-all duration-1000" 
        style={{ width: `${result.percentage}%`, backgroundColor: color }} 
      />
    </div>

    <div className="text-xs text-slate-400 mb-2">
      {t('assessmentResults.dominantPattern')}: <span className="text-slate-300">{result.dominantArchetype}</span>
    </div>

    <div className="space-y-1">
      {result.insights.slice(0, 2).map((insight, i) => (
        <p key={i} className="text-xs text-slate-400 leading-relaxed">• {insight}</p>
      ))}
    </div>
  </div>
);

// PDF Content Generator
function generatePDFContent(result, archetypeInfo, t) {
  const colors = ["#22c55e", "#3b82f6", "#a855f7", "#ef4444", "#f97316"];
  const dateStr = result.timestamp?.toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' }) || new Date().toLocaleDateString('nl-NL');
  const displayName = result.extendedArchetypeName || archetypeInfo?.name || result.overallArchetype;
  const profileImage = archetypeInfo?.imageUrl || '';
  
  return `<!DOCTYPE html>
<html>
<head>
  <title>${t('pdf.pageTitle')}</title>
  <style>
    @page { margin: 20mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #050510; color: #f5f5f5; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #fbbf24; font-size: 28px; margin-bottom: 5px; }
    h2 { color: #a855f7; font-size: 16px; margin-bottom: 30px; font-weight: normal; }
    h3 { color: #fbbf24; font-size: 14px; margin-top: 25px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 2px; }
    .archetype-name { font-size: 24px; color: #fff; margin: 15px 0; }
    .shadow { background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 12px 15px; margin: 15px 0; }
    .metrics { display: flex; gap: 20px; margin: 20px 0; }
    .metric { flex: 1; text-align: center; padding: 15px; border: 1px solid #333; border-radius: 8px; }
    .metric-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
    .metric-value { font-size: 20px; margin-top: 5px; }
    .layer { border: 1px solid #333; padding: 15px; margin: 10px 0; border-radius: 8px; }
    .progress-bar { height: 6px; background: #222; border-radius: 3px; margin: 8px 0; }
    .progress-fill { height: 100%; border-radius: 3px; }
    .insight { font-size: 12px; color: #aaa; margin: 4px 0; }
    .prompt { background: #0a0a15; border: 1px solid #333; padding: 15px; border-radius: 8px; font-size: 11px; white-space: pre-wrap; font-family: 'Courier New', monospace; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #555; border-top: 1px solid #333; padding-top: 20px; }
    .quantum { font-style: italic; color: #ccc; padding: 15px; border-left: 3px solid #a855f7; background: rgba(168, 85, 247, 0.1); margin: 15px 0; }

    /* ── Cover Page ──────────────────────────────── */
    .cover-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 90vh;
      text-align: center;
      page-break-after: always;
    }
    .cover-brand {
      font-size: 9pt;
      letter-spacing: 6px;
      text-transform: uppercase;
      color: #22d3ee;
      margin: 0 0 6mm;
    }
    .cover-brand-sub {
      font-size: 7pt;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #64748b;
      margin: 0 0 12mm;
    }
    .cover-image {
      width: 220px;
      height: 220px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid rgba(168, 85, 247, 0.5);
      box-shadow: 0 0 40px rgba(168, 85, 247, 0.2), 0 0 80px rgba(34, 211, 238, 0.1);
      margin-bottom: 10mm;
    }
    .cover-name {
      font-size: 28pt;
      font-weight: 300;
      color: #fff;
      margin: 0 0 3mm;
      letter-spacing: 1px;
    }
    .cover-subtitle {
      font-size: 11pt;
      color: #a855f7;
      margin: 0 0 10mm;
    }
    .cover-quote {
      font-style: italic;
      font-size: 11pt;
      color: #cbd5e1;
      max-width: 480px;
      line-height: 1.7;
      border-left: 3px solid #a855f7;
      padding: 12px 20px;
      background: rgba(168, 85, 247, 0.06);
      text-align: left;
    }
    .cover-date {
      font-size: 8pt;
      color: #475569;
      margin-top: 12mm;
      letter-spacing: 1px;
    }

    /* ── Legal Page ──────────────────────────────── */
    .legal-page {
      page-break-after: always;
      padding: 0;
    }
    .legal-header {
      text-align: center;
      margin-bottom: 8mm;
      padding-bottom: 4mm;
      border-bottom: 1px solid #1e293b;
    }
    .legal-header h2 {
      font-size: 14pt;
      color: #f59e0b;
      margin: 0 0 2mm;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .legal-header p {
      font-size: 8pt;
      color: #64748b;
      margin: 0;
    }
    .legal-section {
      margin-bottom: 5mm;
      page-break-inside: avoid;
    }
    .legal-section h4 {
      font-size: 9pt;
      color: #22d3ee;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin: 0 0 2mm;
      padding-bottom: 1mm;
      border-bottom: 1px solid rgba(34, 211, 238, 0.2);
    }
    .legal-section p, .legal-section li {
      font-size: 8pt;
      color: #94a3b8;
      line-height: 1.6;
      margin: 1mm 0;
    }
    .legal-section ul {
      margin: 1mm 0;
      padding-left: 5mm;
    }
    .legal-highlight {
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 6px;
      padding: 3mm 4mm;
      margin: 3mm 0;
    }
    .legal-highlight p {
      font-size: 8.5pt;
      color: #fbbf24;
      margin: 0;
      text-align: center;
    }
    .legal-footer-note {
      text-align: center;
      font-size: 7pt;
      color: #334155;
      margin-top: 8mm;
      padding-top: 4mm;
      border-top: 1px solid #1e293b;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>

  <!-- ════════════════════════════════════════════ -->
  <!-- PAGE 1: COVER                               -->
  <!-- ════════════════════════════════════════════ -->
  <div class="cover-page">
    <p class="cover-brand">Garden for Life</p>
    <p class="cover-brand-sub">Advanced Consciousness Assessment</p>
    ${profileImage ? `<img class="cover-image" src="${profileImage}" alt="${displayName}" />` : ''}
    <h1 class="cover-name">${displayName}</h1>
    ${result.supportArchetype ? `<p class="cover-subtitle">Support: ${result.supportArchetype}</p>` : ''}
    ${result.quantumResonance ? `<div class="cover-quote">&ldquo;${result.quantumResonance}&rdquo;</div>` : ''}
    <p class="cover-date">${dateStr}</p>
  </div>

  <!-- ════════════════════════════════════════════ -->
  <!-- PAGE 2: JURIDISCHE INFORMATIE               -->
  <!-- ════════════════════════════════════════════ -->
  <div class="legal-page">
    <div class="legal-header">
      <h2>Juridische Informatie</h2>
      <p>Lees deze pagina zorgvuldig door voordat u verder leest</p>
    </div>

    <div class="legal-highlight">
      <p>Dit rapport is gegenereerd door een AI-model en vormt <strong>geen klinische diagnose</strong>,
      medisch advies of psychologisch oordeel. De resultaten zijn indicatief binnen het
      Garden for Life-model en mogen niet worden gebruikt als vervanging voor professionele hulpverlening.</p>
    </div>

    <div class="legal-section">
      <h4>1. Modeldisclaimer</h4>
      <p>Garden for Life gebruikt het Deltawerken-Model, een metaforisch raamwerk gebaseerd op 12 archetypische
      patronen. Alle termen zoals &ldquo;Nature&rdquo;, &ldquo;Culture&rdquo;, &ldquo;Shadow&rdquo; en
      &ldquo;Polarization&rdquo; zijn <em>modelconcepten</em> &mdash; geen biologische, neurologische of
      medische feiten. De analyse beschrijft antwoordpatronen, niet uw persoonlijkheid als vaststaand gegeven.</p>
    </div>

    <div class="legal-section">
      <h4>2. AI-Transparantie (EU AI Act)</h4>
      <p>De persoonlijkheidsanalyse in dit rapport is gegenereerd door een groot taalmodel (LLM).
      Conform de EU AI Act informeren wij u dat:</p>
      <ul>
        <li>De analyse is gebaseerd op uw antwoorden op de assessment-vragen en eventueel ge&uuml;ploade documenten</li>
        <li>Het AI-systeem kan onnauwkeurigheden, vooroordelen of hallucinaties bevatten</li>
        <li>De output mag niet worden beschouwd als objectieve waarheid of wetenschappelijk bewijs</li>
        <li>Er vindt g&eacute;&eacute;n geautomatiseerde besluitvorming plaats op basis van deze resultaten</li>
      </ul>
    </div>

    <div class="legal-section">
      <h4>3. Gegevensbescherming (AVG / GDPR)</h4>
      <p>Uw assessment-gegevens worden verwerkt op grond van uw uitdrukkelijke toestemming (Art. 6 lid 1a AVG).
      Bijzondere persoonsgegevens (antwoordpatronen die indirect psychologische kenmerken kunnen onthullen) worden
      verwerkt op grond van Art. 9 lid 2a AVG. U heeft te allen tijde het recht op:</p>
      <ul>
        <li>Inzage, rectificatie en verwijdering van uw gegevens</li>
        <li>Intrekking van uw toestemming</li>
        <li>Overdraagbaarheid van uw gegevens (dataportabiliteit)</li>
        <li>Het indienen van een klacht bij de Autoriteit Persoonsgegevens</li>
      </ul>
    </div>

    <div class="legal-section">
      <h4>4. Gegevensbewaring</h4>
      <p>Uw assessment-resultaten worden maximaal <strong>90 dagen</strong> bewaard op beveiligde servers,
      waarna ze automatisch en onherroepelijk worden verwijderd. Dit rapport is uw persoonlijke kopie.
      Garden for Life bewaart na verwijdering geen kopie van uw resultaten.</p>
    </div>

    <div class="legal-section">
      <h4>5. Intellectueel Eigendom</h4>
      <p>Het Deltawerken-Model, de archetypische geometrie, de vragenlijst en de visuele ontwerpen zijn
      intellectueel eigendom van Garden for Life / Yuan Wu. Dit rapport is uitsluitend voor persoonlijk gebruik.
      Reproductie, distributie of commerci&euml;le exploitatie zonder schriftelijke toestemming is verboden.</p>
    </div>

    <div class="legal-section">
      <h4>6. Beperkingen &amp; Aansprakelijkheid</h4>
      <p>Garden for Life aanvaardt geen aansprakelijkheid voor beslissingen genomen op basis van dit rapport.
      Bij psychische klachten of zorgen wordt u dringend aangeraden contact op te nemen met een gekwalificeerde
      zorgprofessional. De resultaten zijn een startpunt voor zelfreflectie, niet een eindoordeel.</p>
    </div>

    <div class="legal-footer-note">
      Door dit rapport te downloaden bevestigt u kennis te hebben genomen van bovenstaande voorwaarden.<br/>
      Volledige juridische documenten: www.gardenforlife.nl &nbsp;&bull;&nbsp; Contact: info@gardenforlife.nl
    </div>
  </div>

  <!-- ════════════════════════════════════════════ -->
  <!-- PAGE 3+: ASSESSMENT RESULTATEN              -->
  <!-- ════════════════════════════════════════════ -->

  <h3>${t('pdf.primaryArchetype')}</h3>
  <div class="archetype-name">${archetypeInfo?.name || result.overallArchetype}</div>
  <p style="color: #ccc;">${archetypeInfo?.description || ''}</p>
  <div class="shadow">
    <strong style="color: #ef4444;">${t('pdf.shadowAspect')}</strong> ${archetypeInfo?.shadow || result.overallShadow}
  </div>

  <h3>${t('pdf.harmonyMetrics')}</h3>
  <div class="metrics">
    <div class="metric">
      <div class="metric-label">${t('pdf.harmonyScore')}</div>
      <div class="metric-value" style="color: #22c55e;">${result.harmonyScore}%</div>
    </div>
    <div class="metric">
      <div class="metric-label">${t('pdf.consciousnessLevel')}</div>
      <div class="metric-value" style="color: #a855f7;">${result.consciousnessLevel}</div>
    </div>
    <div class="metric">
      <div class="metric-label">${t('pdf.quantumState')}</div>
      <div class="metric-value" style="color: #fbbf24;">${result.overallArchetype}</div>
    </div>
  </div>

  <h3>${t('pdf.quantumResonance')}</h3>
  <div class="quantum">"${result.quantumResonance}"</div>

  <h3>${t('pdf.layerAnalysis')}</h3>
  ${result.subjectResults.map((s, i) => `
  <div class="layer">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <strong style="color: ${colors[i]}">${i + 1}. ${s.subjectName}</strong>
      <span style="color: ${colors[i]}">${s.percentage}% ${t('pdf.integrationLabel')}</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${s.percentage}%; background: ${colors[i]}"></div>
    </div>
    <p style="font-size: 11px; color: #888; margin: 5px 0;">${t('pdf.dominantPattern')} ${s.dominantArchetype}</p>
    ${s.insights.map(insight => `<div class="insight">• ${insight}</div>`).join("")}
  </div>`).join("")}

  <h3>${t('pdf.aiTrainingPrompt')}</h3>
  <p style="font-size: 11px; color: #666; margin-bottom: 10px;">${t('pdf.aiTrainingDesc')}</p>
  <div class="prompt">${result.aiTrainingPrompt}</div>

  <div class="footer">
    ${t('pdf.footer')}<br>
    www.gardenforlife.nl
  </div>
</body>
</html>`;
}

export default AssessmentResults;
