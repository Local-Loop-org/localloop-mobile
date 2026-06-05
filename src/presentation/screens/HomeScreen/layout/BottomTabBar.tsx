import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Icon, type IconName } from '@/shared/icons';
import { useTheme } from '@/shared/theme/useTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createStyles, TAB_BAR_BASE_BOTTOM_PADDING } from './styles';
import { TabRoutes, type TabRoute } from '@/presentation/navigation/routes';

export type TabId = TabRoute;

interface TabSpec {
  id: TabId;
  icon: IconName;
  label?: string;
  badge?: number;
}

const TABS: TabSpec[] = [
  { id: TabRoutes.Home, icon: 'home', label: 'Início' },
  { id: TabRoutes.Inbox, icon: 'chat', label: 'Inbox' },
  { id: TabRoutes.CreateGroup, icon: 'plus' },
  { id: TabRoutes.Map, icon: 'map', label: 'Mapa' },
  { id: TabRoutes.Profile, icon: 'users', label: 'Perfil' },
];

interface Props {
  active: TabId;
  onPress: (tab: TabId) => void;
  bottomInset?: number;
}

export function BottomTabBar({ active, onPress, bottomInset = 0 }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: TAB_BAR_BASE_BOTTOM_PADDING + bottomInset }]}>
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isNew = tab.id === TabRoutes.CreateGroup;
          const isActive = tab.id === active;
          const labelColor = isActive ? colors.text : colors.textSecondary;
          const iconColor = isNew
            ? colors.accentInk
            : isActive
              ? colors.text
              : colors.textSecondary;
          return (
            <TouchableOpacity
              key={tab.id}
              accessibilityRole="button"
              accessibilityLabel={tab.label ?? 'Novo'}
              style={isNew ? styles.tabBtnNew : styles.tabBtn}
              onPress={() => onPress(tab.id)}
            >
              <Icon
                name={tab.icon}
                size={isNew ? 20 : 18}
                color={iconColor}
                strokeWidth={isNew ? 2.4 : 1.8}
              />
              {tab.label ? (
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              ) : null}
              {tab.badge ? (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
