export const CONTRACT_ADDRESS =
  '0x02fab29c3de458c901888d0766a5f39e63963ef51dceede495d4722b4cb9ea7d'

import type { Abi } from 'starknet'
import abiJson from './abi/swipematch.json'

export const CONTRACT_ABI = abiJson as unknown as Abi
