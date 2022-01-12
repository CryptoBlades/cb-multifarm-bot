const async = require('async')

require('dotenv').config()

const config = require('./src/app-config.json')

const logger = require('./src/helpers/logger')

const startTasks = async () => {
  logger('info', 'Updating ABI...')
  const { task } = require('./src/tasks/abi-updater')
  task()

  if (!process.env.PRIVATE_KEY) {
    logger('warn', 'Please set the PRIVATE_KEY in .env')
    process.exit(0)
  }

  if (!process.env.CHAIN_ENV) {
    logger('warn', 'Please set the CHAIN_ENV in .env')
    process.exit(0)
  }

  async.eachSeries(config.supportedChains[process.env.CHAIN_ENV], async chain => {
    logger('main', `Running price-updater on ${chain}`)
    const {
      duration,
      task
    } = require('./src/tasks/partner-updater')

    await task(chain)

    setInterval(async () => {
      await task(chain)
    }, duration * 1000)
  })
}

startTasks()
