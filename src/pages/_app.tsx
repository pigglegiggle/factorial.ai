import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/components/AuthContext";
import Navbar from "@/components/Navbar";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <div className="bg-gray-50 min-h-screen">
        <Navbar />
        <main>
          <Component {...pageProps} />
        </main>
      </div>
    </AuthProvider>
  );
}
