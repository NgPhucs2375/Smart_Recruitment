import { router, useFocusEffect } from 'expo-router';
import { ChevronDown, ChevronUp, Plus, Save, Trash2 } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';

import { StackHeader } from '@/components/stack-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { font, Radius } from '@/constants/theme';
import { useAuth } from '@/features/auth';
import { validateEmail, validatePhone } from '@/features/auth/validation';
import { cvApi } from '@/features/cv/api/cv-api';
import type {
  CvCertificate,
  CvContent,
  CvEducation,
  CvExperience,
  CvProject,
  CvSkill,
} from '@/features/cv/types';
import { profileApi } from '@/features/profile/api/profile-api';
import type { CandidateProfile } from '@/features/profile/types';
import { useTheme } from '@/hooks/use-theme';

const templates = [
  { id: 'modern', name: 'Modern', description: 'Sạch, phù hợp ngành IT' },
  { id: 'professional', name: 'Professional', description: 'Trang trọng, doanh nghiệp' },
  { id: 'creative', name: 'Creative', description: 'Nổi bật cho Designer/Marketing' },
  { id: 'minimal', name: 'Minimal', description: 'Tập trung vào nội dung' },
];

function emptyContent(profile: CandidateProfile): CvContent {
  return {
    contact: {
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      github: '',
      linkedIn: '',
      portfolio: '',
      gender: profile.gender,
      birthDate: profile.birthDate,
      title: profile.title,
      expectedSalary: profile.expectedSalary,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl ?? '',
    },
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certificates: [],
  };
}

const blankEducation = (): CvEducation => ({
  school: '', major: '', degree: '', startDate: '', endDate: '', current: false, description: '',
});
const blankExperience = (): CvExperience => ({
  company: '', title: '', location: '', startDate: '', endDate: '', current: false, description: '', skills: [],
});
const blankProject = (): CvProject => ({
  name: '', role: '', technologies: [], link: '', description: '', startDate: '', endDate: '', current: false,
});
const blankSkill = (): CvSkill => ({ name: '', level: null, years: null });
const blankCertificate = (): CvCertificate => ({
  name: '', issuer: '', issuedAt: '', expiresAt: '', credentialId: '', credentialUrl: '',
});

