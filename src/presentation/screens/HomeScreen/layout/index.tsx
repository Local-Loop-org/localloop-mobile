import React from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { AnchorType } from "@localloop/shared-types";
import { colors } from "@/shared/theme";
import { ANCHOR_SECTION_LABELS } from "@/shared/anchor/labels";
import { anchorIconName } from "@/shared/icons/anchorIcon";
import type { NearbyGroup } from "@/infra/api/groups.api";
import { styles } from "./styles";
import type { HomeLayoutProps } from "./types";
import { HomeHeader } from "./HomeHeader";
import { DiscoverDivider } from "./DiscoverDivider";
import { SectionLabel } from "./SectionLabel";
import { DiscoverCard } from "./DiscoverCard";
import { DiscoverRow } from "./DiscoverRow";
import { MyGroupRow } from "./MyGroupRow";

type Variant = "horizontal" | "vertical";

interface SectionSpec {
  type: AnchorType;
}

/**
 * Render order matches the design: places + events as horizontal scrollers,
 * neighborhoods + condos as vertical lists in between. City groups are
 * intentionally excluded — there is no slot for them in the design.
 */
const SECTION_ORDER: SectionSpec[] = Object.values(AnchorType)
  .filter((type) => typeof type === "string")
  .map((type) => ({ type: type as AnchorType }));

function bucketByAnchor(groups: NearbyGroup[]): Map<AnchorType, NearbyGroup[]> {
  const map = new Map<AnchorType, NearbyGroup[]>();
  for (const g of groups) {
    const list = map.get(g.anchorType) ?? [];
    list.push(g);
    map.set(g.anchorType, list);
  }
  return map;
}

export default function HomeLayout({
  groups,
  loading,
  refreshing,
  errorMessage,
  onRefresh,
  onPressGroup,
  myGroups,
  myGroupsLoading,
  onPressMyGroup,
  onPressViewAllMyGroups,
}: HomeLayoutProps) {
  const showInitialLoader = loading && groups.length === 0 && !errorMessage;
  const showEmpty = !loading && !errorMessage && groups.length === 0;
  const buckets = bucketByAnchor(groups);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <HomeHeader onPressSearch={() => {}} />

        {!myGroupsLoading && myGroups.length > 0 ? (
          <>
            <SectionLabel
              iconName="users"
              title="Meus grupos"
              count={myGroups.length}
              onPressSeeAll={onPressViewAllMyGroups}
            />
            <View style={styles.verticalList}>
              {myGroups.map((g) => (
                <MyGroupRow key={g.id} group={g} onPress={onPressMyGroup} />
              ))}
            </View>
          </>
        ) : null}

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {showInitialLoader ? (
          <View style={styles.centerWrapper}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : null}

        {showEmpty ? (
          <View style={styles.centerWrapper}>
            <Text style={styles.emptyTitle}>Nenhum grupo por aqui ainda</Text>
            <Text style={styles.emptySubtitle}>
              Seja o primeiro a criar um grupo na sua região.
            </Text>
          </View>
        ) : null}

        {!showInitialLoader && !showEmpty ? (
          <>
            <DiscoverDivider />
            {SECTION_ORDER.map(({ type }) => {
              const items = buckets.get(type);
              if (!items || items.length === 0) return null;
              return (
                <View key={type}>
                  <SectionLabel
                    iconName={anchorIconName(type)}
                    title={ANCHOR_SECTION_LABELS[type]}
                    count={items.length}
                  />
                  {items.length > 1 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalRow}
                    >
                      {items.map((g) => (
                        <DiscoverCard
                          key={g.id}
                          group={g}
                          onPress={onPressGroup}
                        />
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.verticalList}>
                      {items.map((g) => (
                        <DiscoverRow
                          key={g.id}
                          group={g}
                          onPress={onPressGroup}
                        />
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
