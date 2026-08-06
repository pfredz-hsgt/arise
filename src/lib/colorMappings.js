import { api } from './api';

let sourceColors = {};
let purchaseTypeColors = {};
let stdKtColors = {};
let itemTypeColors = {};
let isInitialized = false;

export const initColors = async () => {
    if (isInitialized) return;
    try {
        const [sources, pTypes, stdKts, types] = await Promise.all([
            api.get('/lookups/sources'),
            api.get('/lookups/purchasetypes'),
            api.get('/lookups/stdkts'),
            api.get('/lookups/types')
        ]);
        
        sources.forEach(s => sourceColors[s.name] = s.color);
        pTypes.forEach(p => purchaseTypeColors[p.name] = p.color);
        stdKts.forEach(sk => stdKtColors[sk.name] = sk.color);
        types.forEach(t => itemTypeColors[t.name] = t.color);
        
        isInitialized = true;
    } catch (error) {
        console.error('Failed to initialize colors:', error);
    }
};

export const getSourceColor = (source) => {
    return sourceColors[source] || 'default';
};

export const getPuchaseTypeColor = (type) => {
    return purchaseTypeColors[type] || 'default';
};

export const getStdKtColor = (type) => {
    return stdKtColors[type] || 'default';
};

export const getTypeColor = (type) => {
    return itemTypeColors[type] || 'default';
};
