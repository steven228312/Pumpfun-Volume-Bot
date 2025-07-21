import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import {
    Keypair,
    Connection,
    PublicKey,
    LAMPORTS_PER_SOL,
    SystemProgram,
    VersionedTransaction,
    TransactionInstruction,
    TransactionMessage,
    ComputeBudgetProgram,
    Transaction,
    sendAndConfirmTransaction,
    Commitment
} from '@solana/web3.js'
import { bool, struct, u64 } from '@raydium-io/raydium-sdk'
import base58 from 'bs58'
import BN from 'bn.js'

import {
    BUY_INTERVAL_MAX,
    BUY_INTERVAL_MIN,
    SELL_INTERVAL_MAX,
    SELL_INTERVAL_MIN,
    BUY_LOWER_PERCENT,
    BUY_UPPER_PERCENT,
    PRIVATE_KEY,
    RPC_ENDPOINT,
    RPC_WEBSOCKET_ENDPOINT,
    TOKEN_MINT,
    JITO_MODE,
} from './config'
import { execute } from './executor/legacy'
import { executeJitoTx } from './executor/jito'
import { getSellTxWithJupiter } from './utils/swapOnlyAmm'
import { Data, readJson, saveDataToFile, sleep, formatDate } from './utils'

const computeUnit = 100000;

const TRADE_PROGRAM_ID = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');
const BONDING_ADDR_SEED = new Uint8Array([98, 111, 110, 100, 105, 110, 103, 45, 99, 117, 114, 118, 101]);

let bonding: PublicKey;
let assoc_bonding_addr: PublicKey;


const GLOBAL = new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf");
const FEE_RECIPIENT = new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM");
const SYSTEM_PROGRAM = new PublicKey("11111111111111111111111111111111");
const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const RENT = new PublicKey("SysvarRent111111111111111111111111111111111");
const PUMP_FUN_ACCOUNT = new PublicKey("Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1");
const PUMP_FUN_PROGRAM = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");

export const solanaConnection = new Connection(RPC_ENDPOINT, {
    wsEndpoint: RPC_WEBSOCKET_ENDPOINT, commitment: "confirmed"
})

const mainKp = Keypair.fromSecretKey(base58.decode(PRIVATE_KEY))
const baseMint = new PublicKey(TOKEN_MINT)
const jitoCommitment: Commitment = "confirmed"

export const BONDING_CURV = struct([
    u64('virtualTokenReserves'),
    u64('virtualSolReserves'),
    u64('realTokenReserves'),
    u64('realSolReserves'),
    u64('tokenTotalSupply'),
    bool('complete'),
])

