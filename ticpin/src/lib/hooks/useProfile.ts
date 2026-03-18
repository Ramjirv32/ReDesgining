import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi, type UserProfile } from '@/lib/api/profile';

export const useProfile = (userId: string | undefined) => {
    return useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            if (!userId) return null;
            const profile = await profileApi.getProfile(userId);
            if (!profile) {
                // Return dummy profile if not found, as per current logic
                return { userId, phone: userId, name: 'Member' } as UserProfile;
            }
            return profile;
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, data }: { userId: string, data: Partial<UserProfile> }) =>
            profileApi.updateProfile(userId, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] });
        },
    });
};

export const useUploadPhoto = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, file }: { userId: string, file: File }) =>
            profileApi.uploadPhoto(userId, file),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] });
        },
    });
};
