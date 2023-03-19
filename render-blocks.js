const NUM_THREADS = 4
const SCRIPT_NAME = 'worker-test.js'

const { send } = require('process')
const { Worker } = require('worker_threads')
const workerThreads = []
var args = process.argv
const nodeExe = args[0]
const scriptFile = args[1]
args.splice(0, 2)
console.log(`Received ${args.length} command-line arguments:`)
console.log(args)

function onClose() {
    console.log('Worker thread closed.')
}

function onError(err) {
    var thread = '[unknown]'
    var msg = err.message
    var semicolon = msg.indexOf(':')
    if (semicolon >= 0) {
        thread = msg.substring(0, semicolon)
        msg = msg.substring(semicolon + 2)
    }
    console.error(`Worker thread ${thread} returned an error: ${msg}`)
}

function onExit(code) {
    if (code !== 0) {
        console.error(`Worker exited with error code ${code}.`)
    } else {
        console.log('Worker exited.')
    }
    threadFinished()
}

function onMessage(msg) {
    console.log(`Worker ${msg.id} responded with message: ${msg.msg}`)
    if (queue.length > 0) {
        sendNextQueueItem(workerThreads[msg.id], msg.id)
    } else {
        threadFinished()
    }
}

function onOnline() {
    console.log('Worker online.')
}

function sendNextQueueItem(worker, index) {
    var item = queue[0]
    queue.splice(0, 1)
    worker.postMessage({ id: index, task: item, })
}

function threadFinished(index) {
    done++
    if (done >= workerThreads.length) {
        console.log('All done!')
        process.exit()
    } else {
        console.log(`Threads completed: ${done}.`)
    }
}

var done = 0
for (let i = 0; i < NUM_THREADS; i++) {
    workerThreads.push(new Worker('./' + SCRIPT_NAME))
}
workerThreads.forEach((worker, index) => {
    worker.on('message', (msg) => onMessage(msg))
    worker.on('messageerror', (err) => onError(err))
    worker.on('error', (err) => onError(err))
    worker.on('exit', (exitCode) => onExit(exitCode))
    worker.on('close', onClose)
    worker.on('online', () => onOnline())
})

const queue = []
args.forEach((arg) => {
    for (let i = 0; i < 10; i++) {
        queue.push(arg + '/item' + i)
    }
})

// Send items to workers.
workerThreads.forEach(sendNextQueueItem)
