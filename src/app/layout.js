import "./globals.css";
import { Inter, Roboto_Mono } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata = {
  title: "SwiftClock | IST Animated",
  description: "A smooth, graphical web clock with Alarm, Timer, and Stopwatch.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${robotoMono.variable} bg-black text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}