import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MemberRole } from '@localloop/shared-types';
import { colors } from '@/shared/theme';
import { GradientButton } from '@/presentation/screens/CreateGroupScreen/layout/atoms/GradientButton';
import { LocationSection } from '@/presentation/screens/CreateGroupScreen/layout/sections/LocationSection';
import { VisibilitySection } from '@/presentation/screens/CreateGroupScreen/layout/sections/VisibilitySection';
import { PrivacySection } from '@/presentation/screens/CreateGroupScreen/layout/sections/PrivacySection';
import { Hero } from './components/Hero';
import { HeaderBar } from './sections/HeaderBar';
import { RequestsSection } from './sections/RequestsSection';
import { MembersSection } from './sections/MembersSection';
import { AboutStatsSection } from './sections/AboutStatsSection';
import { PermissionsSummarySection } from './sections/PermissionsSummarySection';
import { DangerSection } from './sections/DangerSection';
import { styles } from './styles';
import type { GroupDetailLayoutProps, JoinButtonState } from './types';
import type { RolePillRole } from './atoms/RolePill';

const PLACEHOLDER_RADIUS_KM = 2;

const JOIN_BUTTON_LABEL: Record<JoinButtonState, string> = {
  join: 'Entrar no grupo',
  pending: 'Aguardando aprovação',
  joined: 'Você já faz parte',
};

function pillRoleFor(
  myRole: MemberRole | null,
  joinButtonState: JoinButtonState,
): RolePillRole | null {
  if (myRole) return myRole;
  if (joinButtonState === 'pending') return 'pending';
  return null;
}

function formatCreatedAt(iso: string | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `CRIADO EM ${format(date, 'dd MMM yyyy', { locale: ptBR }).toUpperCase()}`;
}

export default function GroupDetailLayout({
  group,
  loading,
  errorMessage,
  joinButtonState,
  isJoining,
  onJoin,
  onBack,
  showModerationSection,
  pendingRequests,
  resolvingRequestId,
  onApproveRequest,
  onRejectRequest,
  onPressMembers,
  members,
  isLeaving,
  isDeleting,
  onLeave,
  onPressDelete,
}: GroupDetailLayoutProps) {
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage || !group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {errorMessage ?? 'Grupo não encontrado.'}
          </Text>
          <Pressable
            style={styles.errorBack}
            onPress={onBack}
            accessibilityRole="button"
          >
            <Text style={styles.errorBackText}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const myRole = group.myRole;
  const isActiveMember = myRole !== null;
  const isPrivileged =
    myRole === MemberRole.OWNER || myRole === MemberRole.MODERATOR;
  const showAboutStats = !isPrivileged;
  const showLocationCard = isPrivileged;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HeaderBar onBack={onBack} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Hero
          name={group.name}
          description={group.description}
          anchorType={group.anchorType}
          anchorLabel={group.anchorLabel}
          memberCount={group.memberCount}
          members={members}
          role={pillRoleFor(myRole, joinButtonState)}
          onPressMembers={onPressMembers}
        />

        {showModerationSection ? (
          <RequestsSection
            requests={pendingRequests.map((r) => ({
              id: r.id,
              displayName: r.displayName,
            }))}
            resolvingRequestId={resolvingRequestId}
            onApprove={onApproveRequest}
            onReject={onRejectRequest}
          />
        ) : null}

        <MembersSection
          memberCount={group.memberCount}
          members={members}
          onPressViewAll={onPressMembers}
        />

        {showAboutStats ? (
          <AboutStatsSection
            memberCount={group.memberCount}
            anchorType={group.anchorType}
            anchorLabel={group.anchorLabel}
            privacy={group.privacy}
          />
        ) : null}

        {showLocationCard ? (
          <LocationSection
            placeType={group.anchorType}
            anchorLabel={group.anchorLabel}
            readOnly
          />
        ) : null}

        <VisibilitySection radiusKm={PLACEHOLDER_RADIUS_KM} readOnly />

        {!showAboutStats ? (
          <PrivacySection value={group.privacy} readOnly />
        ) : null}

        <PermissionsSummarySection />

        {isActiveMember ? (
          <DangerSection
            role={myRole}
            isLeaving={isLeaving}
            isDeleting={isDeleting}
            onLeave={onLeave}
            onDelete={onPressDelete}
          />
        ) : (
          <View style={styles.joinWrap}>
            <GradientButton
              label={
                isJoining ? 'Entrando...' : JOIN_BUTTON_LABEL[joinButtonState]
              }
              leadingIcon="check"
              loading={isJoining}
              disabled={joinButtonState !== 'join'}
              onPress={onJoin}
              testID="join-group-cta"
            />
            {joinButtonState === 'pending' ? (
              <Text style={styles.joinHint}>
                AGUARDANDO APROVAÇÃO DE UM MODERADOR
              </Text>
            ) : null}
          </View>
        )}

        {(() => {
          const caption = formatCreatedAt(group.createdAt);
          return caption ? (
            <Text style={styles.createdAt} testID="group-created-at">
              {caption}
            </Text>
          ) : null;
        })()}
      </ScrollView>
    </SafeAreaView>
  );
}
