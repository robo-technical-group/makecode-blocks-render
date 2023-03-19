const EXCEPTION_THRESHOLD = 0.05
const { parentPort } = require('worker_threads')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
var assignedId = -1

async function performTask(task) {
    await sleep(Math.random() * 10000)
    if (Math.random() > EXCEPTION_THRESHOLD) {
        parentPort.emit('online') // 'online' event cannot pass any values to parent.
    } else {
        console.log(`Worker ${assignedId} throwing an error during setup.`)
        throw new Error(`${assignedId}: Sample exception in setup.`)
    }
    await sleep(Math.random() * 10000)
    if (Math.random() <= EXCEPTION_THRESHOLD) {
        console.log(`Worker ${assignedId} throwing an error during processing.`)
        throw new Error(`${assignedId}: Sample execution during processing.`)
    }
}

parentPort.on('message', async message => {
    assignedId = message.id
    console.log(`Worker ${assignedId}: Received task ${message.task}`)
    await performTask(message.task)
    if (Math.random() <= EXCEPTION_THRESHOLD) {
        console.log(`Worker ${assignedId} throwing an error during validation.`)
        throw new Error(`${assignedId}: Sample exception during validation.`)
    }
    parentPort.postMessage({
        id: assignedId,
        msg: 'Done!',
    })
})
