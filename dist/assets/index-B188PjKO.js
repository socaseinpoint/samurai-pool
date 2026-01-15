(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))i(a);new MutationObserver(a=>{for(const o of a)if(o.type==="childList")for(const s of o.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function e(a){const o={};return a.integrity&&(o.integrity=a.integrity),a.referrerPolicy&&(o.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?o.credentials="include":a.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(a){if(a.ep)return;a.ep=!0;const o=e(a);fetch(a.href,o)}})();class at{updateFn;renderFn;lastTime=0;accumulator=0;fixedDeltaTime=1/60;animationFrameId=null;isRunning=!1;fps=0;frameCount=0;fpsTime=0;constructor(t,e){this.updateFn=t,this.renderFn=e}start(){this.isRunning||(this.isRunning=!0,this.lastTime=performance.now(),this.fpsTime=this.lastTime,this.frameCount=0,this.animationFrameId=requestAnimationFrame(this.tick.bind(this)))}stop(){this.isRunning&&(this.isRunning=!1,this.animationFrameId!==null&&(cancelAnimationFrame(this.animationFrameId),this.animationFrameId=null))}tick(t){if(!this.isRunning)return;const e=Math.min((t-this.lastTime)/1e3,.1);for(this.lastTime=t,this.frameCount++,t-this.fpsTime>=1e3&&(this.fps=this.frameCount,this.frameCount=0,this.fpsTime=t),this.accumulator+=e;this.accumulator>=this.fixedDeltaTime;)this.updateFn(this.fixedDeltaTime),this.accumulator-=this.fixedDeltaTime;const i=this.accumulator/this.fixedDeltaTime;this.renderFn(i),this.animationFrameId=requestAnimationFrame(this.tick.bind(this))}}class st{state={forward:!1,backward:!1,left:!1,right:!1,run:!1,jump:!1,fire:!1,altFire:!1,reload:!1,throwGrenade:!1};mouseDelta={x:0,y:0};isPointerLocked=!1;sensitivity=.005;setSensitivity(t){this.sensitivity=Math.max(.001,Math.min(.015,t))}invertX=!0;invertY=!0;canvas;onPointerLockChange;constructor(t){this.canvas=t,this.setupListeners()}setupListeners(){document.addEventListener("keydown",this.handleKeyDown.bind(this)),document.addEventListener("keyup",this.handleKeyUp.bind(this)),document.addEventListener("mousemove",this.handleMouseMove.bind(this)),document.addEventListener("mousedown",this.handleMouseDown.bind(this)),document.addEventListener("mouseup",this.handleMouseUp.bind(this)),document.addEventListener("wheel",this.handleWheel.bind(this)),this.canvas.addEventListener("contextmenu",t=>t.preventDefault()),document.addEventListener("pointerlockchange",this.handlePointerLockChange.bind(this))}requestPointerLock(t){this.onPointerLockChange=t,this.canvas.requestPointerLock()}exitPointerLock(){document.exitPointerLock()}resetMouseDelta(){this.mouseDelta.x=0,this.mouseDelta.y=0}handleKeyDown(t){this.updateKeyState(t.code,!0)}handleKeyUp(t){this.updateKeyState(t.code,!1)}updateKeyState(t,e){switch(t){case"KeyW":this.state.forward=e;break;case"KeyS":this.state.backward=e;break;case"KeyA":this.state.left=e;break;case"KeyD":this.state.right=e;break;case"ShiftLeft":case"ShiftRight":this.state.run=e;break;case"Space":this.state.jump=e;break;case"KeyR":this.state.reload=e;break}}handleMouseMove(t){if(!this.isPointerLocked)return;const e=this.invertX?-t.movementX:t.movementX,i=this.invertY?-t.movementY:t.movementY;this.mouseDelta.x+=e*this.sensitivity,this.mouseDelta.y+=i*this.sensitivity}handleMouseDown(t){t.button===0?this.state.fire=!0:t.button===1?(t.preventDefault(),this.state.throwGrenade=!0):t.button===2&&(t.preventDefault(),this.state.altFire=!0)}handleMouseUp(t){t.button===0?this.state.fire=!1:t.button===2&&(this.state.altFire=!1)}handleWheel(t){this.isPointerLocked&&(t.preventDefault(),this.state.throwGrenade=!0)}handlePointerLockChange(){this.isPointerLocked=document.pointerLockElement===this.canvas,this.onPointerLockChange?.()}destroy(){document.removeEventListener("keydown",this.handleKeyDown.bind(this)),document.removeEventListener("keyup",this.handleKeyUp.bind(this)),document.removeEventListener("mousemove",this.handleMouseMove.bind(this)),document.removeEventListener("mousedown",this.handleMouseDown.bind(this)),document.removeEventListener("mouseup",this.handleMouseUp.bind(this)),document.removeEventListener("pointerlockchange",this.handlePointerLockChange.bind(this))}}function b(k=0,t=0,e=0){return{x:k,y:t,z:e}}function ot(k,t){return{x:k.x-t.x,y:k.y-t.y,z:k.z-t.z}}function nt(k){return Math.sqrt(k.x*k.x+k.y*k.y+k.z*k.z)}function K(k,t){return nt(ot(k,t))}function rt(k,t,e){return Math.max(t,Math.min(e,k))}const lt={walkSpeed:8,runSpeed:20,jumpForce:12,gravity:25,groundFriction:12,airControl:.85,mouseSensitivity:.002};class ct{state;config;collision;isInVoid=!1;stepSpeed=12;maxStepHeight=.5;targetYaw=0;targetPitch=-.05;airJumpCooldown=0;AIR_JUMP_COOLDOWN=2;airJumpsLeft=0;maxAirJumps=1;canAirJump=!1;rageMode=!1;rageModeTimer=0;speedBoost=1;speedBoostTimer=0;inWater=!1;WATER_SLOW_FACTOR=.5;constructor(t=b(0,1.7,5),e={},i){this.config={...lt,...e},this.collision=i,this.state={position:{...t},velocity:b(),yaw:0,pitch:-.05,grounded:!0,eyeHeight:1.7,health:100,maxHealth:100}}update(t,e,i){this.rageModeTimer>0&&(this.rageModeTimer-=t,this.rageModeTimer<=0&&(this.rageMode=!1)),this.speedBoostTimer>0&&(this.speedBoostTimer-=t,this.speedBoostTimer<=0&&(this.speedBoost=1)),this.airJumpCooldown>0&&(this.airJumpCooldown-=t),this.updateCamera(i),this.updateMovement(t,e)}activateStimpack(){this.rageMode=!0,this.rageModeTimer=8,this.speedBoost=1.8,this.speedBoostTimer=8}tryDoubleJump(){return!this.canAirJump||this.airJumpsLeft<=0?!1:this.rageMode?(this.state.velocity.y=this.config.jumpForce*.9,this.airJumpsLeft--,this.canAirJump=!1,!0):this.airJumpCooldown<=0?(this.airJumpCooldown=this.AIR_JUMP_COOLDOWN,this.state.velocity.y=this.config.jumpForce,this.airJumpsLeft--,this.canAirJump=!1,!0):!1}onJumpReleased(){this.state.grounded||(this.canAirJump=!0)}getDoubleJumpCooldown(){return Math.max(0,this.airJumpCooldown)}isDoubleJumpReady(){return this.airJumpCooldown<=0&&this.airJumpsLeft>0||this.rageMode}unlockTripleJump(){this.maxAirJumps=2}getAirJumpsLeft(){return this.airJumpsLeft}updateCamera(t){this.targetYaw-=t.x,this.targetPitch+=t.y,this.targetPitch=rt(this.targetPitch,-Math.PI/2+.01,Math.PI/2-.01),this.state.yaw+=(this.targetYaw-this.state.yaw)*.7,this.state.pitch+=(this.targetPitch-this.state.pitch)*.7}updateMovement(t,e){const{state:i,config:a}=this;let o=0,s=0;e.forward&&(s-=1),e.backward&&(s+=1),e.left&&(o-=1),e.right&&(o+=1);const n=Math.sqrt(o*o+s*s);n>0&&(o/=n,s/=n);const l=Math.sin(i.yaw),r=Math.cos(i.yaw),c=o*r-s*l,h=o*l+s*r,p=Math.sqrt(i.position.x**2+i.position.z**2),f=Math.abs(i.position.z)<2.5||Math.abs(i.position.x)<2.5;this.inWater=p>2.5&&p<7.7&&!f&&i.position.y<1.5;const u=e.run?a.runSpeed:a.walkSpeed,m=this.inWater?this.WATER_SLOW_FACTOR:1,d=u*this.speedBoost*m,v=c*d,y=h*d,w=(this.isInVoid?i.position.y-i.eyeHeight:this.collision.getFloorHeight(i.position))+i.eyeHeight;if(i.grounded){const x=a.groundFriction*t;if(i.velocity.x+=(v-i.velocity.x)*Math.min(x,1),i.velocity.z+=(y-i.velocity.z)*Math.min(x,1),e.jump)i.velocity.y=a.jumpForce,i.grounded=!1,this.airJumpsLeft=this.maxAirJumps,this.canAirJump=!1;else{const M=w-i.position.y;Math.abs(M)<.01?(i.position.y=w,i.velocity.y=0):M>0&&M<this.maxStepHeight?i.velocity.y=this.stepSpeed:M<0&&M>-this.maxStepHeight?i.velocity.y=-this.stepSpeed*.8:M<-this.maxStepHeight&&(i.grounded=!1,i.velocity.y=0)}}else{const x=8*t;i.velocity.x+=(v-i.velocity.x)*Math.min(x,1),i.velocity.z+=(y-i.velocity.z)*Math.min(x,1),i.velocity.y-=a.gravity*t}const A=i.position.x+i.velocity.x*t,C=i.position.y+i.velocity.y*t,S=i.position.z+i.velocity.z*t,R={x:A,y:i.position.y,z:i.position.z};this.isInVoid||!this.collision.checkCollision(R)?i.position.x=A:i.velocity.x=0;const z={x:i.position.x,y:i.position.y,z:S};if(this.isInVoid||!this.collision.checkCollision(z)?i.position.z=S:i.velocity.z=0,this.isInVoid)i.position.y=C;else{const M=this.collision.getFloorHeight(i.position)+i.eyeHeight;if(i.grounded)i.position.y+=i.velocity.y*t,i.position.y<M&&(i.position.y=M,i.velocity.y=0);else if(C<=M)i.position.y=M,i.velocity.y=0,i.grounded=!0,this.canAirJump=!1,this.airJumpsLeft=0;else{const P={x:i.position.x,y:C,z:i.position.z},V=this.collision.getCeilingHeight(i.position);C<V-.3&&!this.collision.checkCollision(P)?i.position.y=C:i.velocity.y=Math.min(i.velocity.y,0)}}}getEyePosition(){return{x:this.state.position.x,y:this.state.position.y,z:this.state.position.z}}getLookDirection(){const{yaw:t,pitch:e}=this.state;return{x:Math.sin(t)*Math.cos(e),y:Math.sin(e),z:-Math.cos(t)*Math.cos(e)}}takeDamage(t){this.state.health=Math.max(0,this.state.health-t)}heal(t){this.state.health=Math.min(this.state.maxHealth,this.state.health+t)}isDead(){return this.state.health<=0}reset(t){this.state.position={...t},this.state.velocity=b(),this.state.health=this.state.maxHealth,this.state.grounded=!0}}class ht{state;currentWeapon="katana";splashCharges=0;attackCooldown=0;attackDuration=.25;attackCooldownTime=.2;attackType=0;nextAttackType=0;attackRange=4;attackAngle=Math.PI*.6;damage=100;isAttacking=!1;attackProgress=0;onSlice;onSplash;isSplashAttack=!1;splashRadius=10;constructor(){this.state={ammo:999,reserveAmmo:999,magazineSize:999,isReloading:!1,reloadTimeLeft:0,recoilX:0,recoilY:0,recoilBack:0,muzzleFlash:0,bobPhase:0}}update(t,e,i){if(this.attackCooldown>0&&(this.attackCooldown-=t),this.isAttacking&&(this.attackProgress+=t/this.attackDuration,this.attackProgress>=1&&(this.isAttacking=!1,this.attackProgress=0)),e){const a=i?14:10;this.state.bobPhase+=t*a}else this.state.bobPhase*=.95;this.state.recoilX*=.85,this.state.recoilY*=.85,this.state.muzzleFlash*=.8}tryAttack(){return this.attackCooldown>0||this.isAttacking?!1:(this.attack(!1),!0)}trySplashAttack(){return this.attackCooldown>0||this.isAttacking||this.splashCharges<=0?!1:(this.attack(!0),!0)}attack(t){this.isAttacking=!0,this.attackProgress=0,this.attackCooldown=t?.5:this.attackCooldownTime,this.isSplashAttack=t,t&&(this.attackType=2),t?(this.splashCharges--,this.state.recoilX=.6,this.state.muzzleFlash=2,this.splashCharges<=0&&(this.currentWeapon="katana"),this.onSplash?.()):(this.state.recoilX=.3,this.state.muzzleFlash=1,this.onSlice?.())}chargeKatana(){this.currentWeapon="charged",this.splashCharges=3}isCharged(){return this.splashCharges>0}checkHit(t,e,i){if(!this.isAttacking||this.attackProgress<.2||this.attackProgress>.6)return!1;const a=i.x-t.x,o=i.z-t.z,s=Math.sqrt(a*a+o*o);if(this.isSplashAttack)return s<=this.splashRadius;if(s>this.attackRange)return!1;let l=Math.atan2(a,-o)-e;for(;l>Math.PI;)l-=Math.PI*2;for(;l<-Math.PI;)l+=Math.PI*2;return Math.abs(l)<this.attackAngle/2}getWeaponOffset(){const t=Math.sin(this.state.bobPhase)*.02,e=Math.abs(Math.sin(this.state.bobPhase*2))*.015;let i=0,a=0;if(this.isAttacking){const o=this.attackProgress;i=Math.sin(o*Math.PI)*.3,a=-Math.sin(o*Math.PI*2)*.1}return{x:t+this.state.recoilX+i,y:e-this.state.recoilY+a,z:0}}tryShoot(t,e){return this.tryAttack()}startReload(){return!1}projectiles=[]}class _{ctx;width;height;attackProgress=0;isAttacking=!1;isSplashAttack=!1;splashCharges=0;hitFlash=0;particles=[];static MAX_PARTICLES=50;splashWaveActive=!1;splashWaveProgress=0;splashWaveYaw=0;sceneLighting={ambient:[.12,.15,.2],accentColor:[.15,.7,1],brightness:.7};constructor(t){this.ctx=t.getContext("2d"),this.width=t.width,this.height=t.height}resize(t,e){this.width=t,this.height=e}setSceneLighting(t){t===1?this.sceneLighting={ambient:[.08,.12,.08],accentColor:[.4,1,.2],brightness:.75}:t===2?this.sceneLighting={ambient:[.07,.05,.12],accentColor:[.7,.15,1],brightness:.7}:this.sceneLighting={ambient:[.08,.1,.14],accentColor:[.15,.7,1],brightness:.75}}tintColor(t,e=1){const i=t.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);if(!i)return t;let a=parseInt(i[1],16)/255,o=parseInt(i[2],16)/255,s=parseInt(i[3],16)/255;const[n,l,r]=this.sceneLighting.ambient,c=this.sceneLighting.brightness;return a=a*c*(.6+n*2)*e,o=o*c*(.6+l*2)*e,s=s*c*(.6+r*2)*e,a=Math.min(1,Math.max(0,a)),o=Math.min(1,Math.max(0,o)),s=Math.min(1,Math.max(0,s)),`rgb(${Math.floor(a*255)}, ${Math.floor(o*255)}, ${Math.floor(s*255)})`}showHitEffect(){this.hitFlash=.5}showSplashEffect(){this.hitFlash=.6}showSplashWave(t){this.splashWaveYaw=t,this.hitFlash=.5}spawnWaveParticles(){if(this.particles.length>_.MAX_PARTICLES)return;const t=this.width/2,e=this.height/2,i=["#00ffff","#00e5ff","#00bfff","#40e0d0"];for(let a=0;a<12;a++){const o=a/12*Math.PI-Math.PI/2,s=600+Math.random()*300;this.particles.push({x:t,y:e,vx:Math.cos(o)*s,vy:Math.sin(o)*s*.3,size:5+Math.random()*6,color:i[a%i.length],life:.4+Math.random()*.3,maxLife:.4+Math.random()*.3,type:"spark"})}for(let a=0;a<6;a++){const o=(Math.random()-.5)*Math.PI*.8,s=600+Math.random()*300;this.particles.push({x:t+(Math.random()-.5)*100,y:e+(Math.random()-.5)*50,vx:Math.cos(o)*s,vy:Math.sin(o)*s*.2,size:12+Math.random()*18,color:i[Math.floor(Math.random()*i.length)],life:.8+Math.random()*.4,maxLife:.8+Math.random()*.4,type:"fragment"})}}spawnFragments(){if(this.particles.length>_.MAX_PARTICLES)return;const t=this.width/2,e=this.height/2,i=["#00ff00","#33ff00","#66ff33","#00ff66"];for(let a=0;a<6;a++){const o=a/6*Math.PI*2+Math.random()*.5,s=400+Math.random()*400;this.particles.push({x:t+(Math.random()-.5)*40,y:e+(Math.random()-.5)*40,vx:Math.cos(o)*s,vy:Math.sin(o)*s-150,size:6+Math.random()*8,color:i[a%i.length],life:.5+Math.random()*.3,maxLife:.5+Math.random()*.3,type:"fragment"})}for(let a=0;a<10;a++){const o=Math.random()*Math.PI*2,s=200+Math.random()*300;this.particles.push({x:t+(Math.random()-.5)*20,y:e+(Math.random()-.5)*20,vx:Math.cos(o)*s,vy:Math.sin(o)*s-80,size:2+Math.random()*3,color:i[a%i.length],life:.3+Math.random()*.2,maxLife:.3+Math.random()*.2,type:"spark"})}}updateParticles(t){const i=this.height+50;let a=0;for(let o=0;o<this.particles.length;o++){const s=this.particles[o];s.x+=s.vx*t,s.y+=s.vy*t,s.vy+=800*t,s.vx*=.98,s.life-=t,s.life>0&&s.y<i&&(this.particles[a++]=s)}this.particles.length=a}renderParticles(t){t.shadowBlur=0;for(const e of this.particles){const i=Math.min(1,e.life/e.maxLife*2);t.globalAlpha=i,t.fillStyle=e.color,e.type==="fragment"?(t.beginPath(),t.arc(e.x,e.y,e.size,0,Math.PI*2),t.fill(),t.globalAlpha=i*.8,t.fillStyle="#ffffff",t.beginPath(),t.arc(e.x,e.y,e.size*.4,0,Math.PI*2),t.fill()):(t.beginPath(),t.arc(e.x,e.y,e.size,0,Math.PI*2),t.fill(),t.globalAlpha=i*.5,t.strokeStyle=e.color,t.lineWidth=e.size*.5,t.beginPath(),t.moveTo(e.x,e.y),t.lineTo(e.x-e.vx*.02,e.y-e.vy*.02),t.stroke())}t.globalAlpha=1}render(t,e){const i=this.ctx;i.clearRect(0,0,this.width,this.height);const a=Math.min(this.width,this.height)/600,o=Math.sin(t.bobPhase)*8*a,s=Math.abs(Math.sin(t.bobPhase*2))*6*a;this.hitFlash>0&&(this.hitFlash-=.04),i.save();let n=this.width*.65,l=this.height*.8,r=-.4;if(this.isAttacking){const c=this.attackProgress,h=1-Math.pow(1-c,3);r=-.4-Math.sin(h*Math.PI)*(this.isSplashAttack?3.2:2.5);const f=this.isSplashAttack?1.5:1;n-=Math.sin(c*Math.PI)*this.width*.3*f,l-=Math.sin(c*Math.PI)*this.height*.15*f}i.translate(n+o,l+s),i.rotate(r),i.scale(a,a),i.restore(),this.hitFlash>.5&&this.drawScreenFlash(i,this.isSplashAttack?"charged":"katana")}applySceneLighting(t){const[e,i,a]=this.sceneLighting.ambient,o=this.sceneLighting.brightness;t.save(),t.globalCompositeOperation="source-atop";const s=o*.6;t.fillStyle=`rgba(0, 0, 0, ${1-s})`,t.fillRect(0,0,this.width,this.height),t.restore(),t.save(),t.globalCompositeOperation="source-atop";const n=Math.floor(e*255*2),l=Math.floor(i*255*2),r=Math.floor(a*255*2);t.fillStyle=`rgba(${n}, ${l}, ${r}, 0.25)`,t.fillRect(0,0,this.width,this.height),t.restore()}drawChargeIndicator(t,e){t.save(),t.shadowColor="#00ffff",t.shadowBlur=15;for(let i=0;i<3;i++){const a=-50-i*60,o=.7+.3*Math.sin(e*5+i);this.splashCharges>i?(t.fillStyle=`rgba(0, 255, 255, ${o})`,t.beginPath(),t.arc(0,a,8,0,Math.PI*2),t.fill(),t.strokeStyle=`rgba(0, 255, 255, ${o*.5})`,t.lineWidth=2,t.beginPath(),t.arc(0,a,12+Math.sin(e*8+i)*3,0,Math.PI*2),t.stroke()):(t.fillStyle="rgba(100, 100, 100, 0.3)",t.beginPath(),t.arc(0,a,6,0,Math.PI*2),t.fill())}t.restore()}drawSplashWaveEffect(t,e){const i=this.width/2,a=this.height/2,o=Math.max(this.width,this.height)*.8,s=this.splashWaveProgress*o;t.save();for(let l=0;l<3;l++){const r=s-l*30;if(r>0){const c=(1-this.splashWaveProgress)*(.5-l*.1);t.strokeStyle=`rgba(0, 255, 255, ${c})`,t.lineWidth=8-l*2,t.shadowColor="#00ffff",t.shadowBlur=20,t.beginPath(),t.ellipse(i,a+100,r,r*.3,0,Math.PI,0),t.stroke(),l===0&&(t.strokeStyle=`rgba(255, 255, 255, ${c*.8})`,t.lineWidth=2,t.beginPath(),t.ellipse(i,a+100,r-5,(r-5)*.3,0,Math.PI,0),t.stroke())}}const n=Math.floor((1-this.splashWaveProgress)*20);t.fillStyle="#ffffff";for(let l=0;l<n;l++){const r=Math.PI+Math.random()*Math.PI,c=s+(Math.random()-.5)*20,h=i+Math.cos(r)*c,p=a+100+Math.sin(r)*c*.3,f=2+Math.random()*4;t.beginPath(),t.arc(h,p,f,0,Math.PI*2),t.fill()}t.restore()}drawSplashSlash(t,e,i){t.save(),t.globalCompositeOperation="lighter";const a=t.createLinearGradient(-200,-350,50,0);a.addColorStop(0,"rgba(0, 255, 255, 0)"),a.addColorStop(.3,"rgba(0, 255, 255, 0.8)"),a.addColorStop(.6,"rgba(0, 255, 255, 1)"),a.addColorStop(1,"rgba(0, 255, 255, 0)"),t.strokeStyle=a,t.lineWidth=30+Math.sin(e*Math.PI)*20,t.lineCap="round",t.shadowColor="#00ffff",t.shadowBlur=40,t.beginPath(),t.moveTo(-200,-350),t.quadraticCurveTo(-100+Math.sin(i*30)*20,-200,50,0),t.stroke(),t.strokeStyle="rgba(255, 255, 255, 0.9)",t.lineWidth=6,t.shadowBlur=20,t.stroke();for(let o=0;o<3;o++){const s=o*15;t.strokeStyle=`rgba(0, 200, 255, ${.4-o*.1})`,t.lineWidth=4-o,t.beginPath(),t.moveTo(-200-s,-350+s),t.quadraticCurveTo(-100-s+Math.sin(i*30+o)*15,-200+s,50-s,0+s),t.stroke()}t.restore()}drawKatana(t,e,i){t.fillStyle="#8a7a6a",t.beginPath(),t.ellipse(0,80,40,50,.2,0,Math.PI*2),t.fill();const a=t.createLinearGradient(0,40,0,160);a.addColorStop(0,"#2a1a1a"),a.addColorStop(.5,"#1a0a0a"),a.addColorStop(1,"#2a1a1a"),t.fillStyle=a,t.beginPath(),t.moveTo(-14,40),t.lineTo(14,40),t.lineTo(12,160),t.lineTo(-12,160),t.closePath(),t.fill(),t.strokeStyle="#ff00ff",t.shadowColor="#ff00ff",t.shadowBlur=10,t.lineWidth=2;for(let s=0;s<10;s++){const n=50+s*11,l=.5+.5*Math.sin(i*3+s*.5);t.strokeStyle=`rgba(255, 0, 255, ${l})`,t.beginPath(),t.moveTo(-12,n),t.lineTo(0,n+5),t.lineTo(12,n),t.stroke()}t.shadowBlur=0,t.fillStyle="#1a1a2a",t.beginPath(),t.ellipse(0,35,35,12,0,0,Math.PI*2),t.fill(),t.strokeStyle="#00ffff",t.shadowColor="#00ffff",t.shadowBlur=15,t.lineWidth=2,t.beginPath(),t.ellipse(0,35,32,10,0,0,Math.PI*2),t.stroke(),t.shadowBlur=0;const o=t.createLinearGradient(-10,0,10,0);o.addColorStop(0,"#8080a0"),o.addColorStop(.3,"#c0c0e0"),o.addColorStop(.5,"#ffffff"),o.addColorStop(.7,"#c0c0e0"),o.addColorStop(1,"#6060a0"),t.fillStyle=o,t.beginPath(),t.moveTo(-10,30),t.lineTo(10,30),t.lineTo(7,-280),t.lineTo(0,-320),t.lineTo(-5,-280),t.closePath(),t.fill(),t.strokeStyle="#00ffff",t.shadowColor="#00ffff",t.shadowBlur=8,t.lineWidth=2,t.beginPath(),t.moveTo(9,30),t.lineTo(6,-280),t.lineTo(0,-320),t.stroke(),t.strokeStyle=`rgba(255, 0, 255, ${.5+.3*Math.sin(i*4)})`,t.shadowColor="#ff00ff",t.shadowBlur=5,t.lineWidth=1.5,t.beginPath(),t.moveTo(-4,30);for(let s=0;s<25;s++){const n=30-s*13,l=Math.sin(s*.7+i*2)*4;t.lineTo(-4+l,n)}t.stroke(),t.shadowBlur=0,t.fillStyle="rgba(255, 255, 255, 0.4)",t.beginPath(),t.moveTo(3,25),t.lineTo(5,25),t.lineTo(3,-270),t.lineTo(1,-270),t.closePath(),t.fill()}drawRetrowaveSlash(t,e,i){t.save(),t.translate(0,-150);const a=Math.sin(e*Math.PI),o=[{color:"#ff00ff",offset:0},{color:"#00ffff",offset:15},{color:"#ff0080",offset:30},{color:"#8000ff",offset:45}];for(const{color:s,offset:n}of o)t.strokeStyle=s,t.shadowColor=s,t.shadowBlur=25,t.lineWidth=10-n*.15,t.lineCap="round",t.beginPath(),t.arc(0,100,200+n,-Math.PI*.7,Math.PI*.15),t.globalAlpha=a*(1-n*.015),t.stroke();t.globalAlpha=a;for(let s=0;s<15;s++){const n=-Math.PI*.7+Math.PI*.85*(s/15)+Math.sin(i*10+s)*.1,l=200+Math.random()*50,r=Math.cos(n)*l,c=100+Math.sin(n)*l,h=s%2===0?"#ff00ff":"#00ffff";t.fillStyle=h,t.shadowColor=h,t.shadowBlur=15,t.beginPath(),t.arc(r,c,4+Math.random()*4,0,Math.PI*2),t.fill()}t.globalAlpha=1,t.shadowBlur=0,t.restore()}drawAxe(t,e,i,a){t.fillStyle="#8a7a6a",t.beginPath(),t.ellipse(0,80,40,50,.2,0,Math.PI*2),t.fill();const o=t.createLinearGradient(0,40,0,160);o.addColorStop(0,"#3a2010"),o.addColorStop(.5,"#2a1005"),o.addColorStop(1,"#3a2010"),t.fillStyle=o,t.beginPath(),t.moveTo(-14,40),t.lineTo(14,40),t.lineTo(12,160),t.lineTo(-12,160),t.closePath(),t.fill(),t.strokeStyle="#ff6600",t.shadowColor="#ff6600",t.shadowBlur=10,t.lineWidth=2;for(let n=0;n<10;n++){const l=50+n*11,r=.5+.5*Math.sin(i*4+n*.5);t.strokeStyle=`rgba(255, 100, 0, ${r})`,t.beginPath(),t.moveTo(-12,l),t.lineTo(0,l+5),t.lineTo(12,l),t.stroke()}t.shadowBlur=0,t.fillStyle="#2a2020",t.beginPath(),t.rect(-30,25,60,20),t.fill(),t.strokeStyle="#ff6600",t.shadowColor="#ff6600",t.shadowBlur=15,t.lineWidth=2,t.strokeRect(-28,27,56,16),t.shadowBlur=0;const s=t.createLinearGradient(-40,0,40,0);s.addColorStop(0,"#6060a0"),s.addColorStop(.2,"#8080b0"),s.addColorStop(.4,"#b0b0d0"),s.addColorStop(.5,"#e0e0f0"),s.addColorStop(.6,"#b0b0d0"),s.addColorStop(.8,"#8080b0"),s.addColorStop(1,"#6060a0"),t.fillStyle=s,t.beginPath(),t.moveTo(-12,20),t.lineTo(12,20),t.lineTo(15,-50),t.lineTo(50,-180),t.lineTo(55,-220),t.lineTo(0,-300),t.lineTo(-55,-220),t.lineTo(-50,-180),t.lineTo(-15,-50),t.closePath(),t.fill(),t.strokeStyle="#ff6600",t.shadowColor="#ff6600",t.shadowBlur=12,t.lineWidth=3,t.beginPath(),t.moveTo(14,20),t.lineTo(52,-180),t.lineTo(57,-220),t.lineTo(0,-305),t.stroke(),t.beginPath(),t.moveTo(-14,20),t.lineTo(-52,-180),t.lineTo(-57,-220),t.lineTo(0,-305),t.stroke(),t.strokeStyle=`rgba(255, 150, 0, ${.5+.3*Math.sin(i*5)})`,t.shadowColor="#ff9900",t.shadowBlur=8,t.lineWidth=2,t.beginPath(),t.moveTo(0,15);for(let n=0;n<20;n++){const l=15-n*15,r=Math.sin(n*.8+i*3)*(3+n*.3);t.lineTo(r,l)}t.stroke(),t.shadowBlur=0;for(let n=0;n<5;n++){const l=-50-n*45;n<a?(t.fillStyle="#ff8800",t.shadowColor="#ff8800",t.shadowBlur=15):(t.fillStyle="#333333",t.shadowColor="transparent",t.shadowBlur=0),t.beginPath(),t.arc(0,l,4,0,Math.PI*2),t.fill()}t.shadowBlur=0,t.fillStyle="rgba(255, 255, 255, 0.4)",t.beginPath(),t.moveTo(5,15),t.lineTo(8,15),t.lineTo(40,-170),t.lineTo(37,-170),t.closePath(),t.fill()}drawAxeSlash(t,e,i){t.save(),t.translate(0,-150);const a=Math.sin(e*Math.PI),o=[{color:"#ff6600",offset:0},{color:"#ff9900",offset:15},{color:"#ff3300",offset:30},{color:"#ffcc00",offset:45}];for(const{color:s,offset:n}of o)t.strokeStyle=s,t.shadowColor=s,t.shadowBlur=25,t.lineWidth=12-n*.15,t.lineCap="round",t.beginPath(),t.arc(0,100,200+n,-Math.PI*.7,Math.PI*.15),t.globalAlpha=a*(1-n*.015),t.stroke();t.globalAlpha=a;for(let s=0;s<15;s++){const n=-Math.PI*.7+Math.PI*.85*(s/15)+Math.sin(i*10+s)*.1,l=200+Math.random()*50,r=Math.cos(n)*l,c=100+Math.sin(n)*l,h=s%2===0?"#ff6600":"#ffaa00";t.fillStyle=h,t.shadowColor=h,t.shadowBlur=15,t.beginPath(),t.arc(r,c,4+Math.random()*4,0,Math.PI*2),t.fill()}t.globalAlpha=1,t.shadowBlur=0,t.restore()}spawnAxeSplash(){if(this.particles.length>_.MAX_PARTICLES)return;const t=this.width/2,e=this.height/2,i=["#ff6600","#ff9900","#ff3300","#ffcc00"];for(let a=0;a<8;a++){const o=a/8*Math.PI*2+Math.random()*.3,s=400+Math.random()*500;this.particles.push({x:t+(Math.random()-.5)*60,y:e+(Math.random()-.5)*60,vx:Math.cos(o)*s,vy:Math.sin(o)*s-120,size:8+Math.random()*10,color:i[a%i.length],life:.5+Math.random()*.3,maxLife:.5+Math.random()*.3,type:"fragment"})}for(let a=0;a<12;a++){const o=Math.random()*Math.PI*2,s=250+Math.random()*400;this.particles.push({x:t+(Math.random()-.5)*30,y:e+(Math.random()-.5)*30,vx:Math.cos(o)*s,vy:Math.sin(o)*s-80,size:2+Math.random()*4,color:i[a%i.length],life:.3+Math.random()*.3,maxLife:.3+Math.random()*.3,type:"spark"})}}drawHitGlow(t,e,i="katana"){if(t.save(),t.globalAlpha=e,i==="charged"){t.strokeStyle="#ffffff",t.shadowColor="#00ffff",t.shadowBlur=50*e,t.lineWidth=10,t.beginPath(),t.moveTo(9,30),t.lineTo(6,-280),t.lineTo(0,-320),t.stroke(),t.strokeStyle="#00ffff",t.shadowColor="#0088ff",t.shadowBlur=30*e,t.lineWidth=4;for(let a=0;a<3;a++)t.beginPath(),t.arc(0,-150,50+a*30,0,Math.PI*2),t.stroke()}else t.strokeStyle="#ffffff",t.shadowColor="#00ffff",t.shadowBlur=30*e,t.lineWidth=6,t.beginPath(),t.moveTo(9,30),t.lineTo(6,-280),t.lineTo(0,-320),t.stroke(),t.strokeStyle="#ff00ff",t.shadowColor="#ff00ff",t.shadowBlur=20*e,t.lineWidth=3,t.stroke();t.restore()}drawScreenFlash(t,e="katana"){t.save(),t.resetTransform();const i=t.createRadialGradient(this.width/2,this.height/2,0,this.width/2,this.height/2,this.width);e==="charged"?(i.addColorStop(0,`rgba(255, 255, 255, ${this.hitFlash*.6})`),i.addColorStop(.2,`rgba(0, 255, 255, ${this.hitFlash*.4})`),i.addColorStop(.5,`rgba(0, 150, 255, ${this.hitFlash*.2})`),i.addColorStop(.8,`rgba(0, 80, 255, ${this.hitFlash*.1})`),i.addColorStop(1,"rgba(0, 0, 0, 0)")):(i.addColorStop(0,`rgba(255, 255, 255, ${this.hitFlash*.4})`),i.addColorStop(.3,`rgba(255, 0, 255, ${this.hitFlash*.2})`),i.addColorStop(.6,`rgba(0, 255, 255, ${this.hitFlash*.1})`),i.addColorStop(1,"rgba(0, 0, 0, 0)")),t.fillStyle=i,t.fillRect(0,0,this.width,this.height),t.restore()}}class G{position;velocity=b();radius=.8;active=!0;speed=4;fireIntensity=1;fragments=[];removeTimer=0;id;phase;moveType;enemyType="baneling";damage=25;currentSpeed=0;isCharging=!0;chargeDirection=b();passedThroughTimer=0;verticalVelocity=0;onGround=!0;hopTimer=0;dodgeAngle=0;dodgeTimer=0;isAttached=!1;attachTimer=0;orbitAngle=0;hp=1;maxHp=1;isBoss=!1;isDying=!1;deathProgress=0;deathVelocity=0;deathY=0;teleportTimer=0;distortionPower=0;spawnPhantomTimer=5;isVortexActive=!1;vortexTimer=0;vortexCooldown=0;vortexWarningPlayed=!1;onSpawnPhantom;onVortexStart;onVortexEnd;onVortexWarning;poolTimer=0;spitTimer=0;spitCooldown=3;greenBossRole="hunter";lastPlayerPos=b();playerVelocity=b();onSpit;onAcidRainMark;bossPhase=1;onPhaseChange;spikeAttackTimer=0;spikeAttackCooldown=2;requiresJumpToKill=!1;onSpikeAttack;onSpikerScream;collision=null;constructor(t,e=4,i=0,a="baneling",o){this.position={...t},this.speed=e,this.id=i,this.phase=Math.random()*Math.PI*2,this.moveType=i%4,this.enemyType=a,this.collision=o||null,a==="phantom"?(this.speed=e*2,this.damage=10,this.radius=.6,this.currentSpeed=0,this.isCharging=!0):a==="runner"?(this.speed=e*2.5,this.damage=15,this.radius=.4,this.position.y=.5):a==="hopper"?(this.speed=e*1.2,this.damage=20,this.radius=.5,this.verticalVelocity=8,this.onGround=!1):a==="spiker"?(this.speed=e*.8,this.damage=5,this.radius=.6,this.position.y=5+Math.random()*3,this.spikeAttackCooldown=2,this.requiresJumpToKill=!0):a==="boss_green"?(this.isBoss=!0,this.speed=e*.6,this.damage=40,this.radius=2.5,this.hp=10,this.maxHp=10,this.spitCooldown=3):a==="boss_black"?(this.isBoss=!0,this.speed=e*.8,this.damage=30,this.radius=2,this.hp=70,this.maxHp=70,this.distortionPower=1):a==="boss_blue"?(this.isBoss=!0,this.speed=e*1.5,this.damage=25,this.radius=1.8,this.hp=24,this.maxHp=24,this.teleportTimer=3):(this.damage=25,this.currentSpeed=e)}update(t,e,i){if(this.fireIntensity=.6+Math.sin(i*8+this.id)*.4,this.active)switch(this.enemyType){case"phantom":this.updatePhantom(t,e,i);break;case"runner":this.updateRunner(t,e,i);break;case"hopper":this.updateHopper(t,e,i);break;case"spiker":this.updateSpiker(t,e,i);break;case"boss_green":this.updateBossGreen(t,e,i);break;case"boss_black":this.updateBossBlack(t,e,i);break;case"boss_blue":this.updateBossBlue(t,e,i);break;default:this.updateBaneling(t,e,i)}this.updateFragments(t),this.updateDeath(t),!this.active&&this.removeTimer>0&&(this.removeTimer-=t)}updateBaneling(t,e,i){const a=e.x-this.position.x,o=e.z-this.position.z,s=Math.sqrt(a*a+o*o);if(s>.1){const n=a/s,l=o/s,r=1+Math.max(0,(15-s)/15)*.8,c=this.speed*r;let h=0,p=0;const f=i*4+this.phase;switch(this.moveType){case 0:h=Math.cos(f)*2,p=Math.sin(f)*2;break;case 1:h=Math.sin(f*2)*3;break;case 2:p=Math.sin(f*1.5)*3;break;case 3:const y=Math.sin(f)>0?1.5:.5;h=Math.cos(f*3)*2*y,p=Math.sin(f*3)*2*y;break}const u=-l,m=n;this.velocity.x=n*c+u*h*.3,this.velocity.z=l*c+m*p*.3;const d=this.position.x+this.velocity.x*t,v=this.position.z+this.velocity.z*t;(!this.collision?.checkEnemyCollision||!this.collision.checkEnemyCollision({x:d,y:this.position.y,z:v},this.radius))&&(this.position.x=d,this.position.z=v),this.position.y=this.radius}}updatePhantom(t,e,i){const a=e.x-this.position.x,o=e.y-.3-this.position.y,s=e.z-this.position.z,n=Math.sqrt(a*a+o*o+s*s);if(this.isCharging){this.currentSpeed=Math.min(this.currentSpeed+t*15,this.speed),n>.1&&(this.chargeDirection.x=a/n,this.chargeDirection.y=o/n,this.chargeDirection.z=s/n);const l=Math.sin(i*10)*.3;this.velocity.x=this.chargeDirection.x*this.currentSpeed+l,this.velocity.y=this.chargeDirection.y*this.currentSpeed,this.velocity.z=this.chargeDirection.z*this.currentSpeed,this.currentSpeed>=this.speed*.9&&(this.isCharging=!1)}else this.passedThroughTimer+=t,this.velocity.x=this.chargeDirection.x*this.speed,this.velocity.y=this.chargeDirection.y*this.speed,this.velocity.z=this.chargeDirection.z*this.speed,this.passedThroughTimer>2.5&&(this.isCharging=!0,this.currentSpeed=this.speed*.3,this.passedThroughTimer=0);this.position.x+=this.velocity.x*t,this.position.y+=this.velocity.y*t,this.position.z+=this.velocity.z*t,this.position.y=Math.max(.5,Math.min(4,this.position.y)),n>35&&(this.isCharging=!0,this.currentSpeed=0,this.passedThroughTimer=0)}runnerVerticalVel=0;runnerOnGround=!0;updateRunner(t,e,i){if(this.isAttached){this.attachTimer-=t,this.orbitAngle+=t*12;const n=1.2,l=Math.sin(i*8)*.3;this.position.x=e.x+Math.cos(this.orbitAngle)*n,this.position.y=e.y+l,this.position.z=e.z+Math.sin(this.orbitAngle)*n,this.attachTimer<=0&&(this.isAttached=!1,this.active=!1,this.removeTimer=.5);return}const a=e.x-this.position.x,o=e.z-this.position.z,s=Math.sqrt(a*a+o*o);if(s<1.5){this.isAttached=!0,this.attachTimer=3,this.orbitAngle=Math.atan2(o,a);return}if(s>.1){const n=a/s,l=o/s;if(this.collision?.getObstacleHeight&&this.runnerOnGround){const y=this.collision.getObstacleHeight(this.position,n,l,1.5);y>this.position.y&&y<10&&(this.runnerVerticalVel=12,this.runnerOnGround=!1)}if(this.collision?.checkEnemyCollision){const y={x:this.position.x+n*this.speed*t,y:this.position.y,z:this.position.z+l*this.speed*t};this.collision.checkEnemyCollision(y,this.radius)&&(this.dodgeAngle=(Math.random()>.5?1:-1)*Math.PI*.5)}this.dodgeTimer-=t,this.dodgeTimer<=0&&(this.dodgeAngle=(Math.random()-.5)*Math.PI*.8,this.dodgeTimer=.3+Math.random()*.4);const r=Math.cos(this.dodgeAngle),c=Math.sin(this.dodgeAngle),h=n*r-l*c,p=n*c+l*r,f=1+Math.max(0,(10-s)/10)*.5,u=this.speed*f,m=Math.sin(i*15+this.phase)*2;this.velocity.x=h*u+m*.3,this.velocity.z=p*u;const d=this.position.x+this.velocity.x*t,v=this.position.z+this.velocity.z*t;(!this.collision?.checkEnemyCollision||!this.collision.checkEnemyCollision({x:d,y:this.position.y,z:v},this.radius))&&(this.position.x=d,this.position.z=v),this.runnerOnGround?this.position.y=.5+Math.abs(Math.sin(i*20))*.1:(this.runnerVerticalVel-=25*t,this.position.y+=this.runnerVerticalVel*t,this.position.y<=.5&&(this.position.y=.5,this.runnerVerticalVel=0,this.runnerOnGround=!0))}}applyKnockback(t,e,i){const a=Math.sqrt(t*t+e*e);a>0&&(this.velocity.x=t/a*i,this.velocity.z=e/a*i,this.velocity.y=i*.3),this.knockbackTimer=.3}knockbackTimer=0;detachRunner(){if(this.isAttached&&this.enemyType==="runner"){this.isAttached=!1;const t=this.orbitAngle+Math.PI;return this.velocity.x=Math.cos(t)*15,this.velocity.y=8,this.velocity.z=Math.sin(t)*15,this.attachTimer=0,!0}return!1}onCreatePool;updateBossGreen(t,e,i){if(this.knockbackTimer>0){this.knockbackTimer-=t,this.position.x+=this.velocity.x*t,this.position.y+=this.velocity.y*t,this.position.z+=this.velocity.z*t,this.velocity.x*=.9,this.velocity.y*=.9,this.velocity.z*=.9,this.velocity.y-=15*t,this.position.y=Math.max(this.radius,this.position.y);return}this.playerVelocity.x=(e.x-this.lastPlayerPos.x)/Math.max(t,.001),this.playerVelocity.z=(e.z-this.lastPlayerPos.z)/Math.max(t,.001),this.lastPlayerPos={...e};const a=e.x-this.position.x,o=e.y-this.position.y,s=e.z-this.position.z,n=Math.sqrt(a*a+o*o+s*s),l=this.bossPhase===2?2.8:2.5;if(this.radius=l+Math.sin(i*3)*.3,this.greenBossRole==="hunter"){this.spitTimer-=t;const r=this.bossPhase===2?5:8;if(this.spitTimer<=0&&n<25){this.spitTimer=r;const c=b(e.x,.05,e.z);this.onAcidRainMark?.(c),this.bossPhase===2&&setTimeout(()=>{this.onAcidRainMark?.(b(c.x+6,.05,c.z)),this.onAcidRainMark?.(b(c.x-6,.05,c.z))},800)}if(n>8){const c=a/n,h=s/n;this.velocity.x=c*this.speed*.5,this.velocity.z=h*this.speed*.5,this.position.x+=this.velocity.x*t,this.position.z+=this.velocity.z*t}this.position.y=Math.max(this.radius,this.position.y)}else{this.spitTimer-=t;const r=this.bossPhase===2?2:3.5;if(this.spitTimer<=0&&n<20){this.spitTimer=r;const c=b(e.x+(Math.random()-.5)*2,.05,e.z+(Math.random()-.5)*2),h=b(this.position.x,this.position.y+1,this.position.z);this.onSpit?.(h,c),this.bossPhase===2&&(setTimeout(()=>{const p=b(e.x+3,.05,e.z);this.onSpit?.(h,p)},300),setTimeout(()=>{const p=b(e.x-3,.05,e.z);this.onSpit?.(h,p)},600))}if(n>.1){const c=a/n,h=o/n,p=s/n,f=Math.sin(i*2)*.5,u=this.bossPhase===2?1.4:1;this.velocity.x=c*this.speed*u+f,this.velocity.y=h*this.speed*.3,this.velocity.z=p*this.speed*u,this.position.x+=this.velocity.x*t,this.position.y+=this.velocity.y*t,this.position.z+=this.velocity.z*t,this.position.y=Math.max(this.radius,this.position.y)}}}updateBossBlack(t,e,i){if(this.knockbackTimer>0){this.knockbackTimer-=t,this.position.x+=this.velocity.x*t,this.position.y+=this.velocity.y*t,this.position.z+=this.velocity.z*t,this.velocity.x*=.92,this.velocity.y*=.92,this.velocity.z*=.92,this.velocity.y-=10*t,this.position.y=Math.max(1,this.position.y);return}const a=e.x-this.position.x,o=e.y-this.position.y,s=e.z-this.position.z,n=Math.sqrt(a*a+o*o+s*s);if(this.spawnPhantomTimer-=t,this.spawnPhantomTimer<=0){this.spawnPhantomTimer=5;const u=Math.random()*Math.PI*2,m=3+Math.random()*2,d=b(this.position.x+Math.cos(u)*m,this.position.y,this.position.z+Math.sin(u)*m);this.onSpawnPhantom?.(d)}if(this.vortexCooldown-=t,this.isVortexActive){this.vortexTimer-=t,this.position.y=2+Math.sin(i*10)*.3,this.distortionPower=1.5+Math.sin(i*15)*.5,this.vortexTimer<=0&&(this.isVortexActive=!1,this.vortexCooldown=12,this.vortexWarningPlayed=!1,this.onVortexEnd?.());return}this.vortexCooldown>0&&this.vortexCooldown<=2&&!this.vortexWarningPlayed&&n<15&&(this.vortexWarningPlayed=!0,this.onVortexWarning?.()),this.vortexCooldown<=0&&n<15&&(this.isVortexActive=!0,this.vortexTimer=4,this.onVortexStart?.());const l=.5,r=8+Math.sin(i*.3)*3,c=Math.cos(i*l)*r,h=Math.sin(i*l)*r,p=c-this.position.x,f=h-this.position.z;this.velocity.x=p*.5+a/n*this.speed*.3,this.velocity.y=(1.5-this.position.y)*2,this.velocity.z=f*.5+s/n*this.speed*.3,this.position.x+=this.velocity.x*t,this.position.y+=this.velocity.y*t,this.position.z+=this.velocity.z*t,this.distortionPower=Math.max(0,1-n/20)}getVortexPull(t){if(!this.isVortexActive)return b(0,0,0);const e=this.position.x-t.x,i=this.position.z-t.z,a=Math.sqrt(e*e+i*i);if(a<.5)return b(0,0,0);const o=Math.max(0,1-a/20)*7.5;return b(e/a*o,0,i/a*o)}updateBossBlue(t,e,i){if(this.knockbackTimer>0){this.knockbackTimer-=t,this.position.x+=this.velocity.x*t,this.position.y+=this.velocity.y*t,this.position.z+=this.velocity.z*t,this.velocity.x*=.85,this.velocity.y*=.85,this.velocity.z*=.85,this.velocity.y-=20*t,this.position.y=Math.max(.5,this.position.y);return}if(this.teleportTimer-=t,this.teleportTimer<=0){const l=Math.random()*Math.PI*2,r=5+Math.random()*10;this.position.x=e.x+Math.cos(l)*r,this.position.y=1.5+Math.random()*2,this.position.z=e.z+Math.sin(l)*r,this.teleportTimer=2+Math.random()*2;return}const a=e.x-this.position.x,o=e.y-this.position.y,s=e.z-this.position.z,n=Math.sqrt(a*a+o*o+s*s);if(n>.1){const l=Math.sin(i*10)*3;this.velocity.x=a/n*this.speed+l*.5,this.velocity.y=o/n*this.speed*.5,this.velocity.z=s/n*this.speed,this.position.x+=this.velocity.x*t,this.position.y+=this.velocity.y*t,this.position.z+=this.velocity.z*t,this.position.y=Math.max(.5,Math.min(4,this.position.y))}}takeDamage(t=1){return this.hp-=t,this.enemyType==="boss_green"&&this.bossPhase===1&&this.hp<=this.maxHp/2&&(this.bossPhase=2,this.speed*=1.3,this.onPhaseChange?.(2)),this.hp<=0?(this.hp=0,!0):!1}updateHopper(t,e,i){const a=e.x-this.position.x,o=e.z-this.position.z,s=Math.sqrt(a*a+o*o),n=18;if(this.onGround)if(this.hopTimer-=t,this.hopTimer<=0){this.onGround=!1;let c=10+Math.random()*4;if(this.collision?.getObstacleHeight&&s>.1){const h=a/s,p=o/s,f=this.collision.getObstacleHeight(this.position,h,p,3);f>this.position.y&&(c=Math.max(c,(f-this.position.y+2)*3))}if(this.verticalVelocity=c,this.hopTimer=.5+Math.random()*.5,s>.1){const h=this.speed*1.5;this.velocity.x=a/s*h,this.velocity.z=o/s*h}}else this.velocity.x*=.9,this.velocity.z*=.9;else this.verticalVelocity-=n*t,s>.1&&(this.velocity.x+=a/s*t*3,this.velocity.z+=o/s*t*3);const l=this.position.x+this.velocity.x*t,r=this.position.z+this.velocity.z*t;!this.collision?.checkEnemyCollision||!this.collision.checkEnemyCollision({x:l,y:this.position.y,z:r},this.radius)?(this.position.x=l,this.position.z=r):(this.velocity.x*=-.5,this.velocity.z*=-.5),this.position.y+=this.verticalVelocity*t,this.position.y<=.5&&(this.position.y=.5,this.onGround=!0,this.verticalVelocity=0),this.position.y=Math.min(12,this.position.y)}spikerManeuverTimer=0;spikerManeuverDir={x:0,y:0,z:0};spikerDodging=!1;spikerDiveTimer=0;updateSpiker(t,e,i){const a=e.x-this.position.x,o=e.z-this.position.z,s=Math.sqrt(a*a+o*o),n=i*8+this.phase,r=Math.sin(n)*.5;if(this.spikerManeuverTimer-=t,this.spikerDiveTimer-=t,this.spikerManeuverTimer<=0){this.spikerManeuverTimer=.3+Math.random()*.5;const m=Math.random();if(m<.3){const d=Math.atan2(o,a)+(Math.random()>.5?Math.PI/2:-Math.PI/2);this.spikerManeuverDir={x:Math.cos(d)*15,y:(Math.random()-.3)*8,z:Math.sin(d)*15},this.spikerDodging=!0}else m<.5?(this.spikerDiveTimer=.4,this.spikerManeuverDir={x:a/s*20,y:-8,z:o/s*20},this.spikerDodging=!1):m<.7?(this.spikerManeuverDir={x:(Math.random()-.5)*10,y:12,z:(Math.random()-.5)*10},this.spikerDodging=!1):(this.spikerManeuverDir={x:-a/s*12,y:(Math.random()-.5)*5,z:-o/s*12},this.spikerDodging=!1)}const c=Math.max(0,this.spikerManeuverTimer/.5);if(this.position.x+=this.spikerManeuverDir.x*t*c,this.position.y+=this.spikerManeuverDir.y*t*c,this.position.z+=this.spikerManeuverDir.z*t*c,!this.spikerDodging&&this.spikerDiveTimer<=0){const m=8+Math.sin(i*2+this.phase)*3;if(s>.1){const y=Math.atan2(o,a)+3.5*t;let T=0;s<m-2?T=-8:s>m+2&&(T=8);const w=e.x-Math.cos(y)*(s+T*t),A=e.z-Math.sin(y)*(s+T*t);this.position.x+=(w-this.position.x)*t*5,this.position.z+=(A-this.position.z)*t*5}}const p=5+Math.sin(i*1.5+this.phase*2)*2+r;if(this.spikerDiveTimer>0&&this.position.y<3&&(this.spikerManeuverDir.y=15),this.spikerDiveTimer<=0&&!this.spikerDodging){const m=p-this.position.y;this.position.y+=m*t*3}this.spikeAttackTimer-=t,this.spikeAttackTimer<=0&&s<20&&(this.onSpikerScream?.(),setTimeout(()=>{this.active&&this.onSpikeAttack?.({...this.position},{...e})},200),this.spikeAttackTimer=this.spikeAttackCooldown*.7+Math.random()*.5);const f=35,u=Math.sqrt(this.position.x**2+this.position.z**2);u>f&&(this.position.x*=f/u,this.position.z*=f/u),this.position.y=Math.max(2.5,Math.min(12,this.position.y))}updateFragments(t){for(let o=this.fragments.length-1;o>=0;o--){const s=this.fragments[o];s.position.x+=s.velocity.x*t,s.position.y+=s.velocity.y*t,s.position.z+=s.velocity.z*t,s.velocity.y-=35*t,s.velocity.x*=.96,s.velocity.z*=.96,s.position.y<s.size*.3&&(s.position.y=s.size*.3,s.velocity.y=0,s.velocity.x*=.3,s.velocity.z*=.3,s.size*=.95,s.lifetime-=t*2),s.lifetime-=t,(s.lifetime<=0||s.size<.03||s.position.y<-5)&&this.fragments.splice(o,1)}}checkPlayerCollision(t){return this.active?K(this.position,t)<this.radius+.5:!1}slice(t){if(!this.active||this.isDying)return;this.active=!1,this.isDying=!0,this.deathProgress=0,this.deathY=.1,this.deathVelocity=0,this.removeTimer=2;const e=Math.sqrt(t.x**2+t.y**2+t.z**2)||1;this.position.x+=t.x/e*.3,this.position.z+=t.z/e*.3;const i=4+Math.floor(Math.random()*4);for(let a=0;a<i;a++){const o=Math.random()*Math.PI*2,s=5+Math.random()*8;this.fragments.push({position:{x:this.position.x,y:.3,z:this.position.z},velocity:{x:Math.cos(o)*s,y:3+Math.random()*4,z:Math.sin(o)*s},size:.08+Math.random()*.1,lifetime:.6+Math.random()*.4,rotation:0,rotationSpeed:0})}}updateDeath(t){this.isDying&&(this.deathProgress+=t*4,this.deathProgress>=1&&(this.deathProgress=1,this.isDying=!1))}canRemove(){return!this.active&&this.removeTimer<=0&&this.fragments.length===0}getShaderData(){let t=0;if(this.active||this.isDying){const i=this.fireIntensity*.5;switch(this.enemyType){case"phantom":t=3+i;break;case"runner":t=5+i;break;case"hopper":t=7+i;break;case"spiker":t=9+i;break;case"boss_green":t=11+i;break;case"boss_black":t=13+i;break;case"boss_blue":t=15+i;break;default:t=1+i}(this.isDying||this.deathProgress>0)&&(t+=100+this.deathProgress*.5)}const e=this.isDying||this.deathProgress>0?this.deathY:this.position.y;return[this.position.x,e,this.position.z,t]}getDeathData(){return!this.isDying&&this.deathProgress<1?[0,0,0,0]:[this.position.x,this.position.z,this.deathProgress,this.radius]}getFragmentsData(){const t=[];for(const e of this.fragments)t.push(e.position.x,e.position.y,e.position.z,e.size);return t}}const O={left:{x:-21,y:1.5,z:0},right:{x:21,y:1.5,z:0}};class pt{targets=[];wave=0;waveActive=!1;waveDelay=4;waveTimer=0;score=0;powerCrystals=[];onTargetDestroyed;onPlayerHit;onWaveComplete;onWaveStart;onPoolDamage;onCrystalDestroyed;onBossPhaseChange;onAcidRain;onBossVortexStart;onBossVortexEnd;onBossVortexWarning;toxicPools=[];acidRainZones=[];greenBossPhase2=!1;acidProjectiles=[];poolDamageTimer=0;collision=null;spawnQueue=[];portalTimers={left:0,right:0};PORTAL_SPAWN_INTERVAL=.7;onEnemySpawn;onSpikerAttack;onSpikerScream;onSpikeHit;spikes=[];constructor(t){this.collision=t||null}isPlayerUnderPlatform(t){return this.collision?this.collision.getCeilingHeight(t)<15:!1}startGame(t=1){this.wave=t-1,this.score=0,this.targets=[],this.toxicPools=[],this.greenBossPhase2=!1,this.spawnQueue=[],this.portalTimers={left:0,right:0},this.startNextWave()}startNextWave(){this.wave++,this.waveActive=!0,this.spawnEnemies(this.wave),this.onWaveStart?.(this.wave)}enemyIdCounter=0;spawnEnemies(t){const e=3.5+t*.3;if(t===5){const c=[{pos:b(-8,3,-18),role:"hunter"},{pos:b(8,3,-18),role:"blocker"}];for(const h of c){const p=new G(h.pos,e,this.enemyIdCounter++,"boss_green",this.collision||void 0);p.greenBossRole=h.role,h.role==="hunter"?p.onAcidRainMark=f=>{this.spawnAcidRainZone(f)}:p.onSpit=(f,u)=>{this.spawnAcidProjectile(f,u)},p.onPhaseChange=f=>{this.onBossPhaseChange?.(p.enemyType,f)},this.targets.push(p)}}else if(t===10){const c=b(0,2.5,-18),h=new G(c,e,this.enemyIdCounter++,"boss_black",this.collision||void 0);h.onSpawnPhantom=f=>{this.spawnPhantomFromBoss(f)},h.onVortexWarning=()=>{this.onBossVortexWarning?.()},h.onVortexStart=()=>{this.onBossVortexStart?.()},h.onVortexEnd=()=>{this.onBossVortexEnd?.()},this.targets.push(h);const p=[{x:10,z:0,height:2.3},{x:5,z:8.66,height:3.5},{x:-5,z:8.66,height:4.7},{x:-10,z:0,height:5.9},{x:-5,z:-8.66,height:7.1},{x:5,z:-8.66,height:8.3}];this.powerCrystals=p.map((f,u)=>({x:f.x,z:f.z,height:f.height,active:!0,platformIndex:u}))}else if(t===15){const c=b(0,2,-18);this.targets.push(new G(c,e,this.enemyIdCounter++,"boss_blue",this.collision||void 0))}if(t===5||t===10||t===15)return;let a,o,s,n,l;t<=5?(a=Math.floor(t*1.2),o=t>=3?Math.floor((t-2)*.8):0,s=0,n=t>=4?Math.floor((t-3)*.5):0,l=t>=2?Math.floor((t-1)*.5):0):t<=10?(a=Math.floor(t*.8),o=Math.floor((t-3)*.6),s=0,n=Math.floor((t-4)*.6),l=Math.floor((t-2)*.6)):(a=Math.floor(t*.7),o=Math.floor((t-5)*.5),s=Math.floor((t-10)*1.5),n=Math.floor((t-6)*.5),l=Math.floor((t-5)*.7)),this.spawnQueue=[];let r=!0;for(let c=0;c<a;c++){const h=e+Math.random()*1.5;this.spawnQueue.push({type:"baneling",speed:h,portalSide:r?"left":"right"}),r=!r}for(let c=0;c<s;c++){const h=e+Math.random()*1;this.spawnQueue.push({type:"runner",speed:h,portalSide:r?"left":"right"}),r=!r}for(let c=0;c<n;c++){const h=e+Math.random()*1;this.spawnQueue.push({type:"hopper",speed:h,portalSide:r?"left":"right"}),r=!r}for(let c=0;c<o;c++){const h=e+Math.random()*1;this.spawnQueue.push({type:"phantom",speed:h,portalSide:r?"left":"right"}),r=!r}for(let c=0;c<l;c++){const h=e*.6;this.spawnQueue.push({type:"spiker",speed:h,portalSide:r?"left":"right"}),r=!r}this.shuffleSpawnQueue()}shuffleSpawnQueue(){for(let t=this.spawnQueue.length-1;t>0;t--){const e=Math.floor(Math.random()*(t+1));[this.spawnQueue[t],this.spawnQueue[e]]=[this.spawnQueue[e],this.spawnQueue[t]]}}spawnFromPortal(t){const e=O[t.portalSide],i=t.portalSide==="left"?1.5:-1.5,a=(Math.random()-.5)*2;let o;t.type==="baneling"?o=.7:t.type==="runner"||t.type==="hopper"?o=.5:t.type==="phantom"?o=1.5+Math.random()*1.5:t.type==="spiker"?o=5+Math.random()*3:o=.7;const s=b(e.x+i,o,e.z+a),n=new G(s,t.speed,this.enemyIdCounter++,t.type,this.collision||void 0);t.type==="spiker"&&(n.onSpikeAttack=(l,r)=>{this.fireSpike(l,r),this.onSpikerAttack?.(l,r)},n.onSpikerScream=()=>{this.onSpikerScream?.()}),this.targets.push(n),this.onEnemySpawn?.(t.type,t.portalSide)}fireSpike(t,e){Math.sqrt((e.x-t.x)**2+(e.y-t.y)**2+(e.z-t.z)**2)<.1||this.spikes.push({start:{...t},end:{...e},active:!0,lifetime:.4,intensity:1,damageDealt:!1})}phantomDamageCooldown=new Map;update(t,e,i){if(!this.waveActive&&this.waveTimer>0){this.waveTimer-=t,this.waveTimer<=0&&this.startNextWave();return}if(this.portalTimers.left>0&&(this.portalTimers.left-=t),this.portalTimers.right>0&&(this.portalTimers.right-=t),this.spawnQueue.length>0){if(this.portalTimers.left<=0){const a=this.spawnQueue.findIndex(o=>o.portalSide==="left");if(a!==-1){const o=this.spawnQueue.splice(a,1)[0];this.spawnFromPortal(o),this.portalTimers.left=this.PORTAL_SPAWN_INTERVAL}}if(this.portalTimers.right<=0){const a=this.spawnQueue.findIndex(o=>o.portalSide==="right");if(a!==-1){const o=this.spawnQueue.splice(a,1)[0];this.spawnFromPortal(o),this.portalTimers.right=this.PORTAL_SPAWN_INTERVAL}}}for(const[a,o]of this.phantomDamageCooldown)o>0&&this.phantomDamageCooldown.set(a,o-t);for(const a of this.targets)a.update(t,e,i),a.checkPlayerCollision(e)&&(a.enemyType==="phantom"?(this.phantomDamageCooldown.get(a.id)||0)<=0&&(this.onPlayerHit?.(a),this.phantomDamageCooldown.set(a.id,1)):a.isBoss?(this.phantomDamageCooldown.get(a.id)||0)<=0&&(this.onPlayerHit?.(a),this.phantomDamageCooldown.set(a.id,1.5)):(this.onPlayerHit?.(a),a.active=!1));this.targets=this.targets.filter(a=>!a.canRemove());for(const a of this.acidProjectiles){a.progress+=t/a.flightTime;const o=a.progress;a.position.x=a.startPos.x+(a.targetPos.x-a.startPos.x)*o,a.position.z=a.startPos.z+(a.targetPos.z-a.startPos.z)*o,a.position.y=a.startPos.y+(1-(2*o-1)*(2*o-1))*8,a.progress>=1&&(this.toxicPools.push({position:{...a.targetPos},radius:.5,maxRadius:3.5,lifetime:6,maxLifetime:6,damage:8,spreadProgress:0}),this.onAcidRain?.(a.targetPos))}this.acidProjectiles=this.acidProjectiles.filter(a=>a.progress<1);for(const a of this.spikes)if(a.active){if(a.lifetime-=t,a.intensity=Math.max(0,a.lifetime/.4),a.lifetime<=0){a.active=!1;continue}if(!a.damageDealt){const o={x:a.end.x-a.start.x,y:a.end.y-a.start.y,z:a.end.z-a.start.z},s=Math.sqrt(o.x**2+o.y**2+o.z**2);if(s>.1){o.x/=s,o.y/=s,o.z/=s;const n={x:e.x-a.start.x,y:e.y-a.start.y,z:e.z-a.start.z},l=n.x*o.x+n.y*o.y+n.z*o.z,r=Math.max(0,Math.min(s,l)),c={x:a.start.x+o.x*r,y:a.start.y+o.y*r,z:a.start.z+o.z*r};Math.sqrt((e.x-c.x)**2+(e.y-c.y)**2+(e.z-c.z)**2)<1.2&&(a.damageDealt=!0,this.onSpikeHit?.())}}}this.spikes=this.spikes.filter(a=>a.active);for(const a of this.toxicPools)a.spreadProgress<1&&(a.spreadProgress=Math.min(1,a.spreadProgress+t/1.5),a.radius=a.maxRadius*(.3+.7*a.spreadProgress));for(const a of this.acidRainZones)a.isRaining?a.lifetime-=t:(a.markTime-=t,a.markTime<=0&&(a.isRaining=!0,this.onAcidRainStart?.(a.position)));if(this.acidRainZones=this.acidRainZones.filter(a=>a.lifetime>0||!a.isRaining),this.poolDamageTimer-=t,this.poolDamageTimer<=0){this.poolDamageTimer=.5;for(const a of this.toxicPools){const o=e.x-a.position.x,s=e.z-a.position.z;if(Math.sqrt(o*o+s*s)<a.radius&&e.y<.8){this.onPoolDamage?.(a.damage);break}}for(const a of this.targets)if((a.isDying||a.deathProgress>0)&&a.enemyType==="baneling"){const o=e.x-a.position.x,s=e.z-a.position.z,n=Math.sqrt(o*o+s*s),l=a.radius*(1+a.deathProgress*.8);if(n<l&&e.y<.8){this.onPoolDamage?.(8);break}}for(const a of this.acidRainZones){if(!a.isRaining)continue;const o=e.x-a.position.x,s=e.z-a.position.z;if(Math.sqrt(o*o+s*s)<a.radius&&!this.isPlayerUnderPlatform(e)){this.onPoolDamage?.(a.damage);break}}}this.waveActive&&this.getActiveCount()===0&&this.spawnQueue.length===0&&(this.waveActive=!1,this.waveTimer=this.waveDelay,this.onWaveComplete?.(this.wave))}trySlice(t,e,i,a,o=!0,s=0){const n=Math.sin(e),l=-Math.cos(e),r=Math.cos(e),c=Math.sin(e);let h,p;s===0?(h=-r*.8+n*.4,p=-c*.8+l*.4):(h=r*.9+n*.3,p=c*.9+l*.3);for(const f of this.targets){if(!f.active||f.requiresJumpToKill&&o)continue;const u=f.position.x-t.x,m=f.position.y-t.y,d=f.position.z-t.z,v=Math.sqrt(u*u+d*d),y=Math.sqrt(u*u+m*m+d*d),T=f.requiresJumpToKill?i+2.5:i+(f.isBoss?f.radius:0);if((f.requiresJumpToKill?y:v)>T)continue;let C=Math.atan2(u,-d)-e;for(;C>Math.PI;)C-=Math.PI*2;for(;C<-Math.PI;)C+=Math.PI*2;if(Math.abs(C)>a/2)continue;const S={x:h*.7+n*.5,y:.3,z:p*.7+l*.5};if(f.isBoss){const R=f.takeDamage(1);if(f.enemyType==="boss_green"&&!R){const z=this.greenBossPhase2?2:1;for(let x=0;x<z;x++)this.spawnBanelingFromBoss(f.position)}if(R){if(f.slice(S),this.score+=1e3*this.wave,this.onTargetDestroyed?.(f),f.enemyType==="boss_green"){this.targets.filter(x=>x.active&&x.enemyType==="boss_green"&&x!==f).length>0&&!this.greenBossPhase2&&(this.greenBossPhase2=!0,this.onBossPhaseChange?.("boss_green",2));for(let x=0;x<5;x++)this.spawnBanelingFromBoss(f.position)}}else{const z=f.enemyType==="boss_green"?8:f.enemyType==="boss_black"?5:12;f.applyKnockback(u,d,z)}return f}else return f.slice(S),this.score+=100*this.wave,this.onTargetDestroyed?.(f),f}return null}trySplashWave(t,e,i){let a=0;const o=Math.sin(e),s=-Math.cos(e);for(const n of this.targets){if(!n.active)continue;const l=n.position.x-t.x,r=n.position.z-t.z,c=Math.sqrt(l*l+r*r),h=i+(n.isBoss,n.radius);if(c>h)continue;const p=c||1,f={x:l/p*.6+o*.5,y:.4,z:r/p*.6+s*.5};if(n.isBoss){const u=n.takeDamage(2);if(n.enemyType==="boss_green"&&!u){const m=this.greenBossPhase2?2:1;for(let d=0;d<m;d++)this.spawnBanelingFromBoss(n.position)}if(u){if(n.slice(f),this.score+=1e3*this.wave,this.onTargetDestroyed?.(n),a++,n.enemyType==="boss_green"){this.targets.filter(d=>d.active&&d.enemyType==="boss_green"&&d!==n).length>0&&!this.greenBossPhase2&&(this.greenBossPhase2=!0,this.onBossPhaseChange?.("boss_green",2));for(let d=0;d<5;d++)this.spawnBanelingFromBoss(n.position)}}else{const m=n.enemyType==="boss_green"?12:n.enemyType==="boss_black"?8:18;n.applyKnockback(l,r,m)}}else n.slice(f),this.score+=100*this.wave,this.onTargetDestroyed?.(n),a++}return a}getShaderData(){const t=new Float32Array(this.targets.length*4);for(let e=0;e<this.targets.length;e++){const[i,a,o,s]=this.targets[e].getShaderData();t[e*4+0]=i,t[e*4+1]=a,t[e*4+2]=o,t[e*4+3]=s}return t}getAllFragmentsData(){const t=[];for(const e of this.targets)t.push(...e.getFragmentsData());return new Float32Array(t)}getPoolsShaderData(){const t=new Float32Array(this.toxicPools.length*4);for(let e=0;e<this.toxicPools.length;e++){const i=this.toxicPools[e];t[e*4+0]=i.position.x,t[e*4+1]=i.position.z,t[e*4+2]=i.radius,t[e*4+3]=i.spreadProgress}return t}getAcidProjectilesData(){const t=new Float32Array(this.acidProjectiles.length*4);for(let e=0;e<this.acidProjectiles.length;e++){const i=this.acidProjectiles[e];t[e*4+0]=i.position.x,t[e*4+1]=i.position.y,t[e*4+2]=i.position.z,t[e*4+3]=i.progress}return t}getSpikesData(){const t=new Float32Array(Math.min(this.spikes.length,8)*4);for(let e=0;e<Math.min(this.spikes.length,8);e++){const i=this.spikes[e];t[e*4+0]=i.start.x,t[e*4+1]=i.start.y,t[e*4+2]=i.start.z,t[e*4+3]=i.lifetime}return t}getSpikeTargetsData(){const t=new Float32Array(Math.min(this.spikes.length,8)*4);for(let e=0;e<Math.min(this.spikes.length,8);e++){const i=this.spikes[e];t[e*4+0]=i.end.x,t[e*4+1]=i.end.y,t[e*4+2]=i.end.z,t[e*4+3]=i.intensity}return t}getAcidRainZonesData(){const t=new Float32Array(this.acidRainZones.length*4);for(let e=0;e<this.acidRainZones.length;e++){const i=this.acidRainZones[e];t[e*4+0]=i.position.x,t[e*4+1]=i.position.z,t[e*4+2]=i.radius,t[e*4+3]=i.isRaining?1:(1-i.markTime/1.5)*.5}return t}spawnAcidProjectile(t,e){this.acidProjectiles.push({position:{...t},targetPos:{...e},startPos:{...t},progress:0,flightTime:1.2}),this.onAcidSpit?.()}spawnAcidRainZone(t){this.acidRainZones.push({position:{...t},radius:4,lifetime:5,markTime:1.5,isRaining:!1,damage:6}),this.onAcidRainMarkSound?.()}onAcidSpit;onAcidRainMarkSound;onAcidRainStart;spawnBanelingFromBoss(t){const e=Math.random()*Math.PI*2,i=5+Math.random()*3,a=b(t.x+Math.cos(e)*2,t.y+Math.random()*1.5,t.z+Math.sin(e)*2),o=new G(a,i,this.enemyIdCounter++,"baneling",this.collision||void 0);o.velocity=b(Math.cos(e)*8,3+Math.random()*3,Math.sin(e)*8),this.targets.push(o)}spawnPhantomFromBoss(t){const e=8+Math.random()*4,i=new G(t,e,this.enemyIdCounter++,"phantom",this.collision||void 0);this.targets.push(i)}getVortexPull(t){for(const e of this.targets)if(e.active&&e.enemyType==="boss_black")return e.getVortexPull(t);return b(0,0,0)}trySliceCrystal(t,e,i){for(const a of this.powerCrystals){if(!a.active)continue;const o=a.x-t.x,s=a.height-t.y,n=a.z-t.z;if(Math.sqrt(o*o+s*s+n*n)>i+1)continue;let c=Math.atan2(o,-n)-e;for(;c>Math.PI;)c-=Math.PI*2;for(;c<-Math.PI;)c+=Math.PI*2;if(Math.abs(c)>Math.PI/3)continue;a.active=!1;const h=this.powerCrystals.filter(p=>p.active).length;this.onCrystalDestroyed?.(h),this.spawnPhantomFromBoss(b(a.x,a.height,a.z));for(const p of this.targets)p.active&&p.enemyType==="boss_black"&&(p.maxHp-=10,p.hp>p.maxHp&&(p.hp=p.maxHp));return!0}return!1}getCrystalsData(){const t=new Float32Array(24);for(let e=0;e<6;e++)if(e<this.powerCrystals.length){const i=this.powerCrystals[e];t[e*4+0]=i.x,t[e*4+1]=i.z,t[e*4+2]=i.height,t[e*4+3]=i.active?1:0}else t[e*4+3]=0;return t}getActiveCount(){return this.targets.filter(t=>t.active).length}getActiveBoss(){return this.targets.find(t=>t.active&&t.isBoss)||null}getClosestEnemyDistance(t){let e=1/0;for(const i of this.targets){if(!i.active)continue;const a=i.position.x-t.x,o=i.position.y-t.y,s=i.position.z-t.z,n=Math.sqrt(a*a+o*o+s*s);n<e&&(e=n)}return e}createArenaTargets(t=8){this.startGame()}checkProjectileHit(t,e){return null}}class Y{position;type;radius=1;active=!0;lifetime;phase;baseY;constructor(t,e){this.position={...t},this.type=e,this.phase=Math.random()*Math.PI*2,this.baseY=t.y,this.lifetime=30}update(t,e){this.active&&(this.position.y=this.baseY+Math.sin(e*3+this.phase)*.2,this.lifetime-=t,this.lifetime<=0&&(this.active=!1))}checkPickup(t){return this.active&&K(this.position,t)<this.radius+.5?(this.active=!1,!0):!1}getShaderData(){let t=0;return this.active&&(this.type==="health"?t=9:this.type==="stimpack"?t=10:this.type==="charge"?t=11:this.type==="health_big"&&(t=12)),[this.position.x,this.position.y,this.position.z,t]}}class ft{pickups=[];spawnTimer=10;edgePositions=[{x:5,y:1,z:28},{x:-5,y:1,z:-28}];edgeSpawnTimer=30;maxPickups=5;chargeOnBalcony=null;chargeRespawnTimer=0;constructor(){this.spawnChargeOnBalcony()}update(t,e,i){for(const a of this.pickups)a.update(t,e);if(this.pickups=this.pickups.filter(a=>a.active),this.spawnTimer-=t,this.spawnTimer<=0&&this.pickups.length<this.maxPickups&&(this.spawnOnEdges(),this.spawnTimer=15+Math.random()*10),this.edgeSpawnTimer-=t,this.edgeSpawnTimer<=0&&(this.spawnOnEdges(),this.edgeSpawnTimer=30),this.updateChargeRespawn(t),this.checkChargePickup(i))return"charge";for(const a of this.pickups)if(a.type!=="charge"&&a.checkPickup(i))return a.type;return null}spawnOnEdges(){for(const t of this.edgePositions){const e=b(t.x,t.y,t.z);this.pickups.find(a=>a.active&&(a.type==="health"||a.type==="health_big")&&Math.abs(a.position.x-e.x)<3&&Math.abs(a.position.z-e.z)<3)||this.pickups.push(new Y(e,"health_big"))}}spawnAfterKill(t){}spawnChargeOnBalcony(){const t=b(0,10.3,0);this.chargeOnBalcony=new Y(t,"charge"),this.chargeOnBalcony.lifetime=999999,this.pickups.push(this.chargeOnBalcony)}checkChargePickup(t){return!this.chargeOnBalcony||!this.chargeOnBalcony.active||t.y<10.5?!1:this.chargeOnBalcony.checkPickup(t)?(this.chargeOnBalcony=null,this.chargeRespawnTimer=60,!0):!1}respawnChargeAfterBoss(){(!this.chargeOnBalcony||!this.chargeOnBalcony.active)&&(this.pickups=this.pickups.filter(t=>t!==this.chargeOnBalcony),this.chargeOnBalcony=null,this.chargeRespawnTimer=0,this.spawnChargeOnBalcony())}updateChargeRespawn(t){this.chargeOnBalcony===null&&this.chargeRespawnTimer>0&&(this.chargeRespawnTimer-=t,this.chargeRespawnTimer<=0&&this.spawnChargeOnBalcony())}getShaderData(){const t=new Float32Array(this.pickups.length*4);for(let e=0;e<this.pickups.length;e++){const[i,a,o,s]=this.pickups[e].getShaderData();t[e*4+0]=i,t[e*4+1]=a,t[e*4+2]=o,t[e*4+3]=s}return t}}class ut{ctx=null;masterGain=null;musicGain=null;sfxGain=null;reverb=null;distortion=null;compressor=null;voidFilter=null;isInVoidMode=!1;isStarted=!1;isMuted=!1;start(){this.isStarted||(this.ctx=new(window.AudioContext||window.webkitAudioContext),this.compressor=this.ctx.createDynamicsCompressor(),this.compressor.threshold.value=-24,this.compressor.knee.value=30,this.compressor.ratio.value=12,this.compressor.attack.value=.003,this.compressor.release.value=.25,this.compressor.connect(this.ctx.destination),this.masterGain=this.ctx.createGain(),this.masterGain.gain.value=.4,this.masterGain.connect(this.compressor),this.distortion=this.createDistortion(20),this.distortion.connect(this.masterGain),this.reverb=this.createReverb(2.5),this.reverb.connect(this.masterGain),this.musicGain=this.ctx.createGain(),this.musicGain.gain.value=.12,this.musicGain.connect(this.masterGain),this.sfxGain=this.ctx.createGain(),this.sfxGain.gain.value=.3,this.sfxGain.connect(this.distortion),this.voidFilter=this.ctx.createBiquadFilter(),this.voidFilter.type="lowpass",this.voidFilter.frequency.value=2e4,this.voidFilter.Q.value=1,this.musicGain.disconnect(),this.sfxGain.disconnect(),this.musicGain.connect(this.voidFilter),this.sfxGain.connect(this.voidFilter),this.voidFilter.connect(this.distortion),this.isStarted=!0,this.startSynthwaveMusic())}createDistortion(t){const e=this.ctx.createWaveShaper(),i=44100,a=new Float32Array(i),o=Math.PI/180;for(let s=0;s<i;s++){const n=s*2/i-1;a[s]=(3+t)*n*20*o/(Math.PI+t*Math.abs(n))}return e.curve=a,e.oversample="4x",e}createReverb(t){const e=this.ctx.createConvolver(),i=this.ctx.sampleRate,a=i*t,o=this.ctx.createBuffer(2,a,i);for(let s=0;s<2;s++){const n=o.getChannelData(s);for(let l=0;l<a;l++){const r=Math.exp(-3*l/a),c=Math.sin(l*.001)*.3+.7;n[l]=(Math.random()*2-1)*r*c}}return e.buffer=o,e}toggleMute(){this.isMuted=!this.isMuted,this.masterGain&&(this.masterGain.gain.value=this.isMuted?0:this.volume)}volume=.5;setVolume(t){this.volume=Math.max(0,Math.min(1,t)),this.masterGain&&!this.isMuted&&(this.masterGain.gain.value=this.volume)}enterVoidAudio(){if(!this.ctx||!this.voidFilter||this.isInVoidMode)return;this.isInVoidMode=!0;const t=this.ctx.currentTime;this.voidFilter.frequency.cancelScheduledValues(t),this.voidFilter.frequency.setValueAtTime(this.voidFilter.frequency.value,t),this.voidFilter.frequency.exponentialRampToValueAtTime(400,t+.5),this.voidFilter.Q.cancelScheduledValues(t),this.voidFilter.Q.setValueAtTime(this.voidFilter.Q.value,t),this.voidFilter.Q.linearRampToValueAtTime(4,t+.5),this.musicGain&&(this.musicGain.gain.cancelScheduledValues(t),this.musicGain.gain.setValueAtTime(this.musicGain.gain.value,t),this.musicGain.gain.linearRampToValueAtTime(.05,t+.5))}exitVoidAudio(){if(!this.ctx||!this.voidFilter||!this.isInVoidMode)return;this.isInVoidMode=!1;const t=this.ctx.currentTime;this.voidFilter.frequency.cancelScheduledValues(t),this.voidFilter.frequency.setValueAtTime(this.voidFilter.frequency.value,t),this.voidFilter.frequency.exponentialRampToValueAtTime(2e4,t+.3),this.voidFilter.Q.cancelScheduledValues(t),this.voidFilter.Q.setValueAtTime(this.voidFilter.Q.value,t),this.voidFilter.Q.linearRampToValueAtTime(1,t+.3),this.musicGain&&(this.musicGain.gain.cancelScheduledValues(t),this.musicGain.gain.setValueAtTime(this.musicGain.gain.value,t),this.musicGain.gain.linearRampToValueAtTime(.12,t+.3))}proximityOsc=null;proximityGain=null;proximityFilter=null;playSFX(t){if(!(!this.ctx||!this.sfxGain||this.isMuted))switch(t){case"gunshot":this.playKatanaSwing();break;case"reload":this.playGlitch();break;case"footstep":this.playFootstep();break;case"jump":this.playJump();break;case"land":this.playLand();break;case"hit":this.playBanelingExplosion();break;case"phantom_pass":this.playPhantomPass();break;case"runner_hit":this.playRunnerHit();break;case"hopper_hit":this.playHopperHit();break;case"kill":this.playKill();break;case"katana_swing":this.playKatanaSwing();break;case"splash_wave":this.playSplashWave();break;case"charge_pickup":this.playChargePickup();break;case"acid_spit":this.playAcidSpit();break;case"void_whistle":this.playVoidWhistle();break;case"phantom_hit":this.playPhantomHit();break;case"player_hurt":this.playPlayerHurt();break;case"spiker_scream":this.playSpikerScream();break;case"spiker_shoot":this.playSpikerShoot();break;case"explosion":this.playExplosion();break}}updateProximitySound(t){if(!this.ctx||!this.sfxGain||this.isMuted)return;this.proximityOsc||(this.proximityOsc=this.ctx.createOscillator(),this.proximityGain=this.ctx.createGain(),this.proximityFilter=this.ctx.createBiquadFilter(),this.proximityOsc.type="sawtooth",this.proximityFilter.type="lowpass",this.proximityFilter.Q.value=5,this.proximityOsc.connect(this.proximityFilter),this.proximityFilter.connect(this.proximityGain),this.proximityGain.connect(this.sfxGain),this.proximityOsc.start());const e=80+t*200,i=t*.25,a=200+t*1500;if(this.proximityOsc.frequency.setTargetAtTime(e,this.ctx.currentTime,.1),this.proximityGain.gain.setTargetAtTime(i,this.ctx.currentTime,.1),this.proximityFilter.frequency.setTargetAtTime(a,this.ctx.currentTime,.1),t>.6){const o=Math.sin(this.ctx.currentTime*20)*20*t;this.proximityOsc.frequency.setTargetAtTime(e+o,this.ctx.currentTime,.02)}}enemySoundCooldowns=new Map;playEnemyProximitySound(t,e){if(!this.ctx||!this.sfxGain||this.isMuted||e>15)return;const i=Date.now(),a=this.enemySoundCooldowns.get(t)||0,o=t.startsWith("boss")?800:500;if(i-a<o)return;this.enemySoundCooldowns.set(t,i);const s=Math.max(.2,(15-e)/15)*.8,n=this.ctx.currentTime;switch(t){case"baneling":this.playBanelingProximity(s,n);break;case"phantom":this.playPhantomProximity(s,n);break;case"runner":this.playRunnerProximity(s,n);break;case"hopper":this.playHopperProximity(s,n);break;case"boss_green":this.playBossGreenProximity(s,n);break;case"boss_black":this.playBossBlackProximity(s,n);break;case"boss_blue":this.playBossBlueProximity(s,n);break}}playBanelingProximity(t,e){if(!this.ctx||!this.sfxGain)return;const i=this.ctx.createOscillator(),a=this.ctx.createGain(),o=this.ctx.createBiquadFilter();i.type="sine",i.frequency.setValueAtTime(150+Math.random()*50,e),i.frequency.setValueAtTime(100+Math.random()*30,e+.05),i.frequency.setValueAtTime(180+Math.random()*40,e+.1),o.type="lowpass",o.frequency.value=400,o.Q.value=8,a.gain.setValueAtTime(t*.5,e),a.gain.exponentialRampToValueAtTime(.01,e+.15),i.connect(o),o.connect(a),a.connect(this.sfxGain),i.start(e),i.stop(e+.2)}playPhantomProximity(t,e){if(!this.ctx||!this.sfxGain)return;const i=this.ctx.createOscillator(),a=this.ctx.createOscillator(),o=this.ctx.createGain(),s=this.ctx.createBiquadFilter();i.type="sine",i.frequency.setValueAtTime(200,e),i.frequency.linearRampToValueAtTime(150,e+.3),a.type="sine",a.frequency.setValueAtTime(203,e),a.frequency.linearRampToValueAtTime(148,e+.3),s.type="bandpass",s.frequency.value=300,s.Q.value=5,o.gain.setValueAtTime(0,e),o.gain.linearRampToValueAtTime(t*.4,e+.1),o.gain.linearRampToValueAtTime(0,e+.35),i.connect(s),a.connect(s),s.connect(o),o.connect(this.sfxGain),i.start(e),i.stop(e+.4),a.start(e),a.stop(e+.4)}playRunnerProximity(t,e){if(!(!this.ctx||!this.sfxGain))for(let i=0;i<3;i++){const a=this.ctx.createOscillator(),o=this.ctx.createGain(),s=e+i*.06;a.type="triangle",a.frequency.setValueAtTime(80+Math.random()*40,s),a.frequency.exponentialRampToValueAtTime(40,s+.03),o.gain.setValueAtTime(t*.3,s),o.gain.exponentialRampToValueAtTime(.01,s+.04),a.connect(o),o.connect(this.sfxGain),a.start(s),a.stop(s+.05)}}playHopperProximity(t,e){if(!this.ctx||!this.sfxGain)return;const i=this.ctx.createOscillator(),a=this.ctx.createGain();i.type="sine",i.frequency.setValueAtTime(100,e),i.frequency.exponentialRampToValueAtTime(400,e+.1),i.frequency.exponentialRampToValueAtTime(150,e+.2),a.gain.setValueAtTime(t*.4,e),a.gain.exponentialRampToValueAtTime(.01,e+.25),i.connect(a),a.connect(this.sfxGain),i.start(e),i.stop(e+.3)}playBossGreenProximity(t,e){if(!this.ctx||!this.sfxGain)return;const i=this.ctx.sampleRate*.5,a=this.ctx.createBuffer(1,i,this.ctx.sampleRate),o=a.getChannelData(0);for(let u=0;u<i;u++){const m=u/this.ctx.sampleRate,d=Math.sin(m*12)*.5+.5,v=Math.sin(m*Math.PI/.5)*d;o[u]=(Math.random()*2-1)*v*.8}const s=this.ctx.createBufferSource();s.buffer=a;const n=this.ctx.createBiquadFilter();n.type="bandpass",n.frequency.value=3500,n.Q.value=1.5;const l=this.ctx.createBiquadFilter();l.type="highpass",l.frequency.value=800;const r=this.ctx.createGain();r.gain.setValueAtTime(0,e),r.gain.linearRampToValueAtTime(t*.6,e+.05),r.gain.setValueAtTime(t*.6,e+.35),r.gain.exponentialRampToValueAtTime(.01,e+.5),s.connect(n),n.connect(l),l.connect(r),r.connect(this.sfxGain),s.start(e),s.stop(e+.55);const c=this.ctx.createOscillator(),h=this.ctx.createOscillator(),p=this.ctx.createGain(),f=this.ctx.createBiquadFilter();if(c.type="sine",c.frequency.value=85,h.type="sine",h.frequency.value=87,f.type="lowpass",f.frequency.value=150,p.gain.setValueAtTime(t*.15,e),p.gain.exponentialRampToValueAtTime(.01,e+.5),c.connect(f),h.connect(f),f.connect(p),p.connect(this.sfxGain),c.start(e),h.start(e),c.stop(e+.55),h.stop(e+.55),Math.random()>.5){const u=this.ctx.createOscillator(),m=this.ctx.createGain();u.type="sine",u.frequency.setValueAtTime(300,e+.1),u.frequency.exponentialRampToValueAtTime(150,e+.4),m.gain.setValueAtTime(t*.08,e+.1),m.gain.exponentialRampToValueAtTime(.01,e+.4),u.connect(m),m.connect(this.sfxGain),u.start(e+.1),u.stop(e+.45)}}playBossBlackProximity(t,e){if(!this.ctx||!this.sfxGain)return;const i=this.ctx.createOscillator(),a=this.ctx.createOscillator(),o=this.ctx.createGain(),s=this.ctx.createBiquadFilter();i.type="sine",i.frequency.setValueAtTime(40,e),a.type="sine",a.frequency.setValueAtTime(42,e),s.type="lowpass",s.frequency.value=100,s.Q.value=10,o.gain.setValueAtTime(0,e),o.gain.linearRampToValueAtTime(t*.6,e+.15),o.gain.linearRampToValueAtTime(0,e+.4),i.connect(s),a.connect(s),s.connect(o),o.connect(this.sfxGain),i.start(e),i.stop(e+.45),a.start(e),a.stop(e+.45);const n=this.ctx.createOscillator(),l=this.ctx.createGain();n.type="sawtooth",n.frequency.setValueAtTime(80,e),n.frequency.exponentialRampToValueAtTime(30,e+.3),l.gain.setValueAtTime(t*.2,e),l.gain.exponentialRampToValueAtTime(.01,e+.35),n.connect(l),l.connect(this.sfxGain),n.start(e),n.stop(e+.4)}playBossBlueProximity(t,e){if(!this.ctx||!this.sfxGain)return;const i=this.ctx.sampleRate*.15,a=this.ctx.createBuffer(1,i,this.ctx.sampleRate),o=a.getChannelData(0);for(let h=0;h<i;h++)o[h]=Math.random()>.95?Math.random()*2-1:0;const s=this.ctx.createBufferSource();s.buffer=a;const n=this.ctx.createBiquadFilter();n.type="highpass",n.frequency.value=3e3;const l=this.ctx.createGain();l.gain.setValueAtTime(t*.4,e),l.gain.exponentialRampToValueAtTime(.01,e+.15),s.connect(n),n.connect(l),l.connect(this.sfxGain),s.start(e),s.stop(e+.18);const r=this.ctx.createOscillator(),c=this.ctx.createGain();r.type="sine",r.frequency.setValueAtTime(2e3+Math.random()*500,e),r.frequency.exponentialRampToValueAtTime(500,e+.1),c.gain.setValueAtTime(t*.25,e),c.gain.exponentialRampToValueAtTime(.01,e+.12),r.connect(c),c.connect(this.sfxGain),r.start(e),r.stop(e+.15)}playBanelingExplosion(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(100,t),e.frequency.exponentialRampToValueAtTime(20,t+.3),i.gain.setValueAtTime(.7,t),i.gain.exponentialRampToValueAtTime(.01,t+.4),e.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+.5);const a=this.createNoise(.4),o=this.ctx.createGain(),s=this.ctx.createBiquadFilter(),n=this.ctx.createBiquadFilter();s.type="bandpass",s.frequency.setValueAtTime(3e3,t),s.frequency.exponentialRampToValueAtTime(500,t+.3),s.Q.value=3,n.type="highpass",n.frequency.value=1e3,o.gain.setValueAtTime(.5,t),o.gain.exponentialRampToValueAtTime(.01,t+.35),a.connect(s),s.connect(n),n.connect(o),o.connect(this.sfxGain);for(let h=0;h<5;h++){const p=h*.04,f=this.ctx.createOscillator(),u=this.ctx.createGain();f.type="sine",f.frequency.setValueAtTime(400+Math.random()*600,t+p),f.frequency.exponentialRampToValueAtTime(100+Math.random()*100,t+p+.08),u.gain.setValueAtTime(.15,t+p),u.gain.exponentialRampToValueAtTime(.01,t+p+.1),f.connect(u),u.connect(this.sfxGain),f.start(t+p),f.stop(t+p+.15)}const l=this.createNoise(.8),r=this.ctx.createGain(),c=this.ctx.createBiquadFilter();c.type="highpass",c.frequency.value=4e3,r.gain.setValueAtTime(.2,t+.1),r.gain.exponentialRampToValueAtTime(.01,t+.7),l.connect(c),c.connect(r),r.connect(this.sfxGain)}playVoidWhistle(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sine",e.frequency.setValueAtTime(600,t),e.frequency.exponentialRampToValueAtTime(1200,t+.8),e.frequency.exponentialRampToValueAtTime(800,t+1.2),a.type="bandpass",a.frequency.setValueAtTime(800,t),a.frequency.linearRampToValueAtTime(1500,t+.8),a.Q.value=8,i.gain.setValueAtTime(0,t),i.gain.linearRampToValueAtTime(.25,t+.3),i.gain.setValueAtTime(.25,t+.8),i.gain.exponentialRampToValueAtTime(.01,t+1.3),e.connect(a),a.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+1.4);const o=this.ctx.createOscillator(),s=this.ctx.createGain();o.type="triangle",o.frequency.setValueAtTime(150,t),o.frequency.linearRampToValueAtTime(200,t+1),s.gain.setValueAtTime(0,t),s.gain.linearRampToValueAtTime(.1,t+.2),s.gain.setValueAtTime(.1,t+.8),s.gain.exponentialRampToValueAtTime(.01,t+1.2),o.connect(s),s.connect(this.sfxGain),o.start(t),o.stop(t+1.3)}playPhantomHit(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(80,t),e.frequency.exponentialRampToValueAtTime(30,t+.2),a.type="lowpass",a.frequency.setValueAtTime(500,t),a.frequency.exponentialRampToValueAtTime(100,t+.15),a.Q.value=3,i.gain.setValueAtTime(.5,t),i.gain.exponentialRampToValueAtTime(.01,t+.25),e.connect(a),a.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.3);const o=this.ctx.createBuffer(1,this.ctx.sampleRate*.15,this.ctx.sampleRate),s=o.getChannelData(0);for(let c=0;c<s.length;c++)s[c]=(Math.random()*2-1)*Math.exp(-c/(s.length*.3));const n=this.ctx.createBufferSource();n.buffer=o;const l=this.ctx.createGain(),r=this.ctx.createBiquadFilter();r.type="lowpass",r.frequency.value=400,l.gain.setValueAtTime(.4,t),l.gain.exponentialRampToValueAtTime(.01,t+.15),n.connect(r),r.connect(l),l.connect(this.sfxGain),n.start(t)}playPlayerHurt(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(180+Math.random()*40,t),e.frequency.exponentialRampToValueAtTime(120,t+.08),e.frequency.exponentialRampToValueAtTime(80,t+.25),a.type="lowpass",a.frequency.value=600,a.Q.value=2,i.gain.setValueAtTime(.25,t),i.gain.linearRampToValueAtTime(.18,t+.05),i.gain.exponentialRampToValueAtTime(.01,t+.3),e.connect(a),a.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.35);const o=this.ctx.createOscillator(),s=this.ctx.createGain();o.type="triangle",o.frequency.setValueAtTime(100,t),o.frequency.exponentialRampToValueAtTime(60,t+.2),s.gain.setValueAtTime(.12,t),s.gain.exponentialRampToValueAtTime(.01,t+.2),o.connect(s),s.connect(this.sfxGain),o.start(t),o.stop(t+.25);const n=this.createNoise(.2),l=this.ctx.createGain(),r=this.ctx.createBiquadFilter();r.type="bandpass",r.frequency.setValueAtTime(800,t),r.frequency.exponentialRampToValueAtTime(300,t+.15),r.Q.value=.8,l.gain.setValueAtTime(.2,t),l.gain.exponentialRampToValueAtTime(.01,t+.18),n.connect(r),r.connect(l),l.connect(this.sfxGain)}playBanelingSpawn(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime;for(let l=0;l<4;l++){const r=l*.05+Math.random()*.02,c=this.ctx.createOscillator(),h=this.ctx.createGain(),p=this.ctx.createBiquadFilter();c.type="sine";const f=200+Math.random()*300;c.frequency.setValueAtTime(f,t+r),c.frequency.exponentialRampToValueAtTime(f*.4,t+r+.12),p.type="lowpass",p.frequency.value=800,p.Q.value=4,h.gain.setValueAtTime(.2,t+r),h.gain.exponentialRampToValueAtTime(.01,t+r+.15),c.connect(p),p.connect(h),h.connect(this.sfxGain),c.start(t+r),c.stop(t+r+.2)}const e=Math.floor(this.ctx.sampleRate*.2),i=this.ctx.createBuffer(1,e,this.ctx.sampleRate),a=i.getChannelData(0);for(let l=0;l<e;l++)a[l]=(Math.random()*2-1)*Math.exp(-l/(e*.3))*.3;const o=this.ctx.createBufferSource();o.buffer=i;const s=this.ctx.createGain(),n=this.ctx.createBiquadFilter();n.type="lowpass",n.frequency.value=600,s.gain.setValueAtTime(.25,t),s.gain.exponentialRampToValueAtTime(.01,t+.2),o.connect(n),n.connect(s),s.connect(this.sfxGain),o.start(t)}playPhantomSpawn(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="triangle",e.frequency.setValueAtTime(150,t),e.frequency.exponentialRampToValueAtTime(600,t+.3),e.frequency.setValueAtTime(500,t+.35),a.type="bandpass",a.frequency.setValueAtTime(300,t),a.frequency.linearRampToValueAtTime(800,t+.3),a.Q.value=6,i.gain.setValueAtTime(0,t),i.gain.linearRampToValueAtTime(.2,t+.1),i.gain.setValueAtTime(.2,t+.25),i.gain.exponentialRampToValueAtTime(.01,t+.5),e.connect(a),a.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+.55);const o=this.ctx.createOscillator(),s=this.ctx.createGain();o.type="sine",o.frequency.setValueAtTime(80,t),o.frequency.linearRampToValueAtTime(120,t+.3),s.gain.setValueAtTime(0,t),s.gain.linearRampToValueAtTime(.15,t+.1),s.gain.exponentialRampToValueAtTime(.01,t+.4),o.connect(s),s.connect(this.sfxGain),o.start(t),o.stop(t+.45)}playRunnerSpawn(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(200,t),e.frequency.linearRampToValueAtTime(400,t+.05),e.frequency.linearRampToValueAtTime(250,t+.1),e.frequency.linearRampToValueAtTime(350,t+.15),e.frequency.linearRampToValueAtTime(200,t+.2),a.type="highpass",a.frequency.value=1e3,a.Q.value=2,i.gain.setValueAtTime(.15,t),i.gain.exponentialRampToValueAtTime(.01,t+.25),e.connect(a),a.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.3);const o=Math.floor(this.ctx.sampleRate*.15),s=this.ctx.createBuffer(1,o,this.ctx.sampleRate),n=s.getChannelData(0);for(let h=0;h<o;h++){const p=Math.sin(h/this.ctx.sampleRate*60*Math.PI*2)*.5+.5;n[h]=(Math.random()*2-1)*p*Math.exp(-h/(o*.5))}const l=this.ctx.createBufferSource();l.buffer=s;const r=this.ctx.createGain(),c=this.ctx.createBiquadFilter();c.type="highpass",c.frequency.value=2e3,r.gain.setValueAtTime(.2,t),r.gain.exponentialRampToValueAtTime(.01,t+.15),l.connect(c),c.connect(r),r.connect(this.sfxGain),l.start(t)}playHopperSpawn(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(150,t),e.frequency.exponentialRampToValueAtTime(400,t+.08),e.frequency.exponentialRampToValueAtTime(200,t+.2),e.frequency.exponentialRampToValueAtTime(300,t+.25),i.gain.setValueAtTime(.3,t),i.gain.exponentialRampToValueAtTime(.01,t+.35),e.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.4);const a=this.ctx.createOscillator(),o=this.ctx.createGain(),s=this.ctx.createBiquadFilter();a.type="square",a.frequency.setValueAtTime(800,t+.05),a.frequency.linearRampToValueAtTime(1200,t+.1),a.frequency.linearRampToValueAtTime(600,t+.15),s.type="bandpass",s.frequency.value=1e3,s.Q.value=5,o.gain.setValueAtTime(0,t+.05),o.gain.linearRampToValueAtTime(.15,t+.08),o.gain.exponentialRampToValueAtTime(.01,t+.2),a.connect(s),s.connect(o),o.connect(this.sfxGain),a.start(t+.05),a.stop(t+.25)}playBossSpawn(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(60,t),e.frequency.linearRampToValueAtTime(100,t+.3),e.frequency.exponentialRampToValueAtTime(40,t+.8),a.type="lowpass",a.frequency.setValueAtTime(300,t),a.frequency.linearRampToValueAtTime(500,t+.3),a.frequency.exponentialRampToValueAtTime(200,t+.8),a.Q.value=2,i.gain.setValueAtTime(0,t),i.gain.linearRampToValueAtTime(.5,t+.1),i.gain.setValueAtTime(.5,t+.4),i.gain.exponentialRampToValueAtTime(.01,t+1),e.connect(a),a.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+1.1);const o=this.ctx.createOscillator(),s=this.ctx.createGain();o.type="triangle",o.frequency.setValueAtTime(120,t),o.frequency.linearRampToValueAtTime(180,t+.3),o.frequency.exponentialRampToValueAtTime(80,t+.8),s.gain.setValueAtTime(0,t),s.gain.linearRampToValueAtTime(.3,t+.1),s.gain.exponentialRampToValueAtTime(.01,t+.9),o.connect(s),s.connect(this.sfxGain),o.start(t),o.stop(t+1);const n=Math.floor(this.ctx.sampleRate*.8),l=this.ctx.createBuffer(1,n,this.ctx.sampleRate),r=l.getChannelData(0);for(let f=0;f<n;f++){const u=Math.sin(f/n*Math.PI);r[f]=(Math.random()*2-1)*u*.3}const c=this.ctx.createBufferSource();c.buffer=l;const h=this.ctx.createGain(),p=this.ctx.createBiquadFilter();p.type="lowpass",p.frequency.value=400,h.gain.setValueAtTime(0,t),h.gain.linearRampToValueAtTime(.25,t+.1),h.gain.exponentialRampToValueAtTime(.01,t+.8),c.connect(p),p.connect(h),h.connect(this.sfxGain),h.connect(this.reverb),c.start(t)}playPortalActivate(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(100,t);const a=this.ctx.createOscillator(),o=this.ctx.createGain();a.frequency.value=5,o.gain.value=15,a.connect(o),o.connect(e.frequency),i.gain.setValueAtTime(.2,t),i.gain.exponentialRampToValueAtTime(.01,t+.5),e.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),a.start(t),e.start(t),e.stop(t+.6),a.stop(t+.6)}playSpikerScream(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(800,t),e.frequency.exponentialRampToValueAtTime(2e3,t+.1),e.frequency.exponentialRampToValueAtTime(1500,t+.2),a.type="bandpass",a.frequency.value=1500,a.Q.value=3,i.gain.setValueAtTime(.3,t),i.gain.exponentialRampToValueAtTime(.01,t+.25),e.connect(a),a.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.3);const o=this.ctx.createOscillator(),s=this.ctx.createGain();o.type="sine",o.frequency.setValueAtTime(1200,t);const n=this.ctx.createOscillator(),l=this.ctx.createGain();n.frequency.value=25,l.gain.value=100,n.connect(l),l.connect(o.frequency),s.gain.setValueAtTime(.15,t),s.gain.exponentialRampToValueAtTime(.01,t+.2),o.connect(s),s.connect(this.sfxGain),n.start(t),o.start(t),o.stop(t+.25),n.stop(t+.25)}playSpikerShoot(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sine",e.frequency.setValueAtTime(3e3,t),e.frequency.exponentialRampToValueAtTime(800,t+.15),a.type="highpass",a.frequency.value=1e3,i.gain.setValueAtTime(.2,t),i.gain.exponentialRampToValueAtTime(.01,t+.15),e.connect(a),a.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.2);const o=this.ctx.createOscillator(),s=this.ctx.createGain();o.type="square",o.frequency.setValueAtTime(600,t),o.frequency.exponentialRampToValueAtTime(200,t+.03),s.gain.setValueAtTime(.25,t),s.gain.exponentialRampToValueAtTime(.01,t+.05),o.connect(s),s.connect(this.sfxGain),o.start(t),o.stop(t+.08)}playExplosion(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createBuffer(1,this.ctx.sampleRate*.5,this.ctx.sampleRate),i=e.getChannelData(0);for(let h=0;h<i.length;h++)i[h]=Math.random()>.5?1:-1,h%100<30&&(i[h]*=.3);const a=this.ctx.createBufferSource();a.buffer=e;const o=this.ctx.createGain(),s=this.ctx.createBiquadFilter();s.type="bandpass",s.frequency.setValueAtTime(2e3,t),s.frequency.exponentialRampToValueAtTime(100,t+.3),s.Q.value=3,o.gain.setValueAtTime(.8,t),o.gain.exponentialRampToValueAtTime(.01,t+.4),a.connect(s),s.connect(o),o.connect(this.sfxGain),a.start(t),a.stop(t+.5);const n=this.ctx.createOscillator(),l=this.ctx.createGain();n.type="sine",n.frequency.setValueAtTime(80,t),n.frequency.exponentialRampToValueAtTime(20,t+.3),l.gain.setValueAtTime(.9,t),l.gain.exponentialRampToValueAtTime(.01,t+.4),n.connect(l),l.connect(this.sfxGain),n.start(t),n.stop(t+.4);const r=this.ctx.createOscillator(),c=this.ctx.createGain();r.type="square",r.frequency.setValueAtTime(4e3,t),r.frequency.setValueAtTime(100,t+.05),r.frequency.setValueAtTime(3e3,t+.1),r.frequency.setValueAtTime(50,t+.15),c.gain.setValueAtTime(.3,t),c.gain.setValueAtTime(.5,t+.05),c.gain.setValueAtTime(.2,t+.1),c.gain.exponentialRampToValueAtTime(.01,t+.25),r.connect(c),c.connect(this.sfxGain),r.start(t),r.stop(t+.3)}playPhantomPass(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(400,t),e.frequency.exponentialRampToValueAtTime(100,t+.3),a.type="lowpass",a.frequency.setValueAtTime(2e3,t),a.frequency.exponentialRampToValueAtTime(300,t+.3),a.Q.value=2,i.gain.setValueAtTime(.3,t),i.gain.exponentialRampToValueAtTime(.01,t+.4),e.connect(a),a.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+.5);const o=this.ctx.createOscillator(),s=this.ctx.createGain();o.type="sine",o.frequency.setValueAtTime(60,t),o.frequency.exponentialRampToValueAtTime(30,t+.5),s.gain.setValueAtTime(.4,t),s.gain.exponentialRampToValueAtTime(.01,t+.6),o.connect(s),s.connect(this.sfxGain),o.start(t),o.stop(t+.7);const n=this.createNoise(.3),l=this.ctx.createGain(),r=this.ctx.createBiquadFilter();r.type="bandpass",r.frequency.value=3e3,r.Q.value=5,l.gain.setValueAtTime(.15,t),l.gain.exponentialRampToValueAtTime(.01,t+.25),n.connect(r),r.connect(l),l.connect(this.sfxGain)}playRunnerHit(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sawtooth",e.frequency.setValueAtTime(800,t),e.frequency.exponentialRampToValueAtTime(200,t+.15),i.gain.setValueAtTime(.3,t),i.gain.exponentialRampToValueAtTime(.01,t+.2),e.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.25);for(let s=0;s<4;s++){const n=this.ctx.createOscillator(),l=this.ctx.createGain();n.type="square",n.frequency.value=1e3+Math.random()*2e3;const r=t+s*.03;l.gain.setValueAtTime(.15,r),l.gain.setValueAtTime(0,r+.02),n.connect(l),l.connect(this.sfxGain),n.start(r),n.stop(r+.03)}const a=this.ctx.createOscillator(),o=this.ctx.createGain();a.type="sine",a.frequency.setValueAtTime(120,t),a.frequency.exponentialRampToValueAtTime(40,t+.15),o.gain.setValueAtTime(.4,t),o.gain.exponentialRampToValueAtTime(.01,t+.2),a.connect(o),o.connect(this.sfxGain),a.start(t),a.stop(t+.25)}playHopperHit(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(2e3,t),e.frequency.exponentialRampToValueAtTime(100,t+.2),a.type="bandpass",a.frequency.value=1500,a.Q.value=3,i.gain.setValueAtTime(.35,t),i.gain.exponentialRampToValueAtTime(.01,t+.25),e.connect(a),a.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+.3);const o=this.ctx.createOscillator(),s=this.ctx.createGain();o.type="sine",o.frequency.setValueAtTime(80,t+.05),o.frequency.exponentialRampToValueAtTime(25,t+.3),s.gain.setValueAtTime(.5,t+.05),s.gain.exponentialRampToValueAtTime(.01,t+.35),o.connect(s),s.connect(this.sfxGain),o.start(t+.05),o.stop(t+.4);const n=this.createNoise(.25),l=this.ctx.createGain(),r=this.ctx.createBiquadFilter();r.type="highpass",r.frequency.value=3e3,l.gain.setValueAtTime(.2,t),l.gain.exponentialRampToValueAtTime(.01,t+.15),n.connect(r),r.connect(l),l.connect(this.sfxGain)}playGlitch(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime;for(let e=0;e<5;e++){const i=e*.03+Math.random()*.02,a=this.ctx.createOscillator(),o=this.ctx.createGain(),s=this.ctx.createBiquadFilter();a.type=Math.random()>.5?"square":"sawtooth",a.frequency.value=100+Math.random()*2e3,s.type="bandpass",s.frequency.value=500+Math.random()*3e3,s.Q.value=5+Math.random()*10,o.gain.setValueAtTime(.15,t+i),o.gain.setValueAtTime(0,t+i+.02+Math.random()*.03),a.connect(s),s.connect(o),o.connect(this.sfxGain),o.connect(this.reverb),a.start(t+i),a.stop(t+i+.1)}}footstepCount=0;playFootstep(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime;this.footstepCount++;const e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(60,t),e.frequency.exponentialRampToValueAtTime(25,t+.06),i.gain.setValueAtTime(.12,t),i.gain.exponentialRampToValueAtTime(.01,t+.08),e.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.1);const a=this.createNoise(.05),o=this.ctx.createGain(),s=this.ctx.createBiquadFilter();s.type="lowpass",s.frequency.value=250+Math.random()*150,o.gain.setValueAtTime(.06,t),o.gain.exponentialRampToValueAtTime(.01,t+.04),a.connect(s),s.connect(o),o.connect(this.sfxGain),this.footstepCount%4===0&&this.playRunningBreath()}playRunningBreath(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=Math.random()>.5,i=this.createNoise(e?.15:.2),a=this.ctx.createGain(),o=this.ctx.createBiquadFilter();if(o.type="bandpass",o.frequency.value=e?700:400,o.Q.value=.6,a.gain.setValueAtTime(.01,t),a.gain.linearRampToValueAtTime(.08,t+.05),a.gain.exponentialRampToValueAtTime(.01,t+(e?.12:.18)),i.connect(o),o.connect(a),a.connect(this.sfxGain),!e){const s=this.ctx.createOscillator(),n=this.ctx.createGain();s.type="sine",s.frequency.value=100+Math.random()*30,n.gain.setValueAtTime(.03,t),n.gain.exponentialRampToValueAtTime(.01,t+.1),s.connect(n),n.connect(this.sfxGain),s.start(t),s.stop(t+.12)}}playJump(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(140,t),e.frequency.exponentialRampToValueAtTime(180,t+.05),e.frequency.exponentialRampToValueAtTime(100,t+.12),a.type="lowpass",a.frequency.value=500,a.Q.value=1.5,i.gain.setValueAtTime(.18,t),i.gain.exponentialRampToValueAtTime(.01,t+.12),e.connect(a),a.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.15);const o=this.createNoise(.1),s=this.ctx.createGain(),n=this.ctx.createBiquadFilter();n.type="bandpass",n.frequency.value=500,n.Q.value=.7,s.gain.setValueAtTime(.1,t),s.gain.exponentialRampToValueAtTime(.01,t+.08),o.connect(n),n.connect(s),s.connect(this.sfxGain);const l=this.ctx.createOscillator(),r=this.ctx.createGain();l.type="sine",l.frequency.setValueAtTime(60,t),l.frequency.exponentialRampToValueAtTime(40,t+.08),r.gain.setValueAtTime(.15,t),r.gain.exponentialRampToValueAtTime(.01,t+.1),l.connect(r),r.connect(this.sfxGain),l.start(t),l.stop(t+.12)}playLand(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(100,t),e.frequency.exponentialRampToValueAtTime(20,t+.15),i.gain.setValueAtTime(.5,t),i.gain.exponentialRampToValueAtTime(.01,t+.2),e.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+.25);const a=this.createNoise(.15),o=this.ctx.createGain(),s=this.ctx.createBiquadFilter();s.type="lowpass",s.frequency.value=400,o.gain.setValueAtTime(.3,t),o.gain.exponentialRampToValueAtTime(.01,t+.1),a.connect(s),s.connect(o),o.connect(this.sfxGain)}playKill(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(80,t),e.frequency.exponentialRampToValueAtTime(30,t+.15),i.gain.setValueAtTime(.5,t),i.gain.exponentialRampToValueAtTime(.01,t+.2),e.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+.25);const a=this.createNoise(.2),o=this.ctx.createGain(),s=this.ctx.createBiquadFilter();s.type="lowpass",s.frequency.setValueAtTime(800,t),s.frequency.exponentialRampToValueAtTime(200,t+.15),s.Q.value=2,o.gain.setValueAtTime(.35,t),o.gain.exponentialRampToValueAtTime(.01,t+.18),a.connect(s),s.connect(o),o.connect(this.sfxGain),o.connect(this.reverb);for(let n=0;n<3;n++){const l=.05+n*.04,r=this.ctx.createOscillator(),c=this.ctx.createGain();r.type="sine",r.frequency.setValueAtTime(150+Math.random()*100,t+l),r.frequency.exponentialRampToValueAtTime(50,t+l+.08),c.gain.setValueAtTime(.12,t+l),c.gain.exponentialRampToValueAtTime(.01,t+l+.1),r.connect(c),c.connect(this.sfxGain),r.start(t+l),r.stop(t+l+.12)}}createNoise(t){if(!this.ctx)throw new Error("AudioContext not initialized");const e=this.ctx.sampleRate*t,i=this.ctx.createBuffer(1,e,this.ctx.sampleRate),a=i.getChannelData(0);for(let s=0;s<e;s++)a[s]=Math.random()*2-1;const o=this.ctx.createBufferSource();return o.buffer=i,o.start(),o}playKatanaSwing(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.createNoise(.22),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter(),o=this.ctx.createBiquadFilter();a.type="bandpass",a.frequency.setValueAtTime(2500,t),a.frequency.exponentialRampToValueAtTime(800,t+.18),a.Q.value=2.5,o.type="highpass",o.frequency.value=400,i.gain.setValueAtTime(0,t),i.gain.linearRampToValueAtTime(.3,t+.02),i.gain.exponentialRampToValueAtTime(.01,t+.2),e.connect(a),a.connect(o),o.connect(i),i.connect(this.sfxGain);const s=this.ctx.createOscillator(),n=this.ctx.createGain();s.type="sine",s.frequency.setValueAtTime(3500,t),s.frequency.exponentialRampToValueAtTime(1500,t+.08),n.gain.setValueAtTime(.04,t),n.gain.exponentialRampToValueAtTime(.01,t+.06),s.connect(n),n.connect(this.sfxGain),s.start(t),s.stop(t+.1);const l=this.createNoise(.15),r=this.ctx.createGain(),c=this.ctx.createBiquadFilter();c.type="lowpass",c.frequency.setValueAtTime(300,t),c.frequency.exponentialRampToValueAtTime(100,t+.12),r.gain.setValueAtTime(.15,t+.02),r.gain.exponentialRampToValueAtTime(.01,t+.15),l.connect(c),c.connect(r),r.connect(this.sfxGain)}playSplashWave(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(200,t),e.frequency.exponentialRampToValueAtTime(80,t+.4),a.type="lowpass",a.frequency.setValueAtTime(2e3,t),a.frequency.exponentialRampToValueAtTime(400,t+.4),a.Q.value=10,i.gain.setValueAtTime(.5,t),i.gain.exponentialRampToValueAtTime(.01,t+.5),e.connect(a),a.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+.5);const o=this.createNoise(.3),s=this.ctx.createGain(),n=this.ctx.createBiquadFilter();n.type="bandpass",n.frequency.value=3e3,n.Q.value=5,s.gain.setValueAtTime(.2,t),s.gain.exponentialRampToValueAtTime(.01,t+.25),o.connect(n),n.connect(s),s.connect(this.sfxGain);const l=this.ctx.createOscillator(),r=this.ctx.createGain();l.type="sine",l.frequency.setValueAtTime(800,t),l.frequency.exponentialRampToValueAtTime(400,t+.3),r.gain.setValueAtTime(.15,t),r.gain.exponentialRampToValueAtTime(.01,t+.35),l.connect(r),r.connect(this.sfxGain),l.start(t),l.stop(t+.4);const c=this.ctx.createOscillator(),h=this.ctx.createGain();c.type="sine",c.frequency.setValueAtTime(60,t),c.frequency.exponentialRampToValueAtTime(30,t+.3),h.gain.setValueAtTime(.6,t),h.gain.exponentialRampToValueAtTime(.01,t+.4),c.connect(h),h.connect(this.sfxGain),c.start(t),c.stop(t+.45)}playChargePickup(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createOscillator(),a=this.ctx.createGain(),o=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(150,t),e.frequency.exponentialRampToValueAtTime(800,t+.3),i.type="square",i.frequency.setValueAtTime(152,t),i.frequency.exponentialRampToValueAtTime(810,t+.3),o.type="bandpass",o.frequency.setValueAtTime(500,t),o.frequency.exponentialRampToValueAtTime(2e3,t+.3),o.Q.value=8,a.gain.setValueAtTime(.15,t),a.gain.linearRampToValueAtTime(.35,t+.2),a.gain.exponentialRampToValueAtTime(.01,t+.5),e.connect(o),i.connect(o),o.connect(a),a.connect(this.sfxGain),a.connect(this.reverb),e.start(t),e.stop(t+.5),i.start(t),i.stop(t+.5);const s=this.ctx.createOscillator(),n=this.ctx.createGain();s.type="sine",s.frequency.value=2500,n.gain.setValueAtTime(.12,t+.15),n.gain.exponentialRampToValueAtTime(.01,t+.5),s.connect(n),n.connect(this.reverb),s.start(t+.15),s.stop(t+.55);const l=this.createNoise(.2),r=this.ctx.createGain(),c=this.ctx.createBiquadFilter();c.type="highpass",c.frequency.value=4e3,r.gain.setValueAtTime(.1,t+.1),r.gain.exponentialRampToValueAtTime(.01,t+.3),l.connect(c),c.connect(r),r.connect(this.sfxGain)}playAcidSpit(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sawtooth",e.frequency.setValueAtTime(150,t),e.frequency.exponentialRampToValueAtTime(80,t+.15),i.gain.setValueAtTime(.25,t),i.gain.exponentialRampToValueAtTime(.01,t+.2),e.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+.2);const a=this.ctx.createOscillator(),o=this.ctx.createGain(),s=this.ctx.createBiquadFilter();a.type="sawtooth",a.frequency.setValueAtTime(500,t+.1),a.frequency.exponentialRampToValueAtTime(150,t+1.2),s.type="bandpass",s.frequency.setValueAtTime(400,t),s.frequency.exponentialRampToValueAtTime(200,t+1),s.Q.value=3,o.gain.setValueAtTime(0,t),o.gain.linearRampToValueAtTime(.15,t+.1),o.gain.exponentialRampToValueAtTime(.01,t+1.2),a.connect(s),s.connect(o),o.connect(this.sfxGain),a.start(t),a.stop(t+1.2)}playAcidSplash(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.createNoise(.8),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();a.type="lowpass",a.frequency.setValueAtTime(1200,t),a.frequency.exponentialRampToValueAtTime(400,t+.3),i.gain.setValueAtTime(.4,t),i.gain.exponentialRampToValueAtTime(.01,t+.5),e.connect(a),a.connect(i),i.connect(this.sfxGain);const o=this.createNoise(2),s=this.ctx.createGain(),n=this.ctx.createBiquadFilter();n.type="highpass",n.frequency.value=3500,s.gain.setValueAtTime(0,t+.1),s.gain.linearRampToValueAtTime(.2,t+.2),s.gain.exponentialRampToValueAtTime(.01,t+2),o.connect(n),n.connect(s),s.connect(this.sfxGain);const l=this.ctx.createOscillator(),r=this.ctx.createGain();l.type="sine",l.frequency.setValueAtTime(80,t),l.frequency.exponentialRampToValueAtTime(40,t+.2),r.gain.setValueAtTime(.35,t),r.gain.exponentialRampToValueAtTime(.01,t+.3),l.connect(r),r.connect(this.sfxGain),l.start(t),l.stop(t+.3)}playAcidRainMark(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();e.type="sawtooth",e.frequency.setValueAtTime(200,t),e.frequency.exponentialRampToValueAtTime(600,t+1),a.type="bandpass",a.frequency.setValueAtTime(400,t),a.Q.value=5,i.gain.setValueAtTime(.1,t),i.gain.linearRampToValueAtTime(.25,t+.8),i.gain.exponentialRampToValueAtTime(.01,t+1.2),e.connect(a),a.connect(i),i.connect(this.sfxGain),e.start(t),e.stop(t+1.2);for(let o=0;o<3;o++){const s=this.ctx.createOscillator(),n=this.ctx.createGain();s.type="square",s.frequency.value=800,n.gain.setValueAtTime(0,t+o*.3),n.gain.linearRampToValueAtTime(.1,t+o*.3+.05),n.gain.exponentialRampToValueAtTime(.01,t+o*.3+.15),s.connect(n),n.connect(this.sfxGain),s.start(t+o*.3),s.stop(t+o*.3+.2)}}playAcidRainStart(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.createNoise(3),i=this.ctx.createGain(),a=this.ctx.createBiquadFilter();a.type="bandpass",a.frequency.value=2e3,a.Q.value=1,i.gain.setValueAtTime(0,t),i.gain.linearRampToValueAtTime(.3,t+.2),i.gain.setValueAtTime(.25,t+2.5),i.gain.exponentialRampToValueAtTime(.01,t+3),e.connect(a),a.connect(i),i.connect(this.sfxGain);const o=this.createNoise(3),s=this.ctx.createGain(),n=this.ctx.createBiquadFilter();n.type="highpass",n.frequency.value=5e3,s.gain.setValueAtTime(0,t+.1),s.gain.linearRampToValueAtTime(.15,t+.3),s.gain.exponentialRampToValueAtTime(.01,t+3),o.connect(n),n.connect(s),s.connect(this.sfxGain);const l=this.ctx.createOscillator(),r=this.ctx.createGain();l.type="sine",l.frequency.value=50,r.gain.setValueAtTime(.2,t),r.gain.exponentialRampToValueAtTime(.01,t+2),l.connect(r),r.connect(this.sfxGain),l.start(t),l.stop(t+2)}playBossWarning(){if(!this.ctx||!this.sfxGain)return;const t=this.ctx.currentTime,e=this.ctx.createOscillator(),i=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(120,t),e.frequency.exponentialRampToValueAtTime(80,t+2),i.gain.setValueAtTime(.5,t),i.gain.exponentialRampToValueAtTime(.01,t+2.5),e.connect(i),i.connect(this.sfxGain),i.connect(this.reverb),e.start(t),e.stop(t+2.5);const a=this.ctx.createOscillator(),o=this.ctx.createGain();a.type="sine",a.frequency.setValueAtTime(180,t+.5),a.frequency.exponentialRampToValueAtTime(100,t+2.5),o.gain.setValueAtTime(.3,t+.5),o.gain.exponentialRampToValueAtTime(.01,t+3),a.connect(o),o.connect(this.sfxGain),o.connect(this.reverb),a.start(t+.5),a.stop(t+3);const s=this.createNoise(2),n=this.ctx.createGain(),l=this.ctx.createBiquadFilter();l.type="bandpass",l.frequency.value=800,l.Q.value=5,n.gain.setValueAtTime(0,t+1),n.gain.linearRampToValueAtTime(.1,t+1.5),n.gain.exponentialRampToValueAtTime(.01,t+2.5),s.connect(l),l.connect(n),n.connect(this.reverb)}arpInterval=null;currentMusicMode="normal";musicIntervals=[];isLowHpMode=!1;currentEra=1;rainGain=null;rainSource=null;isRainPlaying=!1;thunderInterval=null;setEra(t){let e=1;if(t>10?e=3:t>5&&(e=2),t>=15&&!this.isRainPlaying?this.startRain():t<15&&this.isRainPlaying&&this.stopRain(),e!==this.currentEra&&this.currentMusicMode==="normal"){this.currentEra=e;for(const i of this.musicIntervals)clearInterval(i),clearTimeout(i);this.musicIntervals=[],this.startSynthwaveMusic()}else this.currentEra=e}startRain(){if(!this.ctx||!this.masterGain||this.isRainPlaying)return;this.isRainPlaying=!0,this.rainGain=this.ctx.createGain(),this.rainGain.gain.value=0,this.rainGain.connect(this.masterGain);const t=this.ctx.sampleRate,i=t*4,a=this.ctx.createBuffer(2,i,t);for(let n=0;n<2;n++){const l=a.getChannelData(n);for(let r=0;r<i;r++){let c=(Math.random()*2-1)*.3;Math.random()<.001&&(c+=(Math.random()*2-1)*.8),c+=Math.sin(r/t*2*Math.PI*.5)*.05,l[r]=c}}this.rainSource=this.ctx.createBufferSource(),this.rainSource.buffer=a,this.rainSource.loop=!0;const o=this.ctx.createBiquadFilter();o.type="lowpass",o.frequency.value=3e3,o.Q.value=.5;const s=this.ctx.createBiquadFilter();s.type="highpass",s.frequency.value=200,s.Q.value=.5,this.rainSource.connect(s),s.connect(o),o.connect(this.rainGain),this.rainSource.start(),this.rainGain.gain.linearRampToValueAtTime(.25,this.ctx.currentTime+2),this.startThunder()}startThunder(){if(!this.ctx||!this.masterGain)return;const t=()=>{if(!this.ctx||!this.masterGain||!this.isRainPlaying)return;const e=this.ctx.currentTime,i=this.ctx.createGain();i.gain.value=0,i.connect(this.masterGain);const a=this.ctx.createBuffer(1,this.ctx.sampleRate*3,this.ctx.sampleRate),o=a.getChannelData(0);for(let h=0;h<o.length;h++)o[h]=(Math.random()*2-1)*Math.exp(-h/(this.ctx.sampleRate*.8));const s=this.ctx.createBufferSource();s.buffer=a;const n=this.ctx.createBiquadFilter();n.type="lowpass",n.frequency.value=150+Math.random()*100,n.Q.value=1,s.connect(n),n.connect(i);const l=this.ctx.createOscillator();l.type="sawtooth",l.frequency.value=80+Math.random()*40;const r=this.ctx.createGain();r.gain.value=0;const c=this.ctx.createBiquadFilter();c.type="bandpass",c.frequency.value=2e3,c.Q.value=2,l.connect(c),c.connect(r),r.connect(i),i.gain.setValueAtTime(0,e),i.gain.linearRampToValueAtTime(.6,e+.1),i.gain.exponentialRampToValueAtTime(.01,e+2.5),r.gain.setValueAtTime(0,e),r.gain.linearRampToValueAtTime(.4,e+.02),r.gain.exponentialRampToValueAtTime(.01,e+.2),s.start(e),l.start(e),s.stop(e+3),l.stop(e+.3)};setTimeout(t,2e3+Math.random()*2e3),this.thunderInterval=setInterval(()=>{this.isRainPlaying&&t()},3e3+Math.random()*3e3)}stopRain(){!this.ctx||!this.isRainPlaying||(this.isRainPlaying=!1,this.thunderInterval&&(clearInterval(this.thunderInterval),this.thunderInterval=null),this.rainGain&&this.rainGain.gain.linearRampToValueAtTime(0,this.ctx.currentTime+1),setTimeout(()=>{if(this.rainSource){try{this.rainSource.stop()}catch{}this.rainSource=null}this.rainGain=null},1100))}startSynthwaveMusic(){if(!(!this.ctx||!this.musicGain))switch(this.currentEra){case 1:this.playEra1Music();break;case 2:this.playEra2Music();break;case 3:this.playEra3Music();break}}playEra1Music(){if(!this.ctx||!this.musicGain)return;const t=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==1)return;const n=this.ctx.currentTime,l=this.ctx.createOscillator(),r=this.ctx.createOscillator(),c=this.ctx.createOscillator(),h=this.ctx.createGain(),p=this.ctx.createBiquadFilter(),f=this.ctx.createGain();l.type="sine",l.frequency.value=82.4,r.type="triangle",r.frequency.value=82.6,c.type="sine",c.frequency.value=.05,h.gain.value=3,c.connect(h),h.connect(l.frequency),p.type="lowpass",p.frequency.value=400,p.Q.value=.5,f.gain.setValueAtTime(0,n),f.gain.linearRampToValueAtTime(.08,n+3),f.gain.linearRampToValueAtTime(.06,n+6),f.gain.linearRampToValueAtTime(0,n+9),l.connect(p),r.connect(p),p.connect(f),f.connect(this.musicGain),l.start(n),r.start(n),c.start(n),l.stop(n+10),r.stop(n+10),c.stop(n+10)};t(),this.musicIntervals.push(setInterval(t,8e3));const e=[[164.8,196,246.9],[146.8,185,220],[130.8,164.8,196],[146.8,174.6,220]];let i=0;const a=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==1)return;const n=this.ctx.currentTime,l=e[i],r=this.ctx.createBiquadFilter(),c=this.ctx.createGain();r.type="lowpass",r.frequency.value=600,r.Q.value=.7,c.gain.setValueAtTime(0,n),c.gain.linearRampToValueAtTime(.04,n+2),c.gain.linearRampToValueAtTime(.03,n+4),c.gain.linearRampToValueAtTime(0,n+6),l.forEach((h,p)=>{const f=this.ctx.createOscillator();f.type="sine",f.frequency.value=h,p>0&&(f.detune.value=(Math.random()-.5)*5),f.connect(r),f.start(n),f.stop(n+7)}),r.connect(c),c.connect(this.musicGain),i=(i+1)%e.length};setTimeout(()=>a(),2e3),this.musicIntervals.push(setInterval(a,5e3));const o=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==1)return;const n=this.ctx.currentTime,l=this.ctx.createOscillator(),r=this.ctx.createGain(),c=[659,784,988,1175,1319];l.type="sine",l.frequency.value=c[Math.floor(Math.random()*c.length)],r.gain.setValueAtTime(0,n),r.gain.linearRampToValueAtTime(.015,n+.5),r.gain.linearRampToValueAtTime(0,n+3),l.connect(r),r.connect(this.musicGain),l.start(n),l.stop(n+3.5)},s=()=>{if(this.currentMusicMode!=="normal"||this.currentEra!==1)return;o();const n=3e3+Math.random()*5e3;this.musicIntervals.push(setTimeout(s,n))};setTimeout(s,4e3)}playEra2Music(){if(!this.ctx||!this.musicGain)return;const t=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==2)return;const s=this.ctx.currentTime,n=this.ctx.createOscillator(),l=this.ctx.createOscillator(),r=this.ctx.createOscillator(),c=this.ctx.createGain(),h=this.ctx.createGain(),p=this.ctx.createBiquadFilter();n.type="sawtooth",n.frequency.value=41,l.type="triangle",l.frequency.value=41.2,r.type="sine",r.frequency.value=.1,c.gain.value=20,r.connect(c),c.connect(n.frequency),p.type="lowpass",p.frequency.value=150,h.gain.setValueAtTime(.12,s),h.gain.linearRampToValueAtTime(.08,s+3),h.gain.exponentialRampToValueAtTime(.01,s+4),n.connect(p),l.connect(p),p.connect(h),h.connect(this.musicGain),r.start(s),n.start(s),l.start(s),r.stop(s+4),n.stop(s+4),l.stop(s+4)};t(),this.musicIntervals.push(setInterval(t,4e3));let e=0;const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==2)return;const s=this.ctx.currentTime;if(e%2===0){const n=this.ctx.createOscillator(),l=this.ctx.createGain();n.type="sine",n.frequency.setValueAtTime(80,s),n.frequency.exponentialRampToValueAtTime(20,s+.3),l.gain.setValueAtTime(.3,s),l.gain.exponentialRampToValueAtTime(.01,s+.4),n.connect(l),l.connect(this.musicGain),n.start(s),n.stop(s+.4)}e++};this.musicIntervals.push(setInterval(i,600));const a=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==2)return;const s=this.ctx.currentTime,n=600+Math.random()*400,l=this.ctx.createOscillator(),r=this.ctx.createGain();l.type="sine",l.frequency.setValueAtTime(n,s),l.frequency.linearRampToValueAtTime(n*.7,s+2),r.gain.setValueAtTime(0,s),r.gain.linearRampToValueAtTime(.04,s+.5),r.gain.linearRampToValueAtTime(0,s+2),l.connect(r),r.connect(this.musicGain),l.start(s),l.stop(s+2)};this.musicIntervals.push(setInterval(a,3e3+Math.random()*2e3));const o=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==2)return;const s=this.ctx.currentTime,n=this.ctx.sampleRate*.5,l=this.ctx.createBuffer(1,n,this.ctx.sampleRate),r=l.getChannelData(0);for(let f=0;f<n;f++)r[f]=(Math.random()*2-1)*Math.exp(-f/(n*.5));const c=this.ctx.createBufferSource();c.buffer=l;const h=this.ctx.createBiquadFilter();h.type="lowpass",h.frequency.value=200;const p=this.ctx.createGain();p.gain.setValueAtTime(.08,s),p.gain.exponentialRampToValueAtTime(.01,s+.5),c.connect(h),h.connect(p),p.connect(this.musicGain),c.start(s),c.stop(s+.5)};this.musicIntervals.push(setInterval(o,1500))}playEra3Music(){if(!this.ctx||!this.musicGain)return;const t=[110,110,146.8,110,130.8,110,164.8,146.8];let e=0;const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==3)return;const c=this.ctx.currentTime,h=this.ctx.createOscillator(),p=this.ctx.createBiquadFilter(),f=this.ctx.createGain();h.type="sawtooth",h.frequency.value=t[e],p.type="lowpass",p.frequency.setValueAtTime(400,c),p.frequency.exponentialRampToValueAtTime(150,c+.15),f.gain.setValueAtTime(.12,c),f.gain.exponentialRampToValueAtTime(.01,c+.2),h.connect(p),p.connect(f),f.connect(this.musicGain),h.start(c),h.stop(c+.22),e=(e+1)%t.length};this.musicIntervals.push(setInterval(i,200));const a=[880,1046,1318,1760,1318,1046,880,659];let o=0;const s=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==3)return;const c=this.ctx.currentTime,h=this.ctx.createOscillator(),p=this.ctx.createGain(),f=this.ctx.createDelay(),u=this.ctx.createGain();h.type="triangle",h.frequency.value=a[o],f.delayTime.value=.15,u.gain.value=.3,p.gain.setValueAtTime(.05,c),p.gain.exponentialRampToValueAtTime(.01,c+.1),h.connect(p),h.connect(f),f.connect(u),u.connect(this.musicGain),p.connect(this.musicGain),h.start(c),h.stop(c+.12),o=(o+1)%a.length};this.musicIntervals.push(setInterval(s,100));const n=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==3)return;const c=this.ctx.currentTime,h=this.ctx.createOscillator(),p=this.ctx.createGain();h.type="sine",h.frequency.setValueAtTime(200,c),h.frequency.exponentialRampToValueAtTime(50,c+.08),p.gain.setValueAtTime(.2,c),p.gain.exponentialRampToValueAtTime(.01,c+.12),h.connect(p),p.connect(this.musicGain),h.start(c),h.stop(c+.12)};this.musicIntervals.push(setInterval(n,400));const l=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==3)return;const c=this.ctx.currentTime,h=[220,277,330,440];for(const p of h){const f=this.ctx.createOscillator(),u=this.ctx.createGain();f.type="sine",f.frequency.value=p,u.gain.setValueAtTime(0,c),u.gain.linearRampToValueAtTime(.03,c+.5),u.gain.linearRampToValueAtTime(.02,c+2),u.gain.linearRampToValueAtTime(0,c+3),f.connect(u),u.connect(this.musicGain),f.start(c),f.stop(c+3.5)}};l(),this.musicIntervals.push(setInterval(l,4e3));const r=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal"||this.currentEra!==3)return;const c=this.ctx.currentTime,h=this.ctx.createOscillator(),p=this.ctx.createGain();h.type="sawtooth",h.frequency.setValueAtTime(1500+Math.random()*1e3,c),h.frequency.exponentialRampToValueAtTime(100,c+.1),p.gain.setValueAtTime(.06,c),p.gain.exponentialRampToValueAtTime(.001,c+.1),h.connect(p),p.connect(this.musicGain),h.start(c),h.stop(c+.1)};this.musicIntervals.push(setInterval(r,800+Math.random()*600))}setLowHpMode(t){if(!(!this.ctx||!this.musicGain)&&!(this.currentMusicMode!=="normal"&&this.currentMusicMode!=="low_hp")){if(t&&!this.isLowHpMode){this.isLowHpMode=!0,this.currentMusicMode="low_hp";for(const e of this.musicIntervals)clearInterval(e),clearTimeout(e);this.musicIntervals=[],this.playLowHpMusic()}else if(!t&&this.isLowHpMode){this.isLowHpMode=!1,this.currentMusicMode="normal";for(const e of this.musicIntervals)clearInterval(e),clearTimeout(e);this.musicIntervals=[],this.startSynthwaveMusic()}}}playLowHpMusic(){if(!this.ctx||!this.musicGain)return;const t=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="low_hp")return;const s=this.ctx.currentTime;for(let n=0;n<2;n++){const l=this.ctx.createOscillator(),r=this.ctx.createGain();l.type="sine",l.frequency.value=40;const c=n*.15;r.gain.setValueAtTime(0,s+c),r.gain.linearRampToValueAtTime(.3,s+c+.05),r.gain.exponentialRampToValueAtTime(.01,s+c+.2),l.connect(r),r.connect(this.musicGain),l.start(s+c),l.stop(s+c+.25)}};this.musicIntervals.push(setInterval(t,800));const e=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="low_hp")return;const s=this.ctx.currentTime,n=this.ctx.createOscillator(),l=this.ctx.createOscillator(),r=this.ctx.createGain(),c=this.ctx.createBiquadFilter();n.type="sawtooth",n.frequency.value=55,l.type="sawtooth",l.frequency.value=55.5,c.type="lowpass",c.frequency.value=200,c.Q.value=5,r.gain.setValueAtTime(.1,s),r.gain.linearRampToValueAtTime(.15,s+1),r.gain.linearRampToValueAtTime(.05,s+2),n.connect(c),l.connect(c),c.connect(r),r.connect(this.musicGain),n.start(s),n.stop(s+2.5),l.start(s),l.stop(s+2.5)};e(),this.musicIntervals.push(setInterval(e,2500));const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="low_hp")return;const s=this.ctx.currentTime,n=1+Math.floor(Math.random()*3);for(let l=0;l<n;l++){const r=Math.floor(this.ctx.sampleRate*(.02+Math.random()*.03)),c=this.ctx.createBuffer(1,r,this.ctx.sampleRate),h=c.getChannelData(0);for(let m=0;m<r;m++)h[m]=(Math.random()*2-1)*Math.exp(-m/(r*.3));const p=this.ctx.createBufferSource();p.buffer=c;const f=this.ctx.createBiquadFilter();f.type="highpass",f.frequency.value=3e3+Math.random()*5e3;const u=this.ctx.createGain();u.gain.setValueAtTime(.05+Math.random()*.05,s+l*.05),u.gain.exponentialRampToValueAtTime(.001,s+l*.05+.05),p.connect(f),f.connect(u),u.connect(this.musicGain),p.start(s+l*.05),p.stop(s+l*.05+.05)}};this.musicIntervals.push(setInterval(i,500+Math.random()*500));const a=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="low_hp")return;const s=this.ctx.currentTime,n=this.ctx.createOscillator(),l=this.ctx.createGain();n.type="square";const r=[220,233.1],c=r[Math.floor(Math.random()*r.length)];n.frequency.value=c,l.gain.setValueAtTime(0,s),l.gain.linearRampToValueAtTime(.08,s+.1),l.gain.linearRampToValueAtTime(.06,s+.3),l.gain.exponentialRampToValueAtTime(.01,s+.5),n.connect(l),l.connect(this.musicGain),n.start(s),n.stop(s+.5)};this.musicIntervals.push(setInterval(a,1500+Math.random()*1e3));const o=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="low_hp")return;const s=this.ctx.currentTime,n=this.ctx.sampleRate*.1,l=this.ctx.createBuffer(1,n,this.ctx.sampleRate),r=l.getChannelData(0);for(let f=0;f<n;f++)r[f]=Math.random()>.7?(Math.random()*2-1)*.5:0;const c=this.ctx.createBufferSource();c.buffer=l;const h=this.ctx.createBiquadFilter();h.type="bandpass",h.frequency.value=2e3,h.Q.value=3;const p=this.ctx.createGain();p.gain.setValueAtTime(.03,s),p.gain.exponentialRampToValueAtTime(.001,s+.1),c.connect(h),h.connect(p),p.connect(this.musicGain),c.start(s),c.stop(s+.1)};this.musicIntervals.push(setInterval(o,300+Math.random()*400))}bossGreenPhase=1;setBossMusic(t){if(!(!this.ctx||!this.musicGain)){for(const e of this.musicIntervals)clearInterval(e),clearTimeout(e);if(this.musicIntervals=[],this.bossGreenPhase=1,t===null)this.currentMusicMode="normal",this.startSynthwaveMusic();else switch(this.currentMusicMode=t,t){case"boss_green":this.playBossGreenMusic();break;case"boss_black":this.playBossBlackMusic();break;case"boss_blue":this.playBossBlueMusic();break}}}setBossGreenPhase2(){if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green"||this.bossGreenPhase===2)return;this.bossGreenPhase=2;const t=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green")return;const a=this.ctx.currentTime,o=this.ctx.createOscillator(),s=this.ctx.createOscillator(),n=this.ctx.createGain(),l=this.ctx.createWaveShaper();o.type="sine",o.frequency.setValueAtTime(200,a),o.frequency.exponentialRampToValueAtTime(30,a+.15),s.type="sine",s.frequency.setValueAtTime(100,a),s.frequency.exponentialRampToValueAtTime(20,a+.2);const r=new Float32Array(256);for(let c=0;c<256;c++){const h=c/128-1;r[c]=Math.tanh(h*5)}l.curve=r,n.gain.setValueAtTime(.8,a),n.gain.exponentialRampToValueAtTime(.01,a+.25),o.connect(l),s.connect(l),l.connect(n),n.connect(this.musicGain),o.start(a),o.stop(a+.25),s.start(a),s.stop(a+.25)};this.musicIntervals.push(setInterval(t,187));const e=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green")return;const a=this.ctx.currentTime,o=this.ctx.createOscillator(),s=this.ctx.createOscillator(),n=this.ctx.createBiquadFilter(),l=this.ctx.createGain();o.type="sawtooth",s.type="square";const r=[110,110,146.8,110],c=r[Math.floor(Math.random()*r.length)];o.frequency.value=c,s.frequency.value=c*1.5,n.type="lowpass",n.Q.value=25,n.frequency.setValueAtTime(300,a),n.frequency.exponentialRampToValueAtTime(2e3,a+.05),n.frequency.exponentialRampToValueAtTime(150,a+.15),l.gain.setValueAtTime(.4,a),l.gain.exponentialRampToValueAtTime(.01,a+.15),o.connect(n),s.connect(n),n.connect(l),l.connect(this.musicGain),o.start(a),s.start(a),o.stop(a+.2),s.stop(a+.2)};this.musicIntervals.push(setInterval(e,93));const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green")return;const a=this.ctx.currentTime,o=this.ctx.createOscillator(),s=this.ctx.createGain();o.type="square",o.frequency.setValueAtTime(500,a),o.frequency.linearRampToValueAtTime(900,a+.15),o.frequency.linearRampToValueAtTime(500,a+.3),s.gain.setValueAtTime(.12,a),s.gain.linearRampToValueAtTime(.18,a+.15),s.gain.linearRampToValueAtTime(0,a+.3),o.connect(s),s.connect(this.musicGain),o.start(a),o.stop(a+.35)};this.musicIntervals.push(setInterval(i,1500))}vortexGain=null;vortexOsc=null;vortexNoise=null;isStormMode=!1;stormGain=null;playVortexSound(t){if(!(!this.ctx||!this.masterGain))if(t){this.vortexGain=this.ctx.createGain(),this.vortexGain.gain.value=0,this.vortexGain.connect(this.masterGain),this.vortexOsc=this.ctx.createOscillator(),this.vortexOsc.type="sawtooth",this.vortexOsc.frequency.value=60;const e=this.ctx.createGain();e.gain.value=.15;const i=this.ctx.createOscillator();i.type="sine",i.frequency.value=3;const a=this.ctx.createGain();a.gain.value=30,i.connect(a),a.connect(this.vortexOsc.frequency);const o=this.ctx.createBiquadFilter();o.type="lowpass",o.frequency.value=200,o.Q.value=5,this.vortexOsc.connect(o),o.connect(e),e.connect(this.vortexGain);const s=this.ctx.createBuffer(1,this.ctx.sampleRate*4,this.ctx.sampleRate),n=s.getChannelData(0);for(let c=0;c<n.length;c++)n[c]=(Math.random()*2-1)*.5;this.vortexNoise=this.ctx.createBufferSource(),this.vortexNoise.buffer=s,this.vortexNoise.loop=!0;const l=this.ctx.createBiquadFilter();l.type="bandpass",l.frequency.value=400,l.Q.value=2;const r=this.ctx.createGain();r.gain.value=.3,this.vortexNoise.connect(l),l.connect(r),r.connect(this.vortexGain),this.vortexOsc.start(),i.start(),this.vortexNoise.start(),this.vortexGain.gain.linearRampToValueAtTime(.5,this.ctx.currentTime+.5),this.activateStormMode()}else this.vortexGain&&this.vortexGain.gain.linearRampToValueAtTime(0,this.ctx.currentTime+.5),this.deactivateStormMode(),setTimeout(()=>{if(this.vortexOsc){try{this.vortexOsc.stop()}catch{}this.vortexOsc=null}if(this.vortexNoise){try{this.vortexNoise.stop()}catch{}this.vortexNoise=null}this.vortexGain=null},600)}activateStormMode(){if(!this.ctx||!this.musicGain||this.isStormMode)return;this.isStormMode=!0,this.stormGain=this.ctx.createGain(),this.stormGain.gain.value=0,this.stormGain.connect(this.musicGain),this.stormGain.gain.linearRampToValueAtTime(1,this.ctx.currentTime+.5);const t=()=>{if(!this.ctx||!this.stormGain||!this.isStormMode)return;const o=this.ctx.currentTime,s=this.ctx.createOscillator(),n=this.ctx.createBiquadFilter(),l=this.ctx.createGain();s.type="sawtooth",s.frequency.setValueAtTime(100,o),s.frequency.exponentialRampToValueAtTime(800,o+2),n.type="lowpass",n.frequency.setValueAtTime(200,o),n.frequency.exponentialRampToValueAtTime(4e3,o+2),n.Q.value=8,l.gain.setValueAtTime(0,o),l.gain.linearRampToValueAtTime(.15,o+1),l.gain.linearRampToValueAtTime(0,o+2),s.connect(n),n.connect(l),l.connect(this.stormGain),s.start(o),s.stop(o+2.1)};this.musicIntervals.push(setInterval(t,2e3)),t();const e=()=>{if(!this.ctx||!this.stormGain||!this.isStormMode)return;const o=this.ctx.currentTime,s=this.ctx.createOscillator(),n=this.ctx.createGain();s.type="sine",s.frequency.setValueAtTime(80,o),s.frequency.exponentialRampToValueAtTime(25,o+.5),n.gain.setValueAtTime(.4,o),n.gain.exponentialRampToValueAtTime(.01,o+.6),s.connect(n),n.connect(this.stormGain),s.start(o),s.stop(o+.7)};this.musicIntervals.push(setInterval(e,500));const i=()=>{if(!this.ctx||!this.stormGain||!this.isStormMode)return;const o=this.ctx.currentTime,s=this.ctx.sampleRate*1,n=this.ctx.createBuffer(1,s,this.ctx.sampleRate),l=n.getChannelData(0);for(let p=0;p<s;p++)l[p]=Math.random()*2-1;const r=this.ctx.createBufferSource();r.buffer=n;const c=this.ctx.createBiquadFilter();c.type="bandpass",c.frequency.setValueAtTime(500,o),c.frequency.exponentialRampToValueAtTime(8e3,o+.5),c.frequency.exponentialRampToValueAtTime(500,o+1),c.Q.value=5;const h=this.ctx.createGain();h.gain.setValueAtTime(0,o),h.gain.linearRampToValueAtTime(.1,o+.25),h.gain.linearRampToValueAtTime(.1,o+.75),h.gain.linearRampToValueAtTime(0,o+1),r.connect(c),c.connect(h),h.connect(this.stormGain),r.start(o),r.stop(o+1.1)};this.musicIntervals.push(setInterval(i,1e3)),i();const a=()=>{if(!this.ctx||!this.stormGain||!this.isStormMode)return;const o=this.ctx.currentTime,s=this.ctx.sampleRate*.02,n=this.ctx.createBuffer(1,s,this.ctx.sampleRate),l=n.getChannelData(0);for(let p=0;p<s;p++)l[p]=Math.random()*2-1;const r=this.ctx.createBufferSource();r.buffer=n;const c=this.ctx.createBiquadFilter();c.type="highpass",c.frequency.value=1e4;const h=this.ctx.createGain();h.gain.setValueAtTime(.12,o),h.gain.exponentialRampToValueAtTime(.001,o+.02),r.connect(c),c.connect(h),h.connect(this.stormGain),r.start(o),r.stop(o+.03)};this.musicIntervals.push(setInterval(a,119))}deactivateStormMode(){this.isStormMode&&(this.isStormMode=!1,this.stormGain&&this.ctx&&this.stormGain.gain.linearRampToValueAtTime(0,this.ctx.currentTime+1),setTimeout(()=>{this.stormGain=null},1100))}playBossGreenMusic(){if(!this.ctx||!this.musicGain)return;const t=[55,55,110,55,82.4,110,73.4,55],e=[0,0,1,0,1,1,0,1];let i=0;const a=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green")return;const r=this.ctx.currentTime,c=this.ctx.createOscillator(),h=this.ctx.createOscillator(),p=this.ctx.createBiquadFilter(),f=this.ctx.createGain();c.type="sawtooth",h.type="square";const u=t[i];c.frequency.value=u,h.frequency.value=u*1.01,p.type="lowpass",p.Q.value=22;const m=e[i]===1,d=150+Math.random()*100,v=1200+Math.random()*800;p.frequency.setValueAtTime(d,r),p.frequency.exponentialRampToValueAtTime(v,r+.03),p.frequency.exponentialRampToValueAtTime(m?v*.7:200,r+.1);const y=i%4===0?.5:.3;f.gain.setValueAtTime(y,r),f.gain.exponentialRampToValueAtTime(.01,r+.12),c.connect(p),h.connect(p),p.connect(f),f.connect(this.musicGain),c.start(r),h.start(r),c.stop(r+.15),h.stop(r+.15),i=(i+1)%t.length};this.musicIntervals.push(setInterval(a,100));const o=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green")return;const r=this.ctx.currentTime,c=this.ctx.createOscillator(),h=this.ctx.createOscillator(),p=this.ctx.createGain(),f=this.ctx.createGain();c.type="sine",c.frequency.setValueAtTime(180,r),c.frequency.exponentialRampToValueAtTime(35,r+.08),h.type="triangle",h.frequency.value=1500,p.gain.setValueAtTime(.7,r),p.gain.exponentialRampToValueAtTime(.01,r+.25),f.gain.setValueAtTime(.2,r),f.gain.exponentialRampToValueAtTime(.001,r+.02),c.connect(p),h.connect(f),p.connect(this.musicGain),f.connect(this.musicGain),c.start(r),h.start(r),c.stop(r+.3),h.stop(r+.03)};this.musicIntervals.push(setInterval(o,400));let s=0;const n=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green")return;const r=this.ctx.currentTime,c=this.createNoise(.04),h=this.ctx.createBiquadFilter(),p=this.ctx.createGain();h.type="highpass",h.frequency.value=9e3;const f=s%2===1;p.gain.setValueAtTime(f?.18:.1,r),p.gain.exponentialRampToValueAtTime(.001,r+.04),c.connect(h),h.connect(p),p.connect(this.musicGain),s++};this.musicIntervals.push(setInterval(n,207));const l=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_green")return;const r=this.ctx.currentTime,c=this.ctx.createOscillator(),h=this.ctx.createBiquadFilter(),p=this.ctx.createGain();c.type="sawtooth",c.frequency.setValueAtTime(200+Math.random()*100,r),c.frequency.exponentialRampToValueAtTime(800+Math.random()*400,r+.3),h.type="bandpass",h.frequency.setValueAtTime(500,r),h.frequency.exponentialRampToValueAtTime(3e3,r+.3),h.Q.value=10,p.gain.setValueAtTime(.1,r),p.gain.linearRampToValueAtTime(.15,r+.15),p.gain.exponentialRampToValueAtTime(.01,r+.4),c.connect(h),h.connect(p),p.connect(this.musicGain),c.start(r),c.stop(r+.4)};this.musicIntervals.push(setInterval(l,1656))}playBossBlackMusic(){if(!this.ctx||!this.musicGain)return;const t=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_black")return;const h=this.ctx.currentTime,p=this.ctx.createOscillator(),f=this.ctx.createOscillator(),u=this.ctx.createWaveShaper(),m=this.ctx.createGain();p.type="sine",p.frequency.setValueAtTime(200,h),p.frequency.exponentialRampToValueAtTime(50,h+.04),p.frequency.exponentialRampToValueAtTime(30,h+.15),f.type="sine",f.frequency.setValueAtTime(60,h),f.frequency.exponentialRampToValueAtTime(25,h+.25);const d=new Float32Array(256);for(let v=0;v<256;v++){const y=v/128-1;d[v]=Math.tanh(y*8)}u.curve=d,m.gain.setValueAtTime(.9,h),m.gain.exponentialRampToValueAtTime(.01,h+.3),p.connect(u),f.connect(m),u.connect(m),m.connect(this.musicGain),p.start(h),p.stop(h+.3),f.start(h),f.stop(h+.35)};this.musicIntervals.push(setInterval(t,461));const e=[36.7,36.7,32.7,36.7,41.2,36.7,32.7,29.1];let i=0;const a=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_black")return;const h=this.ctx.currentTime,p=e[i],f=this.ctx.createOscillator(),u=this.ctx.createBiquadFilter(),m=this.ctx.createGain();f.type="sawtooth",f.frequency.value=p,u.type="lowpass",u.frequency.setValueAtTime(400,h),u.frequency.exponentialRampToValueAtTime(80,h+.3),u.Q.value=10,m.gain.setValueAtTime(.35,h),m.gain.exponentialRampToValueAtTime(.01,h+.4),f.connect(u),u.connect(m),m.connect(this.musicGain),f.start(h),f.stop(h+.45);for(let d=1;d<=3;d++){const v=this.ctx.createOscillator(),y=this.ctx.createBiquadFilter(),T=this.ctx.createGain(),w=h+d*.15,A=.15/d;v.type="sine",v.frequency.value=p,y.type="lowpass",y.frequency.value=200-d*40,T.gain.setValueAtTime(A,w),T.gain.exponentialRampToValueAtTime(.001,w+.25),v.connect(y),y.connect(T),T.connect(this.musicGain),v.start(w),v.stop(w+.3)}i=(i+1)%e.length};this.musicIntervals.push(setInterval(a,461));const o=[{type:"kick",vol:1},{type:"none",vol:0},{type:"hat",vol:.6},{type:"none",vol:0},{type:"snare",vol:1},{type:"none",vol:0},{type:"hat",vol:.5},{type:"kick",vol:.8},{type:"none",vol:0},{type:"none",vol:0},{type:"hat",vol:.7},{type:"none",vol:0},{type:"snare",vol:1},{type:"none",vol:0},{type:"hat",vol:.5},{type:"kick",vol:.7}];let s=0;const n=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_black")return;const h=this.ctx.currentTime,p=o[s];if(p.type==="kick"){const f=this.ctx.createOscillator(),u=this.ctx.createGain();f.type="sine",f.frequency.setValueAtTime(180,h),f.frequency.exponentialRampToValueAtTime(60,h+.03),f.frequency.exponentialRampToValueAtTime(40,h+.08),u.gain.setValueAtTime(.5*p.vol,h),u.gain.exponentialRampToValueAtTime(.01,h+.12),f.connect(u),u.connect(this.musicGain),f.start(h),f.stop(h+.15)}else if(p.type==="snare"){const f=this.ctx.createOscillator(),u=this.ctx.createGain();f.type="triangle",f.frequency.setValueAtTime(250,h),f.frequency.exponentialRampToValueAtTime(150,h+.02),u.gain.setValueAtTime(.2*p.vol,h),u.gain.exponentialRampToValueAtTime(.01,h+.08),f.connect(u),u.connect(this.musicGain),f.start(h),f.stop(h+.1);const m=this.ctx.sampleRate*.1,d=this.ctx.createBuffer(1,m,this.ctx.sampleRate),v=d.getChannelData(0);for(let A=0;A<m;A++)v[A]=(Math.random()*2-1)*Math.exp(-A/(this.ctx.sampleRate*.025));const y=this.ctx.createBufferSource();y.buffer=d;const T=this.ctx.createBiquadFilter();T.type="bandpass",T.frequency.value=3e3,T.Q.value=1;const w=this.ctx.createGain();w.gain.setValueAtTime(.35*p.vol,h),w.gain.exponentialRampToValueAtTime(.01,h+.1),y.connect(T),T.connect(w),w.connect(this.musicGain),y.start(h),y.stop(h+.12)}else if(p.type==="hat"){const f=this.ctx.sampleRate*.04,u=this.ctx.createBuffer(1,f,this.ctx.sampleRate),m=u.getChannelData(0);for(let T=0;T<f;T++)m[T]=Math.random()*2-1;const d=this.ctx.createBufferSource();d.buffer=u;const v=this.ctx.createBiquadFilter();v.type="highpass",v.frequency.value=7e3;const y=this.ctx.createGain();y.gain.setValueAtTime(.15*p.vol,h),y.gain.exponentialRampToValueAtTime(.001,h+.035),d.connect(v),v.connect(y),y.connect(this.musicGain),d.start(h),d.stop(h+.045)}s=(s+1)%o.length};this.musicIntervals.push(setInterval(n,115));const l=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_black")return;const h=this.ctx.currentTime,p=[146.8,174.6,220];for(const f of p){const u=this.ctx.createOscillator(),m=this.ctx.createBiquadFilter(),d=this.ctx.createGain();u.type="sawtooth",u.frequency.value=f,m.type="lowpass",m.frequency.setValueAtTime(2e3,h),m.frequency.exponentialRampToValueAtTime(300,h+.2),m.Q.value=5,d.gain.setValueAtTime(.08,h),d.gain.exponentialRampToValueAtTime(.001,h+.25),u.connect(m),m.connect(d),d.connect(this.musicGain),u.start(h),u.stop(h+.3);for(let v=1;v<=5;v++){const y=this.ctx.createOscillator(),T=this.ctx.createBiquadFilter(),w=this.ctx.createGain(),A=h+v*.18;y.type="sine",y.frequency.value=f,T.type="lowpass",T.frequency.value=800-v*120,w.gain.setValueAtTime(.04/v,A),w.gain.exponentialRampToValueAtTime(.001,A+.2),y.connect(T),T.connect(w),w.connect(this.musicGain),y.start(A),y.stop(A+.25)}}};this.musicIntervals.push(setInterval(l,1844));const r=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_black")return;const h=this.ctx.currentTime,p=this.ctx.createOscillator(),f=this.ctx.createOscillator(),u=this.ctx.createGain(),m=this.ctx.createGain();p.type="sine",p.frequency.value=36.7,f.type="sine",f.frequency.value=.2,u.gain.value=3,f.connect(u),u.connect(p.frequency),m.gain.setValueAtTime(0,h),m.gain.linearRampToValueAtTime(.25,h+1),m.gain.linearRampToValueAtTime(.2,h+3),m.gain.linearRampToValueAtTime(0,h+4),p.connect(m),m.connect(this.musicGain),f.start(h),p.start(h),f.stop(h+4.5),p.stop(h+4.5)};r(),this.musicIntervals.push(setInterval(r,3688));const c=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_black"||Math.random()>.5)return;const h=this.ctx.currentTime,p=this.ctx.createOscillator(),f=this.ctx.createBiquadFilter(),u=this.ctx.createGain();p.type="sawtooth",Math.random()>.5?(p.frequency.setValueAtTime(100,h),p.frequency.exponentialRampToValueAtTime(800,h+1)):(p.frequency.setValueAtTime(600,h),p.frequency.exponentialRampToValueAtTime(50,h+1.5)),f.type="lowpass",f.frequency.setValueAtTime(3e3,h),f.frequency.exponentialRampToValueAtTime(200,h+1.5),f.Q.value=8,u.gain.setValueAtTime(.1,h),u.gain.exponentialRampToValueAtTime(.001,h+1.5),p.connect(f),f.connect(u),u.connect(this.musicGain),p.start(h),p.stop(h+1.6)};this.musicIntervals.push(setInterval(c,3688))}playVortexRiser(){if(!this.ctx||!this.musicGain)return;const t=this.ctx.currentTime,e=2,i=this.ctx.sampleRate*e,a=this.ctx.createBuffer(1,i,this.ctx.sampleRate),o=a.getChannelData(0);for(let f=0;f<i;f++)o[f]=Math.random()*2-1;const s=this.ctx.createBufferSource();s.buffer=a;const n=this.ctx.createBiquadFilter();n.type="bandpass",n.frequency.setValueAtTime(200,t),n.frequency.exponentialRampToValueAtTime(8e3,t+e),n.Q.value=5;const l=this.ctx.createGain();l.gain.setValueAtTime(0,t),l.gain.linearRampToValueAtTime(.3,t+e*.8),l.gain.linearRampToValueAtTime(.5,t+e),s.connect(n),n.connect(l),l.connect(this.musicGain),s.start(t),s.stop(t+e+.1);const r=this.ctx.createOscillator(),c=this.ctx.createBiquadFilter(),h=this.ctx.createGain();r.type="sawtooth",r.frequency.setValueAtTime(50,t),r.frequency.exponentialRampToValueAtTime(400,t+e),c.type="lowpass",c.frequency.setValueAtTime(100,t),c.frequency.exponentialRampToValueAtTime(2e3,t+e),c.Q.value=8,h.gain.setValueAtTime(0,t),h.gain.linearRampToValueAtTime(.25,t+e),r.connect(c),c.connect(h),h.connect(this.musicGain),r.start(t),r.stop(t+e+.1);const p=(f,u)=>{if(!this.ctx||!this.musicGain)return;const m=this.ctx.createOscillator(),d=this.ctx.createGain();m.type="sine",m.frequency.setValueAtTime(100,f),m.frequency.exponentialRampToValueAtTime(30,f+.1),d.gain.setValueAtTime(u,f),d.gain.exponentialRampToValueAtTime(.001,f+.15),m.connect(d),d.connect(this.musicGain),m.start(f),m.stop(f+.2)};p(t+.5,.15),p(t+1,.2),p(t+1.3,.25),p(t+1.5,.3),p(t+1.65,.35),p(t+1.8,.4),p(t+1.9,.45)}playBossBlueMusic(){if(!this.ctx||!this.musicGain)return;const t=[110,110,146.8,164.8,110,130.8,146.8,110];let e=0;const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_blue")return;const r=this.ctx.currentTime,c=this.ctx.createOscillator(),h=this.ctx.createGain(),p=this.ctx.createBiquadFilter();c.type="square",c.frequency.value=t[e],p.type="lowpass",p.frequency.setValueAtTime(800,r),p.frequency.exponentialRampToValueAtTime(200,r+.2),h.gain.setValueAtTime(.15,r),h.gain.linearRampToValueAtTime(0,r+.2),c.connect(p),p.connect(h),h.connect(this.musicGain),c.start(r),c.stop(r+.25),e=(e+1)%t.length};this.musicIntervals.push(setInterval(i,250));const a=[880,1046,1318,1567,1318,1046];let o=0;const s=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_blue")return;const r=this.ctx.currentTime,c=this.ctx.createOscillator(),h=this.ctx.createGain();c.type="triangle",c.frequency.value=a[o],h.gain.setValueAtTime(.08,r),h.gain.exponentialRampToValueAtTime(.001,r+.1),c.connect(h),h.connect(this.musicGain),c.start(r),c.stop(r+.12),o=(o+1)%a.length};this.musicIntervals.push(setInterval(s,125));const n=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_blue")return;const r=this.ctx.currentTime,c=this.ctx.createOscillator(),h=this.ctx.createGain();c.type="sawtooth",c.frequency.setValueAtTime(2e3,r),c.frequency.exponentialRampToValueAtTime(100,r+.15),h.gain.setValueAtTime(.1,r),h.gain.exponentialRampToValueAtTime(.001,r+.15),c.connect(h),h.connect(this.musicGain),c.start(r),c.stop(r+.15)};this.musicIntervals.push(setInterval(n,500+Math.random()*300));const l=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="boss_blue")return;const r=this.ctx.currentTime,c=this.ctx.createOscillator(),h=this.ctx.createGain();c.type="sine",c.frequency.setValueAtTime(150,r),c.frequency.exponentialRampToValueAtTime(50,r+.1),h.gain.setValueAtTime(.2,r),h.gain.exponentialRampToValueAtTime(.001,r+.15),c.connect(h),h.connect(this.musicGain),c.start(r),c.stop(r+.15)};this.musicIntervals.push(setInterval(l,500))}playBassline(){if(!this.ctx||!this.musicGain)return;const t=[55,55,73.4,82.4];let e=0;const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal")return;const a=this.ctx.currentTime,o=this.ctx.createOscillator(),s=this.ctx.createOscillator(),n=this.ctx.createGain(),l=this.ctx.createBiquadFilter();o.type="sawtooth",o.frequency.value=t[e],s.type="square",s.frequency.value=t[e]*1.005,l.type="lowpass",l.frequency.setValueAtTime(300,a),l.frequency.linearRampToValueAtTime(150,a+.8),n.gain.setValueAtTime(.2,a),n.gain.linearRampToValueAtTime(.15,a+.1),n.gain.linearRampToValueAtTime(0,a+.9),o.connect(l),s.connect(l),l.connect(n),n.connect(this.musicGain),o.start(a),o.stop(a+1),s.start(a),s.stop(a+1),e=(e+1)%t.length,setTimeout(i,1e3)};i()}playArpeggio(){if(!this.ctx||!this.musicGain)return;const t=[440,523,587,659,784,659,587,523];let e=0;const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal")return;const a=this.ctx.currentTime,o=this.ctx.createOscillator(),s=this.ctx.createGain(),n=this.ctx.createBiquadFilter(),l=this.ctx.createDelay(),r=this.ctx.createGain();o.type="square",o.frequency.value=t[e],n.type="lowpass",n.frequency.setValueAtTime(2e3,a),n.frequency.exponentialRampToValueAtTime(500,a+.15),n.Q.value=5,s.gain.setValueAtTime(.08,a),s.gain.exponentialRampToValueAtTime(.01,a+.12),l.delayTime.value=.25,r.gain.value=.3,o.connect(n),n.connect(s),s.connect(this.musicGain),s.connect(l),l.connect(r),r.connect(this.musicGain),r.connect(this.reverb),o.start(a),o.stop(a+.15),e=(e+1)%t.length,setTimeout(i,125)};setTimeout(i,2e3)}playPad(){if(!this.ctx||!this.musicGain)return;const t=[[220,261.6,329.6],[196,246.9,293.7],[174.6,220,261.6],[164.8,196,246.9]];let e=0;const i=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal")return;const a=this.ctx.currentTime;t[e].forEach((s,n)=>{const l=this.ctx.createOscillator(),r=this.ctx.createOscillator(),c=this.ctx.createGain(),h=this.ctx.createBiquadFilter();l.type="sawtooth",l.frequency.value=s,r.type="triangle",r.frequency.value=s*1.002,h.type="lowpass",h.frequency.value=800,h.Q.value=1,c.gain.setValueAtTime(0,a),c.gain.linearRampToValueAtTime(.03,a+1),c.gain.linearRampToValueAtTime(.03,a+3),c.gain.linearRampToValueAtTime(0,a+4),l.connect(h),r.connect(h),h.connect(c),c.connect(this.musicGain),c.connect(this.reverb),l.start(a+n*.1),l.stop(a+4.5),r.start(a+n*.1),r.stop(a+4.5)}),e=(e+1)%t.length,setTimeout(i,4e3)};setTimeout(i,500)}playDrums(){if(!this.ctx||!this.musicGain)return;let t=0;const e=()=>{if(!this.ctx||!this.musicGain||this.currentMusicMode!=="normal")return;const i=this.ctx.currentTime;if(t%4===0||t%4===2){const n=this.ctx.createOscillator(),l=this.ctx.createGain();n.type="sine",n.frequency.setValueAtTime(150,i),n.frequency.exponentialRampToValueAtTime(40,i+.1),l.gain.setValueAtTime(.3,i),l.gain.exponentialRampToValueAtTime(.01,i+.15),n.connect(l),l.connect(this.musicGain),n.start(i),n.stop(i+.2)}if(t%4===1||t%4===3){const n=this.createNoise(.15),l=this.ctx.createGain(),r=this.ctx.createBiquadFilter();r.type="highpass",r.frequency.value=1e3,l.gain.setValueAtTime(.15,i),l.gain.exponentialRampToValueAtTime(.01,i+.1),n.connect(r),r.connect(l),l.connect(this.musicGain);const c=this.ctx.createOscillator(),h=this.ctx.createGain();c.type="triangle",c.frequency.value=180,h.gain.setValueAtTime(.1,i),h.gain.exponentialRampToValueAtTime(.01,i+.08),c.connect(h),h.connect(this.musicGain),c.start(i),c.stop(i+.1)}const a=this.createNoise(.03),o=this.ctx.createGain(),s=this.ctx.createBiquadFilter();s.type="highpass",s.frequency.value=8e3,o.gain.setValueAtTime(t%2===0?.08:.04,i),o.gain.exponentialRampToValueAtTime(.01,i+.03),a.connect(s),s.connect(o),o.connect(this.musicGain),t=(t+1)%16,setTimeout(e,250)};setTimeout(e,1e3)}stop(){this.arpInterval&&clearInterval(this.arpInterval),this.ctx&&(this.ctx.close(),this.ctx=null),this.isStarted=!1}}const mt=`#version 300 es
precision highp float;

in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`,dt=`#version 300 es
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

in vec2 v_uv;
out vec4 fragColor;

// === ПАРАМЕТРЫ РЕЙТРЕЙСИНГА (ТУРБО-ОПТИМИЗАЦИЯ) ===
#define MAX_STEPS 32
#define MAX_DIST 80.0
#define SURF_DIST 0.01
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
  
  for (int i = 0; i < 4; i++) {
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

// === СЦЕНА ===
float map(vec3 p) {
  float d = MAX_DIST;
  materialId = 0;
  
  float distFromCenter = length(p.xz);
  
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
  
  // === ЗОНЫ КИСЛОТНОГО ДОЖДЯ ===
  for (int i = 0; i < u_acidRainZoneCount; i++) {
    if (i >= 4) break;
    vec4 zone = u_acidRainZones[i];
    float state = zone.w;
    float distToZone = length(p.xz - zone.xy);
    float zoneRadius = zone.z;
    
    if (state < 1.0) {
      // Метка предупреждения на земле
      if (p.y < 0.1 && p.y > -0.05) {
        float markRadius = zoneRadius * (0.3 + state * 1.4);
        if (distToZone < markRadius) {
          float ring = smoothstep(0.2, 0.0, abs(distToZone - markRadius * 0.85));
          float pulse = sin(u_time * 10.0) * 0.5 + 0.5;
          float center = step(distToZone, markRadius * 0.3) * pulse;
          if (ring + center > 0.3) {
            d = p.y - 0.02;
            materialId = 20;
          }
        }
      }
    } else {
      // === АКТИВНЫЙ ДОЖДЬ - СТОЛБ КИСЛОТЫ ===
      // Светящийся круг на земле
      if (p.y < 0.15 && p.y > -0.05 && distToZone < zoneRadius) {
        d = p.y - 0.03;
        materialId = 21; // Зелёный светящийся круг
      }
      // Вертикальный столб дождя (цилиндр частиц)
      if (p.y > 0.0 && p.y < 15.0 && distToZone < zoneRadius * 0.8) {
        // Анимированные "струи" внутри столба
        float angle = atan(p.z - zone.y, p.x - zone.x);
        float streams = sin(angle * 8.0 + p.y * 2.0 - u_time * 10.0) * 0.5 + 0.5;
        float fade = 1.0 - p.y / 15.0; // Затухание к верху
        float streamDist = distToZone / (zoneRadius * 0.8);
        
        if (streams > 0.7 && streamDist > 0.3) {
          float pillarD = distToZone - zoneRadius * 0.75;
          if (pillarD < d) {
            d = pillarD;
            materialId = 22; // Полупрозрачные струи
          }
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
  
  // === ЭНЕРГЕТИЧЕСКИЕ ЛУЧИ (оптимизировано) ===
  for (int i = 0; i < u_dartCount; i++) {
    if (i >= 8) break;
    vec4 dart = u_darts[i];
    vec4 dartDir = u_dartDirs[i];
    
    if (dart.w > 0.5) {
      vec3 dartPos = dart.xyz;
      vec3 dir = normalize(dartDir.xyz);
      vec3 dp = p - dartPos;
      
      // Яркое ядро луча (очень тонкое)
      float core = length(dp) - 0.1;
      
      // Внешнее свечение (больше, вытянутое)
      float glow = length(dp) - 0.25;
      
      // Длинный красивый след
      float trail = 1000.0;
      for (int t = 1; t <= 4; t++) {
        float trailDist = float(t) * 0.4;
        vec3 trailPos = dartPos - dir * trailDist;
        float trailSize = 0.2 - float(t) * 0.02;
        if (trailSize > 0.02) {
          float trailSphere = length(p - trailPos) - trailSize;
          trail = min(trail, trailSphere);
        }
      }
      
      // Дополнительные искры вокруг следа
      for (int s = 0; s < 2; s++) {
        float sparkOffset = float(s) * 0.5 + sin(u_time * 20.0 + float(s)) * 0.3;
        vec3 sparkPos = dartPos - dir * sparkOffset;
        sparkPos += vec3(
          sin(u_time * 15.0 + float(s) * 2.0) * 0.15,
          cos(u_time * 18.0 + float(s) * 3.0) * 0.15,
          sin(u_time * 12.0 + float(s) * 1.5) * 0.15
        );
        float spark = length(p - sparkPos) - 0.06;
        trail = min(trail, spark);
      }
      
      if (core < d) {
        d = core;
        materialId = 35; // Ядро луча (ярко-белое)
      } else if (glow < d) {
        d = glow;
        materialId = 36; // Свечение (голубое)
      } else if (trail < d) {
        d = trail;
        materialId = 37; // След (затухающий с искрами)
      }
    }
  }
  
  // === ЛАЗЕРЫ СПАЙКЕРОВ ===
  for (int i = 0; i < u_spikeCount; i++) {
    if (i >= 8) break;
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
  
  // === ГРАНАТЫ ===
  for (int i = 0; i < u_grenadeCount; i++) {
    if (i >= 8) break;
    vec4 grenade = u_grenades[i];
    vec3 grenadePos = grenade.xyz;
    float lifetime = grenade.w;
    
    // Сфера гранаты
    float grenadeD = length(p - grenadePos) - 0.3;
    
    if (grenadeD < d) {
      d = grenadeD;
      materialId = lifetime < 0.5 ? 42 : 41; // Красная если скоро взрыв
    }
  }
  
  // === ВЗРЫВЫ ===
  for (int i = 0; i < u_explosionCount; i++) {
    if (i >= 8) break;
    vec4 explosion = u_explosions[i];
    vec3 expPos = explosion.xyz;
    float progress = explosion.w;
    
    // Расширяющаяся сфера взрыва
    float expRadius = progress * 8.0; // Радиус 8 метров
    float expD = length(p - expPos) - expRadius;
    
    // Только оболочка (полая сфера)
    float shell = abs(expD) - 0.3 * (1.0 - progress);
    
    if (shell < d && progress < 1.0) {
      d = shell;
      materialId = 43; // Взрыв
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
        // === РОЗА (аптечка) ===
        vec3 localP = p - pickupPos;
        float bob = sin(u_time * 2.0 + pickupPos.x) * 0.1;
        localP.y -= bob;
        
        // Вращение
        float rotAngle = u_time * 1.5;
        float cs = cos(rotAngle), sn = sin(rotAngle);
        localP.xz = mat2(cs, -sn, sn, cs) * localP.xz;
        
        // Стебель
        float stem = sdCylinder(localP + vec3(0.0, 0.3, 0.0), 0.04, 0.35);
        if (stem < d) { d = stem; materialId = 79; } // Стебель зелёный
        
        // Бутон розы (несколько лепестков - торусы под углом)
        float bud = 1000.0;
        for (int j = 0; j < 5; j++) {
          float angle = float(j) * 1.256 + u_time * 0.3;
          float cj = cos(angle), sj = sin(angle);
          vec3 petalP = localP;
          petalP.xz = mat2(cj, -sj, sj, cj) * petalP.xz;
          petalP.x *= 1.5; // Сплюснуть
          float petal = sdTorus(petalP + vec3(0.0, 0.1, 0.0), vec2(0.18, 0.08));
          bud = min(bud, petal);
        }
        // Центр бутона
        float center = sdSphere(localP, 0.15);
        bud = min(bud, center);
        
        if (bud < d) { d = bud; materialId = 14; } // Лепестки красные
        
      } else if (pType == 10.0) {
        // === ЭНЕРГЕТИЧЕСКАЯ СУЩНОСТЬ (баф) ===
        vec3 localP = p - pickupPos;
        float bob = sin(u_time * 3.0 + pickupPos.z) * 0.15;
        localP.y -= bob;
        
        // Вращение по двум осям
        float rotY = u_time * 2.0;
        float rotX = u_time * 1.3;
        float cy = cos(rotY), sy = sin(rotY);
        float cx = cos(rotX), sx = sin(rotX);
        localP.xz = mat2(cy, -sy, sy, cy) * localP.xz;
        localP.yz = mat2(cx, -sx, sx, cx) * localP.yz;
        
        // Ядро (пульсирующая сфера)
        float pulse = 0.25 + 0.05 * sin(u_time * 8.0);
        float core = sdSphere(localP, pulse);
        if (core < d) { d = core; materialId = 80; } // Ядро энергии
        
        // Орбитальные кольца (3 пересекающихся тора)
        float ring1 = sdTorus(localP.xzy, vec2(0.4, 0.03));
        float ring2 = sdTorus(localP.yxz, vec2(0.4, 0.03));
        float ring3 = sdTorus(localP.zyx, vec2(0.4, 0.03));
        float rings = min(ring1, min(ring2, ring3));
        if (rings < d) { d = rings; materialId = 81; } // Кольца энергии
        
      } else if (pType == 11.0) {
        // Заряд катаны - энергетическая сфера
        float chargeSphere = length(p - pickupPos) - 0.5;
        if (chargeSphere < d) {
          d = chargeSphere;
          materialId = 17; // Заряд
        }
      } else if (pType == 12.0) {
        // === БОЛЬШАЯ РОЗА (на краях карты) ===
        vec3 localP = p - pickupPos;
        float bob = sin(u_time * 1.5) * 0.15;
        localP.y -= bob;
        
        // Вращение
        float rotAngle = u_time * 1.0;
        float cs = cos(rotAngle), sn = sin(rotAngle);
        localP.xz = mat2(cs, -sn, sn, cs) * localP.xz;
        
        // Толстый стебель
        float stem = sdCylinder(localP + vec3(0.0, 0.5, 0.0), 0.08, 0.55);
        if (stem < d) { d = stem; materialId = 79; }
        
        // Большой бутон
        float bud = 1000.0;
        for (int j = 0; j < 7; j++) {
          float angle = float(j) * 0.898;
          float cj = cos(angle), sj = sin(angle);
          vec3 petalP = localP;
          petalP.xz = mat2(cj, -sj, sj, cj) * petalP.xz;
          petalP.x *= 1.5;
          float petal = sdTorus(petalP + vec3(0.0, 0.15, 0.0), vec2(0.3, 0.12));
          bud = min(bud, petal);
        }
        float center = sdSphere(localP, 0.25);
        bud = min(bud, center);
        
        if (bud < d) { d = bud; materialId = 31; } // Золотая роза
      }
    }
  }
  
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
  
  if (distFromCenter < 6.0) {
    // Основание фонтана (всегда видно)
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
  // Левый портал (только если близко)
  float leftPortalDist = abs(p.x + 22.0);
  if (leftPortalDist < 8.0) {
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
  
  // Правый портал (только если близко)
  float rightPortalDist = abs(p.x - 22.0);
  if (rightPortalDist < 8.0) {
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
  // Левая площадка (только если близко)
  float leftPlatDist = length(p.xz - vec2(-BACK_PLATFORM_X, 0.0));
  if (leftPlatDist < BACK_PLATFORM_RADIUS + 2.0) {
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
  
  // Правая площадка (только если близко)
  float rightPlatDist = length(p.xz - vec2(BACK_PLATFORM_X, 0.0));
  if (rightPlatDist < BACK_PLATFORM_RADIUS + 2.0) {
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
  
  // === ВРАГИ ===
  // w: 0=неактивен, 1-2=бейнлинг, 3-4=фантом, 5-6=runner, 7-8=hopper, 9-10=spiker
  // 11-12=boss_green, 13-14=boss_black, 15-16=boss_blue
  // w >= 100 = умирает (тип = w - 100)
  for (int i = 0; i < u_targetCount; i++) {
    if (i >= 16) break;
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
    if (i >= 16) break;
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
  
  if (minLDist < 4.0) {
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
  
  // Аналитическое пересечение с полом (y=0) - ГАРАНТИРОВАННО попадает
  float floorDist = MAX_DIST;
  if (rd.y < -0.001) {
    floorDist = -ro.y / rd.y;
    if (floorDist < 0.0) floorDist = MAX_DIST;
  }
  
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * d;
    float dist = map(p);
    
    d += dist * 0.9;
    
    if (dist < SURF_DIST) return d;
    if (d > MAX_DIST) break;
    
    // Если достигли пола раньше - выходим
    if (d > floorDist) {
      return floorDist;
    }
  }
  
  // Если raymarching не попал ни во что, но пол есть - возвращаем пол
  if (floorDist < MAX_DIST) {
    return floorDist;
  }
  
  return MAX_DIST;
}

vec3 getNormal(vec3 p) {
  // Тетраэдрный метод - 4 вызова вместо 6!
  vec2 e = vec2(0.003, -0.003);
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
  
  for (int i = 0; i < 8; i++) {
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

// === БЫСТРЫЕ ТЕНИ (3 шага) ===
float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
  float res = 1.0;
  float t = mint;
  
  for (int i = 0; i < 3; i++) {
    float h = map(ro + rd * t);
    res = min(res, k * h / t);
    t += clamp(h, 0.5, 3.0);
    if (res < 0.1 || t > maxt) break;
  }
  return clamp(res, 0.25, 1.0);
}

// === КОНТАКТНЫЕ ТЕНИ (2 шага) ===
float contactShadowRay(vec3 p, vec3 rd, float maxDist) {
  float t = 0.1;
  for (int i = 0; i < 2; i++) {
    float h = map(p + rd * t);
    if (h < 0.02) return 0.4;
    t += max(h, 0.3);
    if (t > maxDist) break;
  }
  return 1.0;
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
  // 2 сэмпла
  float d1 = map(pos + nor * 0.1);
  float d2 = map(pos + nor * 0.3);
  float occ = (0.1 - d1) + (0.3 - d2) * 0.5;
  return clamp(1.0 - occ * 2.0, 0.4, 1.0);
}

// === КОНТАКТНЫЕ ТЕНИ ===
float contactShadow(vec3 p) {
  return smoothstep(-1.0, 2.0, p.y) * 0.5 + 0.5;
}

// === КРАСИВАЯ ПЛЁНОЧНАЯ ЗЕРНИСТОСТЬ ===
float filmGrain(vec2 uv, float time) {
  // Динамический шум меняется каждый кадр
  float seed = dot(uv, vec2(12.9898, 78.233)) + time;
  float noise1 = fract(sin(seed) * 43758.5453);
  float noise2 = fract(sin(seed * 1.1) * 28461.2314);
  float noise3 = fract(sin(seed * 0.9) * 51732.8912);
  
  // Смешиваем несколько слоёв для органичности
  float grain = (noise1 + noise2 + noise3) / 3.0;
  
  // Центрируем около 0 для симметричного влияния
  grain = grain - 0.5;
  
  return grain;
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

// SDF лезвия катаны - классическое с изгибом (сори)
float sdKatanaBlade(vec3 p) {
  // Масштаб катаны (меньше для viewmodel)
  float scale = 0.15;
  vec3 sp = p / scale;
  
  // Длина лезвия
  float bladeLen = 2.2;
  
  // Лёгкий изгиб (сори) - характерная черта катаны
  float curve = sp.y * sp.y * 0.02;
  sp.z -= curve;
  
  // Сечение лезвия - треугольное (синоги-дзукури)
  // Сужение к острию
  float taper = 1.0 - smoothstep(0.0, bladeLen, sp.y) * 0.6;
  float width = 0.12 * taper;
  float thick = 0.025 * taper;
  
  // Треугольное сечение
  float d2d = max(abs(sp.x) - width, abs(sp.z) - thick + abs(sp.x) * 0.15);
  float d = max(d2d, sp.y - bladeLen);
  d = max(d, -sp.y - 0.05); // Начало лезвия
  
  // Острие (киссаки) - скошенное
  vec3 tipP = sp - vec3(0.0, bladeLen - 0.15, 0.0);
  float tipAngle = atan(tipP.z, tipP.y - 0.15);
  float tip = length(tipP) - 0.08;
  tip = max(tip, sp.y - bladeLen);
  d = min(d, tip);
  
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
  
  // Базовые углы катаны - ОСТРИЕ ВПЕРЁД
  float rotX = -1.5;  // Лезвие горизонтально, острие вперёд
  float rotZ = 0.08;  // Минимальный наклон
  float rotY = 0.05;  // Режущая кромка чуть вниз
  
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
  
  for (int i = 0; i < 32; i++) {
    vec3 p = ro + rd * t;
    
    // Трансформация в локальное пространство катаны
    vec3 localP = transpose(rotMat) * (p - katanaWorldPos);
    
    float d = sdKatana(localP);
    
    if (d < 0.001) {
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
    
    t += d;
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

// Кислотный дождь - капли только когда игрок В зоне
vec3 renderAcidRain(vec2 uv, vec3 color, float time, vec3 camPos) {
  if (u_acidRainZoneCount == 0) return color;
  
  vec3 result = color;
  float inRainIntensity = 0.0; // Игрок ВНУТРИ зоны дождя
  
  // Проверяем находится ли игрок в зоне дождя
  for (int i = 0; i < u_acidRainZoneCount; i++) {
    if (i >= 4) break;
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
  
  // === ЗВЁЗДЫ/ЧАСТИЦЫ ТЬМЫ ===
  vec3 starDir = normalize(rd);
  
  for (float i = 0.0; i < 50.0; i++) {
    vec3 starPos = normalize(vec3(
      sin(i * 73.1) * cos(i * 127.3),
      sin(i * 91.7) * cos(i * 173.1),
      cos(i * 47.3) * sin(i * 311.7)
    ));
    
    float starDist = length(starDir - starPos);
    float starSize = 0.01 + fract(sin(i * 37.7) * 100.0) * 0.02;
    float twinkle = sin(time * 2.0 + i * 1.7) * 0.5 + 0.5;
    float star = smoothstep(starSize, 0.0, starDist) * twinkle;
    
    vec3 starColor = mix(starColor1, starColor2, fract(i * 0.37));
    skyColor += starColor * star * 0.3;
  }
  
  // === ТУМАННОСТИ ===
  float nebula1 = sin(rd.x * 3.0 + rd.z * 2.0 + time * 0.1) * 
                  cos(rd.y * 4.0 + rd.x * 1.5);
  nebula1 = smoothstep(-0.3, 0.5, nebula1);
  skyColor += nebulaColor1 * nebula1 * 0.3;
  
  float nebula2 = cos(rd.x * 2.0 - rd.z * 3.0 + time * 0.05) * 
                  sin(rd.y * 2.5 - rd.x * 2.0);
  nebula2 = smoothstep(-0.2, 0.6, nebula2);
  skyColor += nebulaColor2 * nebula2 * 0.2;
  
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
      
      // 6-8 обломков разного размера и высоты
      for (int i = 0; i < 8; i++) {
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
    float keyShadow = softShadow(p + n * 0.02, keyDir, 0.1, 30.0, 8.0);
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
      // === БОЛЬШАЯ АПТЕЧКА (на краях карты) ===
      vec3 healthWhite = vec3(1.0, 1.0, 1.0);
      vec3 healthGold = vec3(1.0, 0.85, 0.3);
      vec3 healthGreen = vec3(0.3, 1.0, 0.5);
      
      // Пульсация
      float pulse = 0.7 + 0.3 * sin(u_time * 5.0);
      
      // Градиент от золотого к белому
      float gradient = p.y * 0.5 + 0.5;
      color = mix(healthGold, healthWhite, gradient);
      
      // Зелёный оттенок для "здоровья"
      color = mix(color, healthGreen, 0.2);
      
      // Очень яркое свечение
      color *= pulse * 2.5;
      
      // Fresnel аура
      float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 2.0);
      color += healthGold * fresnel * 1.5;
      
      // Искры
      float sparkle = sin(u_time * 20.0 + p.x * 10.0 + p.y * 15.0);
      if (sparkle > 0.9) {
        color += vec3(1.0) * 0.5;
      }
      
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
  
  // === GOD RAYS (тёплые лучи от оранжевой луны) ===
  vec2 moonScreenPos = vec2(0.35, 0.55); // Позиция луны на экране
  vec2 rayDir = screenPos - moonScreenPos;
  float rayDist = length(rayDir);
  
  float godRays = 0.0;
  for (int i = 0; i < 6; i++) {
    float t = float(i) / 6.0;
    vec2 samplePos = screenPos - rayDir * t * 0.3;
    float raySample = exp(-length(samplePos - moonScreenPos) * 3.0);
    godRays += raySample * (1.0 - t);
  }
  godRays *= 0.06 * smoothstep(0.6, 0.0, rayDist);
  color += vec3(0.8, 0.4, 0.1) * godRays; // Оранжевые лучи
  
  // === ПРИГЛУШЁННЫЙ VOLUMETRIC ===
  vec3 volumetric = vec3(0.0);
  float depthFactor = 1.0 - smoothstep(0.0, 100.0, d);
  
  // Мягкие лучи (уменьшенная интенсивность)
  float beam1 = exp(-pow(length(screenPos - vec2(0.0, 0.4)), 2.0) * 5.0);
  volumetric += vec3(0.0, 0.5, 0.55) * beam1 * 0.05;
  
  float beam2 = exp(-pow(length(screenPos - vec2(0.0, -0.4)), 2.0) * 5.0);
  volumetric += vec3(0.55, 0.08, 0.4) * beam2 * 0.04;
  
  float beam3 = exp(-pow(length(screenPos - vec2(0.5, 0.0)), 2.0) * 4.0);
  float beam4 = exp(-pow(length(screenPos - vec2(-0.5, 0.0)), 2.0) * 4.0);
  volumetric += volAccent * (beam3 + beam4) * 0.03;
  
  color += volumetric * depthFactor * 0.6;
  
  // === МИНИМАЛИСТИЧНЫЕ ЧАСТИЦЫ ===
  
  // --- СВЕТЛЯЧКИ (немного, мягкие) ---
  for (int i = 0; i < 5; i++) {
    float seed = float(i) * 127.1;
    vec2 fireflyPos = vec2(
      sin(u_time * 0.2 + seed) * 0.5 + hash(vec2(seed, 0.0)) * 0.4,
      cos(u_time * 0.15 + seed * 1.3) * 0.4 + hash(vec2(0.0, seed)) * 0.3
    );
    float dist = length(screenPos - fireflyPos);
    float glow = exp(-dist * 12.0);
    float flicker = 0.6 + 0.4 * sin(u_time * 3.0 + seed * 10.0);
    color += volAccent * glow * flicker * 0.06;
  }
  
  // --- ПЫЛИНКИ (редкие) ---
  vec2 dustUV = screenUV * 40.0 + u_time * 0.01;
  float dustId = hash(floor(dustUV));
  if (dustId > 0.985) {
    float dustBright = (dustId - 0.985) * 30.0;
    color += vec3(0.7, 0.75, 0.8) * dustBright * 0.015;
  }
  
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
  
  // Рендерим катану (ro = позиция камеры)
  vec4 katanaResult = renderKatana(u_cameraPos, rd, u_katanaAttack, u_katanaBob, u_katanaCharges, katanaAmbient, katanaAccent);
  if (katanaResult.w > 0.0) {
    // Катана попала - накладываем поверх сцены
    color = katanaResult.rgb;
  }
  
  // === ХОЛОДНЫЙ СЛЕД КАТАНЫ (серебристо-голубой) ===
  if (u_katanaAttack > 0.08 && u_katanaAttack < 0.65) {
    vec2 screenUV = gl_FragCoord.xy / u_resolution;
    
    // Прогресс взмаха (быстрее!)
    float swingProgress = smoothstep(0.08, 0.4, u_katanaAttack);
    float fadeOut = 1.0 - smoothstep(0.35, 0.65, u_katanaAttack);
    
    // Центр и углы дуги - КРУЧЕ!
    vec2 arcCenter;
    float arcStartAngle, arcEndAngle;
    
    if (u_katanaAttackType == 0) {
      // Удар справа - крутая диагональ сверху-справа вниз-влево
      arcCenter = vec2(0.75, 0.2);
      arcStartAngle = -0.8;
      arcEndAngle = 2.8;  // Больше угол!
    } else if (u_katanaAttackType == 1) {
      // Удар слева - крутая диагональ сверху-слева вниз-вправо
      arcCenter = vec2(0.25, 0.2);
      arcStartAngle = 0.4;
      arcEndAngle = 4.0;  // Больше угол!
    } else {
      // Сплеш - широкая горизонтальная
      arcCenter = vec2(0.5, 0.45);
      arcStartAngle = -0.5;
      arcEndAngle = 3.6;
    }
    
    vec2 toPixel = screenUV - arcCenter;
    float dist = length(toPixel);
    float angle = atan(toPixel.y, toPixel.x);
    
    // Дуга движется
    float currentAngle = mix(arcStartAngle, arcEndAngle, swingProgress);
    float angleDiff = abs(angle - currentAngle);
    if (angleDiff > 3.14159) angleDiff = 6.28318 - angleDiff;
    
    // След по дуге - тоньше и резче
    float arcRadius = 0.4;
    float radiusDiff = abs(dist - arcRadius);
    float trail = smoothstep(0.35, 0.0, angleDiff) * smoothstep(0.06, 0.01, radiusDiff);
    
    // Острие - яркая точка
    float tipGlow = smoothstep(0.15, 0.0, angleDiff) * smoothstep(0.04, 0.005, radiusDiff);
    
    // === ХОЛОДНЫЕ ЦВЕТА СТАЛИ ===
    // Основа - серебристо-голубой
    vec3 steelBlue = vec3(0.7, 0.85, 1.0);
    // Яркий край - белый с голубым
    vec3 sharpEdge = vec3(0.9, 0.95, 1.0);
    // Внутреннее свечение - холодный синий
    vec3 innerGlow = vec3(0.4, 0.6, 0.9);
    
    // Хвост следа с градиентом
    float trailFade = smoothstep(0.0, 0.3, angleDiff);
    vec3 trailColor = mix(sharpEdge, innerGlow, trailFade);
    
    // Применяем с мерцанием
    float shimmer = 0.8 + 0.2 * sin(u_time * 30.0 + angle * 10.0);
    float intensity = (trail * 0.5 + tipGlow * 1.2) * fadeOut * shimmer;
    
    // Аддитивное смешивание для яркости
    color += trailColor * intensity * 0.8;
    color = mix(color, sharpEdge, tipGlow * fadeOut * 0.6);
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
  
  // 7. BLOOM GLOW (мягкое свечение)
  float bloomBright = max(max(color.r, color.g), color.b);
  if (bloomBright > 0.7) {
    float bloomStr = (bloomBright - 0.7) * 0.5;
    vec3 bloomCol = color * (1.0 + bloomStr);
    // Распространение по экрану
    float bloomSpread = exp(-length(v_uv - 0.5) * 2.0);
    color = mix(color, bloomCol, bloomStr * bloomSpread);
  }
  
  // 8. АНАМОРФНЫЕ БЛИКИ (горизонтальные полосы от ярких точек)
  if (bloomBright > 0.75) {
    float streak = exp(-abs(v_uv.y - 0.5) * 6.0) * (bloomBright - 0.75) * 0.4;
    color += vec3(0.5, 0.7, 1.0) * streak;
  }
  
  // 9. ВИНЬЕТКА (кинематографичная глубина)
  vec2 vigUV = v_uv - 0.5;
  float vigDist = length(vigUV);
  float vig = 1.0 - vigDist * vigDist * 1.2;
  vig = smoothstep(0.0, 0.8, vig);
  color *= mix(0.7, 1.0, vig);
  
  // 10. ХРОМАТИЧЕСКАЯ АБЕРРАЦИЯ (на краях)
  float aberr = vigDist * vigDist * 0.015;
  color.r += (hash(v_uv + 0.1) - 0.5) * aberr;
  color.b -= (hash(v_uv + 0.2) - 0.5) * aberr;
  
  // 11. ПЛЁНОЧНАЯ ЗЕРНИСТОСТЬ
  float grain = filmGrain(v_uv * u_resolution, u_time * 60.0);
  float grainStr = mix(0.035, 0.01, lum); // Больше в тенях
  color += (grain - 0.5) * grainStr;
  
  // 12. DITHERING (устранение color banding)
  float dither = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 128.0;
  color += dither;
  
  // Финальный clamp
  color = clamp(color, 0.0, 1.0);
  
  fragColor = vec4(color, 1.0);
}
`;class gt{constructor(t){this.canvas=t;const e=t.getContext("webgl2");if(!e)throw new Error("WebGL2 не поддерживается");this.gl=e,this.uniforms={resolution:null,time:null,cameraPos:null,cameraDir:null,cameraYaw:null,cameraPitch:null,targets:null,targetCount:null,muzzleFlash:null,pools:null,poolCount:null,acidProjectiles:null,acidProjectileCount:null,spikes:null,spikeTargets:null,spikeCount:null,acidRainZones:null,acidRainZoneCount:null,era:null,altars:null,darts:null,dartDirs:null,dartCount:null,voidPortalActive:null,bloodCoins:null,bloodCoinCount:null,wave:null,greenBossPhase2:null,pickups:null,pickupCount:null,crystals:null,crystalCount:null,voidMode:null,voidProgress:null,voidFallOffset:null,portalPos:null,grenades:null,grenadeCount:null,explosions:null,explosionCount:null,voidVariant:null,katanaAttack:null,katanaBob:null,katanaCharges:null,katanaTargetAngle:null,katanaTargetDist:null,katanaAttackType:null,deathEffects:null,fragments:null,fragmentCount:null},this.init()}gl;program=null;uniforms;vao=null;renderScale=.75;init(){const t=this.gl,e=this.compileShader(t.VERTEX_SHADER,mt),i=this.compileShader(t.FRAGMENT_SHADER,dt);if(!e||!i)throw new Error("Ошибка компиляции шейдеров");if(this.program=t.createProgram(),t.attachShader(this.program,e),t.attachShader(this.program,i),t.linkProgram(this.program),!t.getProgramParameter(this.program,t.LINK_STATUS))throw new Error("Ошибка линковки: "+t.getProgramInfoLog(this.program));this.uniforms.resolution=t.getUniformLocation(this.program,"u_resolution"),this.uniforms.time=t.getUniformLocation(this.program,"u_time"),this.uniforms.cameraPos=t.getUniformLocation(this.program,"u_cameraPos"),this.uniforms.cameraYaw=t.getUniformLocation(this.program,"u_cameraYaw"),this.uniforms.cameraPitch=t.getUniformLocation(this.program,"u_cameraPitch"),this.uniforms.targets=t.getUniformLocation(this.program,"u_targets"),this.uniforms.targetCount=t.getUniformLocation(this.program,"u_targetCount"),this.uniforms.muzzleFlash=t.getUniformLocation(this.program,"u_muzzleFlash"),this.uniforms.pools=t.getUniformLocation(this.program,"u_pools"),this.uniforms.poolCount=t.getUniformLocation(this.program,"u_poolCount"),this.uniforms.acidProjectiles=t.getUniformLocation(this.program,"u_acidProjectiles"),this.uniforms.acidProjectileCount=t.getUniformLocation(this.program,"u_acidProjectileCount"),this.uniforms.spikes=t.getUniformLocation(this.program,"u_spikes"),this.uniforms.spikeTargets=t.getUniformLocation(this.program,"u_spikeTargets"),this.uniforms.spikeCount=t.getUniformLocation(this.program,"u_spikeCount"),this.uniforms.acidRainZones=t.getUniformLocation(this.program,"u_acidRainZones"),this.uniforms.acidRainZoneCount=t.getUniformLocation(this.program,"u_acidRainZoneCount"),this.uniforms.era=t.getUniformLocation(this.program,"u_era"),this.uniforms.altars=t.getUniformLocation(this.program,"u_altars"),this.uniforms.darts=t.getUniformLocation(this.program,"u_darts"),this.uniforms.dartDirs=t.getUniformLocation(this.program,"u_dartDirs"),this.uniforms.dartCount=t.getUniformLocation(this.program,"u_dartCount"),this.uniforms.voidPortalActive=t.getUniformLocation(this.program,"u_voidPortalActive"),this.uniforms.bloodCoins=t.getUniformLocation(this.program,"u_bloodCoins"),this.uniforms.bloodCoinCount=t.getUniformLocation(this.program,"u_bloodCoinCount"),this.uniforms.wave=t.getUniformLocation(this.program,"u_wave"),this.uniforms.greenBossPhase2=t.getUniformLocation(this.program,"u_greenBossPhase2"),this.uniforms.pickups=t.getUniformLocation(this.program,"u_pickups"),this.uniforms.pickupCount=t.getUniformLocation(this.program,"u_pickupCount"),this.uniforms.crystals=t.getUniformLocation(this.program,"u_crystals"),this.uniforms.voidMode=t.getUniformLocation(this.program,"u_voidMode"),this.uniforms.voidProgress=t.getUniformLocation(this.program,"u_voidProgress"),this.uniforms.voidFallOffset=t.getUniformLocation(this.program,"u_voidFallOffset"),this.uniforms.portalPos=t.getUniformLocation(this.program,"u_portalPos"),this.uniforms.grenades=t.getUniformLocation(this.program,"u_grenades"),this.uniforms.grenadeCount=t.getUniformLocation(this.program,"u_grenadeCount"),this.uniforms.explosions=t.getUniformLocation(this.program,"u_explosions"),this.uniforms.explosionCount=t.getUniformLocation(this.program,"u_explosionCount"),this.uniforms.voidVariant=t.getUniformLocation(this.program,"u_voidVariant"),this.uniforms.katanaAttack=t.getUniformLocation(this.program,"u_katanaAttack"),this.uniforms.katanaBob=t.getUniformLocation(this.program,"u_katanaBob"),this.uniforms.katanaCharges=t.getUniformLocation(this.program,"u_katanaCharges"),this.uniforms.katanaTargetAngle=t.getUniformLocation(this.program,"u_katanaTargetAngle"),this.uniforms.katanaTargetDist=t.getUniformLocation(this.program,"u_katanaTargetDist"),this.uniforms.katanaAttackType=t.getUniformLocation(this.program,"u_katanaAttackType"),this.uniforms.deathEffects=t.getUniformLocation(this.program,"u_deathEffects"),this.uniforms.fragments=t.getUniformLocation(this.program,"u_fragments"),this.uniforms.fragmentCount=t.getUniformLocation(this.program,"u_fragmentCount"),this.createQuad()}compileShader(t,e){const i=this.gl,a=i.createShader(t);return a?(i.shaderSource(a,e),i.compileShader(a),i.getShaderParameter(a,i.COMPILE_STATUS)?a:(console.error("Ошибка шейдера:",i.getShaderInfoLog(a)),i.deleteShader(a),null)):null}createQuad(){const t=this.gl,e=new Float32Array([-1,-1,1,-1,-1,1,1,1]);this.vao=t.createVertexArray(),t.bindVertexArray(this.vao);const i=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,i),t.bufferData(t.ARRAY_BUFFER,e,t.STATIC_DRAW);const a=t.getAttribLocation(this.program,"a_position");t.enableVertexAttribArray(a),t.vertexAttribPointer(a,2,t.FLOAT,!1,0,0),t.bindVertexArray(null)}resize(){const t=window.devicePixelRatio||1,e=Math.floor(this.canvas.clientWidth*t*this.renderScale),i=Math.floor(this.canvas.clientHeight*t*this.renderScale);(this.canvas.width!==e||this.canvas.height!==i)&&(this.canvas.width=e,this.canvas.height=i,this.gl.viewport(0,0,e,i))}render(t,e,i,a,o,s,n,l,r,c,h,p,f,u,m,d,v,y,T,w,A,C,S,R,z,x,M,P,V,D,I,L,B,X,q,H,F,Z,Q,J,$,N,tt,et,U,E,it){const g=this.gl;if(this.resize(),g.useProgram(this.program),g.bindVertexArray(this.vao),g.uniform2f(this.uniforms.resolution,this.canvas.width,this.canvas.height),g.uniform1f(this.uniforms.time,t),g.uniform3f(this.uniforms.cameraPos,e.x,e.y,e.z),g.uniform1f(this.uniforms.cameraYaw,i),g.uniform1f(this.uniforms.cameraPitch,a),g.uniform4fv(this.uniforms.targets,o),g.uniform1i(this.uniforms.targetCount,s),g.uniform1f(this.uniforms.muzzleFlash,n),l&&r!==void 0?(g.uniform4fv(this.uniforms.pools,l),g.uniform1i(this.uniforms.poolCount,r)):g.uniform1i(this.uniforms.poolCount,0),m&&d!==void 0&&d>0?(g.uniform4fv(this.uniforms.acidProjectiles,m),g.uniform1i(this.uniforms.acidProjectileCount,d)):g.uniform1i(this.uniforms.acidProjectileCount,0),v&&y&&T!==void 0&&T>0?(g.uniform4fv(this.uniforms.spikes,v),g.uniform4fv(this.uniforms.spikeTargets,y),g.uniform1i(this.uniforms.spikeCount,T)):g.uniform1i(this.uniforms.spikeCount,0),w&&A!==void 0&&A>0?(g.uniform4fv(this.uniforms.acidRainZones,w),g.uniform1i(this.uniforms.acidRainZoneCount,A)):g.uniform1i(this.uniforms.acidRainZoneCount,0),g.uniform1i(this.uniforms.era,c||1),g.uniform1i(this.uniforms.wave,h||1),g.uniform1i(this.uniforms.greenBossPhase2,C?1:0),p&&f!==void 0?(g.uniform4fv(this.uniforms.pickups,p),g.uniform1i(this.uniforms.pickupCount,f)):g.uniform1i(this.uniforms.pickupCount,0),u&&g.uniform4fv(this.uniforms.crystals,u),g.uniform1i(this.uniforms.voidMode,S?1:0),g.uniform1f(this.uniforms.voidProgress,R||0),g.uniform1f(this.uniforms.voidFallOffset,z||0),g.uniform3f(this.uniforms.portalPos,x?.x||0,x?.y||0,x?.z||0),M&&g.uniform4fv(this.uniforms.altars,M),P&&V&&D!==void 0&&D>0?(g.uniform4fv(this.uniforms.darts,P),g.uniform4fv(this.uniforms.dartDirs,V),g.uniform1i(this.uniforms.dartCount,D)):g.uniform1i(this.uniforms.dartCount,0),g.uniform1f(this.uniforms.voidPortalActive,I||0),L&&B!==void 0&&B>0?(g.uniform4fv(this.uniforms.bloodCoins,L),g.uniform1i(this.uniforms.bloodCoinCount,B)):g.uniform1i(this.uniforms.bloodCoinCount,0),X&&q!==void 0&&q>0?(g.uniform4fv(this.uniforms.grenades,X),g.uniform1i(this.uniforms.grenadeCount,q)):g.uniform1i(this.uniforms.grenadeCount,0),H&&F!==void 0&&F>0?(g.uniform4fv(this.uniforms.explosions,H),g.uniform1i(this.uniforms.explosionCount,F)):g.uniform1i(this.uniforms.explosionCount,0),g.uniform1i(this.uniforms.voidVariant,Z||0),g.uniform1f(this.uniforms.katanaAttack,Q||0),g.uniform1f(this.uniforms.katanaBob,J||0),g.uniform1i(this.uniforms.katanaCharges,$||0),g.uniform1f(this.uniforms.katanaTargetAngle,N!==void 0?N:-1),g.uniform1f(this.uniforms.katanaTargetDist,tt||100),g.uniform1i(this.uniforms.katanaAttackType,et||0),U?g.uniform4fv(this.uniforms.deathEffects,U):g.uniform4fv(this.uniforms.deathEffects,new Float32Array(32)),E&&E.length>0){const W=new Float32Array(128);W.set(E.subarray(0,Math.min(E.length,128))),g.uniform4fv(this.uniforms.fragments,W),g.uniform1i(this.uniforms.fragmentCount,Math.min(it||0,32))}else g.uniform4fv(this.uniforms.fragments,new Float32Array(128)),g.uniform1i(this.uniforms.fragmentCount,0);g.drawArrays(g.TRIANGLE_STRIP,0,4)}destroy(){this.program&&this.gl.deleteProgram(this.program)}}class vt{healthEl;ammoEl;fragsEl;crosshairEl;hitmarkerEl;reloadEl;waveEl;messageEl;damageOverlay;weaponEl;scoreEl;altarScoreEl;dartsEl;constructor(){this.healthEl=document.getElementById("health-value"),this.ammoEl=document.getElementById("ammo-value"),this.fragsEl=document.getElementById("frags-value"),this.crosshairEl=document.getElementById("crosshair"),this.hitmarkerEl=document.getElementById("hitmarker"),this.reloadEl=document.getElementById("reload-indicator"),this.reloadEl&&(this.reloadEl.style.display="none"),this.waveEl=this.createWaveElement(),this.messageEl=this.createMessageElement(),this.damageOverlay=this.createDamageOverlay(),this.weaponEl=this.createWeaponElement(),this.scoreEl=this.createScoreElement(),this.altarScoreEl=this.createAltarScoreElement(),this.dartsEl=this.createDartsElement(),this.hideHUD()}hideHUD(){const t=document.getElementById("hud");t&&(t.style.opacity="0"),this.weaponEl&&(this.weaponEl.style.display="none"),this.scoreEl&&(this.scoreEl.style.display="none"),this.altarScoreEl&&(this.altarScoreEl.style.display="none"),this.dartsEl&&(this.dartsEl.style.display="none"),this.doubleJumpEl&&(this.doubleJumpEl.style.display="none"),this.splashChargesEl&&(this.splashChargesEl.style.display="none")}showHUD(){const t=document.getElementById("hud");t&&(t.style.opacity="1"),this.weaponEl&&(this.weaponEl.style.display="block"),this.scoreEl&&(this.scoreEl.style.display="block"),this.altarScoreEl&&(this.altarScoreEl.style.display="block"),this.dartsEl&&(this.dartsEl.style.display="block"),this.doubleJumpEl&&(this.doubleJumpEl.style.display="block")}createDartsElement(){let t=document.getElementById("darts-count");return t||(t=document.createElement("div"),t.id="darts-count",t.style.cssText=`
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
      `,document.body.appendChild(this.slowOverlay)),this.slowOverlay.style.opacity="1",this.slowOverlay.animate([{filter:"hue-rotate(0deg) brightness(1)"},{filter:"hue-rotate(20deg) brightness(1.1)"},{filter:"hue-rotate(0deg) brightness(1)"}],{duration:500,iterations:Math.ceil(t*2)}),setTimeout(()=>{this.slowOverlay&&(this.slowOverlay.style.opacity="0")},t*1e3)}updateHealth(t,e){if(this.healthEl){this.healthEl.textContent=Math.floor(t).toString();const i=t/e;i>.5?this.healthEl.style.color="#00ffaa":i>.25?this.healthEl.style.color="#ffaa00":this.healthEl.style.color="#ff4444"}}updateCarryingScore(t){const e=document.getElementById("score-value");e&&(e.textContent=t.toString(),this.scoreEl&&(this.scoreEl.style.transform="scale(1.1)",setTimeout(()=>{this.scoreEl&&(this.scoreEl.style.transform="scale(1)")},100)))}updateAltarScore(t){const e=document.getElementById("altar-value");e&&(e.textContent=t.toString(),this.altarScoreEl&&(this.altarScoreEl.style.boxShadow="0 0 30px #00ffaa",setTimeout(()=>{this.altarScoreEl&&(this.altarScoreEl.style.boxShadow="")},300)))}updateDarts(t){const e=document.getElementById("darts-value");e&&(e.textContent=t.toString(),this.dartsEl&&(t===0?this.dartsEl.style.opacity="0.5":this.dartsEl.style.opacity="1"))}updateSplashCharges(t){this.splashChargesEl||this.createSplashChargesElement(),this.splashChargesEl&&(t>0?(this.splashChargesEl.style.display="block",this.splashChargesEl.innerHTML=`⚡ ВОЛНА: ${"●".repeat(t)}${"○".repeat(3-t)}`,this.splashChargesEl.style.color="#00ffff",this.splashChargesEl.style.textShadow="0 0 10px #00ffff, 0 0 20px #00ffff"):this.splashChargesEl.style.display="none")}splashChargesEl=null;doubleJumpEl=null;createSplashChargesElement(){this.splashChargesEl=document.createElement("div"),this.splashChargesEl.style.cssText=`
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
    `,document.body.appendChild(this.splashChargesEl)}updateDoubleJump(t,e){this.doubleJumpEl||this.createDoubleJumpElement(),this.doubleJumpEl&&(e?this.doubleJumpEl.style.opacity="0":this.doubleJumpEl.style.opacity="1")}createDoubleJumpElement(){this.doubleJumpEl=document.createElement("div"),this.doubleJumpEl.style.cssText=`
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
    `;const r=document.createElement("div");r.style.cssText=`
      font-size: 120px;
      opacity: 0;
      transform: scale(3);
      filter: drop-shadow(0 0 30px ${s});
    `,r.textContent=n;const c=document.createElement("div");c.style.cssText=`
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
    `,c.textContent=i;const h=document.createElement("div");h.style.cssText=`
      font-family: 'Orbitron', sans-serif;
      font-size: 24px;
      color: ${o};
      text-shadow: 0 0 10px ${s};
      opacity: 0;
      margin-top: 10px;
      letter-spacing: 4px;
    `,h.textContent=a;const p=document.createElement("div"),f=document.createElement("div"),u=`
      position: absolute;
      top: 50%;
      width: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, ${o});
    `;p.style.cssText=u+"left: 0; transform: translateY(-50%);",f.style.cssText=u+"right: 0; transform: translateY(-50%) scaleX(-1);",l.appendChild(p),l.appendChild(f),l.appendChild(r),l.appendChild(c),l.appendChild(h),document.body.appendChild(l),l.animate([{background:"rgba(0, 0, 0, 0)"},{background:"rgba(0, 0, 0, 0.8)"}],{duration:300,fill:"forwards"}),r.animate([{opacity:0,transform:"scale(3)"},{opacity:1,transform:"scale(1)"}],{duration:500,delay:200,fill:"forwards",easing:"ease-out"}),c.animate([{opacity:0,transform:"translateY(50px)"},{opacity:1,transform:"translateY(0)"}],{duration:500,delay:400,fill:"forwards",easing:"ease-out"}),h.animate([{opacity:0},{opacity:.8}],{duration:400,delay:600,fill:"forwards"}),p.animate([{width:"0%"},{width:"35%"}],{duration:600,delay:300,fill:"forwards",easing:"ease-out"}),f.animate([{width:"0%"},{width:"35%"}],{duration:600,delay:300,fill:"forwards",easing:"ease-out"}),setTimeout(()=>{l.animate([{opacity:1},{opacity:0}],{duration:500,fill:"forwards"}),setTimeout(()=>{l.remove(),e?.()},500)},2500)}showVoidMode(t,e){this.voidOverlay||this.createVoidOverlay(),this.voidOverlay&&(this.voidOverlay.style.display="flex",this.voidTimerEl&&(this.voidTimerEl.textContent="НАЙДИ ПОРТАЛ",this.voidTimerEl.style.color="#aa55ff",this.voidTimerEl.style.textShadow="0 0 20px #8800ff, 0 0 40px rgba(136, 0, 255, 0.5)"),this.voidKillsEl&&(this.voidKillsEl.textContent=`🌀 ${t}м`,t<15?(this.voidKillsEl.style.color="#00ff88",this.voidKillsEl.style.textShadow="0 0 15px #00ff88"):t<30?(this.voidKillsEl.style.color="#cc88ff",this.voidKillsEl.style.textShadow="0 0 15px #aa55ff"):(this.voidKillsEl.style.color="#8855cc",this.voidKillsEl.style.textShadow="0 0 15px #6633aa")))}hideVoidMode(){this.voidOverlay&&(this.voidOverlay.style.display="none")}createVoidOverlay(){this.voidOverlay=document.createElement("div"),this.voidOverlay.id="void-overlay",this.voidOverlay.style.cssText=`
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
      `,document.head.appendChild(i)}this.voidOverlay.appendChild(t),this.voidOverlay.appendChild(this.voidTimerEl),this.voidOverlay.appendChild(this.voidKillsEl),this.voidOverlay.appendChild(e),document.body.appendChild(this.voidOverlay)}showVoidEnter(){this.showMessage("🌀 ВЛАДЫКА ЗАСОСАЛ ТЕБЯ В ВОЙД! 🌀","#aa55ff")}showVoidExit(t){t?this.showMessage("✓ ВЫРВАЛСЯ ИЗ ВОЙДА!","#00ff88"):this.showMessage("☠️ ВОЙД ПОГЛОТИЛ ТЕБЯ...","#aa00ff")}}class yt{playerRadius=.4;arenaRadius=38;poolRadius=8;platformHeight=2;platformX=20;bridgeWidth=3.5;backPlatformRadius=8;backPlatformX=30;baseHeights=[1.8,3,4.2,5.4,6.6,7.8];topBaseHeight=9.5;jumpPlatforms=[{x:10,z:0,height:1.8,radius:1.5},{x:5,z:8.66,height:3,radius:1.4},{x:-5,z:8.66,height:4.2,radius:1.4},{x:-10,z:0,height:5.4,radius:1.3},{x:-5,z:-8.66,height:6.6,radius:1.3},{x:5,z:-8.66,height:7.8,radius:1.2}];topPlatform={x:0,z:0,height:9.5,radius:2.5};updatePlatforms(t){for(let e=0;e<this.jumpPlatforms.length;e++){const i=e*.8,a=Math.sin(t*1.5+i)*.3;this.jumpPlatforms[e].height=this.baseHeights[e]+a}this.topPlatform.height=this.topBaseHeight+Math.sin(t*1)*.2}getPlatformData(){const t=new Float32Array(28);for(let e=0;e<this.jumpPlatforms.length;e++){const i=this.jumpPlatforms[e];t[e*4+0]=i.x,t[e*4+1]=i.z,t[e*4+2]=i.height,t[e*4+3]=i.radius}return t[24]=this.topPlatform.x,t[25]=this.topPlatform.z,t[26]=this.topPlatform.height,t[27]=this.topPlatform.radius,t}checkCollision(t){const e=this.playerRadius,i=Math.sqrt(t.x*t.x+t.z*t.z);if(i<1.2+e&&t.y<10)return!0;const a=8;if(i>a-.5&&i<a+.5&&t.y<.8)return!0;const o=-22,s={x:o,z:-2},n={x:o,z:2},l=22,h=[s,n,{x:l,z:-2},{x:l,z:2}];for(const m of h){const d=t.x-m.x,v=t.z-m.z;if(Math.abs(d)<.6+e&&Math.abs(v)<.6+e&&t.y<5.5)return!0}const p=Math.sqrt(Math.pow(t.x- -this.backPlatformX,2)+Math.pow(t.z,2));if(p>this.backPlatformRadius-.5&&p<this.backPlatformRadius+.5&&t.y<1)return!0;for(let m=0;m<8;m++){const d=m*Math.PI/4,v=-this.backPlatformX+Math.cos(d)*(this.backPlatformRadius-.2),y=Math.sin(d)*(this.backPlatformRadius-.2),T=t.x-v,w=t.z-y;if(Math.abs(T)<.3+e&&Math.abs(w)<.3+e&&t.y<1.5)return!0}const f=Math.sqrt(Math.pow(t.x-this.backPlatformX,2)+Math.pow(t.z,2));if(f>this.backPlatformRadius-.5&&f<this.backPlatformRadius+.5&&t.y<1)return!0;for(let m=0;m<8;m++){const d=m*Math.PI/4,v=this.backPlatformX+Math.cos(d)*(this.backPlatformRadius-.2),y=Math.sin(d)*(this.backPlatformRadius-.2),T=t.x-v,w=t.z-y;if(Math.abs(T)<.3+e&&Math.abs(w)<.3+e&&t.y<1.5)return!0}const u=[...this.jumpPlatforms,this.topPlatform];for(const m of u){const d=t.x-m.x,v=t.z-m.z,y=Math.sqrt(d*d+v*v),T=t.y-1.7;if(y<m.radius+e&&T<m.height-.1&&T>m.height-1.5)return!0}return t.x<-this.platformX+3.5&&t.x>-this.platformX-3.5&&Math.abs(t.z)<6.5&&t.y>this.platformHeight-.5&&t.x>-this.platformX+2.8&&Math.abs(t.z)<6||t.x>this.platformX-3.5&&t.x<this.platformX+3.5&&Math.abs(t.z)<6.5&&t.y>this.platformHeight-.5&&t.x<this.platformX-2.8&&Math.abs(t.z)<6}isOverCirclePlatform(t,e){const i=t.x-e.x,a=t.z-e.z,o=Math.sqrt(i*i+a*a),s=t.y-1.7;return o<e.radius&&s>=e.height-.1}getFloorHeight(t){const e=Math.sqrt(t.x*t.x+t.z*t.z);if(e>33)return-50;const a=Math.abs(t.z)<this.bridgeWidth/2&&Math.abs(t.x)<this.poolRadius+1,o=Math.abs(t.x)<this.bridgeWidth/2&&Math.abs(t.z)<this.poolRadius+1;if((a||o)&&e>2)return .3;const s=-16,n=-17,l=-23;if(Math.abs(t.z)<3){if(t.x>=n&&t.x<=s)return(s-t.x)/(s-n)*this.platformHeight;if(t.x<n&&t.x>l)return this.platformHeight}const r=16,c=17,h=23;if(Math.abs(t.z)<3){if(t.x>=r&&t.x<=c)return(t.x-r)/(c-r)*this.platformHeight;if(t.x>c&&t.x<h)return this.platformHeight}if(this.isOverCirclePlatform(t,this.topPlatform))return this.topPlatform.height;for(let u=this.jumpPlatforms.length-1;u>=0;u--)if(this.isOverCirclePlatform(t,this.jumpPlatforms[u]))return this.jumpPlatforms[u].height;return t.x<-18.5&&t.x>-25.5&&Math.abs(t.z)<3.5||t.x>18.5&&t.x<25.5&&Math.abs(t.z)<3.5||Math.sqrt(Math.pow(t.x- -this.backPlatformX,2)+Math.pow(t.z,2))<this.backPlatformRadius||Math.sqrt(Math.pow(t.x-this.backPlatformX,2)+Math.pow(t.z,2))<this.backPlatformRadius?.5:t.x<-21.5&&t.x>-this.backPlatformX+this.backPlatformRadius&&Math.abs(t.z)<2.5||t.x>21.5&&t.x<this.backPlatformX-this.backPlatformRadius&&Math.abs(t.z)<2.5?.3:0}getCeilingHeight(t){const e=[...this.jumpPlatforms,this.topPlatform];for(const i of e){const a=t.x-i.x,o=t.z-i.z;if(Math.sqrt(a*a+o*o)<i.radius-.3&&t.y<i.height-.5&&t.y>i.height-4)return i.height-.3}return 18}checkEnemyCollision(t,e){const i=Math.sqrt(t.x*t.x+t.z*t.z);if(i>33-e||i<1.2+e)return!0;const o=8;if(i>o-.5-e&&i<o+.5+e&&t.y<.8)return!0;const s=[{x:-22,z:-2},{x:-22,z:2},{x:22,z:-2},{x:22,z:2}];for(const r of s){const c=t.x-r.x,h=t.z-r.z;if(Math.abs(c)<.6+e&&Math.abs(h)<.6+e&&t.y<5.5)return!0}for(let r=-1;r<=1;r+=2){const c=r*this.backPlatformX;for(let h=0;h<8;h++){const p=h*Math.PI/4,f=c+Math.cos(p)*(this.backPlatformRadius-.2),u=Math.sin(p)*(this.backPlatformRadius-.2),m=t.x-f,d=t.z-u;if(Math.abs(m)<.3+e&&Math.abs(d)<.3+e&&t.y<1.5)return!0}}const n=[{x:0,z:28},{x:0,z:-28},{x:28,z:0},{x:-28,z:0}];for(const r of n){const c=t.x-r.x,h=t.z-r.z;if(Math.sqrt(c*c+h*h)<.7+e)return!0}const l=[...this.jumpPlatforms,this.topPlatform];for(const r of l){const c=t.x-r.x,h=t.z-r.z;if(Math.sqrt(c*c+h*h)<r.radius+e&&t.y<r.height+1.5&&t.y>r.height-1.5)return!0}return!1}getObstacleHeight(t,e,i,a=1.5){const o=t.x+e*a,s=t.z+i*a,n=[...this.jumpPlatforms,this.topPlatform];for(const l of n){const r=o-l.x,c=s-l.z;if(Math.sqrt(r*r+c*c)<l.radius&&t.y<l.height)return l.height}return 0}}const xt={width:1280,height:720,renderScale:.4,movement:{walkSpeed:9,runSpeed:16,jumpForce:12,gravity:25,groundFriction:12,airControl:.85,mouseSensitivity:.002},weapon:{name:"Katana",damage:100,fireRate:2.5,magazineSize:999,reloadTime:0,spread:0,automatic:!1}};class Tt{state={isRunning:!1,isPaused:!1,frags:0,gameTime:0,soundEnabled:!0};config;gameLoop;input;player;weapon;weaponRenderer;targetManager;pickupManager;audio;renderer;hud;collision;weaponCanvas;startScreen;gameTime=0;isPaused=!1;carryingScore=0;altars=[{position:{x:0,y:0,z:30},score:0},{position:{x:0,y:0,z:-30},score:0}];SCORE_VALUES={baneling:10,phantom:15,runner:20,hopper:25,spiker:30,boss_green:100,boss_black:150,boss_blue:200};darts=50;dartCooldown=0;DART_FIRE_RATE=.08;DART_DAMAGE=15;DARTS_PER_POINT=2;flyingDarts=[];voidPortalTimer=10;voidPortalActive=!1;voidPortalLifetime=0;VOID_PORTAL_DURATION=10;VOID_PORTAL_COOLDOWN=10;bloodCoins=0;voidCoins=[];grenadeCount=5;grenades=[];explosions=[];deathEffects=[];DEATH_EFFECT_DURATION=.5;GRENADE_SPEED=25;GRENADE_GRAVITY=15;GRENADE_FUSE=1.5;EXPLOSION_RADIUS=8;EXPLOSION_DAMAGE=50;EXPLOSION_DURATION=.5;GRENADE_COST=3;voidVariant=0;footstepTimer=0;wasGrounded=!0;screenShake=0;lastSliceTime=0;wasJumpPressed=!1;attackHitChecked=!1;splashHitChecked=!1;currentEra=1;killTimes=[];COMBO_WINDOW=9;COMBO_KILLS_NEEDED=3;isInVoid=!1;voidSpawnTimer=0;savedPosition=b(0,0,0);savedYaw=0;voidEnemyIds=[];voidFallOffset=0;savedEnemyIds=[];savedWaveActive=!1;voidPhantomCooldown=new Map;portalPos=b(0,0,0);PORTAL_DISTANCE=60;PORTAL_RADIUS=4;VOID_SPAWN_INTERVAL=3;constructor(t,e,i={}){this.weaponCanvas=e,this.config={...xt,...i},this.collision=new yt,this.input=new st(t),this.audio=new ut,this.hud=new vt,this.player=new ct(b(0,1.7,12),this.config.movement,this.collision),this.weapon=new ht,this.weapon.onSlice=()=>this.onKatanaSlice(),this.renderer=new gt(t),this.renderer.renderScale=this.config.renderScale,this.weaponRenderer=new _(e),this.targetManager=new pt(this.collision),this.setupTargetCallbacks(),this.pickupManager=new ft,this.gameLoop=new at(a=>this.update(a),()=>this.render()),this.startScreen=document.getElementById("click-to-start"),this.setupEventHandlers()}setupTargetCallbacks(){this.targetManager.onTargetDestroyed=t=>{this.state.frags++,this.audio.playSFX("kill"),this.hud.showHitmarker(!0),this.spawnDeathEffect(t.position);const e=this.SCORE_VALUES[t.enemyType]||10;if(this.carryingScore+=e,this.hud.showMessage(`+${e}`,"purple"),this.isInVoid||this.pickupManager.spawnAfterKill(t.position),this.killTimes.push(this.gameTime),this.killTimes=this.killTimes.filter(i=>this.gameTime-i<this.COMBO_WINDOW),this.killTimes.length>=this.COMBO_KILLS_NEEDED&&!this.player.rageMode&&this.activateComboAdrenaline(),this.killTimes.length>0&&this.killTimes.length<this.COMBO_KILLS_NEEDED&&this.hud.showMessage(`🔥 КОМБО ${this.killTimes.length}/${this.COMBO_KILLS_NEEDED}`,"orange"),t.isBoss){this.hud.showMessage("💀 БОСС ПОВЕРЖЕН! 💀","gold");for(let i=0;i<3;i++)this.pickupManager.spawnAfterKill(t.position);this.pickupManager.respawnChargeAfterBoss(),this.targetManager.wave===5&&this.player.maxAirJumps<2&&(this.player.unlockTripleJump(),this.hud.showMessage("🦘 ТРОЙНОЙ ПРЫЖОК РАЗБЛОКИРОВАН! 🦘","cyan"))}},this.targetManager.onPlayerHit=t=>{this.player.takeDamage(t.damage),this.audio.playSFX("player_hurt");const e=this.player.state.position,i={x:e.x-t.position.x,z:e.z-t.position.z},a=Math.sqrt(i.x**2+i.z**2);if(a>.1){const o=t.isBoss?12:6;this.player.state.velocity.x+=i.x/a*o,this.player.state.velocity.z+=i.z/a*o}switch(t.enemyType){case"phantom":this.audio.playSFX("phantom_pass"),this.screenShake=.3,this.hud.showDamage("purple"),this.slowdownFactor=.3,this.slowdownTimer=2;break;case"runner":this.audio.playSFX("runner_hit"),this.screenShake=.4,this.hud.showDamage("green");break;case"hopper":this.audio.playSFX("hopper_hit"),this.screenShake=.6,this.hud.showDamage("green");break;case"boss_green":this.audio.playSFX("kill"),this.screenShake=1,this.hud.showDamage("green"),this.hud.showMessage("💀 ТОКСИЧНЫЙ УДАР!","lime");break;case"boss_black":if(!this.isInVoid){this.enterVoidMode();return}break;case"boss_blue":this.audio.playSFX("hopper_hit"),this.screenShake=.7,this.hud.showDamage("purple"),this.hud.showMessage("⚡ ТЕЛЕПОРТ УДАР!","cyan");break;default:this.audio.playSFX("hit"),this.screenShake=.5,this.hud.showDamage("green")}},this.targetManager.onWaveStart=t=>{this.hud.showWave(t),this.audio.setEra(t),this.currentEra=t>10?3:t>5?2:1,t===5?(this.isPaused=!0,this.audio.playBossWarning(),this.hud.showBossIntro("boss_green",()=>{this.isPaused=!1,this.audio.setBossMusic("boss_green")})):t===10?(this.isPaused=!0,this.audio.playBossWarning(),this.hud.showBossIntro("boss_black",()=>{this.isPaused=!1,this.audio.setBossMusic("boss_black")})):t===15&&(this.isPaused=!0,this.audio.playBossWarning(),this.hud.showBossIntro("boss_blue",()=>{this.isPaused=!1,this.audio.setBossMusic("boss_blue")})),t===6?setTimeout(()=>this.hud.showMessage("🌀 ЗОНА ЧЁРНОЙ ДЫРЫ 🌀","purple"),1e3):t===11&&setTimeout(()=>this.hud.showMessage("🚀 КОСМИЧЕСКАЯ ЗОНА 🚀","cyan"),1e3)},this.targetManager.onWaveComplete=t=>{this.hud.showWaveComplete(t),(t===5||t===10||t===15)&&(this.audio.setBossMusic(null),this.audio.setEra(t+1))},this.targetManager.onPoolDamage=t=>{this.player.takeDamage(t),this.hud.showDamage("green"),this.screenShake=.2},this.targetManager.onBossPhaseChange=(t,e)=>{t==="boss_green"&&e===2&&(this.audio.setBossGreenPhase2(),this.hud.showMessage("☣️ ФАЗА 2: ЯРОСТЬ! ☣️","lime"),this.screenShake=1.5)},this.targetManager.onBossVortexWarning=()=>{this.hud.showMessage("⚠️ ВИХРЬ ПРИБЛИЖАЕТСЯ! ⚠️","yellow")},this.targetManager.onBossVortexStart=()=>{this.hud.showMessage("🌀 ВИХРЬ! БЕГИ! 🌀","purple"),this.screenShake=1},this.targetManager.onBossVortexEnd=()=>{},this.targetManager.onAcidSpit=()=>{this.audio.playSFX("acid_spit")},this.targetManager.onAcidRain=t=>{this.audio.playAcidSplash(),this.screenShake=.3},this.targetManager.onAcidRainMarkSound=()=>{this.audio.playAcidRainMark(),this.hud.showMessage("☢️ КИСЛОТНЫЙ ДОЖДЬ! УКРОЙСЯ! ☢️","lime")},this.targetManager.onAcidRainStart=t=>{this.audio.playAcidRainStart(),this.screenShake=.5},this.targetManager.onEnemySpawn=(t,e)=>{switch(t){case"baneling":this.audio.playBanelingSpawn();break;case"phantom":this.audio.playPhantomSpawn();break;case"runner":this.audio.playRunnerSpawn();break;case"hopper":this.audio.playHopperSpawn();break;case"spiker":this.audio.playSFX("spiker_scream");break;case"boss_green":case"boss_black":case"boss_blue":this.audio.playBossSpawn();break}},this.targetManager.onSpikerScream=()=>{this.audio.playSFX("spiker_scream")},this.targetManager.onSpikerAttack=()=>{this.audio.playSFX("spiker_shoot")},this.targetManager.onSpikeHit=()=>{this.player.takeDamage(10),this.audio.playSFX("player_hurt"),this.hud.showDamage(),this.screenShake=.3,this.hud.updateHealth(this.player.state.health,this.player.state.maxHealth),this.player.isDead()&&this.gameOver()}}slowdownFactor=1;slowdownTimer=0;setupEventHandlers(){const t=document.getElementById("volume-slider"),e=document.getElementById("volume-value"),i=document.getElementById("sens-slider"),a=document.getElementById("sens-value");t?.addEventListener("input",o=>{o.stopPropagation();const s=parseInt(t.value);e&&(e.textContent=`${s}%`),this.audio.setVolume(s/100)}),i?.addEventListener("input",o=>{o.stopPropagation();const s=parseInt(i.value);a&&(a.textContent=`${s}%`),this.input.setSensitivity(.001+s/100*.009)}),document.getElementById("settings")?.addEventListener("click",o=>{o.stopPropagation()}),document.getElementById("start-buttons")?.addEventListener("click",o=>{o.stopPropagation()}),document.getElementById("btn-start")?.addEventListener("click",()=>this.start()),document.getElementById("btn-boss5")?.addEventListener("click",()=>this.startFromWave(5)),document.getElementById("btn-boss10")?.addEventListener("click",()=>this.startFromWave(10)),document.getElementById("btn-boss15")?.addEventListener("click",()=>this.startFromWave(15)),document.getElementById("btn-settings")?.addEventListener("click",o=>{o.stopPropagation(),document.getElementById("modal-settings")?.classList.add("active")}),document.getElementById("btn-help")?.addEventListener("click",o=>{o.stopPropagation(),document.getElementById("modal-help")?.classList.add("active")}),document.querySelectorAll(".modal-close").forEach(o=>{o.addEventListener("click",s=>{s.stopPropagation();const n=o.dataset.modal;n&&document.getElementById(n)?.classList.remove("active")})}),document.querySelectorAll(".modal").forEach(o=>{o.addEventListener("click",s=>{s.target===o&&o.classList.remove("active")})}),document.querySelectorAll(".modal-content").forEach(o=>{o.addEventListener("click",s=>s.stopPropagation())}),document.addEventListener("keydown",o=>{o.code==="KeyM"&&this.audio.toggleMute(),o.code==="KeyF"&&this.toggleFullscreen()}),window.addEventListener("resize",()=>this.handleResize())}start(){this.startFromWave(1)}startFromWave(t){if(this.state.isRunning)return;const e=document.getElementById("volume-slider"),i=document.getElementById("sens-slider");e&&this.audio.setVolume(parseInt(e.value)/100),i&&this.input.setSensitivity(.001+parseInt(i.value)/100*.009),this.startScreen&&(this.startScreen.style.display="none"),this.hud.showHUD(),this.input.requestPointerLock(),this.audio.start(),this.gameLoop.start(),this.state.isRunning=!0,this.targetManager.startGame(t),t===5?this.hud.showMessage("⚠️ ЗЕЛЁНЫЙ БОСС! ⚠️","lime"):t===10?this.hud.showMessage("☠️ ЧЁРНЫЙ БОСС! ☠️","purple"):t===15&&this.hud.showMessage("⚡ СИНИЙ БОСС! ⚡","cyan"),this.handleResize()}stop(){this.gameLoop.stop(),this.state.isRunning=!1,this.input.exitPointerLock()}update(t){if(this.state.isPaused||this.isPaused)return;this.gameTime+=t,this.isInVoid||this.collision.updatePlatforms(this.gameTime),this.slowdownTimer>0&&(this.slowdownTimer-=t,this.slowdownTimer<=0&&(this.slowdownFactor=1));const e=t*this.slowdownFactor;if(this.player.update(e,this.input.state,{x:this.input.mouseDelta.x*this.slowdownFactor,y:this.input.mouseDelta.y*this.slowdownFactor}),this.input.resetMouseDelta(),this.isInVoid&&this.updateVoidMode(t),!this.isInVoid){const c=this.player.state.position;Math.sqrt(c.x**2+c.z**2)>33&&(this.hud.showMessage("💀 УПАЛ В БЕЗДНУ!","purple"),this.audio.playSFX("kill"),this.screenShake=2,this.enterVoid())}const i=this.targetManager.getVortexPull(this.player.state.position);if((i.x!==0||i.z!==0)&&(this.player.state.position.x+=i.x*t,this.player.state.position.z+=i.z*t,this.screenShake=Math.max(this.screenShake,.3)),this.updateMovementSounds(t),this.input.state.fire&&this.weapon.tryAttack()){this.audio.playSFX("katana_swing"),this.attackHitChecked=!1;const[c,h]=this.getKatanaTargetData();this.weapon.attackType=c>0?1:0}this.weapon.isAttacking&&!this.weapon.isSplashAttack&&!this.attackHitChecked&&this.weapon.attackProgress>=.2&&this.weapon.attackProgress<=.5&&(this.checkNormalAttack(),this.attackHitChecked=!0),this.input.state.altFire&&this.weapon.trySplashAttack()&&(this.audio.playSFX("splash_wave"),this.splashHitChecked=!1),this.weapon.isAttacking&&this.weapon.isSplashAttack&&!this.splashHitChecked&&this.weapon.attackProgress>=.2&&this.weapon.attackProgress<=.5&&(this.checkSplashAttack(),this.splashHitChecked=!0),this.dartCooldown-=t,this.input.state.altFire&&this.darts>0&&this.dartCooldown<=0&&(this.fireDart(),this.dartCooldown=this.DART_FIRE_RATE),this.updateDarts(t),this.input.state.throwGrenade&&this.grenadeCount>0?(this.throwGrenade(),this.input.state.throwGrenade=!1):this.input.state.throwGrenade=!1,this.updateGrenades(t),this.updateExplosions(t),this.updateDeathEffects(t),this.updateVoidPortal(t);const a=this.input.state.forward||this.input.state.backward||this.input.state.left||this.input.state.right;this.weapon.update(t,a,this.input.state.run),this.weaponRenderer.isAttacking=this.weapon.isAttacking,this.weaponRenderer.attackProgress=this.weapon.attackProgress,this.weaponRenderer.isSplashAttack=this.weapon.isSplashAttack,this.weaponRenderer.splashCharges=this.weapon.splashCharges;const o=this.player.getEyePosition();if(!this.isInVoid)this.targetManager.update(t,o,this.gameTime);else{for(const[c,h]of this.voidPhantomCooldown)h>0&&this.voidPhantomCooldown.set(c,h-t);for(const c of this.targetManager.targets)if(c.active&&this.voidEnemyIds.includes(c.id)&&(c.update(t,o,this.gameTime),(this.voidPhantomCooldown.get(c.id)||0)<=0&&c.checkPlayerCollision(o))){this.player.takeDamage(8),this.voidPhantomCooldown.set(c.id,1.5);const p={x:o.x-c.position.x,z:o.z-c.position.z},f=Math.sqrt(p.x**2+p.z**2);f>.1&&(this.player.state.velocity.x+=p.x/f*8,this.player.state.velocity.z+=p.z/f*8),this.audio.playSFX("phantom_hit"),this.audio.playSFX("player_hurt"),this.screenShake=.8,this.hud.showDamage("purple"),this.hud.showMessage("💀 ФАНТОМ!","purple")}}this.updateEnemyProximitySounds(o),this.checkAttachedRunners(),!this.input.state.jump&&this.wasJumpPressed&&this.player.onJumpReleased(),this.wasJumpPressed=this.input.state.jump,this.input.state.jump&&!this.player.state.grounded&&this.player.tryDoubleJump()&&(this.detachRunners(),this.audio.playSFX("jump"));const s=this.pickupManager.update(t,this.gameTime,o);s&&this.onPickup(s),this.audio.updateProximitySound(0),this.screenShake>0&&(this.screenShake-=t*2),this.player.isDead()&&this.gameOver(),this.hud.updateHealth(this.player.state.health,this.player.state.maxHealth),this.hud.updateAmmo(this.targetManager.wave,this.targetManager.getActiveCount()),this.hud.updateFrags(this.state.frags),this.hud.updateSplashCharges(this.weapon.splashCharges),this.hud.updateDoubleJump(this.player.getDoubleJumpCooldown(),this.player.isDoubleJumpReady()),this.hud.updateCarryingScore(this.carryingScore);const n=this.altars.reduce((c,h)=>c+h.score,0);this.hud.updateAltarScore(n),this.hud.updateDarts(this.darts);const l=this.player.state.health/this.player.state.maxHealth;this.audio.setLowHpMode(l<.3&&l>0);const r=this.targetManager.getActiveBoss();r?this.hud.showBossHealth(r.hp,r.maxHp,r.enemyType):this.hud.hideBossHealth()}updateMovementSounds(t){(this.input.state.forward||this.input.state.backward||this.input.state.left||this.input.state.right)&&this.player.state.grounded&&(this.footstepTimer-=t,this.footstepTimer<=0&&(this.audio.playSFX("footstep"),this.footstepTimer=this.input.state.run?.25:.4)),this.player.state.grounded&&!this.wasGrounded&&this.audio.playSFX("land"),this.wasGrounded=this.player.state.grounded}onKatanaSlice(){this.audio.playSFX("katana_swing")}gameOver(){this.state.isPaused=!0,this.hud.showGameOver(this.state.frags,this.targetManager.wave),setTimeout(()=>{this.restart()},3e3)}restart(){this.player.reset(b(0,1.7,12)),this.player.state.health=100,this.player.state.maxHealth=100,this.state.frags=0,this.state.isPaused=!1,this.isInVoid=!1,this.player.isInVoid=!1,this.carryingScore=0,this.darts=0,this.altars.forEach(t=>{t.score=0}),this.weapon.splashCharges=0,this.weapon.isAttacking=!1,this.weapon.attackProgress=0,this.screenShake=0,this.slowdownFactor=1,this.slowdownTimer=0,this.targetManager.startGame(1),this.pickupManager.pickups=[],this.hud.updateCarryingScore(0),this.hud.updateAltarScore(0),this.hud.updateDarts(0),this.hud.updateSplashCharges(0)}enterVoidMode(){this.isInVoid=!0,this.player.isInVoid=!0,this.voidEnemyIds=[],this.voidFallOffset=0,this.voidPhantomCooldown.clear(),this.audio.enterVoidAudio(),this.savedPosition={...this.player.state.position},this.savedYaw=this.player.state.yaw,this.player.state.position=b(0,2,0),this.player.state.velocity=b(0,0,0),this.player.state.grounded=!0;const t=Math.random()*Math.PI*2;this.portalPos=b(Math.cos(t)*this.PORTAL_DISTANCE,3,Math.sin(t)*this.PORTAL_DISTANCE),this.savedWaveActive=this.targetManager.waveActive,this.savedEnemyIds=[];for(const e of this.targetManager.targets)e.active&&(this.savedEnemyIds.push(e.id),e.active=!1,e.removeTimer=9999);this.hud.showVoidEnter(),this.screenShake=1.5,this.voidSpawnTimer=1,this.voidEnemyIds=[]}updateVoidMode(t){if(!this.isInVoid)return;this.voidFallOffset+=t*5,this.screenShake=Math.max(this.screenShake,.03);const e=this.player.state.position,a=Math.sqrt(e.x**2+e.z**2)<10,s=Math.sqrt((e.x-this.portalPos.x)**2+(e.z-this.portalPos.z)**2)<5,n={x:this.portalPos.x,z:this.portalPos.z},l=Math.sqrt(n.x**2+n.z**2);l>0&&(n.x/=l,n.z/=l);const r=l-5-10;let c=!1,h=-100;for(let d=0;d<8;d++){const v=12+d*(r/7),y=Math.sin(d*73.1)*2,T=Math.cos(d*47.3)*2,w=Math.sin(d*91.7)*.8-.3,A=I=>I-Math.floor(I),C=2+A(Math.sin(d*127.3)*43758.5)*2,S=C*(.8+A(Math.sin(d*31.7)*100)*.4),R=C*(.8+A(Math.sin(d*57.3)*100)*.4),z=n.x*v+y,x=n.z*v+T,M=w+.5,P=d*.7,V=(e.x-z)*Math.cos(-P)-(e.z-x)*Math.sin(-P),D=(e.x-z)*Math.sin(-P)+(e.z-x)*Math.cos(-P);Math.abs(V)<S&&Math.abs(D)<R&&(c=!0,h=Math.max(h,M+1.8))}let p=-100;if(a||s?p=2:c&&(p=h),e.y<-5){this.fallFromVoid();return}p>-50&&e.y<=p?(this.player.state.position.y=p,this.player.state.grounded=!0,this.player.state.velocity.y=0):(this.player.state.grounded=!1,this.player.state.velocity.y-=30*t,this.player.state.position.y+=this.player.state.velocity.y*t),this.updateBloodCoins(t);const f=this.player.state.position.x-this.portalPos.x,u=this.player.state.position.z-this.portalPos.z,m=Math.sqrt(f*f+u*u);if(m<this.PORTAL_RADIUS){this.exitVoidMode(!0);return}this.voidSpawnTimer-=t,this.voidSpawnTimer<=0&&(this.spawnVoidHunter(),this.voidSpawnTimer=this.VOID_SPAWN_INTERVAL),this.hud.showVoidMode(Math.floor(m),this.PORTAL_DISTANCE),this.player.isDead()&&this.exitVoidMode(!1)}spawnVoidHunter(){const t=this.player.state.position,e=this.player.state.yaw,i=(Math.random()-.5)*Math.PI+Math.PI,a=e+i,o=15+Math.random()*10,s=b(t.x+Math.cos(a)*o,2,t.z+Math.sin(a)*o),n=Date.now()+Math.floor(Math.random()*1e3),l=new G(s,12+Math.random()*4,n,"phantom",this.collision);l.active=!0,this.targetManager.targets.push(l),this.voidEnemyIds.push(n),this.audio.playSFX("void_whistle")}fallFromVoid(){this.isInVoid=!1,this.player.isInVoid=!1,this.voidCoins=[],this.audio.exitVoidAudio(),this.hud.hideVoidMode();const t=Math.random()<.5?O.left:O.right,e=t.x>0?-3:3;this.player.state.position={x:t.x+e,y:t.y,z:t.z},this.player.state.velocity={x:0,y:0,z:0},this.player.state.grounded=!0,this.screenShake=1,this.audio.playSFX("player_hurt"),this.hud.showMessage("💀 ВЫШВЫРНУЛО ИЗ БЕЗДНЫ!","purple"),this.player.state.health-=15,this.hud.showDamage(),this.hud.updateHealth(this.player.state.health,this.player.state.maxHealth),this.player.isDead()&&this.gameOver()}exitVoidMode(t){this.isInVoid=!1,this.player.isInVoid=!1,this.hud.hideVoidMode(),this.voidPortalActive=!1,this.voidPortalTimer=this.VOID_PORTAL_COOLDOWN+3,this.voidCoins=[],this.audio.exitVoidAudio();for(const e of this.targetManager.targets)this.voidEnemyIds.includes(e.id)&&(e.active=!1);this.voidEnemyIds=[];for(const e of this.targetManager.targets)this.savedEnemyIds.includes(e.id)&&(e.active=!0,e.removeTimer=0);this.savedEnemyIds=[],this.targetManager.waveActive=this.savedWaveActive,this.player.state.position={...this.savedPosition},this.player.state.yaw=this.savedYaw,this.player.state.velocity=b(0,0,0),this.player.state.grounded=!0,this.screenShake=.5,t?(this.hud.showVoidExit(!0),this.state.frags+=500,this.hud.showMessage("+500 БОНУС ЗА ВОЙД!","cyan")):(this.hud.showVoidExit(!1),this.player.takeDamage(50))}checkAttachedRunners(){for(const t of this.targetManager.targets)t.enemyType==="runner"&&t.isAttached&&t.attachTimer<=0&&t.active===!1&&(this.player.takeDamage(t.damage),this.audio.playSFX("runner_hit"),this.screenShake=.6,this.hud.showDamage("green"),this.hud.showMessage("⚠️ РАННЕР УКУСИЛ!","orange"))}updateEnemyProximitySounds(t){if(!this.isInVoid)for(const e of this.targetManager.targets){if(!e.active)continue;const i=e.position.x-t.x,a=e.position.y-t.y,o=e.position.z-t.z,s=Math.sqrt(i*i+a*a+o*o);this.audio.playEnemyProximitySound(e.enemyType,s)}}detachRunners(){let t=!1;for(const e of this.targetManager.targets)e.enemyType==="runner"&&e.isAttached&&(e.detachRunner(),t=!0);t&&this.hud.showMessage("✓ РАННЕР СБРОШЕН!","cyan")}onPickup(t){t==="health"?(this.player.state.health=Math.min(this.player.state.maxHealth,this.player.state.health+20),this.audio.playSFX("jump"),this.hud.showMessage("+20 HP","lime"),this.hud.updateHealth(this.player.state.health,this.player.state.maxHealth)):t==="health_big"?(this.player.state.health=Math.min(this.player.state.maxHealth,this.player.state.health+60),this.audio.playSFX("jump"),this.hud.showMessage("+60 HP!","lime"),this.hud.updateHealth(this.player.state.health,this.player.state.maxHealth)):t==="stimpack"?(this.player.activateStimpack(),this.audio.playSFX("kill"),this.hud.showMessage("🔥 БУЙСТВО! 🔥","red"),this.hud.showRageOverlay(8)):t==="charge"&&(this.weapon.chargeKatana(),this.audio.playSFX("charge_pickup"),this.hud.showMessage("⚡ КАТАНА ЗАРЯЖЕНА! (ПКМ x3) ⚡","cyan"),this.hud.updateSplashCharges(3),this.screenShake=.5)}checkNormalAttack(){const t=this.player.getEyePosition(),[e,i]=this.getKatanaTargetData(),a=e>0?1:0;if(this.weapon.attackType=a,this.targetManager.trySlice(t,this.player.state.yaw,this.weapon.attackRange,this.weapon.attackAngle,this.player.state.grounded,a)&&(this.lastSliceTime=this.gameTime,this.weaponRenderer.showHitEffect(),this.audio.playSFX("kill"),this.screenShake=.4),this.targetManager.wave===10&&this.targetManager.trySliceCrystal(t,this.player.state.yaw,this.weapon.attackRange)){this.weaponRenderer.showHitEffect(),this.audio.playSFX("kill");const l=this.targetManager.powerCrystals.filter(r=>r.active).length;l===0?(this.hud.showMessage("💀 КРИСТАЛЛЫ УНИЧТОЖЕНЫ! БОСС ОСЛАБЛЕН! 💀","purple"),this.screenShake=2):this.hud.showMessage(`🔮 КРИСТАЛЛ РАЗБИТ! (${l}/6)`,"cyan")}const s=this.checkAltarHit(t);if(s!==null)if(this.bloodCoins>=this.GRENADE_COST)this.bloodCoins-=this.GRENADE_COST,this.grenadeCount+=1,this.altars[s].score+=this.GRENADE_COST,this.audio.playSFX("kill"),this.hud.showMessage(`💣 +1 ГРАНАТА! (🩸${this.bloodCoins})`,"purple"),this.screenShake=.3;else if(this.carryingScore>0){const n=this.carryingScore*this.DARTS_PER_POINT;this.darts+=n,this.altars[s].score+=this.carryingScore,this.audio.playSFX("kill"),this.hud.showMessage(`🎯 +${n} ДРОТИКОВ!`,"cyan"),this.carryingScore=0,this.screenShake=.3}else this.hud.showMessage(`НУЖНЫ ОЧКИ ИЛИ 🩸${this.GRENADE_COST} МОНЕТ!`,"purple")}spawnBloodCoins(){this.voidCoins=[];const t={x:this.portalPos.x,z:this.portalPos.z},e=Math.sqrt(t.x**2+t.z**2);e>0&&(t.x/=e,t.z/=e);const i=e-6-12;for(let o=0;o<8;o++){const s=14+o*(i/7),n=Math.sin(o*73.1)*2,l=Math.cos(o*47.3)*2,r=Math.sin(o*91.7)*.8-.3+2,c=t.x*s+n,h=t.z*s+l;this.voidCoins.push({position:{x:c,y:r,z:h},active:!0,phase:Math.random()*Math.PI*2})}const a=[{x:8,z:8},{x:-8,z:8},{x:8,z:-8},{x:-8,z:-8}];for(const o of a)this.voidCoins.push({position:{x:o.x,y:2,z:o.z},active:!0,phase:Math.random()*Math.PI*2})}updateBloodCoins(t){if(!this.isInVoid)return;const e=this.player.state.position;for(const i of this.voidCoins){if(!i.active)continue;i.position.y=1.5+Math.sin(this.gameTime*3+i.phase)*.3;const a=i.position.x-e.x,o=i.position.y-e.y,s=i.position.z-e.z;Math.sqrt(a*a+o*o+s*s)<2&&(i.active=!1,this.bloodCoins++,this.audio.playSFX("kill"),this.hud.showMessage(`🩸 +1 МОНЕТА КРОВИ (${this.bloodCoins})`,"purple"))}}updateVoidPortal(t){if(!(this.isInVoid||this.isPaused))if(this.voidPortalActive){this.voidPortalLifetime-=t;const e=this.player.state.position;if(Math.sqrt(e.x**2+e.z**2)<2.5){this.enterVoid();return}this.voidPortalLifetime<=0&&(this.voidPortalActive=!1,this.voidPortalTimer=this.VOID_PORTAL_COOLDOWN,this.hud.showMessage("⚫ ПОРТАЛ ЗАКРЫЛСЯ","purple"))}else this.voidPortalTimer-=t,this.voidPortalTimer<=0?(this.voidPortalActive=!0,this.voidPortalLifetime=this.VOID_PORTAL_DURATION,this.audio.playSFX("kill"),this.hud.showMessage("🌀 ПОРТАЛ В ВОЙД ОТКРЫЛСЯ!","purple"),this.screenShake=.5):this.voidPortalTimer<=5&&Math.floor(this.voidPortalTimer)!==Math.floor(this.voidPortalTimer+t)&&this.hud.showMessage(`⚫ ПОРТАЛ ЧЕРЕЗ ${Math.ceil(this.voidPortalTimer)}...`,"purple")}enterVoid(){this.isInVoid=!0,this.player.isInVoid=!0,this.voidPortalActive=!1,this.voidEnemyIds=[],this.voidFallOffset=0,this.voidVariant=Math.floor(Math.random()*4),this.savedPosition={...this.player.state.position},this.savedYaw=this.player.state.yaw;const t=["БАГРОВЫЙ","ИЗУМРУДНЫЙ","ЗОЛОТОЙ","ЛЕДЯНОЙ"];this.hud.showMessage(`🌀 ${t[this.voidVariant]} ВОЙД!`,"purple"),this.audio.playSFX("kill"),this.screenShake=1,this.audio.enterVoidAudio(),this.player.state.position={x:0,y:2,z:0},this.player.state.velocity={x:0,y:0,z:0},this.player.state.grounded=!0;const e=Math.random()*Math.PI*2;this.portalPos={x:Math.cos(e)*40,y:2,z:Math.sin(e)*40},this.spawnBloodCoins(),this.voidSpawnTimer=2}fireDart(){if(this.darts<=0)return;this.darts--,this.audio.playSFX("jump");const t=this.player.getEyePosition(),e=this.player.state.yaw,i=this.player.state.pitch,a=Math.sin(e)*Math.cos(i),o=Math.sin(i),s=-Math.cos(e)*Math.cos(i),n=.03,l=(Math.random()-.5)*n,r=(Math.random()-.5)*n,c=(Math.random()-.5)*n,h=60;this.flyingDarts.push({position:{x:t.x+a*.5,y:t.y-.2,z:t.z+s*.5},velocity:{x:(a+l)*h,y:(o+r)*h,z:(s+c)*h},active:!0})}updateDarts(t){for(const e of this.flyingDarts)if(e.active){e.position.x+=e.velocity.x*t,e.position.y+=e.velocity.y*t,e.position.z+=e.velocity.z*t,e.velocity.y-=15*t;for(const i of this.targetManager.targets){if(!i.active)continue;const a=e.position.x-i.position.x,o=e.position.y-i.position.y,s=e.position.z-i.position.z,n=Math.sqrt(a*a+o*o+s*s);if(n<i.radius+.5){e.active=!1;const l=i.takeDamage(this.DART_DAMAGE);if(this.audio.playSFX("kill"),this.hud.showHitmarker(!1),l||i.hp<=0){const r={x:a/(n||1),y:0,z:s/(n||1)};i.slice(r),this.targetManager.onTargetDestroyed?.(i)}break}}(e.position.y<-5||Math.abs(e.position.x)>50||Math.abs(e.position.z)>50)&&(e.active=!1)}this.flyingDarts=this.flyingDarts.filter(e=>e.active)}throwGrenade(){if(this.grenadeCount<=0)return;this.grenadeCount--,this.audio.playSFX("jump");const t=this.player.getEyePosition(),e=this.player.state.yaw,i=this.player.state.pitch,a=Math.sin(e)*Math.cos(i),o=Math.sin(i),s=-Math.cos(e)*Math.cos(i);this.grenades.push({position:{x:t.x+a*1,y:t.y,z:t.z+s*1},velocity:{x:a*this.GRENADE_SPEED,y:o*this.GRENADE_SPEED+5,z:s*this.GRENADE_SPEED},active:!0,lifetime:this.GRENADE_FUSE}),this.hud.showMessage(`💣 ГРАНАТА! (осталось: ${this.grenadeCount})`,"purple")}updateGrenades(t){for(const e of this.grenades)e.active&&(e.position.x+=e.velocity.x*t,e.position.y+=e.velocity.y*t,e.position.z+=e.velocity.z*t,e.velocity.y-=this.GRENADE_GRAVITY*t,e.position.y<.5&&(e.position.y=.5,e.velocity.y=-e.velocity.y*.5,e.velocity.x*=.8,e.velocity.z*=.8),e.lifetime-=t,e.lifetime<=0&&(this.explodeGrenade(e.position),e.active=!1));this.grenades=this.grenades.filter(e=>e.active)}explodeGrenade(t){this.explosions.push({position:{...t},progress:0,active:!0}),this.audio.playSFX("explosion"),this.screenShake=3;for(const a of this.targetManager.targets){if(!a.active)continue;const o=t.x-a.position.x,s=t.y-a.position.y,n=t.z-a.position.z,l=Math.sqrt(o*o+s*s+n*n);if(l<this.EXPLOSION_RADIUS){const r=1-l/this.EXPLOSION_RADIUS,c=this.EXPLOSION_DAMAGE*r,h=a.takeDamage(c);if(this.hud.showHitmarker(!1),h||a.hp<=0){const p={x:o/(l||1),y:0,z:n/(l||1)};a.slice(p),this.targetManager.onTargetDestroyed?.(a)}}}const e=this.player.state.position;if(Math.sqrt((t.x-e.x)**2+(t.y-e.y)**2+(t.z-e.z)**2)<this.EXPLOSION_RADIUS){const a=Math.random()*Math.PI*2,o=Math.random()*this.EXPLOSION_RADIUS,s=t.x+Math.cos(a)*o,n=t.z+Math.sin(a)*o;this.player.state.position.x=s,this.player.state.position.z=n;const l=10;this.player.state.health-=l,this.hud.showDamage(),this.hud.updateHealth(this.player.state.health,this.player.state.maxHealth),this.hud.showMessage("⚡ GLITCH TELEPORT!","cyan"),this.screenShake=1.5,this.player.isDead()&&this.gameOver()}}updateExplosions(t){for(const e of this.explosions)e.active&&(e.progress+=t/this.EXPLOSION_DURATION,e.progress>=1&&(e.active=!1));this.explosions=this.explosions.filter(e=>e.active)}checkAltarHit(t){const e=this.weapon.attackRange+1.5;for(let i=0;i<this.altars.length;i++){const a=this.altars[i],o=t.x-a.position.x,s=t.z-a.position.z;if(Math.sqrt(o*o+s*s)<e){const l=a.position.x-t.x,r=a.position.z-t.z,c=Math.sqrt(l*l+r*r);if(c>.1){const h=Math.sin(this.player.state.yaw),p=-Math.cos(this.player.state.yaw);if(l/c*h+r/c*p>.5)return i}}}return null}checkSplashAttack(){const t=this.player.getEyePosition(),e=this.targetManager.trySplashWave(t,this.player.state.yaw,this.weapon.splashRadius);e>0&&(this.lastSliceTime=this.gameTime,this.weaponRenderer.showSplashWave(this.player.state.yaw),this.screenShake=.4,this.audio.playSFX("kill"),this.hud.showMessage(`🌊 ВОЛНА x${e}! 🌊`,"cyan")),this.hud.updateSplashCharges(this.weapon.splashCharges)}spawnDeathEffect(t){let e=this.deathEffects.find(i=>!i.active);!e&&this.deathEffects.length<8&&(e={position:{x:0,y:0,z:0},progress:0,active:!1},this.deathEffects.push(e)),e&&(e.position={...t},e.progress=.01,e.active=!0)}updateDeathEffects(t){for(const e of this.deathEffects)e.active&&(e.progress+=t/this.DEATH_EFFECT_DURATION,e.progress>=1&&(e.active=!1))}getKatanaTargetData(){const t=this.player.getEyePosition(),e=this.player.state.yaw;let i=-1,a=100;const o=5,s=Math.PI/2;for(const n of this.targetManager.targets){if(!n.active)continue;const l=n.position.x-t.x,r=n.position.z-t.z,c=Math.sqrt(l*l+r*r);if(c>o)continue;let p=Math.atan2(l,-r)-e;for(;p>Math.PI;)p-=Math.PI*2;for(;p<-Math.PI;)p+=Math.PI*2;Math.abs(p)>s||c<a&&(a=c,i=p)}return[i,a]}getFragmentCount(){let t=0;for(const e of this.targetManager.targets)t+=e.fragments.length;return t}getDeathEffectsData(){const t=new Float32Array(32);for(let e=0;e<Math.min(this.deathEffects.length,8);e++){const i=this.deathEffects[e];i.active&&(t[e*4+0]=i.position.x,t[e*4+1]=i.position.y,t[e*4+2]=i.position.z,t[e*4+3]=i.progress)}return t}activateComboAdrenaline(){this.killTimes=[],this.player.activateStimpack(),this.audio.playSFX("kill"),this.hud.showMessage("🔥🔥🔥 КОМБО АДРЕНАЛИН! 🔥🔥🔥","red"),this.hud.showRageOverlay(8),this.screenShake=.5}render(){const t=this.targetManager.getShaderData(),e=this.targetManager.targets.length,i=this.targetManager.getPoolsShaderData(),a=this.targetManager.toxicPools.length,o=this.pickupManager.getShaderData(),s=this.pickupManager.pickups.length;let n=this.player.state.yaw,l=this.player.state.pitch;this.screenShake>0&&(n+=(Math.random()-.5)*this.screenShake*.1,l+=(Math.random()-.5)*this.screenShake*.1);const r=Math.max(0,.3-(this.gameTime-this.lastSliceTime))*3,c=this.targetManager.getCrystalsData(),h=this.targetManager.getAcidProjectilesData(),p=this.targetManager.acidProjectiles.length,f=this.targetManager.getSpikesData(),u=this.targetManager.getSpikeTargetsData(),m=Math.min(this.targetManager.spikes.length,8),d=this.targetManager.getAcidRainZonesData(),v=this.targetManager.acidRainZones.length,y=new Float32Array(8);for(let x=0;x<this.altars.length;x++)y[x*4+0]=this.altars[x].position.x,y[x*4+1]=this.altars[x].position.y,y[x*4+2]=this.altars[x].position.z,y[x*4+3]=this.altars[x].score;const T=new Float32Array(64),w=new Float32Array(64),A=Math.min(this.flyingDarts.length,16);for(let x=0;x<A;x++){const M=this.flyingDarts[x];T[x*4+0]=M.position.x,T[x*4+1]=M.position.y,T[x*4+2]=M.position.z,T[x*4+3]=M.active?1:0;const P=Math.sqrt(M.velocity.x**2+M.velocity.y**2+M.velocity.z**2);w[x*4+0]=M.velocity.x/(P||1),w[x*4+1]=M.velocity.y/(P||1),w[x*4+2]=M.velocity.z/(P||1),w[x*4+3]=P}const C=this.getGrenadesData(),S=this.grenades.filter(x=>x.active).length,R=this.getExplosionsData(),z=this.explosions.filter(x=>x.active).length;this.renderer.render(this.gameTime,this.player.getEyePosition(),n,l,t,e,r,i,a,this.currentEra,this.targetManager.wave,o,s,c,h,p,f,u,m,d,v,this.targetManager.greenBossPhase2,this.isInVoid,0,this.voidFallOffset,this.isInVoid?this.portalPos:void 0,y,T,w,A,this.voidPortalActive?this.voidPortalLifetime:0,this.getBloodCoinsData(),this.voidCoins.filter(x=>x.active).length,C,S,R,z,this.voidVariant,this.weaponRenderer.attackProgress,this.weapon.state.bobPhase,this.weaponRenderer.splashCharges,...this.getKatanaTargetData(),this.weapon.attackType,this.getDeathEffectsData(),this.targetManager.getAllFragmentsData(),Math.min(this.getFragmentCount(),32)),this.weaponRenderer.setSceneLighting(this.currentEra),this.weaponRenderer.render(this.weapon.state,this.gameTime)}getBloodCoinsData(){const t=new Float32Array(48),e=this.voidCoins.filter(i=>i.active);for(let i=0;i<Math.min(e.length,12);i++){const a=e[i];t[i*4+0]=a.position.x,t[i*4+1]=a.position.y,t[i*4+2]=a.position.z,t[i*4+3]=1}return t}getGrenadesData(){const t=new Float32Array(32),e=this.grenades.filter(i=>i.active);for(let i=0;i<Math.min(e.length,8);i++){const a=e[i];t[i*4+0]=a.position.x,t[i*4+1]=a.position.y,t[i*4+2]=a.position.z,t[i*4+3]=a.lifetime}return t}getExplosionsData(){const t=new Float32Array(32),e=this.explosions.filter(i=>i.active);for(let i=0;i<Math.min(e.length,8);i++){const a=e[i];t[i*4+0]=a.position.x,t[i*4+1]=a.position.y,t[i*4+2]=a.position.z,t[i*4+3]=a.progress}return t}handleResize(){const t=window.devicePixelRatio||1;this.weaponCanvas.width=window.innerWidth*t,this.weaponCanvas.height=window.innerHeight*t,this.weaponCanvas.style.width=window.innerWidth+"px",this.weaponCanvas.style.height=window.innerHeight+"px",this.weaponRenderer.resize(this.weaponCanvas.width,this.weaponCanvas.height)}toggleFullscreen(){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}destroy(){this.stop(),this.input.destroy(),this.audio.stop(),this.renderer.destroy()}}function j(){const k=document.getElementById("game-canvas"),t=document.getElementById("weapon-canvas");if(!k||!t){console.error("Canvas элементы не найдены!");return}const e=new Tt(k,t);window.game=e,console.log("🎮 Dungeon Synth Shooter загружен"),console.log("📖 Управление: WASD, SHIFT (бег), SPACE (прыжок), LMB (стрельба), R (перезарядка)"),console.log("🔊 M - mute, F - fullscreen")}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",j):j();
//# sourceMappingURL=index-B188PjKO.js.map
