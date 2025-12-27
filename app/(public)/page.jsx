'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowRight, FiBarChart2, FiClipboard, FiShield, FiUsers } from 'react-icons/fi';

import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import { getUserTeamsWithLiveEvents } from '@/lib/firebase/firestoreFunctions';
import ActiveEventCard from './components/ActiveEventCard';
import InstallCard from './components/InstallCard';
import { APP_VERSION } from '@/lib/releases';

const CONTACT_EMAIL = 'contact.skilab@gmail.com';
const INSTAGRAM_URL = 'https://www.instagram.com/skilab_com/';

const bgUrl = '/bg6.jpg';
const iphone = '/ski-lab-testing-iphone.png';
const desktop = '/desktop.png';

const SIMPLE_ANIM = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
};

const HIGHLIGHTS = [
  {
    icon: <FiClipboard className="h-5 w-5" />,
    title: 'Simplified testing',
    description: 'No calculations, no spreadsheets. Just log and compare.',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-600',
  },
  {
    icon: <FiBarChart2 className="h-5 w-5" />,
    title: 'Spot what wins',
    description: 'See performance patterns in different conditions.',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-600',
  },
  {
    icon: <FiUsers className="h-5 w-5" />,
    title: 'Made for teams',
    description: 'Share skis and results with coaches and wax techs.',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-600',
  },
  {
    icon: <FiShield className="h-5 w-5" />,
    title: 'Private by default',
    description: 'Your data stays yours. You control access.',
    bgColor: 'bg-red-100',
    textColor: 'text-red-600',
  },
];

const STEPS = [
  { title: 'Add your skis', description: 'Create your own ski library.' },
  { title: 'Run a test', description: 'Quick duels that are easy to perform.' },
  { title: 'Decide with confidence', description: 'Trends that make selection simpler.' },
];

