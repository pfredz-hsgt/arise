import { chromium } from 'playwright';

/**
 * Automates the PhIS Indent process.
 * @param {Array} items - Array of items to indent { item_code, requested_qty }
 * @param {Object} options - Options { headless, logCallback }
 */
async function runPhisIndent(items, options = {}) {
    const logCallback = options.logCallback || console.log;
    const headless = options.headless !== undefined ? options.headless : false;

    logCallback("Launching browser...");
    const browser = await chromium.launch({ headless });
    const page = await browser.newPage();

    try {
        logCallback("Navigating to PhIS login...");
        await page.goto('http://10.77.232.70:8080/iphis/login.zul');

        logCallback("Waiting for login page to load...");
        if (options.username && options.password) {
            logCallback("Entering provided credentials...");
            await page.fill('input[name="j_username"]', options.username);
            await page.fill('input[name="j_password"]', options.password);
        }

        logCallback("Selecting Outpatient Pharmacy Counter...");
        // click dropdown arrow button or input to open popup
        const comboBtn = await page.$('a.z-combobox-button');
        if (comboBtn) {
            await comboBtn.click();
        } else {
            await page.waitForSelector('input[name="combo_loc"]');
            await page.click('input[name="combo_loc"]', { force: true });
        }

        // wait for the dropdown item and click it
        const listItemSelector = 'li.z-comboitem:has-text("Outpatient Pharmacy Counter")';
        await page.waitForSelector(listItemSelector);
        await page.click(listItemSelector);

        await page.waitForTimeout(1000);

        if (options.username && options.password) {
            logCallback("Clicking login button...");
            await page.click('#btnLogin');
        } else {
            logCallback("No credentials provided. Please enter credentials and login manually.");
        }

        logCallback("Waiting for dashboard to load...");

        // Wait for Inventory menu to appear (this indicates successful login and dashboard load)
        await page.waitForSelector('span.z-treecell-text:has-text(" Inventory")', { timeout: 0 }); // Wait indefinitely

        logCallback("Login successful. Navigating to Indent menu...");

        // double click menu Inventory
        await page.dblclick('span.z-treecell-text:has-text(" Inventory")');
        await page.waitForTimeout(500);

        // dblclick menu Inventory Management
        await page.dblclick('span.z-treecell-text:has-text(" Inventory Management")');
        await page.waitForTimeout(500);

        // dblclick menu Distribution
        await page.dblclick('span.z-treecell-text:has-text(" Distribution")');
        await page.waitForTimeout(500);

        // dblclick menu Indent
        await page.dblclick('span.z-treecell-text:has-text(" Indent")');
        await page.waitForTimeout(500);

        // click menu Intra Facility (Sent)
        await page.click('span.z-treecell-text:has-text(" Intra Facility (Sent)")');

        logCallback("Navigated to Indent List. Creating new record...");

        // click button "[+]"
        await page.waitForSelector('button[_comp="button_IndentList_NewList"]');
        await page.click('button[_comp="button_IndentList_NewList"]');

        // click on selector combox_IndentDialog_SendIndentTo dropdown
        const substoreBtn = await page.$('span[_comp="combox_IndentDialog_SendIndentTo"] a.z-combobox-button');
        if (substoreBtn) {
            await substoreBtn.click();
        } else {
            await page.waitForSelector('span[_comp="combox_IndentDialog_SendIndentTo"] input');
            await page.click('span[_comp="combox_IndentDialog_SendIndentTo"] input', { force: true });
        }

        // click on the list item OUTPATIENT PHARMACY SUBSTORE
        const substoreItemSelector = 'li.z-comboitem:has-text("OUTPATIENT PHARMACY SUBSTORE")';
        await page.waitForSelector(substoreItemSelector);
        await page.click(substoreItemSelector);

        logCallback("Starting to key in items...");

        // click "Add Item"
        await page.waitForSelector('button[_comp="button_IndentDialog_AddNewItem"]');
        await page.click('button[_comp="button_IndentDialog_AddNewItem"]');

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const { item_code, requested_qty } = item;

            if (!item_code || requested_qty === undefined || requested_qty === null || requested_qty === 0) {
                logCallback(`Skipping invalid item at index ${i} (Code: ${item_code}, Qty: ${requested_qty})`);
                continue;
            }

            logCallback(`Processing item ${i + 1}/${items.length}: Code ${item_code}, Qty ${requested_qty}`);

            // wait for a while and click selector bandbox_DrugNonDrug
            await page.waitForTimeout(1000);
            await page.click('span[_comp="bandbox_DrugNonDrug"] input.z-bandbox-input');

            await page.waitForTimeout(1000);

            // input drug code here
            await page.waitForSelector('input[name="drugCode"]');
            await page.fill('input[name="drugCode"]', item_code);
            await page.waitForTimeout(1000);

            // click btn "Search" or kbd press "Enter"
            await page.keyboard.press('Enter');

            // wait for results to load
            await page.waitForTimeout(1000);

            // dblclick on item from list (that has same code as entered previously)
            const rowSelector = `div.z-listbox-body table tr.z-listitem:has(div.z-listcell-content:text-is("${item_code}"))`;
            await page.waitForSelector(rowSelector, { timeout: 15000 });
            await page.dblclick(rowSelector);

            // input/replace the indent qty
            await page.waitForSelector('input[_comp="lb_IndentAddItem_ItemQty"]');
            await page.fill('input[_comp="lb_IndentAddItem_ItemQty"]', requested_qty.toString());

            // click on save button
            await page.click('button[_comp="button_IndentAddItem_Save"]');

            // click on yes confirmation
            await page.waitForSelector('button.z-messagebox-button:has-text("Yes")');
            await page.click('button.z-messagebox-button:has-text("Yes")');

            // wait a bit for save to register before proceeding to next item
            await page.waitForTimeout(1000);
        }

        logCallback("Finished adding all items. Closing Add Item window...");

        // after finishing click on X button
        await page.waitForSelector('button[_comp="button_IndentAddItem_btnClose"]');
        await page.click('button[_comp="button_IndentAddItem_btnClose"]');

        logCallback("Saving the indent record...");

        // click on the main save button
        await page.waitForSelector('button[_comp="button_IndentDialog_Save"]');
        await page.click('button[_comp="button_IndentDialog_Save"]');

        // click on confirmation yes
        await page.waitForSelector('button.z-messagebox-button:has-text("Yes")');
        await page.click('button.z-messagebox-button:has-text("Yes")');

        logCallback("Indent process completed successfully!");

    } catch (error) {
        logCallback(`Error during PhIS Indent: ${error.message}`);
        console.error(error);
    } finally {
        logCallback("Finished script execution.");
        // Browser intentionally left open so the user can verify
        // await browser.close();
    }
}

export {
    runPhisIndent
};