export default function CvCreateScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const fallback = useMemo(
    () => ({ name: user?.fullname || user?.userName || '', email: user?.email || '' }),
    [user],
  );
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [content, setContent] = useState<CvContent | null>(null);
  const [name, setName] = useState('CV của tôi');
  const [templateId, setTemplateId] = useState('modern');
  const [open, setOpen] = useState<Record<string, boolean>>({
    contact: true, education: true, experience: true, projects: false, skills: true, certificates: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    void profileApi.getMine(fallback).then((result) => {
      setProfile(result.profile);
      if (result.profile) setContent(emptyContent(result.profile));
    }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Không thể tải hồ sơ.'));
  }, [fallback]));

  const updateContact = (key: keyof CvContent['contact'], value: string) =>
    setContent((current) => current ? { ...current, contact: { ...current.contact, [key]: value } } : current);

  const updateList = <K extends keyof CvContent>(
    key: K,
    index: number,
    value: CvContent[K] extends (infer T)[] ? Partial<T> : never,
  ) => setContent((current) => {
    if (!current) return current;
    const list = [...(current[key] as unknown[])] as Record<string, unknown>[];
    list[index] = { ...list[index], ...value };
    return { ...current, [key]: list } as CvContent;
  });

  const addItem = (key: 'education' | 'experience' | 'projects' | 'skills' | 'certificates') => {
    const item = {
      education: blankEducation, experience: blankExperience, projects: blankProject,
      skills: blankSkill, certificates: blankCertificate,
    }[key]();
    setContent((current) => current ? { ...current, [key]: [...current[key], item] } : current);
  };

  const removeItem = (key: keyof Pick<CvContent, 'education' | 'experience' | 'projects' | 'skills' | 'certificates'>, index: number) =>
    setContent((current) => current ? { ...current, [key]: current[key].filter((_, itemIndex) => itemIndex !== index) } : current);

  const save = async () => {
    if (!profile?.id || !content) return setError('Bạn cần hoàn thiện hồ sơ ứng viên trước.');
    if (!content.contact.fullName.trim() || !content.contact.email.trim() || !content.contact.phone.trim()) return setError('Hãy nhập họ tên, email và số điện thoại.');
    if (content.contact.fullName.trim().length > 100) return setError('Họ tên tối đa 100 ký tự.');
    const emailError = validateEmail(content.contact.email);
    if (emailError) return setError(emailError);
    const phoneError = validatePhone(content.contact.phone);
    if (phoneError) return setError(phoneError);
    if (name.trim().length > 255) return setError('Tên CV tối đa 255 ký tự.');
    setSaving(true);
    setError('');
    try {
      const result = await cvApi.saveVersion({
        profileId: profile.id,
        name,
        content,
        templateId,
        isDefault: false,
        method: 1,
      });
      router.replace({ pathname: '/cv-detail', params: { id: result.cvId } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể lưu CV.');
    } finally {
      setSaving(false);
    }
  };

  if (!content) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <StackHeader title="Tạo CV thủ công" />
        <ActivityIndicator color={theme.primary} style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StackHeader title="Tạo CV thủ công" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText style={styles.title}>Tạo CV như trên web</ThemedText>
        <ThemedText style={{ color: theme.textSecondary }}>
          Điền từng phần, thêm nhiều mục và chọn mẫu hiển thị trước khi lưu.
        </ThemedText>

         <Field label="Tên CV" value={name} onChangeText={setName} maxLength={255} theme={theme} />
        <Card style={styles.templateCard}>
          <ThemedText style={styles.sectionHeading}>Mẫu CV</ThemedText>
          <View style={styles.templateGrid}>
            {templates.map((template) => (
              <Pressable
                key={template.id}
                onPress={() => setTemplateId(template.id)}
                style={[
                  styles.template,
                  { borderColor: templateId === template.id ? theme.primary : theme.border },
                  templateId === template.id && { backgroundColor: `${theme.primary}12` },
                ]}
              >
                <ThemedText style={styles.templateName}>{template.name}</ThemedText>
                <ThemedText style={{ color: theme.textSecondary, fontSize: 11 }}>{template.description}</ThemedText>
              </Pressable>
            ))}
          </View>
        </Card>

        <Section title="Thông tin liên hệ" open={open.contact} onToggle={() => setOpen((value) => ({ ...value, contact: !value.contact }))} theme={theme}>
          <Field label="Họ và tên" value={content.contact.fullName} onChangeText={(value) => updateContact('fullName', value)} theme={theme} />
          <Field label="Email" value={content.contact.email} onChangeText={(value) => updateContact('email', value)} keyboardType="email-address" theme={theme} />
          <Field label="Số điện thoại" value={content.contact.phone} onChangeText={(value) => updateContact('phone', value)} keyboardType="phone-pad" theme={theme} />
          <Field label="Địa chỉ" value={content.contact.location} onChangeText={(value) => updateContact('location', value)} theme={theme} />
          <Field label="Vị trí ứng tuyển" value={content.contact.title} onChangeText={(value) => updateContact('title', value)} theme={theme} />
          <Field label="Ngày sinh (dd/mm/yyyy)" value={content.contact.birthDate} onChangeText={(value) => updateContact('birthDate', value)} theme={theme} />
          <Field label="GitHub" value={content.contact.github} onChangeText={(value) => updateContact('github', value)} theme={theme} />
          <Field label="LinkedIn" value={content.contact.linkedIn} onChangeText={(value) => updateContact('linkedIn', value)} theme={theme} />
          <Field label="Portfolio" value={content.contact.portfolio} onChangeText={(value) => updateContact('portfolio', value)} theme={theme} />
          <Field label="Giới thiệu bản thân" value={content.contact.bio} onChangeText={(value) => updateContact('bio', value)} multiline theme={theme} />
        </Section>

        <ListSection title="Học vấn" count={content.education.length} open={open.education} onToggle={() => setOpen((value) => ({ ...value, education: !value.education }))} onAdd={() => addItem('education')} theme={theme}>
          {content.education.map((item, index) => <Card key={index} style={styles.itemCard}>
            <ItemHeader title={`Học vấn ${index + 1}`} onRemove={() => removeItem('education', index)} theme={theme} />
            <Field label="Trường" value={item.school} onChangeText={(value) => updateList('education', index, { school: value })} theme={theme} />
            <Field label="Chuyên ngành" value={item.major} onChangeText={(value) => updateList('education', index, { major: value })} theme={theme} />
            <Field label="Bằng cấp" value={item.degree} onChangeText={(value) => updateList('education', index, { degree: value })} theme={theme} />
            <DatePair item={item} onChange={(value) => updateList('education', index, value)} theme={theme} />
            <Field label="Mô tả" value={item.description} onChangeText={(value) => updateList('education', index, { description: value })} multiline theme={theme} />
          </Card>)}
        </ListSection>

        <ListSection title="Kinh nghiệm làm việc" count={content.experience.length} open={open.experience} onToggle={() => setOpen((value) => ({ ...value, experience: !value.experience }))} onAdd={() => addItem('experience')} theme={theme}>
          {content.experience.map((item, index) => <Card key={index} style={styles.itemCard}>
            <ItemHeader title={`Kinh nghiệm ${index + 1}`} onRemove={() => removeItem('experience', index)} theme={theme} />
            <Field label="Công ty" value={item.company} onChangeText={(value) => updateList('experience', index, { company: value })} theme={theme} />
            <Field label="Chức danh" value={item.title} onChangeText={(value) => updateList('experience', index, { title: value })} theme={theme} />
            <Field label="Địa điểm" value={item.location} onChangeText={(value) => updateList('experience', index, { location: value })} theme={theme} />
            <DatePair item={item} onChange={(value) => updateList('experience', index, value)} theme={theme} />
            <Toggle label="Đang làm việc tại đây" value={item.current} onValueChange={(value) => updateList('experience', index, { current: value })} theme={theme} />
            <Field label="Mô tả công việc" value={item.description} onChangeText={(value) => updateList('experience', index, { description: value })} multiline theme={theme} />
            <Field label="Kỹ năng sử dụng (phân cách bằng dấu phẩy)" value={item.skills.join(', ')} onChangeText={(value) => updateList('experience', index, { skills: value.split(',').map((skill) => skill.trim()).filter(Boolean) })} theme={theme} />
          </Card>)}
        </ListSection>

        <ListSection title="Dự án" count={content.projects.length} open={open.projects} onToggle={() => setOpen((value) => ({ ...value, projects: !value.projects }))} onAdd={() => addItem('projects')} theme={theme}>
          {content.projects.map((item, index) => <Card key={index} style={styles.itemCard}>
            <ItemHeader title={`Dự án ${index + 1}`} onRemove={() => removeItem('projects', index)} theme={theme} />
            <Field label="Tên dự án" value={item.name} onChangeText={(value) => updateList('projects', index, { name: value })} theme={theme} />
            <Field label="Vai trò" value={item.role} onChangeText={(value) => updateList('projects', index, { role: value })} theme={theme} />
            <Field label="Link dự án" value={item.link} onChangeText={(value) => updateList('projects', index, { link: value })} theme={theme} />
            <Field label="Công nghệ (phân cách bằng dấu phẩy)" value={item.technologies.join(', ')} onChangeText={(value) => updateList('projects', index, { technologies: value.split(',').map((tech) => tech.trim()).filter(Boolean) })} theme={theme} />
            <Field label="Mô tả" value={item.description} onChangeText={(value) => updateList('projects', index, { description: value })} multiline theme={theme} />
          </Card>)}
        </ListSection>

        <ListSection title="Kỹ năng" count={content.skills.length} open={open.skills} onToggle={() => setOpen((value) => ({ ...value, skills: !value.skills }))} onAdd={() => addItem('skills')} theme={theme}>
          {content.skills.map((item, index) => <Card key={index} style={styles.itemCard}>
            <ItemHeader title={`Kỹ năng ${index + 1}`} onRemove={() => removeItem('skills', index)} theme={theme} />
            <Field label="Tên kỹ năng" value={item.name} onChangeText={(value) => updateList('skills', index, { name: value })} theme={theme} />
            <Field label="Mức độ (0-3)" value={item.level?.toString() ?? ''} onChangeText={(value) => updateList('skills', index, { level: value ? Number(value) : null })} keyboardType="numeric" theme={theme} />
            <Field label="Số năm kinh nghiệm" value={item.years?.toString() ?? ''} onChangeText={(value) => updateList('skills', index, { years: value ? Number(value) : null })} keyboardType="numeric" theme={theme} />
          </Card>)}
        </ListSection>

        <ListSection title="Chứng chỉ" count={content.certificates.length} open={open.certificates} onToggle={() => setOpen((value) => ({ ...value, certificates: !value.certificates }))} onAdd={() => addItem('certificates')} theme={theme}>
          {content.certificates.map((item, index) => <Card key={index} style={styles.itemCard}>
            <ItemHeader title={`Chứng chỉ ${index + 1}`} onRemove={() => removeItem('certificates', index)} theme={theme} />
            <Field label="Tên chứng chỉ" value={item.name} onChangeText={(value) => updateList('certificates', index, { name: value })} theme={theme} />
            <Field label="Đơn vị cấp" value={item.issuer} onChangeText={(value) => updateList('certificates', index, { issuer: value })} theme={theme} />
            <Field label="Ngày cấp" value={item.issuedAt} onChangeText={(value) => updateList('certificates', index, { issuedAt: value })} theme={theme} />
            <Field label="Mã xác minh" value={item.credentialId} onChangeText={(value) => updateList('certificates', index, { credentialId: value })} theme={theme} />
            <Field label="Link chứng chỉ" value={item.credentialUrl} onChangeText={(value) => updateList('certificates', index, { credentialUrl: value })} theme={theme} />
          </Card>)}
        </ListSection>

        {error ? <ThemedText style={{ color: theme.destructive }}>{error}</ThemedText> : null}
        <Button size="lg" icon={<Save size={18} color={theme.primaryForeground} />} onPress={save} disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu CV'}
        </Button>
      </ScrollView>
    </View>
  );
}

