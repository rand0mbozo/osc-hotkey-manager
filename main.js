const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage } = require('electron/main')
const path = require('node:path')
const osc = require("osc");
const fs = require('fs');
const { GlobalKeyboardListener } = require("node-global-key-listener");

let hotkeys

let win
//const trayIcon = path.join(process.resourcesPath, "resources", "traylogo.png");
const trayIcon = path.join(__dirname, "assets/traylogo.png");
const createWindow = () => {
    win = new BrowserWindow({
        autoHideMenuBar: true,
        width: 1024,
        height: 768,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })
    win.loadFile('index.html')
    win.on('close', (event) => {
        event.preventDefault(); // Prevent closing
        if (win) win.hide(); // Hide instead of closing
        win = null;
    });

}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('before-quit', function () {
    tray.destroy();
});

let tray = null
app.whenReady().then(() => {
    tray = new Tray(trayIcon)
    tray.setToolTip('HotKeys for VRC')
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open Window',
            click: () => {
                if (!win) {
                    createWindow();
                }
                else {
                    win.focus();
                }
            }
        },
        {
            label: 'Quit', click: () => {
                close();
            }
        }
    ])


    // Call this again for Linux because we modified the context menu
    tray.setContextMenu(contextMenu)
    tray.on("click", () => {
        if (win) win.focus();
    });
    //splitHotkeys()
})

// VRChat OSC Target (Localhost and Port 9000)
const VRCHAT_IP = "127.0.0.1";
const VRCHAT_PORT = 9000;

// Create an OSC UDP Port
const udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 57121, // Any available port
    remoteAddress: VRCHAT_IP,
    remotePort: VRCHAT_PORT,
});

// Open the port
udpPort.open();


// Function to send OSC messages
function sendOscMessage(address, value, type) {
    //data types: 'f': float, 'i': int, 'T' / 'F': boolean, 's': string
    if (type != 'T' && type != 'F') {
        udpPort.send(
            {
                address: address,
                args: [{ type: type, value: value }],
            },
            VRCHAT_IP,
            VRCHAT_PORT
        );
    }
    else {
        udpPort.send(
            {
                address: address,
                args: [{ type: type, value: (type === 'T') }],
            },
            VRCHAT_IP,
            VRCHAT_PORT
        );
    }
    //console.log(`Sent OSC: ${address} -> ${value}`);
}

// Initialize global key listener
const keyboard = new GlobalKeyboardListener();
//event.state is uppercase letters
keyboard.addListener((event) => {
    checkHotkeys(hotkeys, event)
});
function checkHotkeys(arr, e) {
    if (arr.hotkeys) arr = arr.hotkeys
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].keystate === e.state && e.name === arr[i].key) {
            sendOscMessage(`/avatar/parameters/${arr[i].oscAddress}`, arr[i].value, arr[i].type)
            console.log(`Key Pressed: ${e.name}`);
        }
    }
}
function close() {
    udpPort.close();
    process.exit();
}

// Save hotkeys to file
ipcMain.on("save-data", (event, data) => {
    fs.writeFileSync('./hotkeys.json', JSON.stringify({ hotkeys: data }));
    hotkeys = data
    event.reply("data-saved", "Data saved to file!");
});

ipcMain.on("get-data", (event) => {
    event.reply("send-data", hotkeys || "No data found");
});

// Get Hotkeys JSON data
if (fs.existsSync('./hotkeys.json')) {
    let stat = fs.statSync('./hotkeys.json'); if (stat.size != 0) {
        const rawData = fs.readFileSync('./hotkeys.json');
        hotkeys = JSON.parse(rawData)
        if (!hotkeys) {
            fs.writeFileSync('./hotkeys.json', JSON.stringify({ hotkeys: [] }));
        }
    }
}
else {
    fs.writeFileSync('./hotkeys.json', JSON.stringify({ hotkeys: [] }));
}
