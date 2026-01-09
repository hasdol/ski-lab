import React from 'react';

const PageHeader = ({ icon, title, subtitle, actions, iconBg = 'bg-blue-100' }) => (
  <div className="flex flex-col md:flex-row items-center gap-4 mb-5 md:mb-8 mt-2">
    <div className={`${iconBg} p-3 rounded-xl`}>{icon}</div>
    <div className='text-center md:text-left'>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="text-xs text-gray-600 mt-1 flex flex-col gap-2">{subtitle}</p>
    </div>
    <div className="md:ml-auto flex w-full sm:w-auto flex-col sm:flex-row sm:items-center sm:justify-end gap-2 *:w-full sm:*:w-auto">{actions}</div>
  </div>
);

export default PageHeader;