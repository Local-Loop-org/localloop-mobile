import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/icons';
import { Card } from '../atoms/Card';
import { SectionLabel } from '../atoms/SectionLabel';
import {
  SendPermPicker,
  type SendPermValue,
} from '../components/SendPermPicker';

interface StackHeaderProps {
  icon: IconName;
  label: string;
  meta: string;
}

function StackHeader({ icon, label, meta }: StackHeaderProps) {
  return (
    <View style={styles.stackHeader}>
      <Icon name={icon} size={13} color={colors.dim} strokeWidth={2} />
      <Text style={styles.stackLabel}>{label}</Text>
      <Text style={styles.stackMeta}>{meta}</Text>
    </View>
  );
}

interface SendPermSectionProps {
  sendPerm: SendPermValue;
  sendMediaPerm: SendPermValue;
  onSendPermChange: (value: SendPermValue) => void;
  onSendMediaPermChange: (value: SendPermValue) => void;
}

export function SendPermSection({
  sendPerm,
  sendMediaPerm,
  onSendPermChange,
  onSendMediaPermChange,
}: SendPermSectionProps) {
  return (
    <View>
      <SectionLabel label="QUEM PODE ENVIAR" />
      <Card style={styles.body}>
        <StackHeader icon="chat" label="Mensagens" meta="TEXTO · ÁUDIO" />
        <SendPermPicker
          value={sendPerm}
          onChange={onSendPermChange}
          testIdPrefix="send-perm"
        />
        <View style={styles.gap} />
        <StackHeader icon="image" label="Mídia" meta="FOTOS · VÍDEOS" />
        <SendPermPicker
          value={sendMediaPerm}
          onChange={onSendMediaPermChange}
          testIdPrefix="send-media-perm"
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: 10,
  },
  gap: {
    height: 10,
  },
  stackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 6,
  },
  stackLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.text,
  },
  stackMeta: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    color: colors.faint,
    letterSpacing: 0.6,
  },
});
