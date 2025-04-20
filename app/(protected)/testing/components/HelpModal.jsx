import Button from '@/components/common/Button';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RiCloseLine } from "react-icons/ri";


const HelpModal = ({ isOpen, onClose, help }) => {
    const { t } = useTranslation();

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
                className="bg-background p-8 rounded w-full mx-4 md:w-1/2 lg:w-1/3 shadow-lg"
                onClick={handleModalClick}
            >
                <div className='mb-4'>
                    <div className='flex justify-between items-start'>
                        <h2 className='text-2xl font-semibold mb-8'>{t('test_guide')}</h2>
                        <Button
                            onClick={onClose}
                            className='text-xs'
                            variant='secondary'
                            aria-label={t('close')}
                        >
                            {t('close')}
                        </Button>
                    </div>

                    <ol className='grid gap-5 list-decimal px-4 mb-5'>
                        <li>{t('guide_step_1')}</li>
                        <li>{t('guide_step_2')}</li>
                        <li>{t('guide_step_3')}</li>
                        <li>{t('guide_step_4')}</li>
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