function Section({ title, open, onToggle, children, theme }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode; theme: ReturnType<typeof useTheme> }) {
  return <Card style={styles.section}><Pressable onPress={onToggle} style={styles.sectionHeader}><ThemedText style={styles.sectionHeading}>{title}</ThemedText>{open ? <ChevronUp size={19} color={theme.textSecondary} /> : <ChevronDown size={19} color={theme.textSecondary} />}</Pressable>{open ? <View style={styles.sectionBody}>{children}</View> : null}</Card>;
}

function ListSection({ title, count, onAdd, ...props }: { title: string; count: number; onAdd: () => void; open: boolean; onToggle: () => void; children: React.ReactNode; theme: ReturnType<typeof useTheme> }) {
  return <Section {...props} title={`${title} (${count})`}><View style={styles.addRow}><Button size="sm" variant="outline" icon={<Plus size={15} color={props.theme.primary} />} onPress={onAdd}>Thêm mục</Button></View>{props.children}</Section>;
}

function ItemHeader({ title, onRemove, theme }: { title: string; onRemove: () => void; theme: ReturnType<typeof useTheme> }) {
  return <View style={styles.itemHeader}><ThemedText style={styles.itemTitle}>{title}</ThemedText><Pressable onPress={onRemove} hitSlop={8}><Trash2 size={17} color={theme.destructive} /></Pressable></View>;
}

