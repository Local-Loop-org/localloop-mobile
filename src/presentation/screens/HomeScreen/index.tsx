import React, { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { GroupPrivacy, MemberRole } from "@localloop/shared-types";
import {
  type Coords,
  useCurrentLocation,
} from "@/application/hooks/useCurrentLocation";
import { useNearbyGroups } from "@/application/hooks/useNearbyGroups";
import { useMyGroups } from "@/application/hooks/useMyGroups";
import { useJoinGroup } from "@/application/hooks/useJoinGroup";
import type { HomeTabsScreenProps } from "@/presentation/navigation/types";
import HomeLayout from "./layout";

type Props = HomeTabsScreenProps<"Home">;

const LOCATION_DENIED_MESSAGE =
  "Precisamos da sua localização para mostrar grupos próximos.";
const FETCH_FAILED_MESSAGE =
  "Não foi possível carregar os grupos. Tente novamente.";

export default function HomeScreen({ navigation }: Props) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { request: requestLocation } = useCurrentLocation();
  const query = useNearbyGroups(coords);
  const myGroupsQuery = useMyGroups();
  const joinMutation = useJoinGroup();

  const fetchCoords = useCallback(async () => {
    const next = await requestLocation();
    if (!next) {
      setLocationDenied(true);
      setCoords(null);
      return null;
    }
    setLocationDenied(false);
    setCoords(next);
    return next;
  }, [requestLocation]);

  useFocusEffect(
    useCallback(() => {
      fetchCoords();
    }, [fetchCoords]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const next = await fetchCoords();
      if (next) await Promise.all([query.refetch(), myGroupsQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchCoords, query, myGroupsQuery]);

  const groups = query.data ?? [];
  const myGroups = myGroupsQuery.data ?? [];
  const errorMessage = locationDenied
    ? LOCATION_DENIED_MESSAGE
    : query.isError
      ? FETCH_FAILED_MESSAGE
      : null;

  return (
    <HomeLayout
      groups={groups}
      loading={query.isLoading && !!coords}
      refreshing={refreshing}
      errorMessage={errorMessage}
      onRefresh={handleRefresh}
      onPressGroup={(id) => {
        const group = groups.find((g) => g.id === id);
        if (!group) return;
        if (joinMutation.isPending) return;

        if (group.privacy === GroupPrivacy.OPEN) {
          joinMutation.mutate({ groupId: id, group });
          navigation.navigate("GroupChat", {
            groupId: id,
            groupName: group.name,
            anchorType: group.anchorType,
            myRole: MemberRole.MEMBER,
          });
          return;
        }

        Alert.alert(
          "Solicitar entrada?",
          `${group.name} requer aprovação de um moderador para participar. Deseja enviar uma solicitação?`,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Solicitar",
              onPress: async () => {
                try {
                  await joinMutation.mutateAsync({ groupId: id, group });
                  Alert.alert(
                    "Solicitação enviada",
                    "Aguarde a aprovação de um moderador para entrar no grupo.",
                  );
                } catch {
                  Alert.alert(
                    "Erro",
                    "Não foi possível enviar sua solicitação. Tente novamente.",
                  );
                }
              },
            },
          ],
        );
      }}
      myGroups={myGroups}
      myGroupsLoading={myGroupsQuery.isLoading}
      onPressMyGroup={(id) => {
        const group = myGroups.find((g) => g.id === id);
        if (!group) return;
        navigation.navigate("GroupChat", {
          groupId: id,
          groupName: group.name,
          anchorType: group.anchorType,
          myRole: group.myRole,
        });
      }}
      onPressViewAllMyGroups={() => navigation.navigate("MyGroups")}
    />
  );
}
