'use client'
import React, { useContext, useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { MdLogin } from "react-icons/md";
import { IoLogoFirebase } from "react-icons/io5";
import { SiStripe } from "react-icons/si";
import { UserPreferencesContext } from '../context/UserPreferencesContext';
import { TournamentContext } from '../context/TournamentContext';
import { TiFlowParallel } from "react-icons/ti";

// Siden 'bg.jpg' ligger i public/ mappen, kan du referere til den med URL
const bgUrl = '/bg.jpg';

const HomePage = () => {
  const { user, checkingStatus } = useAuth();
  const { t } = useTranslation();
  const router  = useRouter();
  const { colormode } = useContext(UserPreferencesContext);
  const { currentRound } = useContext(TournamentContext);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    if (colormode) {
      setPreferencesLoaded(true);
    }
  }, [colormode]);

  const handleNavigation = (path) => {
    router.push(path);
  };

  const handleContinueTest = () => {
    router.push('/testing/summary');
  };

  return (
    <>
      <Head>
        <title>Ski-Lab: Organize, Test, Analyze</title>
        <meta name="description" content="Ski-Lab provides an intuitive way of organizing, testing, and analyzing skis." />
      </Head>

      <div className='bg-container text-text relative flex flex-col items-center min-h-screen p-5 overflow-hidden'>
        {preferencesLoaded && (
          <>
            <div
              className={`absolute inset-0 bg-cover bg-top filter transition-all duration-1000 ease-in-out ${imageLoaded ? 'opacity-20 blur-sm scale-110' : 'opacity-0'}`}
              style={{ backgroundImage: `url(${bgUrl})` }}
            />
            <img
              src={bgUrl}
              alt="Background"
              className="hidden"
              onLoad={() => setImageLoaded(true)}
            />
          </>
        )}

        <div className='relative flex-grow text-center animate-fade animate-duration-500'>
          <div className='text-center mt-2 md:mt-20 mb-4'>
            <i className='text-lg'>{t('welcome_to')}</i>
            <div className='relative flex justify-center items-center'>
              <h1 className='text-4xl text-headerText font-bold italic mb-4'>SKI-LAB</h1>
              <i className='absolute text-sm right-16 font-bold'>beta</i>
            </div>
          </div>

          <div className='flex items-center mt-12 mb-5 p-5 w-80 space-x-10'>
            <p className='text-headerText text-5xl text-start font-bold'>Handle your skis like a pro.</p>
            <TiFlowParallel size={200} className='text-headerText' />
          </div>

          <p className='text-lg mb-5 text-start px-5'>A modern platform built for athletes</p>

          {!checkingStatus ? (
            !user ? (
              <div>
                <button
                  className='flex cursor-pointer items-center mx-auto justify-center bg-btn text-btntxt py-3 px-5 rounded hover:opacity-90 transition duration-300 mb-10'
                  onClick={() => handleNavigation('/signin')}
                >
                  {t('getStarted')}
                  <MdLogin size={18} className='ml-2' />
                </button>
              </div>
            ) : (
              <div className='mt-5'>
                <div className='flex justify-between'>
                  <button
                    className='flex cursor-pointer mx-auto items-center bg-btn text-btntxt py-3 px-5 rounded hover:opacity-90'
                    onClick={() => handleNavigation('/skis')}
                  >
                    {t('your_skis')}
                  </button>

                  {currentRound && currentRound.length > 0 && (
                    <button
                      onClick={handleContinueTest}
                      className="flex cursor-pointer mx-auto items-center bg-container shadow text-btn border border-btn hover:bg-btn hover:text-btntxt py-3 px-5 rounded"
                      title={t('continue_test')}
                    >
                      {t('continue_test')}
                    </button>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className='py-3 px-5 animate-pulse'>Loading...</div>
          )}
        </div>

        <footer className='flex items-center space-x-2 relative text-btn text-xs md:self-end mt-auto mb-12 md:mb-0'>
          <p className='flex px-2 border-r border-btn'>
            Built with Firebase <IoLogoFirebase className='mx-1' /> & Stripe <SiStripe className='mx-1' />
          </p>
          <span className='font-semibold'>&copy; Ski-Lab 2025</span>
        </footer>
      </div>
    </>
  );
};

export default HomePage;
