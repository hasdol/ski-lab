const ResultsList = ({ rankings }) => {
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
            <ul className="space-y-3">
                {rankedList.slice(0, 1).map((item, index) => (

                    <li
                        key={item.serialNumber}
                        className={`flex items-center justify-between bg-gray-100 text-black rounded-md p-3 px-4
                            }`}                    >
                        <div className="flex-1 text-left">P{item.rank}</div>
                        <div className="flex-1 text-center">{item.serialNumber} </div>
                        <div className="flex-1 text-right">Diff: {item.cumulativeScore}</div>
                    </li>
                ))}
            </ul>

            {/* Remaining Rankings */}
            <ul className="space-y-3">
                {rankedList.slice(1).map((item) => (
                    <li
                        key={item.serialNumber}
                        className="flex items-center justify-between bg-gray-100 rounded-md p-3 px-4"
                    >
                        <span className="flex-1 text-left">P{item.rank}</span>
                        <span className="flex-1 text-center">{item.serialNumber}</span>
                        <span className="flex-1 text-right">Diff: {item.cumulativeScore}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ResultsList;
