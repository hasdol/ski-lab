'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function EmptyStateCard({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
  className = '',
}) {
  return (
    <Card
      className={`text-center `}
    >
      {icon && (
        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
      )}

      {title && <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>}
      {description && <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>}

      {children}

      {(primaryAction || secondaryAction) && (
        <div className="flex justify-center gap-3 mt-6">
          {secondaryAction && (
            <Button variant={secondaryAction.variant || 'secondary'} onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button variant={primaryAction.variant || 'primary'} onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}