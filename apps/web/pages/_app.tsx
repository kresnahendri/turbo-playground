import { AppProps } from "next/app"
import { QueryClient, QueryClientProvider } from "react-query"

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Component {...pageProps} />
    </QueryClientProvider>
  )
}
