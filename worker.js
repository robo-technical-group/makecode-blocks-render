const { parentPort } = require('worker_threads')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function performTask(task) {
    await sleep(Math.random() * 10000)
}

parentPort.on('message', async message => {
    console.log(`Worker ${process.pid}: Received task ${message.task}`)
    await sleep(Math.random() * 10000)
    parentPort.emit('online')
    await performTask(message.task)
    parentPort.postMessage('Done!')
})
