const async = require('async')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const { Client, Intents } = require('discord.js')

require('dotenv').config()

const argv = yargs(hideBin(process.argv)).argv

const config = require('./src/app-config.json')

const logger = require('./src/helpers/logger')
const web3Helper = require('./src/helpers/web3')

const discord = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })

const startTasks = async () => {
  await require('./src/tasks/abi-updater')()
  logger('info', 'Updated ABIs...')

  if (!process.env.PRIVATE_KEY) {
    logger('warn', 'Please set the PRIVATE_KEY in .env')
    process.exit(0)
  }

  if (!process.env.CHAIN_ENV) {
    logger('warn', 'Please set the CHAIN_ENV in .env')
    process.exit(0)
  }

  async.eachSeries(config.supportedChains[process.env.CHAIN_ENV], async chain => {
    require('./src/tasks/partner-updater')(chain, (argv.test))
  })

  discordStatus()
}

let chainIndex = 0
const discordStatus = async () => {
  if (!config.supportedChains[process.env.CHAIN_ENV][chainIndex]) chainIndex = 0
  const chain = config.supportedChains[process.env.CHAIN_ENV][chainIndex]
  try {
    const balance = parseFloat(web3Helper.fromWei(await web3Helper.getBalance(chain, web3Helper.getAddress(chain, process.env.PRIVATE_KEY)), 'ether')).toFixed(4)
    discord.user.setActivity(`${chain}: ${balance}`, {
      type: 'WATCHING'
    })
    chainIndex += 1
    setTimeout(discordStatus, 10000)
  } catch (e) {
    logger('error', `Error retrieving balance on ${chain}. Reason: ${e.message}`)
  }
}

discord.once('ready', () => {
  startTasks()
})

discord.login(process.env.DISCORD_TOKEN)
