// SubNavigation.js
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useProfileActions } from '@/hooks/useProfileActions';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  RiUser6Line,
  RiSettings3Line,
  RiMessage2Line,
  RiLogoutCircleRLine,
  RiLoginCircleLine,
  RiUserAddLine,
} from 'react-icons/ri';
import { FaGripLines } from 'react-icons/fa';
import { motion, useMotionValue, animate } from 'framer-motion';

const DRAG_THRESHOLD = 100;

const SubNavigation = ({ isVisible, onClose }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { signOut } = useProfileActions(user);
  const y = useMotionValue(0);

  if (!isVisible) return null;

  const handleDragEnd = (_, info) => {
    if (info.offset.y > DRAG_THRESHOLD) {
      onClose();
    } else {
      animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
    }
  };

  const navItems = [
    user && { label: t('account'), icon: <RiUser6Line />, path: '/account' },
    user && { label: t('settings'), icon: <RiSettings3Line />, path: '/settings' },
    user && { label: t('contact'), icon: <RiMessage2Line />, path: '/contact' },
    user && {
      label: t('signOut'),
      icon: <RiLogoutCircleRLine />, action: () => { signOut(router.push); onClose(); }
    },
    !user && { label: t('signIn'), icon: <RiLoginCircleLine />, path: '/signin' },
    !user && { label: t('signUp'), icon: <RiUserAddLine />, path: '/signup' },
  ].filter(Boolean);

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 bg-white md:bg-transparent rounded-t-md shadow-lg z-50"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'tween', duration: 0.3 }}
      style={{ y }}
      drag="y"
      dragDirectionLock
      dragMomentum={false}
      onDragEnd={handleDragEnd}
    >
      <div className="px-5 pt-3 relative">
        <div className="w-8 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 cursor-grab" />
        {navItems.map(({ label, icon, path, action }, idx) => (
          <button
            key={idx}
            className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-100"
            onClick={() => {
              if (action) action();
              else {
                router.push(path);
                onClose();
              }
            }}
          >
            <span>{label}</span>
            {icon}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default SubNavigation;