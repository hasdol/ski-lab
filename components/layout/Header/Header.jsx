'use client'
import React, { useContext } from 'react';
import Weather from '../../Weather';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { TournamentContext } from '../../../context/TournamentContext';
import { useAuth } from '../../../context/AuthContext';

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { currentRound } = useContext(TournamentContext);
  const { user } = useAuth();

  const pageNames = {
    '/': '',
    '/skis': t('skipark'),
    '/add-skis': t('add_ski_pair'),
    '/testing': t('testing'),
    '/testing/summary': t('test_summary'),
    '/results': t('results'),
    '/account': t('account'),
    '/settings': t('settings'),
    '/contact': t('contact'),
    '/manage-locked-skis': t('manage_locked_skis'),
  };

  let pageName = pageNames[pathname] || '';

  // Håndter dynamiske URL-er for redigering av ski
  if (pathname.startsWith('/edit-skis/')) {
    pageName = t('edit_ski_pair');
  }

  // Håndter dynamiske URL-er for redigering av resultater
  if (pathname.startsWith('/edit-result/')) {
    pageName = t('edit_test');
  }

  const handleContinueTest = () => {
    router.push('/testing/summary');
  };

  const handleLogoClick = () => {
    router.push('/');
  };

  return (
    <header className='flex flex-col md:grid grid-cols-3 items-center md:mx-4 space-y-1 p-4 relative z-30'>
      <div className='relative'>
        <span className='flex-1 md:text-2xl text-3xl rounded font-semibold italic'>
          <h1 className='w-fit cursor-pointer' onClick={handleLogoClick}>SKI-LAB</h1>
          <i className='absolute top-6 -right-8 md:left-20 md:top-5 md:ml-2 -translate-y-1/2 text-sm font-semibold'>beta</i>
        </span>
      </div>

      <div className="flex-1 flex flex-col text-center text-3xl">
        {pageName && <span className='flex-1 hidden md:block'>{pageName}</span>}
      </div>

      {currentRound.length === 0 && <Weather />}
      {currentRound.length > 0 &&
        pathname !== '/testing/summary' &&
        pathname !== '/testing' &&
        user != null && (
          <button
            onClick={handleContinueTest}
            className="flex-1 w-fit bg-container cursor-pointer text-btn border border-btn rounded shadow p-3 px-5 flex text-sm items-center justify-self-end hover:bg-btn hover:text-btntxt"
            title={t('continue_test')}
          >
            {t('continue_test')}
          </button>
        )}
    </header>
  );
};

export default Header;
