import Button from '@/components/common/Button';
import React from 'react';


const HelpModal = ({ isOpen, onClose, help }) => {

    if (!isOpen) return null; // Don't render the modal if it's not open

    const handleOverlayClick = () => {
        onClose();
    };

    const handleModalClick = (event) => {
        event.stopPropagation(); // Prevent click from propagating to the overlay
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
            onClick={handleOverlayClick}
        >
            <div
                className="bg-background p-8 rounded-md bg-white w-full mx-4 md:w-1/2 lg:w-1/3 shadow-lg"
                onClick={handleModalClick}
            >
                <div className='mb-4'>
                    <div className='flex justify-between items-start'>
                        <h2 className='text-2xl font-semibold mb-8'>Test guide</h2>
                        <Button
                            onClick={onClose}
                            className='text-sm'
                            variant='secondary'
                            aria-label='close'
                        >
                            Close
                        </Button>
                    </div>

                    <ol className='grid gap-5 list-decimal px-4 mb-5'>
                        <li>Find a suitable downhill and select the first two skis with a partner</li>
                        <li>Gain some speed side by side</li>
                        <li>Hold on to each other, and release when you have the exact same speed</li>
                        <li>Find a second mark where you see the difference between you and you partner</li>
                    </ol>
                    <h2 className="text-xl font-semibold">Tips</h2>
                    <ul className='list-disc px-4'>
                        {help.map((tip, index) => (
                            <li key={index} className="my-2">{tip}</li>
                        ))}
                    </ul>
                </div>


            </div>
        </div>
    );
};

export default HelpModal;
