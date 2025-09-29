const SummaryResultList = ({ rankings, onScoreChange }) => {
    // Sort rankings in ascending order of cumulativeScore
    const sortedRankings = [...rankings].sort((a, b) => a.cumulativeScore - b.cumulativeScore);

    let currentRank = 0;
    let lastScore = null;
    let displayedRank = 1;

    const rankedList = sortedRankings.map((item, index) => {
        if (item.cumulativeScore !== lastScore) {
            currentRank = index + 1;
            displayedRank = currentRank;
        } else {
            displayedRank = currentRank;
        }

        lastScore = item.cumulativeScore;

        return {
            ...item,
            rank: displayedRank,
        };
    });

    return (
        <div className="space-y-4 mb-10">
            {/* Unified header for all screen sizes */}
            <ul className="grid grid-cols-3 items-center pb-3 border-b border-gray-300 font-semibold text-xs sm:text-base">
                <li className="text-left">Position</li>
                <li className="text-center">Serial number</li>
                <li className="text-right">Difference (cm)</li>
            </ul>
            {rankedList.map((item, idx) => (
                <li
                    key={item.skiId}
                    className="grid grid-cols-3 items-center py-2 border-b border-gray-100"
                >
                    <span className="text-left font-medium">{item.rank}</span>
                    <span className="text-center">{item.serialNumber}</span>
                    <span className="flex justify-end items-center gap-2">
                        <input
                            type="number"
                            value={item.cumulativeScore}
                            onChange={e => onScoreChange && onScoreChange(item.skiId, Number(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-400 rounded text-right"
                            min={0}
                        />
                        <span className="hidden text-xs md:block">cm</span>
                    </span>
                </li>
            ))}
        </div>
    );
};

export default SummaryResultList;
