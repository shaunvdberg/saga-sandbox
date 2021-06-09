const ipc = require('electron').ipcRenderer;
const openSecondWindowButton = document.getElementById('open-connect');
const sendMessageToSecondWindow = document.getElementById('send-message');

// ipc.on('', (event, message) => {
//     console.log(message);
// });

console.log('renderer.');

let token = 0;

openSecondWindowButton.addEventListener('click', (event) => {
    // console.log('open fm connect');
    ipc.send('integration-open', 'fm-connect');
});

sendMessageToSecondWindow.addEventListener('click', (event) => {
    // console.log('open fm connect');
    ipc.send('send-message', 'fm-connect-message');
});

// const interval = 5000;

// refreshTokenTimer = setTimeout(() => {
//     ipc.send('integration-refresh-token', ++token);
// }, interval);