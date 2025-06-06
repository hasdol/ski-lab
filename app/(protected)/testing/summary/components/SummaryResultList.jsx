const SummaryResultList = ({ rankings }) => {
    // Sort rankings in descending order of cumulativeScore
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
            {/* Top Three Section */}
            <ul className={`grid grid-cols-3 items-center justify-between pb-3 border-b border-gray-300 font-semibold`}>
                <li className="text-left">Position</li>
                <li className="text-center">Serial number</li>
                <li className="text-right">Difference</li>
            </ul>
            <ul className="space-y-4 ">
                {rankedList.map((item, index) => (
                    <li
                        key={item.serialNumber}
                        className={`grid grid-cols-3 items-center justify-between bg-gray-50 text-black rounded-md p-3 px-4
                           `}                    >
                        <div className="flex-1 text-left">P{item.rank}</div>
                        <div className="flex-1 text-center">{item.serialNumber} </div>
                        <div className={`flex-1 text-right `}>{item.cumulativeScore} <span className="text-xs">cm</span></div>
                            
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SummaryResultList;
