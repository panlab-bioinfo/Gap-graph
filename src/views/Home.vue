<template>
<!--页面的布局为左 中 右-->
  <div id="all" style="width: 100vw;height: 99vh;">
    <div style="float: left">
      <!--  左-->
      <div style="width: 10vw;height: 99vh; background-color: rgba(194,193,190,0.2);float: left;container-type: inline-size">
        <div>
          <el-button type="warning" @click="uploadGFA" style="width: 90cqw;margin-top: 10cqw;margin-left: 5cqw"><p style="font-size: 8cqw;">.gfa</p></el-button>
          <el-button type="warning" @click="uploadScaffoldFile" style="width: 90cqw;margin-top: 10cqw;margin-left: 5cqw"><p style="font-size: 8cqw;">.fa</p></el-button>
          <el-card style="width: 90cqw;margin-top: 8cqw;margin-left: 5cqw" body-style="padding: 5px;" shadow="never">
            <div style="width: 90cqw;margin-top: 3cqw;margin-left: 3cqw">
              <div style="display: inline-block; font-size:8cqw;">isOptimize：</div>
              <div style="display: inline-block; margin-left: 8cqw">
                <el-switch v-model="isOptimize"></el-switch>
              </div>
            </div>
            <el-select v-model="needOptimizeChrIdList" placeholder="Select chr ID" :disabled="!isOptimize" multiple clearable collapse-tags>
              <template #header>
                <el-checkbox v-model="isCheckAllChrId" @change="selectAllChrId" :indeterminate="indeterminate"> select all</el-checkbox>
              </template>
              <el-option v-for="item in chrIdList" :key="item" :label="item" :value="item"></el-option>
            </el-select>
          </el-card>
          <el-button type="warning" @click="uploadUtgMappingScaffoldResult" style="width: 90cqw;margin-top: 10cqw;margin-left: 5cqw"><p style="font-size: 8cqw;">.paf</p></el-button>
<!--          <el-button type="primary" @click="uploadCompareResultAboutReference" style="width: 90cqw;margin-top: 10cqw;margin-left: 5cqw"><p>reference to graph</p></el-button>-->
<!--          <el-button type="primary" @click="uploadRagtagResult" style="width: 90cqw;margin-top: 10cqw;margin-left: 5cqw"><p style="font-size: 8cqw;">.agp</p></el-button>-->
          <el-button type="primary" @click="uploadCompareResultAboutOnt" style="width: 90cqw;margin-top: 10cqw;margin-left: 5cqw"><p style="font-size: 8cqw;">.gaf</p></el-button>
          <el-button type="primary" @click="uploadHic" style="width: 90cqw;margin-top: 10cqw;margin-left: 5cqw"><p style="font-size: 8cqw;">Hi-C(.txt)</p></el-button>

          <el-button type="success" @click="showAllChromosome" style="width: 90cqw;margin-top: 20cqw;margin-left: 5cqw"><p style="font-size: 8cqw;">show chromosomes</p></el-button>
          <el-button type="success" @click="showAllDepth" style="width: 90cqw;margin-top: 10cqw;margin-left: 5cqw"><p style="font-size: 8cqw;">show path</p></el-button>
        </div>
        <div>
          <div style="width: 180px;margin-top: 15cqw;margin-left: 6cqw;"><p style="margin-top: 0px;margin-bottom: 0px">Select chr ID：</p></div>
<!--          <el-select v-model="value" placeholder="Please select" @change="showOnePathOfChromosome" style="width: 90cqw;margin-top: 2cqw;margin-left: 5cqw">-->
          <el-select v-model="value" placeholder="Please select" @change="showOneChromosomeById" style="width: 90cqw;margin-top: 2cqw;margin-left: 5cqw">
<!--            <el-option-->
<!--                v-for="item in chromosome"-->
<!--                :key = "item.value"-->
<!--                :value = "item.value"-->
<!--            >-->
<!--            </el-option>-->
            <el-option
                v-for="item in chrIdList"
                :key = "item"
                :value = "item"
            >
            </el-option>
          </el-select>
        </div>
