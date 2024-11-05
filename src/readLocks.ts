import { createPublicClient, http, formatEther, getAddress, Address, Hash, keccak256, toHex } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

async function main() {
    // create client
    const client = createPublicClient({
        chain: arbitrumSepolia,
        transport: http()
    })

    const contractAddr = '0x543FF5baFD7fcD727711900A48F040B4405D4618'

    // read array length (slot 0)
    const lengthSlot = ('0x' + '0'.padStart(64, '0')) as Hash
    const length = await client.getStorageAt({
        address: contractAddr as Address,
        slot: lengthSlot
    })

    const arrayLength = BigInt(length || '0x0')
    console.log('arrayLength:', arrayLength)

    // calculate keccak256 hash of array start position
    const arraySlot = ('0x' + '0'.padStart(64, '0')) as `0x${string}`
    const baseSlot = keccak256(arraySlot)

    // read each array element
    for (let i = 0n; i < arrayLength; i++) {
        // calculate current element storage position
        const currentSlot = toHex(BigInt(baseSlot) + i * 2n, { size: 32 })
        const slot1 = currentSlot as Hash

        // read first slot (user + startTime)
        const data = await client.getStorageAt({
            address: contractAddr as Address,
            slot: slot1
        })

        // read second slot (amount)
        const nextSlot = toHex(BigInt(baseSlot) + i * 2n + 1n, { size: 32 }) as Hash
        const amountData = await client.getStorageAt({
            address: contractAddr as Address,
            slot: nextSlot
        })

        if (!data || !amountData) continue

        // parse data
        const user = getAddress('0x' + data.slice(-40)) // last 20 bytes are user address
        const startTimeHex = '0x' + data.slice(10, 26) // middle 8 bytes are startTime
        const startTime = Number(BigInt(startTimeHex))
        const amount = BigInt(amountData)

        console.log(`locks[${i}]:`)
        console.log(`  user: ${user}`)
        console.log(`  startTime: ${new Date(startTime * 1000).toLocaleString()} (${startTime})`)
        console.log(`  amount: ${formatEther(amount)} ETH`)

        // Debug information
        console.log(`  Debug - slot1 data: ${data}`)
        console.log(`    Offset: 0 - padding: ${data.slice(2, 10)}`)    // first 4 bytes (padding)
        console.log(`    Offset: 4 - startTime: ${data.slice(10, 26)}`) // middle 8 bytes
        console.log(`    Offset: 12 - user: ${data.slice(-40)}`)        // last 20 bytes
        console.log(`  Debug - slot2 data (amount): ${amountData}`)
        console.log('----------------------------------------')
    }
}

main().catch(console.error)
