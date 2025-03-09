"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotPopup } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CopilotKit runtimeUrl="/api/chat">
        {children}
        <CopilotPopup 
          instructions="Je suis un assistant commercial qui peut vous aider à trouver et commander des produits."
          labels={{
            title: "Assistant Commercial",
            initial: "Comment puis-je vous aider ?"
          }}
        />
      </CopilotKit>
    </SessionProvider>
  );
} 