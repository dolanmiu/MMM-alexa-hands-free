module.exports=function(e){var t={};function r(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}return r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{configurable:!1,enumerable:!0,get:n})},r.r=function(e){Object.defineProperty(e,"__esModule",{value:!0})},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r.w={},r(r.s=22)}([function(e,t){e.exports=require("path")},function(e,t){e.exports=require("fs")},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});t.State=class{constructor(e,t){this.components=e,this.name=t,this.allowedStateTransitions=new Map}transition(e){this.canTransition(e)?(console.log(`transiting to state: ${e.name}`),this.onExit(),e.onEnter()):console.error(`Invalid transition to state: ${e}`)}canTransition(e){return this.allowedStateTransitions.has(e.name)}set AllowedStateTransitions(e){this.allowedStateTransitions=e}}},function(e,t){e.exports=require("rxjs/Rx")},function(e,t){e.exports=require("node-record-lpcm16")},function(e,t){e.exports=require("snowboy")},function(e,t){e.exports=require("request")},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const n=r(1),o=r(4),s=r(0),i=r(2);t.ListeningState=class extends i.State{constructor(e){super(e,"listening")}onEnter(){this.components.rendererSend("listening",{});const e=n.createWriteStream(s.resolve(__dirname,"temp/to-amazon.wav"));e.on("finish",()=>{this.transition(this.allowedStateTransitions.get("busy"))}),this.components.mic.pipe(e),this.detectorSubscription=this.components.detector.Observable.subscribe(e=>{switch(e){case 0:o.stop()}})}onExit(){this.detectorSubscription.unsubscribe()}}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const n=r(0),o=r(3),s=r(5);t.HotwordDetector=class extends s.Detector{constructor(e){super({resource:n.resolve(__dirname,"resources/common.res"),models:e,audioGain:2}),this.subject=new o.Subject,this.setUp()}setUp(){this.on("hotword",()=>{this.hotwordStartAt=Date.now(),this.subject.next(1)}),this.on("sound",()=>{this.hotwordStartAt&&(this.hasSaidSomething=!0)}),this.on("silence",()=>{(this.hasSaidSomething||Date.now()-this.hotwordStartAt>5e3)&&(this.subject.next(0),this.hotwordStartAt=void 0,this.hasSaidSomething=!1)}),this.on("error",console.error)}get Observable(){return this.subject.asObservable()}}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const n=r(4),o=r(8),s=r(2);t.IdleState=class extends s.State{constructor(e){super(e,"idle")}onEnter(){this.components.rendererSend("idle",{}),this.components.detector=new o.HotwordDetector(this.components.models),this.components.mic=this.createMic(),this.components.mic.pipe(this.components.detector),this.detectorSubscription=this.components.detector.Observable.subscribe(e=>{switch(e){case 1:this.transition(this.allowedStateTransitions.get("listening"))}})}onExit(){this.detectorSubscription.unsubscribe()}createMic(){return n.start({threshold:0,verbose:!1})}}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const n=r(1),o=r(0),s=r(2);t.BusyState=class extends s.State{constructor(e){super(e,"busy")}onEnter(){this.components.rendererSend("busy",{});const e=n.createReadStream(o.resolve(__dirname,"temp/to-amazon.wav")),t=this.components.configService.Config.accessToken;this.components.audioService.sendAudio(t,e).then(e=>{this.components.rendererSend("speak",e)}).catch(e=>{console.error(e),this.transition(this.allowedStateTransitions.get("idle"))}),this.rendererSubscription=this.components.rendererCommunicator.Observable.subscribe(e=>{"finishedSpeaking"===e&&this.transition(this.allowedStateTransitions.get("idle"))})}onExit(){this.rendererSubscription.unsubscribe()}}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const n=r(10),o=r(9),s=r(7);t.AlexaStateMachine=class{constructor(e){this.idleState=new o.IdleState(e),this.listeningState=new s.ListeningState(e),this.busyState=new n.BusyState(e),this.idleState.AllowedStateTransitions=new Map([["listening",this.listeningState]]),this.listeningState.AllowedStateTransitions=new Map([["busy",this.busyState],["idle",this.idleState]]),this.busyState.AllowedStateTransitions=new Map([["idle",this.idleState]]),this.currentState=this.idleState,this.currentState.onEnter()}}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const n=r(3);t.RendererCommunicator=class{constructor(){this.subject=new n.Subject}sendNotification(e){this.subject.next(e)}get Observable(){return this.subject.asObservable()}}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});t.MODELS={Alexa:{file:"alexa.umdl",name:"alexa"},Jarvis:{file:"jarvis.umdl",name:"jarvis"},"Smart Mirror":{file:"smart-mirror.umdl",name:"smart mirror"},Computer:{file:"computer.umdl",name:"computer"},Snowboy:{file:"snowboy.umdl",name:"snowboy"}}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const n=r(0),o=r(5),s=r(13);t.AlexaModels=class extends o.Models{constructor(e){super();let t=s.MODELS[e];void 0===t&&(console.error(`model ${e} is not found, so using Alexa instead`),t=s.MODELS.Alexa),this.add({file:n.resolve(__dirname,"resources/models",t.file),sensitivity:"0.5",hotwords:t.name})}}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=r(14);t.AlexaModels=n.AlexaModels},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});t.ConfigService=class{constructor(e){this.config=e}get Config(){return this.config}}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const n=r(6),o=r(3);t.TokenService=class{constructor(e){this.observable=new o.Observable(t=>{if(void 0===e.redirectUrl)throw new Error("redirectUrl required");this.obtainToken(e).then(e=>{t.next(e)}).catch(e=>{throw new Error(e)}),setInterval(()=>{this.obtainToken(e).then(e=>{t.next(e)}).catch(e=>{throw new Error(e)})},3e6)})}obtainToken(e){return new Promise((t,r)=>{const o=`grant_type=refresh_token&refresh_token=${e.refreshToken}&client_id=${e.clientId}&client_secret=${e.clientSecret}&redirect_uri=${encodeURIComponent(e.redirectUrl)}`;n.post({uri:"https://api.amazon.com/auth/o2/token",json:!0,headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},body:o},(e,n,o)=>{null===e?void 0!==n.statusCode&&(n.statusCode<200||n.statusCode>=300)?r(o):t(o):r(e)})})}get Observable(){return this.observable}}},function(e,t){e.exports=require("http-message-parser")},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const n=r(1),o=r(0),s=r(6),i=r(18),a="https://access-alexa-na.amazon.com/v1/avs/speechrecognizer/recognize";t.AudioService=class{sendAudio(e,t){const r=n.createWriteStream(o.resolve(__dirname,"temp/output.mpeg"));return new Promise((c,u)=>{s.post({uri:a,headers:{Authorization:`Bearer ${e}`},formData:{metadata:{value:JSON.stringify({messageHeader:{},messageBody:{profile:"alexa-close-talk",locale:"en-us",format:"audio/L16; rate=16000; channels=1"}}),options:{"Content-Disposition":'form-data; name="metadata"',"Content-Type":"application/json; charset=UTF-8"}},audio:{value:t,options:{"Content-Type":"audio/L16; rate=16000; channels=1","Content-Disposition":'form-data; name="audio"'}}}},(e,t,r)=>{if(null===e)if(t.statusCode<200||t.statusCode>=300)u(r);else{var n=i(r);if(console.log("headers: "+JSON.stringify(t.headers)),n.multipart){n.multipart.length>2&&console.log("WARNING: More than 2 parts were found in API response, only returning the first application/json part");for(var o=0;o<n.multipart.length;o++){var s=n.multipart[o],a=null;if(s&&s.headers&&(a=s.headers["Content-Type"],console.log("contentType: "+a)),"application/json"==a){var l=s.body.toString();console.log("content: "+l);var d=JSON.parse(l);console.log("json: "+JSON.stringify(d,null,4)),c(d);break}}}}else u(e)}).pipe(r),r.on("finish",()=>{0!==r.bytesWritten?c():n.unlink(o.resolve(__dirname,"temp/output.mpeg"),()=>{c()})})})}}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=r(19);t.AudioService=n.AudioService;var o=r(17);t.TokenService=o.TokenService},function(e,t){e.exports=require("node_helper")},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const n=r(1),o=r(21),s=r(0),i=r(20),a=r(16),c=r(15),u=r(12),l=r(11);e.exports=o.create({start(){this.expressApp.get("/output.mpeg",(e,t)=>{t.setHeader("Expires",(new Date).toUTCString());const r=s.resolve(__dirname,"temp/output.mpeg");n.existsSync(r)?n.createReadStream(r).pipe(t):n.createReadStream(s.resolve(__dirname,"resources/alexa/sorry-im-not-sure.mpeg")).pipe(t)})},socketNotificationReceived(e,t){if("CONFIG"===e){const e=(e=>{if(!e.clientId)throw new Error("clientId must be defined");if(!e.clientSecret)throw new Error("clientSecret must be defined");if(!e.deviceId)throw new Error("deviceId must be defined");if(!e.refreshToken)throw new Error("refreshToken must be defined");if(!e.wakeWord)throw new Error("wakeWord must be defined");return{wakeWord:e.wakeWord,clientId:e.clientId,clientSecret:e.clientSecret,deviceId:e.deviceId,refreshToken:e.refreshToken,lite:e.lite||!1,isSpeechVisualizationEnabled:e.isSpeechVisualizationEnabled||!1}})(t),r=new a.ConfigService(e);return this.rendererCommunicator=new u.RendererCommunicator,this.alexaStateMachine=new l.AlexaStateMachine({audioService:new i.AudioService,configService:r,rendererSend:(e,t)=>{this.sendSocketNotification(e,t)},rendererCommunicator:this.rendererCommunicator,models:new c.AlexaModels(e.wakeWord)}),void new i.TokenService({refreshToken:e.refreshToken,clientId:e.clientId,clientSecret:e.clientSecret,deviceId:e.deviceId,redirectUrl:""}).Observable.subscribe(e=>{r.Config.accessToken=e.access_token})}this.rendererCommunicator.sendNotification(e)}})}]);