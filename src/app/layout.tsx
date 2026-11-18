import "./globals.css";
export const metadata = { title: "Gari Care", description: "Vehicle service management" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
