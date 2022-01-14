const async = require('async')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

require('dotenv').config()

const argv = yargs(hideBin(process.argv)).argv

const config = require('./src/app-config.json')

const logger = require('./src/helpers/logger')

if (argv.test) {
  process.env.CHAIN_ENV = 'testnet'
}

const startTasks = async () => {
  if (!argv.test) {
    logger('info', 'Updating ABI...')
    require('./src/tasks/abi-updater')()
  }

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
}

startTasks()
