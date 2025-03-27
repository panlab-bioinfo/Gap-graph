const { app, BrowserWindow,ipcMain,dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const readline = require('readline')
const { Worker, isMainThread, parentPort,workerData } = require('worker_threads');
const workerpool = require('workerpool');
const { performance } = require('perf_hooks')
const zlib = require('zlib')
const pako = require('pako')
const log = require('electron-log');

const createWindow = () => {
    const win = new BrowserWindow({
        x: 200,
        y: 70,
        show: false,
        width: 1600,
        height: 1000,
        minWidth: 700,
        minHeight: 500,
        title: 'Gap-Graph',
        // icon: '1.ico'
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.resolve(__dirname,'./preload/preload.js'),
            webSecurity: true
        }
    })

    win.loadFile(path.join(__dirname,"dist/index.html"))
    // win.loadURL('http://127.0.0.1:5173/')
    win.on('ready-to-show',()=>{
        win.show()
    })
}

//每秒打印一次内存使用情况
// setInterval(() => {
//     const memoryUsage = process.memoryUsage();
//     console.log('Heap Used:', memoryUsage.heapUsed / 1024 / 1024, 'MB');
//     console.log('Heap Total:', memoryUsage.heapTotal / 1024 / 1024, 'MB');
// }, 1000);

ipcMain.handle('generateGFAFile',async (event, args) =>{
    console.log(args['nodeIdList'])
    for (let id of args['nodeIdList']) {
        console.log(id)
    }
    console.log(gfaPath)
    console.log(gfaPath.substring(0,gfaPath.lastIndexOf('\\')))
    console.log(gfaPath.substring(0,gfaPath.lastIndexOf('\\')) + '\\' + args['className'])
    return await generateGFAFile(args)
})

/**
 * 生成GFA文件
 * @param args
 * @returns {Promise<unknown>}
 */
function generateGFAFile(args){
    return new Promise((resolve,reject) => {
        let className = args['className']
        let nodeIdList = args['nodeIdList']
        let readStream = fs.createReadStream(gfaPath);
        let rl = readline.createInterface({
            input: readStream,
            output: process.stdout,
            terminal: false
        });
        let newGFAPath = gfaPath.substring(0,gfaPath.lastIndexOf('\\')) + '\\' + className + '.gfa'
        rl.on('line',(line) => {
            let arr = line.split('\t')
            if (nodeIdList.includes(arr[1]) && (arr[0] === 'S' || arr[0] === 'A' || arr[0] === 'L')){
                try {
                    fs.writeFileSync(newGFAPath, line + '\n',{flag:'a'})
                } catch (e) {
                    rl.on('close',() => {
                        readStream.close()
                        resolve(false)
                    })
                }
            }
            if (arr[0] === 'L' && nodeIdList.includes(arr[3])){
                try {
                    fs.writeFileSync(newGFAPath, line + '\n',{flag:'a'})
                } catch (e) {
                    rl.on('close',() => {
                        readStream.close()
                        resolve(false)
                    })
                }
            }
        })

        rl.on('close',() => {
            readStream.close()
            resolve(true)
        })
    })
}

/**
 * 处理paf文件，获取想要的数据
 */
let pafInfoMap //存储每条染色体的比对信息，key是染色体id，值为列表，列表中的一个元素是一行信息（映射质量要求大于60）
ipcMain.handle('dealPaf',async (event, args) =>{
    pafInfoMap = new Map()//存储每条染色体的比对信息，key是染色体id，值为列表，列表中的一个元素是一行信息（映射质量要求大于等于60）
    //获取到每条染色的比对信息
    await getScaffoldPafInfo()
    //挂载
    let result = await scaffoldingPipeline(args['needOptimizeChrIdList'])
    return result
    console.log('finish')
})

/**
 * 获取每条染色体的比对信息(映射质量大于等于30，分数大于等于0.6)，并存储到pafInfoMap中
 * @returns {Promise<unknown>}
 */
function getScaffoldPafInfo(){
    return new Promise((resolve, reject) => {
        let mapStream = fs.createReadStream(pafPath);
        let rlMap = readline.createInterface({
            input: mapStream,
            output: process.stdout,
            terminal: false
        });
        rlMap.on('line',(line) => {
            let arr = line.split('\t')
            let utgLength = parseInt(arr[1])
            let chrId = arr[5]
            let bpMatchNumber = parseInt(arr[9])
            let matchBlockLength = parseInt(arr[10])
            let mapQ = parseInt(arr[11])
            let score = Math.min(matchBlockLength / utgLength,1) * 0.5 + (bpMatchNumber / matchBlockLength) * 0.5
            if( mapQ >= 30 && score >= 0.6){
                if(pafInfoMap.has(chrId)){
                    let temp = pafInfoMap.get(chrId)
                    let flag = true
                    for (let tempElement of temp) {
                        if(arr[0] + arr[4] === tempElement[0] + tempElement[4]){
                            flag = false
                        }
                    }
                    if(flag){
                        temp.push(arr.slice(0,12))
                        pafInfoMap.set(chrId,temp)
                    }
                }else{
                    pafInfoMap.set(chrId,[arr.slice(0,12)])
                }
            }
        })
        rlMap.on('close',()=>{
            mapStream.close()
            resolve()
        })
    })
}

/**
 * 获取染色体Id列表
 * @returns {Promise<unknown>}
 */

function getChrIdList(){
    return new Promise((resolve, reject)=>{
        let faStream = fs.createReadStream(scaffoldPath);
        let rlFa = readline.createInterface({
            input: faStream,
            output: process.stdout,
            terminal: false
        });
        let chrIdList = []
        rlFa.on('line', (line) => {
            if(line.startsWith('>')){
                chrIdList.push(line.split("\t")[0].substring(1))
            }
        })
        rlFa.on('close',() => {
            faStream.close()
            resolve(chrIdList)
        })
    })
}

/**
 * 先获取每条染色体的开始节点及其方向
 * @param chrId
 * @returns {Promise<unknown>}
 */
function getChrStartNodeAndDirectionByChrId(chrId,startIndex){
    return new Promise((resolve,reject) =>{
        let mapStream = fs.createReadStream(pafPath);
        let rlMap = readline.createInterface({
            input: mapStream,
            output: process.stdout,
            terminal: false
        });
        let distance = Number.MAX_SAFE_INTEGER
        let result = []
        rlMap.on('line', (line) => {
            let arr = line.split('\t')
            let queryChrId = arr[5]
            let queryUtgStartIndex = parseInt(arr[7])
            let mapQuality = parseInt(arr[11])
            if (chrId === queryChrId && mapQuality >= 30 && queryUtgStartIndex-startIndex > 0 && queryUtgStartIndex-startIndex < distance){
                let utgId = arr[0]
                let utgLength = parseInt(arr[1])
                let direction = arr[4]
                let bpMatchNumber = parseInt(arr[9])
                let matchBlockLength = parseInt(arr[10])
                let score
                if (utgLength >= 100000){
                    score = Math.min(matchBlockLength / utgLength,1) * 0.5 + (bpMatchNumber / matchBlockLength) * 0.5
                }else{
                    score = Math.min(matchBlockLength / utgLength,1) * 0.47 + (bpMatchNumber / matchBlockLength) * 0.47 + 0.06 * (utgLength/100000)
                }
                if (utgLength < 50000){
                    if (score >= 0.98){
                        distance = queryUtgStartIndex - startIndex
                        result = arr.slice(0,12)
                    }
                }else if (utgLength < 100000){
                    if (score >= 0.95){
                        distance = queryUtgStartIndex - startIndex
                        result = arr.slice(0,12)
                    }
                }else if (utgLength < 500000){
                    if (score >= 0.93){
                        distance = queryUtgStartIndex - startIndex
                        result = arr.slice(0,12)
                    }
                }else {
                    if (score >= 0.85){
                        distance = queryUtgStartIndex - startIndex
                        result = arr.slice(0,12)
                    }
                }
            }
        })
        rlMap.on('close',() => {
            console.log(chrId +' start node: ' + result)
            mapStream.close()
            resolve(result)
        })
    })
}


/**
 * 上传gfa文件时调用该函数，保存边的信息，供合并utg功能和挂载功能使用
 * @returns {Promise<unknown>}
 */
let linkInfoList = []//保存边的信息,格式:[[utg01,+,utg02,+,2045],[utg01,+,utg03,-,4453],[...],[...]]
function saveLinkInfo(){
    return new Promise((resolve, reject) =>{
        let gfaStream = fs.createReadStream(gfaPath);
        let rlGfa = readline.createInterface({
            input: gfaStream,
            output: process.stdout,
            terminal: false
        });
        linkInfoList = []
        rlGfa.on('line', (line) => {
            if (line.startsWith('L')){
                let arr = line.split('\t')
                let tempList = []
                tempList.push(arr[1])//source节点Id
                tempList.push(arr[2])//source的方向
                tempList.push(arr[3])//target节点Id
                tempList.push(arr[4])//target的方向
                tempList.push(arr[5].substring(0,arr[5].length-1))//匹配的碱基数
                linkInfoList.push(tempList)
            }
        })
        rlGfa.on('close',()=>{
            gfaStream.close()
            resolve()
        })
    })
}

