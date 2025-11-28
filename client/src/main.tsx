import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: typeof window !== 'undefined' ? `${window.location.origin}/api/trpc` : '/api/trpc',
      transformer: superjson,
      fetch(input, init) {
        // Get supplier session from localStorage if available (only in browser)
        const headers = new Headers(init?.headers);
        
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            const supplierSession = localStorage.getItem('supplier_session');
            if (supplierSession) {
              headers.set('Authorization', `Bearer ${supplierSession}`);
            }
          } catch (error) {
            console.error('[tRPC] Failed to read supplier session from localStorage:', error);
          }
        }
        
        // Ensure input is a valid URL or Request object
        const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
        
        return globalThis.fetch(url, {
          ...(init ?? {}),
          headers,
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
