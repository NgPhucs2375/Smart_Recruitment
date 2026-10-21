import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Link2, Mail, UserPlus, UserX, X } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Radius } from '@/constants/theme';
import { hrNhanSuApi } from '@/features/hr/api/hr-api';
import { useHrActionDialog } from '@/features/hr/components/action-dialog';
import { FormField } from '@/features/hr/components/form-field';
import {
  HrEmptyState,
  HrErrorState,
  HrLoadingState,
  HrScreenShell,
  HrTopBar,
  NoticeBar,
} from '@/features/hr/components/hr-primitives';
import { useHrRole } from '@/features/hr/hooks/use-hr-role';
import type { LoiMoiPending, NhanSu } from '@/features/hr/types';
import { useTheme } from '@/hooks/use-theme';

function roleName(vaiTro: string): string {
  const key = vaiTro.trim().toUpperCase();
  if (key === 'NGUOI_DAI_DIEN') return 'Người đại diện';
  if (key === 'NHAN_SU') return 'Nhân sự';
  if (key === 'QUAN_TRI_VIEN') return 'Quản trị viên';
  return vaiTro || 'Thành viên';
}

function initials(name: string): string {
  return (name || 'NV').slice(0, 2).toUpperCase();
}

export function NhanSuScreen() {
  const theme = useTheme();
  const { isNdd } = useHrRole();
  const { dialog, confirm } = useHrActionDialog();

  const [members, setMembers] = useState<NhanSu[]>([]);
  const [invites, setInvites] = useState<LoiMoiPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actingId, setActingId] = useState<number | null>(null);

  const [email, setEmail] = useState('');
  const [hoTen, setHoTen] = useState('');
  const [chucVu, setChucVu] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [memberRows, pendingRows] = await Promise.all([
        hrNhanSuApi.list(),
        hrNhanSuApi.listPendingInvites().catch(() => [] as LoiMoiPending[]),
      ]);
      if (!mountedRef.current) return;
      setMembers(memberRows);
      setInvites(pendingRows);
    } catch (reason) {
      if (!mountedRef.current) return;
      setError(reason instanceof Error ? reason.message : 'Không tải được danh sách nhân sự.');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Tải ban đầu — hoãn 1 tick, không setState đồng bộ trong effect (react-hooks/set-state-in-effect).
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const handleInvite = async () => {
    if (inviting) return;
    if (!email.trim() || !hoTen.trim()) {
      setFieldError(!email.trim() ? 'email' : 'hoTen');
      setError('Cần nhập email và họ tên trước khi gửi lời mời.');
      return;
    }
    try {
      setInviting(true);
      setError('');
      setSuccess('');
      setFieldError(null);
      const result = await hrNhanSuApi.invite(email, hoTen, chucVu);
      if (!mountedRef.current) return;
      setSuccess(
        result.inviteLink
          ? `${result.message} • Link: ${result.inviteLink}`
          : result.message || `Đã gửi lời mời tới ${email.trim()}.`,
      );
      setEmail('');
      setHoTen('');
      setChucVu('');
      await load(true);
    } catch (reason) {
      if (!mountedRef.current) return;
      setError(reason instanceof Error ? reason.message : 'Không gửi được lời mời.');
    } finally {
      if (mountedRef.current) setInviting(false);
    }
  };

  const handleCancelInvite = async (invite: LoiMoiPending) => {
    if (actingId !== null) return;
    const ok = await confirm({
      title: 'Hủy lời mời',
      description: `Hủy lời mời gửi tới ${invite.email}?`,
      confirmLabel: 'Hủy lời mời',
      destructive: true,
    });
    if (!ok) return;
    try {
      setActingId(invite.id);
      const message = await hrNhanSuApi.cancelInvite(invite.id);
      if (!mountedRef.current) return;
      setSuccess(message || 'Đã hủy lời mời.');
      await load(true);
    } catch (reason) {
      if (mountedRef.current) setError(reason instanceof Error ? reason.message : 'Không hủy được lời mời.');
    } finally {
      if (mountedRef.current) setActingId(null);
    }
  };

  const handleRemove = async (member: NhanSu) => {
    if (actingId !== null) return;
    const ok = await confirm({
      title: 'Xóa nhân sự',
      description: `${member.hoTen} sẽ mất quyền truy cập trang nhà tuyển dụng. Tiếp tục?`,
      confirmLabel: 'Xóa',
      destructive: true,
    });
    if (!ok) return;
    try {
      setActingId(member.nguoiDungId);
      const message = await hrNhanSuApi.remove(member.hoSoId, member.nguoiDungId);
      if (!mountedRef.current) return;
      setSuccess(message || `Đã xóa ${member.hoTen}.`);
      await load(true);
    } catch (reason) {
      if (mountedRef.current) setError(reason instanceof Error ? reason.message : 'Không xóa được nhân sự.');
    } finally {
      if (mountedRef.current) setActingId(null);
    }
  };

  return (
    <HrScreenShell>
      {dialog}
      <HrTopBar title="Nhân sự doanh nghiệp" />
      {!isNdd ? (
        <HrEmptyState
          title="Chỉ Người đại diện quản lý nhân sự"
          description="Tài khoản Nhân sự chỉ xem danh sách thành viên; mời/xóa thuộc vai trò Người đại diện."
          action={
            <Button variant="outline" pill onPress={() => router.push('/(hr)')} style={styles.emptyAction}>
              Về tổng quan
            </Button>
          }
        />
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load(true);
              }}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }>
          <ThemedText style={[styles.pageDesc, { color: theme.textSecondary }]} type="small">
            Mời đồng nghiệp tham gia quản lý tuyển dụng cùng doanh nghiệp. Người đại diện có toàn
            quyền; Nhân sự phụ trách tin và ứng viên của mình.
          </ThemedText>

          {success ? <NoticeBar kind="success" message={success} /> : null}
          {error ? <NoticeBar kind="error" message={error} /> : null}

          {/* Form mời */}
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={styles.cardHead}>
              <View style={[styles.cardIcon, { backgroundColor: `${theme.primary}14` }]}>
                <UserPlus size={16} color={theme.primary} />
              </View>
              <ThemedText style={styles.cardTitle} type="smallBold">
                Mời nhân sự mới
              </ThemedText>
            </View>
            <FormField
              label="Email"
              required
              value={email}
              onChangeText={setEmail}
              placeholder="ten@congty.vn"
              keyboardType="email-address"
              autoCapitalize="none"
              invalid={fieldError === 'email'}
            />
            <FormField
              label="Họ tên"
              required
              value={hoTen}
              onChangeText={setHoTen}
              placeholder="Nguyễn Văn A"
              invalid={fieldError === 'hoTen'}
            />
            <FormField
              label="Chức vụ"
              value={chucVu}
              onChangeText={setChucVu}
              placeholder="Chuyên viên tuyển dụng"
            />
            <Button
              pill
              disabled={inviting}
              onPress={() => void handleInvite()}
              icon={<Mail size={15} color={theme.primaryForeground} />}>
              {inviting ? 'Đang gửi...' : 'Gửi lời mời'}
            </Button>
            <ThemedText style={{ color: theme.textSecondary }} type="code">
              Hệ thống tạo link mời (accept-invite) — gửi cho người được mời để họ kích hoạt tài khoản.
            </ThemedText>
          </View>

          {/* Lời mời đang chờ */}
          {invites.length > 0 ? (
            <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText style={styles.sectionTitle} type="smallBold">
                Lời mời đang chờ ({invites.length})
              </ThemedText>
              {invites.map((invite) => (
                <View key={invite.id} style={[styles.memberRow, { borderTopColor: theme.border }]}>
                  <View style={styles.flex}>
                    <ThemedText type="small" numberOfLines={1}>
                      {invite.hoTen || invite.email}
                    </ThemedText>
                    <ThemedText style={{ color: theme.textSecondary }} type="code" numberOfLines={1}>
                      {invite.email}
                      {invite.chucVu ? ` • ${invite.chucVu}` : ''}
                      {invite.ngayHetHan ? ` • Hạn ${new Date(invite.ngayHetHan).toLocaleDateString('vi-VN')}` : ''}
                    </ThemedText>
                    {invite.inviteLink ? (
                      <ThemedText style={{ color: theme.primary }} type="code" numberOfLines={1}>
                        {invite.inviteLink}
                      </ThemedText>
                    ) : null}
                  </View>
                  <Button
                    variant="ghost"
                    size="icon"
                    accessibilityLabel="Hủy lời mời"
                    disabled={actingId === invite.id}
                    onPress={() => void handleCancelInvite(invite)}
                    icon={<X size={16} color={theme.destructive} />}
                  />
                </View>
              ))}
            </View>
          ) : null}

          {/* Thành viên */}
          {loading ? (
            <HrLoadingState label="Đang tải nhân sự…" />
          ) : error && members.length === 0 ? (
            <HrErrorState message={error} onRetry={() => void load()} />
          ) : members.length === 0 ? (
            <HrEmptyState title="Chưa có nhân sự" description="Mời đồng nghiệp để cùng quản lý tuyển dụng." />
          ) : (
            <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText style={styles.sectionTitle} type="smallBold">
                Thành viên ({members.length})
              </ThemedText>
              {members.map((member) => {
                const removable = member.vaiTro.trim().toUpperCase() === 'NHAN_SU';
                const busy = actingId === member.nguoiDungId;
                return (
                  <View key={`${member.nguoiDungId}-${member.hoSoId}`} style={[styles.memberRow, { borderTopColor: theme.border }]}>
                    <View style={[styles.avatar, { backgroundColor: `${theme.primary}14` }]}>
                      <ThemedText style={{ color: theme.primary }} type="code">
                        {initials(member.hoTen)}
                      </ThemedText>
                    </View>
                    <View style={styles.flex}>
                      <View style={styles.nameRow}>
                        <ThemedText type="small" numberOfLines={1}>
                          {member.hoTen || member.email}
                        </ThemedText>
                        <ThemedText style={[styles.roleTag, { color: theme.primary, backgroundColor: `${theme.primary}14` }]} type="code">
                          {roleName(member.vaiTro)}
                        </ThemedText>
                      </View>
                      <ThemedText style={{ color: theme.textSecondary }} type="code" numberOfLines={1}>
                        {member.email}
                        {member.chucVu ? ` • ${member.chucVu}` : ''}
                        {!member.isActive ? ' • đã khóa' : ''}
                      </ThemedText>
                    </View>
                    {removable ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        accessibilityLabel={`Xóa ${member.hoTen}`}
                        disabled={busy}
                        onPress={() => void handleRemove(member)}
                        icon={<UserX size={16} color={theme.destructive} />}
                      />
                    ) : null}
                  </View>
                );
              })}
              <View style={styles.memberNote}>
                <Link2 size={13} color={theme.textSecondary} />
                <ThemedText style={{ color: theme.textSecondary }} type="code">
                  Không thể xóa Người đại diện — hãy đổi vai trò trên trang quản trị Web.
                </ThemedText>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </HrScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 48 },
  emptyAction: { marginTop: 8 },
  pageDesc: { lineHeight: 18 },
  card: { borderRadius: Radius.xl, borderWidth: 1, padding: 14, gap: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: { width: 32, height: 32, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15 },
  sectionTitle: { fontSize: 14 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 36, height: 36, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  roleTag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: Radius.pill },
  memberNote: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4 },
});
