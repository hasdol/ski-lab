import Button from '@/components/ui/Button';
import React from 'react';

const TestingHelpModal = ({ isOpen, onClose, help }) => {
    if (!isOpen) return null;

    const handleOverlayClick = () => {
        onClose();
    };

    const handleModalClick = (event) => {
        event.stopPropagation();
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
            onClick={handleOverlayClick}
        >
            <div
                className="bg-background p-8 rounded-2xl bg-white w-full mx-4 md:w-1/2 lg:w-1/3 shadow-lg max-h-[80vh] overflow-y-auto"
                onClick={handleModalClick}
            >
                <div className='mb-4'>
                    <div className='flex justify-between items-start'>
                        <h2 className='text-2xl font-semibold mb-4'>Tournament Guide</h2>
                        <Button
                            onClick={onClose}
                            className='text-sm'
                            variant='secondary'
                            aria-label='close'
                        >
                            Close
                        </Button>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Tournament Navigation</h3>
                        <ul className='list-disc px-4 space-y-2'>
                            <li>Use "Next Round →" to advance after completing all duels</li>
                            <li>Use "← Previous Round" to go back and make changes</li>
                            <li>Your inputs are saved when navigating between rounds</li>
                            <li>Reset tournament anytime to start over</li>
                        </ul>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Ski Testing Process</h3>
                        <ol className='grid gap-3 list-decimal px-4 mb-3'>
                            <li>Find a suitable downhill and select two skis to compare</li>
                            <li>Gain speed side by side with your partner</li>
                            <li>Release when you have matching speed</li>
                            <li>Measure the distance difference at the stopping point</li>
                        </ol>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-3">App Features</h3>
                        <ul className='list-disc px-4'>
                            {help.map((tip, index) => (
                                <li key={index} className="my-2">{tip}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestingHelpModal;