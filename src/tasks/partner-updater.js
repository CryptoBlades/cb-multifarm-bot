const fetch = require('node-fetch')

const web3Helper = require('../helpers/web3')
const config = require('../app-config.json')

const duration = 10800

const task = async (chain) => {
  let nonce = await web3Helper.getLastNonce(chain, web3Helper.getAddress(chain, process.env.PRIVATE_KEY))
  const skillPrice = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=cryptoblades&vs_currencies=usd').then((res) => res.json())
  const { onContract } = web3Helper.web3LoadBalancer(chain)
  await onContract('treasury', async (contract) => {
    const partnerIds = await contract.methods.getActivePartnerProjectsIds().call()
    if (partnerIds.length > 0) {
      await Promise.all(partnerIds.map(async id => {
        const partnerInfo = await contract.methods.getPartnerProject(id).call()
        try {
          nonce += 1
          const price = await fetch(`https://api.coingecko.com/api/v3/simple/token_price/${config.chains[process.env.CHAIN_ENV][chain].COINGECKO_ID}?contract_addresses=${partnerInfo[3]}&vs_currencies=usd`).then((res) => res.json())
          const options = {
            to: web3Helper.getTreasuryAddress(chain),
            data: contract.methods.setPartnerTokenPrice(partnerInfo[0], web3Helper.toWei(price[partnerInfo[3].toLowerCase()].usd, 'ether')).encodeABI(),
            gas: web3Helper.getGasLimit(chain),
            gasPrice: web3Helper.toWei(web3Helper.getGasPrice(chain), 'gwei'),
            nonce
          }
          console.log(`Updating price for ${partnerInfo[1]} in ${chain}`)
          const tx = await web3Helper.sendTransaction(chain, options, process.env.PRIVATE_KEY)
          console.log(`${partnerInfo[1]} price updated in ${chain}. TX: ${tx.transactionHash}`)
          await web3Helper.sleep(3000)
        } catch (e) {
          console.log(`Error updating ${partnerInfo[1]}. Reason: ${e.message}`)
        }
      }))
    }
    await web3Helper.sleep(3000)
    try {
      nonce += 1
      const skillOptions = {
        to: web3Helper.getTreasuryAddress(chain),
        data: contract.methods.setSkillPrice(web3Helper.toWei(skillPrice.cryptoblades.usd, 'ether')).encodeABI(),
        gas: web3Helper.getGasLimit(chain),
        gasPrice: web3Helper.toWei(web3Helper.getGasPrice(chain), 'gwei'),
        nonce
      }
      console.log(`Updating price for SKILL in ${chain}`)
      const tx = await web3Helper.sendTransaction(chain, skillOptions, process.env.PRIVATE_KEY)
      console.log(`SKILL price updated in ${chain}. TX: ${tx.transactionHash}`)
    } catch (e) {
      console.log(`Error updating SKILL price in ${chain}. Reason: ${e.message}`)
    }
  })
}

module.exports = {
  duration,
  task
}
