const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    saveOrderToWindows: (orderData, audioBuffer) => ipcRenderer.invoke('save-order', orderData, audioBuffer),
    getOrders: () => ipcRenderer.invoke('get-orders')
});
