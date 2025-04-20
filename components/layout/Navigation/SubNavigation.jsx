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
  RiUserAddLine 
} from "react-icons/ri";
import Button from '@/components/common/Button';

const SubNavigation = ({ isVisible, onClose }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { signOut } = useProfileActions(user);

  if (!isVisible) return null;

  const handleItemClick = (path) => {
    router.push(path);
    onClose();
  };

  const navItems = [
    user && { label: t('account'), icon: <RiUser6Line />, path: '/account' },
    user && { label: t('settings'), icon: <RiSettings3Line />, path: '/settings' },
    user && { label: t('contact'), icon: <RiMessage2Line />, path: '/contact' },
    user && { label: t('signOut'), icon: <RiLogoutCircleRLine />, action: () => { signOut(router.push); onClose(); } },
    !user && { label: t('signIn'), icon: <RiLoginCircleLine />, path: '/signin' },
    !user && { label: t('signUp'), icon: <RiUserAddLine />, path: '/signup' },
  ].filter(Boolean);
    
  return (
    <div className="bg-container md:bg-transparent p-5 py-8 md:p-0 md:mt-2 shadow-md rounded-md md:shadow-none fixed right-1 bottom-16 md:bottom-auto transform w-2/3 space-y-3 font-semibold md:relative md:w-full md:transform-none animate-fade-left md:animate-fade-down animate-duration-300 md:animate-duration-200">
      <div className="space-y-4">
        {navItems.map(({ label, icon, path, action }, idx) => (
          <Button
            key={idx}
            variant="secondary"
            className="w-full flex justify-between items-center p-4 text-left"
            onClick={() => {
              action ? action() : handleItemClick(path);
            }}
          >
            <span>{label}</span>
            {icon}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SubNavigation;
