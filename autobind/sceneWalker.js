/***
 * 
 *  调用引擎API和访问项目脚本文件
 * 
 */


const fs = require("fire-fs");
module.exports = {
    /**
     * @param  {} event 从渲染进程或者是主进程传递过来的事件
     * @param  {} params 事件携带的参数
     */
    'get-canvas-children': async (event,params) => {

        /** 是否需要删除原来挂载在预制体里面的节点---试验功能 */
        let isDelete = params.isDelete;

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
        
        /**
         * 根据prefab的uuid加载资源
         * @param  {} uuid prefab的uuid
         */
        const loadprefabNodeByUuid = (uuid) => {
            return new Promise((resolve,reject) => {
                cc.loader.load({uuid},async (err,res) => {
                    if(err) {
                        reject(null);
                        return;
                    }
                    let node = cc.instantiate(res);
                    resolve(node);
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

        const addToPrefab = async (isTopic) => {

        }
        /**
         *  定义内部使用的方法 
         * 只针对非过渡关卡，以后优化
         * @param  {} dbUrl 预制体资源路径
         * @param  {} templates 预制体数组
         * @param  {} uuid 改资源的uuid
         * @param  {} comName 需要的脚本组件名字
         * @param  {} hornNode? 希望挂载的喇叭节点
         * @param  {} realNode? 希望挂载的实时教具节点
         * @param  {} progressNode? 希望挂载的进度条节点
         * @param  {} progressLevel? 当前进度条的第几个关卡
         */
        const loadPrefab = (dbUrl,uuid,templates,comName,hornNode,realNode,progressNode,curLevelNum,progressLevel) => {

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
                        
                    }
                    
                    if(res) {
                        res.data.active = true;

                        let isRealTopic = comName && comName !== "emptyTemplateController" && comName !== "clickTemplateController";
                        if(isRealTopic) {

                            res.data.children.filter((node) => {
                                if(node.name.indexOf("interactive") >= 0 && node.getComponent(cc.Animation)) {
                                    /** 挂载cc_play组件 */
                                    if(!node.getComponent("cc_play")) {
                                        node.addComponent("cc_play");
                                        node.getComponent("cc_play").isRemote = true;
                                    } else {
                                        node.getComponent("cc_play").isRemote = true;
                                    }
                                
                                }
                            })
                            /** 喇叭节点 */
                            voiceNode = res.data.getChildByName("bt_voice");
                            /*** 实时教具节点 */
                            realTimeNode = res.data.getChildByName("realTimeTeachingAids");
                            /** 进度条节点 */
                            progress = res.data.getChildByName(`progressBar_${curLevelNum}`);

                            /** 设置进度条的状态 */
                            if(progress) {
                                progress.getComponent("cc_play_progress_bar").current = progressLevel;
                            }
                            
                            // Editor.log("hornNode is ",hornNode);
                            // Editor.log("realNode is ",realNode);

                            if(hornNode && !voiceNode) {
                                hornNode.setParent(res.data);
                                
                            }
                            if(realNode && !realTimeNode) {
                                realNode.setParent(res.data);
                                
                            }
                            if(progressNode && !progress) {
                                progressNode.setParent(res.data);
                                // Editor.log("progressComponent is ",progressNod);
                                progressNode.getComponent("cc_play_progress_bar").current = progressLevel;
                            }
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
                        if(comName && !res.data.getComponent(comName)) {
                            
                            res.data.addComponent(comName);
                            if(hornNode && realNode) {
                                
                            }

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

        
        /** 测试环境配置文件相关信息 */
        let devConfigPath = Editor.Project.path + "/config_dev.json";

        let proConfigPath = Editor.Project.path + "/config_pro.json";

        let config;
        try {
            config = fs.readFileSync(devConfigPath,'utf-8');
        } catch(e) {
            Editor.error("请先添加测试配置文件~~~~~");
            return;
        }
        if(!config) {
            try {
                config = fs.readFileSync(proConfigPath,'utf-8');
            } catch(e) {
                Editor.error("请先添加生产环境配置文件~~~~~");
                return
            }
        }
        Editor.log("config is ",config);
        let levels = JSON.parse(config).levels;

        let canIn = (levels && levels.length > 0 && params.templateCount === levels.length);

        if(canIn) {
            let canvas = cc.find("Canvas");

            if(!canvas.getComponent("cc_core_levelManager")) {
                canvas.addComponent("cc_core_levelManager");
            }
            let levelManager = canvas.getComponent("cc_core_levelManager");
            

            levelManager.templates = [];
            levelManager.nextGameSectionDelay = [];
            // 刷新编辑器
            // Editor.Ipc.sendToMain("autobind:saveScene",(err,answer) => {

            // });
            await new Promise((resolve,reject) => {
                Editor.Ipc.sendToMain("autobind:saveScene",() => {
                    resolve();
                });
            })
            /** 所需要的预制体数组 */
            let templates = levelManager.templates;
            /** 所需要的延时操作 */
            let delays = levelManager.nextGameSectionDelay;

            let talkNameArr = params.talkNameArr;
            
            /** 获得喇叭预制体的uuid */
            let hornUuid = '';
            let realUuid = '';
            let progressUuid = '';
            hornUuid = await getUuidByUrl("db://assets/prefabs/btn_voice.prefab");

            Editor.log("hornuuid is ",hornUuid);
            /** 实时教具uuid */
            realUuid = await getUuidByUrl("db://assets/prefabs/realTimeTeachingAids.prefab");

            
            let hornNode = await loadprefabNodeByUuid(hornUuid);
            let realNode = await loadprefabNodeByUuid(realUuid);

            let progressBarNode = null;
            /** 当前大关卡的小关卡数量 */
            let curLevelNum = 0;


            /** 大关卡索引 */
            let levelIndex = 0;
            /** 是否是过度场景 */
            let isTrasition = false;
            /*** 小关卡索引 */
            let realLevelIndex = 0;

            /** 过度关卡的游标 */
            let trasitionIndex = 0;

            /*** 进度条中第几关 */

            /** 转换题型 */
            /**
             * @param  {String} prefabName 预制体的名字
             * @param  {String} comName 组件名字
             */
            const changeTopic = async (prefabName,comName) => {
                /** 重置过渡关卡游标 */
                trasitionIndex = 0;
                delays.push(2000);
                isTrasition = false;

                dbUrl = `db://assets/templates/${prefabName}.prefab`;
                uuid = await getUuidByUrl(dbUrl);
                if(uuid !== "null") {

                    // 将uuid添加到mainScene里面
                    if(hornNode && realNode) {
                        await loadPrefab(dbUrl,uuid,templates,comName,hornNode,realNode,progressBarNode,curLevelNum,realLevelIndex);
                    }
                    // 刷新编辑器
                    Editor.Ipc.sendToMain("autobind:saveScene");

                } else {
                    /* 如果正式题目没有找到的话就用对应模板填个坑等资源整理好之后重新生成一遍就好了*/
                    let tempPrefabUrl = `db://assets/templates/correspondTemplate1.prefab`;
                    let tempUuid = await getUuidByUrl(tempPrefabUrl);
                    if(tempUuid !== "null") {
                        await loadPrefab(tempPrefabUrl,tempUuid,templates);
                    }
                }
            }

            /** 向预制体数组中添加数组 */
            for(let i = 0; i < params.templateCount; i++) {
                // 加载预制体
                // templates.push();
                realLevelIndex++;
                let sections = levels[i].sections;
                for(let j = 0; j < sections.length; j++) {
                    let value = sections[j];

                    /*** 取到预制体的名字 */
                    let prefabName = value.name;

                    /** sdk端的题型 */
                    let type = value.topic.type;
                    let dbUrl = "";
                    let uuid = "";

                    /*** 根据发给sdk端的配置文件中的题型来决定是要给哪个预制体添加什么样的脚本组件 */
                    switch(type) {
                        case "Transition":
                            
                            let isFindTransition = false;

                            trasitionIndex++;
                            if(!isTrasition) {
                                levelIndex++;

                                curLevelNum = params.levelarr.shift();

                                // curLevelNum
                                if(curLevelNum) {
                                    /** 需要挂载的进度条uuid */
                                    progressUuid = await getUuidByUrl(`db://assets/prefabs/progressBar_${curLevelNum}.prefab`);

                                    if(progressUuid !== "null") {
                                        progressBarNode = await loadprefabNodeByUuid(progressUuid);
                                    }
                                }

                            }
                            isTrasition = true;
                            /** 重置小关卡游标 */
                            realLevelIndex = 0;
                            if(prefabName.indexOf("dt") >= 0 || prefabName.indexOf("lj") >= 0) {
                                dbUrl = `db://assets/templates/trasition${levelIndex - 1}_${trasitionIndex}.prefab`;
                                
                                uuid = await getUuidByUrl(dbUrl);

                                if(uuid !== "null") {
                                    isFindTransition = true;
                                    prefabName.indexOf("dt") >= 0 ? await loadPrefab(dbUrl,uuid,templates,"emptyTemplateController") : await loadPrefab(dbUrl,uuid,templates,"clickTemplateController");
                                    prefabName.indexOf("dt") >= 0 ? delays.push(2000) : delays.push(0);
                                } else {
                                    isFindTransition = false;
                                    prefabName.indexOf("dt") >= 0 ? delays.push(2000) : delays.push(0);
                                }
                                
                            } else if(prefabName.indexOf("xs") >= 0) {
                                delays.push(0);
                                /*** 相声 */
                                let talkName = talkNameArr.shift();
                                dbUrl = `db://assets/templates/${talkName}.prefab`;
                                uuid = await getUuidByUrl(dbUrl);
                                if(uuid === "null") {
                                    // Editor.error("输入的相声名字错误！！！");
                                    Editor.warn("~~~~输入的相声名字有误请检查相声的名字和相声预制体的名字是否一致~~~~");
                                    isFindTransition = false;

                                } else {
                                    isFindTransition = true;
                                    /** 挂载相声脚本 */
                                    await loadPrefab(dbUrl,uuid,templates,"emptyTemplateController");
                                }
                            } else if(prefabName === "") {
                                Editor.error(`*********请检查第${i}个level中sections中的第${j}个环节配置中name属性是否存在**********`);
                            }
                            if(!isFindTransition) {
                                /* 如果转场类型的topic没有找到预制体的话先用btn_voice填个坑 */
                                let tempPrefabUrl = `db://assets/templates/btn_voice.prefab`;
                                if(hornUuid !== "null") {
                                    await loadPrefab(tempPrefabUrl,hornUuid,templates);
                                }
                            }
                            
                            break;
                        case "Accumulate":
                            await changeTopic(prefabName,"correspondTemplateController",i);
                            break;
                        case "Order":
                            await changeTopic(prefabName,"correspondTemplateController",i);
                            break;
                        case "Select":
                            // selectTemplateController
                            await changeTopic(prefabName,"selectTemplateController",i);
                            break;
                        case "Combine":
                            await changeTopic(prefabName,"combineTemplateController",i);
                            break;        
                    }
                }
                
            }
            // 刷新编辑器场景
            Editor.Ipc.sendToMain("autobind:saveScene");
            
            if(levelManager) {
                event.reply(null,"success");
            }
            
        } else if(levels.length !== params.templateCount) {
            Editor.warn("配置文件出错或者预制体数组出错，请检查!!!");
        }
        
    }
}