const Util = require("./util");
const AssetManager = require("./AssetManager");
let skeletonCache = null;

const DragonDeal = {
    /** 检查一个节点下有没有需要绑定骨骼动画的节点 */
    checkNodeHasDragon: async (node) => {
        let res = false;
        res = node ? node.name.includes("char_"): false;

        if(res) {

            /** 挂载cc_play */
            if(!node.getComponent("cc_play")) {
                node.addComponent("cc_play");
            }
            if(!node.getComponent("cc_animPlayAction")) {
                node.addComponent("cc_animPlayAction");
            }
            
            let _index = node.name.indexOf("_");
            let _afterString = node.name.substr(_index + 1);

            /** 主角名称 */
            let animalName = Util.capitalize(_afterString.split("_")[0]);
            /** 主角方向 */
            let animalDir  = Util.capitalize(_afterString.split("_")[1]);

            /** 在该节点下添加子节点并添加Spine组件 */
            let newNode = new cc.Node();
            newNode.name = `${animalName}_${animalDir}`;
            if(!node.getChildByName(newNode.name)) {
                // newNode.setParent(node);
                // newNode.addComponent(sp.Skeleton);
            }

            let dragonDataStr = `${animalName}_${animalDir}.json`;
            if(!skeletonCache) {
                Editor.assetdb.queryAssets('db://assets/skeleton/**\/*','',async (err,results) => {
                    Editor.log("err is ",err," and results is ",results);
                    /** 保存起来 */
                    skeletonCache = results;
                    if(results) {
                        for(let i = 0; i < results.length; i++) {
                            Editor.log("item is ",results[i]);
                            if(results[i].url.includes(dragonDataStr)) {
                                let res = await AssetManager.loadPrefabNodeByUuid(results[i].uuid);
                                Editor.log("res is ",res);
                                let skeletonCom = newNode.getComponent(sp.Skeleton);
                                /** 这里返回的是null暂时不清楚是怎么回事，h5运行环境节点脚本组件可以获取到暂时不做 */
                                if(skeletonCom) {
                                    
                                }
                            }
                        }
                    }
                })
            } else {
                if(skeletonCache) {
                    for(let i = 0; i < skeletonCache.length; i++) {
                        Editor.log("item is ",skeletonCache[i]);
                        if(skeletonCache[i].url.includes(dragonDataStr)) {
                            let res = await AssetManager.loadPrefabNodeByUuid(skeletonCache[i].uuid);
                            Editor.log("res is ",res);
                            let skeletonCom = newNode.getComponent(sp.Skeleton);
                            if(skeletonCom) {
                                
                            }
                        }
                    }
                }
            }

        }
    }
}
module.exports = DragonDeal;