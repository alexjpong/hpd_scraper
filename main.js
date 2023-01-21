const Database = require('better-sqlite3')

const scrapeAddress = require("./lib.js")

const db = new Database('./hpd.sqlite3')

const batchSize = 2

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
  const { count } = db.prepare(`select count(*) as count from "addresses" where icard is null`).get()

  console.log(`Total Count: ${count}`)

  // fetch addresses
  while (offsetCounter < count) {
    console.log(`processing batch... ${offsetCounter} - ${offsetCounter + batchSize}`)

    const stmt = db.prepare(`select * from "addresses" where icard is null order by borough, street limit ? offset ?;`)
    const rows = stmt.all(batchSize, offsetCounter)
    offsetCounter += batchSize

    const promises = rows.map(row => {
      return scrapeAddress(boroughMap[row.borough].toString(), row.number.toString(), row.street.toString())
    })

    try {
      const scrapingDataResults = await Promise.allSettled(promises)

      scrapingDataResults.forEach((result, index) => {
        const { status, value, reason } = result

        if (status === "fulfilled") {
          console.log(`Success: updating icard value for: ${rows[index].borough}, ${rows[index].address} to: ${value}`)
          const insertStatement = db.prepare('update "addresses" set icard = ?, updated_at = ? where borough = ? and address = ?;')
          insertStatement.run(value.toString(), new Date().toISOString(), rows[index].borough, rows[index].address)
        } else if (status === 'rejected') {
          console.log(`Failure: updating error_count value for: ${rows[index].borough}, ${rows[index].address} to: ${rows[index].error_count + 1}`)
          const insertStatementForError = db.prepare('update "addresses" set error_count = ? where borough = ? and address = ?;')
          insertStatementForError.run(rows[index].error_count + 1, rows[index].borough, rows[index].address)
        }
      })
    } catch (error) {
      console.log('error in batch for rows:', rows, error)
    }
  }

}

main()