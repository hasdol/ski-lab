import React, { useEffect, useState } from 'react';

const TourOverlay = ({
  isVisible,
  targetRef,
  message,
  onNext,
  onClose,
}) => {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!isVisible) {
      setRect(null);
      return;
    }
    if (targetRef && targetRef.current) {
      const boundingRect = targetRef.current.getBoundingClientRect();
      setRect(boundingRect);
    } else {
      // No targetRef provided: leave rect as null.
      setRect(null);
    }
  }, [isVisible, targetRef]);

  if (!isVisible) return null;

  // If no targetRef is provided (or targetRef.current is null), show a centered welcome popup.
  if (!targetRef || !targetRef.current) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 pointer-events-auto animate-fade">
        <div className="bg-container rounded p-4 shadow pointer-events-auto z-[10000] mx-5">
          <div className="mb-2">{message}</div>
          <div className="flex gap-2 justify-center">
            {onNext && (
              <button
                className="bg-btn text-btntxt px-3 py-1 rounded hover:opacity-90"
                onClick={onNext}
              >
                Next
              </button>
            )}
            <button
              className="bg-sbtn px-3 py-1 rounded"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, we have a target element and its bounding rectangle.
  if (!rect) return null;
  const { top, left, width, height } = rect;
  const holePadding = 8;

  // Overlays to block clicks outside the target
  const topOverlayStyle = {
    top: 0,
    left: 0,
    width: '100vw',
    height: `${Math.max(0, top - holePadding)}px`,
  };

  const bottomOverlayStyle = {
    top: `${top + height + holePadding}px`,
    left: 0,
    width: '100vw',
    height: `calc(100vh - ${top + height + holePadding}px)`,
  };

  const leftOverlayStyle = {
    top: `${top - holePadding}px`,
    left: 0,
    width: `${Math.max(0, left - holePadding)}px`,
    height: `${height + 2 * holePadding}px`,
  };

  const rightOverlayStyle = {
    top: `${top - holePadding}px`,
    left: `${left + width + holePadding}px`,
    width: `calc(100vw - ${left + width + holePadding}px)`,
    height: `${height + 2 * holePadding}px`,
  };

  // Start with the default tooltip position.
  const computedTooltipWidth = width + 200;
  let tooltipLeft = left;
  let tooltipTop = top + height + 12;

  // Adjust horizontal position if tooltip would overflow the viewport.
  if (typeof window !== 'undefined') {
    const screenWidth = window.innerWidth;
    if (tooltipLeft + computedTooltipWidth > screenWidth) {
      tooltipLeft = screenWidth - computedTooltipWidth - 10; // 10px margin from right
      if (tooltipLeft < 10) tooltipLeft = 10; // ensure at least 10px margin from left
    }
  }

  // Assume a tooltip height (or measure if needed)
  const assumedTooltipHeight = 100; // adjust as necessary
  if (typeof window !== 'undefined') {
    const screenHeight = window.innerHeight;
    if (tooltipTop + assumedTooltipHeight > screenHeight) {
      // If not enough space below, place above the target
      tooltipTop = top - assumedTooltipHeight - 12;
      if (tooltipTop < 10) tooltipTop = 10; // 10px margin from top
    }
  }

  const tooltipStyle = {
    top: tooltipTop,
    left: tooltipLeft,
    width: computedTooltipWidth,
    zIndex: 10002,
  };

  return (
    <div className="fixed bg-black/60 z-[9999] pointer-events-auto animate-fade animate-duration-300">
      {/* Overlays */}
      <div style={topOverlayStyle} className="fixed bg-black/60 z-[9999] pointer-events-auto" />
      <div style={bottomOverlayStyle} className="fixed bg-black/60 z-[9999] pointer-events-auto" />
      <div style={leftOverlayStyle} className="fixed bg-black/60 z-[9999] pointer-events-auto" />
      <div style={rightOverlayStyle} className="fixed bg-black/60 z-[9999] pointer-events-auto" />

      {/* Tooltip / Popup */}
      <div style={tooltipStyle} className="fixed bg-white rounded p-4 shadow pointer-events-auto z-[10000]">
        <div className="mb-2">{message}</div>
        <div className="flex gap-2">
          {onNext && (
            <button
              className="bg-btn text-btntxt px-3 py-1 rounded hover:opacity-90"
              onClick={onNext}
            >
              Next
            </button>
          )}
          <button
            className="bg-sbtn px-3 py-1 rounded"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TourOverlay;
