import React from 'react';

interface ResponsiveComponentProps {
  desktop: React.ReactNode;
  tablet?: React.ReactNode;
  mobile: React.ReactNode;
}

export const ResponsiveComponent: React.FC<ResponsiveComponentProps> = ({
  desktop,
  tablet,
  mobile,
}) => {
  return (
    <>
      {/* Mobile View: Below 768px */}
      <div className="block md:hidden w-full h-full">
        {mobile}
      </div>

      {/* Tablet View: 768px to 1023px */}
      <div className="hidden md:block lg:hidden w-full h-full">
        {tablet || desktop}
      </div>

      {/* Desktop View: 1024px and above */}
      <div className="hidden lg:block w-full h-full">
        {desktop}
      </div>
    </>
  );
};
