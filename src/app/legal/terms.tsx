import { LegalDocumentView } from '@/components/legal/legal-document-view';
import { TERMS_OF_USE } from '@/constants/legal';

export default function TermsScreen() {
  return <LegalDocumentView document={TERMS_OF_USE} />;
}
