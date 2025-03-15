'use client'
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
  RiLoginCircleLine , 
  RiUserAddLine 
} from "react-icons/ri";

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

  return (
    <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2/3 space-y-3 cursor-pointer font-semibold md:relative md:w-full md:transform-none animate-fade md:animate-fade-down animate-duration-300 md:animate-duration-200">
      <h3 className="md:hidden font-semibold text-xl mb-5">{t('go_to')}...</h3>
      <ul className="space-y-3 cursor-pointer font-semibold md:static md:py-4 md:w-full animate-fade md:animate-fade-down animate-duration-300 md:animate-duration-200">
        {user && (
          <li 
            className="bg-container shadow border-l-2 hover:bg-sbtn rounded-e flex justify-between items-center p-4 hover:opacity-90" 
            onClick={() => handleItemClick('/account')}
          >
            {t('account')} <RiUser6Line size={20} />
          </li>
        )}
        {user && (
          <li 
            className="bg-container shadow border-l-2 hover:bg-sbtn rounded-e flex justify-between items-center p-4 hover:opacity-90" 
            onClick={() => handleItemClick('/settings')}
          >
            {t('settings')} <RiSettings3Line size={20} />
          </li>
        )}
        {user && (
          <li 
            className="bg-container shadow border-l-2 hover:bg-sbtn rounded-e flex justify-between items-center p-4 hover:opacity-90" 
            onClick={() => handleItemClick('/contact')}
          >
            {t('contact')} <RiMessage2Line size={20} />
          </li>
        )}
        {user && (
          <li 
            className="bg-container shadow border-l-2 hover:bg-sbtn rounded-e flex justify-between items-center p-4 hover:opacity-90" 
            onClick={() => { signOut(router.push); onClose(); }}
          >
            {t('signOut')} <RiLogoutCircleRLine size={20} />
          </li>
        )}
        {!user && (
          <li 
            className="bg-container shadow border-l-2 hover:bg-sbtn rounded-e flex justify-between items-center p-4 hover:opacity-90" 
            onClick={() => handleItemClick('/signin')}
          >
            {t('signIn')} <RiLoginCircleLine size={20} />
          </li>
        )}
        {!user && (
          <li 
            className="bg-container shadow border-l-2 hover:bg-sbtn rounded-e flex justify-between items-center p-4 hover:opacity-90" 
            onClick={() => handleItemClick('/signup')}
          >
            {t('signUp')} <RiUserAddLine size={20} />
          </li>
        )}
      </ul>
    </div>
  );
};

export default SubNavigation;
