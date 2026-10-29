import { router } from 'expo-router';
import { FileText, LayoutTemplate, Sparkles, Upload } from 'lucide-react-native';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { StackHeader } from '@/components/stack-header';
import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { font, Radius } from '@/constants/theme';
import { CvCard } from '@/features/cv/components/cv-card';
import { useCvList } from '@/features/cv/hooks/use-cv-list';
import { useTheme } from '@/hooks/use-theme';

export default function CvListScreen() {
  const theme = useTheme();
  const { items, loading, refreshing, error, demo, refresh } = useCvList();

  const openUpload = () => router.push('/cv-upload');
  const openAi = () => router.push('/tao-cv/ai');
  const openGallery = () => router.push('/mau-cv');

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StackHeader title="Quản lý CV" />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            Đang tải danh sách CV
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
              progressBackgroundColor={theme.backgroundElement}
            />
          }
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              {demo ? (
                <Badge variant="secondary" textStyle={styles.demoBadge}>
                  DỮ LIỆU MINH HỌA
                </Badge>
              ) : null}
              <ThemedText style={[styles.heading, { color: theme.text }]}>
                CV của bạn
              </ThemedText>
              <ThemedText style={[styles.caption, { color: theme.textSecondary }]}>
                Dán nội dung để AI dựng CV, nhập file có sẵn hoặc chọn mẫu trong kho.
              </ThemedText>
              <View style={styles.creationActions}>
                <Button icon={<Sparkles size={16} color={theme.primaryForeground} />} onPress={openAi}>
                  Tạo CV với AI
                </Button>
                <Button variant="outline" icon={<Upload size={16} color={theme.text} />} onPress={openUpload}>
                  Nhập CV
                </Button>
                <Button variant="outline" icon={<LayoutTemplate size={16} color={theme.text} />} onPress={openGallery}>
                  Kho mẫu
                </Button>
              </View>
              {error ? (
                <Card style={[styles.notice, { borderColor: `${theme.destructive}33` }]}>
                  <ThemedText style={[styles.noticeTitle, { color: theme.destructive }]}>
                    Không thể làm mới danh sách
                  </ThemedText>
                  <ThemedText style={[styles.noticeText, { color: theme.textSecondary }]}>
                    {error}
                  </ThemedText>
                  <Button variant="outline" size="sm" onPress={refresh} style={styles.noticeAction}>
                    Thử lại
                  </Button>
                </Card>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}12` }]}>
                <FileText size={26} color={theme.primary} />
              </View>
              <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                Chưa có CV nào
              </ThemedText>
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                Dán nội dung cho AI dựng CV hoặc import file CV sẵn có để bắt đầu.
              </ThemedText>
              <View style={styles.emptyActions}>
                <Button icon={<Sparkles size={16} color={theme.primaryForeground} />} onPress={openAi}>Tạo CV với AI</Button>
                <Button variant="outline" icon={<Upload size={16} color={theme.text} />} onPress={openUpload}>Nhập CV</Button>
              </View>
            </Card>
          }
          ListFooterComponent={
            <View style={styles.footer}>
              {items.length > 0 ? (
                <Button
                  size="lg"
                  icon={<Upload size={18} color={theme.primaryForeground} />}
                  onPress={openUpload}>
                  Tải CV lên
                </Button>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <CvCard
              cv={item}
              onPress={() =>
                router.push({
                  pathname: '/cv-detail',
                  params: { id: item.id },
                })
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: font('regular'),
    fontSize: 13,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
  },
  headerBlock: {
    gap: 8,
    marginBottom: 18,
  },
  creationActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  demoBadge: {
    alignSelf: 'flex-start',
    fontFamily: font('semibold'),
    fontSize: 10,
    letterSpacing: 0.5,
  },
  heading: {
    fontFamily: font('bold'),
    fontSize: 24,
    lineHeight: 31,
  },
  caption: {
    fontFamily: font('regular'),
    fontSize: 13,
    lineHeight: 20,
  },
  notice: {
    marginTop: 8,
    padding: 14,
    gap: 6,
    borderRadius: Radius.xl,
  },
  noticeTitle: {
    fontFamily: font('semibold'),
    fontSize: 13,
  },
  noticeText: {
    fontFamily: font('regular'),
    fontSize: 12,
    lineHeight: 18,
  },
  noticeAction: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  separator: {
    height: 10,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    gap: 9,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  emptyTitle: {
    fontFamily: font('semibold'),
    fontSize: 16,
    lineHeight: 22,
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: font('regular'),
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  emptyActions: {
    gap: 8,
    width: '100%',
  },
  footer: {
    marginTop: 18,
  },
});
