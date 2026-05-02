import React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Icon } from '@/shared/icons';
import { colors } from '@/shared/theme';
import Hero from './Hero';
import SectionLabel from './SectionLabel';
import Card, { Divider } from './Card';
import Row from './Row';
import ToggleRow from './ToggleRow';
import SegmentRow from './SegmentRow';
import RadiusSlider from './RadiusSlider';
import DMPicker from './DMPicker';
import { styles } from './styles';
import type { ProfileLayoutProps } from './types';

export default function ProfileLayout({
  displayName,
  avatarUrl,
  createdAt,
  dmPermission,
  dmExceptions,
  candidateExceptions,
  radiusKm,
  notificationsEnabled,
  theme,
  language,
  onChangeName,
  onChangeAvatar,
  onChangeDmPermission,
  onAddDmException,
  onRemoveDmException,
  onChangeRadius,
  onToggleNotifications,
  onChangeTheme,
  onChangeLanguage,
  onPressPrivacy,
  onLogout,
  onDeleteAccount,
}: ProfileLayoutProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconBtn}>
          <Icon name='chevronLeft' size={17} color={colors.text} />
        </View>
        <Text style={styles.headerLabel}>PERFIL</Text>
        <Pressable
          style={styles.iconBtn}
          onPress={onLogout}
          accessibilityRole='button'
          accessibilityLabel='Sair'
        >
          <Icon name='logout' size={16} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps='handled'
      >
        <Hero
          displayName={displayName}
          avatarUrl={avatarUrl}
          createdAt={createdAt}
          onChangeName={onChangeName}
          onChangeAvatar={onChangeAvatar}
        />

        <SectionLabel>DESCOBERTA</SectionLabel>
        <Card>
          <RadiusSlider value={radiusKm} onChange={onChangeRadius} />
        </Card>

        <SectionLabel>QUEM PODE TE ENVIAR DM</SectionLabel>
        <DMPicker
          value={dmPermission}
          onChange={onChangeDmPermission}
          exceptions={dmExceptions}
          candidates={candidateExceptions}
          onAddException={onAddDmException}
          onRemoveException={onRemoveDmException}
        />

        <SectionLabel>NOTIFICAÇÕES</SectionLabel>
        <Card>
          <ToggleRow
            icon='bell'
            title='Receber notificações'
            sub={
              notificationsEnabled
                ? 'Mensagens, menções e novos grupos'
                : 'Silenciado'
            }
            value={notificationsEnabled}
            onChange={onToggleNotifications}
          />
        </Card>

        <SectionLabel>APARÊNCIA & IDIOMA</SectionLabel>
        <Card>
          <SegmentRow
            icon='sparkle'
            title='Tema'
            options={[
              { id: 'dark', label: 'Escuro' },
              { id: 'light', label: 'Claro' },
            ]}
            value={theme}
            onChange={onChangeTheme}
          />
          <Divider />
          <SegmentRow
            icon='globe'
            title='Idioma'
            options={[
              { id: 'pt', label: 'PT' },
              { id: 'en', label: 'EN' },
            ]}
            value={language}
            onChange={onChangeLanguage}
          />
        </Card>

        <SectionLabel>SOBRE</SectionLabel>
        <Card>
          <Row
            icon='shield'
            title='Privacidade & Termos'
            onPress={onPressPrivacy}
          />
        </Card>

        <Pressable
          style={styles.outlinedBtn}
          onPress={onLogout}
          accessibilityRole='button'
          accessibilityLabel='Sair'
        >
          <Icon name='logout' size={13} color={colors.text} strokeWidth={2} />
          <Text style={styles.outlinedBtnText}>Sair</Text>
        </Pressable>
        <Pressable
          style={styles.dangerBtn}
          onPress={onDeleteAccount}
          accessibilityRole='button'
          accessibilityLabel='Excluir conta permanentemente'
        >
          <Text style={styles.dangerBtnText}>
            Excluir conta permanentemente
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
