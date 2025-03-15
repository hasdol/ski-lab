// context/TournamentContext.js
import React, { createContext, useState, useEffect } from 'react';

export const TournamentContext = createContext();

export const TournamentProvider = ({ children }) => {
    // Tournament Initialization
    const [selectedSkis, setSelectedSkis] = useState([]);
    const [currentRound, setCurrentRound] = useState([]);
    const [roundsHistory, setRoundsHistory] = useState([]);
    const [lossPath, setLossPath] = useState({});
    const [matchScores, setMatchScores] = useState({});
    const [skiSerialNumbers, setSkiSerialNumbers] = useState({});
    const [roundNumber, setRoundNumber] = useState(1);
    const [potentialSwapTarget, setPotentialSwapTarget] = useState(null);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    const isTournamentInProgress = selectedSkis.length > 0 || currentRound.length > 0;

        // beforeunload event handler
        useEffect(() => {
            const handleBeforeUnload = (e) => {
                if (isTournamentInProgress) {
                    e.preventDefault();
                    // Chrome requires returnValue to be set
                    e.returnValue = '';
                }
            };
    
            window.addEventListener('beforeunload', handleBeforeUnload);
    
            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            };
        }, [isTournamentInProgress]);


    // Toggle Help Modal
    const toggleHelpModal = () => {
        setIsHelpOpen(!isHelpOpen);
    };

    // Reset Tournament
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
    };

    // Pair Skis for Matches
    const pairSkisForMatches = (skis) => {
        return skis.reduce((pairs, ski, index) => {
            if (index % 2 === 0) pairs.push({ id: index / 2, skis: [ski], winner: null });
            else pairs[pairs.length - 1].skis.push(ski);
            return pairs;
        }, []);
    };

    // Initialize Scores
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

    // Map Serial Numbers
    const mapSerialNumbers = (skis) => {
        const serialNumbers = skis.reduce((nums, ski) => {
            nums[ski.id] = ski.serialNumber;
            return nums;
        }, {});
        setSkiSerialNumbers(serialNumbers);
    };

    // Initialize Tournament
    const initializeTournament = (skis) => {
        if (skis.length === 0) return; // Prevent initializing with no skis
        const pairs = pairSkisForMatches(skis);
        setCurrentRound(pairs);
        initializeScores(pairs);
        mapSerialNumbers(skis);
    };

    // Calculate Cumulative Score
    const calculateCumulativeScore = (skiId, visited = new Set()) => {
        if (!lossPath[skiId] || visited.has(skiId)) return 0;
        visited.add(skiId);

        const { lostTo, scoreDiff } = lossPath[skiId];
        return scoreDiff + calculateCumulativeScore(lostTo, visited);
    };

    // Calculate Rankings
    const calculateRankings = () => {
        return selectedSkis.map(ski => ({
            serialNumber: skiSerialNumbers[ski.id],
            cumulativeScore: calculateCumulativeScore(ski.id),
            skiId: ski.id
        }))
            .sort((a, b) => a.cumulativeScore - b.cumulativeScore);
    };

    // Decide Tiebreaker
    const decideTiebreaker = (ski1, ski2) => {
        let winner;
        while (true) {
            winner = prompt("Decide tiebreaker: " + ski1.serialNumber + " or " + ski2.serialNumber);

            if (winner === null) {
                // Prompt was cancelled
                return null; // Return null to indicate cancellation
            } else if (winner === ski1.serialNumber) {
                return ski1;
            } else if (winner === ski2.serialNumber) {
                return ski2;
            } else {
                alert("Invalid input. Please enter a valid serial number.");
            }
        }
    };

    return (
        <TournamentContext.Provider value={{
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
            resetTournament, // Add resetTournament to context
        }}>
            {children}
        </TournamentContext.Provider>
    );
};