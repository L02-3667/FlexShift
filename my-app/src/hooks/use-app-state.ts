import { useAppContext } from '@/src/context/app-context';

export function useAppState() {
  return useAppContext();
}
