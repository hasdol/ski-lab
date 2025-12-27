'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { RiInformationLine } from 'react-icons/ri';
import PageHeader from '@/components/layout/PageHeader';

export default function AboutPage() {
  const router = useRouter();

  const CONTACT_EMAIL = 'contact.skilab@gmail.com'; // TODO: update if your email is different
  const INSTAGRAM_URL = 'https://www.instagram.com/skilab_com/';

  return (
    <div className="p-4 max-w-4xl w-full self-center">
      <PageHeader
        icon={<RiInformationLine className="text-blue-600 text-2xl" />}
        title="About Ski Lab"
        subtitle="Your hub for cross-country ski testing and management"
        actions={null}
      />

      {/* Section Divider */}
      <div className="w-full  my-10" />

      {/* About Content */}
      <motion.div
        className="mb-5 rounded-2xl bg-white/75 backdrop-blur-xl ring-1 ring-black/5 shadow-xs overflow-hidden transition-colors duration-200 p-8 flex flex-col md:flex-row md:space-x-10 space-y-6 md:space-y-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Illustration */}
        <div className="flex items-center justify-center md:w-1/3 mb-6 md:mb-0">
          <img
            src="/ski-lab-icon.png"
            alt="Ski Lab Icon"
            width={60}
            height={60}
            className="md:w-[90px] md:h-[90px] w-[60px] h-[60px] transition-all"
          />
        </div>
        {/* Text Content */}
        <div className="flex-1 space-y-4">
          <p className="text-gray-700 text-lg">
            <span className="font-semibold text-blue-500">Ski Lab</span> is a modern platform for cross-country ski testing and performance analysis, built for athletes, coaches, and brands.
          </p>
          <ul className="list-disc list-inside text-gray-700 text-base space-y-2">
            <li>Track ski performance and organize test sessions with ease.</li>
            <li>Collaborate with your team and share results securely.</li>
            <li>Access real-time analytics and intuitive data management tools.</li>
            <li>Powered by <span className='text-blue-500 font-semibold'>Firebase</span> and <span className='text-blue-500 font-semibold'>Stripe</span> for secure data and payments.</li>
          </ul>
          <p className="text-gray-700 text-base">
            Whether you’re an athlete seeking insights or a coach managing a fleet, Ski Lab delivers a user-friendly experience to help you get the most out of your skis.
          </p>
        </div>
      </motion.div>

      {/* NEW: quick links */}
    <div className="p-5 rounded-2xl bg-white/75 backdrop-blur-xl ring-1 ring-black/5 shadow-xs overflow-hidden transition-colors duration-200">
        <div className="font-semibold text-gray-800 mb-2">Connect</div>
        <div className="space-y-1">
          <div>
            Instagram:{' '}
            <a
              className="text-blue-600 underline"
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              @skilab_com
            </a>
          </div>
          <div>
            Email:{' '}
            <a className="text-blue-600 underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="my-12 flex flex-col items-center">
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to get started?</h2>
          <p className="text-gray-500 text-base">
            Explore your skis and begin your testing journey now.
          </p>
        </div>
        <Button onClick={() => router.push('/skis')} variant="primary" size="lg" className="flex items-center gap-2 shadow">
          <span>Get Started</span>
        </Button>
      </div>
    </div>
  );
}