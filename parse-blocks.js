/**
 * Taken from https://pxt.azureedge.net/blob/192ce73678d26c889a124ca45cb225998d50338b//gh-pages-embed.js
 * Renders the blocks snippet in an HTML page
 * @param targetUrl  full editor URL
 */
function parseBlocks(targetUrl) {
    if (targetUrl[targetUrl.length - 1] != '/') {
        targetUrl += '/'
    }
    // pre waiting to be rendered
    // when undefined, iframe is loaded and ready
    var pendingPres = []
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

    function renderPre(pre) {
        if(!pre.id) pre.id = Math.random()
        var f = document.getElementById("makecoderenderer")
        // check if iframe is added and ready (pendingPres is undefined)
        if (!f || !!pendingPres) {
            // queue up
            pendingPres.push(pre)
            injectRenderer()
        } else {
            f.contentWindow.postMessage({
                type: "renderblocks",
                id: pre.id,
                code: pre.innerText,
                options: {
                    snippetMode: pre.classList.contains('snippet'),
                }
            }, targetUrl)
        }
    }

    // listen for messages
    window.addEventListener("message", function (ev) {
        var msg = ev.data
        if (msg.source != "makecode") return
        console.log(msg.type)
        switch (msg.type) {
            case "renderready":
                // flush pending requests            				
                var pres = pendingPres
                // set as undefined to notify that iframe is ready
                pendingPres = undefined
                pres.forEach(function (pre) { renderPre(pre) })
                break
            case "renderblocks":
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
                break
        }
    }, false)

    var pres = document.querySelectorAll("pre>code.blocks")
    Array.prototype.forEach.call(pres, function (pre) {
        renderPre(pre)
    })
}
