import type { Metadata } from "next";
import {
  Playfair_Display,
  DM_Sans,
  Space_Grotesk,
  Inter,
} from "next/font/google";
import ConvexClientProvider from "./convex-provider";
import AgentationDev from "./agentation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: "genius.ben-mini.com",
  description: "Ben's personal annotation space",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${dmSans.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-black font-sans">
        <ConvexClientProvider>{children}</ConvexClientProvider>
        <AgentationDev />
      </body>
    </html>
  );
}
