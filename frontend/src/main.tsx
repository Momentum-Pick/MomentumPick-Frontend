import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from './App'
import './index.css'
import ErrorBoundary from '@/components/ErrorBoundary'

import Index from "@/pages/Index"
import NewsDetail from "@/pages/NewsDetail"
import NotFound from "@/pages/NotFound"

// 전역 에러 핸들러: 렌더/비동기 에러를 콘솔에 기록합니다.
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    // event.error may be undefined for some runtime errors; fallback to message
    console.error('Global error event:', event.error ?? event.message, event);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise rejection:', event.reason);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Index />} />
            <Route path="news/:ticker" element={<NewsDetail />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
