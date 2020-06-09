const CacheBg = {
    /** 缓存背景图节点 如果该背景图对应的图片的uuid相同就认为引用的是同一份资源可以进行延迟加载资源 */
    cacheBg: (name,uuid,cache) => {
        // this.cache
        
        if(cache[name] && cache[name] === uuid) {
            /** 该资源已经存在可以进行延迟加载资源 */
            return true;
        } else if(!cache[name]) {
            cache[name] = uuid;
            /** 该资源缓存里面还没有不可以勾选延迟加载资源 */
            return false;
        } else if(cache[name] && cache[name] !== uuid) {
            if(CC_EDITOR) {
                Editor.log("资源名重名");
            }
        }
    },
    /** 自动生成工具的相声名字语音缓存 */
    configCache: {
        mainTemplateCount: 27,
        talkNum: 5,
        talkNameArray: [
          "SL3U1_1_talk_pt1",
          "SL3U1_1_talk_pt2",
          "SL3U1_1_talk_pt3",
          "SL3U1_1_talk_pt4",
          "SL3U1_1_talk_pt5"
        ],
        topicLevelArray: [
            3,
            4,
            5,
            3
        ],
        largeLevelNum: 4
    }
}
module.exports = CacheBg;