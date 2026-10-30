import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ArrowRight, FilePlus2, LogOut, Pencil, Settings } from 'lucide-react-native';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { font, Radius } from '@/constants/theme';
import { useAuth } from '@/features/auth';
import { applicationsApi } from '@/features/applications/api/applications-api';
import type { ApplicationsResult } from '@/features/applications/types';
import { cvApi } from '@/features/cv/api/cv-api';
import type { CvsResult } from '@/features/cv/types';
import { profileApi } from '@/features/profile/api/profile-api';
import {
  ApplicationRow,
  CvRow,
  ListSurface,
  ProfileEmptyState,
  ProfileInfoCard,
  ProfileSkeletonRows,
  SectionHeading,
} from '@/features/profile/components/profile-sections';
import type { CandidateProfile } from '@/features/profile/types';
import { useTheme } from '@/hooks/use-theme';

type ProfileData = {
  profile: CandidateProfile;
  hasProfile: boolean;
  applications: ApplicationsResult;
  cvs: CvsResult;
  applicationsError: string | null;
  cvsError: string | null;
  demo: boolean;
};

const EMPTY_APPLICATIONS: ApplicationsResult = { items: [], totalCount: 0, source: 'api' };
const EMPTY_CVS: CvsResult = { items: [], source: 'api' };

function accountProfile(name: string, email: string): CandidateProfile {
  return {
    fullName: name,
    email,
    phone: '',
    location: '',
    title: '',
    bio: '',
    expectedSalary: 0,
    birthDate: '',
    gender: '',
    openToWork: false,
  };
}

function errorMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback;
}

