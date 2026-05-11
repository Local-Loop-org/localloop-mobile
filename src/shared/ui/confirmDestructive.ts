import { Alert } from 'react-native';

export interface ConfirmDestructiveOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
}

/**
 * Native two-button confirmation alert for destructive actions
 * (Sair do grupo, Excluir grupo, etc.). Keeps the call site to a single
 * declarative block and lets handlers focus on the post-confirm work.
 */
export function confirmDestructive(opts: ConfirmDestructiveOptions): void {
  Alert.alert(opts.title, opts.message, [
    { text: opts.cancelLabel ?? 'Cancelar', style: 'cancel' },
    {
      text: opts.confirmLabel,
      style: 'destructive',
      onPress: () => {
        void opts.onConfirm();
      },
    },
  ]);
}