<!--        <div>-->
<!--          <div style="width: 180px;margin-top: 15cqw;margin-left: 6cqw;"><p style="margin-top: 0px;margin-bottom: 0px">创建类：</p></div>-->
<!--          <el-input v-model="className" placeholder="Input class name" style="width: 90cqw;margin-top: 2cqw;margin-left: 5cqw"></el-input>-->
<!--          <el-button type="success" @click="createClass" style="width: 90cqw;margin-top: 3cqw;margin-left: 5cqw"><p style="font-size: 8cqw;">create</p></el-button>-->
<!--        </div>-->
        <!--所有染色体的gap信息-->
        <el-card style=" width: 90cqw;margin-left: 5cqw;margin-top: 7cqw" body-style="padding: 0px;" shadow="never">
          <div style="height: 14cqw;font-size: 8cqw; padding-top: 3cqw;text-align: center;">All gaps info</div>
          <hr style="margin-top: 1cqw;margin-bottom: 0cqw;border: none;border-bottom: 1px solid rgba(112,109,109,0.2);">
          <el-table :data = "scaffoldsAllGaps" stripe fit max-height="350px" size="small">
            <el-table-column prop="chrId" label="ChrId" width="80" header-align="center" align="center"></el-table-column>
            <el-table-column prop="startIndex" label="StartIndex" width="100" header-align="center" align="center"></el-table-column>
            <el-table-column prop="endIndex" label="EndIndex" width="100" header-align="center" align="center"></el-table-column>
          </el-table>
        </el-card>
      </div>

      <!--  中-->
      <div id="mid" style="width: 79vw;height: 99vh; float: right">
        <div id="sigma" style="width: 79vw;height: 100vh"></div>
        <div id="stageMenu" class="menu" style="display: none; position: absolute; ">
          <ul>
            <li v-for="(item,index) in stageMenuList" :key="index" @click="stageMenuFunction(item)">{{item}}</li>
          </ul>
        </div>
        <div id="nodeMenu" class="menu" style="display: none; position: absolute; ">
          <ul>
            <li v-for="(item, index) in nodeMenuList" :key="index" @click="nodeMenuFunction(item)">{{ item }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!--  右-->
    <div style="width: 11vw;height: 99vh; background-color: rgba(194,193,190,0.2); float: right">
      <!--查询节点-->
      <div style="margin-top: 1cqw;margin-left: 0.3cqw;">Find node(s):</div>
      <div style="width: 9.5cqw;margin-top: 0.3cqw;margin-left: 0.3cqw">
        <el-input
            placeholder="node id(s)"
            v-model="queryIds"
            clearable>
        </el-input>
        <el-button type="success" @click="queryNodes" style="width: 9.5cqw;margin-top: 0.3cqw"><p style="font-size: 0.8cqw">Find node(s)</p></el-button>
      </div>
      <!-- 补gap的卡片 -->
      <el-card style=" width: 9.5cqw;margin-left: 0.3cqw;margin-top: 1cqw" body-style="padding: 0px;" shadow="never">
        <div style="width: 8.6cqw;margin-top: 0.5cqw;margin-left: 0.4cqw">start: <el-input v-model="startNodeIdOfGap" clearable style="width: 5.3cqw" placeholder="start node id"></el-input></div>
        <div style="width: 8.6cqw;margin-top: 0.3cqw;margin-left: 0.4cqw">end : <el-input v-model="endNodeIdOfGap" clearable style="width: 5.3cqw" placeholder="end node id"></el-input></div>
        <!--        <div style="width: 8.6cqw;margin-top: 0.3cqw;margin-left: 0.4cqw">chr&nbsp; : <el-input v-model="chrId" style="width: 5.3cqw" placeholder="chr id"></el-input></div>-->
        <hr style="margin-top: 0.2cqw;border: none;border-bottom: 1px solid rgba(112,109,109,0.2);">
        <el-scrollbar style="height: 5cqw;margin-top: 0.2cqw">
          <div v-for="nodeId in nodeIdListOfFillGap" :key="nodeId" style="padding-left: 0.4cqw;width: 8cqw;">
            <div class="item-left" style="display: inline-block;width: 80%;">{{ nodeId }}</div>
            <div style="display: inline-block;width: 20%;">
              <delete class="delete" @click="deleteGapNodeId(nodeId)" style="width: 2em;height: 1em;" ></delete>
            </div>
          </div>
        </el-scrollbar>
        <el-card body-style="padding: 0px;background-color: #67C23A" shadow="hover" style="width: 5.9cqw; height: 1.7cqw; margin-left: 0.2cqw; display: inline-block">
          <div style="width: 2cqw;margin-left: 0.3cqw;margin-top: 0.2cqw;display: inline-block">
            <el-card body-style="padding: 0px;width: 2cqw;height: 1.3cqw;background-color: #67C23A" shadow="hover">
              <div class="generateFile"  @click="addGapInfo()" style="height: 1.3cqw;padding-top: 0.1cqw;text-align: center;font-size: 0.8cqw;color: #FFFFFF">
                add
              </div>
            </el-card>
          </div>
          <div style="width: 3cqw;margin-left: 0.3cqw;margin-top: 0.2cqw;display: inline-block">
            <el-card body-style="padding: 0px;width: 3cqw;height: 1.3cqw;background-color: #67C23A" shadow="hover">
              <div class="generateFile"  @click="fillGapFun()" style="height: 1.3cqw;padding-top: 0.1cqw;text-align: center;font-size: 0.8cqw;color: #FFFFFF">
                fill gap
              </div>
            </el-card>
          </div>
        </el-card>
        <div style="width: 3cqw;margin-left: 0.2cqw;display: inline-block">
          <el-card body-style="padding: 0px;width: 3cqw;height: 1.7cqw;background-color: #67C23A" shadow="hover">
            <div class="generateFile"  @click="mergerSequenceFun()" style="height: 1.5cqw;padding-top: 0.3cqw;text-align: center;font-size: 0.8cqw;color: #FFFFFF">
              merger
            </div>
          </el-card>
        </div>
      </el-card>
      <!--显示边信息的卡片-->
      <el-card style=" width: 9.5cqw;margin-left: 0.3cqw;margin-top: 1cqw" body-style="padding: 0px;" shadow="never">
        <div style="height: 1.1cqw;padding-top: 0.2cqw;font-size: 0.8cqw; text-align: center">{{leftClickedNodeId}} edge info</div>
        <hr style="margin-top: 0.2cqw;margin-bottom: 0cqw;border: none;border-bottom: 1px solid rgba(112,109,109,0.2);">
<!--        <el-scrollbar style="height: 7cqw;margin-top: 0.2cqw">-->
<!--          <div v-for="edge in edgeInfoOfClickedNode" :key="edge">-->
<!--            <div style="font-size: 0.65cqw; white-space: nowrap">{{edge[0]}} > {{edge[1]}}</div>-->
<!--          </div>-->
<!--        </el-scrollbar>-->
        <el-table :data = "edgeInfoOfClickedNode" stripe fit max-height="200px" size="small">
          <el-table-column prop="source" label="Source" width="95" header-align="center" align="center"></el-table-column>
          <el-table-column prop="target" label="Target" width="95" header-align="center" align="center"></el-table-column>
        </el-table>
      </el-card>
      <!--显示节点paf信息的卡片-->
      <el-card style=" width: 9.5cqw;margin-left: 0.3cqw;margin-top: 1cqw" body-style="padding: 0px;" shadow="never">
        <div style="height: 1.1cqw;padding-top: 0.2cqw;font-size: 0.8cqw; text-align: center">{{leftClickedNodeId}} paf info</div>
        <hr style="margin-top: 0.2cqw;margin-bottom: 0cqw;border: none;border-bottom: 1px solid rgba(112,109,109,0.2);">
<!--        <el-scrollbar style="height: 10.5cqw;margin-top: 0.2cqw">-->
<!--          <div v-for="(pafInfo,index) in pafInfoOfClickedNode" :key="pafInfo" style="margin-left: 0.2cqw">-->
<!--            <div style="float: left; width:45%;font-size: 0.65cqw; white-space: nowrap; text-align: right">{{pafFiled[index]}} :</div>-->
<!--            <div style="float: right; width:55%;font-size: 0.65cqw; white-space: nowrap; text-align: center">{{pafInfo}}</div>-->
<!--          </div>-->
<!--        </el-scrollbar>-->
        <el-table :data = "pafInfoOfClickedNode" stripe fit max-height="350px" size="small">
          <el-table-column prop="pafFiled" label="PafFiled" width="95" header-align="center" align="center"></el-table-column>
          <el-table-column prop="pafFiledValue" label="Value" width="100" header-align="center" align="center"></el-table-column>
        </el-table>
      </el-card>
      <!--类卡片-->
      <el-scrollbar style="width: 9.8cqw;height: 24cqw;margin-top: 0.5cqw;">
        <div class="card" v-for="name in Array.from(classes.keys())" :key="name" style="margin-left: 0.3cqw;margin-top: 1cqw;width: 9cqw;height: 9cqw">
          <el-card style="width: 9cqw;height: 9cqw;" body-style="padding: 0px;width: 9cqw;height: 7cqw;" shadow="never">
            <div class="card-header" style="height: 1.5cqw;overflow: hidden;">
              <span class="title" style="width: 9cqw;display: inline-block;white-space: nowrap;text-align: center;margin-top: 0.3cqw">{{ name }}</span>
            </div>
            <hr style="margin-top: 0px;border: none;border-bottom: 1px solid rgba(112,109,109,0.2);">
            <el-scrollbar style="height: 5cqw">
              <div v-for="nodeId in classes.get(name)" :key="nodeId" style="padding-left: 10px;width: 8cqw;">
                <div class="item-left" style="display: inline-block;width: 80%;">{{nodeId}}</div>
                <div style="display: inline-block;width: 20%;">
                  <delete class="delete" @click="deleteNodeId(name,nodeId)" style="width: 2em;height: 1em;" ></delete>
                </div>
              </div>
            </el-scrollbar>
<!--            <hr style="margin: 0px;border: none;border-bottom: 1px solid rgba(112,109,109,0.2);">-->
            <div style="width: 9cqw;">
              <div style="width: 4cqw;margin-left: 0.3cqw;display: inline-block">
                <el-card body-style="padding: 0px;width: 4cqw;height: 1.7cqw;background-color: #F56C6C" shadow="hover">
                  <div class="deleteClass" @click="deleteClass(name)" style="height: 1.5cqw;padding-top: 0.4cqw;text-align: center;font-size: 0.7cqw;color: #FFFFFF">
                    del
                  </div>
                </el-card>
              </div>
              <div style="width: 4cqw;margin-left: 0.3cqw;display: inline-block">
                <el-card body-style="padding: 0px;width: 4cqw;height: 1.7cqw;background-color: #67C23A" shadow="hover">
                  <div class="generateFile" @click="generateGFAFile(name)" style="height: 1.5cqw;padding-top: 0.4cqw;text-align: center;font-size: 0.7cqw;color: #FFFFFF">
                    .gfa
                  </div>
                </el-card>
              </div>
            </div>
          </el-card>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref, reactive, watch} from "vue";
  import { ElLoading,ElMessage  } from 'element-plus'
  import {UndirectedGraph} from "graphology";
  import Sigma from "sigma";
  import {NodeBorderProgram,createNodeBorderProgram} from "@sigma/node-border"
  import {forEachConnectedComponentOrder} from 'graphology-components';
  import * as ogdf from 'ogdfjs'
  import pako from 'pako'

  let container = null
  let graph = new UndirectedGraph()
  let sigma = null
  let ogdfFM3 = ogdf.layouts.energybased.fm3
  let ogdfLayout = new ogdfFM3();
  let ogdfNodes = []
  let ogdfEdges = []
  let loading = null
  let isOptimize = ref(false)//是否使用优化算法
  let needOptimizeChrIdList = ref([])//需要进行优化的染色体的ID列表
  let isCheckAllChrId = ref(false)//是否选中所有染色体id
  let indeterminate = ref(false)
  let isUploadGraph = false
  let isUploadReferenceMapGraphResult = false
  let isUploadRagtagResult = false
  let isUploadOntMapGraphResult = false
  let isUploadScaffold = false
  let isUploadPaf = false
  let isUploadHic = false
  let referenceMappingGraphResult = null
  let ragtagResult = null
  let ontMappingGraphResult = null
  let chromosome = reactive([])
  let value = ref('')
  //统计边的深度
  let deepOfEdge = null
  //统计两节点间的信号量---深度
  let interNodeSemaphoreDepth = null

  let mouseSelectedNode = null
  let isDragging = false
  let nodeDefaultColor = '#b4b4b4'
  let nodeSecondColor = '#d5d5d5'
  let edgeDefaultWidth = 0.8

  let clickedNodeId = null//当右击节点显示节点菜单时，记录当前被点击的节点的Id

  let edgeInfoOfClickedNode = reactive([])//记录被点击节点的边信息，用于在界面上显示
  let pafFiled = reactive(['utg','utgLen','utgStart','utgEnd','direction','chr','chrLen','chrStart','chrEnd','matchNum','blockLen','mapQ'])//paf的字段
  let pafInfoOfClickedNode = reactive([])//记录被点击节点的paf信息，用于在界面上显示
  let leftClickedNodeId = ref('')//左键点击的节点
  let scaffoldsAllGaps = reactive([])//记录所有的染色体中gap信息



  onMounted(() => {
    container = document.getElementById("sigma");
    sigma = new Sigma(graph,container,{
        renderEdgeLabels:true,
        nodeProgramClasses: {
          bordered: createNodeBorderProgram({
            borders: [
              { size: { attribute: "borderSize", defaultValue: 0.1 }, color: { attribute: "borderColor" } },
              { size: { fill: true }, color: { attribute: "color" } },
            ],
          })
        },
        settings: {
          zoomingRatio: 0.5
        },
      })

    /**
     * 右击 空白区域 弹出菜单
     */
    // sigma.on("rightClickStage",(e)=>{
    //   document.getElementById('nodeMenu').style.display = `none`//为防止意外，先关闭一次节点菜单
    //   let stageMenu = document.getElementById('stageMenu')
    //   stageMenu.style.display = `none`
    //   let x = e.event.x
    //   let y = e.event.y
    //   let containerRect = document.getElementById('mid').getBoundingClientRect();
    //   x = containerRect.x + x
    //   y = y - 13
    //   stageMenu.style.left = x+`px`
    //   stageMenu.style.top = y+`px`
    //   stageMenu.style.display = `flex`
    // })
    /**
     * 左击 空白区域 隐藏菜单
     */
    sigma.on("clickStage",(e) => {
      document.getElementById('stageMenu').style.display = `none`
      document.getElementById('nodeMenu').style.display = `none`
    })

    /**
     * 右击 节点 弹出菜单
     */

    sigma.on("rightClickNode",(e) =>{
      document.getElementById('stageMenu').style.display = `none`//为防止意外，先关闭一次普通菜单
      let nodeMenu = document.getElementById('nodeMenu')
      nodeMenu.style.display = `none`
      let x = e.event.x
      let y = e.event.y
      let containerRect = document.getElementById('mid').getBoundingClientRect();
      x = containerRect.x + x
      y = y - 13
      nodeMenu.style.left = x+`px`
      nodeMenu.style.top = y+`px`
      nodeMenu.style.display = `flex`
      clickedNodeId = e.node
    })

    /**
     * 如果只是单击，则显示节点的一些信息
     * 如果是ctrl+单击节点，则将节点Id添加到补gap的列表中
     */
    sigma.on("clickNode",(e) =>{
      e.preventSigmaDefault()
      leftClickedNodeId.value = e.node
      if (e.event.original.ctrlKey){
        //如果是ctrl+单击节点，则将节点Id添加到补gap的列表中
        nodeIdListOfFillGap.push(e.node)
        graph.setNodeAttribute(e.node,"type","bordered")
        graph.setNodeAttribute(e.node,"borderColor","red")
        graph.setNodeAttribute(e.node,"borderSize",0.2)
        ElMessage.success("Added successfully!")
      }else{
        //如果只是单击，则显示与该节点相关的边信息
        edgeInfoOfClickedNode.splice(0,edgeInfoOfClickedNode.length)
        pafInfoOfClickedNode.splice(0,pafInfoOfClickedNode.length)
        graph.forEachEdge(e.node,(edge,attributes) =>{
          let edgeInfo = attributes.edgeInfo
          for (let oneEdge of edgeInfo.split(';')) {
            let oneEdgeList = oneEdge.split('>')
            let temp = {
              source: oneEdgeList[0],
              target: oneEdgeList[1]
            }
            edgeInfoOfClickedNode.push(temp)
          }
        })
        //如果点击的节点是已挂载上的节点，还要显示paf信息
        if (chrId !== ''){
          for (let nodePafInfoList of dealPafResult.get('allScaffoldedNodeInfoListMap').get(chrId)) {
            if (nodePafInfoList[0] === e.node){
              for (let i = 0; i < nodePafInfoList.length-1; i++) {
                let temp = {
                  pafFiled:pafFiled[i],
                  pafFiledValue:nodePafInfoList[i]
                }
                pafInfoOfClickedNode.push(temp)
              }
            }
          }
        }

      }
    })


    /**
     * 实现鼠标左键拖拽节点功能
     */
    sigma.on("downNode",(e) => {//鼠标按下时（不论左键还是右键）触发downNode事件
      if (e.event.original.button === 0){//0表示左键，1表示中键，2表示右键
        isDragging = true
      }
      mouseSelectedNode = e.node
    })
    sigma.getMouseCaptor().on("mousemove",(e) => {//鼠标移动时触发mousemove事件
      if (e.original.button === 0){
        if (isDragging && mouseSelectedNode){
          e.preventSigmaDefault()
          e.original.preventDefault();
          e.original.stopPropagation();

          let pos = sigma.viewportToGraph(e)
          graph.updateNodeAttribute(mouseSelectedNode,'x',n => pos.x)
          graph.updateNodeAttribute(mouseSelectedNode,'y',n => pos.y)
        }
      }
    })
    sigma.on("upNode",(e) => {//鼠标放开节点时触发upNode事件
      mouseSelectedNode = null
      isDragging = false
    })

    /**
     * 鼠标悬停到节点上时显示节点和边的标签以及突出显示与节点相邻的节点和边
     */
    sigma.on("enterNode",(e) => {
      //鼠标悬停到节点上时设置相邻节点的属性
      let label = null
      if (graph.getNodeAttribute(e.node,'position') === undefined){
        label = graph.getNodeAttribute(e.node,'nodeId')+'  '+graph.getNodeAttribute(e.node,'len')
      }else {
        label = graph.getNodeAttribute(e.node,'nodeId')+'  '+graph.getNodeAttribute(e.node,'len') + '  ' +graph.getNodeAttribute(e.node,'position')
      }
      graph.setNodeAttribute(e.node,'label',label)
      graph.forEachNeighbor(e.node,(neighbor, attributes) =>{
        let neighborLabel = null
        if (attributes.position === undefined){
          neighborLabel = attributes.nodeId + '  '+ attributes.len
        }else {
          neighborLabel = attributes.nodeId + '  '+ attributes.len + '  ' + attributes.position
        }
        graph.mergeNodeAttributes(neighbor,{label:neighborLabel,size:attributes.size+0.3})
      })
      //鼠标悬停到节点上时设置相邻边的属性
      graph.forEachEdge(e.node,(edge,attributes) =>{
        graph.mergeEdgeAttributes(edge,{size:edgeDefaultWidth+0.3})
        // console.log(attributes.edgeInfo)
        // console.log(attributes.depth)
      })
    })
    sigma.on("leaveNode",(e) =>{
      graph.removeNodeAttribute(e.node,'label')
      //鼠标离开节点时恢复相邻节点的属性
      graph.forEachNeighbor(e.node,(neighbor, attributes) =>{
        graph.updateNodeAttribute(neighbor,'size',n => graph.getNodeAttribute(neighbor,'originalSize'))
        graph.removeNodeAttribute(neighbor,'label')
      })
      //鼠标离开节点时恢复相邻边的属性
      graph.forEachEdge(e.node,(edge) =>{
        graph.updateEdgeAttribute(edge,'size',n => edgeDefaultWidth)
      })
    })
  })

  /**
  * @Description: 查询和定位节点
  * @Param:
  * @return:
  * @Author: tian
  * @Date: 2024/3/20
  */
  let queryIds = ref('') //接受输入的节点ID，用于查找和定位节点
  let queryIdsArr = []
  let preQueryIdColor = [] //记录前一次查询过的节点的颜色
  function queryNodes(){
    if(!isUploadGraph){
      ElMessage.warning('Please upload the .gfa file first!')
      return;
    }
    if (queryIds.value === ''){
      ElMessage.warning('Please input node id!')
      return;
    }
    if (queryIdsArr.length > 0 ){
      for (let i = 0; i < queryIdsArr.length; i++) {
        if (graph.hasNode(queryIdsArr[i])){
          graph.setNodeAttribute(queryIdsArr[i],'color',preQueryIdColor[i])
        }
      }
    }
    queryIdsArr.splice(0,queryIdsArr.length)
    queryIdsArr = queryIds.value.split(',').map(id => id.trim())
    let camera = sigma.getCamera()
    let queryNodeXAxis = []
    let queryNodeYAxis = []
    for (let id in queryIdsArr) {
      if (graph.hasNode(queryIdsArr[id])){
        queryNodeXAxis.push(graph.getNodeAttribute(queryIdsArr[id],'x'))
        queryNodeYAxis.push(graph.getNodeAttribute(queryIdsArr[id],'y'))
        preQueryIdColor.push(graph.getNodeAttribute(queryIdsArr[id],'color'))
        graph.setNodeAttribute(queryIdsArr[id], 'color', '#16be2c')
      }else{
        ElMessage.warning(queryIdsArr[id]+' does not exist!')
      }

    }
    if (queryIdsArr.length > 2){
      queryNodeXAxis.sort((a,b) => a-b)
      queryNodeYAxis.sort((a,b) => a-b)
      camera.x = (queryNodeXAxis[Math.floor(queryNodeXAxis.length/2)] - xAxisMin)/(xAxisMax - xAxisMin)
      camera.y = (queryNodeYAxis[Math.floor(queryNodeXAxis.length/2)] - yAxisMin)/(yAxisMax - yAxisMin)
      // camera.ratio = (queryNodeXAxis[queryNodeXAxis.length-1]-queryNodeXAxis[0])/(xAxisMax-xAxisMin)
      camera.ratio = 1.3
    }else {
      camera.x = (graph.getNodeAttribute(queryIdsArr[0], 'x')-xAxisMin)/(xAxisMax-xAxisMin)
      camera.y = (graph.getNodeAttribute(queryIdsArr[0], 'y')-yAxisMin)/(yAxisMax-yAxisMin)
      camera.ratio = 0.6
    }
    sigma.refresh()
  }

  /**
   * 普通菜单中的各个功能实现，根据传入的item的参数的值实现不同的功能
   * @param item
   */
  let stageMenuList = ref(['选项1','选项2'])
  function stageMenuFunction(item){
    console.log(item)
    document.getElementById('stageMenu').style.display = `none`
  }

  /**
   * 节点菜单中的各个功能实现，根据传入的item的参数的值实现不同的功能
   */
  let nodeMenuList = reactive(['show cover degree','show Hi-C','add to start','add to end'])
  let preNodeColorMap = new Map()
  let preClickedNodeId = null
  let preClickedNodeColor = null
  function nodeMenuFunction(item){
    if(item === 'show cover degree'){//显示覆盖度信号
      if (!isUploadOntMapGraphResult){
        ElMessage.warning('Please upload the result(.gaf) of ont reads mapping utg assembly graph!')
        return
      }
      if (preNodeColorMap.size != 0){//恢复节点原来的颜色
        for (let [nodeId, color] of preNodeColorMap) {
          if (graph.hasNode(nodeId)){
            graph.setNodeAttribute(nodeId,'color',color)
          }
        }
        preNodeColorMap.clear()//用完集合后清除集合总的元素
      }
      if (preClickedNodeColor !== null){//恢复被点击节点原来的颜色
        graph.setNodeAttribute(preClickedNodeId,'color',preClickedNodeColor)
      }
      //显示覆盖度信号
      let map = interNodeSemaphoreDepth.get(clickedNodeId)
      console.log('目标节点相关信号：')
      console.log(map)
      for (let [nodeId, semaphore] of map) {
        if (graph.hasNode(nodeId)){
          preNodeColorMap.set(nodeId,graph.getNodeAttribute(nodeId,'color'))//记录节点原来的颜色
          // graph.setNodeAttribute(nodeId,'color',numberToHexColorForNodeForDepth(semaphore))
        }
      }
      for (let [nodeId, semaphore] of map) {
        if (graph.hasNode(nodeId)){
          // preNodeColorMap.set(nodeId,graph.getNodeAttribute(nodeId,'color'))//记录节点原来的颜色
          graph.setNodeAttribute(nodeId,'color',numberToHexColorForNodeForDepth(semaphore))
        }
      }
      preClickedNodeColor = graph.getNodeAttribute(clickedNodeId,'color')
      preClickedNodeId = clickedNodeId
      graph.setNodeAttribute(clickedNodeId,'color','#dcad00')
      if (nodeMenuList.indexOf('recovery') === -1){
        nodeMenuList.push('recovery')
      }
      document.getElementById('nodeMenu').style.display = `none`

    } else if (item === 'show Hi-C'){//显示Hi-C信号
      if (!isUploadHic){
        ElMessage.warning('Please upload Hi-C file')
        return
      }
      if (preNodeColorMap.size != 0){//恢复节点原来的颜色
        for (let [nodeId, color] of preNodeColorMap) {
          if (graph.hasNode(nodeId)){
            graph.setNodeAttribute(nodeId,'color',color)
          }
        }
        preNodeColorMap.clear()//用完集合后清除集合总的元素
      }
      if (preClickedNodeColor !== null){
        graph.setNodeAttribute(preClickedNodeId,'color',preClickedNodeColor)
      }
      console.log('显示Hi-C信号')
      if (hicResult.has(clickedNodeId)){
        let aboutNodeInfoList = hicResult.get(clickedNodeId)
        console.log(aboutNodeInfoList)
        for (let aboutNodeInfoListElement of aboutNodeInfoList) {
          if (graph.hasNode(aboutNodeInfoListElement[0])){
            preNodeColorMap.set(aboutNodeInfoListElement[0],graph.getNodeAttribute(aboutNodeInfoListElement[0],'color'))//记录节点原来的颜色
            // graph.setNodeAttribute(aboutNodeInfoListElement[0],'color',numberToHexColorForNodeForHic(parseInt(aboutNodeInfoListElement[1])))
          }
        }
        for (let aboutNodeInfoListElement of aboutNodeInfoList) {
          if (graph.hasNode(aboutNodeInfoListElement[0])){
            graph.setNodeAttribute(aboutNodeInfoListElement[0],'color',numberToHexColorForNodeForHic(parseInt(aboutNodeInfoListElement[1])))
          }
        }
      }
      preClickedNodeColor = graph.getNodeAttribute(clickedNodeId,'color')
      preClickedNodeId = clickedNodeId
      graph.setNodeAttribute(clickedNodeId,'color','#dcad00')
      if (nodeMenuList.indexOf('recovery') === -1){
        nodeMenuList.push('recovery')
      }
      document.getElementById('nodeMenu').style.display = `none`

    } else if(item === 'recovery'){//恢复节点原来的颜色
      if (preNodeColorMap.size != 0){
        for (let [nodeId, color] of preNodeColorMap) {
          if (graph.hasNode(nodeId)){
            graph.setNodeAttribute(nodeId,'color',color)
          }
        }
        preNodeColorMap.clear()//用完集合后清除集合总的元素

      }
      if (nodeMenuList.indexOf('recovery') !== -1){
        nodeMenuList.splice(nodeMenuList.indexOf('recovery'),1)
      }
      if (preClickedNodeColor !== null){
        graph.setNodeAttribute(preClickedNodeId,'color',preClickedNodeColor)
      }
      document.getElementById('nodeMenu').style.display = `none`
    } else if(item === 'add to start'){
      startNodeIdOfGap.value = clickedNodeId
      ElMessage.success("Added successfully!")
      document.getElementById('nodeMenu').style.display = `none`
    } else if(item === 'add to end'){
      endNodeIdOfGap.value = clickedNodeId
      ElMessage.success("Added successfully!")
      document.getElementById('nodeMenu').style.display = `none`
    }else {
      //添加节点到用户指定的类中
      //   let classId = item.substring(12)
      //   let tempArr = classes.get(classId)
      //   if (tempArr.includes(clickedNodeId)){
      //     ElMessage.warning("You have already added this node!")
      //   }else{
      //     tempArr.push(clickedNodeId)
      //   }
      //   classes.set(classId,tempArr)
      //   ElMessage.success("Added successfully!")
      //   document.getElementById('nodeMenu').style.display = `none`
      }
  }

  /**
   * 用户创建类
   */
  let className = ref('')//接受用户输入的类名
  let classes = reactive(new Map())//用户每创建一个类，就往classes中添加一对key-value，其中key是用户创建的类名，值为一个列表，列表中是用户添加的节点
  function createClass(){
    if (className.value != null && className.value != ''){
      if(classes.has(className.value)){//不能重复创建
        ElMessage.error('Duplicate class name!')
      }else{
        classes.set(className.value,[])
      }
      nodeMenuList.push('add node to '+ className.value)//创建成功后需要将类名添加到节点菜单的选项中
      className.value = ''
      ElMessage.success('Created successfully!')
    }else{
      ElMessage.warning('Please input class name!')
    }
  }

  /**
   * 删除类中的节点
   * @param nodeId
   */
  function deleteNodeId(name, nodeId){
    let list = classes.get(name)
    list.splice(list.indexOf(nodeId),1)
  }

  /**
   * 删除用户创建的类
   * @param name
   */
  function deleteClass(name){
    classes.delete(name)
    nodeMenuList.splice(nodeMenuList.indexOf('add node to '+ name),1)
    ElMessage.success("Deleted successfully!")
  }

  /**
   * 用户分类完成后点击gfa后，生成GFA文件
   * @param name
   */
  async function generateGFAFile(name){
    //根据类名拿到存储节点的列表，根据列表中的id对文件进行操作
    let targetNodeIdList = Array.from(classes.get(name))
    loading = ElLoading.service({
      lock: true,
      text: "Generating",
      background: "rgba(122,122,122,0.35)"
    })
    let result = await window.electronApi.ipcRenderer.invoke('generateGFAFile',{
      className: name,
      nodeIdList: targetNodeIdList
    })
    if (result){
      loading.close()
      ElMessage.success('Successfully generated GFA file!')
    }else{
      loading.close()
      ElMessage.error('Failed to generate GFA file!')
    }
  }


  /**
   * 将用户添加的gap信息放到列表中，以便于后续发给主进程进行补gap操作
   */
  let startNodeIdOfGap = ref('')
  watch(startNodeIdOfGap,(newValue,oldValue)=>{
    if(newValue != ''){
      graph.setNodeAttribute(newValue,"type","bordered")
      graph.setNodeAttribute(newValue,"borderColor","red")
      graph.setNodeAttribute(newValue,"borderSize",0.2)
    }
    if(oldValue != ''){
      graph.removeNodeAttribute(oldValue,"type")
      graph.removeNodeAttribute(oldValue,"borderColor")
      graph.removeNodeAttribute(oldValue,"borderSize")
    }
  })
  let endNodeIdOfGap = ref('')
  watch(endNodeIdOfGap,(newValue,oldValue)=>{
    if(newValue != ''){
      graph.setNodeAttribute(newValue,"type","bordered")
      graph.setNodeAttribute(newValue,"borderColor","red")
      graph.setNodeAttribute(newValue,"borderSize",0.2)
    }
    if(oldValue != ''){
      graph.removeNodeAttribute(oldValue,"type")
      graph.removeNodeAttribute(oldValue,"borderColor")
      graph.removeNodeAttribute(oldValue,"borderSize")
    }
  })
  let chrId = ''//在选择染色体时会给chrId赋值
  let nodeIdListOfFillGap = reactive([])
  let fillGapArgList = []
  function addGapInfo(){
    if (startNodeIdOfGap.value ===''){
      ElMessage.warning('start node id is null!')
      return
    }
    if (endNodeIdOfGap.value ===''){
      ElMessage.warning('end node id is null!')
      return;
    }
    if(dealPafResult.get('allScaffoldedNodeInfoListMap').get(chrId) == null){
      ElMessage.error('Please select one chromosome firstly!')
      return;
    }
    let temp = []
    for (let nodePafInfo of dealPafResult.get('allScaffoldedNodeInfoListMap').get(chrId)) {
      if (nodePafInfo[0] === startNodeIdOfGap.value){
        temp.push(nodePafInfo)
      }
      if (nodePafInfo[0] === endNodeIdOfGap.value){
        temp.push(nodePafInfo)
      }
    }
    if(temp[0][0] !== startNodeIdOfGap.value){
      ElMessage.warning('Please input correct start node!')
      return
    }
    if(temp[1][0] !== endNodeIdOfGap.value){
      ElMessage.warning('Please input correct end node!')
      return
    }
    temp.push(Array.from(nodeIdListOfFillGap))
    fillGapArgList.push(temp)
    console.log(fillGapArgList)
    ElMessage.success('Add gap info successfully!')
    startNodeIdOfGap.value = ''
    endNodeIdOfGap.value = ''
    for (let nodeIdListOfFillGapKey of nodeIdListOfFillGap) {
      graph.removeNodeAttribute(nodeIdListOfFillGapKey,"type")
      graph.removeNodeAttribute(nodeIdListOfFillGapKey,"borderColor")
      graph.removeNodeAttribute(nodeIdListOfFillGapKey,"borderSize")
    }
    nodeIdListOfFillGap.splice(0,nodeIdListOfFillGap.length)
  }

  /**
   * 填补gap
   */
  async function fillGapFun(){
    if(!isUploadPaf){
      ElMessage.warning('Please upload the .paf file first!')
      return
    }
    if (chrId.value===''){
      ElMessage.warning('Please select a chromosome to fill gap!')
      return;
    }
    if(fillGapArgList.length === 0){
      ElMessage.error('Please add a gap info!')
      return;
    }
    loading = ElLoading.service({
      lock: true,
      text: "Generating",
      background: "rgba(122,122,122,0.35)"
    })

    let result = await fillGap()
    console.log(result)
    if (result.result){
      fillGapArgList.splice(0,fillGapArgList.length)
      loading.close()
      ElMessage.success(result.message)
    }else {
      loading.close()
      ElMessage.error(result.message)
    }
  }

  /**
   * 删除补gap列表中的节点
   */
  function deleteGapNodeId(nodeId){
    graph.removeNodeAttribute(nodeId,"borderSize")
    graph.removeNodeAttribute(nodeId,"borderColor")
    graph.removeNodeAttribute(nodeId,"type")
    nodeIdListOfFillGap.splice(nodeIdListOfFillGap.indexOf(nodeId),1)
  }

  async function fillGap(){
    let result = await window.electronApi.ipcRenderer.invoke('fillGap',{
      fillGapArg:Array.from(fillGapArgList)
    })
    return result
  }

  /**
   * 分型
   * @returns {Promise<void>}
   */
  async function mergerSequenceFun(){
    if(!isUploadPaf){
      ElMessage.warning('Please upload the .paf file first!')
      return

    }
    if (startNodeIdOfGap.value ===''){
      ElMessage.warning('start node id is null')
      return
    }
    if (endNodeIdOfGap.value ===''){
      ElMessage.warning('end node id is null')
      return;
    }
    if (chrId.value===''){
      ElMessage.warning('Please select a chromosome to merger sequence!')
      return;
    }
    loading = ElLoading.service({
      lock: true,
      text: "Generating",
      background: "rgba(122,122,122,0.35)"
    })
    let result = await mergerSequence()
    if (result.result){
      startNodeIdOfGap.value = ''
      endNodeIdOfGap.value = ''
      for (let nodeIdListOfFillGapKey of nodeIdListOfFillGap) {
        graph.removeNodeAttribute(nodeIdListOfFillGapKey,"type")
        graph.removeNodeAttribute(nodeIdListOfFillGapKey,"borderColor")
        graph.removeNodeAttribute(nodeIdListOfFillGapKey,"borderSize")
      }
      nodeIdListOfFillGap.splice(0,nodeIdListOfFillGap.length)
      loading.close()
      ElMessage.success(result.message)
    }else {
      loading.close()
      ElMessage.error(result.message)
    }
  }

  async function mergerSequence(){
    let result = await window.electronApi.ipcRenderer.invoke('mergerSequence',{
      startNodeIdOfGap:startNodeIdOfGap.value,
      endNodeIdOfGap:endNodeIdOfGap.value,
      chrId:chrId,
      nodeIdListOfFillGap:Array.from(nodeIdListOfFillGap)
    })
    return result
  }

  /**
   * 上传scaffold文件
   */
  async function uploadScaffoldFile(){
    if(!isUploadGraph){
      ElMessage.warning("Please upload the .gfa file first!")
      return
    }
    loading = ElLoading.service({
      lock: true,
      text: "Desperately loading",
      background: "rgba(122,122,122,0.35)"
    })
    let result = await window.electronApi.ipcRenderer.invoke('fa',{
      title: 'Please select the scaffold file',
      properties: ['openFile']
    })
    if (result == null){
      if (loading!=null){
        loading.close()
      }
      ElMessage.warning("Please select one .fa file!")
    }else if(typeof result === "string"){
      if (loading!=null){
        loading.close()
      }
      ElMessage.error("Please select one .fa file!")
    }else{
      isUploadScaffold = true
      chrIdList.splice(0,chrIdList.length)
      for (let chrId of result) {
        chrIdList.push(chrId)
      }
      if (loading!=null){
        loading.close()
      }
    }
  }

  /**
   * 上传utg比对到scaffold上的比对结果(使用minimap2比对得到的.paf文件)
   */
  let dealPafResult
  let chrIdList = reactive([])
  async function uploadUtgMappingScaffoldResult(){
    if(!isUploadScaffold){
      ElMessage.warning("Please upload the .fa file first!")
      return
    }
    loading = ElLoading.service({
      lock: true,
      text: "Desperately loading",
      background: "rgba(122,122,122,0.35)"
    })
    let uploadResult = await window.electronApi.ipcRenderer.invoke('paf',{
      title: 'Please select the map file',
      properties: ['openFile']
    })
    if (uploadResult == null){
      if (loading!=null){
        loading.close()
      }
      ElMessage.warning("Please select one .paf file!")
    }else if(typeof uploadResult === "string"){
      if (loading!=null){
        loading.close()
      }
      ElMessage.error("Please select one .paf file!")
    }else{
      isUploadPaf = true
      if (!isOptimize.value){//如果没有开启算法优化，需要清空needOptimizeChrIdList
        needOptimizeChrIdList.value.splice(0,needOptimizeChrIdList.value.length)
      }
      console.log(needOptimizeChrIdList.value)
      //paf文件上传成功后进行挂载操作
      dealPafResult = await window.electronApi.ipcRenderer.invoke('dealPaf',{
        needOptimizeChrIdList: Array.from(needOptimizeChrIdList.value)
      })
      // chrIdList.splice(0,chrIdList.length)
      // for (let chrId of Array.from(dealPafResult.get('allScaffoldedNodeInfoListMap').keys())) {
      //   chrIdList.push(chrId)
      // }
      for (let [chrId,indexListList] of dealPafResult.get('scaffoldsAllGaps')) {
        for (let indexList of indexListList) {
          let temp = {
            chrId:chrId,
            startIndex:indexList[0],
            endIndex:indexList[1]
          }
          scaffoldsAllGaps.push(temp)
        }
      }
      console.log(dealPafResult)
      if (loading!=null){
        loading.close()
      }
    }
  }

  watch(needOptimizeChrIdList,(val) => {
    if(val.length === 0){
      isCheckAllChrId.value = false
      indeterminate.value = false
    }else if(val.length === chrIdList.length ){
      isCheckAllChrId.value = true
      indeterminate.value = false
    }else{
      indeterminate.value = true
    }
  })
  /**
   * 选中所有的染色体ID
   */
  function selectAllChrId(state){
    indeterminate.value = false
    if(state){
      for (let chrIdListElement of chrIdList) {
        if(!needOptimizeChrIdList.value.includes(chrIdListElement)){
          needOptimizeChrIdList.value.push(chrIdListElement)
        }
      }
    }else{
      needOptimizeChrIdList.value.splice(0,needOptimizeChrIdList.value.length)
    }
  }

  /**
   * 上传Hi-C文件
   */
  let hicResult = new Map()
  async function uploadHic(){
    if(!isUploadGraph){
      ElMessage.warning("Please upload the .gfa file first!")
      return
    }
    loading = ElLoading.service({
      lock: true,
      text: "Desperately loading",
      background: "rgba(122,122,122,0.35)"
    })
    let compressData = await window.electronApi.ipcRenderer.invoke('hic',{
      title: 'Please select the hic file',
      properties: ['openFile']
    })
    if (compressData == null){
      if (loading!=null){
        loading.close()
      }
      ElMessage.warning("Please select one file!")
    }else if(typeof compressData === "string"){
      if (loading!=null){
        loading.close()
      }
      ElMessage.error("Please select one .txt file!")
    }else{
      for (let compressDataElement of compressData) {
        let tempMap = new Map(Object.entries(JSON.parse(pako.inflate(compressDataElement,{to: 'string'}))))
        for (let [key, value] of tempMap) {
          hicResult.set(key,value)
        }
      }
      console.log(hicResult)
      isUploadHic = true
      if (loading!=null){
        loading.close()
      }
    }
  }

  /**
   * 上传.agp文件
   * @returns {Promise<void>}
   */
  let chromosomeToUtg = new Map()
  async function uploadRagtagResult(){
    // if (!isUploadGraph){
    //   ElMessage.warning("Please upload the assembly graph!")
    //   return
    // }
    loading = ElLoading.service({
      lock: true,
      text: "Desperately loading",
      background: "rgba(122,122,122,0.35)"
    })
    chromosomeToUtg.clear()//清除上一次上传的数据
    ragtagResult = await window.electronApi.ipcRenderer.invoke('agp',{
      title: 'Please select the .agp file',
      properties: ['openFile']
    })
    if (ragtagResult == null){
      if (loading!=null){
        loading.close()
      }
      ElMessage.warning("Please select one file!")
    }else if(ragtagResult == 'suffix error'){
      if (loading!=null){
        loading.close()
      }
      ElMessage.error("Please select one .agp file!")
    }else{
      //处理文件
      dealAGPResult()
      isUploadRagtagResult = true
    }
  }
  //处理文件
  function dealAGPResult(){
    for (let ragtagResultElement of ragtagResult) {
      // let chromosomeId = ragtagResultElement[0].substring(0,ragtagResultElement[0].length-7)
      let chromosomeId = ragtagResultElement[0]
      if (chromosomeToUtg.has(chromosomeId)){
        let utgArr = chromosomeToUtg.get(chromosomeId)
        utgArr.push(ragtagResultElement[5])
        chromosomeToUtg.set(chromosomeId,utgArr)
      }else{
        chromosomeToUtg.set(chromosomeId,[ragtagResultElement[5]])
        chromosome.push({value:chromosomeId})
      }
    }
    console.log(chromosomeToUtg)
    console.log(chromosome)
    if (loading!=null){
      loading.close()
    }
  }



  /**
   * 上传GraphAlinger的比对文件（参考基因组比对到组装图上的结果）
   * @returns {Promise<void>}
   */
  async function uploadCompareResultAboutReference(){
    if (!isUploadGraph){
      ElMessage.warning("Please upload the assembly graph!")
      return
    }
    loading = ElLoading.service({
      lock: true,
      text: "Desperately loading",
      background: "rgba(122,122,122,0.35)"
    })
    chromosome.splice(0,chromosome.length)//清除上一次上传的文件的数据
    referenceMappingGraphResult = await window.electronApi.ipcRenderer.invoke('referenceMappingAssemblyGraph',{
      title: 'Please select the .gaf file of mapping the reference genome to the assembly graph',
      properties: ['openFile']
    })
    console.log('GAF render process')
    // console.log(result)
    if (referenceMappingGraphResult == null){
      if (loading!=null){
        loading.close()
      }
      ElMessage.warning("Please select one file!")
    }else if(referenceMappingGraphResult == 'suffix error'){
      if (loading!=null){
        loading.close()
      }
      ElMessage.error("Suffix error!")
    }else{
      filterReferenceMappingGraphResult()
      isUploadReferenceMapGraphResult = true
    }
  }

  /**
   * 上传比对文件（ont数据比对到组装图上的结果）
   * @returns {Promise<void>}
   */
  let startTime = 0
  let endTime = 0
  async function uploadCompareResultAboutOnt(){
    if (!isUploadGraph){
      ElMessage.warning("Please upload the .gfa file first!")
      return
    }
    loading = ElLoading.service({
      lock: true,
      text: "Desperately loading",
      background: "rgba(122,122,122,0.35)"
    })
    startTime = performance.now()
    let result = await window.electronApi.ipcRenderer.invoke('ontMappingAssemblyGraph',{
      title: 'Please select the .gaf file of mapping ONT data to the assembly graph',
      properties: ['openFile']
    })
    if (result == null){
      if (loading!=null){
        loading.close()
      }
      ElMessage.warning("Please select one file!")
    }else if(result == 'suffix error'){
      if (loading!=null){
        loading.close()
      }
      ElMessage.error("Suffix error!")
    }else{
      console.log('start read file-----1')
      await readOntMappingGraphResult(result)
      endTime = performance.now()
      let time = endTime - startTime
      console.log('耗时：'+ time)
    }
  }

  async function readOntMappingGraphResult(filePath){
    let result = await window.electronApi.ipcRenderer.invoke('readOntMappingGraphResult', {path: filePath})

    if (result.error){
      console.error("发生错误：", result.error);
      if (loading!=null){
        loading.close()
      }
      ElMessage.error("An error occurred while processing the .gaf file!")
      return
    }
    deepOfEdge = result.get('deep')
    interNodeSemaphoreDepth = result.get('signal')
    isUploadOntMapGraphResult = true
    await setDepthForEdge()
  }


  //过滤参数
  // let alignmentBlockLengthValue = 0
  // let mapQualityValue = 30
  // let NMValue = Number.MAX_VALUE
  // let ASValue = 0
  // let dvValue = 1
  // let idValue = 0
  //
  // /**
  //  * 对ont数据比对到组装图上的结果进行过滤
  //  */
  //
  // async function filterOntMappingGraphResult(ontMappingGraphResult){
  //   console.log('start read file-----3')
  //   let oneMappingResult = null
  //   if (ontMappingGraphResult.length > 0) {
  //     for (let i = ontMappingGraphResult.length - 1; i >= 0; i--) {
  //       oneMappingResult = ontMappingGraphResult[i]
  //       let alignmentBlockLength = parseInt(oneMappingResult[1])
  //       let mapQuality = parseInt(oneMappingResult[2])
  //       let NM = parseInt(oneMappingResult[3].split(':')[2])
  //       let AS = parseFloat(oneMappingResult[4].split(':')[2])
  //       let dv = parseFloat(oneMappingResult[5].split(':')[2])
  //       let id = parseFloat(oneMappingResult[6].split(':')[2])
  //       if (alignmentBlockLength >= alignmentBlockLengthValue && mapQuality >= mapQualityValue
  //           && NM <= NMValue && AS >= ASValue && dv <= dvValue && id >= idValue
  //       ){
  //         //计算路径深度
  //         await countDeepOfEdge(oneMappingResult)
  //       }
  //     }
  //   }
  //   // console.log(ontMappingGraphResult)
  //   console.log(deepOfEdge)
  // }
  //
  // /**
  //  * 统计边的深度
  //  * @param oneMappingResult
  //  */
  // function countDeepOfEdge(oneMappingResult){
  //   let arr = oneMappingResult[0].split(/(?=[<>])/)
  //   let node1 = null
  //   let node2 = null
  //   for (let i = 0; i < arr.length - 1; i++) {
  //     if (arr[i].substring(0,1) === '>'){
  //       node1 = arr[i].substring(1) + '+'
  //     }else {
  //       node1 = arr[i].substring(1) + '-'
  //     }
  //     if (arr[i+1].substring(0,1) === '>'){
  //       node2 = arr[i+1].substring(1) + '+'
  //     }else{
  //       node2 = arr[i+1].substring(1) + '-'
  //     }
  //     let key = node1 + '=' + node2
  //     if (key in deepOfEdge){
  //       deepOfEdge[key] = deepOfEdge[key]+1
  //     }else{
  //       deepOfEdge[key] = 1
  //     }
  //   }
  // }

  /**
   * 为边设置深度属性
   */
  function setDepthForEdge(){
    if (deepOfEdge){
      for (let [edge,depth] of deepOfEdge) {
        let arr = edge.split('=')
        graph.setEdgeAttribute(arr[0].substring(0,arr[0].length-1),arr[1].substring(0,arr[1].length-1),'depth',depth)
      }
    }
    if (loading!=null){
      loading.close()
    }
  }

  /**
   * 在整张图上根据深度显示不同深浅的路径
   */
  function showAllDepth(){
    if (!isUploadOntMapGraphResult){
      ElMessage.warning('Please upload the .gaf file first!')
      return
    }
    graph.forEachEdge((edge,attributes) => {
      let depth = graph.getEdgeAttribute(edge,'depth')
      let color = numberToHexColorForEdge(parseInt(depth))
      graph.setEdgeAttribute(edge,'color',color)
    })
    sigma.refresh()
  }

  /**
   * 对参考基因组比对到组装图上的结果进行过滤并获取路径
   */
  function filterReferenceMappingGraphResult(){
    let oneMappingResult = null
    if (referenceMappingGraphResult.length > 0) {
      for (let i = referenceMappingGraphResult.length - 1; i >= 0; i--) {
        oneMappingResult = referenceMappingGraphResult[i]
        let alignmentBlockLength = parseInt(oneMappingResult[10])
        let mapQuality = parseInt(oneMappingResult[11])
        let NM = parseInt(oneMappingResult[12].split(':')[2])
        let AS = parseFloat(oneMappingResult[13].split(':')[2])
        let dv = parseFloat(oneMappingResult[14].split(':')[2])
        let id = parseFloat(oneMappingResult[15].split(':')[2])
        if (alignmentBlockLength >= alignmentBlockLengthValue && mapQuality >= mapQualityValue
            && NM <= NMValue && AS >= ASValue && dv <= dvValue && id >= idValue
        ){
          getPath(oneMappingResult)
          // splitEdgeOfPath(oneMappingResult)
        }else {
          referenceMappingGraphResult.splice(i,1)
        }
      }
    }
    getChromosomeId()
  }

  /**
   * 从参考基因组比对到组装图上的比对结果中获取路径
   * @type {{}}
   */
  let pathOfReferenceMappingGraph = {}
  function getPath(oneMappingResult){
    if (oneMappingResult[0] in pathOfReferenceMappingGraph){
      pathOfReferenceMappingGraph[oneMappingResult[0]].push(oneMappingResult[5])
    }else{
      pathOfReferenceMappingGraph[oneMappingResult[0]] = [oneMappingResult[5]]
    }
  }

  /**
   * 获取染色体Id,将其放到下拉菜单中
   */
  function getChromosomeId(){
    let chromosomeIdArr = Object.keys(pathOfReferenceMappingGraph)
    chromosomeIdArr.sort()
    for (let index in chromosomeIdArr) {
      chromosome.push({value:chromosomeIdArr[index]})
    }
    if (loading!=null){
      loading.close()
    }
  }

  /**
   * 展示所有染色体
   */
  let chromosomeNodeColor = '#81CAD6'
  let chromosomeGapNodeColor = '#DC3E26'
  function showAllChromosome(){
    if (!isUploadPaf){
      ElMessage.warning("Please upload the .paf file first!")
      return
    }
    // if (!isUploadRagtagResult){
    //   ElMessage.warning('Please upload ragtag result!')
    //   return
    // }
    graph.forEachNode((node,attributes) => {
      graph.setNodeAttribute(node,'color',nodeSecondColor)
      graph.removeNodeAttribute(node,'position')
    })
    // for (let [chromosomeId,chromosomeUtg] of chromosomeToUtg) {
    //   for (let chromosomeUtgId of chromosomeUtg) {
    //     graph.setNodeAttribute(chromosomeUtgId,'color','#81CAD6')
    //   }
    // }
    let allScaffoldedNodeInfoListMap = dealPafResult.get('allScaffoldedNodeInfoListMap')
    let gapStartAndEndNodeInfoMap = dealPafResult.get('gapStartAndEndNodeInfoMap')
    for (let [chrId, nodeInfoList] of allScaffoldedNodeInfoListMap) {
      for (let i = 0; i < nodeInfoList.length; i++) {
        graph.setNodeAttribute(nodeInfoList[i][0],'color',chromosomeNodeColor)
        graph.setNodeAttribute(nodeInfoList[i][0],'position',nodeInfoList[i][12])
        if (i > 0) {
          if (graph.hasEdge(nodeInfoList[i][0], nodeInfoList[i - 1][0])) {
            graph.setEdgeAttribute(nodeInfoList[i][0], nodeInfoList[i - 1][0], 'color', chromosomeNodeColor)
          }
        }
      }
      let gapStartAndEndNodeInfoList = gapStartAndEndNodeInfoMap.get(chrId)
      if (!gapStartAndEndNodeInfoList){
        continue
      }
      for (let gapStartAndEndNodeInfo of gapStartAndEndNodeInfoList) {
        for (let i = 0; i < gapStartAndEndNodeInfo.length; i++) {
          graph.setNodeAttribute(gapStartAndEndNodeInfo[i][0],'color',chromosomeGapNodeColor)
          if(i > 0){
            if (graph.hasEdge(gapStartAndEndNodeInfo[i][0], gapStartAndEndNodeInfo[i - 1][0])) {
              graph.setEdgeAttribute(gapStartAndEndNodeInfo[i][0], gapStartAndEndNodeInfo[i - 1][0], 'color', nodeSecondColor)
            }
          }
        }
      }
    }
  }

  /**
   * 根据染色体ID展示一条染色体
   * @param chromosomeId
   */
  function showOneChromosomeById(chromosomeId){
    chrId = chromosomeId
    graph.forEachNode((node,attributes) => {
      graph.setNodeAttribute(node,'color',nodeSecondColor)
      graph.removeNodeAttribute(node,'position')
    })
    graph.forEachEdge((edge,attributes) => {
      graph.setEdgeAttribute(edge,'color',nodeSecondColor)
    })
    //根据agp文件显示染色体
    // for (let chromosomeUtgId of chromosomeToUtg.get(chromosomeId)) {
    //   graph.setNodeAttribute(chromosomeUtgId,'color','#ff0000')
    // }
    //根据paf处理结果显示文件
    let allScaffoldedNodeInfoListMap = dealPafResult.get('allScaffoldedNodeInfoListMap')
    let gapStartAndEndNodeInfoMap = dealPafResult.get('gapStartAndEndNodeInfoMap')
    let oneScaffoldedNodeInfoList = allScaffoldedNodeInfoListMap.get(chromosomeId)//获取挂载结果
    let gapStartAndEndNodeInfoList = gapStartAndEndNodeInfoMap.get(chromosomeId)//获取染色体中各个gap的开始和结束节点
    for (let i = 0; i < oneScaffoldedNodeInfoList.length; i++) {
      graph.setNodeAttribute(oneScaffoldedNodeInfoList[i][0],'color',chromosomeNodeColor)
      graph.setNodeAttribute(oneScaffoldedNodeInfoList[i][0],'position',oneScaffoldedNodeInfoList[i][12])
      if (i > 0) {
        if (graph.hasEdge(oneScaffoldedNodeInfoList[i][0], oneScaffoldedNodeInfoList[i - 1][0])) {
          graph.setEdgeAttribute(oneScaffoldedNodeInfoList[i][0], oneScaffoldedNodeInfoList[i - 1][0], 'color', chromosomeNodeColor)
        }
      }
    }
    // if(chromosomeId == "chr10"){
    //   graph.setNodeAttribute("utg000178l",'color',chromosomeGapNodeColor)
    //   graph.setNodeAttribute("utg000057l",'color',chromosomeGapNodeColor)
    //   graph.setNodeAttribute("utg000914l",'color',nodeSecondColor)
    //   graph.setNodeAttribute("utg000299l",'color',nodeSecondColor)
    //   graph.setNodeAttribute("utg000560l",'color',nodeSecondColor)
    //   graph.setEdgeAttribute("utg000178l","utg000914l",'color',nodeSecondColor)
    //   graph.setEdgeAttribute("utg000914l","utg000299l",'color',nodeSecondColor)
    //   graph.setEdgeAttribute("utg000299l","utg000560l",'color',nodeSecondColor)
    //   graph.setEdgeAttribute("utg000560l","utg000057l",'color',nodeSecondColor)
    // }

    if (!gapStartAndEndNodeInfoList){
      return
    }
    for (let gapStartAndEndNodeInfo of gapStartAndEndNodeInfoList) {
      for (let gapStartAndEndNode of gapStartAndEndNodeInfo) {
        graph.setNodeAttribute(gapStartAndEndNode[0],'color',chromosomeGapNodeColor)
      }
      for (let i = 0; i < gapStartAndEndNodeInfo.length; i++) {
        graph.setNodeAttribute(gapStartAndEndNodeInfo[i][0],'color',chromosomeGapNodeColor)
        if (i > 0){
          if (graph.hasEdge(gapStartAndEndNodeInfo[i][0], gapStartAndEndNodeInfo[i - 1][0])) {
            graph.setEdgeAttribute(gapStartAndEndNodeInfo[i][0], gapStartAndEndNodeInfo[i - 1][0], 'color', nodeSecondColor)
          }
        }
      }
    }
  }


  /**
   * 根据染色体Id显示一条染色体的路径
   * @param chromosomeId
   * @param result
   */
  let lastChromosomeId = null
  function showOnePathOfChromosome(chromosomeId){
    // if (lastChromosomeId != null){
    //   alterNodeAndEdgeAttributeOfPath(lastChromosomeId,'color','#f5f5f5')
    // }
    graph.forEachNode((node,attributes) => {
      graph.setNodeAttribute(node,'color',nodeSecondColor)
      graph.removeNodeAttribute(node,'position')
    })
    graph.forEachEdge((edge,attributes) => {
      graph.setEdgeAttribute(edge,'color',nodeSecondColor)
    })
    lastChromosomeId = chromosomeId
    if (isUploadOntMapGraphResult){
      //如果上传了Ont比对到组装图上的结果，根据边的深度显示不同深浅的红色
      let oneChromosomePathArr = pathOfReferenceMappingGraph[chromosomeId]
      for (let i = 0; i < oneChromosomePathArr.length; i++) {
        let pathNodeArr = getNodeOfPath(oneChromosomePathArr[i])
        for (let j = 0; j < pathNodeArr.length - 1; j++) {
          let depth = graph.getEdgeAttribute(pathNodeArr[j].substring(1),pathNodeArr[j+1].substring(1),'depth')
          let color = numberToHexColorForEdge(parseInt(depth))
          graph.setNodeAttribute(pathNodeArr[j].substring(1),'color',color)
          graph.setNodeAttribute(pathNodeArr[j].substring(1),'position',j+1)
          if(j === pathNodeArr.length - 2){
            graph.setNodeAttribute(pathNodeArr[j+1].substring(1),'color',color)
            graph.setNodeAttribute(pathNodeArr[j+1].substring(1),'position',j+2)
          }
          graph.setEdgeAttribute(pathNodeArr[j].substring(1),pathNodeArr[j+1].substring(1),'color',color)
        }
      }
      sigma.refresh()
    }else{
      //如果未上传Ont比对到组装图上的结果，路径用同一个颜色显示
      alterNodeAndEdgeAttributeOfPath(chromosomeId,'color','#ff0000')
    }
  }
  function alterNodeAndEdgeAttributeOfPath(chromosomeId,attributeName,attributeValue){
    let oneChromosomePathArr = pathOfReferenceMappingGraph[chromosomeId]
    for (let i = 0; i < oneChromosomePathArr.length; i++) {
      let pathNodeArr = getNodeOfPath(oneChromosomePathArr[i])
      for (let j = 0; j < pathNodeArr.length; j++) {
        addAttributeForNode(pathNodeArr[j].substring(1),attributeName,attributeValue)
        addAttributeForNode(pathNodeArr[j].substring(1),'position',j+1)
        if (j+1 < pathNodeArr.length){
          addAttributeForEdge(pathNodeArr[j].substring(1),pathNodeArr[j+1].substring(1),attributeName,attributeValue)
        }
      }
    }
    sigma.refresh()
  }
  function getNodeOfPath(path){
    return path.split(/(?=[<>])/)
  }
  function addAttributeForNode(nodeId,attributeName,attributeValue){
    graph.setNodeAttribute(nodeId,attributeName,attributeValue)
  }
  function addAttributeForEdge(source,target,attributeName,attributeValue){
    graph.setEdgeAttribute(source,target,attributeName,attributeValue)
  }

  /**
   * 根据数字的大小生成不同深浅的红色（十六进制格式）,这是为边生成颜色的
   * @param number
   */
  function numberToHexColorForEdge(number){
    let r = Math.min(number, 255);
    let g = 0
    let b = 0
    if (number == 0){
      return nodeSecondColor
    }else if (number <= 10){
      r = 255
      g = 235 - number * 3
      b = 235 - number * 3
    }else if ( number <= 200 ){
      r = 255
      g = 200 - number
      b = 200 - number
    }else if (number <= 250){
      r = 200
      g = 0
      b = 0
    }else{
      r = 150
      g = 0
      b = 0
    }
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * 根据数字的大小生成不同深浅的蓝色（十六进制格式）,这是为节点生成颜色的，并且用于深度信号
   * @param number
   */
  function numberToHexColorForNodeForDepth(number){
    let r = 0
    let g = 0
    let b = Math.min(number, 255);
    if (number == 0){
      return nodeSecondColor
    }else if (number <= 10){
      r = 235 - number * 3
      g = 235 - number * 3
      b = 255
    }else if(number <= 200){
      r = 200 - number
      g = 200 - number
      b = 255
    }else{
      r = 0
      g = 0
      b = 170
    }
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * 根据数字的大小生成不同深浅的蓝色（十六进制格式）,这是为节点生成颜色的，并且用于Hi-C信号
   * @param number
   */
  function numberToHexColorForNodeForHic(number){
    let r = 0
    let g = 0
    let b = Math.min(number, 255);
    if (number <= 5){
      r = 235 - number * 3
      g = 235 - number * 3
      b = 255
    }else if(number <= 220){
      r = 220 - number
      g = 220 - number
      b = 255
    }else if(number <= 500){
      r = 0
      g = 0
      b = 225
    }else if(number <= 1000){
      r = 0
      g = 0
      b = 195
    }else if(number <= 2000){
      r = 0
      g = 0
      b = 165
    }else{
      r = 0
      g = 0
      b = 135
    }
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }


  /**
   * 上传GFA文件
   * @returns {Promise<void>}
   */
  async function uploadGFA(){
    loading = ElLoading.service({
      lock: true,
      text: "Desperately loading",
      background: "rgba(122,122,122,0.35)"
    })
    let result = await window.electronApi.ipcRenderer.invoke('assemblyGraph',{
      title: 'Please select the assembly graph file with a .gfa extension',
      properties: ['openFile']
    })

    // console.log('GFA render process')
    // console.log(result)
    if (result == null){
      loading.close()
      ElMessage.warning("Please select one file!")
    }else if(result == 'suffix error'){
      loading.close()
      ElMessage.error('Suffix error!')
    }else{
      //每次上传文件后都要清除上次已加载的数据
      graph.clear()
      if (ogdfNodes.length > 0) {
        ogdfNodes.splice(0, ogdfNodes.length)
      }
      if (ogdfEdges.length > 0) {
        ogdfEdges.splice(0, ogdfEdges.length)
      }
      //调用处理文件的函数
      dealGFAFile(result)
      //每次上传组装图后，isUploadGraph需要设为true，其他的值要设为false
      isUploadGraph = true
      isUploadOntMapGraphResult = false
      isUploadScaffold = false
      isUploadPaf = false
      isUploadHic = false
      //每次上传成功后，一些值需要设为初始值
      chrIdList.splice(0,chrIdList.length)
      scaffoldsAllGaps.splice(0,scaffoldsAllGaps.length)
      value.value = ''
      needOptimizeChrIdList.value.splice(0,needOptimizeChrIdList.value.length)
      leftClickedNodeId.value = ''
      edgeInfoOfClickedNode.splice(0,edgeInfoOfClickedNode.length)
      pafInfoOfClickedNode.splice(0,pafInfoOfClickedNode.length)
      queryIds.value = ''
      queryIdsArr = []
      preQueryIdColor = []
      startNodeIdOfGap.value = ''
      endNodeIdOfGap.value = ''
      chrId = ''
      nodeIdListOfFillGap.splice(0,nodeIdListOfFillGap.length)
      fillGapArgList = []
      leftClickedNodeId.value = ''
      hicResult = new Map()
      if (nodeMenuList.indexOf('recovery') !== -1){
        nodeMenuList.splice(nodeMenuList.indexOf('recovery'),1)
      }
      preNodeColorMap = new Map()
      preClickedNodeId = null
      preClickedNodeColor = null
    }
  }

  /**
   * 处理GFA文件的内容，给graph添加节点和边
   * @param result
   */
  function dealGFAFile(result){
    if (result == 'Please select one GFA file!'){
      console.log('Please select one GFA file!')
    }else if(result == 'Please upload GFA file!'){
      alert('Please upload GFA file!')
    }else {
      console.log(result)
      let nodeCount = 0
      let edgeCount = 0
      for (let i = 0; i < Object.keys(result.node).length; i++) {
        let nodeKey = 'node'+i
        let oneNodeInfo = result.node[nodeKey].split(':')
        let contigLength = parseInt(oneNodeInfo[1])
        let nodeSize = 0;
        if (contigLength > 0 && contigLength <= 100000){
          nodeSize = 2
        }else if(contigLength > 100000 && contigLength <= 1000000){
          nodeSize = 3
        }else if(contigLength > 1000000 && contigLength <= 5000000){
          nodeSize = 5
        }else if(contigLength > 5000000 && contigLength <= 10000000){
          nodeSize = 7
        }else {
          nodeSize = 9
        }
        //ogdfNodes是OGDF的输入数据
        ogdfNodes.push({id:oneNodeInfo[0],width:nodeSize,height:nodeSize})
        //使用graphology
        nodeCount = nodeCount + 1
        graph.addNode(oneNodeInfo[0],{x:0,y:0,size:nodeSize,color:nodeDefaultColor,originalSize:nodeSize,nodeId:oneNodeInfo[0],len:contigLength,nodeInfo:oneNodeInfo[0]+'  len:'+contigLength})
      }
      for (let j = 0; j < Object.keys(result.edge).length; j++) {
        let edgeKey = 'edge'+j
        let oneEdgeInfo = result.edge[edgeKey].split(':')
        //ogdfEdges是OGDF的输入数据
        ogdfEdges.push({source:oneEdgeInfo[0],target:oneEdgeInfo[2]})
        //使用graphology
        edgeCount = edgeCount + 1
        if (graph.hasNode(oneEdgeInfo[0]) && graph.hasNode(oneEdgeInfo[2])){//如果存在这两个节点，再添加边
          if(graph.hasEdge(oneEdgeInfo[0],oneEdgeInfo[2])){
            //已经存在这条边，则更新这条边的edgeInfo属性
            graph.updateEdgeAttribute(oneEdgeInfo[0],oneEdgeInfo[2],'edgeInfo',info => info+';'+oneEdgeInfo[0]+oneEdgeInfo[1]+'>'+oneEdgeInfo[2]+oneEdgeInfo[3])
          }else{
            //不存在这条边，就添加这条边
            graph.addEdge(oneEdgeInfo[0],oneEdgeInfo[2],{id:oneEdgeInfo[0]+'>'+oneEdgeInfo[2],color: nodeDefaultColor,size: edgeDefaultWidth,depth:0,edgeInfo:oneEdgeInfo[0]+oneEdgeInfo[1]+'>'+oneEdgeInfo[2]+oneEdgeInfo[3]})
          }
        }

        //将每条边都加入deepOfEdge对象中用于统计边的深度
        // let key = oneEdgeInfo[1] + oneEdgeInfo[2] +'=' + oneEdgeInfo[3] + oneEdgeInfo[4]
        // if(oneEdgeInfo[1] !== oneEdgeInfo[3]){
        //   deepOfEdge[key] = 0
        // }
        // if(oneEdgeInfo[1] === oneEdgeInfo[3]){
        //   //自环节点颜色设置为黄色
        //   graph.mergeNodeAttributes(oneEdgeInfo[1],{color:'rgb(255,249,0)'})
        // }
      }
      console.log('节点数量:'+nodeCount)
      console.log('边数量:'+edgeCount)
      console.log('自旋的节点数量：'+graph.selfLoopCount)
    }
    //查找没有边的节点并删除
    // let allNodes = graph.nodes()
    // for (let nodeIndex in allNodes) {
    //   if (graph.degree(allNodes[nodeIndex]) == 0){
    //     graph.dropNode(allNodes[nodeIndex])
    //   }
    // }

    //有多少个连通分量
    let count = 0
    forEachConnectedComponentOrder(graph,order => {
      if (order > 1){
        count++
      }
    })
    if (count == 0){
      //如果大于1个节点的连通分量个数为0，则不使用OGDF进行布局(此时使用OGDF进行布局的话，所有的节点都会聚集到一个点)，直接给给个节点设置初始位置并使用sigma渲染
      let x = 0
      let y = 0
      graph.nodes().forEach(nodeId =>{
        graph.mergeNodeAttributes(nodeId,{x:x,y:y})
        if(y <= 190){
          y += 10
        }else{
          x += 10
          y = 0;
        }
      })
      sigma.refresh()
      console.log(sigma)
    }else {
      //否则使用OGDF的FM3布局并且使用sigma.js进行渲染
      layout()
    }
  }

  // 这些变量在将节点坐标归一化时会用到
  let xAxis = []
  let yAxis = []
  let xAxisMin = 0
  let xAxisMax = 0
  let yAxisMin = 0
  let yAxisMax = 0
  /**
   * 进行布局并刷新渲染图网络
   */
  function layout(){
    ogdfLayout.graph({
      nodes:ogdfNodes,
      links:ogdfEdges
    })
    //使用ogdf的FMMM布局
    // 设置布局的参数
    ogdfLayout.parameters({
      useHighLevelOptions: true,
      unitEdgeLength: 150,
      newInitialPlacement: true,
      // 其他参数...
    });
    // 应用布局
    ogdfLayout.run().then(ogdfGraph => {
      //使用ogdf的FMMM布局算出位置后，将位置设置给graphology的节点
      for (let node of ogdfGraph.nodes) {
        xAxis.push(Number(node.x))
        yAxis.push(Number(node.y))
        graph.mergeNodeAttributes(node.id,{x: node.x, y: node.y})
      }
      xAxis.sort((a,b) => a-b)
      yAxis.sort((a,b) => a-b)
      xAxisMin = xAxis[0]
      xAxisMax = xAxis[xAxis.length-1]
      yAxisMin = yAxis[0]
      yAxisMax = yAxis[yAxis.length-1]
    });
    sigma.settings.zoomingRatio = 1.1
    sigma.refresh()
    if (loading != null){
      loading.close()
    }
    console.log(sigma)
  }


  /**
   * 判断节点原来的颜色是否为红色
   * @param color
   * @returns {string}
   */
  function judgeColor(color){
    if (color === '#ff0000'){
      return '#ff0000'
    }else {
      return nodeDefaultColor
    }
  }

  /**
   * 随机生成一个颜色
   * @returns {string}
   */
  function randomColor(){
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
  }

</script>

<style scoped>
  .menu ul{
    list-style-type: none;
    background-color: white;
    border: 2px solid rgba(112, 109, 109, 0.2);
    border-radius: 8px;
    padding: 3px;
  }
  .menu ul li{
    padding-left: 5px;
    padding-right: 5px;
    border: 1px hidden black;
    border-radius: 5px;
    background-color: white;
    background-clip: padding-box;
  }
  .menu ul li:hover {
    background-color: rgba(66, 225, 241, 0.3);
    cursor: pointer;
  }
  .title:hover{
    cursor: default;
    animation: scrollText 3s linear infinite;
  }
  @keyframes scrollText {
    0% {
      transform: translateX(0%);
    }
    100% {
      transform: translateX(-100%);
    }
  }
  .item-left{
    cursor: default;
  }
  .delete:hover{
    color: #cb2525;
    cursor: pointer;
  }
  .deleteClass:hover{
    cursor: pointer;
    background-color: #f89898
  }
  .generateFile:hover{
    cursor: pointer;
    background-color: #95d475
  }
</style>