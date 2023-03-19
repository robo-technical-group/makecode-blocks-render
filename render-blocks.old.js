const jsdom = require('jsdom')
const EDITOR_URL = 'https://arcade.makecode.com'
const { JSDOM } = jsdom;
const { window } = new JSDOM(`
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
`)
const { document } = window
var queue = []
var sent = []
var targetUrl = EDITOR_URL[EDITOR_URL.length - 1] == '/' ? EDITOR_URL : EDITOR_URL + '/'

function injectRenderer() {
    var f = document.getElementById("makecoderenderer")
    // check iframe already added to the DOM
    if (f) {
        return
    }
    var f = document.createElement("iframe")
    f.id = "makecoderenderer"
    f.style.position = "absolute"
    f.style.left = 0
    f.style.bottom = 0
    f.style.width = "1px"
    f.style.height = "1px"
    f.src = targetUrl + "--docs?render=1"
    document.body.appendChild(f)
}

function outputMessage(msg) {
    /*
    var svg = msg.svg // this is an string containing SVG
    var id = msg.id // this is the id you sent
    // replace text with svg
    var img = document.createElement("img")
    img.src = msg.uri
    img.width = msg.width
    img.height = msg.height
    var code = document.getElementById(id)
    code.parentElement.insertBefore(img, code)
    code.parentElement.removeChild(code)
    */
    console.log(msg)
    if (sent.includes(msg.id)) {
        var index = sent.indexOf(msg.id)
        sent.splice(index, 1)
    }
}

function renderCode(code, isSnippet) {
    var f = document.getElementById("makecoderenderer")
    var msg = {
        type: "renderblocks",
        id: Math.random(),
        code: code,
        options: {
            snippetMode: isSnippet,
        }
    }
    if (!f || !!queue) {
        // Add to queue.
        queue.push(msg)
        injectRenderer()
    } else {
        f.contentWindow.postMessage(msg, targetUrl)
        sent.push(msg.id)
    }
}

function renderMsg(msg) {
    var f = document.getElementById("makecoderenderer")
    if (!f || !!queue) {
        // Add to queue.
        queue.push(msg)
        injectRenderer()
    } else {
        f.contentWindow.postMessage(msg, targetUrl)
    }
}

// listen for messages
window.addEventListener('message', function (ev) {
    var msg = ev.data
    if (msg.source != 'makecode') return
    console.log(msg.type)
    switch (msg.type) {
        case 'renderready':
            // flush pending requests            				
            var msgs = queue
            // set as undefined to notify that iframe is ready
            queue = undefined
            msgs.forEach(function (msg) { renderMsg(msg) })
            break
        case 'renderblocks':
            outputMessage(msg)
            break
    }
}, false)

/**
 * MAIN
 */
console.log('This is a test.')
renderCode(`
let counter = 0
game.onUpdateInterval(5000, function () {
    console.log("Entering the on game update every 5000 ms block.")
    counter += 1
    console.logValue("Number of times run", counter)
})
`, false)

while((!!queue && queue.length > 0) || sent.length > 0) {
    /*
    if (!! queue) {
        console.log('queue length: ' + queue.length)
    }
    console.log('sent length: ' + sent.length)
    */
}

console.log('Done!')