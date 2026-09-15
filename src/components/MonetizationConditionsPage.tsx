import React from 'react';
import { MonetizationConditionsView } from './MonetizationConditionsView.tsx';

export const MonetizationConditionsPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <MonetizationConditionsView isStandalonePage={true} />
    </div>
  );
};
