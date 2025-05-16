'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import Button from '@/components/common/Button';
import { getUserTeamsWithLiveEvents } from '@/lib/firebase/firestoreFunctions';
import { motion } from 'framer-motion';
import SkiLogoAnimated from './components/SkiLogoAnimation';

const bgUrl = '/bg6.jpg';

const HomePage = () => {
  const { user, checkingStatus } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const [imageLoaded, setImageLoaded] = useState(false);
  const [teams, setTeams] = useState([]);
  const [teamEvents, setTeamEvents] = useState({});

  useEffect(() => {
    const img = new window.Image();
    img.src = bgUrl;
    img.onload = () => setImageLoaded(true);
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchLiveEvents = async () => {
      try {
        const { teams, teamEvents } = await getUserTeamsWithLiveEvents(user.uid);
        setTeams(teams);
        setTeamEvents(teamEvents);
      } catch (err) {
        console.error('Error fetching live events:', err);
      }
    };

    fetchLiveEvents();
  }, [user]);

  const hasLiveEvents = teams.some(team =>
    teamEvents[team.id]?.length > 0
  );

  const handleNavigation = (path) => {
    router.push(path);
  };

  return (
    <>
      <div className='relative flex flex-col items-center min-h-screen p-6 text-text overflow-hidden'>
        {/* Background image */}
        <div
          className={`absolute inset-0 bg-cover bg-top blur-[2px] transition-opacity duration-1000 ${imageLoaded ? 'opacity-30 scale-110' : 'opacity-0'}`}
          style={{ backgroundImage: `url(${bgUrl})` }}
        />
        <img
          src={bgUrl}
          alt="Background"
          className="hidden"
          onLoad={() => setImageLoaded(true)}
        />
        <div className='flex flex-col items-center relative text-center w-full max-w-4xl md:mt-20 mt-10'>
          <SkiLogoAnimated />
          {/* Hero section */}
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: 'easeInOut' }}
            className="mt-5"
          >
            <div className="flex flex-col items-center space-y-4">


              <h1 className="text-5xl font-bold text-gray-900 tracking-wide">Ski-Lab</h1>
              <h5 className="text-sm text-gray-900 -mt-2 font-semibold">beta</h5>


              <p className="text-lg text-center max-w-xl">
                Handle your skis like a pro. Built for athletes, coaches, and brands.
              </p>

              {!checkingStatus ? (
                !user ? (
                  <Button
                    variant='primary'
                    onClick={() => handleNavigation('/signin')}
                  >
                    {t('getStarted')}
                  </Button>
                ) : (
                  <div className='mt-6 space-y-6'>
                    <div className='flex flex-wrap justify-center gap-4'>
                      <Button
                        onClick={() => handleNavigation('/skis')}
                        variant='primary'
                      >
                        {t('start_test')}
                      </Button>
                    </div>

                    {hasLiveEvents && (
                      <div className="w-full mt-4 overflow-x-auto">
                        <div className="flex gap-4 pb-4 scrollbar-hide">
                          {teams.map((team) => (
                            teamEvents[team.id]?.length > 0 && (
                              <div key={team.id} className="min-w-[250px] space-y-2">
                                {teamEvents[team.id].map((event) => {
                                  const start = event.startDate?.toLocaleDateString();
                                  const end = event.endDate?.toLocaleDateString();
                                  return (
                                    <div key={event.id} className="">
                                      <div className="flex justify-between items-center mb-1">
                                        <h3 className="text-sm font-semibold text-left">
                                          {team.name || t('unnamed_team')}
                                        </h3>
                                        <span className="flex items-center text-red-500 text-xs font-bold uppercase">
                                          <span className="h-2 w-2 mr-1 bg-red-500 rounded-full animate-pulse"></span>
                                          Live
                                        </span>
                                      </div>
                                      <div
                                        variant="secondary"
                                        onClick={() => router.push(`/teams/${team.id}/${event.id}`)}
                                        className="flex flex-col text-left bg-white text-gray-800 shadow hover:bg-gray-50 active:scale-[0.98] focus:ring-2 focus:ring-gray-300 cursor-pointer p-4 rounded-md focus:outline-none transition-all duration-200"
                                      >
                                        <div className="font-medium">{event.name}</div>
                                        <div className="text-xs opacity-75">
                                          {start} – {end}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className='py-3 px-5 animate-pulse'>Loading...</div>
              )}
            </div>
          </motion.div>
        </div>
        {/* Footer */}
        <footer className='mt-auto pb-14 text-xs text-btn text-center'>
          <p className='mb-1'>
            Built with <strong>Firebase</strong> & <strong>Stripe</strong>
          </p>
          <span className='font-semibold'>&copy; Ski-Lab 2025</span>
        </footer>
      </div>
    </>
  );
};

export default HomePage;
