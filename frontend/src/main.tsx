import React from 'react'
import ReactDOM from 'react-dom/client'
import { StarknetConfig, argent, braavos, publicProvider } from '@starknet-react/core'
import { sepolia } from '@starknet-react/chains'
import App from './App.tsx'
import './index.css'

function StarknetProvider({ children }: { children: React.ReactNode }) {
  return (
    <StarknetConfig
      chains={[sepolia]}
      provider={publicProvider()}
      connectors={[argent(), braavos()]}
      autoConnect
    >
      {children}
    </StarknetConfig>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StarknetProvider>
      <App />
    </StarknetProvider>
  </React.StrictMode>,
)
