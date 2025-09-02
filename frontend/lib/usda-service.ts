import { sendAOSMessage } from './aos-lib'

export interface USDABalances {
  walletBalance: string
  protocolBalance: string
}

export async function getUSDABalances(userAddress: string): Promise<USDABalances> {
  const orchestratorProcess = process.env.NEXT_PUBLIC_ORCHESTRATOR_PROCESS!
  const usdaProcess = process.env.NEXT_PUBLIC_USDA_PROCESS!

  try {
    // Get protocol balance
    const protocolBalanceResponse = await sendAOSMessage({
      process: orchestratorProcess,
      tags: [
        { name: 'Action', value: 'GetUSDABalance' }
      ]
    })

    // Get wallet balance
    const walletBalanceResponse = await sendAOSMessage({
      process: usdaProcess,
      tags: [
        { name: 'Action', value: 'Balance' }
      ]
    })

    let protocolBalance = '0'
    let walletBalance = '0'

    // Parse protocol balance
    if (protocolBalanceResponse && protocolBalanceResponse !== 'false') {
      try {
        const protocolData = JSON.parse(protocolBalanceResponse)
        protocolBalance = protocolData.balance?.toString() || '0'
      } catch (e) {
        console.error('Error parsing protocol balance:', e)
      }
    }

    // Parse wallet balance (plain text response)
    if (walletBalanceResponse && walletBalanceResponse !== 'false') {
      walletBalance = walletBalanceResponse.toString()
    }

    return {
      walletBalance,
      protocolBalance
    }
  } catch (error) {
    console.error('Error fetching USDA balances:', error)
    return {
      walletBalance: '0',
      protocolBalance: '0'
    }
  }
}

export async function sendUSDAToProtocol(amount: string): Promise<{ success: boolean; message: string }> {
  const orchestratorProcess = process.env.NEXT_PUBLIC_ORCHESTRATOR_PROCESS!
  const usdaProcess = process.env.NEXT_PUBLIC_USDA_PROCESS!

  try {
    const response = await sendAOSMessage({
      process: usdaProcess,
      tags: [
        { name: 'Action', value: 'Transfer' },
        { name: 'Recipient', value: orchestratorProcess },
        { name: 'Quantity', value: amount }
      ]
    })

    if (response && response !== 'false') {
      return { success: true, message: 'Successfully sent USDA to protocol' }
    }

    return { success: false, message: 'Failed to send USDA to protocol' }
  } catch (error) {
    console.error('Error sending USDA to protocol:', error)
    return { success: false, message: 'Error sending USDA to protocol' }
  }
}

export async function withdrawUSDAFromProtocol(): Promise<{ success: boolean; message: string }> {
  const orchestratorProcess = process.env.NEXT_PUBLIC_ORCHESTRATOR_PROCESS!

  try {
    const response = await sendAOSMessage({
      process: orchestratorProcess,
      tags: [
        { name: 'Action', value: 'WithdrawUSDA' }
      ]
    })

    if (response && response !== 'false') {
      return { success: true, message: response }
    }

    return { success: false, message: 'Failed to withdraw USDA from protocol' }
  } catch (error) {
    console.error('Error withdrawing USDA from protocol:', error)
    return { success: false, message: 'Error withdrawing USDA from protocol' }
  }
}

export async function stakeUSDA(amount: string): Promise<{ success: boolean; message: string }> {
  const orchestratorProcess = process.env.NEXT_PUBLIC_ORCHESTRATOR_PROCESS!

  try {
    const response = await sendAOSMessage({
      process: orchestratorProcess,
      tags: [
        { name: 'Action', value: 'StakeUSDA' },
        { name: 'Quantity', value: amount }
      ]
    })

    if (response && response !== 'false') {
      return { success: true, message: response }
    }

    return { success: false, message: 'Failed to stake USDA' }
  } catch (error) {
    console.error('Error staking USDA:', error)
    return { success: false, message: 'Error staking USDA' }
  }
}

export async function unstakeUSDA(amount: string): Promise<{ success: boolean; message: string }> {
  const orchestratorProcess = process.env.NEXT_PUBLIC_ORCHESTRATOR_PROCESS!

  try {
    const response = await sendAOSMessage({
      process: orchestratorProcess,
      tags: [
        { name: 'Action', value: 'UnstakeUSDA' },
        { name: 'Quantity', value: amount }
      ]
    })

    if (response && response !== 'false') {
      return { success: true, message: response }
    }

    return { success: false, message: 'Failed to unstake USDA' }
  } catch (error) {
    console.error('Error unstaking USDA:', error)
    return { success: false, message: 'Error unstaking USDA' }
  }
}