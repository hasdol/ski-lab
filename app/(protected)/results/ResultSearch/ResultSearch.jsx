import React from 'react';
import { useTranslation } from 'react-i18next';
import { RiSearchLine } from "react-icons/ri";

const ResultsSearch = ({ onSearchChange }) => {
    const { t } = useTranslation();

    return (
        <div className='flex flex-col w-full mr-5'>

            <div className='bg-container flex items-center rounded-md border md:w-1/2 border-gray-300 overflow-hidden focus-within:border-none focus-within:ring-1 focus-within:ring-gray-400'>
                
                <input
                    id="search-input"
                    type="text"
                    placeholder={t('search')}
                    onChange={e => onSearchChange(e.target.value)}
                    className="w-full bg-container px-4 py-3 outline-none"
                />
                <div className='text-text p-2 px-4 border-gray-300 border-l '>
                    <RiSearchLine />
                </div>
            </div>
        </div>
    );
};

export default ResultsSearch;
