'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { RiInformationLine } from 'react-icons/ri';
import SkiLogoAnimation from '../components/SkiLogoAnimation';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="p-4 max-w-4xl w-full self-center">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <RiInformationLine className="text-blue-600 text-2xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">About Ski Lab</h1>
          <div className="text-xs text-gray-600 mt-1 flex flex-col gap-2">
            <span>Your hub for cross-country ski testing and management</span>
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="w-full border-t border-dashed border-gray-300 my-6" />

      {/* About Content */}
      <motion.div
        className="bg-white shadow rounded-lg p-8 flex flex-col md:flex-row md:space-x-10 space-y-6 md:space-y-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Illustration */}
        <div className="flex items-center justify-center md:w-1/3 mb-6 md:mb-0">
          <SkiLogoAnimation />
        </div>
        {/* Text Content */}
        <div className="flex-1 space-y-4">
          <p className="text-gray-700 text-lg">
            <span className="font-semibold text-blue-600">Ski Lab</span> is a modern platform for cross-country ski testing and performance analysis, built for athletes, coaches, and brands.
          </p>
          <ul className="list-disc list-inside text-gray-700 text-base space-y-2">
            <li>Track ski performance and organize test sessions with ease.</li>
            <li>Collaborate with your team and share results securely.</li>
            <li>Access real-time analytics and intuitive data management tools.</li>
            <li>Powered by Firebase and Stripe for secure data and payments.</li>
          </ul>
          <p className="text-gray-700 text-base">
            Whether you’re an athlete seeking insights or a coach managing a fleet, Ski Lab delivers a user-friendly experience to help you get the most out of your skis.
          </p>
        </div>
      </motion.div>

      {/* Call to Action */}
      <div className="my-10 flex flex-col items-center">
        <div className="mb-3 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Ready to get started?</h2>
          <p className="text-gray-500">
            Explore your skis and begin your testing journey now.
          </p>
        </div>
        <Button onClick={() => router.push('/skis')} variant="primary" className="flex items-center gap-2">
          <span>Get Started</span>
        </Button>
      </div>
    </div>
  );
}