/**
 * 根据可达节点id，正负性，所属scaffold的id在paf中查找相关信息
 * @param targetNodeId
 * @param flag
 * @param chrId
 * @returns {Promise<unknown>}
 */
function getTargetNodePafInfo(targetNodeId,flag,chrId){
    return new Promise((resolve, reject)=>{
        let mapStream = fs.createReadStream(pafPath);
        let rlMap = readline.createInterface({
            input: mapStream,
            output: process.stdout,
            terminal: false
        });
        let targetNodePafInfo = []
        rlMap.on('line',(line)=>{
            let arr = line.split('\t')
            if(arr[0] === targetNodeId && arr[4] === flag && arr[5] === chrId && parseInt(arr[11]) >= 0){
                targetNodePafInfo = arr.slice(0,12)
                rlMap.close()
            }

        })
        rlMap.on('close',() => {
            mapStream.close()
            resolve(targetNodePafInfo)
        })
    })
}

/**
 * 获取scaffold的gap信息
 * @returns {Promise<unknown>}
 */
function getScaffoldGapStartAndEndIndex(){
    return new Promise(async (resolve, reject)=>{
        let faStream = fs.createReadStream(scaffoldPath);
        let rlFa = readline.createInterface({
            input: faStream,
            output: process.stdout,
            terminal: false
        });
        let startTime = new Date()
        let chrId = ''
        let gapMap = new Map()
        console.log('getting gap info....')
        rlFa.on('line',(line)=>{
            let start = -1
            let end = -1
            if (line.startsWith('>')){
                chrId = line.split('\t')[0].substring(1)
            }else{
                for (let i = 0; i < line.length; i++) {
                    if (line[i] === 'N' || line[i] === 'n'){
                        if (start < 0){
                            start = i-1
                        }
                    }else {
                        if (start > 0){
                            end = i
                            if (gapMap.has(chrId)){
                                let temp = gapMap.get(chrId)
                                temp.push([start,end])
                                gapMap.set(chrId,temp)
                            }else{
                                gapMap.set(chrId,[[start,end]])
                            }
                            start = -1
                        }
                    }
                }
            }
        })
        rlFa.on('close',()=>{
            let endTime = new Date()
            console.log('get gap info consume:'+(endTime-startTime)/1000+'s')
            faStream.close()
            resolve(gapMap)
        })
    })
}

/**
 * 根据gap结束位置去paf中找以该位置为始的utg，这个utg就是gap终点
 * 为了尽量保证准确性，还需传入scaffold的Id
 * @param gapEndIndex
 * @returns {Promise<unknown>}
 */
function getNodeByGapEndIndex(chrId,gapEndIndex){
    return new Promise((resolve, reject) =>{
        let mapStream = fs.createReadStream(pafPath);
        let rlMap = readline.createInterface({
            input: mapStream,
            output: process.stdout,
            terminal: false
        });
        let gapEndNodePafInfo = []
        rlMap.on('line',(line)=>{
            let arr = line.split('\t')
            if (arr[5] === chrId && parseInt(arr[11]) >= 0){
                if (Math.abs(parseInt(arr[7]) - gapEndIndex) <= 200){
                    gapEndNodePafInfo = arr.slice(0,12)
                    rlMap.close()
                }

            }
        })
        rlMap.on('close',()=>{
            mapStream.close()
            resolve(gapEndNodePafInfo)
        })
    })
}



/**
 * 1、先获取染色体列表和gap信息
 * 2、根据染色体Id从paf文件中获取该染色体的开始(当前节点)节点及其方向；
 * 3、根据当前节点及其方向去gfa文件中找可达的节点集合；
 * 4-1、如果能在gfa中找到可达的节点：
 *     4-1-1、如果能在paf文件中找到这些节点的比对信息：
 *         4-1-1-1、筛选出分数最高的节点，即完成一个节点的挂载，将刚挂载上的节点作为开始节点，回到步骤 3；
 *     4-1-2、如果不能在paf文件中找到任何一个可达节点的比对信息：
 *         4-1-2-1、如果当前节点在scaffold中的结束位置与scaffold中gap开始的位置相近，则将当前节点设置为gap起始节点，
 *                  再根据gap结束位置去paf中找以该位置为始的utg，这个utg就是gap终点，将这个utg继续作为开始节点，回到步骤 3；
 *         4-1-2-2、如果当前节点在scaffold中的结束位置与scaffold中gap开始的位置的位置不相近：
 *                4-1-2-2-1、如果当前节点在scaffold中的结束位置与scaffold的终点位置相近，则表示当前节点为scaffold的最后一个utg，即当前染色体挂载完毕；
 *                4-1-2-2-2、如果不相近，则表示当前节点不可靠，回溯到上一节点挂载其他节点
 * 4-2、如果不能在gfa中找到可达的节点：
 *    4-2-1、如果当前节点在scaffold中的结束位置与scaffold中gap开始的位置相近，则将当前节点设置为gap起始节点，
 *          再根据gap结束位置去paf中找以该位置为始的utg，这个utg就是gap终点，将这个utg继续作为开始节点，回到步骤 3；
 *    4-2-2、如果当前节点在scaffold中的结束位置与scaffold中gap开始的位置的位置不相近：
 *          4-2-2-1、去paf中根据比对位置判断当前节点是否是scaffold的最后一个utg，如果是，当前染色体挂载完毕
 *          4-2-2-2、如果不是，就表示当前节点不可靠，需要回溯上一节点挂载其他节点
 *
 */
