import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import * as ElementIcon from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import cytoscape from "cytoscape";
import 'vis-network/dist/dist/vis-network.css'
// import * as ElementIcon from '@element-plus/icons'

const app = createApp(App)

for (const icon in ElementIcon){
    app.component(icon,ElementIcon[icon])
}

// app.use(router)
app.use(ElementPlus)
app.use(cytoscape)

app.mount('#app')
