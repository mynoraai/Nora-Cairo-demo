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
            <div className="status-dot"></div>
            <span>Connected</span>
          </div>
          <div className="wallet-address">
            {truncateAddress(address)}
          </div>
        </div>
        <button 
          onClick={() => disconnect()}
          className="disconnect-btn"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="wallet-connect">
      <div className="connect-header">
        <h3>Connect Your Wallet</h3>
        <p>Connect to start finding your perfect match!</p>
      </div>
      <div className="connectors">
        {connectors.map((connector) => (
          <button
            key={connector.id}
            onClick={() => connect({ connector })}
            className="connector-btn"
            disabled={!connector.available()}
          >
            <span>{connector.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}