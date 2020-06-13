
const EXE = require('child_process').exec;
// const Tool = {
//     /** 执行命令 */
//     execCmd: (cmd) => {
//         if(CC_EDITOR) {
//             Editor.log("cmd is ",cmd);
//         }
//         return new Promise((resolve,reject) => {
//             EXE(cmd,null,(err,stdout,stderr) => {
//                 if(err) {
//                     reject();
//                     return;
//                 }
//                 resolve();
//             })
//         })
//     }
// }
exports.execCmd = async (cmd) => {
    if(CC_EDITOR) {
        Editor.log("cmd is ",cmd);
    }
    return new Promise((resolve,reject) => {
        EXE(cmd,null,(err,stdout,stderr) => {
            if(err) {
                reject();
                return;
            }
            resolve();
        })
    })
}
exports.selectAnimation = async (animationName) => {
    return new Promise((resolve,reject) => {
        Editor.assetdb.queryAssets("db://assets/animation/\/*",'',(err,results) => {
            if(err) {
                reject();
                return;
            }
            results.forEach((item,index) => {
                if(item.url.includes(animationName)) {
                    resolve({uuid: item.uuid,url: item.url});
                }
            })
        })
    })
}
exports.loadResByUuid = async (uuid) => {
    return new Promise((resolve,reject) => {
        cc.loader.load({type: 'uuid',uuid},(err,res) => {
            if(err) {
                reject();
                return;
            }
            resolve(res);
        })
    })
}