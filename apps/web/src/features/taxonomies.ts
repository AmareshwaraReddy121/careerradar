import { useQuery } from '@tanstack/react-query';
import type { Branch, Degree, QualificationLevel } from '@careerradar/shared';
import { api } from '@/lib/api';

export interface Taxonomies {
  qualificationLevels: { code: QualificationLevel; label: string }[];
  degrees: Degree[];
  branches: Branch[];
  skills: string[];
  states: string[];
  jobCategories: { code: string; label: string }[];
  reservationCategories: string[];
}

export function useTaxonomies() {
  return useQuery({
    queryKey: ['taxonomies'],
    queryFn: () => api<Taxonomies>('/meta/taxonomies'),
    staleTime: Infinity,
  });
}
