import { useState, useCallback, useMemo, useEffect } from 'react';

import { getQuestions } from '../../utils/apiClient';
import {
  computeAdvancedScores,
  ARCHETYPE_TO_GROUP,
  SHADOW_PAIRS,
  GROUP_NEURAL_FOCUS,
  SCORING_TIERS,
} from '../../data/assessment/scoring';

// Custom hook for assessment state management
export function useAssessment() {
  const [subjects, setSubjects] = useState([]);
  const [questionsReady, setQuestionsReady] = useState(false);
  const [questionsError, setQuestionsError] = useState(null);
  const [responses, setResponses] = useState([]);
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [scoringTier, setScoringTier] = useState('INTERMEDIATE'); // BEGINNER, INTERMEDIATE, ADVANCED

  // Fetch questions from backend — API is the sole source of truth
  useEffect(() => {
    let cancelled = false;
    getQuestions()
      .then((data) => {
        if (cancelled) return;
        if (data.seeded && data.layers && data.layers.length > 0) {
          const mapped = data.layers.map((layer) => ({
            id: layer.layerId || layer._id,
            name: layer.name,
            title: layer.title,
            subtitle: layer.subtitle,
            color: layer.color,
            layerIndex: layer.layerIndex,
            fundamental: layer.fundamental,
            description: layer.description,
            questions: layer.questions,
          }));
          setSubjects(mapped);
          setQuestionsReady(true);
          console.log('[Assessment] Loaded questions from backend');
        } else {
          setQuestionsError('Questions not seeded yet. An admin must seed from the dashboard.');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[Assessment] Failed to load questions:', err.message);
          setQuestionsError('Could not connect to the server. Please try again later.');
        }
      });
    return () => { cancelled = true; };
  }, []);

  const currentSubject = subjects[currentSubjectIndex];
  const currentQuestion = currentSubject?.questions?.[currentQuestionIndex];
  const totalQuestions = subjects.reduce((acc, s) => acc + s.questions.length, 0);
  const answeredQuestions = responses.length;
  const progress = (answeredQuestions / totalQuestions) * 100;

  const selectAnswer = useCallback((answerId) => {
    const answer = currentQuestion.answers.find((a) => a.id === answerId);
    if (!answer) return;

    const response = {
      questionId: currentQuestion.id,
      answerId,
      value: answer.value,
      archetype: answer.archetype,
      shadowAspect: answer.shadowAspect,
    };

    setResponses((prev) => {
      const filtered = prev.filter((r) => r.questionId !== currentQuestion.id);
      return [...filtered, response];
    });

    if (currentQuestionIndex < currentSubject.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else if (currentSubjectIndex < subjects.length - 1) {
      setCurrentSubjectIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
    }
  }, [currentQuestion, currentSubject, currentQuestionIndex, currentSubjectIndex, subjects]);

  const goBack = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else if (currentSubjectIndex > 0) {
      const prevSubject = subjects[currentSubjectIndex - 1];
      setCurrentSubjectIndex((prev) => prev - 1);
      setCurrentQuestionIndex(prevSubject.questions.length - 1);
    }
  }, [currentQuestionIndex, currentSubjectIndex, subjects]);

  const addFile = useCallback((file) => {
    setUploadedFiles((prev) => [...prev, file]);
  }, []);

  const removeFile = useCallback((index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const calculateResults = useMemo(() => {
    // ── Per-subject layer results (backward-compatible) ──
    const subjectResults = subjects.map((subject) => {
      const subjectResponses = responses.filter((r) =>
        subject.questions.some((q) => q.id === r.questionId)
      );

      const totalScore = subjectResponses.reduce((sum, r) => sum + r.value, 0);
      const maxScore = subject.questions.length * 4;
      const percentage = Math.round((totalScore / maxScore) * 100);

      const archetypeCounts = {};
      subjectResponses.forEach((r) => {
        archetypeCounts[r.archetype] = (archetypeCounts[r.archetype] || 0) + 1;
      });

      const dominantArchetype = Object.entries(archetypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "SAGE";
      const shadowAspects = subjectResponses.map((r) => r.shadowAspect);

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        totalScore,
        maxScore,
        percentage,
        dominantArchetype,
        shadowAspects,
      };
    });

    // ── Advanced Scoring Engine (Neuraal Schakelbord + Ontology) ──
    const advanced = computeAdvancedScores(responses, scoringTier);

    // Shadow descriptors
    const allShadows = responses.map((r) => r.shadowAspect).filter(Boolean);
    const shadowFrequency = {};
    allShadows.forEach((s) => { shadowFrequency[s] = (shadowFrequency[s] || 0) + 1; });
    const overallShadow = Object.entries(shadowFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || "Integration in progress";

    // Consciousness level based on authenticity and total engagement
    const overallPercentage = advanced.totalPointsAwarded > 0
      ? Math.round((advanced.totalPointsAwarded / advanced.baseMaxScore) * 100)
      : 0;
    let consciousnessLevel = "Matter-Resonant";
    if (overallPercentage > 20) consciousnessLevel = "Bio-Resonant";
    if (overallPercentage > 40) consciousnessLevel = "Ego-Resonant";
    if (overallPercentage > 60) consciousnessLevel = "Transpersonal";
    if (overallPercentage > 80) consciousnessLevel = "Unity-Conscious";

    return {
      id: generateId(),
      timestamp: new Date(),
      responses,
      subjectResults,

      // Core archetype results (Advanced engine)
      overallArchetype: advanced.mainArchetype,
      supportArchetype: advanced.supportArchetype,
      mainGroup: advanced.mainGroup,
      supportGroup: advanced.supportGroup,
      extendedArchetypeName: advanced.extendedArchetypeName,
      extendedArchetypeNameNl: advanced.extendedArchetypeNameNl,

      // Shadow & Blindspot
      shadowArchetype: advanced.shadowArchetype,
      blindspotArchetype: advanced.blindspotArchetype,
      isIndividuated: advanced.isIndividuated,
      overallShadow,

      // Bonuses (Geometric Bleed — no separate counters, kept for backward compat)
      hasBeheersingsBonus: false,
      beheersingsBonus: 0,
      hasShadowHarmony: advanced.hasShadowHarmony,
      harmonyBonus: 0,
      hasHarmonyBonus: false,
      harmonyBonusApplied: 0,
      harmonyScore: overallPercentage,

      // Advanced metrics (Ontology)
      polarizationIndex: advanced.polarizationIndex,
      polarizationLevel: advanced.polarizationLevel,
      authenticityIndex: advanced.authenticityIndex,
      authenticityLevel: advanced.authenticityLevel,
      totalNaturePoints: advanced.totalNaturePoints,
      totalCulturePoints: advanced.totalCulturePoints,

      // Detailed data for AI & visualization
      archetypeDetails: advanced.archetypeDetails,
      radarData: advanced.radarData,
      subgroupDynamics: advanced.subgroupDynamics,
      scores: advanced.scores,

      // OCEAN scores (0-100, mathematically derived from archetype weights)
      oceanScores: advanced.oceanScores,

      consciousnessLevel,
      uploadedFiles,

      // Scoring tier
      scoringTier: advanced.tier,
      scoringTierLabel: advanced.tierLabel,
    };
  }, [responses, uploadedFiles, totalQuestions, subjects, scoringTier]);

  const reset = useCallback(() => {
    setResponses([]);
    setCurrentSubjectIndex(0);
    setCurrentQuestionIndex(0);
    setUploadedFiles([]);
  }, []);

  // DEV: Fill all questions across all subjects with random answers
  const autoFillAll = useCallback(() => {
    if (!subjects.length) return;
    const allResponses = [];
    subjects.forEach((subject) => {
      subject.questions.forEach((q) => {
        const shuffled = [...q.answers].sort(() => Math.random() - 0.5);
        allResponses.push({
          questionId: q.id,
          answerId: shuffled[0].id,
          value: shuffled[0].value,
          archetype: shuffled[0].archetype,
          shadowAspect: shuffled[0].shadowAspect,
        });
      });
    });
    setResponses(allResponses);
    // Position at end so isLastQuestion check works
    const lastSubject = subjects[subjects.length - 1];
    setCurrentSubjectIndex(subjects.length - 1);
    setCurrentQuestionIndex(lastSubject.questions.length - 1);
  }, [subjects]);

  return {
    subjects,
    questionsReady,
    questionsError,
    currentSubject,
    currentQuestion,
    currentSubjectIndex,
    currentQuestionIndex,
    progress,
    responses,
    uploadedFiles,
    selectAnswer,
    goBack,
    addFile,
    removeFile,
    calculateResults,
    reset,
    autoFillAll,
    totalQuestions,
    answeredQuestions,
    scoringTier,
    setScoringTier,
    scoringTiers: SCORING_TIERS,
  };
}

function generateId() {
  return `GFL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default useAssessment;
