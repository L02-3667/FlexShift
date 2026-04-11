/* eslint-disable react-hooks/exhaustive-deps */
import {
  startTransition,
  type DependencyList,
  useEffect,
  useRef,
  useState,
} from 'react';

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Da co loi xay ra. Vui long thu lai.';
}

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: DependencyList,
  initialData: T,
) {
  const loaderRef = useRef(loader);
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  loaderRef.current = loader;

  const reload = async () => {
    setLoading(true);
    setError(null);

    try {
      const nextData = await loader();
      startTransition(() => {
        setData(nextData);
      });
    } catch (error) {
      setError(toErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const nextData = await loaderRef.current();

        if (!isActive) {
          return;
        }

        startTransition(() => {
          setData(nextData);
        });
      } catch (error) {
        if (isActive) {
          setError(toErrorMessage(error));
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [...deps]);

  return {
    data,
    loading,
    error,
    reload,
  };
}
