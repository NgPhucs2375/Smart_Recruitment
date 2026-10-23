import { router, useFocusEffect } from 'expo-router';
import { Bot, Save, Sparkles } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { StackHeader } from '@/components/stack-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { font, Radius } from '@/constants/theme';
import { useAuth } from '@/features/auth';
import { cvApi } from '@/features/cv/api/cv-api';
import type { CvContent } from '@/features/cv/types';
import { profileApi } from '@/features/profile/api/profile-api';
import type { CandidateProfile } from '@/features/profile/types';
import { useTheme } from '@/hooks/use-theme';

export default function CvAgentScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const fallback = useMemo(() => ({ name: user?.fullname || user?.userName || '', email: user?.email || '' }), [user]);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [prompt, setPrompt] = useState('');
  const [content, setContent] = useState<CvContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    void profileApi.getMine(fallback).then((result) => setProfile(result.profile)).catch((reason) => setError(reason instanceof Error ? reason.message : 'Không thể tải hồ sơ.'));
  }, [fallback]));

  const generate = async () => {
    if (!prompt.trim()) { setError('Hãy mô tả kinh nghiệm, kỹ năng và vị trí bạn muốn ứng tuyển.'); return; }
    setLoading(true); setError('');
    try { setContent(await cvApi.generateFromText({ text: prompt })); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Agent chưa thể tạo CV. Hãy kiểm tra 9Router và thử lại.'); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!profile?.id || !content) return;
    setSaving(true); setError('');
    try {
      const result = await cvApi.saveVersion({ profileId: profile.id, name: `CV Agent - ${content.contact.title || 'mới'}`, content, isDefault: false, method: 3 });
      router.replace({ pathname: '/cv-detail', params: { id: result.cvId } });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể lưu CV.'); }
    finally { setSaving(false); }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StackHeader title="Tạo CV bằng Agent" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.hero}>
          <View style={[styles.icon, { backgroundColor: `${theme.primary}18` }]}><Bot size={26} color={theme.primary} /></View>
          <ThemedText style={styles.title}>Mô tả để Agent tạo CV</ThemedText>
          <ThemedText style={{ color: theme.textSecondary }}>AI sẽ phân tích nội dung bạn nhập và dựng các phần chính của CV. Hãy kiểm tra lại trước khi lưu.</ThemedText>
        </Card>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          multiline
          placeholder="Ví dụ: Tôi là lập trình viên .NET 3 năm, từng xây API tuyển dụng, biết C#, SQL, Docker..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.prompt, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
        />
        <Button icon={<Sparkles size={17} color={theme.primaryForeground} />} onPress={generate} disabled={loading}>
          {loading ? 'Agent đang tạo CV...' : 'Tạo CV với Agent'}
        </Button>
        {loading ? <ActivityIndicator color={theme.primary} /> : null}
        {content ? <Card style={styles.result}>
          <ThemedText style={styles.resultTitle}>{content.contact.fullName || 'CV đã tạo'}</ThemedText>
          <ThemedText style={{ color: theme.textSecondary }}>{content.contact.title || 'Chưa xác định vị trí'}</ThemedText>
          <ThemedText style={{ color: theme.textSecondary }}>{content.skills.length} kỹ năng · {content.experience.length} kinh nghiệm · {content.education.length} học vấn</ThemedText>
          <Button icon={<Save size={17} color={theme.primaryForeground} />} onPress={save} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu CV Agent'}</Button>
        </Card> : null}
        {error ? <ThemedText style={{ color: theme.destructive }}>{error}</ThemedText> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, content: { padding: 20, gap: 14, paddingBottom: 40 }, hero: { padding: 18, gap: 9 },
  icon: { width: 52, height: 52, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: font('bold'), fontSize: 21 }, prompt: { minHeight: 170, borderWidth: 1, borderRadius: Radius.lg, padding: 14, fontFamily: font('regular'), fontSize: 15, textAlignVertical: 'top' },
  result: { padding: 18, gap: 8 }, resultTitle: { fontFamily: font('semibold'), fontSize: 18 },
});
