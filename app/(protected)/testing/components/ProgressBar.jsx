const ProgressBar = ({ progress }) => {
    return (
        <div className="progress-bar-container w-100 mb-5">
            <div style={{ width: `${progress}%` }} className={`h-0.5 bg-btn rounded-xl`}
            ></div>
            <div style={{ width: `${100}%` }} className={`h-0.5 bg-container rounded-xl`}></div>
        </div>
    );
};



export default ProgressBar
