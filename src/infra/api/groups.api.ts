// src/infra/api/groups.api.ts

import {
  AnchorType,
  GroupPrivacy,
  MemberRole,
  type MyGroup as SharedMyGroup,
  type NearbyGroup,
} from '@localloop/shared-types';
import { apiClient } from './api-client';

export type {
  GroupSummaryUpdate,
  MyGroupLastMessage,
  NearbyGroup,
} from '@localloop/shared-types';

export type MyGroup = SharedMyGroup & {
  liveCount?: number;
};

export interface CreateGroupBody {
  name: string;
  description?: string;
  anchorType: AnchorType;
  anchorLabel: string;
  lat: number;
  lng: number;
  privacy: GroupPrivacy;
  radiusKm?: number;
}

export interface CreatedGroup {
  id: string;
  name: string;
  anchorType: AnchorType;
  anchorLabel: string;
  privacy: GroupPrivacy;
  memberCount: number;
  myRole: MemberRole;
}

export interface GroupDetail {
  id: string;
  name: string;
  description: string | null;
  anchorType: AnchorType;
  anchorLat: number;
  anchorLng: number;
  anchorLabel: string;
  privacy: GroupPrivacy;
  radiusKm?: number;
  memberCount: number;
  /** null when the caller is not a member. */
  myRole: MemberRole | null;
  /** ISO-8601 timestamp from the API. Optional for forward-compat with older responses. */
  createdAt?: string;
}

export interface UpdateGroupBody {
  name?: string;
  description?: string | null;
  anchorLabel?: string;
  privacy?: GroupPrivacy;
  radiusKm?: number;
}

export type JoinGroupResult =
  | { status: 'joined'; role: MemberRole }
  | { status: 'pending' };

export interface JoinRequest {
  id: string;
  userId: string;
  displayName: string;
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: MemberRole;
}

export interface ListMembersResponse {
  data: GroupMember[];
  next_cursor: string | null;
}

export interface ListMyGroupsResponse {
  data: MyGroup[];
  next_cursor: string | null;
}

export type JoinRequestAction = 'approve' | 'reject';

export interface ResolveJoinRequestResult {
  status: 'approved' | 'rejected';
}

export const groupsApi = {
  createGroup: async (body: CreateGroupBody): Promise<CreatedGroup> => {
    const { data } = await apiClient.post<CreatedGroup>('/groups', body);
    return data;
  },

  getNearbyGroups: async (params: {
    lat: number;
    lng: number;
    radiusKm?: number;
  }): Promise<NearbyGroup[]> => {
    const { data } = await apiClient.get<{ data: NearbyGroup[] }>(
      '/groups/nearby',
      { params },
    );
    return data.data;
  },

  getGroupDetail: async (id: string): Promise<GroupDetail> => {
    const { data } = await apiClient.get<GroupDetail>(`/groups/${id}`);
    return data;
  },

  /**
   * Returns `joined` for open groups (HTTP 200) or `pending` for approval-required
   * groups (HTTP 202). Errors (409 ALREADY_MEMBER, 403 BANNED, 404) bubble up.
   */
  joinGroup: async (id: string): Promise<JoinGroupResult> => {
    const response = await apiClient.post<JoinGroupResult>(
      `/groups/${id}/join`,
    );
    return response.data;
  },

  /**
   * Leave a group (non-owner members only). Server returns 204.
   * Owners receive 403 OWNER_CANNOT_LEAVE — bubble the error up.
   */
  leaveGroup: async (groupId: string): Promise<void> => {
    await apiClient.delete(`/groups/${groupId}/members/me`);
  },

  /**
   * Delete a group permanently. Caller must be the owner. Server returns 204
   * and cascades members, requests, and messages.
   */
  deleteGroup: async (groupId: string): Promise<void> => {
    await apiClient.delete(`/groups/${groupId}`);
  },

  /**
   * List pending join requests for a group. Caller must be owner or moderator.
   */
  listJoinRequests: async (groupId: string): Promise<JoinRequest[]> => {
    const { data } = await apiClient.get<{ data: JoinRequest[] }>(
      `/groups/${groupId}/requests`,
    );
    return data.data;
  },

  /**
   * Approve or reject a pending join request. Caller must be owner or moderator.
   */
  resolveJoinRequest: async (
    groupId: string,
    requestId: string,
    action: JoinRequestAction,
  ): Promise<ResolveJoinRequestResult> => {
    const { data } = await apiClient.patch<ResolveJoinRequestResult>(
      `/groups/${groupId}/requests/${requestId}`,
      { action },
    );
    return data;
  },

  /**
   * List paginated group members. `cursor` is the `next_cursor` returned by a
   * previous call — pass it as `before` to fetch the next page.
   */
  listMembers: async (
    groupId: string,
    cursor?: string,
  ): Promise<ListMembersResponse> => {
    const params: Record<string, string | number> = { limit: 50 };
    if (cursor) params.before = cursor;
    const { data } = await apiClient.get<ListMembersResponse>(
      `/groups/${groupId}/members`,
      { params },
    );
    return data;
  },

  /**
   * Ban a member from a group. Caller must be owner or moderator.
   * Server returns 204; 403 FORBIDDEN (cannot ban owner / moderator banning
   * moderator) and 404 MEMBER_NOT_FOUND bubble up.
   */
  banMember: async (groupId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/groups/${groupId}/members/${userId}`);
  },

  /**
   * Unban a previously banned member. Caller must be owner or moderator.
   * Server returns 204; 400 TARGET_NOT_BANNED, 403 FORBIDDEN, and 404
   * MEMBER_NOT_FOUND bubble up.
   */
  unbanMember: async (groupId: string, userId: string): Promise<void> => {
    await apiClient.post(`/groups/${groupId}/members/${userId}/unban`);
  },

  /**
   * Promote a regular member to moderator. Caller must be owner.
   * Server returns 204; 403 FORBIDDEN and 404 MEMBER_NOT_FOUND bubble up.
   */
  promoteMember: async (groupId: string, userId: string): Promise<void> => {
    await apiClient.post(`/groups/${groupId}/members/${userId}/promote`);
  },

  /**
   * Demote a moderator back to regular member. Caller must be owner.
   * Server returns 204; 403 FORBIDDEN and 404 MEMBER_NOT_FOUND bubble up.
   */
  demoteMember: async (groupId: string, userId: string): Promise<void> => {
    await apiClient.post(`/groups/${groupId}/members/${userId}/demote`);
  },

  /**
   * Update group settings. Caller must be owner or moderator.
   */
  updateGroup: async (
    groupId: string,
    body: UpdateGroupBody,
  ): Promise<GroupDetail> => {
    const { data } = await apiClient.patch<GroupDetail>(
      `/groups/${groupId}`,
      body,
    );
    return data;
  },

  /**
   * List the caller's active group memberships sorted by latest activity.
   * Used for the "Meus grupos" pinned section on HomeScreen.
   */
  getMyGroups: async (limit = 5): Promise<ListMyGroupsResponse> => {
    const { data } = await apiClient.get<ListMyGroupsResponse>('/groups/me', {
      params: { limit },
    });
    return data;
  },
};
