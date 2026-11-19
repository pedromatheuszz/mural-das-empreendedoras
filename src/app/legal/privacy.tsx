import { LegalDocumentView } from '@/components/legal/legal-document-view';
import { PRIVACY_POLICY } from '@/constants/legal';

export default function PrivacyScreen() {
  return <LegalDocumentView document={PRIVACY_POLICY} />;
}
