const EDITOR_URL = 'https://arcade.makecode.com'

const { parentPort } = require('node:worker_threads')
const { JSDOM } = require('jsdom')
const jsdom = new JSDOM(`
<!DOCTYPE html>
<html lang="en-US">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Blocks Embedding Test Page</title>
    <style>
        html {font-family: Arial, Helvetica, sans-serif}
        .boxdiv {padding:5px; display:inline-block; border: solid; background-color: lightgray}
    </style>
</head>
<body>
</body>
</html>
`, {
    resources: 'usable',
    runScripts: 'dangerously',
})

const { ArrayBuffer, TextDecoder, TextEncoder } = require('node:util')

jsdom.TextEncoder = TextEncoder
jsdom.TextDecoder = TextDecoder
jsdom.ArrayBuffer = ArrayBuffer
jsdom.Uint8Array = Uint8Array

const __queue = []

var __assignedId = -1
var __currentFile = ''
var __ready = false

function injectRenderer() {
    var f = jsdom.window.document.getElementById("makecoderenderer")
    // check iframe already added to the DOM
    if (f) {
        return
    }
    f = jsdom.window.document.createElement("iframe")
    f.id = "makecoderenderer"
    f.style.position = "absolute"
    f.style.left = 0
    f.style.bottom = 0
    f.style.width = "1px"
    f.style.height = "1px"
    f.src = EDITOR_URL +
        (EDITOR_URL[EDITOR_URL.length - 1] == '/' ? '' : '/') +
        '--docs?render=1'
    jsdom.window.document.body.appendChild(f)
}

function outputMessage(msg) {
    console.log(msg)
}

function renderNextFile() {
    if (__queue.length == 0) {
        return
    }
    __ready = false
    __currentFile = __queue[0]
    __queue.splice(0, 1)
    var code = `let counter = 0
    game.onUpdateInterval(5000, function () {
        console.log("Entering the 'on game update every 5000 ms' block.")
        counter += 1
        console.logValue("Number of times run", counter)
    })
    `
    var isSnippet = false
    var msg = {
        type: "renderblocks",
        id: Math.random(),
        code: code.toString(),
        options: {
            snippetMode: isSnippet,
        }
    }
    console.log(`Worker ${__assignedId} rendering file ${__currentFile}.`)
    var f = jsdom.window.document.getElementById("makecoderenderer")
    f.contentWindow.postMessage(msg, EDITOR_URL)
}

jsdom.window.addEventListener('message', function (ev) {
    var msg = ev.data
    if (msg.source != 'makecode') return
    console.log(msg.type)
    switch (msg.type) {
        case 'renderready':
            console.log(`Worker ${__assignedId} renderer is ready.`)
            parentPort.emit('online')
            __ready = true
            if (__queue.length > 0) {
                renderNextFile()
            }
            break
        case 'renderblocks':
            outputMessage(msg)
            __ready = true
            parentPort.postMessage({
                id: __assignedId,
                msg: `Done with file ${__currentFile}.`,
                file: __currentFile,
            })
            if (__queue.length > 0) {
                renderNextFile()
            }
            break
    }
}, false)

parentPort.on('message', message => {
    __assignedId = message.id
    fileName = message.task
    console.log(`Worker ${__assignedId}: Received request to process file ${fileName}`)
    __queue.push(fileName)
    if (__ready) {
        renderNextFile()
    } else {
        injectRenderer()
    }
})
