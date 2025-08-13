# Pump.fun Volume Bot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

A sophisticated Solana-based trading bot designed for automated volume trading on Pump.fun tokens. This bot implements advanced trading strategies using multiple distributed wallets to create trading volume and execute buy/sell operations with configurable intervals and percentages.

## 🚀 Features

- **Multi-Wallet Distribution**: Automatically distributes SOL across multiple wallets for decentralized trading
- **Configurable Trading Parameters**: Customizable buy/sell intervals, percentages, and amounts
- **Jito MEV Protection**: Optional Jito integration for enhanced transaction execution and MEV protection
- **Smart Pool State Management**: Real-time monitoring of token pool states for optimal trading decisions
- **Automated Volume Generation**: Continuous buy/sell cycles to maintain trading volume
- **Raydium SDK Integration**: Leverages Raydium for efficient token swaps and liquidity operations
- **Comprehensive Logging**: Structured logging with Pino for monitoring and debugging
- **TypeScript Support**: Full TypeScript implementation with strict type checking

## 🏗️ Architecture

The bot is built with a modular architecture:

- **Core Engine** (`src/index.ts`): Main trading logic and wallet distribution
- **Executors** (`src/executor/`): Transaction execution handlers (Legacy and Jito)
- **Utilities** (`src/utils/`): Helper functions, logging, and data management
- **Configuration** (`src/config/`): Environment-based configuration management

## 📋 Prerequisites

- Node.js 18+ 
- TypeScript 5.8+
- Solana CLI tools
- Active Solana wallet with SOL balance
- Access to Solana RPC endpoints

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/steven228312/Pumpfun-Volume-Bot.git
   cd Pumpfun-Volume-Bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:

   ```env
   # Wallet Configuration
   PRIVATE_KEY=your_base58_encoded_private_key
   
   # Solana RPC Configuration
   RPC_ENDPOINT=https://api.mainnet-beta.solana.com
   RPC_WEBSOCKET_ENDPOINT=wss://api.mainnet-beta.solana.com
   
   # Trading Parameters
   TOKEN_MINT=your_token_mint_address
   BUY_LOWER_PERCENT=10
   BUY_UPPER_PERCENT=30
   BUY_INTERVAL_MIN=30
   BUY_INTERVAL_MAX=120
   SELL_INTERVAL_MIN=60
   SELL_INTERVAL_MAX=300
   
   # Wallet Distribution
   DISTRIBUTE_WALLET_NUM=5
   
   # Jito Configuration (Optional)
   JITO_MODE=false
   JITO_FEE=0.001
   
   # Trading Configuration
   SLIPPAGE=1.0
   ```

## ⚙️ Configuration

### Trading Parameters

- **BUY_LOWER_PERCENT**: Minimum percentage of wallet balance to use for buying
- **BUY_UPPER_PERCENT**: Maximum percentage of wallet balance to use for buying
- **BUY_INTERVAL_MIN/MAX**: Random range for wait time between buy operations (seconds)
- **SELL_INTERVAL_MIN/MAX**: Random range for wait time between sell operations (seconds)
- **DISTRIBUTE_WALLET_NUM**: Number of wallets to distribute SOL across

### Jito MEV Protection

When `JITO_MODE` is enabled, the bot uses Jito's block engine for:
- Enhanced transaction ordering
- MEV protection
- Improved transaction success rates
- Priority fee distribution

## 🚀 Usage

### Development Mode

```bash
# Compile TypeScript
npm run build

# Run with ts-node
npx ts-node src/index.ts
```

### Production Mode

```bash
# Build the project
npm run build

# Run the compiled JavaScript
node dist/index.js
```

## 📊 How It Works

1. **Initialization**: The bot starts by checking the main wallet's SOL balance
2. **Distribution**: SOL is distributed across multiple wallets based on `DISTRIBUTE_WALLET_NUM`
3. **Trading Cycle**: Each wallet executes a continuous trading cycle:
   - **Buy Phase**: Purchases tokens using a random percentage of available SOL
   - **Wait Period**: Random interval between buy and sell operations
   - **Sell Phase**: Sells all acquired tokens back to SOL
   - **Recovery**: Transfers remaining SOL back to continue the cycle

4. **Volume Generation**: The continuous buy/sell cycles create trading volume for the target token

## 🔧 Customization

### Adding New Trading Strategies

The modular architecture allows easy addition of new trading strategies:

```typescript
// src/executor/custom-strategy.ts
export const executeCustomStrategy = async (
  wallet: Keypair,
  tokenMint: PublicKey,
  connection: Connection
) => {
  // Implement your custom trading logic
};
```

### Modifying Pool State Logic

Customize how the bot interacts with token pools:

```typescript
// src/utils/custom-pool.ts
export const getCustomPoolState = async (
  tokenMint: PublicKey,
  connection: Connection
) => {
  // Implement custom pool state logic
};
```

