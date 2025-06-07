'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Button from '@/components/ui/Button';
import { getUserTeamsWithLiveEvents } from '@/lib/firebase/firestoreFunctions';
import { motion, AnimatePresence } from 'framer-motion';
import SkiLogoAnimated from './components/SkiLogoAnimation';
import { FiArrowRight, FiClipboard, FiBarChart2, FiUsers, FiShield } from 'react-icons/fi';
import Spinner from '@/components/common/Spinner/Spinner';

const bgUrl = '/bg6.jpg';
const iphone = '/ski-lab-phone-transparent.png';
const desktop = '/ski-lab-desktop-transparent.png';

const HomePage = () => {
  const { user, checkingStatus } = useAuth();
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [teams, setTeams] = useState([]);
  const [teamEvents, setTeamEvents] = useState({});
  const featuresRef = useRef(null);

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

  const hasLiveEvents = teams.some(team => teamEvents[team.id]?.length > 0);
  const handleNavigation = (path) => router.push(path);

  // Simplified GlassCard with consistent motion properties
  const GlassCard = ({ children }) => (
    <motion.div
      className="bg-white rounded-md border border-gray-300 hover:bg-gray-50"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  );

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
      description: 'Create and join teams to share results and insights.'
    },
    {
      icon: <FiShield className="w-6 h-6" />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security protecting your valuable data.'
    }
  ];

  return (
    <div className="relative flex flex-col overflow-hidden">
      {/* Background layers */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-30 blur"
        style={{ backgroundImage: `url(${bgUrl})` }}
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-white/70 via-white/60 to-white/80" />
      
      <div className="container relative flex flex-col items-center max-w-5xl px-6 pt-16 mx-auto md:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <SkiLogoAnimated />
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mt-8"
          >
            <div className="inline-flex items-center px-4 py-1 mb-3 text-xs font-medium tracking-wide text-blue-600 uppercase bg-blue-100 rounded-full">
              Beta
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 md:text-6xl">
              Ski-Lab
            </h1>
            <p className="max-w-2xl mt-4 text-xl leading-8 text-gray-600">
              Ski-management for athletes, coaches, and brands.
            </p>
          </motion.div>
        </motion.div>
        
        <motion.div
          className="flex flex-col items-center w-full mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
        >
          {!checkingStatus ? (
            !user ? (
              <Button
                variant="primary"
                size="xl"
                onClick={() => handleNavigation('/login')}
                className="flex items-center"
              >
                Get Started
                <FiArrowRight className="ml-2" />
              </Button>
            ) : (
              <div className="w-full max-w-2xl">
                <Button
                  onClick={() => handleNavigation('/skis')}
                  variant="primary"
                  size="xl"
                  className="flex mx-auto"
                >
                  Start Test
                </Button>
                {hasLiveEvents && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    whileInView={{ opacity: 1, height: 'auto' }}
                    className="mt-12 overflow-hidden"
                  >
                    <h3 className="mb-4 text-sm font-semibold tracking-wide text-center text-gray-500 uppercase">
                      Active Events
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {teams.map(team =>
                        teamEvents[team.id]?.map(event => {
                          const start = event.startDate?.toLocaleDateString('nb-NO');
                          const end = event.endDate?.toLocaleDateString('nb-NO');
                          return (
                            <motion.div
                              key={event.id}
                              className="cursor-pointer"
                              onClick={() => router.push(`/teams/${team.id}/${event.id}`)}
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                            >
                              <GlassCard>
                                <div className="p-5">
                                  <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-900">
                                      {event.name}
                                    </h3>
                                    <span className="flex items-center text-xs font-bold text-red-500">
                                      <span className="w-2 h-2 mr-1 rounded-full bg-red-500 animate-pulse" />
                                      LIVE
                                    </span>
                                  </div>
                                  <div className="mt-2 text-sm text-gray-500">
                                    {team.name}
                                  </div>
                                  <div className="flex items-center justify-between mt-4">
                                    <span className="text-xs text-gray-500">
                                      {start} – {end}
                                    </span>
                                    <span className="text-xs font-medium text-blue-600">
                                      View event →
                                    </span>
                                  </div>
                                </div>
                              </GlassCard>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
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
          className="relative w-full mt-20 md:mt-28"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col items-center justify-center space-y-12 md:flex-row md:space-y-0 md:space-x-16">
            <div className="max-w-md">
              <img src={desktop} alt="Ski-Lab desktop dashboard" className="w-full" />
              <p className="mt-3 text-sm text-center text-gray-500">
                Desktop dashboard for deep analytics
              </p>
            </div>
            <div className="max-w-xs flex flex-col items-center">
              <img src={iphone} alt="Ski-Lab mobile interface" className="w-1/2" />
              <p className="mt-3 text-sm text-center text-gray-500">
                Optimized for field testing
              </p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          className="w-full py-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
        >
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Professional Ski Management
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to optimize ski performance
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 mt-16 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      
      <motion.footer
        className="py-10 mt-auto text-center bg-gray-50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
      >
        <div className="text-xs text-gray-500">
          <p className="mb-1">
            Built with <span className="font-medium">Firebase</span> & <span className="font-medium">Stripe</span>
          </p>
          <span className="text-gray-400">© Ski-Lab 2025</span>
        </div>
      </motion.footer>
    </div>
  );
};

export default HomePage;