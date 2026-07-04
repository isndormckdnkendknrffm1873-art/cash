const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false // للسماح بتشغيل الملفات الصوتية المحلية داخل البرنامج
        }
    });
    mainWindow.setMenuBarVisibility(false); // إخفاء شريط الويندوز العلوي
    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// تجهيز مسار مجلد البيانات في المستندات
const dataDir = path.join(app.getPath('documents'), 'FlyChicken_Data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 1. استقبال الفاتورة من الواجهة وحفظها بالويندوز
ipcMain.handle('save-order', async (event, orderData, audioBuffer) => {
    try {
        const timestamp = Date.now();
        const orderId = `Order_${timestamp}`;

        // حفظ التسجيل الصوتي إن وجد
        if (audioBuffer) {
            const audioPath = path.join(dataDir, `${orderId}.webm`);
            fs.writeFileSync(audioPath, Buffer.from(audioBuffer));
            orderData.audioFile = audioPath; // حفظ مسار الملف الصوتي بالويندوز
        } else {
            orderData.audioFile = null;
        }

        // حفظ الفاتورة كملف JSON
        const jsonPath = path.join(dataDir, `${orderId}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(orderData, null, 2));

        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: error.message };
    }
});

// 2. قراءة الفواتير لعرضها في الأرشيف
ipcMain.handle('get-orders', async () => {
    try {
        const files = fs.readdirSync(dataDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        const orders = [];
        
        for (const file of jsonFiles) {
            const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
            const parsed = JSON.parse(content);
            // تحويل مسار الملف الصوتي ليكون مقروء للمتصفح
            if (parsed.audioFile) {
                parsed.audioUrl = `file:///${parsed.audioFile.replace(/\\/g, '/')}`;
            }
            orders.push(parsed);
        }
        return orders;
    } catch (error) {
        console.error(error);
        return [];
    }
});
