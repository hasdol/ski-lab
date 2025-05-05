'use client'
import React, { useContext } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { MdDragIndicator, MdOutlineClose } from 'react-icons/md';
import { UserPreferencesContext } from '@/context/UserPreferencesContext';
import Input from '@/components/common/Input';

const SkiMatchup = ({ match, scores, onScoreChange, potentialSwapTarget }) => {
  const { gloveMode } = useContext(UserPreferencesContext);

  const handleScoreChange = (skiId, e) => {
    let score;
    if (e.target.value === '') {
      score = 0;
    } else {
      score = parseInt(e.target.value, 10) || 0;
    }
    onScoreChange(skiId, score);
  };

  const handleFocus = (skiId, e) => {
    if (e.target.value === '0') {
      onScoreChange(skiId, '');
    }
  };

  const handleBlur = (skiId, e) => {
    if (e.target.value === '') {
      onScoreChange(skiId, 0);
    }
  };

  return (
    <Droppable droppableId={`match-${match.id}`}>
      {(provided) => (
        <div 
          {...provided.droppableProps} 
          ref={provided.innerRef} 
          className="match-white mt-5 w-full"
        >
          {match.skis.map((ski, index) => (
            <Draggable key={ski.id} draggableId={`ski-${match.id}-${ski.id}`} index={index}>
              {(provided, draggableSnapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className={`bg-white cursor-move relative py-2 px-4 rounded-md flex justify-between items-center 
                    ${draggableSnapshot.isDragging ? 'border shadow' : ''} 
                    ${scores[ski.id] > 0 ? 'bg-sbtn opacity-50' : ''} 
                    ${ski.id === potentialSwapTarget?.id ? 'bg-sbtn' : ''} 
                    ${gloveMode ? 'text-xl' : ''}`}
                >
                  <span className="w-1/3">{ski.serialNumber}</span>
                  {ski.id === potentialSwapTarget?.id ? (
                    <p className="w-1/3 text-center">Get swapped!</p>
                  ) : (
                    <Input
                      type="number"
                      name={`score-${ski.id}`}
                      value={scores[ski.id] ?? 0}
                      onChange={(e) => handleScoreChange(ski.id, e)}
                      onFocus={(e) => handleFocus(ski.id, e)}
                      onBlur={(e) => handleBlur(ski.id, e)}
                      min="0"
                      className="text-center"
                    />
                  )}
                  <div className="flex items-center justify-end space-x-2 w-1/3">
                    <div>
                      {scores[ski.id] > 0 ? <MdOutlineClose className="text-red-500" /> : ""}
                    </div>
                    <div>
                      <MdDragIndicator size={20} />
                    </div>
                  </div>
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default SkiMatchup;
