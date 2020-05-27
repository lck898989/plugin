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
    'auto_bind': async (event,params) => {

        /** 是否需要删除原来挂载在预制体里面的节点 */
        let isDelete = params.isDelete;

        /** 是否在环节关卡里面更换进度条显示 */
        let isChangeShowInSection = params.isChangePInSection;

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
        const refresh = async (dbUrl,res) => {
            // 刷新资源
            await new Promise((resolveIn,rejectIn) => {
                Editor.assetdb.saveExists(dbUrl,res.serialize(),() => {
                    resolveIn();
                })
            });
            await new Promise((res,rej) => {
                Editor.assetdb.refresh(dbUrl,() => {
                    res();
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
        Editor.log("************************开始绑定脚本*****************************");
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
             * @param  {Boolean} isChange 是否在环节关卡里改变进度条的显示
             */
            const changeTopic = async (prefabName,comName,isChage) => {
                /** 重置过渡关卡游标 */
                trasitionIndex = 0;
                delays.push(2000);
                isTrasition = false;

                dbUrl = `db://assets/templates/${prefabName}.prefab`;
                uuid = await getUuidByUrl(dbUrl);
                if(uuid !== "null") {

                    // 将uuid添加到mainScene里面
                    if(hornNode && realNode) {
                        await loadPrefab(dbUrl,uuid,comName,isChage);
                    }
                    // 刷新编辑器
                    Editor.Ipc.sendToMain("autobind:saveScene");

                } else {
                    /* 如果正式题目没有找到的话就用对应模板填个坑等资源整理好之后重新生成一遍就好了*/
                    let tempPrefabUrl = `db://assets/templates/correspondTemplate1.prefab`;
                    let tempUuid = await getUuidByUrl(tempPrefabUrl);
                    if(tempUuid !== "null") {
                        await loadPrefab(tempPrefabUrl,tempUuid);
                    }
                }
            }

            /**
             *  定义内部使用的方法 
             * 只针对非过渡关卡，以后优化
             * @param  {String} dbUrl 预制体资源路径
             * @param  {String} uuid 改资源的uuid
             * @param  {String} comName 需要的脚本组件名字
             * @param  {Boolean} isChange? 是否应该在游戏环节关卡更换进度条的显示
             */
            const loadPrefab = async (dbUrl,uuid,comName,isChange) => {
                
                let voiceNode,progress,realTimeNode;
                // 加载prefab资源
                let res = await new Promise((resolve,reject) => {
                    cc.loader.load({uuid},(err,res) => {
                        if(err) {
                            reject();
                            return;
                        }
                        // let resNode = cc.instantiate(res);
                        if(templates.indexOf(res) < 0) {
                            
                            templates.push(res);
                            
                        }
                        resolve(res);
                    });
                });
                if(res) {
                    res.data.active = true;

                    let isRealTopic = comName && comName !== "emptyTemplateController" && comName !== "clickTemplateController";
                    /** 进度条适配方法 */
                    const progressAdapter = async () => {
                        /*** 检查是否添加进度条暂停节点 */
                        let sectionProgressNodeUuid = await getUuidByUrl(`db://assets/prefabs/progressBar_${curLevelNum}_${realLevelIndex}_stop.prefab`);
                        if(sectionProgressNodeUuid === "null") {

                            Editor.error(`请先添加progressBar_${curLevelNum}_${realLevelIndex}_stop.prefab预制体`);

                        } else {
                            /** 存在进度条暂停节点就把原来旧的进度条节点删除替换成新的 */
                            let sectionProgressNode = await loadprefabNodeByUuid(sectionProgressNodeUuid);
                            /** 检查该节点下是否有更换前的进度条节点 */
                            progress = res.data.getChildByName(`progressBar_${curLevelNum}`);
                            if(progress) {
                                /** 删除旧的进度条节点 */
                                progress.setParent(null);
                            }
                        
                            if(!res.data.getChildByName(`progressBar_${curLevelNum}_${realLevelIndex}_stop`)) {
                                /** 将该进度条节点添加到该预制体上 */
                                sectionProgressNode.setParent(res.data);
                            }

                        }
                    }

                    if(isRealTopic) {

                        res.data.children.filter((node) => {
                            /** 可交互节点上有动画组件并且动画的剪辑数量不为0 */
                            if(node.name.indexOf("interactive") >= 0 && node.getComponent(cc.Animation) && node.getComponent(cc.Animation).getClips().length > 0) {
                                let sum = 0;
                                let shouldAdd = true;
                                node.getComponent(cc.Animation).getClips().reduce((index,item) => {
                                    if(!item) {
                                        return sum++;
                                    }
                                },0);
                                sum === node.getComponent(cc.Animation).getClips().length ? shouldAdd = false : shouldAdd = true;
                                /** 挂载cc_play组件 */
                                if(shouldAdd) {

                                    if(!node.getComponent("cc_play")) {
                                        node.addComponent("cc_play");
                                        node.getComponent("cc_play").isRemote = true;
                                    } else {
                                        node.getComponent("cc_play").isRemote = true;
                                    }
                                    
                                }
                            
                            }
                        });
                        /** 喇叭节点 */
                        voiceNode = res.data.getChildByName("bt_voice");
                        if(voiceNode && isDelete) {
                            voiceNode.setParent(null);
                        }
                        /*** 实时教具节点 */
                        realTimeNode = res.data.getChildByName("realTimeTeachingAids");
                        if(realTimeNode && params.isDeleteReal) {
                            realTimeNode.setParent(null);
                        }

                        
                        /** 进度条节点 */
                        if(!isChange) {
                            progress = res.data.getChildByName(`progressBar_${curLevelNum}`);
                            if(progress && params.isDeleteProgress) {
                                progress.setParent(null);
                            }

                        } else if(isChange && isChangeShowInSection) {

                            await progressAdapter();

                        }

                        /** 设置进度条的状态 */
                        if(progress) {
                            progress.getComponent("cc_play_progress_bar").current = realLevelIndex;
                        }
                        
                        // Editor.log("hornNode is ",hornNode);
                        // Editor.log("realNode is ",realNode);

                        if(hornNode && !voiceNode) {
                            hornNode.setParent(res.data);
                            
                        }
                        if(realNode && !realTimeNode) {
                            realNode.setParent(res.data);
                            
                        }
                        /** 进度条节点资源有且当前情况下没有找到进度条节点或者是该转换进度条显示了且面板中没有勾选是否替换进度条   */
                        if((progressBarNode && !progress && !isChange)) {

                            progressBarNode.setParent(res.data);
                            progressBarNode.getComponent("cc_play_progress_bar").current = realLevelIndex;
                                
                        } 
                        if(isChangeShowInSection && isChange) {
                            // 用环节关卡特有的进度条
                            await progressAdapter();
                        }
                        await refresh(dbUrl,res);
                    }
                    if(comName === "emptyTemplateController" || comName === "clickTemplateController") {
                        /** 取消过渡场景交互节点的cc_play组件和默认动画的关闭 */
                        res.data.children.filter((node) => {
                            if(node.name.indexOf("interactive") >= 0 && node.getComponent(cc.Animation)) {
                                /** 删除可交互节点 */
                                node.setParent(null);
                                
                            }
                        });
                        await refresh(dbUrl,res);
                    }
                    if(comName && !res.data.getComponent(comName)) {
                        
                        res.data.addComponent(comName);

                        await refresh(dbUrl,res);
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
                                    prefabName.indexOf("dt") >= 0 ? await loadPrefab(dbUrl,uuid,"emptyTemplateController") : await loadPrefab(dbUrl,uuid,"clickTemplateController");
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
                                    await loadPrefab(dbUrl,uuid,"emptyTemplateController");
                                }
                            } else if(prefabName === "") {
                                Editor.error(`*********请检查第${i}个level中sections中的第${j}个环节配置中name属性是否存在**********`);
                            }
                            if(!isFindTransition) {
                                /* 如果转场类型的topic没有找到预制体的话先用btn_voice填个坑 */
                                let tempPrefabUrl = `db://assets/templates/btn_voice.prefab`;
                                if(hornUuid !== "null") {
                                    await loadPrefab(tempPrefabUrl,hornUuid);
                                }
                            }
                            
                            break;
                        case "Accumulate":
                            await changeTopic(prefabName,"correspondTemplateController",j > 0);
                            break;
                        case "Order":
                            await changeTopic(prefabName,"correspondTemplateController",j > 0);
                            break;
                        case "Select":
                            // selectTemplateController
                            await changeTopic(prefabName,"selectTemplateController",j > 0);
                            break;
                        case "Combine":
                            await changeTopic(prefabName,"combineTemplateController",j > 0);
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