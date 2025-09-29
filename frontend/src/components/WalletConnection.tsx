import React from 'react'
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core'

export const WalletConnection: React.FC = () => {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected && address) {
    return (
      <div className="wallet-connected">
        <div className="wallet-info">
          <div className="wallet-indicator">
            <div className="status-dot" aria-label="Connected"></div>
            <span className="status-text">Connected</span>
          </div>
          <div className="wallet-address" title={address}>
            {truncateAddress(address)}
          </div>
        </div>
        <button 
          onClick={() => disconnect()}
          className="disconnect-btn"
          aria-label="Disconnect wallet"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16,17 21,12 16,7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="wallet-connect">
      <div className="connect-header">
        <div className="connect-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
        <h3>Connect Your Wallet</h3>
        <p>Securely connect to start your dating journey on Starknet</p>
      </div>
      <div className="connectors">
        {connectors.map((connector, index) => (
          <button
            key={connector.id}
            onClick={() => connect({ connector })}
            className="connector-btn"
            disabled={!connector.available()}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="connector-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <circle cx="12" cy="16" r="1"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div className="connector-content">
              <span className="connector-name">{connector.name}</span>
              <span className="connector-description">
                {connector.name === 'braavos' ? 'Braavos Wallet' : 
                 connector.name === 'argentX' ? 'ArgentX Wallet' : 
                 'Secure Wallet Connection'}
              </span>
            </div>
            <div className="connector-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6"/>
              </svg>
            </div>
          </button>
        ))}
      </div>
      <div className="connect-footer">
        <p className="security-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Your wallet connection is secure and encrypted
        </p>
      </div>
    </div>
  )
}