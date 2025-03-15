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

    const getRankBadge = (rank) => {
        if (rank === 1) return <span>1st</span>;

        return <span className="">#{rank}</span>;
    };

    return (
        <div className="space-y-4 mb-10">
            {/* Top Three Section */}
            <ul className="space-y-4">
                {rankedList.slice(0, 3).map((item, index) => (

                    <li
                        key={item.serialNumber}
                        className={`flex items-center justify-between bg-container shadow rounded p-3 px-5 ${item.rank === 1 ? 'font-semibold' : ""
                            }`}                    >
                        <div className="flex-1 text-left">{getRankBadge(item.rank)}</div>
                        <div className="flex-1 text-center">{item.serialNumber} </div>
                        <div className="flex-1 text-right">Diff: {item.cumulativeScore}</div>
                    </li>
                ))}
            </ul>

            {/* Remaining Rankings */}
            <ul className="space-y-4">
                {rankedList.slice(3).map((item) => (
                    <li
                        key={item.serialNumber}
                        className="flex items-center justify-between bg-container shadow rounded p-3 px-5"
                    >
                        <span className="flex-1 text-left">#{item.rank}</span>
                        <span className="flex-1 text-center">{item.serialNumber}</span>
                        <span className="flex-1 text-right">Diff: {item.cumulativeScore}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ResultsList;
