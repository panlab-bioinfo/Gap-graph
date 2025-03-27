const { dialog,contextBridge,ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronApi',{
    ipcRenderer,
})