import { createContext, useContext, ReactNode } from 'react';
import { trpc } from '@/lib/trpc';

/**
 * CMS Content Type
 * Key-value map of all CMS content
 */
export type CMSContent = Record<string, string>;

/**
 * CMS Context Interface
 */
interface CMSContextValue {
  /** CMS content key-value map */
  content: CMSContent;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Get a CMS value by key with fallback */
  get: (key: string, fallback?: string) => string;
}

const CMSContext = createContext<CMSContextValue | undefined>(undefined);

interface CMSProviderProps {
  children: ReactNode;
  /** Language code (ISO 639-1), defaults to 'en' */
  languageCode?: string;
}

/**
 * CMS Provider Component
 * 
 * Fetches and provides CMS content to all child components
 * Automatically handles language fallback to English
 * 
 * Usage:
 * ```tsx
 * <CMSProvider languageCode="en">
 *   <App />
 * </CMSProvider>
 * ```
 */
export function CMSProvider({ children, languageCode = 'en' }: CMSProviderProps) {
  // Fetch CMS content from backend
  const { data: content = {}, isLoading, error } = trpc.supplier.getCMSContent.useQuery({
    languageCode,
  });

  /**
   * Get a CMS value by key with optional fallback
   * If key not found, returns fallback or the key itself
   */
  const get = (key: string, fallback?: string): string => {
    return content[key] || fallback || key;
  };

  const value: CMSContextValue = {
    content,
    isLoading,
    error: error as Error | null,
    get,
  };

  return (
    <CMSContext.Provider value={value}>
      {children}
    </CMSContext.Provider>
  );
}

/**
 * Hook to access CMS content
 * 
 * Usage:
 * ```tsx
 * const cms = useCMS();
 * return <h1>{cms.get('SAVE_EXIT_DIALOG_TITLE')}</h1>;
 * ```
 */
export function useCMS(): CMSContextValue {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error('useCMS must be used within a CMSProvider');
  }
  return context;
}

/**
 * Hook to get a single CMS value with fallback
 * 
 * Usage:
 * ```tsx
 * const title = useCMSValue('SAVE_EXIT_DIALOG_TITLE', 'Save Progress');
 * return <h1>{title}</h1>;
 * ```
 */
export function useCMSValue(key: string, fallback?: string): string {
  const cms = useCMS();
  return cms.get(key, fallback);
}
