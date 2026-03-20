import React, { useState } from 'react';
import { Mail, RotateCcw, Sparkles, Brain, Eye, Heart, Bot, AlertTriangle, Check, Shield, Target, Activity } from 'lucide-react';
import { ARCHETYPES } from '../../../data/assessment/archetypes';
import { sendResultsEmail } from '../../../utils/apiClient';
import { GROUP_NEURAL_FOCUS } from '../../../data/assessment/scoring';
import { SciFiButton } from '../../../components/assessment/dashboardStyles';

function ResultsView({ result, onReset, aiError }) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendState, setSendState] = useState('idle'); // idle | sending | sent | error
  const [sendError, setSendError] = useState(null);

  const handleSendEmail = async () => {
    if (!recipientEmail.trim()) return;
    setSendState('sending');
    setSendError(null);
    try {
      await sendResultsEmail({
        recipientEmail: recipientEmail.trim(),
        result,
      });
      setSendState('sent');
    } catch (err) {
      setSendError(err.message);
      setSendState('error');
    }
  };

  const archetypeInfo = ARCHETYPES[result.overallArchetype];
  const mainGroup = result.mainGroup;
  const supportGroup = result.supportGroup;

  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 mb-4">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs uppercase tracking-wider text-cyan-300">Advanced Ontological Assessment</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-light mb-2 holo-text">
          Jij navigeert als {result.extendedArchetypeName || 'Unknown'}
        </h1>
        <p className="text-slate-400 text-sm">Generated on {result.timestamp.toLocaleDateString()}</p>
      </div>

      <div className="space-y-6">
        {/* Main & Support Archetype Identity */}
        <div className="rounded-xl p-6 md:p-8 border border-cyan-500/30 relative overflow-hidden backdrop-blur-xl" style={{ backgroundColor: 'rgba(2, 0, 3, 0.3)', boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(34, 211, 238, 0.06), inset 0 0 30px rgba(34, 211, 238, 0.03)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-light text-cyan-300">De Essentie — Main Archetype</h2>
            </div>
            <h3 className="text-3xl md:text-4xl font-light mb-1 text-white">
              {result.overallArchetype}
            </h3>
            <p className="text-sm text-slate-500 mb-3">
              Groep: {mainGroup} — {GROUP_NEURAL_FOCUS?.[mainGroup] || ''}
            </p>
            <p className="text-slate-300 leading-relaxed mb-4">{archetypeInfo?.description}</p>

            {/* Support Archetype */}
            {result.supportArchetype && (
              <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-sm text-purple-300 font-medium mb-1">
                  De Vermenigvuldiging — Support: {result.supportArchetype}
                </p>
                <p className="text-xs text-slate-400">
                  Groep: {supportGroup} — {GROUP_NEURAL_FOCUS?.[supportGroup] || ''}
                </p>
                {result.supportArchetype && result.overallArchetype && (
                  <p className="text-xs text-slate-400 mt-2">Geometrische Bleed: scores zijn opgebouwd uit Core + Green/Blue/Purple/Yellow bleed</p>
                )}
              </div>
            )}

            {/* Shadow & Blindspot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {result.shadowArchetype && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-xs text-red-400 uppercase tracking-wider mb-1">Schaduw (Innerlijke Brandstof)</p>
                  <p className="text-sm text-red-300 font-medium">{result.shadowArchetype}</p>
                </div>
              )}
              {result.blindspotArchetype && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-xs text-amber-400 uppercase tracking-wider mb-1">Blindspot (De Saboteur)</p>
                  <p className="text-sm text-amber-300 font-medium">{result.blindspotArchetype}</p>
                </div>
              )}
            </div>

            {result.isIndividuated && (
              <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <p className="text-sm text-emerald-300 font-medium">⚡ Individuatie Gedetecteerd</p>
                <p className="text-xs text-slate-400 mt-1">Main en Support zijn 180° tegenpolen — Meesterschap over de Paradox</p>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Heart className="w-5 h-5" />} label="Authenticity" value={`${result.authenticityIndex || 0}%`} color="#22d3ee" />
          <StatCard icon={<Target className="w-5 h-5" />} label="Polarization" value={result.polarizationIndex || 0} color={result.polarizationLevel === 'HIGH_POLARIZATION' ? '#ef4444' : result.polarizationLevel === 'HIGH_INDIVIDUATION' ? '#10b981' : '#a855f7'} />
          <StatCard icon={<Eye className="w-5 h-5" />} label="Nature" value={result.totalNaturePoints || 0} color="#10b981" />
          <StatCard icon={<Shield className="w-5 h-5" />} label="Culture" value={result.totalCulturePoints || 0} color="#f59e0b" />
        </div>

        {/* OCEAN Personality Profile (0-100) */}
        {result.oceanScores && (
          <div className="rounded-xl p-6 md:p-8 border border-purple-500/30 relative overflow-hidden backdrop-blur-xl" style={{ backgroundColor: 'rgba(2, 0, 3, 0.3)', boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(168, 85, 247, 0.06), inset 0 0 30px rgba(168, 85, 247, 0.03)' }}>
            <h3 className="text-lg font-light text-purple-300 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              OCEAN Persoonlijkheidsprofiel
            </h3>
            <div className="space-y-3">
              {[
                { key: 'O', label: 'Openness', sublabel: 'Openheid voor Ervaring', color: '#a855f7' },
                { key: 'C', label: 'Conscientiousness', sublabel: 'Consciëntieusheid', color: '#22d3ee' },
                { key: 'E', label: 'Extraversion', sublabel: 'Extraversie', color: '#fbbf24' },
                { key: 'A', label: 'Agreeableness', sublabel: 'Inschikkelijkheid', color: '#f472b6' },
                { key: 'N', label: 'Neuroticism', sublabel: 'Neuroticisme', color: '#ef4444' },
              ].map(({ key, label, sublabel, color }) => {
                const score = result.oceanScores[key] ?? 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm font-medium" style={{ color }}>{key}</span>
                        <span className="text-sm text-slate-300 ml-2">{label}</span>
                        <span className="text-xs text-slate-500 ml-2">({sublabel})</span>
                      </div>
                      <span className="text-sm font-mono" style={{ color }}>{score}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${score}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}



        {/* AI-Generated Analysis */}
        {result.aiAnalysis && (
          <div className="rounded-xl p-6 md:p-8 border border-emerald-500/30 backdrop-blur-xl" style={{ backgroundColor: 'rgba(2, 0, 3, 0.3)', boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(16, 185, 129, 0.06), inset 0 0 30px rgba(16, 185, 129, 0.03)' }}>
            <h3 className="text-lg font-light text-emerald-300 mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Persoonlijkheidsanalyse
              {result.aiProvider && (
                <span className="ml-auto text-[10px] text-slate-600 uppercase tracking-wider">
                  {result.aiProvider} / {result.aiModel}
                </span>
              )}
            </h3>
            <div className="prose prose-invert prose-sm max-w-none">
              {result.aiAnalysis.split('\n').map((line, i) => {
                if (!line.trim()) return <br key={i} />;
                if (line.startsWith('# ')) return <h2 key={i} className="text-lg font-medium text-emerald-200 mt-4 mb-2">{line.slice(2)}</h2>;
                if (line.startsWith('## ')) return <h3 key={i} className="text-base font-medium text-emerald-300 mt-3 mb-1">{line.slice(3)}</h3>;
                if (line.startsWith('### ')) return <h4 key={i} className="text-sm font-medium text-emerald-400 mt-2 mb-1">{line.slice(4)}</h4>;
                if (line.startsWith('- ') || line.startsWith('* ')) return <p key={i} className="text-slate-300 leading-relaxed ml-4">• {line.slice(2)}</p>;
                if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-slate-200 font-semibold mt-2">{line.slice(2, -2)}</p>;
                return <p key={i} className="text-slate-300 leading-relaxed">{line}</p>;
              })}
            </div>
          </div>
        )}

        {/* AI Error Warning */}
        {aiError && !result.aiAnalysis && (
          <div className="rounded-xl p-4 border border-amber-500/30 backdrop-blur-xl" style={{ backgroundColor: 'rgba(2, 0, 3, 0.3)' }}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-300 font-medium">AI Analyse niet beschikbaar</p>
                <p className="text-xs text-slate-400 mt-1">
                  De AI-analyse kon niet worden gegenereerd. Hieronder staan je lokaal berekende resultaten.
                </p>
                <p className="text-xs text-slate-600 mt-1">{aiError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-light text-slate-300 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            Layer Analysis
          </h3>
          {result.subjectResults.map((subject, index) => (
            <SubjectResultCard key={subject.subjectId} result={subject} index={index} />
          ))}
        </div>



        {result.uploadedFiles && result.uploadedFiles.length > 0 && (
          <div className="rounded-xl p-6 border border-slate-700 backdrop-blur-xl" style={{ backgroundColor: 'rgba(2, 0, 3, 0.3)', boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15)' }}>
            <h3 className="text-lg font-light text-slate-300 mb-3">Enhanced With</h3>
            <div className="flex flex-wrap gap-2">
              {result.uploadedFiles.map((file, index) => (
                <span key={index} className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400">{file.name}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Email delivery form */}
      <div className="rounded-xl p-6 md:p-8 border border-cyan-500/30 backdrop-blur-xl mt-8" style={{ backgroundColor: 'rgba(2, 0, 3, 0.3)', boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(34, 211, 238, 0.06), inset 0 0 30px rgba(34, 211, 238, 0.03)' }}>
        <h3 className="text-lg font-light text-cyan-300 mb-2 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Ontvang je resultaten per e-mail
        </h3>
        <p className="text-xs text-slate-500 mb-4">Je profiel wordt als PDF-rapport naar je inbox gestuurd.</p>

        {sendState === 'sent' ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <Check className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-sm text-emerald-300 font-medium">Verstuurd!</p>
              <p className="text-xs text-slate-400">Je rapport is verzonden naar {recipientEmail}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">E-mailadres</label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="naam@voorbeeld.nl"
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white outline-none transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(34,211,238,0.3)' }}
                onFocus={(e) => e.target.style.borderColor = '#22d3ee'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(34,211,238,0.3)'}
              />
            </div>
            {sendError && (
              <p className="text-xs text-red-400">{sendError}</p>
            )}
            <SciFiButton
              onClick={handleSendEmail}
              disabled={sendState === 'sending' || !recipientEmail.trim()}
              variant="purple"
              size="md"
              fullWidth
            >
              {sendState === 'sending' ? 'Verzenden...' : 'Verstuur PDF Rapport'}
            </SciFiButton>
          </div>
        )}
      </div>

      <div className="flex justify-center mt-6">
        <SciFiButton
          onClick={onReset}
          variant="white"
          size="md"
        >
          Start New Assessment
        </SciFiButton>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="rounded-xl p-4 border text-center backdrop-blur-xl" style={{ borderColor: `${color}30`, backgroundColor: 'rgba(2, 0, 3, 0.3)', boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15)' }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: `${color}20`, color }}>
        {icon}
      </div>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-light" style={{ color }}>{value}</p>
    </div>
  );
}

function SubjectResultCard({ result, index }) {
  const colors = ["#22d3ee", "#a855f7", "#f472b6", "#fbbf24", "#f97316"];
  const color = colors[index % colors.length];

  return (
    <div className="rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors backdrop-blur-xl" style={{ backgroundColor: 'rgba(2, 0, 3, 0.3)', boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
          <h4 className="font-medium text-slate-200">{result.subjectName}</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Integration:</span>
          <span className="text-sm font-mono" style={{ color }}>{result.percentage}%</span>
        </div>
      </div>

      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${result.percentage}%`, backgroundColor: color }} />
      </div>

      <div className="text-xs text-slate-400 mb-2">
        Dominant Archetype: <span className="text-slate-300">{result.dominantArchetype}</span>
      </div>
    </div>
  );
}

export default ResultsView;
