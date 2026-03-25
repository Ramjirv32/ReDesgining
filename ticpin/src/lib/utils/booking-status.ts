/**
 * Utility function to determine booking status based on date and API status
 */

export const getBookingStatus = (booking: any) => {
  const bookingDate = new Date(booking.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  bookingDate.setHours(0, 0, 0, 0);
  
  if (bookingDate < today) {
    return 'EXPIRED';
  }
  
  const status = booking.status || 'PENDING';
  return status.toUpperCase();
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
