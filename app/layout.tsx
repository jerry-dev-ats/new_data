import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: '공공 API 뷰어',
  description:
    '식품의약품안전처 등 공공 API 응답을 비개발자도 쉽게 열람하도록 정리한 통합 뷰어',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
