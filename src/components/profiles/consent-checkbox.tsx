import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { APP_NAME } from '@/constants/app';
import { colors } from '@/constants/theme';

import { AppText } from '../ui/app-text';
import { Checkbox } from '../ui/checkbox';

type ConsentCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
};

/** Consentimento explícito para divulgação pública (LGPD). */
export function ConsentCheckbox({ checked, onChange, error }: ConsentCheckboxProps) {
  return (
    <Checkbox
      checked={checked}
      onChange={onChange}
      error={error}
      accessibilityLabel={`Autorizo a divulgação pública do meu nome e das informações deste perfil no ${APP_NAME}`}
      label={
        <AppText variant="small" color={colors.textSecondary}>
          Autorizo a divulgação pública do meu nome, da minha marca e das informações deste perfil no {APP_NAME}. Posso
          retirar o perfil do Mural quando quiser. Saiba mais na{' '}
          <AppText
            variant="smallStrong"
            color={colors.accentText}
            style={styles.link}
            onPress={() => router.push('/legal/privacy')}
            accessibilityRole="link"
          >
            Política de Privacidade
          </AppText>
          .
        </AppText>
      }
    />
  );
}

const styles = StyleSheet.create({
  link: {
    textDecorationLine: 'underline',
  },
});
