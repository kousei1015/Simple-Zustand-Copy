import React from 'react'
import ReactDOM from 'react-dom/client'
import Count from './Count.tsx'
import Increment from './Increment.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Count />
    <Increment />
  </React.StrictMode>,
)
