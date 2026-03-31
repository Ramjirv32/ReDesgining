/**
 * Utility function to determine booking status based on date and API status
 */

export const getBookingStatus = (booking: any) => {
  const status = (booking?.status || 'PENDING').toUpperCase();
  if (status === 'CANCELLED') return 'CANCELLED';

  if (!booking?.date) {
    // FIX BUG1: Log missing date for debugging instead of silently returning
    console.warn('Booking date is missing:', booking);
    return status;
  }

  // FIX BUG1: Try multiple date formats to handle inconsistency across booking types
  const dateFormats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{1,2}\s\w+,\s\d{4}$/, // DD Month, YYYY
    /^\d{1,2}\s\w+\s\d{4}$/, // DD Month YYYY
  ];

  let bookingDate: Date | null = null;
  
  // Try to parse the date string
  for (const format of dateFormats) {
    if (format.test(booking.date)) {
      bookingDate = new Date(booking.date);
      if (!isNaN(bookingDate.getTime())) {
        break;
      }
    }
  }

  // If date parsing fails, try generic Date constructor as fallback
  if (!bookingDate || isNaN(bookingDate.getTime())) {
    bookingDate = new Date(booking.date);
  }

  // FIX BUG1: Check if date parsing succeeded
  if (isNaN(bookingDate.getTime())) {
    console.error('Failed to parse booking date:', booking.date);
    return status;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  bookingDate.setHours(0, 0, 0, 0);
  
  if (bookingDate < today) {
    return 'EXPIRED';
  }
  
  return status;
};

export const getBookingStatusStyles = (status: string) => {
  switch (status.toLowerCase()) {
    case 'expired':
      return 'bg-red-100 text-red-700';
    case 'confirmed':
    case 'booked':
      return 'bg-green-100 text-green-700';
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    case 'pending':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-zinc-100 text-zinc-500';
  }
};