/** % hoàn thiện hồ sơ — clone getProfileCompletion của Web /dashboard. */
function completionOf(profile: CandidateProfile, hasProfile: boolean): { percent: number; missing: number } {
  if (!hasProfile) return { percent: 0, missing: 7 };
  const fields = [
    profile.fullName,
    profile.phone,
    profile.location,
    profile.title,
    profile.expectedSalary > 0,
    profile.bio,
    profile.avatarUrl,
  ];
  const completed = fields.filter((value) => Boolean(value)).length;
  return { percent: Math.round((completed / fields.length) * 100), missing: fields.length - completed };
}

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const [data, setData] = useState<ProfileData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fallbackName = user?.fullname || user?.userName || user?.email || 'Người dùng';
  const fallbackEmail = user?.email ?? '';

  const fetchProfileData = useCallback(async (): Promise<ProfileData> => {
    const [profileResult, applicationsResult, cvsResult] = await Promise.allSettled([
      profileApi.getMine({ name: fallbackName, email: fallbackEmail }),
      applicationsApi.listRecent(4),
      cvApi.listMine(),
    ]);

    const loadedProfile = profileResult.status === 'fulfilled' ? profileResult.value.profile : null;
    const profile = loadedProfile
      ? {
          ...loadedProfile,
          fullName: loadedProfile.fullName || fallbackName,
          email: loadedProfile.email || fallbackEmail,
        }
      : accountProfile(fallbackName, fallbackEmail);
    const applications =
      applicationsResult.status === 'fulfilled' ? applicationsResult.value : EMPTY_APPLICATIONS;
    const cvs = cvsResult.status === 'fulfilled' ? cvsResult.value : EMPTY_CVS;
    const demo =
      (profileResult.status === 'fulfilled' && profileResult.value.source === 'demo') ||
      applications.source === 'demo' ||
      cvs.source === 'demo';

    return {
      profile,
      hasProfile: profileResult.status === 'fulfilled' && profileResult.value.profile !== null,
      applications,
      cvs,
      applicationsError:
        applicationsResult.status === 'rejected'
          ? errorMessage(applicationsResult.reason, 'Không thể tải đơn ứng tuyển.')
          : null,
      cvsError:
        cvsResult.status === 'rejected'
          ? errorMessage(cvsResult.reason, 'Không thể tải danh sách CV.')
          : null,
      demo,
    };
  }, [fallbackEmail, fallbackName]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      fetchProfileData()
        .then((next) => {
          if (!active) return;
          setData(next);
          setRefreshing(false);
        })
        .catch(() => {
          if (active) setRefreshing(false);
        });
      return () => {
        active = false;
      };
    }, [fetchProfileData]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProfileData()
      .then((next) => {
        setData(next);
        setRefreshing(false);
      })
      .catch(() => setRefreshing(false));
  };

  const profile = data?.profile ?? accountProfile(fallbackName, fallbackEmail);
  const applications = data?.applications.items ?? [];
  const cvs = data?.cvs.items ?? [];
  const applicationCount = data?.applications.totalCount ?? 0;
  const loading = data === null;
  const hasProfile = data?.hasProfile ?? false;
  const completion = completionOf(profile, hasProfile);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
            progressBackgroundColor={theme.backgroundElement}
          />
        }>
        {data?.demo ? (
          <View style={styles.demoRow}>
            <Badge variant="secondary" textStyle={styles.demoBadge}>
              DỮ LIỆU MINH HỌA
            </Badge>
          </View>
        ) : null}

        <View
          style={[
            styles.completionCard,
            { borderColor: `${theme.primary}26`, backgroundColor: `${theme.primary}0A` },
          ]}>
          <View style={styles.completionHead}>
            <ThemedText style={[styles.completionLabel, { color: theme.primary }]}>
              HỒ SƠ HOÀN THIỆN
            </ThemedText>
            <ThemedText style={[styles.completionPercent, { color: theme.primary }]}>
              {loading ? '—' : `${completion.percent}%`}
            </ThemedText>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: `${theme.primary}1F` }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary,
                  width: `${loading ? 0 : completion.percent}%`,
                },
              ]}
            />
          </View>
          <ThemedText style={[styles.completionNote, { color: theme.textSecondary }]}>
            {loading
              ? 'Đang tải hồ sơ...'
              : !hasProfile
                ? 'Chưa có hồ sơ ứng viên — tạo ngay để bắt đầu ứng tuyển.'
                : completion.missing > 0
                  ? `Thiếu ${completion.missing} mục thông tin — hoàn thiện để nhà tuyển dụng dễ tìm thấy bạn.`
                  : 'Hồ sơ đã đầy đủ — sẵn sàng nhận cơ hội mới.'}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/profile-edit')}
            style={({ pressed }) => [
              styles.completionCta,
              { borderColor: `${theme.primary}40`, backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
            ]}>
            <ThemedText style={[styles.completionCtaText, { color: theme.primary }]}>
              {!loading && !hasProfile ? 'Tạo hồ sơ ứng viên' : 'Hoàn thiện hồ sơ'}
            </ThemedText>
            <ArrowRight size={14} color={theme.primary} />
          </Pressable>
        </View>

        <SectionHeading
          title="Hồ sơ ứng viên"
          actionLabel={
            !loading ? (profile.fullName ? 'Chỉnh sửa' : 'Tạo hồ sơ') : undefined
          }
          onAction={
            !loading ? () => router.push('/profile-edit') : undefined
          }
        />
        <ProfileInfoCard profile={profile} />

        <View style={styles.quickActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/profile-edit')}
            style={({ pressed }) => [
              styles.quickPill,
              { borderColor: theme.border, backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
            ]}>
            <Pencil size={14} color={theme.text} />
            <ThemedText style={styles.quickPillText}>Chỉnh sửa hồ sơ</ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [
              styles.quickPill,
              { borderColor: theme.border, backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
            ]}>
            <Settings size={14} color={theme.text} />
            <ThemedText style={styles.quickPillText}>Cài đặt</ThemedText>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/tao-cv/ai')}
          style={({ pressed }) => [
            styles.createCvButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
          ]}>
          <FilePlus2 size={16} color={theme.primaryForeground} />
          <ThemedText style={[styles.createCvText, { color: theme.primaryForeground }]}>
            Tạo CV mới
          </ThemedText>
        </Pressable>

        <SectionHeading
          title="Đơn ứng tuyển gần đây"
          caption={
            loading
              ? 'Đang đồng bộ trạng thái hồ sơ'
              : applicationCount > 0
                ? 'Cập nhật mới nhất từ nhà tuyển dụng'
                : 'Theo dõi trạng thái hồ sơ đã gửi'
          }
          badge={!loading && applicationCount > 0 ? String(applicationCount) : undefined}
        />
        <ListSurface>
          {loading ? (
            <ProfileSkeletonRows count={2} />
          ) : data?.applicationsError ? (
            <ProfileEmptyState
              title="Không tải được đơn ứng tuyển"
              message={data.applicationsError}
              actionLabel="Thử lại"
              onAction={handleRefresh}
            />
          ) : applications.length === 0 ? (
            <ProfileEmptyState
              title="Chưa có đơn ứng tuyển"
              message="Khi bạn nộp CV cho một tin tuyển dụng, trạng thái xử lý sẽ xuất hiện tại đây."
            />
          ) : (
            applications.map((application, index) => (
              <ApplicationRow
                key={application.id}
                application={application}
                first={index === 0}
                onPress={() => router.push(`/jobs/${application.jobId}`)}
              />
            ))
          )}
        </ListSurface>

        {applications.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/applications')}
            style={({ pressed }) => [styles.seeAllRow, { opacity: pressed ? 0.7 : 1 }]}>
            <ThemedText style={[styles.seeAllText, { color: theme.primary }]}>
              Xem tất cả đơn ứng tuyển →
            </ThemedText>
          </Pressable>
        ) : null}

        <SectionHeading
          title="Danh sách CV đã tạo"
          caption="Chọn CV nhanh khi ứng tuyển trên điện thoại"
          badge={!loading && cvs.length > 0 ? String(cvs.length) : undefined}
        />
        <ListSurface>
          {loading ? (
            <ProfileSkeletonRows count={2} />
          ) : data?.cvsError ? (
            <ProfileEmptyState
              title="Không tải được danh sách CV"
              message={data.cvsError}
              actionLabel="Thử lại"
              onAction={handleRefresh}
            />
          ) : cvs.length === 0 ? (
            <ProfileEmptyState
              title="Chưa có CV nào"
              message="Tạo hoặc tải CV lên trên bản web, sau đó quay lại đây để ứng tuyển nhanh."
            />
          ) : (
            cvs.map((cv, index) => (
              <CvRow
                key={cv.id}
                cv={cv}
                first={index === 0}
                onChange={handleRefresh}
                onPress={() =>
                  router.push({
                    pathname: '/cv-detail',
                    params: { id: cv.id },
                  })
                }
              />
            ))
          )}
        </ListSurface>

        <Pressable
          accessibilityRole="button"
          onPress={() => void signOut()}
          style={({ pressed }) => [
            styles.logoutButton,
            { borderColor: theme.border, backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
          ]}>
          <LogOut size={16} color={theme.destructive} />
          <ThemedText style={[styles.logoutText, { color: theme.destructive }]}>
            Đăng xuất
          </ThemedText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 38 },
  demoRow: { marginBottom: 4 },
  demoBadge: { fontFamily: font('semibold'), fontSize: 10, letterSpacing: 0.5 },
  completionCard: {
    borderWidth: 1,
    borderRadius: Radius['2xl'],
    padding: 16,
    gap: 10,
  },
  completionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  completionLabel: { fontFamily: font('semibold'), fontSize: 11, letterSpacing: 1.2 },
  completionPercent: { fontFamily: font('bold'), fontSize: 24, letterSpacing: -0.4 },
  progressTrack: { height: 8, borderRadius: Radius.pill, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: Radius.pill },
  completionNote: { fontFamily: font('regular'), fontSize: 12, lineHeight: 18 },
  completionCta: {
    minHeight: 40,
    borderRadius: Radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginTop: 2,
  },
  completionCtaText: { fontFamily: font('semibold'), fontSize: 13 },
  seeAllRow: { alignItems: 'center', paddingVertical: 6 },
  seeAllText: { fontFamily: font('semibold'), fontSize: 13 },
  quickActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  quickPill: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickPillText: { fontFamily: font('semibold'), fontSize: 12 },
  createCvButton: {
    minHeight: 46,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  createCvText: { fontFamily: font('semibold'), fontSize: 14 },
  logoutButton: {
    minHeight: 50,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
  },
  logoutText: { fontFamily: font('semibold'), fontSize: 14 },
});
