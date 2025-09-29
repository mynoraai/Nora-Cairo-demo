import { useMemo, useState } from 'react'
import type { FC } from 'react'
import { useAccount } from '@starknet-react/core'
import { hash, num } from 'starknet'
import { CONTRACT_ADDRESS } from '../contract'

interface ProfileData {
  name: string
  age: string
  bio: string
  interests: string[]
}

interface ProfileSetupProps {
  onProfileCreated?: () => void
}

interface StoredProfile {
  commitment: string
  salt: string
  profile: ProfileData
  timestamp: number
}

const STORAGE_KEY = 'swipematch_profile'

const INTERESTS = [
  '🎵 Music',
  '🎬 Movies',
  '📚 Reading',
  '🏃‍♀️ Fitness',
  '🍳 Cooking',
  '✈️ Travel',
  '🎨 Art',
  '🎮 Gaming',
  '🌱 Nature',
  '📷 Photography',
  '🍷 Wine',
  '🐕 Pets'
]

function randomSalt(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `0x${hex}`
}

function buildCommitment(data: ProfileData, salt: string): string {
  const payload = `${data.name.trim()}|${data.age.trim()}|${data.bio.trim()}|${
    [...data.interests].sort().join(',')
  }|${salt}`
  const hashed = hash.starknetKeccak(payload)
  return num.toHex(hashed)
}

export const ProfileSetup: FC<ProfileSetupProps> = ({ onProfileCreated }) => {
  const { account } = useAccount()
  const [step, setStep] = useState(1)
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    age: '',
    bio: '',
    interests: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const storedProfile = useMemo<StoredProfile | null>(() => {
    if (typeof window === 'undefined') {
      return null
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as StoredProfile) : null
    } catch (error) {
      console.warn('Failed to read stored profile', error)
      return null
    }
  }, [])

  const updateInterests = (interest: string) => {
    setProfileData((prev) => {
      const alreadyPicked = prev.interests.includes(interest)
      if (alreadyPicked) {
        return { ...prev, interests: prev.interests.filter((i) => i !== interest) }
      }
      return { ...prev, interests: [...prev.interests, interest] }
    })
  }

  const handleSubmit = async () => {
    if (!account) {
      alert('Connect your wallet before saving your profile.')
      return
    }

    if (!profileData.name || !profileData.age || !profileData.bio) {
      alert('Please complete all required fields.')
      return
    }

    if (profileData.interests.length === 0) {
      alert('Pick at least one interest to help others find you!')
      return
    }

    const salt = randomSalt()
    const commitment = buildCommitment(profileData, salt)

    setIsSubmitting(true)
    try {
      await account.execute({
        contractAddress: CONTRACT_ADDRESS,
        entrypoint: 'set_profile',
        calldata: [commitment]
      })

      if (typeof window !== 'undefined') {
        const record: StoredProfile = {
          commitment,
          salt,
          profile: profileData,
          timestamp: Date.now()
        }
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
      }

      alert('Profile saved on Starknet! 💖')
      onProfileCreated?.()
    } catch (error) {
      console.error('Failed to set profile', error)
      alert('Failed to save your profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="profile-setup">
      <div className="progress-bar">
        <div className="progress-steps">
          {[1, 2, 3].map((stepNum) => (
            <div
              key={stepNum}
              className={`progress-step ${step >= stepNum ? 'completed' : ''} ${
                step === stepNum ? 'active' : ''
              }`}
            >
              {step > stepNum ? '✓' : stepNum}
            </div>
          ))}
        </div>
        <div className="progress-line">
          <div className="progress-fill" style={{ width: `${((step - 1) / 2) * 100}%` }} />
        </div>
      </div>

      <div className="profile-form">
        {step === 1 && (
          <div className="profile-step">
            <div className="step-header">
              <h3>💝 Tell us about yourself</h3>
              <p>Share the basics so people can find you.</p>
            </div>

            <label className="form-label">
              <span className="label-icon">👤</span> Name
              <input
                type="text"
                className="form-input cute-input"
                placeholder="Starknet Superstar"
                value={profileData.name}
                onChange={(event) =>
                  setProfileData((prev) => ({ ...prev, name: event.target.value }))
                }
                maxLength={50}
              />
            </label>

            <label className="form-label">
              <span className="label-icon">🎂</span> Age
              <input
                type="number"
                className="form-input cute-input"
                min="18"
                max="120"
                value={profileData.age}
                onChange={(event) =>
                  setProfileData((prev) => ({ ...prev, age: event.target.value }))
                }
              />
            </label>

            <div className="step-actions">
              <button
                className="next-btn"
                onClick={() => setStep(2)}
                disabled={!profileData.name || !profileData.age}
              >
                Next Step 💕
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="profile-step">
            <div className="step-header">
              <h3>✨ Share your story</h3>
              <p>What should your future match know about you?</p>
            </div>

            <label className="form-label">
              <span className="label-icon">💭</span> Bio
              <textarea
                className="form-textarea cute-input"
                placeholder="I love hiking, zero-knowledge proofs, and weekend brunches!"
                value={profileData.bio}
                onChange={(event) =>
                  setProfileData((prev) => ({ ...prev, bio: event.target.value }))
                }
                rows={4}
                maxLength={280}
              />
              <div className="char-count">{profileData.bio.length}/280 characters</div>
            </label>

            <div className="step-actions">
              <button className="back-btn" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button
                className="next-btn"
                onClick={() => setStep(3)}
                disabled={profileData.bio.length < 20}
              >
                Next Step 💖
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="profile-step">
            <div className="step-header">
              <h3>🎯 Interests</h3>
              <p>Select topics that light you up (at least one).</p>
            </div>

            <div className="interests-grid">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  className={`interest-btn ${
                    profileData.interests.includes(interest) ? 'selected' : ''
                  }`}
                  onClick={() => updateInterests(interest)}
                  type="button"
                >
                  {interest}
                </button>
              ))}
            </div>

            <div className="selected-count">
              {profileData.interests.length} selected
            </div>

            <div className="step-actions">
              <button className="back-btn" onClick={() => setStep(2)}>
                ← Back
              </button>
              <button className="submit-btn" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Profile 💞'}
              </button>
            </div>

            {storedProfile && (
              <div className="stored-profile">
                <h4>Last saved profile commitment</h4>
                <p>
                  <strong>Commitment:</strong> {storedProfile.commitment}
                </p>
                <p>
                  <strong>Salt:</strong> {storedProfile.salt}
                </p>
                <p>
                  <strong>Updated:</strong>{' '}
                  {new Date(storedProfile.timestamp).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
