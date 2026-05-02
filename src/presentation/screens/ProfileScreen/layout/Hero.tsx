import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Icon } from '@/shared/icons';
import { colors } from '@/shared/theme';
import Avatar from './Avatar';
import NameField from './NameField';
import { styles } from './styles';

interface Props {
  displayName: string;
  avatarUrl: string | null;
  createdAt: string | null;
  onChangeName: (next: string) => void;
  onChangeAvatar: () => void;
}

function formatMembership(createdAt: string | null): string | null {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return `MEMBRO DESDE ${format(date, "dd MMM yyyy", { locale: ptBR }).toUpperCase()}`;
}

export default function Hero({
  displayName,
  avatarUrl,
  createdAt,
  onChangeName,
  onChangeAvatar,
}: Props) {
  const meta = formatMembership(createdAt);

  return (
    <View style={styles.hero}>
      <View style={styles.heroAvatarWrap}>
        <Avatar name={displayName} uri={avatarUrl} size={104} />
        <Pressable
          onPress={onChangeAvatar}
          style={styles.heroCameraBtn}
          accessibilityRole='button'
          accessibilityLabel='Alterar foto'
        >
          <Icon name='image' size={13} color={colors.background} strokeWidth={2.2} />
        </Pressable>
      </View>
      <View style={styles.heroNameWrap}>
        <NameField value={displayName} onChange={onChangeName} />
      </View>
      {meta ? <Text style={styles.heroMeta}>{meta}</Text> : null}
    </View>
  );
}