function Section({ eyebrow, title, subtitle, children, className = '' }) {
  return (
    <section className={`w-full ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <div className="mb-6 md:mb-8">
          {eyebrow ? (
            <div className="text-xs font-semibold uppercase tracking-widest text-zinc-600">{eyebrow}</div>
          ) : null}
          {title ? (
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">{title}</h2>
          ) : null}
          {subtitle ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 md:text-base">{subtitle}</p>
          ) : null}
        </div>

        {children}
      </div>
    </section>
  );
}

function SoftCard({ children, className = '' }) {
  return (
    <div
      className={[
        // Apple-ish: thin hairline border, soft shadow, subtle translucency
        'rounded-2xl bg-white/75 backdrop-blur-xl ring-1 ring-black/5',
        'shadow-md',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const { user, checkingStatus } = useAuth();
  const router = useRouter();

  const [teams, setTeams] = useState([]);
  const [teamEvents, setTeamEvents] = useState({});

  const handleNavigation = useCallback((path) => router.push(path), [router]);

  useEffect(() => {
    // Clear state immediately when logged out (prevents showing stale "Live events")
    if (!user?.uid) {
      setTeams([]);
      setTeamEvents({});
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await getUserTeamsWithLiveEvents(user.uid);
        if (cancelled) return;
        setTeams(res.teams || []);
        setTeamEvents(res.teamEvents || {});
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching live events:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const activeEvents = useMemo(
    () => teams.flatMap((team) => (teamEvents[team.id] || []).map((event) => ({ event, team }))),
    [teams, teamEvents],
  );

  const hasLiveEvents = activeEvents.length > 0;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gray-50">
      {/* Background (more Apple-style: subtle gradients + light texture) */}
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10 blur-2xl"
          style={{ backgroundImage: `url(${bgUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-zinc-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.06),transparent_60%)]" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pt-16 md:px-10 md:pt-20">
        {/* HERO */}
        <motion.div {...SIMPLE_ANIM} className="w-full max-w-4xl text-center">
          <div className="mx-auto mb-6 flex w-fit items-center justify-center">
            <Image
              src="/ski-lab-icon.png"
              alt="Ski‑Lab"
              width={88}
              height={88}
              priority
              className="rounded-3xl ring-1 ring-black/5 shadow-lg"
            />
          </div>

          <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 md:text-7xl md:leading-[1.02]">
            Test faster.
            <span className="block bg-linear-to-b from-zinc-900 to-zinc-500 bg-clip-text text-transparent">
              Choose smarter.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-zinc-600 md:text-lg">
            Modern solution for managing XC skis. Built for athletes - by athletes. 
          </p>

          <div className="mx-auto mt-7 flex w-fit items-center gap-3 rounded-full bg-white/70 px-4 py-2 text-xs text-zinc-600 backdrop-blur-xl ring-1 ring-black/5">
            <span className="font-semibold text-zinc-900">Ski‑Lab</span>
            <span className="h-3 w-px bg-black/10" />
            <Link
              href="/releases"
              className="inline-flex items-center text-blue-600 hover:text-blue-700"
              aria-label="View what's new in this release"
              title="What's New"
            >
              What&apos;s new · {APP_VERSION} <FiArrowRight className="ml-1" />
            </Link>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {checkingStatus ? (
              <div className="py-2">
                <Spinner />
              </div>
            ) : !user ? (
              <>
                <Button
                  variant="primary"
                  onClick={() => handleNavigation('/signup')}
                >
                  Create account
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleNavigation('/login')}
                >
                  Sign in
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  onClick={() => handleNavigation('/skis')}
                >
                  Get Started
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleNavigation('/about')}
                >
                  Learn More
                </Button>
              </>
            )}
          </div>

          {/* Logged-in: Active events */}
          {!checkingStatus && user && hasLiveEvents && (
            <div className="mt-10">
              <SoftCard className="p-4 text-left md:p-6">
                <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-600">
                  Live events
                </div>

                {activeEvents.length === 1 ? (
                  <div className="mx-auto w-fit">
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
              </SoftCard>
            </div>
          )}
        </motion.div>

        {/* Divider */}
        <div className="my-16 w-full max-w-6xl">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-black/10 to-transparent" />
        </div>

        {/* PRODUCT PREVIEW */}
        <motion.div {...SIMPLE_ANIM} className="w-full">
          <Section
            eyebrow="Preview"
            title="From quick notes to clear trends."
            subtitle="Log tests in the moment. Review performance when it matters."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <SoftCard className="overflow-hidden md:col-span-2">
                <div className="p-5 md:p-6">
                  <div className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Desktop</div>
                  <div className="mt-1 text-sm font-medium text-zinc-900">Results and insights</div>
                </div>
                <div className="px-5 pb-5 md:px-6 md:pb-6">
                  <div className="overflow-hidden">
                    <Image
                      src={desktop}
                      alt="Ski‑Lab desktop dashboard"
                      width={1400}
                      height={900}
                      className="h-auto w-full"
                      priority
                    />
                  </div>
                </div>
              </SoftCard>

              <SoftCard className="overflow-hidden">
                <div className="p-5 md:p-6">
                  <div className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Mobile</div>
                  <div className="mt-1 text-sm font-medium text-zinc-900">Fast logging</div>
                </div>
                <div className="flex items-center justify-center px-5 pb-5 md:px-6 md:pb-6">
                  <div className="w-2/3 overflow-hidden ">
                    <Image
                      src={iphone}
                      alt="Ski‑Lab mobile interface"
                      width={700}
                      height={1200}
                      className="h-auto w-full"
                    />
                  </div>
                </div>
              </SoftCard>
            </div>
          </Section>
        </motion.div>

        {/* HOW IT WORKS */}
        <motion.div {...SIMPLE_ANIM} className="mt-12 w-full md:mt-16">
          <Section eyebrow="Workflow" title="Simple, on purpose." subtitle={null}>
            <div className="grid gap-3 md:grid-cols-3">
              {STEPS.map((s) => (
                <SoftCard key={s.title} className="p-5">
                  <div className="text-sm font-semibold text-gray-900">{s.title}</div>
                  <div className="mt-1 text-sm leading-6 text-gray-600">{s.description}</div>
                </SoftCard>
              ))}
            </div>

            <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-3xl bg-white/85 p-5 backdrop-blur ring-1 ring-black/5 md:flex-row">
              <div className="text-sm text-gray-700">Start with a 30‑day free trial. Cancel anytime.</div>
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => handleNavigation('/pricing')} className="w-full md:w-auto">
                  View pricing
                </Button>
                <Button variant="secondary" onClick={() => handleNavigation('/about')} className="w-full md:w-auto">
                  Learn more
                </Button>
              </div>
            </div>
          </Section>
        </motion.div>

        {/* HIGHLIGHTS */}
        <motion.div {...SIMPLE_ANIM} className="mt-12 w-full md:mt-16">
          <Section eyebrow="Why Ski‑Lab" title="Built for development." subtitle={null}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {HIGHLIGHTS.map((item) => (
                <SoftCard key={item.title} className="p-5">
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${item.bgColor} ${item.textColor} ring-1 ring-black/5`}>
                    {item.icon}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                  <div className="mt-1 text-sm leading-6 text-gray-600">{item.description}</div>
                </SoftCard>
              ))}
            </div>
          </Section>
        </motion.div>

        {/* Divider */}
        <div className="my-16 w-full max-w-6xl px-4 md:px-10">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>

        {/* INSTALL */}
        <motion.div {...SIMPLE_ANIM} className="w-full pb-12 md:pb-16">
          <Section eyebrow="On mobile" title="Ready when you are." subtitle="Install Ski‑Lab for one‑tap access at the track.">
            <SoftCard className="p-5 md:p-6">
              <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                <div className="text-sm text-gray-700">
                  For the best experience, install Ski‑Lab on your device.
                </div>
                <div className="w-full md:w-auto">
                  <InstallCard />
                </div>
              </div>
            </SoftCard>
          </Section>
        </motion.div>
      </div>

      {/* FOOTER */}
      <motion.footer
        {...SIMPLE_ANIM}
        className="mt-auto border-t border-black/5 bg-white/60 px-6 py-10 text-center backdrop-blur-xl"
      >
        <div className="text-xs text-zinc-500">
          <nav className="mb-5 grid grid-cols-2 gap-2 text-[11px] uppercase tracking-widest sm:flex sm:flex-wrap sm:justify-center sm:gap-4">
            <Link href="/pricing" className="block rounded-lg px-3 py-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800">
              Pricing
            </Link>
            <Link href="/skis" className="block rounded-lg px-3 py-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800">
              Skis
            </Link>
            <Link href="/results" className="block rounded-lg px-3 py-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800">
              Results
            </Link>
            <Link href="/teams" className="block rounded-lg px-3 py-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800">
              Teams
            </Link>
            <Link href="/about" className="block rounded-lg px-3 py-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800">
              About
            </Link>
            <Link href="/contact" className="block rounded-lg px-3 py-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800">
              Contact
            </Link>
            <a
              href={INSTAGRAM_URL}
              className="block rounded-lg px-3 py-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="block rounded-lg px-3 py-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            >
              Email
            </a>
          </nav>

          <span className="text-zinc-400">© {new Date().getFullYear()} Ski Lab</span>
        </div>
      </motion.footer>
    </div>
  );
}