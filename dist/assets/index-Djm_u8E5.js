(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))i(a);new MutationObserver(a=>{for(const o of a)if(o.type==="childList")for(const s of o.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function e(a){const o={};return a.integrity&&(o.integrity=a.integrity),a.referrerPolicy&&(o.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?o.credentials="include":a.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(a){if(a.ep)return;a.ep=!0;const o=e(a);fetch(a.href,o)}})();class Ct{updateFn;renderFn;lastTime=0;accumulator=0;fixedDeltaTime=1/60;animationFrameId=null;isRunning=!1;fps=0;frameCount=0;fpsTime=0;constructor(t,e){this.updateFn=t,this.renderFn=e}start(){this.isRunning||(this.isRunning=!0,this.lastTime=performance.now(),this.fpsTime=this.lastTime,this.frameCount=0,this.animationFrameId=requestAnimationFrame(this.tick.bind(this)))}stop(){this.isRunning&&(this.isRunning=!1,this.animationFrameId!==null&&(cancelAnimationFrame(this.animationFrameId),this.animationFrameId=null))}tick(t){if(!this.isRunning)return;const e=Math.min((t-this.lastTime)/1e3,.1);for(this.lastTime=t,this.frameCount++,t-this.fpsTime>=1e3&&(this.fps=this.frameCount,this.frameCount=0,this.fpsTime=t),this.accumulator+=e;this.accumulator>=this.fixedDeltaTime;)this.updateFn(this.fixedDeltaTime),this.accumulator-=this.fixedDeltaTime;const i=this.accumulator/this.fixedDeltaTime;this.renderFn(i),this.animationFrameId=requestAnimationFrame(this.tick.bind(this))}}const Q=new URLSearchParams(window.location.search);function J(){const v=Q.get("touch");if(v==="1")return!0;if(v==="0")return!1;const t=window.matchMedia?.("(pointer: coarse)").matches??!1,e=window.matchMedia?.("(pointer: fine)").matches??!1;return t||navigator.maxTouchPoints>0&&!e}function St(){return Math.min(window.screen.width,window.screen.height)<=540}function Tt(){const v=Q.get("quality");return v==="phone"||v==="ultra_low"||v==="low"||v==="medium"||v==="high"?v:null}function zt(){const v=parseFloat(Q.get("scale")??"");return Number.isFinite(v)?Math.max(.3,Math.min(1,v)):.55}function Rt(){const v=Tt();if(v)return v==="phone";const t=tt().quality;return t==="low"?!0:t==="high"?!1:J()||St()}function bt(){return window.location.pathname.startsWith("/games/")?"/":"../launch.html"}function j(v){return window.location.pathname.startsWith("/games/")?"в студию":v}function wt(){window.location.href=new URL(bt(),window.location.href).href}const kt="studio.controls.v1",Gt={lookSens:1,invertY:!1,touchSize:100,touchOpacity:70,leftHanded:!1,vibration:!0,volume:80},U=(v,t,e,i)=>typeof v=="number"&&Number.isFinite(v)?Math.max(e,Math.min(i,v)):t;function tt(){let v={};try{const e=JSON.parse(window.localStorage.getItem(kt)??"{}");e&&typeof e=="object"&&(v=e)}catch{}const t=Gt;return{lookSens:U(v.lookSens,t.lookSens,.2,3),invertY:typeof v.invertY=="boolean"?v.invertY:t.invertY,touchSize:U(v.touchSize,t.touchSize,70,150),touchOpacity:U(v.touchOpacity,t.touchOpacity,20,100),leftHanded:typeof v.leftHanded=="boolean"?v.leftHanded:t.leftHanded,vibration:typeof v.vibration=="boolean"?v.vibration:t.vibration,quality:v.quality==="low"||v.quality==="high"?v.quality:"auto",volume:U(v.volume,t.volume,0,100)}}function Dt(v){window.addEventListener("storage",t=>{t.key===kt&&v(tt())})}const z={A:0,B:1,X:2,LB:4,RB:5,LT:6,RT:7,VIEW:8,START:9},ut={fire:[z.RT],altFire:[z.LT],jump:[z.A],run:[z.LB,z.B],throwGrenade:[z.RB],reload:[z.X]},ft=["run","jump","fire","altFire","reload"],_t=.35,Vt=2.6,Et=.005,_=()=>({run:!1,jump:!1,fire:!1,altFire:!1,reload:!1,throwGrenade:!1});class It{state={forward:!1,backward:!1,left:!1,right:!1,run:!1,jump:!1,fire:!1,altFire:!1,reload:!1,throwGrenade:!1,moveX:0,moveY:0};mouseDelta={x:0,y:0};isPointerLocked=!1;usesPointerLock;sensitivity=.005;setSensitivity(t){this.sensitivity=Math.max(.001,Math.min(.015,t))}invertX=!0;invertY=!0;canvas;onPointerLockChange;deadzone=.15;padLookScale=1;touchLookScale=1;invertPadTouchY=!1;padConnected=!1;onPadButton;keys={forward:!1,backward:!1,left:!1,right:!1};keyHeld=_();padHeld=_();padButtons=[];padBias=null;padMove={x:0,y:0};virtualHeld=_();virtualPulse=_();virtualMove={x:0,y:0};virtual={setMove:(t,e)=>{this.virtualMove.x=t||0,this.virtualMove.y=e||0,this.combine()},addLook:(t,e)=>{this.addLookPixels(t,this.invertPadTouchY?-e:e,this.touchLookScale)},set:(t,e)=>{if(t==="throwGrenade"){e&&(this.state.throwGrenade=!0);return}e&&!this.virtualHeld[t]&&(this.virtualPulse[t]=!0),this.virtualHeld[t]=e,this.combine()},clear:()=>{this.virtualHeld=_(),this.virtualMove.x=this.virtualMove.y=0,this.combine()}};constructor(t){this.canvas=t,this.usesPointerLock=typeof t.requestPointerLock=="function"&&!J(),this.setupListeners()}setupListeners(){document.addEventListener("keydown",this.handleKeyDown.bind(this)),document.addEventListener("keyup",this.handleKeyUp.bind(this)),document.addEventListener("mousemove",this.handleMouseMove.bind(this)),document.addEventListener("mousedown",this.handleMouseDown.bind(this)),document.addEventListener("mouseup",this.handleMouseUp.bind(this)),document.addEventListener("wheel",this.handleWheel.bind(this)),this.canvas.addEventListener("contextmenu",t=>t.preventDefault()),document.addEventListener("pointerlockchange",this.handlePointerLockChange.bind(this)),window.addEventListener("gamepadconnected",t=>{console.log(`🎮 Геймпад: ${t.gamepad.id}`),this.padConnected=!0}),window.addEventListener("gamepaddisconnected",()=>{this.padConnected=!1})}requestPointerLock(t){if(this.onPointerLockChange=t,!!this.usesPointerLock)try{this.canvas.requestPointerLock()?.catch?.(()=>{})}catch{}}exitPointerLock(){document.pointerLockElement&&typeof document.exitPointerLock=="function"&&document.exitPointerLock()}resetMouseDelta(){this.mouseDelta.x=0,this.mouseDelta.y=0}isMoving(){return Math.abs(this.state.moveX)+Math.abs(this.state.moveY)>.1}poll(t){this.pollGamepad(t),this.combine(),this.virtualPulse=_()}pollGamepad(t){const e=typeof navigator.getGamepads=="function"?navigator.getGamepads():[];let i=null;for(const r of e)if(r&&r.connected!==!1){i=r;break}if(!i){this.padBias&&(this.padBias=null,this.padButtons=[],this.padHeld=_(),this.padMove.x=this.padMove.y=0);return}this.padConnected=!0,this.padBias||(this.padBias=Array.from(i.axes,r=>Math.abs(r)<.25?r:0));const a=i.buttons.map((r,h)=>(h===z.LT||h===z.RT)&&r.value>_t||r.pressed);for(let r=0;r<a.length;r++)a[r]&&!this.padButtons[r]&&(r===ut.throwGrenade[0]&&(this.state.throwGrenade=!0),this.onPadButton?.(r));this.padButtons=a;for(const r of ft)this.padHeld[r]=ut[r].some(h=>!!a[h]);const[o,s]=this.stick(i,0,1);this.padMove.x=o,this.padMove.y=-s;const[n,l]=this.stick(i,2,3),c=Vt*this.padLookScale*(this.sensitivity/Et)*t;this.mouseDelta.x+=(this.invertX?-1:1)*n*Math.abs(n)*c,this.mouseDelta.y+=(this.invertY!==this.invertPadTouchY?-1:1)*l*Math.abs(l)*c}stick(t,e,i){const a=this.padBias??[],o=Math.max(-1,Math.min(1,(t.axes[e]??0)-(a[e]??0))),s=Math.max(-1,Math.min(1,(t.axes[i]??0)-(a[i]??0))),n=Math.hypot(o,s);if(n<this.deadzone)return[0,0];const l=Math.min(1,(n-this.deadzone)/(1-this.deadzone))/n;return[o*l,s*l]}combine(){const t=this.state;for(const o of ft)t[o]=this.keyHeld[o]||this.padHeld[o]||this.virtualHeld[o]||this.virtualPulse[o];let e=(this.keys.right?1:0)-(this.keys.left?1:0)+this.padMove.x+this.virtualMove.x,i=(this.keys.forward?1:0)-(this.keys.backward?1:0)+this.padMove.y+this.virtualMove.y;const a=Math.hypot(e,i);a>1&&(e/=a,i/=a),t.moveX=e,t.moveY=i,t.forward=i>.25,t.backward=i<-.25,t.right=e>.25,t.left=e<-.25}addLookPixels(t,e,i){const a=this.invertX?-t:t,o=this.invertY?-e:e;this.mouseDelta.x+=a*this.sensitivity*i,this.mouseDelta.y+=o*this.sensitivity*i}handleKeyDown(t){this.updateKeyState(t.code,!0)}handleKeyUp(t){this.updateKeyState(t.code,!1)}updateKeyState(t,e){switch(t){case"KeyW":this.keys.forward=e;break;case"KeyS":this.keys.backward=e;break;case"KeyA":this.keys.left=e;break;case"KeyD":this.keys.right=e;break;case"ShiftLeft":case"ShiftRight":this.keyHeld.run=e;break;case"Space":this.keyHeld.jump=e;break;case"KeyR":this.keyHeld.reload=e;break;default:return}this.combine()}handleMouseMove(t){this.isPointerLocked&&this.addLookPixels(t.movementX,t.movementY,1)}handleMouseDown(t){t.button===0?this.keyHeld.fire=!0:t.button===1?(t.preventDefault(),this.state.throwGrenade=!0):t.button===2&&(t.preventDefault(),this.keyHeld.altFire=!0),this.combine()}handleMouseUp(t){t.button===0?this.keyHeld.fire=!1:t.button===2&&(this.keyHeld.altFire=!1),this.combine()}handleWheel(t){this.isPointerLocked&&(t.preventDefault(),this.state.throwGrenade=!0)}handlePointerLockChange(){this.isPointerLocked=document.pointerLockElement===this.canvas,this.onPointerLockChange?.()}destroy(){document.removeEventListener("keydown",this.handleKeyDown.bind(this)),document.removeEventListener("keyup",this.handleKeyUp.bind(this)),document.removeEventListener("mousemove",this.handleMouseMove.bind(this)),document.removeEventListener("mousedown",this.handleMouseDown.bind(this)),document.removeEventListener("mouseup",this.handleMouseUp.bind(this)),document.removeEventListener("pointerlockchange",this.handlePointerLockChange.bind(this))}}const Bt={"top-bar":[{id:"hub",slot:"left",label:"в хаб",icon:"back",pad:"View",key:"todo",note:"в играх биндинга нет; предложение: View (GP8) → в хаб",proposal:["pad"]},{id:"settings",slot:"right",label:"Управление",icon:"gear",pad:"Menu",key:"Esc",note:"в играх биндинга нет; предложение: Menu (GP9) и Esc → ⚙ (Esc сначала снимает pointer lock — браузер)",proposal:["pad","key"]}]},Ft={samurai:{controls:[{id:"move",zone:"left-stick",axes:"xy",label:"Ход",pad:"LS",key:"WASD",bind:{up:"KeyW",down:"KeyS",left:"KeyA",right:"KeyD",stick:"axes0-1"},note:"аналог: неполное отклонение — медленнее"},{id:"look",zone:"right-look-swipe",label:"Обзор",pad:"RS",key:"Мышь",bind:{mouse:"movementX/Y под pointer lock",stick:"axes2-3",touch:"свайп, px × чувствительность"}},{id:"fire",zone:"right-arc",pos:1,label:"Удар",icon:"attack",pad:"RT",key:"ЛКМ",bind:["Mouse0","GP7"]},{id:"altFire",zone:"right-arc",pos:2,label:"Волна",icon:"wave",pad:"LT",key:"ПКМ",bind:["Mouse2","GP6"],note:"сплеш-волна при зарядах, дротики при запасе"},{id:"jump",zone:"right-arc",pos:3,label:"Прыжок",icon:"jump",pad:"A",key:"Space",bind:["Space","GP0"],note:"второй тап в воздухе — двойной прыжок"},{id:"throwGrenade",zone:"right-arc",pos:4,label:"Граната",icon:"grenade",pad:"RB",key:"Колесо",bind:["Mouse1","wheel","GP5"]},{id:"run",zone:"right-arc",pos:5,label:"Бег",icon:"run",pad:"LB",key:"Shift",bind:["ShiftLeft","ShiftRight","GP4","GP1"],note:"на паде ещё B"},{id:"pause",zone:"top-bar",slot:"right",label:"Пауза",icon:"pause",pad:"Menu",key:"Esc",bind:["Escape","GP9"],note:"вместо ⚙: настройки игры — на её стартовом экране; на таче пауза только этой кнопкой"}]}},mt={common:Bt,worlds:Ft},Ot={back:'<path d="M15 5l-7 7 7 7"/>',pause:'<path d="M9 5v14M15 5v14"/>',run:'<path d="M5 6l6 6-6 6M12 6l6 6-6 6"/>',attack:'<path d="M5 19L19 5M14 5h5v5"/>',wave:'<path d="M3 12c3-6 6 6 9 0s6 6 9 0"/>',jump:'<path d="M12 20V8M7 12l5-5 5 5M6 4h12"/>',grenade:'<circle cx="12" cy="14" r="6"/><path d="M12 8V5h3"/>',swipe:'<path d="M4 9h48M4 9l6-6M4 9l6 6M52 9l-6-6M52 9l-6 6"/>',rotate:'<rect x="2" y="8" width="16" height="10" rx="2"/><path d="M15 3a6 6 0 0 1 6 5M21 4v4h-4"/>'},O=(v,t="")=>`<svg viewBox="0 0 ${v==="swipe"?"56 18":"24 24"}"${t?` class="${t}"`:""}>${Ot[v]??""}</svg>`,G=v=>v.replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]),Z=v=>`<span class="tc-badges"><b class="tc-pad" data-g="${G(v.pad)}">${G(v.pad)}</b><b class="tc-key" data-k="${G(v.key)}">${G(v.key)}</b></span>`;class qt{constructor(t,e){this.input=t,this.onPause=e,this.root=document.createElement("div"),this.root.className="tc tc--touch sp-tc",this.root.innerHTML=this.markup(),document.body.appendChild(this.root),document.body.classList.add("sp-touch"),this.stick=this.root.querySelector(".tc-stick"),this.bindStick(),this.bindLook(),this.bindButtons(),this.blockBrowserGestures(),this.setMode("menu")}root;stick;mode="menu";stickPointer=null;stickOrigin={x:0,y:0};lookPointers=new Map;applyStudio(t){this.root.style.setProperty("--tc-scale",String(t.touchSize/100)),this.root.style.setProperty("--tc-alpha",String(t.touchOpacity/100)),this.root.classList.toggle("tc--mirror",t.leftHanded),document.body.classList.toggle("sp-lefty",t.leftHanded)}setMode(t){this.mode=t,this.root.dataset.mode=t,t!=="play"&&this.releaseAll()}releaseAll(){this.stickPointer=null,this.lookPointers.clear(),this.resetStick(),this.root.querySelectorAll(".tc-btn.on").forEach(t=>t.classList.remove("on")),this.input.virtual.clear()}markup(){const e=mt.worlds.samurai.controls,i=mt.common["top-bar"][0],a=e.find(l=>l.zone==="left-stick"),o=e.find(l=>l.zone==="right-look-swipe"),s=e.find(l=>l.zone==="top-bar"&&l.slot==="right"),n=e.filter(l=>l.zone==="right-arc").sort((l,c)=>(l.pos??0)-(c.pos??0));return`
      <div class="tc-top">
        <button class="tc-hub" data-act="hub" aria-label="Вернуться: ${G(j(i.label))}"><i class="tc-plate">${O(i.icon)}${G(j(i.label))}</i></button>
        <span class="tc-top-r">
          <button class="tc-gear sp-pause" data-act="${s.id}" aria-label="${G(s.label)}"><i class="tc-plate">${O(s.icon??"pause")}</i></button>
        </span>
      </div>
      <div class="sp-stickzone"></div>
      <div class="tc-stick tc-plate" data-act="${a.id}" data-axes="xy">
        <span class="tc-knob"></span>
        <span class="tc-cap tc-plate"><span class="tc-lbl">${G(a.label)}</span>${Z(a)}</span>
      </div>
      <div class="tc-look" data-act="${o.id}">
        <span class="tc-cap tc-plate">${O("swipe","tc-swipe")}<span class="tc-lbl">${G(o.label)}</span>${Z(o)}</span>
      </div>
      <div class="tc-arc" data-n="${n.length}">${n.map(l=>`
        <button class="tc-btn tc-plate" data-act="${l.id}" data-pos="${l.pos}" aria-label="${G(l.label)}">
          ${O(l.icon??"")}<span class="tc-lbl">${G(l.label)}</span>${Z(l)}</button>`).join("")}
      </div>
      <div class="tc-rotate tc-plate">${O("rotate")}<div><b>Поверни телефон</b><span>Играть удобнее горизонтально — стик слева, кнопки справа</span></div></div>`}bindStick(){const t=this.root.querySelector(".sp-stickzone");t.addEventListener("pointerdown",i=>{if(i.preventDefault(),this.mode!=="play"||this.stickPointer!==null)return;this.stickPointer=i.pointerId,t.setPointerCapture(i.pointerId),this.stickOrigin={x:i.clientX,y:i.clientY};const a=this.stick.offsetWidth;this.stick.style.left=`${i.clientX-a/2}px`,this.stick.style.bottom=`${window.innerHeight-i.clientY-a/2}px`,this.stick.classList.add("live")}),t.addEventListener("pointermove",i=>{if(i.pointerId!==this.stickPointer)return;const a=this.stick.offsetWidth,o=a*.4;let s=i.clientX-this.stickOrigin.x,n=i.clientY-this.stickOrigin.y;const l=Math.hypot(s,n);l>o&&(s=s/l*o,n=n/l*o);const c=a*.28/o;this.stick.style.setProperty("--kx",`${s*c}px`),this.stick.style.setProperty("--ky",`${n*c}px`),this.input.virtual.setMove(s/o,-n/o)});const e=i=>{i.pointerId===this.stickPointer&&(this.stickPointer=null,this.resetStick(),this.input.virtual.setMove(0,0))};t.addEventListener("pointerup",e),t.addEventListener("pointercancel",e)}resetStick(){this.stick.classList.remove("live"),this.stick.style.removeProperty("left"),this.stick.style.removeProperty("bottom"),this.stick.style.setProperty("--kx","0px"),this.stick.style.setProperty("--ky","0px")}bindLook(){const t=this.root.querySelector(".tc-look");t.addEventListener("pointerdown",i=>{i.preventDefault(),this.mode==="play"&&(t.setPointerCapture(i.pointerId),this.lookPointers.set(i.pointerId,{x:i.clientX,y:i.clientY}))}),t.addEventListener("pointermove",i=>{const a=this.lookPointers.get(i.pointerId);a&&(this.input.virtual.addLook(i.clientX-a.x,i.clientY-a.y),a.x=i.clientX,a.y=i.clientY,t.classList.add("used"))});const e=i=>this.lookPointers.delete(i.pointerId);t.addEventListener("pointerup",e),t.addEventListener("pointercancel",e)}bindButtons(){this.root.querySelectorAll(".tc-btn").forEach(i=>{const a=i.dataset.act;i.addEventListener("pointerdown",s=>{s.preventDefault(),this.mode==="play"&&(i.setPointerCapture(s.pointerId),i.classList.add("on"),this.input.virtual.set(a,!0))});const o=()=>{i.classList.contains("on")&&(i.classList.remove("on"),this.input.virtual.set(a,!1))};i.addEventListener("pointerup",o),i.addEventListener("pointercancel",o),i.addEventListener("lostpointercapture",o)}),this.root.querySelector('[data-act="hub"]').addEventListener("click",()=>wt()),this.root.querySelector(".sp-pause").addEventListener("click",i=>{i.stopPropagation(),this.onPause()})}blockBrowserGestures(){document.addEventListener("touchmove",t=>{this.mode!=="menu"&&t.preventDefault()},{passive:!1}),document.addEventListener("gesturestart",t=>t.preventDefault()),document.addEventListener("dblclick",t=>t.preventDefault()),window.addEventListener("blur",()=>this.releaseAll())}}function w(v=0,t=0,e=0){return{x:v,y:t,z:e}}function Lt(v,t){return{x:v.x-t.x,y:v.y-t.y,z:v.z-t.z}}function Ht(v){return Math.sqrt(v.x*v.x+v.y*v.y+v.z*v.z)}function At(v,t){return Ht(Lt(v,t))}function Xt(v,t,e){return Math.max(t,Math.min(e,v))}const Ut={walkSpeed:8,runSpeed:20,jumpForce:12,gravity:25,groundFriction:12,airControl:.85,mouseSensitivity:.002};class Nt{state;config;collision;isInVoid=!1;stepSpeed=12;maxStepHeight=.5;targetYaw=0;targetPitch=-.05;airJumpCooldown=0;AIR_JUMP_COOLDOWN=2;airJumpsLeft=0;maxAirJumps=1;canAirJump=!1;rageMode=!1;rageModeTimer=0;speedBoost=1;speedBoostTimer=0;inWater=!1;WATER_SLOW_FACTOR=.5;constructor(t=w(0,1.7,5),e={},i){this.config={...Ut,...e},this.collision=i,this.state={position:{...t},velocity:w(),yaw:0,pitch:-.05,grounded:!0,eyeHeight:1.7,health:100,maxHealth:100}}update(t,e,i){this.rageModeTimer>0&&(this.rageModeTimer-=t,this.rageModeTimer<=0&&(this.rageMode=!1)),this.speedBoostTimer>0&&(this.speedBoostTimer-=t,this.speedBoostTimer<=0&&(this.speedBoost=1)),this.airJumpCooldown>0&&(this.airJumpCooldown-=t),this.updateCamera(i),this.updateMovement(t,e)}activateStimpack(){this.rageMode=!0,this.rageModeTimer=8,this.speedBoost=1.8,this.speedBoostTimer=8}tryDoubleJump(){return!this.canAirJump||this.airJumpsLeft<=0?!1:this.rageMode?(this.state.velocity.y=this.config.jumpForce*.9,this.airJumpsLeft--,this.canAirJump=!1,!0):this.airJumpCooldown<=0?(this.airJumpCooldown=this.AIR_JUMP_COOLDOWN,this.state.velocity.y=this.config.jumpForce,this.airJumpsLeft--,this.canAirJump=!1,!0):!1}onJumpReleased(){this.state.grounded||(this.canAirJump=!0)}getDoubleJumpCooldown(){return Math.max(0,this.airJumpCooldown)}isDoubleJumpReady(){return this.airJumpCooldown<=0&&this.airJumpsLeft>0||this.rageMode}unlockTripleJump(){this.maxAirJumps=2}getAirJumpsLeft(){return this.airJumpsLeft}updateCamera(t){this.targetYaw-=t.x,this.targetPitch+=t.y,this.targetPitch=Xt(this.targetPitch,-Math.PI/2+.01,Math.PI/2-.01),this.state.yaw+=(this.targetYaw-this.state.yaw)*.7,this.state.pitch+=(this.targetPitch-this.state.pitch)*.7}updateMovement(t,e){const{state:i,config:a}=this;let o=e.moveX,s=-e.moveY;const n=Math.sqrt(o*o+s*s);n>1&&(o/=n,s/=n);const l=Math.sin(i.yaw),c=Math.cos(i.yaw),r=o*c-s*l,h=o*l+s*c,p=Math.sqrt(i.position.x**2+i.position.z**2),u=Math.abs(i.position.z)<2.5||Math.abs(i.position.x)<2.5;this.inWater=p>2.5&&p<7.7&&!u&&i.position.y<1.5;const f=e.run?a.runSpeed:a.walkSpeed,m=this.inWater?this.WATER_SLOW_FACTOR:1,g=f*this.speedBoost*m,x=r*g,y=h*g,k=(this.isInVoid?i.position.y-i.eyeHeight:this.collision.getFloorHeight(i.position))+i.eyeHeight;if(i.grounded){const T=a.groundFriction*t;if(i.velocity.x+=(x-i.velocity.x)*Math.min(T,1),i.velocity.z+=(y-i.velocity.z)*Math.min(T,1),e.jump)i.velocity.y=a.jumpForce,i.grounded=!1,this.airJumpsLeft=this.maxAirJumps,this.canAirJump=!1;else{const M=k-i.position.y;Math.abs(M)<.01?(i.position.y=k,i.velocity.y=0):M>0&&M<this.maxStepHeight?i.velocity.y=this.stepSpeed:M<0&&M>-this.maxStepHeight?i.velocity.y=-this.stepSpeed*.8:M<-this.maxStepHeight&&(i.grounded=!1,i.velocity.y=0)}}else{const T=8*t;i.velocity.x+=(x-i.velocity.x)*Math.min(T,1),i.velocity.z+=(y-i.velocity.z)*Math.min(T,1),i.velocity.y-=a.gravity*t}const A=i.position.x+i.velocity.x*t,P=i.position.y+i.velocity.y*t,R=i.position.z+i.velocity.z*t,D={x:A,y:i.position.y,z:i.position.z};this.isInVoid||!this.collision.checkCollision(D)?i.position.x=A:i.velocity.x=0;const S={x:i.position.x,y:i.position.y,z:R};if(this.isInVoid||!this.collision.checkCollision(S)?i.position.z=R:i.velocity.z=0,this.isInVoid)i.position.y=P;else{const M=this.collision.getFloorHeight(i.position)+i.eyeHeight;if(i.grounded)i.position.y+=i.velocity.y*t,i.position.y<M&&(i.position.y=M,i.velocity.y=0);else if(P<=M)i.position.y=M,i.velocity.y=0,i.grounded=!0,this.canAirJump=!1,this.airJumpsLeft=0;else{const C={x:i.position.x,y:P,z:i.position.z},E=this.collision.getCeilingHeight(i.position);P<E-.3&&!this.collision.checkCollision(C)?i.position.y=P:i.velocity.y=Math.min(i.velocity.y,0)}}}getEyePosition(){return{x:this.state.position.x,y:this.state.position.y,z:this.state.position.z}}getLookDirection(){const{yaw:t,pitch:e}=this.state;return{x:Math.sin(t)*Math.cos(e),y:Math.sin(e),z:-Math.cos(t)*Math.cos(e)}}takeDamage(t){this.state.health=Math.max(0,this.state.health-t)}heal(t){this.state.health=Math.min(this.state.maxHealth,this.state.health+t)}isDead(){return this.state.health<=0}reset(t){this.state.position={...t},this.state.velocity=w(),this.state.health=this.state.maxHealth,this.state.grounded=!0}}class Wt{state;currentWeapon="katana";splashCharges=0;attackCooldown=0;attackDuration=.25;attackCooldownTime=.2;attackType=0;nextAttackType=0;attackRange=4;attackAngle=Math.PI*.6;damage=100;isAttacking=!1;attackProgress=0;onSlice;onSplash;isSplashAttack=!1;splashRadius=10;constructor(){this.state={ammo:999,reserveAmmo:999,magazineSize:999,isReloading:!1,reloadTimeLeft:0,recoilX:0,recoilY:0,recoilBack:0,muzzleFlash:0,bobPhase:0}}update(t,e,i){if(this.attackCooldown>0&&(this.attackCooldown-=t),this.isAttacking&&(this.attackProgress+=t/this.attackDuration,this.attackProgress>=1&&(this.isAttacking=!1,this.attackProgress=0)),e){const a=i?14:10;this.state.bobPhase+=t*a}else this.state.bobPhase*=.95;this.state.recoilX*=.85,this.state.recoilY*=.85,this.state.muzzleFlash*=.8}tryAttack(){return this.attackCooldown>0||this.isAttacking?!1:(this.attack(!1),!0)}trySplashAttack(){return this.attackCooldown>0||this.isAttacking||this.splashCharges<=0?!1:(this.attack(!0),!0)}attack(t){this.isAttacking=!0,this.attackProgress=0,this.attackCooldown=t?.5:this.attackCooldownTime,this.isSplashAttack=t,t&&(this.attackType=2),t?(this.splashCharges--,this.state.recoilX=.6,this.state.muzzleFlash=2,this.splashCharges<=0&&(this.currentWeapon="katana"),this.onSplash?.()):(this.state.recoilX=.3,this.state.muzzleFlash=1,this.onSlice?.())}chargeKatana(){this.currentWeapon="charged",this.splashCharges=3}isCharged(){return this.splashCharges>0}checkHit(t,e,i){if(!this.isAttacking||this.attackProgress<.2||this.attackProgress>.6)return!1;const a=i.x-t.x,o=i.z-t.z,s=Math.sqrt(a*a+o*o);if(this.isSplashAttack)return s<=this.splashRadius;if(s>this.attackRange)return!1;let l=Math.atan2(a,-o)-e;for(;l>Math.PI;)l-=Math.PI*2;for(;l<-Math.PI;)l+=Math.PI*2;return Math.abs(l)<this.attackAngle/2}getWeaponOffset(){const t=Math.sin(this.state.bobPhase)*.02,e=Math.abs(Math.sin(this.state.bobPhase*2))*.015;let i=0,a=0;if(this.isAttacking){const o=this.attackProgress;i=Math.sin(o*Math.PI)*.3,a=-Math.sin(o*Math.PI*2)*.1}return{x:t+this.state.recoilX+i,y:e-this.state.recoilY+a,z:0}}tryShoot(t,e){return this.tryAttack()}startReload(){return!1}projectiles=[]}class q{ctx;width;height;attackProgress=0;isAttacking=!1;isSplashAttack=!1;splashCharges=0;hitFlash=0;particles=[];static MAX_PARTICLES=50;splashWaveActive=!1;splashWaveProgress=0;splashWaveYaw=0;sceneLighting={ambient:[.12,.15,.2],accentColor:[.15,.7,1],brightness:.7};constructor(t){this.ctx=t.getContext("2d"),this.width=t.width,this.height=t.height}resize(t,e){this.width=t,this.height=e}setSceneLighting(t){t===1?this.sceneLighting={ambient:[.08,.12,.08],accentColor:[.4,1,.2],brightness:.75}:t===2?this.sceneLighting={ambient:[.07,.05,.12],accentColor:[.7,.15,1],brightness:.7}:this.sceneLighting={ambient:[.08,.1,.14],accentColor:[.15,.7,1],brightness:.75}}tintColor(t,e=1){const i=t.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);if(!i)return t;let a=parseInt(i[1],16)/255,o=parseInt(i[2],16)/255,s=parseInt(i[3],16)/255;const[n,l,c]=this.sceneLighting.ambient,r=this.sceneLighting.brightness;return a=a*r*(.6+n*2)*e,o=o*r*(.6+l*2)*e,s=s*r*(.6+c*2)*e,a=Math.min(1,Math.max(0,a)),o=Math.min(1,Math.max(0,o)),s=Math.min(1,Math.max(0,s)),`rgb(${Math.floor(a*255)}, ${Math.floor(o*255)}, ${Math.floor(s*255)})`}showHitEffect(){this.hitFlash=.5}showSplashEffect(){this.hitFlash=.6}showSplashWave(t){this.splashWaveYaw=t,this.hitFlash=.5}spawnWaveParticles(){if(this.particles.length>q.MAX_PARTICLES)return;const t=this.width/2,e=this.height/2,i=["#00ffff","#00e5ff","#00bfff","#40e0d0"];for(let a=0;a<12;a++){const o=a/12*Math.PI-Math.PI/2,s=600+Math.random()*300;this.particles.push({x:t,y:e,vx:Math.cos(o)*s,vy:Math.sin(o)*s*.3,size:5+Math.random()*6,color:i[a%i.length],life:.4+Math.random()*.3,maxLife:.4+Math.random()*.3,type:"spark"})}for(let a=0;a<6;a++){const o=(Math.random()-.5)*Math.PI*.8,s=600+Math.random()*300;this.particles.push({x:t+(Math.random()-.5)*100,y:e+(Math.random()-.5)*50,vx:Math.cos(o)*s,vy:Math.sin(o)*s*.2,size:12+Math.random()*18,color:i[Math.floor(Math.random()*i.length)],life:.8+Math.random()*.4,maxLife:.8+Math.random()*.4,type:"fragment"})}}spawnFragments(){if(this.particles.length>q.MAX_PARTICLES)return;const t=this.width/2,e=this.height/2,i=["#00ff00","#33ff00","#66ff33","#00ff66"];for(let a=0;a<6;a++){const o=a/6*Math.PI*2+Math.random()*.5,s=400+Math.random()*400;this.particles.push({x:t+(Math.random()-.5)*40,y:e+(Math.random()-.5)*40,vx:Math.cos(o)*s,vy:Math.sin(o)*s-150,size:6+Math.random()*8,color:i[a%i.length],life:.5+Math.random()*.3,maxLife:.5+Math.random()*.3,type:"fragment"})}for(let a=0;a<10;a++){const o=Math.random()*Math.PI*2,s=200+Math.random()*300;this.particles.push({x:t+(Math.random()-.5)*20,y:e+(Math.random()-.5)*20,vx:Math.cos(o)*s,vy:Math.sin(o)*s-80,size:2+Math.random()*3,color:i[a%i.length],life:.3+Math.random()*.2,maxLife:.3+Math.random()*.2,type:"spark"})}}updateParticles(t){const i=this.height+50;let a=0;for(let o=0;o<this.particles.length;o++){const s=this.particles[o];s.x+=s.vx*t,s.y+=s.vy*t,s.vy+=800*t,s.vx*=.98,s.life-=t,s.life>0&&s.y<i&&(this.particles[a++]=s)}this.particles.length=a}renderParticles(t){t.shadowBlur=0;for(const e of this.particles){const i=Math.min(1,e.life/e.maxLife*2);t.globalAlpha=i,t.fillStyle=e.color,e.type==="fragment"?(t.beginPath(),t.arc(e.x,e.y,e.size,0,Math.PI*2),t.fill(),t.globalAlpha=i*.8,t.fillStyle="#ffffff",t.beginPath(),t.arc(e.x,e.y,e.size*.4,0,Math.PI*2),t.fill()):(t.beginPath(),t.arc(e.x,e.y,e.size,0,Math.PI*2),t.fill(),t.globalAlpha=i*.5,t.strokeStyle=e.color,t.lineWidth=e.size*.5,t.beginPath(),t.moveTo(e.x,e.y),t.lineTo(e.x-e.vx*.02,e.y-e.vy*.02),t.stroke())}t.globalAlpha=1}render(t,e){const i=this.ctx;i.clearRect(0,0,this.width,this.height);const a=Math.min(this.width,this.height)/600,o=Math.sin(t.bobPhase)*8*a,s=Math.abs(Math.sin(t.bobPhase*2))*6*a;this.hitFlash>0&&(this.hitFlash-=.04),i.save();let n=this.width*.65,l=this.height*.8,c=-.4;if(this.isAttacking){const r=this.attackProgress,h=1-Math.pow(1-r,3);c=-.4-Math.sin(h*Math.PI)*(this.isSplashAttack?3.2:2.5);const u=this.isSplashAttack?1.5:1;n-=Math.sin(r*Math.PI)*this.width*.3*u,l-=Math.sin(r*Math.PI)*this.height*.15*u}i.translate(n+o,l+s),i.rotate(c),i.scale(a,a),i.restore(),this.hitFlash>.5&&this.drawScreenFlash(i,this.isSplashAttack?"charged":"katana")}applySceneLighting(t){const[e,i,a]=this.sceneLighting.ambient,o=this.sceneLighting.brightness;t.save(),t.globalCompositeOperation="source-atop";const s=o*.6;t.fillStyle=`rgba(0, 0, 0, ${1-s})`,t.fillRect(0,0,this.width,this.height),t.restore(),t.save(),t.globalCompositeOperation="source-atop";const n=Math.floor(e*255*2),l=Math.floor(i*255*2),c=Math.floor(a*255*2);t.fillStyle=`rgba(${n}, ${l}, ${c}, 0.25)`,t.fillRect(0,0,this.width,this.height),t.restore()}drawChargeIndicator(t,e){t.save(),t.shadowColor="#00ffff",t.shadowBlur=15;for(let i=0;i<3;i++){const a=-50-i*60,o=.7+.3*Math.sin(e*5+i);this.splashCharges>i?(t.fillStyle=`rgba(0, 255, 255, ${o})`,t.beginPath(),t.arc(0,a,8,0,Math.PI*2),t.fill(),t.strokeStyle=`rgba(0, 255, 255, ${o*.5})`,t.lineWidth=2,t.beginPath(),t.arc(0,a,12+Math.sin(e*8+i)*3,0,Math.PI*2),t.stroke()):(t.fillStyle="rgba(100, 100, 100, 0.3)",t.beginPath(),t.arc(0,a,6,0,Math.PI*2),t.fill())}t.restore()}drawSplashWaveEffect(t,e){const i=this.width/2,a=this.height/2,o=Math.max(this.width,this.height)*.8,s=this.splashWaveProgress*o;t.save();for(let l=0;l<3;l++){const c=s-l*30;if(c>0){const r=(1-this.splashWaveProgress)*(.5-l*.1);t.strokeStyle=`rgba(0, 255, 255, ${r})`,t.lineWidth=8-l*2,t.shadowColor="#00ffff",t.shadowBlur=20,t.beginPath(),t.ellipse(i,a+100,c,c*.3,0,Math.PI,0),t.stroke(),l===0&&(t.strokeStyle=`rgba(255, 255, 255, ${r*.8})`,t.lineWidth=2,t.beginPath(),t.ellipse(i,a+100,c-5,(c-5)*.3,0,Math.PI,0),t.stroke())}}const n=Math.floor((1-this.splashWaveProgress)*20);t.fillStyle="#ffffff";for(let l=0;l<n;l++){const c=Math.PI+Math.random()*Math.PI,r=s+(Math.random()-.5)*20,h=i+Math.cos(c)*r,p=a+100+Math.sin(c)*r*.3,u=2+Math.random()*4;t.beginPath(),t.arc(h,p,u,0,Math.PI*2),t.fill()}t.restore()}drawSplashSlash(t,e,i){t.save(),t.globalCompositeOperation="lighter";const a=t.createLinearGradient(-200,-350,50,0);a.addColorStop(0,"rgba(0, 255, 255, 0)"),a.addColorStop(.3,"rgba(0, 255, 255, 0.8)"),a.addColorStop(.6,"rgba(0, 255, 255, 1)"),a.addColorStop(1,"rgba(0, 255, 255, 0)"),t.strokeStyle=a,t.lineWidth=30+Math.sin(e*Math.PI)*20,t.lineCap="round",t.shadowColor="#00ffff",t.shadowBlur=40,t.beginPath(),t.moveTo(-200,-350),t.quadraticCurveTo(-100+Math.sin(i*30)*20,-200,50,0),t.stroke(),t.strokeStyle="rgba(255, 255, 255, 0.9)",t.lineWidth=6,t.shadowBlur=20,t.stroke();for(let o=0;o<3;o++){const s=o*15;t.strokeStyle=`rgba(0, 200, 255, ${.4-o*.1})`,t.lineWidth=4-o,t.beginPath(),t.moveTo(-200-s,-350+s),t.quadraticCurveTo(-100-s+Math.sin(i*30+o)*15,-200+s,50-s,0+s),t.stroke()}t.restore()}drawKatana(t,e,i){t.fillStyle="#8a7a6a",t.beginPath(),t.ellipse(0,80,40,50,.2,0,Math.PI*2),t.fill();const a=t.createLinearGradient(0,40,0,160);a.addColorStop(0,"#2a1a1a"),a.addColorStop(.5,"#1a0a0a"),a.addColorStop(1,"#2a1a1a"),t.fillStyle=a,t.beginPath(),t.moveTo(-14,40),t.lineTo(14,40),t.lineTo(12,160),t.lineTo(-12,160),t.closePath(),t.fill(),t.strokeStyle="#ff00ff",t.shadowColor="#ff00ff",t.shadowBlur=10,t.lineWidth=2;for(let s=0;s<10;s++){const n=50+s*11,l=.5+.5*Math.sin(i*3+s*.5);t.strokeStyle=`rgba(255, 0, 255, ${l})`,t.beginPath(),t.moveTo(-12,n),t.lineTo(0,n+5),t.lineTo(12,n),t.stroke()}t.shadowBlur=0,t.fillStyle="#1a1a2a",t.beginPath(),t.ellipse(0,35,35,12,0,0,Math.PI*2),t.fill(),t.strokeStyle="#00ffff",t.shadowColor="#00ffff",t.shadowBlur=15,t.lineWidth=2,t.beginPath(),t.ellipse(0,35,32,10,0,0,Math.PI*2),t.stroke(),t.shadowBlur=0;const o=t.createLinearGradient(-10,0,10,0);o.addColorStop(0,"#8080a0"),o.addColorStop(.3,"#c0c0e0"),o.addColorStop(.5,"#ffffff"),o.addColorStop(.7,"#c0c0e0"),o.addColorStop(1,"#6060a0"),t.fillStyle=o,t.beginPath(),t.moveTo(-10,30),t.lineTo(10,30),t.lineTo(7,-280),t.lineTo(0,-320),t.lineTo(-5,-280),t.closePath(),t.fill(),t.strokeStyle="#00ffff",t.shadowColor="#00ffff",t.shadowBlur=8,t.lineWidth=2,t.beginPath(),t.moveTo(9,30),t.lineTo(6,-280),t.lineTo(0,-320),t.stroke(),t.strokeStyle=`rgba(255, 0, 255, ${.5+.3*Math.sin(i*4)})`,t.shadowColor="#ff00ff",t.shadowBlur=5,t.lineWidth=1.5,t.beginPath(),t.moveTo(-4,30);for(let s=0;s<25;s++){const n=30-s*13,l=Math.sin(s*.7+i*2)*4;t.lineTo(-4+l,n)}t.stroke(),t.shadowBlur=0,t.fillStyle="rgba(255, 255, 255, 0.4)",t.beginPath(),t.moveTo(3,25),t.lineTo(5,25),t.lineTo(3,-270),t.lineTo(1,-270),t.closePath(),t.fill()}drawRetrowaveSlash(t,e,i){t.save(),t.translate(0,-150);const a=Math.sin(e*Math.PI),o=[{color:"#ff00ff",offset:0},{color:"#00ffff",offset:15},{color:"#ff0080",offset:30},{color:"#8000ff",offset:45}];for(const{color:s,offset:n}of o)t.strokeStyle=s,t.shadowColor=s,t.shadowBlur=25,t.lineWidth=10-n*.15,t.lineCap="round",t.beginPath(),t.arc(0,100,200+n,-Math.PI*.7,Math.PI*.15),t.globalAlpha=a*(1-n*.015),t.stroke();t.globalAlpha=a;for(let s=0;s<15;s++){const n=-Math.PI*.7+Math.PI*.85*(s/15)+Math.sin(i*10+s)*.1,l=200+Math.random()*50,c=Math.cos(n)*l,r=100+Math.sin(n)*l,h=s%2===0?"#ff00ff":"#00ffff";t.fillStyle=h,t.shadowColor=h,t.shadowBlur=15,t.beginPath(),t.arc(c,r,4+Math.random()*4,0,Math.PI*2),t.fill()}t.globalAlpha=1,t.shadowBlur=0,t.restore()}drawAxe(t,e,i,a){t.fillStyle="#8a7a6a",t.beginPath(),t.ellipse(0,80,40,50,.2,0,Math.PI*2),t.fill();const o=t.createLinearGradient(0,40,0,160);o.addColorStop(0,"#3a2010"),o.addColorStop(.5,"#2a1005"),o.addColorStop(1,"#3a2010"),t.fillStyle=o,t.beginPath(),t.moveTo(-14,40),t.lineTo(14,40),t.lineTo(12,160),t.lineTo(-12,160),t.closePath(),t.fill(),t.strokeStyle="#ff6600",t.shadowColor="#ff6600",t.shadowBlur=10,t.lineWidth=2;for(let n=0;n<10;n++){const l=50+n*11,c=.5+.5*Math.sin(i*4+n*.5);t.strokeStyle=`rgba(255, 100, 0, ${c})`,t.beginPath(),t.moveTo(-12,l),t.lineTo(0,l+5),t.lineTo(12,l),t.stroke()}t.shadowBlur=0,t.fillStyle="#2a2020",t.beginPath(),t.rect(-30,25,60,20),t.fill(),t.strokeStyle="#ff6600",t.shadowColor="#ff6600",t.shadowBlur=15,t.lineWidth=2,t.strokeRect(-28,27,56,16),t.shadowBlur=0;const s=t.createLinearGradient(-40,0,40,0);s.addColorStop(0,"#6060a0"),s.addColorStop(.2,"#8080b0"),s.addColorStop(.4,"#b0b0d0"),s.addColorStop(.5,"#e0e0f0"),s.addColorStop(.6,"#b0b0d0"),s.addColorStop(.8,"#8080b0"),s.addColorStop(1,"#6060a0"),t.fillStyle=s,t.beginPath(),t.moveTo(-12,20),t.lineTo(12,20),t.lineTo(15,-50),t.lineTo(50,-180),t.lineTo(55,-220),t.lineTo(0,-300),t.lineTo(-55,-220),t.lineTo(-50,-180),t.lineTo(-15,-50),t.closePath(),t.fill(),t.strokeStyle="#ff6600",t.shadowColor="#ff6600",t.shadowBlur=12,t.lineWidth=3,t.beginPath(),t.moveTo(14,20),t.lineTo(52,-180),t.lineTo(57,-220),t.lineTo(0,-305),t.stroke(),t.beginPath(),t.moveTo(-14,20),t.lineTo(-52,-180),t.lineTo(-57,-220),t.lineTo(0,-305),t.stroke(),t.strokeStyle=`rgba(255, 150, 0, ${.5+.3*Math.sin(i*5)})`,t.shadowColor="#ff9900",t.shadowBlur=8,t.lineWidth=2,t.beginPath(),t.moveTo(0,15);for(let n=0;n<20;n++){const l=15-n*15,c=Math.sin(n*.8+i*3)*(3+n*.3);t.lineTo(c,l)}t.stroke(),t.shadowBlur=0;for(let n=0;n<5;n++){const l=-50-n*45;n<a?(t.fillStyle="#ff8800",t.shadowColor="#ff8800",t.shadowBlur=15):(t.fillStyle="#333333",t.shadowColor="transparent",t.shadowBlur=0),t.beginPath(),t.arc(0,l,4,0,Math.PI*2),t.fill()}t.shadowBlur=0,t.fillStyle="rgba(255, 255, 255, 0.4)",t.beginPath(),t.moveTo(5,15),t.lineTo(8,15),t.lineTo(40,-170),t.lineTo(37,-170),t.closePath(),t.fill()}drawAxeSlash(t,e,i){t.save(),t.translate(0,-150);const a=Math.sin(e*Math.PI),o=[{color:"#ff6600",offset:0},{color:"#ff9900",offset:15},{color:"#ff3300",offset:30},{color:"#ffcc00",offset:45}];for(const{color:s,offset:n}of o)t.strokeStyle=s,t.shadowColor=s,t.shadowBlur=25,t.lineWidth=12-n*.15,t.lineCap="round",t.beginPath(),t.arc(0,100,200+n,-Math.PI*.7,Math.PI*.15),t.globalAlpha=a*(1-n*.015),t.stroke();t.globalAlpha=a;for(let s=0;s<15;s++){const n=-Math.PI*.7+Math.PI*.85*(s/15)+Math.sin(i*10+s)*.1,l=200+Math.random()*50,c=Math.cos(n)*l,r=100+Math.sin(n)*l,h=s%2===0?"#ff6600":"#ffaa00";t.fillStyle=h,t.shadowColor=h,t.shadowBlur=15,t.beginPath(),t.arc(c,r,4+Math.random()*4,0,Math.PI*2),t.fill()}t.globalAlpha=1,t.shadowBlur=0,t.restore()}spawnAxeSplash(){if(this.particles.length>q.MAX_PARTICLES)return;const t=this.width/2,e=this.height/2,i=["#ff6600","#ff9900","#ff3300","#ffcc00"];for(let a=0;a<8;a++){const o=a/8*Math.PI*2+Math.random()*.3,s=400+Math.random()*500;this.particles.push({x:t+(Math.random()-.5)*60,y:e+(Math.random()-.5)*60,vx:Math.cos(o)*s,vy:Math.sin(o)*s-120,size:8+Math.random()*10,color:i[a%i.length],life:.5+Math.random()*.3,maxLife:.5+Math.random()*.3,type:"fragment"})}for(let a=0;a<12;a++){const o=Math.random()*Math.PI*2,s=250+Math.random()*400;this.particles.push({x:t+(Math.random()-.5)*30,y:e+(Math.random()-.5)*30,vx:Math.cos(o)*s,vy:Math.sin(o)*s-80,size:2+Math.random()*4,color:i[a%i.length],life:.3+Math.random()*.3,maxLife:.3+Math.random()*.3,type:"spark"})}}drawHitGlow(t,e,i="katana"){if(t.save(),t.globalAlpha=e,i==="charged"){t.strokeStyle="#ffffff",t.shadowColor="#00ffff",t.shadowBlur=50*e,t.lineWidth=10,t.beginPath(),t.moveTo(9,30),t.lineTo(6,-280),t.lineTo(0,-320),t.stroke(),t.strokeStyle="#00ffff",t.shadowColor="#0088ff",t.shadowBlur=30*e,t.lineWidth=4;for(let a=0;a<3;a++)t.beginPath(),t.arc(0,-150,50+a*30,0,Math.PI*2),t.stroke()}else t.strokeStyle="#ffffff",t.shadowColor="#00ffff",t.shadowBlur=30*e,t.lineWidth=6,t.beginPath(),t.moveTo(9,30),t.lineTo(6,-280),t.lineTo(0,-320),t.stroke(),t.strokeStyle="#ff00ff",t.shadowColor="#ff00ff",t.shadowBlur=20*e,t.lineWidth=3,t.stroke();t.restore()}drawScreenFlash(t,e="katana"){t.save(),t.resetTransform();const i=t.createRadialGradient(this.width/2,this.height/2,0,this.width/2,this.height/2,this.width);e==="charged"?(i.addColorStop(0,`rgba(255, 255, 255, ${this.hitFlash*.6})`),i.addColorStop(.2,`rgba(0, 255, 255, ${this.hitFlash*.4})`),i.addColorStop(.5,`rgba(0, 150, 255, ${this.hitFlash*.2})`),i.addColorStop(.8,`rgba(0, 80, 255, ${this.hitFlash*.1})`),i.addColorStop(1,"rgba(0, 0, 0, 0)")):(i.addColorStop(0,`rgba(255, 255, 255, ${this.hitFlash*.4})`),i.addColorStop(.3,`rgba(255, 0, 255, ${this.hitFlash*.2})`),i.addColorStop(.6,`rgba(0, 255, 255, ${this.hitFlash*.1})`),i.addColorStop(1,"rgba(0, 0, 0, 0)")),t.fillStyle=i,t.fillRect(0,0,this.width,this.height),t.restore()}}class V{position;velocity=w();radius=.8;active=!0;speed=4;fireIntensity=1;fragments=[];removeTimer=0;id;phase;moveType;enemyType="baneling";damage=25;currentSpeed=0;isCharging=!0;chargeDirection=w();passedThroughTimer=0;verticalVelocity=0;onGround=!0;hopTimer=0;banelingVerticalVel=0;banelingOnGround=!0;isAboutToExplode=!1;explodeTimer=0;dodgeAngle=0;dodgeTimer=0;isAttached=!1;attachTimer=0;orbitAngle=0;hp=1;maxHp=1;isBoss=!1;isDying=!1;deathProgress=0;deathVelocity=0;deathY=0;teleportTimer=0;distortionPower=0;spawnPhantomTimer=5;isVortexActive=!1;vortexTimer=0;vortexCooldown=0;vortexWarningPlayed=!1;onSpawnPhantom;onVortexStart;onVortexEnd;onVortexWarning;poolTimer=0;spitTimer=0;spitCooldown=3;greenBossRole="hunter";lastPlayerPos=w();playerVelocity=w();onSpit;onAcidRainMark;bossPhase=1;onPhaseChange;spikeAttackTimer=0;spikeAttackCooldown=2;requiresJumpToKill=!1;onSpikeAttack;onSpikerScream;onAboutToExplode;collision=null;constructor(t,e=4,i=0,a="baneling",o){this.position={...t},this.speed=e,this.id=i,this.phase=Math.random()*Math.PI*2,this.moveType=i%4,this.enemyType=a,this.collision=o||null,a==="phantom"?(this.speed=e*2,this.damage=10,this.radius=.6,this.currentSpeed=0,this.isCharging=!0):a==="runner"?(this.speed=e*2.5,this.damage=15,this.radius=.4,this.position.y=.5):a==="hopper"?(this.speed=e*1.2,this.damage=20,this.radius=.5,this.verticalVelocity=8,this.onGround=!1):a==="spiker"?(this.speed=e*.8,this.damage=5,this.radius=.6,this.position.y=5+Math.random()*3,this.spikeAttackCooldown=2,this.requiresJumpToKill=!0):a==="boss_green"?(this.isBoss=!0,this.speed=e*.6,this.damage=40,this.radius=2.5,this.hp=10,this.maxHp=10,this.spitCooldown=3):a==="boss_black"?(this.isBoss=!0,this.speed=e*.8,this.damage=30,this.radius=2,this.hp=70,this.maxHp=70,this.distortionPower=1):a==="boss_blue"?(this.isBoss=!0,this.speed=e*1.5,this.damage=25,this.radius=1.8,this.hp=24,this.maxHp=24,this.teleportTimer=3):(this.damage=25,this.currentSpeed=e)}update(t,e,i){if(this.fireIntensity=.6+Math.sin(i*8+this.id)*.4,this.active)switch(this.enemyType){case"phantom":this.updatePhantom(t,e,i);break;case"runner":this.updateRunner(t,e,i);break;case"hopper":this.updateHopper(t,e,i);break;case"spiker":this.updateSpiker(t,e,i);break;case"boss_green":this.updateBossGreen(t,e,i);break;case"boss_black":this.updateBossBlack(t,e,i);break;case"boss_blue":this.updateBossBlue(t,e,i);break;default:this.updateBaneling(t,e,i)}this.updateFragments(t),this.updateDeath(t),!this.active&&this.removeTimer>0&&(this.removeTimer-=t)}updateBaneling(t,e,i){const a=e.x-this.position.x,o=e.z-this.position.z,s=Math.sqrt(a*a+o*o);if(s<2&&!this.isAboutToExplode&&(this.isAboutToExplode=!0,this.explodeTimer=.5,this.onAboutToExplode?.()),this.isAboutToExplode&&s>3.5&&(this.isAboutToExplode=!1,this.explodeTimer=0),this.isAboutToExplode){this.explodeTimer-=t;const n=(.5-this.explodeTimer)*.3;this.position.x+=(Math.random()-.5)*n,this.position.z+=(Math.random()-.5)*n;return}if(s>.1){const n=a/s,l=o/s;if(this.collision?.getObstacleHeight&&this.banelingOnGround){const y=this.collision.getObstacleHeight(this.position,n,l,2);y>this.position.y&&y<8&&(this.banelingVerticalVel=10+(y-this.position.y)*2,this.banelingOnGround=!1)}const c=1+Math.max(0,(15-s)/15)*.8,r=this.speed*c;let h=0,p=0;const u=i*4+this.phase;switch(this.moveType){case 0:h=Math.cos(u)*2,p=Math.sin(u)*2;break;case 1:h=Math.sin(u*2)*3;break;case 2:p=Math.sin(u*1.5)*3;break;case 3:const y=Math.sin(u)>0?1.5:.5;h=Math.cos(u*3)*2*y,p=Math.sin(u*3)*2*y;break}const f=-l,m=n;this.velocity.x=n*r+f*h*.3,this.velocity.z=l*r+m*p*.3;const g=this.position.x+this.velocity.x*t,x=this.position.z+this.velocity.z*t;(!this.collision?.checkEnemyCollision||!this.collision.checkEnemyCollision({x:g,y:this.position.y,z:x},this.radius))&&(this.position.x=g,this.position.z=x),this.banelingOnGround?this.position.y=this.radius+Math.abs(Math.sin(i*8+this.phase))*.15:(this.banelingVerticalVel-=25*t,this.position.y+=this.banelingVerticalVel*t,this.position.y<=this.radius&&(this.position.y=this.radius,this.banelingVerticalVel=0,this.banelingOnGround=!0))}}updatePhantom(t,e,i){const a=e.x-this.position.x,o=e.y-.3-this.position.y,s=e.z-this.position.z,n=Math.sqrt(a*a+o*o+s*s);if(this.isCharging){this.currentSpeed=Math.min(this.currentSpeed+t*15,this.speed),n>.1&&(this.chargeDirection.x=a/n,this.chargeDirection.y=o/n,this.chargeDirection.z=s/n);const l=Math.sin(i*10)*.3;this.velocity.x=this.chargeDirection.x*this.currentSpeed+l,this.velocity.y=this.chargeDirection.y*this.currentSpeed,this.velocity.z=this.chargeDirection.z*this.currentSpeed,this.currentSpeed>=this.speed*.9&&(this.isCharging=!1)}else this.passedThroughTimer+=t,this.velocity.x=this.chargeDirection.x*this.speed,this.velocity.y=this.chargeDirection.y*this.speed,this.velocity.z=this.chargeDirection.z*this.speed,this.passedThroughTimer>2.5&&(this.isCharging=!0,this.currentSpeed=this.speed*.3,this.passedThroughTimer=0);this.position.x+=this.velocity.x*t,this.position.y+=this.velocity.y*t,this.position.z+=this.velocity.z*t,this.position.y=Math.max(.5,Math.min(4,this.position.y)),n>35&&(this.isCharging=!0,this.currentSpeed=0,this.passedThroughTimer=0)}runnerVerticalVel=0;runnerOnGround=!0;updateRunner(t,e,i){if(this.isAttached){this.attachTimer-=t,this.orbitAngle+=t*12;const n=1.2,l=Math.sin(i*8)*.3;this.position.x=e.x+Math.cos(this.orbitAngle)*n,this.position.y=e.y+l,this.position.z=e.z+Math.sin(this.orbitAngle)*n,this.attachTimer<=0&&(this.isAttached=!1,this.active=!1,this.removeTimer=.5);return}const a=e.x-this.position.x,o=e.z-this.position.z,s=Math.sqrt(a*a+o*o);if(s<1.5){this.isAttached=!0,this.attachTimer=3,this.orbitAngle=Math.atan2(o,a);return}if(s>.1){const n=a/s,l=o/s;if(this.collision?.getObstacleHeight&&this.runnerOnGround){const y=this.collision.getObstacleHeight(this.position,n,l,1.5);y>this.position.y&&y<10&&(this.runnerVerticalVel=12,this.runnerOnGround=!1)}if(this.collision?.checkEnemyCollision){const y={x:this.position.x+n*this.speed*t,y:this.position.y,z:this.position.z+l*this.speed*t};this.collision.checkEnemyCollision(y,this.radius)&&(this.dodgeAngle=(Math.random()>.5?1:-1)*Math.PI*.5)}this.dodgeTimer-=t,this.dodgeTimer<=0&&(this.dodgeAngle=(Math.random()-.5)*Math.PI*.8,this.dodgeTimer=.3+Math.random()*.4);const c=Math.cos(this.dodgeAngle),r=Math.sin(this.dodgeAngle),h=n*c-l*r,p=n*r+l*c,u=1+Math.max(0,(10-s)/10)*.5,f=this.speed*u,m=Math.sin(i*15+this.phase)*2;this.velocity.x=h*f+m*.3,this.velocity.z=p*f;const g=this.position.x+this.velocity.x*t,x=this.position.z+this.velocity.z*t;(!this.collision?.checkEnemyCollision||!this.collision.checkEnemyCollision({x:g,y:this.position.y,z:x},this.radius))&&(this.position.x=g,this.position.z=x),this.runnerOnGround?this.position.y=.5+Math.abs(Math.sin(i*20))*.1:(this.runnerVerticalVel-=25*t,this.position.y+=this.runnerVerticalVel*t,this.position.y<=.5&&(this.position.y=.5,this.runnerVerticalVel=0,this.runnerOnGround=!0))}}applyKnockback(t,e,i){const a=Math.sqrt(t*t+e*e);a>0&&(this.velocity.x=t/a*i,this.velocity.z=e/a*i,this.velocity.y=i*.3),this.knockbackTimer=.3}knockbackTimer=0;detachRunner(){if(this.isAttached&&this.enemyType==="runner"){this.isAttached=!1;const t=this.orbitAngle+Math.PI;return this.velocity.x=Math.cos(t)*15,this.velocity.y=8,this.velocity.z=Math.sin(t)*15,this.attachTimer=0,!0}return!1}onCreatePool;updateBossGreen(t,e,i){if(this.knockbackTimer>0){this.knockbackTimer-=t,this.position.x+=this.velocity.x*t,this.position.y+=this.velocity.y*t,this.position.z+=this.velocity.z*t,this.velocity.x*=.9,this.velocity.y*=.9,this.velocity.z*=.9,this.velocity.y-=15*t,this.position.y=Math.max(this.radius,this.position.y);return}this.playerVelocity.x=(e.x-this.lastPlayerPos.x)/Math.max(t,.001),this.playerVelocity.z=(e.z-this.lastPlayerPos.z)/Math.max(t,.001),this.lastPlayerPos={...e};const a=e.x-this.position.x,o=e.y-this.position.y,s=e.z-this.position.z,n=Math.sqrt(a*a+o*o+s*s),l=this.bossPhase===2?2.8:2.5;if(this.radius=l+Math.sin(i*3)*.3,this.greenBossRole==="hunter"){this.spitTimer-=t;const c=this.bossPhase===2?5:8;if(this.spitTimer<=0&&n<25){this.spitTimer=c;const r=w(e.x,.05,e.z);this.onAcidRainMark?.(r),this.bossPhase===2&&setTimeout(()=>{this.onAcidRainMark?.(w(r.x+6,.05,r.z)),this.onAcidRainMark?.(w(r.x-6,.05,r.z))},800)}if(n>8){const r=a/n,h=s/n;this.velocity.x=r*this.speed*.5,this.velocity.z=h*this.speed*.5,this.position.x+=this.velocity.x*t,this.position.z+=this.velocity.z*t}this.position.y=Math.max(this.radius,this.position.y)}else{this.spitTimer-=t;const c=this.bossPhase===2?2:3.5;if(this.spitTimer<=0&&n<20){this.spitTimer=c;const r=w(e.x+(Math.random()-.5)*2,.05,e.z+(Math.random()-.5)*2),h=w(this.position.x,this.position.y+1,this.position.z);this.onSpit?.(h,r),this.bossPhase===2&&(setTimeout(()=>{const p=w(e.x+3,.05,e.z);this.onSpit?.(h,p)},300),setTimeout(()=>{const p=w(e.x-3,.05,e.z);this.onSpit?.(h,p)},600))}if(n>.1){const r=a/n,h=o/n,p=s/n,u=Math.sin(i*2)*.5,f=this.bossPhase===2?1.4:1;this.velocity.x=r*this.speed*f+u,this.velocity.y=h*this.speed*.3,this.velocity.z=p*this.speed*f,this.position.x+=this.velocity.x*t,this.position.y+=this.velocity.y*t,this.position.z+=this.velocity.z*t,this.position.y=Math.max(this.radius,this.position.y)}}}updateBossBlack(t,e,i){if(this.knockbackTimer>0){this.knockbackTimer-=t,this.position.x+=this.velocity.x*t,this.position.y+=this.velocity.y*t,this.position.z+=this.velocity.z*t,this.velocity.x*=.92,this.velocity.y*=.92,this.velocity.z*=.92,this.velocity.y-=10*t,this.position.y=Math.max(1,this.position.y);return}const a=e.x-this.position.x,o=e.y-this.position.y,s=e.z-this.position.z,n=Math.sqrt(a*a+o*o+s*s);if(this.spawnPhantomTimer-=t,this.spawnPhantomTimer<=0){this.spawnPhantomTimer=5;const f=Math.random()*Math.PI*2,m=3+Math.random()*2,g=w(this.position.x+Math.cos(f)*m,this.position.y,this.position.z+Math.sin(f)*m);this.onSpawnPhantom?.(g)}if(this.vortexCooldown-=t,this.isVortexActive){this.vortexTimer-=t,this.position.y=2+Math.sin(i*10)*.3,this.distortionPower=1.5+Math.sin(i*15)*.5,this.vortexTimer<=0&&(this.isVortexActive=!1,this.vortexCooldown=12,this.vortexWarningPlayed=!1,this.onVortexEnd?.());return}this.vortexCooldown>0&&this.vortexCooldown<=2&&!this.vortexWarningPlayed&&n<15&&(this.vortexWarningPlayed=!0,this.onVortexWarning?.()),this.vortexCooldown<=0&&n<15&&(this.isVortexActive=!0,this.vortexTimer=4,this.onVortexStart?.());const l=.5,c=8+Math.sin(i*.3)*3,r=Math.cos(i*l)*c,h=Math.sin(i*l)*c,p=r-this.position.x,u=h-this.position.z;this.velocity.x=p*.5+a/n*this.speed*.3,this.velocity.y=(1.5-this.position.y)*2,this.velocity.z=u*.5+s/n*this.speed*.3,this.position.x+=this.velocity.x*t,this.position.y+=this.velocity.y*t,this.position.z+=this.velocity.z*t,this.distortionPower=Math.max(0,1-n/20)}getVortexPull(t){if(!this.isVortexActive)return w(0,0,0);const e=this.position.x-t.x,i=this.position.z-t.z,a=Math.sqrt(e*e+i*i);if(a<.5)return w(0,0,0);const o=Math.max(0,1-a/20)*7.5;return w(e/a*o,0,i/a*o)}updateBossBlue(t,e,i){if(this.knockbackTimer>0){this.knockbackTimer-=t,this.position.x+=this.velocity.x*t,this.position.y+=this.velocity.y*t,this.position.z+=this.velocity.z*t,this.velocity.x*=.85,this.velocity.y*=.85,this.velocity.z*=.85,this.velocity.y-=20*t,this.position.y=Math.max(.5,this.position.y);return}if(this.teleportTimer-=t,this.teleportTimer<=0){const l=Math.random()*Math.PI*2,c=5+Math.random()*10;this.position.x=e.x+Math.cos(l)*c,this.position.y=1.5+Math.random()*2,this.position.z=e.z+Math.sin(l)*c,this.teleportTimer=2+Math.random()*2;return}const a=e.x-this.position.x,o=e.y-this.position.y,s=e.z-this.position.z,n=Math.sqrt(a*a+o*o+s*s);if(n>.1){const l=Math.sin(i*10)*3;this.velocity.x=a/n*this.speed+l*.5,this.velocity.y=o/n*this.speed*.5,this.velocity.z=s/n*this.speed,this.position.x+=this.velocity.x*t,this.position.y+=this.velocity.y*t,this.position.z+=this.velocity.z*t,this.position.y=Math.max(.5,Math.min(4,this.position.y))}}takeDamage(t=1){return this.hp-=t,this.enemyType==="boss_green"&&this.bossPhase===1&&this.hp<=this.maxHp/2&&(this.bossPhase=2,this.speed*=1.3,this.onPhaseChange?.(2)),this.hp<=0?(this.hp=0,!0):!1}updateHopper(t,e,i){const a=e.x-this.position.x,o=e.z-this.position.z,s=Math.sqrt(a*a+o*o),n=18;if(this.onGround)if(this.hopTimer-=t,this.hopTimer<=0){this.onGround=!1;let r=10+Math.random()*4;if(this.collision?.getObstacleHeight&&s>.1){const h=a/s,p=o/s,u=this.collision.getObstacleHeight(this.position,h,p,3);u>this.position.y&&(r=Math.max(r,(u-this.position.y+2)*3))}if(this.verticalVelocity=r,this.hopTimer=.5+Math.random()*.5,s>.1){const h=this.speed*1.5;this.velocity.x=a/s*h,this.velocity.z=o/s*h}}else this.velocity.x*=.9,this.velocity.z*=.9;else this.verticalVelocity-=n*t,s>.1&&(this.velocity.x+=a/s*t*3,this.velocity.z+=o/s*t*3);const l=this.position.x+this.velocity.x*t,c=this.position.z+this.velocity.z*t;!this.collision?.checkEnemyCollision||!this.collision.checkEnemyCollision({x:l,y:this.position.y,z:c},this.radius)?(this.position.x=l,this.position.z=c):(this.velocity.x*=-.5,this.velocity.z*=-.5),this.position.y+=this.verticalVelocity*t,this.position.y<=.5&&(this.position.y=.5,this.onGround=!0,this.verticalVelocity=0),this.position.y=Math.min(12,this.position.y)}spikerManeuverTimer=0;spikerManeuverDir={x:0,y:0,z:0};spikerDodging=!1;spikerDiveTimer=0;updateSpiker(t,e,i){const a=e.x-this.position.x,o=e.z-this.position.z,s=Math.sqrt(a*a+o*o),n=i*8+this.phase,c=Math.sin(n)*.5;if(this.spikerManeuverTimer-=t,this.spikerDiveTimer-=t,this.spikerManeuverTimer<=0){this.spikerManeuverTimer=.3+Math.random()*.5;const m=Math.random();if(m<.3){const g=Math.atan2(o,a)+(Math.random()>.5?Math.PI/2:-Math.PI/2);this.spikerManeuverDir={x:Math.cos(g)*15,y:(Math.random()-.3)*8,z:Math.sin(g)*15},this.spikerDodging=!0}else m<.5?(this.spikerDiveTimer=.4,this.spikerManeuverDir={x:a/s*20,y:-8,z:o/s*20},this.spikerDodging=!1):m<.7?(this.spikerManeuverDir={x:(Math.random()-.5)*10,y:12,z:(Math.random()-.5)*10},this.spikerDodging=!1):(this.spikerManeuverDir={x:-a/s*12,y:(Math.random()-.5)*5,z:-o/s*12},this.spikerDodging=!1)}const r=Math.max(0,this.spikerManeuverTimer/.5);if(this.position.x+=this.spikerManeuverDir.x*t*r,this.position.y+=this.spikerManeuverDir.y*t*r,this.position.z+=this.spikerManeuverDir.z*t*r,!this.spikerDodging&&this.spikerDiveTimer<=0){const m=8+Math.sin(i*2+this.phase)*3;if(s>.1){const y=Math.atan2(o,a)+3.5*t;let b=0;s<m-2?b=-8:s>m+2&&(b=8);const k=e.x-Math.cos(y)*(s+b*t),A=e.z-Math.sin(y)*(s+b*t);this.position.x+=(k-this.position.x)*t*5,this.position.z+=(A-this.position.z)*t*5}}const p=5+Math.sin(i*1.5+this.phase*2)*2+c;if(this.spikerDiveTimer>0&&this.position.y<3&&(this.spikerManeuverDir.y=15),this.spikerDiveTimer<=0&&!this.spikerDodging){const m=p-this.position.y;this.position.y+=m*t*3}this.spikeAttackTimer-=t,this.spikeAttackTimer<=0&&s<20&&(this.onSpikerScream?.(),setTimeout(()=>{this.active&&this.onSpikeAttack?.({...this.position},{...e})},200),this.spikeAttackTimer=this.spikeAttackCooldown*.7+Math.random()*.5);const u=35,f=Math.sqrt(this.position.x**2+this.position.z**2);f>u&&(this.position.x*=u/f,this.position.z*=u/f),this.position.y=Math.max(2.5,Math.min(12,this.position.y))}updateFragments(t){for(let o=this.fragments.length-1;o>=0;o--){const s=this.fragments[o];s.position.x+=s.velocity.x*t,s.position.y+=s.velocity.y*t,s.position.z+=s.velocity.z*t,s.velocity.y-=35*t,s.velocity.x*=.96,s.velocity.z*=.96,s.position.y<s.size*.3&&(s.position.y=s.size*.3,s.velocity.y=0,s.velocity.x*=.3,s.velocity.z*=.3,s.size*=.95,s.lifetime-=t*2),s.lifetime-=t,(s.lifetime<=0||s.size<.03||s.position.y<-5)&&this.fragments.splice(o,1)}}checkPlayerCollision(t){return this.active?At(this.position,t)<this.radius+.5:!1}slice(t){if(!this.active||this.isDying)return;this.active=!1,this.isDying=!0,this.deathProgress=0,this.deathY=.1,this.deathVelocity=0,this.removeTimer=2;const e=Math.sqrt(t.x**2+t.y**2+t.z**2)||1;this.position.x+=t.x/e*.3,this.position.z+=t.z/e*.3;const i=4+Math.floor(Math.random()*4);for(let a=0;a<i;a++){const o=Math.random()*Math.PI*2,s=5+Math.random()*8;this.fragments.push({position:{x:this.position.x,y:.3,z:this.position.z},velocity:{x:Math.cos(o)*s,y:3+Math.random()*4,z:Math.sin(o)*s},size:.08+Math.random()*.1,lifetime:.6+Math.random()*.4,rotation:0,rotationSpeed:0})}}updateDeath(t){this.isDying&&(this.deathProgress+=t*4,this.deathProgress>=1&&(this.deathProgress=1,this.isDying=!1))}canRemove(){return!this.active&&this.removeTimer<=0&&this.fragments.length===0}getShaderData(){let t=0;if(this.active||this.isDying){const i=this.fireIntensity*.5;switch(this.enemyType){case"phantom":t=3+i;break;case"runner":t=5+i;break;case"hopper":t=7+i;break;case"spiker":t=9+i;break;case"boss_green":t=11+i;break;case"boss_black":t=13+i;break;case"boss_blue":t=15+i;break;default:t=1+i}(this.isDying||this.deathProgress>0)&&(t+=100+this.deathProgress*.5)}const e=this.isDying||this.deathProgress>0?this.deathY:this.position.y;return[this.position.x,e,this.position.z,t]}getDeathData(){return!this.isDying&&this.deathProgress<1?[0,0,0,0]:[this.position.x,this.position.z,this.deathProgress,this.radius]}getFragmentsData(){const t=[];for(const e of this.fragments)t.push(e.position.x,e.position.y,e.position.z,e.size);return t}}const $={left:{x:-21,y:1.5,z:0},right:{x:21,y:1.5,z:0}};class Yt{targets=[];wave=0;waveActive=!1;waitingForPoolEntry=!1;poolTriggerRadius=8;waveDelay=4;waveTimer=0;score=0;powerCrystals=[];onTargetDestroyed;onPlayerHit;onWaveComplete;onWaveStart;onPoolDamage;onCrystalDestroyed;onBossPhaseChange;onAcidRain;onBossVortexStart;onBossVortexEnd;onBossVortexWarning;toxicPools=[];acidRainZones=[];greenBossPhase2=!1;acidProjectiles=[];poolDamageTimer=0;collision=null;spawnQueue=[];portalTimers={left:0,right:0};PORTAL_SPAWN_INTERVAL=.7;onEnemySpawn;onSpikerAttack;onSpikerScream;onSpikeHit;onBanelingAboutToExplode;spikes=[];constructor(t){this.collision=t||null}isPlayerUnderPlatform(t){return this.collision?this.collision.getCeilingHeight(t)<15:!1}startGame(t=1){this.wave=t-1,this.score=0,this.targets=[],this.toxicPools=[],this.greenBossPhase2=!1,this.spawnQueue=[],this.portalTimers={left:0,right:0},this.waitingForPoolEntry=!0,this.waveActive=!1}startNextWave(){this.wave++,this.waveActive=!0,this.spawnEnemies(this.wave),this.onWaveStart?.(this.wave)}enemyIdCounter=0;spawnEnemies(t){const e=3.5+t*.3;if(t===5){const r=[{pos:w(-8,3,-18),role:"hunter"},{pos:w(8,3,-18),role:"blocker"}];for(const h of r){const p=new V(h.pos,e,this.enemyIdCounter++,"boss_green",this.collision||void 0);p.greenBossRole=h.role,h.role==="hunter"?p.onAcidRainMark=u=>{this.spawnAcidRainZone(u)}:p.onSpit=(u,f)=>{this.spawnAcidProjectile(u,f)},p.onPhaseChange=u=>{this.onBossPhaseChange?.(p.enemyType,u)},this.targets.push(p)}}else if(t===10){const r=w(0,2.5,-18),h=new V(r,e,this.enemyIdCounter++,"boss_black",this.collision||void 0);h.onSpawnPhantom=u=>{this.spawnPhantomFromBoss(u)},h.onVortexWarning=()=>{this.onBossVortexWarning?.()},h.onVortexStart=()=>{this.onBossVortexStart?.()},h.onVortexEnd=()=>{this.onBossVortexEnd?.()},this.targets.push(h);const p=[{x:10,z:0,height:2.3},{x:5,z:8.66,height:3.5},{x:-5,z:8.66,height:4.7},{x:-10,z:0,height:5.9},{x:-5,z:-8.66,height:7.1},{x:5,z:-8.66,height:8.3}];this.powerCrystals=p.map((u,f)=>({x:u.x,z:u.z,height:u.height,active:!0,platformIndex:f}))}else if(t===15){const r=w(0,2,-18);this.targets.push(new V(r,e,this.enemyIdCounter++,"boss_blue",this.collision||void 0))}if(t===5||t===10||t===15)return;let a,o,s,n,l;t<=5?(a=Math.floor(t*1.2),o=t>=3?Math.floor((t-2)*.8):0,s=0,n=t>=4?Math.floor((t-3)*.5):0,l=t>=2?Math.floor((t-1)*.5):0):t<=10?(a=Math.floor(t*.8),o=Math.floor((t-3)*.6),s=0,n=Math.floor((t-4)*.6),l=Math.floor((t-2)*.6)):(a=Math.floor(t*.7),o=Math.floor((t-5)*.5),s=Math.floor((t-10)*1.5),n=Math.floor((t-6)*.5),l=Math.floor((t-5)*.7)),this.spawnQueue=[];let c=!0;for(let r=0;r<a;r++){const h=e+Math.random()*1.5;this.spawnQueue.push({type:"baneling",speed:h,portalSide:c?"left":"right"}),c=!c}for(let r=0;r<s;r++){const h=e+Math.random()*1;this.spawnQueue.push({type:"runner",speed:h,portalSide:c?"left":"right"}),c=!c}for(let r=0;r<n;r++){const h=e+Math.random()*1;this.spawnQueue.push({type:"hopper",speed:h,portalSide:c?"left":"right"}),c=!c}for(let r=0;r<o;r++){const h=e+Math.random()*1;this.spawnQueue.push({type:"phantom",speed:h,portalSide:c?"left":"right"}),c=!c}for(let r=0;r<l;r++){const h=e*.6;this.spawnQueue.push({type:"spiker",speed:h,portalSide:c?"left":"right"}),c=!c}this.shuffleSpawnQueue()}shuffleSpawnQueue(){for(let t=this.spawnQueue.length-1;t>0;t--){const e=Math.floor(Math.random()*(t+1));[this.spawnQueue[t],this.spawnQueue[e]]=[this.spawnQueue[e],this.spawnQueue[t]]}}spawnFromPortal(t){const e=$[t.portalSide],i=t.portalSide==="left"?1.5:-1.5,a=(Math.random()-.5)*2;let o;t.type==="baneling"?o=.7:t.type==="runner"||t.type==="hopper"?o=.5:t.type==="phantom"?o=1.5+Math.random()*1.5:t.type==="spiker"?o=5+Math.random()*3:o=.7;const s=w(e.x+i,o,e.z+a),n=new V(s,t.speed,this.enemyIdCounter++,t.type,this.collision||void 0);t.type==="spiker"&&(n.onSpikeAttack=(l,c)=>{this.fireSpike(l,c),this.onSpikerAttack?.(l,c)},n.onSpikerScream=()=>{this.onSpikerScream?.()}),t.type==="baneling"&&(n.onAboutToExplode=()=>{this.onBanelingAboutToExplode?.()}),this.targets.push(n),this.onEnemySpawn?.(t.type,t.portalSide)}fireSpike(t,e){Math.sqrt((e.x-t.x)**2+(e.y-t.y)**2+(e.z-t.z)**2)<.1||this.spikes.push({start:{...t},end:{...e},active:!0,lifetime:.4,intensity:1,damageDealt:!1})}phantomDamageCooldown=new Map;update(t,e,i){if(this.waitingForPoolEntry){Math.sqrt(e.x*e.x+e.z*e.z)<this.poolTriggerRadius&&(this.waitingForPoolEntry=!1,this.startNextWave());return}if(!this.waveActive&&this.waveTimer>0){this.waveTimer-=t,this.waveTimer<=0&&(this.waitingForPoolEntry=!0);return}if(this.portalTimers.left>0&&(this.portalTimers.left-=t),this.portalTimers.right>0&&(this.portalTimers.right-=t),this.spawnQueue.length>0){if(this.portalTimers.left<=0){const a=this.spawnQueue.findIndex(o=>o.portalSide==="left");if(a!==-1){const o=this.spawnQueue.splice(a,1)[0];this.spawnFromPortal(o),this.portalTimers.left=this.PORTAL_SPAWN_INTERVAL}}if(this.portalTimers.right<=0){const a=this.spawnQueue.findIndex(o=>o.portalSide==="right");if(a!==-1){const o=this.spawnQueue.splice(a,1)[0];this.spawnFromPortal(o),this.portalTimers.right=this.PORTAL_SPAWN_INTERVAL}}}for(const[a,o]of this.phantomDamageCooldown)o>0&&this.phantomDamageCooldown.set(a,o-t);for(const a of this.targets)a.update(t,e,i),a.checkPlayerCollision(e)&&(a.enemyType==="phantom"?(this.phantomDamageCooldown.get(a.id)||0)<=0&&(this.onPlayerHit?.(a),this.phantomDamageCooldown.set(a.id,1)):a.isBoss?(this.phantomDamageCooldown.get(a.id)||0)<=0&&(this.onPlayerHit?.(a),this.phantomDamageCooldown.set(a.id,1.5)):a.enemyType==="baneling"?a.isAboutToExplode&&a.explodeTimer<=0&&(this.onPlayerHit?.(a),a.active=!1):(this.onPlayerHit?.(a),a.active=!1));this.targets=this.targets.filter(a=>!a.canRemove());for(const a of this.acidProjectiles){a.progress+=t/a.flightTime;const o=a.progress;a.position.x=a.startPos.x+(a.targetPos.x-a.startPos.x)*o,a.position.z=a.startPos.z+(a.targetPos.z-a.startPos.z)*o,a.position.y=a.startPos.y+(1-(2*o-1)*(2*o-1))*8,a.progress>=1&&(this.toxicPools.push({position:{...a.targetPos},radius:.5,maxRadius:3.5,lifetime:6,maxLifetime:6,damage:8,spreadProgress:0}),this.onAcidRain?.(a.targetPos))}this.acidProjectiles=this.acidProjectiles.filter(a=>a.progress<1);for(const a of this.spikes)if(a.active){if(a.lifetime-=t,a.intensity=Math.max(0,a.lifetime/.4),a.lifetime<=0){a.active=!1;continue}if(!a.damageDealt){const o={x:a.end.x-a.start.x,y:a.end.y-a.start.y,z:a.end.z-a.start.z},s=Math.sqrt(o.x**2+o.y**2+o.z**2);if(s>.1){o.x/=s,o.y/=s,o.z/=s;const n={x:e.x-a.start.x,y:e.y-a.start.y,z:e.z-a.start.z},l=n.x*o.x+n.y*o.y+n.z*o.z,c=Math.max(0,Math.min(s,l)),r={x:a.start.x+o.x*c,y:a.start.y+o.y*c,z:a.start.z+o.z*c};Math.sqrt((e.x-r.x)**2+(e.y-r.y)**2+(e.z-r.z)**2)<1.2&&(a.damageDealt=!0,this.onSpikeHit?.())}}}this.spikes=this.spikes.filter(a=>a.active);for(const a of this.toxicPools)a.spreadProgress<1&&(a.spreadProgress=Math.min(1,a.spreadProgress+t/1.5),a.radius=a.maxRadius*(.3+.7*a.spreadProgress));for(const a of this.acidRainZones)a.isRaining?a.lifetime-=t:(a.markTime-=t,a.markTime<=0&&(a.isRaining=!0,this.onAcidRainStart?.(a.position)));if(this.acidRainZones=this.acidRainZones.filter(a=>a.lifetime>0||!a.isRaining),this.poolDamageTimer-=t,this.poolDamageTimer<=0){this.poolDamageTimer=.5;for(const a of this.toxicPools){const o=e.x-a.position.x,s=e.z-a.position.z;if(Math.sqrt(o*o+s*s)<a.radius&&e.y<.8){this.onPoolDamage?.(a.damage);break}}for(const a of this.targets)if((a.isDying||a.deathProgress>0)&&a.enemyType==="baneling"){const o=e.x-a.position.x,s=e.z-a.position.z,n=Math.sqrt(o*o+s*s),l=a.radius*(1+a.deathProgress*.8);if(n<l&&e.y<.8){this.onPoolDamage?.(8);break}}for(const a of this.acidRainZones){if(!a.isRaining)continue;const o=e.x-a.position.x,s=e.z-a.position.z;if(Math.sqrt(o*o+s*s)<a.radius&&!this.isPlayerUnderPlatform(e)){this.onPoolDamage?.(a.damage);break}}}this.waveActive&&this.getActiveCount()===0&&this.spawnQueue.length===0&&(this.waveActive=!1,this.waveTimer=this.waveDelay,this.onWaveComplete?.(this.wave))}trySlice(t,e,i,a,o=!0,s=0){const n=Math.sin(e),l=-Math.cos(e),c=Math.cos(e),r=Math.sin(e);let h,p;s===0?(h=-c*.8+n*.4,p=-r*.8+l*.4):(h=c*.9+n*.3,p=r*.9+l*.3);for(const u of this.targets){if(!u.active||u.requiresJumpToKill&&o)continue;const f=u.position.x-t.x,m=u.position.y-t.y,g=u.position.z-t.z,x=Math.sqrt(f*f+g*g),y=Math.sqrt(f*f+m*m+g*g),b=u.requiresJumpToKill?i+2.5:i+(u.isBoss?u.radius:0);if((u.requiresJumpToKill?y:x)>b)continue;let P=Math.atan2(f,-g)-e;for(;P>Math.PI;)P-=Math.PI*2;for(;P<-Math.PI;)P+=Math.PI*2;if(Math.abs(P)>a/2)continue;const R={x:h*.7+n*.5,y:.3,z:p*.7+l*.5};if(u.isBoss){const D=u.takeDamage(1);if(u.enemyType==="boss_green"&&!D){const S=this.greenBossPhase2?2:1;for(let T=0;T<S;T++)this.spawnBanelingFromBoss(u.position)}if(D){if(u.slice(R),this.score+=1e3*this.wave,this.onTargetDestroyed?.(u),u.enemyType==="boss_green"){this.targets.filter(T=>T.active&&T.enemyType==="boss_green"&&T!==u).length>0&&!this.greenBossPhase2&&(this.greenBossPhase2=!0,this.onBossPhaseChange?.("boss_green",2));for(let T=0;T<5;T++)this.spawnBanelingFromBoss(u.position)}}else{const S=u.enemyType==="boss_green"?8:u.enemyType==="boss_black"?5:12;u.applyKnockback(f,g,S)}return u}else return u.slice(R),this.score+=100*this.wave,this.onTargetDestroyed?.(u),u}return null}trySplashWave(t,e,i){let a=0;const o=Math.sin(e),s=-Math.cos(e);for(const n of this.targets){if(!n.active)continue;const l=n.position.x-t.x,c=n.position.z-t.z,r=Math.sqrt(l*l+c*c),h=i+(n.isBoss,n.radius);if(r>h)continue;const p=r||1,u={x:l/p*.6+o*.5,y:.4,z:c/p*.6+s*.5};if(n.isBoss){const f=n.takeDamage(2);if(n.enemyType==="boss_green"&&!f){const m=this.greenBossPhase2?2:1;for(let g=0;g<m;g++)this.spawnBanelingFromBoss(n.position)}if(f){if(n.slice(u),this.score+=1e3*this.wave,this.onTargetDestroyed?.(n),a++,n.enemyType==="boss_green"){this.targets.filter(g=>g.active&&g.enemyType==="boss_green"&&g!==n).length>0&&!this.greenBossPhase2&&(this.greenBossPhase2=!0,this.onBossPhaseChange?.("boss_green",2));for(let g=0;g<5;g++)this.spawnBanelingFromBoss(n.position)}}else{const m=n.enemyType==="boss_green"?12:n.enemyType==="boss_black"?8:18;n.applyKnockback(l,c,m)}}else n.slice(u),this.score+=100*this.wave,this.onTargetDestroyed?.(n),a++}return a}getShaderData(){const t=new Float32Array(this.targets.length*4);for(let e=0;e<this.targets.length;e++){const[i,a,o,s]=this.targets[e].getShaderData();t[e*4+0]=i,t[e*4+1]=a,t[e*4+2]=o,t[e*4+3]=s}return t}getAllFragmentsData(){const t=[];for(const e of this.targets)t.push(...e.getFragmentsData());return new Float32Array(t)}getPoolsShaderData(){const t=new Float32Array(this.toxicPools.length*4);for(let e=0;e<this.toxicPools.length;e++){const i=this.toxicPools[e];t[e*4+0]=i.position.x,t[e*4+1]=i.position.z,t[e*4+2]=i.radius,t[e*4+3]=i.spreadProgress}return t}getAcidProjectilesData(){const t=new Float32Array(this.acidProjectiles.length*4);for(let e=0;e<this.acidProjectiles.length;e++){const i=this.acidProjectiles[e];t[e*4+0]=i.position.x,t[e*4+1]=i.position.y,t[e*4+2]=i.position.z,t[e*4+3]=i.progress}return t}getSpikesData(){const t=new Float32Array(Math.min(this.spikes.length,8)*4);for(let e=0;e<Math.min(this.spikes.length,8);e++){const i=this.spikes[e];t[e*4+0]=i.start.x,t[e*4+1]=i.start.y,t[e*4+2]=i.start.z,t[e*4+3]=i.lifetime}return t}getSpikeTargetsData(){const t=new Float32Array(Math.min(this.spikes.length,8)*4);for(let e=0;e<Math.min(this.spikes.length,8);e++){const i=this.spikes[e];t[e*4+0]=i.end.x,t[e*4+1]=i.end.y,t[e*4+2]=i.end.z,t[e*4+3]=i.intensity}return t}getAcidRainZonesData(){const t=new Float32Array(this.acidRainZones.length*4);for(let e=0;e<this.acidRainZones.length;e++){const i=this.acidRainZones[e];t[e*4+0]=i.position.x,t[e*4+1]=i.position.z,t[e*4+2]=i.radius,t[e*4+3]=i.isRaining?1:(1-i.markTime/1.5)*.5}return t}spawnAcidProjectile(t,e){this.acidProjectiles.push({position:{...t},targetPos:{...e},startPos:{...t},progress:0,flightTime:1.2}),this.onAcidSpit?.()}spawnAcidRainZone(t){this.acidRainZones.push({position:{...t},radius:4,lifetime:5,markTime:1.5,isRaining:!1,damage:6}),this.onAcidRainMarkSound?.()}onAcidSpit;onAcidRainMarkSound;onAcidRainStart;spawnBanelingFromBoss(t){const e=Math.random()*Math.PI*2,i=5+Math.random()*3,a=w(t.x+Math.cos(e)*2,t.y+Math.random()*1.5,t.z+Math.sin(e)*2),o=new V(a,i,this.enemyIdCounter++,"baneling",this.collision||void 0);o.onAboutToExplode=()=>{this.onBanelingAboutToExplode?.()},o.velocity=w(Math.cos(e)*8,3+Math.random()*3,Math.sin(e)*8),this.targets.push(o)}spawnPhantomFromBoss(t){const e=8+Math.random()*4,i=new V(t,e,this.enemyIdCounter++,"phantom",this.collision||void 0);this.targets.push(i)}getVortexPull(t){for(const e of this.targets)if(e.active&&e.enemyType==="boss_black")return e.getVortexPull(t);return w(0,0,0)}trySliceCrystal(t,e,i){for(const a of this.powerCrystals){if(!a.active)continue;const o=a.x-t.x,s=a.height-t.y,n=a.z-t.z;if(Math.sqrt(o*o+s*s+n*n)>i+1)continue;let r=Math.atan2(o,-n)-e;for(;r>Math.PI;)r-=Math.PI*2;for(;r<-Math.PI;)r+=Math.PI*2;if(Math.abs(r)>Math.PI/3)continue;a.active=!1;const h=this.powerCrystals.filter(p=>p.active).length;this.onCrystalDestroyed?.(h),this.spawnPhantomFromBoss(w(a.x,a.height,a.z));for(const p of this.targets)p.active&&p.enemyType==="boss_black"&&(p.maxHp-=10,p.hp>p.maxHp&&(p.hp=p.maxHp));return!0}return!1}getCrystalsData(){const t=new Float32Array(24);for(let e=0;e<6;e++)if(e<this.powerCrystals.length){const i=this.powerCrystals[e];t[e*4+0]=i.x,t[e*4+1]=i.z,t[e*4+2]=i.height,t[e*4+3]=i.active?1:0}else t[e*4+3]=0;return t}getActiveCount(){return this.targets.filter(t=>t.active).length}getActiveBoss(){return this.targets.find(t=>t.active&&t.isBoss)||null}getClosestEnemyDistance(t){let e=1/0;for(const i of this.targets){if(!i.active)continue;const a=i.position.x-t.x,o=i.position.y-t.y,s=i.position.z-t.z,n=Math.sqrt(a*a+o*o+s*s);n<e&&(e=n)}return e}createArenaTargets(t=8){this.startGame()}checkProjectileHit(t,e){return null}}class dt{position;type;radius=1;active=!0;lifetime;phase;baseY;constructor(t,e){this.position={...t},this.type=e,this.phase=Math.random()*Math.PI*2,this.baseY=t.y,this.lifetime=30}update(t,e){this.active&&(this.position.y=this.baseY+Math.sin(e*3+this.phase)*.2,this.lifetime-=t,this.lifetime<=0&&(this.active=!1))}checkPickup(t){return this.active&&At(this.position,t)<this.radius+.5?(this.active=!1,!0):!1}getShaderData(){let t=0;return this.active&&(this.type==="health"?t=9:this.type==="stimpack"?t=10:this.type==="charge"?t=11:this.type==="health_big"&&(t=12)),[this.position.x,this.position.y,this.position.z,t]}}class Kt{pickups=[];spawnTimer=10;edgePositions=[{x:5,y:1,z:28},{x:-5,y:1,z:-28}];edgeSpawnTimer=30;maxPickups=5;chargeOnBalcony=null;chargeRespawnTimer=0;constructor(){this.spawnChargeOnBalcony()}update(t,e,i){for(const a of this.pickups)a.update(t,e);if(this.pickups=this.pickups.filter(a=>a.active),this.spawnTimer-=t,this.spawnTimer<=0&&this.pickups.length<this.maxPickups&&(this.spawnOnEdges(),this.spawnTimer=15+Math.random()*10),this.edgeSpawnTimer-=t,this.edgeSpawnTimer<=0&&(this.spawnOnEdges(),this.edgeSpawnTimer=30),this.updateChargeRespawn(t),this.checkChargePickup(i))return"charge";for(const a of this.pickups)if(a.type!=="charge"&&a.checkPickup(i))return a.type;return null}spawnOnEdges(){for(const t of this.edgePositions){const e=w(t.x,t.y,t.z);this.pickups.find(a=>a.active&&(a.type==="health"||a.type==="health_big")&&Math.abs(a.position.x-e.x)<3&&Math.abs(a.position.z-e.z)<3)||this.pickups.push(new dt(e,"health_big"))}}spawnAfterKill(t){}spawnChargeOnBalcony(){const t=w(0,10.3,0);this.chargeOnBalcony=new dt(t,"charge"),this.chargeOnBalcony.lifetime=999999,this.pickups.push(this.chargeOnBalcony)}checkChargePickup(t){return!this.chargeOnBalcony||!this.chargeOnBalcony.active||t.y<10.5?!1:this.chargeOnBalcony.checkPickup(t)?(this.chargeOnBalcony=null,this.chargeRespawnTimer=60,!0):!1}respawnChargeAfterBoss(){(!this.chargeOnBalcony||!this.chargeOnBalcony.active)&&(this.pickups=this.pickups.filter(t=>t!==this.chargeOnBalcony),this.chargeOnBalcony=null,this.chargeRespawnTimer=0,this.spawnChargeOnBalcony())}updateChargeRespawn(t){this.chargeOnBalcony===null&&this.chargeRespawnTimer>0&&(this.chargeRespawnTimer-=t,this.chargeRespawnTimer<=0&&this.spawnChargeOnBalcony())}getShaderData(){const t=new Float32Array(this.pickups.length*4);for(let e=0;e<this.pickups.length;e++){const[i,a,o,s]=this.pickups[e].getShaderData();t[e*4+0]=i,t[e*4+1]=a,t[e*4+2]=o,t[e*4+3]=s}return t}}class Zt{ctx=null;masterGain=null;musicGain=null;sfxGain=null;reverb=null;distortion=null;compressor=null;voidFilter=null;isInVoidMode=!1;isStarted=!1;isMuted=!1;start(){this.isStarted||(this.ctx=new(window.AudioContext||window.webkitAudioContext),this.compressor=this.ctx.createDynamicsCompressor(),this.compressor.threshold.value=-24,this.compressor.knee.value=30,this.compressor.ratio.value=12,this.compressor.attack.value=.003,this.compressor.release.value=.25,this.compressor.connect(this.ctx.destination),this.masterGain=this.ctx.createGain(),this.masterGain.gain.value=.4,this.masterGain.connect(this.compressor),this.distortion=this.createDistortion(20),this.distortion.connect(this.masterGain),this.reverb=this.createReverb(2.5),this.reverb.connect(this.masterGain),this.musicGain=this.ctx.createGain(),this.musicGain.gain.value=.12,this.musicGain.connect(this.masterGain),this.sfxGain=this.ctx.createGain(),this.sfxGain.gain.value=.3,this.sfxGain.connect(this.distortion),this.voidFilter=this.ctx.createBiquadFilter(),this.voidFilter.type="lowpass",this.voidFilter.frequency.value=2e4,this.voidFilter.Q.value=1,this.musicGain.disconnect(),this.sfxGain.disconnect(),this.musicGain.connect(this.voidFilter),this.sfxGain.connect(this.voidFilter),this.voidFilter.connect(this.distortion),this.isStarted=!0,this.startSynthwaveMusic())}createDistortion(t){const e=this.ctx.createWaveShaper(),i=44100,a=new Float32Array(i),o=Math.PI/180;for(let s=0;s<i;s++){const n=s*2/i-1;a[s]=(3+t)*n*20*o/(Math.PI+t*Math.abs(n))}return e.curve=a,e.oversample="4x",e}createReverb(t){const e=this.ctx.createConvolver(),i=this.ctx.sampleRate,a=i*t,o=this.ctx.createBuffer(2,a,i);for(let s=0;s<2;s++){const n=o.getChannelData(s);for(let l=0;l<a;l++){const c=Math.exp(-3*l/a),r=Math.sin(l*.001)*.3+.7;n[l]=(Math.random()*2-1)*c*r}}return e.buffer=o,e}toggleMute(){this.isMuted=!this.isMuted,this.masterGain&&(this.masterGain.gain.value=this.isMuted?0:this.volume)}volume=.5;setVolume(t){this.volume=Math.max(0,Math.min(1,t)),this.masterGain&&!this.isMuted&&(this.masterGain.gain.value=this.volume)}enterVoidAudio(){if(!this.ctx||!this.voidFilter||this.isInVoidMode)return;this.isInVoidMode=!0;const t=this.ctx.currentTime;this.voidFilter.frequency.cancelScheduledValues(t),this.voidFilter.frequency.setValueAtTime(this.voidFilter.frequency.value,t),this.voidFilter.frequency.exponentialRampToValueAtTime(400,t+.5),this.voidFilter.Q.cancelScheduledValues(t),this.voidFilter.Q.setValueAtTime(this.voidFilter.Q.value,t),this.voidFilter.Q.linearRampToValueAtTime(4,t+.5),this.musicGain&&(this.musicGain.gain.cancelScheduledValues(t),this.musicGain.gain.setValueAtTime(this.musicGain.gain.value,t),this.musicGain.gain.linearRampToValueAtTime(.05,t+.5))}exitVoidAudio(){if(!this.ctx||!this.voidFilter||!this.isInVoidMode)return;this.isInVoidMode=!1;const t=this.ctx.currentTime;this.voidFilter.frequency.cancelScheduledValues(t),this.voidFilter.frequency.setValueAtTime(this.voidFilter.frequency.value,t),this.voidFilter.frequency.exponentialRampToValueAtTime(2e4,t+.3),this.voidFilter.Q.cancelScheduledValues(t),this.voidFilter.Q.setValueAtTime(this.voidFilter.Q.value,t),this.voidFilter.Q.linearRampToValueAtTime(1,t+.3),this.musicGain&&(this.musicGain.gain.cancelScheduledValues(t),this.musicGain.gain.setValueAtTime(this.musicGain.gain.value,t),this.musicGain.gain.linearRampToValueAtTime(.12,t+.3))}proximityOsc=null;proximityGain=null;proximityFilter=null;playSFX(t){if(!(!this.ctx||!this.sfxGain||this.isMuted))switch(t){case"gunshot":this.playKatanaSwing();break;case"reload":this.playGlitch();break;case"footstep":this.playFootstep();break;case"jump":this.playJump();break;case"land":this.playLand();break;case"hit":this.playBanelingExplosion();break;case"phantom_pass":this.playPhantomPass();break;case"runner_hit":this.playRunnerHit();break;case"hopper_hit":this.playHopperHit();break;case"kill":this.playKill();break;case"katana_swing":this.playKatanaSwing();break;case"splash_wave":this.playSplashWave();break;case"charge_pickup":this.playChargePickup();break;case"acid_spit":this.playAcidSpit();break;case"void_whistle":this.playVoidWhistle();break;case"phantom_hit":this.playPhantomHit();break;case"player_hurt":this.playPlayerHurt();break;case"spiker_scream":this.playSpikerScream();break;case"spiker_shoot":this.playSpikerShoot();break;case"explosion":this.playExplosion();break}}updateProximitySound(t){if(!this.ctx||!this.sfxGain||this.isMuted)return;this.proximityOsc||(this.proximityOsc=this.ctx.createOscillator(),this.proximityGain=this.ctx.createGain(),this.proximityFilter=this.ctx.createBiquadFilter(),this.proximityOsc.type="sawtooth",this.proximityFilter.type="lowpass",this.proximityFilter.Q.value=5,this.proximityOsc.connect(this.proximityFilter),this.proximityFilter.connect(this.proximityGain),this.proximityGain.connect(this.sfxGain),this.proximityOsc.start());const e=80+t*200,i=t*.25,a=200+t*1500;if(this.proximityOsc.frequency.setTargetAtTime(e,this.ctx.currentTime,.1),this.proximityGain.gain.setTargetAtTime(i,this.ctx.currentTime,.1),this.proximityFilter.frequency.setTargetAtTime(a,this.ctx.currentTime,.1),t>.6){const o=Math.sin(this.ctx.currentTime*20)*20*t;this.proximityOsc.frequency.setTargetAtTime(e+o,this.ctx.currentTime,.02)}}enemySoundCooldowns=new Map;playEnemyProximitySound(t,e){if(!this.ctx||!this.sfxGain||this.isMuted||e>15)return;const i=Date.now(),a=this.enemySoundCooldowns.get(t)||0,o=t.startsWith("boss")?800:500;if(i-a<o)return;this.enemySoundCooldowns.set(t,i);const s=Math.max(.2,(15-e)/15)*.8,n=this.ctx.currentTime;switch(t){case"baneling":this.playBanelingProximity(s,n);break;case"phantom":this.playPhantomProximity(s,n);break;case"runner":this.playRunnerProximity(s,n);break;case"hopper":this.playHopperProximity(s,n);break;case"boss_green":this.playBossGreenProximity(s,n);break;case"boss_black":this.playBossBlackProximity(s,n);break;case"boss_blue":this.playBossBlueProximity(s,n);break}}playBanelingProximity(t,e){if(!this.ctx||!this.sfxGain)return;const i=this.ctx.createOscillator(),a=this.ctx.createGain(),o=this.ctx.createBiquadFilter();i.type="sine",i.frequency.setValueAtTime(150+Math.random()*50,e),i.frequency.setValueAtTime(100+Math.random()*30,e+.05),i.frequency.setValueAtTime(180+Math.random()*40,e+.1),o.type="lowpass",o.frequency.value=400,o.Q.value=8,a.gain.setValueAtTime(t*.5,e),a.gain.exponentialRampToValueAtTime(.01,e+.15),i.connect(o),o.connect(a),a.connect(this.sfxGain),i.start(e),i.stop(e+.2)}playPhantomProximity(t,e){if(!this.ctx||!this.sfxGain)return;const i=this.ctx.createOscillator(),a=this.ctx.createOscillator(),o=this.ctx.createGain(),s=this.ctx.createBiquadFilter();i.type="sine",i.frequency.setValueAtTime(200,e),i.frequency.linearRampToValueAtTime(150,e+.3),a.type="sine",a.frequency.setValueAtTime(203,e),a.frequency.linearRampToValueAtTime(148,e+.3),s.type="bandpass",s.frequency.value=300,s.Q.value=5,o.gain.setValueAtTime(0,e),o.gain.linearRampToValueAtTime(t*.4,e+.1),o.gain.linearRampToValueAtTime(0,e+.35),i.connect(s),a.connect(s),s.connect(o),o.connect(this.sfxGain),i.start(e),i.stop(e+.4),a.start(e),a.stop(e+.4)}playRunnerProximity(t,e){if(!(!this.ctx||!this.sfxGain))for(let i=0;i<3;i++){const a=this.ctx.createOscillator(),o=this.ctx.createGain(),s=e+i*.06;a.type="triangle",a.frequency.setValueAtTime(80+Math.random()*40,s),a.frequency.exponentialRampToValueAtTime(40,s+.03),o.gain.setValueAtTime(t*.3,s),o.gain.exponentialRampToValueAtTime(.01,s+.04),a.connect(o),o.connect(this.sfxGain),a.start(s),a.stop(s+.05)}}playHopperProximity(t,e){if(!this.ctx||!this.sfxGain)return;const i=this.ctx.createOscillator(),a=this.ctx.createGain();i.type="sine",i.frequency.setValueAtTime(100,e),i.frequency.exponentialRampToValueAtTime(400,e+.1),i.frequency.exponentialRampToValueAtTime(150,e+.2),a.gain.setValueAtTime(t*.4,e),a.gain.exponentialRampToValueAtTime(.01,e+.25),i.connect(a),a.connect(this.sfxGain),i.start(e),i.stop(e+.3)}playBossGreenProximity(t,e){if(!this.ctx||!this.sfxGain)return;const i=this.ctx.sampleRate*.5,a=this.ctx.createBuffer(1,i,this.ctx.sampleRate),o=a.getChannelData(0);for(let f=0;f<i;f++){const m=f/this.ctx.sampleRate,g=Math.sin(m*12)*.5+.5,x=Math.sin(m*Math.PI/.5)*g;o[f]=(Math.random()*2-1)*x*.8}const s=this.ctx.createBufferSource();s.buffer=a;const n=this.ctx.createBiquadFilter();n.type="bandpass",n.frequency.value=3500,n.Q.value=1.5;const l=this.ctx.createBiquadFilter();l.type="highpass",l.frequency.value=800;const c=this.ctx.createGain();c.gain.setValueAtTime(0,e),c.gain.linearRampToValueAtTime(t*.6,e+.05),c.gain.setValueAtTime(t*.6,e+.35),c.gain.exponentialRampToValueAtTime(.01,e+.5),s.connect(n),n.connect(l),l.connect(c),c.connect(this.sfxGain),s.start(e),s.stop(e+.55);const r=this.ctx.createOscillator(),h=this.ctx.createOscillator(),p=this.ctx.createGain(),u=this.ctx.createBiquadFilter();if(r.type="sine",r.frequency.value=85,h.type="sine",h.frequency.value=87,u.type="lowpass",u.frequency.value=150,p.gain.setValueAtTime(t*.15,e),p.gain.exponentialRampToValueAtTime(.01,e+.5),r.connect(u),h.connect(u),u.connect(p),p.connect(this.sfxGain),r.start(e),h.start(e),r.stop(e+.55),h.stop(e+.55),Math.random()>.5){const f=this.ctx.createOscillator(),m=this.ctx.createGain();f.type="sine",f.frequency.setValueAtTime(300,e+.1),f.frequency.exponentialRampToValueAtTime(150,e+.4),m.gain.setValueAtTime(t*.08,e+.1),m.gain.exponentialRampToValueAtTime(.01,e+.4),f.connect(m),m.connect(this.sfxGain),f.start(e+.1),f.stop(e+.45)}}playBossBlackProximity(t,e){if(!this.ctx||!this.sfxGain)return;const i=this.ctx.createOscillator(),a=this.ctx.createOscillator(),o=this.ctx.createGain(),s=this.ctx.createBiquadFilter();i.type="sine",i.frequency.setValueAtTime(40,e),a.type="sine",a.frequency.setValueAtTime(42,e),s.type="lowpass",s.frequency.value=100,s.Q.value=10,o.gain.setValueAtTime(0,e),o.gain.linearRampToValueAtTime(t*.6,e+.15),o.gain.linearRampToValueAtTime(0,e+.4),i.connect(s),a.connect(s),s.connect(o),o.connect(this.sfxGain),i.start(e),i.stop(e+.45),a.start(e),a.stop(e+.45);const n=this.ctx.createOscillator(),l=this.ctx.createGain();n.type="sawtooth",n.frequency.setValueAtTime(80,e),n.frequency.exponentialRampToValueAtTime(30,e+.3),l.gain.setValueAtTime(t*.2,e),l.gain.exponentialRampToValueAtTime(.01,e+.35),n.connect(l),l.connect(this.sfxGain),n.start(e),n.stop(e+.4)}playBossBlueProximity(t,e){if(!this.ctx||!this.sfxGain)return;const i=this.ctx.sampleRate*.15,a=this.ctx.createBuffer(1,i,this.ctx.sampleRate),o=a.getChannelData(0);for(let h=0;h<i;h++)o[h]=Math.random()>.95?Math.random()*2-1:0;const s=this.ctx.createBufferSource();s.buffer=a;const n=this.ctx.createBiquadFilter();n.type="highpass",n.frequency.value=3e3;const l=this.ctx.createGain();l.gain.setValueAtTime(t*.4,e),l.gain.exponentialRampToValueAtTime(.01,e+.15),s.connect(n),n.connect(l),l.connect(this.sfxGain),s.start(e),s.stop(e+.18);const c=this.ctx.createOscillator(),r=this.ctx.createGain();c.type="sine",c.frequency.setValueAtTime(2e3+Math.random()*500,e),c.frequency.exponentialRampToValueAtTime(500,e+.1),r.gain.setValueAtTime(t*.25,e),r.gain.exponentialRampToValueAtTime(.01,e+.12),c.connect(r),r.connect(this.sfxGain),c.start(e),c.stop(e+.15)}playBanelingExplosion(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(100,t),e.frequency.exponentialRampToValueAtTime(20,t+.3),i.gain.setValueAtTime(.7,t),i.gain.exponentialRampToValueAtTime(.01,t+.4),e.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+.5);const a=this.createNoise(.4),o=this.ctx.createGain(),s=this.ctx.createBiquadFilter(),n=this.ctx.createBiquadFilter();s.type="bandpass",s.frequency.setValueAtTime(3e3,t),s.frequency.exponentialRampToValueAtTime(500,t+.3),s.Q.value=3,n.type="highpass",n.frequency.value=1e3,o.gain.setValueAtTime(.5,t),o.gain.exponentialRampToValueAtTime(.01,t+.35),a.connect(s),s.connect(n),n.connect(o),o.connect(this.sfxGain);for(let h=0;h<5;h++){const p=h*.04,u=this.ctx.createOscillator(),f=this.ctx.createGain();u.type="sine",u.frequency.setValueAtTime(400+Math.random()*600,t+p),u.frequency.exponentialRampToValueAtTime(100+Math.random()*100,t+p+.08),f.gain.setValueAtTime(.15,t+p),f.gain.exponentialRampToValueAtTime(.01,t+p+.1),u.connect(f),f.connect(this.sfxGain),u.start(t+p),u.stop(t+p+.15)}const l=this.createNoise(.8),c=this.ctx.createGain(),r=this.ctx.createBiquadFilter();r.type="highpass",r.frequency.value=4e3,c.gain.setValueAtTime(.2,t+.1),c.gain.exponentialRampToValueAtTime(.01,t+.7),l.connect(r),r.connect(c),c.connect(this.sfxGain)}playVoidWhistle(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sine",e.frequency.setValueAtTime(600,t),e.frequency.exponentialRampToValueAtTime(1200,t+.8),e.frequency.exponentialRampToValueAtTime(800,t+1.2),a.type="bandpass",a.frequency.setValueAtTime(800,t),a.frequency.linearRampToValueAtTime(1500,t+.8),a.Q.value=8,i.gain.setValueAtTime(0,t),i.gain.linearRampToValueAtTime(.25,t+.3),i.gain.setValueAtTime(.25,t+.8),i.gain.exponentialRampToValueAtTime(.01,t+1.3),e.connect(a),a.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+1.4);const o=this.ctx.createOscillator(),s=this.ctx.createGain();o.type="triangle",o.frequency.setValueAtTime(150,t),o.frequency.linearRampToValueAtTime(200,t+1),s.gain.setValueAtTime(0,t),s.gain.linearRampToValueAtTime(.1,t+.2),s.gain.setValueAtTime(.1,t+.8),s.gain.exponentialRampToValueAtTime(.01,t+1.2),o.connect(s),s.connect(this.sfxGain),o.start(t),o.stop(t+1.3)}playPhantomHit(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(80,t),e.frequency.exponentialRampToValueAtTime(30,t+.2),a.type="lowpass",a.frequency.setValueAtTime(500,t),a.frequency.exponentialRampToValueAtTime(100,t+.15),a.Q.value=3,i.gain.setValueAtTime(.5,t),i.gain.exponentialRampToValueAtTime(.01,t+.25),e.connect(a),a.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.3);const o=this.ctx.createBuffer(1,this.ctx.sampleRate*.15,this.ctx.sampleRate),s=o.getChannelData(0);for(let r=0;r<s.length;r++)s[r]=(Math.random()*2-1)*Math.exp(-r/(s.length*.3));const n=this.ctx.createBufferSource();n.buffer=o;const l=this.ctx.createGain(),c=this.ctx.createBiquadFilter();c.type="lowpass",c.frequency.value=400,l.gain.setValueAtTime(.4,t),l.gain.exponentialRampToValueAtTime(.01,t+.15),n.connect(c),c.connect(l),l.connect(this.sfxGain),n.start(t)}playPlayerHurt(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(180+Math.random()*40,t),e.frequency.exponentialRampToValueAtTime(120,t+.08),e.frequency.exponentialRampToValueAtTime(80,t+.25),a.type="lowpass",a.frequency.value=600,a.Q.value=2,i.gain.setValueAtTime(.25,t),i.gain.linearRampToValueAtTime(.18,t+.05),i.gain.exponentialRampToValueAtTime(.01,t+.3),e.connect(a),a.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.35);const o=this.ctx.createOscillator(),s=this.ctx.createGain();o.type="triangle",o.frequency.setValueAtTime(100,t),o.frequency.exponentialRampToValueAtTime(60,t+.2),s.gain.setValueAtTime(.12,t),s.gain.exponentialRampToValueAtTime(.01,t+.2),o.connect(s),s.connect(this.sfxGain),o.start(t),o.stop(t+.25);const n=this.createNoise(.2),l=this.ctx.createGain(),c=this.ctx.createBiquadFilter();c.type="bandpass",c.frequency.setValueAtTime(800,t),c.frequency.exponentialRampToValueAtTime(300,t+.15),c.Q.value=.8,l.gain.setValueAtTime(.2,t),l.gain.exponentialRampToValueAtTime(.01,t+.18),n.connect(c),c.connect(l),l.connect(this.sfxGain)}playBanelingSpawn(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime;for(let l=0;l<4;l++){const c=l*.05+Math.random()*.02,r=this.ctx.createOscillator(),h=this.ctx.createGain(),p=this.ctx.createBiquadFilter();r.type="sine";const u=200+Math.random()*300;r.frequency.setValueAtTime(u,t+c),r.frequency.exponentialRampToValueAtTime(u*.4,t+c+.12),p.type="lowpass",p.frequency.value=800,p.Q.value=4,h.gain.setValueAtTime(.2,t+c),h.gain.exponentialRampToValueAtTime(.01,t+c+.15),r.connect(p),p.connect(h),h.connect(this.sfxGain),r.start(t+c),r.stop(t+c+.2)}const e=Math.floor(this.ctx.sampleRate*.2),i=this.ctx.createBuffer(1,e,this.ctx.sampleRate),a=i.getChannelData(0);for(let l=0;l<e;l++)a[l]=(Math.random()*2-1)*Math.exp(-l/(e*.3))*.3;const o=this.ctx.createBufferSource();o.buffer=i;const s=this.ctx.createGain(),n=this.ctx.createBiquadFilter();n.type="lowpass",n.frequency.value=600,s.gain.setValueAtTime(.25,t),s.gain.exponentialRampToValueAtTime(.01,t+.2),o.connect(n),n.connect(s),s.connect(this.sfxGain),o.start(t)}playBanelingWarning(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=.5,i=this.ctx.createOscillator(),a=this.ctx.createGain(),o=this.ctx.createBiquadFilter();i.type="sawtooth",i.frequency.setValueAtTime(300,t),i.frequency.linearRampToValueAtTime(800,t+.1),i.frequency.linearRampToValueAtTime(400,t+.2),i.frequency.linearRampToValueAtTime(900,t+.3),i.frequency.linearRampToValueAtTime(500,t+.4),i.frequency.linearRampToValueAtTime(1200,t+.5),o.type="bandpass",o.frequency.value=600,o.Q.value=8,a.gain.setValueAtTime(.15,t),a.gain.linearRampToValueAtTime(.4,t+.3),a.gain.linearRampToValueAtTime(.5,t+e),i.connect(o),o.connect(a),a.connect(this.sfxGain),i.start(t),i.stop(t+e);const s=this.ctx.createOscillator(),n=this.ctx.createGain();s.type="sine",s.frequency.setValueAtTime(60,t),s.frequency.linearRampToValueAtTime(100,t+e),n.gain.setValueAtTime(.3,t),n.gain.linearRampToValueAtTime(.5,t+e),s.connect(n),n.connect(this.sfxGain),s.start(t),s.stop(t+e);const l=Math.floor(this.ctx.sampleRate*e),c=this.ctx.createBuffer(1,l,this.ctx.sampleRate),r=c.getChannelData(0);for(let f=0;f<l;f++){const m=f/l,g=Math.sin(m*80)>0?1:.3;r[f]=(Math.random()*2-1)*m*g*.4}const h=this.ctx.createBufferSource();h.buffer=c;const p=this.ctx.createBiquadFilter();p.type="highpass",p.frequency.value=2e3;const u=this.ctx.createGain();u.gain.setValueAtTime(.1,t),u.gain.linearRampToValueAtTime(.3,t+e),h.connect(p),p.connect(u),u.connect(this.sfxGain),h.start(t),h.stop(t+e)}playPhantomSpawn(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="triangle",e.frequency.setValueAtTime(150,t),e.frequency.exponentialRampToValueAtTime(600,t+.3),e.frequency.setValueAtTime(500,t+.35),a.type="bandpass",a.frequency.setValueAtTime(300,t),a.frequency.linearRampToValueAtTime(800,t+.3),a.Q.value=6,i.gain.setValueAtTime(0,t),i.gain.linearRampToValueAtTime(.2,t+.1),i.gain.setValueAtTime(.2,t+.25),i.gain.exponentialRampToValueAtTime(.01,t+.5),e.connect(a),a.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+.55);const o=this.ctx.createOscillator(),s=this.ctx.createGain();o.type="sine",o.frequency.setValueAtTime(80,t),o.frequency.linearRampToValueAtTime(120,t+.3),s.gain.setValueAtTime(0,t),s.gain.linearRampToValueAtTime(.15,t+.1),s.gain.exponentialRampToValueAtTime(.01,t+.4),o.connect(s),s.connect(this.sfxGain),o.start(t),o.stop(t+.45)}playRunnerSpawn(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(200,t),e.frequency.linearRampToValueAtTime(400,t+.05),e.frequency.linearRampToValueAtTime(250,t+.1),e.frequency.linearRampToValueAtTime(350,t+.15),e.frequency.linearRampToValueAtTime(200,t+.2),a.type="highpass",a.frequency.value=1e3,a.Q.value=2,i.gain.setValueAtTime(.15,t),i.gain.exponentialRampToValueAtTime(.01,t+.25),e.connect(a),a.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.3);const o=Math.floor(this.ctx.sampleRate*.15),s=this.ctx.createBuffer(1,o,this.ctx.sampleRate),n=s.getChannelData(0);for(let h=0;h<o;h++){const p=Math.sin(h/this.ctx.sampleRate*60*Math.PI*2)*.5+.5;n[h]=(Math.random()*2-1)*p*Math.exp(-h/(o*.5))}const l=this.ctx.createBufferSource();l.buffer=s;const c=this.ctx.createGain(),r=this.ctx.createBiquadFilter();r.type="highpass",r.frequency.value=2e3,c.gain.setValueAtTime(.2,t),c.gain.exponentialRampToValueAtTime(.01,t+.15),l.connect(r),r.connect(c),c.connect(this.sfxGain),l.start(t)}playHopperSpawn(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(150,t),e.frequency.exponentialRampToValueAtTime(400,t+.08),e.frequency.exponentialRampToValueAtTime(200,t+.2),e.frequency.exponentialRampToValueAtTime(300,t+.25),i.gain.setValueAtTime(.3,t),i.gain.exponentialRampToValueAtTime(.01,t+.35),e.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.4);const a=this.ctx.createOscillator(),o=this.ctx.createGain(),s=this.ctx.createBiquadFilter();a.type="square",a.frequency.setValueAtTime(800,t+.05),a.frequency.linearRampToValueAtTime(1200,t+.1),a.frequency.linearRampToValueAtTime(600,t+.15),s.type="bandpass",s.frequency.value=1e3,s.Q.value=5,o.gain.setValueAtTime(0,t+.05),o.gain.linearRampToValueAtTime(.15,t+.08),o.gain.exponentialRampToValueAtTime(.01,t+.2),a.connect(s),s.connect(o),o.connect(this.sfxGain),a.start(t+.05),a.stop(t+.25)}playBossSpawn(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(60,t),e.frequency.linearRampToValueAtTime(100,t+.3),e.frequency.exponentialRampToValueAtTime(40,t+.8),a.type="lowpass",a.frequency.setValueAtTime(300,t),a.frequency.linearRampToValueAtTime(500,t+.3),a.frequency.exponentialRampToValueAtTime(200,t+.8),a.Q.value=2,i.gain.setValueAtTime(0,t),i.gain.linearRampToValueAtTime(.5,t+.1),i.gain.setValueAtTime(.5,t+.4),i.gain.exponentialRampToValueAtTime(.01,t+1),e.connect(a),a.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+1.1);const o=this.ctx.createOscillator(),s=this.ctx.createGain();o.type="triangle",o.frequency.setValueAtTime(120,t),o.frequency.linearRampToValueAtTime(180,t+.3),o.frequency.exponentialRampToValueAtTime(80,t+.8),s.gain.setValueAtTime(0,t),s.gain.linearRampToValueAtTime(.3,t+.1),s.gain.exponentialRampToValueAtTime(.01,t+.9),o.connect(s),s.connect(this.sfxGain),o.start(t),o.stop(t+1);const n=Math.floor(this.ctx.sampleRate*.8),l=this.ctx.createBuffer(1,n,this.ctx.sampleRate),c=l.getChannelData(0);for(let u=0;u<n;u++){const f=Math.sin(u/n*Math.PI);c[u]=(Math.random()*2-1)*f*.3}const r=this.ctx.createBufferSource();r.buffer=l;const h=this.ctx.createGain(),p=this.ctx.createBiquadFilter();p.type="lowpass",p.frequency.value=400,h.gain.setValueAtTime(0,t),h.gain.linearRampToValueAtTime(.25,t+.1),h.gain.exponentialRampToValueAtTime(.01,t+.8),r.connect(p),p.connect(h),h.connect(this.sfxGain),h.connect(this.reverb),r.start(t)}playPortalActivate(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(100,t);const a=this.ctx.createOscillator(),o=this.ctx.createGain();a.frequency.value=5,o.gain.value=15,a.connect(o),o.connect(e.frequency),i.gain.setValueAtTime(.2,t),i.gain.exponentialRampToValueAtTime(.01,t+.5),e.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),a.start(t),e.start(t),e.stop(t+.6),a.stop(t+.6)}playSpikerScream(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(800,t),e.frequency.exponentialRampToValueAtTime(2e3,t+.1),e.frequency.exponentialRampToValueAtTime(1500,t+.2),a.type="bandpass",a.frequency.value=1500,a.Q.value=3,i.gain.setValueAtTime(.3,t),i.gain.exponentialRampToValueAtTime(.01,t+.25),e.connect(a),a.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.3);const o=this.ctx.createOscillator(),s=this.ctx.createGain();o.type="sine",o.frequency.setValueAtTime(1200,t);const n=this.ctx.createOscillator(),l=this.ctx.createGain();n.frequency.value=25,l.gain.value=100,n.connect(l),l.connect(o.frequency),s.gain.setValueAtTime(.15,t),s.gain.exponentialRampToValueAtTime(.01,t+.2),o.connect(s),s.connect(this.sfxGain),n.start(t),o.start(t),o.stop(t+.25),n.stop(t+.25)}playSpikerShoot(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sine",e.frequency.setValueAtTime(3e3,t),e.frequency.exponentialRampToValueAtTime(800,t+.15),a.type="highpass",a.frequency.value=1e3,i.gain.setValueAtTime(.2,t),i.gain.exponentialRampToValueAtTime(.01,t+.15),e.connect(a),a.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.2);const o=this.ctx.createOscillator(),s=this.ctx.createGain();o.type="square",o.frequency.setValueAtTime(600,t),o.frequency.exponentialRampToValueAtTime(200,t+.03),s.gain.setValueAtTime(.25,t),s.gain.exponentialRampToValueAtTime(.01,t+.05),o.connect(s),s.connect(this.sfxGain),o.start(t),o.stop(t+.08)}playExplosion(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createBuffer(1,this.ctx.sampleRate*.5,this.ctx.sampleRate),i=e.getChannelData(0);for(let h=0;h<i.length;h++)i[h]=Math.random()>.5?1:-1,h%100<30&&(i[h]*=.3);const a=this.ctx.createBufferSource();a.buffer=e;const o=this.ctx.createGain(),s=this.ctx.createBiquadFilter();s.type="bandpass",s.frequency.setValueAtTime(2e3,t),s.frequency.exponentialRampToValueAtTime(100,t+.3),s.Q.value=3,o.gain.setValueAtTime(.8,t),o.gain.exponentialRampToValueAtTime(.01,t+.4),a.connect(s),s.connect(o),o.connect(this.sfxGain),a.start(t),a.stop(t+.5);const n=this.ctx.createOscillator(),l=this.ctx.createGain();n.type="sine",n.frequency.setValueAtTime(80,t),n.frequency.exponentialRampToValueAtTime(20,t+.3),l.gain.setValueAtTime(.9,t),l.gain.exponentialRampToValueAtTime(.01,t+.4),n.connect(l),l.connect(this.sfxGain),n.start(t),n.stop(t+.4);const c=this.ctx.createOscillator(),r=this.ctx.createGain();c.type="square",c.frequency.setValueAtTime(4e3,t),c.frequency.setValueAtTime(100,t+.05),c.frequency.setValueAtTime(3e3,t+.1),c.frequency.setValueAtTime(50,t+.15),r.gain.setValueAtTime(.3,t),r.gain.setValueAtTime(.5,t+.05),r.gain.setValueAtTime(.2,t+.1),r.gain.exponentialRampToValueAtTime(.01,t+.25),c.connect(r),r.connect(this.sfxGain),c.start(t),c.stop(t+.3)}playPhantomPass(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(400,t),e.frequency.exponentialRampToValueAtTime(100,t+.3),a.type="lowpass",a.frequency.setValueAtTime(2e3,t),a.frequency.exponentialRampToValueAtTime(300,t+.3),a.Q.value=2,i.gain.setValueAtTime(.3,t),i.gain.exponentialRampToValueAtTime(.01,t+.4),e.connect(a),a.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+.5);const o=this.ctx.createOscillator(),s=this.ctx.createGain();o.type="sine",o.frequency.setValueAtTime(60,t),o.frequency.exponentialRampToValueAtTime(30,t+.5),s.gain.setValueAtTime(.4,t),s.gain.exponentialRampToValueAtTime(.01,t+.6),o.connect(s),s.connect(this.sfxGain),o.start(t),o.stop(t+.7);const n=this.createNoise(.3),l=this.ctx.createGain(),c=this.ctx.createBiquadFilter();c.type="bandpass",c.frequency.value=3e3,c.Q.value=5,l.gain.setValueAtTime(.15,t),l.gain.exponentialRampToValueAtTime(.01,t+.25),n.connect(c),c.connect(l),l.connect(this.sfxGain)}playRunnerHit(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sawtooth",e.frequency.setValueAtTime(800,t),e.frequency.exponentialRampToValueAtTime(200,t+.15),i.gain.setValueAtTime(.3,t),i.gain.exponentialRampToValueAtTime(.01,t+.2),e.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.25);for(let s=0;s<4;s++){const n=this.ctx.createOscillator(),l=this.ctx.createGain();n.type="square",n.frequency.value=1e3+Math.random()*2e3;const c=t+s*.03;l.gain.setValueAtTime(.15,c),l.gain.setValueAtTime(0,c+.02),n.connect(l),l.connect(this.sfxGain),n.start(c),n.stop(c+.03)}const a=this.ctx.createOscillator(),o=this.ctx.createGain();a.type="sine",a.frequency.setValueAtTime(120,t),a.frequency.exponentialRampToValueAtTime(40,t+.15),o.gain.setValueAtTime(.4,t),o.gain.exponentialRampToValueAtTime(.01,t+.2),a.connect(o),o.connect(this.sfxGain),a.start(t),a.stop(t+.25)}playHopperHit(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(2e3,t),e.frequency.exponentialRampToValueAtTime(100,t+.2),a.type="bandpass",a.frequency.value=1500,a.Q.value=3,i.gain.setValueAtTime(.35,t),i.gain.exponentialRampToValueAtTime(.01,t+.25),e.connect(a),a.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+.3);const o=this.ctx.createOscillator(),s=this.ctx.createGain();o.type="sine",o.frequency.setValueAtTime(80,t+.05),o.frequency.exponentialRampToValueAtTime(25,t+.3),s.gain.setValueAtTime(.5,t+.05),s.gain.exponentialRampToValueAtTime(.01,t+.35),o.connect(s),s.connect(this.sfxGain),o.start(t+.05),o.stop(t+.4);const n=this.createNoise(.25),l=this.ctx.createGain(),c=this.ctx.createBiquadFilter();c.type="highpass",c.frequency.value=3e3,l.gain.setValueAtTime(.2,t),l.gain.exponentialRampToValueAtTime(.01,t+.15),n.connect(c),c.connect(l),l.connect(this.sfxGain)}playGlitch(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime;for(let e=0;e<5;e++){const i=e*.03+Math.random()*.02,a=this.ctx.createOscillator(),o=this.ctx.createGain(),s=this.ctx.createBiquadFilter();a.type=Math.random()>.5?"square":"sawtooth",a.frequency.value=100+Math.random()*2e3,s.type="bandpass",s.frequency.value=500+Math.random()*3e3,s.Q.value=5+Math.random()*10,o.gain.setValueAtTime(.15,t+i),o.gain.setValueAtTime(0,t+i+.02+Math.random()*.03),a.connect(s),s.connect(o),o.connect(this.sfxGain),o.connect(this.reverb),a.start(t+i),a.stop(t+i+.1)}}footstepCount=0;playFootstep(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime;this.footstepCount++;const e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(60,t),e.frequency.exponentialRampToValueAtTime(25,t+.06),i.gain.setValueAtTime(.12,t),i.gain.exponentialRampToValueAtTime(.01,t+.08),e.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.1);const a=this.createNoise(.05),o=this.ctx.createGain(),s=this.ctx.createBiquadFilter();s.type="lowpass",s.frequency.value=250+Math.random()*150,o.gain.setValueAtTime(.06,t),o.gain.exponentialRampToValueAtTime(.01,t+.04),a.connect(s),s.connect(o),o.connect(this.sfxGain),this.footstepCount%4===0&&this.playRunningBreath()}playRunningBreath(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=Math.random()>.5,i=this.createNoise(e?.15:.2),a=this.ctx.createGain(),o=this.ctx.createBiquadFilter();if(o.type="bandpass",o.frequency.value=e?700:400,o.Q.value=.6,a.gain.setValueAtTime(.01,t),a.gain.linearRampToValueAtTime(.08,t+.05),a.gain.exponentialRampToValueAtTime(.01,t+(e?.12:.18)),i.connect(o),o.connect(a),a.connect(this.sfxGain),!e){const s=this.ctx.createOscillator(),n=this.ctx.createGain();s.type="sine",s.frequency.value=100+Math.random()*30,n.gain.setValueAtTime(.03,t),n.gain.exponentialRampToValueAtTime(.01,t+.1),s.connect(n),n.connect(this.sfxGain),s.start(t),s.stop(t+.12)}}playJump(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(140,t),e.frequency.exponentialRampToValueAtTime(180,t+.05),e.frequency.exponentialRampToValueAtTime(100,t+.12),a.type="lowpass",a.frequency.value=500,a.Q.value=1.5,i.gain.setValueAtTime(.18,t),i.gain.exponentialRampToValueAtTime(.01,t+.12),e.connect(a),a.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.15);const o=this.createNoise(.1),s=this.ctx.createGain(),n=this.ctx.createBiquadFilter();n.type="bandpass",n.frequency.value=500,n.Q.value=.7,s.gain.setValueAtTime(.1,t),s.gain.exponentialRampToValueAtTime(.01,t+.08),o.connect(n),n.connect(s),s.connect(this.sfxGain);const l=this.ctx.createOscillator(),c=this.ctx.createGain();l.type="sine",l.frequency.setValueAtTime(60,t),l.frequency.exponentialRampToValueAtTime(40,t+.08),c.gain.setValueAtTime(.15,t),c.gain.exponentialRampToValueAtTime(.01,t+.1),l.connect(c),c.connect(this.sfxGain),l.start(t),l.stop(t+.12)}playLand(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(100,t),e.frequency.exponentialRampToValueAtTime(20,t+.15),i.gain.setValueAtTime(.5,t),i.gain.exponentialRampToValueAtTime(.01,t+.2),e.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+.25);const a=this.createNoise(.15),o=this.ctx.createGain(),s=this.ctx.createBiquadFilter();s.type="lowpass",s.frequency.value=400,o.gain.setValueAtTime(.3,t),o.gain.exponentialRampToValueAtTime(.01,t+.1),a.connect(s),s.connect(o),o.connect(this.sfxGain)}playKill(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(80,t),e.frequency.exponentialRampToValueAtTime(30,t+.15),i.gain.setValueAtTime(.5,t),i.gain.exponentialRampToValueAtTime(.01,t+.2),e.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+.25);const a=this.createNoise(.2),o=this.ctx.createGain(),s=this.ctx.createBiquadFilter();s.type="lowpass",s.frequency.setValueAtTime(800,t),s.frequency.exponentialRampToValueAtTime(200,t+.15),s.Q.value=2,o.gain.setValueAtTime(.35,t),o.gain.exponentialRampToValueAtTime(.01,t+.18),a.connect(s),s.connect(o),o.connect(this.sfxGain),o.connect(this.reverb);for(let n=0;n<3;n++){const l=.05+n*.04,c=this.ctx.createOscillator(),r=this.ctx.createGain();c.type="sine",c.frequency.setValueAtTime(150+Math.random()*100,t+l),c.frequency.exponentialRampToValueAtTime(50,t+l+.08),r.gain.setValueAtTime(.12,t+l),r.gain.exponentialRampToValueAtTime(.01,t+l+.1),c.connect(r),r.connect(this.sfxGain),c.start(t+l),c.stop(t+l+.12)}}createNoise(t){if(!this.ctx)throw new Error("AudioContext not initialized");const e=this.ctx.sampleRate*t,i=this.ctx.createBuffer(1,e,this.ctx.sampleRate),a=i.getChannelData(0);for(let s=0;s<e;s++)a[s]=Math.random()*2-1;const o=this.ctx.createBufferSource();return o.buffer=i,o.start(),o}playKatanaSwing(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.createNoise(.22),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter(),o=this.ctx.createBiquadFilter();a.type="bandpass",a.frequency.setValueAtTime(2500,t),a.frequency.exponentialRampToValueAtTime(800,t+.18),a.Q.value=2.5,o.type="highpass",o.frequency.value=400,i.gain.setValueAtTime(0,t),i.gain.linearRampToValueAtTime(.3,t+.02),i.gain.exponentialRampToValueAtTime(.01,t+.2),e.connect(a),a.connect(o),o.connect(i),i.connect(this.sfxGain);const s=this.ctx.createOscillator(),n=this.ctx.createGain();s.type="sine",s.frequency.setValueAtTime(3500,t),s.frequency.exponentialRampToValueAtTime(1500,t+.08),n.gain.setValueAtTime(.04,t),n.gain.exponentialRampToValueAtTime(.01,t+.06),s.connect(n),n.connect(this.sfxGain),s.start(t),s.stop(t+.1);const l=this.createNoise(.15),c=this.ctx.createGain(),r=this.ctx.createBiquadFilter();r.type="lowpass",r.frequency.setValueAtTime(300,t),r.frequency.exponentialRampToValueAtTime(100,t+.12),c.gain.setValueAtTime(.15,t+.02),c.gain.exponentialRampToValueAtTime(.01,t+.15),l.connect(r),r.connect(c),c.connect(this.sfxGain)}playSplashWave(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(200,t),e.frequency.exponentialRampToValueAtTime(80,t+.4),a.type="lowpass",a.frequency.setValueAtTime(2e3,t),a.frequency.exponentialRampToValueAtTime(400,t+.4),a.Q.value=10,i.gain.setValueAtTime(.5,t),i.gain.exponentialRampToValueAtTime(.01,t+.5),e.connect(a),a.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+.5);const o=this.createNoise(.3),s=this.ctx.createGain(),n=this.ctx.createBiquadFilter();n.type="bandpass",n.frequency.value=3e3,n.Q.value=5,s.gain.setValueAtTime(.2,t),s.gain.exponentialRampToValueAtTime(.01,t+.25),o.connect(n),n.connect(s),s.connect(this.sfxGain);const l=this.ctx.createOscillator(),c=this.ctx.createGain();l.type="sine",l.frequency.setValueAtTime(800,t),l.frequency.exponentialRampToValueAtTime(400,t+.3),c.gain.setValueAtTime(.15,t),c.gain.exponentialRampToValueAtTime(.01,t+.35),l.connect(c),c.connect(this.sfxGain),l.start(t),l.stop(t+.4);const r=this.ctx.createOscillator(),h=this.ctx.createGain();r.type="sine",r.frequency.setValueAtTime(60,t),r.frequency.exponentialRampToValueAtTime(30,t+.3),h.gain.setValueAtTime(.6,t),h.gain.exponentialRampToValueAtTime(.01,t+.4),r.connect(h),h.connect(this.sfxGain),r.start(t),r.stop(t+.45)}playChargePickup(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createOscillator(),a=this.ctx.createGain(),o=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(150,t),e.frequency.exponentialRampToValueAtTime(800,t+.3),i.type="square",i.frequency.setValueAtTime(152,t),i.frequency.exponentialRampToValueAtTime(810,t+.3),o.type="bandpass",o.frequency.setValueAtTime(500,t),o.frequency.exponentialRampToValueAtTime(2e3,t+.3),o.Q.value=8,a.gain.setValueAtTime(.15,t),a.gain.linearRampToValueAtTime(.35,t+.2),a.gain.exponentialRampToValueAtTime(.01,t+.5),e.connect(o),i.connect(o),o.connect(a),a.connect(this.sfxGain),a.connect(this.reverb),e.start(t),e.stop(t+.5),i.start(t),i.stop(t+.5);const s=this.ctx.createOscillator(),n=this.ctx.createGain();s.type="sine",s.frequency.value=2500,n.gain.setValueAtTime(.12,t+.15),n.gain.exponentialRampToValueAtTime(.01,t+.5),s.connect(n),n.connect(this.reverb),s.start(t+.15),s.stop(t+.55);const l=this.createNoise(.2),c=this.ctx.createGain(),r=this.ctx.createBiquadFilter();r.type="highpass",r.frequency.value=4e3,c.gain.setValueAtTime(.1,t+.1),c.gain.exponentialRampToValueAtTime(.01,t+.3),l.connect(r),r.connect(c),c.connect(this.sfxGain)}playAcidSpit(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sawtooth",e.frequency.setValueAtTime(150,t),e.frequency.exponentialRampToValueAtTime(80,t+.15),i.gain.setValueAtTime(.25,t),i.gain.exponentialRampToValueAtTime(.01,t+.2),e.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.2);const a=this.ctx.createOscillator(),o=this.ctx.createGain(),s=this.ctx.createBiquadFilter();a.type="sawtooth",a.frequency.setValueAtTime(500,t+.1),a.frequency.exponentialRampToValueAtTime(150,t+1.2),s.type="bandpass",s.frequency.setValueAtTime(400,t),s.frequency.exponentialRampToValueAtTime(200,t+1),s.Q.value=3,o.gain.setValueAtTime(0,t),o.gain.linearRampToValueAtTime(.15,t+.1),o.gain.exponentialRampToValueAtTime(.01,t+1.2),a.connect(s),s.connect(o),o.connect(this.sfxGain),a.start(t),a.stop(t+1.2)}playAcidSplash(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.createNoise(.8),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();a.type="lowpass",a.frequency.setValueAtTime(1200,t),a.frequency.exponentialRampToValueAtTime(400,t+.3),i.gain.setValueAtTime(.4,t),i.gain.exponentialRampToValueAtTime(.01,t+.5),e.connect(a),a.connect(i),i.connect(this.sfxGain);const o=this.createNoise(2),s=this.ctx.createGain(),n=this.ctx.createBiquadFilter();n.type="highpass",n.frequency.value=3500,s.gain.setValueAtTime(0,t+.1),s.gain.linearRampToValueAtTime(.2,t+.2),s.gain.exponentialRampToValueAtTime(.01,t+2),o.connect(n),n.connect(s),s.connect(this.sfxGain);const l=this.ctx.createOscillator(),c=this.ctx.createGain();l.type="sine",l.frequency.setValueAtTime(80,t),l.frequency.exponentialRampToValueAtTime(40,t+.2),c.gain.setValueAtTime(.35,t),c.gain.exponentialRampToValueAtTime(.01,t+.3),l.connect(c),c.connect(this.sfxGain),l.start(t),l.stop(t+.3)}playAcidRainMark(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(200,t),e.frequency.exponentialRampToValueAtTime(600,t+1),a.type="bandpass",a.frequency.setValueAtTime(400,t),a.Q.value=5,i.gain.setValueAtTime(.1,t),i.gain.linearRampToValueAtTime(.25,t+.8),i.gain.exponentialRampToValueAtTime(.01,t+1.2),e.connect(a),a.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+1.2);for(let o=0;o<3;o++){const s=this.ctx.createOscillator(),n=this.ctx.createGain();s.type="square",s.frequency.value=800,n.gain.setValueAtTime(0,t+o*.3),n.gain.linearRampToValueAtTime(.1,t+o*.3+.05),n.gain.exponentialRampToValueAtTime(.01,t+o*.3+.15),s.connect(n),n.connect(this.sfxGain),s.start(t+o*.3),s.stop(t+o*.3+.2)}}playAcidRainStart(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.createNoise(3),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();a.type="bandpass",a.frequency.value=2e3,a.Q.value=1,i.gain.setValueAtTime(0,t),i.gain.linearRampToValueAtTime(.3,t+.2),i.gain.setValueAtTime(.25,t+2.5),i.gain.exponentialRampToValueAtTime(.01,t+3),e.connect(a),a.connect(i),i.connect(this.sfxGain);const o=this.createNoise(3),s=this.ctx.createGain(),n=this.ctx.createBiquadFilter();n.type="highpass",n.frequency.value=5e3,s.gain.setValueAtTime(0,t+.1),s.gain.linearRampToValueAtTime(.15,t+.3),s.gain.exponentialRampToValueAtTime(.01,t+3),o.connect(n),n.connect(s),s.connect(this.sfxGain);const l=this.ctx.createOscillator(),c=this.ctx.createGain();l.type="sine",l.frequency.value=50,c.gain.setValueAtTime(.2,t),c.gain.exponentialRampToValueAtTime(.01,t+2),l.connect(c),c.connect(this.sfxGain),l.start(t),l.stop(t+2)}playBossWarning(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(120,t),e.frequency.exponentialRampToValueAtTime(80,t+2),i.gain.setValueAtTime(.5,t),i.gain.exponentialRampToValueAtTime(.01,t+2.5),e.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+2.5);const a=this.ctx.createOscillator(),o=this.ctx.createGain();a.type="sine",a.frequency.setValueAtTime(180,t+.5),a.frequency.exponentialRampToValueAtTime(100,t+2.5),o.gain.setValueAtTime(.3,t+.5),o.gain.exponentialRampToValueAtTime(.01,t+3),a.connect(o),o.connect(this.sfxGain),o.connect(this.reverb),a.start(t+.5),a.stop(t+3);const s=this.createNoise(2),n=this.ctx.createGain(),l=this.ctx.createBiquadFilter();l.type="bandpass",l.frequency.value=800,l.Q.value=5,n.gain.setValueAtTime(0,t+1),n.gain.linearRampToValueAtTime(.1,t+1.5),n.gain.exponentialRampToValueAtTime(.01,t+2.5),s.connect(l),l.connect(n),n.connect(this.reverb)}arpInterval=null;currentMusicMode="normal";musicIntervals=[];isLowHpMode=!1;currentEra=1;rainGain=null;rainSource=null;isRainPlaying=!1;thunderInterval=null;setEra(t){let e=1;if(t>10?e=3:t>5&&(e=2),t>=15&&!this.isRainPlaying?this.startRain():t<15&&this.isRainPlaying&&this.stopRain(),e!==this.currentEra&&this.currentMusicMode==="normal"){this.currentEra=e;for(const i of this.musicIntervals)clearInterval(i),clearTimeout(i);this.musicIntervals=[],this.startSynthwaveMusic()}else this.currentEra=e}startRain(){if(!this.ctx||!this.masterGain||this.isRainPlaying)return;this.isRainPlaying=!0,this.rainGain=this.ctx.createGain(),this.rainGain.gain.value=0,this.rainGain.connect(this.masterGain);const t=this.ctx.sampleRate,i=t*4,a=this.ctx.createBuffer(2,i,t);for(let n=0;n<2;n++){const l=a.getChannelData(n);for(let c=0;c<i;c++){let r=(Math.random()*2-1)*.3;Math.random()<.001&&(r+=(Math.random()*2-1)*.8),r+=Math.sin(c/t*2*Math.PI*.5)*.05,l[c]=r}}this.rainSource=this.ctx.createBufferSource(),this.rainSource.buffer=a,this.rainSource.loop=!0;const o=this.ctx.createBiquadFilter();o.type="lowpass",o.frequency.value=3e3,o.Q.value=.5;const s=this.ctx.createBiquadFilter();s.type="highpass",s.frequency.value=200,s.Q.value=.5,this.rainSource.connect(s),s.connect(o),o.connect(this.rainGain),this.rainSource.start(),this.rainGain.gain.linearRampToValueAtTime(.25,this.ctx.currentTime+2),this.startThunder()}startThunder(){if(!this.ctx||!this.masterGain)return;const t=()=>{if(!this.ctx||!this.masterGain||!this.isRainPlaying)return;const e=this.ctx.currentTime,i=this.ctx.createGain();i.gain.value=0,i.connect(this.masterGain);const a=this.ctx.createBuffer(1,this.ctx.sampleRate*3,this.ctx.sampleRate),o=a.getChannelData(0);for(let h=0;h<o.length;h++)o[h]=(Math.random()*2-1)*Math.exp(-h/(this.ctx.sampleRate*.8));const s=this.ctx.createBufferSource();s.buffer=a;const n=this.ctx.createBiquadFilter();n.type="lowpass",n.frequency.value=150+Math.random()*100,n.Q.value=1,s.connect(n),n.connect(i);const l=this.ctx.createOscillator();l.type="sawtooth",l.frequency.value=80+Math.random()*40;const c=this.ctx.createGain();c.gain.value=0;const r=this.ctx.createBiquadFilter();r.type="bandpass",r.frequency.value=2e3,r.Q.value=2,l.connect(r),r.connect(c),c.connect(i),i.gain.setValueAtTime(0,e),i.gain.linearRampToValueAtTime(.6,e+.1),i.gain.exponentialRampToValueAtTime(.01,e+2.5),c.gain.setValueAtTime(0,e),c.gain.linearRampToValueAtTime(.4,e+.02),c.gain.exponentialRampToValueAtTime(.01,e+.2),s.start(e),l.start(e),s.stop(e+3),l.stop(e+.3)};setTimeout(t,2e3+Math.random()*2e3),this.thunderInterval=setInterval(()=>{this.isRainPlaying&&t()},3e3+Math.random()*3e3)}stopRain(){!this.ctx||!this.isRainPlaying||(this.isRainPlaying=!1,this.thunderInterval&&(clearInterval(this.thunderInterval),this.thunderInterval=null),this.rainGain&&this.rainGain.gain.linearRampToValueAtTime(0,this.ctx.currentTime+1),setTimeout(()=>{if(this.rainSource){try{this.rainSource.stop()}catch{}this.rainSource=null}this.rainGain=null},1100))}startSynthwaveMusic(){if(!(!this.ctx||!this.musicGain))switch(this.currentEra){case 1:this.playEra1Music();break;case 2:this.playEra2Music();break;case 3:this.playEra3Music();break}}playEra1Music(){if(!this.ctx||!this.musicGain)return;const t=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==1)return;const n=this.ctx.currentTime,l=this.ctx.createOscillator(),c=this.ctx.createOscillator(),r=this.ctx.createOscillator(),h=this.ctx.createGain(),p=this.ctx.createBiquadFilter(),u=this.ctx.createGain();l.type="sine",l.frequency.value=82.4,c.type="triangle",c.frequency.value=82.6,r.type="sine",r.frequency.value=.05,h.gain.value=3,r.connect(h),h.connect(l.frequency),p.type="lowpass",p.frequency.value=400,p.Q.value=.5,u.gain.setValueAtTime(0,n),u.gain.linearRampToValueAtTime(.08,n+3),u.gain.linearRampToValueAtTime(.06,n+6),u.gain.linearRampToValueAtTime(0,n+9),l.connect(p),c.connect(p),p.connect(u),u.connect(this.musicGain),l.start(n),c.start(n),r.start(n),l.stop(n+10),c.stop(n+10),r.stop(n+10)};t(),this.musicIntervals.push(setInterval(t,8e3));const e=[[164.8,196,246.9],[146.8,185,220],[130.8,164.8,196],[146.8,174.6,220]];let i=0;const a=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==1)return;const n=this.ctx.currentTime,l=e[i],c=this.ctx.createBiquadFilter(),r=this.ctx.createGain();c.type="lowpass",c.frequency.value=600,c.Q.value=.7,r.gain.setValueAtTime(0,n),r.gain.linearRampToValueAtTime(.04,n+2),r.gain.linearRampToValueAtTime(.03,n+4),r.gain.linearRampToValueAtTime(0,n+6),l.forEach((h,p)=>{const u=this.ctx.createOscillator();u.type="sine",u.frequency.value=h,p>0&&(u.detune.value=(Math.random()-.5)*5),u.connect(c),u.start(n),u.stop(n+7)}),c.connect(r),r.connect(this.musicGain),i=(i+1)%e.length};setTimeout(()=>a(),2e3),this.musicIntervals.push(setInterval(a,5e3));const o=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==1)return;const n=this.ctx.currentTime,l=this.ctx.createOscillator(),c=this.ctx.createGain(),r=[659,784,988,1175,1319];l.type="sine",l.frequency.value=r[Math.floor(Math.random()*r.length)],c.gain.setValueAtTime(0,n),c.gain.linearRampToValueAtTime(.015,n+.5),c.gain.linearRampToValueAtTime(0,n+3),l.connect(c),c.connect(this.musicGain),l.start(n),l.stop(n+3.5)},s=()=>{if(this.currentMusicMode!=="normal"||this.currentEra!==1)return;o();const n=3e3+Math.random()*5e3;this.musicIntervals.push(setTimeout(s,n))};setTimeout(s,4e3)}playEra2Music(){if(!this.ctx||!this.musicGain)return;const t=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==2)return;const s=this.ctx.currentTime,n=this.ctx.createOscillator(),l=this.ctx.createOscillator(),c=this.ctx.createOscillator(),r=this.ctx.createGain(),h=this.ctx.createGain(),p=this.ctx.createBiquadFilter();n.type="sawtooth",n.frequency.value=41,l.type="triangle",l.frequency.value=41.2,c.type="sine",c.frequency.value=.1,r.gain.value=20,c.connect(r),r.connect(n.frequency),p.type="lowpass",p.frequency.value=150,h.gain.setValueAtTime(.12,s),h.gain.linearRampToValueAtTime(.08,s+3),h.gain.exponentialRampToValueAtTime(.01,s+4),n.connect(p),l.connect(p),p.connect(h),h.connect(this.musicGain),c.start(s),n.start(s),l.start(s),c.stop(s+4),n.stop(s+4),l.stop(s+4)};t(),this.musicIntervals.push(setInterval(t,4e3));let e=0;const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==2)return;const s=this.ctx.currentTime;if(e%2===0){const n=this.ctx.createOscillator(),l=this.ctx.createGain();n.type="sine",n.frequency.setValueAtTime(80,s),n.frequency.exponentialRampToValueAtTime(20,s+.3),l.gain.setValueAtTime(.3,s),l.gain.exponentialRampToValueAtTime(.01,s+.4),n.connect(l),l.connect(this.musicGain),n.start(s),n.stop(s+.4)}e++};this.musicIntervals.push(setInterval(i,600));const a=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==2)return;const s=this.ctx.currentTime,n=600+Math.random()*400,l=this.ctx.createOscillator(),c=this.ctx.createGain();l.type="sine",l.frequency.setValueAtTime(n,s),l.frequency.linearRampToValueAtTime(n*.7,s+2),c.gain.setValueAtTime(0,s),c.gain.linearRampToValueAtTime(.04,s+.5),c.gain.linearRampToValueAtTime(0,s+2),l.connect(c),c.connect(this.musicGain),l.start(s),l.stop(s+2)};this.musicIntervals.push(setInterval(a,3e3+Math.random()*2e3));const o=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==2)return;const s=this.ctx.currentTime,n=this.ctx.sampleRate*.5,l=this.ctx.createBuffer(1,n,this.ctx.sampleRate),c=l.getChannelData(0);for(let u=0;u<n;u++)c[u]=(Math.random()*2-1)*Math.exp(-u/(n*.5));const r=this.ctx.createBufferSource();r.buffer=l;const h=this.ctx.createBiquadFilter();h.type="lowpass",h.frequency.value=200;const p=this.ctx.createGain();p.gain.setValueAtTime(.08,s),p.gain.exponentialRampToValueAtTime(.01,s+.5),r.connect(h),h.connect(p),p.connect(this.musicGain),r.start(s),r.stop(s+.5)};this.musicIntervals.push(setInterval(o,1500))}playEra3Music(){if(!this.ctx||!this.musicGain)return;const t=[110,110,146.8,110,130.8,110,164.8,146.8];let e=0;const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==3)return;const r=this.ctx.currentTime,h=this.ctx.createOscillator(),p=this.ctx.createBiquadFilter(),u=this.ctx.createGain();h.type="sawtooth",h.frequency.value=t[e],p.type="lowpass",p.frequency.setValueAtTime(400,r),p.frequency.exponentialRampToValueAtTime(150,r+.15),u.gain.setValueAtTime(.12,r),u.gain.exponentialRampToValueAtTime(.01,r+.2),h.connect(p),p.connect(u),u.connect(this.musicGain),h.start(r),h.stop(r+.22),e=(e+1)%t.length};this.musicIntervals.push(setInterval(i,200));const a=[880,1046,1318,1760,1318,1046,880,659];let o=0;const s=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==3)return;const r=this.ctx.currentTime,h=this.ctx.createOscillator(),p=this.ctx.createGain(),u=this.ctx.createDelay(),f=this.ctx.createGain();h.type="triangle",h.frequency.value=a[o],u.delayTime.value=.15,f.gain.value=.3,p.gain.setValueAtTime(.05,r),p.gain.exponentialRampToValueAtTime(.01,r+.1),h.connect(p),h.connect(u),u.connect(f),f.connect(this.musicGain),p.connect(this.musicGain),h.start(r),h.stop(r+.12),o=(o+1)%a.length};this.musicIntervals.push(setInterval(s,100));const n=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==3)return;const r=this.ctx.currentTime,h=this.ctx.createOscillator(),p=this.ctx.createGain();h.type="sine",h.frequency.setValueAtTime(200,r),h.frequency.exponentialRampToValueAtTime(50,r+.08),p.gain.setValueAtTime(.2,r),p.gain.exponentialRampToValueAtTime(.01,r+.12),h.connect(p),p.connect(this.musicGain),h.start(r),h.stop(r+.12)};this.musicIntervals.push(setInterval(n,400));const l=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==3)return;const r=this.ctx.currentTime,h=[220,277,330,440];for(const p of h){const u=this.ctx.createOscillator(),f=this.ctx.createGain();u.type="sine",u.frequency.value=p,f.gain.setValueAtTime(0,r),f.gain.linearRampToValueAtTime(.03,r+.5),f.gain.linearRampToValueAtTime(.02,r+2),f.gain.linearRampToValueAtTime(0,r+3),u.connect(f),f.connect(this.musicGain),u.start(r),u.stop(r+3.5)}};l(),this.musicIntervals.push(setInterval(l,4e3));const c=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==3)return;const r=this.ctx.currentTime,h=this.ctx.createOscillator(),p=this.ctx.createGain();h.type="sawtooth",h.frequency.setValueAtTime(1500+Math.random()*1e3,r),h.frequency.exponentialRampToValueAtTime(100,r+.1),p.gain.setValueAtTime(.06,r),p.gain.exponentialRampToValueAtTime(.001,r+.1),h.connect(p),p.connect(this.musicGain),h.start(r),h.stop(r+.1)};this.musicIntervals.push(setInterval(c,800+Math.random()*600))}setLowHpMode(t){if(!(!this.ctx||!this.musicGain)&&!(this.currentMusicMode!=="normal"&&this.currentMusicMode!=="low_hp")){if(t&&!this.isLowHpMode){this.isLowHpMode=!0,this.currentMusicMode="low_hp";for(const e of this.musicIntervals)clearInterval(e),clearTimeout(e);this.musicIntervals=[],this.playLowHpMusic()}else if(!t&&this.isLowHpMode){this.isLowHpMode=!1,this.currentMusicMode="normal";for(const e of this.musicIntervals)clearInterval(e),clearTimeout(e);this.musicIntervals=[],this.startSynthwaveMusic()}}}playLowHpMusic(){if(!this.ctx||!this.musicGain)return;const t=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="low_hp")return;const s=this.ctx.currentTime;for(let n=0;n<2;n++){const l=this.ctx.createOscillator(),c=this.ctx.createGain();l.type="sine",l.frequency.value=40;const r=n*.15;c.gain.setValueAtTime(0,s+r),c.gain.linearRampToValueAtTime(.3,s+r+.05),c.gain.exponentialRampToValueAtTime(.01,s+r+.2),l.connect(c),c.connect(this.musicGain),l.start(s+r),l.stop(s+r+.25)}};this.musicIntervals.push(setInterval(t,800));const e=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="low_hp")return;const s=this.ctx.currentTime,n=this.ctx.createOscillator(),l=this.ctx.createOscillator(),c=this.ctx.createGain(),r=this.ctx.createBiquadFilter();n.type="sawtooth",n.frequency.value=55,l.type="sawtooth",l.frequency.value=55.5,r.type="lowpass",r.frequency.value=200,r.Q.value=5,c.gain.setValueAtTime(.1,s),c.gain.linearRampToValueAtTime(.15,s+1),c.gain.linearRampToValueAtTime(.05,s+2),n.connect(r),l.connect(r),r.connect(c),c.connect(this.musicGain),n.start(s),n.stop(s+2.5),l.start(s),l.stop(s+2.5)};e(),this.musicIntervals.push(setInterval(e,2500));const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="low_hp")return;const s=this.ctx.currentTime,n=1+Math.floor(Math.random()*3);for(let l=0;l<n;l++){const c=Math.floor(this.ctx.sampleRate*(.02+Math.random()*.03)),r=this.ctx.createBuffer(1,c,this.ctx.sampleRate),h=r.getChannelData(0);for(let m=0;m<c;m++)h[m]=(Math.random()*2-1)*Math.exp(-m/(c*.3));const p=this.ctx.createBufferSource();p.buffer=r;const u=this.ctx.createBiquadFilter();u.type="highpass",u.frequency.value=3e3+Math.random()*5e3;const f=this.ctx.createGain();f.gain.setValueAtTime(.05+Math.random()*.05,s+l*.05),f.gain.exponentialRampToValueAtTime(.001,s+l*.05+.05),p.connect(u),u.connect(f),f.connect(this.musicGain),p.start(s+l*.05),p.stop(s+l*.05+.05)}};this.musicIntervals.push(setInterval(i,500+Math.random()*500));const a=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="low_hp")return;const s=this.ctx.currentTime,n=this.ctx.createOscillator(),l=this.ctx.createGain();n.type="square";const c=[220,233.1],r=c[Math.floor(Math.random()*c.length)];n.frequency.value=r,l.gain.setValueAtTime(0,s),l.gain.linearRampToValueAtTime(.08,s+.1),l.gain.linearRampToValueAtTime(.06,s+.3),l.gain.exponentialRampToValueAtTime(.01,s+.5),n.connect(l),l.connect(this.musicGain),n.start(s),n.stop(s+.5)};this.musicIntervals.push(setInterval(a,1500+Math.random()*1e3));const o=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="low_hp")return;const s=this.ctx.currentTime,n=this.ctx.sampleRate*.1,l=this.ctx.createBuffer(1,n,this.ctx.sampleRate),c=l.getChannelData(0);for(let u=0;u<n;u++)c[u]=Math.random()>.7?(Math.random()*2-1)*.5:0;const r=this.ctx.createBufferSource();r.buffer=l;const h=this.ctx.createBiquadFilter();h.type="bandpass",h.frequency.value=2e3,h.Q.value=3;const p=this.ctx.createGain();p.gain.setValueAtTime(.03,s),p.gain.exponentialRampToValueAtTime(.001,s+.1),r.connect(h),h.connect(p),p.connect(this.musicGain),r.start(s),r.stop(s+.1)};this.musicIntervals.push(setInterval(o,300+Math.random()*400))}bossGreenPhase=1;setBossMusic(t){if(!(!this.ctx||!this.musicGain)){for(const e of this.musicIntervals)clearInterval(e),clearTimeout(e);if(this.musicIntervals=[],this.bossGreenPhase=1,t===null)this.currentMusicMode="normal",this.startSynthwaveMusic();else switch(this.currentMusicMode=t,t){case"boss_green":this.playBossGreenMusic();break;case"boss_black":this.playBossBlackMusic();break;case"boss_blue":this.playBossBlueMusic();break}}}setBossGreenPhase2(){if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green"||this.bossGreenPhase===2)return;this.bossGreenPhase=2;const t=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green")return;const a=this.ctx.currentTime,o=this.ctx.createOscillator(),s=this.ctx.createOscillator(),n=this.ctx.createGain(),l=this.ctx.createWaveShaper();o.type="sine",o.frequency.setValueAtTime(200,a),o.frequency.exponentialRampToValueAtTime(30,a+.15),s.type="sine",s.frequency.setValueAtTime(100,a),s.frequency.exponentialRampToValueAtTime(20,a+.2);const c=new Float32Array(256);for(let r=0;r<256;r++){const h=r/128-1;c[r]=Math.tanh(h*5)}l.curve=c,n.gain.setValueAtTime(.8,a),n.gain.exponentialRampToValueAtTime(.01,a+.25),o.connect(l),s.connect(l),l.connect(n),n.connect(this.musicGain),o.start(a),o.stop(a+.25),s.start(a),s.stop(a+.25)};this.musicIntervals.push(setInterval(t,187));const e=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green")return;const a=this.ctx.currentTime,o=this.ctx.createOscillator(),s=this.ctx.createOscillator(),n=this.ctx.createBiquadFilter(),l=this.ctx.createGain();o.type="sawtooth",s.type="square";const c=[110,110,146.8,110],r=c[Math.floor(Math.random()*c.length)];o.frequency.value=r,s.frequency.value=r*1.5,n.type="lowpass",n.Q.value=25,n.frequency.setValueAtTime(300,a),n.frequency.exponentialRampToValueAtTime(2e3,a+.05),n.frequency.exponentialRampToValueAtTime(150,a+.15),l.gain.setValueAtTime(.4,a),l.gain.exponentialRampToValueAtTime(.01,a+.15),o.connect(n),s.connect(n),n.connect(l),l.connect(this.musicGain),o.start(a),s.start(a),o.stop(a+.2),s.stop(a+.2)};this.musicIntervals.push(setInterval(e,93));const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green")return;const a=this.ctx.currentTime,o=this.ctx.createOscillator(),s=this.ctx.createGain();o.type="square",o.frequency.setValueAtTime(500,a),o.frequency.linearRampToValueAtTime(900,a+.15),o.frequency.linearRampToValueAtTime(500,a+.3),s.gain.setValueAtTime(.12,a),s.gain.linearRampToValueAtTime(.18,a+.15),s.gain.linearRampToValueAtTime(0,a+.3),o.connect(s),s.connect(this.musicGain),o.start(a),o.stop(a+.35)};this.musicIntervals.push(setInterval(i,1500))}vortexGain=null;vortexOsc=null;vortexNoise=null;isStormMode=!1;stormGain=null;playVortexSound(t){if(!(!this.ctx||!this.masterGain))if(t){this.vortexGain=this.ctx.createGain(),this.vortexGain.gain.value=0,this.vortexGain.connect(this.masterGain),this.vortexOsc=this.ctx.createOscillator(),this.vortexOsc.type="sawtooth",this.vortexOsc.frequency.value=60;const e=this.ctx.createGain();e.gain.value=.15;const i=this.ctx.createOscillator();i.type="sine",i.frequency.value=3;const a=this.ctx.createGain();a.gain.value=30,i.connect(a),a.connect(this.vortexOsc.frequency);const o=this.ctx.createBiquadFilter();o.type="lowpass",o.frequency.value=200,o.Q.value=5,this.vortexOsc.connect(o),o.connect(e),e.connect(this.vortexGain);const s=this.ctx.createBuffer(1,this.ctx.sampleRate*4,this.ctx.sampleRate),n=s.getChannelData(0);for(let r=0;r<n.length;r++)n[r]=(Math.random()*2-1)*.5;this.vortexNoise=this.ctx.createBufferSource(),this.vortexNoise.buffer=s,this.vortexNoise.loop=!0;const l=this.ctx.createBiquadFilter();l.type="bandpass",l.frequency.value=400,l.Q.value=2;const c=this.ctx.createGain();c.gain.value=.3,this.vortexNoise.connect(l),l.connect(c),c.connect(this.vortexGain),this.vortexOsc.start(),i.start(),this.vortexNoise.start(),this.vortexGain.gain.linearRampToValueAtTime(.5,this.ctx.currentTime+.5),this.activateStormMode()}else this.vortexGain&&this.vortexGain.gain.linearRampToValueAtTime(0,this.ctx.currentTime+.5),this.deactivateStormMode(),setTimeout(()=>{if(this.vortexOsc){try{this.vortexOsc.stop()}catch{}this.vortexOsc=null}if(this.vortexNoise){try{this.vortexNoise.stop()}catch{}this.vortexNoise=null}this.vortexGain=null},600)}activateStormMode(){if(!this.ctx||!this.musicGain||this.isStormMode)return;this.isStormMode=!0,this.stormGain=this.ctx.createGain(),this.stormGain.gain.value=0,this.stormGain.connect(this.musicGain),this.stormGain.gain.linearRampToValueAtTime(1,this.ctx.currentTime+.5);const t=()=>{if(!this.ctx||!this.stormGain||!this.isStormMode)return;const o=this.ctx.currentTime,s=this.ctx.createOscillator(),n=this.ctx.createBiquadFilter(),l=this.ctx.createGain();s.type="sawtooth",s.frequency.setValueAtTime(100,o),s.frequency.exponentialRampToValueAtTime(800,o+2),n.type="lowpass",n.frequency.setValueAtTime(200,o),n.frequency.exponentialRampToValueAtTime(4e3,o+2),n.Q.value=8,l.gain.setValueAtTime(0,o),l.gain.linearRampToValueAtTime(.15,o+1),l.gain.linearRampToValueAtTime(0,o+2),s.connect(n),n.connect(l),l.connect(this.stormGain),s.start(o),s.stop(o+2.1)};this.musicIntervals.push(setInterval(t,2e3)),t();const e=()=>{if(!this.ctx||!this.stormGain||!this.isStormMode)return;const o=this.ctx.currentTime,s=this.ctx.createOscillator(),n=this.ctx.createGain();s.type="sine",s.frequency.setValueAtTime(80,o),s.frequency.exponentialRampToValueAtTime(25,o+.5),n.gain.setValueAtTime(.4,o),n.gain.exponentialRampToValueAtTime(.01,o+.6),s.connect(n),n.connect(this.stormGain),s.start(o),s.stop(o+.7)};this.musicIntervals.push(setInterval(e,500));const i=()=>{if(!this.ctx||!this.stormGain||!this.isStormMode)return;const o=this.ctx.currentTime,s=this.ctx.sampleRate*1,n=this.ctx.createBuffer(1,s,this.ctx.sampleRate),l=n.getChannelData(0);for(let p=0;p<s;p++)l[p]=Math.random()*2-1;const c=this.ctx.createBufferSource();c.buffer=n;const r=this.ctx.createBiquadFilter();r.type="bandpass",r.frequency.setValueAtTime(500,o),r.frequency.exponentialRampToValueAtTime(8e3,o+.5),r.frequency.exponentialRampToValueAtTime(500,o+1),r.Q.value=5;const h=this.ctx.createGain();h.gain.setValueAtTime(0,o),h.gain.linearRampToValueAtTime(.1,o+.25),h.gain.linearRampToValueAtTime(.1,o+.75),h.gain.linearRampToValueAtTime(0,o+1),c.connect(r),r.connect(h),h.connect(this.stormGain),c.start(o),c.stop(o+1.1)};this.musicIntervals.push(setInterval(i,1e3)),i();const a=()=>{if(!this.ctx||!this.stormGain||!this.isStormMode)return;const o=this.ctx.currentTime,s=this.ctx.sampleRate*.02,n=this.ctx.createBuffer(1,s,this.ctx.sampleRate),l=n.getChannelData(0);for(let p=0;p<s;p++)l[p]=Math.random()*2-1;const c=this.ctx.createBufferSource();c.buffer=n;const r=this.ctx.createBiquadFilter();r.type="highpass",r.frequency.value=1e4;const h=this.ctx.createGain();h.gain.setValueAtTime(.12,o),h.gain.exponentialRampToValueAtTime(.001,o+.02),c.connect(r),r.connect(h),h.connect(this.stormGain),c.start(o),c.stop(o+.03)};this.musicIntervals.push(setInterval(a,119))}deactivateStormMode(){this.isStormMode&&(this.isStormMode=!1,this.stormGain&&this.ctx&&this.stormGain.gain.linearRampToValueAtTime(0,this.ctx.currentTime+1),setTimeout(()=>{this.stormGain=null},1100))}playBossGreenMusic(){if(!this.ctx||!this.musicGain)return;const t=[55,55,110,55,82.4,110,73.4,55],e=[0,0,1,0,1,1,0,1];let i=0;const a=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green")return;const c=this.ctx.currentTime,r=this.ctx.createOscillator(),h=this.ctx.createOscillator(),p=this.ctx.createBiquadFilter(),u=this.ctx.createGain();r.type="sawtooth",h.type="square";const f=t[i];r.frequency.value=f,h.frequency.value=f*1.01,p.type="lowpass",p.Q.value=22;const m=e[i]===1,g=150+Math.random()*100,x=1200+Math.random()*800;p.frequency.setValueAtTime(g,c),p.frequency.exponentialRampToValueAtTime(x,c+.03),p.frequency.exponentialRampToValueAtTime(m?x*.7:200,c+.1);const y=i%4===0?.5:.3;u.gain.setValueAtTime(y,c),u.gain.exponentialRampToValueAtTime(.01,c+.12),r.connect(p),h.connect(p),p.connect(u),u.connect(this.musicGain),r.start(c),h.start(c),r.stop(c+.15),h.stop(c+.15),i=(i+1)%t.length};this.musicIntervals.push(setInterval(a,100));const o=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green")return;const c=this.ctx.currentTime,r=this.ctx.createOscillator(),h=this.ctx.createOscillator(),p=this.ctx.createGain(),u=this.ctx.createGain();r.type="sine",r.frequency.setValueAtTime(180,c),r.frequency.exponentialRampToValueAtTime(35,c+.08),h.type="triangle",h.frequency.value=1500,p.gain.setValueAtTime(.7,c),p.gain.exponentialRampToValueAtTime(.01,c+.25),u.gain.setValueAtTime(.2,c),u.gain.exponentialRampToValueAtTime(.001,c+.02),r.connect(p),h.connect(u),p.connect(this.musicGain),u.connect(this.musicGain),r.start(c),h.start(c),r.stop(c+.3),h.stop(c+.03)};this.musicIntervals.push(setInterval(o,400));let s=0;const n=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green")return;const c=this.ctx.currentTime,r=this.createNoise(.04),h=this.ctx.createBiquadFilter(),p=this.ctx.createGain();h.type="highpass",h.frequency.value=9e3;const u=s%2===1;p.gain.setValueAtTime(u?.18:.1,c),p.gain.exponentialRampToValueAtTime(.001,c+.04),r.connect(h),h.connect(p),p.connect(this.musicGain),s++};this.musicIntervals.push(setInterval(n,207));const l=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green")return;const c=this.ctx.currentTime,r=this.ctx.createOscillator(),h=this.ctx.createBiquadFilter(),p=this.ctx.createGain();r.type="sawtooth",r.frequency.setValueAtTime(200+Math.random()*100,c),r.frequency.exponentialRampToValueAtTime(800+Math.random()*400,c+.3),h.type="bandpass",h.frequency.setValueAtTime(500,c),h.frequency.exponentialRampToValueAtTime(3e3,c+.3),h.Q.value=10,p.gain.setValueAtTime(.1,c),p.gain.linearRampToValueAtTime(.15,c+.15),p.gain.exponentialRampToValueAtTime(.01,c+.4),r.connect(h),h.connect(p),p.connect(this.musicGain),r.start(c),r.stop(c+.4)};this.musicIntervals.push(setInterval(l,1656))}playBossBlackMusic(){if(!this.ctx||!this.musicGain)return;const t=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_black")return;const h=this.ctx.currentTime,p=this.ctx.createOscillator(),u=this.ctx.createOscillator(),f=this.ctx.createWaveShaper(),m=this.ctx.createGain();p.type="sine",p.frequency.setValueAtTime(200,h),p.frequency.exponentialRampToValueAtTime(50,h+.04),p.frequency.exponentialRampToValueAtTime(30,h+.15),u.type="sine",u.frequency.setValueAtTime(60,h),u.frequency.exponentialRampToValueAtTime(25,h+.25);const g=new Float32Array(256);for(let x=0;x<256;x++){const y=x/128-1;g[x]=Math.tanh(y*8)}f.curve=g,m.gain.setValueAtTime(.9,h),m.gain.exponentialRampToValueAtTime(.01,h+.3),p.connect(f),u.connect(m),f.connect(m),m.connect(this.musicGain),p.start(h),p.stop(h+.3),u.start(h),u.stop(h+.35)};this.musicIntervals.push(setInterval(t,461));const e=[36.7,36.7,32.7,36.7,41.2,36.7,32.7,29.1];let i=0;const a=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_black")return;const h=this.ctx.currentTime,p=e[i],u=this.ctx.createOscillator(),f=this.ctx.createBiquadFilter(),m=this.ctx.createGain();u.type="sawtooth",u.frequency.value=p,f.type="lowpass",f.frequency.setValueAtTime(400,h),f.frequency.exponentialRampToValueAtTime(80,h+.3),f.Q.value=10,m.gain.setValueAtTime(.35,h),m.gain.exponentialRampToValueAtTime(.01,h+.4),u.connect(f),f.connect(m),m.connect(this.musicGain),u.start(h),u.stop(h+.45);for(let g=1;g<=3;g++){const x=this.ctx.createOscillator(),y=this.ctx.createBiquadFilter(),b=this.ctx.createGain(),k=h+g*.15,A=.15/g;x.type="sine",x.frequency.value=p,y.type="lowpass",y.frequency.value=200-g*40,b.gain.setValueAtTime(A,k),b.gain.exponentialRampToValueAtTime(.001,k+.25),x.connect(y),y.connect(b),b.connect(this.musicGain),x.start(k),x.stop(k+.3)}i=(i+1)%e.length};this.musicIntervals.push(setInterval(a,461));const o=[{type:"kick",vol:1},{type:"none",vol:0},{type:"hat",vol:.6},{type:"none",vol:0},{type:"snare",vol:1},{type:"none",vol:0},{type:"hat",vol:.5},{type:"kick",vol:.8},{type:"none",vol:0},{type:"none",vol:0},{type:"hat",vol:.7},{type:"none",vol:0},{type:"snare",vol:1},{type:"none",vol:0},{type:"hat",vol:.5},{type:"kick",vol:.7}];let s=0;const n=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_black")return;const h=this.ctx.currentTime,p=o[s];if(p.type==="kick"){const u=this.ctx.createOscillator(),f=this.ctx.createGain();u.type="sine",u.frequency.setValueAtTime(180,h),u.frequency.exponentialRampToValueAtTime(60,h+.03),u.frequency.exponentialRampToValueAtTime(40,h+.08),f.gain.setValueAtTime(.5*p.vol,h),f.gain.exponentialRampToValueAtTime(.01,h+.12),u.connect(f),f.connect(this.musicGain),u.start(h),u.stop(h+.15)}else if(p.type==="snare"){const u=this.ctx.createOscillator(),f=this.ctx.createGain();u.type="triangle",u.frequency.setValueAtTime(250,h),u.frequency.exponentialRampToValueAtTime(150,h+.02),f.gain.setValueAtTime(.2*p.vol,h),f.gain.exponentialRampToValueAtTime(.01,h+.08),u.connect(f),f.connect(this.musicGain),u.start(h),u.stop(h+.1);const m=this.ctx.sampleRate*.1,g=this.ctx.createBuffer(1,m,this.ctx.sampleRate),x=g.getChannelData(0);for(let A=0;A<m;A++)x[A]=(Math.random()*2-1)*Math.exp(-A/(this.ctx.sampleRate*.025));const y=this.ctx.createBufferSource();y.buffer=g;const b=this.ctx.createBiquadFilter();b.type="bandpass",b.frequency.value=3e3,b.Q.value=1;const k=this.ctx.createGain();k.gain.setValueAtTime(.35*p.vol,h),k.gain.exponentialRampToValueAtTime(.01,h+.1),y.connect(b),b.connect(k),k.connect(this.musicGain),y.start(h),y.stop(h+.12)}else if(p.type==="hat"){const u=this.ctx.sampleRate*.04,f=this.ctx.createBuffer(1,u,this.ctx.sampleRate),m=f.getChannelData(0);for(let b=0;b<u;b++)m[b]=Math.random()*2-1;const g=this.ctx.createBufferSource();g.buffer=f;const x=this.ctx.createBiquadFilter();x.type="highpass",x.frequency.value=7e3;const y=this.ctx.createGain();y.gain.setValueAtTime(.15*p.vol,h),y.gain.exponentialRampToValueAtTime(.001,h+.035),g.connect(x),x.connect(y),y.connect(this.musicGain),g.start(h),g.stop(h+.045)}s=(s+1)%o.length};this.musicIntervals.push(setInterval(n,115));const l=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_black")return;const h=this.ctx.currentTime,p=[146.8,174.6,220];for(const u of p){const f=this.ctx.createOscillator(),m=this.ctx.createBiquadFilter(),g=this.ctx.createGain();f.type="sawtooth",f.frequency.value=u,m.type="lowpass",m.frequency.setValueAtTime(2e3,h),m.frequency.exponentialRampToValueAtTime(300,h+.2),m.Q.value=5,g.gain.setValueAtTime(.08,h),g.gain.exponentialRampToValueAtTime(.001,h+.25),f.connect(m),m.connect(g),g.connect(this.musicGain),f.start(h),f.stop(h+.3);for(let x=1;x<=5;x++){const y=this.ctx.createOscillator(),b=this.ctx.createBiquadFilter(),k=this.ctx.createGain(),A=h+x*.18;y.type="sine",y.frequency.value=u,b.type="lowpass",b.frequency.value=800-x*120,k.gain.setValueAtTime(.04/x,A),k.gain.exponentialRampToValueAtTime(.001,A+.2),y.connect(b),b.connect(k),k.connect(this.musicGain),y.start(A),y.stop(A+.25)}}};this.musicIntervals.push(setInterval(l,1844));const c=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_black")return;const h=this.ctx.currentTime,p=this.ctx.createOscillator(),u=this.ctx.createOscillator(),f=this.ctx.createGain(),m=this.ctx.createGain();p.type="sine",p.frequency.value=36.7,u.type="sine",u.frequency.value=.2,f.gain.value=3,u.connect(f),f.connect(p.frequency),m.gain.setValueAtTime(0,h),m.gain.linearRampToValueAtTime(.25,h+1),m.gain.linearRampToValueAtTime(.2,h+3),m.gain.linearRampToValueAtTime(0,h+4),p.connect(m),m.connect(this.musicGain),u.start(h),p.start(h),u.stop(h+4.5),p.stop(h+4.5)};c(),this.musicIntervals.push(setInterval(c,3688));const r=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_black"||Math.random()>.5)return;const h=this.ctx.currentTime,p=this.ctx.createOscillator(),u=this.ctx.createBiquadFilter(),f=this.ctx.createGain();p.type="sawtooth",Math.random()>.5?(p.frequency.setValueAtTime(100,h),p.frequency.exponentialRampToValueAtTime(800,h+1)):(p.frequency.setValueAtTime(600,h),p.frequency.exponentialRampToValueAtTime(50,h+1.5)),u.type="lowpass",u.frequency.setValueAtTime(3e3,h),u.frequency.exponentialRampToValueAtTime(200,h+1.5),u.Q.value=8,f.gain.setValueAtTime(.1,h),f.gain.exponentialRampToValueAtTime(.001,h+1.5),p.connect(u),u.connect(f),f.connect(this.musicGain),p.start(h),p.stop(h+1.6)};this.musicIntervals.push(setInterval(r,3688))}playVortexRiser(){if(!this.ctx||!this.musicGain)return;const t=this.ctx.currentTime,e=2,i=this.ctx.sampleRate*e,a=this.ctx.createBuffer(1,i,this.ctx.sampleRate),o=a.getChannelData(0);for(let u=0;u<i;u++)o[u]=Math.random()*2-1;const s=this.ctx.createBufferSource();s.buffer=a;const n=this.ctx.createBiquadFilter();n.type="bandpass",n.frequency.setValueAtTime(200,t),n.frequency.exponentialRampToValueAtTime(8e3,t+e),n.Q.value=5;const l=this.ctx.createGain();l.gain.setValueAtTime(0,t),l.gain.linearRampToValueAtTime(.3,t+e*.8),l.gain.linearRampToValueAtTime(.5,t+e),s.connect(n),n.connect(l),l.connect(this.musicGain),s.start(t),s.stop(t+e+.1);const c=this.ctx.createOscillator(),r=this.ctx.createBiquadFilter(),h=this.ctx.createGain();c.type="sawtooth",c.frequency.setValueAtTime(50,t),c.frequency.exponentialRampToValueAtTime(400,t+e),r.type="lowpass",r.frequency.setValueAtTime(100,t),r.frequency.exponentialRampToValueAtTime(2e3,t+e),r.Q.value=8,h.gain.setValueAtTime(0,t),h.gain.linearRampToValueAtTime(.25,t+e),c.connect(r),r.connect(h),h.connect(this.musicGain),c.start(t),c.stop(t+e+.1);const p=(u,f)=>{if(!this.ctx||!this.musicGain)return;const m=this.ctx.createOscillator(),g=this.ctx.createGain();m.type="sine",m.frequency.setValueAtTime(100,u),m.frequency.exponentialRampToValueAtTime(30,u+.1),g.gain.setValueAtTime(f,u),g.gain.exponentialRampToValueAtTime(.001,u+.15),m.connect(g),g.connect(this.musicGain),m.start(u),m.stop(u+.2)};p(t+.5,.15),p(t+1,.2),p(t+1.3,.25),p(t+1.5,.3),p(t+1.65,.35),p(t+1.8,.4),p(t+1.9,.45)}playBossBlueMusic(){if(!this.ctx||!this.musicGain)return;const t=[110,110,146.8,164.8,110,130.8,146.8,110];let e=0;const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_blue")return;const c=this.ctx.currentTime,r=this.ctx.createOscillator(),h=this.ctx.createGain(),p=this.ctx.createBiquadFilter();r.type="square",r.frequency.value=t[e],p.type="lowpass",p.frequency.setValueAtTime(800,c),p.frequency.exponentialRampToValueAtTime(200,c+.2),h.gain.setValueAtTime(.15,c),h.gain.linearRampToValueAtTime(0,c+.2),r.connect(p),p.connect(h),h.connect(this.musicGain),r.start(c),r.stop(c+.25),e=(e+1)%t.length};this.musicIntervals.push(setInterval(i,250));const a=[880,1046,1318,1567,1318,1046];let o=0;const s=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_blue")return;const c=this.ctx.currentTime,r=this.ctx.createOscillator(),h=this.ctx.createGain();r.type="triangle",r.frequency.value=a[o],h.gain.setValueAtTime(.08,c),h.gain.exponentialRampToValueAtTime(.001,c+.1),r.connect(h),h.connect(this.musicGain),r.start(c),r.stop(c+.12),o=(o+1)%a.length};this.musicIntervals.push(setInterval(s,125));const n=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_blue")return;const c=this.ctx.currentTime,r=this.ctx.createOscillator(),h=this.ctx.createGain();r.type="sawtooth",r.frequency.setValueAtTime(2e3,c),r.frequency.exponentialRampToValueAtTime(100,c+.15),h.gain.setValueAtTime(.1,c),h.gain.exponentialRampToValueAtTime(.001,c+.15),r.connect(h),h.connect(this.musicGain),r.start(c),r.stop(c+.15)};this.musicIntervals.push(setInterval(n,500+Math.random()*300));const l=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_blue")return;const c=this.ctx.currentTime,r=this.ctx.createOscillator(),h=this.ctx.createGain();r.type="sine",r.frequency.setValueAtTime(150,c),r.frequency.exponentialRampToValueAtTime(50,c+.1),h.gain.setValueAtTime(.2,c),h.gain.exponentialRampToValueAtTime(.001,c+.15),r.connect(h),h.connect(this.musicGain),r.start(c),r.stop(c+.15)};this.musicIntervals.push(setInterval(l,500))}playBassline(){if(!this.ctx||!this.musicGain)return;const t=[55,55,73.4,82.4];let e=0;const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal")return;const a=this.ctx.currentTime,o=this.ctx.createOscillator(),s=this.ctx.createOscillator(),n=this.ctx.createGain(),l=this.ctx.createBiquadFilter();o.type="sawtooth",o.frequency.value=t[e],s.type="square",s.frequency.value=t[e]*1.005,l.type="lowpass",l.frequency.setValueAtTime(300,a),l.frequency.linearRampToValueAtTime(150,a+.8),n.gain.setValueAtTime(.2,a),n.gain.linearRampToValueAtTime(.15,a+.1),n.gain.linearRampToValueAtTime(0,a+.9),o.connect(l),s.connect(l),l.connect(n),n.connect(this.musicGain),o.start(a),o.stop(a+1),s.start(a),s.stop(a+1),e=(e+1)%t.length,setTimeout(i,1e3)};i()}playArpeggio(){if(!this.ctx||!this.musicGain)return;const t=[440,523,587,659,784,659,587,523];let e=0;const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal")return;const a=this.ctx.currentTime,o=this.ctx.createOscillator(),s=this.ctx.createGain(),n=this.ctx.createBiquadFilter(),l=this.ctx.createDelay(),c=this.ctx.createGain();o.type="square",o.frequency.value=t[e],n.type="lowpass",n.frequency.setValueAtTime(2e3,a),n.frequency.exponentialRampToValueAtTime(500,a+.15),n.Q.value=5,s.gain.setValueAtTime(.08,a),s.gain.exponentialRampToValueAtTime(.01,a+.12),l.delayTime.value=.25,c.gain.value=.3,o.connect(n),n.connect(s),s.connect(this.musicGain),s.connect(l),l.connect(c),c.connect(this.musicGain),c.connect(this.reverb),o.start(a),o.stop(a+.15),e=(e+1)%t.length,setTimeout(i,125)};setTimeout(i,2e3)}playPad(){if(!this.ctx||!this.musicGain)return;const t=[[220,261.6,329.6],[196,246.9,293.7],[174.6,220,261.6],[164.8,196,246.9]];let e=0;const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal")return;const a=this.ctx.currentTime;t[e].forEach((s,n)=>{const l=this.ctx.createOscillator(),c=this.ctx.createOscillator(),r=this.ctx.createGain(),h=this.ctx.createBiquadFilter();l.type="sawtooth",l.frequency.value=s,c.type="triangle",c.frequency.value=s*1.002,h.type="lowpass",h.frequency.value=800,h.Q.value=1,r.gain.setValueAtTime(0,a),r.gain.linearRampToValueAtTime(.03,a+1),r.gain.linearRampToValueAtTime(.03,a+3),r.gain.linearRampToValueAtTime(0,a+4),l.connect(h),c.connect(h),h.connect(r),r.connect(this.musicGain),r.connect(this.reverb),l.start(a+n*.1),l.stop(a+4.5),c.start(a+n*.1),c.stop(a+4.5)}),e=(e+1)%t.length,setTimeout(i,4e3)};setTimeout(i,500)}playDrums(){if(!this.ctx||!this.musicGain)return;let t=0;const e=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal")return;const i=this.ctx.currentTime;if(t%4===0||t%4===2){const n=this.ctx.createOscillator(),l=this.ctx.createGain();n.type="sine",n.frequency.setValueAtTime(150,i),n.frequency.exponentialRampToValueAtTime(40,i+.1),l.gain.setValueAtTime(.3,i),l.gain.exponentialRampToValueAtTime(.01,i+.15),n.connect(l),l.connect(this.musicGain),n.start(i),n.stop(i+.2)}if(t%4===1||t%4===3){const n=this.createNoise(.15),l=this.ctx.createGain(),c=this.ctx.createBiquadFilter();c.type="highpass",c.frequency.value=1e3,l.gain.setValueAtTime(.15,i),l.gain.exponentialRampToValueAtTime(.01,i+.1),n.connect(c),c.connect(l),l.connect(this.musicGain);const r=this.ctx.createOscillator(),h=this.ctx.createGain();r.type="triangle",r.frequency.value=180,h.gain.setValueAtTime(.1,i),h.gain.exponentialRampToValueAtTime(.01,i+.08),r.connect(h),h.connect(this.musicGain),r.start(i),r.stop(i+.1)}const a=this.createNoise(.03),o=this.ctx.createGain(),s=this.ctx.createBiquadFilter();s.type="highpass",s.frequency.value=8e3,o.gain.setValueAtTime(t%2===0?.08:.04,i),o.gain.exponentialRampToValueAtTime(.01,i+.03),a.connect(s),s.connect(o),o.connect(this.musicGain),t=(t+1)%16,setTimeout(e,250)};setTimeout(e,1e3)}stop(){this.arpInterval&&clearInterval(this.arpInterval),this.ctx&&(this.ctx.close(),this.ctx=null),this.isStarted=!1}}const gt=`#version 300 es
precision highp float;

in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`,vt=`#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_cameraPos;
uniform int u_turboMode;  // Турбо режим - минимум геометрии
uniform float u_cameraYaw;
uniform float u_cameraPitch;
uniform vec4 u_targets[16];
uniform int u_targetCount;
uniform float u_muzzleFlash;
uniform vec4 u_pools[8]; // Токсичные лужи [x, z, radius, lifetime]
uniform int u_poolCount;
uniform vec4 u_acidProjectiles[4]; // Летящие снаряды кислоты [x, y, z, progress]
uniform int u_acidProjectileCount;
uniform vec4 u_spikes[8]; // Лазеры спайкеров [startX, startY, startZ, lifetime]
uniform vec4 u_spikeTargets[8]; // Конечные точки лазеров [endX, endY, endZ, intensity]
uniform int u_spikeCount;
uniform vec4 u_acidRainZones[4]; // Зоны кислотного дождя [x, z, radius, state]
uniform int u_acidRainZoneCount;
uniform int u_era; // Эпоха: 1=кислотная, 2=чёрная дыра, 3=космическая
uniform vec4 u_altars[2]; // Алтари [x, y, z, score]
uniform vec4 u_darts[16]; // Летящие лучи [x, y, z, active]
uniform vec4 u_dartDirs[16]; // Направления лучей [dx, dy, dz, speed]
uniform int u_dartCount;
uniform float u_voidPortalActive; // Активен ли портал в войд (0 или время жизни)
uniform vec4 u_bloodCoins[12]; // Монеты крови в войде [x, y, z, active]
uniform int u_bloodCoinCount;
uniform int u_wave; // Текущая волна (для эффекта дождя на 15+)
uniform int u_greenBossPhase2; // Фаза 2 зелёного босса - зелёное небо!
uniform vec4 u_pickups[8]; // Пикапы [x, y, z, type] type: 9=health, 10=stimpack, 11=charge
uniform int u_pickupCount;
uniform vec4 u_crystals[6]; // Кристаллы силы [x, z, height, active]
uniform int u_voidMode; // Режим войда (засосан Владыкой пустоты)
uniform float u_voidProgress; // Прогресс войда (0-1, для анимации выхода)
uniform float u_voidFallOffset; // Смещение падения для визуального эффекта
uniform vec3 u_portalPos; // Позиция портала выхода в войде
uniform vec4 u_grenades[8]; // Гранаты [x, y, z, lifetime]
uniform int u_grenadeCount;
uniform vec4 u_explosions[8]; // Взрывы [x, y, z, progress]
uniform int u_explosionCount;
uniform int u_voidVariant; // Вариант войда (0-3: багровый, изумрудный, золотой, ледяной)

// === КАТАНА (3D viewmodel) ===
uniform float u_katanaAttack; // Прогресс атаки 0-1
uniform float u_katanaBob; // Фаза покачивания
uniform int u_katanaCharges; // Заряды сплеша (0-3)
uniform float u_katanaTargetAngle; // Угол к ближайшему врагу (-1 = нет врага)
uniform float u_katanaTargetDist; // Расстояние до ближайшего врага
uniform int u_katanaAttackType; // Тип удара: 0=справа сверху, 1=слева локтевой, 2=сплеш

// === ЭФФЕКТЫ СМЕРТИ ВРАГОВ ===
uniform vec4 u_deathEffects[8]; // [x, y, z, progress] - до 8 одновременных смертей

// === ФРАГМЕНТЫ ВРАГОВ (разрубленные куски) ===
uniform vec4 u_fragments[32]; // [x, y, z, size] - до 32 фрагментов
uniform int u_fragmentCount;

// === НАСТРОЙКИ ГРАФИКИ ===
uniform int u_shadowsEnabled;  // 0 или 1
uniform int u_postfxEnabled;   // 0 или 1
uniform int u_katanaEnabled;   // 0 или 1

in vec2 v_uv;
out vec4 fragColor;

// === ПАРАМЕТРЫ РЕЙТРЕЙСИНГА ===
#define MAX_STEPS 40
#define MAX_DIST 150.0
#define SURF_DIST 0.035
#define PI 3.14159265

// === РАЗМЕРЫ АРЕНЫ ===
#define ARENA_RADIUS 38.0
#define DOME_HEIGHT 22.0
#define POOL_RADIUS 8.0
#define POOL_DEPTH 2.0
// Малые бассейны удалены для упрощения
#define PLATFORM_HEIGHT 2.0
#define PLATFORM_X 20.0
#define BRIDGE_WIDTH 3.0
// Площадки за порталами
#define BACK_PLATFORM_RADIUS 8.0
#define BACK_PLATFORM_X 30.0

// === NOISE ===
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float hash3(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

// === GLITCH DISSOLVE ЭФФЕКТ СМЕРТИ ===
// Возвращает: x = dissolve factor (0=живой, 1=растворён), y = glitch offset
vec2 getDeathEffect(vec3 worldPos) {
  float totalDissolve = 0.0;
  float totalGlitch = 0.0;
  
  for (int i = 0; i < 2; i++) { // Оптимизация: было 4
    vec4 death = u_deathEffects[i];
    if (death.w > 0.01) {
      float dist = length(worldPos - death.xyz);
      float progress = death.w;
      
      // Волна растворения распространяется от центра
      float waveRadius = progress * 3.0;
      float waveFront = smoothstep(waveRadius + 0.5, waveRadius - 0.5, dist);
      
      // Шумовой dissolve
      float noiseVal = hash3(worldPos * 10.0 + progress * 5.0);
      float dissolve = waveFront * step(noiseVal, progress * 1.5);
      
      // Glitch distortion
      float glitch = 0.0;
      if (progress > 0.1 && progress < 0.9) {
        float glitchNoise = hash3(worldPos * 50.0 + vec3(progress * 20.0));
        if (glitchNoise > 0.92) {
          glitch = (glitchNoise - 0.92) * 2.0 * sin(progress * 50.0);
        }
      }
      
      totalDissolve = max(totalDissolve, dissolve);
      totalGlitch = max(totalGlitch, glitch * waveFront);
    }
  }
  
  return vec2(totalDissolve, totalGlitch);
}

// Цвет распада - яркие частицы
vec3 getDeathColor(vec3 worldPos, vec3 baseColor, float progress) {
  // Яркие искры на границе распада
  float sparkle = hash3(worldPos * 30.0 + progress * 10.0);
  if (sparkle > 0.95) {
    return vec3(1.0, 0.5, 0.0) * 3.0; // Оранжевые искры
  }
  
  // Энергетическое свечение
  float glow = sin(progress * 20.0 + length(worldPos) * 5.0) * 0.5 + 0.5;
  vec3 energyColor = mix(vec3(1.0, 0.3, 0.0), vec3(0.0, 1.0, 0.5), glow);
  
  return mix(baseColor, energyColor, progress * 2.0);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  // Улучшенная интерполяция (quintic)
  f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(hash(i), hash(i + vec2(1, 0)), f.x),
    mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x),
    f.y
  );
}

// Быстрый фрактальный шум (3 октавы вместо 5)
float fbm(vec2 p) {
  float value = 0.0;
  value += 0.5 * noise(p);
  value += 0.25 * noise(p * 2.0);
  value += 0.125 * noise(p * 4.0);
  return value;
}

// Острый шум для трещин и швов
float sharpNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  // Без сглаживания - резкие границы
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, step(0.5, f.x)), mix(c, d, step(0.5, f.x)), step(0.5, f.y));
}

float waterWaves(vec2 p, float t) {
  float wave = 0.0;
  wave += sin(p.x * 0.5 + t * 0.8) * 0.08;
  wave += sin(p.y * 0.4 + t * 0.6) * 0.06;
  wave += sin((p.x + p.y) * 0.7 + t) * 0.04;
  return wave;
}

// === SDF ПРИМИТИВЫ ===
float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdCylinder(vec3 p, float r, float h) {
  vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

// Октаэдр (кристалл)
float sdOctahedron(vec3 p, float s) {
  p = abs(p);
  return (p.x + p.y + p.z - s) * 0.57735027;
}

float sdCappedCone(vec3 p, float h, float r1, float r2) {
  vec2 q = vec2(length(p.xz), p.y);
  vec2 k1 = vec2(r2, h);
  vec2 k2 = vec2(r2 - r1, 2.0 * h);
  vec2 ca = vec2(q.x - min(q.x, (q.y < 0.0) ? r1 : r2), abs(q.y) - h);
  vec2 cb = q - k1 + k2 * clamp(dot(k1 - q, k2) / dot(k2, k2), 0.0, 1.0);
  float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
  return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
}

// Плавное объединение
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// === МАТЕРИАЛ ===
// 0 = стены/пол, 1 = вода, 2 = растения, 3 = металл, 4 = свечение
int materialId = 0;

// === ПАЛЬМА ===
float sdPalm(vec3 p, vec3 pos) {
  vec3 lp = p - pos;
  float d = MAX_DIST;
  
  // Горшок
  float pot = sdCappedCone(lp - vec3(0.0, 0.3, 0.0), 0.3, 0.5, 0.4);
  d = min(d, pot);
  
  // Ствол
  float trunk = sdCylinder(lp - vec3(0.0, 1.5, 0.0), 0.12, 1.2);
  d = min(d, trunk);
  
  // Крона (несколько сфер)
  float crown = sdSphere(lp - vec3(0.0, 3.0, 0.0), 1.0);
  crown = min(crown, sdSphere(lp - vec3(0.5, 2.8, 0.3), 0.7));
  crown = min(crown, sdSphere(lp - vec3(-0.5, 2.8, -0.3), 0.7));
  crown = min(crown, sdSphere(lp - vec3(0.3, 2.9, -0.5), 0.6));
  crown = min(crown, sdSphere(lp - vec3(-0.3, 2.9, 0.5), 0.6));
  d = min(d, crown);
  
  return d;
}

// === КУСТ ===
float sdBush(vec3 p, vec3 pos, float size) {
  vec3 lp = p - pos;
  float d = sdSphere(lp, size);
  // Добавляем неровности
  d += sin(lp.x * 8.0) * sin(lp.y * 8.0) * sin(lp.z * 8.0) * 0.05 * size;
  return d;
}

// === ФАКЕЛ ===
float sdTorch(vec3 p, vec3 pos) {
  vec3 lp = p - pos;
  float holder = sdCylinder(lp, 0.08, 0.3);
  float bowl = sdCappedCone(lp - vec3(0.0, 0.35, 0.0), 0.15, 0.05, 0.15);
  return min(holder, bowl);
}

// === ЛЕСТНИЦА ===
float sdStairs(vec3 p, vec3 pos, float width, float height, float depth, int steps) {
  vec3 lp = p - pos;
  float d = MAX_DIST;
  
  float stepH = height / float(steps);
  float stepD = depth / float(steps);
  
  for (int i = 0; i < steps; i++) {
    if (i >= 10) break; // Ограничение для производительности
    float y = float(i) * stepH;
    float z = float(i) * stepD;
    float step = sdBox(lp - vec3(0.0, y + stepH * 0.5, z + stepD * 0.5), 
                       vec3(width * 0.5, stepH * 0.5, stepD * 0.5));
    d = min(d, step);
  }
  
  return d;
}

// === ТУРБО MAP (минимум геометрии + основные элементы) ===
float mapTurbo(vec3 p) {
  float d = MAX_DIST;
  materialId = 0;
  
  // Пол
  float floor_d = p.y;
  if (floor_d < d) {
    d = floor_d;
    materialId = 55;
  }
  
  // Центральный фонтан (просто цилиндр)
  float fountainDist = length(p.xz);
  if (fountainDist < 5.0) {
    float fountain = max(fountainDist - 3.0, abs(p.y - 1.5) - 1.5);
    if (fountain < d) {
      d = fountain;
      materialId = 50;
    }
  }
  
  // Порталы (простые боксы)
  // Левый
  vec3 lp = p - vec3(-22.0, 3.0, 0.0);
  float leftPortal = max(max(abs(lp.x) - 1.5, abs(lp.y) - 3.0), abs(lp.z) - 0.5);
  if (leftPortal < d) { d = leftPortal; materialId = 23; }
  
  // Правый
  vec3 rp = p - vec3(22.0, 3.0, 0.0);
  float rightPortal = max(max(abs(rp.x) - 1.5, abs(rp.y) - 3.0), abs(rp.z) - 0.5);
  if (rightPortal < d) { d = rightPortal; materialId = 23; }
  
  // Враги (сферы)
  for (int i = 0; i < u_targetCount; i++) {
    if (i >= 8) break; // Максимум 8
    vec4 target = u_targets[i];
    if (target.w > 0.5) {
      vec3 enemyPos = vec3(target.x, 1.0, target.y);
      float enemyD = length(p - enemyPos) - 0.8;
      if (enemyD < d) {
        d = enemyD;
        materialId = 10;
      }
    }
  }
  
  // Стены (цилиндр)
  float wallDist = -(length(p.xz) - 38.0);
  if (wallDist < d && p.y < 8.0) {
    d = wallDist;
    materialId = 12;
  }
  
  // Бассейн (кольцо вокруг фонтана)
  float poolDist = abs(length(p.xz) - 8.0) - 5.0;
  if (poolDist < 2.0 && p.y < -0.3) {
    float pool = max(poolDist, -p.y - 0.5);
    if (pool < d) {
      d = pool;
      materialId = 49; // Вода
    }
  }
  
  return d;
}

// === СЦЕНА ===
float map(vec3 p) {
  // Турбо режим - минимальная геометрия
  if (u_turboMode == 1) {
    return mapTurbo(p);
  }
  
  float d = MAX_DIST;
  materialId = 0;
  
  float distFromCenter = length(p.xz);
  float distFromCam = length(p - u_cameraPos);
  
  // LOD: на большом расстоянии пропускаем детали
  bool isNear = distFromCam < 40.0;
  bool isMedium = distFromCam < 80.0;
  
  // === ПРОСТОЙ КРАЙ АРЕНЫ ===
  float arenaRadius = ARENA_RADIUS - 5.0;
  float arenaEdge = length(p.xz) - arenaRadius;
  
  // === ПОЛ (ДЕТАЛИЗИРОВАННЫЙ) ===
  float floor_d = p.y;
  if (arenaEdge < 0.0) {
    // Основной пол
    if (floor_d < d) {
      d = floor_d;
      
      // Определяем зону пола для разных материалов
      float centerDist = length(p.xz);
      
      if (centerDist < 4.0) {
        materialId = 53; // Мозаика в центре
      } else if (centerDist < 8.0) {
        materialId = 54; // Декоративное кольцо
      } else {
        materialId = 55; // Основной пол - каменная плитка
      }
    }
  }
  
  // === ТОКСИЧНЫЕ ЛУЖИ (distance culled) ===
  if (distFromCam < 50.0) {
    for (int i = 0; i < u_poolCount; i++) {
      if (i >= 4) break; // Уменьшено с 8 до 4
      vec4 pool = u_pools[i];
      if (pool.w > 0.0 && p.y < 0.15 && p.y > -0.1) {
        float distToPool = length(p.xz - pool.xy);
        if (distToPool < pool.z) {
          float poolSurface = p.y - 0.08;
          if (poolSurface < d) {
            d = poolSurface;
            materialId = 13;
          }
        }
      }
    }
  }
  
  // === ЗОНЫ КИСЛОТНОГО ДОЖДЯ (distance culled) ===
  if (distFromCam < 60.0) {
    for (int i = 0; i < u_acidRainZoneCount; i++) {
      if (i >= 2) break; // Уменьшено с 4 до 2
      vec4 zone = u_acidRainZones[i];
      float state = zone.w;
      float distToZone = length(p.xz - zone.xy);
      float zoneRadius = zone.z;
      
      if (state < 1.0) {
        if (p.y < 0.1 && p.y > -0.05) {
          float markRadius = zoneRadius * (0.3 + state * 1.4);
          if (distToZone < markRadius) {
            float ring = smoothstep(0.2, 0.0, abs(distToZone - markRadius * 0.85));
            if (ring > 0.3) {
              d = p.y - 0.02;
              materialId = 20;
            }
          }
        }
      } else {
        if (p.y < 0.15 && p.y > -0.05 && distToZone < zoneRadius) {
          d = p.y - 0.03;
          materialId = 21;
        }
      }
    }
  }
  
  // === ЛЕТЯЩИЕ СНАРЯДЫ КИСЛОТЫ (distance culled) ===
  if (distFromCam < 50.0) {
    for (int i = 0; i < u_acidProjectileCount; i++) {
      if (i >= 2) break; // Уменьшено с 4 до 2
      vec4 proj = u_acidProjectiles[i];
      vec3 projPos = proj.xyz;
      float progress = proj.w;
      
      if (progress > 0.0 && progress < 1.0) {
        float projSphere = length(p - projPos) - 0.5;
        if (projSphere < d) {
          d = projSphere;
          materialId = 19;
        }
      }
    }
  }
  
  // === ЭНЕРГЕТИЧЕСКИЕ ЛУЧИ (упрощённые, distance culled) ===
  if (distFromCam < 40.0) {
    for (int i = 0; i < u_dartCount; i++) {
      if (i >= 4) break;
      vec4 dart = u_darts[i];
      if (dart.w > 0.5) {
        vec3 dartPos = dart.xyz;
        float dartD = length(p - dartPos) - 0.2;
        if (dartD < d) {
          d = dartD;
          materialId = 35;
        }
      }
    }
  }
  
  // === ЛАЗЕРЫ СПАЙКЕРОВ (distance culled) ===
  if (distFromCam < 50.0) {
  for (int i = 0; i < u_spikeCount; i++) {
    if (i >= 4) break; // Уменьшено с 8 до 4
    vec4 spike = u_spikes[i];
    vec4 spikeTarget = u_spikeTargets[i];
    vec3 laserStart = spike.xyz;
    vec3 laserEnd = spikeTarget.xyz;
    float lifetime = spike.w;
    float intensity = spikeTarget.w;
    
    if (lifetime > 0.0 && intensity > 0.0) {
      // Вектор луча
      vec3 laserDir = laserEnd - laserStart;
      float laserLen = length(laserDir);
      if (laserLen > 0.1) {
        laserDir /= laserLen;
        
        // Расстояние до линии лазера
        vec3 toPoint = p - laserStart;
        float proj = clamp(dot(toPoint, laserDir), 0.0, laserLen);
        vec3 closestPoint = laserStart + laserDir * proj;
        float distToLaser = length(p - closestPoint);
        
        // Толщина луча зависит от интенсивности
        float beamRadius = 0.08 + intensity * 0.05;
        float laserD = distToLaser - beamRadius;
        
        // Свечение вокруг луча
        float glow = max(0.0, 0.3 - distToLaser) * intensity * 2.0;
        
        if (laserD < d) {
          d = laserD;
          materialId = 27; // Лазер
        }
      }
    }
  }
  } // end distance culling for spikes
  
  // === ГРАНАТЫ (distance culled) ===
  if (distFromCam < 40.0) {
    for (int i = 0; i < u_grenadeCount; i++) {
      if (i >= 4) break; // Уменьшено
      vec4 grenade = u_grenades[i];
      vec3 grenadePos = grenade.xyz;
      float grenadeD = length(p - grenadePos) - 0.3;
      if (grenadeD < d) {
        d = grenadeD;
        materialId = 41;
      }
    }
  }
  
  // === ВЗРЫВЫ (distance culled) ===
  if (distFromCam < 50.0) {
    for (int i = 0; i < u_explosionCount; i++) {
      if (i >= 2) break; // Уменьшено
      vec4 explosion = u_explosions[i];
      vec3 expPos = explosion.xyz;
      float progress = explosion.w;
      float expRadius = progress * 8.0;
      float expD = length(p - expPos) - expRadius;
      if (expD < d && progress < 1.0) {
        d = expD;
        materialId = 43;
      }
    }
  }
  
  // === ПИКАПЫ (упрощённые, distance culled) ===
  if (distFromCam < 40.0) {
    for (int i = 0; i < u_pickupCount; i++) {
      if (i >= 4) break; // Уменьшено
      vec4 pickup = u_pickups[i];
      float pType = pickup.w;
      
      if (pType > 0.0) {
        vec3 pickupPos = pickup.xyz;
        float bob = sin(u_time * 2.0 + pickupPos.x) * 0.15;
        float spin = u_time * 2.0; // Вращение
        
        vec3 lp = p - pickupPos - vec3(0, bob + 0.5, 0);
        
        // Вращаем вокруг Y
        float cs = cos(spin), sn = sin(spin);
        lp.xz = mat2(cs, -sn, sn, cs) * lp.xz;
        
        float pickupD;
        
        if (pType > 8.5 && pType < 9.5) {
          // === МАЛЕНЬКАЯ АПТЕЧКА - БЕЛЫЙ КРЕСТ ===
          float crossV = sdBox(lp, vec3(0.08, 0.35, 0.08));
          float crossH = sdBox(lp, vec3(0.35, 0.08, 0.08));
          pickupD = min(crossV, crossH);
          if (pickupD < d) {
            d = pickupD;
            materialId = 31; // Белый светящийся крест
          }
        } else if (pType > 11.5 && pType < 12.5) {
          // === БОЛЬШАЯ АПТЕЧКА - БОЛЬШОЙ БЕЛЫЙ КРЕСТ ===
          float crossV = sdBox(lp, vec3(0.12, 0.55, 0.12));
          float crossH = sdBox(lp, vec3(0.55, 0.12, 0.12));
          pickupD = min(crossV, crossH);
          if (pickupD < d) {
            d = pickupD;
            materialId = 31; // Белый светящийся крест
          }
        } else {
          // Остальные пикапы - сферы
          pickupD = length(lp) - 0.3;
          if (pickupD < d) {
            d = pickupD;
            if (pType == 10.0) materialId = 15; // Жёлтый (баф)
            else if (pType == 11.0) materialId = 17; // Заряд
            else materialId = 31; // Белый
          }
        }
      }
    }
  } // end distance culling for pickups
  
  // === ОБРЫВ ПО КРАЯМ ===
  // Бортик края - тор вокруг арены
  float rimTorus = sdTorus(p - vec3(0.0, 0.0, 0.0), vec2(33.0, 0.4));
  if (rimTorus < d) {
    d = rimTorus;
    materialId = 46;
  }
  
  // За краем - бездна (простой пол далеко внизу)
  if (arenaEdge > 0.5) {
    float voidFloor = p.y + 10.0;
    if (voidFloor < d) {
      d = voidFloor;
      materialId = 44;
    }
  }
  
  // === ЦЕНТРАЛЬНЫЙ ФОНТАН СО СТАТУЕЙ АНГЕЛА ===
  // Анимация трансформации: статуя уезжает вниз, появляется портал
  float portalProgress = clamp(u_voidPortalActive, 0.0, 1.0);
  float angelOffset = portalProgress * 5.0; // Статуя уезжает вниз на 5 единиц
  
  { // Основание фонтана (всегда видно)
    float fountBase = sdCylinder(p - vec3(0.0, 0.15, 0.0), 3.0, 0.15);
    if (fountBase < d) { d = fountBase; materialId = 75; }
    
    // Нижняя чаша
    float bowl1 = sdTorus(p - vec3(0.0, 0.6, 0.0), vec2(2.0, 0.25));
    if (bowl1 < d) { d = bowl1; materialId = 51; }
    
    // === СТАТУЯ (классическая колонна с чашей - уезжает вниз при активации портала) ===
    if (portalProgress < 0.95) {
      vec3 statuePos = vec3(0.0, 0.7 - angelOffset, 0.0);
      
      // Центральная колонна
      float pillar = sdCylinder(p - statuePos, 0.35, 1.8);
      if (pillar < d) { d = pillar; materialId = 51; }
      
      // База колонны (расширение внизу)
      float pillarBase = sdCylinder(p - statuePos + vec3(0.0, 1.6, 0.0), 0.5, 0.25);
      if (pillarBase < d) { d = pillarBase; materialId = 51; }
      
      // Верхняя чаша
      float topBowl = sdTorus(p - statuePos - vec3(0.0, 1.8, 0.0), vec2(0.6, 0.15));
      if (topBowl < d) { d = topBowl; materialId = 51; }
      
      // Декоративные кольца на колонне
      float ring1 = sdTorus(p - statuePos - vec3(0.0, 0.6, 0.0), vec2(0.38, 0.04));
      float ring2 = sdTorus(p - statuePos - vec3(0.0, 1.2, 0.0), vec2(0.38, 0.04));
      if (ring1 < d) { d = ring1; materialId = 52; } // Бронза
      if (ring2 < d) { d = ring2; materialId = 52; }
      
      // Сфера на вершине (оранжевая как луна)
      float topOrb = sdSphere(p - statuePos - vec3(0.0, 2.2, 0.0), 0.3);
      if (topOrb < d) { d = topOrb; materialId = 78; } // Оранжевый шар
    }
    
    // === ПОРТАЛ (появляется при активации) ===
    if (portalProgress > 0.05) {
      vec3 portalPos = vec3(0.0, 2.7, 0.0);
      
      // Каменная рамка - тор
      float portalRing = sdTorus(p - portalPos, vec2(1.0, 0.15));
      if (portalRing < d) { d = portalRing; materialId = 68; }
      
      // Бронзовый внутренний обод
      float innerRing = sdTorus(p - portalPos, vec2(0.8, 0.06));
      if (innerRing < d) { d = innerRing; materialId = 52; }
      
      // Огненная сфера внутри портала (как у боковых)
      float energyCore = sdSphere(p - portalPos, 0.7 * portalProgress);
      if (energyCore < d) { d = energyCore; materialId = 38; }
    }
  }
  
  // === ЦЕНТРАЛЬНЫЙ БАССЕЙН ===
  float poolDist = distFromCenter;
  
  // Бортик бассейна (детализированный)
  if (poolDist < POOL_RADIUS + 0.5 && poolDist > POOL_RADIUS - 0.8) {
    // Внешний край бортика
    float rimOuter = sdTorus(p - vec3(0.0, 0.2, 0.0), vec2(POOL_RADIUS + 0.1, 0.25));
    if (rimOuter < d) { d = rimOuter; materialId = 75; }
    
    // Верхняя плоскость бортика
    float rimTop = sdCylinder(p - vec3(0.0, 0.35, 0.0), POOL_RADIUS + 0.3, 0.1);
    rimTop = max(rimTop, -(length(p.xz) - POOL_RADIUS + 0.5));
    if (rimTop < d) { d = rimTop; materialId = 75; }
  }
  
  // Дно бассейна
  if (poolDist < POOL_RADIUS - 0.3 && p.y < 0.3 && p.y > -POOL_DEPTH - 0.1) {
    float poolBottom = p.y + POOL_DEPTH;
    if (poolBottom < d) { d = poolBottom; materialId = 77; } // Дно бассейна (мозаика)
  }
  
  // === МОСТЫ ЧЕРЕЗ БАССЕЙН ===
  // Мост по X
  float bridgeX = sdBox(p - vec3(0.0, 0.2, 0.0), vec3(POOL_RADIUS + 1.0, 0.2, BRIDGE_WIDTH * 0.5));
  // Вырезаем центр для колонны
  bridgeX = max(bridgeX, -sdCylinder(p, 2.0, 1.0));
  d = min(d, bridgeX);
  
  // Мост по Z
  float bridgeZ = sdBox(p - vec3(0.0, 0.2, 0.0), vec3(BRIDGE_WIDTH * 0.5, 0.2, POOL_RADIUS + 1.0));
  bridgeZ = max(bridgeZ, -sdCylinder(p, 2.0, 1.0));
  d = min(d, bridgeZ);
  
  // === ПОДХОДЫ К ПОРТАЛАМ (рампы) ===
  // Левая рампа к порталу
  float rampL = sdBox(p - vec3(-19.0, 0.15, 0.0), vec3(3.5, 0.15, 2.5));
  d = min(d, rampL);
  
  // Правая рампа к порталу
  float rampR = sdBox(p - vec3(19.0, 0.15, 0.0), vec3(3.5, 0.15, 2.5));
  d = min(d, rampR);
  
  // === ПОРТАЛЫ (ТОРИИ-СТИЛЬ) - ОПТИМИЗИРОВАНО ===
  // Левый портал (всегда видно)
  {
    vec3 pp = p - vec3(-22.0, 0.0, 0.0);
    
    // Платформа (одна объединённая)
    float platform = sdBox(pp - vec3(0.0, 0.25, 0.0), vec3(3.5, 0.25, 3.5));
    if (platform < d) { d = platform; materialId = 68; }
    
    // Колонны (упрощённые - без сужения)
    float colL = sdBox(pp - vec3(0.0, 2.5, -2.0), vec3(0.4, 2.0, 0.4));
    float colR = sdBox(pp - vec3(0.0, 2.5, 2.0), vec3(0.4, 2.0, 0.4));
    if (colL < d) { d = colL; materialId = 23; }
    if (colR < d) { d = colR; materialId = 23; }
    
    // Верхняя перекладина
    float kasagi = sdBox(pp - vec3(0.0, 5.0, 0.0), vec3(0.4, 0.2, 2.8));
    if (kasagi < d) { d = kasagi; materialId = 23; }
    
    // Нижняя перекладина
    float nuki = sdBox(pp - vec3(0.0, 3.8, 0.0), vec3(0.25, 0.12, 2.3));
    if (nuki < d) { d = nuki; materialId = 23; }
    
    // Энергия портала
    vec3 portalCenter = pp - vec3(0.0, 2.8, 0.0);
    float portalDist = length(portalCenter.yz);
    float energyCore = portalDist - 1.3;
    energyCore = max(energyCore, abs(portalCenter.x) - 0.3);
    if (energyCore < d) { d = energyCore; materialId = 24; }
  }
  
  // Правый портал (всегда видно)
  {
    vec3 pp = p - vec3(22.0, 0.0, 0.0);
    
    float platform = sdBox(pp - vec3(0.0, 0.25, 0.0), vec3(3.5, 0.25, 3.5));
    if (platform < d) { d = platform; materialId = 68; }
    
    float colL = sdBox(pp - vec3(0.0, 2.5, -2.0), vec3(0.4, 2.0, 0.4));
    float colR = sdBox(pp - vec3(0.0, 2.5, 2.0), vec3(0.4, 2.0, 0.4));
    if (colL < d) { d = colL; materialId = 23; }
    if (colR < d) { d = colR; materialId = 23; }
    
    float kasagi = sdBox(pp - vec3(0.0, 5.0, 0.0), vec3(0.4, 0.2, 2.8));
    if (kasagi < d) { d = kasagi; materialId = 23; }
    
    float nuki = sdBox(pp - vec3(0.0, 3.8, 0.0), vec3(0.25, 0.12, 2.3));
    if (nuki < d) { d = nuki; materialId = 23; }
    
    vec3 portalCenter = pp - vec3(0.0, 2.8, 0.0);
    float portalDist = length(portalCenter.yz);
    float energyCore = portalDist - 1.3;
    energyCore = max(energyCore, abs(portalCenter.x) - 0.3);
    if (energyCore < d) { d = energyCore; materialId = 24; }
  }
  
  // === КРУГЛЫЕ ПЛОЩАДКИ ЗА ПОРТАЛАМИ (ОПТИМИЗИРОВАНО) ===
  // Левая площадка (всегда видно)
  {
    vec3 lp = p - vec3(-BACK_PLATFORM_X, 0.0, 0.0);
    float lpDist = length(lp.xz);
    
    // Одна платформа вместо трёх ступеней
    float platform = sdCylinder(lp - vec3(0.0, 0.2, 0.0), BACK_PLATFORM_RADIUS, 0.2);
    if (platform < d) { d = platform; materialId = 71; }
    
    // Бортик (упрощённый)
    float rim = sdTorus(lp - vec3(0.0, 0.35, 0.0), vec2(BACK_PLATFORM_RADIUS, 0.15));
    if (rim < d) { d = rim; materialId = 72; }
    
    // 4 столбика вместо 8 (только по осям)
    float pillar1 = sdBox(lp - vec3(BACK_PLATFORM_RADIUS - 0.3, 0.6, 0.0), vec3(0.2, 0.5, 0.2));
    float pillar2 = sdBox(lp - vec3(-(BACK_PLATFORM_RADIUS - 0.3), 0.6, 0.0), vec3(0.2, 0.5, 0.2));
    float pillar3 = sdBox(lp - vec3(0.0, 0.6, BACK_PLATFORM_RADIUS - 0.3), vec3(0.2, 0.5, 0.2));
    float pillar4 = sdBox(lp - vec3(0.0, 0.6, -(BACK_PLATFORM_RADIUS - 0.3)), vec3(0.2, 0.5, 0.2));
    float pillars = min(min(pillar1, pillar2), min(pillar3, pillar4));
    if (pillars < d) { d = pillars; materialId = 72; }
  }
  
  // Правая площадка (всегда видно)
  {
    vec3 lp = p - vec3(BACK_PLATFORM_X, 0.0, 0.0);
    float lpDist = length(lp.xz);
    
    float platform = sdCylinder(lp - vec3(0.0, 0.2, 0.0), BACK_PLATFORM_RADIUS, 0.2);
    if (platform < d) { d = platform; materialId = 71; }
    
    float rim = sdTorus(lp - vec3(0.0, 0.35, 0.0), vec2(BACK_PLATFORM_RADIUS, 0.15));
    if (rim < d) { d = rim; materialId = 72; }
    
    float pillar1 = sdBox(lp - vec3(BACK_PLATFORM_RADIUS - 0.3, 0.6, 0.0), vec3(0.2, 0.5, 0.2));
    float pillar2 = sdBox(lp - vec3(-(BACK_PLATFORM_RADIUS - 0.3), 0.6, 0.0), vec3(0.2, 0.5, 0.2));
    float pillar3 = sdBox(lp - vec3(0.0, 0.6, BACK_PLATFORM_RADIUS - 0.3), vec3(0.2, 0.5, 0.2));
    float pillar4 = sdBox(lp - vec3(0.0, 0.6, -(BACK_PLATFORM_RADIUS - 0.3)), vec3(0.2, 0.5, 0.2));
    float pillars = min(min(pillar1, pillar2), min(pillar3, pillar4));
    if (pillars < d) { d = pillars; materialId = 72; }
  }
  
  // === МОСТЫ К ПЛОЩАДКАМ ЗА ПОРТАЛАМИ ===
  // Левый мост (от портала к площадке)
  float bridgeLeft = sdBox(p - vec3(-26.0, 0.15, 0.0), vec3(4.5, 0.15, 2.5));
  if (bridgeLeft < d) {
    d = bridgeLeft;
    materialId = 0;
  }
  
  // Правый мост
  float bridgeRight = sdBox(p - vec3(26.0, 0.15, 0.0), vec3(4.5, 0.15, 2.5));
  if (bridgeRight < d) {
    d = bridgeRight;
    materialId = 0;
  }
  
  
  // === ЛЕТАЮЩИЕ ПЛАТФОРМЫ (каменные с бронзовым ободком) ===
  float bob1 = sin(u_time * 1.5) * 0.3;
  float bob2 = sin(u_time * 1.5 + 0.8) * 0.3;
  float bob3 = sin(u_time * 1.5 + 1.6) * 0.3;
  float bob4 = sin(u_time * 1.5 + 2.4) * 0.3;
  float bob5 = sin(u_time * 1.5 + 3.2) * 0.3;
  float bob6 = sin(u_time * 1.5 + 4.0) * 0.3;
  
  // Позиции платформ
  vec3 plat1Pos = vec3(10.0, 1.8 + bob1, 0.0);
  vec3 plat2Pos = vec3(5.0, 3.0 + bob2, 8.66);
  vec3 plat3Pos = vec3(-5.0, 4.2 + bob3, 8.66);
  vec3 plat4Pos = vec3(-10.0, 5.4 + bob4, 0.0);
  vec3 plat5Pos = vec3(-5.0, 6.6 + bob5, -8.66);
  vec3 plat6Pos = vec3(5.0, 7.8 + bob6, -8.66);
  
  // Каменные основания платформ
  float jp1 = sdCylinder(p - plat1Pos, 1.5, 0.2);
  float jp2 = sdCylinder(p - plat2Pos, 1.4, 0.2);
  float jp3 = sdCylinder(p - plat3Pos, 1.4, 0.2);
  float jp4 = sdCylinder(p - plat4Pos, 1.3, 0.2);
  float jp5 = sdCylinder(p - plat5Pos, 1.3, 0.2);
  float jp6 = sdCylinder(p - plat6Pos, 1.2, 0.2);
  
  float jumpPlats = min(jp1, min(jp2, min(jp3, min(jp4, min(jp5, jp6)))));
  if (jumpPlats < d) {
    d = jumpPlats;
    materialId = 71; // Каменная платформа (как площадки порталов)
  }
  
  // Бронзовые ободки платформ
  float rim1 = sdTorus(p - plat1Pos + vec3(0.0, 0.15, 0.0), vec2(1.5, 0.08));
  float rim2 = sdTorus(p - plat2Pos + vec3(0.0, 0.15, 0.0), vec2(1.4, 0.08));
  float rim3 = sdTorus(p - plat3Pos + vec3(0.0, 0.15, 0.0), vec2(1.4, 0.08));
  float rim4 = sdTorus(p - plat4Pos + vec3(0.0, 0.15, 0.0), vec2(1.3, 0.08));
  float rim5 = sdTorus(p - plat5Pos + vec3(0.0, 0.15, 0.0), vec2(1.3, 0.08));
  float rim6 = sdTorus(p - plat6Pos + vec3(0.0, 0.15, 0.0), vec2(1.2, 0.08));
  
  float rims = min(rim1, min(rim2, min(rim3, min(rim4, min(rim5, rim6)))));
  if (rims < d) {
    d = rims;
    materialId = 72; // Бронзовый ободок
  }
  
  // === ВЕРХНЯЯ ПЛАТФОРМА (главная, над фонтаном) ===
  float topBob = sin(u_time * 1.0) * 0.2;
  vec3 topPos = vec3(0.0, 9.5 + topBob, 0.0);
  
  // Каменное основание
  float topPlat = sdCylinder(p - topPos, 2.5, 0.3);
  if (topPlat < d) {
    d = topPlat;
    materialId = 71;
  }
  
  // Бронзовый ободок по краю (снизу)
  float topRim = sdTorus(p - topPos - vec3(0.0, 0.2, 0.0), vec2(2.5, 0.08));
  if (topRim < d) {
    d = topRim;
    materialId = 72;
  }
  
  // Декоративный бронзовый обод снизу платформы
  float bottomRim = sdTorus(p - topPos + vec3(0.0, 0.25, 0.0), vec2(2.3, 0.08));
  if (bottomRim < d) {
    d = bottomRim;
    materialId = 52; // Бронза
  }

  // === КРИСТАЛЛЫ СИЛЫ (только на волне 10, оптимизировано) ===
  if (u_wave == 10 && distFromCam < 40.0) {
    for (int i = 0; i < 3; i++) { // Оптимизация: было 6
      if (u_crystals[i].w > 0.5) { // active
        float cx = u_crystals[i].x;
        float cz = u_crystals[i].y;
        float ch = u_crystals[i].z;
        
        // Кристалл парит и вращается
        float bobOffset = sin(u_time * 2.0 + float(i)) * 0.15;
        float rotation = u_time * 1.5 + float(i) * 1.047; // Вращение
        
        vec3 crystalPos = vec3(cx, ch + bobOffset, cz);
        vec3 lp = p - crystalPos;
        
        // Вращаем вокруг Y
        float cosR = cos(rotation);
        float sinR = sin(rotation);
        lp.xz = mat2(cosR, -sinR, sinR, cosR) * lp.xz;
        
        // Октаэдр (кристалл)
        float crystal = sdOctahedron(lp, 0.5);
        
        if (crystal < d) {
          d = crystal;
          materialId = 18; // Чёрный кристалл
        }
      }
    }
  }
  
  // Портал в войд теперь отрисовывается в фонтане (статуя ангела уезжает)
  
  // === АЛТАРИ НА КРАЯХ КАРТЫ ===
  for (int i = 0; i < 2; i++) {
    vec4 altar = u_altars[i];
    vec3 altarPos = vec3(altar.x, 0.0, altar.z);
    vec3 ap = p - altarPos;
    
    // Основание алтаря (круглая платформа)
    float base = sdCylinder(ap - vec3(0.0, 0.2, 0.0), 2.5, 0.4);
    
    // Ступени (3 уровня)
    float step1 = sdCylinder(ap - vec3(0.0, 0.5, 0.0), 2.0, 0.15);
    float step2 = sdCylinder(ap - vec3(0.0, 0.75, 0.0), 1.5, 0.15);
    float step3 = sdCylinder(ap - vec3(0.0, 1.0, 0.0), 1.0, 0.15);
    
    // Центральный столб (тории-образный)
    float pillarL = sdBox(ap - vec3(-1.2, 2.5, 0.0), vec3(0.15, 1.5, 0.15));
    float pillarR = sdBox(ap - vec3(1.2, 2.5, 0.0), vec3(0.15, 1.5, 0.15));
    
    // Перекладина сверху
    float top = sdBox(ap - vec3(0.0, 4.0, 0.0), vec3(1.8, 0.2, 0.2));
    float topSub = sdBox(ap - vec3(0.0, 3.6, 0.0), vec3(1.5, 0.1, 0.15));
    
    // Чаша для очков (в центре)
    float bowl = sdTorus(ap - vec3(0.0, 1.3, 0.0), vec2(0.6, 0.15));
    float bowlInner = sdCylinder(ap - vec3(0.0, 1.4, 0.0), 0.5, 0.2);
    
    // Собираем алтарь
    float altarD = base;
    altarD = min(altarD, step1);
    altarD = min(altarD, step2);
    altarD = min(altarD, step3);
    altarD = min(altarD, pillarL);
    altarD = min(altarD, pillarR);
    altarD = min(altarD, top);
    altarD = min(altarD, topSub);
    altarD = min(altarD, bowl);
    
    if (altarD < d) {
      d = altarD;
      materialId = 32; // Камень алтаря
    }
    
    // Огонь в чаше (если есть очки)
    if (altar.w > 0.0) {
      float fireY = 1.5 + sin(u_time * 5.0 + float(i)) * 0.2;
      float fireSize = 0.3 + altar.w * 0.001; // Размер зависит от очков
      float fire = length(ap - vec3(0.0, fireY, 0.0)) - min(fireSize, 0.8);
      
      if (fire < d) {
        d = fire;
        materialId = 33; // Огонь в алтаре
      }
    }
    
    // Светящийся символ (кольцо вокруг чаши)
    float glow = sdTorus(ap - vec3(0.0, 1.2, 0.0), vec2(0.9, 0.05));
    if (glow < d) {
      d = glow;
      materialId = 34; // Светящийся символ
    }
  }
  
  // === ВОДА В БАССЕЙНЕ (замедляет игрока!) ===
  // Центральный бассейн с водой
  if (distFromCenter > 2.5 && distFromCenter < POOL_RADIUS - 0.3) {
    // Проверяем что не на мосту
    bool onBridge = (abs(p.z) < BRIDGE_WIDTH * 0.5) || (abs(p.x) < BRIDGE_WIDTH * 0.5);
    if (!onBridge) {
      float waterY = 0.05 + waterWaves(p.xz, u_time) * 0.05;
      // Плоскость воды как SDF
      float waterSdf = abs(p.y - waterY) - 0.02;
      if (waterSdf < d) {
        d = waterSdf;
        materialId = 30; // Вода!
      }
    }
  }
  
  // Фонтан в центре (декоративная вода)
  float fountainWater = length(p.xz);
  if (fountainWater < 1.8 && fountainWater > 1.3) {
    float waterY = 0.45 + waterWaves(p.xz * 3.0, u_time * 2.0) * 0.02;
    float waterSdf = abs(p.y - waterY) - 0.02;
    if (waterSdf < d) {
      d = waterSdf;
      materialId = 30; // Вода!
    }
  }
  
  // === ВРАГИ (всегда видны) ===
  for (int i = 0; i < u_targetCount; i++) {
    if (i >= 8) break; // Максимум 8 врагов для FPS
    vec4 target = u_targets[i];
    if (target.w > 0.5) {
      // Проверка на умирающего врага
      bool isDying = target.w >= 100.0;
      float baseW = isDying ? target.w - 100.0 : target.w;
      int enemyType = int(baseW / 2.0); // 0=baneling, 1=phantom, 2=runner, 3=hopper, 4=spiker, 5=boss_green, 6=boss_black, 7=boss_blue
      
      vec3 tp = p - target.xyz;
      
      // Для умирающих врагов - сплющивание + растекание
      float deathScale = 1.0;
      if (isDying) {
        // Прогресс смерти закодирован в дробной части (0-0.99)
        float deathProgress = fract(baseW) * 2.0; // 0-1.98
        deathProgress = clamp(deathProgress, 0.0, 1.0);
        
        // Сплющивание по Y (падение и растекание)
        float yScale = mix(1.0, 0.15, deathProgress);
        float xzScale = mix(1.0, 1.8, deathProgress);
        
        tp.y /= yScale;
        tp.x /= xzScale;
        tp.z /= xzScale;
        deathScale = yScale; // Для корректировки расстояния
      }
      
      float targetD;
      int matId;
      
      if (enemyType == 5) {
        // === ЗЕЛЁНЫЙ БОСС (огромная зелёная жижа) ===
        float wobble = sin(u_time * 2.0 + tp.x * 1.5) * 0.3
                     + sin(u_time * 1.5 + tp.y * 2.0) * 0.25
                     + sin(u_time * 2.5 + tp.z * 1.0) * 0.2;
        float radius = 2.5 + wobble;
        targetD = sdSphere(tp, radius);
        
        // Пузырящаяся поверхность
        float bubbles = sin(tp.x * 4.0 + u_time * 3.0) 
                      * sin(tp.y * 4.0 + u_time * 2.5) 
                      * sin(tp.z * 4.0 + u_time * 3.5) * 0.2;
        targetD += bubbles;
        
        // Щупальца
        for (int t = 0; t < 4; t++) {
          float angle = float(t) * 1.57 + u_time * 0.5;
          vec3 tentacle = tp - vec3(cos(angle) * 1.5, -1.0, sin(angle) * 1.5);
          targetD = smin(targetD, sdCylinder(tentacle, 0.3, 1.5), 0.3);
        }
        matId = 10; // Зелёный босс
        
      } else if (enemyType == 6) {
        // === ЧЁРНЫЙ БОСС (искривляет пространство) ===
        // Искажённое пространство вокруг
        vec3 distorted = tp;
        float distortAmount = sin(u_time * 3.0) * 0.3;
        distorted.x += sin(tp.y * 3.0 + u_time * 2.0) * distortAmount;
        distorted.z += cos(tp.y * 3.0 + u_time * 2.0) * distortAmount;
        
        float radius = 2.0;
        targetD = sdSphere(distorted, radius);
        
        // Кольца тёмной энергии
        float ring1 = abs(sdTorus(tp, vec2(3.0, 0.1))) - 0.05;
        float ring2 = abs(sdTorus(tp * vec3(1.0, 0.7, 1.0), vec2(3.5, 0.08))) - 0.03;
        targetD = min(targetD, ring1);
        targetD = min(targetD, ring2);
        matId = 11; // Чёрный босс
        
      } else if (enemyType == 7) {
        // === СИНИЙ БОСС (телепортирующийся) ===
        // Мерцающая форма
        float flicker = abs(sin(u_time * 20.0)) * 0.3 + 0.7;
        float radius = 1.8 * flicker;
        targetD = sdSphere(tp, radius);
        
        // Электрические разряды
        float sparks = sin(tp.x * 15.0 + u_time * 30.0) 
                     * sin(tp.y * 15.0 + u_time * 25.0) * 0.1;
        targetD += sparks;
        
        // Призрачные копии
        vec3 ghost1 = tp - vec3(sin(u_time * 5.0) * 2.0, 0.0, cos(u_time * 5.0) * 2.0);
        vec3 ghost2 = tp + vec3(cos(u_time * 4.0) * 2.0, 0.0, sin(u_time * 4.0) * 2.0);
        targetD = min(targetD, sdSphere(ghost1, 0.5) - 0.1);
        targetD = min(targetD, sdSphere(ghost2, 0.5) - 0.1);
        matId = 12; // Синий босс
        
      } else if (enemyType == 1) {
        // === ФАНТОМ (чёрный шар) ===
        float distort = sin(u_time * 8.0 + tp.x * 5.0) * 0.08
                      + sin(u_time * 7.0 + tp.z * 6.0) * 0.06;
        float radius = 0.55 + distort;
        targetD = sdSphere(tp, radius);
        
        vec3 trail = tp + vec3(0.0, 0.0, 0.3);
        float trailD = sdSphere(trail, 0.3) - 0.1;
        targetD = min(targetD, trailD);
        matId = 5;
        
      } else if (enemyType == 2) {
        // === RUNNER (оранжевый, вытянутый) ===
        vec3 stretched = tp;
        stretched.x *= 0.6;
        float radius = 0.35;
        targetD = sdSphere(stretched, radius);
        
        float speedTrail = sdSphere(tp + vec3(0.3, 0.0, 0.0), 0.2);
        speedTrail = min(speedTrail, sdSphere(tp + vec3(0.5, 0.0, 0.0), 0.12));
        targetD = min(targetD, speedTrail);
        matId = 6;
        
      } else if (enemyType == 3) {
        // === HOPPER (синий, пружинистый) ===
        float squeeze = 1.0 + sin(u_time * 12.0) * 0.15;
        vec3 squashed = tp;
        squashed.y *= squeeze;
        float radius = 0.45;
        targetD = sdSphere(squashed, radius);
        
        vec3 ear1 = tp - vec3(0.2, 0.4, 0.0);
        vec3 ear2 = tp - vec3(-0.2, 0.4, 0.0);
        float ears = min(sdSphere(ear1, 0.12), sdSphere(ear2, 0.12));
        targetD = min(targetD, ears);
        matId = 7;
        
      } else if (enemyType == 4) {
        // === SPIKER (летающий шар с глазом-лазером) ===
        
        // Покачивание
        float bob = sin(u_time * 6.0 + float(i) * 2.0) * 0.2;
        vec3 bobbed = tp - vec3(0.0, bob, 0.0);
        
        // Вращение - глаз смотрит на камеру
        vec3 toCamera = normalize(u_cameraPos - target.xyz);
        
        // Основной шар тела
        float bodyRadius = 0.55;
        targetD = sdSphere(bobbed, bodyRadius);
        
        // Текстура на шаре - "прожилки"
        float veins = sin(bobbed.x * 15.0 + u_time * 2.0) 
                    * sin(bobbed.y * 12.0 + u_time * 1.5) 
                    * sin(bobbed.z * 15.0 + u_time * 2.5);
        targetD += veins * 0.02;
        
        // Пульсация
        float pulse = 1.0 + sin(u_time * 4.0 + float(i)) * 0.08;
        targetD *= pulse;
        
        // Глаз - выпуклость в направлении камеры
        vec3 eyeOffset = toCamera * 0.4;
        vec3 eyePos = bobbed - eyeOffset;
        float eyeBulge = sdSphere(eyePos, 0.35);
        targetD = min(targetD, eyeBulge);
        
        // Зрачок - в центре глаза (чёрный)
        vec3 pupilPos = bobbed - toCamera * 0.55;
        float pupilD = sdSphere(pupilPos, 0.15);
        
        // Радужка вокруг зрачка
        vec3 irisPos = bobbed - toCamera * 0.5;
        float irisD = sdSphere(irisPos, 0.25);
        
        // Маленькие шипы по краям
        for (int s = 0; s < 4; s++) {
          float angle = float(s) * 1.57 + u_time * 0.5;
          vec3 spikeDir = vec3(cos(angle), 0.0, sin(angle));
          vec3 spikePos = bobbed - spikeDir * 0.6;
          float spikeD = length(spikePos) - 0.08;
          targetD = min(targetD, spikeD);
        }
        
        // Определяем материал по расстоянию
        if (pupilD < 0.01) {
          matId = 28; // Зрачок (чёрный с красным свечением)
        } else if (irisD < eyeBulge) {
          matId = 29; // Радужка (красно-оранжевая)
        } else {
          matId = 26; // Тело спайкера
        }
        
      } else {
        // === БЕЙНЛИНГ (зелёная жижа) ===
        float wobble = sin(u_time * 4.0 + tp.x * 3.0) * 0.1
                     + sin(u_time * 3.0 + tp.y * 4.0) * 0.1
                     + sin(u_time * 5.0 + tp.z * 2.0) * 0.08;
        float radius = 0.7 + wobble;
        targetD = sdSphere(tp, radius);
        
        float bubbles = sin(tp.x * 8.0 + u_time * 2.0) 
                      * sin(tp.y * 8.0 + u_time * 1.5) 
                      * sin(tp.z * 8.0 + u_time * 2.5) * 0.05;
        targetD += bubbles;
        matId = 4;
      }
      
      if (targetD < d) {
        d = targetD;
        materialId = matId;
      }
    }
  }
  
  // === ФРАГМЕНТЫ ВРАГОВ (КАПЛИ ЖИЖИ) ===
  for (int i = 0; i < u_fragmentCount; i++) {
    if (i >= 4) break; // Оптимизация: было 16
    vec4 frag = u_fragments[i];
    if (frag.w > 0.0) {
      vec3 fp = p - frag.xyz;
      
      // Размер капли
      float dropSize = frag.w * 0.35;
      
      // Сфера (основа капли)
      float fragD = length(fp) - dropSize;
      
      // Деформация - вытянутая капля (больше вниз когда падает)
      float stretch = 1.0 + abs(fp.y) * 0.3; // Вытягивание
      vec3 stretched = vec3(fp.x, fp.y * 0.7, fp.z);
      fragD = length(stretched) - dropSize;
      
      // Волнистость поверхности (жижа колышется)
      float wobble = sin(fp.x * 15.0 + u_time * 8.0) * 
                     sin(fp.y * 12.0 + u_time * 6.0) * 
                     sin(fp.z * 15.0 + u_time * 7.0) * 0.02;
      fragD += wobble;
      
      if (fragD < d) {
        d = fragD;
        materialId = 200 + i; // Материал фрагмента
      }
    }
  }
  
  // === 4 КАМЕННЫХ ФОНАРЯ (ОПТИМИЗИРОВАНО) ===
  float lanternRadius = 28.0;
  
  // Проверяем близость к любому из 4 фонарей
  vec2 lp1 = p.xz - vec2(0.0, lanternRadius);
  vec2 lp2 = p.xz - vec2(0.0, -lanternRadius);
  vec2 lp3 = p.xz - vec2(lanternRadius, 0.0);
  vec2 lp4 = p.xz - vec2(-lanternRadius, 0.0);
  
  float dl1 = length(lp1);
  float dl2 = length(lp2);
  float dl3 = length(lp3);
  float dl4 = length(lp4);
  
  // Находим ближайший фонарь
  float minLDist = min(min(dl1, dl2), min(dl3, dl4));
  
  { // Фонари (всегда видны)
    // Определяем позицию ближайшего фонаря
    vec3 lPos = vec3(0.0, 0.0, lanternRadius);
    if (dl2 < dl1 && dl2 <= dl3 && dl2 <= dl4) lPos = vec3(0.0, 0.0, -lanternRadius);
    else if (dl3 <= dl1 && dl3 <= dl2 && dl3 <= dl4) lPos = vec3(lanternRadius, 0.0, 0.0);
    else if (dl4 <= dl1 && dl4 <= dl2 && dl4 <= dl3) lPos = vec3(-lanternRadius, 0.0, 0.0);
    
    vec3 lp = p - lPos;
    
    // Платформа (одна)
    float platform = sdBox(lp - vec3(0.0, 0.2, 0.0), vec3(1.0, 0.2, 1.0));
    if (platform < d) { d = platform; materialId = 64; }
    
    // Столб
    float pillar = sdBox(lp - vec3(0.0, 1.7, 0.0), vec3(0.25, 1.3, 0.25));
    if (pillar < d) { d = pillar; materialId = 60; }
    
    // Камера для огня (упрощённая)
    float chamber = sdBox(lp - vec3(0.0, 3.15, 0.0), vec3(0.4, 0.35, 0.4));
    if (chamber < d) { d = chamber; materialId = 60; }
    
    // Огонь (простой сферический)
    float flame = sdSphere(lp - vec3(0.0, 3.15, 0.0), 0.2);
    if (flame < d) { d = flame; materialId = 66; }
    
    // Крыша (упрощённая)
    float roof = sdBox(lp - vec3(0.0, 3.75, 0.0), vec3(0.6, 0.1, 0.6));
    if (roof < d) { d = roof; materialId = 60; }
  }
  
  return d;
}

// === RAY MARCHING (ТУРБО) ===
float rayMarch(vec3 ro, vec3 rd) {
  float d = 0.0;
  
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * d;
    float dist = map(p);
    
    if (dist < SURF_DIST) return d;
    if (d > MAX_DIST) break;
    
    // Консервативный шаг
    d += dist * 0.95;
  }
  
  // Финальная проверка пола на удалении (если луч направлен вниз)
  if (rd.y < -0.01 && ro.y > 0.0) {
    float floorT = -ro.y / rd.y;
    if (floorT > 0.0 && floorT < MAX_DIST && floorT > d * 0.8) {
      vec3 floorP = ro + rd * floorT;
      if (length(floorP.xz) < 40.0) {
        float floorDist = map(floorP);
        if (floorDist < 0.2) {
          return floorT;
        }
      }
    }
  }
  
  return MAX_DIST;
}

vec3 getNormal(vec3 p) {
  // Tetrahedron normals - 4 вызова вместо 6
  vec2 e = vec2(0.02, -0.02);
  return normalize(
    e.xyy * map(p + e.xyy) + 
    e.yyx * map(p + e.yyx) + 
    e.yxy * map(p + e.yxy) + 
    e.xxx * map(p + e.xxx)
  );
}

// === ДИНАМИЧЕСКИЕ ТЕНИ ОТ ВРАГОВ (оптимизировано) ===
float enemyShadow(vec3 p, vec4 targets[16], int targetCount) {
  // Только на полу (y < 0.5)
  if (p.y > 0.5) return 1.0;
  
  float shadow = 1.0;
  
  for (int i = 0; i < 4; i++) { // Оптимизация: было 8
    if (i >= targetCount) break;
    
    vec4 enemy = targets[i];
    if (enemy.w < 0.5) continue;
    
    vec2 toEnemy = p.xz - enemy.xz;
    float dist = length(toEnemy);
    if (dist > 3.0) continue; // Далеко - пропускаем
    
    float shadowStrength = smoothstep(1.5, 0.0, dist);
    shadow = min(shadow, 1.0 - shadowStrength * 0.5);
  }
  
  return shadow;
}

// === БЫСТРЫЕ ТЕНИ (2 шага) ===
float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
  // Один вызов map (оптимизация)
  float h = map(ro + rd * mint);
  return clamp(k * h / mint, 0.4, 1.0);
}

// === КОНТАКТНЫЕ ТЕНИ (2 шага) ===
float contactShadowRay(vec3 p, vec3 rd, float maxDist) {
  // Один вызов map (оптимизация)
  float h = map(p + rd * 0.2);
  return h < 0.05 ? 0.5 : 1.0;
}

// === FAKE ТЕНИ (дополнение) ===
float fakeShadow(vec3 p, float lightY) {
  float heightFade = smoothstep(0.0, 3.0, p.y);
  float distFromCenter = length(p.xz);
  float centerDark = smoothstep(10.0, 0.0, distFromCenter) * 0.2;
  return mix(0.5, 1.0, heightFade) - centerDark;
}

// === УЛУЧШЕННЫЙ AO (оптимизировано) ===
float calcAO(vec3 pos, vec3 nor) {
  // Фейковый AO без вызовов map() - на основе позиции
  float heightAO = smoothstep(-1.0, 3.0, pos.y) * 0.3 + 0.7;
  float cornerAO = 1.0 - abs(nor.y) * 0.2; // Углы темнее
  return heightAO * cornerAO;
}

// === КОНТАКТНЫЕ ТЕНИ ===
float contactShadow(vec3 p) {
  return smoothstep(-1.0, 2.0, p.y) * 0.5 + 0.5;
}

// === ПЛЁНОЧНАЯ ЗЕРНИСТОСТЬ (упрощённая) ===
float filmGrain(vec2 uv, float time) {
  float seed = dot(uv, vec2(12.9898, 78.233)) + time;
  return fract(sin(seed) * 43758.5453) - 0.5;
}

// === КАУСТИКИ (упрощённые) ===
float caustics(vec2 p, float t) {
  vec2 uv = p * 1.5 + vec2(sin(t * 0.3), cos(t * 0.4)) * 0.5;
  return pow(0.5 + 0.5 * sin(uv.x * 3.0 + uv.y * 2.0 + t), 3.0);
}

// === КАТАНА 3D (viewmodel) - КЛАССИЧЕСКАЯ ДЕТАЛИЗИРОВАННАЯ ===

// SDF капсулы
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

// SDF лезвия катаны - клиновидное сечение с острой кромкой
float sdKatanaBlade(vec3 p) {
  float scale = 0.18;  // Чуть крупнее
  vec3 sp = p / scale;
  
  // Длина лезвия
  float bladeLen = 2.2;
  
  // Изгиб катаны (сори) - характерный для японских мечей
  float curve = sp.y * sp.y * 0.012;
  sp.z -= curve;
  
  // Сужение к острию (киссаки)
  float taper = 1.0 - smoothstep(0.0, bladeLen, sp.y) * 0.6;
  float tipTaper = smoothstep(bladeLen - 0.4, bladeLen, sp.y);
  
  // === КЛИНОВИДНОЕ СЕЧЕНИЕ (синоги-дзукури) ===
  // Ширина лезвия (от спинки к кромке)
  float bladeWidth = 0.09 * taper * (1.0 - tipTaper * 0.5);
  
  // Толщина спинки (мунэ)
  float spineThick = 0.025 * taper;
  
  // Клиновидный профиль: толстая спинка → острая кромка
  // sp.x = ширина, sp.z = толщина
  float xDist = abs(sp.x) - bladeWidth;
  
  // Клин: толщина уменьшается от спинки (z+) к кромке (z-)
  float edgeZ = -spineThick * 0.3;  // Позиция режущей кромки
  float spineZ = spineThick;         // Позиция спинки
  
  // Линейная интерполяция толщины от кромки к спинке
  float normalizedX = clamp((abs(sp.x)) / bladeWidth, 0.0, 1.0);
  float thickAtX = mix(0.002, spineThick, normalizedX);  // Острая кромка = 2мм
  
  float zDist = abs(sp.z - (edgeZ + spineZ) * 0.5) - thickAtX;
  
  // Комбинируем
  float d2d = max(xDist, zDist);
  
  // Скругление кромки чтобы raymarching её видел
  d2d = d2d - 0.003;
  
  // Острие (киссаки) - плавное сужение
  float tipD = length(vec2(sp.x, sp.y - bladeLen + 0.1)) - 0.08 * (1.0 - tipTaper);
  d2d = mix(d2d, tipD, tipTaper * 0.7);
  
  float d = max(d2d, sp.y - bladeLen);  // Обрезать сверху
  d = max(d, -sp.y - 0.02);              // Обрезать снизу
  
  return d * scale;
}

// SDF рукояти (цука)
float sdKatanaHandle(vec3 p) {
  float scale = 0.15;
  vec3 sp = p / scale;
  
  // Овальное сечение рукояти
  float handleLen = 0.8;
  vec3 hp = sp - vec3(0.0, -handleLen * 0.5, 0.0);
  
  // Овал
  vec2 sz = vec2(0.055, 0.04);
  float d = length(hp.xz / sz) - 1.0;
  d = max(d * min(sz.x, sz.y), abs(hp.y) - handleLen * 0.5);
  
  // Касира (навершие) - торцевая крышка
  vec3 kashiraP = sp - vec3(0.0, -handleLen - 0.02, 0.0);
  float kashira = length(kashiraP / vec3(0.06, 0.03, 0.045)) - 1.0;
  kashira *= 0.03;
  d = min(d * scale, kashira * scale);
  
  return d;
}

// SDF цуба (гарда)
float sdKatanaGuard(vec3 p) {
  float scale = 0.15;
  vec3 sp = p / scale;
  
  // Круглая цуба с орнаментом
  float radius = 0.18;
  float thick = 0.015;
  
  // Основной диск
  float d = length(sp.xz) - radius;
  d = max(d, abs(sp.y) - thick);
  
  // Отверстие для лезвия
  float hole = length(sp.xz / vec2(0.13, 0.03)) - 1.0;
  d = max(d, -hole * 0.02);
  
  // Декоративные вырезы (сукаши)
  float angle = atan(sp.z, sp.x);
  float r = length(sp.xz);
  float pattern = sin(angle * 4.0) * 0.02;
  if (r > 0.12 && r < 0.16) {
    d = max(d, -abs(sp.y) + thick * 0.3 + pattern);
  }
  
  return d * scale;
}

// SDF хабаки (муфта между лезвием и гардой)
float sdKatanaHabaki(vec3 p) {
  float scale = 0.15;
  vec3 sp = p / scale;
  
  vec3 hp = sp - vec3(0.0, -0.02, 0.0);
  float d = length(hp.xz / vec2(0.08, 0.035)) - 1.0;
  d = max(d * 0.03, abs(hp.y) - 0.05);
  
  return d * scale;
}

// SDF сэппа (шайбы у гарды)
float sdKatanaSeppa(vec3 p, float yOffset) {
  float scale = 0.15;
  vec3 sp = p / scale;
  
  vec3 seppaP = sp - vec3(0.0, yOffset, 0.0);
  float d = length(seppaP.xz) - 0.1;
  d = max(d, abs(seppaP.y) - 0.008);
  
  return d * scale;
}

// Полная катана SDF
float sdKatana(vec3 p) {
  float blade = sdKatanaBlade(p);
  float handle = sdKatanaHandle(p);
  float guard = sdKatanaGuard(p);
  float habaki = sdKatanaHabaki(p);
  float seppa1 = sdKatanaSeppa(p, 0.015);
  float seppa2 = sdKatanaSeppa(p, -0.015);
  
  float d = min(blade, handle);
  d = min(d, guard);
  d = min(d, habaki);
  d = min(d, seppa1);
  d = min(d, seppa2);
  
  return d;
}

// Материал катаны (0=лезвие, 1=рукоять, 2=гарда, 3=металл.детали)
int getKatanaMaterial(vec3 p) {
  float blade = sdKatanaBlade(p);
  float handle = sdKatanaHandle(p);
  float guard = sdKatanaGuard(p);
  float habaki = sdKatanaHabaki(p);
  float seppa = min(sdKatanaSeppa(p, 0.015), sdKatanaSeppa(p, -0.015));
  
  float minD = blade;
  int mat = 0;
  
  if (handle < minD) { minD = handle; mat = 1; }
  if (guard < minD) { minD = guard; mat = 2; }
  if (habaki < minD || seppa < minD) { mat = 3; }
  
  return mat;
}

// Raymarching катаны (viewmodel - в экранном пространстве)
vec4 renderKatana(vec3 ro, vec3 rd, float attack, float bob, int charges, vec3 ambient, vec3 accentColor) {
  // Матрица камеры (из yaw и pitch) - такая же как в основном рендере
  float cy = cos(u_cameraYaw), sy = sin(u_cameraYaw);
  float cp = cos(u_cameraPitch), sp = sin(u_cameraPitch);
  
  // Базисные векторы камеры (совпадают с main)
  vec3 camForward = vec3(sy * cp, sp, -cy * cp);
  vec3 camRight = vec3(cy, 0.0, sy);
  vec3 camUp = cross(camRight, camForward);
  
  // Позиция катаны относительно камеры (ближе к центру)
  vec3 localOffset = vec3(0.06, -0.1, 0.32); // Почти по центру, чуть ниже
  
  // Покачивание при ходьбе
  localOffset.x += sin(bob) * 0.003;
  localOffset.y += abs(sin(bob * 2.0)) * 0.002;
  
  // Базовые углы катаны - лезвие видно сбоку
  float rotX = -1.1;  // Острие вперёд-вверх (видно плоскость лезвия)
  float rotZ = 0.25;  // Наклон вправо
  float rotY = 0.15;  // Лезвие повёрнуто к игроку
  
  // === УПРЕЖДАЮЩИЙ ЗАМАХ - катана заносится ПРОТИВОПОЛОЖНО врагу! ===
  if (u_katanaTargetAngle > -0.5 && attack < 0.1) {
    // Враг в зоне (до 6м) - готовимся к удару
    float targetInfluence = smoothstep(6.0, 3.0, u_katanaTargetDist);
    
    // Угол к врагу определяет сторону замаха
    float angleOffset = u_katanaTargetAngle;
    angleOffset = clamp(angleOffset, -0.8, 0.8);
    
    // Чем ближе враг - тем сильнее замах (до 3м - почти полный замах)
    float windUpAmount = smoothstep(5.0, 3.0, u_katanaTargetDist);
    
    if (angleOffset < 0.0) {
      // ВРАГ СЛЕВА → заносим ВПРАВО (удар пойдёт справа налево)
      rotX += windUpAmount * 0.7;     // Острие вверх
      rotZ += windUpAmount * 0.6;     // Вправо!
      rotY += windUpAmount * 0.5;     // Ладонь наружу
      
      localOffset.y += windUpAmount * 0.12;  // Рука вверх
      localOffset.x += windUpAmount * 0.08;  // Вправо!
    } else {
      // ВРАГ СПРАВА → заносим ВЛЕВО (удар пойдёт слева направо)
      rotX += windUpAmount * 0.8;     // Острие вверх
      rotZ -= windUpAmount * 0.7;     // Влево!
      rotY -= windUpAmount * 0.5;     // Ладонь внутрь
      
      localOffset.y += windUpAmount * 0.14;  // Рука вверх
      localOffset.x -= windUpAmount * 0.1;   // Влево!
    }
    
    // Лёгкое напряжение - дрожание готовности
    float tension = sin(u_time * 12.0) * 0.01 * targetInfluence;
    rotZ += tension;
    rotX += tension * 0.5;
  }
  
  // РЕАЛИСТИЧНАЯ АНИМАЦИЯ АТАКИ - КАК РУКОЙ
  if (attack > 0.0) {
    float t = attack;
    
    // Фазы: замах (0-0.12), удар (0.12-0.4), возврат (0.4-1.0)
    float windUp = smoothstep(0.0, 0.12, t);      // Замах
    float strike = smoothstep(0.12, 0.38, t);     // Удар
    float recover = smoothstep(0.42, 1.0, t);     // Возврат
    
    // Агрессивный easing для удара
    float strikeEase = 1.0 - pow(1.0 - strike, 5.0);
    float swingPower = strikeEase * (1.0 - recover);
    float windUpPower = windUp * (1.0 - strike);
    
    if (u_katanaAttackType == 0) {
      // === ТИП 0: УДАР СПРАВА СВЕРХУ (кэса-гири) ===
      // Рука поднимается вверх, ладонь разворачивается наружу
      
      // ЗАМАХ: рука идёт вверх-вправо, ладонь разворачивается
      rotX += windUpPower * 1.1;    // Острие вверх (рука поднимается)
      rotZ += windUpPower * 0.6;    // Вправо (плечо отводится)
      rotY += windUpPower * 0.7;    // Ладонь разворачивается наружу!
      
      // Позиция руки при замахе
      localOffset.y += windUpPower * 0.18;  // Рука вверх
      localOffset.x += windUpPower * 0.1;   // Плечо вправо
      localOffset.z -= windUpPower * 0.05;  // Отводим назад
      
      // УДАР: мощный рубящий сверху вниз по диагонали
      rotX -= swingPower * 2.0;     // Острие вниз (рука опускается)
      rotZ -= swingPower * 1.4;     // Влево (плечо вперёд)
      rotY -= swingPower * 0.3;     // Ладонь возвращается
      
      // Выпад руки вперёд
      localOffset.y -= swingPower * 0.14;
      localOffset.x -= swingPower * 0.12;
      localOffset.z += swingPower * 0.12;
      
    } else if (u_katanaAttackType == 1) {
      // === ТИП 1: УДАР СЛЕВА (гяку-кэса) ===
      // Рука заносится высоко влево, локоть ведёт
      
      // ЗАМАХ: рука высоко влево над плечом!
      rotX += windUpPower * 1.2;    // Острие высоко вверх
      rotZ -= windUpPower * 1.1;    // СИЛЬНО влево!
      rotY -= windUpPower * 0.8;    // Ладонь внутрь
      
      // Позиция руки при замахе - высоко и влево
      localOffset.y += windUpPower * 0.2;   // Рука ВЫСОКО вверх
      localOffset.x -= windUpPower * 0.15;  // Сильно влево
      localOffset.z -= windUpPower * 0.06;  // Отводим назад
      
      // УДАР: мощный диагональный взмах вправо-вниз
      rotX -= swingPower * 2.0;     // Острие резко вниз
      rotZ += swingPower * 2.0;     // Сильно вправо
      rotY += swingPower * 0.6;     // Ладонь разворачивается
      
      // Выпад вперёд и вправо
      localOffset.y -= swingPower * 0.14;
      localOffset.x += swingPower * 0.16;
      localOffset.z += swingPower * 0.1;
      
    } else {
      // === ТИП 2: СПЛЕШ (ёко-гири - горизонтальный) ===
      // Широкий горизонтальный взмах обеими руками
      
      // ЗАМАХ: рука отводится вправо, ладонь разворачивается
      rotZ += windUpPower * 0.7;
      rotY += windUpPower * 0.4;    // Ладонь наружу
      localOffset.x += windUpPower * 0.08;
      localOffset.z -= windUpPower * 0.03;
      
      // УДАР: мощный горизонтальный рубящий
      rotZ -= swingPower * 2.6;
      rotX -= swingPower * 0.25;
      rotY -= swingPower * 0.3;     // Ладонь возвращается
      
      localOffset.x -= swingPower * 0.2;
      localOffset.z += swingPower * 0.1;
    }
    
    // Встряска при ударе (импакт)
    if (t > 0.28 && t < 0.48) {
      float shake = sin(t * 180.0) * 0.005 * (1.0 - smoothstep(0.28, 0.48, t));
      localOffset.x += shake;
      localOffset.y += shake * 0.5;
    }
  }
  
  // Позиция катаны в мировых координатах (относительно камеры)
  vec3 katanaWorldPos = ro + camRight * localOffset.x + camUp * localOffset.y + camForward * localOffset.z;
  
  // Матрица локального поворота катаны (XYZ euler)
  float cx = cos(rotX), sx = sin(rotX);
  float cy2 = cos(rotY), sy2 = sin(rotY);
  float cz = cos(rotZ), sz = sin(rotZ);
  
  // Комбинированная матрица поворота ZYX
  mat3 localRot = mat3(
    cz * cy2, -sz * cx + cz * sy2 * sx, sz * sx + cz * sy2 * cx,
    sz * cy2, cz * cx + sz * sy2 * sx, -cz * sx + sz * sy2 * cx,
    -sy2, cy2 * sx, cy2 * cx
  );
  
  // Комбинированная матрица: локальный поворот + ориентация камеры
  mat3 camMat = mat3(camRight, camUp, camForward);
  mat3 rotMat = camMat * localRot;
  
  float t = 0.0;
  float maxDist = 1.0;
  
  for (int i = 0; i < 24; i++) { // Больше шагов для тонкого лезвия
    vec3 p = ro + rd * t;
    
    // Трансформация в локальное пространство катаны
    vec3 localP = transpose(rotMat) * (p - katanaWorldPos);
    
    float d = sdKatana(localP);
    
    if (d < 0.001) { // Точнее для тонкого лезвия
      vec3 hitP = localP;
      int mat = getKatanaMaterial(hitP);
      
      // Нормаль
      vec2 e = vec2(0.0005, 0.0);
      vec3 n = normalize(vec3(
        sdKatana(hitP + e.xyy) - sdKatana(hitP - e.xyy),
        sdKatana(hitP + e.yxy) - sdKatana(hitP - e.yxy),
        sdKatana(hitP + e.yyx) - sdKatana(hitP - e.yyx)
      ));
      // Трансформация нормали в мировое пространство
      n = rotMat * n;
      
      // Освещение от камеры + сверху
      vec3 lightDir = normalize(vec3(0.2, 0.8, -0.5));
      vec3 viewLight = normalize(vec3(0.0, 0.0, -1.0)); // От камеры
      float diff = max(dot(n, lightDir), 0.0) * 0.5 + 0.3;
      diff += max(dot(n, viewLight), 0.0) * 0.3;
      float spec = pow(max(dot(reflect(rd, n), lightDir), 0.0), 64.0);
      float viewSpec = pow(max(dot(reflect(rd, n), viewLight), 0.0), 32.0);
      
      vec3 color;
      
      if (mat == 0) {
        // ЛЕЗВИЕ - полированная сталь с хамоном
        vec3 steelColor = vec3(0.85, 0.88, 0.92);
        
        // Хамон (волнистая линия закалки)
        float hamonY = hitP.y * 0.15; // Масштаб
        float hamonLine = sin(hamonY * 80.0 + sin(hamonY * 30.0) * 2.0) * 0.003;
        float hamon = smoothstep(0.002, -0.002, hitP.z - hamonLine - 0.002);
        
        // Дзи (основа) темнее, якиба (закалённая часть) светлее
        vec3 ji = vec3(0.6, 0.62, 0.65);
        vec3 yakiba = vec3(0.95, 0.97, 1.0);
        steelColor = mix(ji, yakiba, hamon);
        
        color = steelColor * diff * ambient * 4.0;
        color += vec3(1.0) * (spec + viewSpec) * 0.9;
        
        // Режущая кромка - яркая линия
        float edge = smoothstep(0.002, 0.0, abs(hitP.z) - 0.001);
        color += vec3(1.0, 0.98, 0.95) * edge * 0.4;
        
        // Неоновый акцент на кромке
        color += accentColor * edge * 0.2;
        
        // Заряды - свечение
        if (charges > 0) {
          float scale = 0.15;
          for (int j = 0; j < 3; j++) {
            if (j < charges) {
              float cy = (0.3 + float(j) * 0.25) * scale;
              float dist = abs(hitP.y - cy);
              float glow = smoothstep(0.03, 0.0, dist);
              color += accentColor * glow * 0.6;
            }
          }
        }
        
      } else if (mat == 1) {
        // РУКОЯТЬ - чёрная с ито (обмоткой)
        vec3 handleBase = vec3(0.02, 0.02, 0.02); // Самэ (кожа ската) под обмоткой
        vec3 itoColor = vec3(0.08, 0.05, 0.12); // Шёлковая обмотка
        
        // Ромбовидный узор обмотки
        float scale = 0.15;
        float wrapY = hitP.y / scale;
        float wrapAngle = atan(hitP.z, hitP.x);
        float wrap = step(0.5, fract(wrapY * 12.0 + wrapAngle * 0.5));
        
        vec3 handleColor = mix(handleBase, itoColor, wrap);
        color = handleColor * diff * ambient * 3.0;
        
        // Неоновые линии между обмоткой
        float wrapGlow = smoothstep(0.52, 0.48, fract(wrapY * 12.0));
        color += accentColor * wrapGlow * 0.1 * (0.6 + 0.4 * sin(u_time * 2.0));
        
      } else if (mat == 2) {
        // ЦУБА (гарда) - тёмный металл с узором
        vec3 tsubaColor = vec3(0.12, 0.1, 0.08);
        
        // Патина
        float patina = hash(hitP.xz * 100.0) * 0.1;
        tsubaColor += vec3(0.0, patina * 0.5, patina);
        
        color = tsubaColor * diff * ambient * 3.5;
        color += vec3(0.3, 0.25, 0.2) * spec * 0.2;
        
        // Неоновый край
        float edgeDist = length(hitP.xz) - 0.025;
        float tsubaEdge = smoothstep(0.003, 0.0, abs(edgeDist));
        color += accentColor * tsubaEdge * 0.3;
        
      } else {
        // МЕТАЛЛИЧЕСКИЕ ДЕТАЛИ (хабаки, сэппа)
        vec3 brassColor = vec3(0.7, 0.55, 0.3); // Латунь
        color = brassColor * diff * ambient * 4.0;
        color += vec3(1.0, 0.9, 0.6) * spec * 0.5;
      }
      
      // Вспышка атаки
      if (attack > 0.3 && attack < 0.8) {
        float flash = sin((attack - 0.3) / 0.5 * 3.14159);
        color += accentColor * flash * 0.5;
      }
      
      return vec4(color, t);
    }
    
    t += d * 0.7; // Меньший шаг для точности тонкого лезвия
    if (t > maxDist) break;
  }
  
  // Не попали - прозрачно
  return vec4(0.0, 0.0, 0.0, -1.0);
}

// === НЕБО И ГОРИЗОНТ ===
vec3 renderSky(vec3 rd) {
  // Базовый цвет неба
  vec3 color = vec3(0.04, 0.05, 0.1);
  
  // Плавный градиент от зенита к горизонту
  float horizonFade = 1.0 - abs(rd.y);
  float horizonPow = horizonFade * horizonFade * horizonFade;
  
  // Горизонт - светлее и с дымкой
  vec3 horizonColor = vec3(0.08, 0.07, 0.12);  // Фиолетово-серая дымка
  vec3 horizonGlow = vec3(0.04, 0.08, 0.1);    // Циановый отсвет
  
  color = mix(color, horizonColor, horizonPow);
  color += horizonGlow * horizonFade * 0.5;
  
  // ФАЗА 2 ЗЕЛЁНОГО БОССА - ТОКСИЧНОЕ НЕБО
  if (u_greenBossPhase2 == 1) {
    float heightFade = smoothstep(-0.2, 0.8, rd.y);
    vec3 toxicGreen = mix(vec3(0.04, 0.12, 0.02), vec3(0.08, 0.3, 0.04), heightFade);
    color = toxicGreen;
    float clouds = sin(rd.x * 3.0 + u_time * 0.5) * sin(rd.z * 2.0 + u_time * 0.3) * 0.5 + 0.5;
    color += vec3(0.0, 0.15, 0.0) * clouds * 0.2;
    color *= (sin(u_time * 2.0) * 0.15 + 0.85);
    return color;
  }
  
  // Звёзды (только вверху)
  if (rd.y > 0.1) {
    vec2 skyUV = rd.xz / (rd.y + 0.3);
    float stars = hash(floor(skyUV * 100.0));
    if (stars > 0.975) {
      float starBright = (stars - 0.975) * 20.0 * rd.y;
      color += vec3(0.8, 0.85, 1.0) * starBright;
    }
  }
  
  // Луна - большая оранжевая
  vec3 moonDir = normalize(vec3(0.4, 0.5, -0.4));
  float moonDot = dot(rd, moonDir);
  
  // Основной диск луны (больше и объёмнее)
  float moon = smoothstep(0.96, 0.97, moonDot);
  
  // Объёмное затемнение к краям (как у настоящей луны)
  float moonEdge = smoothstep(0.97, 0.99, moonDot);
  vec3 moonCore = vec3(1.0, 0.7, 0.3); // Яркий оранжевый центр
  vec3 moonRim = vec3(0.9, 0.4, 0.1);  // Тёмный оранжевый край
  vec3 moonColor = mix(moonRim, moonCore, moonEdge);
  
  // Текстура кратеров (шум)
  float moonNoise = noise(rd.xy * 30.0) * 0.15;
  moonColor *= (0.9 + moonNoise);
  
  color += moonColor * moon * 1.5;
  
  // Свечение вокруг луны
  float moonGlow = pow(max(0.0, moonDot), 8.0);
  color += vec3(0.4, 0.2, 0.05) * moonGlow * 0.6;
  
  return color;
}

// === ЭФФЕКТ ДОЖДЯ И МОЛНИЙ ===

// Функция для вертикальных линий дождя
float rainStreak(vec2 uv, float speed, float density, float seed) {
  vec2 st = uv * vec2(density, 1.0);
  st.y = st.y * 0.1 - u_time * speed;
  
  float id = floor(st.x);
  float x = fract(st.x);
  float y = fract(st.y + fract(sin(id * seed) * 1000.0));
  
  // Тонкая вертикальная линия
  float streak = smoothstep(0.45, 0.5, x) * smoothstep(0.55, 0.5, x);
  // Ограничиваем длину капли
  streak *= smoothstep(0.0, 0.02, y) * smoothstep(0.15, 0.08, y);
  // Случайность появления
  streak *= step(0.7, fract(sin(id * 127.1 + seed) * 43758.5453));
  
  return streak;
}

// Функция молнии
float lightning(vec2 uv, float time, float seed) {
  // Позиция молнии по X (меняется каждые несколько секунд)
  float strikeTime = floor(time * 0.3 + seed);
  float strikeX = fract(sin(strikeTime * 127.1 + seed) * 43758.5453) * 2.0 - 1.0;
  
  // Фаза молнии (0-1 в пределах удара)
  float phase = fract(time * 0.3 + seed);
  
  // Молния видна только короткое время
  float visible = smoothstep(0.7, 0.75, phase) * smoothstep(0.95, 0.85, phase);
  
  // Основной канал молнии с зигзагами
  float bolt = 0.0;
  float x = strikeX;
  float segments = 4.0;
  
  for (float i = 0.0; i < segments; i++) {
    float segY = 1.0 - i / segments;
    float nextY = 1.0 - (i + 1.0) / segments;
    float nextX = x + (fract(sin((strikeTime + i) * 73.7) * 43758.5453) - 0.5) * 0.4;
    
    if (uv.y < segY && uv.y > nextY) {
      float t = (segY - uv.y) / (segY - nextY);
      float dist = abs(uv.x - mix(x, nextX, t));
      bolt += smoothstep(0.03, 0.0, dist) * 2.0;
    }
    x = nextX;
  }
  
  return bolt * visible;
}

// Предупреждающее свечение перед молнией
float lightningWarning(vec2 uv, float time, float seed) {
  float strikeTime = floor(time * 0.3 + seed);
  float strikeX = fract(sin(strikeTime * 127.1 + seed) * 43758.5453) * 2.0 - 1.0;
  float phase = fract(time * 0.3 + seed);
  
  // Свечение появляется перед ударом (фаза 0.5-0.7)
  float warning = smoothstep(0.5, 0.6, phase) * smoothstep(0.75, 0.65, phase);
  
  // Пульсация
  warning *= 0.5 + 0.5 * sin(time * 20.0);
  
  // Область свечения сверху
  float glow = smoothstep(0.3, 1.0, uv.y);
  glow *= smoothstep(0.5, 0.0, abs(uv.x - strikeX));
  
  return glow * warning;
}

// Кислотный дождь - капли только когда игрок В зоне
vec3 renderAcidRain(vec2 uv, vec3 color, float time, vec3 camPos) {
  if (u_acidRainZoneCount == 0) return color;
  
  vec3 result = color;
  float inRainIntensity = 0.0; // Игрок ВНУТРИ зоны дождя
  
  // Проверяем находится ли игрок в зоне дождя
  for (int i = 0; i < u_acidRainZoneCount; i++) {
    if (i >= 2) break; // Оптимизация: было 4
    vec4 zone = u_acidRainZones[i];
    if (zone.w >= 1.0) {
      float dist = length(camPos.xz - zone.xy);
      float zoneRadius = zone.z;
      // Только если игрок ВНУТРИ зоны (с небольшим запасом)
      if (dist < zoneRadius + 1.0) {
        inRainIntensity = max(inRainIntensity, 1.0 - dist / (zoneRadius + 1.0));
      }
    }
  }
  
  // Капли на экране ТОЛЬКО если игрок под дождём
  if (inRainIntensity > 0.01) {
    float drops = 0.0;
    
    // Толстые струи
    float y1 = fract(uv.y * 3.0 - time * 15.0);
    drops += step(0.0, y1) * step(y1, 0.5) * step(0.4, fract(uv.x * 3.0)) * step(fract(uv.x * 3.0), 0.6) * 0.5;
    
    float y1b = fract(uv.y * 3.0 - time * 18.0 + 0.33);
    drops += step(0.0, y1b) * step(y1b, 0.5) * step(0.4, fract(uv.x * 3.0 + 0.33)) * step(fract(uv.x * 3.0 + 0.33), 0.6) * 0.5;
    
    // Средние капли
    float y2 = fract(uv.y * 6.0 - time * 22.0);
    drops += step(0.1, y2) * step(y2, 0.4) * step(0.45, fract(uv.x * 6.0)) * step(fract(uv.x * 6.0), 0.55) * 0.3;
    
    // Мелкие капли
    float y3 = fract(uv.y * 10.0 - time * 28.0);
    drops += step(0.15, y3) * step(y3, 0.35) * step(0.47, fract(uv.x * 10.0)) * step(fract(uv.x * 10.0), 0.53) * 0.2;
    
    // Зелёные капли на экране
    result += vec3(0.2, 1.0, 0.1) * drops * inRainIntensity * 5.0;
    
    // Зелёная дымка когда под дождём
    result = mix(result, vec3(0.1, 0.5, 0.1), inRainIntensity * 0.35);
  }
  
  return result;
}

// === ЭФФЕКТ ВОЙДА - СТИЛЬ ЧЁРНОГО БОССА ===
// Рендерит skybox который вращается с камерой
// voidVariant: 0=багровый, 1=изумрудный, 2=золотой, 3=ледяной
vec3 renderVoidSky(vec3 rd, float time) {
  // Базовые цвета для разных вариантов войда
  vec3 baseSky, upColor, nebulaColor1, nebulaColor2, starColor1, starColor2;
  
  if (u_voidVariant == 0) {
    // БАГРОВЫЙ войд
    baseSky = vec3(0.04, 0.01, 0.02);
    upColor = vec3(0.1, 0.02, 0.05);
    nebulaColor1 = vec3(0.15, 0.02, 0.05);
    nebulaColor2 = vec3(0.1, 0.0, 0.03);
    starColor1 = vec3(0.8, 0.3, 0.3);
    starColor2 = vec3(1.0, 0.5, 0.4);
  } else if (u_voidVariant == 1) {
    // ИЗУМРУДНЫЙ войд
    baseSky = vec3(0.01, 0.04, 0.02);
    upColor = vec3(0.02, 0.1, 0.05);
    nebulaColor1 = vec3(0.02, 0.15, 0.08);
    nebulaColor2 = vec3(0.0, 0.1, 0.05);
    starColor1 = vec3(0.3, 0.8, 0.5);
    starColor2 = vec3(0.5, 1.0, 0.7);
  } else if (u_voidVariant == 2) {
    // ЗОЛОТОЙ войд
    baseSky = vec3(0.04, 0.03, 0.01);
    upColor = vec3(0.1, 0.08, 0.02);
    nebulaColor1 = vec3(0.15, 0.1, 0.02);
    nebulaColor2 = vec3(0.1, 0.06, 0.0);
    starColor1 = vec3(1.0, 0.8, 0.3);
    starColor2 = vec3(1.0, 0.9, 0.5);
  } else {
    // ЛЕДЯНОЙ войд (по умолчанию)
    baseSky = vec3(0.01, 0.02, 0.04);
    upColor = vec3(0.02, 0.05, 0.1);
    nebulaColor1 = vec3(0.02, 0.08, 0.15);
    nebulaColor2 = vec3(0.0, 0.05, 0.1);
    starColor1 = vec3(0.3, 0.5, 0.8);
    starColor2 = vec3(0.6, 0.8, 1.0);
  }
  
  vec3 skyColor = baseSky;
  
  // Градиент вверх - немного светлее
  float upGrad = max(0.0, rd.y);
  skyColor += upColor * upGrad * 0.5;
  
  // Градиент вниз - бездна
  float downGrad = max(0.0, -rd.y);
  skyColor = mix(skyColor, baseSky * 0.3, downGrad);
  
  // === ЗВЁЗДЫ (оптимизировано) ===
  vec3 starDir = normalize(rd);
  
  for (float i = 0.0; i < 20.0; i++) {
    vec3 starPos = normalize(vec3(
      sin(i * 73.1) * cos(i * 127.3),
      sin(i * 91.7) * cos(i * 173.1),
      cos(i * 47.3) * sin(i * 311.7)
    ));
    
    float starDist = length(starDir - starPos);
    float star = smoothstep(0.02, 0.0, starDist);
    skyColor += mix(starColor1, starColor2, fract(i * 0.37)) * star * 0.4;
  }
  
  // === ТУМАННОСТИ (упрощённые) ===
  float nebula = sin(rd.x * 3.0 + rd.z * 2.0) * cos(rd.y * 4.0);
  skyColor += nebulaColor1 * smoothstep(-0.3, 0.5, nebula) * 0.25;
  
  return skyColor;
}

// Старая функция для совместимости (не используется в новом войде)
vec3 renderVoid(vec2 uv, float fallOffset) {
  return vec3(0.0);
}

vec3 renderRain(vec2 uv, vec3 color, float time) {
  // Нормализуем UV для эффектов
  vec2 screenUV = uv;
  
  // === ДОЖДЬ ===
  float rain = 0.0;
  
  // Слой 1 - крупные яркие капли (передний план)
  rain += rainStreak(screenUV, 3.0, 80.0, 1.0) * 0.8;
  rain += rainStreak(screenUV + vec2(0.1, 0.0), 3.5, 90.0, 2.0) * 0.7;
  
  // Слой 2 - средние капли
  rain += rainStreak(screenUV, 2.5, 120.0, 3.0) * 0.5;
  rain += rainStreak(screenUV + vec2(0.05, 0.0), 2.8, 140.0, 4.0) * 0.4;
  
  // Слой 3 - мелкие капли (задний план)
  rain += rainStreak(screenUV, 2.0, 200.0, 5.0) * 0.3;
  
  // Цвет дождя - яркий голубой
  vec3 rainColor = vec3(0.6, 0.8, 1.0);
  color += rainColor * rain;
  
  // === МОЛНИИ ===
  // Несколько независимых молний с разным таймингом
  float bolt1 = lightning(screenUV, time, 0.0);
  float bolt2 = lightning(screenUV, time, 3.7);
  float bolt3 = lightning(screenUV, time, 7.3);
  
  float totalBolt = bolt1 + bolt2 + bolt3;
  
  // Цвет молнии - яркий бело-голубой
  vec3 boltColor = vec3(0.8, 0.9, 1.0);
  color += boltColor * totalBolt;
  
  // Вспышка освещения при ударе молнии
  float flash = max(bolt1, max(bolt2, bolt3));
  color = mix(color, vec3(0.9, 0.95, 1.0), flash * 0.3);
  
  // === ПРЕДУПРЕЖДАЮЩЕЕ СВЕЧЕНИЕ ===
  float warn1 = lightningWarning(screenUV, time, 0.0);
  float warn2 = lightningWarning(screenUV, time, 3.7);
  float warn3 = lightningWarning(screenUV, time, 7.3);
  
  float totalWarning = warn1 + warn2 + warn3;
  
  // Жёлто-белое свечение предупреждения
  vec3 warningColor = vec3(1.0, 0.95, 0.7);
  color += warningColor * totalWarning * 0.4;
  
  // === АТМОСФЕРА ШТОРМА ===
  // Тёмное грозовое небо
  color = mix(color, vec3(0.08, 0.1, 0.15), 0.2);
  
  return color;
}

// === ГЛАВНАЯ (ОПТИМИЗИРОВАННАЯ) ===
void main() {
  vec2 uv = (v_uv - 0.5) * 2.0;
  uv.x *= u_resolution.x / u_resolution.y;
  
  vec3 ro = u_cameraPos;
  
  float cy = cos(u_cameraYaw);
  float sy = sin(u_cameraYaw);
  float cp = cos(u_cameraPitch);
  float sp = sin(u_cameraPitch);
  
  vec3 forward = vec3(sy * cp, sp, -cy * cp);
  vec3 right = vec3(cy, 0.0, sy);
  vec3 up = cross(right, forward);
  
  vec3 rd = normalize(forward + uv.x * right + uv.y * up);
  
  // === РЕЖИМ ВОЙДА - СТИЛЬ ЧЁРНОГО БОССА ===
  if (u_voidMode == 1) {
    // Skybox - вращается с камерой
    vec3 voidSky = renderVoidSky(rd, u_time);
    
    // Рендерим врагов, портал и острова
    float d = MAX_DIST;
    int hitMat = 0;
    vec3 hitPos = ro;
    
    // Ray march
    float marchDist = 0.0;
    for (int i = 0; i < MAX_STEPS; i++) {
      vec3 p = ro + rd * marchDist;
      float minD = MAX_DIST;
      
      // === ОСТРОВА - несколько платформ ===
      // Главный остров под игроком (уменьшен!)
      float mainIsland = length(vec2(p.x, p.z)) - 10.0; // Радиус 10
      float mainHeight = p.y + 0.5; // Толщина острова
      float mainD = max(mainIsland, mainHeight);
      mainD = max(mainD, -(p.y + 2.0)); // Нижняя граница
      if (mainD < minD) {
        minD = mainD;
        hitMat = 100; // ground
      }
      
      // Остров у портала (маленький!)
      vec2 portalIslandPos = u_portalPos.xz;
      float portalIsland = length(p.xz - portalIslandPos) - 5.0; // Радиус 5
      float portalIslandH = p.y + 0.5;
      float portalIslandD = max(portalIsland, portalIslandH);
      portalIslandD = max(portalIslandD, -(p.y + 2.0));
      if (portalIslandD < minD) {
        minD = portalIslandD;
        hitMat = 100;
      }
      
      // Обломки между островами (прыгать!)
      vec2 toPortal = normalize(portalIslandPos);
      float bridgeLen = length(portalIslandPos) - 5.0 - 10.0; // Длина дорожки (портал 5 + главный 10)
      
      // 3 обломка (оптимизировано)
      for (int i = 0; i < 3; i++) { // Было 8
        // Позиция обломка вдоль дорожки (начинаем после главного острова)
        float fragmentPos = 12.0 + float(i) * (bridgeLen / 7.0);
        
        // Случайное смещение в стороны и по высоте
        float randX = sin(float(i) * 73.1) * 2.0;
        float randZ = cos(float(i) * 47.3) * 2.0;
        float randY = sin(float(i) * 91.7) * 0.8 - 0.3; // Разная высота
        
        // Случайный размер (2-4м)
        float fragmentSize = 2.0 + fract(sin(float(i) * 127.3) * 43758.5) * 2.0;
        
        // Позиция обломка
        vec3 fragmentCenter = vec3(
          toPortal.x * fragmentPos + randX,
          randY,
          toPortal.y * fragmentPos + randZ
        );
        
        // Неровная форма - используем смесь бокса и сферы
        vec3 fp = p - fragmentCenter;
        
        // Вращаем каждый обломок по-разному
        float rotAngle = float(i) * 0.7;
        vec3 rotFp = vec3(
          fp.x * cos(rotAngle) - fp.z * sin(rotAngle),
          fp.y,
          fp.x * sin(rotAngle) + fp.z * cos(rotAngle)
        );
        
        // Неровный бокс (разные размеры по осям)
        float sizeX = fragmentSize * (0.8 + fract(sin(float(i) * 31.7) * 100.0) * 0.4);
        float sizeZ = fragmentSize * (0.8 + fract(sin(float(i) * 57.3) * 100.0) * 0.4);
        float fragmentD = max(max(abs(rotFp.x) - sizeX, abs(rotFp.y) - 0.5), abs(rotFp.z) - sizeZ);
        
        if (fragmentD < minD) {
          minD = fragmentD;
          hitMat = 101; // Обломок
        }
      }
      
      // Портал выхода (светящаяся сфера)
      float portalD = length(p - u_portalPos) - 3.0;
      if (portalD < minD) {
        minD = portalD;
        hitMat = 99; // portal
      }
      
      // Враги в войде
      for (int j = 0; j < u_targetCount; j++) {
        if (j >= 16) break;
        vec4 target = u_targets[j];
        if (target.w > 0.5) {
          vec3 tp = p - target.xyz;
          float enemyD = length(tp) - 0.6;
          if (enemyD < minD) {
            minD = enemyD;
            hitMat = 5; // phantom
          }
        }
      }
      
      // === ГЛИТЧ-МОНЕТЫ ===
      for (int c = 0; c < u_bloodCoinCount; c++) {
        if (c >= 12) break;
        vec4 coin = u_bloodCoins[c];
        if (coin.w > 0.5) {
          vec3 coinPos = coin.xyz;
          vec3 cp = p - coinPos;
          
          // Маленький глитч-куб с искажением
          float glitchOffset = sin(u_time * 20.0 + float(c) * 10.0) * 0.05;
          vec3 glitchP = cp + vec3(glitchOffset, 0.0, -glitchOffset);
          
          // Маленький кубик (0.2м)
          float coinD = max(max(abs(glitchP.x), abs(glitchP.y)), abs(glitchP.z)) - 0.15;
          
          // Второй смещённый куб для глитч-эффекта
          vec3 glitchP2 = cp + vec3(-glitchOffset * 0.5, glitchOffset, glitchOffset * 0.3);
          float cube2 = max(max(abs(glitchP2.x), abs(glitchP2.y)), abs(glitchP2.z)) - 0.12;
          coinD = min(coinD, cube2);
          
          if (coinD < minD) {
            minD = coinD;
            hitMat = 102; // glitch coin
          }
          
          // Глитч-аура вокруг монеты (меньше)
          float glow = length(cp) - 0.4;
          if (glow < minD && glow > 0.0) {
            minD = glow;
            hitMat = 103; // glitch glow
          }
        }
      }
      
      marchDist += minD;
      if (minD < SURF_DIST) {
        hitPos = p;
        d = marchDist;
        break;
      }
      if (marchDist > MAX_DIST) break;
    }
    
    vec3 color = voidSky;
    
    // Рендерим то, во что попали
    if (d < MAX_DIST) {
      if (hitMat == 100 || hitMat == 101) {
        // === ОСТРОВА - тёмный камень с фиолетовым свечением ===
        vec3 rockBase = vec3(0.03, 0.02, 0.05);
        
        // Текстура камня
        float noise = sin(hitPos.x * 3.0) * sin(hitPos.z * 3.0) * 0.5 + 0.5;
        noise += sin(hitPos.x * 7.0 + hitPos.z * 5.0) * 0.2;
        
        vec3 rockColor = mix(rockBase, vec3(0.06, 0.03, 0.1), noise);
        
        // Светящиеся трещины (фиолетовые)
        float cracks = sin(hitPos.x * 5.0) * cos(hitPos.z * 4.0);
        cracks = smoothstep(0.7, 0.9, abs(cracks));
        rockColor += vec3(0.2, 0.05, 0.4) * cracks * 0.5;
        
        // Края острова светятся
        float edgeDist = length(hitPos.xz);
        if (hitMat == 100 && edgeDist > 12.0) {
          float edgeGlow = smoothstep(12.0, 15.0, edgeDist);
          rockColor += vec3(0.15, 0.05, 0.3) * edgeGlow;
        }
        
        // Мост немного другой цвет
        if (hitMat == 101) {
          rockColor = mix(rockColor, vec3(0.05, 0.02, 0.08), 0.3);
        }
        
        // Затухание с расстоянием
        float fogDist = d / 100.0;
        rockColor = mix(rockColor, voidSky, smoothstep(0.3, 1.0, fogDist));
        
        color = rockColor;
      } else if (hitMat == 99) {
        // === ПОРТАЛ ВЫХОДА - фиолетовое свечение ===
        float pulse = sin(u_time * 3.0) * 0.3 + 0.7;
        vec3 portalCore = vec3(0.6, 0.2, 1.0) * pulse;
        vec3 portalEdge = vec3(0.3, 0.1, 0.6);
        
        // Fresnel
        float fresnel = pow(1.0 - max(0.0, dot(-rd, normalize(hitPos - ro))), 2.0);
        color = mix(portalCore, portalEdge, fresnel);
        
        // Искры
        float spark = sin(u_time * 15.0 + hitPos.y * 8.0 + hitPos.x * 6.0);
        if (spark > 0.85) {
          color += vec3(0.8, 0.5, 1.0) * 0.5;
        }
        
        // Свечение
        color += vec3(0.3, 0.1, 0.5) * (1.0 - fresnel) * 0.6;
      } else if (hitMat == 5) {
        // === ВРАГИ - как фантомы босса ===
        vec3 phantomBlack = vec3(0.01, 0.0, 0.02);
        vec3 phantomGlow = vec3(0.2, 0.05, 0.35);
        
        // Мерцание
        float flicker = 0.6 + 0.4 * sin(u_time * 12.0 + hitPos.x * 5.0);
        vec3 enemyColor = phantomBlack * flicker;
        
        // Фиолетовое свечение по краям
        float fresnel = pow(1.0 - max(0.0, dot(-rd, normalize(hitPos - ro))), 3.0);
        color = mix(enemyColor, phantomGlow, fresnel * 0.8);
        
        // Тёмные искры
        float spark = sin(u_time * 10.0 + hitPos.y * 15.0);
        if (spark > 0.9) {
          color += vec3(0.3, 0.1, 0.5) * 0.3;
        }
      } else if (hitMat == 102) {
        // === ГЛИТЧ-МОНЕТА ===
        vec3 glitchCyan = vec3(0.0, 1.0, 1.0);
        vec3 glitchMagenta = vec3(1.0, 0.0, 1.0);
        vec3 glitchWhite = vec3(1.0, 1.0, 1.0);
        
        // Хаотичное мерцание между цветами
        float glitchNoise = fract(sin(dot(hitPos.xy + u_time * 30.0, vec2(12.9898, 78.233))) * 43758.5453);
        vec3 coinColor = mix(glitchCyan, glitchMagenta, step(0.5, glitchNoise));
        
        // Белые вспышки
        if (glitchNoise > 0.85) {
          coinColor = glitchWhite;
        }
        
        // RGB сдвиг
        float rgbShift = sin(u_time * 40.0) * 0.3;
        coinColor.r *= 1.0 + rgbShift;
        coinColor.b *= 1.0 - rgbShift;
        
        // Scanlines
        float scanline = step(0.5, fract(hitPos.y * 30.0 + u_time * 50.0));
        coinColor *= 0.7 + scanline * 0.5;
        
        // Яркий
        coinColor *= 4.0;
        
        color = coinColor;
        
      } else if (hitMat == 103) {
        // === ГЛИТЧ-АУРА ===
        vec3 glitchCyan = vec3(0.0, 0.8, 1.0);
        vec3 glitchMagenta = vec3(1.0, 0.0, 0.8);
        
        // Быстрое мерцание
        float flicker = fract(sin(u_time * 50.0 + hitPos.x * 20.0) * 100.0);
        color = mix(glitchCyan, glitchMagenta, step(0.5, flicker)) * 0.8;
        
        // Случайные пиксели
        float noise = fract(sin(dot(hitPos.xz + u_time * 10.0, vec2(12.9898, 78.233))) * 43758.5453);
        if (noise > 0.9) {
          color = vec3(1.0) * 2.0;
        }
      }
    }
    
    // Фиолетовая виньетка
    float vig = 1.0 - length(v_uv - 0.5) * 0.5;
    color *= vig;
    
    // Усиливаем фиолетовый
    color.b *= 1.1;
    
    // Тонмаппинг
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(0.9));
    
    fragColor = vec4(color, 1.0);
    return;
  }
  
  float d = rayMarch(ro, rd);
  
  // Небо как фон (полная яркость)
  vec3 skyColor = renderSky(rd);
  vec3 color = skyColor;
  
  if (d < MAX_DIST) {
    vec3 p = ro + rd * d;
    vec3 n = getNormal(p);
    
    map(p);
    int mat = materialId;
    
    // === ОСВЕЩЕНИЕ ПО ЭПОХАМ ===
    vec3 ambient;
    vec3 mainLight;
    vec3 accentColor;
    vec3 fogColor;
    
    if (u_era == 1) {
      // ЭПОХА 1: Кислотный киберпанк
      ambient = vec3(0.08, 0.12, 0.08);
      mainLight = vec3(0.4, 0.6, 0.4);
      accentColor = vec3(0.3, 1.0, 0.4);
      fogColor = vec3(0.03, 0.05, 0.03);
    } else if (u_era == 2) {
      // ЭПОХА 2: Фиолетовый киберпанк
      ambient = vec3(0.08, 0.06, 0.12);
      mainLight = vec3(0.4, 0.3, 0.55);
      accentColor = vec3(0.8, 0.2, 1.0);
      fogColor = vec3(0.04, 0.03, 0.06);
    } else {
      // ЭПОХА 3: Бирюзовый киберпанк
      ambient = vec3(0.06, 0.1, 0.12);
      mainLight = vec3(0.35, 0.5, 0.55);
      accentColor = vec3(0.0, 0.9, 1.0);
      fogColor = vec3(0.03, 0.05, 0.07);
    }
    
    // === ЕДИНАЯ СИСТЕМА ОСВЕЩЕНИЯ ===
    
    // Цветовая палитра
    vec3 cyan = vec3(0.2, 0.9, 1.0);
    vec3 magenta = vec3(1.0, 0.2, 0.6);
    vec3 warmLight = vec3(1.0, 0.85, 0.7);
    
    // AO
    float ao = calcAO(p, n);
    
    // --- KEY LIGHT (луна - тёплый оранжевый) ---
    vec3 keyDir = normalize(vec3(0.4, 0.5, -0.4)); // Совпадает с moonDir
    float keyDiff = max(dot(n, keyDir), 0.0);
    float keyWrap = max(dot(n, keyDir) * 0.5 + 0.5, 0.0); // Wrap lighting для мягкости
    float keyShadow = u_shadowsEnabled == 1 ? softShadow(p + n * 0.02, keyDir, 0.1, 30.0, 8.0) : 0.7;
    vec3 keyColor = vec3(1.0, 0.6, 0.25); // Тёплый оранжевый от луны
    vec3 keyLight = keyColor * mix(keyDiff, keyWrap, 0.3) * keyShadow * 0.9;
    
    // --- FILL LIGHT (тёплый снизу, сильнее) ---
    vec3 fillDir = normalize(vec3(-0.2, -0.6, 0.3));
    float fillDiff = max(dot(n, -fillDir), 0.0) * 0.4 + 0.15;
    vec3 fillColor = vec3(1.0, 0.7, 0.4); // Тёплый оранжевый
    vec3 fillLight = fillColor * fillDiff * 0.2;
    
    // --- RIM LIGHT (контурный свет сзади) ---
    vec3 rimDir = normalize(vec3(-0.5, 0.3, 0.8));
    float rimDot = 1.0 - max(dot(n, -rd), 0.0);
    float rimLight = pow(rimDot, 3.0) * max(dot(n, rimDir), 0.0);
    vec3 rimColor = mix(cyan, accentColor, 0.5) * rimLight * 0.4;
    
    // --- НЕОНОВЫЕ ИСТОЧНИКИ (4 столба) ---
    vec3 neonLight = vec3(0.0);
    float nR = 25.0, nH = 4.0;
    
    // Север - циан
    vec3 toN1 = vec3(0.0, nH, nR) - p;
    neonLight += cyan * max(dot(n, normalize(toN1)), 0.0) * 20.0 / (1.0 + length(toN1) * 0.1);
    
    // Юг - маджента
    vec3 toN2 = vec3(0.0, nH, -nR) - p;
    neonLight += magenta * max(dot(n, normalize(toN2)), 0.0) * 20.0 / (1.0 + length(toN2) * 0.1);
    
    // Восток/Запад - акцент
    vec3 toN3 = vec3(nR, nH, 0.0) - p;
    vec3 toN4 = vec3(-nR, nH, 0.0) - p;
    neonLight += accentColor * max(dot(n, normalize(toN3)), 0.0) * 18.0 / (1.0 + length(toN3) * 0.1);
    neonLight += accentColor * max(dot(n, normalize(toN4)), 0.0) * 18.0 / (1.0 + length(toN4) * 0.1);
    
    // --- ЦЕНТРАЛЬНЫЙ ИСТОЧНИК ---
    vec3 toCenter = vec3(0.0, 2.0, 0.0) - p;
    float centerPulse = 0.8 + 0.2 * sin(u_time * 2.5);
    vec3 centerLight = accentColor * max(dot(n, normalize(toCenter)), 0.0) * 15.0 / (1.0 + length(toCenter) * 0.08) * centerPulse;
    
    // --- SPECULAR ---
    vec3 halfVec = normalize(keyDir - rd);
    float spec = pow(max(dot(n, halfVec), 0.0), 48.0);
    vec3 specColor = vec3(1.0, 0.95, 0.9) * spec * keyShadow * 0.5;
    // Дополнительный блик от неона
    float neonSpec = pow(max(dot(n, normalize(vec3(0.0, 1.0, 0.0) - rd)), 0.0), 32.0);
    specColor += mix(cyan, magenta, 0.5) * neonSpec * 0.4;
    // Блик от rim
    specColor += accentColor * pow(rimDot, 5.0) * 0.25;
    // Блик от rimlight
    specColor += accentColor * pow(rimDot, 5.0) * 0.3;
    
    // --- СОБИРАЕМ ---
    ambient = vec3(0.04, 0.045, 0.06) * (0.4 + ao * 0.6);
    vec3 torchLight = keyLight + fillLight + rimColor + neonLight * 0.15 + centerLight * 0.25;
    torchLight *= ao;
    
    // mainDot для материалов
    float mainDot = keyDiff * keyShadow * 0.6 + 0.2;
    
    // Подсветка пола
    float distFromCenter = length(p.xz);
    vec3 poolLight = accentColor * smoothstep(20.0, 0.0, distFromCenter) * 0.3;
    
    // === МАТЕРИАЛЫ (упрощённые) ===
    if (mat == 1) {
      // === ВОДА (стилизованная) ===
      vec3 waterDeep = vec3(0.02, 0.08, 0.12);
      vec3 waterMid = vec3(0.05, 0.15, 0.2);
      vec3 waterSurface = vec3(0.1, 0.25, 0.3);
      
      // Глубина воды
      float depth = smoothstep(0.0, 2.0, -p.y + 1.0);
      vec3 waterColor = mix(waterDeep, waterMid, depth);
      
      // Волны на поверхности
      float wave = sin(p.x * 3.0 + u_time * 1.5) * sin(p.z * 2.5 + u_time * 1.2) * 0.5 + 0.5;
      waterColor = mix(waterColor, waterSurface, wave * 0.3);
      
      // Неоновые отражения
      waterColor += accentColor * 0.1 * smoothstep(5.0, 0.0, length(p.xz));
      
      // Fresnel
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      color = waterColor;
      color += vec3(0.2, 0.3, 0.35) * fresnel * 0.4;
      
    } else if (mat >= 4 && mat <= 12) {
      // === ВРАГИ (стилизованные) ===
      
      vec3 enemyBase = vec3(0.15);
      vec3 enemyGlow = vec3(0.5);
      float glowStrength = 0.3;
      
      if (mat == 4) {
        // БЕЙНЛИНГ - токсичный зелёный
        float pulse = 0.8 + 0.2 * sin(u_time * 3.0 + p.x * 2.0);
        enemyBase = vec3(0.05, 0.2, 0.05) * pulse;
        enemyGlow = vec3(0.3, 0.8, 0.2);
        glowStrength = 0.4;
        
      } else if (mat == 5) {
        // ФАНТОМ - тёмный фиолетовый
        float flicker = 0.7 + 0.3 * sin(u_time * 8.0 + p.x * 4.0);
        enemyBase = vec3(0.04, 0.02, 0.08) * flicker;
        enemyGlow = vec3(0.4, 0.15, 0.6);
        glowStrength = 0.5;
      
    } else if (mat == 6) {
        // RUNNER - тёплый оранжевый
        float flame = 0.7 + 0.3 * sin(u_time * 12.0 + p.x * 6.0);
        enemyBase = vec3(0.4, 0.12, 0.02) * flame;
        enemyGlow = vec3(0.9, 0.5, 0.1);
        glowStrength = 0.35;
        
      } else if (mat == 7) {
        // HOPPER - холодный синий
        float spark = sin(u_time * 20.0 + p.y * 10.0) * 0.5 + 0.5;
        enemyBase = vec3(0.05, 0.15, 0.35) * (0.8 + spark * 0.2);
        enemyGlow = vec3(0.3, 0.6, 1.0);
        glowStrength = 0.4;
        
      } else if (mat == 8) {
        // SPIKER - пурпурный
        float pulse = 0.8 + 0.2 * sin(u_time * 6.0);
        enemyBase = vec3(0.15, 0.03, 0.2) * pulse;
        enemyGlow = vec3(0.6, 0.2, 0.8);
        glowStrength = 0.35;
        
      } else {
        // БОССЫ
        float pulse = 0.85 + 0.15 * sin(u_time * 2.0);
        if (mat == 10) {
          enemyBase = vec3(0.08, 0.35, 0.06) * pulse;
          enemyGlow = vec3(0.3, 0.9, 0.2);
        } else if (mat == 11) {
          enemyBase = vec3(0.03, 0.01, 0.06) * pulse;
          enemyGlow = vec3(0.4, 0.1, 0.7);
        } else {
          enemyBase = vec3(0.06, 0.12, 0.4) * pulse;
          enemyGlow = vec3(0.2, 0.5, 0.9);
        }
        glowStrength = 0.5;
      }
      
      // Матовая поверхность + мягкое свечение по краям
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.5);
      color = enemyBase + enemyGlow * fresnel * glowStrength;
      
    } else if (mat == 100) {
      // Placeholder для старого кода (не используется)
      vec3 blue = vec3(0.2, 0.4, 1.0);
      vec3 white = vec3(1.0);
      vec3 cyan = vec3(0.0, 0.8, 1.0);
      float spark1 = sin(u_time * 30.0 + p.y * 15.0);
      float spark2 = sin(u_time * 35.0 + p.x * 12.0);
      float electric = spark1 * spark2;
      
      color = mix(blue, cyan, 0.5 + 0.5 * sin(u_time * 8.0));
      
      // Яркие вспышки
      if (electric > 0.8) {
        color = mix(color, white, 0.7);
      }
      color *= 1.5;
      
      // Свечение
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.5);
      color += vec3(0.3, 0.6, 1.0) * fresnel * 0.8;
      
    } else if (mat >= 200 && mat < 232) {
      // === КАПЛИ ЖИЖИ (слизь разлетается!) ===
      int fragIndex = mat - 200;
      
      // Цвет слизи в зависимости от эпохи
      vec3 slimeColor;
      vec3 coreGlow; // Внутреннее свечение
      if (u_era == 1) {
        // Токсичная зелёная слизь
        slimeColor = vec3(0.2, 0.85, 0.3);
        coreGlow = vec3(0.4, 1.0, 0.2);
      } else if (u_era == 2) {
        // Тёмная фиолетовая слизь
        slimeColor = vec3(0.5, 0.1, 0.7);
        coreGlow = vec3(0.8, 0.2, 1.0);
      } else {
        // Огненная оранжевая слизь
        slimeColor = vec3(0.9, 0.4, 0.05);
        coreGlow = vec3(1.0, 0.6, 0.1);
      }
      
      // Полупрозрачность и внутреннее свечение (как желе)
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.5);
      
      // Подповерхностное рассеивание
      float sss = pow(max(0.0, dot(n, vec3(0.0, -1.0, 0.0))), 1.5) * 0.4;
      
      // Базовый цвет с внутренним свечением
      color = slimeColor * 0.6;
      color += coreGlow * (0.3 + sss);
      
      // Яркий блик (мокрая поверхность)
      vec3 lightDir = normalize(vec3(0.3, 1.0, -0.2));
      float spec = pow(max(0.0, dot(reflect(rd, n), lightDir)), 32.0);
      color += vec3(1.0) * spec * 0.8;
      
      // Френель (края ярче - полупрозрачность)
      color += coreGlow * fresnel * 0.6;
      
      // Пульсация (живая слизь)
      float pulse = 0.9 + 0.1 * sin(u_time * 15.0 + float(fragIndex) * 2.5);
      color *= pulse;
      
    } else if (mat == 10) {
      // === ЗЕЛЁНЫЙ БОСС (огромная токсичная жижа) ===
      vec3 toxicGreen = vec3(0.1, 0.9, 0.2);
      vec3 darkGreen = vec3(0.0, 0.4, 0.1);
      vec3 yellow = vec3(0.8, 1.0, 0.0);
      
      // Пульсирующее ядовитое свечение
      float pulse = 0.6 + 0.4 * sin(u_time * 3.0);
      color = mix(darkGreen, toxicGreen, pulse);
      
      // Пузыри на поверхности
      float bubbles = sin(p.x * 6.0 + u_time * 4.0) * sin(p.z * 6.0 + u_time * 3.0);
      if (bubbles > 0.7) {
        color = mix(color, yellow, 0.5);
      }
      
      // Яркое свечение
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += toxicGreen * fresnel * 1.5;
      color *= 2.0; // Очень яркий!
      
    } else if (mat == 11) {
      // === ЧЁРНЫЙ БОСС (искривляет пространство) ===
      vec3 voidBlack = vec3(0.02, 0.0, 0.05);
      vec3 purple = vec3(0.4, 0.0, 0.6);
      vec3 darkPurple = vec3(0.15, 0.0, 0.25);
      
      // Почти чёрный с пурпурным мерцанием
      float darkPulse = sin(u_time * 2.0 + p.y * 3.0) * 0.5 + 0.5;
      color = mix(voidBlack, darkPurple, darkPulse * 0.3);
      
      // Искривление видно как переливы
      float distortion = sin(u_time * 5.0 + p.x * 8.0) * sin(u_time * 4.0 + p.z * 8.0);
      if (distortion > 0.6) {
        color += purple * 0.3;
      }
      
      // Жуткое свечение по краям
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 4.0);
      color += purple * fresnel * 2.0;
      
      // Звёзды внутри (как чёрная дыра)
      float stars = sin(p.x * 30.0) * sin(p.y * 30.0) * sin(p.z * 30.0);
      if (stars > 0.95) {
        color += vec3(1.0, 1.0, 1.0) * 0.5;
      }
      
    } else if (mat == 12) {
      // === СИНИЙ БОСС (телепортирующийся) ===
      vec3 electricBlue = vec3(0.0, 0.5, 1.0);
      vec3 cyan = vec3(0.0, 1.0, 1.0);
      vec3 white = vec3(1.0, 1.0, 1.0);
      
      // Мерцание (телепорт эффект)
      float flicker = abs(sin(u_time * 25.0));
      color = mix(electricBlue, cyan, flicker);
      
      // Разряды
      float spark = sin(u_time * 50.0 + p.x * 20.0) * sin(u_time * 45.0 + p.y * 20.0);
      if (spark > 0.85) {
        color = white;
      }
      
      // Призрачность
      float ghost = sin(u_time * 8.0) * 0.3 + 0.7;
      color *= ghost;
      
      // Яркое свечение
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += cyan * fresnel * 1.5;
      color *= 1.8;
      
    } else if (mat == 13) {
      // === ТОКСИЧНАЯ ЛУЖА ===
      vec3 toxicGreen = vec3(0.2, 1.0, 0.3);
      vec3 darkGreen = vec3(0.0, 0.3, 0.1);
      
      // Пульсирующий эффект
      float pulse = 0.5 + 0.5 * sin(u_time * 4.0 + p.x * 2.0 + p.z * 2.0);
      color = mix(darkGreen, toxicGreen, pulse);
      
      // Пузыри
      float bubbles = sin(p.x * 10.0 + u_time * 5.0) * sin(p.z * 10.0 + u_time * 4.0);
      if (bubbles > 0.7) {
        color += vec3(0.3, 0.5, 0.1);
      }
      
      // Яркое свечение
      color *= 2.0;
      
    } else if (mat == 14) {
      // === ЛЕПЕСТКИ РОЗЫ (красные, бархатные) ===
      vec3 roseRed = vec3(0.8, 0.1, 0.15);
      vec3 roseDark = vec3(0.5, 0.05, 0.1);
      vec3 rosePink = vec3(1.0, 0.3, 0.4);
      
      // Градиент от центра к краям
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 1.5);
      color = mix(roseDark, roseRed, 0.5);
      color = mix(color, rosePink, fresnel * 0.3);
      
      // Бархатистая текстура
      float velvet = pow(max(0.0, dot(-rd, n)), 0.5);
      color *= (0.7 + velvet * 0.5);
      
      // Мягкая пульсация
      float pulse = 0.9 + 0.1 * sin(u_time * 2.0);
      color *= pulse;
      
      // Свечение
      color *= 1.8;
      
    } else if (mat == 15) {
      // === СТИМПАК ===
      // Жёлто-оранжевый энергетический шар
      vec3 stimYellow = vec3(1.0, 0.8, 0.2);
      vec3 stimOrange = vec3(1.0, 0.5, 0.1);
      
      // Быстрая пульсация
      float pulse = 0.5 + 0.5 * sin(u_time * 8.0);
      color = mix(stimOrange, stimYellow, pulse);
      
      // Электрические искры
      float spark = fract(sin(dot(p.xz + u_time * 10.0, vec2(12.9898, 78.233))) * 43758.5453);
      if (spark > 0.95) {
        color += vec3(1.0, 1.0, 0.5);
      }
      
      // Яркое свечение
      color *= 2.5;
      
    } else if (mat == 16) {
      // === БАЛКОН ===
      vec3 balconyColor = vec3(0.3, 0.25, 0.4); // Тёмно-фиолетовый
      
      // Светящиеся линии
      float gridX = step(0.9, fract(p.x * 2.0));
      float gridZ = step(0.9, fract(p.z * 2.0));
      float grid = max(gridX, gridZ);
      
      color = mix(balconyColor, accentColor, grid * 0.5);
      color += accentColor * 0.1; // Лёгкое свечение
      
    } else if (mat == 17) {
      // === ЗАРЯД КАТАНЫ (энергетическая сфера) ===
      vec3 chargeColor1 = vec3(0.0, 0.8, 1.0); // Бирюзовый
      vec3 chargeColor2 = vec3(0.0, 1.0, 1.0); // Циан
      vec3 chargeColor3 = vec3(0.5, 0.8, 1.0); // Светло-голубой
      
      // Интенсивная пульсация
      float pulse = 0.5 + 0.5 * sin(u_time * 6.0);
      float pulse2 = 0.5 + 0.5 * sin(u_time * 8.0 + 1.0);
      color = mix(chargeColor1, chargeColor2, pulse);
      color = mix(color, chargeColor3, pulse2 * 0.3);
      
      // Электрические разряды
      float spark = fract(sin(dot(p.xy + u_time * 10.0, vec2(12.9898, 78.233))) * 43758.5453);
      if (spark > 0.85) {
        color += vec3(1.0, 1.0, 1.0); // Белые искры
      }
      
      // Вращающиеся кольца энергии
      float ring = sin(atan(p.y, p.x) * 3.0 + u_time * 5.0);
      color += chargeColor2 * max(0.0, ring) * 0.3;
      
      // Очень яркое свечение
      color *= 4.0;
      
    } else if (mat == 18) {
      // === ЧЁРНЫЙ КРИСТАЛЛ СИЛЫ ===
      vec3 crystalBase = vec3(0.05, 0.02, 0.1); // Очень тёмный фиолетовый
      vec3 crystalGlow = vec3(0.3, 0.0, 0.5); // Фиолетовое свечение
      vec3 crystalEdge = vec3(0.8, 0.2, 1.0); // Яркие края
      
      // Пульсация
      float pulse = 0.5 + 0.5 * sin(u_time * 3.0);
      
      // Эффект внутреннего свечения
      float fresnel = pow(1.0 - abs(dot(n, -rd)), 3.0);
      
      // Энергетические линии на гранях
      float edge = fract(p.x * 5.0 + p.y * 5.0 + u_time * 2.0);
      edge = smoothstep(0.8, 1.0, edge);
      
      color = crystalBase;
      color += crystalGlow * fresnel * 2.0;
      color += crystalEdge * edge * 0.5;
      color += crystalGlow * pulse * 0.3;
      
      // Искры внутри
      float spark = fract(sin(dot(p.xyz + u_time * 5.0, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      if (spark > 0.95) {
        color += vec3(1.0, 0.5, 1.0); // Розовые искры
      }
      
      // Общее свечение
      color *= 2.5;
      
    } else if (mat == 19) {
      // === СНАРЯД КИСЛОТЫ ===
      vec3 acidCore = vec3(0.2, 1.0, 0.3);
      vec3 acidGlow = vec3(0.5, 1.0, 0.2);
      vec3 acidDark = vec3(0.1, 0.4, 0.1);
      
      float bubble = sin(p.x * 20.0 + u_time * 15.0) * 
                    sin(p.y * 20.0 + u_time * 12.0) * 
                    sin(p.z * 20.0 + u_time * 18.0);
      bubble = bubble * 0.5 + 0.5;
      
      float veins = sin(p.x * 10.0 + p.y * 15.0 + u_time * 5.0);
      veins = smoothstep(0.7, 1.0, veins);
      
      float fresnel = pow(1.0 - abs(dot(n, -rd)), 2.0);
      
      color = mix(acidDark, acidCore, bubble);
      color += acidGlow * veins * 0.5;
      color += acidGlow * fresnel * 2.0;
      
      float drip = sin(u_time * 8.0 + p.y * 10.0);
      color *= 0.8 + 0.2 * drip;
      color *= 3.0;
      
    } else if (mat == 20) {
      // === МЕТКА ДОЖДЯ ===
      float pulse = sin(u_time * 10.0) * 0.5 + 0.5;
      color = mix(vec3(1.0, 0.2, 0.0), vec3(0.3, 1.0, 0.2), pulse);
      color *= 4.0;
      
    } else if (mat == 21) {
      // === ЗОНА ДОЖДЯ НА ЗЕМЛЕ ===
      float pulse = sin(u_time * 5.0) * 0.3 + 0.7;
      color = vec3(0.1, 0.8, 0.2) * pulse * 3.0;
      
    } else if (mat == 22) {
      // === СТРУИ КИСЛОТНОГО ДОЖДЯ ===
      float flicker = sin(u_time * 20.0 + p.y * 5.0) * 0.3 + 0.7;
      color = vec3(0.2, 1.0, 0.3) * flicker * 2.0;
      
    } else if (mat == 23) {
      // === РАМКА ПОРТАЛА (обсидиан с руническим свечением) ===
      vec3 obsidian = vec3(0.02, 0.02, 0.03); // Глубокий чёрный
      vec3 obsidianHighlight = vec3(0.08, 0.06, 0.1); // Лёгкий фиолетовый отлив
      
      // Гладкая полированная поверхность
      float polish = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color = mix(obsidian, obsidianHighlight, polish * 0.3);
      
      // Руны вдоль рамки (светящиеся символы)
      float runeY = sin(p.y * 3.0) * sin(p.z * 3.0 + u_time * 0.5);
      float runePattern = smoothstep(0.6, 0.8, abs(runeY));
      vec3 runeGlow = vec3(1.0, 0.5, 0.1); // Оранжевое свечение
      color += runeGlow * runePattern * 0.4;
      
      // Отблеск огня изнутри
      vec3 fireGlow = vec3(1.0, 0.4, 0.1);
      float innerGlow = 1.0 - min(1.0, abs(p.z) / 2.0);
      float pulse = sin(u_time * 3.0) * 0.2 + 0.8;
      color += fireGlow * innerGlow * pulse * 0.3;
      
      // Металлический блеск
      float specular = pow(max(0.0, dot(reflect(rd, n), normalize(vec3(1.0, 1.0, 0.5)))), 30.0);
      color += vec3(1.0, 0.8, 0.6) * specular * 0.2;
      
    } else if (mat == 24) {
      // === ОГНЕННЫЙ ШАР ПОРТАЛА ===
      // Базовые цвета огня
      vec3 fireCore = vec3(1.0, 1.0, 0.8);    // Белое ядро
      vec3 fireYellow = vec3(1.0, 0.9, 0.3);  // Жёлтый
      vec3 fireOrange = vec3(1.0, 0.5, 0.1);  // Оранжевый
      vec3 fireRed = vec3(1.0, 0.2, 0.05);    // Красный
      vec3 fireDark = vec3(0.5, 0.1, 0.0);    // Тёмно-красный
      
      // Расстояние от центра шара
      float dist = length(p - vec3(sign(p.x) * 22.0, 2.0, 0.0));
      float normalDist = dist / 1.2; // 0 в центре, 1 на краю
      
      // Анимированные волны огня
      float flame1 = sin(p.y * 5.0 + p.z * 3.0 - u_time * 8.0) * 0.5 + 0.5;
      float flame2 = sin(p.y * 7.0 - p.z * 4.0 + u_time * 6.0) * 0.5 + 0.5;
      float flame3 = cos(p.y * 4.0 + p.z * 6.0 - u_time * 10.0) * 0.5 + 0.5;
      float flames = (flame1 + flame2 + flame3) / 3.0;
      
      // Градиент от центра к краям
      color = mix(fireCore, fireYellow, normalDist * 0.5);
      color = mix(color, fireOrange, normalDist * 0.8);
      color = mix(color, fireRed, normalDist);
      
      // Добавляем анимацию пламени
      color = mix(color, fireYellow, flames * (1.0 - normalDist) * 0.5);
      
      // Пульсация яркости
      float pulse = 0.8 + 0.2 * sin(u_time * 6.0);
      float pulse2 = 0.9 + 0.1 * sin(u_time * 15.0 + p.y * 10.0);
      color *= pulse * pulse2;
      
      // Яркость (умеренная)
      color *= 2.5;
      
      // Искры (яркие точки)
      float spark = sin(p.x * 30.0 + u_time * 20.0) * sin(p.y * 25.0 - u_time * 15.0) * sin(p.z * 28.0 + u_time * 18.0);
      if (spark > 0.88) {
        color += vec3(1.0, 0.9, 0.5) * 1.5;
      }
      
    } else if (mat == 25) {
      // === ПОСТАМЕНТ ПОРТАЛА (каменные ступени) ===
      vec3 stoneLight = vec3(0.18, 0.15, 0.12); // Светлый камень
      vec3 stoneMid = vec3(0.12, 0.10, 0.08);   // Средний тон
      vec3 stoneDark = vec3(0.06, 0.05, 0.04);  // Тёмный камень
      
      // Текстура камня - слои и трещины
      float noise1 = sin(p.x * 8.0) * sin(p.y * 12.0) * sin(p.z * 8.0);
      float noise2 = sin(p.x * 20.0 + p.z * 15.0) * 0.3;
      float noise3 = cos(p.y * 25.0 + p.x * 10.0) * 0.2;
      float stoneTexture = noise1 * 0.15 + noise2 * 0.1 + noise3 * 0.1;
      
      // Базовый цвет с текстурой
      color = mix(stoneDark, stoneMid, 0.5 + stoneTexture);
      
      // Светлые грани (верхние поверхности)
      if (n.y > 0.5) {
        color = mix(color, stoneLight, 0.4);
      }
      
      // Тёмные грани (боковые и нижние)
      if (n.y < -0.3) {
        color = mix(color, stoneDark, 0.5);
      }
      
      // Отблеск огня от портала
      vec3 fireGlow = vec3(1.0, 0.4, 0.1);
      float glowIntensity = sin(u_time * 3.0) * 0.15 + 0.25;
      float distToCenter = abs(p.z) / 3.0; // Ближе к центру - ярче
      float fireInfluence = max(0.0, 1.0 - distToCenter) * glowIntensity;
      color += fireGlow * fireInfluence * 0.3;
      
      // Патина/мох в углублениях
      float moss = sin(p.x * 30.0) * sin(p.z * 30.0);
      if (moss > 0.7 && n.y > 0.3) {
        color = mix(color, vec3(0.05, 0.12, 0.05), 0.2); // Зеленоватый оттенок
      }
      
      // Блики на гранях
      float edgeHighlight = pow(max(0.0, dot(n, normalize(vec3(1.0, 1.0, 0.5)))), 8.0);
      color += vec3(0.15, 0.12, 0.1) * edgeHighlight * 0.3;
      
    } else if (mat == 26) {
      // === ТЕЛО СПАЙКЕРА (органическая кожа с прожилками) ===
      vec3 skinBase = vec3(0.4, 0.15, 0.1);      // Тёмно-красная кожа
      vec3 skinLight = vec3(0.7, 0.25, 0.15);    // Светлые участки
      vec3 veinColor = vec3(0.2, 0.0, 0.05);     // Тёмные прожилки
      vec3 glowColor = vec3(1.0, 0.3, 0.1);      // Внутреннее свечение
      
      // Базовая текстура кожи - неровности
      float skinNoise = sin(p.x * 20.0 + u_time * 0.5) 
                      * sin(p.y * 18.0 + u_time * 0.3) 
                      * sin(p.z * 22.0 + u_time * 0.4);
      
      // Прожилки - сеть линий
      float veins = sin(p.x * 8.0 + p.y * 5.0) * sin(p.z * 7.0 + p.y * 3.0);
      veins = smoothstep(0.6, 0.9, abs(veins));
      
      // Пульсирующие "вены" под кожей
      float veinPulse = sin(u_time * 3.0 + length(p) * 5.0) * 0.5 + 0.5;
      
      // Собираем цвет
      color = mix(skinBase, skinLight, skinNoise * 0.3 + 0.3);
      color = mix(color, veinColor, veins * 0.4);
      
      // Внутреннее свечение (как будто внутри огонь)
      float innerGlow = pow(1.0 - max(0.0, dot(-rd, n)), 2.5);
      color += glowColor * innerGlow * veinPulse * 0.5;
      
      // Пульсация
      float pulse = 0.9 + 0.1 * sin(u_time * 4.0);
      color *= pulse;
      
      // Шипы по краям темнее
      float distFromCenter = length(p.xz);
      if (distFromCenter > 0.5) {
        color = mix(color, veinColor, 0.3);
      }
      
      // Подсветка
      color *= 1.4;
      
      // Fresnel - красноватый отблеск
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += glowColor * fresnel * 0.4;
      
    } else if (mat == 27) {
      // === ЛАЗЕР СПАЙКЕРА ===
      vec3 laserCore = vec3(1.0, 1.0, 1.0);   // Яркое белое ядро
      vec3 laserRed = vec3(1.0, 0.1, 0.0);    // Красный
      vec3 laserOrange = vec3(1.0, 0.4, 0.0); // Оранжевый
      
      // Пульсация
      float pulse = 0.8 + 0.2 * sin(u_time * 30.0 + p.x * 20.0 + p.y * 25.0);
      
      // Электрические разряды вдоль луча
      float spark = sin(u_time * 50.0 + length(p) * 30.0);
      
      // Ядро белое, края красно-оранжевые
      color = mix(laserCore, laserRed, 0.3);
      if (spark > 0.7) {
        color = mix(color, laserCore, 0.5); // Яркие вспышки
      }
      
      color *= pulse;
      color *= 5.0; // Очень ярко!
      
      // Fresnel свечение
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 1.0);
      color += laserOrange * fresnel * 2.0;
      
    } else if (mat == 28) {
      // === ЗРАЧОК СПАЙКЕРА (чёрный с красным свечением) ===
      vec3 pupilBlack = vec3(0.0, 0.0, 0.0);
      vec3 glowRed = vec3(1.0, 0.0, 0.0);
      
      color = pupilBlack;
      
      // Красное свечение изнутри
      float innerGlow = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      color += glowRed * innerGlow * 2.0;
      
      // Пульсация
      float pulse = 0.5 + 0.5 * sin(u_time * 4.0);
      color += glowRed * pulse * 0.3;
      
    } else if (mat == 29) {
      // === РАДУЖКА СПАЙКЕРА (красно-оранжевая, огненная) ===
      vec3 irisRed = vec3(0.9, 0.1, 0.0);
      vec3 irisOrange = vec3(1.0, 0.5, 0.0);
      vec3 irisYellow = vec3(1.0, 0.8, 0.2);
      
      // Радиальные полосы как в настоящем глазе
      float angle = atan(p.y, p.x);
      float radialPattern = sin(angle * 12.0 + u_time * 2.0) * 0.5 + 0.5;
      
      // Пульсирующие кольца
      float rings = sin(length(p) * 30.0 - u_time * 5.0) * 0.5 + 0.5;
      
      color = mix(irisRed, irisOrange, radialPattern);
      color = mix(color, irisYellow, rings * 0.3);
      
      // Огненное свечение
      color *= 2.0;
      
      // Блик
      float highlight = pow(max(0.0, dot(-rd, n)), 20.0);
      color += vec3(1.0, 0.9, 0.8) * highlight * 0.5;
      
    } else if (mat == 32) {
      // === КАМЕНЬ АЛТАРЯ ===
      vec3 stoneBase = vec3(0.2, 0.18, 0.15);     // Тёмный камень
      vec3 stoneLight = vec3(0.35, 0.3, 0.25);    // Светлые участки
      vec3 mossColor = vec3(0.1, 0.2, 0.1);       // Мох
      
      // Текстура камня
      float stoneNoise = sin(p.x * 10.0) * sin(p.y * 8.0) * sin(p.z * 12.0);
      
      color = mix(stoneBase, stoneLight, stoneNoise * 0.3 + 0.3);
      
      // Немного мха внизу
      float mossAmount = smoothstep(1.0, 0.0, p.y) * 0.3;
      color = mix(color, mossColor, mossAmount);
      
      // Резьба/узоры
      float carving = sin(p.y * 20.0) * sin(atan(p.x, p.z) * 8.0);
      color *= 0.9 + carving * 0.1;
      
      // Освещение
      float light = max(0.0, dot(n, normalize(vec3(1.0, 1.0, 0.5))));
      color *= 0.6 + light * 0.6;
      
    } else if (mat == 33) {
      // === ОГОНЬ В АЛТАРЕ ===
      vec3 fireWhite = vec3(1.0, 1.0, 0.9);
      vec3 fireOrange = vec3(1.0, 0.6, 0.1);
      vec3 fireRed = vec3(1.0, 0.2, 0.0);
      
      // Динамическое пламя
      float flame = sin(u_time * 15.0 + p.y * 10.0 + p.x * 5.0);
      float flicker = sin(u_time * 20.0 + p.z * 8.0);
      
      // Цвет от центра к краям
      float gradient = smoothstep(0.0, 1.0, p.y);
      color = mix(fireWhite, fireOrange, gradient);
      color = mix(color, fireRed, gradient * 0.5);
      
      // Мерцание
      color *= 0.8 + flame * 0.2 + flicker * 0.1;
      
      // Очень яркий
      color *= 4.0;
      
      // Свечение
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 1.5);
      color += fireOrange * fresnel * 2.0;
      
    } else if (mat == 34) {
      // === СВЕТЯЩИЙСЯ СИМВОЛ АЛТАРЯ ===
      vec3 glowCyan = vec3(0.0, 1.0, 0.8);
      vec3 glowWhite = vec3(1.0, 1.0, 1.0);
      
      // Пульсация
      float pulse = 0.7 + 0.3 * sin(u_time * 3.0);
      
      color = mix(glowCyan, glowWhite, 0.3);
      color *= pulse * 3.0;
      
      // Fresnel
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += glowCyan * fresnel * 1.5;
      
    } else if (mat == 35) {
      // === ЯДРО ЭНЕРГЕТИЧЕСКОГО ЛУЧА (ярко-белое) ===
      vec3 coreWhite = vec3(1.0, 1.0, 1.0);
      vec3 coreBlue = vec3(0.8, 0.9, 1.0);
      
      // Пульсация
      float pulse = 0.9 + 0.1 * sin(u_time * 30.0);
      
      // Ярко-белое ядро
      color = mix(coreWhite, coreBlue, 0.1);
      color *= pulse;
      
      // ОЧЕНЬ яркое!
      color *= 8.0;
      
      // Дополнительное свечение от fresnel
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 1.0);
      color += coreWhite * fresnel * 3.0;
      
    } else if (mat == 36) {
      // === ВНЕШНЕЕ СВЕЧЕНИЕ ЛУЧА (голубое) ===
      vec3 glowCyan = vec3(0.3, 0.8, 1.0);
      vec3 glowWhite = vec3(0.9, 0.95, 1.0);
      
      // Пульсация
      float pulse = 0.7 + 0.3 * sin(u_time * 25.0 + p.x * 5.0);
      
      color = mix(glowCyan, glowWhite, 0.4);
      color *= pulse * 4.0;
      
      // Fresnel для объёма
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += glowCyan * fresnel * 2.0;
      
    } else if (mat == 37) {
      // === СЛЕД ЛУЧА (затухающий) ===
      vec3 trailCyan = vec3(0.2, 0.6, 1.0);
      vec3 trailPurple = vec3(0.5, 0.2, 1.0);
      
      // Мерцание
      float flicker = sin(u_time * 40.0 + p.y * 10.0 + p.x * 15.0);
      
      // Цвет меняется по следу
      color = mix(trailCyan, trailPurple, 0.3 + flicker * 0.2);
      
      // Яркость
      color *= 2.5;
      
      // Искры
      if (flicker > 0.8) {
        color += vec3(1.0) * 1.5;
      }
      
    } else if (mat == 38) {
      // === ЦЕНТРАЛЬНЫЙ ПОРТАЛ (огненный вихрь как боковые) ===
      
      // Расстояние от центра
      float distFromCenter = length(p.xz);
      float normalizedDist = distFromCenter / 0.9;
      
      // Базовые цвета огня
      vec3 fireCore = vec3(1.0, 1.0, 0.8);    // Белое ядро
      vec3 fireYellow = vec3(1.0, 0.9, 0.3);  // Жёлтый
      vec3 fireOrange = vec3(1.0, 0.5, 0.1);  // Оранжевый
      vec3 fireRed = vec3(1.0, 0.2, 0.05);    // Красный
      
      // Анимированные волны огня
      float angle = atan(p.z, p.x);
      float flame1 = sin(angle * 6.0 + p.y * 5.0 - u_time * 8.0) * 0.5 + 0.5;
      float flame2 = sin(angle * 8.0 - p.y * 3.0 + u_time * 6.0) * 0.5 + 0.5;
      float flame3 = cos(angle * 4.0 + p.y * 6.0 - u_time * 10.0) * 0.5 + 0.5;
      float flames = (flame1 + flame2 + flame3) / 3.0;
      
      // Градиент от центра к краям
      color = mix(fireCore, fireYellow, normalizedDist * 0.4);
      color = mix(color, fireOrange, normalizedDist * 0.6 + flames * 0.3);
      color = mix(color, fireRed, normalizedDist * 0.8);
      
      // Вихревой эффект
      float swirl = sin(angle * 12.0 - u_time * 5.0) * 0.5 + 0.5;
      color += vec3(1.0, 0.6, 0.2) * swirl * (1.0 - normalizedDist) * 0.5;
      
      // Пульсация
      float pulse = 0.8 + 0.2 * sin(u_time * 5.0);
      color *= pulse;
      
      // Яркость
      color *= 3.0 * (1.0 - normalizedDist * 0.5);
      
    } else if (mat == 39) {
      // === СВЕЧЕНИЕ ПОРТАЛА (фиолетовое) ===
      vec3 glowPurple = vec3(0.6, 0.2, 1.0);
      vec3 glowPink = vec3(1.0, 0.4, 0.8);
      
      // Пульсация
      float pulse = 0.6 + 0.4 * sin(u_time * 5.0 + p.y * 2.0);
      
      // Вращение
      float angle = atan(p.z, p.x);
      float spin = sin(angle * 8.0 - u_time * 3.0) * 0.5 + 0.5;
      
      color = mix(glowPurple, glowPink, spin * 0.5);
      color *= pulse * 2.5;
      
      // Fresnel
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 1.5);
      color += glowPurple * fresnel * 1.5;
      
    } else if (mat == 40) {
      // === ЭНЕРГЕТИЧЕСКИЕ КОЛЬЦА ПОРТАЛА ===
      vec3 ringPurple = vec3(0.8, 0.3, 1.0);
      vec3 ringWhite = vec3(1.0, 0.9, 1.0);
      
      // Быстрая пульсация
      float pulse = 0.7 + 0.3 * sin(u_time * 15.0 + p.y * 5.0);
      
      color = mix(ringPurple, ringWhite, 0.3);
      color *= pulse * 4.0;
      
      // Искры
      float sparkle = sin(u_time * 30.0 + p.x * 10.0 + p.z * 12.0);
      if (sparkle > 0.85) {
        color += vec3(1.0) * 2.0;
      }
      
    } else if (mat == 41) {
      // === ГРАНАТА (обычная, зелёная) ===
      vec3 grenadeGreen = vec3(0.2, 0.5, 0.2);
      vec3 grenadeBlack = vec3(0.1, 0.1, 0.1);
      
      // Полоски на гранате
      float stripes = sin(p.y * 20.0);
      color = mix(grenadeGreen, grenadeBlack, stripes * 0.3 + 0.35);
      
      // Металлический блеск
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += vec3(0.4, 0.5, 0.4) * fresnel * 0.5;
      
    } else if (mat == 42) {
      // === ГРАНАТА (мигает перед взрывом) ===
      vec3 grenadeRed = vec3(1.0, 0.2, 0.1);
      vec3 grenadeYellow = vec3(1.0, 0.8, 0.2);
      
      // Быстрое мигание
      float blink = sin(u_time * 30.0) * 0.5 + 0.5;
      color = mix(grenadeRed, grenadeYellow, blink);
      
      // Яркое свечение
      color *= 3.0;
      
    } else if (mat == 43) {
      // === ВЗРЫВ (GLITCH ЭФФЕКТ) ===
      // Базовые цвета глитча
      vec3 glitchCyan = vec3(0.0, 1.0, 1.0);
      vec3 glitchMagenta = vec3(1.0, 0.0, 1.0);
      vec3 glitchWhite = vec3(1.0, 1.0, 1.0);
      vec3 glitchBlack = vec3(0.0, 0.0, 0.0);
      
      // Хаотичный шум для глитча
      float glitchNoise = fract(sin(dot(p.xy + u_time * 50.0, vec2(12.9898, 78.233))) * 43758.5453);
      float blockNoise = floor(glitchNoise * 8.0) / 8.0;
      
      // Горизонтальные полосы сбоя
      float scanline = step(0.5, fract(p.y * 20.0 + u_time * 100.0));
      
      // RGB сдвиг
      float rgbShift = sin(u_time * 30.0 + p.y * 5.0) * 0.5;
      
      // Основной цвет - мерцание между циан и маджента
      color = mix(glitchCyan, glitchMagenta, blockNoise);
      
      // Добавляем белые вспышки
      if (glitchNoise > 0.8) {
        color = glitchWhite;
      }
      
      // Чёрные провалы
      if (glitchNoise < 0.15) {
        color = glitchBlack;
      }
      
      // Scanlines
      color *= 0.8 + scanline * 0.4;
      
      // RGB смещение
      color.r *= 1.0 + rgbShift * 0.3;
      color.b *= 1.0 - rgbShift * 0.3;
      
      // Очень яркий
      color *= 4.0;
      
      // Случайные яркие пиксели
      if (fract(sin(dot(floor(p.xz * 10.0), vec2(41.1, 67.3)) + u_time * 20.0) * 1000.0) > 0.95) {
        color = glitchWhite * 8.0;
      }
      
    } else if (mat == 44) {
      // === ГЛУБИНА ЖИЛЫ/ВОЙДА (тёмная бездна) ===
      vec3 voidDeep = vec3(0.02, 0.03, 0.05);
      vec3 voidGlow = vec3(0.08, 0.15, 0.2);
      
      // Глубинное затемнение
      float depth = abs(p.y + 5.0) / 10.0;
      color = mix(voidGlow, voidDeep, depth);
      
      // Еле заметные течения
      float flow = sin(p.x * 1.5 + u_time * 0.3) * sin(p.z * 1.5 + u_time * 0.2);
      color += vec3(0.03, 0.06, 0.08) * flow * 0.5;
      
      // Очень редкие блики
      float flash = fract(sin(dot(floor(p.xz * 0.3), vec2(12.9, 78.2)) + u_time * 0.5) * 43758.0);
      if (flash > 0.98) {
        color += vec3(0.1, 0.2, 0.25);
      }
      
    } else if (mat == 45) {
      // === ПОВЕРХНОСТЬ ВОЙДА (прозрачная дымка) ===
      vec3 surfaceCore = vec3(0.1, 0.2, 0.25);
      vec3 surfaceEdge = vec3(0.05, 0.08, 0.12);
      vec3 surfaceHighlight = vec3(0.3, 0.4, 0.5);
      
      // Мягкие волны
      float wave1 = sin(p.x * 2.0 + u_time * 1.0) * sin(p.z * 1.8 + u_time * 0.8);
      float wave2 = sin(p.x * 3.0 - u_time * 0.7) * sin(p.z * 2.5 + u_time * 0.5);
      float waves = (wave1 + wave2) * 0.5;
      
      // Прозрачный цвет
      color = mix(surfaceEdge, surfaceCore, 0.4 + waves * 0.2);
      
      // Редкие блики
      float highlight = pow(max(0.0, waves), 4.0);
      color = mix(color, surfaceHighlight, highlight * 0.3);
      
      // Редкие белые искры
      float glint = fract(sin(dot(p.xz + u_time * 3.0, vec2(12.9, 78.2))) * 43758.0);
      if (glint > 0.96) {
        color = mix(color, vec3(0.4, 0.5, 0.6), 0.5);
      }
      
      // Умеренное свечение
      color *= 1.5;
      
    } else if (mat == 46) {
      // === БОРТИК ОБРЫВА ===
      vec3 stoneBase = vec3(0.15, 0.1, 0.2);
      vec3 voidGlow = vec3(0.4, 0.0, 0.8);
      
      // Грубая текстура камня
      float noise = fract(sin(dot(floor(p.xz * 5.0), vec2(12.9, 78.2))) * 43758.0);
      color = mix(stoneBase, stoneBase * 1.5, noise);
      
      // Фиолетовое свечение от реки войда
      float glowStrength = sin(u_time * 3.0) * 0.3 + 0.5;
      color = mix(color, voidGlow, glowStrength * 0.4);
      
      // Блестящие прожилки
      float vein = sin(p.x * 20.0 + p.z * 15.0) * sin(p.y * 30.0);
      if (vein > 0.85) {
        color += vec3(0.3, 0.0, 0.5);
      }
      
    } else if (mat == 47) {
      // === БОРТИК ЖИЛЫ (обветренный камень) ===
      vec3 darkStone = vec3(0.12, 0.11, 0.10);
      vec3 edgeGlow = vec3(0.15, 0.25, 0.3);
      
      // Тёмный обветренный камень
      float stoneNoise = noise(p.xz * 8.0);
      color = darkStone * (0.8 + stoneNoise * 0.4);
      
      // Тонкие прожилки энергии
      float vein1 = sin(p.x * 20.0) * sin(p.z * 18.0);
      if (vein1 > 0.9) {
        color = mix(color, edgeGlow, 0.5);
      }
      
      // Лёгкое голубоватое свечение от жилы
      color += edgeGlow * 0.05;
      
    } else if (mat == 48) {
      // === ПОВЕРХНОСТЬ ЖИЛЫ (прозрачная энергия) ===
      vec3 voidBlue = vec3(0.05, 0.1, 0.2);
      vec3 voidCyan = vec3(0.1, 0.3, 0.4);
      vec3 glitchWhite = vec3(0.5, 0.6, 0.7);
      
      // Мягкое течение
      float flow = sin(p.x * 2.0 + p.z * 2.0 - u_time * 1.5);
      flow = flow * 0.5 + 0.5;
      
      // Прозрачный голубоватый цвет
      color = mix(voidBlue, voidCyan, flow * 0.6);
      
      // Лёгкая пульсация
      float pulse = sin(u_time * 0.8) * 0.2 + 0.8;
      color *= pulse;
      
      // Редкие белые блики
      float glint = fract(sin(dot(p.xz + u_time * 2.0, vec2(12.9, 78.2))) * 43758.0);
      if (glint > 0.97) {
        color = mix(color, glitchWhite, 0.4);
      }
      
      // Умеренное свечение
      color *= 1.2;
      
    } else if (mat == 31) {
      // === БЕЛЫЙ СВЕТЯЩИЙСЯ КРЕСТ (АПТЕЧКА) ===
      // Мягкая пульсация
      float pulse = 0.85 + 0.15 * sin(u_time * 3.0);
      float fastPulse = 0.9 + 0.1 * sin(u_time * 8.0);
      
      // Ядро - чистый яркий белый
      color = vec3(1.0, 1.0, 1.0);
      
      // Очень яркий центр
      color *= 4.0 * pulse;
      
      // Сильная аура вокруг креста
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 1.5);
      vec3 auraColor = vec3(0.95, 0.98, 1.0); // Чуть голубоватая аура
      color += auraColor * fresnel * 3.5;
      
      // Мерцающие искорки
      float sparkle = sin(u_time * 15.0 + p.x * 20.0) * sin(u_time * 12.0 + p.y * 25.0);
      if (sparkle > 0.7) {
        color += vec3(1.0) * (sparkle - 0.7) * 5.0;
      }
      
      // Лучи света от граней
      float edgeGlow = pow(max(0.0, 1.0 - abs(dot(n, vec3(0, 1, 0)))), 2.0);
      color += vec3(1.0) * edgeGlow * fastPulse * 1.5;
      
      // Внутреннее сияние
      float innerGlow = pow(max(0.0, dot(-rd, n)), 3.0);
      color += vec3(1.0, 1.0, 0.95) * innerGlow * 2.0;
      
    } else if (mat == 30) {
      // === ВОДА В БАССЕЙНЕ (тёмная, атмосферная) ===
      vec3 waterDeep = vec3(0.01, 0.04, 0.06);
      vec3 waterMid = vec3(0.03, 0.08, 0.12);
      vec3 waterGlow = vec3(0.1, 0.25, 0.35);
      
      // Волны (медленные, плавные)
      float wave = sin(p.x * 2.0 + u_time * 0.8) * sin(p.z * 1.8 + u_time * 0.6);
      float ripple = sin(length(p.xz) * 4.0 - u_time * 1.5) * 0.5 + 0.5;
      
      // Глубина
      float depth = smoothstep(2.0, 8.0, length(p.xz));
      vec3 waterColor = mix(waterDeep, waterMid, depth);
      waterColor += waterGlow * wave * 0.15;
      
      // Неоновые отблески
      waterColor += accentColor * 0.08 * smoothstep(8.0, 2.0, length(p.xz));
      
      // Мягкие блики
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      float spec = pow(max(0.0, dot(reflect(rd, n), vec3(0.0, 1.0, 0.0))), 16.0);
      
      color = waterColor;
      color += waterGlow * fresnel * 0.25;
      color += vec3(0.15, 0.2, 0.25) * spec * 0.3;
      color += waterGlow * ripple * 0.05;
      
    } else if (mat == 50) {
      // === ТЁМНЫЙ КАМЕНЬ (основание) ===
      vec3 stoneBase = vec3(0.06, 0.055, 0.05);
      vec3 stoneDark = vec3(0.025, 0.022, 0.02);
      vec3 stoneLight = vec3(0.09, 0.08, 0.07);
      
      // Текстура камня
      float stoneNoise = noise(p.xz * 6.0);
      float detailNoise = noise(p.xz * 20.0) * 0.3;
      
      vec3 stone = mix(stoneDark, stoneBase, stoneNoise * 0.6);
      stone = mix(stone, stoneLight, detailNoise);
      
      // Трещины
      float crack = sharpNoise(p.xz * 15.0);
      if (crack > 0.88) stone *= 0.6;
      
      // Грани
      float angle = atan(p.z, p.x);
      float edge = smoothstep(0.9, 1.0, abs(cos(angle * 8.0)));
      stone = mix(stone, stoneLight, edge * 0.2);
      
      color = stone * ambient * 1.3;
      color += stone * torchLight * 0.5;
      
    } else if (mat == 51) {
      // === МРАМОР (колонна) ===
      vec3 marbleBase = vec3(0.15, 0.14, 0.13);
      vec3 marbleLight = vec3(0.22, 0.2, 0.18);
      vec3 marbleVein = vec3(0.06, 0.055, 0.05);
      
      // Прожилки
      float vein1 = sin(p.x * 8.0 + p.y * 3.0 + noise(p.xz * 2.0) * 4.0);
      float vein2 = sin(p.z * 6.0 - p.y * 4.0 + noise(p.xy * 2.0) * 3.0);
      float veins = smoothstep(0.8, 0.95, abs(vein1)) + smoothstep(0.85, 0.98, abs(vein2)) * 0.5;
      
      // Базовый цвет
      vec3 marble = mix(marbleBase, marbleLight, noise(p.xz * 1.5) * 0.3);
      marble = mix(marble, marbleVein, veins * 0.6);
      
      // Мягкий блик
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      float spec = pow(max(0.0, dot(reflect(rd, n), vec3(0.0, 1.0, 0.0))), 32.0);
      
      color = marble * ambient * 1.4;
      color += marble * torchLight * 0.4;
      color += vec3(0.15, 0.13, 0.12) * spec * 0.2;
      color += marbleLight * fresnel * 0.1;
      
    } else if (mat == 52) {
      // === БРОНЗА (декор) ===
      vec3 bronzeBase = vec3(0.12, 0.08, 0.04);
      vec3 bronzeHighlight = vec3(0.2, 0.14, 0.06);
      vec3 bronzePatina = vec3(0.05, 0.1, 0.08);
      
      // Патина
      float patina = noise(p.xz * 6.0);
      vec3 bronze = mix(bronzeBase, bronzePatina, patina * 0.4);
      
      // Металлический блеск
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      float spec = pow(max(0.0, dot(reflect(rd, n), vec3(0.0, 1.0, 0.0))), 24.0);
      
      color = bronze * ambient * 1.3;
      color += bronze * torchLight * 0.5;
      color += bronzeHighlight * spec * 0.25;
      color += bronzeHighlight * fresnel * 0.15;
      
    } else if (mat == 53) {
      // === МОЗАИКА (центр арены) ===
      vec3 mosaicDark = vec3(0.04, 0.035, 0.05);
      vec3 mosaicMid = vec3(0.08, 0.07, 0.09);
      vec3 mosaicAccent = accentColor * 0.3;
      
      // Геометрический паттерн
      float angle = atan(p.z, p.x);
      float dist = length(p.xz);
      
      // Лучи + круги
      float rays = sin(angle * 8.0) * 0.5 + 0.5;
      float rings = sin(dist * 3.0) * 0.5 + 0.5;
      float pattern = rays * rings;
      
      vec3 mosaic = mix(mosaicDark, mosaicMid, pattern * 0.6);
      
      // Неоновые линии (редкие)
      float neonLine = smoothstep(0.94, 0.96, abs(sin(angle * 12.0)));
      neonLine += smoothstep(0.94, 0.96, abs(sin(dist * 5.0)));
      mosaic += mosaicAccent * neonLine * 0.5;
      
      color = mosaic * ambient * 1.4;
      color += mosaic * torchLight * 0.5;
      
    } else if (mat == 54) {
      // === ДЕКОРАТИВНОЕ КОЛЬЦО ===
      vec3 ringBase = vec3(0.05, 0.045, 0.04);
      vec3 ringLight = vec3(0.08, 0.07, 0.06);
      vec3 ringGlow = accentColor * 0.4;
      
      // Руны
      float angle = atan(p.z, p.x);
      float rune = sin(angle * 12.0) * sin(length(p.xz) * 3.0);
      
      vec3 ring = mix(ringBase, ringLight, noise(p.xz * 4.0) * 0.4);
      
      // Мягкое свечение рун
      float runeGlow = smoothstep(0.6, 0.8, abs(rune)) * (0.6 + 0.4 * sin(u_time * 1.5));
      ring += ringGlow * runeGlow * 0.3;
      
      color = ring * ambient * 1.3;
      color += ring * torchLight * 0.5;
      
    } else if (mat == 55) {
      // === ПОЛ (тёмный бетон с неоновыми акцентами) ===
      
      // Базовые цвета - тёмно-серый бетон
      vec3 concreteBase = vec3(0.08, 0.075, 0.07);
      vec3 concreteDark = vec3(0.04, 0.038, 0.035);
      vec3 concreteLight = vec3(0.12, 0.11, 0.1);
      
      // Большие плиты (2x2 метра)
      vec2 tileCoord = floor(p.xz * 0.5);
      vec2 tileFract = fract(p.xz * 0.5);
      float tileId = hash(tileCoord);
      
      // Вариация цвета плиты
      vec3 tileColor = mix(concreteDark, concreteBase, tileId * 0.5);
      
      // Текстура бетона (шум)
      float concreteNoise = noise(p.xz * 8.0) * 0.3;
      tileColor = mix(tileColor, concreteLight, concreteNoise);
      
      // Мелкие трещины
      float cracks = sharpNoise(p.xz * 25.0);
      if (cracks > 0.85) {
        tileColor *= 0.7;
      }
      
      // Швы между плитами
      float seamX = smoothstep(0.02, 0.04, tileFract.x) * smoothstep(0.02, 0.04, 1.0 - tileFract.x);
      float seamY = smoothstep(0.02, 0.04, tileFract.y) * smoothstep(0.02, 0.04, 1.0 - tileFract.y);
      float seam = seamX * seamY;
      tileColor = mix(vec3(0.02), tileColor, seam);
      
      // Неоновые полосы на полу (редкие)
      float stripeX = smoothstep(0.48, 0.5, tileFract.x) * smoothstep(0.52, 0.5, tileFract.x);
      float stripeY = smoothstep(0.48, 0.5, tileFract.y) * smoothstep(0.52, 0.5, tileFract.y);
      float stripe = max(stripeX, stripeY) * step(0.8, tileId);
      
      // Мокрые отражения (приглушённые)
      vec3 reflDir = reflect(rd, n);
      float fresnel = pow(1.0 - max(dot(-rd, n), 0.0), 2.5);
      
      vec3 wetReflect = vec3(0.0);
      float ref1 = pow(max(dot(reflDir, vec3(0.0, 1.0, 0.0)), 0.0), 8.0);
      wetReflect += accentColor * ref1 * 0.15;
      
      // Собираем цвет
      color = tileColor * ambient * 1.2;
      color += tileColor * torchLight * 0.4;
      color += wetReflect * fresnel * 0.5;
      
      // Неоновые полосы
      color += accentColor * stripe * 0.3 * (0.7 + 0.3 * sin(u_time * 2.0));
      
    } else if (mat == 60) {
      // === КАМЕНЬ СТОЛБА ===
      vec3 stoneBase = vec3(0.07, 0.065, 0.06);
      vec3 stoneDark = vec3(0.035, 0.03, 0.028);
      vec3 stoneLight = vec3(0.1, 0.09, 0.08);
      
      // Текстура
      float stoneNoise = noise(p.xz * 3.0);
      vec3 stoneColor = mix(stoneDark, stoneBase, stoneNoise * 0.5);
      
      // Детали
      float detail = noise(p.xz * 10.0) * 0.3;
      stoneColor = mix(stoneColor, stoneLight, detail);
      
      // Мох (редкий)
      float moss = smoothstep(0.3, 1.0, p.y) * noise(p.xz * 2.0);
      stoneColor = mix(stoneColor, vec3(0.03, 0.06, 0.02), moss * 0.2);
      
      color = stoneColor * ambient * 1.3;
      color += stoneColor * torchLight * 0.5;
      
    } else if (mat == 61) {
      // === МЕТАЛЛ ЧАШИ (тёмная бронза) ===
      vec3 metalBase = vec3(0.08, 0.055, 0.03);
      vec3 metalHighlight = vec3(0.15, 0.1, 0.05);
      vec3 metalPatina = vec3(0.04, 0.07, 0.06);
      
      // Патина
      float patina = noise(p.xz * 5.0);
      vec3 metal = mix(metalBase, metalPatina, patina * 0.35);
      
      // Блик
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      float spec = pow(max(0.0, dot(reflect(rd, n), vec3(0.0, 1.0, 0.0))), 20.0);
      
      color = metal * ambient * 1.3;
      color += metal * torchLight * 0.5;
      color += metalHighlight * spec * 0.2;
      color += metalHighlight * fresnel * 0.1;
      
      // Отсвет от огня (мягкий)
      color += accentColor * 0.05;
      
    } else if (mat == 62) {
      // === НЕОНОВЫЙ ИСТОЧНИК СВЕТА ===
      // Определяем цвет по позиции (север/юг/восток/запад)
      vec3 neonCol;
      float angle = atan(p.z, p.x);
      
      if (abs(p.z) > abs(p.x)) {
        // Север или юг
        neonCol = p.z > 0.0 ? vec3(0.0, 1.0, 0.9) : vec3(1.0, 0.1, 0.6);
      } else {
        // Восток или запад
        neonCol = p.x > 0.0 ? accentColor : vec3(1.0, 0.9, 0.2);
      }
      
      // Пульсация
      float pulse = 0.85 + 0.15 * sin(u_time * 4.0 + angle * 2.0);
      
      // Яркий неон (но не слишком)
      color = neonCol * 3.0 * pulse;
      
    } else if (mat == 63) {
      // === ДЕРЕВО (тёмное, состаренное) ===
      vec3 woodBase = vec3(0.08, 0.05, 0.03);
      vec3 woodDark = vec3(0.035, 0.02, 0.01);
      vec3 woodLight = vec3(0.12, 0.07, 0.04);
      
      // Текстура волокон
      float grain = sin(p.y * 15.0 + sin(p.x * 3.0) * 1.5) * 0.5 + 0.5;
      vec3 woodColor = mix(woodDark, woodBase, grain * 0.6);
      
      // Детали
      float detail = noise(p.xz * 8.0);
      woodColor = mix(woodColor, woodLight, detail * 0.2);
      
      // Старение
      float age = noise(p.xz * 3.0) * 0.15;
      woodColor *= 1.0 - age;
      
      color = woodColor * ambient * 1.3;
      color += woodColor * torchLight * 0.4;
      color += woodColor * torchLight * 1.2;
      color += rimColor * 0.2;
      
    } else if (mat == 64) {
      // === ТЁМНЫЙ КАМЕНЬ ПЛАТФОРМЫ ФОНАРЯ ===
      vec3 baseColor = vec3(0.04, 0.035, 0.03);
      vec3 darkColor = vec3(0.02, 0.018, 0.015);
      vec3 lightColor = vec3(0.08, 0.07, 0.06);
      
      // Плиты с швами
      vec2 tileCoord = floor(p.xz * 2.0);
      vec2 tileFract = fract(p.xz * 2.0);
      float tileId = hash(tileCoord);
      
      // Вариация цвета плиты
      vec3 tileColor = mix(darkColor, baseColor, tileId * 0.4);
      
      // Текстура камня
      float stoneNoise = noise(p.xz * 8.0) * 0.2;
      tileColor = mix(tileColor, lightColor, stoneNoise);
      
      // Швы между плитами
      float seamX = smoothstep(0.03, 0.06, tileFract.x) * smoothstep(0.03, 0.06, 1.0 - tileFract.x);
      float seamY = smoothstep(0.03, 0.06, tileFract.y) * smoothstep(0.03, 0.06, 1.0 - tileFract.y);
      float seam = seamX * seamY;
      tileColor = mix(vec3(0.01), tileColor, seam);
      
      // Трещины
      float crack = sharpNoise(p.xz * 20.0);
      if (crack > 0.88) {
        tileColor *= 0.6;
      }
      
      // Неоновое свечение в швах (редкое)
      float glowSeam = (1.0 - seam) * step(0.7, tileId);
      
      color = tileColor * ambient * 1.5;
      color += tileColor * torchLight * 0.8;
      color += accentColor * glowSeam * 0.15 * (0.7 + 0.3 * sin(u_time * 2.0));
      
    } else if (mat == 65) {
      // === БРОНЗА РЕШЁТОК ФОНАРЯ ===
      vec3 bronzeBase = vec3(0.45, 0.28, 0.12);
      vec3 bronzeHighlight = vec3(0.75, 0.55, 0.25);
      vec3 bronzePatina = vec3(0.15, 0.3, 0.25);
      
      // Кованая текстура
      float forged = sin(p.y * 30.0) * sin(p.x * 25.0 + p.z * 25.0) * 0.02;
      
      // Патина в углублениях
      float patinaMask = smoothstep(0.3, 0.6, noise(p.xz * 12.0));
      vec3 bronze = mix(bronzeBase, bronzePatina, patinaMask * 0.25);
      
      // Царапины
      float scratch = sharpNoise(p.xz * 40.0);
      if (scratch > 0.92) {
        bronze = mix(bronze, bronzeHighlight, 0.3);
      }
      
      // Металлический блеск
      float spec = pow(max(0.0, dot(reflect(rd, n), normalize(vec3(1.0, 1.0, 0.5)))), 50.0);
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      
      color = bronze * ambient * 2.0;
      color += bronze * torchLight * 1.5;
      color += bronzeHighlight * spec * 0.5;
      color += bronzeHighlight * fresnel * 0.2;
      
      // Отражение огня
      color += vec3(1.0, 0.5, 0.15) * 0.15;
      
    } else if (mat == 66) {
      // === ОГОНЬ ВНУТРИ ФОНАРЯ ===
      vec3 fireCore = vec3(1.0, 0.95, 0.7);
      vec3 fireYellow = vec3(1.0, 0.7, 0.2);
      vec3 fireOrange = vec3(1.0, 0.4, 0.08);
      vec3 fireRed = vec3(0.9, 0.15, 0.02);
      
      // Анимация пламени
      float flame1 = sin(p.y * 8.0 - u_time * 12.0 + p.x * 3.0) * 0.5 + 0.5;
      float flame2 = sin(p.y * 12.0 - u_time * 15.0 + p.z * 4.0) * 0.5 + 0.5;
      float flame3 = cos(p.y * 6.0 - u_time * 10.0) * 0.5 + 0.5;
      float flames = (flame1 + flame2 + flame3) / 3.0;
      
      // Расстояние от центра (для градиента)
      float dist = length(p.xz);
      float heightFade = smoothstep(0.0, 0.4, -p.y + 3.3);
      
      // Цвет от центра к краям
      color = mix(fireCore, fireYellow, dist * 2.0);
      color = mix(color, fireOrange, dist * 3.0);
      color = mix(color, fireRed, dist * 4.0);
      
      // Мерцание
      float flicker = 0.85 + 0.15 * sin(u_time * 25.0 + p.x * 10.0);
      color *= flicker;
      
      // Яркость
      color *= 4.0;
      
      // Языки пламени (яркие вспышки)
      if (flames > 0.7) {
        color = mix(color, fireCore * 5.0, (flames - 0.7) * 2.0);
      }
      
    } else if (mat == 68) {
      // === КАМЕНЬ ПЛАТФОРМЫ ПОРТАЛА ===
      vec3 stoneBase = vec3(0.06, 0.055, 0.05);
      vec3 stoneDark = vec3(0.03, 0.028, 0.025);
      vec3 stoneLight = vec3(0.1, 0.09, 0.08);
      
      // Плиты с швами
      vec2 tileCoord = floor(p.xz * 1.5);
      vec2 tileFract = fract(p.xz * 1.5);
      float tileId = hash(tileCoord);
      
      // Вариация цвета плиты
      vec3 tileColor = mix(stoneDark, stoneBase, tileId * 0.5);
      
      // Текстура камня (многослойная)
      float stoneNoise = noise(p.xz * 6.0) * 0.3;
      float detailNoise = noise(p.xz * 15.0) * 0.15;
      tileColor = mix(tileColor, stoneLight, stoneNoise + detailNoise);
      
      // Швы между плитами
      float seamX = smoothstep(0.02, 0.05, tileFract.x) * smoothstep(0.02, 0.05, 1.0 - tileFract.x);
      float seamY = smoothstep(0.02, 0.05, tileFract.y) * smoothstep(0.02, 0.05, 1.0 - tileFract.y);
      float seam = seamX * seamY;
      tileColor = mix(vec3(0.015), tileColor, seam);
      
      // Трещины
      float crack = sharpNoise(p.xz * 25.0);
      if (crack > 0.9) {
        tileColor *= 0.5;
      }
      
      // Руны в швах (свечение)
      float runeGlow = (1.0 - seam) * step(0.75, tileId);
      float runePulse = 0.6 + 0.4 * sin(u_time * 2.0 + tileId * 6.28);
      
      color = tileColor * ambient * 1.8;
      color += tileColor * torchLight * 1.0;
      color += accentColor * runeGlow * 0.25 * runePulse;
      
      // Отблеск от портала
      float portalGlow = smoothstep(3.0, 0.0, length(p.xz - vec2(sign(p.x) * 22.0, 0.0)));
      color += vec3(1.0, 0.5, 0.2) * portalGlow * 0.15;
      
    } else if (mat == 69) {
      // === БРОНЗА ДЕКОРА ПОРТАЛА ===
      vec3 bronzeBase = vec3(0.5, 0.32, 0.15);
      vec3 bronzeHighlight = vec3(0.8, 0.6, 0.3);
      vec3 bronzePatina = vec3(0.18, 0.35, 0.28);
      
      // Кованая текстура
      float forged = sin(p.y * 25.0) * sin(p.x * 20.0 + p.z * 20.0) * 0.015;
      
      // Патина в углублениях
      float patinaMask = smoothstep(0.35, 0.65, noise(p.xz * 10.0));
      vec3 bronze = mix(bronzeBase, bronzePatina, patinaMask * 0.3);
      
      // Износ на углах
      float edgeWear = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      bronze = mix(bronze, bronzeHighlight, edgeWear * 0.2);
      
      // Металлический блеск
      float spec = pow(max(0.0, dot(reflect(rd, n), normalize(vec3(1.0, 1.0, 0.5)))), 60.0);
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      
      color = bronze * ambient * 2.2;
      color += bronze * torchLight * 1.5;
      color += bronzeHighlight * spec * 0.6;
      color += bronzeHighlight * fresnel * 0.25;
      
      // Отражение огня портала
      color += vec3(1.0, 0.5, 0.15) * 0.2;
      
    } else if (mat == 70) {
      // === СВЕЧЕНИЕ ПОРТАЛА (внешнее) ===
      vec3 glowCore = vec3(1.0, 0.6, 0.2);
      vec3 glowEdge = vec3(1.0, 0.3, 0.05);
      
      // Расстояние от центра портала
      float portalX = sign(p.x) * 22.0;
      vec3 toPortal = p - vec3(portalX, 2.8, 0.0);
      float dist = length(toPortal.yz);
      float normalizedDist = dist / 1.6;
      
      // Градиент от центра
      color = mix(glowCore, glowEdge, normalizedDist);
      
      // Вихревой эффект
      float swirl = sin(atan(toPortal.y, toPortal.z) * 6.0 - u_time * 4.0) * 0.5 + 0.5;
      color = mix(color, glowCore * 1.5, swirl * 0.3);
      
      // Пульсация
      float pulse = 0.8 + 0.2 * sin(u_time * 3.0);
      color *= pulse * 2.5;
      
      // Искры
      float spark = sin(u_time * 20.0 + p.y * 15.0 + p.z * 12.0);
      if (spark > 0.9) {
        color += vec3(1.0, 0.9, 0.7) * 2.0;
      }
      
    } else if (mat == 71) {
      // === КАМЕНЬ ПЛАТФОРМЫ ЗА ПОРТАЛОМ ===
      vec3 stoneBase = vec3(0.07, 0.065, 0.06);
      vec3 stoneDark = vec3(0.035, 0.032, 0.03);
      vec3 stoneLight = vec3(0.11, 0.1, 0.09);
      
      // Радиальные плиты
      float angle = atan(p.z, p.x);
      float dist = length(p.xz - vec2(sign(p.x) * BACK_PLATFORM_X, 0.0));
      
      // Концентрические кольца плит
      float ringId = floor(dist * 1.5);
      float ringFract = fract(dist * 1.5);
      
      // Секторы
      float sectorId = floor(angle * 4.0 / 3.14159);
      float sectorFract = fract(angle * 4.0 / 3.14159);
      
      float tileId = hash(vec2(ringId, sectorId));
      vec3 tileColor = mix(stoneDark, stoneBase, tileId * 0.5);
      
      // Текстура
      float stoneNoise = noise(p.xz * 5.0) * 0.25;
      tileColor = mix(tileColor, stoneLight, stoneNoise);
      
      // Швы (радиальные и концентрические)
      float seamRing = smoothstep(0.03, 0.08, ringFract) * smoothstep(0.03, 0.08, 1.0 - ringFract);
      float seamSector = smoothstep(0.02, 0.06, sectorFract) * smoothstep(0.02, 0.06, 1.0 - sectorFract);
      float seam = seamRing * seamSector;
      tileColor = mix(vec3(0.015), tileColor, seam);
      
      color = tileColor * ambient * 1.6;
      color += tileColor * torchLight * 0.9;
      
      // Свечение от портала
      float portalGlow = smoothstep(15.0, 5.0, dist);
      color += accentColor * portalGlow * 0.1;
      
    } else if (mat == 72) {
      // === БОРТИК/СТОЛБИКИ ПЛАТФОРМЫ ===
      vec3 stoneBase = vec3(0.09, 0.08, 0.07);
      vec3 stoneDark = vec3(0.04, 0.035, 0.03);
      vec3 stoneAccent = vec3(0.12, 0.1, 0.08);
      
      // Текстура камня
      float stoneNoise = noise(p.xz * 6.0) * 0.3 + noise(p.xz * 15.0) * 0.15;
      vec3 stoneColor = mix(stoneDark, stoneBase, stoneNoise);
      
      // Резной узор (вертикальные линии)
      float carving = sin(p.y * 20.0) * sin(atan(p.z, p.x) * 8.0);
      if (abs(carving) > 0.8) {
        stoneColor = mix(stoneColor, stoneAccent, 0.3);
      }
      
      color = stoneColor * ambient * 1.8;
      color += stoneColor * torchLight * 1.0;
      
      // Подсветка сверху
      color += accentColor * smoothstep(0.5, 0.7, p.y) * 0.08;
      
    } else if (mat == 73) {
      // === МАЛЕНЬКИЙ ОГОНЬ НА СТОЛБИКЕ ===
      vec3 fireCore = vec3(1.0, 0.9, 0.6);
      vec3 fireOuter = vec3(1.0, 0.4, 0.1);
      
      float flicker = 0.8 + 0.2 * sin(u_time * 15.0 + p.x * 8.0 + p.z * 8.0);
      
      color = mix(fireCore, fireOuter, 0.4);
      color *= flicker * 3.5;
      
    } else if (mat == 74) {
      // === СВЕТЯЩИЙСЯ СИМВОЛ НА ПЛАТФОРМЕ ===
      // Пульсирующее свечение в цвете эпохи
      float pulse = 0.6 + 0.4 * sin(u_time * 2.0);
      color = accentColor * pulse * 2.5;
      
      // Добавляем белый центр
      color += vec3(0.3, 0.3, 0.3) * pulse;
      
    } else if (mat == 75) {
      // === ГРАНИТ ОСНОВАНИЯ ФОНТАНА ===
      vec3 graniteBase = vec3(0.08, 0.075, 0.07);
      vec3 graniteDark = vec3(0.04, 0.038, 0.035);
      vec3 graniteLight = vec3(0.12, 0.11, 0.1);
      vec3 graniteSpeckle = vec3(0.15, 0.14, 0.13);
      
      // Многослойная текстура гранита
      float baseNoise = noise(p.xz * 4.0) * 0.4;
      float detailNoise = noise(p.xz * 12.0) * 0.2;
      float microNoise = noise(p.xz * 30.0) * 0.1;
      
      vec3 granite = mix(graniteDark, graniteBase, baseNoise);
      granite = mix(granite, graniteLight, detailNoise);
      
      // Крапинки (характерно для гранита)
      float speckle = sharpNoise(p.xz * 50.0);
      if (speckle > 0.85) {
        granite = mix(granite, graniteSpeckle, 0.4);
      }
      
      // Восьмиугольные грани (блики на рёбрах)
      float angle = atan(p.z, p.x);
      float edgeFactor = abs(cos(angle * 8.0));
      float edgeHighlight = smoothstep(0.9, 1.0, edgeFactor) * 0.1;
      granite += edgeHighlight;
      
      // Мокрые участки (около воды)
      float wetness = smoothstep(2.5, 1.5, length(p.xz)) * 0.15;
      granite *= 1.0 - wetness * 0.3;
      
      color = granite * ambient * 1.8;
      color += granite * torchLight * 0.9;
      
      // Отражение воды
      color += vec3(0.05, 0.08, 0.1) * wetness;
      
    } else if (mat == 76) {
      // === ВОДА СТРУИ ФОНТАНА ===
      vec3 waterCore = vec3(0.7, 0.85, 0.95);
      vec3 waterEdge = vec3(0.4, 0.6, 0.75);
      vec3 waterSparkle = vec3(1.0, 1.0, 1.0);
      
      // Прозрачная вода с бликами
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      
      // Анимация потока
      float flow = sin(p.y * 15.0 - u_time * 8.0) * 0.5 + 0.5;
      
      color = mix(waterCore, waterEdge, fresnel * 0.5);
      
      // Искрящиеся капли
      float sparkle = sin(p.y * 30.0 - u_time * 15.0 + p.x * 20.0 + p.z * 20.0);
      if (sparkle > 0.8) {
        color = mix(color, waterSparkle, (sparkle - 0.8) * 3.0);
      }
      
      // Яркость
      color *= 2.0;
      
      // Свечение в цвете эпохи
      color += accentColor * flow * 0.15;
      
    } else if (mat == 77) {
      // === ДНО БАССЕЙНА (мозаика) ===
      vec3 mosaicBlue = vec3(0.05, 0.15, 0.25);
      vec3 mosaicTeal = vec3(0.08, 0.2, 0.22);
      vec3 mosaicGold = vec3(0.4, 0.3, 0.1);
      vec3 mosaicWhite = vec3(0.2, 0.22, 0.25);
      
      // Мелкие плитки мозаики
      vec2 tileCoord = floor(p.xz * 4.0);
      vec2 tileFract = fract(p.xz * 4.0);
      float tileId = hash(tileCoord);
      
      // Выбор цвета плитки
      vec3 tileColor;
      if (tileId < 0.5) {
        tileColor = mix(mosaicBlue, mosaicTeal, fract(tileId * 4.0));
      } else if (tileId < 0.9) {
        tileColor = mosaicWhite;
      } else {
        tileColor = mosaicGold; // Редкие золотые плитки
      }
      
      // Швы между плитками
      float seamX = smoothstep(0.02, 0.05, tileFract.x) * smoothstep(0.02, 0.05, 1.0 - tileFract.x);
      float seamY = smoothstep(0.02, 0.05, tileFract.y) * smoothstep(0.02, 0.05, 1.0 - tileFract.y);
      float seam = seamX * seamY;
      tileColor = mix(vec3(0.02, 0.03, 0.04), tileColor, seam);
      
      // Узор в центре (круговой)
      float centerDist = length(p.xz);
      float centerPattern = sin(centerDist * 3.0) * sin(atan(p.z, p.x) * 8.0);
      if (abs(centerPattern) > 0.8 && centerDist < 2.0) {
        tileColor = mosaicGold;
      }
      
      // Подводное освещение
      color = tileColor * ambient * 1.2;
      
      // Каустики (световые узоры от воды)
      float caustic1 = sin(p.x * 8.0 + u_time * 2.0) * sin(p.z * 7.0 + u_time * 1.5);
      float caustic2 = sin(p.x * 6.0 - u_time * 1.8) * sin(p.z * 9.0 - u_time * 2.2);
      float caustics = (caustic1 + caustic2) * 0.5 + 0.5;
      color += vec3(0.1, 0.15, 0.2) * caustics * 0.3;
      
      // Свечение в цвете эпохи
      color += accentColor * 0.05;
      
    } else if (mat == 56) {
      // === ОРБИТАЛЬНЫЙ ОГОНЬ 1 (основной цвет эпохи) ===
      float pulse = 0.8 + 0.2 * sin(u_time * 20.0);
      color = accentColor * 5.0 * pulse;
      // Ореол
      color += accentColor * 2.0;
      
    } else if (mat == 57) {
      // === ОРБИТАЛЬНЫЙ ОГОНЬ 2 (оранжевый) ===
      vec3 fireOrange = vec3(1.0, 0.5, 0.0);
      float pulse = 0.8 + 0.2 * sin(u_time * 23.0 + 1.0);
      color = fireOrange * 5.0 * pulse;
      color += fireOrange * 2.0;
      
    } else if (mat == 58) {
      // === ОРБИТАЛЬНЫЙ ОГОНЬ 3 (циан) ===
      vec3 fireCyan = vec3(0.0, 1.0, 0.8);
      float pulse = 0.8 + 0.2 * sin(u_time * 19.0 + 2.0);
      color = fireCyan * 5.0 * pulse;
      color += fireCyan * 2.0;
      
    } else if (mat == 59) {
      // === ОРБИТАЛЬНЫЙ ОГОНЬ 4 (розовый) ===
      vec3 firePink = vec3(1.0, 0.2, 0.5);
      float pulse = 0.8 + 0.2 * sin(u_time * 17.0 + 3.0);
      color = firePink * 5.0 * pulse;
      color += firePink * 2.0;
      
    } else if (mat == 78) {
      // === ОРАНЖЕВЫЙ ШАР (как луна) ===
      float pulse = 0.85 + 0.15 * sin(u_time * 2.0);
      
      // Объёмное затемнение к краям (fresnel)
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.5);
      
      // Цвета как у луны
      vec3 orbCore = vec3(1.0, 0.7, 0.3) * 2.5;   // Яркий оранжевый центр
      vec3 orbRim = vec3(0.9, 0.35, 0.05) * 1.5;  // Тёмно-оранжевый край
      
      color = mix(orbCore, orbRim, fresnel) * pulse;
      
      // Текстура поверхности (пятна)
      float surfNoise = noise(p.xz * 8.0) * 0.2;
      color *= (0.9 + surfNoise);
      
      // Яркое свечение
      color += vec3(1.0, 0.5, 0.1) * 1.5;
      
    } else if (mat == 79) {
      // === СТЕБЕЛЬ РОЗЫ (зелёный) ===
      vec3 stemGreen = vec3(0.15, 0.4, 0.1);
      vec3 stemDark = vec3(0.08, 0.25, 0.05);
      
      // Текстура
      float stemNoise = noise(p.xy * 20.0) * 0.3;
      color = mix(stemDark, stemGreen, 0.5 + stemNoise);
      
      // Освещение
      color *= ambient * 1.5;
      color += stemGreen * mainLight * mainDot * 0.4;
      
    } else if (mat == 80) {
      // === ЯДРО ЭНЕРГЕТИЧЕСКОЙ СУЩНОСТИ ===
      float pulse = 0.7 + 0.3 * sin(u_time * 10.0);
      float pulse2 = 0.8 + 0.2 * sin(u_time * 15.0 + 1.5);
      
      // Градиент от белого ядра к золотому краю
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      vec3 coreWhite = vec3(1.0, 1.0, 0.95) * 4.0;
      vec3 coreGold = vec3(1.0, 0.7, 0.2) * 3.0;
      vec3 coreOrange = vec3(1.0, 0.4, 0.1) * 2.0;
      
      color = mix(coreWhite, coreGold, fresnel);
      color = mix(color, coreOrange, fresnel * fresnel);
      color *= pulse * pulse2;
      
      // Электрические разряды
      float spark = fract(sin(dot(p.xy + u_time * 20.0, vec2(12.9898, 78.233))) * 43758.5453);
      if (spark > 0.92) {
        color += vec3(1.0, 1.0, 1.0) * 3.0;
      }
      
    } else if (mat == 81) {
      // === КОЛЬЦА ЭНЕРГИИ ===
      float pulse = 0.6 + 0.4 * sin(u_time * 8.0 + p.y * 5.0);
      
      // Переливающийся цвет
      float colorShift = sin(u_time * 3.0 + length(p) * 4.0) * 0.5 + 0.5;
      vec3 ringCyan = vec3(0.2, 0.9, 1.0);
      vec3 ringGold = vec3(1.0, 0.8, 0.3);
      vec3 ringMagenta = vec3(1.0, 0.3, 0.8);
      
      vec3 ringColor = mix(ringCyan, ringGold, colorShift);
      ringColor = mix(ringColor, ringMagenta, sin(u_time * 2.0) * 0.3 + 0.3);
      
      color = ringColor * pulse * 3.0;
      
      // Свечение
      color += ringColor * 1.5;
      
    } else {
      // === FALLBACK ===
      vec3 baseColor = vec3(0.2, 0.18, 0.15);
      color = baseColor * ambient * 2.0;
      color += baseColor * mainLight * mainDot * 0.5;
      color += baseColor * torchLight * 1.2;
      color += rimColor + specColor;
    }
    
    // Вспышка от выстрела
    if (u_muzzleFlash > 0.0) {
      color += vec3(1.0, 0.7, 0.4) * u_muzzleFlash * 0.4;
    }
    
    // Мягкая атмосферная дымка (не скрывает, только добавляет цвет)
    float atmFade = smoothstep(70.0, MAX_DIST, d);
    vec3 atmColor = mix(fogColor, skyColor, 0.5);
    color = mix(color, atmColor, atmFade * 0.4);
    
    // Очень лёгкий туман
    float fog = 1.0 - exp(-d * 0.004);
    color = mix(color, fogColor * 1.2, fog * 0.1);
  }
  
  // Кислотный дождь от зелёного босса (всегда когда есть зоны)
  if (u_acidRainZoneCount > 0) {
    color = renderAcidRain(v_uv, color, u_time, u_cameraPos);
  }
  
  // Эффект дождя на волне 15+
  if (u_wave >= 15) {
    color = renderRain(v_uv, color, u_time);
  }
  
  // === АКЦЕНТНЫЕ ЦВЕТА ПО ЭПОХЕ ===
  vec3 volAccent;
  vec3 volSecondary;
  if (u_era == 1) {
    volAccent = vec3(0.3, 1.0, 0.4);
    volSecondary = vec3(0.0, 0.8, 0.6);
  } else if (u_era == 2) {
    volAccent = vec3(0.8, 0.2, 1.0);
    volSecondary = vec3(0.4, 0.0, 0.8);
  } else {
    volAccent = vec3(0.0, 0.9, 1.0);
    volSecondary = vec3(0.0, 0.5, 0.8);
  }
  
  vec2 screenPos = v_uv * 2.0 - 1.0;
  vec2 screenUV = gl_FragCoord.xy / u_resolution;
  
  // === GOD RAYS (упрощённые) ===
  vec2 moonScreenPos = vec2(0.35, 0.55);
  float rayDist = length(screenPos - moonScreenPos);
  float godRays = exp(-rayDist * 2.5) * 0.15 * smoothstep(0.8, 0.0, rayDist);
  color += vec3(0.8, 0.4, 0.1) * godRays;
  
  // === VOLUMETRIC (упрощённый) ===
  float depthFactor = 1.0 - smoothstep(0.0, 60.0, d);
  float beam = exp(-length(screenPos) * 3.0);
  color += volAccent * beam * depthFactor * 0.04;
  
  // === МИНИМАЛИСТИЧНЫЕ ЧАСТИЦЫ (оптимизировано) ===
  // Светлячки и пылинки убраны для производительности
  
  // Слой 5: Горизонтальные полосы света (сканлайны атмосферы)
  float scanY = fract(screenUV.y * 200.0 + u_time * 0.5);
  float scanLine = smoothstep(0.0, 0.02, scanY) * smoothstep(0.04, 0.02, scanY);
  color += volSecondary * scanLine * 0.015 * depthFactor;
  
  // === АТМОСФЕРНАЯ ДЫМКА С ГРАДИЕНТОМ ===
  float fogDist = d / MAX_DIST;
  
  // Верхняя дымка (небо просачивается)
  float skyHaze = smoothstep(0.3, 0.8, screenUV.y) * 0.1;
  color += vec3(0.05, 0.08, 0.15) * skyHaze;
  
  // Нижняя дымка (от пола)
  float groundHaze = smoothstep(0.5, 0.2, screenUV.y) * 0.08;
  color += volAccent * groundHaze * 0.3;
  
  // Дальняя дымка
  float hazeFade = smoothstep(0.5, 1.0, fogDist);
  vec3 hazeColor = mix(vec3(0.03, 0.04, 0.08), volSecondary * 0.2, 0.3);
  color = mix(color, hazeColor, hazeFade * 0.3);
  
  // === BLOOM (мягкое свечение ярких областей) ===
  float bloomLum = dot(color, vec3(0.299, 0.587, 0.114));
  if (bloomLum > 0.8) {
    float bloomAmt = (bloomLum - 0.8) * 0.4;
    vec3 bloomCol = color * (1.0 + bloomAmt);
    color = mix(color, bloomCol, 0.5);
  }
  
  // === ХРОМАТИЧЕСКАЯ АБЕРРАЦИЯ (лёгкая) ===
  float aberration = length(screenPos) * 0.003;
  color.r += hash(screenUV + 0.1) * aberration * 0.5;
  color.b -= hash(screenUV + 0.2) * aberration * 0.5;
  
  // === КАТАНА 3D ===
  // Определяем цвета освещения для катаны по эпохе
  vec3 katanaAmbient;
  vec3 katanaAccent;
  if (u_era == 1) {
    katanaAmbient = vec3(0.08, 0.12, 0.08);
    katanaAccent = vec3(0.4, 1.0, 0.2);
  } else if (u_era == 2) {
    katanaAmbient = vec3(0.07, 0.05, 0.12);
    katanaAccent = vec3(0.7, 0.15, 1.0);
  } else {
    katanaAmbient = vec3(0.08, 0.1, 0.14);
    katanaAccent = vec3(0.15, 0.7, 1.0);
  }
  
  // Рендерим катану (ro = позиция камеры) - только если включена
  if (u_katanaEnabled == 1) {
    vec4 katanaResult = renderKatana(u_cameraPos, rd, u_katanaAttack, u_katanaBob, u_katanaCharges, katanaAmbient, katanaAccent);
    if (katanaResult.w > 0.0) {
      // Катана попала - накладываем поверх сцены
      color = katanaResult.rgb;
    }
  }
  
  // === СОВРЕМЕННЫЙ AAA ПОСТ-ПРОЦЕСС ===
  
  // 1. EXPOSURE (экспозиция)
  color *= 1.3;
  
  // 2. ACES FILMIC TONEMAPPING (киношный вид)
  // Матрица преобразования в ACES
  mat3 aces_input = mat3(
    0.59719, 0.35458, 0.04823,
    0.07600, 0.90834, 0.01566,
    0.02840, 0.13383, 0.83777
  );
  mat3 aces_output = mat3(
    1.60475, -0.53108, -0.07367,
    -0.10208, 1.10813, -0.00605,
    -0.00327, -0.07276, 1.07602
  );
  color = aces_input * color;
  vec3 a = color * (color + 0.0245786) - 0.000090537;
  vec3 b = color * (0.983729 * color + 0.4329510) + 0.238081;
  color = a / b;
  color = aces_output * color;
  color = clamp(color, 0.0, 1.0);
  
  // 3. ГАММА КОРРЕКЦИЯ
  color = pow(color, vec3(0.9));
  
  // 4. ГЛУБОКИЙ COLOR GRADING (teal & orange киношный стиль)
  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  
  // Тени → холодный циан/синий
  vec3 shadowTint = vec3(0.0, 0.12, 0.18);
  float shadowMask = 1.0 - smoothstep(0.0, 0.4, lum);
  color += shadowTint * shadowMask * 0.2;
  
  // Средние тона → слегка зеленоватый
  vec3 midTint = vec3(-0.02, 0.03, -0.02);
  float midMask = smoothstep(0.2, 0.5, lum) * smoothstep(0.8, 0.5, lum);
  color += midTint * midMask * 0.15;
  
  // Света → тёплый оранжевый
  vec3 highlightTint = vec3(0.12, 0.06, 0.0);
  float highlightMask = smoothstep(0.5, 1.0, lum);
  color += highlightTint * highlightMask * 0.15;
  
  // 5. НАСЫЩЕННОСТЬ (vibrance - больше на ненасыщенные цвета)
  float maxC = max(max(color.r, color.g), color.b);
  float minC = min(min(color.r, color.g), color.b);
  float saturation = (maxC - minC) / (maxC + 0.001);
  float vibranceAmt = 1.0 + (1.0 - saturation) * 0.25;
  vec3 grayCol = vec3(lum);
  color = mix(grayCol, color, vibranceAmt);
  
  // 6. МЯГКИЙ КОНТРАСТ (Cyberpunk стиль - серые тени)
  // Поднимаем чёрную точку - тени становятся серыми
  color = color * 0.85 + 0.08; // Чёрный → тёмно-серый
  // Лёгкий S-curve
  color = mix(color, color * color * (3.0 - 2.0 * color), 0.1);
  
  // === ПОСТЭФФЕКТЫ ПЕРЕНЕСЕНЫ В COMPOSITE PASS ===
  
  // Финальный clamp
  color = clamp(color, 0.0, 1.0);
  
  // Записываем цвет + нормализованную глубину в alpha для composite pass
  float normalizedDepth = clamp(d / MAX_DIST, 0.0, 1.0);
  fragColor = vec4(color, normalizedDepth);
}
`,jt=`#version 300 es
precision highp float;

uniform sampler2D u_geometryTex;  // Текстура из geometry pass
uniform vec2 u_resolution;
uniform float u_time;

// Катана uniforms
uniform vec3 u_cameraPos;
uniform float u_cameraYaw;
uniform float u_cameraPitch;
uniform float u_katanaAttack;
uniform float u_katanaBob;
uniform int u_katanaCharges;
uniform float u_katanaTargetAngle;
uniform float u_katanaTargetDist;
uniform int u_katanaAttackType;
uniform int u_katanaEnabled;
uniform int u_postfxEnabled;
uniform int u_era;

in vec2 v_uv;
out vec4 fragColor;

#define PI 3.14159265

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float filmGrain(vec2 uv, float time) {
  float seed = dot(uv, vec2(12.9898, 78.233)) + time;
  return fract(sin(seed) * 43758.5453) - 0.5;
}

// === КАТАНА SDF ФУНКЦИИ (копия из основного шейдера) ===
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

float sdKatanaBlade(vec3 p) {
  float scale = 0.18;
  vec3 sp = p / scale;
  float bladeLen = 2.2;
  float curve = sp.y * sp.y * 0.012;
  sp.z -= curve;
  float taper = 1.0 - smoothstep(0.0, bladeLen, sp.y) * 0.6;
  float tipTaper = smoothstep(bladeLen - 0.4, bladeLen, sp.y);
  float bladeWidth = 0.09 * taper * (1.0 - tipTaper * 0.5);
  float spineThick = 0.025 * taper;
  float xDist = abs(sp.x) - bladeWidth;
  float edgeZ = -spineThick * 0.3;
  float spineZ = spineThick;
  float normalizedX = clamp((abs(sp.x)) / bladeWidth, 0.0, 1.0);
  float thickAtX = mix(0.002, spineThick, normalizedX);
  float zDist = abs(sp.z - (edgeZ + spineZ) * 0.5) - thickAtX;
  float d2d = max(xDist, zDist) - 0.003;
  float tipD = length(vec2(sp.x, sp.y - bladeLen + 0.1)) - 0.08 * (1.0 - tipTaper);
  d2d = mix(d2d, tipD, tipTaper * 0.7);
  float d = max(d2d, sp.y - bladeLen);
  d = max(d, -sp.y - 0.02);
  return d * scale;
}

float sdKatanaHandle(vec3 p) {
  float scale = 0.15;
  vec3 sp = p / scale;
  float handleLen = 0.8;
  vec3 hp = sp - vec3(0.0, -handleLen * 0.5, 0.0);
  vec2 sz = vec2(0.055, 0.04);
  float d = length(hp.xz / sz) - 1.0;
  d = max(d * min(sz.x, sz.y), abs(hp.y) - handleLen * 0.5);
  vec3 kashiraP = sp - vec3(0.0, -handleLen - 0.02, 0.0);
  float kashira = length(kashiraP / vec3(0.06, 0.03, 0.045)) - 1.0;
  kashira *= 0.03;
  d = min(d * scale, kashira * scale);
  return d;
}

float sdKatanaGuard(vec3 p) {
  float scale = 0.15;
  vec3 sp = p / scale;
  float radius = 0.18;
  float thick = 0.015;
  float d = length(sp.xz) - radius;
  d = max(d, abs(sp.y) - thick);
  float hole = length(sp.xz / vec2(0.13, 0.03)) - 1.0;
  d = max(d, -hole * 0.02);
  return d * scale;
}

float sdKatanaHabaki(vec3 p) {
  float scale = 0.15;
  vec3 sp = p / scale;
  vec3 hp = sp - vec3(0.0, -0.02, 0.0);
  float d = length(hp.xz / vec2(0.08, 0.035)) - 1.0;
  d = max(d * 0.03, abs(hp.y) - 0.05);
  return d * scale;
}

float sdKatanaSeppa(vec3 p, float yOffset) {
  float scale = 0.15;
  vec3 sp = p / scale;
  vec3 seppaP = sp - vec3(0.0, yOffset, 0.0);
  float d = length(seppaP.xz) - 0.1;
  d = max(d, abs(seppaP.y) - 0.008);
  return d * scale;
}

float sdKatana(vec3 p) {
  float blade = sdKatanaBlade(p);
  float handle = sdKatanaHandle(p);
  float guard = sdKatanaGuard(p);
  float habaki = sdKatanaHabaki(p);
  float seppa1 = sdKatanaSeppa(p, 0.015);
  float seppa2 = sdKatanaSeppa(p, -0.015);
  float d = min(blade, handle);
  d = min(d, guard);
  d = min(d, habaki);
  d = min(d, seppa1);
  d = min(d, seppa2);
  return d;
}

int getKatanaMaterial(vec3 p) {
  float blade = sdKatanaBlade(p);
  float handle = sdKatanaHandle(p);
  float guard = sdKatanaGuard(p);
  float habaki = sdKatanaHabaki(p);
  float seppa = min(sdKatanaSeppa(p, 0.015), sdKatanaSeppa(p, -0.015));
  float minD = blade;
  int mat = 0;
  if (handle < minD) { minD = handle; mat = 1; }
  if (guard < minD) { minD = guard; mat = 2; }
  if (habaki < minD || seppa < minD) { mat = 3; }
  return mat;
}

// Рендер катаны
vec4 renderKatana(vec3 ro, vec3 rd, float attack, float bob, int charges, vec3 ambient, vec3 accentColor) {
  float cy = cos(u_cameraYaw), sy = sin(u_cameraYaw);
  float cp = cos(u_cameraPitch), sp = sin(u_cameraPitch);
  
  vec3 camForward = vec3(sy * cp, sp, -cy * cp);
  vec3 camRight = vec3(cy, 0.0, sy);
  vec3 camUp = cross(camRight, camForward);
  
  vec3 localOffset = vec3(0.06, -0.1, 0.32);
  localOffset.x += sin(bob) * 0.003;
  localOffset.y += abs(sin(bob * 2.0)) * 0.002;
  
  float rotX = -1.1;
  float rotZ = 0.25;
  float rotY = 0.15;
  
  // Упреждающий замах
  if (u_katanaTargetAngle > -0.5 && attack < 0.1) {
    float targetInfluence = smoothstep(6.0, 3.0, u_katanaTargetDist);
    float angleOffset = clamp(u_katanaTargetAngle, -0.8, 0.8);
    float windUpAmount = smoothstep(5.0, 3.0, u_katanaTargetDist);
    
    if (angleOffset < 0.0) {
      rotX += windUpAmount * 0.7;
      rotZ += windUpAmount * 0.6;
      rotY += windUpAmount * 0.5;
      localOffset.y += windUpAmount * 0.12;
      localOffset.x += windUpAmount * 0.08;
    } else {
      rotX += windUpAmount * 0.8;
      rotZ -= windUpAmount * 0.7;
      rotY -= windUpAmount * 0.5;
      localOffset.y += windUpAmount * 0.14;
      localOffset.x -= windUpAmount * 0.1;
    }
    
    float tension = sin(u_time * 12.0) * 0.01 * targetInfluence;
    rotZ += tension;
    rotX += tension * 0.5;
  }
  
  // Анимация атаки
  if (attack > 0.0) {
    float t = attack;
    float windUp = smoothstep(0.0, 0.12, t);
    float strike = smoothstep(0.12, 0.38, t);
    float recover = smoothstep(0.42, 1.0, t);
    float strikeEase = 1.0 - pow(1.0 - strike, 5.0);
    float swingPower = strikeEase * (1.0 - recover);
    float windUpPower = windUp * (1.0 - strike);
    
    if (u_katanaAttackType == 0) {
      rotX += windUpPower * 1.1;
      rotZ += windUpPower * 0.6;
      rotY += windUpPower * 0.7;
      localOffset.y += windUpPower * 0.18;
      localOffset.x += windUpPower * 0.1;
      localOffset.z -= windUpPower * 0.05;
      rotX -= swingPower * 2.0;
      rotZ -= swingPower * 1.4;
      rotY -= swingPower * 0.3;
      localOffset.y -= swingPower * 0.14;
      localOffset.x -= swingPower * 0.12;
      localOffset.z += swingPower * 0.12;
    } else if (u_katanaAttackType == 1) {
      rotX += windUpPower * 1.2;
      rotZ -= windUpPower * 1.1;
      rotY -= windUpPower * 0.8;
      localOffset.y += windUpPower * 0.2;
      localOffset.x -= windUpPower * 0.15;
      localOffset.z -= windUpPower * 0.06;
      rotX -= swingPower * 2.0;
      rotZ += swingPower * 2.0;
      rotY += swingPower * 0.6;
      localOffset.y -= swingPower * 0.14;
      localOffset.x += swingPower * 0.16;
      localOffset.z += swingPower * 0.1;
    } else {
      rotZ += windUpPower * 0.7;
      rotY += windUpPower * 0.4;
      localOffset.x += windUpPower * 0.08;
      localOffset.z -= windUpPower * 0.03;
      rotZ -= swingPower * 2.6;
      rotX -= swingPower * 0.25;
      rotY -= swingPower * 0.3;
      localOffset.x -= swingPower * 0.2;
      localOffset.z += swingPower * 0.1;
    }
    
    if (t > 0.28 && t < 0.48) {
      float shake = sin(t * 180.0) * 0.005 * (1.0 - smoothstep(0.28, 0.48, t));
      localOffset.x += shake;
      localOffset.y += shake * 0.5;
    }
  }
  
  vec3 katanaWorldPos = ro + camRight * localOffset.x + camUp * localOffset.y + camForward * localOffset.z;
  
  float cx = cos(rotX), sx = sin(rotX);
  float cy2 = cos(rotY), sy2 = sin(rotY);
  float cz = cos(rotZ), sz = sin(rotZ);
  
  mat3 localRot = mat3(
    cz * cy2, -sz * cx + cz * sy2 * sx, sz * sx + cz * sy2 * cx,
    sz * cy2, cz * cx + sz * sy2 * sx, -cz * sx + sz * sy2 * cx,
    -sy2, cy2 * sx, cy2 * cx
  );
  
  mat3 camMat = mat3(camRight, camUp, camForward);
  mat3 rotMat = camMat * localRot;
  
  float t = 0.0;
  float maxDist = 1.0;
  
  for (int i = 0; i < 24; i++) {
    vec3 p = ro + rd * t;
    vec3 localP = transpose(rotMat) * (p - katanaWorldPos);
    float d = sdKatana(localP);
    
    if (d < 0.001) {
      vec3 hitP = localP;
      int mat = getKatanaMaterial(hitP);
      
      vec2 e = vec2(0.0005, 0.0);
      vec3 n = normalize(vec3(
        sdKatana(hitP + e.xyy) - sdKatana(hitP - e.xyy),
        sdKatana(hitP + e.yxy) - sdKatana(hitP - e.yxy),
        sdKatana(hitP + e.yyx) - sdKatana(hitP - e.yyx)
      ));
      n = rotMat * n;
      
      vec3 lightDir = normalize(vec3(0.2, 0.8, -0.5));
      vec3 viewLight = normalize(vec3(0.0, 0.0, -1.0));
      float diff = max(dot(n, lightDir), 0.0) * 0.5 + 0.3;
      diff += max(dot(n, viewLight), 0.0) * 0.3;
      float spec = pow(max(dot(reflect(rd, n), lightDir), 0.0), 64.0);
      float viewSpec = pow(max(dot(reflect(rd, n), viewLight), 0.0), 32.0);
      
      vec3 color;
      
      if (mat == 0) {
        vec3 steelColor = vec3(0.85, 0.88, 0.92);
        float hamonY = hitP.y * 0.15;
        float hamonLine = sin(hamonY * 80.0 + sin(hamonY * 30.0) * 2.0) * 0.003;
        float hamon = smoothstep(0.002, -0.002, hitP.z - hamonLine - 0.002);
        vec3 ji = vec3(0.6, 0.62, 0.65);
        vec3 yakiba = vec3(0.95, 0.97, 1.0);
        steelColor = mix(ji, yakiba, hamon);
        color = steelColor * diff * ambient * 4.0;
        color += vec3(1.0) * (spec + viewSpec) * 0.9;
        float edge = smoothstep(0.002, 0.0, abs(hitP.z) - 0.001);
        color += vec3(1.0, 0.98, 0.95) * edge * 0.4;
        color += accentColor * edge * 0.2;
        if (charges > 0) {
          float scale = 0.15;
          for (int j = 0; j < 3; j++) {
            if (j < charges) {
              float cy = (0.3 + float(j) * 0.25) * scale;
              float dist = abs(hitP.y - cy);
              float glow = smoothstep(0.03, 0.0, dist);
              color += accentColor * glow * 0.6;
            }
          }
        }
      } else if (mat == 1) {
        vec3 handleBase = vec3(0.02, 0.02, 0.02);
        vec3 itoColor = vec3(0.08, 0.05, 0.12);
        float scale = 0.15;
        float wrapY = hitP.y / scale;
        float wrapAngle = atan(hitP.z, hitP.x);
        float wrap = step(0.5, fract(wrapY * 12.0 + wrapAngle * 0.5));
        vec3 handleColor = mix(handleBase, itoColor, wrap);
        color = handleColor * diff * ambient * 3.0;
      } else if (mat == 2) {
        vec3 guardBase = vec3(0.15, 0.12, 0.08);
        color = guardBase * diff * ambient * 3.0;
        color += vec3(0.3, 0.25, 0.2) * spec * 0.5;
      } else {
        vec3 metalColor = vec3(0.5, 0.45, 0.35);
        color = metalColor * diff * ambient * 3.0;
        color += vec3(0.6, 0.55, 0.45) * (spec + viewSpec) * 0.6;
      }
      
      return vec4(color, 1.0);
    }
    
    t += d;
    if (t > maxDist) break;
  }
  
  return vec4(0.0);
}

void main() {
  // 1. Читаем geometry pass (автоматический bilinear upscale)
  vec4 geo = texture(u_geometryTex, v_uv);
  vec3 color = geo.rgb;
  float depth = geo.a;
  
  // 2. Рендерим катану (на полном разрешении)
  if (u_katanaEnabled == 1) {
    vec2 uv = (v_uv - 0.5) * 2.0;
    uv.x *= u_resolution.x / u_resolution.y;
    
    float cy = cos(u_cameraYaw), sy = sin(u_cameraYaw);
    float cp = cos(u_cameraPitch), sp = sin(u_cameraPitch);
    vec3 forward = vec3(sy * cp, sp, -cy * cp);
    vec3 right = vec3(cy, 0.0, sy);
    vec3 up = cross(right, forward);
    vec3 rd = normalize(forward + uv.x * right + uv.y * up);
    
    vec3 katanaAmbient;
    vec3 katanaAccent;
    if (u_era == 1) {
      katanaAmbient = vec3(0.08, 0.12, 0.08);
      katanaAccent = vec3(0.4, 1.0, 0.2);
    } else if (u_era == 2) {
      katanaAmbient = vec3(0.07, 0.05, 0.12);
      katanaAccent = vec3(0.7, 0.15, 1.0);
    } else {
      katanaAmbient = vec3(0.08, 0.1, 0.14);
      katanaAccent = vec3(0.15, 0.7, 1.0);
    }
    
    vec4 katanaResult = renderKatana(u_cameraPos, rd, u_katanaAttack, u_katanaBob, u_katanaCharges, katanaAmbient, katanaAccent);
    if (katanaResult.w > 0.0) {
      color = katanaResult.rgb;
    }
  }
  
  // 3. ХОЛОДНЫЙ СЛЕД КАТАНЫ (серебристо-голубой)
  if (u_katanaAttack > 0.08 && u_katanaAttack < 0.65) {
    vec2 screenUV = v_uv;
    float swingProgress = smoothstep(0.08, 0.4, u_katanaAttack);
    float fadeOut = 1.0 - smoothstep(0.35, 0.65, u_katanaAttack);
    
    vec2 arcCenter;
    float arcStartAngle, arcEndAngle;
    
    if (u_katanaAttackType == 0) {
      arcCenter = vec2(0.75, 0.2);
      arcStartAngle = -0.8;
      arcEndAngle = 2.8;
    } else if (u_katanaAttackType == 1) {
      arcCenter = vec2(0.25, 0.2);
      arcStartAngle = 0.4;
      arcEndAngle = 4.0;
    } else {
      arcCenter = vec2(0.5, 0.45);
      arcStartAngle = -0.5;
      arcEndAngle = 3.6;
    }
    
    vec2 toPixel = screenUV - arcCenter;
    float dist = length(toPixel);
    float angle = atan(toPixel.y, toPixel.x);
    float currentAngle = mix(arcStartAngle, arcEndAngle, swingProgress);
    float angleDiff = abs(angle - currentAngle);
    if (angleDiff > 3.14159) angleDiff = 6.28318 - angleDiff;
    
    float arcRadius = 0.4;
    float radiusDiff = abs(dist - arcRadius);
    float trail = smoothstep(0.35, 0.0, angleDiff) * smoothstep(0.06, 0.01, radiusDiff);
    float tipGlow = smoothstep(0.15, 0.0, angleDiff) * smoothstep(0.04, 0.005, radiusDiff);
    
    vec3 steelBlue = vec3(0.7, 0.85, 1.0);
    vec3 sharpEdge = vec3(0.9, 0.95, 1.0);
    vec3 innerGlow = vec3(0.4, 0.6, 0.9);
    
    float trailFade = smoothstep(0.0, 0.3, angleDiff);
    vec3 trailColor = mix(sharpEdge, innerGlow, trailFade);
    
    float shimmer = 0.8 + 0.2 * sin(u_time * 30.0 + angle * 10.0);
    float intensity = (trail * 0.5 + tipGlow * 1.2) * fadeOut * shimmer;
    
    color += trailColor * intensity * 0.8;
    color = mix(color, sharpEdge, tipGlow * fadeOut * 0.6);
  }
  
  // 4. ПОСТЭФФЕКТЫ (опционально)
  if (u_postfxEnabled == 1) {
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    
    // BLOOM GLOW
    float bloomBright = max(max(color.r, color.g), color.b);
    if (bloomBright > 0.7) {
      float bloomStr = (bloomBright - 0.7) * 0.5;
      vec3 bloomCol = color * (1.0 + bloomStr);
      float bloomSpread = exp(-length(v_uv - 0.5) * 2.0);
      color = mix(color, bloomCol, bloomStr * bloomSpread);
    }
    
    // АНАМОРФНЫЕ БЛИКИ
    if (bloomBright > 0.75) {
      float streak = exp(-abs(v_uv.y - 0.5) * 6.0) * (bloomBright - 0.75) * 0.4;
      color += vec3(0.5, 0.7, 1.0) * streak;
    }
    
    // ХРОМАТИЧЕСКАЯ АБЕРРАЦИЯ (на краях)
    vec2 vigUV = v_uv - 0.5;
    float vigDist = length(vigUV);
    float aberr = vigDist * vigDist * 0.015;
    color.r += (hash(v_uv + 0.1) - 0.5) * aberr;
    color.b -= (hash(v_uv + 0.2) - 0.5) * aberr;
    
    // ПЛЁНОЧНАЯ ЗЕРНИСТОСТЬ
    float grain = filmGrain(v_uv * u_resolution, u_time * 60.0);
    float grainStr = mix(0.035, 0.01, lum);
    color += (grain - 0.5) * grainStr;
  }
  
  // 5. ВИНЬЕТКА (всегда)
  vec2 vigUV2 = v_uv - 0.5;
  float vigDist2 = length(vigUV2);
  float vig = 1.0 - vigDist2 * vigDist2 * 1.2;
  vig = smoothstep(0.0, 0.8, vig);
  color *= mix(0.7, 1.0, vig);
  
  // 6. DITHERING (устранение color banding)
  float dither = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 128.0;
  color += dither;
  
  // Финальный clamp
  color = clamp(color, 0.0, 1.0);
  
  fragColor = vec4(color, 1.0);
}
`,yt=28;class I{constructor(t){this.canvas=t,this.loadSettings(),this.applyProfile(),console.log(`🖥️ Экран: ${window.screen.width}×${window.screen.height}, качество: ${this.quality.toUpperCase()}`);const e=t.getContext("webgl2");if(!e)throw new Error("WebGL2 не поддерживается");this.gl=e,this.uniforms={resolution:null,time:null,turboMode:null,cameraPos:null,cameraDir:null,cameraYaw:null,cameraPitch:null,targets:null,targetCount:null,muzzleFlash:null,pools:null,poolCount:null,acidProjectiles:null,acidProjectileCount:null,spikes:null,spikeTargets:null,spikeCount:null,acidRainZones:null,acidRainZoneCount:null,era:null,altars:null,darts:null,dartDirs:null,dartCount:null,voidPortalActive:null,bloodCoins:null,bloodCoinCount:null,wave:null,greenBossPhase2:null,pickups:null,pickupCount:null,crystals:null,crystalCount:null,voidMode:null,voidProgress:null,voidFallOffset:null,portalPos:null,grenades:null,grenadeCount:null,explosions:null,explosionCount:null,voidVariant:null,katanaAttack:null,katanaBob:null,katanaCharges:null,katanaTargetAngle:null,katanaTargetDist:null,katanaAttackType:null,deathEffects:null,fragments:null,fragmentCount:null,shadowsEnabled:null,postfxEnabled:null,katanaEnabled:null},this.init()}gl;program=null;uniforms;vao=null;geometryFBO=null;geometryTexture=null;geometryWidth=320;geometryHeight=180;compositeProgram=null;compositeUniforms={};renderScale=.6;shadowsEnabled=!0;postfxEnabled=!0;katanaEnabled=!0;turboEnabled=!1;frameCount=0;lastFpsUpdate=0;currentFps=60;static QUALITY_PRESETS={ultra_low:{width:426,height:240},low:{width:640,height:360},medium:{width:854,height:480},high:{width:1280,height:720}};quality="low";targetWidth=640;targetHeight=360;phoneScale=0;get isPhoneProfile(){return this.phoneScale>0}init(){const t=this.gl,e=this.compileShader(t.VERTEX_SHADER,gt),i=this.isPhoneProfile?vt.replace("#define MAX_STEPS 40",`#define MAX_STEPS ${yt}`):vt,a=this.compileShader(t.FRAGMENT_SHADER,i);if(!e||!a)throw new Error("Ошибка компиляции шейдеров");if(this.program=t.createProgram(),t.attachShader(this.program,e),t.attachShader(this.program,a),t.linkProgram(this.program),!t.getProgramParameter(this.program,t.LINK_STATUS))throw new Error("Ошибка линковки: "+t.getProgramInfoLog(this.program));this.createCompositeProgram(),this.createGeometryFBO(),this.uniforms.resolution=t.getUniformLocation(this.program,"u_resolution"),this.uniforms.time=t.getUniformLocation(this.program,"u_time"),this.uniforms.turboMode=t.getUniformLocation(this.program,"u_turboMode"),this.uniforms.cameraPos=t.getUniformLocation(this.program,"u_cameraPos"),this.uniforms.cameraYaw=t.getUniformLocation(this.program,"u_cameraYaw"),this.uniforms.cameraPitch=t.getUniformLocation(this.program,"u_cameraPitch"),this.uniforms.targets=t.getUniformLocation(this.program,"u_targets"),this.uniforms.targetCount=t.getUniformLocation(this.program,"u_targetCount"),this.uniforms.muzzleFlash=t.getUniformLocation(this.program,"u_muzzleFlash"),this.uniforms.pools=t.getUniformLocation(this.program,"u_pools"),this.uniforms.poolCount=t.getUniformLocation(this.program,"u_poolCount"),this.uniforms.acidProjectiles=t.getUniformLocation(this.program,"u_acidProjectiles"),this.uniforms.acidProjectileCount=t.getUniformLocation(this.program,"u_acidProjectileCount"),this.uniforms.spikes=t.getUniformLocation(this.program,"u_spikes"),this.uniforms.spikeTargets=t.getUniformLocation(this.program,"u_spikeTargets"),this.uniforms.spikeCount=t.getUniformLocation(this.program,"u_spikeCount"),this.uniforms.acidRainZones=t.getUniformLocation(this.program,"u_acidRainZones"),this.uniforms.acidRainZoneCount=t.getUniformLocation(this.program,"u_acidRainZoneCount"),this.uniforms.era=t.getUniformLocation(this.program,"u_era"),this.uniforms.altars=t.getUniformLocation(this.program,"u_altars"),this.uniforms.darts=t.getUniformLocation(this.program,"u_darts"),this.uniforms.dartDirs=t.getUniformLocation(this.program,"u_dartDirs"),this.uniforms.dartCount=t.getUniformLocation(this.program,"u_dartCount"),this.uniforms.voidPortalActive=t.getUniformLocation(this.program,"u_voidPortalActive"),this.uniforms.bloodCoins=t.getUniformLocation(this.program,"u_bloodCoins"),this.uniforms.bloodCoinCount=t.getUniformLocation(this.program,"u_bloodCoinCount"),this.uniforms.wave=t.getUniformLocation(this.program,"u_wave"),this.uniforms.greenBossPhase2=t.getUniformLocation(this.program,"u_greenBossPhase2"),this.uniforms.pickups=t.getUniformLocation(this.program,"u_pickups"),this.uniforms.pickupCount=t.getUniformLocation(this.program,"u_pickupCount"),this.uniforms.crystals=t.getUniformLocation(this.program,"u_crystals"),this.uniforms.voidMode=t.getUniformLocation(this.program,"u_voidMode"),this.uniforms.voidProgress=t.getUniformLocation(this.program,"u_voidProgress"),this.uniforms.voidFallOffset=t.getUniformLocation(this.program,"u_voidFallOffset"),this.uniforms.portalPos=t.getUniformLocation(this.program,"u_portalPos"),this.uniforms.grenades=t.getUniformLocation(this.program,"u_grenades"),this.uniforms.grenadeCount=t.getUniformLocation(this.program,"u_grenadeCount"),this.uniforms.explosions=t.getUniformLocation(this.program,"u_explosions"),this.uniforms.explosionCount=t.getUniformLocation(this.program,"u_explosionCount"),this.uniforms.voidVariant=t.getUniformLocation(this.program,"u_voidVariant"),this.uniforms.katanaAttack=t.getUniformLocation(this.program,"u_katanaAttack"),this.uniforms.katanaBob=t.getUniformLocation(this.program,"u_katanaBob"),this.uniforms.katanaCharges=t.getUniformLocation(this.program,"u_katanaCharges"),this.uniforms.katanaTargetAngle=t.getUniformLocation(this.program,"u_katanaTargetAngle"),this.uniforms.katanaTargetDist=t.getUniformLocation(this.program,"u_katanaTargetDist"),this.uniforms.katanaAttackType=t.getUniformLocation(this.program,"u_katanaAttackType"),this.uniforms.deathEffects=t.getUniformLocation(this.program,"u_deathEffects"),this.uniforms.fragments=t.getUniformLocation(this.program,"u_fragments"),this.uniforms.fragmentCount=t.getUniformLocation(this.program,"u_fragmentCount"),this.uniforms.shadowsEnabled=t.getUniformLocation(this.program,"u_shadowsEnabled"),this.uniforms.postfxEnabled=t.getUniformLocation(this.program,"u_postfxEnabled"),this.uniforms.katanaEnabled=t.getUniformLocation(this.program,"u_katanaEnabled"),this.createQuad()}compileShader(t,e){const i=this.gl,a=i.createShader(t);return a?(i.shaderSource(a,e),i.compileShader(a),i.getShaderParameter(a,i.COMPILE_STATUS)?a:(console.error("Ошибка шейдера:",i.getShaderInfoLog(a)),i.deleteShader(a),null)):null}createQuad(){const t=this.gl,e=new Float32Array([-1,-1,1,-1,-1,1,1,1]);this.vao=t.createVertexArray(),t.bindVertexArray(this.vao);const i=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,i),t.bufferData(t.ARRAY_BUFFER,e,t.STATIC_DRAW);const a=t.getAttribLocation(this.program,"a_position");t.enableVertexAttribArray(a),t.vertexAttribPointer(a,2,t.FLOAT,!1,0,0),t.bindVertexArray(null)}createGeometryFBO(){const t=this.gl;this.geometryWidth=Math.floor(this.targetWidth*.75),this.geometryHeight=Math.floor(this.targetHeight*.75);const i=!!t.getExtension("EXT_color_buffer_float");this.geometryTexture=t.createTexture(),t.bindTexture(t.TEXTURE_2D,this.geometryTexture),i?t.texImage2D(t.TEXTURE_2D,0,t.RGBA16F,this.geometryWidth,this.geometryHeight,0,t.RGBA,t.FLOAT,null):t.texImage2D(t.TEXTURE_2D,0,t.RGBA,this.geometryWidth,this.geometryHeight,0,t.RGBA,t.UNSIGNED_BYTE,null),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),this.geometryFBO=t.createFramebuffer(),t.bindFramebuffer(t.FRAMEBUFFER,this.geometryFBO),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,this.geometryTexture,0);const a=t.checkFramebufferStatus(t.FRAMEBUFFER);if(a!==t.FRAMEBUFFER_COMPLETE)console.error("❌ Geometry FBO incomplete:",a);else{const o=i?"RGBA16F":"RGBA8";console.log(`✅ Geometry FBO: ${this.geometryWidth}×${this.geometryHeight} (${o})`)}t.bindFramebuffer(t.FRAMEBUFFER,null)}createCompositeProgram(){const t=this.gl,e=this.compileShader(t.VERTEX_SHADER,gt),i=this.compileShader(t.FRAGMENT_SHADER,jt);if(!e||!i){console.error("❌ Ошибка компиляции composite shader");return}if(this.compositeProgram=t.createProgram(),t.attachShader(this.compositeProgram,e),t.attachShader(this.compositeProgram,i),t.linkProgram(this.compositeProgram),!t.getProgramParameter(this.compositeProgram,t.LINK_STATUS)){console.error("❌ Ошибка линковки composite:",t.getProgramInfoLog(this.compositeProgram));return}this.compositeUniforms={geometryTex:t.getUniformLocation(this.compositeProgram,"u_geometryTex"),resolution:t.getUniformLocation(this.compositeProgram,"u_resolution"),time:t.getUniformLocation(this.compositeProgram,"u_time"),cameraPos:t.getUniformLocation(this.compositeProgram,"u_cameraPos"),cameraYaw:t.getUniformLocation(this.compositeProgram,"u_cameraYaw"),cameraPitch:t.getUniformLocation(this.compositeProgram,"u_cameraPitch"),katanaAttack:t.getUniformLocation(this.compositeProgram,"u_katanaAttack"),katanaBob:t.getUniformLocation(this.compositeProgram,"u_katanaBob"),katanaCharges:t.getUniformLocation(this.compositeProgram,"u_katanaCharges"),katanaTargetAngle:t.getUniformLocation(this.compositeProgram,"u_katanaTargetAngle"),katanaTargetDist:t.getUniformLocation(this.compositeProgram,"u_katanaTargetDist"),katanaAttackType:t.getUniformLocation(this.compositeProgram,"u_katanaAttackType"),katanaEnabled:t.getUniformLocation(this.compositeProgram,"u_katanaEnabled"),postfxEnabled:t.getUniformLocation(this.compositeProgram,"u_postfxEnabled"),era:t.getUniformLocation(this.compositeProgram,"u_era")},console.log("✅ Composite shader создан")}recreateGeometryFBO(){const t=this.gl;this.geometryFBO&&t.deleteFramebuffer(this.geometryFBO),this.geometryTexture&&t.deleteTexture(this.geometryTexture),this.createGeometryFBO()}applyProfile(){const t=Tt();if(t&&t!=="phone"){this.quality=t;const e=I.QUALITY_PRESETS[t];this.targetWidth=e.width,this.targetHeight=e.height}Rt()&&(this.phoneScale=zt(),this.shadowsEnabled=!1,this.updatePhoneTarget(),console.log(`📱 Phone-профиль: рендер ×${this.phoneScale} от окна (${this.targetWidth}×${this.targetHeight}), без теней, MAX_STEPS ${yt}`))}updatePhoneTarget(){const t=Math.max(160,Math.round(window.innerWidth*this.phoneScale)),e=Math.max(90,Math.round(window.innerHeight*this.phoneScale));return t===this.targetWidth&&e===this.targetHeight?!1:(this.targetWidth=t,this.targetHeight=e,!0)}resize(){this.isPhoneProfile&&this.geometryFBO&&this.updatePhoneTarget()&&this.recreateGeometryFBO();const t=this.targetWidth,e=this.targetHeight;(this.canvas.width!==t||this.canvas.height!==e)&&(this.canvas.width=t,this.canvas.height=e,this.gl.viewport(0,0,t,e))}setQuality(t){this.quality=t,this.phoneScale=0;const e=I.QUALITY_PRESETS[t];this.targetWidth=e.width,this.targetHeight=e.height,this.recreateGeometryFBO(),this.saveSettings(),console.log(`📐 Качество: ${t.toUpperCase()} (${e.width}×${e.height}, geometry: ${this.geometryWidth}×${this.geometryHeight})`)}saveSettings(){const t={quality:this.quality,shadows:this.shadowsEnabled,postfx:this.postfxEnabled,katana:this.katanaEnabled,turbo:this.turboEnabled};localStorage.setItem("gameSettings",JSON.stringify(t))}loadSettings(){try{const t=localStorage.getItem("gameSettings");if(t){const e=JSON.parse(t);if(e.quality&&I.QUALITY_PRESETS[e.quality]){this.quality=e.quality;const i=I.QUALITY_PRESETS[this.quality];this.targetWidth=i.width,this.targetHeight=i.height}typeof e.shadows=="boolean"&&(this.shadowsEnabled=e.shadows),typeof e.postfx=="boolean"&&(this.postfxEnabled=e.postfx),typeof e.katana=="boolean"&&(this.katanaEnabled=e.katana),typeof e.turbo=="boolean"&&(this.turboEnabled=e.turbo),console.log("💾 Настройки загружены из localStorage")}}catch(t){console.warn("⚠️ Не удалось загрузить настройки:",t)}}getRenderResolution(){return{width:this.targetWidth,height:this.targetHeight}}render(t,e,i,a,o,s,n,l,c,r,h,p,u,f,m,g,x,y,b,k,A,P,R,D,S,T,M,C,E,B,L,et,N,it,W,at,Y,Mt,st,ot,nt,H,rt,lt,ct,X,Pt){const d=this.gl;if(this.resize(),d.useProgram(this.program),d.bindVertexArray(this.vao),d.uniform2f(this.uniforms.resolution,this.canvas.width,this.canvas.height),d.uniform1f(this.uniforms.time,t),d.uniform1i(this.uniforms.turboMode,this.turboEnabled?1:0),d.uniform3f(this.uniforms.cameraPos,e.x,e.y,e.z),d.uniform1f(this.uniforms.cameraYaw,i),d.uniform1f(this.uniforms.cameraPitch,a),d.uniform4fv(this.uniforms.targets,o),d.uniform1i(this.uniforms.targetCount,s),d.uniform1f(this.uniforms.muzzleFlash,n),l&&c!==void 0?(d.uniform4fv(this.uniforms.pools,l),d.uniform1i(this.uniforms.poolCount,c)):d.uniform1i(this.uniforms.poolCount,0),m&&g!==void 0&&g>0?(d.uniform4fv(this.uniforms.acidProjectiles,m),d.uniform1i(this.uniforms.acidProjectileCount,g)):d.uniform1i(this.uniforms.acidProjectileCount,0),x&&y&&b!==void 0&&b>0?(d.uniform4fv(this.uniforms.spikes,x),d.uniform4fv(this.uniforms.spikeTargets,y),d.uniform1i(this.uniforms.spikeCount,b)):d.uniform1i(this.uniforms.spikeCount,0),k&&A!==void 0&&A>0?(d.uniform4fv(this.uniforms.acidRainZones,k),d.uniform1i(this.uniforms.acidRainZoneCount,A)):d.uniform1i(this.uniforms.acidRainZoneCount,0),d.uniform1i(this.uniforms.era,r||1),d.uniform1i(this.uniforms.wave,h||1),d.uniform1i(this.uniforms.greenBossPhase2,P?1:0),p&&u!==void 0?(d.uniform4fv(this.uniforms.pickups,p),d.uniform1i(this.uniforms.pickupCount,u)):d.uniform1i(this.uniforms.pickupCount,0),f&&d.uniform4fv(this.uniforms.crystals,f),d.uniform1i(this.uniforms.voidMode,R?1:0),d.uniform1f(this.uniforms.voidProgress,D||0),d.uniform1f(this.uniforms.voidFallOffset,S||0),d.uniform3f(this.uniforms.portalPos,T?.x||0,T?.y||0,T?.z||0),M&&d.uniform4fv(this.uniforms.altars,M),C&&E&&B!==void 0&&B>0?(d.uniform4fv(this.uniforms.darts,C),d.uniform4fv(this.uniforms.dartDirs,E),d.uniform1i(this.uniforms.dartCount,B)):d.uniform1i(this.uniforms.dartCount,0),d.uniform1f(this.uniforms.voidPortalActive,L||0),et&&N!==void 0&&N>0?(d.uniform4fv(this.uniforms.bloodCoins,et),d.uniform1i(this.uniforms.bloodCoinCount,N)):d.uniform1i(this.uniforms.bloodCoinCount,0),it&&W!==void 0&&W>0?(d.uniform4fv(this.uniforms.grenades,it),d.uniform1i(this.uniforms.grenadeCount,W)):d.uniform1i(this.uniforms.grenadeCount,0),at&&Y!==void 0&&Y>0?(d.uniform4fv(this.uniforms.explosions,at),d.uniform1i(this.uniforms.explosionCount,Y)):d.uniform1i(this.uniforms.explosionCount,0),d.uniform1i(this.uniforms.voidVariant,Mt||0),d.uniform1f(this.uniforms.katanaAttack,st||0),d.uniform1f(this.uniforms.katanaBob,ot||0),d.uniform1i(this.uniforms.katanaCharges,nt||0),d.uniform1f(this.uniforms.katanaTargetAngle,H!==void 0?H:-1),d.uniform1f(this.uniforms.katanaTargetDist,rt||100),d.uniform1i(this.uniforms.katanaAttackType,lt||0),ct?d.uniform4fv(this.uniforms.deathEffects,ct):d.uniform4fv(this.uniforms.deathEffects,new Float32Array(32)),X&&X.length>0){const F=new Float32Array(128);F.set(X.subarray(0,Math.min(X.length,128))),d.uniform4fv(this.uniforms.fragments,F),d.uniform1i(this.uniforms.fragmentCount,Math.min(Pt||0,32))}else d.uniform4fv(this.uniforms.fragments,new Float32Array(128)),d.uniform1i(this.uniforms.fragmentCount,0);if(d.uniform1i(this.uniforms.shadowsEnabled,this.shadowsEnabled?1:0),d.uniform1i(this.uniforms.postfxEnabled,0),d.uniform1i(this.uniforms.katanaEnabled,this.katanaEnabled?1:0),d.bindFramebuffer(d.FRAMEBUFFER,this.geometryFBO),d.viewport(0,0,this.geometryWidth,this.geometryHeight),d.uniform2f(this.uniforms.resolution,this.geometryWidth,this.geometryHeight),d.drawArrays(d.TRIANGLE_STRIP,0,4),d.bindFramebuffer(d.FRAMEBUFFER,null),d.viewport(0,0,this.canvas.width,this.canvas.height),this.compositeProgram&&(d.useProgram(this.compositeProgram),d.bindVertexArray(this.vao),d.activeTexture(d.TEXTURE0),d.bindTexture(d.TEXTURE_2D,this.geometryTexture),d.uniform1i(this.compositeUniforms.geometryTex,0),d.uniform2f(this.compositeUniforms.resolution,this.targetWidth,this.targetHeight),d.uniform1f(this.compositeUniforms.time,t),d.uniform3f(this.compositeUniforms.cameraPos,e.x,e.y,e.z),d.uniform1f(this.compositeUniforms.cameraYaw,i),d.uniform1f(this.compositeUniforms.cameraPitch,a),d.uniform1f(this.compositeUniforms.katanaAttack,st||0),d.uniform1f(this.compositeUniforms.katanaBob,ot||0),d.uniform1i(this.compositeUniforms.katanaCharges,nt||0),d.uniform1f(this.compositeUniforms.katanaTargetAngle,H!==void 0?H:-1),d.uniform1f(this.compositeUniforms.katanaTargetDist,rt||100),d.uniform1i(this.compositeUniforms.katanaAttackType,lt||0),d.uniform1i(this.compositeUniforms.katanaEnabled,0),d.uniform1i(this.compositeUniforms.postfxEnabled,this.postfxEnabled?1:0),d.uniform1i(this.compositeUniforms.era,r||1),d.drawArrays(d.TRIANGLE_STRIP,0,4)),this.frameCount++,t-this.lastFpsUpdate>=1){this.currentFps=this.frameCount,this.frameCount=0,this.lastFpsUpdate=t;const F=document.getElementById("fps-value"),K=document.getElementById("fps-live");if(F&&(F.textContent=String(this.currentFps)),K&&(K.textContent=String(this.currentFps),K.style.color=this.currentFps>=55?"#00ff88":this.currentFps>=30?"#ffcc00":"#ff4444"),this.isPhoneProfile)this.currentFps<25&&this.phoneScale>.35&&(this.phoneScale=Math.max(.35,this.phoneScale-.1),console.warn(`⚠️ Низкий FPS (${this.currentFps}) - масштаб рендера ${this.phoneScale.toFixed(2)}`));else if(this.currentFps<25&&this.quality!=="ultra_low"){const ht=["ultra_low","low","medium","high"],pt=ht.indexOf(this.quality);pt>0&&(this.setQuality(ht[pt-1]),console.warn(`⚠️ Низкий FPS (${this.currentFps}) - качество снижено до ${this.quality}`))}}}destroy(){this.program&&this.gl.deleteProgram(this.program)}}class $t{healthEl;ammoEl;fragsEl;crosshairEl;hitmarkerEl;reloadEl;waveEl;messageEl;damageOverlay;weaponEl;scoreEl;altarScoreEl;dartsEl;constructor(){this.healthEl=document.getElementById("health-value"),this.ammoEl=document.getElementById("ammo-value"),this.fragsEl=document.getElementById("frags-value"),this.crosshairEl=document.getElementById("crosshair"),this.hitmarkerEl=document.getElementById("hitmarker"),this.reloadEl=document.getElementById("reload-indicator"),this.reloadEl&&(this.reloadEl.style.display="none"),this.waveEl=this.createWaveElement(),this.messageEl=this.createMessageElement(),this.damageOverlay=this.createDamageOverlay(),this.weaponEl=this.createWeaponElement(),this.scoreEl=this.createScoreElement(),this.altarScoreEl=this.createAltarScoreElement(),this.dartsEl=this.createDartsElement(),this.hideHUD()}hideHUD(){const t=document.getElementById("hud");t&&(t.style.opacity="0"),this.weaponEl&&(this.weaponEl.style.display="none"),this.scoreEl&&(this.scoreEl.style.display="none"),this.altarScoreEl&&(this.altarScoreEl.style.display="none"),this.dartsEl&&(this.dartsEl.style.display="none"),this.doubleJumpEl&&(this.doubleJumpEl.style.display="none"),this.splashChargesEl&&(this.splashChargesEl.style.display="none")}showHUD(){const t=document.getElementById("hud");t&&(t.style.opacity="1"),this.weaponEl&&(this.weaponEl.style.display="block"),this.scoreEl&&(this.scoreEl.style.display="block"),this.altarScoreEl&&(this.altarScoreEl.style.display="block"),this.dartsEl&&(this.dartsEl.style.display="block"),this.doubleJumpEl&&(this.doubleJumpEl.style.display="block")}createDartsElement(){let t=document.getElementById("darts-count");return t||(t=document.createElement("div"),t.id="darts-count",t.style.cssText=`
        position: fixed;
        bottom: 70px;
        right: 15px;
        font-family: 'Rajdhani', sans-serif;
        font-size: 11px;
        font-weight: 500;
        color: rgba(255, 102, 0, 0.6);
        padding: 6px 12px;
        background: linear-gradient(180deg, rgba(255,102,0,0.08) 0%, transparent 100%);
        border-top: 1px solid rgba(255, 102, 0, 0.4);
        transform: skewX(-5deg);
        pointer-events: none;
        z-index: 1000;
        letter-spacing: 2px;
        text-transform: uppercase;
      `,t.innerHTML='◎ <span id="darts-value" style="font-family:Orbitron;font-size:16px;color:#ff6600;">0</span>',document.body.appendChild(t)),t}createScoreElement(){let t=document.getElementById("score-carrying");return t||(t=document.createElement("div"),t.id="score-carrying",t.style.cssText=`
        position: fixed;
        bottom: 105px;
        right: 15px;
        font-family: 'Rajdhani', sans-serif;
        font-size: 11px;
        font-weight: 500;
        color: rgba(255, 204, 0, 0.6);
        padding: 6px 12px;
        background: linear-gradient(180deg, rgba(255,204,0,0.08) 0%, transparent 100%);
        border-top: 1px solid rgba(255, 204, 0, 0.4);
        transform: skewX(-5deg);
        pointer-events: none;
        z-index: 1000;
        letter-spacing: 2px;
        text-transform: uppercase;
      `,t.innerHTML='✕ <span id="score-value" style="font-family:Orbitron;font-size:16px;color:#ffcc00;">0</span>',document.body.appendChild(t)),t}createAltarScoreElement(){let t=document.getElementById("altar-score");return t||(t=document.createElement("div"),t.id="altar-score",t.style.cssText=`
        position: fixed;
        bottom: 140px;
        right: 15px;
        font-family: 'Rajdhani', sans-serif;
        font-size: 11px;
        font-weight: 500;
        color: rgba(0, 240, 255, 0.6);
        padding: 8px 14px;
        background: linear-gradient(180deg, rgba(0,240,255,0.1) 0%, transparent 100%);
        border-top: 1px solid rgba(0, 240, 255, 0.5);
        transform: skewX(-5deg);
        pointer-events: none;
        z-index: 1000;
        letter-spacing: 2px;
        text-transform: uppercase;
      `,t.innerHTML='⌂ <span id="altar-value" style="font-family:Orbitron;font-size:20px;color:#00f0ff;text-shadow:0 0 20px rgba(0,240,255,0.6);">0</span>',document.body.appendChild(t)),t}createWaveElement(){let t=document.getElementById("wave-indicator");return t||(t=document.createElement("div"),t.id="wave-indicator",t.style.cssText=`
        position: fixed;
        top: 12%;
        left: 50%;
        transform: translateX(-50%) skewX(-3deg);
        font-family: 'Orbitron', sans-serif;
        font-size: 20px;
        font-weight: 600;
        color: #00f0ff;
        text-shadow: 0 0 30px rgba(0, 240, 255, 0.8);
        opacity: 0;
        padding: 12px 50px;
        background: linear-gradient(90deg, 
          transparent 0%, 
          rgba(0, 240, 255, 0.08) 10%, 
          rgba(0, 240, 255, 0.12) 50%, 
          rgba(0, 240, 255, 0.08) 90%, 
          transparent 100%
        );
        border-left: 2px solid rgba(0, 240, 255, 0.8);
        border-right: 2px solid rgba(0, 240, 255, 0.8);
        backdrop-filter: blur(4px);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
        z-index: 1000;
        letter-spacing: 8px;
        text-transform: uppercase;
      `,document.body.appendChild(t)),t}createMessageElement(){let t=document.getElementById("game-message");return t||(t=document.createElement("div"),t.id="game-message",t.style.cssText=`
        position: fixed;
        top: 45%;
        left: 50%;
        transform: translate(-50%, -50%) skewX(-2deg);
        font-family: 'Orbitron', sans-serif;
        font-size: 28px;
        font-weight: 700;
        color: #ff3366;
        text-shadow: 0 0 40px rgba(255, 51, 102, 0.9), 0 2px 0 rgba(0,0,0,0.3);
        opacity: 0;
        padding: 18px 60px;
        background: linear-gradient(90deg, 
          transparent 0%, 
          rgba(255, 51, 102, 0.1) 5%, 
          rgba(255, 51, 102, 0.15) 50%, 
          rgba(255, 51, 102, 0.1) 95%, 
          transparent 100%
        );
        border-top: 1px solid rgba(255, 51, 102, 0.5);
        border-bottom: 1px solid rgba(255, 51, 102, 0.5);
        backdrop-filter: blur(6px);
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
        text-align: center;
        z-index: 1000;
        letter-spacing: 6px;
        text-transform: uppercase;
      `,document.body.appendChild(t)),t}createDamageOverlay(){let t=document.getElementById("damage-overlay");return t||(t=document.createElement("div"),t.id="damage-overlay",t.style.cssText=`
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, 
          rgba(0, 255, 0, 0.3) 0%,
          rgba(50, 255, 50, 0.4) 30%,
          rgba(0, 150, 0, 0.5) 70%,
          rgba(0, 100, 0, 0.6) 100%
        );
        opacity: 0;
        transition: opacity 0.15s;
        pointer-events: none;
        z-index: 999;
      `,document.body.appendChild(t)),t}createWeaponElement(){let t=document.getElementById("weapon-indicator");return t||(t=document.createElement("div"),t.id="weapon-indicator",t.style.cssText=`
        position: fixed;
        bottom: 20px;
        right: 120px;
        font-family: 'Rajdhani', sans-serif;
        font-size: 10px;
        font-weight: 500;
        color: rgba(0, 240, 255, 0.5);
        letter-spacing: 3px;
        text-transform: uppercase;
        z-index: 100;
      `,t.textContent="⚔ КАТАНА",document.body.appendChild(t)),t}updateWeapon(t,e){this.weaponEl&&(t==="katana"?(this.weaponEl.textContent="⚔️ КАТАНА",this.weaponEl.style.color="#00ffff",this.weaponEl.style.borderColor="rgba(0, 255, 255, 0.5)"):(this.weaponEl.textContent=`🪓 ТОПОР (${e})`,this.weaponEl.style.color="#ff8800",this.weaponEl.style.borderColor="rgba(255, 136, 0, 0.5)",e!==void 0&&e<=2?this.weaponEl.style.animation="pulse 0.5s infinite":this.weaponEl.style.animation="none"))}slowOverlay=null;showDamage(t="green"){this.damageOverlay&&(t==="purple"?(this.damageOverlay.style.background=`radial-gradient(circle, 
          rgba(100, 0, 150, 0.3) 0%,
          rgba(80, 0, 120, 0.4) 30%,
          rgba(50, 0, 80, 0.5) 70%,
          rgba(30, 0, 50, 0.6) 100%
        )`,this.showSlowdown(2)):this.damageOverlay.style.background=`radial-gradient(circle, 
          rgba(0, 255, 0, 0.3) 0%,
          rgba(50, 255, 50, 0.4) 30%,
          rgba(0, 150, 0, 0.5) 70%,
          rgba(0, 100, 0, 0.6) 100%
        )`,this.damageOverlay.style.opacity="1",setTimeout(()=>{this.damageOverlay&&(this.damageOverlay.style.opacity="0")},150))}showSlowdown(t){this.slowOverlay||(this.slowOverlay=document.createElement("div"),this.slowOverlay.id="slow-overlay",this.slowOverlay.style.cssText=`
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle,
          transparent 0%,
          rgba(50, 0, 80, 0.2) 50%,
          rgba(30, 0, 60, 0.4) 100%
        );
        pointer-events: none;
        z-index: 998;
        opacity: 0;
        transition: opacity 0.3s;
      `,document.body.appendChild(this.slowOverlay)),this.slowOverlay.style.opacity="1",this.slowOverlay.animate([{filter:"hue-rotate(0deg) brightness(1)"},{filter:"hue-rotate(20deg) brightness(1.1)"},{filter:"hue-rotate(0deg) brightness(1)"}],{duration:500,iterations:Math.ceil(t*2)}),setTimeout(()=>{this.slowOverlay&&(this.slowOverlay.style.opacity="0")},t*1e3)}updateHealth(t,e){if(this.healthEl){this.healthEl.textContent=Math.floor(t).toString();const i=t/e;i>.5?this.healthEl.style.color="#00ffaa":i>.25?this.healthEl.style.color="#ffaa00":this.healthEl.style.color="#ff4444"}}updateCarryingScore(t){const e=document.getElementById("score-value");e&&(e.textContent=t.toString(),this.scoreEl&&(this.scoreEl.style.transform="scale(1.1)",setTimeout(()=>{this.scoreEl&&(this.scoreEl.style.transform="scale(1)")},100)))}updateAltarScore(t){const e=document.getElementById("altar-value");e&&(e.textContent=t.toString(),this.altarScoreEl&&(this.altarScoreEl.style.boxShadow="0 0 30px #00ffaa",setTimeout(()=>{this.altarScoreEl&&(this.altarScoreEl.style.boxShadow="")},300)))}updateDarts(t){const e=document.getElementById("darts-value");e&&(e.textContent=t.toString(),this.dartsEl&&(t===0?this.dartsEl.style.opacity="0.5":this.dartsEl.style.opacity="1"))}updateSplashCharges(t){this.splashChargesEl||this.createSplashChargesElement(),this.splashChargesEl&&(t>0?(this.splashChargesEl.style.display="block",this.splashChargesEl.innerHTML=`⚡ ВОЛНА: ${"●".repeat(t)}${"○".repeat(3-t)}`,this.splashChargesEl.style.color="#00ffff",this.splashChargesEl.style.textShadow="0 0 10px #00ffff, 0 0 20px #00ffff"):this.splashChargesEl.style.display="none")}splashChargesEl=null;doubleJumpEl=null;createSplashChargesElement(){this.splashChargesEl=document.createElement("div"),this.splashChargesEl.id="splash-charges",this.splashChargesEl.style.cssText=`
      position: fixed;
      bottom: 80px;
      right: 20px;
      font-family: 'Orbitron', 'Audiowide', monospace;
      font-size: 18px;
      color: #00ffff;
      text-shadow: 0 0 10px #00ffff;
      letter-spacing: 2px;
      display: none;
      z-index: 1000;
    `,document.body.appendChild(this.splashChargesEl)}updateDoubleJump(t,e){this.doubleJumpEl||this.createDoubleJumpElement(),this.doubleJumpEl&&(e?this.doubleJumpEl.style.opacity="0":this.doubleJumpEl.style.opacity="1")}createDoubleJumpElement(){this.doubleJumpEl=document.createElement("div"),this.doubleJumpEl.id="double-jump",this.doubleJumpEl.style.cssText=`
      position: fixed;
      bottom: 70px;
      left: 15px;
      font-size: 20px;
      color: rgba(255, 100, 100, 0.7);
      text-shadow: 0 0 8px rgba(255, 50, 50, 0.5);
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.2s;
      display: none;
    `,this.doubleJumpEl.innerHTML="⊘",document.body.appendChild(this.doubleJumpEl)}enemiesCount=0;updateAmmo(t,e){if(this.enemiesCount=e,this.updateFragsDisplay(),this.ammoEl){const i=this.ammoEl.parentElement;i&&(i.style.display="none")}}updateFrags(t){this.fragsEl&&(this.fragsEl.textContent=t.toString()),this.updateFragsDisplay()}updateFragsDisplay(){let t=document.getElementById("enemies-inline");if(!t){t=document.createElement("span"),t.id="enemies-inline",t.style.cssText=`
        margin-left: 15px;
        color: rgba(0, 212, 224, 0.8);
        font-size: 14px;
      `;const e=document.getElementById("frags");e&&e.appendChild(t)}this.enemiesCount>0?t.innerHTML=`<span style="color:rgba(0,212,224,0.5);">⚔</span> ${this.enemiesCount}`:t.innerHTML='<span style="color:#00ff88;">✓</span>'}showWave(t){this.waveEl&&(this.waveEl.textContent=`▸ ВОЛНА ${t} ◂`,this.waveEl.style.color="#00f0ff",this.waveEl.style.borderColor="rgba(0, 240, 255, 0.8)",this.waveEl.animate([{opacity:0,transform:"translateX(-50%) skewX(-3deg) scaleX(1.5)",filter:"blur(10px)"},{opacity:.5,transform:"translateX(-48%) skewX(-5deg) scaleX(1.1)",filter:"blur(2px)"},{opacity:1,transform:"translateX(-50%) skewX(-3deg) scaleX(1)",filter:"blur(0px)"}],{duration:400,fill:"forwards",easing:"cubic-bezier(0.16, 1, 0.3, 1)"}),setTimeout(()=>{this.waveEl&&this.waveEl.animate([{opacity:1,transform:"translateX(-50%) skewX(-3deg)"},{opacity:0,transform:"translateX(-50%) skewX(-3deg) translateY(-15px)"}],{duration:300,fill:"forwards",easing:"ease-in"})},1800))}showWaveComplete(t){this.waveEl&&(this.waveEl.textContent=`◈ ВОЛНА ${t} ПРОЙДЕНА ◈`,this.waveEl.style.color="#00ff88",this.waveEl.style.borderColor="rgba(0, 255, 136, 0.8)",this.waveEl.animate([{opacity:0,transform:"translateX(-50%) skewX(-3deg) scaleY(0.5)"},{opacity:1,transform:"translateX(-50%) skewX(-3deg) scaleY(1)"}],{duration:300,fill:"forwards",easing:"cubic-bezier(0.16, 1, 0.3, 1)"}),setTimeout(()=>{this.waveEl&&(this.waveEl.textContent="▸ ГОТОВЬСЯ ◂",this.waveEl.style.color="#ffaa00",this.waveEl.style.borderColor="rgba(255, 170, 0, 0.6)")},1500),setTimeout(()=>{this.waveEl&&this.waveEl.animate([{opacity:1},{opacity:0}],{duration:400,fill:"forwards"})},3200))}showGameOver(t,e){this.messageEl&&(this.messageEl.innerHTML=`
        <div style="font-size:32px;letter-spacing:8px;">GAME OVER</div>
        <div style="
          font-size: 14px; 
          color: rgba(0,240,255,0.8); 
          margin-top: 15px;
          letter-spacing: 4px;
          font-weight: 400;
        ">
          СЧЁТ <span style="color:#ff00ff;font-size:18px;">${t}</span> · ВОЛНА <span style="color:#ff00ff;font-size:18px;">${e}</span>
        </div>
      `,this.messageEl.animate([{opacity:0,transform:"translate(-50%, -50%) skewX(-2deg) scaleX(2)",filter:"blur(20px) hue-rotate(90deg)"},{opacity:.8,transform:"translate(-48%, -50%) skewX(-4deg) scaleX(1.1)",filter:"blur(5px) hue-rotate(0deg)"},{opacity:1,transform:"translate(-50%, -50%) skewX(-2deg) scaleX(1)",filter:"blur(0px) hue-rotate(0deg)"}],{duration:500,fill:"forwards",easing:"cubic-bezier(0.16, 1, 0.3, 1)"}),setTimeout(()=>{this.messageEl&&this.messageEl.animate([{opacity:1},{opacity:0,filter:"blur(10px)"}],{duration:500,fill:"forwards"})},3e3))}showReloading(t){}expandCrosshair(){this.crosshairEl&&(this.crosshairEl.classList.add("shooting"),setTimeout(()=>{this.crosshairEl?.classList.remove("shooting")},100))}showHitmarker(t=!1){this.hitmarkerEl&&(this.hitmarkerEl.className="hitmarker active",t&&this.hitmarkerEl.classList.add("kill"),setTimeout(()=>{this.hitmarkerEl?.classList.remove("active","kill")},150))}showDamageEffect(){this.showDamage("green")}showMessage(t,e="white"){const i=document.createElement("div");i.style.cssText=`
      position: fixed;
      top: 25%;
      left: 50%;
      transform: translateX(-50%) skewX(-3deg) translateY(20px);
      font-family: 'Orbitron', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: ${e};
      text-shadow: 0 0 30px ${e};
      padding: 10px 40px;
      background: linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.4) 20%, rgba(0,0,0,0.4) 80%, transparent 100%);
      border-left: 2px solid ${e};
      border-right: 2px solid ${e};
      pointer-events: none;
      z-index: 1100;
      opacity: 0;
      letter-spacing: 3px;
      text-transform: uppercase;
    `,i.textContent=t,document.body.appendChild(i),i.animate([{opacity:0,transform:"translateX(-50%) skewX(-3deg) translateY(30px)"},{opacity:1,transform:"translateX(-50%) skewX(-3deg) translateY(0)"}],{duration:200,fill:"forwards",easing:"cubic-bezier(0.16, 1, 0.3, 1)"}),setTimeout(()=>{i.animate([{opacity:1,transform:"translateX(-50%) skewX(-3deg) translateY(0)"},{opacity:0,transform:"translateX(-50%) skewX(-3deg) translateY(-20px)"}],{duration:300,fill:"forwards",easing:"ease-in"}),setTimeout(()=>i.remove(),300)},800)}rageOverlay=null;bossHealthBar=null;bossHealthFill=null;bossNameEl=null;voidOverlay=null;voidTimerEl=null;voidKillsEl=null;showRageOverlay(t){this.rageOverlay||(this.rageOverlay=document.createElement("div"),this.rageOverlay.id="rage-overlay",this.rageOverlay.style.cssText=`
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle,
          transparent 0%,
          rgba(255, 50, 0, 0.15) 50%,
          rgba(255, 0, 0, 0.3) 100%
        );
        pointer-events: none;
        z-index: 997;
        opacity: 0;
        transition: opacity 0.3s;
      `,document.body.appendChild(this.rageOverlay)),this.rageOverlay.style.opacity="1",this.rageOverlay.animate([{filter:"hue-rotate(0deg) brightness(1)"},{filter:"hue-rotate(-20deg) brightness(1.2)"},{filter:"hue-rotate(0deg) brightness(1)"}],{duration:300,iterations:Math.ceil(t*3)}),setTimeout(()=>{this.rageOverlay&&(this.rageOverlay.style.opacity="0")},t*1e3)}showBossHealth(t,e,i){if(!this.bossHealthBar){this.bossHealthBar=document.createElement("div"),this.bossHealthBar.style.cssText=`
        position: fixed;
        top: 50px;
        left: 50%;
        transform: translateX(-50%);
        width: 400px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.7);
        border: 2px solid #ff0000;
        border-radius: 8px;
        z-index: 1100;
        text-align: center;
        font-family: 'Orbitron', sans-serif;
        box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
      `,this.bossNameEl=document.createElement("div"),this.bossNameEl.style.cssText=`
        color: #ff4444;
        font-size: 16px;
        text-shadow: 0 0 10px #ff0000;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 3px;
      `,this.bossHealthBar.appendChild(this.bossNameEl);const s=document.createElement("div");s.style.cssText=`
        width: 100%;
        height: 20px;
        background: #333;
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid #666;
      `,this.bossHealthFill=document.createElement("div"),this.bossHealthFill.style.cssText=`
        height: 100%;
        transition: width 0.3s ease-out;
        border-radius: 10px;
      `,s.appendChild(this.bossHealthFill),this.bossHealthBar.appendChild(s),document.body.appendChild(this.bossHealthBar)}let a="БОСС",o="#ff0000";if(i==="boss_green"?(a="☠️ ТОКСИЧНЫЙ ГИГАНТ ☠️",o="linear-gradient(90deg, #00ff00, #88ff00)",this.bossHealthBar.style.borderColor="#00ff00",this.bossHealthBar.style.boxShadow="0 0 20px rgba(0, 255, 0, 0.5)"):i==="boss_black"?(a="🌀 ВЛАДЫКА ПУСТОТЫ 🌀",o="linear-gradient(90deg, #4400aa, #8800ff)",this.bossHealthBar.style.borderColor="#8800ff",this.bossHealthBar.style.boxShadow="0 0 20px rgba(136, 0, 255, 0.5)"):i==="boss_blue"&&(a="⚡ ФАНТОМ ХАОСА ⚡",o="linear-gradient(90deg, #0088ff, #00ffff)",this.bossHealthBar.style.borderColor="#00ffff",this.bossHealthBar.style.boxShadow="0 0 20px rgba(0, 255, 255, 0.5)"),this.bossNameEl&&(this.bossNameEl.textContent=a),this.bossHealthFill){const s=t/e*100;this.bossHealthFill.style.width=s+"%",this.bossHealthFill.style.background=o}this.bossHealthBar.style.display="block"}hideBossHealth(){this.bossHealthBar&&(this.bossHealthBar.style.display="none")}showBossIntro(t,e){let i="БОСС",a="",o="#ff0044",s="rgba(255, 0, 68, 0.5)",n="💀";t==="boss_green"?(i="ЯДОВИТЫЕ БЛИЗНЕЦЫ",a="Охотник & Загонщик",o="#00ff44",s="rgba(0, 255, 68, 0.5)",n="☣️"):t==="boss_black"?(i="ВЛАДЫКА ПУСТОТЫ",a="Повелитель Тьмы",o="#8800ff",s="rgba(136, 0, 255, 0.5)",n="🌀"):t==="boss_blue"&&(i="ФАНТОМ ХАОСА",a="Владыка Молний",o="#00ffff",s="rgba(0, 255, 255, 0.5)",n="⚡");const l=document.createElement("div");l.id="boss-intro-overlay",l.style.cssText=`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      pointer-events: none;
    `;const c=document.createElement("div");c.style.cssText=`
      font-size: 120px;
      opacity: 0;
      transform: scale(3);
      filter: drop-shadow(0 0 30px ${s});
    `,c.textContent=n;const r=document.createElement("div");r.style.cssText=`
      font-family: 'Orbitron', sans-serif;
      font-size: 72px;
      font-weight: 900;
      color: ${o};
      text-shadow: 
        0 0 20px ${o},
        0 0 40px ${s},
        0 0 60px ${s};
      opacity: 0;
      transform: translateY(50px);
      letter-spacing: 8px;
      margin-top: 20px;
    `,r.textContent=i;const h=document.createElement("div");h.style.cssText=`
      font-family: 'Orbitron', sans-serif;
      font-size: 24px;
      color: ${o};
      text-shadow: 0 0 10px ${s};
      opacity: 0;
      margin-top: 10px;
      letter-spacing: 4px;
    `,h.textContent=a;const p=document.createElement("div"),u=document.createElement("div"),f=`
      position: absolute;
      top: 50%;
      width: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, ${o});
    `;p.style.cssText=f+"left: 0; transform: translateY(-50%);",u.style.cssText=f+"right: 0; transform: translateY(-50%) scaleX(-1);",l.appendChild(p),l.appendChild(u),l.appendChild(c),l.appendChild(r),l.appendChild(h),document.body.appendChild(l),l.animate([{background:"rgba(0, 0, 0, 0)"},{background:"rgba(0, 0, 0, 0.8)"}],{duration:300,fill:"forwards"}),c.animate([{opacity:0,transform:"scale(3)"},{opacity:1,transform:"scale(1)"}],{duration:500,delay:200,fill:"forwards",easing:"ease-out"}),r.animate([{opacity:0,transform:"translateY(50px)"},{opacity:1,transform:"translateY(0)"}],{duration:500,delay:400,fill:"forwards",easing:"ease-out"}),h.animate([{opacity:0},{opacity:.8}],{duration:400,delay:600,fill:"forwards"}),p.animate([{width:"0%"},{width:"35%"}],{duration:600,delay:300,fill:"forwards",easing:"ease-out"}),u.animate([{width:"0%"},{width:"35%"}],{duration:600,delay:300,fill:"forwards",easing:"ease-out"}),setTimeout(()=>{l.animate([{opacity:1},{opacity:0}],{duration:500,fill:"forwards"}),setTimeout(()=>{l.remove(),e?.()},500)},2500)}showVoidMode(t,e){this.voidOverlay||this.createVoidOverlay(),this.voidOverlay&&(this.voidOverlay.style.display="flex",this.voidTimerEl&&(this.voidTimerEl.textContent="НАЙДИ ПОРТАЛ",this.voidTimerEl.style.color="#aa55ff",this.voidTimerEl.style.textShadow="0 0 20px #8800ff, 0 0 40px rgba(136, 0, 255, 0.5)"),this.voidKillsEl&&(this.voidKillsEl.textContent=`🌀 ${t}м`,t<15?(this.voidKillsEl.style.color="#00ff88",this.voidKillsEl.style.textShadow="0 0 15px #00ff88"):t<30?(this.voidKillsEl.style.color="#cc88ff",this.voidKillsEl.style.textShadow="0 0 15px #aa55ff"):(this.voidKillsEl.style.color="#8855cc",this.voidKillsEl.style.textShadow="0 0 15px #6633aa")))}hideVoidMode(){this.voidOverlay&&(this.voidOverlay.style.display="none")}createVoidOverlay(){this.voidOverlay=document.createElement("div"),this.voidOverlay.id="void-overlay",this.voidOverlay.style.cssText=`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: none;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      padding-top: 80px;
      pointer-events: none;
      z-index: 1200;
      background: radial-gradient(ellipse at center, transparent 0%, rgba(30, 0, 50, 0.3) 100%);
    `;const t=document.createElement("div");t.style.cssText=`
      font-family: 'Orbitron', sans-serif;
      font-size: 48px;
      font-weight: 900;
      color: #aa55ff;
      text-shadow: 
        0 0 30px #8800ff,
        0 0 60px rgba(136, 0, 255, 0.5),
        0 0 90px rgba(100, 0, 200, 0.3);
      letter-spacing: 15px;
      margin-bottom: 20px;
      animation: voidPulse 1s ease-in-out infinite;
    `,t.textContent="В О Й Д",this.voidTimerEl=document.createElement("div"),this.voidTimerEl.style.cssText=`
      font-family: 'Orbitron', sans-serif;
      font-size: 32px;
      font-weight: 700;
      color: #aa55ff;
      text-shadow: 0 0 20px #8800ff, 0 0 40px rgba(136, 0, 255, 0.5);
      letter-spacing: 5px;
      margin-bottom: 15px;
    `,this.voidKillsEl=document.createElement("div"),this.voidKillsEl.style.cssText=`
      font-family: 'Orbitron', sans-serif;
      font-size: 28px;
      color: #cc88ff;
      text-shadow: 0 0 15px #aa55ff;
      letter-spacing: 3px;
    `;const e=document.createElement("div");if(e.style.cssText=`
      font-family: 'Orbitron', sans-serif;
      font-size: 16px;
      color: #7744aa;
      margin-top: 30px;
      letter-spacing: 2px;
      text-shadow: 0 0 10px rgba(136, 0, 255, 0.3);
    `,e.textContent="БЕГИ ПО МОСТУ К ПОРТАЛУ",!document.getElementById("void-anim-style")){const i=document.createElement("style");i.id="void-anim-style",i.textContent=`
        @keyframes voidPulse {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1);
            filter: brightness(1);
          }
          50% { 
            opacity: 0.8; 
            transform: scale(1.02);
            filter: brightness(1.3);
          }
        }
      `,document.head.appendChild(i)}this.voidOverlay.appendChild(t),this.voidOverlay.appendChild(this.voidTimerEl),this.voidOverlay.appendChild(this.voidKillsEl),this.voidOverlay.appendChild(e),document.body.appendChild(this.voidOverlay)}showVoidEnter(){this.showMessage("🌀 ВЛАДЫКА ЗАСОСАЛ ТЕБЯ В ВОЙД! 🌀","#aa55ff")}showVoidExit(t){t?this.showMessage("✓ ВЫРВАЛСЯ ИЗ ВОЙДА!","#00ff88"):this.showMessage("☠️ ВОЙД ПОГЛОТИЛ ТЕБЯ...","#aa00ff")}}class Qt{playerRadius=.4;arenaRadius=38;poolRadius=8;platformHeight=2;platformX=20;bridgeWidth=3.5;backPlatformRadius=8;backPlatformX=30;baseHeights=[1.8,3,4.2,5.4,6.6,7.8];topBaseHeight=9.5;jumpPlatforms=[{x:10,z:0,height:1.8,radius:1.5},{x:5,z:8.66,height:3,radius:1.4},{x:-5,z:8.66,height:4.2,radius:1.4},{x:-10,z:0,height:5.4,radius:1.3},{x:-5,z:-8.66,height:6.6,radius:1.3},{x:5,z:-8.66,height:7.8,radius:1.2}];topPlatform={x:0,z:0,height:9.5,radius:2.5};updatePlatforms(t){for(let e=0;e<this.jumpPlatforms.length;e++){const i=e*.8,a=Math.sin(t*1.5+i)*.3;this.jumpPlatforms[e].height=this.baseHeights[e]+a}this.topPlatform.height=this.topBaseHeight+Math.sin(t*1)*.2}getPlatformData(){const t=new Float32Array(28);for(let e=0;e<this.jumpPlatforms.length;e++){const i=this.jumpPlatforms[e];t[e*4+0]=i.x,t[e*4+1]=i.z,t[e*4+2]=i.height,t[e*4+3]=i.radius}return t[24]=this.topPlatform.x,t[25]=this.topPlatform.z,t[26]=this.topPlatform.height,t[27]=this.topPlatform.radius,t}checkCollision(t){const e=this.playerRadius,i=Math.sqrt(t.x*t.x+t.z*t.z);if(i<1.2+e&&t.y<10)return!0;const a=8;if(i>a-.5&&i<a+.5&&t.y<.8)return!0;const o=-22,s={x:o,z:-2},n={x:o,z:2},l=22,h=[s,n,{x:l,z:-2},{x:l,z:2}];for(const m of h){const g=t.x-m.x,x=t.z-m.z;if(Math.abs(g)<.6+e&&Math.abs(x)<.6+e&&t.y<5.5)return!0}const p=Math.sqrt(Math.pow(t.x- -this.backPlatformX,2)+Math.pow(t.z,2));if(p>this.backPlatformRadius-.5&&p<this.backPlatformRadius+.5&&t.y<1)return!0;for(let m=0;m<8;m++){const g=m*Math.PI/4,x=-this.backPlatformX+Math.cos(g)*(this.backPlatformRadius-.2),y=Math.sin(g)*(this.backPlatformRadius-.2),b=t.x-x,k=t.z-y;if(Math.abs(b)<.3+e&&Math.abs(k)<.3+e&&t.y<1.5)return!0}const u=Math.sqrt(Math.pow(t.x-this.backPlatformX,2)+Math.pow(t.z,2));if(u>this.backPlatformRadius-.5&&u<this.backPlatformRadius+.5&&t.y<1)return!0;for(let m=0;m<8;m++){const g=m*Math.PI/4,x=this.backPlatformX+Math.cos(g)*(this.backPlatformRadius-.2),y=Math.sin(g)*(this.backPlatformRadius-.2),b=t.x-x,k=t.z-y;if(Math.abs(b)<.3+e&&Math.abs(k)<.3+e&&t.y<1.5)return!0}const f=[...this.jumpPlatforms,this.topPlatform];for(const m of f){const g=t.x-m.x,x=t.z-m.z,y=Math.sqrt(g*g+x*x),b=t.y-1.7;if(y<m.radius+e&&b<m.height-.1&&b>m.height-1.5)return!0}return t.x<-this.platformX+3.5&&t.x>-this.platformX-3.5&&Math.abs(t.z)<6.5&&t.y>this.platformHeight-.5&&t.x>-this.platformX+2.8&&Math.abs(t.z)<6||t.x>this.platformX-3.5&&t.x<this.platformX+3.5&&Math.abs(t.z)<6.5&&t.y>this.platformHeight-.5&&t.x<this.platformX-2.8&&Math.abs(t.z)<6}isOverCirclePlatform(t,e){const i=t.x-e.x,a=t.z-e.z,o=Math.sqrt(i*i+a*a),s=t.y-1.7;return o<e.radius&&s>=e.height-.1}getFloorHeight(t){const e=Math.sqrt(t.x*t.x+t.z*t.z);if(e>33)return-50;const a=Math.abs(t.z)<this.bridgeWidth/2&&Math.abs(t.x)<this.poolRadius+1,o=Math.abs(t.x)<this.bridgeWidth/2&&Math.abs(t.z)<this.poolRadius+1;if((a||o)&&e>2)return .3;const s=-16,n=-17,l=-23;if(Math.abs(t.z)<3){if(t.x>=n&&t.x<=s)return(s-t.x)/(s-n)*this.platformHeight;if(t.x<n&&t.x>l)return this.platformHeight}const c=16,r=17,h=23;if(Math.abs(t.z)<3){if(t.x>=c&&t.x<=r)return(t.x-c)/(r-c)*this.platformHeight;if(t.x>r&&t.x<h)return this.platformHeight}if(this.isOverCirclePlatform(t,this.topPlatform))return this.topPlatform.height;for(let f=this.jumpPlatforms.length-1;f>=0;f--)if(this.isOverCirclePlatform(t,this.jumpPlatforms[f]))return this.jumpPlatforms[f].height;return t.x<-18.5&&t.x>-25.5&&Math.abs(t.z)<3.5||t.x>18.5&&t.x<25.5&&Math.abs(t.z)<3.5||Math.sqrt(Math.pow(t.x- -this.backPlatformX,2)+Math.pow(t.z,2))<this.backPlatformRadius||Math.sqrt(Math.pow(t.x-this.backPlatformX,2)+Math.pow(t.z,2))<this.backPlatformRadius?.5:t.x<-21.5&&t.x>-this.backPlatformX+this.backPlatformRadius&&Math.abs(t.z)<2.5||t.x>21.5&&t.x<this.backPlatformX-this.backPlatformRadius&&Math.abs(t.z)<2.5?.3:0}getCeilingHeight(t){const e=[...this.jumpPlatforms,this.topPlatform];for(const i of e){const a=t.x-i.x,o=t.z-i.z;if(Math.sqrt(a*a+o*o)<i.radius-.3&&t.y<i.height-.5&&t.y>i.height-4)return i.height-.3}return 18}checkEnemyCollision(t,e){const i=Math.sqrt(t.x*t.x+t.z*t.z);if(i>33-e||i<1.2+e)return!0;const o=8;if(i>o-.5-e&&i<o+.5+e&&t.y<.8)return!0;const s=[{x:-22,z:-2},{x:-22,z:2},{x:22,z:-2},{x:22,z:2}];for(const c of s){const r=t.x-c.x,h=t.z-c.z;if(Math.abs(r)<.6+e&&Math.abs(h)<.6+e&&t.y<5.5)return!0}for(let c=-1;c<=1;c+=2){const r=c*this.backPlatformX;for(let h=0;h<8;h++){const p=h*Math.PI/4,u=r+Math.cos(p)*(this.backPlatformRadius-.2),f=Math.sin(p)*(this.backPlatformRadius-.2),m=t.x-u,g=t.z-f;if(Math.abs(m)<.3+e&&Math.abs(g)<.3+e&&t.y<1.5)return!0}}const n=[{x:0,z:28},{x:0,z:-28},{x:28,z:0},{x:-28,z:0}];for(const c of n){const r=t.x-c.x,h=t.z-c.z;if(Math.sqrt(r*r+h*h)<.7+e)return!0}const l=[...this.jumpPlatforms,this.topPlatform];for(const c of l){const r=t.x-c.x,h=t.z-c.z;if(Math.sqrt(r*r+h*h)<c.radius+e&&t.y<c.height+1.5&&t.y>c.height-1.5)return!0}return!1}getObstacleHeight(t,e,i,a=1.5){const o=t.x+e*a,s=t.z+i*a,n=[...this.jumpPlatforms,this.topPlatform];for(const l of n){const c=o-l.x,r=s-l.z;if(Math.sqrt(c*c+r*r)<l.radius&&t.y<l.height)return l.height}return 0}}const Jt={width:1280,height:720,renderScale:.4,movement:{walkSpeed:9,runSpeed:16,jumpForce:12,gravity:25,groundFriction:12,airControl:.85,mouseSensitivity:.002},weapon:{name:"Katana",damage:100,fireRate:2.5,magazineSize:999,reloadTime:0,spread:0,automatic:!1}};class te{state={isRunning:!1,isPaused:!1,frags:0,gameTime:0,soundEnabled:!0};config;gameLoop;input;player;weapon;weaponRenderer;targetManager;pickupManager;audio;renderer;hud;collision;weaponCanvas;startScreen;gameTime=0;isPaused=!1;carryingScore=0;altars=[{position:{x:0,y:0,z:30},score:0},{position:{x:0,y:0,z:-30},score:0}];SCORE_VALUES={baneling:10,phantom:15,runner:20,hopper:25,spiker:30,boss_green:100,boss_black:150,boss_blue:200};darts=50;dartCooldown=0;DART_FIRE_RATE=.08;DART_DAMAGE=15;DARTS_PER_POINT=2;flyingDarts=[];voidPortalTimer=10;voidPortalActive=!1;voidPortalLifetime=0;VOID_PORTAL_DURATION=10;VOID_PORTAL_COOLDOWN=10;bloodCoins=0;voidCoins=[];grenadeCount=5;grenades=[];explosions=[];deathEffects=[];DEATH_EFFECT_DURATION=.5;GRENADE_SPEED=25;GRENADE_GRAVITY=15;GRENADE_FUSE=1.5;EXPLOSION_RADIUS=8;EXPLOSION_DAMAGE=50;EXPLOSION_DURATION=.5;GRENADE_COST=3;voidVariant=0;footstepTimer=0;wasGrounded=!0;screenShake=0;lastSliceTime=0;wasJumpPressed=!1;attackHitChecked=!1;splashHitChecked=!1;currentEra=1;killTimes=[];COMBO_WINDOW=9;COMBO_KILLS_NEEDED=3;isInVoid=!1;voidSpawnTimer=0;savedPosition=w(0,0,0);savedYaw=0;voidEnemyIds=[];voidFallOffset=0;savedEnemyIds=[];savedWaveActive=!1;voidPhantomCooldown=new Map;portalPos=w(0,0,0);PORTAL_DISTANCE=60;PORTAL_RADIUS=4;VOID_SPAWN_INTERVAL=3;constructor(t,e,i={}){if(this.weaponCanvas=e,this.config={...Jt,...i},this.collision=new Qt,this.input=new It(t),this.audio=new Zt,this.hud=new $t,this.player=new Nt(w(0,1.7,12),this.config.movement,this.collision),this.weapon=new Wt,this.weapon.onSlice=()=>this.onKatanaSlice(),this.renderer=new I(t),this.renderer.renderScale=this.config.renderScale,this.weaponRenderer=new q(e),this.targetManager=new Yt(this.collision),this.setupTargetCallbacks(),this.pickupManager=new Kt,this.gameLoop=new Ct(o=>this.update(o),()=>this.render()),this.startScreen=document.getElementById("click-to-start"),this.setupEventHandlers(),this.setupGamepad(),J())this.touch=new qt(this.input,()=>this.togglePause());else for(const o of["click-to-start","pause-overlay"]){const s=document.createElement("a");s.className="studio-back",s.href=bt(),s.textContent="← "+j("в хаб"),s.addEventListener("click",n=>n.stopPropagation()),document.getElementById(o)?.appendChild(s)}const a=o=>{this.input.touchLookScale=o.lookSens,this.input.padLookScale=o.lookSens,this.input.invertPadTouchY=o.invertY,this.touch?.applyStudio(o)};a(tt()),Dt(a)}touch=null;togglePause(){this.state.isRunning&&(this.state.isPaused?this.hidePauseOverlay():this.showPauseOverlay())}setupGamepad(){this.input.onPadButton=e=>{if(e===z.VIEW){wt();return}if(!this.state.isRunning){(e===z.A||e===z.START)&&this.start();return}e===z.START&&this.togglePause()};const t=()=>{this.state.isRunning||(this.input.poll(0),requestAnimationFrame(t))};typeof navigator.getGamepads=="function"&&requestAnimationFrame(t)}setupTargetCallbacks(){this.targetManager.onTargetDestroyed=t=>{this.state.frags++,this.audio.playSFX("kill"),this.hud.showHitmarker(!0),this.spawnDeathEffect(t.position);const e=this.SCORE_VALUES[t.enemyType]||10;if(this.carryingScore+=e,this.hud.showMessage(`+${e}`,"purple"),this.isInVoid||this.pickupManager.spawnAfterKill(t.position),this.killTimes.push(this.gameTime),this.killTimes=this.killTimes.filter(i=>this.gameTime-i<this.COMBO_WINDOW),this.killTimes.length>=this.COMBO_KILLS_NEEDED&&!this.player.rageMode&&this.activateComboAdrenaline(),this.killTimes.length>0&&this.killTimes.length<this.COMBO_KILLS_NEEDED&&this.hud.showMessage(`🔥 КОМБО ${this.killTimes.length}/${this.COMBO_KILLS_NEEDED}`,"orange"),t.isBoss){this.hud.showMessage("💀 БОСС ПОВЕРЖЕН! 💀","gold");for(let i=0;i<3;i++)this.pickupManager.spawnAfterKill(t.position);this.pickupManager.respawnChargeAfterBoss(),this.targetManager.wave===5&&this.player.maxAirJumps<2&&(this.player.unlockTripleJump(),this.hud.showMessage("🦘 ТРОЙНОЙ ПРЫЖОК РАЗБЛОКИРОВАН! 🦘","cyan"))}},this.targetManager.onPlayerHit=t=>{this.player.takeDamage(t.damage),this.audio.playSFX("player_hurt");const e=this.player.state.position,i={x:e.x-t.position.x,z:e.z-t.position.z},a=Math.sqrt(i.x**2+i.z**2);if(a>.1){const o=t.isBoss?12:6;this.player.state.velocity.x+=i.x/a*o,this.player.state.velocity.z+=i.z/a*o}switch(t.enemyType){case"phantom":this.audio.playSFX("phantom_pass"),this.screenShake=.3,this.hud.showDamage("purple"),this.slowdownFactor=.3,this.slowdownTimer=2;break;case"runner":this.audio.playSFX("runner_hit"),this.screenShake=.4,this.hud.showDamage("green");break;case"hopper":this.audio.playSFX("hopper_hit"),this.screenShake=.6,this.hud.showDamage("green");break;case"boss_green":this.audio.playSFX("kill"),this.screenShake=1,this.hud.showDamage("green"),this.hud.showMessage("💀 ТОКСИЧНЫЙ УДАР!","lime");break;case"boss_black":if(!this.isInVoid){this.enterVoidMode();return}break;case"boss_blue":this.audio.playSFX("hopper_hit"),this.screenShake=.7,this.hud.showDamage("purple"),this.hud.showMessage("⚡ ТЕЛЕПОРТ УДАР!","cyan");break;default:this.audio.playSFX("hit"),this.screenShake=.5,this.hud.showDamage("green")}},this.targetManager.onWaveStart=t=>{this.hud.showWave(t),this.audio.setEra(t),this.currentEra=t>10?3:t>5?2:1,t===5?(this.isPaused=!0,this.audio.playBossWarning(),this.hud.showBossIntro("boss_green",()=>{this.isPaused=!1,this.audio.setBossMusic("boss_green")})):t===10?(this.isPaused=!0,this.audio.playBossWarning(),this.hud.showBossIntro("boss_black",()=>{this.isPaused=!1,this.audio.setBossMusic("boss_black")})):t===15&&(this.isPaused=!0,this.audio.playBossWarning(),this.hud.showBossIntro("boss_blue",()=>{this.isPaused=!1,this.audio.setBossMusic("boss_blue")})),t===6?setTimeout(()=>this.hud.showMessage("🌀 ЗОНА ЧЁРНОЙ ДЫРЫ 🌀","purple"),1e3):t===11&&setTimeout(()=>this.hud.showMessage("🚀 КОСМИЧЕСКАЯ ЗОНА 🚀","cyan"),1e3)},this.targetManager.onWaveComplete=t=>{this.hud.showWaveComplete(t),setTimeout(()=>this.hud.showMessage("🏊 ВОЙДИ В БАССЕЙН! 🏊","cyan"),2e3),(t===5||t===10||t===15)&&(this.audio.setBossMusic(null),this.audio.setEra(t+1))},this.targetManager.onPoolDamage=t=>{this.player.takeDamage(t),this.hud.showDamage("green"),this.screenShake=.2},this.targetManager.onBossPhaseChange=(t,e)=>{t==="boss_green"&&e===2&&(this.audio.setBossGreenPhase2(),this.hud.showMessage("☣️ ФАЗА 2: ЯРОСТЬ! ☣️","lime"),this.screenShake=1.5)},this.targetManager.onBossVortexWarning=()=>{this.hud.showMessage("⚠️ ВИХРЬ ПРИБЛИЖАЕТСЯ! ⚠️","yellow")},this.targetManager.onBossVortexStart=()=>{this.hud.showMessage("🌀 ВИХРЬ! БЕГИ! 🌀","purple"),this.screenShake=1},this.targetManager.onBossVortexEnd=()=>{},this.targetManager.onAcidSpit=()=>{this.audio.playSFX("acid_spit")},this.targetManager.onAcidRain=t=>{this.audio.playAcidSplash(),this.screenShake=.3},this.targetManager.onAcidRainMarkSound=()=>{this.audio.playAcidRainMark(),this.hud.showMessage("☢️ КИСЛОТНЫЙ ДОЖДЬ! УКРОЙСЯ! ☢️","lime")},this.targetManager.onAcidRainStart=t=>{this.audio.playAcidRainStart(),this.screenShake=.5},this.targetManager.onEnemySpawn=(t,e)=>{switch(t){case"baneling":this.audio.playBanelingSpawn();break;case"phantom":this.audio.playPhantomSpawn();break;case"runner":this.audio.playRunnerSpawn();break;case"hopper":this.audio.playHopperSpawn();break;case"spiker":this.audio.playSFX("spiker_scream");break;case"boss_green":case"boss_black":case"boss_blue":this.audio.playBossSpawn();break}},this.targetManager.onSpikerScream=()=>{this.audio.playSFX("spiker_scream")},this.targetManager.onSpikerAttack=()=>{this.audio.playSFX("spiker_shoot")},this.targetManager.onSpikeHit=()=>{this.player.takeDamage(10),this.audio.playSFX("player_hurt"),this.hud.showDamage(),this.screenShake=.3,this.hud.updateHealth(this.player.state.health,this.player.state.maxHealth),this.player.isDead()&&this.gameOver()},this.targetManager.onBanelingAboutToExplode=()=>{this.audio.playBanelingWarning()}}slowdownFactor=1;slowdownTimer=0;setupEventHandlers(){const t=document.getElementById("volume-slider"),e=document.getElementById("volume-value"),i=document.getElementById("sens-slider"),a=document.getElementById("sens-value");t?.addEventListener("input",r=>{r.stopPropagation();const h=parseInt(t.value);e&&(e.textContent=`${h}%`),this.audio.setVolume(h/100)}),i?.addEventListener("input",r=>{r.stopPropagation();const h=parseInt(i.value);a&&(a.textContent=`${h}%`),this.input.setSensitivity(.001+h/100*.009)});const o=document.getElementById("quality-select"),s=document.getElementById("shadows-toggle"),n=document.getElementById("postfx-toggle"),l=document.getElementById("katana-toggle");o&&(o.value=this.renderer.quality),s&&(s.checked=this.renderer.shadowsEnabled),n&&(n.checked=this.renderer.postfxEnabled),l&&(l.checked=this.renderer.katanaEnabled),o?.addEventListener("change",r=>{r.stopPropagation(),this.renderer.setQuality(o.value)}),s?.addEventListener("change",r=>{r.stopPropagation(),this.renderer.shadowsEnabled=s.checked,this.renderer.saveSettings()}),n?.addEventListener("change",r=>{r.stopPropagation(),this.renderer.postfxEnabled=n.checked,this.renderer.saveSettings()}),l?.addEventListener("change",r=>{r.stopPropagation(),this.renderer.katanaEnabled=l.checked,this.renderer.saveSettings()});const c=document.getElementById("turbo-toggle");c&&(c.checked=this.renderer.turboEnabled),c?.addEventListener("change",r=>{r.stopPropagation(),this.renderer.turboEnabled=c.checked,this.renderer.saveSettings()}),document.getElementById("settings")?.addEventListener("click",r=>{r.stopPropagation()}),document.getElementById("start-buttons")?.addEventListener("click",r=>{r.stopPropagation()}),document.getElementById("btn-start")?.addEventListener("click",()=>this.start()),document.getElementById("btn-boss5")?.addEventListener("click",()=>this.startFromWave(5)),document.getElementById("btn-boss10")?.addEventListener("click",()=>this.startFromWave(10)),document.getElementById("btn-boss15")?.addEventListener("click",()=>this.startFromWave(15)),document.getElementById("btn-settings")?.addEventListener("click",r=>{r.stopPropagation(),document.getElementById("modal-settings")?.classList.add("active")}),document.getElementById("btn-help")?.addEventListener("click",r=>{r.stopPropagation(),document.getElementById("modal-help")?.classList.add("active")}),document.querySelectorAll(".modal-close").forEach(r=>{r.addEventListener("click",h=>{h.stopPropagation();const p=r.dataset.modal;p&&document.getElementById(p)?.classList.remove("active")})}),document.querySelectorAll(".modal").forEach(r=>{r.addEventListener("click",h=>{h.target===r&&r.classList.remove("active")})}),document.querySelectorAll(".modal-content").forEach(r=>{r.addEventListener("click",h=>h.stopPropagation())}),document.addEventListener("keydown",r=>{r.code==="KeyM"&&this.audio.toggleMute(),r.code==="KeyF"&&this.toggleFullscreen(),this.state.isPaused&&this.state.isRunning&&this.hidePauseOverlay()}),window.addEventListener("resize",()=>this.handleResize()),document.addEventListener("pointerlockchange",()=>{this.input.usesPointerLock&&this.state.isRunning&&document.pointerLockElement===null&&this.showPauseOverlay()}),document.addEventListener("visibilitychange",()=>{document.hidden&&this.state.isRunning&&this.showPauseOverlay()}),document.addEventListener("mousedown",r=>{r.target;const h=document.getElementById("pause-overlay");h&&h.style.display!=="none"&&(console.log("🎮 Клик по паузе, возобновляем..."),r.preventDefault(),r.stopPropagation(),this.hidePauseOverlay())})}showPauseOverlay(){const t=document.getElementById("pause-overlay");t&&this.state.isRunning&&(t.style.display="flex",this.state.isPaused=!0,this.touch?.setMode("paused"))}hidePauseOverlay(){const t=document.getElementById("pause-overlay");t&&t.style.display!=="none"&&(console.log("🎮 hidePauseOverlay вызван"),t.style.display="none",this.state.isPaused=!1,this.touch?.setMode("play"),this.input.requestPointerLock())}start(){this.startFromWave(1)}startFromWave(t){if(this.state.isRunning)return;const e=document.getElementById("volume-slider"),i=document.getElementById("sens-slider");e&&this.audio.setVolume(parseInt(e.value)/100),i&&this.input.setSensitivity(.001+parseInt(i.value)/100*.009),this.startScreen&&(this.startScreen.style.display="none"),this.hud.showHUD(),this.input.requestPointerLock(),this.audio.start(),this.gameLoop.start(),this.state.isRunning=!0,this.touch?.setMode("play"),this.targetManager.startGame(t),this.hud.showMessage("🏊 ВОЙДИ В БАССЕЙН! 🏊","cyan"),t===5?setTimeout(()=>this.hud.showMessage("⚠️ ЗЕЛЁНЫЙ БОСС! ⚠️","lime"),100):t===10?setTimeout(()=>this.hud.showMessage("☠️ ЧЁРНЫЙ БОСС! ☠️","purple"),100):t===15&&setTimeout(()=>this.hud.showMessage("⚡ СИНИЙ БОСС! ⚡","cyan"),100),this.handleResize()}stop(){this.gameLoop.stop(),this.state.isRunning=!1,this.input.exitPointerLock()}update(t){if(this.input.poll(t),this.state.isPaused||this.isPaused){this.input.resetMouseDelta();return}this.gameTime+=t,this.isInVoid||this.collision.updatePlatforms(this.gameTime),this.slowdownTimer>0&&(this.slowdownTimer-=t,this.slowdownTimer<=0&&(this.slowdownFactor=1));const e=t*this.slowdownFactor;if(this.player.update(e,this.input.state,{x:this.input.mouseDelta.x*this.slowdownFactor,y:this.input.mouseDelta.y*this.slowdownFactor}),this.input.resetMouseDelta(),this.isInVoid&&this.updateVoidMode(t),!this.isInVoid){const r=this.player.state.position;Math.sqrt(r.x**2+r.z**2)>33&&(this.hud.showMessage("💀 УПАЛ В БЕЗДНУ!","purple"),this.audio.playSFX("kill"),this.screenShake=2,this.enterVoid())}const i=this.targetManager.getVortexPull(this.player.state.position);if((i.x!==0||i.z!==0)&&(this.player.state.position.x+=i.x*t,this.player.state.position.z+=i.z*t,this.screenShake=Math.max(this.screenShake,.3)),this.updateMovementSounds(t),this.input.state.fire&&this.weapon.tryAttack()){this.audio.playSFX("katana_swing"),this.attackHitChecked=!1;const[r,h]=this.getKatanaTargetData();this.weapon.attackType=r>0?1:0}this.weapon.isAttacking&&!this.weapon.isSplashAttack&&!this.attackHitChecked&&this.weapon.attackProgress>=.2&&this.weapon.attackProgress<=.5&&(this.checkNormalAttack(),this.attackHitChecked=!0),this.input.state.altFire&&this.weapon.trySplashAttack()&&(this.audio.playSFX("splash_wave"),this.splashHitChecked=!1),this.weapon.isAttacking&&this.weapon.isSplashAttack&&!this.splashHitChecked&&this.weapon.attackProgress>=.2&&this.weapon.attackProgress<=.5&&(this.checkSplashAttack(),this.splashHitChecked=!0),this.dartCooldown-=t,this.input.state.altFire&&this.darts>0&&this.dartCooldown<=0&&(this.fireDart(),this.dartCooldown=this.DART_FIRE_RATE),this.updateDarts(t),this.input.state.throwGrenade&&this.grenadeCount>0?(this.throwGrenade(),this.input.state.throwGrenade=!1):this.input.state.throwGrenade=!1,this.updateGrenades(t),this.updateExplosions(t),this.updateDeathEffects(t),this.updateVoidPortal(t);const a=this.input.isMoving();this.weapon.update(t,a,this.input.state.run),this.weaponRenderer.isAttacking=this.weapon.isAttacking,this.weaponRenderer.attackProgress=this.weapon.attackProgress,this.weaponRenderer.isSplashAttack=this.weapon.isSplashAttack,this.weaponRenderer.splashCharges=this.weapon.splashCharges;const o=this.player.getEyePosition();if(!this.isInVoid)this.targetManager.update(t,o,this.gameTime);else{for(const[r,h]of this.voidPhantomCooldown)h>0&&this.voidPhantomCooldown.set(r,h-t);for(const r of this.targetManager.targets)if(r.active&&this.voidEnemyIds.includes(r.id)&&(r.update(t,o,this.gameTime),(this.voidPhantomCooldown.get(r.id)||0)<=0&&r.checkPlayerCollision(o))){this.player.takeDamage(8),this.voidPhantomCooldown.set(r.id,1.5);const p={x:o.x-r.position.x,z:o.z-r.position.z},u=Math.sqrt(p.x**2+p.z**2);u>.1&&(this.player.state.velocity.x+=p.x/u*8,this.player.state.velocity.z+=p.z/u*8),this.audio.playSFX("phantom_hit"),this.audio.playSFX("player_hurt"),this.screenShake=.8,this.hud.showDamage("purple"),this.hud.showMessage("💀 ФАНТОМ!","purple")}}this.updateEnemyProximitySounds(o),this.checkAttachedRunners(),!this.input.state.jump&&this.wasJumpPressed&&this.player.onJumpReleased(),this.wasJumpPressed=this.input.state.jump,this.input.state.jump&&!this.player.state.grounded&&this.player.tryDoubleJump()&&(this.detachRunners(),this.audio.playSFX("jump"));const s=this.pickupManager.update(t,this.gameTime,o);s&&this.onPickup(s),this.audio.updateProximitySound(0),this.screenShake>0&&(this.screenShake-=t*2),this.player.isDead()&&this.gameOver(),this.hud.updateHealth(this.player.state.health,this.player.state.maxHealth),this.hud.updateAmmo(this.targetManager.wave,this.targetManager.getActiveCount()),this.hud.updateFrags(this.state.frags),this.hud.updateSplashCharges(this.weapon.splashCharges),this.hud.updateDoubleJump(this.player.getDoubleJumpCooldown(),this.player.isDoubleJumpReady()),this.hud.updateCarryingScore(this.carryingScore);const n=this.altars.reduce((r,h)=>r+h.score,0);this.hud.updateAltarScore(n),this.hud.updateDarts(this.darts);const l=this.player.state.health/this.player.state.maxHealth;this.audio.setLowHpMode(l<.3&&l>0);const c=this.targetManager.getActiveBoss();c?this.hud.showBossHealth(c.hp,c.maxHp,c.enemyType):this.hud.hideBossHealth()}updateMovementSounds(t){this.input.isMoving()&&this.player.state.grounded&&(this.footstepTimer-=t,this.footstepTimer<=0&&(this.audio.playSFX("footstep"),this.footstepTimer=this.input.state.run?.25:.4)),this.player.state.grounded&&!this.wasGrounded&&this.audio.playSFX("land"),this.wasGrounded=this.player.state.grounded}onKatanaSlice(){this.audio.playSFX("katana_swing")}gameOver(){this.state.isPaused=!0,this.hud.showGameOver(this.state.frags,this.targetManager.wave),setTimeout(()=>{this.restart()},3e3)}restart(){this.player.reset(w(0,1.7,12)),this.player.state.health=100,this.player.state.maxHealth=100,this.state.frags=0,this.state.isPaused=!1,this.isInVoid=!1,this.player.isInVoid=!1,this.carryingScore=0,this.darts=0,this.altars.forEach(t=>{t.score=0}),this.weapon.splashCharges=0,this.weapon.isAttacking=!1,this.weapon.attackProgress=0,this.screenShake=0,this.slowdownFactor=1,this.slowdownTimer=0,this.targetManager.startGame(1),this.pickupManager.pickups=[],this.hud.updateCarryingScore(0),this.hud.updateAltarScore(0),this.hud.updateDarts(0),this.hud.updateSplashCharges(0)}enterVoidMode(){this.isInVoid=!0,this.player.isInVoid=!0,this.voidEnemyIds=[],this.voidFallOffset=0,this.voidPhantomCooldown.clear(),this.audio.enterVoidAudio(),this.savedPosition={...this.player.state.position},this.savedYaw=this.player.state.yaw,this.player.state.position=w(0,2,0),this.player.state.velocity=w(0,0,0),this.player.state.grounded=!0;const t=Math.random()*Math.PI*2;this.portalPos=w(Math.cos(t)*this.PORTAL_DISTANCE,3,Math.sin(t)*this.PORTAL_DISTANCE),this.savedWaveActive=this.targetManager.waveActive,this.savedEnemyIds=[];for(const e of this.targetManager.targets)e.active&&(this.savedEnemyIds.push(e.id),e.active=!1,e.removeTimer=9999);this.hud.showVoidEnter(),this.screenShake=1.5,this.voidSpawnTimer=1,this.voidEnemyIds=[]}updateVoidMode(t){if(!this.isInVoid)return;this.voidFallOffset+=t*5,this.screenShake=Math.max(this.screenShake,.03);const e=this.player.state.position,a=Math.sqrt(e.x**2+e.z**2)<10,s=Math.sqrt((e.x-this.portalPos.x)**2+(e.z-this.portalPos.z)**2)<5,n={x:this.portalPos.x,z:this.portalPos.z},l=Math.sqrt(n.x**2+n.z**2);l>0&&(n.x/=l,n.z/=l);const c=l-5-10;let r=!1,h=-100;for(let g=0;g<8;g++){const x=12+g*(c/7),y=Math.sin(g*73.1)*2,b=Math.cos(g*47.3)*2,k=Math.sin(g*91.7)*.8-.3,A=L=>L-Math.floor(L),P=2+A(Math.sin(g*127.3)*43758.5)*2,R=P*(.8+A(Math.sin(g*31.7)*100)*.4),D=P*(.8+A(Math.sin(g*57.3)*100)*.4),S=n.x*x+y,T=n.z*x+b,M=k+.5,C=g*.7,E=(e.x-S)*Math.cos(-C)-(e.z-T)*Math.sin(-C),B=(e.x-S)*Math.sin(-C)+(e.z-T)*Math.cos(-C);Math.abs(E)<R&&Math.abs(B)<D&&(r=!0,h=Math.max(h,M+1.8))}let p=-100;if(a||s?p=2:r&&(p=h),e.y<-5){this.fallFromVoid();return}p>-50&&e.y<=p?(this.player.state.position.y=p,this.player.state.grounded=!0,this.player.state.velocity.y=0):(this.player.state.grounded=!1,this.player.state.velocity.y-=30*t,this.player.state.position.y+=this.player.state.velocity.y*t),this.updateBloodCoins(t);const u=this.player.state.position.x-this.portalPos.x,f=this.player.state.position.z-this.portalPos.z,m=Math.sqrt(u*u+f*f);if(m<this.PORTAL_RADIUS){this.exitVoidMode(!0);return}this.voidSpawnTimer-=t,this.voidSpawnTimer<=0&&(this.spawnVoidHunter(),this.voidSpawnTimer=this.VOID_SPAWN_INTERVAL),this.hud.showVoidMode(Math.floor(m),this.PORTAL_DISTANCE),this.player.isDead()&&this.exitVoidMode(!1)}spawnVoidHunter(){const t=this.player.state.position,e=this.player.state.yaw,i=(Math.random()-.5)*Math.PI+Math.PI,a=e+i,o=15+Math.random()*10,s=w(t.x+Math.cos(a)*o,2,t.z+Math.sin(a)*o),n=Date.now()+Math.floor(Math.random()*1e3),l=new V(s,12+Math.random()*4,n,"phantom",this.collision);l.active=!0,this.targetManager.targets.push(l),this.voidEnemyIds.push(n),this.audio.playSFX("void_whistle")}fallFromVoid(){this.isInVoid=!1,this.player.isInVoid=!1,this.voidCoins=[],this.audio.exitVoidAudio(),this.hud.hideVoidMode();const t=Math.random()<.5?$.left:$.right,e=t.x>0?-3:3;this.player.state.position={x:t.x+e,y:t.y,z:t.z},this.player.state.velocity={x:0,y:0,z:0},this.player.state.grounded=!0,this.screenShake=1,this.audio.playSFX("player_hurt"),this.hud.showMessage("💀 ВЫШВЫРНУЛО ИЗ БЕЗДНЫ!","purple"),this.player.state.health-=15,this.hud.showDamage(),this.hud.updateHealth(this.player.state.health,this.player.state.maxHealth),this.player.isDead()&&this.gameOver()}exitVoidMode(t){this.isInVoid=!1,this.player.isInVoid=!1,this.hud.hideVoidMode(),this.voidPortalActive=!1,this.voidPortalTimer=this.VOID_PORTAL_COOLDOWN+3,this.voidCoins=[],this.audio.exitVoidAudio();for(const e of this.targetManager.targets)this.voidEnemyIds.includes(e.id)&&(e.active=!1);this.voidEnemyIds=[];for(const e of this.targetManager.targets)this.savedEnemyIds.includes(e.id)&&(e.active=!0,e.removeTimer=0);this.savedEnemyIds=[],this.targetManager.waveActive=this.savedWaveActive,this.player.state.position={...this.savedPosition},this.player.state.yaw=this.savedYaw,this.player.state.velocity=w(0,0,0),this.player.state.grounded=!0,this.screenShake=.5,t?(this.hud.showVoidExit(!0),this.state.frags+=500,this.hud.showMessage("+500 БОНУС ЗА ВОЙД!","cyan")):(this.hud.showVoidExit(!1),this.player.takeDamage(50))}checkAttachedRunners(){for(const t of this.targetManager.targets)t.enemyType==="runner"&&t.isAttached&&t.attachTimer<=0&&t.active===!1&&(this.player.takeDamage(t.damage),this.audio.playSFX("runner_hit"),this.screenShake=.6,this.hud.showDamage("green"),this.hud.showMessage("⚠️ РАННЕР УКУСИЛ!","orange"))}updateEnemyProximitySounds(t){if(!this.isInVoid)for(const e of this.targetManager.targets){if(!e.active)continue;const i=e.position.x-t.x,a=e.position.y-t.y,o=e.position.z-t.z,s=Math.sqrt(i*i+a*a+o*o);this.audio.playEnemyProximitySound(e.enemyType,s)}}detachRunners(){let t=!1;for(const e of this.targetManager.targets)e.enemyType==="runner"&&e.isAttached&&(e.detachRunner(),t=!0);t&&this.hud.showMessage("✓ РАННЕР СБРОШЕН!","cyan")}onPickup(t){t==="health"?(this.player.state.health=Math.min(this.player.state.maxHealth,this.player.state.health+20),this.audio.playSFX("jump"),this.hud.showMessage("+20 HP","lime"),this.hud.updateHealth(this.player.state.health,this.player.state.maxHealth)):t==="health_big"?(this.player.state.health=Math.min(this.player.state.maxHealth,this.player.state.health+60),this.audio.playSFX("jump"),this.hud.showMessage("+60 HP!","lime"),this.hud.updateHealth(this.player.state.health,this.player.state.maxHealth)):t==="stimpack"?(this.player.activateStimpack(),this.audio.playSFX("kill"),this.hud.showMessage("🔥 БУЙСТВО! 🔥","red"),this.hud.showRageOverlay(8)):t==="charge"&&(this.weapon.chargeKatana(),this.audio.playSFX("charge_pickup"),this.hud.showMessage("⚡ КАТАНА ЗАРЯЖЕНА! (ПКМ x3) ⚡","cyan"),this.hud.updateSplashCharges(3),this.screenShake=.5)}checkNormalAttack(){const t=this.player.getEyePosition(),[e,i]=this.getKatanaTargetData(),a=e>0?1:0;if(this.weapon.attackType=a,this.targetManager.trySlice(t,this.player.state.yaw,this.weapon.attackRange,this.weapon.attackAngle,this.player.state.grounded,a)&&(this.lastSliceTime=this.gameTime,this.weaponRenderer.showHitEffect(),this.audio.playSFX("kill"),this.screenShake=.4),this.targetManager.wave===10&&this.targetManager.trySliceCrystal(t,this.player.state.yaw,this.weapon.attackRange)){this.weaponRenderer.showHitEffect(),this.audio.playSFX("kill");const l=this.targetManager.powerCrystals.filter(c=>c.active).length;l===0?(this.hud.showMessage("💀 КРИСТАЛЛЫ УНИЧТОЖЕНЫ! БОСС ОСЛАБЛЕН! 💀","purple"),this.screenShake=2):this.hud.showMessage(`🔮 КРИСТАЛЛ РАЗБИТ! (${l}/6)`,"cyan")}const s=this.checkAltarHit(t);if(s!==null)if(this.bloodCoins>=this.GRENADE_COST)this.bloodCoins-=this.GRENADE_COST,this.grenadeCount+=1,this.altars[s].score+=this.GRENADE_COST,this.audio.playSFX("kill"),this.hud.showMessage(`💣 +1 ГРАНАТА! (🩸${this.bloodCoins})`,"purple"),this.screenShake=.3;else if(this.carryingScore>0){const n=this.carryingScore*this.DARTS_PER_POINT;this.darts+=n,this.altars[s].score+=this.carryingScore,this.audio.playSFX("kill"),this.hud.showMessage(`🎯 +${n} ДРОТИКОВ!`,"cyan"),this.carryingScore=0,this.screenShake=.3}else this.hud.showMessage(`НУЖНЫ ОЧКИ ИЛИ 🩸${this.GRENADE_COST} МОНЕТ!`,"purple")}spawnBloodCoins(){this.voidCoins=[];const t={x:this.portalPos.x,z:this.portalPos.z},e=Math.sqrt(t.x**2+t.z**2);e>0&&(t.x/=e,t.z/=e);const i=e-6-12;for(let o=0;o<8;o++){const s=14+o*(i/7),n=Math.sin(o*73.1)*2,l=Math.cos(o*47.3)*2,c=Math.sin(o*91.7)*.8-.3+2,r=t.x*s+n,h=t.z*s+l;this.voidCoins.push({position:{x:r,y:c,z:h},active:!0,phase:Math.random()*Math.PI*2})}const a=[{x:8,z:8},{x:-8,z:8},{x:8,z:-8},{x:-8,z:-8}];for(const o of a)this.voidCoins.push({position:{x:o.x,y:2,z:o.z},active:!0,phase:Math.random()*Math.PI*2})}updateBloodCoins(t){if(!this.isInVoid)return;const e=this.player.state.position;for(const i of this.voidCoins){if(!i.active)continue;i.position.y=1.5+Math.sin(this.gameTime*3+i.phase)*.3;const a=i.position.x-e.x,o=i.position.y-e.y,s=i.position.z-e.z;Math.sqrt(a*a+o*o+s*s)<2&&(i.active=!1,this.bloodCoins++,this.audio.playSFX("kill"),this.hud.showMessage(`🩸 +1 МОНЕТА КРОВИ (${this.bloodCoins})`,"purple"))}}updateVoidPortal(t){if(!(this.isInVoid||this.isPaused))if(this.voidPortalActive){this.voidPortalLifetime-=t;const e=this.player.state.position;if(Math.sqrt(e.x**2+e.z**2)<2.5){this.enterVoid();return}this.voidPortalLifetime<=0&&(this.voidPortalActive=!1,this.voidPortalTimer=this.VOID_PORTAL_COOLDOWN,this.hud.showMessage("⚫ ПОРТАЛ ЗАКРЫЛСЯ","purple"))}else this.voidPortalTimer-=t,this.voidPortalTimer<=0?(this.voidPortalActive=!0,this.voidPortalLifetime=this.VOID_PORTAL_DURATION,this.audio.playSFX("kill"),this.hud.showMessage("🌀 ПОРТАЛ В ВОЙД ОТКРЫЛСЯ!","purple"),this.screenShake=.5):this.voidPortalTimer<=5&&Math.floor(this.voidPortalTimer)!==Math.floor(this.voidPortalTimer+t)&&this.hud.showMessage(`⚫ ПОРТАЛ ЧЕРЕЗ ${Math.ceil(this.voidPortalTimer)}...`,"purple")}enterVoid(){this.isInVoid=!0,this.player.isInVoid=!0,this.voidPortalActive=!1,this.voidEnemyIds=[],this.voidFallOffset=0,this.voidVariant=Math.floor(Math.random()*4),this.savedPosition={...this.player.state.position},this.savedYaw=this.player.state.yaw;const t=["БАГРОВЫЙ","ИЗУМРУДНЫЙ","ЗОЛОТОЙ","ЛЕДЯНОЙ"];this.hud.showMessage(`🌀 ${t[this.voidVariant]} ВОЙД!`,"purple"),this.audio.playSFX("kill"),this.screenShake=1,this.audio.enterVoidAudio(),this.player.state.position={x:0,y:2,z:0},this.player.state.velocity={x:0,y:0,z:0},this.player.state.grounded=!0;const e=Math.random()*Math.PI*2;this.portalPos={x:Math.cos(e)*40,y:2,z:Math.sin(e)*40},this.spawnBloodCoins(),this.voidSpawnTimer=2}fireDart(){if(this.darts<=0)return;this.darts--,this.audio.playSFX("jump");const t=this.player.getEyePosition(),e=this.player.state.yaw,i=this.player.state.pitch,a=Math.sin(e)*Math.cos(i),o=Math.sin(i),s=-Math.cos(e)*Math.cos(i),n=.03,l=(Math.random()-.5)*n,c=(Math.random()-.5)*n,r=(Math.random()-.5)*n,h=60;this.flyingDarts.push({position:{x:t.x+a*.5,y:t.y-.2,z:t.z+s*.5},velocity:{x:(a+l)*h,y:(o+c)*h,z:(s+r)*h},active:!0})}updateDarts(t){for(const e of this.flyingDarts)if(e.active){e.position.x+=e.velocity.x*t,e.position.y+=e.velocity.y*t,e.position.z+=e.velocity.z*t,e.velocity.y-=15*t;for(const i of this.targetManager.targets){if(!i.active)continue;const a=e.position.x-i.position.x,o=e.position.y-i.position.y,s=e.position.z-i.position.z,n=Math.sqrt(a*a+o*o+s*s);if(n<i.radius+.5){e.active=!1;const l=i.takeDamage(this.DART_DAMAGE);if(this.audio.playSFX("kill"),this.hud.showHitmarker(!1),l||i.hp<=0){const c={x:a/(n||1),y:0,z:s/(n||1)};i.slice(c),this.targetManager.onTargetDestroyed?.(i)}break}}(e.position.y<-5||Math.abs(e.position.x)>50||Math.abs(e.position.z)>50)&&(e.active=!1)}this.flyingDarts=this.flyingDarts.filter(e=>e.active)}throwGrenade(){if(this.grenadeCount<=0)return;this.grenadeCount--,this.audio.playSFX("jump");const t=this.player.getEyePosition(),e=this.player.state.yaw,i=this.player.state.pitch,a=Math.sin(e)*Math.cos(i),o=Math.sin(i),s=-Math.cos(e)*Math.cos(i);this.grenades.push({position:{x:t.x+a*1,y:t.y,z:t.z+s*1},velocity:{x:a*this.GRENADE_SPEED,y:o*this.GRENADE_SPEED+5,z:s*this.GRENADE_SPEED},active:!0,lifetime:this.GRENADE_FUSE}),this.hud.showMessage(`💣 ГРАНАТА! (осталось: ${this.grenadeCount})`,"purple")}updateGrenades(t){for(const e of this.grenades)e.active&&(e.position.x+=e.velocity.x*t,e.position.y+=e.velocity.y*t,e.position.z+=e.velocity.z*t,e.velocity.y-=this.GRENADE_GRAVITY*t,e.position.y<.5&&(e.position.y=.5,e.velocity.y=-e.velocity.y*.5,e.velocity.x*=.8,e.velocity.z*=.8),e.lifetime-=t,e.lifetime<=0&&(this.explodeGrenade(e.position),e.active=!1));this.grenades=this.grenades.filter(e=>e.active)}explodeGrenade(t){this.explosions.push({position:{...t},progress:0,active:!0}),this.audio.playSFX("explosion"),this.screenShake=3;for(const a of this.targetManager.targets){if(!a.active)continue;const o=t.x-a.position.x,s=t.y-a.position.y,n=t.z-a.position.z,l=Math.sqrt(o*o+s*s+n*n);if(l<this.EXPLOSION_RADIUS){const c=1-l/this.EXPLOSION_RADIUS,r=this.EXPLOSION_DAMAGE*c,h=a.takeDamage(r);if(this.hud.showHitmarker(!1),h||a.hp<=0){const p={x:o/(l||1),y:0,z:n/(l||1)};a.slice(p),this.targetManager.onTargetDestroyed?.(a)}}}const e=this.player.state.position;if(Math.sqrt((t.x-e.x)**2+(t.y-e.y)**2+(t.z-e.z)**2)<this.EXPLOSION_RADIUS){const a=Math.random()*Math.PI*2,o=Math.random()*this.EXPLOSION_RADIUS,s=t.x+Math.cos(a)*o,n=t.z+Math.sin(a)*o;this.player.state.position.x=s,this.player.state.position.z=n;const l=10;this.player.state.health-=l,this.hud.showDamage(),this.hud.updateHealth(this.player.state.health,this.player.state.maxHealth),this.hud.showMessage("⚡ GLITCH TELEPORT!","cyan"),this.screenShake=1.5,this.player.isDead()&&this.gameOver()}}updateExplosions(t){for(const e of this.explosions)e.active&&(e.progress+=t/this.EXPLOSION_DURATION,e.progress>=1&&(e.active=!1));this.explosions=this.explosions.filter(e=>e.active)}checkAltarHit(t){const e=this.weapon.attackRange+1.5;for(let i=0;i<this.altars.length;i++){const a=this.altars[i],o=t.x-a.position.x,s=t.z-a.position.z;if(Math.sqrt(o*o+s*s)<e){const l=a.position.x-t.x,c=a.position.z-t.z,r=Math.sqrt(l*l+c*c);if(r>.1){const h=Math.sin(this.player.state.yaw),p=-Math.cos(this.player.state.yaw);if(l/r*h+c/r*p>.5)return i}}}return null}checkSplashAttack(){const t=this.player.getEyePosition(),e=this.targetManager.trySplashWave(t,this.player.state.yaw,this.weapon.splashRadius);e>0&&(this.lastSliceTime=this.gameTime,this.weaponRenderer.showSplashWave(this.player.state.yaw),this.screenShake=.4,this.audio.playSFX("kill"),this.hud.showMessage(`🌊 ВОЛНА x${e}! 🌊`,"cyan")),this.hud.updateSplashCharges(this.weapon.splashCharges)}spawnDeathEffect(t){let e=this.deathEffects.find(i=>!i.active);!e&&this.deathEffects.length<8&&(e={position:{x:0,y:0,z:0},progress:0,active:!1},this.deathEffects.push(e)),e&&(e.position={...t},e.progress=.01,e.active=!0)}updateDeathEffects(t){for(const e of this.deathEffects)e.active&&(e.progress+=t/this.DEATH_EFFECT_DURATION,e.progress>=1&&(e.active=!1))}getKatanaTargetData(){const t=this.player.getEyePosition(),e=this.player.state.yaw;let i=-1,a=100;const o=5,s=Math.PI/2;for(const n of this.targetManager.targets){if(!n.active)continue;const l=n.position.x-t.x,c=n.position.z-t.z,r=Math.sqrt(l*l+c*c);if(r>o)continue;let p=Math.atan2(l,-c)-e;for(;p>Math.PI;)p-=Math.PI*2;for(;p<-Math.PI;)p+=Math.PI*2;Math.abs(p)>s||r<a&&(a=r,i=p)}return[i,a]}getFragmentCount(){let t=0;for(const e of this.targetManager.targets)t+=e.fragments.length;return t}getDeathEffectsData(){const t=new Float32Array(32);for(let e=0;e<Math.min(this.deathEffects.length,8);e++){const i=this.deathEffects[e];i.active&&(t[e*4+0]=i.position.x,t[e*4+1]=i.position.y,t[e*4+2]=i.position.z,t[e*4+3]=i.progress)}return t}activateComboAdrenaline(){this.killTimes=[],this.player.activateStimpack(),this.audio.playSFX("kill"),this.hud.showMessage("🔥🔥🔥 КОМБО АДРЕНАЛИН! 🔥🔥🔥","red"),this.hud.showRageOverlay(8),this.screenShake=.5}render(){const t=this.targetManager.getShaderData(),e=this.targetManager.targets.length,i=this.targetManager.getPoolsShaderData(),a=this.targetManager.toxicPools.length,o=this.pickupManager.getShaderData(),s=this.pickupManager.pickups.length;let n=this.player.state.yaw,l=this.player.state.pitch;this.screenShake>0&&(n+=(Math.random()-.5)*this.screenShake*.1,l+=(Math.random()-.5)*this.screenShake*.1);const c=Math.max(0,.3-(this.gameTime-this.lastSliceTime))*3,r=this.targetManager.getCrystalsData(),h=this.targetManager.getAcidProjectilesData(),p=this.targetManager.acidProjectiles.length,u=this.targetManager.getSpikesData(),f=this.targetManager.getSpikeTargetsData(),m=Math.min(this.targetManager.spikes.length,8),g=this.targetManager.getAcidRainZonesData(),x=this.targetManager.acidRainZones.length,y=new Float32Array(8);for(let T=0;T<this.altars.length;T++)y[T*4+0]=this.altars[T].position.x,y[T*4+1]=this.altars[T].position.y,y[T*4+2]=this.altars[T].position.z,y[T*4+3]=this.altars[T].score;const b=new Float32Array(64),k=new Float32Array(64),A=Math.min(this.flyingDarts.length,16);for(let T=0;T<A;T++){const M=this.flyingDarts[T];b[T*4+0]=M.position.x,b[T*4+1]=M.position.y,b[T*4+2]=M.position.z,b[T*4+3]=M.active?1:0;const C=Math.sqrt(M.velocity.x**2+M.velocity.y**2+M.velocity.z**2);k[T*4+0]=M.velocity.x/(C||1),k[T*4+1]=M.velocity.y/(C||1),k[T*4+2]=M.velocity.z/(C||1),k[T*4+3]=C}const P=this.getGrenadesData(),R=this.grenades.filter(T=>T.active).length,D=this.getExplosionsData(),S=this.explosions.filter(T=>T.active).length;this.renderer.render(this.gameTime,this.player.getEyePosition(),n,l,t,e,c,i,a,this.currentEra,this.targetManager.wave,o,s,r,h,p,u,f,m,g,x,this.targetManager.greenBossPhase2,this.isInVoid,0,this.voidFallOffset,this.isInVoid?this.portalPos:void 0,y,b,k,A,this.voidPortalActive?this.voidPortalLifetime:0,this.getBloodCoinsData(),this.voidCoins.filter(T=>T.active).length,P,R,D,S,this.voidVariant,this.weaponRenderer.attackProgress,this.weapon.state.bobPhase,this.weaponRenderer.splashCharges,...this.getKatanaTargetData(),this.weapon.attackType,this.getDeathEffectsData(),this.targetManager.getAllFragmentsData(),Math.min(this.getFragmentCount(),32)),this.weaponRenderer.setSceneLighting(this.currentEra),this.weaponRenderer.render(this.weapon.state,this.gameTime)}getBloodCoinsData(){const t=new Float32Array(48),e=this.voidCoins.filter(i=>i.active);for(let i=0;i<Math.min(e.length,12);i++){const a=e[i];t[i*4+0]=a.position.x,t[i*4+1]=a.position.y,t[i*4+2]=a.position.z,t[i*4+3]=1}return t}getGrenadesData(){const t=new Float32Array(32),e=this.grenades.filter(i=>i.active);for(let i=0;i<Math.min(e.length,8);i++){const a=e[i];t[i*4+0]=a.position.x,t[i*4+1]=a.position.y,t[i*4+2]=a.position.z,t[i*4+3]=a.lifetime}return t}getExplosionsData(){const t=new Float32Array(32),e=this.explosions.filter(i=>i.active);for(let i=0;i<Math.min(e.length,8);i++){const a=e[i];t[i*4+0]=a.position.x,t[i*4+1]=a.position.y,t[i*4+2]=a.position.z,t[i*4+3]=a.progress}return t}handleResize(){const t=this.renderer.isPhoneProfile?1:window.devicePixelRatio||1;this.weaponCanvas.width=window.innerWidth*t,this.weaponCanvas.height=window.innerHeight*t,this.weaponCanvas.style.width=window.innerWidth+"px",this.weaponCanvas.style.height=window.innerHeight+"px",this.weaponRenderer.resize(this.weaponCanvas.width,this.weaponCanvas.height)}toggleFullscreen(){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}destroy(){this.stop(),this.input.destroy(),this.audio.stop(),this.renderer.destroy()}}function xt(){new URLSearchParams(location.search).get("fps")==="1"&&document.body.classList.add("show-fps");const v=document.getElementById("game-canvas"),t=document.getElementById("weapon-canvas");if(!v||!t){console.error("Canvas элементы не найдены!");return}const e=new te(v,t);window.game=e,console.log("🎮 Dungeon Synth Shooter загружен"),console.log("📖 Управление: WASD, SHIFT (бег), SPACE (прыжок), LMB (стрельба), R (перезарядка)"),console.log("🔊 M - mute, F - fullscreen")}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",xt):xt();
//# sourceMappingURL=index-Djm_u8E5.js.map
