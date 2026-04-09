import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import { AuthProvider } from "./contexts/AuthContext"
import "./index.css"

const rootEl = document.getElementById("app")
if (rootEl === null) {
  throw new Error('Root element with id "app" was not found in index.html.')
}

createRoot(rootEl).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
