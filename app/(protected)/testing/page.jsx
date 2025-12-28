'use client'
import React, { useEffect, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import TestingHelpModal from '@/app/(protected)/testing/components/TestingHelpModal';
import { TournamentContext } from '@/context/TournamentContext';
import { RiQuestionLine, RiDragMove2Line } from 'react-icons/ri';
import { MdDelete } from "react-icons/md";
import { IoMdAlert } from "react-icons/io";

import Button from '@/components/ui/Button';
import { SiTestrail } from "react-icons/si";
import Input from '@/components/ui/Input';
import useIsStandalone from '@/hooks/useIsStandalone';
import PageHeader from '@/components/layout/PageHeader';

const Testing = () => {
  const isStandalone = useIsStandalone();
  const router = useRouter();
  const {
    selectedSkis,
    currentRound,
    setCurrentRound,
    roundsHistory,
    setRoundsHistory,
    lossPath,
    setLossPath,
    roundNumber,
    setRoundNumber,
    isHelpOpen,
    toggleHelpModal,
    initializeTournament,
    resetTournament,
    currentDuelResults,
    setCurrentDuelResults,
    restoreRoundFromHistory,
    setRoundState,
    futureRounds,
    setFutureRounds
  } = useContext(TournamentContext);

  const totalRounds = Math.ceil(Math.log2(selectedSkis.length));
  const [isDragging, setIsDragging] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [dragTarget, setDragTarget] = useState(null); // { matchIndex, skiIndex }
  const [dragSource, setDragSource] = useState(null); // { matchIndex, skiIndex }
  const [draggedMatchIndex, setDraggedMatchIndex] = useState(null);

  useEffect(() => {
    if (shouldRedirect && currentRound.length === 1) {
      router.push('/testing/summary');
      setShouldRedirect(false);
    }
  }, [shouldRedirect, currentRound, router]);

  useEffect(() => {
    if (selectedSkis.length > 0 && currentRound.length === 0) {
      initializeTournament(selectedSkis);
    } else if (selectedSkis.length === 0) {
      router.push('/skis');
    }
  }, [selectedSkis, currentRound.length, initializeTournament, router]);

  const handleDragStart = (start) => {
    setIsDragging(true);
    if (start.type === 'MATCH') {
      setDraggedMatchIndex(start.source.index);
    }
    setDragSource({
      matchIndex: parseInt(start.source.droppableId),
      skiIndex: start.source.index
    });
  };

  const handleDragUpdate = (update) => {
    if (!update.destination) return;

    setDragTarget({
      matchIndex: parseInt(update.destination.droppableId),
      skiIndex: update.destination.index
    });
  };

  // Fix 1: Modify handleDragEnd to preserve duel results
  const handleDragEnd = (result) => {
    setIsDragging(false);
    setDragTarget(null);
    setDragSource(null);
    setDraggedMatchIndex(null); // Reset after drag end

    const { source, destination, type } = result;
    if (!destination) return;

    if (type === 'MATCH') {
      const reordered = Array.from(currentRound);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);

      // Preserve duel results when reordering matches
      setCurrentRound(reordered);
      return;
    }

    const sMatchIdx = +source.droppableId;
    const dMatchIdx = +destination.droppableId;
    const sSkiIdx = source.index;
    const dSkiIdx = destination.index;

    if (sMatchIdx === dMatchIdx && sSkiIdx === dSkiIdx) return;

    const newRound = [...currentRound];
    const sourceMatch = { ...newRound[sMatchIdx] };
    const destMatch = { ...newRound[dMatchIdx] };

    const [dragged] = sourceMatch.skis.splice(sSkiIdx, 1);

    if (destMatch.skis[dSkiIdx]) {
      // Swap skis - preserve duel results
      const replaced = destMatch.skis.splice(dSkiIdx, 1, dragged)[0];
      sourceMatch.skis.splice(sSkiIdx, 0, replaced);
    } else {
      // Move to empty slot - preserve duel results
      destMatch.skis.splice(dSkiIdx, 0, dragged);
    }

    newRound[sMatchIdx] = sourceMatch;
    newRound[dMatchIdx] = destMatch;

    // Fix 2: Only reset duel results if both matches have changed composition
    const shouldResetResults = (match) => {
      const original = currentRound.find(m => m.id === match.id);
      if (!original) return true;

      // Compare ski IDs in the match
      const originalIds = original.skis.map(s => s.id).sort();
      const newIds = match.skis.map(s => s.id).sort();

      return JSON.stringify(originalIds) !== JSON.stringify(newIds);
    };

    setCurrentDuelResults(prev => {
      const updated = { ...prev };

      if (shouldResetResults(sourceMatch)) {
        delete updated[sourceMatch.id];
      }

      if (shouldResetResults(destMatch)) {
        delete updated[destMatch.id];
      }

      return updated;
    });

    setCurrentRound(newRound);
  };

  const handleWinnerClick = (matchId, winnerId) => {
    setCurrentDuelResults(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        winnerId,
        diff: prev[matchId]?.diff || 0
      }
    }));
  };

  const handleDiffChange = (matchId, value) => {
    const diff = Math.max(0, parseInt(value, 10) || 0);
    setCurrentDuelResults(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], diff }
    }));
  };

  const handleSubmitRound = () => {
    const results = { ...currentDuelResults };

    for (const match of currentRound) {
      const duel = results[match.id];
      if (!duel || duel.winnerId == null) {
        alert('Please complete all duels before submitting.');
        return;
      }
      if (duel.diff == null) duel.diff = 0;
    }

    let nextSkis = [];
    let newOutcomes = {};

    for (const match of currentRound) {
      const [s1, s2] = match.skis;
      const duel = results[match.id];

      if (!s2) {
        nextSkis.push(s1);
        continue;
      }

      const winner = duel.winnerId === s1.id ? s1 : s2;
      const loser = winner === s1 ? s2 : s1;

      nextSkis.push(winner);
      newOutcomes[loser.id] = { lostTo: winner.id, scoreDiff: duel.diff };
    }

    setLossPath(prev => ({ ...prev, ...newOutcomes }));

    // Save round state to history
    setRoundsHistory(prev => [
      ...prev,
      {
        round: currentRound,
        duelResults: { ...currentDuelResults },
        roundNumber
      }
    ]);

    if (nextSkis.length === 1) {
      // Tournament complete - prepare for summary
      setShouldRedirect(true);
    } else {
      const nextRoundNum = roundNumber + 1;
      
      // Look for matching future round
      const matchingFuture = futureRounds.find(fr => {
        // Check if round number matches
        if (fr.roundNumber !== nextRoundNum) return false;
        
        // Check if ski IDs match
        const futureSkiIds = fr.round.flatMap(match => match.skis.map(ski => ski.id)).sort();
        const nextSkiIds = nextSkis.map(ski => ski.id).sort();
        
        return JSON.stringify(futureSkiIds) === JSON.stringify(nextSkiIds);
      });

      if (matchingFuture) {
        // Restore from future rounds
        setRoundState(
          matchingFuture.round,
          matchingFuture.roundNumber,
          matchingFuture.duelResults
        );
        
        // Remove from future rounds
        setFutureRounds(prev => prev.filter(fr => fr !== matchingFuture));
      } else {
        // Create new round
        const newPairs = nextSkis.reduce((acc, ski, idx) => {
          if (idx % 2 === 0) acc.push({ id: idx / 2, skis: [ski] });
          else acc[acc.length - 1].skis.push(ski);
          return acc;
        }, []);

        // Save state for next round before resetting
        setRoundState(newPairs, nextRoundNum, {});
        setRoundNumber(nextRoundNum);
      }
    }
  };

  const goBack = () => {
    if (roundsHistory.length === 0) return;
    restoreRoundFromHistory();
  };

  const completed = currentRound.filter(
    m => currentDuelResults[m.id]?.winnerId != null
  ).length;

  const total = currentRound.length;

  // Track which skis should display full serial (fix for Hooks-in-loop)
  const [fullSerialIds, setFullSerialIds] = useState(new Set());
  const toggleSerialDigits = (id) => {
    setFullSerialIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={`min-h-screen p-4`}>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          icon={<SiTestrail className="text-blue-600 text-2xl" />}
          title="Testing"
          subtitle={`Round ${roundNumber} of ${totalRounds}`}
          actions={
            <div className="flex gap-2">
              <Button 
              variant='secondary' 
              onClick={toggleHelpModal} 
              title="Help"
              className='flex items-center'>
                
                <RiQuestionLine className='mr-1'/> Show Info
              </Button>
              <Button
                variant='danger'
                onClick={() => window.confirm('Reset tournament?') && (resetTournament(), router.push('/skis'))}
                title="Reset"
                className='flex items-center'
              >
                <MdDelete className='mr-1'/> Reset Test
              </Button>
            </div>
          }
        />

        {/* Brackets */}
        <DragDropContext
          onDragStart={handleDragStart}
          onDragUpdate={handleDragUpdate}
          onDragEnd={handleDragEnd}
        >
          <Droppable droppableId="matches" type="MATCH">
            {(matchProv) => (
              <div {...matchProv.droppableProps} ref={matchProv.innerRef} className="space-y-4 mb-20">
                {currentRound.map((match, mi) => {
                  const res = currentDuelResults[match.id] || {};
                  const isDone = res.winnerId != null;

                  // Check if this match is being dragged
                  const isMatchBeingDragged = draggedMatchIndex === mi;

                  // Find if this is the drop target (where the dragged match would be dropped)
                  const isMatchDropTarget =
                    isDragging &&
                    draggedMatchIndex !== null &&
                    dragTarget &&
                    dragTarget.matchIndex === mi &&
                    dragSource &&
                    dragSource.matchIndex !== mi;

                  return (
                    <Draggable key={match.id} draggableId={`match-${match.id}`} index={mi}>
                      {(mProv, mSnapshot) => (
                        <div
                          ref={mProv.innerRef}
                          {...mProv.draggableProps}
                          className={`bg-white shadow rounded-2xl p-4 transition
                            ${isDone ? '' : 'border-gray-300 bg-white'}
                            ${isMatchBeingDragged ? 'ring-2 ring-blue-400 opacity-80' : ''}
                            ${isMatchDropTarget ? 'ring-2 ring-green-400 bg-green-50' : ''}
                          `}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center space-x-2">
                              <span {...mProv.dragHandleProps} className="cursor-move text-gray-600 ">
                                <RiDragMove2Line size={20}/>
                              </span>
                              <span className="font-medium text-gray-700">Duel {mi + 1}</span>
                            </div>
                            {isDone && <span className="text-blue-600 text-sm font-medium">Completed</span>}
                          </div>

                          <Droppable droppableId={`${mi}`} type="SKI">
                            {(prov) => (
                              <div {...prov.droppableProps} ref={prov.innerRef} className="space-y-2 py-1">
                                {match.skis.map((ski, si) => {
                                  const isWinner = res.winnerId === ski.id;

                                  // Highlight ski being dragged over
                                  const isDragTarget = dragTarget?.matchIndex === mi && dragTarget?.skiIndex === si;

                                  // Highlight ski being dragged
                                  const isDragSource = dragSource?.matchIndex === mi && dragSource?.skiIndex === si;

                                  // REPLACE local useState with derived flag from parent state
                                  const showFullSerial = fullSerialIds.has(ski.id);
                                  const serialDisplay = showFullSerial
                                    ? ski.serialNumber
                                    : String(ski.serialNumber).slice(-3).padStart(3, '0');
                                  const hasMoreDigits = String(ski.serialNumber).length > 3;

                                  return (
                                    <Draggable key={ski.id} draggableId={`ski-${match.id}-${ski.id}`} index={si}>
                                      {(provided) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={`p-2 rounded-md flex justify-between items-center transition ${
                                            isWinner ? 'bg-blue-100' : 'bg-gray-50'
                                          }`}
                                        >
                                          <div
                                            className="flex items-center flex-grow cursor-pointer"
                                            onClick={() => handleWinnerClick(match.id, ski.id)}
                                          >
                                            <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                                              <span className="font-medium text-gray-700">{si + 1}</span>
                                            </div>
                                            <span
                                              className="font-medium cursor-pointer"
                                              title={showFullSerial ? "Show last 3 digits" : "Show full serial number"}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSerialDigits(ski.id);
                                              }}
                                            >
                                              {serialDisplay}
                                              {hasMoreDigits && !showFullSerial && <span className="text-gray-400 ml-1">...</span>}
                                            </span>
                                          </div>
                                          {isWinner && <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-xl text-xs">Winner</span>}
                                        </div>
                                      )}
                                    </Draggable>
                                  );
                                })}
                                {prov.placeholder}
                              </div>
                            )}
                          </Droppable>

                          {match.skis.length === 1 && (
                            <div className="flex items-center justify-center mt-3 text-center py-2 bg-yellow-50 text-yellow-700 italic"><IoMdAlert className="mr-1"/>  Automatically advances, simulate two test runs before proceeding.</div>
                          )}

                          {match.skis.length === 2 && isDone && (
                            <div className=" mt-3 flex justify-center">
                              <div className="relative text-sm text-gray-700">
                                Difference:
                                <Input
                                  className="text-center"
                                  type="number"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={res.diff ?? 0} onChange={e => handleDiffChange(match.id, e.target.value)} />
                                <span className="absolute right-1 bottom-0">cm</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {matchProv.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Footer actions */}
        <div className={`fixed bg-slate-100 z-10 w-full p-4 left-0 bottom-13 md:bottom-0 border-t border-gray-300 shadow flex justify-center space-x-4 ${isStandalone ? 'mb-6' : ''}`}>
          <Button variant="secondary" onClick={goBack} disabled={roundsHistory.length === 0}>
            ← Previous Round
          </Button>
          <Button variant="primary" onClick={handleSubmitRound} disabled={completed !== total}>
            Next Round →
          </Button>
        </div>

        <TestingHelpModal
          isOpen={isHelpOpen}
          onClose={toggleHelpModal}
          help={[
            'Drag skis between duels to swap positions',
            'Drag the grip icon to reorder entire duels',
            'Click a ski to select winner; enter diff or leave at 0',
            'Finish all duels before submitting the round'
          ]}
        />
      </div>
    </div>
  );
};

export default Testing;