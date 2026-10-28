<<<<<<< HEAD
import type { ReactNode } from 'react';
import {
  BadgeCheck,
  CalendarDays,
  Code2,
  DollarSign,
  Globe2,
  Link2,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { font, Palette, Radius } from '@/constants/theme';
import {
  formatCvDate,
  formatCvMoney,
  formatCvRange,
  skillLevelLabel,
  sourceLabel,
} from '@/features/cv/cv-format';
import type {
  CvCertificate,
  CvDetail,
  CvEducation,
  CvExperience,
  CvProject,
  CvVersion,
} from '@/features/cv/types';
import { useTheme } from '@/hooks/use-theme';

type IconComponent = typeof Mail;

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {title.toUpperCase()}
        </ThemedText>
        {count !== undefined ? (
          <View style={[styles.countBadge, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText style={[styles.countText, { color: theme.primary }]}>{count}</ThemedText>
          </View>
        ) : null}
      </View>
      <View
        style={[
          styles.surface,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        {children}
      </View>
    </View>
  );
}

function EmptySection({ message }: { message: string }) {
  const theme = useTheme();
  return (
    <ThemedText style={[styles.empty, { color: theme.textSecondary }]}>
      {message}
    </ThemedText>
  );
}

function ItemBlock({
  first = false,
  children,
}: {
  first?: boolean;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.item,
        !first && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.border,
        },
      ]}>
      {children}
    </View>
  );
}

function ItemTitle({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <ThemedText style={[styles.itemTitle, { color: theme.text }]}>
      {children}
    </ThemedText>
  );
}

function ItemSubtitle({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <ThemedText style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
      {children}
    </ThemedText>
  );
}

function DatePill({ label }: { label: string }) {
  const theme = useTheme();
  if (!label) return null;
  return (
    <Badge
      variant="outline"
      backgroundColor={theme.muted}
      color={theme.textSecondary}
      textStyle={styles.datePill}>
      {label}
    </Badge>
  );
}

function ContactRow({ icon: Icon, value }: { icon: IconComponent; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.contactRow}>
      <Icon size={16} color={theme.primary} />
      <ThemedText style={[styles.contactValue, { color: theme.text }]}>
        {value}
      </ThemedText>
    </View>
  );
}

function EducationItem({ item, first }: { item: CvEducation; first: boolean }) {
  const theme = useTheme();
  const title = item.school || 'Cơ sở đào tạo';
  const subtitle = [item.degree, item.major].filter(Boolean).join(' · ');
  const range = formatCvRange(item.startDate, item.endDate, item.current);

  return (
    <ItemBlock first={first}>
      <View style={styles.itemHeading}>
        <ItemTitle>{title}</ItemTitle>
        <DatePill label={range} />
      </View>
      {subtitle ? <ItemSubtitle>{subtitle}</ItemSubtitle> : null}
      {item.description ? (
        <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
          {item.description}
        </ThemedText>
      ) : null}
    </ItemBlock>
  );
}

function ExperienceItem({ item, first }: { item: CvExperience; first: boolean }) {
  const theme = useTheme();
  const title = item.title || 'Vị trí công việc';
  const subtitle = [item.company, item.location].filter(Boolean).join(' · ');
  const range = formatCvRange(item.startDate, item.endDate, item.current);

  return (
    <ItemBlock first={first}>
      <View style={styles.itemHeading}>
        <ItemTitle>{title}</ItemTitle>
        <DatePill label={range} />
      </View>
      {subtitle ? <ItemSubtitle>{subtitle}</ItemSubtitle> : null}
      {item.description ? (
        <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
          {item.description}
        </ThemedText>
      ) : null}
      {item.skills.length > 0 ? (
        <View style={styles.tags}>
          {item.skills.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              textStyle={styles.tagText}>
              {skill}
            </Badge>
          ))}
        </View>
      ) : null}
    </ItemBlock>
  );
}

function ProjectItem({ item, first }: { item: CvProject; first: boolean }) {
  const theme = useTheme();
  const subtitle = [item.role, item.link].filter(Boolean).join(' · ');
  const range = formatCvRange(item.startDate, item.endDate, item.current);

  return (
    <ItemBlock first={first}>
      <View style={styles.itemHeading}>
        <ItemTitle>{item.name || 'Dự án'}</ItemTitle>
        <DatePill label={range} />
      </View>
      {subtitle ? <ItemSubtitle>{subtitle}</ItemSubtitle> : null}
      {item.description ? (
        <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
          {item.description}
        </ThemedText>
      ) : null}
      {item.technologies.length > 0 ? (
        <View style={styles.tags}>
          {item.technologies.map((technology) => (
            <Badge
              key={technology}
              variant="secondary"
              textStyle={styles.tagText}>
              {technology}
            </Badge>
          ))}
        </View>
      ) : null}
    </ItemBlock>
  );
}

