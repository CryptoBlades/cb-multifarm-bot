const async = require('async')

require('dotenv').config()

const config = require('./src/app-config.json')

const logger = require('./src/helpers/logger')

const startTasks = async () => {
  logger('info', 'Updating ABI...')
  require('./src/tasks/abi-updater')()

  if (!process.env.PRIVATE_KEY) {
    logger('warn', 'Please set the PRIVATE_KEY in .env')
    process.exit(0)
  }

  if (!process.env.CHAIN_ENV) {
    logger('warn', 'Please set the CHAIN_ENV in .env')
    process.exit(0)
  }

  async.eachSeries(config.supportedChains[process.env.CHAIN_ENV], async chain => {
    require('./src/tasks/partner-updater')(chain)
  })
}

startTasks()
