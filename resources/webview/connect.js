// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = typeof acquireVsCodeApi != 'undefined' ? acquireVsCodeApi() : null;

    // add events
    document.getElementById('connection').addEventListener('submit', submitConnection);
    document.getElementById('cancel').addEventListener('click', cancelConnection);
    window.addEventListener('message', sendMessage);

    document.querySelectorAll('input, textarea')
        .forEach(input => {
            input.addEventListener('invalid', event =>
                    input.classList.add('error')
            );
            input.addEventListener('input', event => {
                input.value !== '' ? input.classList.add('notEmpty') : input.classList.remove('notEmpty');
                input.classList.remove('error');
            });
        });

    function submitConnection(event) {
        const data =  {
            database: document.connection.database.value,
            username: document.connection.user.value,
            password: document.connection.password.value,
            schema: document.connection.schema.value,
            active: document.connection.active.checked ? true : false
        };
        const sendData = {};
        Object.keys(data).forEach(key => {
            if (data[key] !== '')
                sendData[key] = data[key];
        });
        vscode.postMessage({
            command: 'newConnection',
            data: sendData
        });
    }

    function cancelConnection(event) {
        vscode.postMessage({
            command: 'cancelConnection',
            // data: {
            // }
        });
    }

    // Handle messages sent from the extension to the webview
    function sendMessage(event) {
        const message = event.data; // The json data that the extension sent
        if (message.command = 'newConnection') {
            document.connection.database.value = message.data.database;
            document.connection.user.value = message.data.username;
            document.connection.password.value = message.data.password;
            document.connection.schema.value = message.data.schema;
            if (message.data.active)
                document.connection.active.value = true;
        }
    };

}());