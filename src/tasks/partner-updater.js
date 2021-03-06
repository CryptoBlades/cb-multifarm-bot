const fetch = require('node-fetch')
const async = require('async')

const web3Helper = require('../helpers/web3')
const logger = require('../helpers/logger')
const config = require('../app-config.json')

const duration = 10800

const task = async (chain, test = false) => {
  logger('main', `Running price-updater on ${chain}`)
  const skillPrice = await web3Helper.getSkillPrice(chain)
  const { onContract } = web3Helper.web3LoadBalancer(chain)
  await onContract('treasury', async (contract) => {
    const gasPrice = await web3Helper.getProposedGasPrice(chain)
    try {
      if (!skillPrice) throw Error(`Error retrieving price from dex. ${skillPrice}`)
      const skillPriceInEther = web3Helper.toWei(skillPrice, 'ether')
      const currentSkillPrice = Number(await contract.methods.skillPrice().call())
      const increase = web3Helper.getIncreasePercentage(currentSkillPrice, skillPriceInEther)
      if (increase > 100 || increase < -50) throw Error(`Unusual ${(increase >= 0 ? 'increase' : 'decrease')} in price. ${increase}%`)
      if (increase === 0) throw Error('No price change detected.')
      const skillOptions = {
        to: web3Helper.getTreasuryAddress(chain),
        data: contract.methods.setSkillPrice(skillPriceInEther).encodeABI(),
        gas: web3Helper.getGasLimit(chain),
        gasPrice: web3Helper.toWei(gasPrice, 'gwei')
      }
      logger('info', `Updating price for SKILL on ${chain}`)
      if (!test) {
        const tx = await web3Helper.sendTransaction(chain, skillOptions, process.env.PRIVATE_KEY)
        logger('success', `SKILL price updated on ${chain}. TX: ${tx.transactionHash}`)
      } else {
        logger('success', `SKILL price updated on ${chain}. Price: ${skillPriceInEther}`)
      }
    } catch (e) {
      if (e.message === 'No price change detected.') logger('warn', `Skipped updating SKILL price. Reason: ${e.message}`)
      else logger('error', `Error updating SKILL price on ${chain}. Reason: ${e.message}`)
    }

    const partnerIds = await contract.methods.getActivePartnerProjectsIds().call()
    if (partnerIds.length > 0) {
      async.eachSeries(partnerIds, async id => {
        const partnerInfo = await contract.methods.partneredProjects(id).call()
        let priceInEther = null
        try {
          if (partnerInfo.tokenSymbol === 'SKILL') {
            priceInEther = web3Helper.toWei(Number(skillPrice), 'ether')
          } else {
            if (partnerInfo.tokenSymbol === 'ICE') {
              priceInEther = web3Helper.toWei(parseFloat(await web3Helper.getOtherPrice(chain, '0xbd3547dd04a84995cdbc2a45c9e67ae9c64b4c4c')).toFixed(18), 'ether')
            } else {
              const price = await fetch(`https://api.coingecko.com/api/v3/simple/token_price/${config.chains[process.env.CHAIN_ENV][chain].COINGECKO_ID}?contract_addresses=${partnerInfo.tokenAddress}&vs_currencies=usd`).then((res) => res.json()).catch(() => 0)
              if (web3Helper.isEmpty(price)) throw Error(`Error retrieving price from coingecko. ${price}`)
              priceInEther = web3Helper.toWei(price[partnerInfo.tokenAddress.toLowerCase()].usd, 'ether')
            }
          }
          const increase = web3Helper.getIncreasePercentage(partnerInfo.tokenPrice, priceInEther)
          if (increase > 100 || increase < -50) throw Error(`Unusual ${(increase >= 0 ? 'increase' : 'decrease')} in price. ${increase}%`)
          if (increase === 0) throw Error('No price change detected.')
          const options = {
            to: web3Helper.getTreasuryAddress(chain),
            data: contract.methods.setPartnerTokenPrice(partnerInfo.id, priceInEther).encodeABI(),
            gas: web3Helper.getGasLimit(chain),
            gasPrice: web3Helper.toWei(gasPrice, 'gwei')
          }
          logger('info', `Updating price for ${partnerInfo.name} on ${chain}`)
          if (!test) {
            const tx = await web3Helper.sendTransaction(chain, options, process.env.PRIVATE_KEY)
            logger('success', `${partnerInfo.name} price updated on ${chain}. TX: ${tx.transactionHash}`)
            await web3Helper.sleep(3000)
          } else {
            logger('success', `${partnerInfo.name} price updated on ${chain}. Price: ${priceInEther}`)
          }
        } catch (e) {
          if (e.message === 'No price change detected.') logger('warn', `Skipped updating ${partnerInfo.name} price. Reason: ${e.message}`)
          else logger('error', `Error updating ${partnerInfo.name} price ${priceInEther} on ${chain}. Reason: ${e.message}`)
        }
      })
    }

    return setTimeout(async () => {
      await task(chain)
    }, duration * 1000)
  })
}

module.exports = task
