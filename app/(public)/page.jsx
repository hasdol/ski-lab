'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Button from '@/components/ui/Button';
import { getUserTeamsWithLiveEvents } from '@/lib/firebase/firestoreFunctions';
import { motion } from 'framer-motion';
import { FiArrowRight, FiClipboard, FiBarChart2, FiUsers, FiShield } from 'react-icons/fi';
import InstallCard from './components/InstallCard';
import Spinner from '@/components/common/Spinner/Spinner';
import ActiveEventCard from './components/ActiveEventCard';

const bgUrl = '/bg6.jpg';
const iphone = '/ski-lab-testing-iphone.png';
const desktop = '/desktop.png';

// SIMPLE_ANIM: consistent, simple, safe animation for mount
const SIMPLE_ANIM = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const HomePage = () => {
  const { user, checkingStatus } = useAuth();
  const router = useRouter();
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

  // Flatten events for easier rendering and centering when there's only one
  const activeEvents = teams.flatMap(team =>
    (teamEvents[team.id] || []).map(event => ({ event, team }))
  );
  const hasLiveEvents = activeEvents.length > 0;
  const handleNavigation = (path) => router.push(path);

  // Simplified features list
  const features = [
    {
      icon: <FiClipboard className="w-6 h-6" />,
      title: 'Modern Testing',
      description: 'Run comprehensive ski tests with detailed analytics.'
    },
    {
      icon: <FiBarChart2 className="w-6 h-6" />,
      title: 'Data Visualization',
      description: 'Understand your ski performance through intuitive charts.'
    },
    {
      icon: <FiUsers className="w-6 h-6" />,
      title: 'Team Collaboration',
      description: 'Create and join teams to share results and insights'
    },
    {
      icon: <FiShield className="w-6 h-6" />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security protecting your valuable data.'
    }
  ];

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden">
      {/* Background layers */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-30 blur"
        style={{ backgroundImage: `url(${bgUrl})` }}
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-white/70 via-white/60 to-white/80" />

      <div className="container relative flex flex-col items-center max-w-5xl px-4 md:px-10 pt-16 md:pt-28 mx-auto">
        <motion.div
          {...SIMPLE_ANIM}
          className="flex flex-col items-center text-center"
        >
          <img
            src="/ski-lab-icon.png"
            alt="Ski Lab Icon"
            width={70}
            height={70}
            className="mb-8"
          />
          <motion.div {...SIMPLE_ANIM}>
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 md:text-6xl mb-4">
              Ski-Lab
            </h1>
            <p className="max-w-2xl text-xl leading-8 text-gray-600 mb-2">
              Ski-management for cross-country skiing and biathlon
            </p>
            <div className="inline-flex items-center px-4 py-2 text-xs font-medium tracking-wide text-blue-600 uppercase bg-blue-100 rounded-full mb-2">
              Beta (1.00)
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="flex flex-col items-center w-full mt-10"
          {...SIMPLE_ANIM}
        >
          {!checkingStatus ? (
            !user ? (
              <Button
                variant="primary"
                size="xl"
                onClick={() => handleNavigation('/login')}
                className="flex items-center mb-2"
              >
                Get Started
                <FiArrowRight className="ml-2" />
              </Button>
            ) : (
              <div className="w-full max-w-2xl">
                <h3 className="mb-2 text-sm text-center font-semibold tracking-wide text-gray-500 uppercase">Get Started</h3>
                <Button
                  onClick={() => handleNavigation('/skis')}
                  variant="primary"
                  size="xl"
                  className="flex items-center mx-auto mb-4"
                >
                  New Test
                </Button>
                {hasLiveEvents && (
                  <motion.div
                    className="mt-10 overflow-hidden"
                    {...SIMPLE_ANIM}
                  >
                    <h3 className="mb-4 text-sm font-semibold tracking-wide text-center text-gray-500 uppercase">
                      Active Events
                    </h3>
                    {activeEvents.length === 1 ? (
                      <div className="w-fit mx-auto">
                        <ActiveEventCard
                          key={activeEvents[0].event.id}
                          event={activeEvents[0].event}
                          team={activeEvents[0].team}
                          onClick={() => router.push(`/teams/${activeEvents[0].team.id}/${activeEvents[0].event.id}`)}
                        />
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {activeEvents.map(({ event, team }) => (
                          <ActiveEventCard
                            key={event.id}
                            event={event}
                            team={team}
                            onClick={() => router.push(`/teams/${team.id}/${event.id}`)}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )
          ) : (
            <div className="py-5">
              <Spinner />
            </div>
          )}
        </motion.div>

        <motion.div
          className="relative w-full mt-16 md:mt-24"
          {...SIMPLE_ANIM}
        >
          <div className="flex flex-col items-center justify-center space-y-10 md:flex-row md:space-y-0 md:space-x-16">
            <div className="max-w-md">
              <img src={desktop} alt="Ski-Lab desktop dashboard" className="w-full rounded-lg" />
              <p className="mt-3 text-sm text-center text-gray-500">
                Desktop dashboard for deep analytics
              </p>
            </div>
            <div className="max-w-xs flex flex-col items-center">
              <img src={iphone} alt="Ski-Lab mobile interface" className="w-1/2 rounded-lg" />
              <p className="mt-3 text-sm text-center text-gray-500">
                Optimized for field testing
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="w-full py-16"
          {...SIMPLE_ANIM}
        >
          <div className="w-full py-8 border-t border-gray-200">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">Features</h3>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Professional Ski Management</h2>
              <p className="text-sm text-gray-600 mb-2">
                Everything you need to optimize ski performance
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-8 mt-10 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="flex flex-col items-center text-center px-2"
                initial={SIMPLE_ANIM.initial}
                animate={SIMPLE_ANIM.animate}
                transition={{ duration: 0.42, delay: index * 0.06, ease: 'easeOut' }}
              >
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg text-blue-600 mb-3">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="w-full py-12 border-t border-gray-200">
          <div className="max-w-3xl mx-auto text-center mb-6">
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">Install</h3>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Install Ski‑Lab</h2>
            <p className="text-sm text-gray-600">Get the app for the most seamless experience.</p>
          </div>
          <div className="mt-5">
            <InstallCard />
          </div>
        </div>
      </div>

      <motion.footer
        className="py-8 mt-auto text-center bg-gray-50 border-t border-gray-200"
        {...SIMPLE_ANIM}
      >
        <div className="text-xs text-gray-500">
          <p className="mb-1">
            Built with <span className="font-medium">Firebase</span> & <span className="font-medium">Stripe</span>
          </p>
          <span className="text-gray-400">© {new Date().getFullYear()} Ski Lab. All rights reserved.</span>
        </div>
      </motion.footer>
    </div>
  );
};

export default HomePage;