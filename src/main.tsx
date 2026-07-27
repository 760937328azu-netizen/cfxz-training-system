import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './design-system.css'
import App from './App.tsx'
import { initDemoMode } from './lib/demo-mode'

// 展示模式：在 React 渲染前预填演示数据（仅 VITE_DEMO_MODE=true 时生效）
initDemoMode()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
