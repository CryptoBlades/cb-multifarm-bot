require('dotenv').config()

const config = require('./src/app-config.json')

const startTasks = async () => {
  console.log('Updating ABI...')
  const { task } = require('./src/tasks/abi-updater')
  task()

  if (!process.env.PRIVATE_KEY) {
    console.log('Please set the PRIVATE_KEY in .env')
    process.exit(0)
  }

  if (!process.env.CHAIN_ENV) {
    console.log('Please set the CHAIN_ENV in .env')
    process.exit(0)
  }

  for (const i in config.supportedChains[process.env.CHAIN_ENV]) {
    const chain = config.supportedChains[process.env.CHAIN_ENV][i]
    console.log(`Running price-updater on ${chain}`)
    const {
      duration,
      task
    } = require('./src/tasks/partner-updater')

    await task(chain)

    setInterval(async () => {
      await task(chain)
    }, duration * 1000)
  }
}

startTasks()
