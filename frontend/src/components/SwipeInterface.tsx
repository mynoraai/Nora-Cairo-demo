import { useCallback, useMemo, useState } from 'react'
import type { FC } from 'react'
import { useAccount, useProvider } from '@starknet-react/core'
import { CONTRACT_ADDRESS } from '../contract'
import type { MatchProfile } from '../types'

interface SwipeInterfaceProps {
  onMatch: (match: MatchProfile) => void
}

function isValidAddress(value: string): boolean {
  if (!value) {
    return false
  }
  return /^0x[0-9a-fA-F]{3,}$/.test(value.trim())
}

function formatAddress(value: string): string {
  if (!value.startsWith('0x')) {
    return value
  }
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

export const SwipeInterface: FC<SwipeInterfaceProps> = ({ onMatch }) => {
  const { account, address } = useAccount()
  const { provider } = useProvider()

  const [targetAddress, setTargetAddress] = useState('')
  const [txStatus, setTxStatus] = useState<string | null>(null)
  const [likeState, setLikeState] = useState<'unknown' | 'liked' | 'not-liked'>('unknown')
  const [matchState, setMatchState] = useState<'unknown' | 'matched' | 'not-matched'>('unknown')
  const [checkingStatus, setCheckingStatus] = useState(false)

  const canSendLike = useMemo(
    () => Boolean(account && address && isValidAddress(targetAddress)),
    [account, address, targetAddress]
  )

  const callView = useCallback(
    async (entrypoint: 'has_liked' | 'has_match'): Promise<boolean> => {
      if (!provider || !address || !isValidAddress(targetAddress)) {
        return false
      }
      const response = await provider.callContract({
        contractAddress: CONTRACT_ADDRESS,
        entrypoint,
        calldata: [address, targetAddress]
      })
      const rawArray = Array.isArray(response)
        ? response
        : (response as { result?: string[] }).result ?? []
      const raw = rawArray[0] ?? '0x0'
      try {
        return BigInt(raw) !== 0n
      } catch (error) {
        console.warn('Failed to parse view result', error)
        return false
      }
    },
    [provider, address, targetAddress]
  )

  const checkStatuses = useCallback(async () => {
    if (!canSendLike) {
      return
    }
    try {
      setCheckingStatus(true)
      const [liked, matched] = await Promise.all([
        callView('has_liked'),
        callView('has_match')
      ])
      setLikeState(liked ? 'liked' : 'not-liked')
      setMatchState(matched ? 'matched' : 'not-matched')

      if (matched) {
        onMatch({
          id: `${address}-${targetAddress}`,
          address: targetAddress,
          alias: formatAddress(targetAddress),
          avatar: ''
        })
      }
    } catch (error) {
      console.error('Failed to read on-chain state', error)
      setTxStatus('Could not read current match state.')
    } finally {
      setCheckingStatus(false)
    }
  }, [canSendLike, callView, onMatch, address, targetAddress])

  const sendLike = useCallback(async () => {
    if (!account) {
      alert('Connect your wallet to like someone!')
      return
    }
    if (!canSendLike) {
      alert('Enter a valid Starknet address before sending a like.')
      return
    }

    try {
      setTxStatus('Sending like transaction...')
      await account.execute({
        contractAddress: CONTRACT_ADDRESS,
        entrypoint: 'like_profile',
        calldata: [targetAddress]
      })
      setTxStatus('Like submitted! Waiting for status...')
      await checkStatuses()
    } catch (error) {
      console.error('Failed to send like', error)
      setTxStatus('Like transaction failed. Please try again.')
    }
  }, [account, canSendLike, targetAddress, checkStatuses])

  return (
    <div className="swipe-interface">
      <div className="swipe-header">
        <h2>Send a Like</h2>
        <p>Paste a Starknet address to express interest.</p>
      </div>

      <label className="form-label">
        Target address
        <input
          type="text"
          className="form-input cute-input"
          placeholder="0x..."
          value={targetAddress}
          onChange={(event) => {
            setTargetAddress(event.target.value.trim())
            setLikeState('unknown')
            setMatchState('unknown')
          }}
        />
      </label>

      <div className="button-row">
        <button className="next-btn" onClick={sendLike} disabled={!canSendLike}>
          Send Like
        </button>
        <button
          className="secondary-btn"
          onClick={checkStatuses}
          disabled={!canSendLike || checkingStatus}
        >
          {checkingStatus ? 'Checking…' : 'Refresh Status'}
        </button>
      </div>

      <div className="status-cards">
        <div className={`status-card ${likeState === 'liked' ? 'success' : ''}`}>
          <h4>Like status</h4>
          <p>
            {likeState === 'unknown'
              ? 'Not checked yet'
              : likeState === 'liked'
              ? 'You have liked this address'
              : 'No like recorded yet'}
          </p>
        </div>
        <div className={`status-card ${matchState === 'matched' ? 'success' : ''}`}>
          <h4>Match status</h4>
          <p>
            {matchState === 'unknown'
              ? 'Not checked yet'
              : matchState === 'matched'
              ? "It's a match!"
              : 'No match yet'}
          </p>
        </div>
      </div>

      {txStatus && <div className="tx-status">{txStatus}</div>}

      <div className="helper-card">
        <h4>Demo tips</h4>
        <ul>
          <li>Have a second account set up to like you back.</li>
          <li>Use “Refresh Status” after each transaction to update the on-chain state.</li>
          <li>
            Track the contract on Voyager:{' '}
            <a
              href={`https://sepolia.voyager.online/contract/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
            >
              view contract
            </a>
          </li>
        </ul>
      </div>
      {account && address && (
        <div className="helper-card">
          <h4>Your address</h4>
          <p>{formatAddress(address)}</p>
        </div>
      )}
    </div>
  )
}
