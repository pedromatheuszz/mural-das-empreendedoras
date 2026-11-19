import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { RestrictedScreen, RolePill } from '@/components/admin/role-pill';
import { PendingClaimsSection } from '@/components/claims/pending-claims';
import { useToast } from '@/components/feedback/toast-provider';
import { StatusBadge } from '@/components/profiles/badges';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/layout';
import { ListGroup, ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states';
import { ROLE_INFO } from '@/constants/roles';
import { colors, radius, spacing } from '@/constants/theme';
import { useOpenReports, useResolveReport } from '@/hooks/use-admin';
import { usePermissions, useRefreshRoleOnFocus } from '@/hooks/use-permissions';
import { REPORT_REASONS } from '@/schemas/report.schema';
import type { OpenReport } from '@/services/admin.service';
import { getErrorMessage } from '@/utils/errors';
import { formatDate, pluralize } from '@/utils/format';

/** Painel da equipe do Mural: cargo, denúncias abertas e (desenvolvedor) gestão de cargos. */
export default function AdminPanelScreen() {
  const permissions = usePermissions();
  useRefreshRoleOnFocus();
  const reports = useOpenReports(permissions.can('manageReports'));

  if (!permissions.role) {
    return (
      <Screen>
        <ScreenHeader title="Painel da equipe" />
        <Skeleton height={120} borderRadius={radius.xl} />
      </Screen>
    );
  }
  if (!permissions.isStaff) return <RestrictedScreen title="Painel da equipe" />;

  const role = permissions.role;
  return (
    <Screen scroll>
      <ScreenHeader title="Painel da equipe" />
      <View style={styles.sections}>
        <Card style={styles.roleCard}>
          <AppText variant="eyebrow" color={colors.textMuted}>
            Seu cargo
          </AppText>
          <RolePill role={role} size="md" />
          <AppText variant="small" color={colors.textSecondary}>
            {ROLE_INFO[role].description}
          </AppText>
        </Card>

        {permissions.can('manageRoles') ? (
          <ListGroup title="Desenvolvedor">
            <ListRow
              icon="people-outline"
              title="Cargos e permissões"
              subtitle="Defina quem é administradora ou desenvolvedor"
              onPress={() => router.push('/admin/roles')}
            />
          </ListGroup>
        ) : null}

        {permissions.can('manageGroupProfiles') ? <PendingClaimsSection /> : null}

        <View style={styles.reports}>
          <AppText variant="heading" accessibilityRole="header">
            Denúncias abertas
          </AppText>
          {reports.isPending ? (
            <Skeleton height={140} borderRadius={radius.xl} />
          ) : reports.isError ? (
            <ErrorState error={reports.error} onRetry={() => reports.refetch()} compact />
          ) : reports.data.length === 0 ? (
            <EmptyState icon="checkmark-done-outline" title="Nenhuma denúncia aberta" message="Tudo em ordem no Mural." compact />
          ) : (
            <>
              <AppText variant="small" color={colors.textSecondary}>
                {pluralize(reports.data.length, 'denúncia aguardando análise', 'denúncias aguardando análise')}
              </AppText>
              {reports.data.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}

function ReportCard({ report }: { report: OpenReport }) {
  const toast = useToast();
  const resolve = useResolveReport();
  const reason = REPORT_REASONS.find((option) => option.value === report.reason)?.label ?? report.reason;

  const close = async (status: 'resolved' | 'dismissed') => {
    try {
      await resolve.mutateAsync({ reportId: report.id, status });
      toast.success(status === 'resolved' ? 'Denúncia marcada como resolvida.' : 'Denúncia descartada.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <AppText variant="subtitle" style={styles.flex} numberOfLines={2}>
          {report.business_name}
        </AppText>
        <StatusBadge status={report.publication_status} />
      </View>
      <AppText variant="smallStrong" color={colors.primary}>
        {reason}
      </AppText>
      {report.details ? <AppText variant="small">{report.details}</AppText> : null}
      <AppText variant="caption" color={colors.textMuted}>
        Recebida em {formatDate(report.created_at)}
      </AppText>
      <Button
        title="Ver e moderar perfil"
        icon="shield-checkmark-outline"
        size="md"
        variant="secondary"
        onPress={() => router.push({ pathname: '/admin/profile/[id]', params: { id: report.profile_id } })}
        fullWidth
      />
      <View style={styles.reportActions}>
        <Button title="Resolvida" icon="checkmark" size="md" variant="soft" onPress={() => close('resolved')} disabled={resolve.isPending} style={styles.flex} />
        <Button title="Descartar" size="md" variant="ghost" onPress={() => close('dismissed')} disabled={resolve.isPending} style={styles.flex} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  roleCard: {
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  reports: {
    gap: spacing.md,
  },
  reportCard: {
    gap: spacing.xs,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  reportActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
