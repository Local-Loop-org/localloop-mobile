// src/infra/api/groups.api.ts

import {
  AnchorType,
  GroupPrivacy,
  MemberRole,
} from '@localloop/shared-types';
import { apiClient } from './api-client';

/** Proximity bucket derived server-side from geohash prefix comparison. */
export type ProximityLabel =
  | 'Mesmo local'
  | 'Mesmo bairro'
  | 'Região próxima'
  | 'Na cidade';

export interface NearbyGroup {
  id: string;
  name: string;
  description: string | null;
  anchorType: AnchorType;
  anchorLabel: string;
  proximityLabel: ProximityLabel;
  privacy: GroupPrivacy;
  memberCount: number;
}

export interface CreateGroupBody {
  name: string;
  description?: string;
  anchorType: AnchorType;
  anchorLabel: string;
  lat: number;
  lng: number;
  privacy: GroupPrivacy;
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
  anchorLabel: string;
  privacy: GroupPrivacy;
  memberCount: number;
  /** null when the caller is not a member. */
  myRole: MemberRole | null;
}

export type JoinGroupResult =
  | { status: 'joined'; role: MemberRole }
  | { status: 'pending' };

export const groupsApi = {
  createGroup: async (body: CreateGroupBody): Promise<CreatedGroup> => {
    const { data } = await apiClient.post<CreatedGroup>('/groups', body);
    return data;
  },

  getNearbyGroups: async (params: {
    lat: number;
    lng: number;
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
};
