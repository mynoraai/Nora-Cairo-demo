import { useEffect, useMemo, useState } from 'react'
import { useAccount, useReadContract } from '@starknet-react/core'
import { WalletConnection } from './components/WalletConnection'
import { ProfileSetup } from './components/ProfileSetup'
import { SwipeInterface } from './components/SwipeInterface'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from './contract'
import type { MatchProfile } from './types'
import './App.css'

function App() {
  const { isConnected, address } = useAccount()
  const [hasProfile, setHasProfile] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(false)
  const [currentView, setCurrentView] = useState<'swipe' | 'matches'>('swipe')
  const [matches, setMatches] = useState<MatchProfile[]>([])

  const canCheckProfile = useMemo(() => Boolean(isConnected && address), [isConnected, address])

  const readArgs = useMemo(() => (canCheckProfile && address ? [address] : undefined), [
    canCheckProfile,
    address
  ])

  const { data: profileCommitment, refetch: refetchProfile } = useReadContract({
    functionName: 'get_profile_commitment',
    args: readArgs,
    abi: CONTRACT_ABI,
    address: CONTRACT_ADDRESS,
    enabled: canCheckProfile,
    watch: false
  })

  useEffect(() => {
    if (canCheckProfile) {
      setCheckingProfile(true)
      // Check if user has a profile by checking if commitment exists and is not 0
      const normalized = Array.isArray(profileCommitment)
        ? profileCommitment[0]
        : profileCommitment
      const hasValue = normalized && normalized !== '0x0' && normalized !== 0
      setHasProfile(Boolean(hasValue))
      setCheckingProfile(false)
    }
  }, [canCheckProfile, profileCommitment])

  const handleProfileCreated = () => {
    setHasProfile(true)
    refetchProfile()
  }

  const handleMatch = (matchedProfile: MatchProfile) => {
    setMatches(prev => [...prev, matchedProfile])
    // Show matches view briefly to celebrate
    setCurrentView('matches')
    setTimeout(() => {
      setCurrentView('swipe')
    }, 3000) // Return to swipe view after 3 seconds
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">SwipeMatch</h1>
        <p className="app-subtitle">Find your perfect match on Starknet</p>
      </header>

      <main className="app-main">
        {!isConnected ? (
          <div className="welcome-section">
            <div className="welcome-content">
              <h2>Welcome to SwipeMatch</h2>
              <p>The decentralized dating app where privacy meets love</p>
              <div className="features">
                <div className="feature">
                  <span className="feature-label">Security</span>
                  <span>Zero-knowledge profiles</span>
                </div>
                <div className="feature">
                  <span className="feature-label">Matching</span>
                  <span>Swipe to find matches</span>
                </div>
                <div className="feature">
                  <span className="feature-label">Connect</span>
                  <span>Celebrate connections</span>
                </div>
              </div>
            </div>
            <WalletConnection />
          </div>
        ) : (
          <div className="app-content">
            <div className="header-with-wallet">
              <WalletConnection />
            </div>
            
            {checkingProfile ? (
              <div className="loading-section">
                <div className="loading-spinner"></div>
                <p>Checking your profile...</p>
              </div>
            ) : !hasProfile ? (
              <ProfileSetup onProfileCreated={handleProfileCreated} />
            ) : (
              <div className="dating-app">
                {/* Navigation */}
                <div className="app-navigation">
                  <button 
                    className={`nav-btn ${currentView === 'swipe' ? 'active' : ''}`}
                    onClick={() => setCurrentView('swipe')}
                  >
                    <span className="nav-label">Discover</span>
                  </button>
                  <button 
                    className={`nav-btn ${currentView === 'matches' ? 'active' : ''}`}
                    onClick={() => setCurrentView('matches')}
                  >
                    <span className="nav-label">Matches</span>
                    {matches.length > 0 && (
                      <span className="matches-badge">{matches.length}</span>
                    )}
                  </button>
                </div>

                {/* Main Content */}
                {currentView === 'swipe' ? (
                  <SwipeInterface onMatch={handleMatch} />
                ) : (
                  <div className="matches-view">
                    <div className="matches-header">
                      <h2>Your Matches</h2>
                      <p>You have {matches.length} match{matches.length !== 1 ? 'es' : ''}!</p>
                    </div>
                    
                    {matches.length === 0 ? (
                      <div className="no-matches">
                        <h3>No matches yet</h3>
                        <p>Keep swiping to find your perfect match!</p>
                        <button 
                          className="back-to-swipe-btn"
                          onClick={() => setCurrentView('swipe')}
                        >
                          Start Swiping
                        </button>
                      </div>
                    ) : (
                      <div className="matches-grid">
                        {matches.map((match) => (
                          <div key={match.id} className="match-card">
                            <div className="match-photo">
                              <div className="match-avatar"></div>
                            </div>
                            <div className="match-info">
                              <h4>{match.alias ?? match.address.slice(0, 10)}...</h4>
                              {match.bio ? (
                                <p className="match-bio">{match.bio.substring(0, 60)}...</p>
                              ) : (
                                <p className="match-bio">On-chain match detected!</p>
                              )}
                              {match.interests && match.interests.length > 0 && (
                                <div className="match-interests">
                                  {match.interests.slice(0, 2).map((interest, index) => (
                                    <span key={index} className="match-interest">
                                      {interest}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="match-actions">
                              <a
                                className="message-btn"
                                href={`https://sepolia.voyager.online/contract/${match.address}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View on Voyager
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Built on Starknet</p>
      </footer>
    </div>
  )
}

export default App
