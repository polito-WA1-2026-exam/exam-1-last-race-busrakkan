import { useState } from 'react';
import { createGame, startPlanning, submitRoute, getNetwork, getSegments } from '../api/api';

function useGame() {
  const [phase, setPhase] = useState('setup');
  const [game, setGame] = useState(null);
  const [network, setNetwork] = useState(null);
  const [segments, setSegments] = useState([]);
  const [selectedSegments, setSelectedSegments] = useState([]);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  const startNewGame = async () => {
    try {
      const net = await getNetwork();
      const gameData = await createGame();
      setGame(gameData);
      setNetwork(net);
      setSelectedSegments([]);
      setSteps([]);
      setCurrentStep(0);
      setPhase('setup');
    } catch (e) {
      console.error(e);
    }
  };

  const beginPlanningPhase = async () => {
    try {
      await startPlanning(game.id);
      const segs = await getSegments();
      setSegments(segs.segments);
      setPhase('planning');
    } catch (e) {
      console.error(e);
    }
  };

  const addSegment = (seg) => {
    setSelectedSegments(prev => {
      if (prev.find(s => s.id === seg.id)) return prev;
      return [...prev, seg];
    });
  };

  const removeSegment = (idx) => {
    setSelectedSegments(prev => prev.filter((_, i) => i !== idx));
  };

  const submitMyRoute = async () => {
    try {
      const ids = selectedSegments.map(s => s.id);
      const result = await submitRoute(game.id, ids);
      if (result.valid) {
        setSteps(result.steps);
        setPhase('execution');
      } else {
        setSteps([]);
        setPhase('result');
      }
    } catch (e) {
      console.error(e);
      setSteps([]);
      setPhase('result');
    }
  };

  const advanceStep = () => {
    setCurrentStep(prev => {
      if (prev + 1 >= steps.length) {
        setPhase('result');
        return prev;
      }
      return prev + 1;
    });
  };

  const reset = () => {
    setPhase('setup');
    setGame(null);
    setNetwork(null);
    setSegments([]);
    setSelectedSegments([]);
    setSteps([]);
    setCurrentStep(0);
  };

  // derived values. never stored, always computed from steps[]
  const displayedCoins = steps.length > 0 && currentStep < steps.length
    ? steps[currentStep].coinsAfter
    : (steps.length > 0 ? steps[steps.length - 1].coinsAfter : 20);

  const score = steps.length > 0 ? steps[steps.length - 1].coinsAfter : 0;

  return {
    phase, game, network, segments,
    selectedSegments, steps, currentStep,
    score, displayedCoins,
    startNewGame, beginPlanningPhase,
    addSegment, removeSegment,
    submitMyRoute, advanceStep, reset,
  };
}

export default useGame;