## 📝 Logging

The bot uses Pino for structured logging with the following features:

- **Transaction Logging**: All buy/sell operations are logged with transaction signatures
- **Balance Monitoring**: Real-time wallet balance tracking
- **Error Handling**: Comprehensive error logging with stack traces
- **Performance Metrics**: Timing information for all operations

## ⚠️ Important Notes

- **Risk Management**: This bot is designed for volume generation and may result in trading losses
- **Gas Fees**: Continuous trading incurs significant transaction fees
- **Market Impact**: Large volume operations may affect token prices
- **Regulatory Compliance**: Ensure compliance with local trading regulations
- **Private Key Security**: Never expose private keys in public repositories

## ⚡ Performance Tips

- Use dedicated RPC endpoints for better performance
- Monitor wallet balances to prevent insufficient funds
- Adjust trading intervals based on network congestion
- Consider using Jito mode for high-frequency trading

## ❓ Frequently Asked Questions (FAQ)

### **General Questions**

**Q: What is Pump.fun Volume Bot?**
A: Pump.fun Volume Bot is an automated Solana trading bot designed to create trading volume for tokens on the Pump.fun platform using multiple distributed wallets and sophisticated trading strategies.

**Q: Is this bot safe to use?**
A: While the bot is well-tested, cryptocurrency trading involves inherent risks. Always start with small amounts and monitor the bot's performance closely.

**Q: Do I need programming knowledge to use this bot?**
A: Basic knowledge of Solana wallets and environment configuration is required. The bot is designed to be user-friendly but requires proper setup.

### **Technical Questions**

**Q: What happens if the bot encounters an error?**
A: The bot includes comprehensive error handling and will retry failed transactions up to 10 times before moving to the next operation.

**Q: Can I modify the trading strategy?**
A: Yes! The bot is built with a modular architecture that allows easy customization of trading strategies, intervals, and parameters.

**Q: How does the Jito integration work?**
A: Jito mode provides MEV protection and enhanced transaction ordering by using Jito's block engine, improving success rates for high-frequency trading.

**Q: What if my wallet runs out of SOL?**
A: The bot automatically checks balances and will stop operations if insufficient funds are detected, preventing failed transactions.

### **Configuration Questions**

**Q: How do I determine the optimal trading intervals?**
A: Start with conservative intervals (30-120 seconds for buys, 60-300 seconds for sells) and adjust based on network congestion and token volatility.

**Q: What's the recommended number of distribution wallets?**
A: 5-10 wallets is typically optimal. Too few reduces volume distribution, too many increases complexity and gas costs.

**Q: How do I calculate the right buy percentages?**
A: Consider your risk tolerance: 10-30% is conservative, 30-50% is moderate, 50%+ is aggressive. Always leave buffer for gas fees.

### **Troubleshooting**

**Q: The bot isn't executing trades. What should I check?**
A: Verify your RPC endpoint, wallet balance, private key format, and token mint address. Check the logs for specific error messages.

**Q: Transactions are failing. How can I fix this?**
A: Ensure sufficient SOL balance, check network congestion, verify slippage settings, and consider enabling Jito mode for better success rates.

**Q: How can I monitor the bot's performance?**
A: The bot provides comprehensive logging with Pino. Monitor transaction signatures, balance changes, and error logs for insights.

## 🔑 Keywords

**Trading & Finance**: Solana Trading Bot, Volume Trading, Automated Trading, Pump.fun, DeFi Trading, MEV Protection, Liquidity Provision

**Technology**: TypeScript, Node.js, Solana Blockchain, Web3, Smart Contracts, Raydium SDK, Jito Protocol

**Cryptocurrency**: SOL, SPL Tokens, Token Swaps, DEX Trading, Liquidity Pools, Yield Farming, Arbitrage

**Development**: Trading Algorithm, Bot Development, Blockchain Development, Solana Development, DeFi Development, Open Source

**Features**: Multi-Wallet Distribution, Configurable Parameters, Real-Time Monitoring, Error Handling, Performance Optimization



## 📄 License

This project is licensed under the [MIT License](./LICENSE) - see the LICENSE file for details.

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues, feature requests, or pull requests.

## 📞 Contact & Support

- **Email**: [steven0822.dev@gmail.com](mailto:steven0822.dev@gmail.com)
- **GitHub**: [Steven Leal (@steven228312)](https://github.com/steven228312)
- **Telegram**: [@steven228312](https://t.me/steven228312)
- **Twitter**: [@steven228312](https://twitter.com/steven228312)
- **Instagram**: [@steven228312](https://www.instagram.com/steven228312/)


---

**⚠️ Disclaimer**: This project is for educational and research purposes. Cryptocurrency trading involves substantial risk. Always conduct thorough research and consider consulting with financial advisors before making investment decisions. If you want to have your own sophisticated copy trading bot, please contact me through contact information.
