import { ChevronRight, FileText, Star } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { font, Palette, Radius } from '@/constants/theme';
import { sourceFromMethod, sourceLabel } from '@/features/cv/cv-format';
import type { CvSummary } from '@/features/cv/types';
import { useTheme } from '@/hooks/use-theme';

export function CvCard({ cv, onPress }: { cv: CvSummary; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: `${theme.primary}16` }]}>
          <FileText size={22} color={theme.primary} />
        </View>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <ThemedText numberOfLines={2} style={[styles.name, { color: theme.text }]}>
              {cv.name}
            </ThemedText>
            {cv.isDefault ? (
              <View style={[styles.star, { backgroundColor: `${Palette.sand}33` }]}>
                <Star size={12} color={Palette.bronze} fill={Palette.bronze} />
              </View>
            ) : null}
          </View>
          <ThemedText numberOfLines={1} style={[styles.role, { color: theme.textSecondary }]}>
            {cv.role || 'Chưa cập nhật vị trí ứng tuyển'}
          </ThemedText>
          <View style={styles.metaRow}>
            <Badge
              variant="secondary"
              backgroundColor={`${theme.primary}12`}
              color={theme.primary}
              textStyle={styles.sourceBadge}>
              {sourceLabel(sourceFromMethod(cv.phuongThucTao))}
            </Badge>
            {cv.isDefault ? (
              <Badge
                variant="secondary"
                backgroundColor={`${Palette.sage}1F`}
                color={Palette.sage}
                textStyle={styles.sourceBadge}>
                Mặc định
              </Badge>
            ) : null}
            {cv.uploadedAt ? (
              <ThemedText style={[styles.meta, { color: theme.textSecondary }]}>
                {`Cập nhật ${cv.uploadedAt}`}
              </ThemedText>
            ) : null}
          </View>
        </View>
        <ChevronRight size={18} color={theme.textSecondary} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    flex: 1,
    fontFamily: font('semibold'),
    fontSize: 15,
    lineHeight: 21,
  },
  star: {
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  role: {
    fontFamily: font('regular'),
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  sourceBadge: {
    fontFamily: font('medium'),
    fontSize: 10,
    lineHeight: 14,
  },
  meta: {
    fontFamily: font('regular'),
    fontSize: 11,
    lineHeight: 16,
  },
});
