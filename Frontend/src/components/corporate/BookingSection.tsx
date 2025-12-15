import React from 'react';
import CorporateBookingPanel from './CorporateBookingPanel';

interface BookingSectionProps {
  isDarkMode?: boolean;
}

const BookingSection: React.FC<BookingSectionProps> = ({ isDarkMode = false }) => {
  return <CorporateBookingPanel isDarkMode={isDarkMode} />;
};

export default BookingSection;
