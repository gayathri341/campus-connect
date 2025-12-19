import { supabase } from './supabase'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
supabase.auth.getSession().then(res => {
  console.log("Supabase connected:", res)
})
