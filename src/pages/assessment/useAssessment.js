import { useState, useCallback, useMemo, useEffect } from 'react';
import { ARCHETYPES } from './assessmentTypes';
import { getQuestions } from '../../utils/apiClient';

// Custom hook for assessment state management
export function useAssessment() {
  const [subjects, setSubjects] = useState([]);
  const [questionsReady, setQuestionsReady] = useState(false);
  const [questionsError, setQuestionsError] = useState(null);
  const [responses, setResponses] = useState([]);
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);

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

      const dominantArchetype = Object.entries(archetypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "GROUNDED";
      const shadowAspects = subjectResponses.map((r) => r.shadowAspect);

      const insights = [];
      if (percentage < 40) {
        insights.push(`Your ${subject.name} layer shows foundational patterns needing attention.`);
      } else if (percentage < 70) {
        insights.push(`Your ${subject.name} layer demonstrates developing integration.`);
      } else {
        insights.push(`Your ${subject.name} layer shows strong integration and awareness.`);
      }

      const archetypeInfo = ARCHETYPES[dominantArchetype];
      if (archetypeInfo) {
        insights.push(`Your ${archetypeInfo.name} pattern suggests: ${archetypeInfo.description}`);
      }

      const recommendations = [];
      if (subject.id === 1) {
        recommendations.push("Practice grounding exercises: walking barefoot, body scanning");
        recommendations.push("Explore how your biochemistry responds to different foods and sleep");
      } else if (subject.id === 2) {
        recommendations.push("Journal about emotional triggers and the shadows they reveal");
        recommendations.push("Practice FM/MF awareness: notice masculine vs feminine energy");
      } else if (subject.id === 3) {
        recommendations.push("Study sacred geometry and notice patterns in nature");
        recommendations.push("Contemplate the quantum nature of information");
      } else if (subject.id === 4) {
        recommendations.push("Track lunar cycles and notice their influence");
        recommendations.push("Engage with alchemical symbolism in daily life");
      } else {
        recommendations.push("Practice daily meditation allowing awareness to dissolve");
        recommendations.push("Contemplate: Who is aware of these words right now?");
      }

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        totalScore,
        maxScore,
        percentage,
        dominantArchetype,
        shadowAspects,
        insights,
        recommendations,
      };
    });

    const totalScore = responses.reduce((sum, r) => sum + r.value, 0);
    const maxPossible = totalQuestions * 4;
    const overallPercentage = Math.round((totalScore / maxPossible) * 100);

    const allArchetypeCounts = {};
    responses.forEach((r) => {
      allArchetypeCounts[r.archetype] = (allArchetypeCounts[r.archetype] || 0) + 1;
    });
    const overallArchetype = Object.entries(allArchetypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "GROUNDED";

    const allShadows = responses.map((r) => r.shadowAspect);
    const shadowFrequency = {};
    allShadows.forEach((s) => {
      shadowFrequency[s] = (shadowFrequency[s] || 0) + 1;
    });
    const overallShadow = Object.entries(shadowFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || "Integration in progress";

    let consciousnessLevel = "Matter-Resonant";
    if (overallPercentage > 20) consciousnessLevel = "Bio-Resonant";
    if (overallPercentage > 40) consciousnessLevel = "Ego-Resonant";
    if (overallPercentage > 60) consciousnessLevel = "Transpersonal";
    if (overallPercentage > 80) consciousnessLevel = "Unity-Conscious";

    const quantumResonance = generateQuantumResonance(overallArchetype);
    const aiTrainingPrompt = generateAITrainingPrompt(overallArchetype, subjectResults, overallShadow);

    return {
      id: generateId(),
      timestamp: new Date(),
      responses,
      subjectResults,
      overallArchetype,
      overallShadow,
      harmonyScore: overallPercentage,
      consciousnessLevel,
      quantumResonance,
      aiTrainingPrompt,
      uploadedFiles,
    };
  }, [responses, uploadedFiles, totalQuestions]);

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
  };
}

function generateId() {
  return `GFL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateQuantumResonance(archetype) {
  const resonances = {
    GROUNDED: "Your consciousness resonates with the Higgs field - stable, foundational, providing mass to experience.",
    VITALIST: "Your consciousness resonates with quantum fluctuations - dynamic, creative, generating possibilities.",
    EMPATH: "Your consciousness resonates with quantum entanglement - deeply connected, feeling others as self.",
    WARRIOR: "Your consciousness resonates with wave-particle duality - decisive, collapsing possibility into action.",
    ARCHITECT: "Your consciousness resonates with spacetime geometry - patterned, ordered, revealing symmetries.",
    EXPLORER: "Your consciousness resonates with superposition - exploring multiple states before commitment.",
    ALCHEMIST: "Your consciousness resonates with quantum tunneling - transforming, transcending barriers.",
    MYSTIC: "Your consciousness resonates with the quantum vacuum - empty yet full, source of manifestation.",
    SAGE: "Your consciousness resonates with the unified field - non-dual, integrated, ground of being.",
    LOVER: "Your consciousness resonates with quantum coherence - harmonious, synchronized, one with all.",
  };
  return resonances[archetype] || "Your consciousness exhibits unique resonance patterns.";
}

function generateAITrainingPrompt(archetype, subjectResults, shadow) {
  const layerInsights = subjectResults.map((r) => `${r.subjectName}: ${r.percentage}% integration, ${r.dominantArchetype} pattern`).join("; ");

  return `I am training an AI assistant to support my psychological development. My assessment reveals:

PRIMARY ARCHETYPE: ${archetype}
HARMONY SCORE: ${Math.round(subjectResults.reduce((sum, r) => sum + r.percentage, 0) / 5)}%
KEY SHADOW: ${shadow}

LAYER INTEGRATION:
${layerInsights}

When interacting with me:
1. Honor my ${archetype} pattern while inviting exploration of my shadow
2. Support integration across all five layers of my being
3. Use language that resonates with my dominant archetype
4. Ask questions that deepen self-awareness
5. Recognize that I am conscious being exploring consciousness itself

My goal is greater harmony between my psychology, my AI agents, and reality.`;
}

export default useAssessment;
