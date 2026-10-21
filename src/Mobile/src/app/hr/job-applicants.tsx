import { useLocalSearchParams } from 'expo-router';

import { ApplicantsInbox } from '@/features/hr/components/applicants-inbox';
import { HrScreenShell, HrTopBar } from '@/features/hr/components/hr-primitives';

export default function HRJobApplicantsRoute() {
  const params = useLocalSearchParams<{ id?: string; title?: string }>();
  const jobId = Number(params.id) || 0;
  const title = params.title || `Ứng viên tin #${jobId || ''}`;

  return (
    <HrScreenShell>
      <HrTopBar title={title} />
      <ApplicantsInbox jobId={jobId > 0 ? jobId : undefined} jobTitle={title} />
    </HrScreenShell>
  );
}
