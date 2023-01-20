const playwright = require("playwright")

async function scrapeAddress(borough, houseNumber, street) {

  const browser = await playwright.chromium.launch({
    headless: true
  })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto('https://www.nyc.gov/site/hpd/about/hpd-online.page')

    await page.locator('label:has-text("Select Borough")').selectOption({ label: borough })
    await page.fill('label:has-text("House Number")', houseNumber)
    await page.fill('label:has-text("Street Name")', street)

    await page.click('button:has-text("Submit")', { timeout: 45000 })

    // should go to https://hpdonline.hpdnyc.org/HPDonline/select_application.aspx
    await page.locator('#lbtnIcard').click({ timeout: 60000 })
    await page.waitForLoadState('networkidle')

    const iCardTableRows = page.locator('#dgImages tbody')
    const iCardTableRowsContent = await iCardTableRows.allInnerTexts()

    // log out the icard results for this address
    console.log(`Found: ${borough}, ${houseNumber}, ${street}, ${iCardTableRowsContent}`)

    await context.close()
    await browser.close()

    return iCardTableRowsContent

  } catch (error) {
    await browser.close()

    throw error
  }
}


module.exports = scrapeAddress
