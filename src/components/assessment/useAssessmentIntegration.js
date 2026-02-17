import { useState, useCallback, useMemo } from 'react';
import { assessmentSubjects } from '../../pages/assessment/assessmentData';
import { ARCHETYPES } from '../../pages/assessment/assessmentTypes';

/**
 * useAssessmentIntegration - Hook for managing assessment state within the pyramid
 * Bridges the assessment logic with the pyramid's 5 layers
 */
export function useAssessmentIntegration() {
  const [responses, setResponses] = useState([]);
  const [completedLayers, setCompletedLayers] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Map assessment subjects to pyramid layers
  const layerData = useMemo(() => assessmentSubjects.map(subject => ({
    id: subject.id,
    name: subject.name,
    title: subject.title,
    subtitle: subject.subtitle,
    color: subject.color,
    layerIndex: subject.layerIndex,
    description: subject.description,
    fundamental: subject.fundamental,
    questions: subject.questions
  })), []);

  // Get all questions flat array
  const allQuestions = useMemo(() => 
    assessmentSubjects.flatMap(s => s.questions), 
  []);

  const totalQuestions = allQuestions.length;
  const answeredQuestions = responses.length;
  const overallProgress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  // Get responses for a specific layer
  const getLayerResponses = useCallback((layerIndex) => {
    const layer = assessmentSubjects[layerIndex];
    if (!layer) return [];
    const questionIds = layer.questions.map(q => q.id);
    return responses.filter(r => questionIds.includes(r.questionId));
  }, [responses]);

  // Check if a layer is complete
  const isLayerComplete = useCallback((layerIndex) => {
    const layer = assessmentSubjects[layerIndex];
    if (!layer) return false;
    const layerResponses = getLayerResponses(layerIndex);
    return layerResponses.length >= layer.questions.length;
  }, [getLayerResponses]);

  // Check if a layer is unlocked (previous layer must be complete, or it's layer 0)
  const isLayerUnlocked = useCallback((layerIndex) => {
    if (layerIndex === 0) return true;
    return isLayerComplete(layerIndex - 1);
  }, [isLayerComplete]);

  // Handle answer selection
  const selectAnswer = useCallback((questionId, answerId) => {
    const question = allQuestions.find(q => q.id === questionId);
    if (!question) return;

    const answer = question.answers.find(a => a.id === answerId);
    if (!answer) return;

    const response = {
      questionId,
      answerId,
      value: answer.value,
      archetype: answer.archetype,
      shadowAspect: answer.shadowAspect,
    };

    setResponses(prev => {
      const filtered = prev.filter(r => r.questionId !== questionId);
      return [...filtered, response];
    });
  }, [allQuestions]);

  // Handle layer completion
  const completeLayer = useCallback((layerIndex) => {
    if (!completedLayers.includes(layerIndex)) {
      setCompletedLayers(prev => [...prev, layerIndex]);
    }
    
    // Check if all layers complete
    if (layerIndex === assessmentSubjects.length - 1) {
      // All layers done, can show results
      setTimeout(() => setShowResults(true), 1000);
    }
  }, [completedLayers]);

  // File handling
  const addFile = useCallback((file) => {
    setUploadedFiles(prev => [...prev, file]);
  }, []);

  const removeFile = useCallback((index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Calculate results
  const calculateResults = useMemo(() => {
    const subjectResults = assessmentSubjects.map((subject) => {
      const subjectResponses = responses.filter(r =>
        subject.questions.some(q => q.id === r.questionId)
      );

      const totalScore = subjectResponses.reduce((sum, r) => sum + r.value, 0);
      const maxScore = subject.questions.length * 4;
      const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

      const archetypeCounts = {};
      subjectResponses.forEach(r => {
        archetypeCounts[r.archetype] = (archetypeCounts[r.archetype] || 0) + 1;
      });

      const dominantArchetype = Object.entries(archetypeCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "GROUNDED";
      
      const shadowAspects = subjectResponses.map(r => r.shadowAspect);

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
    const overallPercentage = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;

    const allArchetypeCounts = {};
    responses.forEach(r => {
      allArchetypeCounts[r.archetype] = (allArchetypeCounts[r.archetype] || 0) + 1;
    });
    const overallArchetype = Object.entries(allArchetypeCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "GROUNDED";

    const allShadows = responses.map(r => r.shadowAspect);
    const shadowFrequency = {};
    allShadows.forEach(s => {
      shadowFrequency[s] = (shadowFrequency[s] || 0) + 1;
    });
    const overallShadow = Object.entries(shadowFrequency)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "Integration in progress";

    let consciousnessLevel = "Matter-Resonant";
    if (overallPercentage > 20) consciousnessLevel = "Bio-Resonant";
    if (overallPercentage > 40) consciousnessLevel = "Ego-Resonant";
    if (overallPercentage > 60) consciousnessLevel = "Transpersonal";
    if (overallPercentage > 80) consciousnessLevel = "Unity-Conscious";

    const quantumResonance = generateQuantumResonance(overallArchetype);
    const aiTrainingPrompt = generateAITrainingPrompt(overallArchetype, subjectResults, overallShadow);

    return {
      id: `GFL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

  // Reset everything
  const reset = useCallback(() => {
    setResponses([]);
    setCompletedLayers([]);
    setUploadedFiles([]);
    setShowResults(false);
  }, []);

  return {
    // State
    responses,
    completedLayers,
    uploadedFiles,
    showResults,
    setShowResults,
    
    // Data
    layerData,
    allQuestions,
    totalQuestions,
    answeredQuestions,
    overallProgress,
    
    // Methods
    getLayerResponses,
    isLayerComplete,
    isLayerUnlocked,
    selectAnswer,
    completeLayer,
    addFile,
    removeFile,
    calculateResults,
    reset,
  };
}

// Helper functions
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
  const layerInsights = subjectResults
    .map(r => `${r.subjectName}: ${r.percentage}% integration, ${r.dominantArchetype} pattern`)
    .join("; ");

  const avgIntegration = Math.round(
    subjectResults.reduce((sum, r) => sum + r.percentage, 0) / subjectResults.length
  );

  return `I am training an AI assistant to support my psychological development. My consciousness profile assessment reveals:

PRIMARY ARCHETYPE: ${archetype}
HARMONY SCORE: ${avgIntegration}%
KEY SHADOW: ${shadow}

LAYER INTEGRATION:
${layerInsights}

When interacting with me:
1. Honor my ${archetype} pattern while gently inviting exploration of my shadow aspects
2. Support integration across all five layers of my being (Foundation, Emotional, Mental, Spiritual, Unity)
3. Use language and metaphors that resonate with my dominant archetype
4. Ask questions that deepen self-awareness and promote shadow integration
5. Recognize that I am a conscious being exploring consciousness itself

COMMUNICATION STYLE GUIDANCE:
- ${archetype === 'ARCHITECT' ? 'Use logical frameworks and structured thinking' : ''}
- ${archetype === 'EMPATH' ? 'Lead with emotional resonance and relational language' : ''}
- ${archetype === 'MYSTIC' ? 'Incorporate spiritual metaphors and transcendent perspectives' : ''}
- ${archetype === 'WARRIOR' ? 'Be direct, action-oriented, and empowering' : ''}
- ${archetype === 'SAGE' ? 'Offer wisdom teachings and non-dual perspectives' : ''}

My goal is greater harmony between my psychology, my AI agents, and reality itself.

Based on research in: quantum panpsychism, morphogenesis, alchemical traditions, FM/MF dynamics.
Source: Garden for Life Consciousness Profile System`;
}

export default useAssessmentIntegration;
