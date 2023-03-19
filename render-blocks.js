const { Worker } = require('worker_threads')
const workerThreads = []

function onClose() {
    console.log('Worker thread closed.')
}

function onError(err) {
    console.log(`Worker thread returned an error: ${err}`)
}

function onExit(code) {
    if (code !== 0) {
        console.log(`Worker exited with error code ${code}.`)
    } else {
        console.log('Worker exited.')
    }
}

function onMessage(msg) {
    console.log(`Worker responded with message: ${msg}`)
    done++
    if (done >= workerThreads.length) {
        console.log('All done!')
        process.exit()
    } else {
        console.log(`Threads completed: ${done}.`)
    }
}

function onOnline(msg) {
    if (msg) {
        console.log(`Worker online with message: ${msg}`)
    } else {
        console.log(`Worker online.`)
    }
}

for (let i = 0; i < 4; i++) {
    workerThreads.push(new Worker('./worker.js'))
}
var done = 0
workerThreads.forEach((worker, index) => {
    worker.on('message', (msg) => onMessage(msg))
    worker.on('error', (err) => onError(err))
    worker.on('exit', (exitCode) => onExit(exitCode))
    worker.on('close', onClose)
    worker.on('online', (msg) => onOnline(msg))
    worker.postMessage({ task: index, })
})
