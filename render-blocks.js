const NUM_THREADS = 4
const SCRIPT_NAME = 'worker-test.js'
const PROGRAM_NAME = 'Node.js Multithreading Test'
/*
const SCRIPT_NAME = 'worker-makecode.js'
const PROGRAM_NAME = 'MakeCode Blocks renderer'
*/

const { Worker } = require('node:worker_threads')
const __workerThreads = []
const __queue = []
var __args = process.argv
const __nodeExe = __args[0]
const __scriptFile = __args[1]
__args.splice(0, 2)
console.log(`Received ${__args.length} command-line arguments:`)
console.log(__args)

function createNewWorker(index) {
    const worker = new Worker('./' + SCRIPT_NAME)
    worker.on('message', (msg) => onMessage(msg))
    worker.on('messageerror', (err) => onError(err))
    worker.on('error', (err) => onError(err))
    worker.on('exit', (exitCode) => onExit(exitCode))
    worker.on('close', onClose)
    worker.on('online', () => onOnline())
    __workerThreads[index] = worker
    if (__queue.length > 0) {
        sendNextQueueItem(worker, index)
    }
}

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
    console.error(`Worker thread ${thread} returned an exception: ${msg}`)
    if (semicolon >= 0 && __queue.length > 0) {
        // Create a new worker thread
        // + to replace the one that just threw an unhandled exception.
        createNewWorker(thread)
    } else {
        threadFinished()
    }
}

function onExit(code) {
    if (code !== 0) {
        console.error(`Worker exited with error code ${code}.`)
    } else {
        console.log('Worker exited.')
    }
}

function onMessage(msg) {
    console.log(`Worker ${msg.id} responded with message: ${msg.msg}`)
    if (__queue.length > 0) {
        sendNextQueueItem(__workerThreads[msg.id], msg.id)
    } else {
        threadFinished()
    }
}

function onOnline() {
    console.log('Worker online.')
}

function sendNextQueueItem(worker, index) {
    var item = __queue[0]
    __queue.splice(0, 1)
    worker.postMessage({ id: index, task: item, })
}

function startup() {
    console.log('='.repeat(65))
    console.log(PROGRAM_NAME)
    console.log(`Node.js started at ${__nodeExe}`)
    console.log(`Running Node.js version ${process.versions.node}`)
    console.log(`Script file loaded from ${__scriptFile}`)
    console.log('='.repeat(65))
}

function threadFinished(index) {
    __threadsDone++
    if (__threadsDone >= __workerThreads.length) {
        console.log('All done!')
        process.exit()
    } else {
        console.log(`Threads completed: ${__threadsDone}.`)
    }
}

/**
 * MAIN
 */

startup()
var __threadsDone = 0
for (let i = 0; i < NUM_THREADS; i++) {
    createNewWorker(i)
}

__args.forEach((arg) => {
    for (let i = 0; i < 2; i++) {
        __queue.push(arg + '/item' + i)
    }
})

// Send items to workers.
__workerThreads.forEach(sendNextQueueItem)
