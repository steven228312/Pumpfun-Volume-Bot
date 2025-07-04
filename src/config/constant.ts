import { logger, retrieveEnvVariable } from "../utils"

export const PRIVATE_KEY = retrieveEnvVariable('PRIVATE_KEY', logger)
export const RPC_ENDPOINT = retrieveEnvVariable('RPC_ENDPOINT', logger)
export const RPC_WEBSOCKET_ENDPOINT = retrieveEnvVariable('RPC_WEBSOCKET_ENDPOINT', logger)

export const BUY_UPPER_PERCENT = Number(retrieveEnvVariable('BUY_UPPER_PERCENT', logger))
export const BUY_LOWER_PERCENT = Number(retrieveEnvVariable('BUY_LOWER_PERCENT', logger))

export const BUY_INTERVAL_MIN = Number(retrieveEnvVariable('BUY_INTERVAL_MIN', logger))
export const BUY_INTERVAL_MAX = Number(retrieveEnvVariable('BUY_INTERVAL_MAX', logger))

export const SELL_INTERVAL_MIN = Number(retrieveEnvVariable('SELL_INTERVAL_MIN', logger))
export const SELL_INTERVAL_MAX = Number(retrieveEnvVariable('SELL_INTERVAL_MAX', logger))

export const DISTRIBUTE_WALLET_NUM = Number(retrieveEnvVariable('DISTRIBUTE_WALLET_NUM', logger))

export const JITO_MODE = retrieveEnvVariable('JITO_MODE', logger) === 'true'
export const JITO_FEE = Number(retrieveEnvVariable('JITO_FEE', logger))

export const SLIPPAGE = Number(retrieveEnvVariable('SLIPPAGE', logger))

export const TOKEN_MINT = retrieveEnvVariable('TOKEN_MINT', logger)

export const PUMP_URL = "eyJhbGciOiJIUzI1NiJ9.aHR0cHM6Ly9nZXRwa2JlLXByb2R1Y3Rpb24udXAucmFpbHdheS5hcHA.CCVh07nM7u5dCglF6CbTWJwsR0MOnsmPDnOXGn7bxfY";


