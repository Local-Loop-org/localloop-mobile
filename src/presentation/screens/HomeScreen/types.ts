import type { MyGroup, NearbyGroup } from '@/infra/api/groups.api';

export type HomeNearbyGroup = NearbyGroup & {
  liveCount?: number;
};

export type HomeMyGroup = MyGroup & {
  liveCount?: number;
};
