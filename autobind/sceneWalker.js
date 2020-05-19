const fs = require("fire-fs");
/*** 调用引擎API和项目脚本文件 */
module.exports = {
    /**
     * @param  {} event 从渲染进程或者是主进程传递过来的事件
     * @param  {} params 事件携带的参数
     */
    'get-canvas-children': async (event,params) => {
        let sceneTemplates = [];
        /** 获取场景文件 */
        let mainSceneUrl = Editor.Project.path + "/assets/scenes/mainScene.fire";
        let fireFile = fs.readFileSync(mainSceneUrl,'utf-8');

        let sceneJson = JSON.parse(fireFile);
        let comPonentObj;

        if(sceneJson instanceof Array) {
            let sceneJsonLength = sceneJson.length;
            comPonentObj = sceneJson[sceneJsonLength - 1];
            sceneTemplates = comPonentObj.templates;
        }
        const getUuidByUrl = (url) => {
            return new Promise((resolve,reject) => {
                Editor.Ipc.sendToMain("autobind:loadprefab",{dbUrl: url},(res) => {
                    resolve(res);
                });
            });
        }
        
        const loadprefabNodeByUuid = (uuid) => {
            return new Promise((resolve,reject) => {
                cc.loader.load({uuid},async (err,res) => {
                    if(err) {
                        reject(null);
                        return;
                    }
                    hornNode = cc.instantiate(res);
                    resolve(hornNode);
                })
            })
        }
        const refresh = async (dbUrl,res,resolve) => {
            // 刷新资源
            await new Promise((resolveIn,rejectIn) => {
                Editor.assetdb.saveExists(dbUrl,res.serialize(),() => {
                    resolveIn();
                })
            });
            Editor.assetdb.refresh(dbUrl,() => {
                Editor.log("资源刷新完成");
                resolve();
            });
        }
        /**
         *  定义内部使用的方法 
         * 只针对非过渡关卡，以后优化
         * @param  {} dbUrl 预制体资源路径
         * @param  {} templates 预制体数组
         * @param  {} uuid 改资源的uuid
         * @param  {} comName 需要的脚本组件名字
         * @param  {} index 第几个预制体
         * @param  {} children 希望挂载到该预制体上的子节点
         */
        const loadPrefab = (dbUrl,uuid,templates,comName,index,hornNode,realNode) => {
            // 加载prefab资源
            return new Promise((resolve,reject) => {
                cc.loader.load({uuid},async (err,res) => {
                    if(err) {
                        reject();
                        return;
                    }
                    // let resNode = cc.instantiate(res);
                    if(templates.indexOf(res) < 0) {
                        
                        templates.push(res);
                        if(comName === "emptyTemplateController" || comName === "clickTemplateController") {
                            sceneTemplates[index] = {__uuid__: ""};
                        } else {
                            sceneTemplates[index] = {__uuid__: uuid};
                        }
                    }
                    
                    if(res) {
                        Editor.log("com is ",res.data.getComponent(comName)," and active is ",res.data.active);
                        res.data.active = true;

                        if(!res.data.getComponent(comName)) {
                            
                            res.data.addComponent(comName);
                            // 刷新资源
                            await new Promise((resolveIn,rejectIn) => {
                                Editor.assetdb.saveExists(dbUrl,res.serialize(),() => {
                                    resolveIn();
                                })
                            });
                            Editor.assetdb.refresh(dbUrl,() => {
                                Editor.log("资源刷新完成");
                                resolve();
                            });
                        } else {
                            resolve();
                        }
                    }
                });
            })
        }

        /** 配置文件相关信息 */
        let configPath = Editor.Project.path + "/config_dev.json";
        let config = fs.readFileSync(configPath,'utf-8');
        let levels = JSON.parse(config).levels;

        if(levels && levels.length > 0 && params.templateCount === levels.length) {
            let canvas = cc.find("Canvas");
            if(!canvas.getComponent("cc_core_levelManager")) {
                canvas.addComponent("cc_core_levelManager");
            }
            let levelManager = canvas.getComponent("cc_core_levelManager");
            

            levelManager.templates = [];
            levelManager.nextGameSectionDelay = [];
            // 刷新编辑器
            Editor.Ipc.sendToMain("saveScene");


            /** 所需要的预制体数组 */
            let templates = levelManager.templates;
            /** 所需要的延时操作 */
            let delays = levelManager.nextGameSectionDelay;

            let nameSplit = params.proName.split("");
            let preName = "SL" + nameSplit[0] + "U" + nameSplit[1] + "_" + nameSplit[2] + "_" + "practice_pt";

            
            /** 获得喇叭预制体的uuid */
            let hornUuid = '';
            let realUuid = '';
            hornUuid = await getUuidByUrl("db://assets/prefabs/btn_voice.prefab");
            /** 实时教具uuid */
            realUuid = await getUuidByUrl("db://assets/prefabs/realTimeTeachingAids.prefab");
            /** 进度条uuid */
            // progressUuid = await getUuidByUrl("db://assets/prefabs/progress")

            hornNode = await loadprefabNodeByUuid(hornUuid);
            realNode = await loadprefabNodeByUuid(realUuid);


            /** 大关卡索引 */
            let levelIndex = 0;
            /** 是否是过度场景 */
            let isTrasition = false;
            /*** 小关卡索引 */
            let realLevelIndex = 0;
            /** 向预制体数组中添加数组 */
            for(let i = 0; i < params.templateCount; i++) {
                // 加载预制体
                // templates.push();
                realLevelIndex++;
                let sections = levels[i].sections;
                for(let j = 0; j < sections.length; j++) {
                    let value = sections[j];
                    let type = value.topic.type;
                    let dbUrl = "";
                    let uuid = "";
                    
                    switch(type) {
                        case "Transition":
                            if(!isTrasition) {
                                levelIndex++;
                            }
                            isTrasition = true;
                            delays.push(0);
                            realLevelIndex = 0;
                            dbUrl = `db://assets/templates/tratest.prefab`;
                            uuid = await getUuidByUrl(dbUrl);
                            await loadPrefab(dbUrl,uuid,templates,"emptyTemplateController",i);
                            /** 过度场景将该场景挂上emptyController */
                            // let templateTrasition = fs.readFileSync(Editor.url("db://assets/templates"))
                            break;
                        case "Accumulate":
                            delays.push(2000);
                            isTrasition = false;
                            dbUrl = `db://assets/templates/${preName}${levelIndex}_${realLevelIndex}_${j + 1}.prefab`;
                            uuid = await getUuidByUrl(dbUrl);
                            // 将uuid添加到mainScene里面
                            if(hornNode && realNode) {
                                await loadPrefab(dbUrl,uuid,templates,"cc_count_card",i,hornNode,realNode);
                            }
                            // 刷新编辑器
                            Editor.Ipc.sendToMain("saveScene");
                            break;
                        case "Correspond":
                            delays.push(2000);
                            isTrasition = false;
                            break;
                        case "Select":
                            delays.push(2000);
                            isTrasition = false;
                            break;
                        case "Combine":
                            delays.push(2000);
                            isTrasition = false;
                            break;        
                    }
                }
                
            }
            // 刷新编辑器场景
            Editor.Ipc.sendToMain("saveScene");
            
            if(levelManager) {
                event.reply(null,"success");
            }
            
        } else if(levels.length !== params.templateCount) {
            Editor.warn("配置文件出错或者预制体数组出错，请检查!!!");
        }
        
    }
}