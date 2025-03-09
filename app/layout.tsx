import './globals.css'
import { Inter } from 'next/font/google'
import { ProductAgent } from './components/ProductAgent'
import { CopilotKit } from "@copilotkit/react-core"
import ClientWrapper from './client-wrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Product Manager',
  description: 'AI-powered product management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientWrapper>
          <CopilotKit runtimeUrl="/api/agent">
            {children}
            <ProductAgent />
          </CopilotKit>
        </ClientWrapper>
      </body>
    </html>
  )
}
