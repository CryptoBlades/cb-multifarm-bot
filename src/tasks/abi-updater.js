const fs = require('fs-extra')
const fetch = require('node-fetch')

const ABI_URL = 'https://app.cryptoblades.io/abi/'
const ABIS = ['Treasury']

const task = async () => {
  await Promise.all(ABIS.map(async (name) => {
    const contract = await fetch(`${ABI_URL}/${name}.json`).then((res) => res.json())
    await fs.writeJson(`./src/abi/${name}.json`, contract.abi)
  }))
}

module.exports = task
