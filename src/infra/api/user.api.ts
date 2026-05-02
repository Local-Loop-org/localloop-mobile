import { DmPermission, Provider } from "@localloop/shared-types";
import { apiClient } from "./api-client";

export interface UserProfileResponse {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  dmPermission: DmPermission;
  provider: Provider;
  createdAt: string;
}

export const userApi = {
  getMe: async (): Promise<UserProfileResponse> => {
    const { data } = await apiClient.get<UserProfileResponse>("/users/me");
    return data;
  },

  updateProfile: async (body: {
    displayName?: string;
    dmPermission?: DmPermission;
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
