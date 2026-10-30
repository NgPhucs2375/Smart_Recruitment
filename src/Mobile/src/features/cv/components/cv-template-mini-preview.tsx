import { StyleSheet, View, type ViewStyle } from 'react-native';

/** 5 mẫu hiển thị trong kho — khớp allowlist của gallery. */
export const GALLERY_TEMPLATE_IDS = [
  'minimal-ats',
  'tech-modern',
  'ats-classic',
  'compact-developer',
  'creative-portfolio',
] as const;

export type GalleryTemplateId = (typeof GALLERY_TEMPLATE_IDS)[number];

const ACCENT: Record<string, string> = {
  'minimal-ats': '#355c8c',
  'tech-modern': '#0f766e',
  'ats-classic': '#1f2937',
  'compact-developer': '#4f46e5',
  'creative-portfolio': '#db2777',
};

const PAPER = '#ffffff';
const LINE = '#cbd5e1';
const SOFT = '#e2e8f0';

function accentFor(templateId: string): string {
  return ACCENT[templateId] ?? '#355c8c';
}

function Bar({ width, height = 5, color = LINE, radius = 3 }: { width: number | `${number}%`; height?: number; color?: string; radius?: number }) {
  return <View style={{ width, height, borderRadius: radius, backgroundColor: color }} />;
}

function Lines({ count = 4, gap = 7, color = LINE, lastWidth = '60%' }: { count?: number; gap?: number; color?: string; lastWidth?: number | `${number}%` }) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: count }, (_, index) => (
        <Bar
          key={index}
          width={index === count - 1 ? lastWidth : '100%'}
          color={color}
        />
      ))}
    </View>
  );
}

function SectionBlock({ accent, withHeading = true }: { accent: string; withHeading?: boolean }) {
  return (
    <View style={{ gap: 5 }}>
      {withHeading ? <Bar width={96} height={6} color={accent} /> : null}
      <Lines count={3} lastWidth="72%" />
    </View>
  );
}

/**
 * Preview mini A4 dựng bằng View/Text thuần — không gọi WebView/URL.
 * Đủ chi tiết để phân biệt 5 mẫu: màu header, 1–2 cột, avatar, khối kỹ năng.
 */
export function CvTemplateMiniPreview({
  templateId,
  style,
}: {
  templateId: string;
  style?: ViewStyle;
}) {
  const accent = accentFor(templateId);
  const isTwoColumn = templateId === 'tech-modern';

  return (
    <View style={[styles.paper, style]}>
      {templateId === 'ats-classic' ? (
        <View style={styles.headerPlain}>
          <View style={{ gap: 5, alignItems: 'center' }}>
            <Bar width={110} height={7} color="#334155" />
            <Bar width={72} height={5} color={accent} />
          </View>
          <View style={[styles.headerRule, { backgroundColor: accent }]} />
        </View>
      ) : (
        <View style={[styles.header, { backgroundColor: accent }]}>
          <View style={[styles.avatar, isTwoColumn && { backgroundColor: PAPER }]}>
            <Bar width={isTwoColumn ? 16 : 14} height={isTwoColumn ? 16 : 14} color={isTwoColumn ? accent : 'rgba(255,255,255,0.55)'} radius={99} />
          </View>
          <View style={{ flex: 1, gap: 5 }}>
            <Bar
              width={isTwoColumn ? '100%' : 108}
              height={7}
              color={isTwoColumn ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.92)'}
            />
            <Bar width={isTwoColumn ? '80%' : 76} height={5} color="rgba(255,255,255,0.6)" />
          </View>
        </View>
      )}

      {isTwoColumn ? (
        <View style={styles.twoCol}>
          <View style={[styles.side, { backgroundColor: `${accent}14` }]}>
            <View style={{ gap: 6 }}>
              <Bar width="70%" height={5} color={accent} />
              <Lines count={4} gap={6} color={SOFT} lastWidth="55%" />
            </View>
            <View style={{ gap: 6 }}>
              <Bar width="60%" height={5} color={accent} />
              <View style={styles.chips}>
                {[48, 40, 54, 36].map((chipWidth, index) => (
                  <View key={index} style={[styles.chip, { borderColor: accent }]}>
                    <Bar width={chipWidth - 8} height={3} color={accent} />
                  </View>
                ))}
              </View>
            </View>
            <View style={{ gap: 6 }}>
              <Bar width="78%" height={5} color={accent} />
              <Lines count={3} gap={6} color={SOFT} lastWidth="50%" />
            </View>
          </View>
          <View style={{ flex: 1, gap: 12 }}>
            <SectionBlock accent={accent} />
            <SectionBlock accent={accent} />
            <SectionBlock accent={accent} withHeading={false} />
          </View>
        </View>
      ) : (
        <View style={styles.body}>
          {templateId === 'creative-portfolio' ? (
            <View style={styles.tiles}>
              {[0, 1, 2].map((tile) => (
                <View key={tile} style={[styles.tile, { backgroundColor: `${accent}22`, borderColor: `${accent}55` }]}>
                  <Bar width="70%" height={4} color={accent} />
                  <Bar width="90%" height={3} />
                  <Bar width="60%" height={3} />
                </View>
              ))}
            </View>
          ) : null}
          <SectionBlock accent={accent} />
          <SectionBlock accent={accent} />
          <View style={{ gap: 5 }}>
            <Bar width={84} height={6} color={accent} />
            <View style={styles.chips}>
              {[52, 44, 60, 40, 48].map((chipWidth, index) => (
                <View key={index} style={[styles.chip, { borderColor: accent }]}>
                  <Bar width={chipWidth - 8} height={3} color={accent} />
                </View>
              ))}
            </View>
          </View>
          <SectionBlock accent={accent} withHeading={false} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    backgroundColor: PAPER,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 9,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginHorizontal: -8,
    marginTop: -8,
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  headerPlain: {
    marginHorizontal: -8,
    marginTop: -8,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 7,
  },
  headerRule: { height: 2, borderRadius: 1, width: '100%' },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  body: { gap: 9, flex: 1 },
  twoCol: { flexDirection: 'row', gap: 8, flex: 1 },
  side: {
    width: '34%',
    borderRadius: 6,
    padding: 7,
    gap: 10,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chip: {
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  tiles: { flexDirection: 'row', gap: 6 },
  tile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 5,
    gap: 4,
    minHeight: 44,
  },
});
