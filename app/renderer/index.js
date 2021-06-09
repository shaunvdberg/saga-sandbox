import { ipcRenderer } from 'electron';
const openSecondWindowButton = document.getElementById('open-connect');
const sendMessageToSecondWindow = document.getElementById('send-message');

openSecondWindowButton.addEventListener('click', (event) => {
    ipcRenderer.send('integration-open', 'fm-connect');
});

sendMessageToSecondWindow.addEventListener('click', (event) => {
    ipcRenderer.send('send-message', 'fm-connect-message');
});