import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Edges } from '@react-three/drei';
import * as THREE from 'three';
import HoloCore from '../holoearth/HoloCore';
import AssessmentIntro from './AssessmentIntro';
import AssessmentQuestions from './AssessmentQuestions';
import AssessmentUpload from './AssessmentUpload';
import AssessmentResults from './AssessmentResults';
import { useAssessmentIntegration } from './useAssessmentIntegration';

const TOTAL_LAYERS = 5;
const PYRAMID_HEIGHT = 5;
const BASE_RADIUS = 3.5;
const LAYER_THICKNESS = PYRAMID_HEIGHT / TOTAL_LAYERS;
const SPACING = 0.08;

const INTRO_DELAY = 3.0;
const INTRO_DURATION = 2.0;

// Assessment states
const ASSESSMENT_STATES = {
  WAITING: 'waiting',      // Entity not yet appeared
  INTRO: 'intro',          // Show intro modal
  QUESTIONS: 'questions',  // Answering questions
  UPLOAD: 'upload',        // File upload (optional)
  RESULTS: 'results'       // Show results
};

// --- Shaders for Inner Effect ---
const holoVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const holoFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  
  void main() {
    float scanline = step(0.8, sin(vUv.y * 80.0 - uTime * 4.0));
    float pulse = smoothstep(0.0, 0.2, 0.1 - abs(fract(uTime * 0.2) - vUv.y));
    float gridX = step(0.97, fract(vUv.x * 20.0));
    float gridY = step(0.97, fract(vUv.y * 20.0));
    float grid = max(gridX, gridY) * 0.1;
    float noise = fract(sin(dot(vUv * uTime, vec2(12.9898, 78.233))) * 43758.5453);
    float flicker = 0.95 + 0.05 * noise;
    float alpha = (scanline * 0.15 + pulse * 0.3 + grid) * flicker;
    alpha *= smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
    alpha *= uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

// --- Inner Holographic Effect Component ---
const InnerHoloEffect = ({ radiusTop, radiusBottom, height, isGoldMode }) => {
    const materialRef = useRef(null);
    
    const color = useMemo(() => {
        return new THREE.Color(isGoldMode ? '#fbbf24' : '#d8b4fe');
    }, [isGoldMode]);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
            materialRef.current.uniforms.uColor.value.lerp(color, 0.1); 
        }
    });

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#d8b4fe') },
        uOpacity: { value: 1.0 }
    }), []);

    return (
        <mesh scale={[0.98, 0.98, 0.98]}>
            <cylinderGeometry args={[radiusTop * 0.99, radiusBottom * 0.99, height, 4, 1]} />
            <shaderMaterial 
                ref={materialRef}
                vertexShader={holoVertexShader}
                fragmentShader={holoFragmentShader}
                transparent
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                uniforms={uniforms}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

// --- Tech Layer Component ---
const TechLayer = ({ radiusTop, radiusBottom, height, isGoldMode, showBottomCap, layerComplete }) => {
    const basePurple = "#a855f7";
    const glowPurple = "#6b21a8";
    
    const edgesRef = useRef(null); 
    const shadowHardRef = useRef(null);
    const shadowSoftRef = useRef(null);

    useFrame((state, delta) => {
        const orangeColor = new THREE.Color("#ff6600");
        const goldColor = new THREE.Color("#fbbf24");
        const completeColor = new THREE.Color("#22d3ee");
        const darkGoldColor = new THREE.Color("#b45309");
        const neonShadowColor = new THREE.Color("#fb923c"); 
        
        if (edgesRef.current && edgesRef.current.material) {
            let targetColor = orangeColor;
            if (isGoldMode) targetColor = goldColor;
            else if (layerComplete) targetColor = completeColor;
            edgesRef.current.material.color.lerp(targetColor, delta * 3);
            edgesRef.current.material.opacity = 1;
        }

        const targetShadowOpacity = isGoldMode ? 0.3 : 0;
        const targetGlowOpacity = isGoldMode ? 0.2 : 0;

        if (shadowHardRef.current && shadowHardRef.current.material) {
             const mat = shadowHardRef.current.material;
             mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetShadowOpacity, delta * 2);
             mat.color = darkGoldColor;
             mat.transparent = true;
        }

        if (shadowSoftRef.current && shadowSoftRef.current.material) {
             const mat = shadowSoftRef.current.material;
             mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetGlowOpacity, delta * 2);
             mat.color.lerp(neonShadowColor, delta * 2);
             mat.transparent = true;
        }
    });

    const frameColor = isGoldMode ? "#b45309" : "#4c1d95";

    return (
        <group>
            <mesh>
                <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 1]} />
                <meshPhysicalMaterial 
                    color={basePurple}
                    emissive={glowPurple}
                    emissiveIntensity={0.5}
                    transparent
                    opacity={0.3}
                    roughness={0.1}
                    metalness={0.8}
                    transmission={0.9} 
                    thickness={2.5}
                    attenuationColor="#ffffff"
                    attenuationDistance={5}
                    side={THREE.DoubleSide}
                />
            </mesh>

            <mesh>
                 <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 1]} />
                 <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                 <Edges ref={edgesRef} threshold={10} color="#ff6600" scale={1.005} />
            </mesh>

             <mesh position={[0.08, -0.08, 0.08]} scale={[1.02, 1.02, 1.02]}>
                <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 1]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                <Edges ref={shadowHardRef} threshold={10} color="#b45309" />
            </mesh>
            
             <mesh position={[0.15, -0.15, 0.15]} scale={[1.04, 1.04, 1.04]}>
                <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 1]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                <Edges ref={shadowSoftRef} threshold={10} color="#fb923c" />
            </mesh>

            <mesh scale={[0.85, 0.98, 0.85]}>
                <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 2]} />
                <meshBasicMaterial 
                    color={isGoldMode ? "#d97706" : "#22d3ee"} 
                    wireframe 
                    transparent 
                    opacity={0.15} 
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
            
            <group position={[0, height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <mesh>
                    <ringGeometry args={[radiusTop * 0.8, radiusTop, 4]} />
                    <meshStandardMaterial color={frameColor} metalness={0.9} roughness={0.2} side={THREE.DoubleSide} />
                    <Edges threshold={10} color={isGoldMode ? "#fbbf24" : "#ff6600"} opacity={0.5} />
                </mesh>
            </group>
             {showBottomCap && (
                 <group position={[0, -height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <mesh>
                        <ringGeometry args={[radiusBottom * 0.8, radiusBottom, 4]} />
                        <meshStandardMaterial color={frameColor} metalness={0.9} roughness={0.2} side={THREE.DoubleSide} />
                        <Edges threshold={10} color={isGoldMode ? "#fbbf24" : "#ff6600"} opacity={0.5} />
                    </mesh>
                </group>
             )}
            <InnerHoloEffect 
                 radiusTop={radiusTop * 0.9} 
                 radiusBottom={radiusBottom * 0.9} 
                 height={height}
                 isGoldMode={isGoldMode}
            />
        </group>
    );
};

// --- Main Pyramid Assessment Scene ---
const HoloPyramidAssessment = ({ scrollProgress = 0, isActive = false, onSendComplete = () => {}, onNavigateToData }) => {
  const groupRef = useRef(null);
  const containerRef = useRef(null);
  const buttonGroupRef = useRef(null);
  
  const containerBoxMatRef = useRef(null);
  const containerOctMatRef = useRef(null);
  const containerEdgesRef = useRef(null);
  const containerShadowHardRef = useRef(null);
  const containerShadowSoftRef = useRef(null);

  const { gl } = useThree();
  const portalNode = useMemo(() => ({ current: gl.domElement.parentNode }), [gl]);

  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [isGoldMode, setIsGoldMode] = useState(false);
  const [entityOpacity, setEntityOpacity] = useState(0);
  const [assessmentState, setAssessmentState] = useState(ASSESSMENT_STATES.WAITING);
  const [assessmentLevel, setAssessmentLevel] = useState(null);
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const activationTimeRef = useRef(null);
  const wasActiveRef = useRef(false);
  const entityShownRef = useRef(false);

  // Assessment Integration Hook
  const assessment = useAssessmentIntegration();

  // Current subject and question data
  const currentSubject = assessment.layerData[currentSubjectIndex];
  const currentQuestions = currentSubject?.questions || [];
  const currentQuestion = currentQuestions[currentQuestionIndex];

  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      activationTimeRef.current = null;
    }
    wasActiveRef.current = isActive;
  }, [isActive]);

  // Show intro when entity fully appears
  useEffect(() => {
    if (entityOpacity > 0.9 && !entityShownRef.current) {
      entityShownRef.current = true;
      // Delay slightly then show intro
      setTimeout(() => {
        setAssessmentState(ASSESSMENT_STATES.INTRO);
      }, 500);
    }
  }, [entityOpacity]);

  const layers = useMemo(() => {
    return Array.from({ length: TOTAL_LAYERS }).map((_, i) => {
      const bottomY = i * LAYER_THICKNESS;
      const topY = (i + 1) * LAYER_THICKNESS;
      const radiusBottom = BASE_RADIUS * (1 - bottomY / PYRAMID_HEIGHT);
      const radiusTop = BASE_RADIUS * (1 - topY / PYRAMID_HEIGHT);
      return {
        index: i,
        radiusTop,
        radiusBottom,
        height: LAYER_THICKNESS - SPACING,
        yPos: bottomY + (LAYER_THICKNESS / 2) - (PYRAMID_HEIGHT / 2),
      };
    });
  }, []);

  const totalMovable = TOTAL_LAYERS - 1;

  // Handle starting the assessment
  const handleStartAssessment = useCallback((level) => {
    setAssessmentLevel(level);
    setAssessmentState(ASSESSMENT_STATES.QUESTIONS);
    setCurrentSubjectIndex(0);
    setCurrentQuestionIndex(0);
  }, []);

  // Handle answer selection
  const handleAnswerSelect = useCallback((questionId, answerId) => {
    assessment.selectAnswer(questionId, answerId);
    
    // Move to next question
    const isLastQuestionInSubject = currentQuestionIndex >= currentQuestions.length - 1;
    const isLastSubject = currentSubjectIndex >= assessment.layerData.length - 1;
    
    if (isLastQuestionInSubject && isLastSubject) {
      // All done - go to upload
      setAssessmentState(ASSESSMENT_STATES.UPLOAD);
    } else if (isLastQuestionInSubject) {
      // Next subject
      setCurrentSubjectIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    } else {
      // Next question
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [assessment, currentQuestionIndex, currentQuestions.length, currentSubjectIndex]);

  // Handle going back
  const handleGoBack = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentSubjectIndex > 0) {
      const prevSubject = assessment.layerData[currentSubjectIndex - 1];
      setCurrentSubjectIndex(prev => prev - 1);
      setCurrentQuestionIndex(prevSubject.questions.length - 1);
    }
  }, [currentQuestionIndex, currentSubjectIndex, assessment.layerData]);

  // Handle completing assessment
  const handleContinueToResults = useCallback(() => {
    setAssessmentState(ASSESSMENT_STATES.RESULTS);
    setIsGoldMode(true);
    onSendComplete();
  }, [onSendComplete]);

  // Handle reset
  const handleReset = useCallback(() => {
    assessment.reset();
    setAssessmentState(ASSESSMENT_STATES.INTRO);
    setCurrentSubjectIndex(0);
    setCurrentQuestionIndex(0);
    setIsGoldMode(false);
  }, [assessment]);

  useFrame((state, delta) => {
    if (!groupRef.current || !containerRef.current) return;

    groupRef.current.rotation.y += delta * 0.2;
    
    const floatY = 4.5 + Math.sin(state.clock.elapsedTime) * 0.2;
    containerRef.current.position.y = floatY;
    containerRef.current.rotation.y += delta * 0.1;
    
    if (buttonGroupRef.current) {
        buttonGroupRef.current.position.y = floatY;
    }

    let introFactor = 1;
    let showContent = false;
    
    if (!isActive) {
      introFactor = 1;
      showContent = false;
      activationTimeRef.current = null;
      if (entityOpacity !== 0) setEntityOpacity(0);
      if (isIntroComplete) setIsIntroComplete(false);
    } else {
      showContent = true;
      
      if (activationTimeRef.current === null) {
        activationTimeRef.current = state.clock.elapsedTime;
      }
      
      const timeSinceActive = state.clock.elapsedTime - activationTimeRef.current;
      
      if (timeSinceActive < INTRO_DELAY) {
        introFactor = 1;
        if (entityOpacity !== 0) setEntityOpacity(0);
      } else if (timeSinceActive < INTRO_DELAY + INTRO_DURATION) {
        const t = (timeSinceActive - INTRO_DELAY) / INTRO_DURATION;
        const eased = t * t * (3 - 2 * t);
        introFactor = 1 - eased;
        
        const fade = Math.min(t / 0.75, 1);
        const easeFade = fade * fade * (3 - 2 * fade);
        setEntityOpacity(easeFade);
      } else {
        introFactor = 0;
        if (!isIntroComplete) setIsIntroComplete(true);
        if (entityOpacity !== 1) setEntityOpacity(1);
      }
    }
    
    const orangeColor = new THREE.Color("#ff6600");
    const goldColor = new THREE.Color("#fbbf24");
    
    const contentOpacity = showContent ? entityOpacity : 0;
    if (containerBoxMatRef.current) containerBoxMatRef.current.opacity = 0.05 * contentOpacity;
    if (containerOctMatRef.current) containerOctMatRef.current.opacity = 0.3 * contentOpacity;

    if (containerEdgesRef.current && containerEdgesRef.current.material) {
         const targetColor = isGoldMode ? goldColor : orangeColor;
         containerEdgesRef.current.material.color.lerp(targetColor, delta * 3);
         containerEdgesRef.current.material.opacity = contentOpacity; 
    }

    const targetShadowOp = isGoldMode ? 0.3 : 0;
    const targetGlowOp = isGoldMode ? 0.2 : 0;

    if (containerShadowHardRef.current && containerShadowHardRef.current.material) {
        const mat = containerShadowHardRef.current.material;
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetShadowOp * contentOpacity, delta * 2);
        mat.transparent = true;
        mat.color = new THREE.Color("#b45309");
    }

    if (containerShadowSoftRef.current && containerShadowSoftRef.current.material) {
        const mat = containerShadowSoftRef.current.material;
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetGlowOp * contentOpacity, delta * 2);
        mat.transparent = true;
        mat.color = new THREE.Color("#fb923c");
    }

    // Animate layers based on scroll
    layers.forEach((layer, i) => {
      const meshChild = groupRef.current.children[i];
      if (!meshChild) return;

      if (i === 0) {
        meshChild.visible = true;
        return;
      }

      const rangeStart = (i - 1) / totalMovable;
      const rangeEnd = i / totalMovable;
      
      let scrollR = 0;
      if (scrollProgress >= rangeEnd) {
        scrollR = 1;
      } else if (scrollProgress > rangeStart) {
        scrollR = (scrollProgress - rangeStart) / (rangeEnd - rangeStart);
      }
      
      const effectiveR = scrollR + (1 - scrollR) * introFactor;

      const targetPos = new THREE.Vector3(0, layer.yPos, 0);
      const worldContainerPos = new THREE.Vector3(0, 4.5, 0);
      const inverseMatrix = groupRef.current.matrixWorld.clone().invert();
      const localStartPos = worldContainerPos.clone().applyMatrix4(inverseMatrix);

      meshChild.position.lerpVectors(localStartPos, targetPos, effectiveR);
      
      const targetScale = new THREE.Vector3(1, 1, 1);
      const startScale = new THREE.Vector3(0.01, 0.01, 0.01);
      meshChild.scale.lerpVectors(startScale, targetScale, effectiveR);

      meshChild.visible = effectiveR > 0.05;
    });
  });

  // Calculate answered count for progress
  const answeredCount = assessment.responses.length;

  return (
    <group>
      {/* 1. Rotating Pyramid Group */}
      <group ref={groupRef}>
        {layers.map((layer, i) => (
            <group key={layer.index} position={[0, layer.yPos, 0]}>
                <TechLayer 
                   radiusTop={layer.radiusTop}
                   radiusBottom={layer.radiusBottom}
                   height={layer.height}
                   isGoldMode={isGoldMode}
                   showBottomCap={layer.index === 0}
                   layerComplete={assessment.isLayerComplete(i)}
                />
            </group>
        ))}
      </group>

      {/* Floating Container */}
      <group ref={containerRef} position={[0, 4.5, 0]} scale={[0.48, 0.48, 0.48]} visible={entityOpacity > 0}>
         <mesh>
            <boxGeometry args={[3, 3, 3]} />
            <meshBasicMaterial 
                ref={containerBoxMatRef}
                color={isGoldMode ? "#fbbf24" : "#a855f7"} 
                transparent 
                opacity={0}
                depthWrite={false} 
            />
         </mesh>

         <mesh>
            <boxGeometry args={[3, 3, 3]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            <Edges ref={containerEdgesRef} color="#ff6600" threshold={15} />
         </mesh>

         <mesh position={[0.08, -0.08, 0.08]}>
             <boxGeometry args={[3, 3, 3]} />
             <meshBasicMaterial transparent opacity={0} depthWrite={false} />
             <Edges ref={containerShadowHardRef} threshold={15} color="#b45309" />
         </mesh>

         <mesh position={[0.15, -0.15, 0.15]}>
             <boxGeometry args={[3, 3, 3]} />
             <meshBasicMaterial transparent opacity={0} depthWrite={false} />
             <Edges ref={containerShadowSoftRef} threshold={15} color="#fb923c" />
         </mesh>

         <mesh>
            <octahedronGeometry args={[2.5, 0]} />
            <meshBasicMaterial 
                ref={containerOctMatRef}
                color={isGoldMode ? "#fcd34d" : "#d8b4fe"} 
                wireframe 
                transparent 
                opacity={0}
            />
         </mesh>
         
         <HoloCore isGoldMode={isGoldMode} opacity={entityOpacity} />
      </group>

      {/* Assessment UI - Rendered as HTML overlay */}
      {entityOpacity > 0.5 && (
        <Html
          center
          distanceFactor={1}
          zIndexRange={[1000, 999]}
          portal={portalNode}
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: assessmentState !== ASSESSMENT_STATES.WAITING ? 'auto' : 'none'
          }}
        >
          {/* Intro Modal */}
          {assessmentState === ASSESSMENT_STATES.INTRO && (
            <AssessmentIntro 
              onStart={handleStartAssessment}
              onClose={() => setAssessmentState(ASSESSMENT_STATES.WAITING)}
              onNavigateToData={onNavigateToData}
            />
          )}

          {/* Questions Panel */}
          {assessmentState === ASSESSMENT_STATES.QUESTIONS && currentQuestion && (
            <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-3xl bg-[#0a0515]/95 border border-cyan-500/30 rounded-lg shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                <AssessmentQuestions
                  questions={currentQuestions}
                  currentSubject={currentSubject}
                  currentSubjectIndex={currentSubjectIndex}
                  currentQuestionIndex={currentQuestionIndex}
                  totalQuestions={assessment.totalQuestions}
                  answeredCount={answeredCount}
                  onSelectAnswer={handleAnswerSelect}
                  onGoBack={handleGoBack}
                  canGoBack={answeredCount > 0}
                />
              </div>
            </div>
          )}

          {/* Upload Screen */}
          {assessmentState === ASSESSMENT_STATES.UPLOAD && (
            <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-2xl bg-[#0a0515]/95 border border-purple-500/30 rounded-lg shadow-[0_0_40px_rgba(168,85,247,0.2)]">
                <AssessmentUpload
                  files={assessment.uploadedFiles}
                  onAddFile={assessment.addFile}
                  onRemoveFile={assessment.removeFile}
                  onContinue={handleContinueToResults}
                  onSkip={handleContinueToResults}
                />
              </div>
            </div>
          )}

          {/* Results View */}
          {assessmentState === ASSESSMENT_STATES.RESULTS && (
            <AssessmentResults 
              results={assessment.calculateResults}
              onClose={handleReset}
            />
          )}
        </Html>
      )}
    </group>
  );
};

export default HoloPyramidAssessment;
