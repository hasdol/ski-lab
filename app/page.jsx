'use client'
import React, { useContext, useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { TournamentContext } from '../context/TournamentContext';
import { TiFlowParallel } from "react-icons/ti";
import Button from '@/components/common/Button';
import { getUserTeamsWithLiveEvents } from '@/lib/firebase/firestoreFunctions';

const bgUrl = '/bg.jpg';

const HomePage = () => {
  const { user, checkingStatus } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const { currentRound } = useContext(TournamentContext);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [teams, setTeams] = useState([]);
  const [teamEvents, setTeamEvents] = useState({});

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

  const handleContinueTest = () => {
    router.push('/testing/summary');
  };

  return (
    <>
      <Head>
        <title>Ski-Lab: Organize, Test, Analyze</title>
        <meta name="description" content="Ski-Lab provides an intuitive way of organizing, testing, and analyzing skis." />
      </Head>

      <div className=' text-text relative flex flex-col items-center min-h-screen p-5 overflow-hidden'>
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

        <div className='relative flex-grow text-center animate-fade animate-duration-500'>
          <div className='text-center mt-2 md:mt-20'>
            <i className='text-lg'>{t('welcome_to')}</i>
            <div className='relative flex mx-auto w-fit items-center'>
              <h1 className='text-4xl text-headerText font-bold italic mb-4'>SKI-LAB</h1>
              <i className='absolute text-sm -right-10 font-bold'>beta</i>
            </div>
          </div>

          <div className='flex items-center mt-6 mb-2 p-5 w-80 space-x-10'>
            <p className='text-headerText text-5xl text-start font-bold'>Handle your skis like a pro.</p>
            <TiFlowParallel size={200} className='text-headerText' />
          </div>

          <p className='text text-start px-5 mb-8'>Built for athletes, coaches and brands</p>

          {!checkingStatus ? (
            !user ? (
              <div>
                <Button
                  variant='primary'
                  onClick={() => handleNavigation('/signin')}
                >
                  {t('getStarted')}
                </Button>
              </div>
            ) : (
              <div className='mt-5'>
                <div className='flex space-x-4 justify-center'>
                  <Button
                    onClick={() => handleNavigation('/skis')}
                    variant='primary'
                  >
                    {t('start_test')}
                  </Button>

                  {currentRound && currentRound.length > 0 && (
                    <Button
                      onClick={handleContinueTest}
                      variant='primary'
                    >
                      {t('continue_test')}
                    </Button>
                  )}
                </div>

                {hasLiveEvents && (
                  <div className="w-80 mt-4 md:w-100">
                    <div className="flex overflow-x-scroll space-x-4 pb-4 scrollbar-hide"> {/* Add scrollbar-hide class if you want to hide scrollbar */}
                      {teams.map((team) => (
                        teamEvents[team.id]?.length > 0 && (
                          <div key={team.id} className="flex-shrink-0 space-y-2">

                            <div className="flex space-x-4">
                              {teamEvents[team.id].map((event) => {
                                const start = event.startDate?.toLocaleDateString();
                                const end = event.endDate?.toLocaleDateString();
                                return (
                                  <div key={event.id} className='flex flex-col'>
                                    <div className='flex justify-between'>
                                      <h3 className="text-xs font-semibold text-left ml-2">
                                        {team.name || t('unnamed_team')}
                                      </h3>
                                      {/* Live Badge */}
                                      <div className="flex items-center ">
                                        <span className="h-2 w-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
                                        <span className="text-red-500 text-xs font-bold uppercase tracking-wide">
                                          Live
                                        </span>
                                      </div>
                                    </div>


                                    <div
                                      key={event.id}
                                      className="flex-shrink-0 transform transition-transform hover:scale-105"
                                    >
                                      <Button
                                        variant="secondary"
                                        onClick={() => router.push(`/teams/${team.id}/${event.id}`)}
                                        className="flex flex-col items-start"
                                      >

                                        <div className="">{event.name}</div>
                                        <div className="text-xs mt-1 opacity-75">
                                          {start} – {end}
                                        </div>

                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
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

        <footer className='flex items-center space-x-2 relative text-btn text-xs md:self-end mt-auto mb-12 md:mb-0'>
          <p className='flex px-2 border-r border-btn'>
            Built with <b className='mx-1'>Firebase</b> & <b className='mx-1'>Stripe</b>
          </p>
          <span className='font-semibold'>&copy; Ski-Lab 2025</span>
        </footer>
      </div>
    </>
  );
};

export default HomePage;