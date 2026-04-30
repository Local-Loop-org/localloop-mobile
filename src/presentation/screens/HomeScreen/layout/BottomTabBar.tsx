import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Icon, type IconName } from '@/shared/icons';
import { colors } from '@/shared/theme';
import { styles } from './styles';

export type TabId = 'Home' | 'Inbox' | 'CreateGroup' | 'Map' | 'Profile';

interface TabSpec {
  id: TabId;
  icon: IconName;
  label?: string;
  badge?: number;
}

const TABS: TabSpec[] = [
  { id: 'Home', icon: 'home', label: 'Início' },
  { id: 'Inbox', icon: 'chat', label: 'Inbox' },
  { id: 'CreateGroup', icon: 'plus' },
  { id: 'Map', icon: 'map', label: 'Mapa' },
  { id: 'Profile', icon: 'users', label: 'Perfil' },
];

interface Props {
  active: TabId;
  onPress: (tab: TabId) => void;
}

export function BottomTabBar({ active, onPress }: Props) {
  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isNew = tab.id === 'CreateGroup';
          const isActive = tab.id === active;
          const labelColor = isActive ? colors.text : colors.textSecondary;
          const iconColor = isNew
            ? colors.black
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
