import { useCallback } from 'react';

export const useToast = () => {
  const toast = useCallback((opts: any) => {
    // minimal placeholder: log to console
    console.info('TOAST:', opts);
  }, []);

  return { toast };
};

export default useToast;
