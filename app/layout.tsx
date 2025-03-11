import './globals.css'
import { Inter } from 'next/font/google'
import { ProductAgent } from './components/ProductAgent'
import { CopilotKit } from "@copilotkit/react-core"
import "@copilotkit/react-ui/styles.css"
import ClientWrapper from './client-wrapper'
import { ReactNode } from "react"
import { Providers } from "./providers"

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Product Manager',
  description: 'AI-powered product management system',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>
          <CopilotKit runtimeUrl="/api/copilotkit">
            {children}
            <ProductAgent />
          </CopilotKit>
        </Providers>
      </body>
    </html>
  )
}
