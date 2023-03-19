const EXCEPTION_THRESHOLD = 0.1
const { parentPort } = require('node:worker_threads')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
var __assignedId = -1

async function performTask(task) {
    await sleep(Math.random() * 10000)
    if (Math.random() > EXCEPTION_THRESHOLD) {
        parentPort.emit('online') // 'online' event cannot pass any values to parent.
    } else {
        console.log(`Worker ${__assignedId} throwing an error during setup.`)
        throw new Error(`${__assignedId}: Sample exception in setup.`)
    }
    await sleep(Math.random() * 10000)
    if (Math.random() <= EXCEPTION_THRESHOLD) {
        console.log(`Worker ${__assignedId} throwing an error during processing.`)
        throw new Error(`${__assignedId}: Sample execution during processing.`)
    }
}

parentPort.on('message', async message => {
    __assignedId = message.id
    console.log(`Worker ${__assignedId}: Received task ${message.task}`)
    await performTask(message.task)
    if (Math.random() <= EXCEPTION_THRESHOLD) {
        console.log(`Worker ${__assignedId} throwing an error during validation.`)
        throw new Error(`${__assignedId}: Sample exception during validation.`)
    }
    parentPort.postMessage({
        id: __assignedId,
        msg: 'Done!',
    })
})
