"use client";

import { CopilotPopup } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

export function ProductAgent() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <CopilotPopup 
        label="Assistant Produits"
        placeholder="Posez une question sur les produits..."
        defaultOpen={true}
        shortcuts={{
          togglePopup: ["ctrl+shift+p", "cmd+shift+p"]
        }}
        className="bg-white dark:bg-gray-800 shadow-lg rounded-lg"
      />
    </div>
  );
} 