import { useEffect } from 'react';
import { setPageMeta } from '@/lib/seo';

export function PageMeta({ title, description }: { title: string; description?: string }) {
  useEffect(() => {
    setPageMeta(title, description);
  }, [title, description]);
  return null;
}
