const initScrape = require("./lib.js")

const addresses = [
  { borough: 'Manhattan', houseNumber: '270', street: 'West 73' }
]

async function main() {
  const { borough, houseNumber, street } = addresses[0]
  await initScrape(borough, houseNumber, street)
}

main()