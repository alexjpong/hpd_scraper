const Database = require('better-sqlite3')

const scrapeAddress = require("./lib.js")

const db = new Database('./hpd.sqlite3')

const batchSize = 1

const boroughMap = {
  BK: 'Brooklyn',
  QN: 'Queens',
  MN: 'Manhattan',
  BX: 'Bronx',
  SI: 'Staten Island'
}

async function main() {
  let offsetCounter = 0

  // fetch count info
  const { count } = db.prepare('select count(*) as count from "addresses"').get()

  console.log(`Total Count: ${count}`)

  // fetch addresses
  while (offsetCounter < count) {
    console.log(`processing batch... ${offsetCounter} - ${offsetCounter + batchSize}`)

    const stmt = db.prepare('select * from "addresses" order by street limit ? offset ?;')
    const rows = stmt.all(batchSize, offsetCounter)
    offsetCounter += batchSize

    const promises = rows.map(row => {
      return scrapeAddress(boroughMap[row.borough].toString(), row.number.toString(), row.street.toString())
    })

    try {
      const scrapingData = await Promise.all(promises)
      scrapingData.forEach((icardInfo, index) => {
        const insertStatement = db.prepare('update "addresses" set icard = ? where borough = ? and address = ?;')
        insertStatement.run(icardInfo.toString(), rows[index].borough, rows[index].address)
      })
    } catch (error) {
      console.log('error in batch:', rows, error)
    }
  }

}

main()