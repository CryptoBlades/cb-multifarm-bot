const clc = require('cli-color')
const moment = require('moment')

const severityMap = {
  info: clc.cyan,
  warn: clc.yellow,
  error: clc.red,
  success: clc.green,
  main: clc.magenta
}

module.exports = (level, msg) => {
  console.log(clc.blue(moment().format('LTS')) + ' ' + severityMap[level].bold(msg))
}
