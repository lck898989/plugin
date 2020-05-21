'use strict';
/*** 主线程 */
module.exports = {
  load () {
    // execute when package loaded
  },

  unload () {
    // execute when package unloaded
  },

  // register your ipc messages here
  messages: {
    'open' () {
      // open entry panel registered in package.json
      Editor.Panel.open('autobind');

    },
    'say-hello' () {
      Editor.log('Hello World!');
      // send ipc message to panel
      Editor.Ipc.sendToPanel('autobind', 'autobind:hello');
    },
    'clicked' () {
      Editor.log('Button clicked!');
    },
    'loadprefab' (event,params) {
      let has = Editor.assetdb.exists(params.dbUrl);
      
      if(has && event.reply) {
        let uuid = Editor.assetdb.urlToUuid(params.dbUrl);
        event.reply(uuid);
      } else {
        event.reply("null");
      }
    },
    'saveScene' (event,params) {
      // 保存场景
      Editor.Ipc.sendToPanel("scene","scene:stash-and-save",err => {
        if(err.code === 'ETIMEOUT') {
          Editor.warn("刷新超时");
        }
        event.reply();
        return;
      },5000);
    }
  },
};