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

  for (const i in config.supportedChains) {
    console.log(`Running price-updater on ${config.supportedChains[i]}, ${i}`)
    const {
      duration,
      task
    } = require('./src/tasks/partner-updater')

    await task(config.supportedChains[i])

    setInterval(async () => {
      await task(config.supportedChains[i])
    }, duration * 1000)
  }
}

startTasks()
