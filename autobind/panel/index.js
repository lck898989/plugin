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
        proName: "",

        talkNum: 5,

        /** 相声名字数组 */
        talkNameArray: [
          "SL1U1_8_sp_talk_pt1",
          "SL1U1_8_sp_talk_pt2",
          "SL1U1_8_sp_talk_pt3",
          "SL1U1_8_sp_talk_pt4",
          "SL1U1_8_sp_talk_pt5"
        ],

        /*** 实际题目的关卡数数组 */
        topicLevelArray: [
          3,
          4,
          5,
          3
        ],

        /** 大关卡数量(包含题目的，相声，转场除外) */
        largeLevelNum: 4,

        /*** 目前插件功能 */
        pluginFunction: [
          "***********功能如下************",
          "自动在主场景中添加脚本及挂载相应的预制体。",
          "为每个题目预制体添加喇叭,进度条，实时教具提示节点，并且设置他们的属性，比如进度条的当前进度。",
          "为每个预制体的可交互节点挂载cc_play(动画组件必须要有动画剪辑没有的话绑定不成功)。",
          "自动删除转场场景中的可交互节点。"
        ],

        /** 自动添加脚本的时候是否将喇叭节点删除掉 */
        isDeleteHorn: false,

        /** 自动添加脚本的时候是否将实时教具节点删除 */
        isDeleteReal: false,

        /** 自动添加脚本是否将进度条节点删除 */
        isDeleteProgress: false


      },
      created() {
        console.log("vue 组件挂载成功");
      },
      /** 监听talkNum */
      watch: {
        talkNum: (val) => {
          Editor.log("val is ",typeof val);
          
        }
      },
      methods: {
        /*** 开始绑定脚本 */
        startBind() {
          
          // for(let i = 0; i < )
          if(this.talkNameArray.length === this.talkNum) {
          //  / */
           let name = this.talkNameArray;
           let num  = this.mainTemplateCount;
           let levelarr = this.topicLevelArray;
           let isDelete = this.isDeleteHorn;
           let isDeleteReal = this.isDeleteReal;
           let isDeleteProgress = this.isDeleteProgress;
           /*** 找到场景中的Canvas节点挂载相应的组件 */
           Editor.Scene.callSceneScript("autobind",'auto_bind',{templateCount: num,talkNameArr: name,levelarr,isDelete,isDeleteReal,isDeleteProgress},(err,info) => {
             if(info === "success") {
               Editor.success("自动挂载组件脚本成功!!!");
             }
           })
          
           /*** 找到改配置文件对应的预制体并将该题型对应的组件添加到该预制体上 默认从templetes文件夹里面读取预制体*/

          } else {
            // alert("请输入项目名称");
            // Editor.warn("请输入项目名称");
          }
        },
        /** 设置isDeleteOrigin属性 */
        setIsDelete(event) {
          
          // 开始设置状态
          this.isDeleteHorn = event.detail.value;
          
        },

        setIsDeleteReal(event) {
          this.isDeleteReal = event.detail.value;
        },

        setIsDeletePro(event) {
          this.isDeleteProgress = event.detail.value;
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