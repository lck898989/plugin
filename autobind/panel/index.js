// panel/index.js, this filename needs to match the one registered in package.json

/*** 渲染线程 */
const fs = require("fire-fs");
const path = require("fire-path");
Editor.Panel.extend({
  // css style for panel
  style: fs.readFileSync(Editor.url("packages://autobind/panel/index.css"),'utf-8'),

  // html template for panel
  template: fs.readFileSync(Editor.url("packages://autobind/panel/index.html"),'utf-8'),

  // element and variable binding
  $: {
    btn: '#btn',
    label: '#label',
  },

  // method executed when template and styles are successfully loaded and initialized
  ready () {
    new window.Vue({
      el: this.shadowRoot,
      data: {
        /** 需要挂载的模板数量 */
        mainTemplateCount: 27,
        /** 项目名称 */
        proName: "114"

      },
      created() {
        console.log("vue 组件挂载成功");
      },
      methods: {
        /*** 开始绑定脚本 */
        startBind() {
          Editor.log("模板的数量是：",this.mainTemplateCount);
          if(this.proName) {
          //  / */
           let name = this.proName
           /*** 找到场景中的Canvas节点挂载相应的组件 */
           Editor.Scene.callSceneScript("autobind",'get-canvas-children',{templateCount: 27,proName: name},(err,info) => {
             if(info === "success") {
               Editor.success("自动挂载组件脚本成功!!!");
             }
           })
          
           /*** 找到改配置文件对应的预制体并将该题型对应的组件添加到该预制体上 默认从templetes文件夹里面读取预制体*/

          } else {
            // alert("请输入项目名称");
            Editor.warn("请输入项目名称");
          }
        }
      }
    })
  },

  // register your ipc messages here
  messages: {
    'autobind:hello' (event) {
      this.$label.innerText = 'Hello!';
    }
  }
});