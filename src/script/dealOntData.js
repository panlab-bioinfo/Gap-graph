const workerpool = require('workerpool')

function dealData(chunk){
    let gafRowInfo
    let deepOfEdge = new Map()
    let result = new Map()
    for (let chunkElement of chunk) {
        gafRowInfo = chunkElement.split('\t')
        let onePath = gafRowInfo[5].split(/(?=[<>])/)
        //筛选路径中节点数大于一个节点的路径，并且映射质量大于等于30并且不等于255的比对结果（255表示映射质量未知）
        //筛选出路径中节点数大于两个节点的路径，是因为我们关注的是边而不是单个节点
        // if (onePath.length >= 2 && parseInt(gafRowInfo[11]) >= 30 && parseInt(gafRowInfo[11]) != 255) {
        if (onePath.length >= 2 && parseInt(gafRowInfo[11]) >= 30) {
            //计算路径深度
            result = countDeepOfEdgeAndInterNodeSemaphore(onePath)
            // let deepMap = countDeepOfEdge(onePath)
            // for (let [edge, depth] of deepMap) {
            //     if (deepOfEdge.has(edge)){
            //         deepOfEdge.set(edge,deepOfEdge.get(edge)+depth)
            //     }else{
            //         deepOfEdge.set(edge,depth)
            //     }
            // }
        }
    }
    return result
}

/**
 * 计算一条路径中两两节点间的信号量
 * 由于边只能反应相邻两个节点间的关系，相邻两个节点间的信号量又可以叫做深度，可以用边的颜色的深浅表示，然而不相邻的节点间是没有边的，所以
 * 不相邻节点间的信号量大小只能用节点颜色的深浅来表示
 * 所以在统计信号量时，相邻节点间的信号量要先单独统计一遍，便于可视化
 * @param onePath
 * @returns {Map<any, any>}
 */
function countDeepOfEdgeAndInterNodeSemaphore(onePath){
    let node1 = null
    let node2 = null
    let deepMap = new Map()
    let interNodeSemaphore = new Map()
    //先单独统计一遍相邻节点间的信号量
    for (let i = 0; i < onePath.length - 1; i++) {
        if (onePath[i].substring(0,1) === '>'){
            node1 = onePath[i].substring(1) + '+'
        }else {
            node1 = onePath[i].substring(1) + '-'
        }
        if (onePath[i+1].substring(0,1) === '>'){
            node2 = onePath[i+1].substring(1) + '+'
        }else{
            node2 = onePath[i+1].substring(1) + '-'
        }
        let key = node1 + '=' + node2
        if (deepMap.has(key)){
            deepMap.set(key,deepMap.get(key)+1)
        }else{
            deepMap.set(key,1)
        }
    }
    for (let i = 0; i < onePath.length; i++) {
        for (let j = 0; j < onePath.length && j != i; j++) {
            node1 = onePath[i].substring(1)
            node2 = onePath[j].substring(1)
            if (interNodeSemaphore.has(node1)){
                let value = interNodeSemaphore.get(node1)
                if (value.has(node2)){
                    value.set(node2,value.get(node2)+1)
                }else{
                    value.set(node2,1)
                }
            }else{
                let temp = new Map()
                temp.set(node2,1)
                interNodeSemaphore.set(node1,temp)
            }
        }
    }
    let result = new Map()
    result.set('deep',deepMap)
    result.set('signal',interNodeSemaphore)
    return result
}

/**
 * 统计边的深度
 * @param onePath
 */
function countDeepOfEdge(onePath){
    let node1 = null
    let node2 = null
    let deepMap = new Map()
    for (let i = 0; i < onePath.length - 1; i++) {
        if (onePath[i].substring(0,1) === '>'){
            node1 = onePath[i].substring(1) + '+'
        }else {
            node1 = onePath[i].substring(1) + '-'
        }
        if (onePath[i+1].substring(0,1) === '>'){
            node2 = onePath[i+1].substring(1) + '+'
        }else{
            node2 = onePath[i+1].substring(1) + '-'
        }
        let key = node1 + '=' + node2
        if (deepMap.has(key)){
            deepMap.set(key,deepMap.get(key)+1)
        }else{
            deepMap.set(key,1)
        }
    }
    return deepMap
}

workerpool.worker({
    dealData:dealData
})