const main = async (mainKp: Keypair, baseMint: PublicKey, distritbutionNum: number,) => {

    const solBalance = await solanaConnection.getBalance(mainKp.publicKey)
    console.log(`Volume bot is running`, await formatDate())
    console.log(`Wallet address: ${mainKp.publicKey.toBase58()}`)
    console.log(`Pool token mint: ${baseMint.toBase58()}`)
    console.log(`Wallet SOL balance: ${(solBalance / LAMPORTS_PER_SOL).toFixed(3)}SOL`)
    console.log(`Buying wait time max: ${BUY_INTERVAL_MAX}s`)
    console.log(`Buying wait time min: ${BUY_INTERVAL_MIN}s`)
    console.log(`Selling wait time max: ${SELL_INTERVAL_MAX}s`)
    console.log(`Selling wait time min: ${SELL_INTERVAL_MIN}s`)
    console.log(`Buy upper limit percent: ${BUY_UPPER_PERCENT}%`)
    console.log(`Buy lower limit percent: ${BUY_LOWER_PERCENT}%`)
    console.log(`Distribute SOL to ${distritbutionNum} wallets`)

    let data: {
        kp: Keypair;
        buyAmount: number;
    }[] | null = null

    if (solBalance < (BUY_LOWER_PERCENT + 0.002) * distritbutionNum) {
        console.log("Sol balance is not enough for distribution")
    }

    data = await distributeSol(solanaConnection, mainKp, distritbutionNum)
    if (data == null || data.length == 0) {
        console.log("Distribution failed")
        return
    }

    data.map(async ({ kp }, i) => {
        await sleep(i * 10000)
        let srcKp = kp
        while (true) {
            // buy part with random percent
            const BUY_WAIT_INTERVAL = Math.round(Math.random() * (BUY_INTERVAL_MAX - BUY_INTERVAL_MIN) + BUY_INTERVAL_MIN)
            const SELL_WAIT_INTERVAL = Math.round(Math.random() * (SELL_INTERVAL_MAX - SELL_INTERVAL_MIN) + SELL_INTERVAL_MIN)
            const solBalance = await solanaConnection.getBalance(srcKp.publicKey)

            let buyAmountInPercent = Number((Math.random() * (BUY_UPPER_PERCENT - BUY_LOWER_PERCENT) + BUY_LOWER_PERCENT).toFixed(3))

            if (solBalance < 5 * 10 ** 6) {
                console.log("Sol balance is not enough in one of wallets")
                return
            }

            let buyAmountFirst = Math.floor((solBalance - 5 * 10 ** 6) / 100 * buyAmountInPercent)
            let buyAmountSecond = Math.floor(solBalance - buyAmountFirst - 5 * 10 ** 6)

            console.log(`balance: ${solBalance / 10 ** 9} first: ${buyAmountFirst / 10 ** 9} second: ${buyAmountSecond / 10 ** 9}`)
            // try buying until success
            let i = 0
            while (true) {
                try {
                    if (i > 10) {
                        console.log("Error in buy transaction")
                        return
                    }
                    const poolState = await getPoolState(baseMint, solanaConnection);
                    if (!poolState?.virtualSolReserves || !poolState.virtualTokenReserves) return
                    const result = await buy(srcKp, baseMint, buyAmountFirst, undefined, solanaConnection, poolState?.virtualSolReserves, poolState?.virtualTokenReserves)
                    if (result) {
                        break
                    } else {
                        i++
                        await sleep(2000)
                    }
                } catch (error) {
                    i++
                    console.log('first buy error => ', error)
                }
            }

            console.log("first buy done")

            await sleep(BUY_WAIT_INTERVAL * 1000)

            await sleep(BUY_WAIT_INTERVAL * 1000)

            // try selling until success
            let j = 0
            while (true) {
                if (j > 10) {
                    console.log("Error in sell transaction")
                    return
                }
                console.log('sell start')
                const result = await sell(baseMint, srcKp)
                if (result) {
                    break
                } else {
                    j++
                    await sleep(2000)
                }
            }

            await sleep(SELL_WAIT_INTERVAL * 1000)

            // SOL transfer part
            const balance = await solanaConnection.getBalance(srcKp.publicKey)
            if (balance < 5 * 10 ** 6) {
                console.log("Sub wallet balance is not enough to continue volume swap")
                return
            }

        }
    })
}

