'use client'
import React, { useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { TiFlowParallel } from "react-icons/ti";
import { RiHome5Line, RiMenuFill } from "react-icons/ri";
import { BiChart } from "react-icons/bi";

import SubNavigation from './SubNavigation';
import useOutsideClick from '@/hooks/useOutsideClick';
import Overlay from '@/components/common/Overlay/Overlay';

const Navigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname;
  const { t } = useTranslation();

  const [isSubNavVisible, setIsSubNavVisible] = useState(false);
  const bottomNavRef = useRef(null);

  useOutsideClick(bottomNavRef, () => {
    if (isSubNavVisible) setIsSubNavVisible(false);
  });

  const toggleSubNav = () => {
    setIsSubNavVisible((prev) => !prev);
  };

  const handleNavItemClick = (path) => {
    router.push(path);
    setIsSubNavVisible(false);
  };

  // Updated isActive function checks if the current path is in the provided array
  const isActive = (paths) =>
    paths.includes(currentPath)
      ? 'font-semibold border-btn border-t-2 md:border-t-0 bg-sbtn md:rounded md:flex md:justify-between md:items-center md:w-full'
      : 'border-transparent border-t-2';

  return (
    <>
      <Overlay isVisible={isSubNavVisible} />
      <div
        ref={bottomNavRef}
        className={`md:text-sm fixed w-full bottom-0 md:flex md:flex-col items-center transition-all duration-200 ease-in-out ${
          isSubNavVisible ? 'md:w-64 z-40' : 'md:w-32 z-20'
        } md:justify-center md:flex-col md:h-screen`}
      >
        <div className="bg-background h-fit md:rounded grid grid-cols-4 gap-2 md:grid-cols-1 md:p-5 md:ml-5 md:w-full">
          <button
            onClick={() => handleNavItemClick('/')}
            className={`flex flex-col cursor-pointer items-center p-4 focus:outline-none md:w-auto hover:font-semibold ${
              isActive(['/'])
            } ${isSubNavVisible && 'md:animate-fade-up md:animate-duration-500'}`}
          >
            <RiHome5Line size={22} />
            <span className="hidden md:block">{t('home')}</span>
          </button>
          <button
            onClick={() => handleNavItemClick('/skis')}
            className={`flex flex-col cursor-pointer items-center p-4 focus:outline-none md:w-auto hover:font-semibold ${
              isActive(['/skis'])
            } ${isSubNavVisible && 'md:animate-fade-up md:animate-duration-[400ms]'}`}
          >
            <TiFlowParallel size={22} />
            <span className="hidden md:block">{t('skipark')}</span>
          </button>
          <button
            onClick={() => handleNavItemClick('/results')}
            className={`flex flex-col cursor-pointer items-center p-4 focus:outline-none md:w-auto hover:font-semibold ${
              isActive(['/results'])
            } ${isSubNavVisible && 'md:animate-fade-up md:animate-duration-300'}`}
          >
            <BiChart size={24} />
            <span className="hidden md:block">{t('results')}</span>
          </button>
          <button
            onClick={toggleSubNav}
            className={`flex flex-col cursor-pointer items-center p-4 md:rounded focus:outline-none md:w-auto hover:font-semibold ${
              isActive(['/account', '/settings', '/contact'])
            } ${isSubNavVisible && 'md:animate-fade-up md:animate-duration-200 bg-sbtn'}`}
          >
            <RiMenuFill size={22} />
            <span className="hidden md:block">{t('more')}</span>
          </button>
          <SubNavigation isVisible={isSubNavVisible} onClose={() => setIsSubNavVisible(false)} />
        </div>
      </div>
    </>
  );
};

export default Navigation;
