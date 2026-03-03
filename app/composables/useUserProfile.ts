/**
 * @file User profile composable for managing user profile data
 * @usage import { useUserProfile } from '@/composables/useUserProfile'
 * @description Handles user profile operations including fetching, updating,
 *              and managing avatar with fallback logic. Uses Better Auth for
 *              user info and API endpoints for profile data storage.
 * @dependencies API-backed (libSQL/Drizzle)
 */

export interface Profile {
  id?: string;
  userId: string;
  branch?: string;
  mosCode?: string;
  clearanceLevel?: string;
  yearsExperience?: number;
  preferredLocations?: string[];
  preferredTheaters?: string[];
  openToOconus?: boolean;
  desiredSalaryMin?: number;
  desiredSalaryMax?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileUpdate {
  branch?: string;
  mosCode?: string;
  clearanceLevel?: string;
  yearsExperience?: number;
  preferredLocations?: string[];
  preferredTheaters?: string[];
  openToOconus?: boolean;
  desiredSalaryMin?: number;
  desiredSalaryMax?: number;
  avatar_url?: string;
  display_name?: string;
}

interface ApiUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role?: string;
}

export const useUserProfile = () => {
  const logger = useLogger("useUserProfile");
  const { user, isAuthenticated, isAuthReady } = useAuth();

  /**
   * Get user email from Better Auth
   */
  const userEmail = computed(() => user.value?.email || null);

  // Use global shared state instead of local ref
  // This ensures all components see the same profile data
  const profile = useState<Profile | null>("user-profile", () => null);
  const apiUser = useState<ApiUser | null>("api-user", () => null);
  const loading = ref(false);

  /**
   * Get user ID (from API user)
   */
  const userId = computed(() => apiUser.value?.id || null);

  /**
   * Get avatar URL with fallback logic
   * Priority: API user image -> Better Auth user image -> default
   */
  const avatarUrl = computed(() => {
    // Try API user image first
    if (apiUser.value?.image) return apiUser.value.image;
    // Fallback to Better Auth user image
    if (user.value?.image) return user.value.image;
    // No avatar available
    return null;
  });

  /**
   * Get display name with email fallback
   */
  const displayName = computed(() => {
    if (apiUser.value?.name) return apiUser.value.name;
    if (user.value?.name) return user.value.name;
    if (userEmail.value) return userEmail.value.split("@")[0];
    return "User";
  });

  /**
   * Get user email
   */
  const email = computed(() => {
    return userEmail.value || null;
  });

  /**
   * Load user and profile from database
   */
  const loadProfile = async () => {
    if (!user.value?.email) {
      logger.debug("No user logged in, skipping profile load");
      return null;
    }

    loading.value = true;
    logger.info({ email: user.value.email }, "Loading user profile");

    try {
      const response = await $fetch<{
        user: ApiUser | null;
        profile: Profile | null;
      }>("/api/users/profile", {
        query: { email: user.value.email },
      });

      if (response.user) {
        apiUser.value = response.user;
        profile.value = response.profile;

        logger.info(
          { userId: response.user.id },
          "Profile loaded successfully",
        );
        return response;
      } else {
        // User doesn't exist yet - create them
        logger.info({ email: user.value.email }, "Creating new user");

        const createResponse = await $fetch<{
          success: boolean;
          user: ApiUser | null;
          profile: Profile | null;
        }>("/api/users/profile", {
          method: "POST",
          body: {
            email: user.value.email,
            name: user.value.name || undefined,
          },
        });

        if (createResponse.user) {
          apiUser.value = createResponse.user;
          profile.value = createResponse.profile;
        }

        return createResponse;
      }
    } catch (error) {
      logger.error({ error }, "Unexpected error loading profile");
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates: ProfileUpdate) => {
    if (!userId.value || !userEmail.value) {
      logger.warn("No user logged in, cannot update profile");
      return { success: false, error: "Not authenticated" };
    }

    loading.value = true;
    logger.info({ userId: userId.value, updates }, "Updating user profile");

    try {
      const response = await $fetch<{
        success: boolean;
        user: ApiUser | null;
        profile: Profile | null;
      }>("/api/users/profile", {
        method: "POST",
        body: {
          email: userEmail.value,
          name: updates.display_name,
          branch: updates.branch,
          mosCode: updates.mosCode,
          clearanceLevel: updates.clearanceLevel,
          yearsExperience: updates.yearsExperience,
          preferredLocations: updates.preferredLocations,
          preferredTheaters: updates.preferredTheaters,
          openToOconus: updates.openToOconus,
          desiredSalaryMin: updates.desiredSalaryMin,
          desiredSalaryMax: updates.desiredSalaryMax,
        },
      });

      if (response.success) {
        if (response.user) apiUser.value = response.user;
        if (response.profile) profile.value = response.profile;
        logger.info({ userId: userId.value }, "Profile updated successfully");
        return { success: true, error: null };
      }

      return { success: false, error: "Failed to update profile" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { error: errorMessage },
        "Unexpected error updating profile",
      );
      return { success: false, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update avatar URL
   * Note: Avatar storage would need to be handled via file upload
   */
  const updateAvatar = async (_avatarUrl: string) => {
    // TODO: Implement avatar update via file storage
    logger.warn("Avatar update not yet implemented");
    return { success: false, error: "Avatar update not yet implemented" };
  };

  /**
   * Update display name
   */
  const updateDisplayName = async (name: string) => {
    if (!userId.value || !userEmail.value) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      const response = await $fetch<{
        success: boolean;
        user: ApiUser | null;
        profile: Profile | null;
      }>("/api/users/profile", {
        method: "POST",
        body: {
          email: userEmail.value,
          name,
        },
      });

      if (response.success && response.user) {
        apiUser.value = response.user;
        return { success: true, error: null };
      }

      return { success: false, error: "Failed to update name" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Upload avatar image
   * Note: This would need file storage implementation
   */
  const uploadAvatar = async (_file: File) => {
    logger.warn("Avatar upload not yet implemented");
    return {
      success: false,
      error: "Avatar upload not yet implemented",
      url: null,
    };
  };

  /**
   * Delete current avatar
   */
  const deleteAvatar = async () => {
    logger.warn("Avatar delete not yet implemented");
    return { success: false, error: "Avatar delete not yet implemented" };
  };

  // Auto-load profile on mount if user is logged in
  onMounted(() => {
    if (isAuthReady.value && user.value) {
      loadProfile();
    }
  });

  // Watch for auth ready state and user changes
  watch(
    [isAuthReady, () => user.value?.email],
    ([ready, email]) => {
      if (ready && email) {
        loadProfile();
      } else if (ready && !email) {
        profile.value = null;
        apiUser.value = null;
      }
    },
    { immediate: true },
  );

  return {
    profile,
    loading,
    userId,
    avatarUrl,
    displayName,
    email,
    loadProfile,
    updateProfile,
    updateAvatar,
    updateDisplayName,
    uploadAvatar,
    deleteAvatar,
  };
};
