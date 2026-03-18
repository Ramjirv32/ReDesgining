import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '@/lib/api/booking';

export const useUserBookings = (email?: string, phone?: string, userId?: string) => {
    return useQuery({
        queryKey: ['bookings', email, phone, userId],
        queryFn: async () => {
            if (!email && !phone && !userId) return [];
            return await bookingApi.getUserBookings({ email, phone, userId });
        },
        enabled: !!(email || phone || userId),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

export const useCancelBooking = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, category }: { id: string, category: string }) =>
            bookingApi.cancelBooking(id, category),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
        },
    });
};
