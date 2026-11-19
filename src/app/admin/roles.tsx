import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { RestrictedScreen, RolePill } from '@/components/admin/role-pill';
import { useDialog } from '@/components/feedback/dialog-provider';
import { useToast } from '@/components/feedback/toast-provider';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/layout';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SelectSheet } from '@/components/ui/select-sheet';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { ROLE_INFO, type RoleName } from '@/constants/roles';
import { colors, radius, spacing } from '@/constants/theme';
import { useMembers, useSetMemberRole } from '@/hooks/use-admin';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuth } from '@/providers/auth-provider';
import type { Member } from '@/services/admin.service';
import { getErrorMessage } from '@/utils/errors';

const ROLE_OPTIONS = (Object.keys(ROLE_INFO) as RoleName[]).map((value) => ({
  value,
  label: ROLE_INFO[value].label,
  description: ROLE_INFO[value].description,
}));

/** Cargos e permissões (somente desenvolvedor). */
export default function RolesScreen() {
  const permissions = usePermissions();
  const { user } = useAuth();
  const dialog = useDialog();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const term = useDebouncedValue(search, 350);
  const canManage = permissions.can('manageRoles');
  const members = useMembers(term, canManage);
  const setRole = useSetMemberRole();
  const [editing, setEditing] = useState<Member | null>(null);

  if (!permissions.role) {
    return (
      <Screen>
        <ScreenHeader title="Cargos e permissões" />
        <Skeleton height={120} borderRadius={radius.xl} />
      </Screen>
    );
  }
  if (!canManage) return <RestrictedScreen title="Cargos e permissões" />;

  const change = async (member: Member, role: RoleName | null) => {
    setEditing(null);
    if (!role || role === member.role) return;
    const confirmed = await dialog.confirm({
      title: `Tornar ${ROLE_INFO[role].label.toLowerCase()}?`,
      message: `${member.full_name} passará a ter as permissões de ${ROLE_INFO[role].label}: ${ROLE_INFO[role].description}`,
      confirmLabel: 'Confirmar',
      icon: 'people-outline',
    });
    if (!confirmed) return;
    try {
      await setRole.mutateAsync({ userId: member.id, role });
      toast.success(`${member.full_name} agora é ${ROLE_INFO[role].label}.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Screen scroll keyboardAware>
      <ScreenHeader title="Cargos e permissões" />
      <View style={styles.sections}>
        <AppText variant="small" color={colors.textSecondary}>
          Toque em uma pessoa para mudar o cargo. Quem não tem cargo é Empreendedora. Só contas criadas no app aparecem
          aqui.
        </AppText>
        <TextField
          label="Buscar conta"
          placeholder="Nome ou e-mail"
          leftIcon="search-outline"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {members.isPending ? (
          <Skeleton height={160} borderRadius={radius.xl} />
        ) : members.isError ? (
          <ErrorState error={members.error} onRetry={() => members.refetch()} compact />
        ) : members.data.length === 0 ? (
          <EmptyState icon="person-outline" title="Nenhuma conta encontrada" message="Tente outro nome ou e-mail." compact />
        ) : (
          <Card padded={false}>
            {members.data.map((member, index) => {
              const isMe = member.id === user?.id;
              return (
                <Pressable
                  key={member.id}
                  onPress={() => (isMe ? toast.info('Você não pode alterar o próprio cargo.') : setEditing(member))}
                  accessibilityRole="button"
                  accessibilityLabel={`${member.full_name}, ${ROLE_INFO[member.role].label}`}
                  accessibilityHint={isMe ? undefined : 'Abre a lista de cargos'}
                  style={({ pressed }) => [styles.row, index > 0 ? styles.divider : null, pressed ? styles.pressed : null]}
                >
                  <Avatar name={member.full_name} size={40} />
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong" numberOfLines={1}>
                      {member.full_name}
                      {isMe ? ' (você)' : ''}
                    </AppText>
                    <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                      {member.email}
                    </AppText>
                  </View>
                  <RolePill role={member.role} />
                </Pressable>
              );
            })}
          </Card>
        )}
      </View>
      <SelectSheet
        visible={editing !== null}
        title={editing ? `Cargo de ${editing.full_name}` : 'Cargo'}
        options={ROLE_OPTIONS}
        selected={editing?.role ?? null}
        onSelect={(role) => editing && void change(editing, role)}
        onClose={() => setEditing(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.surfaceSunken,
  },
  flex: {
    flex: 1,
  },
});
