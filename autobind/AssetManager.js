const AssetManager = {
    loadPrefabNodeByUuid: (uuid) => {
        return new Promise((resolve,reject) => {
            cc.loader.load({uuid},async (err,res) => {
                if(err) {
                    reject(null);
                    return;
                }
                resolve(res);
            })
        })
    }

}
module.exports = AssetManager;