function DatePair({ item, onChange, theme }: { item: { startDate: string; endDate: string }; onChange: (value: { startDate: string; endDate: string }) => void; theme: ReturnType<typeof useTheme> }) {
  return <View style={styles.twoColumns}><View style={styles.column}><Field label="Từ tháng/năm" value={item.startDate} onChangeText={(value) => onChange({ startDate: value, endDate: item.endDate })} theme={theme} /></View><View style={styles.column}><Field label="Đến tháng/năm" value={item.endDate} onChangeText={(value) => onChange({ startDate: item.startDate, endDate: value })} theme={theme} /></View></View>;
}

function Toggle({ label, value, onValueChange, theme }: { label: string; value: boolean; onValueChange: (value: boolean) => void; theme: ReturnType<typeof useTheme> }) {
  return <View style={styles.toggle}><ThemedText style={{ color: theme.textSecondary }}>{label}</ThemedText><Switch value={value} onValueChange={onValueChange} trackColor={{ true: theme.primary }} /></View>;
}

function Field({ label, theme, multiline, keyboardType, maxLength, ...props }: { label: string; theme: ReturnType<typeof useTheme>; multiline?: boolean; maxLength?: number; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric' }) {
  return <View style={styles.field}><ThemedText style={{ color: theme.textSecondary }}>{label}</ThemedText><TextInput {...props} maxLength={maxLength} keyboardType={keyboardType} multiline={multiline} placeholder={label} placeholderTextColor={theme.textSecondary} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }, multiline && styles.multiline]} /></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loader: { marginTop: 40 },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  title: { fontFamily: font('bold'), fontSize: 24, marginBottom: -6 },
  templateCard: { padding: 15, gap: 12 },
  templateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  template: { width: '48%', minHeight: 70, borderWidth: 1, borderRadius: Radius.lg, padding: 10, gap: 4 },
  templateName: { fontFamily: font('semibold'), fontSize: 14 },
  section: { padding: 0, overflow: 'hidden' },
  sectionHeader: { minHeight: 52, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionHeading: { fontFamily: font('semibold'), fontSize: 16 },
  sectionBody: { padding: 15, paddingTop: 0, gap: 12 },
  addRow: { alignItems: 'flex-start', marginBottom: 2 },
  itemCard: { padding: 13, gap: 10, borderRadius: Radius.xl },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemTitle: { fontFamily: font('semibold'), fontSize: 14 },
  field: { gap: 5 },
  input: { minHeight: 44, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: 12, fontFamily: font('regular'), fontSize: 14 },
  multiline: { minHeight: 92, textAlignVertical: 'top', paddingTop: 11 },
  twoColumns: { flexDirection: 'row', gap: 8 },
  column: { flex: 1 },
  toggle: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
