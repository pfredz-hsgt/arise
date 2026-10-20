import { useState, useCallback } from 'react';
import { message } from 'antd';
import * as XLSX from 'xlsx';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

/**
 * Headless hook managing Admin Menu state and full database Excel export.
 */
export const useAdminMenu = () => {
    const navigate = useNavigate();
    const [exporting, setExporting] = useState(false);
    const [activeTab, setActiveTab] = useState('1');

    const handleExport = useCallback(async () => {
        try {
            setExporting(true);
            message.loading({ content: 'Exporting data...', key: 'export' });

            // Fetch Inventory (all units)
            const inventoryData = await api.get('/inventory?all_units=true');

            // Fetch Indents with related item name (all units)
            const indentData = await api.get('/indents?all_units=true');

            // Create Workbook
            const wb = XLSX.utils.book_new();

            // Add Inventory Sheet
            if (inventoryData && inventoryData.length > 0) {
                const wsInventory = XLSX.utils.json_to_sheet(inventoryData);
                XLSX.utils.book_append_sheet(wb, wsInventory, 'Inventory');
            }

            // Add Indents Sheet
            if (indentData && indentData.length > 0) {
                const flatIndentData = indentData.map(item => ({
                    ...item,
                    drug_name: item.inventory_items?.name || 'Unknown',
                    inventory_items: undefined
                }));
                const wsIndents = XLSX.utils.json_to_sheet(flatIndentData);
                XLSX.utils.book_append_sheet(wb, wsIndents, 'Indents');
            }

            // Write File
            XLSX.writeFile(wb, `ARISE_Data_${new Date().toISOString().split('T')[0]}.xlsx`);

            message.success({ content: 'Data exported successfully!', key: 'export' });
        } catch (error) {
            console.error('Export error:', error);
            message.error({ content: 'Failed to export data', key: 'export' });
        } finally {
            setExporting(false);
        }
    }, []);

    return {
        activeTab,
        setActiveTab,
        exporting,
        handleExport,
        navigate
    };
};

export default useAdminMenu;