let gapStartAndEndNodeInfoMap = new Map()//记录gap的开始节点和结束节点，key是chrId，值为[[startNodePafInfo,endNodePafInfo],[startNodePafInfo,endNodePafInfo],...]
let oneScaffoldedNodeInfoList = []//记录已经挂载的节点的信息，其中每个元素表示一个挂载节点信息；挂载节点信息用列表存储，列表的最后一列是挂载顺序，最后一列之前的paf信息
let allScaffoldedNodeInfoListMap = new Map()
async function scaffoldingPipeline(needOptimizeChrIdList){
    let startTime = new Date()
    gapStartAndEndNodeInfoMap = new Map()
    allScaffoldedNodeInfoListMap = new Map()
    //1、获取染色体列表
    let chrIdList = await getChrIdList()
    chrIdList.sort((a,b)=>{
        let numA = parseInt(a.substring(3))
        let numB = parseInt(b.substring(3))
        return numA-numB
    })
    //1、获取gap信息
    let gapIndexMap = await getScaffoldGapStartAndEndIndex()
    console.log('===========gapIndexMap=============')
    console.log(gapIndexMap)

    for (let chrId of chrIdList) {
        // if(chrId != "group2"){
        //     continue
        // }
        console.log('start scaffold '+ chrId+'+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
        let visitedNode = []//记录被访问过的节点
        oneScaffoldedNodeInfoList = []//没遍历一条scaffold，需要把oneScaffoldedNodeInfoList清空一次

        //2、根据染色体Id从paf文件中获取该染色体的开始节点及其方向
        let currentNodePafInfo = await getChrStartNodeAndDirectionByChrId(chrId,0)
        currentNodePafInfo.push(oneScaffoldedNodeInfoList.length+1)
        oneScaffoldedNodeInfoList.push(currentNodePafInfo)//记录挂载节点的信息
        await scaffolding(chrId,currentNodePafInfo,gapIndexMap,visitedNode)
        if(needOptimizeChrIdList.includes(chrId)){//如果当前的这条染色体需要优化，则进行优化
            await optimizeScaffoldingResult(chrId)
        }
        allScaffoldedNodeInfoListMap.set(chrId,oneScaffoldedNodeInfoList)
    }
    let endTime = new Date()
    console.log('scaffolding pipeline consume:'+(endTime-startTime)/1000+'s')
    for (let e of allScaffoldedNodeInfoListMap.keys()) {
        if(allScaffoldedNodeInfoListMap.get(e).length == 0){
            gapStartAndEndNodeInfoMap.delete(e)
        }
    }
    let result = new Map()
    result.set('allScaffoldedNodeInfoListMap',allScaffoldedNodeInfoListMap)
    result.set('gapStartAndEndNodeInfoMap',gapStartAndEndNodeInfoMap)
    result.set('scaffoldsAllGaps',gapIndexMap)
    return result
}

/**
 * 挂载功能
 * @param chrId
 * @param currentNodePafInfo
 * @param gapIndexMap
 * @returns {Promise<unknown>}
 */
async function scaffolding(chrId,currentNodePafInfo,gapIndexMap,visitedNode){
    return new Promise(async (resolve, reject) =>{
        while (currentNodePafInfo) {
            let currentNode = currentNodePafInfo[0]
            let currentNodeFlag = currentNodePafInfo[4]
            if (!visitedNode.includes(currentNodePafInfo[0]+currentNodePafInfo[4])){
                visitedNode.push(currentNodePafInfo[0]+currentNodePafInfo[4])//记录被访问的节点
            }
            //3、根据当前节点及其方向去gfa文件中找可达的节点集合
            let targetNodeMap = await getTargetNodeMap(currentNode, currentNodeFlag)
            for (let [targetNodeId, value] of targetNodeMap) {
                //如果targetNodeMap中的元素在visitedNode中，说明该元素已经被访问过了，需要把他从targetNodeMap中删除
                if (visitedNode.includes(targetNodeId+value[0])){
                    targetNodeMap.delete(targetNodeId)
                }
            }
            // console.log("targetNodeMap.size = " + targetNodeMap.size)
            if (targetNodeMap.size > 0) {
                //4-1、走到这里说明能在gfa中找到可达的节点
                let targetNodePafInfoList = []
                for (let [targetNodeId, value] of targetNodeMap) {
                    let targetNodePafInfo = await getTargetNodePafInfo(targetNodeId, value[0], chrId)
                    if (targetNodePafInfo.length > 0) {//targetNodePafInfo中有信息再往targetNodePafInfoList列表中添加
                        targetNodePafInfoList.push(targetNodePafInfo)
                    }
                }
                if (targetNodePafInfoList.length > 0) {
                    //4-1-1、走到这里说明能在paf文件中找到这些节点的比对信息
                    //那么筛选出分数最高的节点，即完成一个节点的挂载，将刚挂载上的节点作为当前节点，并判断当前节点是否是gap的起始节点，然后回到步骤 3；
                    let score = 0
                    for (let targetNodePafInfo of targetNodePafInfoList) {
                        let utgLength = parseInt(targetNodePafInfo[1])
                        let bpMatchNumber = parseInt(targetNodePafInfo[9])
                        let matchBlockLength = parseInt(targetNodePafInfo[10])
                        let tempScore = 0
                        if(utgLength >= 100000){
                            tempScore = Math.min(matchBlockLength / utgLength, 1) * 0.5 + (bpMatchNumber / matchBlockLength) * 0.5
                        }else{
                            tempScore = Math.min(matchBlockLength / utgLength, 1) * 0.47 + (bpMatchNumber / matchBlockLength) * 0.47 + 0.06 * (utgLength/100000)
                        }
                        if (tempScore > score) {
                            currentNodePafInfo = targetNodePafInfo//将刚挂载上的节点作为当前节点,这里不是单单赋值节点，而是赋值节点的paf信息
                            score = tempScore
                        }
                    }
                    currentNodePafInfo.push(oneScaffoldedNodeInfoList.length+1)
                    oneScaffoldedNodeInfoList.push(currentNodePafInfo)//记录挂载节点的信息

                    //每次都要判断当前节点是否是gap的起始节点，避免因gap起点和终点之间没有节点而找不全gap的情况
                    let gapIndexInfoList = gapIndexMap.get(chrId)
                    if (gapIndexInfoList){
                        let gapStartNodePafInfo
                        let gapEndNodePafInfo
                        let gapEndIndex = -1
                        for (let gapIndexInfo of gapIndexInfoList) {
                            if (Math.abs(parseInt(currentNodePafInfo[8]) - gapIndexInfo[0]) <= 200){
                                gapStartNodePafInfo = currentNodePafInfo
                                console.log('gap start node: ' + gapStartNodePafInfo)
                                gapEndIndex = gapIndexInfo[1]
                            }
                        }
                        if (gapStartNodePafInfo){
                            if (gapEndIndex !== -1){
                                let gapEndNodePafInfoResult = await getNodeByGapEndIndex(chrId,gapEndIndex)
                                console.log('gap end node: ' + gapEndNodePafInfoResult)
                                if (gapEndNodePafInfoResult.length != 0){
                                    visitedNode.push(gapStartNodePafInfo[0]+gapStartNodePafInfo[4])
                                    gapEndNodePafInfo = gapEndNodePafInfoResult
                                    if(!visitedNode.includes(gapEndNodePafInfo[0]+gapEndNodePafInfo[4])){
                                        currentNodePafInfo = gapEndNodePafInfoResult
                                        currentNodePafInfo.push(oneScaffoldedNodeInfoList.length+1)
                                        oneScaffoldedNodeInfoList.push(currentNodePafInfo)//记录挂载节点的信息
                                    }else{
                                        //如果gap的终止节点被访问过，说明回溯的时候回溯到了gap的起始节点，这里就需要将当前节点设置为前一个节点，即gap起始节点的前一个节点
                                        oneScaffoldedNodeInfoList.pop()
                                        if(oneScaffoldedNodeInfoList.length > 0){
                                            currentNodePafInfo = oneScaffoldedNodeInfoList[oneScaffoldedNodeInfoList.length-1]
                                            continue//回到步骤 3
                                        }else{
                                            resolve()
                                            return
                                        }
                                    }
                                    //记录gap开始和结束节点信息
                                    if (gapStartAndEndNodeInfoMap.has(chrId)){
                                        let temp = gapStartAndEndNodeInfoMap.get(chrId)
                                        temp.push([gapStartNodePafInfo,gapEndNodePafInfo])
                                        gapStartAndEndNodeInfoMap.set(chrId,temp)
                                    }else{
                                        gapStartAndEndNodeInfoMap.set(chrId,[[gapStartNodePafInfo,gapEndNodePafInfo]])
                                    }
                                }else{
                                    //如果没有找到gap的结束节点，那么就去找个gap起始节点之后的开始节点，接着去挂载
                                    currentNodePafInfo = await getChrStartNodeAndDirectionByChrId(chrId,gapEndIndex)
                                    if(!visitedNode.includes(currentNodePafInfo[0]+currentNodePafInfo[4])){
                                        currentNodePafInfo.push(oneScaffoldedNodeInfoList.length+1)
                                        oneScaffoldedNodeInfoList.push(currentNodePafInfo)//记录挂载节点的信息
                                    }else{
                                        //如果gap起始节点之后的开始节点被访问过，那就回溯
                                        oneScaffoldedNodeInfoList.pop()
                                        if(oneScaffoldedNodeInfoList.length > 0){
                                            currentNodePafInfo = oneScaffoldedNodeInfoList[oneScaffoldedNodeInfoList.length-1]
                                            continue//回到步骤 3
                                        }else{
                                            resolve()
                                            return
                                        }
                                    }
                                    console.log('not find gap end node111')
                                }
                            }
                        }
                    }
                    continue//回到步骤 3
                } else {
                    //4-1-2、走到这里说明不能在paf文件中找到任何一个可达节点的比对信息
                    let gapIndexInfoList = gapIndexMap.get(chrId)
                    let gapStartNodePafInfo
                    let gapEndNodePafInfo
                    let gapEndIndex = -1
                    if (gapIndexInfoList){
                        for (let gapIndexInfo of gapIndexInfoList) {
                            if (Math.abs(parseInt(currentNodePafInfo[8]) - gapIndexInfo[0]) <= 200){
                                gapStartNodePafInfo = currentNodePafInfo
                                gapEndIndex = gapIndexInfo[1]
                            }
                        }
                    }
                    if (gapStartNodePafInfo){
                        //4-1-2-1、走到这里说明当前节点就是gap的起始节点，接下来需要根据gap结束位置去paf中找以该位置为始的utg，这个utg就是gap终点，然后再
                        // 将这个utg继续作为当前节点，回到步骤 3；
                        if (gapEndIndex !== -1){
                            let gapEndNodePafInfoResult = await getNodeByGapEndIndex(chrId,gapEndIndex)
                            if (gapEndNodePafInfoResult.length != 0){
                                visitedNode.push(gapStartNodePafInfo[0]+gapStartNodePafInfo[4])
                                gapEndNodePafInfo = gapEndNodePafInfoResult
                                if(!visitedNode.includes(gapEndNodePafInfo[0]+gapEndNodePafInfo[4])){
                                    currentNodePafInfo = gapEndNodePafInfoResult
                                    currentNodePafInfo.push(oneScaffoldedNodeInfoList.length+1)
                                    oneScaffoldedNodeInfoList.push(currentNodePafInfo)//记录挂载节点的信息

                                }else{
                                    //如果gap的终止节点被访问过，说明回溯的时候回溯到了gap的起始节点，这里就需要将当前节点设置为前一个节点，即gap起始节点的前一个节点
                                    oneScaffoldedNodeInfoList.pop()
                                    if(oneScaffoldedNodeInfoList.length > 0){
                                        currentNodePafInfo = oneScaffoldedNodeInfoList[oneScaffoldedNodeInfoList.length-1]
                                        continue//回到步骤 3
                                    }else{
                                        resolve()
                                        return
                                    }


                                }
                                //记录gap开始和结束节点信息
                                if (gapStartAndEndNodeInfoMap.has(chrId)){
                                    let temp = gapStartAndEndNodeInfoMap.get(chrId)
                                    temp.push([gapStartNodePafInfo,gapEndNodePafInfo])
                                    gapStartAndEndNodeInfoMap.set(chrId,temp)
                                }else{
                                    gapStartAndEndNodeInfoMap.set(chrId,[[gapStartNodePafInfo,gapEndNodePafInfo]])
                                }
                                continue //回到步骤 3
                            }else{
                                //如果没有找到gap的结束节点，那么就去找个gap起始节点之后的开始节点，接着去挂载
                                currentNodePafInfo = await getChrStartNodeAndDirectionByChrId(chrId,gapEndIndex)
                                if(!visitedNode.includes(currentNodePafInfo[0]+currentNodePafInfo[4])){
                                    currentNodePafInfo.push(oneScaffoldedNodeInfoList.length+1)
                                    oneScaffoldedNodeInfoList.push(currentNodePafInfo)//记录挂载节点的信息
                                }else{
                                    //如果gap起始节点之后的开始节点被访问过，那就回溯
                                    oneScaffoldedNodeInfoList.pop()
                                    if(oneScaffoldedNodeInfoList.length > 0){
                                        currentNodePafInfo = oneScaffoldedNodeInfoList[oneScaffoldedNodeInfoList.length-1]
                                        continue//回到步骤 3
                                    }else{
                                        resolve()
                                        return
                                    }
                                }
                                console.log('not find gap end node222')
                            }
                        }else{
                            console.log('not find gap end index222')
                        }
                    }else{
                        //4-1-2-2、走到这里说明当前节点在scaffold中的结束位置与scaffold中gap开始的位置的位置不相近
                        if (Math.abs(parseInt(currentNodePafInfo[6]) - parseInt(currentNodePafInfo[8])) <= 20000){
                            //4-1-2-2-1、走到这里说明当前节点在scaffold中的结束位置与scaffold的终点位置相近，那么就意味着当前节点为scaffold的最后一个utg，即当前染色体挂载完毕；
                            console.log(chrId+' finished scaffold!111111')
                            resolve()
                            break
                        }else{
                            //4-1-2-2-2、走到这里说明当前节点在scaffold中的结束位置与scaffold的终点位置不相近，则表示当前节点不可靠，回溯到上一节点挂载其他节点
                            oneScaffoldedNodeInfoList.pop()//由于当前节点不可靠，但当前节点已挂载，所以需要在挂载列表中先删除当前节点
                            console.log(chrId+' huisu33333333 '+currentNodePafInfo[0] +" "+ Math.abs(parseInt(currentNodePafInfo[6]) - parseInt(currentNodePafInfo[8])))
                            if (!oneScaffoldedNodeInfoList[oneScaffoldedNodeInfoList.length-1]){
                                console.log(chrId + '----------------------------------------------->'+oneScaffoldedNodeInfoList)
                                resolve()
                                return
                            }
                            // await scaffolding(chrId,oneScaffoldedNodeInfoList[oneScaffoldedNodeInfoList.length-1],gapIndexMap,visitedNode)
                            currentNodePafInfo = oneScaffoldedNodeInfoList[oneScaffoldedNodeInfoList.length-1]
                            continue
                        }

                    }
                }
            } else {
                //4-2、走到这里说明不能在gfa中找到当前节点的可达节点
                //先判断是不是gap起点
                let gapIndexInfoList = gapIndexMap.get(chrId)
                let gapStartNodePafInfo = undefined
                let gapEndNodePafInfo
                let gapEndIndex = -1
                if (gapIndexInfoList) {
                    for (let gapIndexInfo of gapIndexInfoList) {
                        if (Math.abs(parseInt(currentNodePafInfo[8]) - gapIndexInfo[0]) <= 200) {
                            gapStartNodePafInfo = currentNodePafInfo
                            gapEndIndex = gapIndexInfo[1]
                        }
                    }
                }
                if (gapStartNodePafInfo){
                    // console.log("2gapStartNodePafInfo : " + gapStartNodePafInfo)
                    //4-2-1、走到这里说明当前节点为一个gap的起始位置如果当前节点在scaffold中的结束位置与scaffold中gap开始的位置相近，则将当前节点设置为gap起始节点，
                    //      再根据gap结束位置去paf中找以该位置为始的utg，这个utg就是gap终点，将这个utg继续作为当前节点，回到步骤 3；
                    if (gapEndIndex !== -1){
                        let gapEndNodePafInfoResult = await getNodeByGapEndIndex(chrId,gapEndIndex)
                        // console.log("gapEndNodePafInfoResult : " + gapEndNodePafInfoResult)
                        if (gapEndNodePafInfoResult.length != 0){
                            visitedNode.push(gapStartNodePafInfo[0]+gapStartNodePafInfo[4])
                            gapEndNodePafInfo = gapEndNodePafInfoResult
                            if(!visitedNode.includes(gapEndNodePafInfo[0]+gapEndNodePafInfo[4])){
                                currentNodePafInfo = gapEndNodePafInfoResult
                                currentNodePafInfo.push(oneScaffoldedNodeInfoList.length+1)
                                oneScaffoldedNodeInfoList.push(currentNodePafInfo)//记录挂载节点的信息
                                // console.log("4CurrentNodePafInfo : " + currentNodePafInfo)
                            }else{
                                //如果gap的终止节点被访问过，说明回溯的时候回溯到了gap的起始节点，这里就需要将当前节点设置为前一个节点，即gap起始节点的前一个节点
                                oneScaffoldedNodeInfoList.pop()
                                if(oneScaffoldedNodeInfoList.length > 0){
                                    currentNodePafInfo = oneScaffoldedNodeInfoList[oneScaffoldedNodeInfoList.length-1]
                                    // console.log("5CurrentNodePafInfo : " + currentNodePafInfo)
                                    continue//回到步骤 3
                                }else{
                                    resolve()
                                    return
                                }
                            }
                            //记录gap开始和结束节点信息
                            if (gapStartAndEndNodeInfoMap.has(chrId)){
                                let temp = gapStartAndEndNodeInfoMap.get(chrId)
                                temp.push([gapStartNodePafInfo,gapEndNodePafInfo])
                                gapStartAndEndNodeInfoMap.set(chrId,temp)
                            }else{
                                gapStartAndEndNodeInfoMap.set(chrId,[[gapStartNodePafInfo,gapEndNodePafInfo]])
                            }
                            continue //回到步骤 3
                        }else{
                            //如果没有找到gap的结束节点，那么就去找个gap起始节点之后的开始节点，接着去挂载
                            currentNodePafInfo = await getChrStartNodeAndDirectionByChrId(chrId,gapEndIndex)
                            if(!visitedNode.includes(currentNodePafInfo[0]+currentNodePafInfo[4])){
                                currentNodePafInfo.push(oneScaffoldedNodeInfoList.length+1)
                                oneScaffoldedNodeInfoList.push(currentNodePafInfo)//记录挂载节点的信息
                            }else{
                                //如果gap起始节点之后的开始节点被访问过，那就回溯
                                oneScaffoldedNodeInfoList.pop()
                                if(oneScaffoldedNodeInfoList.length > 0){
                                    currentNodePafInfo = oneScaffoldedNodeInfoList[oneScaffoldedNodeInfoList.length-1]
                                    continue//回到步骤 3
                                }else{
                                    resolve()
                                    return
                                }
                            }
                            console.log( 'not find gap end node')
                        }
                    }else{
                        console.log('not find gap end index')
                    }
                }else{
                    //4-2-2、走到这里说明当前节点在scaffold中的结束位置与scaffold中gap开始的位置不相近：
                    if (Math.abs(parseInt(currentNodePafInfo[6]) - parseInt(currentNodePafInfo[8])) <= 20000){
                        //4-2-2-1、走到这里说明根据比对位置可以判断出当前节点是scaffold的最后一个utg，那么就意味着当前染色体挂载完毕
                        console.log(chrId+' finished scaffold!222222 ' )
                        resolve()
                        break
                    }else{
                        //4-2-2-2、走到这里说明当前节点既不是gap开始的utg，也不是scaffold的最后一个utg，那么就表示当前节点不可靠，需要回溯上一节点挂载其他节点
                        oneScaffoldedNodeInfoList.pop()
                        console.log(chrId+' huisu44444444 '+currentNodePafInfo[0] + '  '+ Math.abs(parseInt(currentNodePafInfo[6]) - parseInt(currentNodePafInfo[8])))
                        // console.log(chrId+' huisu44444444 currNode:'+currentNodePafInfo[0] + " preNode:"+oneScaffoldedNodeInfoList[oneScaffoldedNodeInfoList.length-1][0])
                        if (!oneScaffoldedNodeInfoList[oneScaffoldedNodeInfoList.length-1]){
                            console.log(chrId + '----------------------------------------------->'+oneScaffoldedNodeInfoList)
                            resolve()
                            return
                        }
                        // await scaffolding(chrId,oneScaffoldedNodeInfoList[oneScaffoldedNodeInfoList.length-1],gapIndexMap,visitedNode)
                        currentNodePafInfo = oneScaffoldedNodeInfoList[oneScaffoldedNodeInfoList.length-1]
                        continue
                    }
                }
            }
        }
    })
}

/**
 * 对挂载结果进行优化
 * @returns {Promise<unknown>}
 */
async function optimizeScaffoldingResult(chrId){
    return new Promise(async (resolve, reject) => {
        let startTime = new Date()
        oneScaffoldedNodeInfoList = []
        let chrPafInfoList = pafInfoMap.get(chrId)//获取候选集
        chrPafInfoList = [...new Set(chrPafInfoList)];
        let optimizeTotalCount = 1000
        if(oneScaffoldedNodeInfoList.length == 0){//如果oneScaffoldedNodeInfoList的长度为0，说明贪心算法没有挂载成功，这里就对其进行初始化
            let randomNum = Math.floor(Math.random() * chrPafInfoList.length)
            for (let i = 0; i < randomNum + 1; i++) {
                let randomIndex = Math.floor(Math.random() * chrPafInfoList.length)
                if (!oneScaffoldedNodeInfoList.includes(chrPafInfoList[randomIndex])){
                    oneScaffoldedNodeInfoList.push(chrPafInfoList[randomIndex])
                }
            }
            optimizeTotalCount = 3000 //如果贪心算法没有挂载成功，优化时需要多优化几次
        }
        //优化第一步，根据loss公式计算出oneScaffoldedNodeInfoList的loss值
        let tempOneScaffoldedNodeInfoList = JSON.parse(JSON.stringify(oneScaffoldedNodeInfoList))
        console.log(tempOneScaffoldedNodeInfoList)
        let finalLoss = await getLoss(tempOneScaffoldedNodeInfoList)
        console.log(chrId+' start loss======>'+finalLoss)
        //优化第二步，将pafInfoMap.get(chrId)中的值随机添加到oneScaffoldedNodeInfoList中，并计算loss值，循环此操作（循环次数自定义），
        // 若loss降低，则更新oneScaffoldedNodeInfoList，否则不做任何操作
        let count = 0
        while (count < optimizeTotalCount){
            count++
            let randomDeleteNum = Math.floor(Math.random() * tempOneScaffoldedNodeInfoList.length+1)
            let randomAddNum = Math.floor(Math.random() * chrPafInfoList.length + 1)
            let deleteNum = 0
            while(deleteNum < randomDeleteNum){
                // console.log("deleteNum = " + deleteNum + "randomDeleteNum = " + randomDeleteNum)
                deleteNum++
                let randomDeleteIndex = Math.floor(Math.random() * tempOneScaffoldedNodeInfoList.length)
                tempOneScaffoldedNodeInfoList.splice(randomDeleteIndex,1)
            }
            let addNum = 0
            let flag = false
            if(chrPafInfoList.length - tempOneScaffoldedNodeInfoList.length < randomAddNum ){
                randomAddNum = Math.floor(Math.random() * (chrPafInfoList.length - tempOneScaffoldedNodeInfoList.length + 1))
            }
            let num = chrPafInfoList.length - tempOneScaffoldedNodeInfoList.length
            while(addNum < randomAddNum){
                // console.log("addNum = " + addNum + " randomAddNum = " + randomAddNum + " num = " + num)
                // console.log("tempOneScaffoldedNodeInfoList.length = " + tempOneScaffoldedNodeInfoList.length + " chrPafInfoList.length = " + chrPafInfoList.length)
                let randomAddIndex = Math.floor(Math.random() * chrPafInfoList.length)
                //判断tempOneScaffoldedNodeInfoList中是否已经存在要添加的节点
                for (let tempOneNodePafInfo of tempOneScaffoldedNodeInfoList) {
                    if (tempOneNodePafInfo[0]+tempOneNodePafInfo[4] === chrPafInfoList[randomAddIndex][0]+chrPafInfoList[randomAddIndex][4]){
                        flag = true
                        break
                    }
                }
                if (flag){
                    flag = false
                    continue
                }else{
                    addNum++
                    tempOneScaffoldedNodeInfoList.push(chrPafInfoList[randomAddIndex])
                }
            }
            let loss = await getLoss(tempOneScaffoldedNodeInfoList)
            if (loss < finalLoss){
                oneScaffoldedNodeInfoList = JSON.parse(JSON.stringify(tempOneScaffoldedNodeInfoList))
                finalLoss = loss
                console.log(count + '----------------------------------------------------------------------------->' + finalLoss)
            }else{
                tempOneScaffoldedNodeInfoList = JSON.parse(JSON.stringify(oneScaffoldedNodeInfoList))
            }
        }
        console.log(chrId+' end loss======>'+finalLoss)
        let endTime = new Date()
        console.log('time:'+ (endTime - startTime))
        resolve()
    })
}

async function getLoss(oneScaffoldedNodeInfoList){
    return new Promise(async (resolve, reject)=>{
        let numOfInGreaterThan1 = 0//记录节点入度大于1的节点数量
        let numOfOutGreaterThan1 = 0//记录节点出度大于1的节点数量
        let numOfInAndOutEqual1 = 0//记录节点入度等于出度等于1的节点数量
        let numOfNodeEdgeEqual0 = 0//记录度为0的节点，即孤立节点
        let numOfIn = new Map()
        let numOfOut = new Map()
        for (let oneNodePafInfo of oneScaffoldedNodeInfoList) {
            for (let oneNodePafInfo1 of oneScaffoldedNodeInfoList) {
                if (oneNodePafInfo[0] + oneNodePafInfo[4] != oneNodePafInfo1[0] + oneNodePafInfo1[4]){
                    for (let linkInfo of linkInfoList) {
                        if(linkInfo[0] + linkInfo[1] === oneNodePafInfo[0] + oneNodePafInfo[4] &&
                            linkInfo[2] + linkInfo[3] === oneNodePafInfo1[0]+ oneNodePafInfo1[4]){
                            let key1 = oneNodePafInfo[0] + oneNodePafInfo[4]
                            let key2 = oneNodePafInfo1[0] + oneNodePafInfo1[4]
                            if (numOfOut.get(key1)){
                                numOfOut.set(key1,numOfOut.get(key1) + 1)
                            }else{
                                numOfOut.set(key1,1)
                            }
                            if (numOfIn.get(key2)){
                                numOfIn.set(key2,numOfIn.get(key2) + 1)
                            }else{
                                numOfIn.set(key2,1)
                            }
                        }
                    }
                }
            }
        }
        //统计入度大于1的节点
        for (let [numOfInKey, numOfInValue] of numOfIn) {
            if(numOfInValue > 1){
                numOfInGreaterThan1++
            }
            //统计入度和出度都等于1的节点
            if (numOfOut.get(numOfInKey)){
                if(numOfOut.get(numOfInKey) === 1 && numOfInValue === 1){
                    numOfInAndOutEqual1++
                }
            }
        }
        //统计出度大于1的节点
        for (let [key, value] of numOfOut) {
            if(value > 1){
                numOfOutGreaterThan1++
            }
        }
        //还要统计度为0的节点
        for (let oneNodePafInfo of oneScaffoldedNodeInfoList) {
            if (!numOfIn.has(oneNodePafInfo[0] + oneNodePafInfo[4]) && !numOfOut.has(oneNodePafInfo[0] + oneNodePafInfo[4])){
                numOfNodeEdgeEqual0++
            }
        }
        let allScore = 0
        let allUtgLength = 0
        for (let oneNodePafInfo of oneScaffoldedNodeInfoList) {
            let utgLength = parseInt(oneNodePafInfo[1])
            let chrLength = parseInt(oneNodePafInfo[6])
            let bpMatchNumber = parseInt(oneNodePafInfo[9])
            let matchBlockLength = parseInt(oneNodePafInfo[10])
            let score = 0
            if(utgLength > 100000){
                score = Math.min(matchBlockLength / utgLength, 1) * 0.5 + (bpMatchNumber / matchBlockLength) * 0.5
            }else{
                score = Math.min(matchBlockLength / utgLength, 1) * 0.4 + (bpMatchNumber / matchBlockLength) * 0.4 + 0.1 * (utgLength/100000)
            }
            allScore += score
            let utgProportion = utgLength / chrLength
            allUtgLength += utgProportion
        }
        // console.log(numOfInGreaterThan1 +'==='+numOfOutGreaterThan1+'==='+numOfNodeEdgeEqual0+'==='+numOfInAndOutEqual1+'==='+allUtgLength+'==='+allScore)
        let length = oneScaffoldedNodeInfoList.length
        let loss = 0.6 * (0.35 * (numOfInGreaterThan1/length) + 0.35 * (numOfOutGreaterThan1/length) + 0.125 * (numOfNodeEdgeEqual0/length)+0.175*(1-numOfInAndOutEqual1/length))
            + 0.4 * (0.4 * (1-Math.min(allUtgLength,1)) + 0.6 * (1-allScore/oneScaffoldedNodeInfoList.length))
        // let loss = 0.6 * (0.55 * numOfNodeEdgeLessThan2 + 0.45 * numOfNodeEdgeGreaterThan2) + 0.3 * (1-allScore/oneScaffoldedNodeInfoList.length) + 0.2 * (1-allUtgLength/oneScaffoldedNodeInfoList.length)
        resolve(loss)
        return
    })
}


let generateFaFileResult = {
    result:false,
    message:'Failed to generate scaffold FA file!'
}
ipcMain.handle('fillGap',async (event, args)=>{
    // let result = await pipeline()
    let result = await fillGap(args['fillGapArg'])
    console.log(result)
    return result
})

/**
 * 补gap
 * @param fillGapArg
 * @returns {Promise<unknown>}
 */
async function fillGap(fillGapArg){
    return new Promise( async (resolve, reject) =>{
        let gapSequenceInfoList = []
        let newFAPath
        let chrId
        for (let oneFillGapArgList of fillGapArg) {
            //处理数据
            let sourceNodePafInfo = oneFillGapArgList[0]
            let sourceNodeId = sourceNodePafInfo[0]
            let sourceNodeFlag = sourceNodePafInfo[4]
            let endNodePafInfo = oneFillGapArgList[1]
            chrId = sourceNodePafInfo[5]
            let nodeIdList = oneFillGapArgList[2]
            let finalSequence = ''
            newFAPath = scaffoldPath.substring(0,gfaPath.lastIndexOf('\\')) + '\\' + chrId + '.fa'
            if (nodeIdList.indexOf(sourceNodePafInfo[0]) !== -1){
                nodeIdList.splice(nodeIdList.indexOf(sourceNodePafInfo[0]),1)
            }
            if (nodeIdList.indexOf(endNodePafInfo[0]) !== -1){
                nodeIdList.splice(nodeIdList.indexOf(endNodePafInfo[0]),1)
            }
            nodeIdList.push(endNodePafInfo[0])
            //拼接utg，得到gap序列
            let count = 0
            while (nodeIdList.length > 0) {
                count++
                console.log('========================'+count+'=======================')
                //根据用户添加节点的顺序来获取合并节点的信息
                let matchNum
                let targetNodeId = ''
                let targetNodeFlag = ''
                for (let oneLinkInfoList of linkInfoList) {
                    if (oneLinkInfoList[0] === sourceNodeId && oneLinkInfoList[1] === sourceNodeFlag && oneLinkInfoList[2] === nodeIdList[0]){
                        targetNodeId = nodeIdList[0]
                        targetNodeFlag = oneLinkInfoList[3]
                        matchNum = oneLinkInfoList[4]
                        nodeIdList.splice(0, 1)
                        break
                    }
                }
                if (targetNodeId === ''){
                    generateFaFileResult.result = false
                    generateFaFileResult.message = sourceNodeId + sourceNodeFlag + ' can\'t reach ' + nodeIdList[0]
                    console.log(sourceNodeId + sourceNodeFlag + ' can\'t reach ' + nodeIdList[0])
                    resolve(generateFaFileResult)
                    return
                }

                //得到一个元素后，将该元素和前一个节点根据overlap合并
                console.log(sourceNodeId +'---->'+targetNodeId+':'+matchNum)
                finalSequence = await mergerUtg(targetNodeId,matchNum,targetNodeFlag,finalSequence)
                sourceNodeId = targetNodeId
                sourceNodeFlag = targetNodeFlag
            }

            let temp = []
            temp.push(finalSequence)
            temp.push(sourceNodePafInfo[8])
            temp.push(endNodePafInfo[8])
            gapSequenceInfoList.push(temp)
        }
        //生成scaffold
        fs.writeFileSync(newFAPath, '>'+chrId+'\n',{flag:'a'})
        await originalScaffoldFragmentWriteNewFile(newFAPath,chrId,0,gapSequenceInfoList[0][1])
        for (let i = 0; i < gapSequenceInfoList.length; i++) {
            fs.writeFileSync(newFAPath, gapSequenceInfoList[i][0],{flag:'a'})
            if (i+1 < gapSequenceInfoList.length){
                await originalScaffoldFragmentWriteNewFile(newFAPath,chrId,gapSequenceInfoList[i][2],gapSequenceInfoList[i+1][1])
            }else{
                await originalScaffoldFragmentWriteNewFile(newFAPath,chrId,gapSequenceInfoList[i][2])
            }
        }
        fs.writeFileSync(newFAPath, '\n',{flag:'a'})
        generateFaFileResult.result = true
        generateFaFileResult.message = 'Successfully fill gap!'
        resolve(generateFaFileResult)
        return
    })
}

/**
 * 根据开始和结束坐标截取原始scaffold中的序列，并将截取出来的序列写入到目标文件中
 * @param writeFilePath
 * @param startIndex
 * @param endIndex
 * @returns {Promise<unknown>}
 */
function originalScaffoldFragmentWriteNewFile(writeFilePath,chrId,startIndex, endIndex){
    return new Promise((resolve, reject) => {
        let faStream = fs.createReadStream(scaffoldPath);
        let rlFa = readline.createInterface({
            input: faStream,
            output: process.stdout,
            terminal: false
        });
        let result = false
        let found = false
        rlFa.on('line', (line) => {
            if (found) {
                fs.writeFileSync(writeFilePath, line.substring(startIndex,endIndex),{flag:'a'})
                result = true
                found = false
                rlFa.close()
            }
            if (line.startsWith('>'+chrId)) {
                found = true;
            }
        });
        rlFa.on('close',()=>{
            faStream.close()
            resolve(result)
        })
    })
}

/**
 * 初始化合并utg操作的fa文件
 * @returns {Promise<unknown>}
 */
function mergerInitializeFaFile(sourceNodeId,flag,newFAPath){
    return new Promise(async (resolve, reject)=>{
        let gfaStream = fs.createReadStream(gfaPath);
        let rlGfa = readline.createInterface({
            input: gfaStream,
            output: process.stdout,
            terminal: false
        });
        let result = false
        rlGfa.on('line',(line) => {
            let arr = line.split('\t')
            if (arr[1] === sourceNodeId && arr[0] === 'S'){
                let sequence = arr[2]
                let finalSequence = ''
                let ATGCMap = new Map()
                ATGCMap.set('A','T')
                ATGCMap.set('T','A')
                ATGCMap.set('G','C')
                ATGCMap.set('C','G')
                //再写入文件之前，要先根据flag的正负决定需不需要翻转utg序列，+不需要翻转，-需要将序列翻转为反向互补链
                if (flag === '-'){
                    for (let i = sequence.length - 1; i >= 0; i--) {
                        finalSequence = finalSequence + ATGCMap.get(sequence[i])
                    }
                    fs.writeFileSync(newFAPath, finalSequence,{flag:'a'})
                }else{
                    fs.writeFileSync(newFAPath, sequence,{flag:'a'})
                }

                result = true
                rlGfa.close()
            }
        })
        rlGfa.on('close',() => {
            gfaStream.close()
            resolve(result)
        })
    })
}


/**
 * 去比对结果中获取sourceNode节点的正负性
 * @returns {Promise<unknown>}
 */
function getFlagSourceNode(chrId,sourceNodeId){
    return new Promise((resolve, reject)=>{
        let mapStream = fs.createReadStream(pafPath);
        let rlMap = readline.createInterface({
            input: mapStream,
            output: process.stdout,
            terminal: false
        });
        let flag
        rlMap.on('line', (line) => {
            let arr = line.split('\t')
            // if ( arr[5] === chrId && arr[11] === '60' && arr[0] === sourceNodeId) {
            if ( arr[5] === chrId && parseInt(arr[11]) >= 0 && arr[0] === sourceNodeId) {
                flag = arr[4]
                rlMap.close()//因为只看第一个匹配上的utg，所以找见第一个后就关闭流
            }
        })
        rlMap.on('close',()=>{
            mapStream.close()
            resolve(flag)
        })
    })
}

/**
 * 去gfa文件中获取sourceNode能到达哪些节点，并记录targetNode的正负性及 sourceNode与targetNode的overlap
 * @returns {Promise<unknown>}
 */
function getTargetNodeMap(sourceNodeId,flag){
    return new Promise((resolve, reject)=>{
        let targetNodeMap = new Map()
        for (let oneLinkInfoList of linkInfoList) {
            if (oneLinkInfoList[0] === sourceNodeId && oneLinkInfoList[1] === flag){
                targetNodeMap.set(oneLinkInfoList[2],[oneLinkInfoList[3],oneLinkInfoList[4]])
            }
        }
        resolve(targetNodeMap)
    })
}

/**
 * 根据overlap将targetNode拼接到fa文件中
 * @returns {Promise<unknown>}
 */
function mergerUtg(targetNodeId,matchNum,flag,finalSequence){
    return new Promise((resolve, reject)=>{
        let gfaStream = fs.createReadStream(gfaPath);
        let rlGfa = readline.createInterface({
            input: gfaStream,
            output: process.stdout,
            terminal: false
        });
        rlGfa.on('line', (line) => {
            let arr = line.split('\t')
            if (arr[1] === targetNodeId && arr[0] === 'S') {
                let sequence = arr[2]
                let ATGCMap = new Map()
                ATGCMap.set('A','T')
                ATGCMap.set('T','A')
                ATGCMap.set('G','C')
                ATGCMap.set('C','G')
                //再写入文件之前，要先根据flag的正负决定需不需要翻转utg序列，+不需要翻转，-需要将序列翻转为反向互补链
                if (flag === '-'){
                    for (let i = sequence.length - matchNum - 1; i >= 0; i--) {
                        finalSequence = finalSequence + ATGCMap.get(sequence[i])
                    }
                }else{
                    // fs.writeFileSync(newFAPath, arr[2].substring(matchNum),{flag:'a'})
                    finalSequence = finalSequence + arr[2].substring(matchNum)
                }
                rlGfa.close()
            }
        })
        rlGfa.on('close',() =>{
            gfaStream.close()
            resolve(finalSequence)
        })
    })
}


ipcMain.handle('mergerSequence',async (event, args)=>{

    let result = await mergerSequence(args)
    console.log(result)
    return result
})
/**
 * 分型
 * @returns {Promise<unknown>}
 */
async function mergerSequence(args){
    return new Promise(async (resolve, reject)=>{
        let startNodeId = args['startNodeIdOfGap']
        let sourceNodeId = args['startNodeIdOfGap']
        let endNodeId = args['endNodeIdOfGap']
        let chrId = args['chrId']
        let nodeIdList = args['nodeIdListOfFillGap']
        if (nodeIdList.indexOf(sourceNodeId) !== -1){
            nodeIdList.splice(nodeIdList.indexOf(sourceNodeId),1)
        }
        if (nodeIdList.indexOf(endNodeId) !== -1){
            nodeIdList.splice(nodeIdList.indexOf(endNodeId),1)
        }
        nodeIdList.push(endNodeId)
        console.log(nodeIdList)
        //第一步：先确定开始的节点序列的正负性：去比对结果中找到该节点（若该节点比对到了很多地方，则看第一个的信息），看第五列是‘+’还是‘-’
        let flag = await getFlagSourceNode(chrId,sourceNodeId)//flag标记utg是‘+’还是‘-’
        if (!flag){
            generateFaFileResult.result = false
            generateFaFileResult.message = 'Failed to get the polarity of ' + sourceNodeId
            resolve(generateFaFileResult)
            return
        }
        //第二步： 初始化fa文件
        let newFAPath = scaffoldPath.substring(0,gfaPath.lastIndexOf('\\')) + '\\' + chrId + '.fa'
        fs.writeFileSync(newFAPath, '>'+ chrId +'\n',{flag:'a'})
        let mergerInitializeFaFileResult = await mergerInitializeFaFile(sourceNodeId,flag,newFAPath)//初始化合并utg操作的fa文件
        if (!mergerInitializeFaFileResult) {
            generateFaFileResult.result = false
            generateFaFileResult.message = 'Failed to initialize the FA file of merge!'
            resolve(generateFaFileResult)
            return
        }

        if (startNodeId === endNodeId){//如果开始节点和结束节点相同，说明这条染色体是由一个utg组成，由于初始化fa文件时就已经把第一个utg节点写入文件了，所以这里直接返回就可以
            generateFaFileResult.result = true
            generateFaFileResult.message = 'Successfully generated scaffold FA file'
            resolve(generateFaFileResult)
            return
        }


        //第五步：重复第三步和第四步，直到最后一个节点被处理
        let count = 0
        let finalSequence = ''
        while (nodeIdList.length > 0) {
            count++
            console.log('========================' + count + '=======================')
            //第三步：根据用户添加节点的顺序来获取合并节点的信息
            let matchNum
            let targetNodeId = ''
            for (let oneLinkInfoList of linkInfoList) {
                if (oneLinkInfoList[0] === sourceNodeId && oneLinkInfoList[1] === flag && oneLinkInfoList[2] === nodeIdList[0]) {
                    targetNodeId = nodeIdList[0]
                    flag = oneLinkInfoList[3]
                    matchNum = oneLinkInfoList[4]
                    nodeIdList.splice(0, 1)
                    break
                }
            }
            if (targetNodeId === '') {
                generateFaFileResult.result = false
                generateFaFileResult.message = sourceNodeId + flag + ' can\'t reach ' + nodeIdList[0]
                console.log(sourceNodeId + flag + ' can\'t reach ' + nodeIdList[0])
                resolve(generateFaFileResult)
                return
            }

            //第四步：得到一个元素后，将该元素和前一个节点根据overlap合并
            console.log(sourceNodeId + '---->' + targetNodeId + ':' + matchNum)
            finalSequence = await mergerUtg(targetNodeId, matchNum, flag, finalSequence)
            sourceNodeId = targetNodeId
        }
        fs.writeFileSync(newFAPath, finalSequence + '\n', {flag: 'a'})

        generateFaFileResult.result = true
        generateFaFileResult.message = 'Successfully generated scaffold FA file'
        resolve(generateFaFileResult)
        return
    })
}




/**
 * 上传scaffold文件
 */
let scaffoldPath = ''
ipcMain.handle('fa',async (event,options)=>{
    let result = await dialog.showOpenDialog(options)
    if(result.canceled){
        return null
    }else{
        let path = result.filePaths[0]
        let splitArr = path.split('.')
        let suffix = splitArr[splitArr.length-1]
        if(suffix === 'fa'){
            scaffoldPath = path
            console.log(scaffoldPath)
            let chrIdList = getChrIdList()
            return chrIdList
        }else{
            return 'suffix error'
        }
    }
})

/**
 * 上传utg比对到scaffold上的文件（使用minimap2比对得到的.paf文件）
 */
let pafPath = ''
ipcMain.handle('paf',async (event,options)=>{
    let result = await dialog.showOpenDialog(options)
    if(result.canceled){
        return null
    }else{
        let path = result.filePaths[0]
        let splitArr = path.split('.')
        let suffix = splitArr[splitArr.length-1]
        if(suffix === 'paf'){
            pafPath = path
            console.log(pafPath)
            return true
        }else{
            return 'suffix error'
        }
    }
})

/**
 * 上传组装图文件
 */
let gfaPath = ""
ipcMain.handle('assemblyGraph', async (event, options) => {
    let result = await dialog.showOpenDialog(options)
    if(result.canceled){
        return null
    }else{
        let path = result.filePaths[0]
        let splitArr = path.split('.')
        let suffix = splitArr[splitArr.length-1]
        if(suffix === 'gfa'){
            gfaPath = path
            await saveLinkInfo()
            return await readFileByLine(path,'graph')
        }else{
            return 'suffix error'
        }
    }
})
/**
 * 上传agp文件
 */
ipcMain.handle('agp', async (event, options) => {
    let result = await dialog.showOpenDialog(options)
    if(result.canceled){
        return null
    }else{
        let path = result.filePaths[0]
        let splitArr = path.split('.')
        let suffix = splitArr[splitArr.length-1]
        if(suffix === 'agp'){
            return await readFileByLine(path,'agp')
        }else{
            return 'suffix error'
        }
    }
})

/**
 * 上传Hic数据
 */
ipcMain.handle('hic',async (event,options) => {
    let result = await dialog.showOpenDialog(options)
    if(result.canceled){
        return null
    }else{
        let path = result.filePaths[0]
        let splitArr = path.split('.')
        let suffix = splitArr[splitArr.length-1]
        if(suffix === 'txt'){
            return await readFileByLine(path,'txt')
        }else{
            return 'suffix error'
        }
    }
})

/**
 * 上传参考基因组比对到组装图上的结果文件
 */
ipcMain.handle('referenceMappingAssemblyGraph', async (event, options) => {
    let result = await dialog.showOpenDialog(options)
    if(result.canceled){
        return null
    }else{
        let path = result.filePaths[0]
        let splitArr = path.split('.')
        let suffix = splitArr[splitArr.length-1]
        if(suffix === 'gaf'){
            return await readFileByLine(path,'reference')
        }else{
            return 'suffix error'
        }
    }
})
/**
 * 上传ont数据比对到组装图上的结果文件
 */
ipcMain.handle('ontMappingAssemblyGraph', async (event, options) => {
    let result = await dialog.showOpenDialog(options)
    if(result.canceled){
        return null
    }else{
        let path = result.filePaths[0]
        let splitArr = path.split('.')
        let suffix = splitArr[splitArr.length-1]
        if(suffix === 'gaf'){
            // return await readFileByLine(path,'ont')
            return path
        }else{
            return 'suffix error'
        }
    }
})

//逐行读取文件，适合大文件
let totalLineOfOntMappingGraphResult = 0
function readFileByLine(filePath,type){
    return new Promise((resolve,reject) => {
        let readStream = fs.createReadStream(filePath);
        let rl = readline.createInterface({
            input: readStream,
            output: process.stdout,
            terminal: false
        });

        if (type ==='graph') {
            //处理组装图文件
            let nodeAndEdge = {}
            let nodeMap = {}
            let edgeMap = {}
            let i = 0
            let j = 0
            console.log('Memory before processing:', process.memoryUsage().heapUsed / 1024 / 1024, 'MB');
            rl.on('line', (line) => {
                if (line.startsWith('S')) {
                    let arrS = line.split('\t')
                    let nodeId = 'node' + i++
                    nodeMap[nodeId] = arrS[1] + ':' + arrS[3].split(':')[2]
                }
                if (line.startsWith('L')) {
                    let edgeId = 'edge' + j++
                    let edgeS = line.split('\t')
                    edgeMap[edgeId] = edgeS[1] + ':' +edgeS[2] + ':' +edgeS[3] + ':' +edgeS[4]
                }
            });
            rl.on('close', () => {
                nodeAndEdge['node'] = nodeMap
                nodeMap = {}
                nodeAndEdge['edge'] = edgeMap
                edgeMap = {}
                console.log('Finished reading the gfa file.');
                readStream.close()
                console.log('Memory after processing:', process.memoryUsage().heapUsed / 1024 / 1024, 'MB');
                resolve(nodeAndEdge)
            });
        }
        if (type === 'agp'){
            //读取agp文件
            let ragtagResult = []
            rl.on('line',(line) => {
                let agpRowInfo = line.split('\t')
                if (parseInt(agpRowInfo[3])%2 == 1){//取出奇数行
                    if (agpRowInfo[0] === agpRowInfo[5]){
                        rl.close()
                        return
                    }
                    ragtagResult.push(agpRowInfo)
                }
            })
            rl.on('close',() =>{
                console.log('Finished reading the agp file.');
                readStream.close()
                resolve(ragtagResult)
            })
        }
        if (type === 'reference'){
            //处理参考基因组比对到组装图上的比对结果
            let referenceMappingGraphResult = []
            rl.on('line', (line) => {
                let gafRowInfo = line.split('\t')
                //筛选映射质量大于等于30并且不等于255的比对结果（255表示映射质量未知）
                if (parseInt(gafRowInfo[11]) >= 30 && parseInt(gafRowInfo[11]) != 255){
                    referenceMappingGraphResult.push(gafRowInfo)
                }
            });
            rl.on('close', () => {
                console.log('Finished reading the gaf file.');
                readStream.close()
                resolve(referenceMappingGraphResult)
            });

        }
        if (type === 'ont'){
            totalLineOfOntMappingGraphResult = 0
            //处理ont比对到组装图上的比对结果
            rl.on('line', (line) => {
                totalLineOfOntMappingGraphResult++
            });
            rl.on('close', () => {
                readStream.close()
                resolve({filePath:filePath,startLineNum:0,isFinish:false})
            });
        }
        if (type === 'txt'){
            //处理Hic文件
            // let hicResult = {}
            let hicResult = new Map()
            let totalLine = 0
            rl.on('line',(line) => {
                totalLine++
                let hicRowInfo = line.split(/\s+/)
                let temp1 = [hicRowInfo[1],parseFloat(hicRowInfo[2]).toFixed(3)]
                if (hicResult.has(hicRowInfo[0]) ){
                    let v = hicResult.get(hicRowInfo[0])
                    v.push(temp1)
                    hicResult.set(hicRowInfo[0],v)
                }else{
                    hicResult.set(hicRowInfo[0],[temp1])
                }
                let temp2 = [hicRowInfo[0],parseFloat(hicRowInfo[2]).toFixed(3)]
                if (hicResult.has(hicRowInfo[1])){
                    let v = hicResult.get(hicRowInfo[1])
                    v.push(temp2)
                    hicResult.set(hicRowInfo[1],v)
                }else{
                    hicResult.set(hicRowInfo[1],[temp2])
                }
            })
            rl.on('close',() =>{
                let count = 0
                let tempMap = new Map()
                let compressData = []
                let tempCompressData = null
                if (hicResult.size > 2000){//如果hicResult大小大于3000，再采取分段压缩
                    for (let [key, value] of hicResult) {
                        if (count < 2000){
                            tempMap.set(key,value)
                            count++
                        }else{
                            tempMap.set(key,value)
                            tempCompressData = pako.deflate(JSON.stringify(Object.fromEntries(tempMap)),{to:'string'})
                            compressData.push(tempCompressData)
                            tempMap.clear()
                            count = 0
                        }
                    }
                    if (tempMap.size > 0){
                        tempCompressData = pako.deflate(JSON.stringify(Object.fromEntries(tempMap)),{to:'string'})
                        compressData.push(tempCompressData)
                        tempMap.clear()
                    }
                }else {
                    tempCompressData = pako.deflate(JSON.stringify(Object.fromEntries(hicResult)),{to:'string'})
                    compressData.push(tempCompressData)
                }
                readStream.close()
                resolve(compressData)
            })
        }
    })

}

ipcMain.handle('readOntMappingGraphResult',async (event, args) =>{

    try {
        let result = await multiplyThreadsReadOntMappingGraphResult(args.path)
        return result
    } catch (e) {
        return { error: e.message }
    }
})


/**
 * 实现多线程
 */
let depthMap = new Map()
let signalMap = new Map()
let depthMapLock = false // 互斥锁
function mergeThreadsResult(threadResult) {
    // 获取锁
    while (depthMapLock) {
        // 等待锁释放
    }
    depthMapLock = true; // 上锁
    // 修改共享变量
    if (threadResult.size === 2){
        for (let [edge, depth] of threadResult.get('deep')) {
            if (depthMap.has(edge)){
                depthMap.set(edge,depthMap.get(edge)+depth)
            }else{
                depthMap.set(edge,depth)
            }
        }
        for (let [node,valueMap] of threadResult.get('signal')) {
            if(signalMap.has(node)){
                let temp = signalMap.get(node)
                for (let [nodeId,semaphore] of valueMap) {
                    if (temp.has(nodeId)){
                        temp.set(nodeId,temp.get(nodeId)+semaphore)
                    }else{
                        temp.set(nodeId,semaphore)
                    }
                }
                signalMap.set(node,temp)
            }else{
                signalMap.set(node,valueMap)
            }
        }
    }
    depthMapLock = false; // 解锁
}
let chunkSize = 1024*1024
async function multiplyThreadsReadOntMappingGraphResult(filePath){
    return new Promise((resolve,reject) =>{
        depthMap.clear()
        let startTime = performance.now()
        let endTime = 0
        try {
            if (isMainThread) {
                //线程池
                let pool = workerpool.pool(__dirname + '\\src\\script\\dealOntData.js', {minWorkers: 3, maxWorkers: 5})
                let readStream = fs.createReadStream(filePath, {highWaterMark: chunkSize})

                let rl = readline.createInterface({
                    input: readStream,
                    output: process.stdout,
                    terminal: false
                });
                let ontMappingGraphResultChunk = []
                let chunkLength = 40//块的大小
                rl.on('line', (line) => {
                    ontMappingGraphResultChunk.push(line)
                    if (ontMappingGraphResultChunk.length === chunkLength) {
                        pool.exec('dealData', [ontMappingGraphResultChunk])
                            .then((result) => {
                                //处理结果
                                mergeThreadsResult(result)
                                if (pool.stats().pendingTasks < 15) {
                                    rl.resume()
                                }

                            })
                            .catch((error) => {
                                console.error(error)
                            })
                        ontMappingGraphResultChunk = []
                    }
                    if (pool.stats().pendingTasks > 30) {
                        rl.pause()
                    }
                })

                let checkPoolStatus
                rl.on('close', () => {
                    checkPoolStatus = setInterval(() => {
                        let poolStats = pool.stats()
                        if (poolStats.busyWorkers === 0 && poolStats.idleWorkers === poolStats.totalWorkers) {
                            console.log('All workers are idle. Terminating pool...');
                            console.log(pool.stats())
                            endTime = performance.now()
                            let time = endTime - startTime
                            console.log('time=' + time)
                            clearInterval(checkPoolStatus);//清除定时任务
                            pool.terminate();//关闭连接池
                            let res = new Map()
                            res.set('deep', depthMap)
                            res.set('signal', signalMap)
                            resolve(res)//返回结果
                        }
                    }, 2000)
                    readStream.close()
                });
            }
        } catch (e) {
            log.error("error info:"+e.message)
            reject(e)
        }
    })
}




app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');//设置软件的最大内存为4GB

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        // 在 macOS 系统内, 如果没有已开启的应用窗口
        // 点击托盘图标时通常会重新创建一个新窗口
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此, 通常
// 对应用程序和它们的菜单栏来说应该时刻保持激活状态,
// 直到用户使用 Cmd + Q 明确退出
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})