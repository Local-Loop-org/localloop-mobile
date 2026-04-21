import { DmPermission, Provider } from "@localloop/shared-types";
import { apiClient } from "./api-client";

interface UserProfileResponse {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  dmPermission: DmPermission;
  provider: Provider;
}

export const userApi = {
  updateProfile: async (body: {
    displayName: string;
  }): Promise<UserProfileResponse> => {
    const { data } = await apiClient.patch<UserProfileResponse>(
      "/users/me",
      body,
    );
    return data;
  },

  updateLocation: async (body: { lat: number; lng: number }): Promise<void> => {
    await apiClient.patch("/users/me/location", body);
  },
};
