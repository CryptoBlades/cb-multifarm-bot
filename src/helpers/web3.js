const Web3 = require('web3')
const utils = require('web3-utils')
const {
  createWeb3ContractsServices,
  createLoadBalancedContractsService
} = require('web3-load-balance')

const config = require('../app-config.json')

const helpers = {
  getNodes: (chain) => config.chains[helpers.env][chain].RPCURLS,
  getRandomNode: (chain) => {
    return helpers.getNodes()[Math.floor(Math.random() * (helpers.getNodes(chain).length - 0 + 1))]
  },
  getWeb3: (chain) => {
    return new Web3(helpers.getNodes(chain)[0])
  },
  getDefaultAddress: () => '0x0000000000000000000000000000000000000000',
  getTreasuryAddress: (chain) => config.chains[helpers.env][chain].TREASURY_CONTRACT_ADDRESS,

  treasuryAbiPath: '../abi/Treasury.json',

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

  getGasLimit: (chain) => config.chains[helpers.env][chain].GAS_LIMIT,
  getGasPrice: (chain) => config.chains[helpers.env][chain].GAS_PRICE,

  sendTransaction: async (options, privateKey) => {
    const web3 = helpers.getWeb3()
    const signedTx = await web3.eth.accounts.signTransaction(options, privateKey)
    return web3.eth.sendSignedTransaction(signedTx.rawTransaction)
  },

  sleep: async ms => await new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = helpers
