import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="909661526346-il1j2l903jfulvmcvrdpuamhcq68r6v6.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
)
