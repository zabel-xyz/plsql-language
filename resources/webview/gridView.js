// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = typeof acquireVsCodeApi != 'undefined' ? acquireVsCodeApi() : null;
    let gridOpt;

    // add events
    window.addEventListener('message', sendMessage);

     function cancelConnection(event) {
        vscode.postMessage({
            command: 'cancelGridView',
            // data: {
            // }
        });
    }

    // Handle messages sent from the extension to the webview
    function sendMessage(event) {
        const message = event.data; // The json data that the extension sent
        if (message.command === 'showGridView') {
            displayGridView(message.data);
        }
    }

    function displayGridView(data) {
        if (!data)
            return;

        console.log(data);

        const result = data.data;

        if (!result || !result.metaData || !result.rows)
            return;


        const columnDefs = result.metaData.map(col => ({headerName: col.name, field: col.name}));

        const rowData = result.rows.map(record => {
            let row = {};
            record.forEach((value, index) => row[result.metaData[index].name] = value);
            return row;
        });

        // lookup the container we want the Grid to use
        const eGridDiv = document.querySelector('#gridView');

        // create the grid passing in the div to use together with the columns & data we want to use
        if (!gridOpt) {
            gridOpt = {enableColResize: true, columnDefs, rowData};
            new agGrid.Grid(eGridDiv, gridOpt)
        } else {
            gridOpt.api.setColumnDefs(columnDefs);
            gridOpt.api.setRowData(rowData);
        }
    }

}());