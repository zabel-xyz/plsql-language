// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = typeof acquireVsCodeApi != 'undefined' ? acquireVsCodeApi() : null;
    let _currentID = null;
    let _oldID = null;

    // add events
    document.getElementById('connection').addEventListener('submit', submitConnection);
    document.getElementById('cancel').addEventListener('click', cancelConnection);
    document.getElementById('delete').addEventListener('click', deleteConnection);
    document.getElementById('new').addEventListener('click', newConnection);

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

    document.querySelectorAll('select')
        .forEach(input => {
            input.addEventListener('input', event => {
                input.value !== '' ? input.classList.add('notEmpty') : input.classList.remove('notEmpty');
            });
        });

    function submitConnection(event) {
        _oldID = null;
        const data =  {
            database: document.connection.database.value,
            username: document.connection.user.value,
            password: document.connection.password.value,
            privilege: document.connection.privilege.value,
            schema: document.connection.schema.value,
            loginScript: document.connection.loginScript.value,
            tag: document.connection.tag.value,
            active: document.connection.active.checked ? true : false,
            ID: _currentID
        };
        const sendData = {};
        Object.keys(data).forEach(key => {
            if (data[key] !== '')
                sendData[key] = data[key];
        });
        vscode.postMessage({
            command: 'submitConnection',
            data: sendData
        });
    }

    function cancelConnection(event) {
        vscode.postMessage({
            command: 'cancelConnection',
            data: {
                ID: (_showAll ? (_currentID == null ? _oldID : _currentID) : null)
            }
        });
        _oldID = null;
    }

    function deleteConnection(event) {
        vscode.postMessage({
            command: 'deleteConnection',
            data: {
                ID: _currentID
            }
        });
    }

    function showConnection(ID) {
        vscode.postMessage({
            command: 'showConnection',
            data: {
                ID: ID
            }
        });
    }

    function newConnection(event) {
        _oldID = _currentID;
        vscode.postMessage({
            command: 'newConnection'
        });
    }

    // Handle messages sent from the extension to the webview
    function sendMessage(event) {
        const message = event.data; // The json data that the extension sent
        _showAll = true;
        if (message.command === 'newConnection') {
            _showAll = false;
        } else if (message.command === 'settingsConnections') {
            updateForm(message.data.connection);
            updateList(message.data.items);
        }
        document.getElementById('navigator').hidden = !_showAll;
        document.connection.delete.hidden = _currentID == null;
        document.getElementById('new').hidden = _currentID == null;
        if (_currentID == null) {
            document.connection.create.textContent = 'Create';
            document.getElementById('title').textContent = 'New connection';
        } else {
            document.connection.create.textContent = 'Update';
            document.getElementById('title').textContent = `Connection ${message.data.connection.name}`;
        }
    }

    function updateForm(data) {
        if (data && data.database) {
            document.connection.database.value = data.database;
            document.connection.database.classList.add('notEmpty');
        } else {
            document.connection.database.value = '';
            document.connection.database.classList.remove('notEmpty');
        }
        if (data && data.username) {
            document.connection.user.value = data.username;
            document.connection.user.classList.add('notEmpty');
        } else {
            document.connection.user.value = '';
            document.connection.user.classList.remove('notEmpty');
        }
        if (data && data.password) {
            document.connection.password.value = data.password;
            document.connection.password.classList.add('notEmpty');
        } else {
            document.connection.password.value = '';
            document.connection.password.classList.remove('notEmpty');
        }
        if (data && data.privilege) {
            document.connection.privilege.value = data.privilege;
            document.connection.privilege.classList.add('notEmpty');
        } else {
            document.connection.privilege.value = '';
            document.connection.privilege.classList.remove('notEmpty');
        }
        if (data && data.schema) {
            document.connection.schema.value = data.schema;
            document.connection.schema.classList.add('notEmpty');
        } else {
            document.connection.schema.value = '';
            document.connection.schema.classList.remove('notEmpty');
        }
        if (data && data.loginScript) {
            document.connection.loginScript.value = data.loginScript;
            document.connection.loginScript.classList.add('notEmpty');
        } else {
            document.connection.loginScript.value = '';
            document.connection.loginScript.classList.remove('notEmpty');
        }
        if (data && data.tag) {
            document.connection.tag.value = data.tag;
            document.connection.tag.classList.add('notEmpty');
        } else {
            document.connection.tag.value = '';
            document.connection.tag.classList.remove('notEmpty');
        }


        document.querySelectorAll('input, textarea, select')
        .forEach(input => {
                input.classList.remove('error');
            });

        if (data)
            _currentID = data.ID;
        else
            _currentID = null;
        if (!data || data.active)
            document.connection.active.checked = true;
        else
            document.connection.active.checked = false;
    }

    function updateList(items) {
        const navig = document.getElementById('navigatorItems');
        const ul = document.createElement('ul');
        if (items)
            items.forEach(item => {
                const li = document.createElement('li');
                li.className = 'navigItem';
                li.addEventListener('click', () => showConnection(item.ID));
                if (item.ID === _currentID)
                    li.classList.add('active');
                li.innerHTML = item.name;
                ul.appendChild(li);
        });
        navig.removeChild(navig.lastChild);
        navig.appendChild(ul);
    }

}());