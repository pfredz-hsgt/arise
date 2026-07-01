import { chromium } from 'playwright';

/**
 * Automates the PhIS Indent process.
 * @param {Array} items - Array of items to indent { item_code, requested_qty }
 * @param {Object} options - Options { headless, logCallback }
 */
async function runPhisIndent(items, options = {}) {
    const logCallback = options.logCallback || console.log;
    const headless = options.headless !== undefined ? options.headless : true;

    logCallback("Launching browser...");
    const browser = await chromium.launch({ headless });
    options.browser = browser;
    const page = await browser.newPage();

    try {
        logCallback("Opening PhIS...");
        await page.goto('http://10.77.232.70:8080/iphis/login.zul');

        logCallback("Waiting for login...");
        if (options.username && options.password) {
            logCallback("Entering credentials...");
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
            logCallback("No credentials provided. Please try again.");
        }

        logCallback("Loading...");

        // Wait for Inventory menu to appear (this indicates successful login and dashboard load)
        await page.waitForSelector('span.z-treecell-text:has-text(" Inventory")', { timeout: 0 }); // Wait indefinitely

        try {
            const userInfoText = await page.locator('th.z-column div.z-column-content:has-text("User:")').textContent({ timeout: 5000 });
            if (userInfoText) {
                const match = userInfoText.match(/User:\s*([^;]+)/);
                if (match && match[1]) {
                    logCallback(`Login Successful. Logged in as user ${match[1].trim()}`);
                } else {
                    logCallback(`Login Successful. ${userInfoText}`);
                }
            } else {
                logCallback("Login successful. Navigating to Intra Facility (Sent)...");
            }
        } catch (e) {
            logCallback("Login successful. Navigating to Intra Facility (Sent)...");
        }

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

        logCallback("Creating new indent...");

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

        logCallback("Starting to add items");

        // click "Add Item"
        await page.waitForSelector('button[_comp="button_IndentDialog_AddNewItem"]');
        await page.click('button[_comp="button_IndentDialog_AddNewItem"]');

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const { item_code, requested_qty, item_name } = item;

            if (!item_code || requested_qty === undefined || requested_qty === null || requested_qty === 0) {
                logCallback(`Skipping invalid item at index ${i} (Code: ${item_code}, Qty: ${requested_qty})`);
                continue;
            }

            const nameDisplay = item_name ? ` (${item_name})` : '';
            logCallback(`Adding item ${i + 1}/${items.length}: Code ${item_code}${nameDisplay}, Qty ${requested_qty}`);

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
            const rowSelector = `div.z-listbox-body table tr.z-listitem:has(div.z-listcell-content:has-text("${item_code}"))`;
            await page.waitForSelector(rowSelector, { timeout: 30000 });
            await page.dblclick(rowSelector);

            // wait for the item details to load from the server and populate the default values
            await page.waitForTimeout(1500);

            // input/replace the indent qty
            await page.waitForSelector('input[_comp="lb_IndentAddItem_ItemQty"]');
            await page.click('input[_comp="lb_IndentAddItem_ItemQty"]');
            await page.keyboard.press('Control+A');
            await page.keyboard.press('Backspace');
            await page.keyboard.type(requested_qty.toString());
            await page.waitForTimeout(1000);

            // click on save button
            await page.click('button[_comp="button_IndentAddItem_Save"]');
            await page.waitForTimeout(1000);

            // click on yes confirmation
            await page.waitForSelector('button.z-messagebox-button:has-text("Yes")');
            await page.click('button.z-messagebox-button:has-text("Yes")');

            // wait a bit for save to register before proceeding to next item
            await page.waitForTimeout(2000);
        }

        logCallback("Finished adding all items. Closing the window...");
        await page.waitForTimeout(1000);

        // after finishing click on X button
        await page.waitForSelector('button[_comp="button_IndentAddItem_btnClose"]');
        await page.click('button[_comp="button_IndentAddItem_btnClose"]');

        logCallback("Saving the indent record...");

        // click on the main save button
        await page.waitForTimeout(2000);
        await page.waitForSelector('button[_comp="button_IndentDialog_Save"]');
        await page.click('button[_comp="button_IndentDialog_Save"]');

        // click on confirmation yes
        await page.waitForSelector('button.z-messagebox-button:has-text("Yes")');
        await page.click('button.z-messagebox-button:has-text("Yes")');
        await page.waitForTimeout(1500);
        // click on confirmation OK
        await page.waitForSelector('button.z-messagebox-button:has-text("OK")');
        await page.click('button.z-messagebox-button:has-text("OK")');

        logCallback("Waiting for Indent Number to be generated...");
        await page.waitForTimeout(3000);

        try {
            await page.waitForSelector('input[_comp="tb_IndentDialog_IndentNo"]', { timeout: 10000 });
            const indentNo = await page.$eval('input[_comp="tb_IndentDialog_IndentNo"]', el => el.value);
            logCallback(`The PhIS Indent Number is: ${indentNo}`);
        } catch (e) {
            logCallback("Could not retrieve the Indent Number automatically.");
        }

        logCallback("Indent process completed successfully!");

    } catch (error) {
        if (options.isAborted) {
            // Error was already logged by indents.js or handled gracefully
            // But we can log it here to be safe if indents.js doesn't catch it quickly
        } else {
            logCallback(`Error during PhIS Indent: ${error.message}`);
            console.error(error);
        }
    } finally {
        logCallback("Finished script execution.");
        await browser.close();
    }
}

export {
    runPhisIndent
};