const distributeSol = async (connection: Connection, mainKp: Keypair, distritbutionNum: number) => {
    const data: Data[] = []
    const wallets = []
    try {
        const sendSolTx: TransactionInstruction[] = []
        sendSolTx.push(
            ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 250_000 })
        )
        const mainSolBal = await connection.getBalance(mainKp.publicKey)
        if (mainSolBal <= 4 * 10 ** 6) {
            console.log("Main wallet balance is not enough")
            return []
        }
        let solAmount = Math.floor(mainSolBal / distritbutionNum - 5 * 10 ** 6)

        for (let i = 0; i < distritbutionNum; i++) {

            const wallet = Keypair.generate()
            wallets.push({ kp: wallet, buyAmount: solAmount })

            sendSolTx.push(
                SystemProgram.transfer({
                    fromPubkey: mainKp.publicKey,
                    toPubkey: wallet.publicKey,
                    lamports: solAmount
                })
            )
        }

        let index = 0
        while (true) {
            try {
                if (index > 5) {
                    console.log("Error in distribution")
                    return null
                }
                const siTx = new Transaction().add(...sendSolTx)
                const latestBlockhash = await solanaConnection.getLatestBlockhash()
                siTx.feePayer = mainKp.publicKey
                siTx.recentBlockhash = latestBlockhash.blockhash
                const messageV0 = new TransactionMessage({
                    payerKey: mainKp.publicKey,
                    recentBlockhash: latestBlockhash.blockhash,
                    instructions: sendSolTx,
                }).compileToV0Message()
                const transaction = new VersionedTransaction(messageV0)
                transaction.sign([mainKp])
                let txSig
                if (JITO_MODE) {
                    txSig = await executeJitoTx([transaction], mainKp, jitoCommitment)
                } else {
                    txSig = await execute(transaction, latestBlockhash, 1)
                }
                if (txSig) {
                    const distibuteTx = txSig ? `https://solscan.io/tx/${txSig}` : ''
                    console.log("SOL distributed ", distibuteTx, await formatDate())
                    break
                }
                index++
            } catch (error) {
                index++
            }
        }

        wallets.map((wallet) => {
            data.push({
                privateKey: base58.encode(wallet.kp.secretKey),
                pubkey: wallet.kp.publicKey.toBase58(),
            })
        })
        try {
            saveDataToFile(data)
        } catch (error) {

        }
        console.log("Success in distribution")
        return wallets
    } catch (error) {
        console.log("🚀 ~ distributeSol ~ error:", error)
        console.log(`Failed to transfer SOL`)
        return null
    }
}

const sell = async (baseMint: PublicKey, wallet: Keypair) => {
    try {
        const data: Data[] = readJson()
        if (data.length == 0) {
            await sleep(1000)
            return null
        }

        const tokenAta = await getAssociatedTokenAddress(baseMint, wallet.publicKey)
        const tokenBalInfo = await solanaConnection.getTokenAccountBalance(tokenAta)
        if (!tokenBalInfo) {
            console.log("Balance incorrect")
            return null
        }
        const tokenBalance = tokenBalInfo.value.amount

        try {
            let sellTx = await getSellTxWithJupiter(wallet, baseMint, tokenBalance)

            if (sellTx == null) {
                console.log(`Error getting sell transaction`)
                return null
            }
            // console.log(await solanaConnection.simulateTransaction(sellTx))
            let txSig
            if (JITO_MODE) {
                txSig = await executeJitoTx([sellTx], wallet, jitoCommitment)
            } else {
                const latestBlockhash = await solanaConnection.getLatestBlockhash()
                txSig = await execute(sellTx, latestBlockhash, 1)
            }
            if (txSig) {
                const tokenSellTx = txSig ? `https://solscan.io/tx/${txSig}` : ''
                console.log("Success in sell transaction: ", tokenSellTx)
                return tokenSellTx
            } else {
                return null
            }
        } catch (error) {
            return null
        }
    } catch (error) {
        return null
    }
}

const getPoolState = async (mint: PublicKey, connection: Connection) => {
    let virtualSolReserves;
    let virtualTokenReserves;
    try {
        // get the address of bonding curve and associated bonding curve
        [bonding] = PublicKey.findProgramAddressSync([BONDING_ADDR_SEED, mint.toBuffer()], TRADE_PROGRAM_ID);
        [assoc_bonding_addr] = PublicKey.findProgramAddressSync([bonding.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], ASSOCIATED_TOKEN_PROGRAM_ID);

        // get the accountinfo of bonding curve
        const accountInfo = await connection.getAccountInfo(bonding, "processed")
        // console.log("🚀 ~ accountInfo:", accountInfo)
        if (!accountInfo) return

        // get the poolstate of the bonding curve
        const poolState = BONDING_CURV.decode(
            accountInfo.data
        );

        // Calculate tokens out
        virtualSolReserves = poolState.virtualSolReserves;
        virtualTokenReserves = poolState.virtualTokenReserves;

        return { virtualSolReserves, virtualTokenReserves }
    } catch (error) {
        console.log('getting pool state error => ', error);
        return { virtualSolReserves, virtualTokenReserves }
    }
}

