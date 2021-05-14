import {
  app,
  BrowserWindow,
  ipcMain
} from 'electron'
const request = require("request");
const fs = require("fs");
const https = require("https");
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development' ?
  `http://localhost:9080` :
  `file://${__dirname}/index.html`

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000,
    // frame: false,//不显示顶部
    // resizable: false, //可否缩放
    // movable: false //可否移动
  })
  //重点在下面这行，开启调试
  // mainWindow.webContents.openDevTools()
  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })





}
/**
 * 文件下载
 * @param {*} url 下载地址
 * @param {*} dest 文件保存的路径，如：D:/download/app/ybx1.apk
 * @param {*} cb 回调函数参数1为区别哪个加试，如：'download'下载结束，'data'下载进度，'finish'文件写入结束
 */
const downloadFile = (url, dest, cb = () => {}) => {
  // 确保dest路径存在
  console.log("dest:"+dest)
  const file = fs.createWriteStream(dest)
  https.get(url, (res) => {
    if (res.statusCode !== 200) {
      cb(response.statusCode)
      return
    }

    // 进度
    const len = parseInt(res.headers['content-length']) // 文件总长度
    let cur = 0
    const total = (len / 1048576).toFixed(2) // 转为M 1048576 - bytes in  1Megabyte
    res.on('data', function (chunk) {
      cur += chunk.length
      const progress = (100.0 * cur / len).toFixed(2) // 当前进度
      const currProgress = (cur / 1048576).toFixed(2) // 当前了多少
      cb('data', progress, currProgress, total)
    })

    res.on('end', () => {
      // console.log('下载结束')
      cb('download')
    })

    // 超时,结束等
    file.on('finish', () => {
      // console.log('文件写入结束')
      file.close(cb('finish'))
    }).on('error', (err) => {
      fs.unlink(dest)
      if (cb) cb('error', err.message)
    })
    res.pipe(file)
  })
}
//主进程代码
ipcMain.on('download', (evt, args) => {
  var arr = args.split("+");
  var downloadpath = arr[0];
  var folderpath = arr[1];
  downloadFile(downloadpath, folderpath, (state, pro, currPro, total) => {
    if (state == 'data') {
      // 下载进度
      console.log(pro, currPro, total)
      evt.sender.send("sendPro", pro)
    } else if (state == 'download') {
      evt.sender.send("sendMain", folderpath)
    }
  })
  // var path = request(downloadpath).pipe(fs.createWriteStream(folderpath));
});

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */