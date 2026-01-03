(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const o of s)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function e(s){const o={};return s.integrity&&(o.integrity=s.integrity),s.referrerPolicy&&(o.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?o.credentials="include":s.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(s){if(s.ep)return;s.ep=!0;const o=e(s);fetch(s.href,o)}})();class B{updateFn;renderFn;lastTime=0;accumulator=0;fixedDeltaTime=1/60;animationFrameId=null;isRunning=!1;fps=0;frameCount=0;fpsTime=0;constructor(t,e){this.updateFn=t,this.renderFn=e}start(){this.isRunning||(this.isRunning=!0,this.lastTime=performance.now(),this.fpsTime=this.lastTime,this.frameCount=0,this.animationFrameId=requestAnimationFrame(this.tick.bind(this)))}stop(){this.isRunning&&(this.isRunning=!1,this.animationFrameId!==null&&(cancelAnimationFrame(this.animationFrameId),this.animationFrameId=null))}tick(t){if(!this.isRunning)return;const e=Math.min((t-this.lastTime)/1e3,.1);for(this.lastTime=t,this.frameCount++,t-this.fpsTime>=1e3&&(this.fps=this.frameCount,this.frameCount=0,this.fpsTime=t),this.accumulator+=e;this.accumulator>=this.fixedDeltaTime;)this.updateFn(this.fixedDeltaTime),this.accumulator-=this.fixedDeltaTime;const i=this.accumulator/this.fixedDeltaTime;this.renderFn(i),this.animationFrameId=requestAnimationFrame(this.tick.bind(this))}}class E{state={forward:!1,backward:!1,left:!1,right:!1,run:!1,jump:!1,fire:!1,altFire:!1,reload:!1};mouseDelta={x:0,y:0};isPointerLocked=!1;sensitivity=.005;setSensitivity(t){this.sensitivity=Math.max(.001,Math.min(.015,t))}invertX=!0;invertY=!0;canvas;onPointerLockChange;constructor(t){this.canvas=t,this.setupListeners()}setupListeners(){document.addEventListener("keydown",this.handleKeyDown.bind(this)),document.addEventListener("keyup",this.handleKeyUp.bind(this)),document.addEventListener("mousemove",this.handleMouseMove.bind(this)),document.addEventListener("mousedown",this.handleMouseDown.bind(this)),document.addEventListener("mouseup",this.handleMouseUp.bind(this)),this.canvas.addEventListener("contextmenu",t=>t.preventDefault()),document.addEventListener("pointerlockchange",this.handlePointerLockChange.bind(this))}requestPointerLock(t){this.onPointerLockChange=t,this.canvas.requestPointerLock()}exitPointerLock(){document.exitPointerLock()}resetMouseDelta(){this.mouseDelta.x=0,this.mouseDelta.y=0}handleKeyDown(t){this.updateKeyState(t.code,!0)}handleKeyUp(t){this.updateKeyState(t.code,!1)}updateKeyState(t,e){switch(t){case"KeyW":this.state.forward=e;break;case"KeyS":this.state.backward=e;break;case"KeyA":this.state.left=e;break;case"KeyD":this.state.right=e;break;case"ShiftLeft":case"ShiftRight":this.state.run=e;break;case"Space":this.state.jump=e;break;case"KeyR":this.state.reload=e;break}}handleMouseMove(t){if(!this.isPointerLocked)return;const e=this.invertX?-t.movementX:t.movementX,i=this.invertY?-t.movementY:t.movementY;this.mouseDelta.x+=e*this.sensitivity,this.mouseDelta.y+=i*this.sensitivity}handleMouseDown(t){t.button===0?this.state.fire=!0:t.button===2&&(t.preventDefault(),this.state.altFire=!0)}handleMouseUp(t){t.button===0?this.state.fire=!1:t.button===2&&(this.state.altFire=!1)}handlePointerLockChange(){this.isPointerLocked=document.pointerLockElement===this.canvas,this.onPointerLockChange?.()}destroy(){document.removeEventListener("keydown",this.handleKeyDown.bind(this)),document.removeEventListener("keyup",this.handleKeyUp.bind(this)),document.removeEventListener("mousemove",this.handleMouseMove.bind(this)),document.removeEventListener("mousedown",this.handleMouseDown.bind(this)),document.removeEventListener("mouseup",this.handleMouseUp.bind(this)),document.removeEventListener("pointerlockchange",this.handlePointerLockChange.bind(this))}}function T(y=0,t=0,e=0){return{x:y,y:t,z:e}}function I(y,t){return{x:y.x-t.x,y:y.y-t.y,z:y.z-t.z}}function C(y){return Math.sqrt(y.x*y.x+y.y*y.y+y.z*y.z)}function V(y){const t=C(y);return t===0?{x:0,y:0,z:0}:{x:y.x/t,y:y.y/t,z:y.z/t}}function z(y,t){return C(I(y,t))}function _(y,t,e){return Math.max(t,Math.min(e,y))}const F={walkSpeed:8,runSpeed:20,jumpForce:12,gravity:25,groundFriction:12,airControl:.85,mouseSensitivity:.002};class O{state;config;collision;stepSpeed=12;maxStepHeight=.5;targetYaw=0;targetPitch=-.05;airJumpCooldown=0;AIR_JUMP_COOLDOWN=2;airJumpsLeft=0;maxAirJumps=1;canAirJump=!1;rageMode=!1;rageModeTimer=0;speedBoost=1;speedBoostTimer=0;constructor(t=T(0,1.7,5),e={},i){this.config={...F,...e},this.collision=i,this.state={position:{...t},velocity:T(),yaw:0,pitch:-.05,grounded:!0,eyeHeight:1.7,health:100,maxHealth:100}}update(t,e,i){this.rageModeTimer>0&&(this.rageModeTimer-=t,this.rageModeTimer<=0&&(this.rageMode=!1)),this.speedBoostTimer>0&&(this.speedBoostTimer-=t,this.speedBoostTimer<=0&&(this.speedBoost=1)),this.airJumpCooldown>0&&(this.airJumpCooldown-=t),this.updateCamera(i),this.updateMovement(t,e)}activateStimpack(){this.rageMode=!0,this.rageModeTimer=8,this.speedBoost=1.8,this.speedBoostTimer=8}tryDoubleJump(){return!this.canAirJump||this.airJumpsLeft<=0?!1:this.rageMode?(this.state.velocity.y=this.config.jumpForce*.9,this.airJumpsLeft--,this.canAirJump=!1,!0):this.airJumpCooldown<=0?(this.airJumpCooldown=this.AIR_JUMP_COOLDOWN,this.state.velocity.y=this.config.jumpForce,this.airJumpsLeft--,this.canAirJump=!1,!0):!1}onJumpReleased(){this.state.grounded||(this.canAirJump=!0)}getDoubleJumpCooldown(){return Math.max(0,this.airJumpCooldown)}isDoubleJumpReady(){return this.airJumpCooldown<=0&&this.airJumpsLeft>0||this.rageMode}unlockTripleJump(){this.maxAirJumps=2}getAirJumpsLeft(){return this.airJumpsLeft}updateCamera(t){this.targetYaw-=t.x,this.targetPitch+=t.y,this.targetPitch=_(this.targetPitch,-Math.PI/2+.01,Math.PI/2-.01),this.state.yaw+=(this.targetYaw-this.state.yaw)*.7,this.state.pitch+=(this.targetPitch-this.state.pitch)*.7}updateMovement(t,e){const{state:i,config:s}=this;let o=0,a=0;e.forward&&(a-=1),e.backward&&(a+=1),e.left&&(o-=1),e.right&&(o+=1);const n=Math.sqrt(o*o+a*a);n>0&&(o/=n,a/=n);const r=Math.sin(i.yaw),c=Math.cos(i.yaw),h=o*c-a*r,l=o*r+a*c,p=(e.run?s.runSpeed:s.walkSpeed)*this.speedBoost,m=h*p,f=l*p,v=this.collision.getFloorHeight(i.position)+i.eyeHeight;if(i.grounded){const k=s.groundFriction*t;if(i.velocity.x+=(m-i.velocity.x)*Math.min(k,1),i.velocity.z+=(f-i.velocity.z)*Math.min(k,1),e.jump)i.velocity.y=s.jumpForce,i.grounded=!1,this.airJumpsLeft=this.maxAirJumps,this.canAirJump=!1;else{const A=v-i.position.y;Math.abs(A)<.01?(i.position.y=v,i.velocity.y=0):A>0&&A<this.maxStepHeight?i.velocity.y=this.stepSpeed:A<0&&A>-this.maxStepHeight?i.velocity.y=-this.stepSpeed*.8:A<-this.maxStepHeight&&(i.grounded=!1,i.velocity.y=0)}}else{const k=8*t;i.velocity.x+=(m-i.velocity.x)*Math.min(k,1),i.velocity.z+=(f-i.velocity.z)*Math.min(k,1),i.velocity.y-=s.gravity*t}const x=i.position.x+i.velocity.x*t,d=i.position.y+i.velocity.y*t,b=i.position.z+i.velocity.z*t,w={x,y:i.position.y,z:i.position.z};this.collision.checkCollision(w)?i.velocity.x=0:i.position.x=x;const q={x:i.position.x,y:i.position.y,z:b};this.collision.checkCollision(q)?i.velocity.z=0:i.position.z=b;const R=this.collision.getFloorHeight(i.position)+i.eyeHeight;if(i.grounded)i.position.y+=i.velocity.y*t,i.position.y<R&&(i.position.y=R,i.velocity.y=0);else if(d<=R)i.position.y=R,i.velocity.y=0,i.grounded=!0,this.canAirJump=!1,this.airJumpsLeft=0;else{const k={x:i.position.x,y:d,z:i.position.z},A=this.collision.getCeilingHeight(i.position);d<A-.3&&!this.collision.checkCollision(k)?i.position.y=d:i.velocity.y=Math.min(i.velocity.y,0)}}getEyePosition(){return{x:this.state.position.x,y:this.state.position.y,z:this.state.position.z}}getLookDirection(){const{yaw:t,pitch:e}=this.state;return{x:Math.sin(t)*Math.cos(e),y:Math.sin(e),z:-Math.cos(t)*Math.cos(e)}}takeDamage(t){this.state.health=Math.max(0,this.state.health-t)}heal(t){this.state.health=Math.min(this.state.maxHealth,this.state.health+t)}isDead(){return this.state.health<=0}reset(t){this.state.position={...t},this.state.velocity=T(),this.state.health=this.state.maxHealth,this.state.grounded=!0}}class D{state;currentWeapon="katana";splashCharges=0;attackCooldown=0;attackDuration=.3;attackCooldownTime=.4;attackRange=4;attackAngle=Math.PI*.6;damage=100;isAttacking=!1;attackProgress=0;onSlice;onSplash;isSplashAttack=!1;splashRadius=10;constructor(){this.state={ammo:999,reserveAmmo:999,magazineSize:999,isReloading:!1,reloadTimeLeft:0,recoilX:0,recoilY:0,recoilBack:0,muzzleFlash:0,bobPhase:0}}update(t,e,i){if(this.attackCooldown>0&&(this.attackCooldown-=t),this.isAttacking&&(this.attackProgress+=t/this.attackDuration,this.attackProgress>=1&&(this.isAttacking=!1,this.attackProgress=0)),e){const s=i?14:10;this.state.bobPhase+=t*s}else this.state.bobPhase*=.95;this.state.recoilX*=.85,this.state.recoilY*=.85,this.state.muzzleFlash*=.8}tryAttack(){return this.attackCooldown>0||this.isAttacking?!1:(this.attack(!1),!0)}trySplashAttack(){return this.attackCooldown>0||this.isAttacking||this.splashCharges<=0?!1:(this.attack(!0),!0)}attack(t){this.isAttacking=!0,this.attackProgress=0,this.attackCooldown=t?.6:this.attackCooldownTime,this.isSplashAttack=t,t?(this.splashCharges--,this.state.recoilX=.6,this.state.muzzleFlash=2,this.splashCharges<=0&&(this.currentWeapon="katana"),this.onSplash?.()):(this.state.recoilX=.3,this.state.muzzleFlash=1,this.onSlice?.())}chargeKatana(){this.currentWeapon="charged",this.splashCharges=3}isCharged(){return this.splashCharges>0}checkHit(t,e,i){if(!this.isAttacking||this.attackProgress<.2||this.attackProgress>.6)return!1;const s=i.x-t.x,o=i.z-t.z,a=Math.sqrt(s*s+o*o);if(this.isSplashAttack)return a<=this.splashRadius;if(a>this.attackRange)return!1;let r=Math.atan2(s,-o)-e;for(;r>Math.PI;)r-=Math.PI*2;for(;r<-Math.PI;)r+=Math.PI*2;return Math.abs(r)<this.attackAngle/2}getWeaponOffset(){const t=Math.sin(this.state.bobPhase)*.02,e=Math.abs(Math.sin(this.state.bobPhase*2))*.015;let i=0,s=0;if(this.isAttacking){const o=this.attackProgress;i=Math.sin(o*Math.PI)*.3,s=-Math.sin(o*Math.PI*2)*.1}return{x:t+this.state.recoilX+i,y:e-this.state.recoilY+s,z:0}}tryShoot(t,e){return this.tryAttack()}startReload(){return!1}projectiles=[]}class G{ctx;width;height;attackProgress=0;isAttacking=!1;isSplashAttack=!1;splashCharges=0;hitFlash=0;particles=[];static MAX_PARTICLES=50;splashWaveActive=!1;splashWaveProgress=0;splashWaveYaw=0;constructor(t){this.ctx=t.getContext("2d"),this.width=t.width,this.height=t.height}resize(t,e){this.width=t,this.height=e}showHitEffect(){this.hitFlash=1,this.spawnFragments()}showSplashEffect(){this.hitFlash=1.2,this.spawnAxeSplash()}showSplashWave(t){this.splashWaveActive=!0,this.splashWaveProgress=0,this.splashWaveYaw=t,this.hitFlash=1.5,this.spawnWaveParticles()}spawnWaveParticles(){if(this.particles.length>G.MAX_PARTICLES)return;const t=this.width/2,e=this.height/2,i=["#00ffff","#00e5ff","#00bfff","#40e0d0"];for(let s=0;s<12;s++){const o=s/12*Math.PI-Math.PI/2,a=600+Math.random()*300;this.particles.push({x:t,y:e,vx:Math.cos(o)*a,vy:Math.sin(o)*a*.3,size:5+Math.random()*6,color:i[s%i.length],life:.4+Math.random()*.3,maxLife:.4+Math.random()*.3,type:"spark"})}for(let s=0;s<6;s++){const o=(Math.random()-.5)*Math.PI*.8,a=600+Math.random()*300;this.particles.push({x:t+(Math.random()-.5)*100,y:e+(Math.random()-.5)*50,vx:Math.cos(o)*a,vy:Math.sin(o)*a*.2,size:12+Math.random()*18,color:i[Math.floor(Math.random()*i.length)],life:.8+Math.random()*.4,maxLife:.8+Math.random()*.4,type:"fragment"})}}spawnFragments(){if(this.particles.length>G.MAX_PARTICLES)return;const t=this.width/2,e=this.height/2,i=["#00ff00","#33ff00","#66ff33","#00ff66"];for(let s=0;s<6;s++){const o=s/6*Math.PI*2+Math.random()*.5,a=400+Math.random()*400;this.particles.push({x:t+(Math.random()-.5)*40,y:e+(Math.random()-.5)*40,vx:Math.cos(o)*a,vy:Math.sin(o)*a-150,size:6+Math.random()*8,color:i[s%i.length],life:.5+Math.random()*.3,maxLife:.5+Math.random()*.3,type:"fragment"})}for(let s=0;s<10;s++){const o=Math.random()*Math.PI*2,a=200+Math.random()*300;this.particles.push({x:t+(Math.random()-.5)*20,y:e+(Math.random()-.5)*20,vx:Math.cos(o)*a,vy:Math.sin(o)*a-80,size:2+Math.random()*3,color:i[s%i.length],life:.3+Math.random()*.2,maxLife:.3+Math.random()*.2,type:"spark"})}}updateParticles(t){const i=this.height+50;let s=0;for(let o=0;o<this.particles.length;o++){const a=this.particles[o];a.x+=a.vx*t,a.y+=a.vy*t,a.vy+=800*t,a.vx*=.98,a.life-=t,a.life>0&&a.y<i&&(this.particles[s++]=a)}this.particles.length=s}renderParticles(t){t.shadowBlur=0;for(const e of this.particles){const i=Math.min(1,e.life/e.maxLife*2);t.globalAlpha=i,t.fillStyle=e.color,e.type==="fragment"?(t.beginPath(),t.arc(e.x,e.y,e.size,0,Math.PI*2),t.fill(),t.globalAlpha=i*.8,t.fillStyle="#ffffff",t.beginPath(),t.arc(e.x,e.y,e.size*.4,0,Math.PI*2),t.fill()):(t.beginPath(),t.arc(e.x,e.y,e.size,0,Math.PI*2),t.fill(),t.globalAlpha=i*.5,t.strokeStyle=e.color,t.lineWidth=e.size*.5,t.beginPath(),t.moveTo(e.x,e.y),t.lineTo(e.x-e.vx*.02,e.y-e.vy*.02),t.stroke())}t.globalAlpha=1}render(t,e){const i=this.ctx;i.clearRect(0,0,this.width,this.height),this.updateParticles(1/60),this.splashWaveActive&&(this.splashWaveProgress+=.03,this.splashWaveProgress>=1&&(this.splashWaveActive=!1));const s=Math.min(this.width,this.height)/600,o=Math.sin(t.bobPhase)*8*s,a=Math.abs(Math.sin(t.bobPhase*2))*6*s;this.hitFlash>0&&(this.hitFlash-=.04),this.splashWaveActive&&this.drawSplashWaveEffect(i,e),i.save();let n=this.width*.65,r=this.height*.8,c=-.4;if(this.isAttacking){const h=this.attackProgress,l=1-Math.pow(1-h,3);c=-.4-Math.sin(l*Math.PI)*(this.isSplashAttack?3.2:2.5);const p=this.isSplashAttack?1.5:1;n-=Math.sin(h*Math.PI)*this.width*.3*p,r-=Math.sin(h*Math.PI)*this.height*.15*p}i.translate(n+o,r+a),i.rotate(c),i.scale(s,s),this.isAttacking&&this.attackProgress>.05&&this.attackProgress<.8&&(this.isSplashAttack?this.drawSplashSlash(i,this.attackProgress,e):this.drawRetrowaveSlash(i,this.attackProgress,e)),this.drawKatana(i,t,e),this.splashCharges>0&&this.drawChargeIndicator(i,e),this.hitFlash>0&&this.drawHitGlow(i,this.hitFlash,this.isSplashAttack?"charged":"katana"),i.restore(),this.renderParticles(i),this.hitFlash>.5&&this.drawScreenFlash(i,this.isSplashAttack?"charged":"katana")}drawChargeIndicator(t,e){t.save(),t.shadowColor="#00ffff",t.shadowBlur=15;for(let i=0;i<3;i++){const s=-50-i*60,o=.7+.3*Math.sin(e*5+i);this.splashCharges>i?(t.fillStyle=`rgba(0, 255, 255, ${o})`,t.beginPath(),t.arc(0,s,8,0,Math.PI*2),t.fill(),t.strokeStyle=`rgba(0, 255, 255, ${o*.5})`,t.lineWidth=2,t.beginPath(),t.arc(0,s,12+Math.sin(e*8+i)*3,0,Math.PI*2),t.stroke()):(t.fillStyle="rgba(100, 100, 100, 0.3)",t.beginPath(),t.arc(0,s,6,0,Math.PI*2),t.fill())}t.restore()}drawSplashWaveEffect(t,e){const i=this.width/2,s=this.height/2,o=Math.max(this.width,this.height)*.8,a=this.splashWaveProgress*o;t.save();for(let r=0;r<3;r++){const c=a-r*30;if(c>0){const h=(1-this.splashWaveProgress)*(.5-r*.1);t.strokeStyle=`rgba(0, 255, 255, ${h})`,t.lineWidth=8-r*2,t.shadowColor="#00ffff",t.shadowBlur=20,t.beginPath(),t.ellipse(i,s+100,c,c*.3,0,Math.PI,0),t.stroke(),r===0&&(t.strokeStyle=`rgba(255, 255, 255, ${h*.8})`,t.lineWidth=2,t.beginPath(),t.ellipse(i,s+100,c-5,(c-5)*.3,0,Math.PI,0),t.stroke())}}const n=Math.floor((1-this.splashWaveProgress)*20);t.fillStyle="#ffffff";for(let r=0;r<n;r++){const c=Math.PI+Math.random()*Math.PI,h=a+(Math.random()-.5)*20,l=i+Math.cos(c)*h,u=s+100+Math.sin(c)*h*.3,p=2+Math.random()*4;t.beginPath(),t.arc(l,u,p,0,Math.PI*2),t.fill()}t.restore()}drawSplashSlash(t,e,i){t.save(),t.globalCompositeOperation="lighter";const s=t.createLinearGradient(-200,-350,50,0);s.addColorStop(0,"rgba(0, 255, 255, 0)"),s.addColorStop(.3,"rgba(0, 255, 255, 0.8)"),s.addColorStop(.6,"rgba(0, 255, 255, 1)"),s.addColorStop(1,"rgba(0, 255, 255, 0)"),t.strokeStyle=s,t.lineWidth=30+Math.sin(e*Math.PI)*20,t.lineCap="round",t.shadowColor="#00ffff",t.shadowBlur=40,t.beginPath(),t.moveTo(-200,-350),t.quadraticCurveTo(-100+Math.sin(i*30)*20,-200,50,0),t.stroke(),t.strokeStyle="rgba(255, 255, 255, 0.9)",t.lineWidth=6,t.shadowBlur=20,t.stroke();for(let o=0;o<3;o++){const a=o*15;t.strokeStyle=`rgba(0, 200, 255, ${.4-o*.1})`,t.lineWidth=4-o,t.beginPath(),t.moveTo(-200-a,-350+a),t.quadraticCurveTo(-100-a+Math.sin(i*30+o)*15,-200+a,50-a,0+a),t.stroke()}t.restore()}drawKatana(t,e,i){t.fillStyle="#8a7a6a",t.beginPath(),t.ellipse(0,80,40,50,.2,0,Math.PI*2),t.fill();const s=t.createLinearGradient(0,40,0,160);s.addColorStop(0,"#2a1a1a"),s.addColorStop(.5,"#1a0a0a"),s.addColorStop(1,"#2a1a1a"),t.fillStyle=s,t.beginPath(),t.moveTo(-14,40),t.lineTo(14,40),t.lineTo(12,160),t.lineTo(-12,160),t.closePath(),t.fill(),t.strokeStyle="#ff00ff",t.shadowColor="#ff00ff",t.shadowBlur=10,t.lineWidth=2;for(let a=0;a<10;a++){const n=50+a*11,r=.5+.5*Math.sin(i*3+a*.5);t.strokeStyle=`rgba(255, 0, 255, ${r})`,t.beginPath(),t.moveTo(-12,n),t.lineTo(0,n+5),t.lineTo(12,n),t.stroke()}t.shadowBlur=0,t.fillStyle="#1a1a2a",t.beginPath(),t.ellipse(0,35,35,12,0,0,Math.PI*2),t.fill(),t.strokeStyle="#00ffff",t.shadowColor="#00ffff",t.shadowBlur=15,t.lineWidth=2,t.beginPath(),t.ellipse(0,35,32,10,0,0,Math.PI*2),t.stroke(),t.shadowBlur=0;const o=t.createLinearGradient(-10,0,10,0);o.addColorStop(0,"#8080a0"),o.addColorStop(.3,"#c0c0e0"),o.addColorStop(.5,"#ffffff"),o.addColorStop(.7,"#c0c0e0"),o.addColorStop(1,"#6060a0"),t.fillStyle=o,t.beginPath(),t.moveTo(-10,30),t.lineTo(10,30),t.lineTo(7,-280),t.lineTo(0,-320),t.lineTo(-5,-280),t.closePath(),t.fill(),t.strokeStyle="#00ffff",t.shadowColor="#00ffff",t.shadowBlur=8,t.lineWidth=2,t.beginPath(),t.moveTo(9,30),t.lineTo(6,-280),t.lineTo(0,-320),t.stroke(),t.strokeStyle=`rgba(255, 0, 255, ${.5+.3*Math.sin(i*4)})`,t.shadowColor="#ff00ff",t.shadowBlur=5,t.lineWidth=1.5,t.beginPath(),t.moveTo(-4,30);for(let a=0;a<25;a++){const n=30-a*13,r=Math.sin(a*.7+i*2)*4;t.lineTo(-4+r,n)}t.stroke(),t.shadowBlur=0,t.fillStyle="rgba(255, 255, 255, 0.4)",t.beginPath(),t.moveTo(3,25),t.lineTo(5,25),t.lineTo(3,-270),t.lineTo(1,-270),t.closePath(),t.fill()}drawRetrowaveSlash(t,e,i){t.save(),t.translate(0,-150);const s=Math.sin(e*Math.PI),o=[{color:"#ff00ff",offset:0},{color:"#00ffff",offset:15},{color:"#ff0080",offset:30},{color:"#8000ff",offset:45}];for(const{color:a,offset:n}of o)t.strokeStyle=a,t.shadowColor=a,t.shadowBlur=25,t.lineWidth=10-n*.15,t.lineCap="round",t.beginPath(),t.arc(0,100,200+n,-Math.PI*.7,Math.PI*.15),t.globalAlpha=s*(1-n*.015),t.stroke();t.globalAlpha=s;for(let a=0;a<15;a++){const n=-Math.PI*.7+Math.PI*.85*(a/15)+Math.sin(i*10+a)*.1,r=200+Math.random()*50,c=Math.cos(n)*r,h=100+Math.sin(n)*r,l=a%2===0?"#ff00ff":"#00ffff";t.fillStyle=l,t.shadowColor=l,t.shadowBlur=15,t.beginPath(),t.arc(c,h,4+Math.random()*4,0,Math.PI*2),t.fill()}t.globalAlpha=1,t.shadowBlur=0,t.restore()}drawAxe(t,e,i,s){t.fillStyle="#8a7a6a",t.beginPath(),t.ellipse(0,80,40,50,.2,0,Math.PI*2),t.fill();const o=t.createLinearGradient(0,40,0,160);o.addColorStop(0,"#3a2010"),o.addColorStop(.5,"#2a1005"),o.addColorStop(1,"#3a2010"),t.fillStyle=o,t.beginPath(),t.moveTo(-14,40),t.lineTo(14,40),t.lineTo(12,160),t.lineTo(-12,160),t.closePath(),t.fill(),t.strokeStyle="#ff6600",t.shadowColor="#ff6600",t.shadowBlur=10,t.lineWidth=2;for(let n=0;n<10;n++){const r=50+n*11,c=.5+.5*Math.sin(i*4+n*.5);t.strokeStyle=`rgba(255, 100, 0, ${c})`,t.beginPath(),t.moveTo(-12,r),t.lineTo(0,r+5),t.lineTo(12,r),t.stroke()}t.shadowBlur=0,t.fillStyle="#2a2020",t.beginPath(),t.rect(-30,25,60,20),t.fill(),t.strokeStyle="#ff6600",t.shadowColor="#ff6600",t.shadowBlur=15,t.lineWidth=2,t.strokeRect(-28,27,56,16),t.shadowBlur=0;const a=t.createLinearGradient(-40,0,40,0);a.addColorStop(0,"#6060a0"),a.addColorStop(.2,"#8080b0"),a.addColorStop(.4,"#b0b0d0"),a.addColorStop(.5,"#e0e0f0"),a.addColorStop(.6,"#b0b0d0"),a.addColorStop(.8,"#8080b0"),a.addColorStop(1,"#6060a0"),t.fillStyle=a,t.beginPath(),t.moveTo(-12,20),t.lineTo(12,20),t.lineTo(15,-50),t.lineTo(50,-180),t.lineTo(55,-220),t.lineTo(0,-300),t.lineTo(-55,-220),t.lineTo(-50,-180),t.lineTo(-15,-50),t.closePath(),t.fill(),t.strokeStyle="#ff6600",t.shadowColor="#ff6600",t.shadowBlur=12,t.lineWidth=3,t.beginPath(),t.moveTo(14,20),t.lineTo(52,-180),t.lineTo(57,-220),t.lineTo(0,-305),t.stroke(),t.beginPath(),t.moveTo(-14,20),t.lineTo(-52,-180),t.lineTo(-57,-220),t.lineTo(0,-305),t.stroke(),t.strokeStyle=`rgba(255, 150, 0, ${.5+.3*Math.sin(i*5)})`,t.shadowColor="#ff9900",t.shadowBlur=8,t.lineWidth=2,t.beginPath(),t.moveTo(0,15);for(let n=0;n<20;n++){const r=15-n*15,c=Math.sin(n*.8+i*3)*(3+n*.3);t.lineTo(c,r)}t.stroke(),t.shadowBlur=0;for(let n=0;n<5;n++){const r=-50-n*45;n<s?(t.fillStyle="#ff8800",t.shadowColor="#ff8800",t.shadowBlur=15):(t.fillStyle="#333333",t.shadowColor="transparent",t.shadowBlur=0),t.beginPath(),t.arc(0,r,4,0,Math.PI*2),t.fill()}t.shadowBlur=0,t.fillStyle="rgba(255, 255, 255, 0.4)",t.beginPath(),t.moveTo(5,15),t.lineTo(8,15),t.lineTo(40,-170),t.lineTo(37,-170),t.closePath(),t.fill()}drawAxeSlash(t,e,i){t.save(),t.translate(0,-150);const s=Math.sin(e*Math.PI),o=[{color:"#ff6600",offset:0},{color:"#ff9900",offset:15},{color:"#ff3300",offset:30},{color:"#ffcc00",offset:45}];for(const{color:a,offset:n}of o)t.strokeStyle=a,t.shadowColor=a,t.shadowBlur=25,t.lineWidth=12-n*.15,t.lineCap="round",t.beginPath(),t.arc(0,100,200+n,-Math.PI*.7,Math.PI*.15),t.globalAlpha=s*(1-n*.015),t.stroke();t.globalAlpha=s;for(let a=0;a<15;a++){const n=-Math.PI*.7+Math.PI*.85*(a/15)+Math.sin(i*10+a)*.1,r=200+Math.random()*50,c=Math.cos(n)*r,h=100+Math.sin(n)*r,l=a%2===0?"#ff6600":"#ffaa00";t.fillStyle=l,t.shadowColor=l,t.shadowBlur=15,t.beginPath(),t.arc(c,h,4+Math.random()*4,0,Math.PI*2),t.fill()}t.globalAlpha=1,t.shadowBlur=0,t.restore()}spawnAxeSplash(){if(this.particles.length>G.MAX_PARTICLES)return;const t=this.width/2,e=this.height/2,i=["#ff6600","#ff9900","#ff3300","#ffcc00"];for(let s=0;s<8;s++){const o=s/8*Math.PI*2+Math.random()*.3,a=400+Math.random()*500;this.particles.push({x:t+(Math.random()-.5)*60,y:e+(Math.random()-.5)*60,vx:Math.cos(o)*a,vy:Math.sin(o)*a-120,size:8+Math.random()*10,color:i[s%i.length],life:.5+Math.random()*.3,maxLife:.5+Math.random()*.3,type:"fragment"})}for(let s=0;s<12;s++){const o=Math.random()*Math.PI*2,a=250+Math.random()*400;this.particles.push({x:t+(Math.random()-.5)*30,y:e+(Math.random()-.5)*30,vx:Math.cos(o)*a,vy:Math.sin(o)*a-80,size:2+Math.random()*4,color:i[s%i.length],life:.3+Math.random()*.3,maxLife:.3+Math.random()*.3,type:"spark"})}}drawHitGlow(t,e,i="katana"){if(t.save(),t.globalAlpha=e,i==="charged"){t.strokeStyle="#ffffff",t.shadowColor="#00ffff",t.shadowBlur=50*e,t.lineWidth=10,t.beginPath(),t.moveTo(9,30),t.lineTo(6,-280),t.lineTo(0,-320),t.stroke(),t.strokeStyle="#00ffff",t.shadowColor="#0088ff",t.shadowBlur=30*e,t.lineWidth=4;for(let s=0;s<3;s++)t.beginPath(),t.arc(0,-150,50+s*30,0,Math.PI*2),t.stroke()}else t.strokeStyle="#ffffff",t.shadowColor="#00ffff",t.shadowBlur=30*e,t.lineWidth=6,t.beginPath(),t.moveTo(9,30),t.lineTo(6,-280),t.lineTo(0,-320),t.stroke(),t.strokeStyle="#ff00ff",t.shadowColor="#ff00ff",t.shadowBlur=20*e,t.lineWidth=3,t.stroke();t.restore()}drawScreenFlash(t,e="katana"){t.save(),t.resetTransform();const i=t.createRadialGradient(this.width/2,this.height/2,0,this.width/2,this.height/2,this.width);e==="charged"?(i.addColorStop(0,`rgba(255, 255, 255, ${this.hitFlash*.6})`),i.addColorStop(.2,`rgba(0, 255, 255, ${this.hitFlash*.4})`),i.addColorStop(.5,`rgba(0, 150, 255, ${this.hitFlash*.2})`),i.addColorStop(.8,`rgba(0, 80, 255, ${this.hitFlash*.1})`),i.addColorStop(1,"rgba(0, 0, 0, 0)")):(i.addColorStop(0,`rgba(255, 255, 255, ${this.hitFlash*.4})`),i.addColorStop(.3,`rgba(255, 0, 255, ${this.hitFlash*.2})`),i.addColorStop(.6,`rgba(0, 255, 255, ${this.hitFlash*.1})`),i.addColorStop(1,"rgba(0, 0, 0, 0)")),t.fillStyle=i,t.fillRect(0,0,this.width,this.height),t.restore()}}class M{position;velocity=T();radius=.8;active=!0;speed=4;fireIntensity=1;fragments=[];removeTimer=0;id;phase;moveType;enemyType="baneling";damage=25;currentSpeed=0;isCharging=!0;chargeDirection=T();passedThroughTimer=0;verticalVelocity=0;onGround=!0;hopTimer=0;dodgeAngle=0;dodgeTimer=0;isAttached=!1;attachTimer=0;orbitAngle=0;hp=1;maxHp=1;isBoss=!1;teleportTimer=0;distortionPower=0;spawnPhantomTimer=5;isVortexActive=!1;vortexTimer=0;vortexCooldown=0;vortexWarningPlayed=!1;onSpawnPhantom;onVortexStart;onVortexEnd;onVortexWarning;poolTimer=0;spitTimer=0;spitCooldown=3;greenBossRole="hunter";lastPlayerPos=T();playerVelocity=T();onSpit;onAcidRainMark;bossPhase=1;onPhaseChange;collision=null;constructor(t,e=4,i=0,s="baneling",o){this.position={...t},this.speed=e,this.id=i,this.phase=Math.random()*Math.PI*2,this.moveType=i%4,this.enemyType=s,this.collision=o||null,s==="phantom"?(this.speed=e*2,this.damage=10,this.radius=.6,this.currentSpeed=0,this.isCharging=!0):s==="runner"?(this.speed=e*2.5,this.damage=15,this.radius=.4,this.position.y=.5):s==="hopper"?(this.speed=e*1.2,this.damage=20,this.radius=.5,this.verticalVelocity=8,this.onGround=!1):s==="boss_green"?(this.isBoss=!0,this.speed=e*.6,this.damage=40,this.radius=2.5,this.hp=10,this.maxHp=10,this.spitCooldown=3):s==="boss_black"?(this.isBoss=!0,this.speed=e*.8,this.damage=30,this.radius=2,this.hp=70,this.maxHp=70,this.distortionPower=1):s==="boss_blue"?(this.isBoss=!0,this.speed=e*1.5,this.damage=25,this.radius=1.8,this.hp=24,this.maxHp=24,this.teleportTimer=3):(this.damage=25,this.currentSpeed=e)}update(t,e,i){if(this.fireIntensity=.6+Math.sin(i*8+this.id)*.4,this.active)switch(this.enemyType){case"phantom":this.updatePhantom(t,e,i);break;case"runner":this.updateRunner(t,e,i);break;case"hopper":this.updateHopper(t,e,i);break;case"boss_green":this.updateBossGreen(t,e,i);break;case"boss_black":this.updateBossBlack(t,e,i);break;case"boss_blue":this.updateBossBlue(t,e,i);break;default:this.updateBaneling(t,e,i)}this.updateFragments(t),!this.active&&this.removeTimer>0&&(this.removeTimer-=t)}updateBaneling(t,e,i){const s=e.x-this.position.x,o=e.y-.3-this.position.y,a=e.z-this.position.z,n=Math.sqrt(s*s+o*o+a*a);if(n>.1){const r=s/n,c=o/n,h=a/n,l=1+Math.max(0,(15-n)/15)*.8,u=this.speed*l;let p=0,m=0,f=0;const g=i*4+this.phase;switch(this.moveType){case 0:p=Math.cos(g)*3,f=Math.sin(g)*3,m=Math.sin(g*.5)*1.5;break;case 1:p=Math.sin(g*2)*4,m=Math.cos(g)*.5;break;case 2:m=Math.sin(g*1.5)*2.5,p=Math.cos(g*.7)*1;break;case 3:const w=Math.sin(g)>0?1.5:.5;p=Math.cos(g*3)*2*w,f=Math.sin(g*3)*2*w;break}const v=-h,x=r;this.velocity.x=r*u+v*p*.3+p*.1,this.velocity.y=c*u+m*.3,this.velocity.z=h*u+x*f*.3+f*.1;const d=this.position.x+this.velocity.x*t,b=this.position.z+this.velocity.z*t;!this.collision?.checkEnemyCollision||!this.collision.checkEnemyCollision({x:d,y:this.position.y,z:b},this.radius)?(this.position.x=d,this.position.z=b):this.velocity.y+=5*t,this.position.y+=this.velocity.y*t,this.position.y=Math.max(.5,Math.min(6,this.position.y))}}updatePhantom(t,e,i){const s=e.x-this.position.x,o=e.y-.3-this.position.y,a=e.z-this.position.z,n=Math.sqrt(s*s+o*o+a*a);if(this.isCharging){this.currentSpeed=Math.min(this.currentSpeed+t*15,this.speed),n>.1&&(this.chargeDirection.x=s/n,this.chargeDirection.y=o/n,this.chargeDirection.z=a/n);const r=Math.sin(i*10)*.3;this.velocity.x=this.chargeDirection.x*this.currentSpeed+r,this.velocity.y=this.chargeDirection.y*this.currentSpeed,this.velocity.z=this.chargeDirection.z*this.currentSpeed,this.currentSpeed>=this.speed*.9&&(this.isCharging=!1)}else this.passedThroughTimer+=t,this.velocity.x=this.chargeDirection.x*this.speed,this.velocity.y=this.chargeDirection.y*this.speed,this.velocity.z=this.chargeDirection.z*this.speed,this.passedThroughTimer>2.5&&(this.isCharging=!0,this.currentSpeed=this.speed*.3,this.passedThroughTimer=0);this.position.x+=this.velocity.x*t,this.position.y+=this.velocity.y*t,this.position.z+=this.velocity.z*t,this.position.y=Math.max(.5,Math.min(4,this.position.y)),n>35&&(this.isCharging=!0,this.currentSpeed=0,this.passedThroughTimer=0)}runnerVerticalVel=0;runnerOnGround=!0;updateRunner(t,e,i){if(this.isAttached){this.attachTimer-=t,this.orbitAngle+=t*12;const n=1.2,r=Math.sin(i*8)*.3;this.position.x=e.x+Math.cos(this.orbitAngle)*n,this.position.y=e.y+r,this.position.z=e.z+Math.sin(this.orbitAngle)*n,this.attachTimer<=0&&(this.isAttached=!1,this.active=!1,this.removeTimer=.5);return}const s=e.x-this.position.x,o=e.z-this.position.z,a=Math.sqrt(s*s+o*o);if(a<1.5){this.isAttached=!0,this.attachTimer=3,this.orbitAngle=Math.atan2(o,s);return}if(a>.1){const n=s/a,r=o/a;if(this.collision?.getObstacleHeight&&this.runnerOnGround){const x=this.collision.getObstacleHeight(this.position,n,r,1.5);x>this.position.y&&x<10&&(this.runnerVerticalVel=12,this.runnerOnGround=!1)}if(this.collision?.checkEnemyCollision){const x={x:this.position.x+n*this.speed*t,y:this.position.y,z:this.position.z+r*this.speed*t};this.collision.checkEnemyCollision(x,this.radius)&&(this.dodgeAngle=(Math.random()>.5?1:-1)*Math.PI*.5)}this.dodgeTimer-=t,this.dodgeTimer<=0&&(this.dodgeAngle=(Math.random()-.5)*Math.PI*.8,this.dodgeTimer=.3+Math.random()*.4);const c=Math.cos(this.dodgeAngle),h=Math.sin(this.dodgeAngle),l=n*c-r*h,u=n*h+r*c,p=1+Math.max(0,(10-a)/10)*.5,m=this.speed*p,f=Math.sin(i*15+this.phase)*2;this.velocity.x=l*m+f*.3,this.velocity.z=u*m;const g=this.position.x+this.velocity.x*t,v=this.position.z+this.velocity.z*t;(!this.collision?.checkEnemyCollision||!this.collision.checkEnemyCollision({x:g,y:this.position.y,z:v},this.radius))&&(this.position.x=g,this.position.z=v),this.runnerOnGround?this.position.y=.5+Math.abs(Math.sin(i*20))*.1:(this.runnerVerticalVel-=25*t,this.position.y+=this.runnerVerticalVel*t,this.position.y<=.5&&(this.position.y=.5,this.runnerVerticalVel=0,this.runnerOnGround=!0))}}applyKnockback(t,e,i){const s=Math.sqrt(t*t+e*e);s>0&&(this.velocity.x=t/s*i,this.velocity.z=e/s*i,this.velocity.y=i*.3),this.knockbackTimer=.3}knockbackTimer=0;detachRunner(){if(this.isAttached&&this.enemyType==="runner"){this.isAttached=!1;const t=this.orbitAngle+Math.PI;return this.velocity.x=Math.cos(t)*15,this.velocity.y=8,this.velocity.z=Math.sin(t)*15,this.attachTimer=0,!0}return!1}onCreatePool;updateBossGreen(t,e,i){if(this.knockbackTimer>0){this.knockbackTimer-=t,this.position.x+=this.velocity.x*t,this.position.y+=this.velocity.y*t,this.position.z+=this.velocity.z*t,this.velocity.x*=.9,this.velocity.y*=.9,this.velocity.z*=.9,this.velocity.y-=15*t,this.position.y=Math.max(this.radius,this.position.y);return}this.playerVelocity.x=(e.x-this.lastPlayerPos.x)/Math.max(t,.001),this.playerVelocity.z=(e.z-this.lastPlayerPos.z)/Math.max(t,.001),this.lastPlayerPos={...e};const s=e.x-this.position.x,o=e.y-this.position.y,a=e.z-this.position.z,n=Math.sqrt(s*s+o*o+a*a),r=this.bossPhase===2?2.8:2.5;if(this.radius=r+Math.sin(i*3)*.3,this.greenBossRole==="hunter"){this.spitTimer-=t;const c=this.bossPhase===2?5:8;if(this.spitTimer<=0&&n<25){this.spitTimer=c;const h=T(e.x,.05,e.z);this.onAcidRainMark?.(h),this.bossPhase===2&&setTimeout(()=>{this.onAcidRainMark?.(T(h.x+6,.05,h.z)),this.onAcidRainMark?.(T(h.x-6,.05,h.z))},800)}if(n>8){const h=s/n,l=a/n;this.velocity.x=h*this.speed*.5,this.velocity.z=l*this.speed*.5,this.position.x+=this.velocity.x*t,this.position.z+=this.velocity.z*t}this.position.y=Math.max(this.radius,this.position.y)}else{this.spitTimer-=t;const c=this.bossPhase===2?2:3.5;if(this.spitTimer<=0&&n<20){this.spitTimer=c;const h=T(e.x+(Math.random()-.5)*2,.05,e.z+(Math.random()-.5)*2),l=T(this.position.x,this.position.y+1,this.position.z);this.onSpit?.(l,h),this.bossPhase===2&&(setTimeout(()=>{const u=T(e.x+3,.05,e.z);this.onSpit?.(l,u)},300),setTimeout(()=>{const u=T(e.x-3,.05,e.z);this.onSpit?.(l,u)},600))}if(n>.1){const h=s/n,l=o/n,u=a/n,p=Math.sin(i*2)*.5,m=this.bossPhase===2?1.4:1;this.velocity.x=h*this.speed*m+p,this.velocity.y=l*this.speed*.3,this.velocity.z=u*this.speed*m,this.position.x+=this.velocity.x*t,this.position.y+=this.velocity.y*t,this.position.z+=this.velocity.z*t,this.position.y=Math.max(this.radius,this.position.y)}}}updateBossBlack(t,e,i){if(this.knockbackTimer>0){this.knockbackTimer-=t,this.position.x+=this.velocity.x*t,this.position.y+=this.velocity.y*t,this.position.z+=this.velocity.z*t,this.velocity.x*=.92,this.velocity.y*=.92,this.velocity.z*=.92,this.velocity.y-=10*t,this.position.y=Math.max(1,this.position.y);return}const s=e.x-this.position.x,o=e.y-this.position.y,a=e.z-this.position.z,n=Math.sqrt(s*s+o*o+a*a);if(this.spawnPhantomTimer-=t,this.spawnPhantomTimer<=0){this.spawnPhantomTimer=5;const m=Math.random()*Math.PI*2,f=3+Math.random()*2,g=T(this.position.x+Math.cos(m)*f,this.position.y,this.position.z+Math.sin(m)*f);this.onSpawnPhantom?.(g)}if(this.vortexCooldown-=t,this.isVortexActive){this.vortexTimer-=t,this.position.y=2+Math.sin(i*10)*.3,this.distortionPower=1.5+Math.sin(i*15)*.5,this.vortexTimer<=0&&(this.isVortexActive=!1,this.vortexCooldown=12,this.vortexWarningPlayed=!1,this.onVortexEnd?.());return}this.vortexCooldown>0&&this.vortexCooldown<=2&&!this.vortexWarningPlayed&&n<15&&(this.vortexWarningPlayed=!0,this.onVortexWarning?.()),this.vortexCooldown<=0&&n<15&&(this.isVortexActive=!0,this.vortexTimer=4,this.onVortexStart?.());const r=.5,c=8+Math.sin(i*.3)*3,h=Math.cos(i*r)*c,l=Math.sin(i*r)*c,u=h-this.position.x,p=l-this.position.z;this.velocity.x=u*.5+s/n*this.speed*.3,this.velocity.y=(1.5-this.position.y)*2,this.velocity.z=p*.5+a/n*this.speed*.3,this.position.x+=this.velocity.x*t,this.position.y+=this.velocity.y*t,this.position.z+=this.velocity.z*t,this.distortionPower=Math.max(0,1-n/20)}getVortexPull(t){if(!this.isVortexActive)return T(0,0,0);const e=this.position.x-t.x,i=this.position.z-t.z,s=Math.sqrt(e*e+i*i);if(s<.5)return T(0,0,0);const o=Math.max(0,1-s/20)*7.5;return T(e/s*o,0,i/s*o)}updateBossBlue(t,e,i){if(this.knockbackTimer>0){this.knockbackTimer-=t,this.position.x+=this.velocity.x*t,this.position.y+=this.velocity.y*t,this.position.z+=this.velocity.z*t,this.velocity.x*=.85,this.velocity.y*=.85,this.velocity.z*=.85,this.velocity.y-=20*t,this.position.y=Math.max(.5,this.position.y);return}if(this.teleportTimer-=t,this.teleportTimer<=0){const r=Math.random()*Math.PI*2,c=5+Math.random()*10;this.position.x=e.x+Math.cos(r)*c,this.position.y=1.5+Math.random()*2,this.position.z=e.z+Math.sin(r)*c,this.teleportTimer=2+Math.random()*2;return}const s=e.x-this.position.x,o=e.y-this.position.y,a=e.z-this.position.z,n=Math.sqrt(s*s+o*o+a*a);if(n>.1){const r=Math.sin(i*10)*3;this.velocity.x=s/n*this.speed+r*.5,this.velocity.y=o/n*this.speed*.5,this.velocity.z=a/n*this.speed,this.position.x+=this.velocity.x*t,this.position.y+=this.velocity.y*t,this.position.z+=this.velocity.z*t,this.position.y=Math.max(.5,Math.min(4,this.position.y))}}takeDamage(t=1){return this.hp-=t,this.enemyType==="boss_green"&&this.bossPhase===1&&this.hp<=this.maxHp/2&&(this.bossPhase=2,this.speed*=1.3,this.onPhaseChange?.(2)),this.hp<=0?(this.hp=0,!0):!1}updateHopper(t,e,i){const s=e.x-this.position.x,o=e.z-this.position.z,a=Math.sqrt(s*s+o*o),n=18;if(this.onGround)if(this.hopTimer-=t,this.hopTimer<=0){this.onGround=!1;let h=10+Math.random()*4;if(this.collision?.getObstacleHeight&&a>.1){const l=s/a,u=o/a,p=this.collision.getObstacleHeight(this.position,l,u,3);p>this.position.y&&(h=Math.max(h,(p-this.position.y+2)*3))}if(this.verticalVelocity=h,this.hopTimer=.5+Math.random()*.5,a>.1){const l=this.speed*1.5;this.velocity.x=s/a*l,this.velocity.z=o/a*l}}else this.velocity.x*=.9,this.velocity.z*=.9;else this.verticalVelocity-=n*t,a>.1&&(this.velocity.x+=s/a*t*3,this.velocity.z+=o/a*t*3);const r=this.position.x+this.velocity.x*t,c=this.position.z+this.velocity.z*t;!this.collision?.checkEnemyCollision||!this.collision.checkEnemyCollision({x:r,y:this.position.y,z:c},this.radius)?(this.position.x=r,this.position.z=c):(this.velocity.x*=-.5,this.velocity.z*=-.5),this.position.y+=this.verticalVelocity*t,this.position.y<=.5&&(this.position.y=.5,this.onGround=!0,this.verticalVelocity=0),this.position.y=Math.min(12,this.position.y)}updateFragments(t){for(let i=this.fragments.length-1;i>=0;i--){const s=this.fragments[i];s.position.x+=s.velocity.x*t,s.position.y+=s.velocity.y*t,s.position.z+=s.velocity.z*t,s.velocity.y-=15*t,s.rotation+=s.rotationSpeed*t,s.lifetime-=t,(s.lifetime<=0||s.position.y<-5)&&this.fragments.splice(i,1)}}checkPlayerCollision(t){return this.active?z(this.position,t)<this.radius+.5:!1}slice(t){if(!this.active)return;this.active=!1,this.removeTimer=3;const e=4+Math.floor(Math.random()*4);for(let i=0;i<e;i++){const s=Math.random()*Math.PI*2,o=Math.random()*Math.PI*.5,a=8+Math.random()*12,n=t.x*a*.5+Math.cos(s)*Math.cos(o)*a,r=Math.sin(o)*a+3,c=t.z*a*.5+Math.sin(s)*Math.cos(o)*a;this.fragments.push({position:{x:this.position.x+(Math.random()-.5)*this.radius,y:this.position.y+(Math.random()-.5)*this.radius,z:this.position.z+(Math.random()-.5)*this.radius},velocity:{x:n,y:r,z:c},size:.15+Math.random()*.25,lifetime:1.5+Math.random()*1,rotation:Math.random()*Math.PI*2,rotationSpeed:(Math.random()-.5)*15})}}canRemove(){return!this.active&&this.removeTimer<=0&&this.fragments.length===0}getShaderData(){let t=0;if(this.active){const e=this.fireIntensity*.5;switch(this.enemyType){case"phantom":t=3+e;break;case"runner":t=5+e;break;case"hopper":t=7+e;break;case"boss_green":t=11+e;break;case"boss_black":t=13+e;break;case"boss_blue":t=15+e;break;default:t=1+e}}return[this.position.x,this.position.y,this.position.z,t]}getFragmentsData(){const t=[];for(const e of this.fragments)t.push(e.position.x,e.position.y,e.position.z,e.size);return t}}class L{targets=[];wave=0;waveActive=!1;waveDelay=4;waveTimer=0;score=0;powerCrystals=[];onTargetDestroyed;onPlayerHit;onWaveComplete;onWaveStart;onPoolDamage;onCrystalDestroyed;onBossPhaseChange;onAcidRain;onBossVortexStart;onBossVortexEnd;onBossVortexWarning;toxicPools=[];acidRainZones=[];acidProjectiles=[];poolDamageTimer=0;collision=null;constructor(t){this.collision=t||null}isPlayerUnderPlatform(t){return this.collision?this.collision.getCeilingHeight(t)<15:!1}startGame(t=1){this.wave=t-1,this.score=0,this.targets=[],this.toxicPools=[],this.startNextWave()}startNextWave(){this.wave++,this.waveActive=!0,this.spawnEnemies(this.wave),this.onWaveStart?.(this.wave)}enemyIdCounter=0;spawnEnemies(t){const i=3.5+t*.3;if(t===5){const l=[{pos:T(-8,3,-18),role:"hunter"},{pos:T(8,3,-18),role:"blocker"}];for(const u of l){const p=new M(u.pos,i,this.enemyIdCounter++,"boss_green",this.collision||void 0);p.greenBossRole=u.role,u.role==="hunter"?p.onAcidRainMark=m=>{this.spawnAcidRainZone(m)}:p.onSpit=(m,f)=>{this.spawnAcidProjectile(m,f)},p.onPhaseChange=m=>{this.onBossPhaseChange?.(p.enemyType,m)},this.targets.push(p)}}else if(t===10){const l=T(0,2.5,-18),u=new M(l,i,this.enemyIdCounter++,"boss_black",this.collision||void 0);u.onSpawnPhantom=m=>{this.spawnPhantomFromBoss(m)},u.onVortexWarning=()=>{this.onBossVortexWarning?.()},u.onVortexStart=()=>{this.onBossVortexStart?.()},u.onVortexEnd=()=>{this.onBossVortexEnd?.()},this.targets.push(u);const p=[{x:10,z:0,height:2.3},{x:5,z:8.66,height:3.5},{x:-5,z:8.66,height:4.7},{x:-10,z:0,height:5.9},{x:-5,z:-8.66,height:7.1},{x:5,z:-8.66,height:8.3}];this.powerCrystals=p.map((m,f)=>({x:m.x,z:m.z,height:m.height,active:!0,platformIndex:f}))}else if(t===15){const l=T(0,2,-18);this.targets.push(new M(l,i,this.enemyIdCounter++,"boss_blue",this.collision||void 0))}if(t===5||t===10||t===15)return;let o,a,n,r;t<=5?(o=Math.floor(t*1.2),a=t>=3?Math.floor((t-2)*.8):0,n=0,r=t>=4?Math.floor((t-3)*.5):0):t<=10?(o=Math.floor(t*.8),a=Math.floor((t-3)*.6),n=0,r=Math.floor((t-4)*.6)):(o=Math.floor(t*.7),a=Math.floor((t-5)*.5),n=Math.floor((t-10)*1.5),r=Math.floor((t-6)*.5));const c=Math.max(1,o+a+n+r);let h=0;for(let l=0;l<o;l++){const u=h/c*Math.PI*2+Math.random()*.3,p=1+Math.random()*2.5,m=T(Math.cos(u)*18,p,Math.sin(u)*18),f=i+Math.random()*1.5;this.targets.push(new M(m,f,this.enemyIdCounter++,"baneling",this.collision||void 0)),h++}for(let l=0;l<n;l++){const u=h/c*Math.PI*2+Math.random()*.3,p=T(Math.cos(u)*18,.5,Math.sin(u)*18),m=i+Math.random()*1;this.targets.push(new M(p,m,this.enemyIdCounter++,"runner",this.collision||void 0)),h++}for(let l=0;l<r;l++){const u=h/c*Math.PI*2+Math.random()*.3,p=T(Math.cos(u)*18,.5,Math.sin(u)*18),m=i+Math.random()*1;this.targets.push(new M(p,m,this.enemyIdCounter++,"hopper",this.collision||void 0)),h++}for(let l=0;l<a;l++){const u=(o+l)/c*Math.PI*2+Math.random()*.3,p=1.5+Math.random()*2,m=T(Math.cos(u)*18,p,Math.sin(u)*18),f=i+Math.random()*1;this.targets.push(new M(m,f,this.enemyIdCounter++,"phantom",this.collision||void 0))}}phantomDamageCooldown=new Map;update(t,e,i){if(!this.waveActive&&this.waveTimer>0){this.waveTimer-=t,this.waveTimer<=0&&this.startNextWave();return}for(const[s,o]of this.phantomDamageCooldown)o>0&&this.phantomDamageCooldown.set(s,o-t);for(const s of this.targets)s.update(t,e,i),s.checkPlayerCollision(e)&&(s.enemyType==="phantom"?(this.phantomDamageCooldown.get(s.id)||0)<=0&&(this.onPlayerHit?.(s),this.phantomDamageCooldown.set(s.id,1)):s.isBoss?(this.phantomDamageCooldown.get(s.id)||0)<=0&&(this.onPlayerHit?.(s),this.phantomDamageCooldown.set(s.id,1.5)):(this.onPlayerHit?.(s),s.active=!1));this.targets=this.targets.filter(s=>!s.canRemove());for(const s of this.acidProjectiles){s.progress+=t/s.flightTime;const o=s.progress;s.position.x=s.startPos.x+(s.targetPos.x-s.startPos.x)*o,s.position.z=s.startPos.z+(s.targetPos.z-s.startPos.z)*o,s.position.y=s.startPos.y+(1-(2*o-1)*(2*o-1))*8,s.progress>=1&&(this.toxicPools.push({position:{...s.targetPos},radius:.5,maxRadius:3.5,lifetime:6,maxLifetime:6,damage:8,spreadProgress:0}),this.onAcidRain?.(s.targetPos))}this.acidProjectiles=this.acidProjectiles.filter(s=>s.progress<1);for(const s of this.toxicPools)s.lifetime-=t,s.spreadProgress<1&&(s.spreadProgress=Math.min(1,s.spreadProgress+t/1.5),s.radius=s.maxRadius*(.3+.7*s.spreadProgress));this.toxicPools=this.toxicPools.filter(s=>s.lifetime>0);for(const s of this.acidRainZones)s.isRaining?s.lifetime-=t:(s.markTime-=t,s.markTime<=0&&(s.isRaining=!0,this.onAcidRainStart?.(s.position)));if(this.acidRainZones=this.acidRainZones.filter(s=>s.lifetime>0||!s.isRaining),this.poolDamageTimer-=t,this.poolDamageTimer<=0){this.poolDamageTimer=.5;for(const s of this.toxicPools){const o=e.x-s.position.x,a=e.z-s.position.z;if(Math.sqrt(o*o+a*a)<s.radius&&e.y<.8){this.onPoolDamage?.(s.damage);break}}for(const s of this.acidRainZones){if(!s.isRaining)continue;const o=e.x-s.position.x,a=e.z-s.position.z;if(Math.sqrt(o*o+a*a)<s.radius&&!this.isPlayerUnderPlatform(e)){this.onPoolDamage?.(s.damage);break}}}this.waveActive&&this.getActiveCount()===0&&(this.waveActive=!1,this.waveTimer=this.waveDelay,this.onWaveComplete?.(this.wave),this.toxicPools=[])}trySlice(t,e,i,s){for(const o of this.targets){if(!o.active)continue;const a=o.position.x-t.x,n=o.position.z-t.z,r=Math.sqrt(a*a+n*n),c=i+(o.isBoss?o.radius:0);if(r>c)continue;let l=Math.atan2(a,-n)-e;for(;l>Math.PI;)l-=Math.PI*2;for(;l<-Math.PI;)l+=Math.PI*2;if(!(Math.abs(l)>s/2))if(o.isBoss){const u=o.takeDamage(1);if(o.enemyType==="boss_green"&&!u&&this.spawnBanelingFromBoss(o.position),u){const p=V({x:a,y:0,z:n});if(o.slice(p),this.score+=1e3*this.wave,this.onTargetDestroyed?.(o),o.enemyType==="boss_green")for(let m=0;m<5;m++)this.spawnBanelingFromBoss(o.position)}else{const p=o.enemyType==="boss_green"?8:o.enemyType==="boss_black"?5:12;o.applyKnockback(a,n,p)}return o}else{const u=V({x:a,y:0,z:n});return o.slice(u),this.score+=100*this.wave,this.onTargetDestroyed?.(o),o}}return null}trySplashWave(t,e,i){let s=0;for(const o of this.targets){if(!o.active)continue;const a=o.position.x-t.x,n=o.position.z-t.z,r=Math.sqrt(a*a+n*n),c=i+(o.isBoss,o.radius);if(!(r>c))if(o.isBoss){const h=o.takeDamage(2);if(o.enemyType==="boss_green"&&!h&&this.spawnBanelingFromBoss(o.position),h){const l=V({x:a,y:0,z:n});if(o.slice(l),this.score+=1e3*this.wave,this.onTargetDestroyed?.(o),s++,o.enemyType==="boss_green")for(let u=0;u<5;u++)this.spawnBanelingFromBoss(o.position)}else{const l=o.enemyType==="boss_green"?12:o.enemyType==="boss_black"?8:18;o.applyKnockback(a,n,l)}}else{const h=V({x:a,y:0,z:n});o.slice(h),this.score+=100*this.wave,this.onTargetDestroyed?.(o),s++}}return s}getShaderData(){const t=new Float32Array(this.targets.length*4);for(let e=0;e<this.targets.length;e++){const[i,s,o,a]=this.targets[e].getShaderData();t[e*4+0]=i,t[e*4+1]=s,t[e*4+2]=o,t[e*4+3]=a}return t}getAllFragmentsData(){const t=[];for(const e of this.targets)t.push(...e.getFragmentsData());return new Float32Array(t)}getPoolsShaderData(){const t=new Float32Array(this.toxicPools.length*4);for(let e=0;e<this.toxicPools.length;e++){const i=this.toxicPools[e];t[e*4+0]=i.position.x,t[e*4+1]=i.position.z,t[e*4+2]=i.radius;const s=i.lifetime/i.maxLifetime;t[e*4+3]=s+i.spreadProgress*.01}return t}getAcidProjectilesData(){const t=new Float32Array(this.acidProjectiles.length*4);for(let e=0;e<this.acidProjectiles.length;e++){const i=this.acidProjectiles[e];t[e*4+0]=i.position.x,t[e*4+1]=i.position.y,t[e*4+2]=i.position.z,t[e*4+3]=i.progress}return t}getAcidRainZonesData(){const t=new Float32Array(this.acidRainZones.length*4);for(let e=0;e<this.acidRainZones.length;e++){const i=this.acidRainZones[e];t[e*4+0]=i.position.x,t[e*4+1]=i.position.z,t[e*4+2]=i.radius,t[e*4+3]=i.isRaining?1:(1-i.markTime/1.5)*.5}return t}spawnAcidProjectile(t,e){this.acidProjectiles.push({position:{...t},targetPos:{...e},startPos:{...t},progress:0,flightTime:1.2}),this.onAcidSpit?.()}spawnAcidRainZone(t){this.acidRainZones.push({position:{...t},radius:4,lifetime:5,markTime:1.5,isRaining:!1,damage:6}),this.onAcidRainMarkSound?.()}onAcidSpit;onAcidRainMarkSound;onAcidRainStart;spawnBanelingFromBoss(t){const e=Math.random()*Math.PI*2,i=5+Math.random()*3,s=T(t.x+Math.cos(e)*2,t.y+Math.random()*1.5,t.z+Math.sin(e)*2),o=new M(s,i,this.enemyIdCounter++,"baneling",this.collision||void 0);o.velocity=T(Math.cos(e)*8,3+Math.random()*3,Math.sin(e)*8),this.targets.push(o)}spawnPhantomFromBoss(t){const e=8+Math.random()*4,i=new M(t,e,this.enemyIdCounter++,"phantom",this.collision||void 0);this.targets.push(i)}getVortexPull(t){for(const e of this.targets)if(e.active&&e.enemyType==="boss_black")return e.getVortexPull(t);return T(0,0,0)}trySliceCrystal(t,e,i){for(const s of this.powerCrystals){if(!s.active)continue;const o=s.x-t.x,a=s.height-t.y,n=s.z-t.z;if(Math.sqrt(o*o+a*a+n*n)>i+1)continue;let h=Math.atan2(o,-n)-e;for(;h>Math.PI;)h-=Math.PI*2;for(;h<-Math.PI;)h+=Math.PI*2;if(Math.abs(h)>Math.PI/3)continue;s.active=!1;const l=this.powerCrystals.filter(u=>u.active).length;this.onCrystalDestroyed?.(l),this.spawnPhantomFromBoss(T(s.x,s.height,s.z));for(const u of this.targets)u.active&&u.enemyType==="boss_black"&&(u.maxHp-=10,u.hp>u.maxHp&&(u.hp=u.maxHp));return!0}return!1}getCrystalsData(){const t=new Float32Array(24);for(let e=0;e<6;e++)if(e<this.powerCrystals.length){const i=this.powerCrystals[e];t[e*4+0]=i.x,t[e*4+1]=i.z,t[e*4+2]=i.height,t[e*4+3]=i.active?1:0}else t[e*4+3]=0;return t}getActiveCount(){return this.targets.filter(t=>t.active).length}getActiveBoss(){return this.targets.find(t=>t.active&&t.isBoss)||null}getClosestEnemyDistance(t){let e=1/0;for(const i of this.targets){if(!i.active)continue;const s=i.position.x-t.x,o=i.position.y-t.y,a=i.position.z-t.z,n=Math.sqrt(s*s+o*o+a*a);n<e&&(e=n)}return e}createArenaTargets(t=8){this.startGame()}checkProjectileHit(t,e){return null}}class S{position;type;radius=1;active=!0;lifetime;phase;baseY;constructor(t,e){this.position={...t},this.type=e,this.phase=Math.random()*Math.PI*2,this.baseY=t.y,this.lifetime=30}update(t,e){this.active&&(this.position.y=this.baseY+Math.sin(e*3+this.phase)*.2,this.lifetime-=t,this.lifetime<=0&&(this.active=!1))}checkPickup(t){return this.active&&z(this.position,t)<this.radius+.5?(this.active=!1,!0):!1}getShaderData(){let t=0;return this.active&&(this.type==="health"?t=9:this.type==="stimpack"?t=10:this.type==="charge"&&(t=11)),[this.position.x,this.position.y,this.position.z,t]}}class H{pickups=[];spawnTimer=10;platformSpawnTimer=30;platformPositions=[{x:-20,y:2.5,z:0},{x:20,y:2.5,z:0}];currentPlatform=0;maxPickups=5;chargeOnBalcony=null;chargeRespawnTimer=0;constructor(){this.spawnChargeOnBalcony()}update(t,e,i){for(const s of this.pickups)s.update(t,e);if(this.pickups=this.pickups.filter(s=>s.active),this.spawnTimer-=t,this.spawnTimer<=0&&this.pickups.length<this.maxPickups&&(this.spawnRandom(),this.spawnTimer=8+Math.random()*7),this.platformSpawnTimer-=t,this.platformSpawnTimer<=0&&(this.spawnOnPlatform(),this.platformSpawnTimer=30),this.updateChargeRespawn(t),this.checkChargePickup(i))return"charge";for(const s of this.pickups)if(s.type!=="charge"&&s.checkPickup(i))return s.type;return null}spawnRandom(){const e=Math.random()*Math.PI*2,i=5+Math.random()*15,s=T(Math.cos(e)*i,1,Math.sin(e)*i);this.pickups.push(new S(s,"health"))}spawnOnPlatform(){const t=this.platformPositions[this.currentPlatform];this.currentPlatform=(this.currentPlatform+1)%this.platformPositions.length;const e=T(t.x+(Math.random()-.5)*4,t.y,t.z+(Math.random()-.5)*8);this.pickups.push(new S(e,"health"))}spawnAfterKill(t){if(Math.random()<.25){const e=T(t.x+(Math.random()-.5)*2,1,t.z+(Math.random()-.5)*2);this.pickups.push(new S(e,"health"))}}spawnChargeOnBalcony(){const t=T(0,10.3,0);this.chargeOnBalcony=new S(t,"charge"),this.chargeOnBalcony.lifetime=999999,this.pickups.push(this.chargeOnBalcony)}checkChargePickup(t){return!this.chargeOnBalcony||!this.chargeOnBalcony.active||t.y<10.5?!1:this.chargeOnBalcony.checkPickup(t)?(this.chargeOnBalcony=null,this.chargeRespawnTimer=60,!0):!1}respawnChargeAfterBoss(){(!this.chargeOnBalcony||!this.chargeOnBalcony.active)&&(this.pickups=this.pickups.filter(t=>t!==this.chargeOnBalcony),this.chargeOnBalcony=null,this.chargeRespawnTimer=0,this.spawnChargeOnBalcony())}updateChargeRespawn(t){this.chargeOnBalcony===null&&this.chargeRespawnTimer>0&&(this.chargeRespawnTimer-=t,this.chargeRespawnTimer<=0&&this.spawnChargeOnBalcony())}getShaderData(){const t=new Float32Array(this.pickups.length*4);for(let e=0;e<this.pickups.length;e++){const[i,s,o,a]=this.pickups[e].getShaderData();t[e*4+0]=i,t[e*4+1]=s,t[e*4+2]=o,t[e*4+3]=a}return t}}class W{ctx=null;masterGain=null;musicGain=null;sfxGain=null;reverb=null;distortion=null;compressor=null;isStarted=!1;isMuted=!1;start(){this.isStarted||(this.ctx=new(window.AudioContext||window.webkitAudioContext),this.compressor=this.ctx.createDynamicsCompressor(),this.compressor.threshold.value=-24,this.compressor.knee.value=30,this.compressor.ratio.value=12,this.compressor.attack.value=.003,this.compressor.release.value=.25,this.compressor.connect(this.ctx.destination),this.masterGain=this.ctx.createGain(),this.masterGain.gain.value=.4,this.masterGain.connect(this.compressor),this.distortion=this.createDistortion(20),this.distortion.connect(this.masterGain),this.reverb=this.createReverb(2.5),this.reverb.connect(this.masterGain),this.musicGain=this.ctx.createGain(),this.musicGain.gain.value=.12,this.musicGain.connect(this.masterGain),this.sfxGain=this.ctx.createGain(),this.sfxGain.gain.value=.3,this.sfxGain.connect(this.distortion),this.isStarted=!0,this.startSynthwaveMusic())}createDistortion(t){const e=this.ctx.createWaveShaper(),i=44100,s=new Float32Array(i),o=Math.PI/180;for(let a=0;a<i;a++){const n=a*2/i-1;s[a]=(3+t)*n*20*o/(Math.PI+t*Math.abs(n))}return e.curve=s,e.oversample="4x",e}createReverb(t){const e=this.ctx.createConvolver(),i=this.ctx.sampleRate,s=i*t,o=this.ctx.createBuffer(2,s,i);for(let a=0;a<2;a++){const n=o.getChannelData(a);for(let r=0;r<s;r++){const c=Math.exp(-3*r/s),h=Math.sin(r*.001)*.3+.7;n[r]=(Math.random()*2-1)*c*h}}return e.buffer=o,e}toggleMute(){this.isMuted=!this.isMuted,this.masterGain&&(this.masterGain.gain.value=this.isMuted?0:this.volume)}volume=.5;setVolume(t){this.volume=Math.max(0,Math.min(1,t)),this.masterGain&&!this.isMuted&&(this.masterGain.gain.value=this.volume)}proximityOsc=null;proximityGain=null;proximityFilter=null;playSFX(t){if(!(!this.ctx||!this.sfxGain||this.isMuted))switch(t){case"gunshot":this.playKatanaSwing();break;case"reload":this.playGlitch();break;case"footstep":this.playFootstep();break;case"jump":this.playJump();break;case"land":this.playLand();break;case"hit":this.playBanelingExplosion();break;case"phantom_pass":this.playPhantomPass();break;case"runner_hit":this.playRunnerHit();break;case"hopper_hit":this.playHopperHit();break;case"kill":this.playKill();break;case"katana_swing":this.playKatanaSwing();break;case"splash_wave":this.playSplashWave();break;case"charge_pickup":this.playChargePickup();break;case"acid_spit":this.playAcidSpit();break}}updateProximitySound(t){if(!this.ctx||!this.sfxGain||this.isMuted)return;this.proximityOsc||(this.proximityOsc=this.ctx.createOscillator(),this.proximityGain=this.ctx.createGain(),this.proximityFilter=this.ctx.createBiquadFilter(),this.proximityOsc.type="sawtooth",this.proximityFilter.type="lowpass",this.proximityFilter.Q.value=5,this.proximityOsc.connect(this.proximityFilter),this.proximityFilter.connect(this.proximityGain),this.proximityGain.connect(this.sfxGain),this.proximityOsc.start());const e=80+t*200,i=t*.25,s=200+t*1500;if(this.proximityOsc.frequency.setTargetAtTime(e,this.ctx.currentTime,.1),this.proximityGain.gain.setTargetAtTime(i,this.ctx.currentTime,.1),this.proximityFilter.frequency.setTargetAtTime(s,this.ctx.currentTime,.1),t>.6){const o=Math.sin(this.ctx.currentTime*20)*20*t;this.proximityOsc.frequency.setTargetAtTime(e+o,this.ctx.currentTime,.02)}}enemySoundCooldowns=new Map;playEnemyProximitySound(t,e){if(!this.ctx||!this.sfxGain||this.isMuted||e>8)return;const i=Date.now(),s=this.enemySoundCooldowns.get(t)||0,o=t.startsWith("boss")?500:300;if(i-s<o)return;this.enemySoundCooldowns.set(t,i);const a=Math.max(.1,(8-e)/8)*.4,n=this.ctx.currentTime;switch(t){case"baneling":this.playBanelingProximity(a,n);break;case"phantom":this.playPhantomProximity(a,n);break;case"runner":this.playRunnerProximity(a,n);break;case"hopper":this.playHopperProximity(a,n);break;case"boss_green":this.playBossGreenProximity(a,n);break;case"boss_black":this.playBossBlackProximity(a,n);break;case"boss_blue":this.playBossBlueProximity(a,n);break}}playBanelingProximity(t,e){if(!this.ctx||!this.sfxGain)return;const i=this.ctx.createOscillator(),s=this.ctx.createGain(),o=this.ctx.createBiquadFilter();i.type="sine",i.frequency.setValueAtTime(150+Math.random()*50,e),i.frequency.setValueAtTime(100+Math.random()*30,e+.05),i.frequency.setValueAtTime(180+Math.random()*40,e+.1),o.type="lowpass",o.frequency.value=400,o.Q.value=8,s.gain.setValueAtTime(t*.5,e),s.gain.exponentialRampToValueAtTime(.01,e+.15),i.connect(o),o.connect(s),s.connect(this.sfxGain),i.start(e),i.stop(e+.2)}playPhantomProximity(t,e){if(!this.ctx||!this.sfxGain)return;const i=this.ctx.createOscillator(),s=this.ctx.createOscillator(),o=this.ctx.createGain(),a=this.ctx.createBiquadFilter();i.type="sine",i.frequency.setValueAtTime(200,e),i.frequency.linearRampToValueAtTime(150,e+.3),s.type="sine",s.frequency.setValueAtTime(203,e),s.frequency.linearRampToValueAtTime(148,e+.3),a.type="bandpass",a.frequency.value=300,a.Q.value=5,o.gain.setValueAtTime(0,e),o.gain.linearRampToValueAtTime(t*.4,e+.1),o.gain.linearRampToValueAtTime(0,e+.35),i.connect(a),s.connect(a),a.connect(o),o.connect(this.sfxGain),i.start(e),i.stop(e+.4),s.start(e),s.stop(e+.4)}playRunnerProximity(t,e){if(!(!this.ctx||!this.sfxGain))for(let i=0;i<3;i++){const s=this.ctx.createOscillator(),o=this.ctx.createGain(),a=e+i*.06;s.type="triangle",s.frequency.setValueAtTime(80+Math.random()*40,a),s.frequency.exponentialRampToValueAtTime(40,a+.03),o.gain.setValueAtTime(t*.3,a),o.gain.exponentialRampToValueAtTime(.01,a+.04),s.connect(o),o.connect(this.sfxGain),s.start(a),s.stop(a+.05)}}playHopperProximity(t,e){if(!this.ctx||!this.sfxGain)return;const i=this.ctx.createOscillator(),s=this.ctx.createGain();i.type="sine",i.frequency.setValueAtTime(100,e),i.frequency.exponentialRampToValueAtTime(400,e+.1),i.frequency.exponentialRampToValueAtTime(150,e+.2),s.gain.setValueAtTime(t*.4,e),s.gain.exponentialRampToValueAtTime(.01,e+.25),i.connect(s),s.connect(this.sfxGain),i.start(e),i.stop(e+.3)}playBossGreenProximity(t,e){if(!this.ctx||!this.sfxGain)return;const i=this.ctx.sampleRate*.3,s=this.ctx.createBuffer(1,i,this.ctx.sampleRate),o=s.getChannelData(0);for(let l=0;l<i;l++)o[l]=(Math.random()*2-1)*Math.exp(-l/(this.ctx.sampleRate*.15));const a=this.ctx.createBufferSource();a.buffer=s;const n=this.ctx.createBiquadFilter();n.type="bandpass",n.frequency.value=4e3,n.Q.value=3;const r=this.ctx.createGain();r.gain.setValueAtTime(t*.5,e),r.gain.exponentialRampToValueAtTime(.01,e+.3),a.connect(n),n.connect(r),r.connect(this.sfxGain),a.start(e),a.stop(e+.35);const c=this.ctx.createOscillator(),h=this.ctx.createGain();c.type="sawtooth",c.frequency.setValueAtTime(50,e),c.frequency.linearRampToValueAtTime(40,e+.3),h.gain.setValueAtTime(t*.3,e),h.gain.exponentialRampToValueAtTime(.01,e+.35),c.connect(h),h.connect(this.sfxGain),c.start(e),c.stop(e+.4)}playBossBlackProximity(t,e){if(!this.ctx||!this.sfxGain)return;const i=this.ctx.createOscillator(),s=this.ctx.createOscillator(),o=this.ctx.createGain(),a=this.ctx.createBiquadFilter();i.type="sine",i.frequency.setValueAtTime(40,e),s.type="sine",s.frequency.setValueAtTime(42,e),a.type="lowpass",a.frequency.value=100,a.Q.value=10,o.gain.setValueAtTime(0,e),o.gain.linearRampToValueAtTime(t*.6,e+.15),o.gain.linearRampToValueAtTime(0,e+.4),i.connect(a),s.connect(a),a.connect(o),o.connect(this.sfxGain),i.start(e),i.stop(e+.45),s.start(e),s.stop(e+.45);const n=this.ctx.createOscillator(),r=this.ctx.createGain();n.type="sawtooth",n.frequency.setValueAtTime(80,e),n.frequency.exponentialRampToValueAtTime(30,e+.3),r.gain.setValueAtTime(t*.2,e),r.gain.exponentialRampToValueAtTime(.01,e+.35),n.connect(r),r.connect(this.sfxGain),n.start(e),n.stop(e+.4)}playBossBlueProximity(t,e){if(!this.ctx||!this.sfxGain)return;const i=this.ctx.sampleRate*.15,s=this.ctx.createBuffer(1,i,this.ctx.sampleRate),o=s.getChannelData(0);for(let l=0;l<i;l++)o[l]=Math.random()>.95?Math.random()*2-1:0;const a=this.ctx.createBufferSource();a.buffer=s;const n=this.ctx.createBiquadFilter();n.type="highpass",n.frequency.value=3e3;const r=this.ctx.createGain();r.gain.setValueAtTime(t*.4,e),r.gain.exponentialRampToValueAtTime(.01,e+.15),a.connect(n),n.connect(r),r.connect(this.sfxGain),a.start(e),a.stop(e+.18);const c=this.ctx.createOscillator(),h=this.ctx.createGain();c.type="sine",c.frequency.setValueAtTime(2e3+Math.random()*500,e),c.frequency.exponentialRampToValueAtTime(500,e+.1),h.gain.setValueAtTime(t*.25,e),h.gain.exponentialRampToValueAtTime(.01,e+.12),c.connect(h),h.connect(this.sfxGain),c.start(e),c.stop(e+.15)}playBanelingExplosion(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(100,t),e.frequency.exponentialRampToValueAtTime(20,t+.3),i.gain.setValueAtTime(.7,t),i.gain.exponentialRampToValueAtTime(.01,t+.4),e.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+.5);const s=this.createNoise(.4),o=this.ctx.createGain(),a=this.ctx.createBiquadFilter(),n=this.ctx.createBiquadFilter();a.type="bandpass",a.frequency.setValueAtTime(3e3,t),a.frequency.exponentialRampToValueAtTime(500,t+.3),a.Q.value=3,n.type="highpass",n.frequency.value=1e3,o.gain.setValueAtTime(.5,t),o.gain.exponentialRampToValueAtTime(.01,t+.35),s.connect(a),a.connect(n),n.connect(o),o.connect(this.sfxGain);for(let l=0;l<5;l++){const u=l*.04,p=this.ctx.createOscillator(),m=this.ctx.createGain();p.type="sine",p.frequency.setValueAtTime(400+Math.random()*600,t+u),p.frequency.exponentialRampToValueAtTime(100+Math.random()*100,t+u+.08),m.gain.setValueAtTime(.15,t+u),m.gain.exponentialRampToValueAtTime(.01,t+u+.1),p.connect(m),m.connect(this.sfxGain),p.start(t+u),p.stop(t+u+.15)}const r=this.createNoise(.8),c=this.ctx.createGain(),h=this.ctx.createBiquadFilter();h.type="highpass",h.frequency.value=4e3,c.gain.setValueAtTime(.2,t+.1),c.gain.exponentialRampToValueAtTime(.01,t+.7),r.connect(h),h.connect(c),c.connect(this.sfxGain)}playPhantomPass(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),s=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(400,t),e.frequency.exponentialRampToValueAtTime(100,t+.3),s.type="lowpass",s.frequency.setValueAtTime(2e3,t),s.frequency.exponentialRampToValueAtTime(300,t+.3),s.Q.value=2,i.gain.setValueAtTime(.3,t),i.gain.exponentialRampToValueAtTime(.01,t+.4),e.connect(s),s.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+.5);const o=this.ctx.createOscillator(),a=this.ctx.createGain();o.type="sine",o.frequency.setValueAtTime(60,t),o.frequency.exponentialRampToValueAtTime(30,t+.5),a.gain.setValueAtTime(.4,t),a.gain.exponentialRampToValueAtTime(.01,t+.6),o.connect(a),a.connect(this.sfxGain),o.start(t),o.stop(t+.7);const n=this.createNoise(.3),r=this.ctx.createGain(),c=this.ctx.createBiquadFilter();c.type="bandpass",c.frequency.value=3e3,c.Q.value=5,r.gain.setValueAtTime(.15,t),r.gain.exponentialRampToValueAtTime(.01,t+.25),n.connect(c),c.connect(r),r.connect(this.sfxGain)}playRunnerHit(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sawtooth",e.frequency.setValueAtTime(800,t),e.frequency.exponentialRampToValueAtTime(200,t+.15),i.gain.setValueAtTime(.3,t),i.gain.exponentialRampToValueAtTime(.01,t+.2),e.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.25);for(let a=0;a<4;a++){const n=this.ctx.createOscillator(),r=this.ctx.createGain();n.type="square",n.frequency.value=1e3+Math.random()*2e3;const c=t+a*.03;r.gain.setValueAtTime(.15,c),r.gain.setValueAtTime(0,c+.02),n.connect(r),r.connect(this.sfxGain),n.start(c),n.stop(c+.03)}const s=this.ctx.createOscillator(),o=this.ctx.createGain();s.type="sine",s.frequency.setValueAtTime(120,t),s.frequency.exponentialRampToValueAtTime(40,t+.15),o.gain.setValueAtTime(.4,t),o.gain.exponentialRampToValueAtTime(.01,t+.2),s.connect(o),o.connect(this.sfxGain),s.start(t),s.stop(t+.25)}playHopperHit(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),s=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(2e3,t),e.frequency.exponentialRampToValueAtTime(100,t+.2),s.type="bandpass",s.frequency.value=1500,s.Q.value=3,i.gain.setValueAtTime(.35,t),i.gain.exponentialRampToValueAtTime(.01,t+.25),e.connect(s),s.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+.3);const o=this.ctx.createOscillator(),a=this.ctx.createGain();o.type="sine",o.frequency.setValueAtTime(80,t+.05),o.frequency.exponentialRampToValueAtTime(25,t+.3),a.gain.setValueAtTime(.5,t+.05),a.gain.exponentialRampToValueAtTime(.01,t+.35),o.connect(a),a.connect(this.sfxGain),o.start(t+.05),o.stop(t+.4);const n=this.createNoise(.25),r=this.ctx.createGain(),c=this.ctx.createBiquadFilter();c.type="highpass",c.frequency.value=3e3,r.gain.setValueAtTime(.2,t),r.gain.exponentialRampToValueAtTime(.01,t+.15),n.connect(c),c.connect(r),r.connect(this.sfxGain)}playGlitch(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime;for(let e=0;e<5;e++){const i=e*.03+Math.random()*.02,s=this.ctx.createOscillator(),o=this.ctx.createGain(),a=this.ctx.createBiquadFilter();s.type=Math.random()>.5?"square":"sawtooth",s.frequency.value=100+Math.random()*2e3,a.type="bandpass",a.frequency.value=500+Math.random()*3e3,a.Q.value=5+Math.random()*10,o.gain.setValueAtTime(.15,t+i),o.gain.setValueAtTime(0,t+i+.02+Math.random()*.03),s.connect(a),a.connect(o),o.connect(this.sfxGain),o.connect(this.reverb),s.start(t+i),s.stop(t+i+.1)}}playFootstep(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(80,t),e.frequency.exponentialRampToValueAtTime(30,t+.08),i.gain.setValueAtTime(.2,t),i.gain.exponentialRampToValueAtTime(.01,t+.1),e.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.12);const s=this.createNoise(.06),o=this.ctx.createGain(),a=this.ctx.createBiquadFilter();a.type="lowpass",a.frequency.value=300+Math.random()*200,o.gain.setValueAtTime(.1,t),o.gain.exponentialRampToValueAtTime(.01,t+.05),s.connect(a),a.connect(o),o.connect(this.sfxGain)}playJump(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createOscillator(),s=this.ctx.createGain();e.type="square",e.frequency.setValueAtTime(150,t),e.frequency.exponentialRampToValueAtTime(600,t+.1),i.type="sawtooth",i.frequency.setValueAtTime(155,t),i.frequency.exponentialRampToValueAtTime(605,t+.1),s.gain.setValueAtTime(.15,t),s.gain.exponentialRampToValueAtTime(.01,t+.15),e.connect(s),i.connect(s),s.connect(this.sfxGain),s.connect(this.reverb),e.start(t),e.stop(t+.15),i.start(t),i.stop(t+.15)}playLand(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(100,t),e.frequency.exponentialRampToValueAtTime(20,t+.15),i.gain.setValueAtTime(.5,t),i.gain.exponentialRampToValueAtTime(.01,t+.2),e.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+.25);const s=this.createNoise(.15),o=this.ctx.createGain(),a=this.ctx.createBiquadFilter();a.type="lowpass",a.frequency.value=400,o.gain.setValueAtTime(.3,t),o.gain.exponentialRampToValueAtTime(.01,t+.1),s.connect(a),a.connect(o),o.connect(this.sfxGain)}playKill(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(150,t),e.frequency.exponentialRampToValueAtTime(20,t+.4),i.gain.setValueAtTime(.6,t),i.gain.exponentialRampToValueAtTime(.01,t+.5),e.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+.6);const s=this.ctx.createOscillator(),o=this.ctx.createOscillator(),a=this.ctx.createGain(),n=this.ctx.createBiquadFilter();s.type="sawtooth",s.frequency.setValueAtTime(200,t),s.frequency.exponentialRampToValueAtTime(800,t+.2),o.type="square",o.frequency.setValueAtTime(203,t),o.frequency.exponentialRampToValueAtTime(806,t+.2),n.type="lowpass",n.frequency.setValueAtTime(500,t),n.frequency.exponentialRampToValueAtTime(4e3,t+.15),n.Q.value=3,a.gain.setValueAtTime(.25,t),a.gain.exponentialRampToValueAtTime(.01,t+.3),s.connect(n),o.connect(n),n.connect(a),a.connect(this.sfxGain),a.connect(this.reverb),s.start(t),s.stop(t+.35),o.start(t),o.stop(t+.35);for(let l=0;l<4;l++){const u=.1+l*.05,p=this.ctx.createOscillator(),m=this.ctx.createGain();p.type="square",p.frequency.value=400+Math.random()*1e3,m.gain.setValueAtTime(.1,t+u),m.gain.exponentialRampToValueAtTime(.01,t+u+.03),p.connect(m),m.connect(this.distortion),p.start(t+u),p.stop(t+u+.05)}const r=this.createNoise(.3),c=this.ctx.createGain(),h=this.ctx.createBiquadFilter();h.type="bandpass",h.frequency.setValueAtTime(2e3,t),h.frequency.exponentialRampToValueAtTime(200,t+.3),h.Q.value=1,c.gain.setValueAtTime(.3,t),c.gain.exponentialRampToValueAtTime(.01,t+.25),r.connect(h),h.connect(c),c.connect(this.sfxGain)}createNoise(t){if(!this.ctx)throw new Error("AudioContext not initialized");const e=this.ctx.sampleRate*t,i=this.ctx.createBuffer(1,e,this.ctx.sampleRate),s=i.getChannelData(0);for(let a=0;a<e;a++)s[a]=Math.random()*2-1;const o=this.ctx.createBufferSource();return o.buffer=i,o.start(),o}playKatanaSwing(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),s=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(600,t),e.frequency.exponentialRampToValueAtTime(100,t+.12),s.type="bandpass",s.frequency.setValueAtTime(800,t),s.frequency.exponentialRampToValueAtTime(300,t+.12),s.Q.value=4,i.gain.setValueAtTime(.25,t),i.gain.exponentialRampToValueAtTime(.01,t+.15),e.connect(s),s.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.2);const o=this.ctx.createOscillator(),a=this.ctx.createGain();o.type="sine",o.frequency.value=1800,a.gain.setValueAtTime(.08,t+.03),a.gain.exponentialRampToValueAtTime(.01,t+.1),o.connect(a),a.connect(this.sfxGain),o.start(t+.03),o.stop(t+.15)}playSplashWave(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),s=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(200,t),e.frequency.exponentialRampToValueAtTime(80,t+.4),s.type="lowpass",s.frequency.setValueAtTime(2e3,t),s.frequency.exponentialRampToValueAtTime(400,t+.4),s.Q.value=10,i.gain.setValueAtTime(.5,t),i.gain.exponentialRampToValueAtTime(.01,t+.5),e.connect(s),s.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+.5);const o=this.createNoise(.3),a=this.ctx.createGain(),n=this.ctx.createBiquadFilter();n.type="bandpass",n.frequency.value=3e3,n.Q.value=5,a.gain.setValueAtTime(.2,t),a.gain.exponentialRampToValueAtTime(.01,t+.25),o.connect(n),n.connect(a),a.connect(this.sfxGain);const r=this.ctx.createOscillator(),c=this.ctx.createGain();r.type="sine",r.frequency.setValueAtTime(800,t),r.frequency.exponentialRampToValueAtTime(400,t+.3),c.gain.setValueAtTime(.15,t),c.gain.exponentialRampToValueAtTime(.01,t+.35),r.connect(c),c.connect(this.sfxGain),r.start(t),r.stop(t+.4);const h=this.ctx.createOscillator(),l=this.ctx.createGain();h.type="sine",h.frequency.setValueAtTime(60,t),h.frequency.exponentialRampToValueAtTime(30,t+.3),l.gain.setValueAtTime(.6,t),l.gain.exponentialRampToValueAtTime(.01,t+.4),h.connect(l),l.connect(this.sfxGain),h.start(t),h.stop(t+.45)}playChargePickup(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createOscillator(),s=this.ctx.createGain(),o=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(150,t),e.frequency.exponentialRampToValueAtTime(800,t+.3),i.type="square",i.frequency.setValueAtTime(152,t),i.frequency.exponentialRampToValueAtTime(810,t+.3),o.type="bandpass",o.frequency.setValueAtTime(500,t),o.frequency.exponentialRampToValueAtTime(2e3,t+.3),o.Q.value=8,s.gain.setValueAtTime(.15,t),s.gain.linearRampToValueAtTime(.35,t+.2),s.gain.exponentialRampToValueAtTime(.01,t+.5),e.connect(o),i.connect(o),o.connect(s),s.connect(this.sfxGain),s.connect(this.reverb),e.start(t),e.stop(t+.5),i.start(t),i.stop(t+.5);const a=this.ctx.createOscillator(),n=this.ctx.createGain();a.type="sine",a.frequency.value=2500,n.gain.setValueAtTime(.12,t+.15),n.gain.exponentialRampToValueAtTime(.01,t+.5),a.connect(n),n.connect(this.reverb),a.start(t+.15),a.stop(t+.55);const r=this.createNoise(.2),c=this.ctx.createGain(),h=this.ctx.createBiquadFilter();h.type="highpass",h.frequency.value=4e3,c.gain.setValueAtTime(.1,t+.1),c.gain.exponentialRampToValueAtTime(.01,t+.3),r.connect(h),h.connect(c),c.connect(this.sfxGain)}playAcidSpit(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sawtooth",e.frequency.setValueAtTime(150,t),e.frequency.exponentialRampToValueAtTime(80,t+.15),i.gain.setValueAtTime(.25,t),i.gain.exponentialRampToValueAtTime(.01,t+.2),e.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.2);const s=this.ctx.createOscillator(),o=this.ctx.createGain(),a=this.ctx.createBiquadFilter();s.type="sawtooth",s.frequency.setValueAtTime(500,t+.1),s.frequency.exponentialRampToValueAtTime(150,t+1.2),a.type="bandpass",a.frequency.setValueAtTime(400,t),a.frequency.exponentialRampToValueAtTime(200,t+1),a.Q.value=3,o.gain.setValueAtTime(0,t),o.gain.linearRampToValueAtTime(.15,t+.1),o.gain.exponentialRampToValueAtTime(.01,t+1.2),s.connect(a),a.connect(o),o.connect(this.sfxGain),s.start(t),s.stop(t+1.2)}playAcidSplash(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.createNoise(.8),i=this.ctx.createGain(),s=this.ctx.createBiquadFilter();s.type="lowpass",s.frequency.setValueAtTime(1200,t),s.frequency.exponentialRampToValueAtTime(400,t+.3),i.gain.setValueAtTime(.4,t),i.gain.exponentialRampToValueAtTime(.01,t+.5),e.connect(s),s.connect(i),i.connect(this.sfxGain);const o=this.createNoise(2),a=this.ctx.createGain(),n=this.ctx.createBiquadFilter();n.type="highpass",n.frequency.value=3500,a.gain.setValueAtTime(0,t+.1),a.gain.linearRampToValueAtTime(.2,t+.2),a.gain.exponentialRampToValueAtTime(.01,t+2),o.connect(n),n.connect(a),a.connect(this.sfxGain);const r=this.ctx.createOscillator(),c=this.ctx.createGain();r.type="sine",r.frequency.setValueAtTime(80,t),r.frequency.exponentialRampToValueAtTime(40,t+.2),c.gain.setValueAtTime(.35,t),c.gain.exponentialRampToValueAtTime(.01,t+.3),r.connect(c),c.connect(this.sfxGain),r.start(t),r.stop(t+.3)}playAcidRainMark(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),s=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(200,t),e.frequency.exponentialRampToValueAtTime(600,t+1),s.type="bandpass",s.frequency.setValueAtTime(400,t),s.Q.value=5,i.gain.setValueAtTime(.1,t),i.gain.linearRampToValueAtTime(.25,t+.8),i.gain.exponentialRampToValueAtTime(.01,t+1.2),e.connect(s),s.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+1.2);for(let o=0;o<3;o++){const a=this.ctx.createOscillator(),n=this.ctx.createGain();a.type="square",a.frequency.value=800,n.gain.setValueAtTime(0,t+o*.3),n.gain.linearRampToValueAtTime(.1,t+o*.3+.05),n.gain.exponentialRampToValueAtTime(.01,t+o*.3+.15),a.connect(n),n.connect(this.sfxGain),a.start(t+o*.3),a.stop(t+o*.3+.2)}}playAcidRainStart(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.createNoise(3),i=this.ctx.createGain(),s=this.ctx.createBiquadFilter();s.type="bandpass",s.frequency.value=2e3,s.Q.value=1,i.gain.setValueAtTime(0,t),i.gain.linearRampToValueAtTime(.3,t+.2),i.gain.setValueAtTime(.25,t+2.5),i.gain.exponentialRampToValueAtTime(.01,t+3),e.connect(s),s.connect(i),i.connect(this.sfxGain);const o=this.createNoise(3),a=this.ctx.createGain(),n=this.ctx.createBiquadFilter();n.type="highpass",n.frequency.value=5e3,a.gain.setValueAtTime(0,t+.1),a.gain.linearRampToValueAtTime(.15,t+.3),a.gain.exponentialRampToValueAtTime(.01,t+3),o.connect(n),n.connect(a),a.connect(this.sfxGain);const r=this.ctx.createOscillator(),c=this.ctx.createGain();r.type="sine",r.frequency.value=50,c.gain.setValueAtTime(.2,t),c.gain.exponentialRampToValueAtTime(.01,t+2),r.connect(c),c.connect(this.sfxGain),r.start(t),r.stop(t+2)}playBossWarning(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(120,t),e.frequency.exponentialRampToValueAtTime(80,t+2),i.gain.setValueAtTime(.5,t),i.gain.exponentialRampToValueAtTime(.01,t+2.5),e.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+2.5);const s=this.ctx.createOscillator(),o=this.ctx.createGain();s.type="sine",s.frequency.setValueAtTime(180,t+.5),s.frequency.exponentialRampToValueAtTime(100,t+2.5),o.gain.setValueAtTime(.3,t+.5),o.gain.exponentialRampToValueAtTime(.01,t+3),s.connect(o),o.connect(this.sfxGain),o.connect(this.reverb),s.start(t+.5),s.stop(t+3);const a=this.createNoise(2),n=this.ctx.createGain(),r=this.ctx.createBiquadFilter();r.type="bandpass",r.frequency.value=800,r.Q.value=5,n.gain.setValueAtTime(0,t+1),n.gain.linearRampToValueAtTime(.1,t+1.5),n.gain.exponentialRampToValueAtTime(.01,t+2.5),a.connect(r),r.connect(n),n.connect(this.reverb)}arpInterval=null;currentMusicMode="normal";musicIntervals=[];isLowHpMode=!1;currentEra=1;rainGain=null;rainSource=null;isRainPlaying=!1;thunderInterval=null;setEra(t){let e=1;if(t>10?e=3:t>5&&(e=2),t>=15&&!this.isRainPlaying?this.startRain():t<15&&this.isRainPlaying&&this.stopRain(),e!==this.currentEra&&this.currentMusicMode==="normal"){this.currentEra=e;for(const i of this.musicIntervals)clearInterval(i),clearTimeout(i);this.musicIntervals=[],this.startSynthwaveMusic()}else this.currentEra=e}startRain(){if(!this.ctx||!this.masterGain||this.isRainPlaying)return;this.isRainPlaying=!0,this.rainGain=this.ctx.createGain(),this.rainGain.gain.value=0,this.rainGain.connect(this.masterGain);const t=this.ctx.sampleRate,i=t*4,s=this.ctx.createBuffer(2,i,t);for(let n=0;n<2;n++){const r=s.getChannelData(n);for(let c=0;c<i;c++){let h=(Math.random()*2-1)*.3;Math.random()<.001&&(h+=(Math.random()*2-1)*.8),h+=Math.sin(c/t*2*Math.PI*.5)*.05,r[c]=h}}this.rainSource=this.ctx.createBufferSource(),this.rainSource.buffer=s,this.rainSource.loop=!0;const o=this.ctx.createBiquadFilter();o.type="lowpass",o.frequency.value=3e3,o.Q.value=.5;const a=this.ctx.createBiquadFilter();a.type="highpass",a.frequency.value=200,a.Q.value=.5,this.rainSource.connect(a),a.connect(o),o.connect(this.rainGain),this.rainSource.start(),this.rainGain.gain.linearRampToValueAtTime(.25,this.ctx.currentTime+2),this.startThunder()}startThunder(){if(!this.ctx||!this.masterGain)return;const t=()=>{if(!this.ctx||!this.masterGain||!this.isRainPlaying)return;const e=this.ctx.currentTime,i=this.ctx.createGain();i.gain.value=0,i.connect(this.masterGain);const s=this.ctx.createBuffer(1,this.ctx.sampleRate*3,this.ctx.sampleRate),o=s.getChannelData(0);for(let l=0;l<o.length;l++)o[l]=(Math.random()*2-1)*Math.exp(-l/(this.ctx.sampleRate*.8));const a=this.ctx.createBufferSource();a.buffer=s;const n=this.ctx.createBiquadFilter();n.type="lowpass",n.frequency.value=150+Math.random()*100,n.Q.value=1,a.connect(n),n.connect(i);const r=this.ctx.createOscillator();r.type="sawtooth",r.frequency.value=80+Math.random()*40;const c=this.ctx.createGain();c.gain.value=0;const h=this.ctx.createBiquadFilter();h.type="bandpass",h.frequency.value=2e3,h.Q.value=2,r.connect(h),h.connect(c),c.connect(i),i.gain.setValueAtTime(0,e),i.gain.linearRampToValueAtTime(.6,e+.1),i.gain.exponentialRampToValueAtTime(.01,e+2.5),c.gain.setValueAtTime(0,e),c.gain.linearRampToValueAtTime(.4,e+.02),c.gain.exponentialRampToValueAtTime(.01,e+.2),a.start(e),r.start(e),a.stop(e+3),r.stop(e+.3)};setTimeout(t,2e3+Math.random()*2e3),this.thunderInterval=setInterval(()=>{this.isRainPlaying&&t()},3e3+Math.random()*3e3)}stopRain(){!this.ctx||!this.isRainPlaying||(this.isRainPlaying=!1,this.thunderInterval&&(clearInterval(this.thunderInterval),this.thunderInterval=null),this.rainGain&&this.rainGain.gain.linearRampToValueAtTime(0,this.ctx.currentTime+1),setTimeout(()=>{if(this.rainSource){try{this.rainSource.stop()}catch{}this.rainSource=null}this.rainGain=null},1100))}startSynthwaveMusic(){if(!(!this.ctx||!this.musicGain))switch(this.currentEra){case 1:this.playEra1Music();break;case 2:this.playEra2Music();break;case 3:this.playEra3Music();break}}playEra1Music(){if(!this.ctx||!this.musicGain)return;const t=[55,55,73.4,55,82.4,55,73.4,65.4];let e=0;const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==1)return;const r=this.ctx.currentTime,c=this.ctx.createOscillator(),h=this.ctx.createBiquadFilter(),l=this.ctx.createGain();c.type="sawtooth",c.frequency.value=t[e],h.type="lowpass",h.frequency.setValueAtTime(300,r),h.frequency.exponentialRampToValueAtTime(800,r+.05),h.frequency.exponentialRampToValueAtTime(200,r+.2),h.Q.value=10,l.gain.setValueAtTime(.15,r),l.gain.exponentialRampToValueAtTime(.01,r+.25),c.connect(h),h.connect(l),l.connect(this.musicGain),c.start(r),c.stop(r+.3),e=(e+1)%t.length};this.musicIntervals.push(setInterval(i,250));const s=[220,277,330,440,330,277];let o=0;const a=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==1)return;const r=this.ctx.currentTime,c=this.ctx.createOscillator(),h=this.ctx.createGain();c.type="square",c.frequency.value=s[o],h.gain.setValueAtTime(.06,r),h.gain.exponentialRampToValueAtTime(.01,r+.1),c.connect(h),h.connect(this.musicGain),c.start(r),c.stop(r+.12),o=(o+1)%s.length};this.musicIntervals.push(setInterval(a,125));const n=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==1)return;const r=this.ctx.currentTime,c=this.ctx.createOscillator(),h=this.ctx.createGain();c.type="sine",c.frequency.setValueAtTime(150,r),c.frequency.exponentialRampToValueAtTime(40,r+.1),h.gain.setValueAtTime(.25,r),h.gain.exponentialRampToValueAtTime(.01,r+.15),c.connect(h),h.connect(this.musicGain),c.start(r),c.stop(r+.15)};this.musicIntervals.push(setInterval(n,500))}playEra2Music(){if(!this.ctx||!this.musicGain)return;const t=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==2)return;const a=this.ctx.currentTime,n=this.ctx.createOscillator(),r=this.ctx.createOscillator(),c=this.ctx.createOscillator(),h=this.ctx.createGain(),l=this.ctx.createGain(),u=this.ctx.createBiquadFilter();n.type="sawtooth",n.frequency.value=41,r.type="triangle",r.frequency.value=41.2,c.type="sine",c.frequency.value=.1,h.gain.value=20,c.connect(h),h.connect(n.frequency),u.type="lowpass",u.frequency.value=150,l.gain.setValueAtTime(.12,a),l.gain.linearRampToValueAtTime(.08,a+3),l.gain.exponentialRampToValueAtTime(.01,a+4),n.connect(u),r.connect(u),u.connect(l),l.connect(this.musicGain),c.start(a),n.start(a),r.start(a),c.stop(a+4),n.stop(a+4),r.stop(a+4)};t(),this.musicIntervals.push(setInterval(t,4e3));let e=0;const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==2)return;const a=this.ctx.currentTime;if(e%2===0){const n=this.ctx.createOscillator(),r=this.ctx.createGain();n.type="sine",n.frequency.setValueAtTime(80,a),n.frequency.exponentialRampToValueAtTime(20,a+.3),r.gain.setValueAtTime(.3,a),r.gain.exponentialRampToValueAtTime(.01,a+.4),n.connect(r),r.connect(this.musicGain),n.start(a),n.stop(a+.4)}e++};this.musicIntervals.push(setInterval(i,600));const s=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==2)return;const a=this.ctx.currentTime,n=600+Math.random()*400,r=this.ctx.createOscillator(),c=this.ctx.createGain();r.type="sine",r.frequency.setValueAtTime(n,a),r.frequency.linearRampToValueAtTime(n*.7,a+2),c.gain.setValueAtTime(0,a),c.gain.linearRampToValueAtTime(.04,a+.5),c.gain.linearRampToValueAtTime(0,a+2),r.connect(c),c.connect(this.musicGain),r.start(a),r.stop(a+2)};this.musicIntervals.push(setInterval(s,3e3+Math.random()*2e3));const o=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==2)return;const a=this.ctx.currentTime,n=this.ctx.sampleRate*.5,r=this.ctx.createBuffer(1,n,this.ctx.sampleRate),c=r.getChannelData(0);for(let p=0;p<n;p++)c[p]=(Math.random()*2-1)*Math.exp(-p/(n*.5));const h=this.ctx.createBufferSource();h.buffer=r;const l=this.ctx.createBiquadFilter();l.type="lowpass",l.frequency.value=200;const u=this.ctx.createGain();u.gain.setValueAtTime(.08,a),u.gain.exponentialRampToValueAtTime(.01,a+.5),h.connect(l),l.connect(u),u.connect(this.musicGain),h.start(a),h.stop(a+.5)};this.musicIntervals.push(setInterval(o,1500))}playEra3Music(){if(!this.ctx||!this.musicGain)return;const t=[110,110,146.8,110,130.8,110,164.8,146.8];let e=0;const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==3)return;const h=this.ctx.currentTime,l=this.ctx.createOscillator(),u=this.ctx.createBiquadFilter(),p=this.ctx.createGain();l.type="sawtooth",l.frequency.value=t[e],u.type="lowpass",u.frequency.setValueAtTime(400,h),u.frequency.exponentialRampToValueAtTime(150,h+.15),p.gain.setValueAtTime(.12,h),p.gain.exponentialRampToValueAtTime(.01,h+.2),l.connect(u),u.connect(p),p.connect(this.musicGain),l.start(h),l.stop(h+.22),e=(e+1)%t.length};this.musicIntervals.push(setInterval(i,200));const s=[880,1046,1318,1760,1318,1046,880,659];let o=0;const a=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==3)return;const h=this.ctx.currentTime,l=this.ctx.createOscillator(),u=this.ctx.createGain(),p=this.ctx.createDelay(),m=this.ctx.createGain();l.type="triangle",l.frequency.value=s[o],p.delayTime.value=.15,m.gain.value=.3,u.gain.setValueAtTime(.05,h),u.gain.exponentialRampToValueAtTime(.01,h+.1),l.connect(u),l.connect(p),p.connect(m),m.connect(this.musicGain),u.connect(this.musicGain),l.start(h),l.stop(h+.12),o=(o+1)%s.length};this.musicIntervals.push(setInterval(a,100));const n=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==3)return;const h=this.ctx.currentTime,l=this.ctx.createOscillator(),u=this.ctx.createGain();l.type="sine",l.frequency.setValueAtTime(200,h),l.frequency.exponentialRampToValueAtTime(50,h+.08),u.gain.setValueAtTime(.2,h),u.gain.exponentialRampToValueAtTime(.01,h+.12),l.connect(u),u.connect(this.musicGain),l.start(h),l.stop(h+.12)};this.musicIntervals.push(setInterval(n,400));const r=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==3)return;const h=this.ctx.currentTime,l=[220,277,330,440];for(const u of l){const p=this.ctx.createOscillator(),m=this.ctx.createGain();p.type="sine",p.frequency.value=u,m.gain.setValueAtTime(0,h),m.gain.linearRampToValueAtTime(.03,h+.5),m.gain.linearRampToValueAtTime(.02,h+2),m.gain.linearRampToValueAtTime(0,h+3),p.connect(m),m.connect(this.musicGain),p.start(h),p.stop(h+3.5)}};r(),this.musicIntervals.push(setInterval(r,4e3));const c=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==3)return;const h=this.ctx.currentTime,l=this.ctx.createOscillator(),u=this.ctx.createGain();l.type="sawtooth",l.frequency.setValueAtTime(1500+Math.random()*1e3,h),l.frequency.exponentialRampToValueAtTime(100,h+.1),u.gain.setValueAtTime(.06,h),u.gain.exponentialRampToValueAtTime(.001,h+.1),l.connect(u),u.connect(this.musicGain),l.start(h),l.stop(h+.1)};this.musicIntervals.push(setInterval(c,800+Math.random()*600))}setLowHpMode(t){if(!(!this.ctx||!this.musicGain)&&!(this.currentMusicMode!=="normal"&&this.currentMusicMode!=="low_hp")){if(t&&!this.isLowHpMode){this.isLowHpMode=!0,this.currentMusicMode="low_hp";for(const e of this.musicIntervals)clearInterval(e),clearTimeout(e);this.musicIntervals=[],this.playLowHpMusic()}else if(!t&&this.isLowHpMode){this.isLowHpMode=!1,this.currentMusicMode="normal";for(const e of this.musicIntervals)clearInterval(e),clearTimeout(e);this.musicIntervals=[],this.startSynthwaveMusic()}}}playLowHpMusic(){if(!this.ctx||!this.musicGain)return;const t=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="low_hp")return;const a=this.ctx.currentTime;for(let n=0;n<2;n++){const r=this.ctx.createOscillator(),c=this.ctx.createGain();r.type="sine",r.frequency.value=40;const h=n*.15;c.gain.setValueAtTime(0,a+h),c.gain.linearRampToValueAtTime(.3,a+h+.05),c.gain.exponentialRampToValueAtTime(.01,a+h+.2),r.connect(c),c.connect(this.musicGain),r.start(a+h),r.stop(a+h+.25)}};this.musicIntervals.push(setInterval(t,800));const e=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="low_hp")return;const a=this.ctx.currentTime,n=this.ctx.createOscillator(),r=this.ctx.createOscillator(),c=this.ctx.createGain(),h=this.ctx.createBiquadFilter();n.type="sawtooth",n.frequency.value=55,r.type="sawtooth",r.frequency.value=55.5,h.type="lowpass",h.frequency.value=200,h.Q.value=5,c.gain.setValueAtTime(.1,a),c.gain.linearRampToValueAtTime(.15,a+1),c.gain.linearRampToValueAtTime(.05,a+2),n.connect(h),r.connect(h),h.connect(c),c.connect(this.musicGain),n.start(a),n.stop(a+2.5),r.start(a),r.stop(a+2.5)};e(),this.musicIntervals.push(setInterval(e,2500));const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="low_hp")return;const a=this.ctx.currentTime,n=1+Math.floor(Math.random()*3);for(let r=0;r<n;r++){const c=Math.floor(this.ctx.sampleRate*(.02+Math.random()*.03)),h=this.ctx.createBuffer(1,c,this.ctx.sampleRate),l=h.getChannelData(0);for(let f=0;f<c;f++)l[f]=(Math.random()*2-1)*Math.exp(-f/(c*.3));const u=this.ctx.createBufferSource();u.buffer=h;const p=this.ctx.createBiquadFilter();p.type="highpass",p.frequency.value=3e3+Math.random()*5e3;const m=this.ctx.createGain();m.gain.setValueAtTime(.05+Math.random()*.05,a+r*.05),m.gain.exponentialRampToValueAtTime(.001,a+r*.05+.05),u.connect(p),p.connect(m),m.connect(this.musicGain),u.start(a+r*.05),u.stop(a+r*.05+.05)}};this.musicIntervals.push(setInterval(i,500+Math.random()*500));const s=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="low_hp")return;const a=this.ctx.currentTime,n=this.ctx.createOscillator(),r=this.ctx.createGain();n.type="square";const c=[220,233.1],h=c[Math.floor(Math.random()*c.length)];n.frequency.value=h,r.gain.setValueAtTime(0,a),r.gain.linearRampToValueAtTime(.08,a+.1),r.gain.linearRampToValueAtTime(.06,a+.3),r.gain.exponentialRampToValueAtTime(.01,a+.5),n.connect(r),r.connect(this.musicGain),n.start(a),n.stop(a+.5)};this.musicIntervals.push(setInterval(s,1500+Math.random()*1e3));const o=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="low_hp")return;const a=this.ctx.currentTime,n=this.ctx.sampleRate*.1,r=this.ctx.createBuffer(1,n,this.ctx.sampleRate),c=r.getChannelData(0);for(let p=0;p<n;p++)c[p]=Math.random()>.7?(Math.random()*2-1)*.5:0;const h=this.ctx.createBufferSource();h.buffer=r;const l=this.ctx.createBiquadFilter();l.type="bandpass",l.frequency.value=2e3,l.Q.value=3;const u=this.ctx.createGain();u.gain.setValueAtTime(.03,a),u.gain.exponentialRampToValueAtTime(.001,a+.1),h.connect(l),l.connect(u),u.connect(this.musicGain),h.start(a),h.stop(a+.1)};this.musicIntervals.push(setInterval(o,300+Math.random()*400))}bossGreenPhase=1;setBossMusic(t){if(!(!this.ctx||!this.musicGain)){for(const e of this.musicIntervals)clearInterval(e),clearTimeout(e);if(this.musicIntervals=[],this.bossGreenPhase=1,t===null)this.currentMusicMode="normal",this.startSynthwaveMusic();else switch(this.currentMusicMode=t,t){case"boss_green":this.playBossGreenMusic();break;case"boss_black":this.playBossBlackMusic();break;case"boss_blue":this.playBossBlueMusic();break}}}setBossGreenPhase2(){if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green"||this.bossGreenPhase===2)return;this.bossGreenPhase=2;const t=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green")return;const i=this.ctx.currentTime,s=this.ctx.createOscillator(),o=this.ctx.createOscillator(),a=this.ctx.createGain(),n=this.ctx.createWaveShaper();s.type="sine",s.frequency.setValueAtTime(200,i),s.frequency.exponentialRampToValueAtTime(30,i+.15),o.type="sine",o.frequency.setValueAtTime(100,i),o.frequency.exponentialRampToValueAtTime(20,i+.2);const r=new Float32Array(256);for(let c=0;c<256;c++){const h=c/128-1;r[c]=Math.tanh(h*5)}n.curve=r,a.gain.setValueAtTime(.5,i),a.gain.exponentialRampToValueAtTime(.01,i+.25),s.connect(n),o.connect(n),n.connect(a),a.connect(this.musicGain),s.start(i),s.stop(i+.25),o.start(i),o.stop(i+.25)};this.musicIntervals.push(setInterval(t,207));const e=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green")return;const i=this.ctx.currentTime,s=this.ctx.createOscillator(),o=this.ctx.createGain();s.type="square",s.frequency.setValueAtTime(600,i),s.frequency.linearRampToValueAtTime(800,i+.2),s.frequency.linearRampToValueAtTime(600,i+.4),o.gain.setValueAtTime(.08,i),o.gain.linearRampToValueAtTime(.12,i+.2),o.gain.linearRampToValueAtTime(0,i+.4),s.connect(o),o.connect(this.musicGain),s.start(i),s.stop(i+.4)};this.musicIntervals.push(setInterval(e,2e3))}vortexGain=null;vortexOsc=null;vortexNoise=null;isStormMode=!1;stormGain=null;playVortexSound(t){if(!(!this.ctx||!this.masterGain))if(t){this.vortexGain=this.ctx.createGain(),this.vortexGain.gain.value=0,this.vortexGain.connect(this.masterGain),this.vortexOsc=this.ctx.createOscillator(),this.vortexOsc.type="sawtooth",this.vortexOsc.frequency.value=60;const e=this.ctx.createGain();e.gain.value=.15;const i=this.ctx.createOscillator();i.type="sine",i.frequency.value=3;const s=this.ctx.createGain();s.gain.value=30,i.connect(s),s.connect(this.vortexOsc.frequency);const o=this.ctx.createBiquadFilter();o.type="lowpass",o.frequency.value=200,o.Q.value=5,this.vortexOsc.connect(o),o.connect(e),e.connect(this.vortexGain);const a=this.ctx.createBuffer(1,this.ctx.sampleRate*4,this.ctx.sampleRate),n=a.getChannelData(0);for(let h=0;h<n.length;h++)n[h]=(Math.random()*2-1)*.5;this.vortexNoise=this.ctx.createBufferSource(),this.vortexNoise.buffer=a,this.vortexNoise.loop=!0;const r=this.ctx.createBiquadFilter();r.type="bandpass",r.frequency.value=400,r.Q.value=2;const c=this.ctx.createGain();c.gain.value=.3,this.vortexNoise.connect(r),r.connect(c),c.connect(this.vortexGain),this.vortexOsc.start(),i.start(),this.vortexNoise.start(),this.vortexGain.gain.linearRampToValueAtTime(.5,this.ctx.currentTime+.5),this.activateStormMode()}else this.vortexGain&&this.vortexGain.gain.linearRampToValueAtTime(0,this.ctx.currentTime+.5),this.deactivateStormMode(),setTimeout(()=>{if(this.vortexOsc){try{this.vortexOsc.stop()}catch{}this.vortexOsc=null}if(this.vortexNoise){try{this.vortexNoise.stop()}catch{}this.vortexNoise=null}this.vortexGain=null},600)}activateStormMode(){if(!this.ctx||!this.musicGain||this.isStormMode)return;this.isStormMode=!0,this.stormGain=this.ctx.createGain(),this.stormGain.gain.value=0,this.stormGain.connect(this.musicGain),this.stormGain.gain.linearRampToValueAtTime(1,this.ctx.currentTime+.5);const t=()=>{if(!this.ctx||!this.stormGain||!this.isStormMode)return;const o=this.ctx.currentTime,a=this.ctx.createOscillator(),n=this.ctx.createBiquadFilter(),r=this.ctx.createGain();a.type="sawtooth",a.frequency.setValueAtTime(100,o),a.frequency.exponentialRampToValueAtTime(800,o+2),n.type="lowpass",n.frequency.setValueAtTime(200,o),n.frequency.exponentialRampToValueAtTime(4e3,o+2),n.Q.value=8,r.gain.setValueAtTime(0,o),r.gain.linearRampToValueAtTime(.15,o+1),r.gain.linearRampToValueAtTime(0,o+2),a.connect(n),n.connect(r),r.connect(this.stormGain),a.start(o),a.stop(o+2.1)};this.musicIntervals.push(setInterval(t,2e3)),t();const e=()=>{if(!this.ctx||!this.stormGain||!this.isStormMode)return;const o=this.ctx.currentTime,a=this.ctx.createOscillator(),n=this.ctx.createGain();a.type="sine",a.frequency.setValueAtTime(80,o),a.frequency.exponentialRampToValueAtTime(25,o+.5),n.gain.setValueAtTime(.4,o),n.gain.exponentialRampToValueAtTime(.01,o+.6),a.connect(n),n.connect(this.stormGain),a.start(o),a.stop(o+.7)};this.musicIntervals.push(setInterval(e,500));const i=()=>{if(!this.ctx||!this.stormGain||!this.isStormMode)return;const o=this.ctx.currentTime,a=this.ctx.sampleRate*1,n=this.ctx.createBuffer(1,a,this.ctx.sampleRate),r=n.getChannelData(0);for(let u=0;u<a;u++)r[u]=Math.random()*2-1;const c=this.ctx.createBufferSource();c.buffer=n;const h=this.ctx.createBiquadFilter();h.type="bandpass",h.frequency.setValueAtTime(500,o),h.frequency.exponentialRampToValueAtTime(8e3,o+.5),h.frequency.exponentialRampToValueAtTime(500,o+1),h.Q.value=5;const l=this.ctx.createGain();l.gain.setValueAtTime(0,o),l.gain.linearRampToValueAtTime(.1,o+.25),l.gain.linearRampToValueAtTime(.1,o+.75),l.gain.linearRampToValueAtTime(0,o+1),c.connect(h),h.connect(l),l.connect(this.stormGain),c.start(o),c.stop(o+1.1)};this.musicIntervals.push(setInterval(i,1e3)),i();const s=()=>{if(!this.ctx||!this.stormGain||!this.isStormMode)return;const o=this.ctx.currentTime,a=this.ctx.sampleRate*.02,n=this.ctx.createBuffer(1,a,this.ctx.sampleRate),r=n.getChannelData(0);for(let u=0;u<a;u++)r[u]=Math.random()*2-1;const c=this.ctx.createBufferSource();c.buffer=n;const h=this.ctx.createBiquadFilter();h.type="highpass",h.frequency.value=1e4;const l=this.ctx.createGain();l.gain.setValueAtTime(.12,o),l.gain.exponentialRampToValueAtTime(.001,o+.02),c.connect(h),h.connect(l),l.connect(this.stormGain),c.start(o),c.stop(o+.03)};this.musicIntervals.push(setInterval(s,119))}deactivateStormMode(){this.isStormMode&&(this.isStormMode=!1,this.stormGain&&this.ctx&&this.stormGain.gain.linearRampToValueAtTime(0,this.ctx.currentTime+1),setTimeout(()=>{this.stormGain=null},1100))}playBossGreenMusic(){if(!this.ctx||!this.musicGain)return;const t=[55,55,110,55,82.4,110,73.4,55],e=[0,0,1,0,1,1,0,1];let i=0;const s=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green")return;const c=this.ctx.currentTime,h=this.ctx.createOscillator(),l=this.ctx.createOscillator(),u=this.ctx.createBiquadFilter(),p=this.ctx.createGain();h.type="sawtooth",l.type="square";const m=t[i];h.frequency.value=m,l.frequency.value=m*1.01,u.type="lowpass",u.Q.value=22;const f=e[i]===1,g=150+Math.random()*100,v=1200+Math.random()*800;u.frequency.setValueAtTime(g,c),u.frequency.exponentialRampToValueAtTime(v,c+.03),u.frequency.exponentialRampToValueAtTime(f?v*.7:200,c+.1);const x=i%4===0?.35:.2;p.gain.setValueAtTime(x,c),p.gain.exponentialRampToValueAtTime(.01,c+.12),h.connect(u),l.connect(u),u.connect(p),p.connect(this.musicGain),h.start(c),l.start(c),h.stop(c+.15),l.stop(c+.15),i=(i+1)%t.length};this.musicIntervals.push(setInterval(s,100));const o=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green")return;const c=this.ctx.currentTime,h=this.ctx.createOscillator(),l=this.ctx.createOscillator(),u=this.ctx.createGain(),p=this.ctx.createGain();h.type="sine",h.frequency.setValueAtTime(180,c),h.frequency.exponentialRampToValueAtTime(35,c+.08),l.type="triangle",l.frequency.value=1500,u.gain.setValueAtTime(.5,c),u.gain.exponentialRampToValueAtTime(.01,c+.25),p.gain.setValueAtTime(.15,c),p.gain.exponentialRampToValueAtTime(.001,c+.02),h.connect(u),l.connect(p),u.connect(this.musicGain),p.connect(this.musicGain),h.start(c),l.start(c),h.stop(c+.3),l.stop(c+.03)};this.musicIntervals.push(setInterval(o,400));let a=0;const n=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green")return;const c=this.ctx.currentTime,h=this.createNoise(.04),l=this.ctx.createBiquadFilter(),u=this.ctx.createGain();l.type="highpass",l.frequency.value=9e3;const p=a%2===1;u.gain.setValueAtTime(p?.12:.06,c),u.gain.exponentialRampToValueAtTime(.001,c+.04),h.connect(l),l.connect(u),u.connect(this.musicGain),a++};this.musicIntervals.push(setInterval(n,207));const r=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green")return;const c=this.ctx.currentTime,h=this.ctx.createOscillator(),l=this.ctx.createBiquadFilter(),u=this.ctx.createGain();h.type="sawtooth",h.frequency.setValueAtTime(200+Math.random()*100,c),h.frequency.exponentialRampToValueAtTime(800+Math.random()*400,c+.3),l.type="bandpass",l.frequency.setValueAtTime(500,c),l.frequency.exponentialRampToValueAtTime(3e3,c+.3),l.Q.value=10,u.gain.setValueAtTime(.1,c),u.gain.linearRampToValueAtTime(.15,c+.15),u.gain.exponentialRampToValueAtTime(.01,c+.4),h.connect(l),l.connect(u),u.connect(this.musicGain),h.start(c),h.stop(c+.4)};this.musicIntervals.push(setInterval(r,1656))}playBossBlackMusic(){if(!this.ctx||!this.musicGain)return;const t=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_black")return;const l=this.ctx.currentTime,u=this.ctx.createOscillator(),p=this.ctx.createOscillator(),m=this.ctx.createWaveShaper(),f=this.ctx.createGain();u.type="sine",u.frequency.setValueAtTime(200,l),u.frequency.exponentialRampToValueAtTime(50,l+.04),u.frequency.exponentialRampToValueAtTime(30,l+.15),p.type="sine",p.frequency.setValueAtTime(60,l),p.frequency.exponentialRampToValueAtTime(25,l+.25);const g=new Float32Array(256);for(let v=0;v<256;v++){const x=v/128-1;g[v]=Math.tanh(x*8)}m.curve=g,f.gain.setValueAtTime(.9,l),f.gain.exponentialRampToValueAtTime(.01,l+.3),u.connect(m),p.connect(f),m.connect(f),f.connect(this.musicGain),u.start(l),u.stop(l+.3),p.start(l),p.stop(l+.35)};this.musicIntervals.push(setInterval(t,461));const e=[36.7,36.7,32.7,36.7,41.2,36.7,32.7,29.1];let i=0;const s=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_black")return;const l=this.ctx.currentTime,u=e[i],p=this.ctx.createOscillator(),m=this.ctx.createBiquadFilter(),f=this.ctx.createGain();p.type="sawtooth",p.frequency.value=u,m.type="lowpass",m.frequency.setValueAtTime(400,l),m.frequency.exponentialRampToValueAtTime(80,l+.3),m.Q.value=10,f.gain.setValueAtTime(.35,l),f.gain.exponentialRampToValueAtTime(.01,l+.4),p.connect(m),m.connect(f),f.connect(this.musicGain),p.start(l),p.stop(l+.45);for(let g=1;g<=3;g++){const v=this.ctx.createOscillator(),x=this.ctx.createBiquadFilter(),d=this.ctx.createGain(),b=l+g*.15,w=.15/g;v.type="sine",v.frequency.value=u,x.type="lowpass",x.frequency.value=200-g*40,d.gain.setValueAtTime(w,b),d.gain.exponentialRampToValueAtTime(.001,b+.25),v.connect(x),x.connect(d),d.connect(this.musicGain),v.start(b),v.stop(b+.3)}i=(i+1)%e.length};this.musicIntervals.push(setInterval(s,461));const o=[{type:"kick",vol:1},{type:"none",vol:0},{type:"hat",vol:.6},{type:"none",vol:0},{type:"snare",vol:1},{type:"none",vol:0},{type:"hat",vol:.5},{type:"kick",vol:.8},{type:"none",vol:0},{type:"none",vol:0},{type:"hat",vol:.7},{type:"none",vol:0},{type:"snare",vol:1},{type:"none",vol:0},{type:"hat",vol:.5},{type:"kick",vol:.7}];let a=0;const n=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_black")return;const l=this.ctx.currentTime,u=o[a];if(u.type==="kick"){const p=this.ctx.createOscillator(),m=this.ctx.createGain();p.type="sine",p.frequency.setValueAtTime(180,l),p.frequency.exponentialRampToValueAtTime(60,l+.03),p.frequency.exponentialRampToValueAtTime(40,l+.08),m.gain.setValueAtTime(.5*u.vol,l),m.gain.exponentialRampToValueAtTime(.01,l+.12),p.connect(m),m.connect(this.musicGain),p.start(l),p.stop(l+.15)}else if(u.type==="snare"){const p=this.ctx.createOscillator(),m=this.ctx.createGain();p.type="triangle",p.frequency.setValueAtTime(250,l),p.frequency.exponentialRampToValueAtTime(150,l+.02),m.gain.setValueAtTime(.2*u.vol,l),m.gain.exponentialRampToValueAtTime(.01,l+.08),p.connect(m),m.connect(this.musicGain),p.start(l),p.stop(l+.1);const f=this.ctx.sampleRate*.1,g=this.ctx.createBuffer(1,f,this.ctx.sampleRate),v=g.getChannelData(0);for(let w=0;w<f;w++)v[w]=(Math.random()*2-1)*Math.exp(-w/(this.ctx.sampleRate*.025));const x=this.ctx.createBufferSource();x.buffer=g;const d=this.ctx.createBiquadFilter();d.type="bandpass",d.frequency.value=3e3,d.Q.value=1;const b=this.ctx.createGain();b.gain.setValueAtTime(.35*u.vol,l),b.gain.exponentialRampToValueAtTime(.01,l+.1),x.connect(d),d.connect(b),b.connect(this.musicGain),x.start(l),x.stop(l+.12)}else if(u.type==="hat"){const p=this.ctx.sampleRate*.04,m=this.ctx.createBuffer(1,p,this.ctx.sampleRate),f=m.getChannelData(0);for(let d=0;d<p;d++)f[d]=Math.random()*2-1;const g=this.ctx.createBufferSource();g.buffer=m;const v=this.ctx.createBiquadFilter();v.type="highpass",v.frequency.value=7e3;const x=this.ctx.createGain();x.gain.setValueAtTime(.15*u.vol,l),x.gain.exponentialRampToValueAtTime(.001,l+.035),g.connect(v),v.connect(x),x.connect(this.musicGain),g.start(l),g.stop(l+.045)}a=(a+1)%o.length};this.musicIntervals.push(setInterval(n,115));const r=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_black")return;const l=this.ctx.currentTime,u=[146.8,174.6,220];for(const p of u){const m=this.ctx.createOscillator(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();m.type="sawtooth",m.frequency.value=p,f.type="lowpass",f.frequency.setValueAtTime(2e3,l),f.frequency.exponentialRampToValueAtTime(300,l+.2),f.Q.value=5,g.gain.setValueAtTime(.08,l),g.gain.exponentialRampToValueAtTime(.001,l+.25),m.connect(f),f.connect(g),g.connect(this.musicGain),m.start(l),m.stop(l+.3);for(let v=1;v<=5;v++){const x=this.ctx.createOscillator(),d=this.ctx.createBiquadFilter(),b=this.ctx.createGain(),w=l+v*.18;x.type="sine",x.frequency.value=p,d.type="lowpass",d.frequency.value=800-v*120,b.gain.setValueAtTime(.04/v,w),b.gain.exponentialRampToValueAtTime(.001,w+.2),x.connect(d),d.connect(b),b.connect(this.musicGain),x.start(w),x.stop(w+.25)}}};this.musicIntervals.push(setInterval(r,1844));const c=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_black")return;const l=this.ctx.currentTime,u=this.ctx.createOscillator(),p=this.ctx.createOscillator(),m=this.ctx.createGain(),f=this.ctx.createGain();u.type="sine",u.frequency.value=36.7,p.type="sine",p.frequency.value=.2,m.gain.value=3,p.connect(m),m.connect(u.frequency),f.gain.setValueAtTime(0,l),f.gain.linearRampToValueAtTime(.25,l+1),f.gain.linearRampToValueAtTime(.2,l+3),f.gain.linearRampToValueAtTime(0,l+4),u.connect(f),f.connect(this.musicGain),p.start(l),u.start(l),p.stop(l+4.5),u.stop(l+4.5)};c(),this.musicIntervals.push(setInterval(c,3688));const h=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_black"||Math.random()>.5)return;const l=this.ctx.currentTime,u=this.ctx.createOscillator(),p=this.ctx.createBiquadFilter(),m=this.ctx.createGain();u.type="sawtooth",Math.random()>.5?(u.frequency.setValueAtTime(100,l),u.frequency.exponentialRampToValueAtTime(800,l+1)):(u.frequency.setValueAtTime(600,l),u.frequency.exponentialRampToValueAtTime(50,l+1.5)),p.type="lowpass",p.frequency.setValueAtTime(3e3,l),p.frequency.exponentialRampToValueAtTime(200,l+1.5),p.Q.value=8,m.gain.setValueAtTime(.1,l),m.gain.exponentialRampToValueAtTime(.001,l+1.5),u.connect(p),p.connect(m),m.connect(this.musicGain),u.start(l),u.stop(l+1.6)};this.musicIntervals.push(setInterval(h,3688))}playVortexRiser(){if(!this.ctx||!this.musicGain)return;const t=this.ctx.currentTime,e=2,i=this.ctx.sampleRate*e,s=this.ctx.createBuffer(1,i,this.ctx.sampleRate),o=s.getChannelData(0);for(let p=0;p<i;p++)o[p]=Math.random()*2-1;const a=this.ctx.createBufferSource();a.buffer=s;const n=this.ctx.createBiquadFilter();n.type="bandpass",n.frequency.setValueAtTime(200,t),n.frequency.exponentialRampToValueAtTime(8e3,t+e),n.Q.value=5;const r=this.ctx.createGain();r.gain.setValueAtTime(0,t),r.gain.linearRampToValueAtTime(.3,t+e*.8),r.gain.linearRampToValueAtTime(.5,t+e),a.connect(n),n.connect(r),r.connect(this.musicGain),a.start(t),a.stop(t+e+.1);const c=this.ctx.createOscillator(),h=this.ctx.createBiquadFilter(),l=this.ctx.createGain();c.type="sawtooth",c.frequency.setValueAtTime(50,t),c.frequency.exponentialRampToValueAtTime(400,t+e),h.type="lowpass",h.frequency.setValueAtTime(100,t),h.frequency.exponentialRampToValueAtTime(2e3,t+e),h.Q.value=8,l.gain.setValueAtTime(0,t),l.gain.linearRampToValueAtTime(.25,t+e),c.connect(h),h.connect(l),l.connect(this.musicGain),c.start(t),c.stop(t+e+.1);const u=(p,m)=>{if(!this.ctx||!this.musicGain)return;const f=this.ctx.createOscillator(),g=this.ctx.createGain();f.type="sine",f.frequency.setValueAtTime(100,p),f.frequency.exponentialRampToValueAtTime(30,p+.1),g.gain.setValueAtTime(m,p),g.gain.exponentialRampToValueAtTime(.001,p+.15),f.connect(g),g.connect(this.musicGain),f.start(p),f.stop(p+.2)};u(t+.5,.15),u(t+1,.2),u(t+1.3,.25),u(t+1.5,.3),u(t+1.65,.35),u(t+1.8,.4),u(t+1.9,.45)}playBossBlueMusic(){if(!this.ctx||!this.musicGain)return;const t=[110,110,146.8,164.8,110,130.8,146.8,110];let e=0;const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_blue")return;const c=this.ctx.currentTime,h=this.ctx.createOscillator(),l=this.ctx.createGain(),u=this.ctx.createBiquadFilter();h.type="square",h.frequency.value=t[e],u.type="lowpass",u.frequency.setValueAtTime(800,c),u.frequency.exponentialRampToValueAtTime(200,c+.2),l.gain.setValueAtTime(.15,c),l.gain.linearRampToValueAtTime(0,c+.2),h.connect(u),u.connect(l),l.connect(this.musicGain),h.start(c),h.stop(c+.25),e=(e+1)%t.length};this.musicIntervals.push(setInterval(i,250));const s=[880,1046,1318,1567,1318,1046];let o=0;const a=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_blue")return;const c=this.ctx.currentTime,h=this.ctx.createOscillator(),l=this.ctx.createGain();h.type="triangle",h.frequency.value=s[o],l.gain.setValueAtTime(.08,c),l.gain.exponentialRampToValueAtTime(.001,c+.1),h.connect(l),l.connect(this.musicGain),h.start(c),h.stop(c+.12),o=(o+1)%s.length};this.musicIntervals.push(setInterval(a,125));const n=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_blue")return;const c=this.ctx.currentTime,h=this.ctx.createOscillator(),l=this.ctx.createGain();h.type="sawtooth",h.frequency.setValueAtTime(2e3,c),h.frequency.exponentialRampToValueAtTime(100,c+.15),l.gain.setValueAtTime(.1,c),l.gain.exponentialRampToValueAtTime(.001,c+.15),h.connect(l),l.connect(this.musicGain),h.start(c),h.stop(c+.15)};this.musicIntervals.push(setInterval(n,500+Math.random()*300));const r=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_blue")return;const c=this.ctx.currentTime,h=this.ctx.createOscillator(),l=this.ctx.createGain();h.type="sine",h.frequency.setValueAtTime(150,c),h.frequency.exponentialRampToValueAtTime(50,c+.1),l.gain.setValueAtTime(.2,c),l.gain.exponentialRampToValueAtTime(.001,c+.15),h.connect(l),l.connect(this.musicGain),h.start(c),h.stop(c+.15)};this.musicIntervals.push(setInterval(r,500))}playBassline(){if(!this.ctx||!this.musicGain)return;const t=[55,55,73.4,82.4];let e=0;const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal")return;const s=this.ctx.currentTime,o=this.ctx.createOscillator(),a=this.ctx.createOscillator(),n=this.ctx.createGain(),r=this.ctx.createBiquadFilter();o.type="sawtooth",o.frequency.value=t[e],a.type="square",a.frequency.value=t[e]*1.005,r.type="lowpass",r.frequency.setValueAtTime(300,s),r.frequency.linearRampToValueAtTime(150,s+.8),n.gain.setValueAtTime(.2,s),n.gain.linearRampToValueAtTime(.15,s+.1),n.gain.linearRampToValueAtTime(0,s+.9),o.connect(r),a.connect(r),r.connect(n),n.connect(this.musicGain),o.start(s),o.stop(s+1),a.start(s),a.stop(s+1),e=(e+1)%t.length,setTimeout(i,1e3)};i()}playArpeggio(){if(!this.ctx||!this.musicGain)return;const t=[440,523,587,659,784,659,587,523];let e=0;const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal")return;const s=this.ctx.currentTime,o=this.ctx.createOscillator(),a=this.ctx.createGain(),n=this.ctx.createBiquadFilter(),r=this.ctx.createDelay(),c=this.ctx.createGain();o.type="square",o.frequency.value=t[e],n.type="lowpass",n.frequency.setValueAtTime(2e3,s),n.frequency.exponentialRampToValueAtTime(500,s+.15),n.Q.value=5,a.gain.setValueAtTime(.08,s),a.gain.exponentialRampToValueAtTime(.01,s+.12),r.delayTime.value=.25,c.gain.value=.3,o.connect(n),n.connect(a),a.connect(this.musicGain),a.connect(r),r.connect(c),c.connect(this.musicGain),c.connect(this.reverb),o.start(s),o.stop(s+.15),e=(e+1)%t.length,setTimeout(i,125)};setTimeout(i,2e3)}playPad(){if(!this.ctx||!this.musicGain)return;const t=[[220,261.6,329.6],[196,246.9,293.7],[174.6,220,261.6],[164.8,196,246.9]];let e=0;const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal")return;const s=this.ctx.currentTime;t[e].forEach((a,n)=>{const r=this.ctx.createOscillator(),c=this.ctx.createOscillator(),h=this.ctx.createGain(),l=this.ctx.createBiquadFilter();r.type="sawtooth",r.frequency.value=a,c.type="triangle",c.frequency.value=a*1.002,l.type="lowpass",l.frequency.value=800,l.Q.value=1,h.gain.setValueAtTime(0,s),h.gain.linearRampToValueAtTime(.03,s+1),h.gain.linearRampToValueAtTime(.03,s+3),h.gain.linearRampToValueAtTime(0,s+4),r.connect(l),c.connect(l),l.connect(h),h.connect(this.musicGain),h.connect(this.reverb),r.start(s+n*.1),r.stop(s+4.5),c.start(s+n*.1),c.stop(s+4.5)}),e=(e+1)%t.length,setTimeout(i,4e3)};setTimeout(i,500)}playDrums(){if(!this.ctx||!this.musicGain)return;let t=0;const e=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal")return;const i=this.ctx.currentTime;if(t%4===0||t%4===2){const n=this.ctx.createOscillator(),r=this.ctx.createGain();n.type="sine",n.frequency.setValueAtTime(150,i),n.frequency.exponentialRampToValueAtTime(40,i+.1),r.gain.setValueAtTime(.3,i),r.gain.exponentialRampToValueAtTime(.01,i+.15),n.connect(r),r.connect(this.musicGain),n.start(i),n.stop(i+.2)}if(t%4===1||t%4===3){const n=this.createNoise(.15),r=this.ctx.createGain(),c=this.ctx.createBiquadFilter();c.type="highpass",c.frequency.value=1e3,r.gain.setValueAtTime(.15,i),r.gain.exponentialRampToValueAtTime(.01,i+.1),n.connect(c),c.connect(r),r.connect(this.musicGain);const h=this.ctx.createOscillator(),l=this.ctx.createGain();h.type="triangle",h.frequency.value=180,l.gain.setValueAtTime(.1,i),l.gain.exponentialRampToValueAtTime(.01,i+.08),h.connect(l),l.connect(this.musicGain),h.start(i),h.stop(i+.1)}const s=this.createNoise(.03),o=this.ctx.createGain(),a=this.ctx.createBiquadFilter();a.type="highpass",a.frequency.value=8e3,o.gain.setValueAtTime(t%2===0?.08:.04,i),o.gain.exponentialRampToValueAtTime(.01,i+.03),s.connect(a),a.connect(o),o.connect(this.musicGain),t=(t+1)%16,setTimeout(e,250)};setTimeout(e,1e3)}stop(){this.arpInterval&&clearInterval(this.arpInterval),this.ctx&&(this.ctx.close(),this.ctx=null),this.isStarted=!1}}const X=`#version 300 es
precision highp float;

in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`,j=`#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_cameraPos;
uniform float u_cameraYaw;
uniform float u_cameraPitch;
uniform vec4 u_targets[16];
uniform int u_targetCount;
uniform float u_muzzleFlash;
uniform vec4 u_pools[8]; // Токсичные лужи [x, z, radius, lifetime]
uniform int u_poolCount;
uniform vec4 u_acidProjectiles[4]; // Летящие снаряды кислоты [x, y, z, progress]
uniform int u_acidProjectileCount;
uniform vec4 u_acidRainZones[4]; // Зоны кислотного дождя [x, z, radius, state]
uniform int u_acidRainZoneCount;
uniform int u_era; // Эпоха: 1=кислотная, 2=чёрная дыра, 3=космическая
uniform int u_wave; // Текущая волна (для эффекта дождя на 15+)
uniform vec4 u_pickups[8]; // Пикапы [x, y, z, type] type: 9=health, 10=stimpack, 11=charge
uniform int u_pickupCount;
uniform vec4 u_crystals[6]; // Кристаллы силы [x, z, height, active]

in vec2 v_uv;
out vec4 fragColor;

// === ОПТИМИЗИРОВАННЫЕ ПАРАМЕТРЫ ===
#define MAX_STEPS 20
#define MAX_DIST 40.0
#define SURF_DIST 0.03
#define PI 3.14159265

// === РАЗМЕРЫ АРЕНЫ ===
#define ARENA_RADIUS 28.0
#define DOME_HEIGHT 18.0
#define POOL_RADIUS 8.0
#define POOL_DEPTH 2.0
// Малые бассейны удалены для упрощения
#define PLATFORM_HEIGHT 2.0
#define PLATFORM_X 20.0
#define BRIDGE_WIDTH 3.0

// === NOISE ===
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1, 0)), f.x),
    mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x),
    f.y
  );
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

// === СЦЕНА ===
float map(vec3 p) {
  float d = MAX_DIST;
  materialId = 0;
  
  float distFromCenter = length(p.xz);
  
  // === ПОЛ ===
  float floor_d = p.y;
  d = min(d, floor_d);
  
  // === ТОКСИЧНЫЕ ЛУЖИ (оптимизировано) ===
  for (int i = 0; i < u_poolCount; i++) {
    if (i >= 8) break;
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
  
  // === ЗОНЫ КИСЛОТНОГО ДОЖДЯ (оптимизировано) ===
  for (int i = 0; i < u_acidRainZoneCount; i++) {
    if (i >= 4) break;
    vec4 zone = u_acidRainZones[i];
    float state = zone.w;
    
    if (state < 1.0 && p.y < 0.1 && p.y > -0.05) {
      float distToZone = length(p.xz - zone.xy);
      float markRadius = zone.z * (0.3 + state * 1.4);
      
      if (distToZone < markRadius) {
        // Простые кольца + пульсация
        float ring = smoothstep(0.2, 0.0, abs(distToZone - markRadius * 0.85));
        float pulse = sin(u_time * 10.0) * 0.5 + 0.5;
        float center = step(distToZone, markRadius * 0.3) * pulse;
        
        if (ring + center > 0.3) {
          d = p.y - 0.02;
          materialId = 20;
        }
      }
    }
  }
  
  // === ЛЕТЯЩИЕ СНАРЯДЫ КИСЛОТЫ ===
  for (int i = 0; i < u_acidProjectileCount; i++) {
    if (i >= 4) break;
    vec4 proj = u_acidProjectiles[i];
    vec3 projPos = proj.xyz;
    float progress = proj.w;
    
    if (progress > 0.0 && progress < 1.0) {
      // Основная сфера кислоты
      float projSphere = length(p - projPos) - 0.5;
      if (projSphere < d) {
        d = projSphere;
        materialId = 19; // Снаряд кислоты
      }
      
      // Хвост из капель
      for (int j = 1; j <= 3; j++) {
        vec3 tailPos = projPos - vec3(0.0, float(j) * 0.4, 0.0);
        float tailDrop = length(p - tailPos) - (0.3 - float(j) * 0.08);
        if (tailDrop < d) {
          d = tailDrop;
          materialId = 19;
        }
      }
    }
  }
  
  // === ПИКАПЫ ===
  for (int i = 0; i < u_pickupCount; i++) {
    if (i >= 8) break;
    vec4 pickup = u_pickups[i];
    float pType = pickup.w;
    
    if (pType > 0.0) {
      vec3 pickupPos = pickup.xyz;
      float pickupDist = length(p - pickupPos);
      
      // Парящая сфера/куб
      if (pType == 9.0) {
        // Аптечка - красный крест (сфера + кубы)
        float sphere = length(p - pickupPos) - 0.4;
        // Простая сфера для производительности
        if (sphere < d) {
          d = sphere;
          materialId = 14; // Аптечка
        }
      } else if (pType == 10.0) {
        // Стимпак - жёлтая звезда (сфера)
        float sphere = length(p - pickupPos) - 0.35;
        if (sphere < d) {
          d = sphere;
          materialId = 15; // Стимпак
        }
      } else if (pType == 11.0) {
        // Заряд катаны - энергетическая сфера
        float chargeSphere = length(p - pickupPos) - 0.5;
        if (chargeSphere < d) {
          d = chargeSphere;
          materialId = 17; // Заряд
        }
      }
    }
  }
  
  // === КРУГЛЫЕ СТЕНЫ (цилиндр вовнутрь) ===
  float walls = -(length(p.xz) - ARENA_RADIUS);
  d = min(d, walls);
  
  // === КУПОЛ ===
  // Сферический купол над ареной
  float domeRadius = ARENA_RADIUS * 1.3;
  float dome = -(length(vec3(p.x, p.y - 3.0, p.z)) - domeRadius);
  dome = max(dome, p.y - DOME_HEIGHT);
  d = min(d, dome);
  
  // === ЦЕНТРАЛЬНАЯ КОЛОННА (фонтан) ===
  float centerCol = sdCylinder(p - vec3(0.0, 1.5, 0.0), 1.2, 1.5);
  d = min(d, centerCol);
  
  // Чаша фонтана
  float fountain = sdTorus(p - vec3(0.0, 0.3, 0.0), vec2(1.8, 0.25));
  d = min(d, fountain);
  
  // === ЦЕНТРАЛЬНЫЙ БАССЕЙН ===
  float poolDist = distFromCenter;
  if (poolDist < POOL_RADIUS + 1.0 && poolDist > 2.5 && p.y < 0.5) {
    // Дно бассейна
    float poolBottom = p.y + POOL_DEPTH;
    
    // Бортик бассейна
    float rim = sdTorus(p - vec3(0.0, 0.15, 0.0), vec2(POOL_RADIUS, 0.3));
    d = min(d, rim);
    
    // Не пробиваем дно если внутри бассейна
    if (poolDist < POOL_RADIUS - 0.3) {
      d = min(d, poolBottom);
    }
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
  
  // === ПЛАТФОРМЫ С ЛЕСТНИЦАМИ ===
  // Левая платформа (X от -17 до -23)
  float leftPlat = sdBox(p - vec3(-20.0, PLATFORM_HEIGHT * 0.5, 0.0), 
                         vec3(3.0, PLATFORM_HEIGHT * 0.5, 5.0));
  d = min(d, leftPlat);
  
  // Лестница к левой платформе (X от -16 до -17, Z в центре)
  float stairsL = sdBox(p - vec3(-16.5, PLATFORM_HEIGHT * 0.25, 0.0), 
                        vec3(0.5, PLATFORM_HEIGHT * 0.25 + 0.1, 2.5));
  // Рампа вместо ступенек для простоты
  d = min(d, stairsL);
  
  // Правая платформа (X от 17 до 23)
  float rightPlat = sdBox(p - vec3(20.0, PLATFORM_HEIGHT * 0.5, 0.0), 
                          vec3(3.0, PLATFORM_HEIGHT * 0.5, 5.0));
  d = min(d, rightPlat);
  
  // Лестница к правой платформе (X от 16 до 17)
  float stairsR = sdBox(p - vec3(16.5, PLATFORM_HEIGHT * 0.25, 0.0), 
                        vec3(0.5, PLATFORM_HEIGHT * 0.25 + 0.1, 2.5));
  d = min(d, stairsR);
  
  // Перила платформ
  float railL = sdBox(p - vec3(-17.2, PLATFORM_HEIGHT + 0.5, 0.0), vec3(0.1, 0.5, 5.0));
  float railR = sdBox(p - vec3(17.2, PLATFORM_HEIGHT + 0.5, 0.0), vec3(0.1, 0.5, 5.0));
  d = min(d, min(railL, railR));
  
  // === КОЛОННЫ (только 2 у платформ) ===
  float colD = sdCylinder(p - vec3(22.0, 4.0, 0.0), 0.5, 4.0);
  colD = min(colD, sdCylinder(p - vec3(-22.0, 4.0, 0.0), 0.5, 4.0));
  d = min(d, colD);
  
  // === КРУГЛЫЕ ПЛАТФОРМЫ ДЛЯ ПАРКУРА (спираль по кругу) ===
  // 6 платформ по кругу с радиусом 10м, парящие вверх-вниз
  float bob1 = sin(u_time * 1.5 + 0.0) * 0.3;
  float bob2 = sin(u_time * 1.5 + 0.8) * 0.3;
  float bob3 = sin(u_time * 1.5 + 1.6) * 0.3;
  float bob4 = sin(u_time * 1.5 + 2.4) * 0.3;
  float bob5 = sin(u_time * 1.5 + 3.2) * 0.3;
  float bob6 = sin(u_time * 1.5 + 4.0) * 0.3;
  
  float jp1 = sdCylinder(p - vec3(10.0, 1.8 + bob1, 0.0), 1.5, 0.25);
  float jp2 = sdCylinder(p - vec3(5.0, 3.0 + bob2, 8.66), 1.4, 0.25);
  float jp3 = sdCylinder(p - vec3(-5.0, 4.2 + bob3, 8.66), 1.4, 0.25);
  float jp4 = sdCylinder(p - vec3(-10.0, 5.4 + bob4, 0.0), 1.3, 0.25);
  float jp5 = sdCylinder(p - vec3(-5.0, 6.6 + bob5, -8.66), 1.3, 0.25);
  float jp6 = sdCylinder(p - vec3(5.0, 7.8 + bob6, -8.66), 1.2, 0.25);
  
  float jumpPlats = min(jp1, min(jp2, min(jp3, min(jp4, min(jp5, jp6)))));
  if (jumpPlats < d) {
    d = jumpPlats;
    materialId = 16;
  }
  
  // Верхняя платформа с бафом (в центре над фонтаном), парит медленнее
  float topBob = sin(u_time * 1.0) * 0.2;
  float topPlat = sdCylinder(p - vec3(0.0, 9.5 + topBob, 0.0), 2.5, 0.35);
  if (topPlat < d) {
    d = topPlat;
    materialId = 16;
  }
  
  // Свечение под верхней платформой
  float glowRing = sdTorus(p - vec3(0.0, 9.0, 0.0), vec2(2.0, 0.12));
  if (glowRing < d) {
    d = glowRing;
    materialId = 17;
  }

  // === КРИСТАЛЛЫ СИЛЫ (только на волне 10) ===
  if (u_wave == 10) {
    for (int i = 0; i < 6; i++) {
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
  
  // === ВОДА ===
  // Центральный бассейн (только визуально, не пройти - коллизия блокирует)
  if (distFromCenter > 2.5 && distFromCenter < POOL_RADIUS - 0.3) {
    // Проверяем что не на мосту
    bool onBridge = (abs(p.z) < BRIDGE_WIDTH * 0.5) || (abs(p.x) < BRIDGE_WIDTH * 0.5);
    if (!onBridge) {
      float waterY = 0.0 + waterWaves(p.xz, u_time) * 0.05;
      float waterPlane = p.y - waterY;
      if (waterPlane < d && waterPlane > -0.3) {
        d = max(waterPlane, 0.001);
        materialId = 1;
      }
    }
  }
  
  // Фонтан в центре (декоративная вода)
  float fountainWater = length(p.xz);
  if (fountainWater < 1.8 && fountainWater > 1.3) {
    float waterY = 0.4 + waterWaves(p.xz * 3.0, u_time * 2.0) * 0.02;
    float waterPlane = p.y - waterY;
    if (waterPlane < d && waterPlane > -0.1) {
      d = max(waterPlane, 0.001);
      materialId = 1;
    }
  }
  
  // === ВРАГИ ===
  // w: 0=неактивен, 1-2=бейнлинг, 3-4=фантом, 5-6=runner, 7-8=hopper
  // 11-12=boss_green, 13-14=boss_black, 15-16=boss_blue
  for (int i = 0; i < u_targetCount; i++) {
    if (i >= 16) break;
    vec4 target = u_targets[i];
    if (target.w > 0.5) {
      vec3 tp = p - target.xyz;
      int enemyType = int(target.w / 2.0); // 0=baneling, 1=phantom, 2=runner, 3=hopper, 5=boss_green, 6=boss_black, 7=boss_blue
      
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
  
  return d;
}

// === RAY MARCHING ===
float rayMarch(vec3 ro, vec3 rd) {
  float d = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * d;
    float dist = map(p);
    d += dist * 0.9; // Небольшой overrelaxation для скорости
    if (dist < SURF_DIST || d > MAX_DIST) break;
  }
  return d;
}

vec3 getNormal(vec3 p) {
  vec2 e = vec2(0.02, 0.0); // Грубее но быстрее
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)
  ));
}

// === КАУСТИКИ ===
float caustics(vec2 p, float t) {
  float c = 0.0;
  for (float i = 1.0; i <= 3.0; i++) {
    vec2 uv = p * (1.0 + i * 0.3);
    uv += vec2(sin(t * 0.3 + i), cos(t * 0.4 + i * 1.1)) * 0.5;
    c += pow(0.5 + 0.5 * sin(noise(uv) * 6.0), 4.0);
  }
  return c / 3.0;
}

// === ЗВЁЗДНОЕ НЕБО (через купол) ===
vec3 renderSky(vec3 rd) {
  vec3 color = vec3(0.02, 0.03, 0.08);
  
  // Звёзды
  vec2 skyUV = rd.xz / (rd.y + 0.5);
  for (float i = 0.0; i < 50.0; i++) {
    vec2 starPos = vec2(hash(vec2(i, 0.0)), hash(vec2(i, 1.0))) * 4.0 - 2.0;
    float star = 0.002 / (length(skyUV - starPos) + 0.002);
    star *= step(0.7, hash(vec2(i, 2.0)));
    color += vec3(1.0, 0.95, 0.9) * star * 0.3;
  }
  
  // Луна
  vec3 moonDir = normalize(vec3(0.5, 0.8, -0.3));
  float moon = smoothstep(0.98, 0.99, dot(rd, moonDir));
  color += vec3(1.0, 0.98, 0.95) * moon * 2.0;
  
  // Свечение вокруг луны
  float moonGlow = pow(max(0.0, dot(rd, moonDir)), 32.0);
  color += vec3(0.3, 0.35, 0.5) * moonGlow * 0.5;
  
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
  float segments = 8.0;
  
  for (float i = 0.0; i < segments; i++) {
    float segY = 1.0 - i / segments;
    float nextY = 1.0 - (i + 1.0) / segments;
    
    // Случайное смещение для зигзага
    float nextX = x + (fract(sin((strikeTime + i) * 73.7) * 43758.5453) - 0.5) * 0.3;
    
    // Проверяем попадает ли пиксель в сегмент
    if (uv.y < segY && uv.y > nextY) {
      float t = (segY - uv.y) / (segY - nextY);
      float lineX = mix(x, nextX, t);
      float dist = abs(uv.x - lineX);
      
      // Яркое ядро + свечение
      bolt += smoothstep(0.02, 0.0, dist) * 2.0;
      bolt += smoothstep(0.08, 0.0, dist) * 0.5;
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

// Кислотный дождь - ОПТИМИЗИРОВАНО
vec3 renderAcidRain(vec2 uv, vec3 color, float time, vec3 camPos) {
  if (u_acidRainZoneCount == 0) return color;
  
  vec3 result = color;
  float totalIntensity = 0.0;
  
  // Проверяем только ближайшую активную зону
  for (int i = 0; i < u_acidRainZoneCount; i++) {
    if (i >= 4) break;
    vec4 zone = u_acidRainZones[i];
    if (zone.w >= 1.0) {
      float dist = length(camPos.xz - zone.xy);
      float intensity = 1.0 - smoothstep(0.0, zone.z * 2.0, dist);
      totalIntensity = max(totalIntensity, intensity);
    }
  }
  
  if (totalIntensity > 0.01) {
    // Простые быстрые капли (один расчёт)
    float dropY1 = fract(uv.y * 6.0 - time * 30.0);
    float dropX1 = fract(uv.x * 6.0);
    float streak1 = step(0.1, dropY1) * step(dropY1, 0.5) * step(0.45, dropX1) * step(dropX1, 0.55);
    
    float dropY2 = fract(uv.y * 10.0 - time * 25.0 + 0.3);
    float dropX2 = fract(uv.x * 10.0 + 0.1);
    float streak2 = step(0.15, dropY2) * step(dropY2, 0.4) * step(0.47, dropX2) * step(dropX2, 0.53);
    
    float drops = (streak1 + streak2 * 0.6) * totalIntensity;
    
    // Зелёное свечение
    result += vec3(0.2, 1.0, 0.3) * drops * 2.0;
    result = mix(result, result * vec3(0.7, 1.2, 0.8), totalIntensity * 0.3);
  }
  
  return result;
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

// === ГЛАВНАЯ ===
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
  
  float d = rayMarch(ro, rd);
  
  // Фоновый цвет (небо через купол)
  vec3 color = renderSky(rd) * 0.3;
  
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
      // ЭПОХА 1: Кислотная (зелёная токсичная)
      ambient = vec3(0.08, 0.15, 0.08);
      mainLight = vec3(0.3, 0.8, 0.3); // Зелёный свет
      accentColor = vec3(0.5, 1.0, 0.3); // Кислотный
      fogColor = vec3(0.02, 0.08, 0.02);
    } else if (u_era == 2) {
      // ЭПОХА 2: Чёрная дыра (тёмно-фиолетовая)
      ambient = vec3(0.06, 0.04, 0.12);
      mainLight = vec3(0.5, 0.3, 0.8); // Фиолетовый
      accentColor = vec3(0.8, 0.2, 1.0); // Пурпурный
      fogColor = vec3(0.03, 0.01, 0.06);
    } else {
      // ЭПОХА 3: Космическая (синяя технологичная)
      ambient = vec3(0.08, 0.12, 0.18);
      mainLight = vec3(0.4, 0.7, 1.0); // Синий
      accentColor = vec3(0.2, 0.8, 1.0); // Циан
      fogColor = vec3(0.01, 0.03, 0.08);
    }
    
    // Основной свет сверху
    float mainDot = max(dot(n, vec3(0.3, 0.9, -0.2)), 0.0);
    
    // Один тёплый источник (факел) - цвет меняется по эпохе
    vec3 torchPos = vec3(0.0, 8.0, 0.0);
    vec3 toTorch = torchPos - p;
    float torchDist = length(toTorch);
    float atten = 25.0 / (1.0 + torchDist * 0.05 + torchDist * torchDist * 0.008);
    vec3 torchLight = accentColor * max(dot(n, normalize(toTorch)), 0.0) * atten;
    
    // Подсветка бассейна - цвет по эпохе
    float distFromCenter = length(p.xz);
    float poolInfluence = 1.0 - smoothstep(0.0, 15.0, distFromCenter);
    vec3 poolLight = accentColor * poolInfluence * 2.0;
    
    // === МАТЕРИАЛЫ (упрощённые) ===
    if (mat == 1) {
      // === ВОДА (простая) ===
      vec3 waterColor = vec3(0.2, 0.55, 0.7);
      waterColor += poolLight;
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color = mix(waterColor, vec3(0.5, 0.8, 0.9), fresnel * 0.3);
      
    } else if (mat == 4) {
      // === БЕЙНЛИНГИ (зелёная кислотная жижа) ===
      vec3 acidGreen = vec3(0.2, 0.9, 0.1);
      vec3 darkGreen = vec3(0.0, 0.4, 0.0);
      
      float pulse = 0.7 + 0.3 * sin(u_time * 4.0 + p.x * 2.0);
      float pulse2 = 0.8 + 0.2 * sin(u_time * 6.0 + p.z * 3.0);
      float glow = 0.5 + 0.5 * sin(u_time * 3.0);
      
      color = mix(darkGreen, acidGreen, pulse * pulse2);
      color += vec3(0.3, 1.0, 0.2) * glow * 0.5;
      color *= 1.5;
      
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 3.0);
      color = mix(color, vec3(0.5, 1.0, 0.3), fresnel * 0.4);
      
    } else if (mat == 5) {
      // === ФАНТОМ (чёрный шар с тёмной энергией) ===
      vec3 voidBlack = vec3(0.02, 0.02, 0.05);
      vec3 darkPurple = vec3(0.1, 0.0, 0.15);
      
      float flicker = 0.6 + 0.4 * sin(u_time * 12.0 + p.x * 5.0);
      float flicker2 = 0.7 + 0.3 * sin(u_time * 15.0 + p.z * 4.0);
      
      color = mix(voidBlack, darkPurple, flicker * flicker2 * 0.3);
      
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      vec3 edgeGlow = vec3(0.3, 0.0, 0.5) * fresnel * 0.8;
      color += edgeGlow;
      
      float spark = sin(u_time * 20.0 + p.y * 10.0) * sin(u_time * 18.0 + p.x * 8.0);
      if (spark > 0.9) {
        color += vec3(0.5, 0.2, 0.8) * 0.5;
      }
      color *= 0.6;
      
    } else if (mat == 6) {
      // === RUNNER (оранжевый, огненный) ===
      vec3 orange = vec3(1.0, 0.5, 0.0);
      vec3 yellow = vec3(1.0, 0.9, 0.2);
      vec3 red = vec3(1.0, 0.2, 0.0);
      
      // Быстрое мерцание как пламя
      float flame = 0.5 + 0.5 * sin(u_time * 20.0 + p.x * 8.0);
      float flame2 = 0.6 + 0.4 * sin(u_time * 25.0 + p.z * 10.0);
      
      color = mix(red, orange, flame);
      color = mix(color, yellow, flame2 * 0.4);
      color *= 1.8; // Яркий!
      
      // Свечение по краям
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += vec3(1.0, 0.8, 0.3) * fresnel * 0.6;
      
    } else if (mat == 7) {
      // === HOPPER (синий, электрический) ===
      vec3 cyan = vec3(0.0, 0.8, 1.0);
      vec3 blue = vec3(0.1, 0.3, 1.0);
      vec3 white = vec3(0.9, 0.95, 1.0);
      
      // Электрические разряды
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
      // === АПТЕЧКА ===
      // Красный крест с белым свечением
      vec3 healthRed = vec3(1.0, 0.2, 0.2);
      vec3 healthWhite = vec3(1.0, 0.9, 0.9);
      
      // Пульсация
      float pulse = 0.7 + 0.3 * sin(u_time * 5.0);
      color = mix(healthRed, healthWhite, pulse * 0.3);
      
      // Яркое свечение
      color *= 2.5;
      
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
      // === МЕТКА ДОЖДЯ (оптимизировано) ===
      float pulse = sin(u_time * 10.0) * 0.5 + 0.5;
      color = mix(vec3(1.0, 0.2, 0.0), vec3(0.3, 1.0, 0.2), pulse);
      color *= 4.0;
      
    } else {
      // === ПОЛ / СТЕНЫ ===
      vec3 baseColor = vec3(0.15, 0.14, 0.12);
      
      // Простая плитка
      if (abs(n.y) > 0.9) {
        vec2 tile = fract(p.xz * 0.25);
        float tileEdge = step(0.04, min(min(tile.x, tile.y), min(1.0 - tile.x, 1.0 - tile.y)));
        baseColor *= 0.8 + 0.2 * tileEdge;
      }
      
      color = baseColor * ambient * 2.0;
      color += baseColor * mainLight * mainDot * 0.5;
      color += baseColor * torchLight * 1.2;
      color += baseColor * poolLight * 1.0;
    }
    
    // Вспышка от выстрела
    if (u_muzzleFlash > 0.0) {
      color += vec3(1.0, 0.7, 0.4) * u_muzzleFlash * 0.4;
    }
    
    // Туман по эпохе
    float fog = 1.0 - exp(-d * 0.02);
    color = mix(color, fogColor, fog * 0.5);
  }
  
  // Кислотный дождь от зелёного босса (всегда когда есть зоны)
  if (u_acidRainZoneCount > 0) {
    color = renderAcidRain(v_uv, color, u_time, u_cameraPos);
  }
  
  // Эффект дождя на волне 15+
  if (u_wave >= 15) {
    color = renderRain(v_uv, color, u_time);
  }
  
  // Тонмаппинг
  color = color / (color + vec3(1.0));
  color = pow(color, vec3(0.9));
  
  // Цветокоррекция - добавляем голубой оттенок для ночной атмосферы
  color = mix(color, color * vec3(0.9, 0.95, 1.1), 0.25);
  
  // Небольшое насыщение
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(gray), color, 1.15);
  
  // Виньетка
  float vig = 1.0 - length(v_uv - 0.5) * 0.4;
  color *= vig;
  
  fragColor = vec4(color, 1.0);
}
`;class N{constructor(t){this.canvas=t;const e=t.getContext("webgl2");if(!e)throw new Error("WebGL2 не поддерживается");this.gl=e,this.uniforms={resolution:null,time:null,cameraPos:null,cameraDir:null,cameraYaw:null,cameraPitch:null,targets:null,targetCount:null,muzzleFlash:null,pools:null,poolCount:null,acidProjectiles:null,acidProjectileCount:null,acidRainZones:null,acidRainZoneCount:null,era:null,wave:null,pickups:null,pickupCount:null,crystals:null,crystalCount:null},this.init()}gl;program=null;uniforms;vao=null;renderScale=.75;init(){const t=this.gl,e=this.compileShader(t.VERTEX_SHADER,X),i=this.compileShader(t.FRAGMENT_SHADER,j);if(!e||!i)throw new Error("Ошибка компиляции шейдеров");if(this.program=t.createProgram(),t.attachShader(this.program,e),t.attachShader(this.program,i),t.linkProgram(this.program),!t.getProgramParameter(this.program,t.LINK_STATUS))throw new Error("Ошибка линковки: "+t.getProgramInfoLog(this.program));this.uniforms.resolution=t.getUniformLocation(this.program,"u_resolution"),this.uniforms.time=t.getUniformLocation(this.program,"u_time"),this.uniforms.cameraPos=t.getUniformLocation(this.program,"u_cameraPos"),this.uniforms.cameraYaw=t.getUniformLocation(this.program,"u_cameraYaw"),this.uniforms.cameraPitch=t.getUniformLocation(this.program,"u_cameraPitch"),this.uniforms.targets=t.getUniformLocation(this.program,"u_targets"),this.uniforms.targetCount=t.getUniformLocation(this.program,"u_targetCount"),this.uniforms.muzzleFlash=t.getUniformLocation(this.program,"u_muzzleFlash"),this.uniforms.pools=t.getUniformLocation(this.program,"u_pools"),this.uniforms.poolCount=t.getUniformLocation(this.program,"u_poolCount"),this.uniforms.acidProjectiles=t.getUniformLocation(this.program,"u_acidProjectiles"),this.uniforms.acidProjectileCount=t.getUniformLocation(this.program,"u_acidProjectileCount"),this.uniforms.acidRainZones=t.getUniformLocation(this.program,"u_acidRainZones"),this.uniforms.acidRainZoneCount=t.getUniformLocation(this.program,"u_acidRainZoneCount"),this.uniforms.era=t.getUniformLocation(this.program,"u_era"),this.uniforms.wave=t.getUniformLocation(this.program,"u_wave"),this.uniforms.pickups=t.getUniformLocation(this.program,"u_pickups"),this.uniforms.pickupCount=t.getUniformLocation(this.program,"u_pickupCount"),this.uniforms.crystals=t.getUniformLocation(this.program,"u_crystals"),this.createQuad()}compileShader(t,e){const i=this.gl,s=i.createShader(t);return s?(i.shaderSource(s,e),i.compileShader(s),i.getShaderParameter(s,i.COMPILE_STATUS)?s:(console.error("Ошибка шейдера:",i.getShaderInfoLog(s)),i.deleteShader(s),null)):null}createQuad(){const t=this.gl,e=new Float32Array([-1,-1,1,-1,-1,1,1,1]);this.vao=t.createVertexArray(),t.bindVertexArray(this.vao);const i=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,i),t.bufferData(t.ARRAY_BUFFER,e,t.STATIC_DRAW);const s=t.getAttribLocation(this.program,"a_position");t.enableVertexAttribArray(s),t.vertexAttribPointer(s,2,t.FLOAT,!1,0,0),t.bindVertexArray(null)}resize(){const t=window.devicePixelRatio||1,e=Math.floor(this.canvas.clientWidth*t*this.renderScale),i=Math.floor(this.canvas.clientHeight*t*this.renderScale);(this.canvas.width!==e||this.canvas.height!==i)&&(this.canvas.width=e,this.canvas.height=i,this.gl.viewport(0,0,e,i))}render(t,e,i,s,o,a,n,r,c,h,l,u,p,m,f,g,v,x){const d=this.gl;this.resize(),d.useProgram(this.program),d.bindVertexArray(this.vao),d.uniform2f(this.uniforms.resolution,this.canvas.width,this.canvas.height),d.uniform1f(this.uniforms.time,t),d.uniform3f(this.uniforms.cameraPos,e.x,e.y,e.z),d.uniform1f(this.uniforms.cameraYaw,i),d.uniform1f(this.uniforms.cameraPitch,s),d.uniform4fv(this.uniforms.targets,o),d.uniform1i(this.uniforms.targetCount,a),d.uniform1f(this.uniforms.muzzleFlash,n),r&&c!==void 0?(d.uniform4fv(this.uniforms.pools,r),d.uniform1i(this.uniforms.poolCount,c)):d.uniform1i(this.uniforms.poolCount,0),f&&g!==void 0&&g>0?(d.uniform4fv(this.uniforms.acidProjectiles,f),d.uniform1i(this.uniforms.acidProjectileCount,g)):d.uniform1i(this.uniforms.acidProjectileCount,0),v&&x!==void 0&&x>0?(d.uniform4fv(this.uniforms.acidRainZones,v),d.uniform1i(this.uniforms.acidRainZoneCount,x)):d.uniform1i(this.uniforms.acidRainZoneCount,0),d.uniform1i(this.uniforms.era,h||1),d.uniform1i(this.uniforms.wave,l||1),u&&p!==void 0?(d.uniform4fv(this.uniforms.pickups,u),d.uniform1i(this.uniforms.pickupCount,p)):d.uniform1i(this.uniforms.pickupCount,0),m&&d.uniform4fv(this.uniforms.crystals,m),d.drawArrays(d.TRIANGLE_STRIP,0,4)}destroy(){this.program&&this.gl.deleteProgram(this.program)}}class Y{healthEl;ammoEl;fragsEl;crosshairEl;hitmarkerEl;reloadEl;waveEl;messageEl;damageOverlay;weaponEl;constructor(){this.healthEl=document.getElementById("health-value"),this.ammoEl=document.getElementById("ammo-value"),this.fragsEl=document.getElementById("frags-value"),this.crosshairEl=document.getElementById("crosshair"),this.hitmarkerEl=document.getElementById("hitmarker"),this.reloadEl=document.getElementById("reload-indicator"),this.reloadEl&&(this.reloadEl.style.display="none"),this.waveEl=this.createWaveElement(),this.messageEl=this.createMessageElement(),this.damageOverlay=this.createDamageOverlay(),this.weaponEl=this.createWeaponElement()}createWaveElement(){let t=document.getElementById("wave-indicator");return t||(t=document.createElement("div"),t.id="wave-indicator",t.style.cssText=`
        position: fixed;
        top: 15%;
        left: 50%;
        transform: translateX(-50%) scale(0.9);
        font-family: 'Orbitron', sans-serif;
        font-size: 28px;
        font-weight: 700;
        color: #00ffff;
        text-shadow: 
          0 0 10px #00ffff,
          0 0 20px rgba(0, 255, 255, 0.5);
        opacity: 0;
        padding: 12px 30px;
        border: 2px solid rgba(255, 0, 255, 0.6);
        border-radius: 4px;
        box-shadow: 
          0 0 15px rgba(255, 0, 255, 0.3),
          inset 0 0 20px rgba(0, 255, 255, 0.05);
        background: linear-gradient(180deg, 
          rgba(0, 0, 20, 0.85) 0%,
          rgba(10, 0, 30, 0.9) 100%
        );
        backdrop-filter: blur(5px);
        transition: opacity 0.2s, transform 0.2s;
        pointer-events: none;
        z-index: 1000;
        letter-spacing: 4px;
      `,["top-left","top-right","bottom-left","bottom-right"].forEach(i=>{const s=document.createElement("div"),[o,a]=i.split("-");s.style.cssText=`
          position: absolute;
          ${o}: -2px;
          ${a}: -2px;
          width: 12px;
          height: 12px;
          border-${o}: 2px solid #00ffff;
          border-${a}: 2px solid #00ffff;
        `,t.appendChild(s)}),document.body.appendChild(t)),t}createMessageElement(){let t=document.getElementById("game-message");return t||(t=document.createElement("div"),t.id="game-message",t.style.cssText=`
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-family: 'Orbitron', sans-serif;
        font-size: 36px;
        font-weight: 700;
        color: #ff0044;
        text-shadow: 
          0 0 15px #ff0044,
          0 0 30px rgba(255, 0, 68, 0.4);
        opacity: 0;
        padding: 25px 50px;
        border: 2px solid rgba(255, 0, 68, 0.7);
        border-radius: 4px;
        box-shadow: 
          0 0 20px rgba(255, 0, 68, 0.4),
          inset 0 0 30px rgba(255, 0, 68, 0.05);
        background: linear-gradient(180deg, 
          rgba(20, 0, 5, 0.9) 0%,
          rgba(30, 0, 10, 0.95) 100%
        );
        backdrop-filter: blur(5px);
        transition: opacity 0.4s;
        pointer-events: none;
        text-align: center;
        z-index: 1000;
        letter-spacing: 4px;
      `,["top-left","top-right","bottom-left","bottom-right"].forEach(i=>{const s=document.createElement("div"),[o,a]=i.split("-");s.style.cssText=`
          position: absolute;
          ${o}: -2px;
          ${a}: -2px;
          width: 15px;
          height: 15px;
          border-${o}: 2px solid #ff0044;
          border-${a}: 2px solid #ff0044;
        `,t.appendChild(s)}),document.body.appendChild(t)),t}createDamageOverlay(){let t=document.getElementById("damage-overlay");return t||(t=document.createElement("div"),t.id="damage-overlay",t.style.cssText=`
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
        bottom: 90px;
        right: 20px;
        font-family: 'Orbitron', sans-serif;
        font-size: 16px;
        font-weight: 700;
        color: #00ffff;
        text-shadow: 0 0 10px currentColor;
        padding: 8px 15px;
        border: 1px solid rgba(0, 255, 255, 0.5);
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.6);
        z-index: 100;
      `,t.textContent="⚔️ КАТАНА",document.body.appendChild(t)),t}updateWeapon(t,e){this.weaponEl&&(t==="katana"?(this.weaponEl.textContent="⚔️ КАТАНА",this.weaponEl.style.color="#00ffff",this.weaponEl.style.borderColor="rgba(0, 255, 255, 0.5)"):(this.weaponEl.textContent=`🪓 ТОПОР (${e})`,this.weaponEl.style.color="#ff8800",this.weaponEl.style.borderColor="rgba(255, 136, 0, 0.5)",e!==void 0&&e<=2?this.weaponEl.style.animation="pulse 0.5s infinite":this.weaponEl.style.animation="none"))}slowOverlay=null;showDamage(t="green"){this.damageOverlay&&(t==="purple"?(this.damageOverlay.style.background=`radial-gradient(circle, 
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
      `,document.body.appendChild(this.slowOverlay)),this.slowOverlay.style.opacity="1",this.slowOverlay.animate([{filter:"hue-rotate(0deg) brightness(1)"},{filter:"hue-rotate(20deg) brightness(1.1)"},{filter:"hue-rotate(0deg) brightness(1)"}],{duration:500,iterations:Math.ceil(t*2)}),setTimeout(()=>{this.slowOverlay&&(this.slowOverlay.style.opacity="0")},t*1e3)}updateHealth(t,e){if(this.healthEl){this.healthEl.textContent=Math.floor(t).toString();const i=t/e;i>.5?this.healthEl.style.color="#00ffaa":i>.25?this.healthEl.style.color="#ffaa00":this.healthEl.style.color="#ff4444"}}updateSplashCharges(t){this.splashChargesEl||this.createSplashChargesElement(),this.splashChargesEl&&(t>0?(this.splashChargesEl.style.display="block",this.splashChargesEl.innerHTML=`⚡ ВОЛНА: ${"●".repeat(t)}${"○".repeat(3-t)}`,this.splashChargesEl.style.color="#00ffff",this.splashChargesEl.style.textShadow="0 0 10px #00ffff, 0 0 20px #00ffff"):this.splashChargesEl.style.display="none")}splashChargesEl=null;doubleJumpEl=null;createSplashChargesElement(){this.splashChargesEl=document.createElement("div"),this.splashChargesEl.style.cssText=`
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
    `,document.body.appendChild(this.splashChargesEl)}updateDoubleJump(t,e){if(this.doubleJumpEl||this.createDoubleJumpElement(),this.doubleJumpEl)if(e)this.doubleJumpEl.innerHTML="⬆️⬆️ ГОТОВ",this.doubleJumpEl.style.color="#00ff88",this.doubleJumpEl.style.textShadow="0 0 10px #00ff88";else{const i=Math.ceil(t*10)/10;this.doubleJumpEl.innerHTML=`⬆️⬆️ ${i.toFixed(1)}s`,this.doubleJumpEl.style.color="#ff8800",this.doubleJumpEl.style.textShadow="0 0 10px #ff8800"}}createDoubleJumpElement(){this.doubleJumpEl=document.createElement("div"),this.doubleJumpEl.style.cssText=`
      position: fixed;
      bottom: 120px;
      left: 20px;
      font-family: 'Orbitron', 'Audiowide', monospace;
      font-size: 16px;
      color: #00ff88;
      text-shadow: 0 0 10px #00ff88;
      letter-spacing: 2px;
      z-index: 1000;
    `,document.body.appendChild(this.doubleJumpEl)}updateAmmo(t,e){this.ammoEl&&(this.ammoEl.textContent=`⚔️ ${e}`,this.ammoEl.style.color=e>0?"#00ffff":"#00ff00")}updateFrags(t){this.fragsEl&&(this.fragsEl.textContent=t.toString())}showWave(t){this.waveEl&&(this.waveEl.textContent=`ВОЛНА ${t}`,this.waveEl.style.opacity="1",this.waveEl.style.transform="translateX(-50%) scale(1)",this.waveEl.style.color="#00ffff",this.waveEl.style.borderColor="rgba(255, 0, 255, 0.6)",this.waveEl.animate([{transform:"translateX(-50%) translateY(-20px) scale(0.9)",opacity:0},{transform:"translateX(-50%) translateY(0) scale(1)",opacity:1}],{duration:300,easing:"ease-out"}),setTimeout(()=>{this.waveEl&&(this.waveEl.animate([{opacity:1},{opacity:0}],{duration:250,easing:"ease-in"}),setTimeout(()=>{this.waveEl&&(this.waveEl.style.opacity="0")},230))},1500))}showWaveComplete(t){this.waveEl&&(this.waveEl.textContent=`✓ ВОЛНА ${t}`,this.waveEl.style.color="#00ff88",this.waveEl.style.borderColor="rgba(0, 255, 136, 0.6)",this.waveEl.style.opacity="1",this.waveEl.style.transform="translateX(-50%) scale(1)",this.waveEl.animate([{transform:"translateX(-50%) scale(0.95)",opacity:0},{transform:"translateX(-50%) scale(1.02)",opacity:1},{transform:"translateX(-50%) scale(1)",opacity:1}],{duration:350,easing:"ease-out"}),setTimeout(()=>{this.waveEl&&(this.waveEl.textContent="ГОТОВЬСЯ...",this.waveEl.style.color="#ffaa00",this.waveEl.style.borderColor="rgba(255, 170, 0, 0.5)")},1200),setTimeout(()=>{this.waveEl&&(this.waveEl.style.opacity="0",this.waveEl.style.color="#00ffff",this.waveEl.style.borderColor="rgba(255, 0, 255, 0.6)")},3500))}showGameOver(t,e){this.messageEl&&(this.messageEl.innerHTML=`
        ☠ GAME OVER ☠<br>
        <div style="
          font-size: 24px; 
          color: #00ffff; 
          margin-top: 20px;
          text-shadow: 0 0 10px #00ffff;
          letter-spacing: 3px;
        ">
          СЧЁТ: <span style="color: #ff00ff;">${t}</span><br>
          ВОЛНА: <span style="color: #ff00ff;">${e}</span>
        </div>
      `,this.messageEl.style.opacity="1",this.messageEl.animate([{transform:"translate(-50%, -50%) scale(0.5)",opacity:0},{transform:"translate(-50%, -50%) scale(1.2)",opacity:1},{transform:"translate(-50%, -50%) scale(1)",opacity:1}],{duration:600,easing:"cubic-bezier(0.34, 1.56, 0.64, 1)"}),setTimeout(()=>{this.messageEl&&(this.messageEl.animate([{opacity:1},{opacity:0}],{duration:400}),setTimeout(()=>{this.messageEl&&(this.messageEl.style.opacity="0")},380))},2500))}showReloading(t){}expandCrosshair(){this.crosshairEl&&(this.crosshairEl.classList.add("shooting"),setTimeout(()=>{this.crosshairEl?.classList.remove("shooting")},100))}showHitmarker(t=!1){this.hitmarkerEl&&(this.hitmarkerEl.className="hitmarker active",t&&this.hitmarkerEl.classList.add("kill"),setTimeout(()=>{this.hitmarkerEl?.classList.remove("active","kill")},150))}showDamageEffect(){this.showDamage("green")}showMessage(t,e="white"){const i=document.createElement("div");if(i.style.cssText=`
      position: fixed;
      top: 30%;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Orbitron', sans-serif;
      font-size: 24px;
      color: ${e};
      text-shadow: 0 0 10px ${e}, 0 0 20px ${e};
      pointer-events: none;
      z-index: 1100;
      opacity: 1;
      animation: messageFloat 1s ease-out forwards;
    `,i.textContent=t,document.body.appendChild(i),!document.getElementById("message-anim-style")){const s=document.createElement("style");s.id="message-anim-style",s.textContent=`
        @keyframes messageFloat {
          0% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-50px); }
        }
      `,document.head.appendChild(s)}setTimeout(()=>i.remove(),1e3)}rageOverlay=null;bossHealthBar=null;bossHealthFill=null;bossNameEl=null;showRageOverlay(t){this.rageOverlay||(this.rageOverlay=document.createElement("div"),this.rageOverlay.id="rage-overlay",this.rageOverlay.style.cssText=`
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
      `,this.bossHealthBar.appendChild(this.bossNameEl);const a=document.createElement("div");a.style.cssText=`
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
      `,a.appendChild(this.bossHealthFill),this.bossHealthBar.appendChild(a),document.body.appendChild(this.bossHealthBar)}let s="БОСС",o="#ff0000";if(i==="boss_green"?(s="☠️ ТОКСИЧНЫЙ ГИГАНТ ☠️",o="linear-gradient(90deg, #00ff00, #88ff00)",this.bossHealthBar.style.borderColor="#00ff00",this.bossHealthBar.style.boxShadow="0 0 20px rgba(0, 255, 0, 0.5)"):i==="boss_black"?(s="🌀 ВЛАДЫКА ПУСТОТЫ 🌀",o="linear-gradient(90deg, #4400aa, #8800ff)",this.bossHealthBar.style.borderColor="#8800ff",this.bossHealthBar.style.boxShadow="0 0 20px rgba(136, 0, 255, 0.5)"):i==="boss_blue"&&(s="⚡ ФАНТОМ ХАОСА ⚡",o="linear-gradient(90deg, #0088ff, #00ffff)",this.bossHealthBar.style.borderColor="#00ffff",this.bossHealthBar.style.boxShadow="0 0 20px rgba(0, 255, 255, 0.5)"),this.bossNameEl&&(this.bossNameEl.textContent=s),this.bossHealthFill){const a=t/e*100;this.bossHealthFill.style.width=a+"%",this.bossHealthFill.style.background=o}this.bossHealthBar.style.display="block"}hideBossHealth(){this.bossHealthBar&&(this.bossHealthBar.style.display="none")}showBossIntro(t,e){let i="БОСС",s="",o="#ff0044",a="rgba(255, 0, 68, 0.5)",n="💀";t==="boss_green"?(i="ЯДОВИТЫЕ БЛИЗНЕЦЫ",s="Охотник & Загонщик",o="#00ff44",a="rgba(0, 255, 68, 0.5)",n="☣️"):t==="boss_black"?(i="ВЛАДЫКА ПУСТОТЫ",s="Повелитель Тьмы",o="#8800ff",a="rgba(136, 0, 255, 0.5)",n="🌀"):t==="boss_blue"&&(i="ФАНТОМ ХАОСА",s="Владыка Молний",o="#00ffff",a="rgba(0, 255, 255, 0.5)",n="⚡");const r=document.createElement("div");r.id="boss-intro-overlay",r.style.cssText=`
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
      filter: drop-shadow(0 0 30px ${a});
    `,c.textContent=n;const h=document.createElement("div");h.style.cssText=`
      font-family: 'Orbitron', sans-serif;
      font-size: 72px;
      font-weight: 900;
      color: ${o};
      text-shadow: 
        0 0 20px ${o},
        0 0 40px ${a},
        0 0 60px ${a};
      opacity: 0;
      transform: translateY(50px);
      letter-spacing: 8px;
      margin-top: 20px;
    `,h.textContent=i;const l=document.createElement("div");l.style.cssText=`
      font-family: 'Orbitron', sans-serif;
      font-size: 24px;
      color: ${o};
      text-shadow: 0 0 10px ${a};
      opacity: 0;
      margin-top: 10px;
      letter-spacing: 4px;
    `,l.textContent=s;const u=document.createElement("div"),p=document.createElement("div"),m=`
      position: absolute;
      top: 50%;
      width: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, ${o});
    `;u.style.cssText=m+"left: 0; transform: translateY(-50%);",p.style.cssText=m+"right: 0; transform: translateY(-50%) scaleX(-1);",r.appendChild(u),r.appendChild(p),r.appendChild(c),r.appendChild(h),r.appendChild(l),document.body.appendChild(r),r.animate([{background:"rgba(0, 0, 0, 0)"},{background:"rgba(0, 0, 0, 0.8)"}],{duration:300,fill:"forwards"}),c.animate([{opacity:0,transform:"scale(3)"},{opacity:1,transform:"scale(1)"}],{duration:500,delay:200,fill:"forwards",easing:"ease-out"}),h.animate([{opacity:0,transform:"translateY(50px)"},{opacity:1,transform:"translateY(0)"}],{duration:500,delay:400,fill:"forwards",easing:"ease-out"}),l.animate([{opacity:0},{opacity:.8}],{duration:400,delay:600,fill:"forwards"}),u.animate([{width:"0%"},{width:"35%"}],{duration:600,delay:300,fill:"forwards",easing:"ease-out"}),p.animate([{width:"0%"},{width:"35%"}],{duration:600,delay:300,fill:"forwards",easing:"ease-out"}),setTimeout(()=>{r.animate([{opacity:1},{opacity:0}],{duration:500,fill:"forwards"}),setTimeout(()=>{r.remove(),e?.()},500)},2500)}}class U{playerRadius=.4;arenaRadius=28;poolRadius=8;platformHeight=2;platformX=20;bridgeWidth=3.5;baseHeights=[1.8,3,4.2,5.4,6.6,7.8];topBaseHeight=9.5;jumpPlatforms=[{x:10,z:0,height:1.8,radius:1.5},{x:5,z:8.66,height:3,radius:1.4},{x:-5,z:8.66,height:4.2,radius:1.4},{x:-10,z:0,height:5.4,radius:1.3},{x:-5,z:-8.66,height:6.6,radius:1.3},{x:5,z:-8.66,height:7.8,radius:1.2}];topPlatform={x:0,z:0,height:9.5,radius:2.5};updatePlatforms(t){for(let e=0;e<this.jumpPlatforms.length;e++){const i=e*.8,s=Math.sin(t*1.5+i)*.3;this.jumpPlatforms[e].height=this.baseHeights[e]+s}this.topPlatform.height=this.topBaseHeight+Math.sin(t*1)*.2}getPlatformData(){const t=new Float32Array(28);for(let e=0;e<this.jumpPlatforms.length;e++){const i=this.jumpPlatforms[e];t[e*4+0]=i.x,t[e*4+1]=i.z,t[e*4+2]=i.height,t[e*4+3]=i.radius}return t[24]=this.topPlatform.x,t[25]=this.topPlatform.z,t[26]=this.topPlatform.height,t[27]=this.topPlatform.radius,t}checkCollision(t){const e=this.playerRadius,i=Math.sqrt(t.x*t.x+t.z*t.z);if(i>this.arenaRadius-e||i<2+e&&t.y<10)return!0;const s=[{x:22,z:0},{x:-22,z:0},{x:0,z:22},{x:0,z:-22}];for(const a of s){const n=t.x-a.x,r=t.z-a.z;if(Math.sqrt(n*n+r*r)<.7+e)return!0}const o=[...this.jumpPlatforms,this.topPlatform];for(const a of o){const n=t.x-a.x,r=t.z-a.z,c=Math.sqrt(n*n+r*r),h=t.y-1.7;if(c<a.radius+e&&h<a.height-.1&&h>a.height-1.5)return!0}return t.x<-this.platformX+3.5&&t.x>-this.platformX-3.5&&Math.abs(t.z)<6.5&&t.y>this.platformHeight-.5&&t.x>-this.platformX+2.8&&Math.abs(t.z)<6||t.x>this.platformX-3.5&&t.x<this.platformX+3.5&&Math.abs(t.z)<6.5&&t.y>this.platformHeight-.5&&t.x<this.platformX-2.8&&Math.abs(t.z)<6}isOverCirclePlatform(t,e){const i=t.x-e.x,s=t.z-e.z,o=Math.sqrt(i*i+s*s),a=t.y-1.7;return o<e.radius&&a>=e.height-.1}getFloorHeight(t){const e=Math.sqrt(t.x*t.x+t.z*t.z),i=Math.abs(t.z)<this.bridgeWidth/2&&Math.abs(t.x)<this.poolRadius+1,s=Math.abs(t.x)<this.bridgeWidth/2&&Math.abs(t.z)<this.poolRadius+1;if((i||s)&&e>2)return .3;const o=-16,a=-17,n=-23;if(Math.abs(t.z)<3){if(t.x>=a&&t.x<=o)return(o-t.x)/(o-a)*this.platformHeight;if(t.x<a&&t.x>n)return this.platformHeight}const r=16,c=17,h=23;if(Math.abs(t.z)<3){if(t.x>=r&&t.x<=c)return(t.x-r)/(c-r)*this.platformHeight;if(t.x>c&&t.x<h)return this.platformHeight}if(this.isOverCirclePlatform(t,this.topPlatform))return this.topPlatform.height;for(let l=this.jumpPlatforms.length-1;l>=0;l--)if(this.isOverCirclePlatform(t,this.jumpPlatforms[l]))return this.jumpPlatforms[l].height;return 0}getCeilingHeight(t){const e=[...this.jumpPlatforms,this.topPlatform];for(const i of e){const s=t.x-i.x,o=t.z-i.z;if(Math.sqrt(s*s+o*o)<i.radius-.3&&t.y<i.height-.5&&t.y>i.height-4)return i.height-.3}return 18}checkEnemyCollision(t,e){const i=Math.sqrt(t.x*t.x+t.z*t.z);if(i>this.arenaRadius-e||i<2+e)return!0;const s=[{x:22,z:0},{x:-22,z:0},{x:0,z:22},{x:0,z:-22}];for(const a of s){const n=t.x-a.x,r=t.z-a.z;if(Math.sqrt(n*n+r*r)<.7+e)return!0}const o=[...this.jumpPlatforms,this.topPlatform];for(const a of o){const n=t.x-a.x,r=t.z-a.z;if(Math.sqrt(n*n+r*r)<a.radius+e&&t.y<a.height+1.5&&t.y>a.height-1.5)return!0}return!1}getObstacleHeight(t,e,i,s=1.5){const o=t.x+e*s,a=t.z+i*s,n=[...this.jumpPlatforms,this.topPlatform];for(const r of n){const c=o-r.x,h=a-r.z;if(Math.sqrt(c*c+h*h)<r.radius&&t.y<r.height)return r.height}return 0}}const Z={width:1280,height:720,renderScale:.4,movement:{walkSpeed:9,runSpeed:16,jumpForce:12,gravity:25,groundFriction:12,airControl:.85,mouseSensitivity:.002},weapon:{name:"Katana",damage:100,fireRate:2.5,magazineSize:999,reloadTime:0,spread:0,automatic:!1}};class J{state={isRunning:!1,isPaused:!1,frags:0,gameTime:0,soundEnabled:!0};config;gameLoop;input;player;weapon;weaponRenderer;targetManager;pickupManager;audio;renderer;hud;collision;weaponCanvas;startScreen;gameTime=0;isPaused=!1;footstepTimer=0;wasGrounded=!0;screenShake=0;lastSliceTime=0;wasJumpPressed=!1;currentEra=1;killTimes=[];COMBO_WINDOW=9;COMBO_KILLS_NEEDED=3;constructor(t,e,i={}){this.weaponCanvas=e,this.config={...Z,...i},this.collision=new U,this.input=new E(t),this.audio=new W,this.hud=new Y,this.player=new O(T(0,1.7,12),this.config.movement,this.collision),this.weapon=new D,this.weapon.onSlice=()=>this.onKatanaSlice(),this.renderer=new N(t),this.renderer.renderScale=this.config.renderScale,this.weaponRenderer=new G(e),this.targetManager=new L(this.collision),this.setupTargetCallbacks(),this.pickupManager=new H,this.gameLoop=new B(s=>this.update(s),()=>this.render()),this.startScreen=document.getElementById("click-to-start"),this.setupEventHandlers()}setupTargetCallbacks(){this.targetManager.onTargetDestroyed=t=>{if(this.state.frags++,this.audio.playSFX("kill"),this.hud.showHitmarker(!0),this.pickupManager.spawnAfterKill(t.position),this.killTimes.push(this.gameTime),this.killTimes=this.killTimes.filter(e=>this.gameTime-e<this.COMBO_WINDOW),this.killTimes.length>=this.COMBO_KILLS_NEEDED&&!this.player.rageMode&&this.activateComboAdrenaline(),this.killTimes.length>0&&this.killTimes.length<this.COMBO_KILLS_NEEDED&&this.hud.showMessage(`🔥 КОМБО ${this.killTimes.length}/${this.COMBO_KILLS_NEEDED}`,"orange"),t.isBoss){this.hud.showMessage("💀 БОСС ПОВЕРЖЕН! 💀","gold");for(let e=0;e<3;e++)this.pickupManager.spawnAfterKill(t.position);this.pickupManager.respawnChargeAfterBoss(),this.targetManager.wave===5&&this.player.maxAirJumps<2&&(this.player.unlockTripleJump(),this.hud.showMessage("🦘 ТРОЙНОЙ ПРЫЖОК РАЗБЛОКИРОВАН! 🦘","cyan"))}},this.targetManager.onPlayerHit=t=>{switch(this.player.takeDamage(t.damage),t.enemyType){case"phantom":this.audio.playSFX("phantom_pass"),this.screenShake=.3,this.hud.showDamage("purple"),this.slowdownFactor=.3,this.slowdownTimer=2;break;case"runner":this.audio.playSFX("runner_hit"),this.screenShake=.4,this.hud.showDamage("green");break;case"hopper":this.audio.playSFX("hopper_hit"),this.screenShake=.6,this.hud.showDamage("green");break;case"boss_green":this.audio.playSFX("kill"),this.screenShake=1,this.hud.showDamage("green"),this.hud.showMessage("💀 ТОКСИЧНЫЙ УДАР!","lime");break;case"boss_black":this.audio.playSFX("phantom_pass"),this.screenShake=.8,this.hud.showDamage("purple"),this.slowdownFactor=.2,this.slowdownTimer=3,this.hud.showMessage("🌀 ИСКРИВЛЕНИЕ!","purple");break;case"boss_blue":this.audio.playSFX("hopper_hit"),this.screenShake=.7,this.hud.showDamage("purple"),this.hud.showMessage("⚡ ТЕЛЕПОРТ УДАР!","cyan");break;default:this.audio.playSFX("hit"),this.screenShake=.5,this.hud.showDamage("green")}},this.targetManager.onWaveStart=t=>{this.hud.showWave(t),this.audio.setEra(t),this.currentEra=t>10?3:t>5?2:1,t===5?(this.isPaused=!0,this.audio.playBossWarning(),this.hud.showBossIntro("boss_green",()=>{this.isPaused=!1,this.audio.setBossMusic("boss_green")})):t===10?(this.isPaused=!0,this.audio.playBossWarning(),this.hud.showBossIntro("boss_black",()=>{this.isPaused=!1,this.audio.setBossMusic("boss_black")})):t===15&&(this.isPaused=!0,this.audio.playBossWarning(),this.hud.showBossIntro("boss_blue",()=>{this.isPaused=!1,this.audio.setBossMusic("boss_blue")})),t===6?setTimeout(()=>this.hud.showMessage("🌀 ЗОНА ЧЁРНОЙ ДЫРЫ 🌀","purple"),1e3):t===11&&setTimeout(()=>this.hud.showMessage("🚀 КОСМИЧЕСКАЯ ЗОНА 🚀","cyan"),1e3)},this.targetManager.onWaveComplete=t=>{this.hud.showWaveComplete(t),(t===5||t===10||t===15)&&(this.audio.setBossMusic(null),this.audio.setEra(t+1))},this.targetManager.onPoolDamage=t=>{this.player.takeDamage(t),this.hud.showDamage("green"),this.screenShake=.2},this.targetManager.onBossPhaseChange=(t,e)=>{t==="boss_green"&&e===2&&(this.audio.setBossGreenPhase2(),this.hud.showMessage("☣️ ФАЗА 2: ЯРОСТЬ! ☣️","lime"),this.screenShake=1.5)},this.targetManager.onBossVortexWarning=()=>{this.audio.playVortexRiser(),this.hud.showMessage("⚠️ ВИХРЬ ПРИБЛИЖАЕТСЯ! ⚠️","yellow")},this.targetManager.onBossVortexStart=()=>{this.audio.playVortexSound(!0),this.hud.showMessage("🌀 ВИХРЬ! БЕГИ! 🌀","purple"),this.screenShake=1},this.targetManager.onBossVortexEnd=()=>{this.audio.playVortexSound(!1)},this.targetManager.onAcidSpit=()=>{this.audio.playSFX("acid_spit")},this.targetManager.onAcidRain=t=>{this.audio.playAcidSplash(),this.screenShake=.3},this.targetManager.onAcidRainMarkSound=()=>{this.audio.playAcidRainMark(),this.hud.showMessage("☢️ КИСЛОТНЫЙ ДОЖДЬ! УКРОЙСЯ! ☢️","lime")},this.targetManager.onAcidRainStart=t=>{this.audio.playAcidRainStart(),this.screenShake=.5}}slowdownFactor=1;slowdownTimer=0;setupEventHandlers(){const t=document.getElementById("volume-slider"),e=document.getElementById("volume-value"),i=document.getElementById("sens-slider"),s=document.getElementById("sens-value");t?.addEventListener("input",o=>{o.stopPropagation();const a=parseInt(t.value);e&&(e.textContent=`${a}%`),this.audio.setVolume(a/100)}),i?.addEventListener("input",o=>{o.stopPropagation();const a=parseInt(i.value);s&&(s.textContent=`${a}%`),this.input.setSensitivity(.001+a/100*.009)}),document.getElementById("settings")?.addEventListener("click",o=>{o.stopPropagation()}),document.getElementById("start-buttons")?.addEventListener("click",o=>{o.stopPropagation()}),document.getElementById("btn-start")?.addEventListener("click",()=>this.start()),document.getElementById("btn-boss5")?.addEventListener("click",()=>this.startFromWave(5)),document.getElementById("btn-boss10")?.addEventListener("click",()=>this.startFromWave(10)),document.getElementById("btn-boss15")?.addEventListener("click",()=>this.startFromWave(15)),this.startScreen?.addEventListener("click",()=>this.start()),document.addEventListener("keydown",o=>{o.code==="KeyM"&&this.audio.toggleMute(),o.code==="KeyF"&&this.toggleFullscreen()}),window.addEventListener("resize",()=>this.handleResize())}start(){this.startFromWave(1)}startFromWave(t){if(this.state.isRunning)return;const e=document.getElementById("volume-slider"),i=document.getElementById("sens-slider");e&&this.audio.setVolume(parseInt(e.value)/100),i&&this.input.setSensitivity(.001+parseInt(i.value)/100*.009),this.startScreen&&(this.startScreen.style.display="none"),this.input.requestPointerLock(),this.audio.start(),this.gameLoop.start(),this.state.isRunning=!0,this.targetManager.startGame(t),t===5?this.hud.showMessage("⚠️ ЗЕЛЁНЫЙ БОСС! ⚠️","lime"):t===10?this.hud.showMessage("☠️ ЧЁРНЫЙ БОСС! ☠️","purple"):t===15&&this.hud.showMessage("⚡ СИНИЙ БОСС! ⚡","cyan"),this.handleResize()}stop(){this.gameLoop.stop(),this.state.isRunning=!1,this.input.exitPointerLock()}update(t){if(this.state.isPaused||this.isPaused)return;this.gameTime+=t,this.collision.updatePlatforms(this.gameTime),this.slowdownTimer>0&&(this.slowdownTimer-=t,this.slowdownTimer<=0&&(this.slowdownFactor=1));const e=t*this.slowdownFactor;this.player.update(e,this.input.state,{x:this.input.mouseDelta.x*this.slowdownFactor,y:this.input.mouseDelta.y*this.slowdownFactor}),this.input.resetMouseDelta();const i=this.targetManager.getVortexPull(this.player.state.position);(i.x!==0||i.z!==0)&&(this.player.state.position.x+=i.x*t,this.player.state.position.z+=i.z*t,this.screenShake=Math.max(this.screenShake,.3)),this.updateMovementSounds(t),this.input.state.fire&&this.weapon.tryAttack()&&(this.audio.playSFX("katana_swing"),this.checkNormalAttack()),this.input.state.altFire&&this.weapon.trySplashAttack()&&(this.audio.playSFX("splash_wave"),this.checkSplashAttack());const s=this.input.state.forward||this.input.state.backward||this.input.state.left||this.input.state.right;this.weapon.update(t,s,this.input.state.run),this.weaponRenderer.isAttacking=this.weapon.isAttacking,this.weaponRenderer.attackProgress=this.weapon.attackProgress,this.weaponRenderer.isSplashAttack=this.weapon.isSplashAttack,this.weaponRenderer.splashCharges=this.weapon.splashCharges;const o=this.player.getEyePosition();this.targetManager.update(t,o,this.gameTime),this.updateEnemyProximitySounds(o),this.checkAttachedRunners(),!this.input.state.jump&&this.wasJumpPressed&&this.player.onJumpReleased(),this.wasJumpPressed=this.input.state.jump,this.input.state.jump&&!this.player.state.grounded&&this.player.tryDoubleJump()&&(this.detachRunners(),this.audio.playSFX("jump"));const a=this.pickupManager.update(t,this.gameTime,o);a&&this.onPickup(a);const n=this.targetManager.getClosestEnemyDistance(o);if(n<15){const h=Math.max(0,1-n/15);this.audio.updateProximitySound(h)}else this.audio.updateProximitySound(0);this.screenShake>0&&(this.screenShake-=t*2),this.player.isDead()&&this.gameOver(),this.hud.updateHealth(this.player.state.health,this.player.state.maxHealth),this.hud.updateAmmo(this.targetManager.wave,this.targetManager.getActiveCount()),this.hud.updateFrags(this.state.frags),this.hud.updateSplashCharges(this.weapon.splashCharges),this.hud.updateDoubleJump(this.player.getDoubleJumpCooldown(),this.player.isDoubleJumpReady());const r=this.player.state.health/this.player.state.maxHealth;this.audio.setLowHpMode(r<.3&&r>0);const c=this.targetManager.getActiveBoss();c?this.hud.showBossHealth(c.hp,c.maxHp,c.enemyType):this.hud.hideBossHealth()}updateMovementSounds(t){(this.input.state.forward||this.input.state.backward||this.input.state.left||this.input.state.right)&&this.player.state.grounded&&(this.footstepTimer-=t,this.footstepTimer<=0&&(this.audio.playSFX("footstep"),this.footstepTimer=this.input.state.run?.25:.4)),this.player.state.grounded&&!this.wasGrounded&&this.audio.playSFX("land"),this.wasGrounded=this.player.state.grounded}onKatanaSlice(){this.audio.playSFX("katana_swing")}gameOver(){this.state.isPaused=!0,this.hud.showGameOver(this.state.frags,this.targetManager.wave),setTimeout(()=>{this.restart()},3e3)}restart(){this.player.reset(T(0,1.7,12)),this.player.state.health=100,this.state.frags=0,this.state.isPaused=!1,this.targetManager.startGame(),this.pickupManager.pickups=[]}checkAttachedRunners(){for(const t of this.targetManager.targets)t.enemyType==="runner"&&t.isAttached&&t.attachTimer<=0&&t.active===!1&&(this.player.takeDamage(t.damage),this.audio.playSFX("runner_hit"),this.screenShake=.6,this.hud.showDamage("green"),this.hud.showMessage("⚠️ РАННЕР УКУСИЛ!","orange"))}updateEnemyProximitySounds(t){for(const e of this.targetManager.targets){if(!e.active)continue;const i=e.position.x-t.x,s=e.position.y-t.y,o=e.position.z-t.z,a=Math.sqrt(i*i+s*s+o*o);this.audio.playEnemyProximitySound(e.enemyType,a)}}detachRunners(){let t=!1;for(const e of this.targetManager.targets)e.enemyType==="runner"&&e.isAttached&&(e.detachRunner(),t=!0);t&&this.hud.showMessage("✓ РАННЕР СБРОШЕН!","cyan")}onPickup(t){t==="health"?(this.player.state.health=Math.min(this.player.state.maxHealth,this.player.state.health+30),this.audio.playSFX("jump"),this.hud.showMessage("+30 HP","lime"),this.hud.updateHealth(this.player.state.health,this.player.state.maxHealth)):t==="stimpack"?(this.player.activateStimpack(),this.audio.playSFX("kill"),this.hud.showMessage("🔥 БУЙСТВО! 🔥","red"),this.hud.showRageOverlay(8)):t==="charge"&&(this.weapon.chargeKatana(),this.audio.playSFX("charge_pickup"),this.hud.showMessage("⚡ КАТАНА ЗАРЯЖЕНА! (ПКМ x3) ⚡","cyan"),this.hud.updateSplashCharges(3),this.screenShake=.5)}checkNormalAttack(){const t=this.player.getEyePosition();if(this.targetManager.trySlice(t,this.player.state.yaw,this.weapon.attackRange,this.weapon.attackAngle)&&(this.lastSliceTime=this.gameTime,this.weaponRenderer.showHitEffect(),this.audio.playSFX("kill")),this.targetManager.wave===10&&this.targetManager.trySliceCrystal(t,this.player.state.yaw,this.weapon.attackRange)){this.weaponRenderer.showHitEffect(),this.audio.playSFX("kill");const s=this.targetManager.powerCrystals.filter(o=>o.active).length;s===0?(this.hud.showMessage("💀 КРИСТАЛЛЫ УНИЧТОЖЕНЫ! БОСС ОСЛАБЛЕН! 💀","purple"),this.screenShake=2):this.hud.showMessage(`🔮 КРИСТАЛЛ РАЗБИТ! (${s}/6)`,"cyan")}}checkSplashAttack(){const t=this.player.getEyePosition(),e=this.targetManager.trySplashWave(t,this.player.state.yaw,this.weapon.splashRadius);e>0&&(this.lastSliceTime=this.gameTime,this.weaponRenderer.showSplashWave(this.player.state.yaw),this.screenShake=.4,this.audio.playSFX("kill"),this.hud.showMessage(`🌊 ВОЛНА x${e}! 🌊`,"cyan")),this.hud.updateSplashCharges(this.weapon.splashCharges)}activateComboAdrenaline(){this.killTimes=[],this.player.activateStimpack(),this.audio.playSFX("kill"),this.hud.showMessage("🔥🔥🔥 КОМБО АДРЕНАЛИН! 🔥🔥🔥","red"),this.hud.showRageOverlay(8),this.screenShake=.5}render(){const t=this.targetManager.getShaderData(),e=this.targetManager.targets.length,i=this.targetManager.getPoolsShaderData(),s=this.targetManager.toxicPools.length,o=this.pickupManager.getShaderData(),a=this.pickupManager.pickups.length;let n=this.player.state.yaw,r=this.player.state.pitch;this.screenShake>0&&(n+=(Math.random()-.5)*this.screenShake*.1,r+=(Math.random()-.5)*this.screenShake*.1);const c=Math.max(0,.3-(this.gameTime-this.lastSliceTime))*3,h=this.targetManager.getCrystalsData(),l=this.targetManager.getAcidProjectilesData(),u=this.targetManager.acidProjectiles.length,p=this.targetManager.getAcidRainZonesData(),m=this.targetManager.acidRainZones.length;this.renderer.render(this.gameTime,this.player.getEyePosition(),n,r,t,e,c,i,s,this.currentEra,this.targetManager.wave,o,a,h,l,u,p,m),this.weaponRenderer.render(this.weapon.state,this.gameTime)}handleResize(){const t=window.devicePixelRatio||1;this.weaponCanvas.width=window.innerWidth*t,this.weaponCanvas.height=window.innerHeight*t,this.weaponCanvas.style.width=window.innerWidth+"px",this.weaponCanvas.style.height=window.innerHeight+"px",this.weaponRenderer.resize(this.weaponCanvas.width,this.weaponCanvas.height)}toggleFullscreen(){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}destroy(){this.stop(),this.input.destroy(),this.audio.stop(),this.renderer.destroy()}}function P(){const y=document.getElementById("game-canvas"),t=document.getElementById("weapon-canvas");if(!y||!t){console.error("Canvas элементы не найдены!");return}const e=new J(y,t);window.game=e,console.log("🎮 Dungeon Synth Shooter загружен"),console.log("📖 Управление: WASD, SHIFT (бег), SPACE (прыжок), LMB (стрельба), R (перезарядка)"),console.log("🔊 M - mute, F - fullscreen")}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",P):P();
//# sourceMappingURL=index-B_oRVgCa.js.map
