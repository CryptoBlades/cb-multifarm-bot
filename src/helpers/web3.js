const Web3 = require('web3')
const utils = require('web3-utils')
const {
  createWeb3ContractsServices,
  createLoadBalancedContractsService
} = require('web3-load-balance')

const config = require('../app-config.json')

const helpers = {
  getNodes: (chain) => config.chains[process.env.CHAIN_ENV][chain].RPCURLS,
  getRandomNode: (chain) => {
    return helpers.getNodes(chain)[Math.floor(Math.random() * (helpers.getNodes(chain).length - 0 + 1))]
  },
  getWeb3: (chain) => {
    return new Web3(helpers.getNodes(chain)[0])
  },
  getDefaultAddress: () => '0x0000000000000000000000000000000000000000',
  getTreasuryAddress: (chain) => config.chains[process.env.CHAIN_ENV][chain].TREASURY_CONTRACT_ADDRESS,
  getSkillPairAddress: (chain) => config.chains[process.env.CHAIN_ENV][chain].SKILL_PAIR_CONTRACT_ADDRESS,
  getTokenPairAddress: (chain) => config.chains[process.env.CHAIN_ENV][chain].TOKEN_PAIR_CONTRACT_ADDRESS,

  treasuryAbiPath: '../abi/Treasury.json',
  swapAbiPath: '../abi/Swap.json',

  web3LoadBalancer: (chain) => {
    const contractsServices = createWeb3ContractsServices(helpers.getNodes(chain),
      {
        treasury: {
          abi: require(helpers.treasuryAbiPath),
          address: helpers.getTreasuryAddress(chain)
        }
      }
    )

    return createLoadBalancedContractsService(contractsServices)
  },

  fromWei: (value, unit) => utils.fromWei(BigInt(value).toString(), unit),
  toWei: (value, unit) => utils.toWei(value.toString(), unit),

  getGasLimit: (chain) => config.chains[process.env.CHAIN_ENV][chain].GAS_LIMIT,
  getGasPrice: (chain) => config.chains[process.env.CHAIN_ENV][chain].GAS_PRICE,

  sendTransaction: async (chain, options, privateKey) => {
    const web3 = helpers.getWeb3(chain)
    const signedTx = await web3.eth.accounts.signTransaction(options, privateKey)
    return web3.eth.sendSignedTransaction(signedTx.rawTransaction)
  },

  getLastNonce: async (chain, address) => {
    const web3 = helpers.getWeb3(chain)
    return web3.eth.getTransactionCount(address)
  },

  getAddress: (chain, privateKey) => {
    const web3 = helpers.getWeb3(chain)
    return web3.eth.accounts.privateKeyToAccount(privateKey).address
  },

  sleep: async ms => await new Promise(resolve => setTimeout(resolve, ms)),

  getIncreasePercentage: (past, current) => ((Number(current) - Number(past)) / Number(past)) * 100,

  getTokenPrice: async (chain) => {
    const web3 = helpers.getWeb3(chain)
    const contract = new web3.eth.Contract(require(helpers.swapAbiPath), helpers.getTokenPairAddress(chain))
    const reserves = await contract.methods.getReserves().call()
    let price = reserves[1] / reserves[0]
    if (chain === 'OEC') price = reserves[0] / reserves[1]
    if (chain === 'POLY' || chain === 'AVAX') {
      price *= 1000000000000
    }
    return price
  },

  getSkillPrice: async (chain) => {
    const web3 = helpers.getWeb3(chain)
    const contract = new web3.eth.Contract(require(helpers.swapAbiPath), helpers.getSkillPairAddress(chain))
    const reserves = await contract.methods.getReserves().call()
    const tokenPrice = await helpers.getTokenPrice(chain)
    let price = reserves[1] / reserves[0]
    if (chain === 'OEC' || chain === 'POLY') price = reserves[0] / reserves[1]

    if (chain === 'AVAX') {
      price *= 1000000000000
    }
    if (chain === 'POLY' || chain === 'BSC') {
      price *= tokenPrice
    }
    return price
  },

  getBalance: async (chain, address) => {
    const web3 = helpers.getWeb3(chain)
    return web3.eth.getBalance(address)
  },

  gasName: (chain) => {
    switch (chain) {
      case 'BSC': return 'BNB'
      case 'HECO': return 'HT'
      case 'OEC': return 'OKT'
      case 'POLY': return 'MATIC'
      case 'AVAX': return 'AVAX'
      default: return 'BNB'
    }
  }
}

module.exports = helpers
