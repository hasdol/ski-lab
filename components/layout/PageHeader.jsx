import React from 'react';

const PageHeader = ({ icon, title, subtitle, actions, iconBg = 'bg-blue-100' }) => (
  <div className="flex flex-col md:flex-row items-center gap-4 mb-6 mt-2">
    <div className={`${iconBg} p-3 rounded-xl`}>{icon}</div>
    <div className='text-center md:text-left'>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="text-xs text-gray-600 mt-1 flex flex-col gap-2">{subtitle}</p>
    </div>
    <div className="md:ml-auto flex gap-2">{actions}</div>
  </div>
);

export default PageHeader;