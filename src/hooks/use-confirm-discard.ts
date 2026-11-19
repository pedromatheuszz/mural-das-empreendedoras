import { usePreventRemove } from 'expo-router';

import { useDialog } from '@/components/feedback/dialog-provider';

/**
 * Pede confirmação antes de sair de um formulário com alterações não salvas
 * (botão voltar, gesto de voltar e botão físico do Android).
 * Retorna uma função para liberar a saída após salvar com sucesso.
 */
export function useConfirmDiscard(hasChanges: boolean): () => void {
  const dialog = useDialog();
  return usePreventRemove(hasChanges, ({ repeat }) => {
    void dialog
      .confirm({
        title: 'Descartar alterações?',
        message: 'As informações que você preencheu e ainda não salvou serão perdidas.',
        confirmLabel: 'Descartar',
        cancelLabel: 'Continuar editando',
        destructive: true,
        icon: 'alert-circle-outline',
      })
      .then((confirmed) => {
        if (confirmed) repeat();
      });
  });
}