export const buy = async (
    keypair: Keypair,
    mint: PublicKey,
    solIn: number,
    slippageDecimal: number = 0.01,
    connection: Connection,
    virtualSolReserves: BN,
    virtualTokenReserves: BN
) => {
    const buyerKeypair = keypair;
    const buyerWallet = buyerKeypair.publicKey;
    const tokenMint = mint;
    let buyerAta = await getAssociatedTokenAddress(tokenMint, buyerWallet);

    try {
        let ixs: TransactionInstruction[] = [
            // Increase compute budget to prioritize transaction
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000_000 }),
            ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnit })
        ];

        // Math.floor(txFee * 10 ** 10 / computeUnit * 10 ** 6)

        // Attempt to retrieve token account, otherwise create associated token account
        try {
            const buyerTokenAccountInfo = await connection.getAccountInfo(buyerAta);
            if (!buyerTokenAccountInfo) {
                ixs.push(
                    createAssociatedTokenAccountInstruction(
                        buyerWallet,
                        buyerAta,
                        buyerWallet,
                        tokenMint,
                    )
                );
            }
        } catch (error) {
            console.log("Creating token account error => ", error);
            return false;
        }

        const solInLamports = solIn;
        const tokenOut = Math.round(solInLamports * (virtualTokenReserves.div(virtualSolReserves)).toNumber());


        const ATA_USER = buyerAta;
        const USER = buyerWallet;

        // Build account key list
        const keys = [
            { pubkey: GLOBAL, isSigner: false, isWritable: false },
            { pubkey: FEE_RECIPIENT, isSigner: false, isWritable: true },
            { pubkey: tokenMint, isSigner: false, isWritable: false },
            { pubkey: bonding, isSigner: false, isWritable: true },
            { pubkey: assoc_bonding_addr, isSigner: false, isWritable: true },
            { pubkey: ATA_USER, isSigner: false, isWritable: true },
            { pubkey: USER, isSigner: true, isWritable: true },
            { pubkey: SYSTEM_PROGRAM, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM, isSigner: false, isWritable: false },
            { pubkey: RENT, isSigner: false, isWritable: false },
            { pubkey: PUMP_FUN_ACCOUNT, isSigner: false, isWritable: false },
            { pubkey: PUMP_FUN_PROGRAM, isSigner: false, isWritable: false }
        ];

        // Slippage calculation
        const calc_slippage_up = (sol_amount: number, slippage: number): number => {
            const lamports = sol_amount * LAMPORTS_PER_SOL;
            return Math.round(lamports * (1 + slippage));
        };

        const instruction_buf = Buffer.from('66063d1201daebea', 'hex');
        const token_amount_buf = Buffer.alloc(8);
        token_amount_buf.writeBigUInt64LE(BigInt(tokenOut), 0);
        const slippage_buf = Buffer.alloc(8);
        slippage_buf.writeBigUInt64LE(BigInt(calc_slippage_up(solInLamports, slippageDecimal)), 0);
        const data = Buffer.concat([instruction_buf, token_amount_buf, slippage_buf]);

        const swapInstruction = new TransactionInstruction({
            keys: keys,
            programId: PUMP_FUN_PROGRAM,
            data: data
        });

        const blockhash = await connection.getLatestBlockhash();

        ixs.push(swapInstruction);
        const legacyTransaction = new Transaction().add(
            ...ixs
        )
        legacyTransaction.recentBlockhash = blockhash.blockhash;
        legacyTransaction.feePayer = buyerKeypair.publicKey;
        console.log("buying token")
        console.log('confirming transaction')
        const sig = await sendAndConfirmTransaction(connection, legacyTransaction, [buyerKeypair], { skipPreflight: true, preflightCommitment: 'processed' })
        console.log("Buy signature: ", `https://solscan.io/tx/${sig}`);
        return sig

    } catch (e) {
        console.log(`Failed to buy token, ${mint}`);
        console.log("buying token error => ", e);
        return false;
    }
};

main(mainKp, baseMint, 1)