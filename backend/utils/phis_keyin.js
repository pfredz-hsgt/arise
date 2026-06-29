const { chromium } = require('playwright');

// Launch Browser
const browser = await chromium.launch({ headless: options.headless !== undefined ? options.headless : true });
const page = await browser.newPage();

// Config - get from user via popup modal,  username,  password
const CONFIG = {
    //insert your codes here
};

try {
    logCallback("Logging into PhIS...");
    await page.goto('http://10.77.232.70:8080/iphis/login.zul');
    await page.fill('input[name="j_username"]', CONFIG.username);
    await page.fill('input[name="j_password"]', CONFIG.password);

    await page.click('input[name="combo_loc"]', { force: true });
    await page.waitForTimeout(1000);

    await page.click('#btnLogin');

    // Navigate to Indent Intra Facility
    logCallback("Navigating to Quota Drug List module...");
    await page.waitForSelector('span.z-treecell-text:has-text("Maintenance")');
    await page.dblclick('span.z-treecell-text:has-text("Maintenance")');

    await page.waitForSelector('span.z-treecell-text:text-is("Pharmacy")');
    await page.dblclick('span.z-treecell-text:text-is("Pharmacy")');

    await page.waitForSelector('span.z-treecell-text:has-text("Quota Drug List")');
    await page.click('span.z-treecell-text:has-text("Quota Drug List")');

    logCallback("Navigation complete. Starting loop for requested drugs...");

    for (const code of drugCodes) {
        logCallback(`\nProcessing Drug Code: ${code}`);

        try {
            // Wait for the Drug Code search box to be ready
            const searchInputSelector = 'input[_comp="txtbox_qdl_drugCode"]';
            await page.waitForSelector(searchInputSelector);

            // Clear and Input Drug Code
            await page.fill(searchInputSelector, '');
            await page.fill(searchInputSelector, code);

            // Click Search
            const searchBtnSelector = 'button[_comp="button_QDL_Search"]';
            await page.click(searchBtnSelector);

            // Wait for results
            const resultRowSelector = `div.z-listbox-body table tr.z-listitem:has-text("${code}")`;
            const noRecordSelector = `td#zc_Label_343-empty:visible, div.z-listbox-emptybody-content:has-text("No record found"):visible`;

            let searchResult = null;
            try {
                searchResult = await Promise.race([
                    page.waitForSelector(resultRowSelector, { timeout: 5000 }).then(() => 'FOUND'),
                    page.waitForSelector(noRecordSelector, { timeout: 5000 }).then(() => 'EMPTY')
                ]);

                if (searchResult === 'EMPTY') {
                    logCallback(`No entry found for drug code ${code} in main list.`);
                    continue;
                }
            } catch (e) {
                logCallback(`Timeout waiting for search results for ${code}. Skipping.`);
                continue;
            }

            // Double click the result row
            await page.locator(resultRowSelector).first().dblclick();

            // Wait for Popup
            const popupDrugNameSelector = 'span[_comp="bandbox_QuotaDrugListDialog_DrugSearch"] input';
            await page.waitForSelector(popupDrugNameSelector, { timeout: 10000 });

            // Verify we opened the right drug
            const popupDrugName = await page.$eval(popupDrugNameSelector, el => el.value);
            logCallback(`Opened drug details: ${popupDrugName}. Searching active patients...`);

            const popupContainerSelector = 'div[_wnd="window_QuotaDrugListAddDialog"]';
            const popupRowsSelector = `${popupContainerSelector} div.z-listbox-body tr.z-listitem`;

            // Pagination selectors
            const pagingContainer = `${popupContainerSelector} div.z-paging`;
            const nextButtonSelector = `${pagingContainer} .z-paging-next`;
            const pageInputSelector = `${pagingContainer} input.z-paging-input`;

            let patientsForDrug = [];
            let hasNextPage = true;

            while (hasNextPage) {
                const rowsExist = await page.$(popupRowsSelector);
                if (rowsExist) {
                    const pagePatients = await page.$$eval(popupRowsSelector, (rows) => {
                        return rows.map(row => {
                            const cells = row.querySelectorAll('.z-listcell');
                            const getText = (idx) => cells[idx] ? cells[idx].innerText.trim() : "";

                            const mrn = getText(0);
                            const ic = getText(1);
                            const name = getText(2);

                            let isActive = false;
                            if (cells[3]) {
                                const checkbox = cells[3].querySelector('input[type="checkbox"]');
                                const text = cells[3].innerText;
                                if (checkbox && checkbox.checked) isActive = true;
                                if (text.includes("Active")) isActive = true;
                                if (text.includes("Inactive")) isActive = false;
                            }

                            return { mrn, ic, name, active: isActive };
                        });
                    });

                    // Filter active only
                    const activePatients = pagePatients.filter(p => p.active);
                    patientsForDrug = patientsForDrug.concat(activePatients);
                }

                // Handle Pagination
                const nextBtn = await page.$(nextButtonSelector);
                const isDisabled = nextBtn ? await nextBtn.getAttribute('disabled') : "disabled";

                if (!nextBtn || isDisabled === 'disabled' || isDisabled === 'true') {
                    hasNextPage = false;
                } else {
                    const oldPageVal = await page.$eval(pageInputSelector, el => parseInt(el.value));
                    await nextBtn.click();
                    try {
                        await page.waitForFunction(
                            ({ selector, oldVal }) => {
                                const input = document.querySelector(selector);
                                return input && parseInt(input.value) > oldVal;
                            },
                            { selector: pageInputSelector, oldVal: oldPageVal },
                            { timeout: 5000 }
                        );
                        await page.waitForTimeout(500);
                    } catch (timeout) {
                        logCallback(`Timeout waiting for next page for ${code}. Moving on.`);
                        hasNextPage = false;
                    }
                }
            }

            logCallback(`Found ${patientsForDrug.length} active patients for ${code}.`);

            scrapedData.push({
                drug_code: code,
                drug_name: popupDrugName,
                scraped_at: new Date().toISOString(),
                patients: patientsForDrug
            });

            // CLOSE POPUP
            const closeBtnSelector = 'button[_comp="btnClose"]';
            await page.click(closeBtnSelector);

            await page.waitForSelector(popupContainerSelector, { state: 'hidden', timeout: 5000 });
            await page.waitForTimeout(500);

        } catch (drugErr) {
            logCallback(`Error processing drug ${code}: ${drugErr.message}`);
            try {
                const closeBtn = await page.$('button[_comp="btnClose"]');
                if (closeBtn && await closeBtn.isVisible()) {
                    await closeBtn.click();
                    await page.waitForTimeout(1000);
                }
            } catch (e) { }
        }
    }

    logCallback("\nScraping Loop Completed.");

} catch (globalErr) {
    logCallback(`Critical Error in browser: ${globalErr.message}`);
    console.error("Critical Error:", globalErr);
} finally {
    await browser.close();
    logCallback("Browser closed.");
}

return scrapedData;
}