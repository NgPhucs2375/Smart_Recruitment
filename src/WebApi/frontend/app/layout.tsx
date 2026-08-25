import { CopilotProvider } from "./providers/CopilotProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CopilotProvider>{children}</CopilotProvider>
      </body>
    </html>
  );
}