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
      <motion.div 
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-blue-100 p-2 rounded-lg">
          <RiInformationLine className="text-blue-600 text-2xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">About Ski Lab</h1>
          <p className="text-gray-600">
            Your hub for cross-country ski testing and management
          </p>
        </div>
      </motion.div>

      {/* About Content */}
      <motion.div 
        className="bg-white shadow rounded-lg p-8 md:flex md:space-x-10 space-y-6 md:space-y-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Illustration */}
        <div className="hidden md:flex items-center justify-center w-1/3">
          <SkiLogoAnimation />
        </div>
        {/* Text Content */}
        <motion.div 
          className="flex-1 space-y-4"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <p className="text-gray-700 text-lg">
            <span className="font-semibold text-blue-600">Ski Lab</span> is a platform dedicated to cross-country ski testing and performance analysis, designed for athletes, coaches, and brands.
          </p>
          <p className="text-gray-700 text-lg">
            Our mission is to provide a modern, intuitive, and secure way to manage your ski performance data, helping you track improvements, organize test sessions, and collaborate with your team.
          </p>
          <p className="text-gray-700 text-lg">
            Whether you're an athlete seeking detailed insights or a coach managing a team, Ski Lab delivers real-time analytics, efficient data management, and a user-friendly experience.
          </p>
          <p className="text-gray-700 text-lg">
            Powered by Firebase and Stripe, we ensure secure data handling and seamless payment processing to support your ski testing journey.
          </p>
        </motion.div>
      </motion.div>
      
      

      {/* Call to Action */}
      <motion.div 
        className="my-10 flex flex-col items-center"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="mb-3 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Ready to get started?</h2>
          <p className="text-gray-500">
            Explore your skis and begin your testing journey now.
          </p>
        </div>
        <Button onClick={() => router.push('/skis')} variant="primary">
          Get Started
        </Button>
      </motion.div>
    </div>
  );
}