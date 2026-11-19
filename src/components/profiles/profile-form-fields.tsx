import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { useController, useWatch, type Control } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { LIMITS } from '@/constants/app';
import { CATEGORIES } from '@/constants/categories';
import { BRAZILIAN_STATES } from '@/constants/locations';
import { COMMUNITY_PERKS } from '@/constants/perks';
import { colors, radius, spacing } from '@/constants/theme';
import type { ProfileFormOutput, ProfileFormValues } from '@/schemas/profile.schema';

import { AppText } from '../ui/app-text';
import { Chip } from '../ui/chip';
import { FormTextField } from '../ui/form-fields';
import { SelectSheet } from '../ui/select-sheet';
import { SwitchRow } from '../ui/switch-row';
import { ImagePickerField } from './image-picker-field';
import { PressableScale } from '../ui/pressable-scale';

type FormControl = Control<ProfileFormValues, unknown, ProfileFormOutput>;

function FieldGroupTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.groupTitle}>
      <AppText variant="smallStrong">{title}</AppText>
      {hint ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

function CategoryField({ control }: { control: FormControl }) {
  const { field } = useController({ control, name: 'category' });
  return (
    <View style={styles.fieldGroup}>
      <FieldGroupTitle title="Categoria de atuação (opcional)" hint="Ajuda as pessoas a encontrarem você nos filtros do Mural." />
      <View style={styles.wrap} accessibilityRole="radiogroup">
        {CATEGORIES.map((category) => (
          <Chip
            key={category.slug}
            label={category.label}
            icon={category.icon}
            size="sm"
            selected={field.value === category.slug}
            onPress={() => field.onChange(field.value === category.slug ? null : category.slug)}
          />
        ))}
      </View>
    </View>
  );
}

function PerksField({ control }: { control: FormControl }) {
  const { field } = useController({ control, name: 'communityPerks' });
  const selected = field.value ?? [];
  const toggle = (slug: (typeof selected)[number]) =>
    field.onChange(selected.includes(slug) ? selected.filter((item) => item !== slug) : [...selected, slug]);
  return (
    <View style={styles.fieldGroup}>
      <FieldGroupTitle
        title="Cortesia para outras empreendedoras (opcional)"
        hint="Ninguém precisa oferecer cortesia para estar no Mural. Se quiser, escolha uma ou mais."
      />
      <View style={styles.wrap}>
        {COMMUNITY_PERKS.map((perk) => (
          <Chip
            key={perk.slug}
            label={perk.label}
            size="sm"
            selected={selected.includes(perk.slug)}
            onPress={() => toggle(perk.slug)}
          />
        ))}
      </View>
    </View>
  );
}

function StateField({ control }: { control: FormControl }) {
  const { field } = useController({ control, name: 'state' });
  const [open, setOpen] = useState(false);
  const selected = BRAZILIAN_STATES.find((state) => state.uf === field.value);
  return (
    <View style={styles.fieldGroup}>
      <AppText variant="smallStrong">
        Estado{' '}
        <AppText variant="small" color={colors.textMuted}>
          (opcional)
        </AppText>
      </AppText>
      <PressableScale
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Estado: ${selected ? selected.name : 'não selecionado'}`}
        accessibilityHint="Abre a lista de estados"
        scaleTo={1}
        style={styles.select}
        pressedStyle={styles.selectPressed}
      >
        <Ionicons name="map-outline" size={20} color={colors.textMuted} />
        <AppText variant="body" color={selected ? colors.text : colors.textMuted} style={styles.flex}>
          {selected ? `${selected.name} (${selected.uf})` : 'Selecione o estado'}
        </AppText>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </PressableScale>
      <SelectSheet
        visible={open}
        title="Estado"
        options={BRAZILIAN_STATES.map((state) => ({ value: state.uf, label: `${state.name} (${state.uf})` }))}
        selected={field.value ?? null}
        onSelect={(value) => field.onChange(value)}
        onClose={() => setOpen(false)}
        clearLabel="Não informar"
      />
    </View>
  );
}

/** Etapa 1 — identidade da marca. */
export function IdentityFields({ control }: { control: FormControl }) {
  return (
    <View style={styles.section}>
      <FormTextField
        control={control}
        name="businessName"
        label="Nome da marca ou empresa"
        helper="Como o seu negócio é conhecido."
        placeholder="Ex.: Doces da Ana"
        maxLength={LIMITS.businessName.max}
        showCounter
        autoCapitalize="words"
        returnKeyType="next"
      />
      <FormTextField
        control={control}
        name="entrepreneurName"
        label="Nome da empreendedora responsável"
        helper="Como você quer ser apresentada no Mural."
        placeholder="Ex.: Ana Souza"
        maxLength={LIMITS.entrepreneurName.max}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
      />
      <CategoryField control={control} />
    </View>
  );
}

/** Etapa 2 — serviços e cortesias. */
export function ServicesFields({ control }: { control: FormControl }) {
  return (
    <View style={styles.section}>
      <FormTextField
        control={control}
        name="serviceDescription"
        label="O que você faz?"
        helper="Escreva como explicaria para uma amiga: o que oferece, para quem, seu segmento e seus diferenciais."
        placeholder="Ex.: Faço bolos decorados e doces finos por encomenda para aniversários e casamentos, com entrega em Joinville e região."
        multiline
        maxLength={LIMITS.description.max}
        showCounter
        autoCapitalize="sentences"
      />
      <PerksField control={control} />
    </View>
  );
}

/** Etapa 3 — imagens (opcionais). */
export function ImagesFields({ control }: { control: FormControl }) {
  const logo = useController({ control, name: 'logoUri' });
  const photo = useController({ control, name: 'photoUri' });
  const [businessName, entrepreneurName] = useWatch({ control, name: ['businessName', 'entrepreneurName'] });
  return (
    <View style={styles.section}>
      <ImagePickerField
        kind="logo"
        label="Logotipo ou imagem da marca"
        helper="Imagem quadrada, de preferência com fundo claro."
        value={logo.field.value ?? null}
        onChange={logo.field.onChange}
        name={businessName || 'Sua marca'}
      />
      <ImagePickerField
        kind="photo"
        label="Sua foto de perfil"
        helper="Uma foto sua ajuda a criar confiança e conexão."
        value={photo.field.value ?? null}
        onChange={photo.field.onChange}
        name={entrepreneurName || 'Você'}
      />
      <View style={styles.tip}>
        <Ionicons name="shield-checkmark-outline" size={18} color={colors.textSecondary} />
        <AppText variant="small" color={colors.textSecondary} style={styles.flex}>
          As imagens são reduzidas antes do envio e ficam visíveis no seu perfil público após a publicação.
        </AppText>
      </View>
    </View>
  );
}

/** Etapa 4 — localização e contatos. */
export function LocationContactFields({ control }: { control: FormControl }) {
  const nationwide = useController({ control, name: 'servesNationwide' });
  return (
    <View style={styles.section}>
      <FormTextField
        control={control}
        name="city"
        label="Cidade"
        optional
        placeholder="Ex.: Joinville"
        maxLength={LIMITS.city.max}
        autoCapitalize="words"
        leftIcon="location-outline"
      />
      <StateField control={control} />
      <View style={styles.switchCard}>
        <SwitchRow
          title="Atendo todo o Brasil"
          description="Online, por envio ou com deslocamento."
          value={nationwide.field.value === true}
          onValueChange={nationwide.field.onChange}
        />
      </View>
      <FormTextField
        control={control}
        name="contact"
        label="WhatsApp ou link de contato"
        optional
        helper="É por aqui que vão te chamar. Informe o WhatsApp com DDD ou um link (agenda, catálogo...)."
        placeholder="(11) 91234-5678"
        leftIcon="logo-whatsapp"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={LIMITS.url.max}
      />
      <FormTextField
        control={control}
        name="social"
        label="Instagram ou outra rede social"
        optional
        placeholder="@suamarca ou link"
        leftIcon="logo-instagram"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={LIMITS.url.max}
      />
      <FormTextField
        control={control}
        name="website"
        label="Site"
        optional
        placeholder="www.suamarca.com.br"
        leftIcon="globe-outline"
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={LIMITS.url.max}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  groupTitle: {
    gap: 2,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  selectPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  switchCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tip: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  flex: {
    flex: 1,
  },
});
