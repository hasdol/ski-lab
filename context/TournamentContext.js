'use client';
import React, { createContext, useState, useEffect } from 'react';

export const TournamentContext = createContext();

export const TournamentProvider = ({ children }) => {
  // ------------------------------
  // State
  // ------------------------------
  const [selectedSkis, setSelectedSkis] = useState([]);
  const [currentRound, setCurrentRound] = useState([]);
  const [roundsHistory, setRoundsHistory] = useState([]);
  const [lossPath, setLossPath] = useState({});
  const [matchScores, setMatchScores] = useState({});
  const [skiSerialNumbers, setSkiSerialNumbers] = useState({});
  const [roundNumber, setRoundNumber] = useState(1);
  const [potentialSwapTarget, setPotentialSwapTarget] = useState(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // If we have some data in progress, consider the tournament active
  const isTournamentInProgress =
    selectedSkis.length > 0 || currentRound.length > 0;

  // -----------------------------------------
  // 1) Load from localStorage on mount
  // -----------------------------------------
  useEffect(() => {
    // Make sure we're in the browser (Next.js SSR check)
    if (typeof window === 'undefined') return;
    const storedData = localStorage.getItem('tournamentState');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);

        // Restore everything you saved:
        if (parsed.selectedSkis) setSelectedSkis(parsed.selectedSkis);
        if (parsed.currentRound) setCurrentRound(parsed.currentRound);
        if (parsed.roundsHistory) setRoundsHistory(parsed.roundsHistory);
        if (parsed.lossPath) setLossPath(parsed.lossPath);
        if (parsed.matchScores) setMatchScores(parsed.matchScores);
        if (parsed.skiSerialNumbers) setSkiSerialNumbers(parsed.skiSerialNumbers);
        if (parsed.roundNumber) setRoundNumber(parsed.roundNumber);
        if (parsed.potentialSwapTarget) setPotentialSwapTarget(parsed.potentialSwapTarget);
        if (typeof parsed.isHelpOpen === 'boolean') setIsHelpOpen(parsed.isHelpOpen);
      } catch (err) {
        console.error('Error parsing localStorage data:', err);
      }
    }
  }, []);

  // -----------------------------------------
  // 2) Save to localStorage whenever state changes
  // -----------------------------------------
  useEffect(() => {
    // If the tournament has been reset (no data), remove the key
    if (!isTournamentInProgress) {
      localStorage.removeItem('tournamentState');
      return;
    }

    // Otherwise, store the current state
    const dataToStore = {
      selectedSkis,
      currentRound,
      roundsHistory,
      lossPath,
      matchScores,
      skiSerialNumbers,
      roundNumber,
      potentialSwapTarget,
      isHelpOpen,
    };

    try {
      localStorage.setItem('tournamentState', JSON.stringify(dataToStore));
    } catch (err) {
      console.error('Error saving tournament state to localStorage:', err);
    }
  }, [
    selectedSkis,
    currentRound,
    roundsHistory,
    lossPath,
    matchScores,
    skiSerialNumbers,
    roundNumber,
    potentialSwapTarget,
    isHelpOpen,
    isTournamentInProgress,
  ]);

  // ------------------------------
  // Toggle Help Modal
  // ------------------------------
  const toggleHelpModal = () => {
    setIsHelpOpen((prev) => !prev);
  };

  // ------------------------------
  // Reset Tournament
  // ------------------------------
  const resetTournament = () => {
    setSelectedSkis([]);
    setCurrentRound([]);
    setRoundsHistory([]);
    setLossPath({});
    setMatchScores({});
    setSkiSerialNumbers({});
    setRoundNumber(1);
    setPotentialSwapTarget(null);
    setIsHelpOpen(false);

    // Make sure localStorage also clears so we don't reload stale data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tournamentState');
    }
  };

  // ------------------------------
  // Helper: Pair Skis for Matches
  // ------------------------------
  const pairSkisForMatches = (skis) => {
    return skis.reduce((pairs, ski, index) => {
      if (index % 2 === 0)
        pairs.push({ id: Math.floor(index / 2), skis: [ski], winner: null });
      else pairs[pairs.length - 1].skis.push(ski);
      return pairs;
    }, []);
  };

  // ------------------------------
  // Helper: Initialize Scores
  // ------------------------------
  const initializeScores = (pairedSkis) => {
    const initialScores = pairedSkis.reduce((scores, match) => {
      scores[match.id] = match.skis.reduce((ms, ski) => {
        ms[ski.id] = 0;
        return ms;
      }, {});
      return scores;
    }, {});
    setMatchScores(initialScores);
    setRoundNumber(1);
  };

  // ------------------------------
  // Helper: Map Serial Numbers
  // ------------------------------
  const mapSerialNumbers = (skis) => {
    const serialNumbers = skis.reduce((nums, ski) => {
      nums[ski.id] = ski.serialNumber;
      return nums;
    }, {});
    setSkiSerialNumbers(serialNumbers);
  };

  // ------------------------------
  // Initialize Tournament
  // ------------------------------
  const initializeTournament = (skis) => {
    if (skis.length === 0) return;
    const pairs = pairSkisForMatches(skis);
    setCurrentRound(pairs);
    initializeScores(pairs);
    mapSerialNumbers(skis);
  };

  // ------------------------------
  // Calculate Cumulative Score
  // ------------------------------
  const calculateCumulativeScore = (skiId, visited = new Set()) => {
    // No recorded loss => no more "scoreDiff" to add
    if (!lossPath[skiId] || visited.has(skiId)) return 0;

    visited.add(skiId);

    const { lostTo, scoreDiff } = lossPath[skiId];
    return scoreDiff + calculateCumulativeScore(lostTo, visited);
  };

  // ------------------------------
  // Calculate Rankings
  // ------------------------------
  const calculateRankings = () => {
    return selectedSkis
      .map((ski) => ({
        serialNumber: skiSerialNumbers[ski.id],
        cumulativeScore: calculateCumulativeScore(ski.id),
        skiId: ski.id,
      }))
      .sort((a, b) => a.cumulativeScore - b.cumulativeScore);
  };

  // ------------------------------
  // Decide Tiebreaker
  // ------------------------------
  const decideTiebreaker = (ski1, ski2) => {
    let winner;
    while (true) {
      winner = prompt(
        `Decide tiebreaker: ${ski1.serialNumber} or ${ski2.serialNumber}`
      );

      if (winner === null) {
        // Prompt was cancelled
        return null; // Return null to indicate cancellation
      } else if (winner === ski1.serialNumber) {
        return ski1;
      } else if (winner === ski2.serialNumber) {
        return ski2;
      } else {
        alert('Invalid input. Please enter a valid serial number.');
      }
    }
  };

  // ------------------------------
  // Return Provider
  // ------------------------------
  return (
    <TournamentContext.Provider
      value={{
        selectedSkis,
        setSelectedSkis,
        currentRound,
        setCurrentRound,
        roundsHistory,
        setRoundsHistory,
        lossPath,
        setLossPath,
        matchScores,
        setMatchScores,
        skiSerialNumbers,
        setSkiSerialNumbers,
        roundNumber,
        setRoundNumber,
        potentialSwapTarget,
        setPotentialSwapTarget,
        isHelpOpen,
        toggleHelpModal,
        initializeTournament,
        calculateCumulativeScore,
        calculateRankings,
        decideTiebreaker,
        resetTournament,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};
