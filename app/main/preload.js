const {
    contextBridge,
    ipcRenderer
} = require("electron");

// contextBridge.exposeInMainWorld(
//     "api", {
//         //send: (channel, data) => {
//         request: (channel, data) => {
//             // whitelist channels
//             console.log('request');
//             let validChannels = ["token-request-from-connect"];
//             if (validChannels.includes(channel)) {
//                 ipcRenderer.send(channel, data);
//             }
//         },
//         //receive: (channel, func) => {
//         response: (channel, func) => {
//             console.log('response');
//             // let validChannels = ["token-refresh"];
//             // if (validChannels.includes(channel)) {
//             //     // Deliberately strip event as it includes `sender`
//             //     console.log(channel);
//             ipcRenderer.on(channel, (event, ...args) => func(...args));
//             // }
//         }
//     }
// );


console.log('register-preload');

window.addEventListener('unload', function(event) {
    this.alert('unloads');
});

// function register() {
//   contextBridge.exposeInMainWorld(
//     "api", {
//         onClosing: (callback) => {
//           console.log('register-window-closing');
  
//           ipcRenderer.on("window-closing", (event, ...args) => callback());
//         }
//     }
//   );

//   console.log('register done.');
// }

// setTimeout(register, 5000);

let token = 100;

contextBridge.exposeInMainWorld(
    "api", {
        onClosing: (callback) => {
            ipcRenderer.on("window-closing", (event, ...args) => callback());
        },
        onTokenRefresh: (callback) => {
            ipcRenderer.on("token-refresh", (event, ...args) => {
                callback(++token); 
            });
        }
    }
);