function CertificateItem({ item, first }: { item: CvCertificate; first: boolean }) {
  const theme = useTheme();
  const subtitle = [item.issuer, item.credentialId].filter(Boolean).join(' · ');
  const range = formatCvRange(item.issuedAt, item.expiresAt, false);

  return (
    <ItemBlock first={first}>
      <View style={styles.itemHeading}>
        <View style={styles.certTitle}>
          <BadgeCheck size={16} color={Palette.sage} />
          <ItemTitle>{item.name || 'Chứng chỉ'}</ItemTitle>
        </View>
        <DatePill label={range} />
      </View>
      {subtitle ? <ItemSubtitle>{subtitle}</ItemSubtitle> : null}
      {item.credentialUrl ? (
        <ThemedText numberOfLines={1} style={[styles.description, { color: theme.primary }]}>
          {item.credentialUrl}
        </ThemedText>
      ) : null}
    </ItemBlock>
  );
}

export function CvDetailBody({ detail }: { detail: CvDetail }) {
  const theme = useTheme();
  const { contact, education, experience, projects, skills, certificates } = detail.content;

  const contactRows: { icon: IconComponent; value: string }[] = [
    { icon: Mail, value: contact.email },
    { icon: Phone, value: contact.phone },
    { icon: MapPin, value: contact.location },
    {
      icon: CalendarDays,
      value: [formatCvDate(contact.birthDate), contact.gender].filter(Boolean).join(' · '),
    },
    { icon: UserRound, value: contact.title },
    {
      icon: DollarSign,
      value: contact.expectedSalary ? formatCvMoney(contact.expectedSalary) : '',
    },
    { icon: Code2, value: contact.github },
    { icon: Link2, value: contact.linkedIn },
    { icon: Globe2, value: contact.portfolio },
  ].filter((row) => row.value);

  return (
    <View style={styles.body}>
      <Section title="Thông tin liên hệ">
        <View style={styles.contactBlock}>
          <ThemedText style={[styles.contactName, { color: theme.text }]}>
            {contact.fullName || 'Chưa cập nhật họ tên'}
          </ThemedText>
          {contactRows.length > 0 ? (
            <View style={styles.contactRows}>
              {contactRows.map((row) => (
                <ContactRow
                  key={`${row.value}-${row.icon.name}`}
                  icon={row.icon}
                  value={row.value}
                />
              ))}
            </View>
          ) : (
            <EmptySection message="CV chưa có thông tin liên hệ." />
          )}
        </View>
      </Section>

      {contact.bio ? (
        <Section title="Giới thiệu">
          <View style={styles.item}>
            <ThemedText style={[styles.bio, { color: theme.text }]}>{contact.bio}</ThemedText>
          </View>
        </Section>
      ) : null}

      <Section title="Học vấn" count={education.length || undefined}>
        {education.length === 0 ? (
          <EmptySection message="CV chưa có thông tin học vấn." />
        ) : (
          education.map((item, index) => (
            <EducationItem key={`${item.school}-${index}`} item={item} first={index === 0} />
          ))
        )}
      </Section>

      <Section title="Kinh nghiệm làm việc" count={experience.length || undefined}>
        {experience.length === 0 ? (
          <EmptySection message="CV chưa có kinh nghiệm làm việc." />
        ) : (
          experience.map((item, index) => (
            <ExperienceItem key={`${item.company}-${index}`} item={item} first={index === 0} />
          ))
        )}
      </Section>

      <Section title="Dự án" count={projects.length || undefined}>
        {projects.length === 0 ? (
          <EmptySection message="CV chưa có thông tin dự án." />
        ) : (
          projects.map((item, index) => (
            <ProjectItem key={`${item.name}-${index}`} item={item} first={index === 0} />
          ))
        )}
      </Section>

      <Section title="Kỹ năng" count={skills.length || undefined}>
        {skills.length === 0 ? (
          <EmptySection message="CV chưa có thông tin kỹ năng." />
        ) : (
          <View style={styles.skillGrid}>
            {skills.map((skill, index) => (
              <View
                key={`${skill.name}-${index}`}
                style={[
                  styles.skillCard,
                  { borderColor: theme.border, backgroundColor: theme.muted },
                ]}>
                <ThemedText numberOfLines={1} style={[styles.skillName, { color: theme.text }]}>
                  {skill.name}
                </ThemedText>
                <ThemedText style={[styles.skillMeta, { color: theme.textSecondary }]}>
                  {skillLevelLabel(skill.level)}
                  {skill.years ? ` · ${skill.years} năm` : ''}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </Section>

      <Section title="Chứng chỉ" count={certificates.length || undefined}>
        {certificates.length === 0 ? (
          <EmptySection message="CV chưa có chứng chỉ." />
        ) : (
          certificates.map((item, index) => (
            <CertificateItem
              key={`${item.name}-${index}`}
              item={item}
              first={index === 0}
            />
          ))
        )}
      </Section>
    </View>
  );
}

export function CvVersionsSection({ versions }: { versions: CvVersion[] }) {
  const theme = useTheme();

  return (
    <Section title="Phiên bản CV" count={versions.length || undefined}>
      {versions.length === 0 ? (
        <EmptySection message="Chưa có dữ liệu phiên bản." />
      ) : (
        versions.map((version, index) => (
          <ItemBlock key={version.id} first={index === 0}>
            <View style={styles.itemHeading}>
              <ItemTitle>{`Phiên bản ${version.number}`}</ItemTitle>
              <DatePill label={formatCvDate(version.createdAt)} />
            </View>
            <ItemSubtitle>{version.name}</ItemSubtitle>
            <View style={styles.tags}>
              <Badge variant="outline" textStyle={styles.tagText}>
                {version.hasOriginal ? 'Có file gốc' : 'Bản tạo trên hệ thống'}
              </Badge>
              {version.templateId ? (
                <Badge variant="secondary" textStyle={styles.tagText}>
                  {`Mẫu ${version.templateId}`}
                </Badge>
              ) : null}
            </View>
          </ItemBlock>
        ))
      )}
      <View style={[styles.versionNote, { borderTopColor: theme.border }]}>
        <ThemedText style={[styles.versionNoteText, { color: theme.textSecondary }]}>
          {`Nguồn CV: ${sourceLabel(
            versions.some((version) => version.hasOriginal) ? 'upload' : 'template',
          )}`}
        </ThemedText>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 22,
  },
  section: {
    gap: 10,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontFamily: font('semibold'),
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.1,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontFamily: font('semibold'),
    fontSize: 10,
    lineHeight: 14,
  },
  surface: {
    borderWidth: 1,
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
  },
  contactBlock: {
    padding: 16,
    gap: 12,
  },
  contactName: {
    fontFamily: font('bold'),
    fontSize: 19,
    lineHeight: 26,
  },
  contactRows: {
    gap: 9,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  contactValue: {
    flex: 1,
    fontFamily: font('regular'),
    fontSize: 13,
    lineHeight: 19,
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  itemHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  itemTitle: {
    flexShrink: 1,
    fontFamily: font('semibold'),
    fontSize: 14,
    lineHeight: 20,
  },
  itemSubtitle: {
    fontFamily: font('regular'),
    fontSize: 12,
    lineHeight: 18,
  },
  description: {
    fontFamily: font('regular'),
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  datePill: {
    fontFamily: font('medium'),
    fontSize: 10,
    lineHeight: 14,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tagText: {
    fontFamily: font('medium'),
    fontSize: 10,
    lineHeight: 14,
  },
  empty: {
    padding: 16,
    fontFamily: font('regular'),
    fontSize: 13,
    lineHeight: 19,
  },
  bio: {
    fontFamily: font('regular'),
    fontSize: 14,
    lineHeight: 22,
  },
  certTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  skillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 14,
  },
  skillCard: {
    minWidth: '46%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  skillName: {
    fontFamily: font('semibold'),
    fontSize: 13,
    lineHeight: 18,
  },
  skillMeta: {
    fontFamily: font('regular'),
    fontSize: 11,
    lineHeight: 16,
  },
  versionNote: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  versionNoteText: {
    fontFamily: font('regular'),
    fontSize: 11,
    lineHeight: 16,
  },
});
=======
import type { ReactNode } from 'react';
import {
  BadgeCheck,
  CalendarDays,
  Code2,
  DollarSign,
  Globe2,
  Link2,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { font, Palette, Radius } from '@/constants/theme';
import {
  formatCvDate,
  formatCvRange,
  sourceLabel,
} from '@/features/cv/cv-format';
import type {
  ChungChiItem,
  CvDetailVm,
  CvVersionVm,
  DuAnItem,
  HocVanItem,
  KinhNghiemItem,
  KyNangItem,
} from '@/features/cv/types';
import { useTheme } from '@/hooks/use-theme';

type IconComponent = typeof Mail;

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {title.toUpperCase()}
        </ThemedText>
        {count !== undefined ? (
          <View style={[styles.countBadge, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText style={[styles.countText, { color: theme.primary }]}>{count}</ThemedText>
          </View>
        ) : null}
      </View>
      <View
        style={[
          styles.surface,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        {children}
      </View>
    </View>
  );
}

function EmptySection({ message }: { message: string }) {
  const theme = useTheme();
  return (
    <ThemedText style={[styles.empty, { color: theme.textSecondary }]}>
      {message}
    </ThemedText>
  );
}

function ItemBlock({
  first = false,
  children,
}: {
  first?: boolean;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.item,
        !first && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.border,
        },
      ]}>
      {children}
    </View>
  );
}

function ItemTitle({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <ThemedText style={[styles.itemTitle, { color: theme.text }]}>
      {children}
    </ThemedText>
  );
}

function ItemSubtitle({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <ThemedText style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
      {children}
    </ThemedText>
  );
}

function DatePill({ label }: { label: string }) {
  const theme = useTheme();
  if (!label) return null;
  return (
    <Badge
      variant="outline"
      backgroundColor={theme.muted}
      color={theme.textSecondary}
      textStyle={styles.datePill}>
      {label}
    </Badge>
  );
}

function ContactRow({ icon: Icon, value }: { icon: IconComponent; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.contactRow}>
      <Icon size={16} color={theme.primary} />
      <ThemedText style={[styles.contactValue, { color: theme.text }]}>
        {value}
      </ThemedText>
    </View>
  );
}

function EducationItem({ item, first }: { item: HocVanItem; first: boolean }) {
  const theme = useTheme();
  const title = item.truong || 'Cơ sở đào tạo';
  const subtitle = [item.bangCap, item.chuyenNganh].filter(Boolean).join(' · ');
  const range = formatCvRange(item.tuNgay, item.denNgay, Boolean(item.isHienTai));

  return (
    <ItemBlock first={first}>
      <View style={styles.itemHeading}>
        <ItemTitle>{title}</ItemTitle>
        <DatePill label={range} />
      </View>
      {subtitle ? <ItemSubtitle>{subtitle}</ItemSubtitle> : null}
      {item.moTa ? (
        <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
          {item.moTa}
        </ThemedText>
      ) : null}
    </ItemBlock>
  );
}

function ExperienceItem({ item, first }: { item: KinhNghiemItem; first: boolean }) {
  const theme = useTheme();
  const title = item.chucDanh || 'Vị trí công việc';
  const subtitle = [item.congTy, item.diaChi].filter(Boolean).join(' · ');
  const range = formatCvRange(item.tuNgay, item.denNgay, item.isHienTai);

  return (
    <ItemBlock first={first}>
      <View style={styles.itemHeading}>
        <ItemTitle>{title}</ItemTitle>
        <DatePill label={range} />
      </View>
      {subtitle ? <ItemSubtitle>{subtitle}</ItemSubtitle> : null}
      {item.moTa ? (
        <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
          {item.moTa}
        </ThemedText>
      ) : null}
      {item.kyNangSuDung.length > 0 ? (
        <View style={styles.tags}>
          {item.kyNangSuDung.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              textStyle={styles.tagText}>
              {skill}
            </Badge>
          ))}
        </View>
      ) : null}
    </ItemBlock>
  );
}

function ProjectItem({ item, first }: { item: DuAnItem; first: boolean }) {
  const theme = useTheme();
  const subtitle = [item.vaiTro, item.link].filter(Boolean).join(' · ');
  const range = formatCvRange(item.tuNgay, item.denNgay, Boolean(item.isHienTai));

  return (
    <ItemBlock first={first}>
      <View style={styles.itemHeading}>
        <ItemTitle>{item.tenDuAn || 'Dự án'}</ItemTitle>
        <DatePill label={range} />
      </View>
      {subtitle ? <ItemSubtitle>{subtitle}</ItemSubtitle> : null}
      {item.moTa ? (
        <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
          {item.moTa}
        </ThemedText>
      ) : null}
      {item.congNghe.length > 0 ? (
        <View style={styles.tags}>
          {item.congNghe.map((technology) => (
            <Badge
              key={technology}
              variant="secondary"
              textStyle={styles.tagText}>
              {technology}
            </Badge>
          ))}
        </View>
      ) : null}
    </ItemBlock>
  );
}

function CertificateItem({ item, first }: { item: ChungChiItem; first: boolean }) {
  const theme = useTheme();
  const subtitle = [item.donViCap, item.maXacMinh].filter(Boolean).join(' · ');
  const range = formatCvRange(item.ngayCap, item.ngayHetHan ?? '', false);

  return (
    <ItemBlock first={first}>
      <View style={styles.itemHeading}>
        <View style={styles.certTitle}>
          <BadgeCheck size={16} color={Palette.sage} />
          <ItemTitle>{item.tenChungChi || 'Chứng chỉ'}</ItemTitle>
        </View>
        <DatePill label={range} />
      </View>
      {subtitle ? <ItemSubtitle>{subtitle}</ItemSubtitle> : null}
      {item.credentialUrl ? (
        <ThemedText numberOfLines={1} style={[styles.description, { color: theme.primary }]}>
          {item.credentialUrl}
        </ThemedText>
      ) : null}
    </ItemBlock>
  );
}

export function CvDetailBody({ detail }: { detail: CvDetailVm }) {
  const theme = useTheme();
  const {
    thongTinLienHe: contact,
    hocVan,
    kinhNghiemLamViec,
    duAn,
    kyNang,
    chungChi,
  } = detail.noiDung;

  const contactRows: { icon: IconComponent; value: string }[] = [
    { icon: Mail, value: contact.email },
    { icon: Phone, value: contact.sdt },
    { icon: MapPin, value: contact.diaChi },
    {
      icon: CalendarDays,
      value: [formatCvDate(contact.ngaySinh), contact.gioiTinh].filter(Boolean).join(' · '),
    },
    { icon: UserRound, value: contact.viTriUngTuyen },
    { icon: DollarSign, value: contact.mucLuongMongMuon },
    { icon: Code2, value: contact.github },
    { icon: Link2, value: contact.linkedIn },
    { icon: Globe2, value: contact.portfolio },
  ].filter((row) => row.value);

  return (
    <View style={styles.body}>
      <Section title="Thông tin liên hệ">
        <View style={styles.contactBlock}>
          <ThemedText style={[styles.contactName, { color: theme.text }]}>
            {contact.hoTen || 'Chưa cập nhật họ tên'}
          </ThemedText>
          {contactRows.length > 0 ? (
            <View style={styles.contactRows}>
              {contactRows.map((row) => (
                <ContactRow
                  key={`${row.value}-${row.icon.name}`}
                  icon={row.icon}
                  value={row.value}
                />
              ))}
            </View>
          ) : (
            <EmptySection message="CV chưa có thông tin liên hệ." />
          )}
        </View>
      </Section>

      {contact.gioiThieuBanThan ? (
        <Section title="Giới thiệu">
          <View style={styles.item}>
            <ThemedText style={[styles.bio, { color: theme.text }]}>
              {contact.gioiThieuBanThan}
            </ThemedText>
          </View>
        </Section>
      ) : null}

      <Section title="Học vấn" count={hocVan.length || undefined}>
        {hocVan.length === 0 ? (
          <EmptySection message="CV chưa có thông tin học vấn." />
        ) : (
          hocVan.map((item, index) => (
            <EducationItem key={`${item.truong}-${index}`} item={item} first={index === 0} />
          ))
        )}
      </Section>

      <Section title="Kinh nghiệm làm việc" count={kinhNghiemLamViec.length || undefined}>
        {kinhNghiemLamViec.length === 0 ? (
          <EmptySection message="CV chưa có kinh nghiệm làm việc." />
        ) : (
          kinhNghiemLamViec.map((item, index) => (
            <ExperienceItem key={`${item.congTy}-${index}`} item={item} first={index === 0} />
          ))
        )}
      </Section>

      <Section title="Dự án" count={duAn.length || undefined}>
        {duAn.length === 0 ? (
          <EmptySection message="CV chưa có thông tin dự án." />
        ) : (
          duAn.map((item, index) => (
            <ProjectItem key={`${item.tenDuAn}-${index}`} item={item} first={index === 0} />
          ))
        )}
      </Section>

      <Section title="Kỹ năng" count={kyNang.length || undefined}>
        {kyNang.length === 0 ? (
          <EmptySection message="CV chưa có thông tin kỹ năng." />
        ) : (
          <View style={styles.skillGrid}>
            {kyNang.map((skill: KyNangItem, index) => (
              <View
                key={`${skill.tenKyNang}-${index}`}
                style={[
                  styles.skillCard,
                  { borderColor: theme.border, backgroundColor: theme.muted },
                ]}>
                <ThemedText numberOfLines={1} style={[styles.skillName, { color: theme.text }]}>
                  {skill.tenKyNang}
                </ThemedText>
                <ThemedText style={[styles.skillMeta, { color: theme.textSecondary }]}>
                  {skill.mucDoThanhThao || 'Chưa xác định'}
                  {skill.soNamKinhNghiem ? ` · ${skill.soNamKinhNghiem} năm` : ''}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </Section>

      <Section title="Chứng chỉ" count={chungChi.length || undefined}>
        {chungChi.length === 0 ? (
          <EmptySection message="CV chưa có chứng chỉ." />
        ) : (
          chungChi.map((item, index) => (
            <CertificateItem
              key={`${item.tenChungChi}-${index}`}
              item={item}
              first={index === 0}
            />
          ))
        )}
      </Section>
    </View>
  );
}

export function CvVersionsSection({ versions }: { versions: CvVersionVm[] }) {
  const theme = useTheme();

  return (
    <Section title="Phiên bản CV" count={versions.length || undefined}>
      {versions.length === 0 ? (
        <EmptySection message="Chưa có dữ liệu phiên bản." />
      ) : (
        versions.map((version, index) => (
          <ItemBlock key={version.id} first={index === 0}>
            <View style={styles.itemHeading}>
              <ItemTitle>{`Phiên bản ${version.soPhienBan}`}</ItemTitle>
              <DatePill label={formatCvDate(version.created)} />
            </View>
            <ItemSubtitle>{version.tenFile}</ItemSubtitle>
            <View style={styles.tags}>
              <Badge variant="outline" textStyle={styles.tagText}>
                {version.hasOriginal ? 'Có file gốc' : 'Bản tạo trên hệ thống'}
              </Badge>
              {version.templateId ? (
                <Badge variant="secondary" textStyle={styles.tagText}>
                  {`Mẫu ${version.templateId}`}
                </Badge>
              ) : null}
            </View>
          </ItemBlock>
        ))
      )}
      <View style={[styles.versionNote, { borderTopColor: theme.border }]}>
        <ThemedText style={[styles.versionNoteText, { color: theme.textSecondary }]}>
          {`Nguồn CV: ${sourceLabel(
            versions.some((version) => version.hasOriginal) ? 'upload' : 'template',
          )}`}
        </ThemedText>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 22,
  },
  section: {
    gap: 10,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontFamily: font('semibold'),
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.1,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontFamily: font('semibold'),
    fontSize: 10,
    lineHeight: 14,
  },
  surface: {
    borderWidth: 1,
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
  },
  contactBlock: {
    padding: 16,
    gap: 12,
  },
  contactName: {
    fontFamily: font('bold'),
    fontSize: 19,
    lineHeight: 26,
  },
  contactRows: {
    gap: 9,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  contactValue: {
    flex: 1,
    fontFamily: font('regular'),
    fontSize: 13,
    lineHeight: 19,
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  itemHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  itemTitle: {
    flexShrink: 1,
    fontFamily: font('semibold'),
    fontSize: 14,
    lineHeight: 20,
  },
  itemSubtitle: {
    fontFamily: font('regular'),
    fontSize: 12,
    lineHeight: 18,
  },
  description: {
    fontFamily: font('regular'),
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  datePill: {
    fontFamily: font('medium'),
    fontSize: 10,
    lineHeight: 14,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tagText: {
    fontFamily: font('medium'),
    fontSize: 10,
    lineHeight: 14,
  },
  empty: {
    padding: 16,
    fontFamily: font('regular'),
    fontSize: 13,
    lineHeight: 19,
  },
  bio: {
    fontFamily: font('regular'),
    fontSize: 14,
    lineHeight: 22,
  },
  certTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  skillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 14,
  },
  skillCard: {
    minWidth: '46%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  skillName: {
    fontFamily: font('semibold'),
    fontSize: 13,
    lineHeight: 18,
  },
  skillMeta: {
    fontFamily: font('regular'),
    fontSize: 11,
    lineHeight: 16,
  },
  versionNote: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  versionNoteText: {
    fontFamily: font('regular'),
    fontSize: 11,
    lineHeight: 16,
  },
});
>>>>>>> 638f4055ff750b7462870a154061a3334357ee68
