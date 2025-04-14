'use client'
import React, { useEffect, useContext, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { useTranslation } from 'react-i18next';
import HelpModal from '@/components/HelpModal/HelpModal';
import { TournamentContext } from '@/context/TournamentContext';
import { RiDeleteBinLine, RiQuestionLine } from 'react-icons/ri';
import { VscGrabber } from 'react-icons/vsc';
import SkiMatchup from './components/SkiMatchup';
import Button from '@/components/common/Button';

const Testing = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    selectedSkis,
    currentRound,
    setCurrentRound,
    roundsHistory,
    setRoundsHistory,
    lossPath,
    setLossPath,
    matchScores,
    setMatchScores,
    roundNumber,
    setRoundNumber,
    potentialSwapTarget,
    setPotentialSwapTarget,
    isHelpOpen,
    toggleHelpModal,
    initializeTournament,
    decideTiebreaker,
    resetTournament
  } = useContext(TournamentContext);

  const [help] = useState([t('test_help1')]); // Array of help tips
  const totalRounds = Math.ceil(Math.log2(selectedSkis.length));

  // Handle drag updates for potential swap highlighting
  const onDragUpdate = (update) => {
    if (!update.destination) {
      setPotentialSwapTarget(null);
      return;
    }
    const sourceMatchId = parseInt(update.source.droppableId.split('-')[1]);
    const destinationMatchId = parseInt(update.destination.droppableId.split('-')[1]);
    if (sourceMatchId !== destinationMatchId) {
      const destinationMatch = currentRound.find(match => match.id === destinationMatchId);
      if (destinationMatch && destinationMatch.skis.length === 2) {
        setPotentialSwapTarget(destinationMatch.skis[update.destination.index]);
      } else {
        setPotentialSwapTarget(null);
      }
    } else {
      setPotentialSwapTarget(null);
    }
  };

  // Handle non-match drag events (reordering within a match or swapping between matches)
  const onDragEndNonMatch = (result) => {
    setPotentialSwapTarget(null);
    const { source, destination } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

    const sourceMatchId = parseInt(source.droppableId.split('-')[1]);
    const destinationMatchId = parseInt(destination.droppableId.split('-')[1]);

    const newCurrentRound = [...currentRound];
    const sourceMatch = newCurrentRound.find(match => match.id === sourceMatchId);
    const destinationMatch = newCurrentRound.find(match => match.id === destinationMatchId);

    const movedSkiPair = sourceMatch.skis.splice(source.index, 1)[0];
    const adjustedDestinationIndex = Math.min(destination.index, 1);

    if (sourceMatchId !== destinationMatchId) {
      if (destinationMatch.skis.length === 2) {
        const swappedSkiPair = destinationMatch.skis.splice(adjustedDestinationIndex, 1, movedSkiPair)[0];
        sourceMatch.skis.splice(source.index, 0, swappedSkiPair);

        const sourceMatchScores = { ...matchScores[sourceMatchId] };
        const destinationMatchScores = { ...matchScores[destinationMatchId] };

        sourceMatchScores[swappedSkiPair.id] = destinationMatchScores[swappedSkiPair.id];
        sourceMatchScores[movedSkiPair.id] = destinationMatchScores[movedSkiPair.id];

        destinationMatchScores[movedSkiPair.id] = matchScores[sourceMatchId][movedSkiPair.id];

        setMatchScores({
          ...matchScores,
          [sourceMatchId]: sourceMatchScores,
          [destinationMatchId]: destinationMatchScores,
        });
      } else {
        destinationMatch.skis.splice(adjustedDestinationIndex, 0, movedSkiPair);
        const newMatchScores = { ...matchScores };
        newMatchScores[destinationMatchId] = {
          ...newMatchScores[destinationMatchId],
          [movedSkiPair.id]: matchScores[sourceMatchId][movedSkiPair.id],
        };
        delete newMatchScores[sourceMatchId][movedSkiPair.id];
        setMatchScores(newMatchScores);
      }
    } else {
      sourceMatch.skis.splice(destination.index, 0, movedSkiPair);
    }
    setCurrentRound(newCurrentRound);
  };

  const handleTestReorder = (result) => {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) return;
    const reorderedRound = [...currentRound];
    const [movedTest] = reorderedRound.splice(source.index, 1);
    reorderedRound.splice(destination.index, 0, movedTest);
    setCurrentRound(reorderedRound);
  };

  const handleResetTest = () => {
    const confirmReset = window.confirm(t('reset_test_prompt'));
    if (confirmReset) {
      resetTournament();
      router.push('/skis');
    }
  };

  useEffect(() => {
    if (selectedSkis.length > 0 && currentRound.length === 0) {
      initializeTournament(selectedSkis);
    } else if (selectedSkis.length === 0) {
      router.push('/skis');
    }
  }, [selectedSkis, currentRound.length, initializeTournament, router]);

  const pairSkisForMatches = (skis) => {
    return skis.reduce((pairs, ski, index) => {
      if (index % 2 === 0) pairs.push({ id: index / 2, skis: [ski], winner: null });
      else pairs[pairs.length - 1].skis.push(ski);
      return pairs;
    }, []);
  };

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

  const handleSubmitRound = () => {
    for (const match of currentRound) {
      const matchScore = matchScores[match.id];
      const [ski1, ski2] = match.skis;
      if (ski2) {
        const ski1Score = matchScore[ski1.id];
        const ski2Score = matchScore[ski2.id];
        if (ski1Score > 0 && ski2Score > 0) {
          alert('Test ' + (match.id + 1) + ": " + t('test_with_no_0'));
          return;
        }
      }
    }

    let nextRoundSkis = [];
    let roundOutcomes = {};

    for (const match of currentRound) {
      const matchScore = matchScores[match.id];
      const [ski1, ski2] = match.skis;
      if (!ski2) {
        nextRoundSkis.push(ski1);
        continue;
      }
      let winner;
      if (matchScore[ski1.id] === matchScore[ski2.id]) {
        winner = decideTiebreaker(ski1, ski2);
        if (winner === null) return;
      } else {
        winner = matchScore[ski1.id] < matchScore[ski2.id] ? ski1 : ski2;
      }
      const loser = winner === ski1 ? ski2 : ski1;
      const scoreDiff = Math.abs(matchScore[ski1.id] - matchScore[ski2.id]);
      nextRoundSkis.push(winner);
      roundOutcomes[loser.id] = { lostTo: winner.id, scoreDiff };
    }

    setLossPath(prevPath => ({ ...prevPath, ...roundOutcomes }));
    prepareNextRound(nextRoundSkis);
  };

  const prepareNextRound = (nextRoundSkis) => {
    setRoundsHistory(prevHistory => [...prevHistory, { round: currentRound, scores: matchScores, roundNumber }]);
    if (nextRoundSkis.length === 1) {
      router.push('/testing/summary');
    } else {
      const pairedSkis = pairSkisForMatches(nextRoundSkis);
      setCurrentRound(pairedSkis);
      initializeScores(pairedSkis);
      setRoundNumber(roundNumber + 1);
    }
  };

  const goBackToPreviousRound = () => {
    const history = [...roundsHistory];
    if (history.length === 0) return;
    const previousRoundData = history[history.length - 1];
    setCurrentRound(previousRoundData.round);
    setMatchScores(previousRoundData.scores);
    setRoundNumber(previousRoundData.roundNumber);
    const newLossPath = { ...lossPath };
    previousRoundData.round.forEach(match => {
      match.skis.forEach(ski => {
        delete newLossPath[ski.id];
      });
    });
    setLossPath(newLossPath);
    setRoundsHistory(history.slice(0, -1));
  };

  return (
    <>
      <Head>
        <title>Ski-Lab: Testing</title>
        <meta name="description" content="Testing skis in a cup format" />
      </Head>
      <DragDropContext
        onDragUpdate={onDragUpdate}
        onDragEnd={(result) => {
          if (result.type === 'match') handleTestReorder(result);
          else onDragEndNonMatch(result);
        }}
      >
        <div className="py-4 px-2">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-semibold">
              {t('round')} {roundNumber}/{totalRounds}
            </h2>
            <div className='space-x-2'>
              <Button
                type="button"
                variant='primary'
                onClick={toggleHelpModal}
              >
                <RiQuestionLine />
              </Button>

              <Button
                type="button"
                variant='danger'
                onClick={handleResetTest}
              >
                <RiDeleteBinLine />
              </Button>
            </div>

          </div>
          {currentRound.length > 0 && (
            <Droppable droppableId="round" type="match">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {currentRound.map((match, index) => (
                    <Draggable key={match.id} draggableId={`match-${match.id}`} index={index}>
                      {(provided, draggableSnapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-container shadow rounded ${draggableSnapshot.isDragging ? 'shadow-lg' : ''}`}
                        >
                          <SkiMatchup
                            key={match.id}
                            match={match}
                            scores={matchScores[match.id] || {}}
                            potentialSwapTarget={potentialSwapTarget}
                            onScoreChange={(skiId, score) =>
                              setMatchScores((prev) => ({
                                ...prev,
                                [match.id]: { ...prev[match.id], [skiId]: score },
                              }))
                            }
                          />
                          <VscGrabber size={25} className="flex w-full justify-self-center bg-sbtn rounded" />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
          <div className="flex items-end justify-between my-4">
            {roundNumber > 1 && (
              <Button
                variant='secondary'
                onClick={goBackToPreviousRound}
              >
                {t('go_back')}
              </Button>
            )}
            <div className="flex items-center space-x-2">
              <Button
                variant='primary'
                onClick={handleSubmitRound}
              >
                {t('submit_round')}
              </Button>
            </div>
          </div>
        </div>
        <HelpModal isOpen={isHelpOpen} onClose={toggleHelpModal} help={help} />
      </DragDropContext>
    </>
  );
};

export default Testing;
