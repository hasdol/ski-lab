'use client'
import React, { useContext } from 'react';
import Weather from '../../Weather';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { TournamentContext } from '../../../context/TournamentContext';
import { useAuth } from '../../../context/AuthContext';
import Button from '@/components/common/Button';
import { VscDebugContinue } from "react-icons/vsc";


const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { currentRound } = useContext(TournamentContext);
  const { user } = useAuth();

  const pageNames = {
    '/': '',
    '/skis': t('skipark'),
    '/addSki': t('add_ski_pair'),
    '/testing': t('testing'),
    '/testing/summary': t('test_summary'),
    '/results': t('results'),
    '/account': t('account'),
    '/settings': t('settings'),
    '/contact': t('contact'),
    '/manage-locked-skis': t('manage_locked_skis'),
    '/teams': t('teams'),
  };

  let pageName = pageNames[pathname] || '';

  // Håndter dynamiske URL-er for redigering av ski
  if (pathname.startsWith('/editSki/')) {
    pageName = t('edit_ski_pair');
  }

  // Håndter dynamiske URL-er for redigering av resultater
  if (pathname.startsWith('/editResult/')) {
    pageName = t('edit_test');
  }

  const handleContinueTest = () => {
    router.push('/testing/summary');
  };

  const handleLogoClick = () => {
    router.push('/');
  };

  return (
    <header className='flex flex-col md:grid grid-cols-3 items-center md:mx-4 space-y-1 p-4 relative z-10'>
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
          <div className='justify-self-end absolute top-4 right-4'>
            <Button
              onClick={handleContinueTest}
              variant="primary"
            >
              <VscDebugContinue />
            </Button>
          </div>

        )}
    </header>
  );
};

export default Header;
