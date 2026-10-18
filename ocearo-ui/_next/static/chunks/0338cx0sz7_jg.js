(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,43758,e=>{"use strict";var t=e.i(43476),r=e.i(71645),i=e.i(90072),a=e.i(90874),n=e.i(92923),o=n,s=e.i(30728);class l extends s.LineSegmentsGeometry{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,r=new Float32Array(2*t);for(let i=0;i<t;i+=3)r[2*i]=e[i],r[2*i+1]=e[i+1],r[2*i+2]=e[i+2],r[2*i+3]=e[i+3],r[2*i+4]=e[i+4],r[2*i+5]=e[i+5];return super.setPositions(r),this}setColors(e){let t=e.length-3,r=new Float32Array(2*t);for(let i=0;i<t;i+=3)r[2*i]=e[i],r[2*i+1]=e[i+1],r[2*i+2]=e[i+2],r[2*i+3]=e[i+3],r[2*i+4]=e[i+4],r[2*i+5]=e[i+5];return super.setColors(r),this}setFromPoints(e){let t=e.length-1,r=new Float32Array(6*t);for(let i=0;i<t;i++)r[6*i]=e[i].x,r[6*i+1]=e[i].y,r[6*i+2]=e[i].z||0,r[6*i+3]=e[i+1].x,r[6*i+4]=e[i+1].y,r[6*i+5]=e[i+1].z||0;return super.setPositions(r),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}var c=e.i(27530);class u extends o.LineSegments2{constructor(e=new l,t=new c.LineMaterial({color:0xffffff*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let d=e=>e instanceof i.Vector3||e instanceof i.Vector4?[e.x,e.y,e.z]:e instanceof i.Vector2?[e.x,e.y,0]:Array.isArray(e)?2===e.length?[e[0],e[1],0]:[e[0],e[1],e[2]]:[e,0,0],f=e=>e instanceof i.Color?e.toArray():e,h=(0,r.forwardRef)(function({points:e,color:i=0xffffff,vertexColors:o,linewidth:h,lineWidth:p,segments:m,dashed:v,...y},g){let x=(0,a.useThree)(e=>e.size),w=(0,r.useMemo)(()=>m?new n.LineSegments2:new u,[m]),[b]=(0,r.useState)(()=>new c.LineMaterial),S=o?.[0]?.length===4?4:3,M=e.flatMap(d),E=M.join(","),A=o?o.flatMap(f):null,_=A?A.join(","):"",F=(0,r.useMemo)(()=>{let e=m?new s.LineSegmentsGeometry:new l;return e.setPositions(M),A&&e.setColors(A,S),e},[E,_,m,S]);return(0,r.useLayoutEffect)(()=>{w.computeLineDistances()},[F,w]),(0,r.useLayoutEffect)(()=>{v?b.defines.USE_DASH="":delete b.defines.USE_DASH,b.needsUpdate=!0},[v,b]),(0,r.useEffect)(()=>()=>F.dispose(),[F]),(0,r.useEffect)(()=>()=>b.dispose(),[b]),(0,t.jsxs)("primitive",{object:w,ref:g,...y,children:[(0,t.jsx)("primitive",{object:F,attach:"geometry"}),(0,t.jsx)("primitive",{object:b,attach:"material",color:o?0xffffff:i,vertexColors:!!o,resolution:[x.width,x.height],linewidth:h??p??1,dashed:v,transparent:4===S,...y})]})});e.s(["default",0,h],43758)},78461,e=>{"use strict";var t=e.i(71645),r=e.i(85709),i=e.i(67561);let a=["navigation.headingTrue","navigation.headingMagnetic","navigation.courseOverGroundTrue","navigation.courseOverGroundMagnetic","navigation.position"],n=null;e.s(["default",0,()=>{let{convertLatLonToXY:e}=(0,i.useOcearoContext)(),o=(0,r.useSignalKPaths)(a),s=o["navigation.headingTrue"]??o["navigation.headingMagnetic"]??o["navigation.courseOverGroundTrue"]??o["navigation.courseOverGroundMagnetic"],l=Number.isFinite(s),c=o["navigation.position"],u=Number.isFinite(c?.latitude)&&Number.isFinite(c?.longitude);return{heading:l?s:0,offset:(0,t.useMemo)(()=>{if(!u)return{x:0,y:0};let t={lat:c.latitude,lon:c.longitude};return e(t,(n||(n=t),n))},[c,u,e]),hasFix:u,hasHeading:l}},"getSessionOrigin",0,()=>n])},30997,e=>{"use strict";var t=e.i(71645);e.s(["default",0,e=>{(0,t.useEffect)(()=>{let t=()=>{let t=e.current;if(!t)return;let r=t.getBoundingClientRect(),i=[...document.querySelectorAll("[data-hud-solid]")].some(e=>{let t;return null!==e.offsetParent&&(t=e.getBoundingClientRect(),r.left<t.right&&r.right>t.left&&r.top<t.bottom&&r.bottom>t.top)});t.style.visibility=i?"hidden":"visible"};t();let r=setInterval(t,250);return()=>clearInterval(r)},[e])}])},93116,e=>{"use strict";var t=e.i(43476),r=e.i(71645),i=e.i(95393),a=e.i(90072);let n=`
    attribute vec3 aBase;
    attribute vec2 aDir;
    attribute vec3 aColor;
    attribute vec2 aLenSpeed;
    attribute float aSeed;
    uniform vec3 uCam;
    uniform float uTime;
    uniform float uWidth;
    uniform float uTravel;
    uniform float uPace;
    uniform float uFadeNear;
    uniform float uStill;
    uniform float uScreen;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
        vec3 d = normalize(vec3(aDir, 0.0));
        // Still arrows stay put at full strength (a chart plotter's current arrows)
        float phase = uStill > 0.5 ? 0.5 : fract(uTime * aLenSpeed.y * uPace / max(uTravel, 1e-3) + aSeed);
        vec3 base = aBase + d * (phase - 0.5) * uTravel;
        // Turn the arrow about its axis towards the camera
        vec3 toCam = normalize(uCam - base);
        vec3 side = cross(toCam, d);
        side = length(side) < 1e-3 ? vec3(-d.y, d.x, 0.0) : normalize(side);
        // Screen-sized: lengths and width are shares of the distance to the
        // camera, so a far arrow reads as well as a near one
        float k = uScreen > 0.0 ? length(uCam - aBase) * uScreen : 1.0;
        vec3 p = base + side * position.x * uWidth * k + d * position.y * aLenSpeed.x * k;
        vColor = aColor;
        // Faded close to the camera, where an arrow would fill the view
        vAlpha = (uStill > 0.5 ? 1.0 : pow(sin(3.14159 * phase), 0.6)) * smoothstep(uFadeNear * 0.5, uFadeNear, length(uCam - base));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
`,o=`
    uniform float uOpacity;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
        gl_FragColor = vec4(vColor, vAlpha * uOpacity);
        #include <colorspace_fragment>
    }
`;e.s(["default",0,({items:e,width:s,travel:l=0,pace:c=0,opacity:u=.9,fadeNear:d=0,still:f=!1,screen:h=0,renderOrder:p=3})=>{let{geometry:m,material:v}=(0,r.useMemo)(()=>{let e,t=((e=new a.Shape).moveTo(-.16,-.5),e.lineTo(.16,-.5),e.lineTo(.16,.08),e.lineTo(.5,.08),e.lineTo(0,.5),e.lineTo(-.5,.08),e.lineTo(-.16,.08),e.closePath(),new a.ShapeGeometry(e)),r=new a.InstancedBufferGeometry;r.index=t.index,r.setAttribute("position",t.attributes.position),r.setAttribute("aBase",new a.InstancedBufferAttribute(new Float32Array(1200),3)),r.setAttribute("aDir",new a.InstancedBufferAttribute(new Float32Array(800),2)),r.setAttribute("aColor",new a.InstancedBufferAttribute(new Float32Array(1200),3)),r.setAttribute("aLenSpeed",new a.InstancedBufferAttribute(new Float32Array(800),2));let i=new Float32Array(400);for(let e=0;e<400;e++)i[e]=.618034*e%1;return r.setAttribute("aSeed",new a.InstancedBufferAttribute(i,1)),r.instanceCount=0,{geometry:r,material:new a.ShaderMaterial({uniforms:{uCam:{value:new a.Vector3},uTime:{value:0},uWidth:{value:1},uTravel:{value:1},uPace:{value:1},uOpacity:{value:u},uFadeNear:{value:0},uStill:{value:0},uScreen:{value:0}},vertexShader:n,fragmentShader:o,transparent:!0,depthWrite:!1,side:a.DoubleSide})}},[]);(0,r.useEffect)(()=>()=>{m.dispose(),v.dispose()},[m,v]),(0,r.useEffect)(()=>{let t=Math.min(e.length,400),r=m.attributes;for(let i=0;i<t;i++){let t=e[i];r.aBase.array.set([t.x,t.y,t.z],3*i),r.aDir.array.set([t.u,t.v],2*i),r.aColor.array.set(t.color,3*i),r.aLenSpeed.array.set([t.len,t.speed],2*i)}["aBase","aDir","aColor","aLenSpeed"].forEach(e=>{r[e].needsUpdate=!0}),m.instanceCount=t},[m,e]),(0,r.useEffect)(()=>{let e=v.uniforms;e.uWidth.value=s,e.uTravel.value=l,e.uPace.value=c,e.uOpacity.value=u,e.uFadeNear.value=d,e.uStill.value=+!!f,e.uScreen.value=h},[v,s,l,c,u,d,f,h]);let y=(0,r.useRef)(),g=(0,r.useMemo)(()=>new a.Vector3,[]);return(0,i.useFrame)(({camera:e,clock:t})=>{y.current&&(y.current.updateWorldMatrix(!0,!1),v.uniforms.uCam.value.copy(y.current.worldToLocal(g.copy(e.position))),v.uniforms.uTime.value=t.elapsedTime)}),(0,t.jsx)("mesh",{ref:y,geometry:m,material:v,frustumCulled:!1,renderOrder:p})}])},78311,e=>{"use strict";var t=e.i(43476),r=e.i(71645),i=e.i(60099);e.i(85269);var a=e.i(22831),n=e.i(93116),o=e.i(30997);let s=[.86,.22,.2],l=[.16,.48,.86],c=({children:e})=>{let i=(0,r.useRef)(null);return(0,o.default)(i),(0,t.jsx)("div",{ref:i,children:e})};e.s(["default",0,({items:e,width:o,screen:u=0,fadeNear:d=0,format:f=e=>e.toFixed(1),slackLabel:h="slack",maxLabels:p=12,renderOrder:m=3})=>{let{t:v}=(0,a.useTranslation)(),{borders:y,fills:g}=(0,r.useMemo)(()=>{let t=e.filter(e=>e.speed>=.051444457477040344);return{borders:t.map(e=>({...e,len:e.len+.5*o,color:e.trend>.05?s:e.trend<-.05?l:[.06,.09,.12]})),fills:t}},[e,o]);return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.default,{items:y,width:1.35*o,screen:u,still:!0,fadeNear:d,opacity:.95,renderOrder:m}),(0,t.jsx)(n.default,{items:g,width:o,screen:u,still:!0,fadeNear:d,opacity:.95,renderOrder:m+1}),e.slice(0,p).map(e=>{let r=e.speed<.051444457477040344;return(0,t.jsx)(i.Html,{position:[e.x,e.y,e.z],center:!0,zIndexRange:[4,0],style:{pointerEvents:"none"},children:(0,t.jsx)(c,{children:r?(0,t.jsx)("div",{className:"rounded-md border-2 border-oBlue bg-hud-bg/80 px-1.5 text-caption font-semibold uppercase tracking-wide text-hud-main whitespace-nowrap",children:v(`meteo.${h}`)}):(0,t.jsx)("div",{className:"rounded px-1 text-caption font-bold tabular-nums leading-tight whitespace-nowrap",style:{color:"#fff",background:"rgba(10, 16, 22, 0.72)"},children:f(1.943844*e.speed)})})},e.key)})]})}])},54983,e=>{"use strict";var t=e.i(90072);let r={thermal:.28,magma:.3,dense:.15,deep:0,haline:.1,turbo:.08},i=e=>[parseInt(e.slice(1,3),16),parseInt(e.slice(3,5),16),parseInt(e.slice(5,7),16)],a=Object.fromEntries(Object.entries({speed:["#fffdcd","#f4eaab","#e9d889","#dbc866","#c9ba45","#b2af28","#98a512","#7c9c06","#5f920c","#448818","#287c23","#126e2a","#0b602d","#11512c","#174127","#19321e","#172313"],thermal:["#042333","#082e54","#19337c","#39339e","#563b9c","#6d4694","#83508f","#995889","#b15f82","#c76676","#de7065","#ef7e52","#f99242","#fcaa3c","#f9c441","#f3df4c","#e8fa5b"],haline:["#2a186c","#2e1d93","#2034a2","#0f4a98","#0f5b90","#1c6a8c","#297789","#338588","#3c9387","#44a184","#4faf7e","#5fbe75","#78cb68","#9bd55c","#c1dd64","#e1e57c","#fdef9a"],deep:["#fdfecc","#ddf2ba","#bbe6ac","#98daa4","#78cea3","#62bfa4","#55aea3","#4e9ea1","#488e9e","#437f9a","#3f6f97","#3e5f93","#404d8c","#413e76","#3b325c","#322643","#281a2c"],ice:["#040613","#13132a","#212041","#2e2c5a","#383975","#3e478f","#3f57a3","#3e69b0","#427bb7","#4b8bbd","#579cc3","#67adc9","#79bed0","#92ced7","#afdde1","#cdecef","#eafdfd"],dense:["#e6f1f1","#cbe4e8","#b1d6e3","#9ac8e2","#86b9e3","#79a9e4","#7397e4","#7584df","#7871d5","#7960c7","#784eb3","#753d9d","#6f2e85","#66216c","#5a1851","#491238","#360e24"],magma:["#000004","#0a0822","#1d1147","#36106b","#51127c","#6a1c81","#832681","#9c2e7f","#b73779","#cf4070","#e55064","#f4695c","#fb8761","#fea571","#fec287","#fde0a1","#fcfdbf"],viridis:["#440154","#48186a","#472d7b","#424086","#3b528b","#33638d","#2c728e","#26828e","#21918c","#1f9f88","#27ad81","#3dbc74","#5cc863","#81d34d","#aadc32","#d5e21a","#fde725"],turbo:["#30123b","#4040a2","#466be3","#4294ff","#28bceb","#18ddc2","#32f298","#6dfe62","#a4fc3c","#cbed34","#ecd13a","#fdae35","#fb8122","#ec530f","#d23105","#ac1701","#7a0403"]}).map(([e,t])=>[e,t.map(i)])),n=(e,t)=>{let r=a[e]||a.speed,i=Math.min(1,Math.max(0,Number.isFinite(t)?t:0))*(r.length-1),n=Math.min(r.length-2,Math.floor(i)),o=i-n;return r[n].map((e,t)=>e+(r[n+1][t]-e)*o)};e.s(["colorAt",0,n,"colorMapTexture",0,e=>{let i=new Uint8Array(1024),a=r[e]||0;for(let t=0;t<256;t++){let[r,o,s]=n(e,a+(1-a)*t/255);i.set([Math.round(r),Math.round(o),Math.round(s),255],4*t)}let o=new t.DataTexture(i,256,1,t.RGBAFormat);return o.magFilter=t.LinearFilter,o.minFilter=t.LinearFilter,o.colorSpace=t.SRGBColorSpace,o.needsUpdate=!0,o},"cssGradient",0,e=>{let t=r[e]||0,i=Array.from({length:9},(r,i)=>{let[a,o,s]=n(e,t+(1-t)*i/8);return`rgb(${Math.round(a)},${Math.round(o)},${Math.round(s)})`});return`linear-gradient(to right, ${i.join(", ")})`}])},33227,e=>{"use strict";var t=e.i(3950);let r={key:null,at:0,field:null},i=.5/1.943844,a=null,n=new Set,o=(e,t,r,i)=>({lat:e+(i/8*2-1)*12e3/6371e3*180/Math.PI,lon:t+(r/8*2-1)*12e3/(6371e3*Math.cos(e*Math.PI/180))*180/Math.PI}),s=(e,t)=>{let r=[],i=[];for(let a=0;a<9;a++)for(let n=0;n<9;n++){let s=o(e,t,n,a);r.push(s.lat.toFixed(4)),i.push(s.lon.toFixed(4))}return`https://marine-api.open-meteo.com/v1/marine?latitude=${r.join(",")}&longitude=${i.join(",")}&hourly=ocean_current_velocity,ocean_current_direction&forecast_hours=48&timezone=GMT`},l=async(e,i)=>{let a=`${e.toFixed(1)},${i.toFixed(1)}`;if(r.field&&r.key===a&&Date.now()-r.at<18e5)return r.field;let n=await (0,t.cachedFetch)(s(e,i),{kind:"forecast"});if(!n.ok)throw Error(`Open-Meteo marine ${n.status}`);let o=await n.json(),l=Array.isArray(o)?o:[o],c=l[0]?.hourly?.time||[],u=c.length,d=[],f=[];for(let e=0;e<u;e++){let t=new Float32Array(81),r=new Float32Array(81);l.forEach((i,a)=>{let n=(i.hourly.ocean_current_velocity[e]??0)/3.6,o=(i.hourly.ocean_current_direction[e]??0)*Math.PI/180;t[a]=n*Math.sin(o),r[a]=n*Math.cos(o)}),d.push(t),f.push(r)}let h=0;d.forEach((e,t)=>e.forEach((e,r)=>{h=Math.max(h,Math.hypot(e,f[t][r]))}));let p={origin:{lat:e,lon:i},start:Date.parse(`${c[0]}Z`),hours:u,grid:9,half:12e3,u:d,v:f,max:h,source:"open-meteo"};return r={key:a,at:Date.now(),field:p},p};e.s(["currentFieldUrl",0,s,"fetchCurrentField",0,l,"getCurrentScale",0,()=>a,"setCurrentScale",0,e=>{let t=1.943844*Math.max(i,e?.max||0);return a=e?Math.ceil(4*t)/4/1.943844:null,n.forEach(e=>e(a)),a},"subscribeCurrentScale",0,e=>(n.add(e),()=>n.delete(e)),"uniformCurrent",0,(e,t,r,i)=>{let a=new Float32Array(81).fill(r*Math.sin(i)),n=new Float32Array(81).fill(r*Math.cos(i));return{origin:{lat:e,lon:t},start:Date.now(),hours:1,grid:9,half:12e3,u:[a],v:[n],max:r,source:"boat"}}])},69435,e=>{"use strict";var t=e.i(71645),r=e.i(90072),i=e.i(3666);let a=40,n=`
    float hash13(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.zyx + 31.32);
        return fract((p.x + p.y) * p.z);
    }
    float vnoise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x),
                       mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
                   mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x),
                       mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y), f.z);
    }
    float fbm(vec3 p) {
        return 0.6 * vnoise(p) + 0.3 * vnoise(p * 2.03 + 17.0) + 0.1 * vnoise(p * 4.1 + 41.0);
    }
`,o=`
    uniform sampler2D uField;
    uniform float uFieldHalf;
    uniform float uFieldRange;
    vec2 flowAt(vec2 g) {
        vec2 t = g / (2.0 * uFieldHalf) + 0.5;
        return (texture2D(uField, t).rg - 0.5) * 2.0 * uFieldRange;
    }
    // 1 inside the field, fading to 0 over its outer tenth
    float fieldMask(vec2 g) {
        vec2 a = abs(g) / uFieldHalf;
        return 1.0 - smoothstep(0.85, 1.0, max(a.x, a.y));
    }
`;e.s(["FIELD_GLSL",0,o,"NOISE_GLSL",0,n,"useFieldTexture",0,(e,n,o=a)=>{let s=(0,t.useMemo)(()=>{let e=new r.DataTexture(new Uint8Array(16384),64,64,r.RGBAFormat);return e.magFilter=r.LinearFilter,e.minFilter=r.LinearFilter,e.wrapS=r.ClampToEdgeWrapping,e.wrapT=r.ClampToEdgeWrapping,e},[]);return(0,t.useEffect)(()=>{if(!e)return;let t=s.image.data,r=e.half??i.HALF_EXTENT_M;for(let a=0;a<64;a++)for(let s=0;s<64;s++){let l=(0,i.sampleWind)(e,(s/63*2-1)*r,(a/63*2-1)*r,n),c=(64*a+s)*4;t[c]=Math.round(255*Math.min(1,Math.max(0,.5+l.u/(2*o)))),t[c+1]=Math.round(255*Math.min(1,Math.max(0,.5+l.v/(2*o)))),t[c+2]=0,t[c+3]=255}s.needsUpdate=!0},[s,e,n,o]),(0,t.useEffect)(()=>()=>s.dispose(),[s]),s}])},88608,e=>{"use strict";let t=0,r=new Set,i={},a=new Set;e.s(["getForecastHour",0,()=>t,"getSeries",0,()=>i,"setForecastHour",0,e=>{t=Math.max(0,e),r.forEach(e=>e(t))},"setSeries",0,(e,t)=>{i={...i,[e]:t},a.forEach(e=>e(i))},"subscribeForecast",0,e=>(r.add(e),()=>r.delete(e)),"subscribeSeries",0,e=>(a.add(e),()=>a.delete(e))])},18032,e=>{"use strict";e.s(["markerLattice",0,({cx:e,cy:t,radius:r,step:i,near:a,originE:n=0,originN:o=0,max:s=60})=>{let l=[],c=Math.ceil((n-r)/i),u=Math.floor((n+r)/i),d=Math.ceil((o-r)/i),f=Math.floor((o+r)/i);for(let s=c;s<=u;s++)for(let c=d;c<=f;c++){let u=s*i,d=c*i;if(Math.hypot(u-n,d-o)>r)continue;let f=Math.hypot(u-e,d-t),h=f<=a?0:Math.ceil(Math.log2(f/a)),p=2**h;s%p==0&&c%p==0&&l.push({e:u,n:d,d:f})}return l.sort((e,t)=>e.d-t.d).slice(0,s)},"sameMarkers",0,(e,t)=>e.length===t.length&&e.every((e,r)=>{let i=t[r];return e.key===i.key&&.005>Math.abs(e.speed-i.speed)&&Math.sign(Math.round(20*e.trend))===Math.sign(Math.round(20*i.trend))&&.001>Math.abs(e.len-i.len)&&e.x===i.x&&e.y===i.y})])},54735,e=>{"use strict";var t=e.i(71645),r=e.i(85709),i=e.i(33227),a=e.i(88608),n=e.i(3666),o=e.i(54983),s=e.i(18032),l=e.i(58567);let c=["navigation.position","environment.current"];e.s(["CURRENT_ARROW_WIDTH",0,.028,"DEFAULT_CURRENT_MAP",0,"thermal","currentMarkers",0,({field:e,hour:t,top:r,mapName:i,refE:a,refN:c,cx:u,cy:d,heightM:f,scale:h,radius:p,z:m,isWater:v=()=>!0})=>{let y=Math.min(400,Math.max(25,5*Math.round(.9*f/5))),g="pi"===(0,l.getRenderProfile)().id?20:40,x=(0,s.markerLattice)({cx:u,cy:d,radius:p,step:y,near:3*y,originE:a,originN:c,max:g}),w=[];return x.forEach(({e:s,n:l})=>{if(15>Math.hypot(s-a,l-c))return;let u=(s-a)*h,d=(l-c)*h;if(!v(u,d))return;let f=(0,n.sampleWind)(e,s,l,t),p=Math.hypot(f.u,f.v);if(p<.005)return;let y=(0,n.sampleWind)(e,s,l,t+1),g=Math.min(1,p/r),[x,b,S]=(0,o.colorAt)(i,.28+.72*g);w.push({key:`${s},${l}`,x:u,y:d,z:m,u:f.u,v:f.v,speed:p,trend:Math.hypot(y.u,y.v)-p,color:[x/255,b/255,S/255],len:.16*(.4+.6*g)})}),w},"useCurrentField",0,()=>{let e=(0,r.useSignalKPaths)(c),o=e["navigation.position"],s=e["environment.current"],l=(0,t.useSyncExternalStore)(a.subscribeForecast,a.getForecastHour,a.getForecastHour),[u,d]=(0,t.useState)(null),[f,h]=(0,t.useState)(1),p=o?.latitude,m=o?.longitude,v=Number.isFinite(p)?`${p.toFixed(1)},${m.toFixed(1)}`:null;(0,t.useEffect)(()=>{if(!v)return;let e=!1,[t,r]=v.split(",").map(Number);return(0,i.fetchCurrentField)(t,r).then(t=>{e||d(t)}).catch(()=>{!e&&Number.isFinite(s?.drift)&&Number.isFinite(s?.setTrue)&&d((0,i.uniformCurrent)(t,r,s.drift,s.setTrue))}),()=>{e=!0}},[v]),(0,t.useEffect)(()=>{h((0,i.setCurrentScale)(u)??1)},[u]),(0,t.useEffect)(()=>()=>(0,i.setCurrentScale)(null),[]);let y=Number.isFinite(p)?Math.round(100*p):null,g=Number.isFinite(m)?Math.round(100*m):null;return(0,t.useEffect)(()=>{if(!u||null===y)return;let e=(m-u.origin.lon)*Math.PI/180*6371e3*Math.cos(u.origin.lat*Math.PI/180),t=(p-u.origin.lat)*Math.PI/180*6371e3,r=Array.from({length:u.hours},(r,i)=>{let a=(0,n.sampleWind)(u,e,t,i);return Math.hypot(a.u,a.v)});return(0,a.setSeries)("current",{start:u.start,values:r,top:u.max}),()=>(0,a.setSeries)("current",null)},[u,y,g]),{field:u,hour:l,top:f,lat:p,lon:m}}])},3666,e=>{"use strict";var t=e.i(3950);let r={key:null,at:0,field:null},i=(e,t,r,i)=>({lat:e+(i/8*2-1)*4e4/6371e3*180/Math.PI,lon:t+(r/8*2-1)*4e4/(6371e3*Math.cos(e*Math.PI/180))*180/Math.PI}),a=(e,t)=>{let r=[],a=[];for(let n=0;n<9;n++)for(let o=0;o<9;o++){let s=i(e,t,o,n);r.push(s.lat.toFixed(4)),a.push(s.lon.toFixed(4))}return`https://api.open-meteo.com/v1/forecast?latitude=${r.join(",")}&longitude=${a.join(",")}&hourly=wind_speed_10m,wind_direction_10m&wind_speed_unit=ms&forecast_hours=48&timezone=GMT`},n=async(e,i)=>{let n=`${e.toFixed(1)},${i.toFixed(1)}`;if(r.field&&r.key===n&&Date.now()-r.at<18e5)return r.field;let o=a(e,i),s=await (0,t.cachedFetch)(o,{kind:"forecast"});if(!s.ok)throw Error(`Open-Meteo ${s.status}`);let l=await s.json(),c=Array.isArray(l)?l:[l],u=c[0]?.hourly?.time||[],d=u.length,f=[],h=[];for(let e=0;e<d;e++){let t=new Float32Array(81),r=new Float32Array(81);c.forEach((i,a)=>{let n=i.hourly.wind_speed_10m[e]??0,o=(i.hourly.wind_direction_10m[e]??0)*Math.PI/180;t[a]=-n*Math.sin(o),r[a]=-n*Math.cos(o)}),f.push(t),h.push(r)}let p={origin:{lat:e,lon:i},start:Date.parse(`${u[0]}Z`),hours:d,u:f,v:h,source:"open-meteo"};return r={key:n,at:Date.now(),field:p},p},o=[[0,[98,113,183]],[1,[57,97,159]],[3,[74,148,169]],[5,[77,141,123]],[7,[83,165,83]],[9,[53,159,53]],[11,[167,157,81]],[13,[159,127,58]],[15,[161,108,92]],[17,[129,58,78]],[19,[175,80,136]],[21,[117,74,147]],[24,[109,97,163]],[27,[68,105,141]],[29,[92,144,152]],[36,[125,68,165]]];e.s(["HALF_EXTENT_M",0,4e4,"WINDY_SCALE",0,o,"fetchWindField",0,n,"sampleWind",0,(e,t,r,i=0)=>{let a=e.grid??9,n=e.half??4e4,o=Math.min(a-1.001,Math.max(0,(t/n+1)/2*(a-1))),s=Math.min(a-1.001,Math.max(0,(r/n+1)/2*(a-1))),l=Math.floor(o),c=Math.floor(s),u=o-l,d=s-c,f=Math.min(e.hours-1,Math.max(0,Math.floor(i))),h=Math.min(e.hours-1,f+1),p=Math.min(1,Math.max(0,i-f)),m=(e,t)=>{let r=e[t],i=c*a+l;return(r[i]*(1-u)+r[i+1]*u)*(1-d)+(r[i+a]*(1-u)+r[i+a+1]*u)*d};return{u:m(e.u,f)*(1-p)+m(e.u,h)*p,v:m(e.v,f)*(1-p)+m(e.v,h)*p}},"uniformField",0,(e,t,r,i)=>{let a=new Float32Array(81).fill(-r*Math.sin(i)),n=new Float32Array(81).fill(-r*Math.cos(i));return{origin:{lat:e,lon:t},start:Date.now(),hours:1,u:[a],v:[n],source:"boat"}},"windColor",0,e=>{if(e<=o[0][0])return o[0][1];for(let t=1;t<o.length;t++)if(e<=o[t][0]){let[r,i]=o[t-1],[a,n]=o[t],s=(e-r)/(a-r);return i.map((e,t)=>e+(n[t]-e)*s)}return o[o.length-1][1]},"windFieldUrl",0,a])},83646,e=>{"use strict";var t=e.i(67561);e.s(["default",0,()=>(0,t.useOcearoContext)().tokens])},58567,e=>{"use strict";let t;var r=e.i(83402);let i=/v3d|videocore|llvmpipe|swiftshader/i,a=/android|iphone|ipad|ipod|mobile/i;e.s(["RENDER_QUALITIES",0,["auto","high","pi"],"getRenderProfile",0,()=>{let e=r.default.get("renderQuality")||"auto";return"pi"===e||"auto"===e&&(()=>{if("u"<typeof navigator)return!1;if(i.test((()=>{if(void 0!==t)return t;t="";try{let e=document.createElement("canvas").getContext("webgl"),r=e?.getExtension("WEBGL_debug_renderer_info");t=String(e?.getParameter(r?r.UNMASKED_RENDERER_WEBGL:e.RENDERER)||""),e?.getExtension("WEBGL_lose_context")?.loseContext()}catch{}return t})()))return!0;if(a.test(navigator.userAgent)||navigator.maxTouchPoints>1&&/Macintosh/.test(navigator.userAgent))return!1;if(/aarch64|armv7|armv8|arm64|raspbian|raspberry/i.test(navigator.userAgent))return!0;let e=navigator.hardwareConcurrency||8,r=navigator.deviceMemory||8;return e<=4&&r<=4})()?{id:"pi",fps:30,dpr:.75,antialias:!1}:{id:"high",fps:60,dpr:Math.min(window.devicePixelRatio||1,2.5),antialias:!0}}])},3950,e=>{"use strict";let t="ocearo-offline-v2",r=["ocearo-offline-v1"],i=!1,a=async(e,{kind:a="tile"}={})=>{if(!("u">typeof caches))return fetch(e,{referrerPolicy:"strict-origin-when-cross-origin"});i||(i=!0,r.forEach(e=>caches.delete(e).catch(()=>{})));let n=await caches.open(t);if("tile"===a){let t=await n.match(e);if(t)return t}try{let t=await fetch(e,{mode:"cors",referrerPolicy:"strict-origin-when-cross-origin"});if(t.ok)await n.put(e,t.clone());else{let t=await n.match(e);if(t)return t}return t}catch(r){let t=await n.match(e);if(t)return t;throw r}},n=async e=>{let t=await a(e,{kind:"tile"});if(!t.ok)throw Error(`${t.status} ${e}`);return createImageBitmap(await t.blob())},o=(e,t,r,i)=>{if(e.includes("{bbox}")){let a=40075016.68557849/2**t,n=-20037508.342789244+r*a,o=20037508.342789244-i*a,s=[n,o-a,n+a,o].map(e=>e.toFixed(2)).join(",");return e.replace("{bbox}",s)}return e.replace("{z}",t).replace("{x}",r).replace("{y}",i)},s=(e,t,r,i)=>{let a=2**i,n=(e,t)=>({x:Math.floor((t+180)/360*a),y:Math.floor((1-Math.log(Math.tan(e*Math.PI/180)+1/Math.cos(e*Math.PI/180))/Math.PI)/2*a)}),o=r/111320,s=r/(111320*Math.cos(e*Math.PI/180)),l=n(e+o,t-s),c=n(e-o,t+s),u=[];for(let e=l.x;e<=c.x;e++)for(let t=l.y;t<=c.y;t++)u.push({z:i,x:e,y:t});return u},l=async({lat:e,lon:t,radiusM:r,layers:i,urls:n=[],onProgress:l})=>{let c=[];for(let{template:a,zooms:n}of i)for(let i of n)for(let n of s(e,t,r,i))c.push(o(a,n.z,n.x,n.y));c.push(...n);let u=0,d=0,f=[...c],h=async()=>{for(;f.length;){let e=f.shift();try{!(await a(e,{kind:e.includes("forecast")?"forecast":"tile"})).ok&&d++}catch{d++}u++,l?.(u,c.length,d)}};return await Promise.all(Array.from({length:4},h)),{done:u,failed:d,total:c.length}},c=async()=>{if(navigator.storage?.estimate){let{usage:e}=await navigator.storage.estimate();return e}return null},u=async(e,r)=>{if(!("u">typeof caches))return!1;let i=await caches.open(t);return await i.put(e,r),!0},d=async e=>{if(!("u">typeof caches))return null;let r=await caches.open(t);return await r.match(e)||null};e.s(["cachedFetch",0,a,"cachedImage",0,n,"clearOfflineCache",0,()=>"u">typeof caches?caches.delete(t):Promise.resolve(!1),"offlineCacheSize",0,c,"prefetchArea",0,l,"readCached",0,d,"storeCached",0,u,"tileUrl",0,o])},31067,e=>{"use strict";function t(){return(t=Object.assign.bind()).apply(null,arguments)}e.s(["default",()=>t])},60099,e=>{"use strict";let t,r;var i=e.i(31067),a=e.i(71645),n=e.i(88014),o=e.i(90072),s=e.i(90874),l=e.i(95393);let c=new o.Vector3,u=new o.Vector3,d=new o.Vector3,f=new o.Vector2;function h(e,t,r){let i=c.setFromMatrixPosition(e.matrixWorld);i.project(t);let a=r.width/2,n=r.height/2;return[i.x*a+a,-(i.y*n)+n]}let p=e=>1e-10>Math.abs(e)?0:e;function m(e,t,r=""){let i="matrix3d(";for(let r=0;16!==r;r++)i+=p(t[r]*e.elements[r])+(15!==r?",":")");return r+i}let v=(t=[1,-1,1,1,1,-1,1,1,1,-1,1,1,1,-1,1,1],e=>m(e,t)),y=(r=e=>[1/e,1/e,1/e,1,-1/e,-1/e,-1/e,-1,1/e,1/e,1/e,1,1,1,1,1],(e,t)=>m(e,r(t),"translate(-50%,-50%)")),g=a.forwardRef(({children:e,eps:t=.001,style:r,className:m,prepend:g,center:x,fullscreen:w,portal:b,distanceFactor:S,sprite:M=!1,transform:E=!1,occlude:A,onOcclude:_,castShadow:F,receiveShadow:P,material:z,geometry:L,zIndexRange:T=[0x1000037,0],calculatePosition:C=h,as:U="div",wrapperClass:D,pointerEvents:B="auto",...I},R)=>{let{gl:O,camera:W,scene:j,size:N,raycaster:V,events:H,viewport:$}=(0,s.useThree)(),[k]=a.useState(()=>document.createElement(U)),G=a.useRef(null),q=a.useRef(null),K=a.useRef(0),X=a.useRef([0,0]),Z=a.useRef(null),Q=a.useRef(null),J=(null==b?void 0:b.current)||H.connected||O.domElement.parentNode,Y=a.useRef(null),ee=a.useRef(!1),et=a.useMemo(()=>{var e;return A&&"blending"!==A||Array.isArray(A)&&A.length&&(e=A[0])&&"object"==typeof e&&"current"in e},[A]);a.useLayoutEffect(()=>{let e=O.domElement;A&&"blending"===A?(e.style.zIndex=`${Math.floor(T[0]/2)}`,e.style.position="absolute",e.style.pointerEvents="none"):(e.style.zIndex=null,e.style.position=null,e.style.pointerEvents=null)},[A]),a.useLayoutEffect(()=>{if(q.current){let e=G.current=n.createRoot(k);if(j.updateMatrixWorld(),E)k.style.cssText="position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;";else{let e=C(q.current,W,N);k.style.cssText=`position:absolute;top:0;left:0;transform:translate3d(${e[0]}px,${e[1]}px,0);transform-origin:0 0;`}return J&&(g?J.prepend(k):J.appendChild(k)),()=>{J&&J.removeChild(k),e.unmount()}}},[J,E]),a.useLayoutEffect(()=>{D&&(k.className=D)},[D]);let er=a.useMemo(()=>E?{position:"absolute",top:0,left:0,width:N.width,height:N.height,transformStyle:"preserve-3d",pointerEvents:"none"}:{position:"absolute",transform:x?"translate3d(-50%,-50%,0)":"none",...w&&{top:-N.height/2,left:-N.width/2,width:N.width,height:N.height},...r},[r,x,w,N,E]),ei=a.useMemo(()=>({position:"absolute",pointerEvents:B}),[B]);a.useLayoutEffect(()=>{var t,i;ee.current=!1,E?null==(t=G.current)||t.render(a.createElement("div",{ref:Z,style:er},a.createElement("div",{ref:Q,style:ei},a.createElement("div",{ref:R,className:m,style:r,children:e})))):null==(i=G.current)||i.render(a.createElement("div",{ref:R,style:er,className:m,children:e}))});let ea=a.useRef(!0);(0,l.useFrame)(e=>{if(q.current){W.updateMatrixWorld(),q.current.updateWorldMatrix(!0,!1);let e=E?X.current:C(q.current,W,N);if(E||Math.abs(K.current-W.zoom)>t||Math.abs(X.current[0]-e[0])>t||Math.abs(X.current[1]-e[1])>t){var r;let t,i,a,n,s=(r=q.current,t=c.setFromMatrixPosition(r.matrixWorld),i=u.setFromMatrixPosition(W.matrixWorld),a=t.sub(i),n=W.getWorldDirection(d),a.angleTo(n)>Math.PI/2),l=!1;et&&(Array.isArray(A)?l=A.map(e=>e.current):"blending"!==A&&(l=[j]));let h=ea.current;l?ea.current=function(e,t,r,i){let a=c.setFromMatrixPosition(e.matrixWorld),n=a.clone();n.project(t),f.set(n.x,n.y),r.setFromCamera(f,t);let o=r.intersectObjects(i,!0);if(o.length){let e=o[0].distance;return a.distanceTo(r.ray.origin)<e}return!0}(q.current,W,V,l)&&!s:ea.current=!s,h!==ea.current&&(_?_(!ea.current):k.style.display=ea.current?"block":"none");let m=Math.floor(T[0]/2),g=A?et?[T[0],m]:[m-1,0]:T;if(k.style.zIndex=`${function(e,t,r){if(t instanceof o.PerspectiveCamera||t instanceof o.OrthographicCamera){let i=c.setFromMatrixPosition(e.matrixWorld),a=u.setFromMatrixPosition(t.matrixWorld),n=i.distanceTo(a),o=(r[1]-r[0])/(t.far-t.near),s=r[1]-o*t.far;return Math.round(o*n+s)}}(q.current,W,g)}`,E){let[e,t]=[N.width/2,N.height/2],r=W.projectionMatrix.elements[5]*t,{isOrthographicCamera:i,top:a,left:n,bottom:o,right:s}=W,l=v(W.matrixWorldInverse),c=i?`scale(${r})translate(${p(-(s+n)/2)}px,${p((a+o)/2)}px)`:`translateZ(${r}px)`,u=q.current.matrixWorld;M&&((u=W.matrixWorldInverse.clone().transpose().copyPosition(u).scale(q.current.scale)).elements[3]=u.elements[7]=u.elements[11]=0,u.elements[15]=1),k.style.width=N.width+"px",k.style.height=N.height+"px",k.style.perspective=i?"":`${r}px`,Z.current&&Q.current&&(Z.current.style.transform=`${c}${l}translate(${e}px,${t}px)`,Q.current.style.transform=y(u,1/((S||10)/400)))}else{let t=void 0===S?1:function(e,t){if(t instanceof o.OrthographicCamera)return t.zoom;if(!(t instanceof o.PerspectiveCamera))return 1;{let r=c.setFromMatrixPosition(e.matrixWorld),i=u.setFromMatrixPosition(t.matrixWorld);return 1/(2*Math.tan(t.fov*Math.PI/180/2)*r.distanceTo(i))}}(q.current,W)*S;k.style.transform=`translate3d(${e[0]}px,${e[1]}px,0) scale(${t})`}X.current=e,K.current=W.zoom}}if(!et&&Y.current&&!ee.current)if(E){if(Z.current){let e=Z.current.children[0];if(null!=e&&e.clientWidth&&null!=e&&e.clientHeight){let{isOrthographicCamera:t}=W;if(t||L)I.scale&&(Array.isArray(I.scale)?I.scale instanceof o.Vector3?Y.current.scale.copy(I.scale.clone().divideScalar(1)):Y.current.scale.set(1/I.scale[0],1/I.scale[1],1/I.scale[2]):Y.current.scale.setScalar(1/I.scale));else{let t=(S||10)/400,r=e.clientWidth*t,i=e.clientHeight*t;Y.current.scale.set(r,i,1)}ee.current=!0}}}else{let t=k.children[0];if(null!=t&&t.clientWidth&&null!=t&&t.clientHeight){let e=1/$.factor,r=t.clientWidth*e,i=t.clientHeight*e;Y.current.scale.set(r,i,1),ee.current=!0}Y.current.lookAt(e.camera.position)}});let en=a.useMemo(()=>({vertexShader:E?void 0:`
          /*
            This shader is from the THREE's SpriteMaterial.
            We need to turn the backing plane into a Sprite
            (make it always face the camera) if "transfrom"
            is false.
          */
          #include <common>

          void main() {
            vec2 center = vec2(0., 1.);
            float rotation = 0.0;

            // This is somewhat arbitrary, but it seems to work well
            // Need to figure out how to derive this dynamically if it even matters
            float size = 0.03;

            vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
            vec2 scale;
            scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
            scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );

            bool isPerspective = isPerspectiveMatrix( projectionMatrix );
            if ( isPerspective ) scale *= - mvPosition.z;

            vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale * size;
            vec2 rotatedPosition;
            rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
            rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
            mvPosition.xy += rotatedPosition;

            gl_Position = projectionMatrix * mvPosition;
          }
      `,fragmentShader:`
        void main() {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
      `}),[E]);return a.createElement("group",(0,i.default)({},I,{ref:q}),A&&!et&&a.createElement("mesh",{castShadow:F,receiveShadow:P,ref:Y},L||a.createElement("planeGeometry",null),z||a.createElement("shaderMaterial",{side:o.DoubleSide,vertexShader:en.vertexShader,fragmentShader:en.fragmentShader})))});e.s(["Html",0,g])},95393,e=>{"use strict";var t=e.i(61949);e.s(["useFrame",()=>t.F])},92923,30728,27530,e=>{"use strict";let t,r;var i=e.i(90072),a=i;let n=new a.Box3,o=new a.Vector3;class s extends a.InstancedBufferGeometry{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new a.Float32BufferAttribute([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new a.Float32BufferAttribute([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,r=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),r.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let r=new a.InstancedInterleavedBuffer(t,6,1);return this.setAttribute("instanceStart",new a.InterleavedBufferAttribute(r,3,0)),this.setAttribute("instanceEnd",new a.InterleavedBufferAttribute(r,3,3)),this.instanceCount=this.attributes.instanceStart.count,this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let r=new a.InstancedInterleavedBuffer(t,6,1);return this.setAttribute("instanceColorStart",new a.InterleavedBufferAttribute(r,3,0)),this.setAttribute("instanceColorEnd",new a.InterleavedBufferAttribute(r,3,3)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new a.WireframeGeometry(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new a.Box3);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;void 0!==e&&void 0!==t&&(this.boundingBox.setFromBufferAttribute(e),n.setFromBufferAttribute(t),this.boundingBox.union(n))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new a.Sphere),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(void 0!==e&&void 0!==t){let r=this.boundingSphere.center;this.boundingBox.getCenter(r);let i=0;for(let a=0,n=e.count;a<n;a++)o.fromBufferAttribute(e,a),i=Math.max(i,r.distanceToSquared(o)),o.fromBufferAttribute(t,a),i=Math.max(i,r.distanceToSquared(o));this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}}e.s(["LineSegmentsGeometry",0,s],30728);var l=e.i(8560),c=i;l.UniformsLib.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new c.Vector2},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}},l.ShaderLib.line={uniforms:c.UniformsUtils.merge([l.UniformsLib.common,l.UniformsLib.fog,l.UniformsLib.line]),vertexShader:`
		#include <common>
		#include <color_pars_vertex>
		#include <fog_pars_vertex>
		#include <logdepthbuf_pars_vertex>
		#include <clipping_planes_pars_vertex>

		uniform float linewidth;
		uniform vec2 resolution;

		attribute vec3 instanceStart;
		attribute vec3 instanceEnd;

		attribute vec3 instanceColorStart;
		attribute vec3 instanceColorEnd;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#ifdef USE_DASH

			uniform float dashScale;
			attribute float instanceDistanceStart;
			attribute float instanceDistanceEnd;
			varying float vLineDistance;

		#endif

		float trimSegmentAlpha( const in vec4 start, const in vec4 end ) {

			// compute the interpolation factor needed to trim the segment so it terminates
			// between the camera plane and the near plane

			// conservative estimate of the near plane
			float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
			float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column

			// we need different nearEstimate formula for reversed and default depth buffer
			// a is positive with a reversed depth buffer so it can be used for controlling the code flow
			float nearEstimate = ( a > 0.0 ) ? ( - b / ( a + 1.0 ) ) : ( - 0.5 * b / a );

			return ( nearEstimate - start.z ) / ( end.z - start.z );

		}

		void main() {

			#ifdef USE_COLOR

				vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

			#endif

			float aspect = resolution.x / resolution.y;

			// camera space
			vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
			vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

			#ifdef USE_DASH

				float lineDistanceStart = dashScale * instanceDistanceStart;
				float lineDistanceEnd = dashScale * instanceDistanceEnd;

			#endif

			#ifdef WORLD_UNITS

				worldStart = start.xyz;
				worldEnd = end.xyz;

			#else

				vUv = uv;

			#endif

			// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
			// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
			// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
			// perhaps there is a more elegant solution -- WestLangley

			bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

			if ( perspective ) {

				if ( start.z < 0.0 && end.z >= 0.0 ) {

					float alpha = trimSegmentAlpha( start, end );
					end.xyz = mix( start.xyz, end.xyz, alpha );

					#ifdef USE_DASH

						lineDistanceEnd = mix( lineDistanceStart, lineDistanceEnd, alpha );

					#endif

				} else if ( end.z < 0.0 && start.z >= 0.0 ) {

					float alpha = trimSegmentAlpha( end, start );
					start.xyz = mix( end.xyz, start.xyz, alpha );

					#ifdef USE_DASH

						lineDistanceStart = mix( lineDistanceEnd, lineDistanceStart, alpha );

					#endif

				}

			}

			#ifdef USE_DASH

				vLineDistance = ( position.y < 0.5 ) ? lineDistanceStart : lineDistanceEnd;
				vUv = uv;

			#endif

			// clip space
			vec4 clipStart = projectionMatrix * start;
			vec4 clipEnd = projectionMatrix * end;

			// ndc space
			vec3 ndcStart = clipStart.xyz / clipStart.w;
			vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

			// direction
			vec2 dir = ndcEnd.xy - ndcStart.xy;

			// account for clip-space aspect ratio
			dir.x *= aspect;
			dir = normalize( dir );

			#ifdef WORLD_UNITS

				vec3 worldDir = normalize( end.xyz - start.xyz );
				vec3 tmpFwd = normalize( mix( start.xyz, end.xyz, 0.5 ) );
				vec3 worldUp = normalize( cross( worldDir, tmpFwd ) );
				vec3 worldFwd = cross( worldDir, worldUp );
				worldPos = position.y < 0.5 ? start: end;

				// height offset
				float hw = linewidth * 0.5;
				worldPos.xyz += position.x < 0.0 ? hw * worldUp : - hw * worldUp;

				// don't extend the line if we're rendering dashes because we
				// won't be rendering the endcaps
				#ifndef USE_DASH

					// cap extension
					worldPos.xyz += position.y < 0.5 ? - hw * worldDir : hw * worldDir;

					// add width to the box
					worldPos.xyz += worldFwd * hw;

					// endcaps
					if ( position.y > 1.0 || position.y < 0.0 ) {

						worldPos.xyz -= worldFwd * 2.0 * hw;

					}

				#endif

				// project the worldpos
				vec4 clip = projectionMatrix * worldPos;

				// shift the depth of the projected points so the line
				// segments overlap neatly
				vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
				clip.z = clipPose.z * clip.w;

			#else

				vec2 offset = vec2( dir.y, - dir.x );
				// undo aspect ratio adjustment
				dir.x /= aspect;
				offset.x /= aspect;

				// sign flip
				if ( position.x < 0.0 ) offset *= - 1.0;

				// endcaps
				if ( position.y < 0.0 ) {

					offset += - dir;

				} else if ( position.y > 1.0 ) {

					offset += dir;

				}

				// adjust for linewidth
				offset *= linewidth;

				// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
				offset /= resolution.y;

				// select end
				vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

				// back to clip space
				offset *= clip.w;

				clip.xy += offset;

			#endif

			gl_Position = clip;

			vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

			#include <logdepthbuf_vertex>
			#include <clipping_planes_vertex>
			#include <fog_vertex>

		}
		`,fragmentShader:`
		uniform vec3 diffuse;
		uniform float opacity;
		uniform float linewidth;

		#ifdef USE_DASH

			uniform float dashOffset;
			uniform float dashSize;
			uniform float gapSize;

		#endif

		varying float vLineDistance;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#include <common>
		#include <color_pars_fragment>
		#include <fog_pars_fragment>
		#include <logdepthbuf_pars_fragment>
		#include <clipping_planes_pars_fragment>

		vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

			float mua;
			float mub;

			vec3 p13 = p1 - p3;
			vec3 p43 = p4 - p3;

			vec3 p21 = p2 - p1;

			float d1343 = dot( p13, p43 );
			float d4321 = dot( p43, p21 );
			float d1321 = dot( p13, p21 );
			float d4343 = dot( p43, p43 );
			float d2121 = dot( p21, p21 );

			float denom = d2121 * d4343 - d4321 * d4321;

			float numer = d1343 * d4321 - d1321 * d4343;

			mua = numer / denom;
			mua = clamp( mua, 0.0, 1.0 );
			mub = ( d1343 + d4321 * ( mua ) ) / d4343;
			mub = clamp( mub, 0.0, 1.0 );

			return vec2( mua, mub );

		}

		void main() {

			float alpha = opacity;
			vec4 diffuseColor = vec4( diffuse, alpha );

			#include <clipping_planes_fragment>

			#ifdef USE_DASH

				if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

				if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

			#endif

			#ifdef WORLD_UNITS

				// Find the closest points on the view ray and the line segment
				vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
				vec3 lineDir = worldEnd - worldStart;
				vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

				vec3 p1 = worldStart + lineDir * params.x;
				vec3 p2 = rayEnd * params.y;
				vec3 delta = p1 - p2;
				float len = length( delta );
				float norm = len / linewidth;

				#ifndef USE_DASH

					#ifdef USE_ALPHA_TO_COVERAGE

						float dnorm = fwidth( norm );
						alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

					#else

						if ( norm > 0.5 ) {

							discard;

						}

					#endif

				#endif

			#else

				#ifdef USE_ALPHA_TO_COVERAGE

					// artifacts appear on some hardware if a derivative is taken within a conditional
					float a = vUv.x;
					float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
					float len2 = a * a + b * b;
					float dlen = fwidth( len2 );

					if ( abs( vUv.y ) > 1.0 ) {

						alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

					}

				#else

					if ( abs( vUv.y ) > 1.0 ) {

						float a = vUv.x;
						float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
						float len2 = a * a + b * b;

						if ( len2 > 1.0 ) discard;

					}

				#endif

			#endif

			#include <logdepthbuf_fragment>
			#include <color_fragment>

			gl_FragColor = vec4( diffuseColor.rgb, alpha );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>
			#include <fog_fragment>
			#include <premultiplied_alpha_fragment>

		}
		`};class u extends c.ShaderMaterial{constructor(e){super({type:"LineMaterial",uniforms:c.UniformsUtils.clone(l.ShaderLib.line.uniforms),vertexShader:l.ShaderLib.line.vertexShader,fragmentShader:l.ShaderLib.line.fragmentShader,clipping:!0}),this.isLineMaterial=!0,this.setValues(e)}get color(){return this.uniforms.diffuse.value}set color(e){this.uniforms.diffuse.value=e}get worldUnits(){return"WORLD_UNITS"in this.defines}set worldUnits(e){!0===e!==this.worldUnits&&(this.needsUpdate=!0),!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(e){this.uniforms.linewidth&&(this.uniforms.linewidth.value=e)}get dashed(){return"USE_DASH"in this.defines}set dashed(e){!0===e!==this.dashed&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(e){this.uniforms.dashScale.value=e}get dashSize(){return this.uniforms.dashSize.value}set dashSize(e){this.uniforms.dashSize.value=e}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(e){this.uniforms.dashOffset.value=e}get gapSize(){return this.uniforms.gapSize.value}set gapSize(e){this.uniforms.gapSize.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}get resolution(){return this.uniforms.resolution.value}set resolution(e){this.uniforms.resolution.value.copy(e)}get alphaToCoverage(){return"USE_ALPHA_TO_COVERAGE"in this.defines}set alphaToCoverage(e){this.defines&&(!0===e!==this.alphaToCoverage&&(this.needsUpdate=!0),!0===e?this.defines.USE_ALPHA_TO_COVERAGE="":delete this.defines.USE_ALPHA_TO_COVERAGE)}}e.s(["LineMaterial",0,u],27530);let d=new i.Vector4,f=new i.Vector3,h=new i.Vector3,p=new i.Vector4,m=new i.Vector4,v=new i.Vector4,y=new i.Vector3,g=new i.Matrix4,x=new i.Line3,w=new i.Vector3,b=new i.Box3,S=new i.Sphere,M=new i.Vector4;function E(e,t,i){return M.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),M.multiplyScalar(1/M.w),M.x=r/i.width,M.y=r/i.height,M.applyMatrix4(e.projectionMatrixInverse),M.multiplyScalar(1/M.w),Math.abs(Math.max(M.x,M.y))}class A extends i.Mesh{constructor(e=new s,t=new u({color:0xffffff*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,r=e.attributes.instanceEnd,a=new Float32Array(2*t.count);for(let e=0,i=0,n=t.count;e<n;e++,i+=2)f.fromBufferAttribute(t,e),h.fromBufferAttribute(r,e),a[i]=0===i?0:a[i-1],a[i+1]=a[i]+f.distanceTo(h);let n=new i.InstancedInterleavedBuffer(a,2,1);return e.setAttribute("instanceDistanceStart",new i.InterleavedBufferAttribute(n,1,0)),e.setAttribute("instanceDistanceEnd",new i.InterleavedBufferAttribute(n,1,1)),this}raycast(e,a){let n,o,s=this.material.worldUnits,l=e.camera;if(null!==l||s||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.'),!1===s&&(0===this.material.resolution.x||0===this.material.resolution.y))return;let c=void 0!==e.params.Line2&&e.params.Line2.threshold||0;t=e.ray;let u=this.matrixWorld,d=this.geometry,f=this.material;if(r=f.linewidth+c,null===d.boundingSphere&&d.computeBoundingSphere(),S.copy(d.boundingSphere).applyMatrix4(u),s)n=.5*r;else{let e=Math.max(l.near,S.distanceToPoint(t.origin));n=E(l,e,f.resolution)}if(S.radius+=n,!1!==t.intersectsSphere(S)){if(null===d.boundingBox&&d.computeBoundingBox(),b.copy(d.boundingBox).applyMatrix4(u),s)o=.5*r;else{let e=Math.max(l.near,b.distanceToPoint(t.origin));o=E(l,e,f.resolution)}b.expandByScalar(o),!1!==t.intersectsBox(b)&&(s?function(e,a){let n=e.matrixWorld,o=e.geometry,s=o.attributes.instanceStart,l=o.attributes.instanceEnd,c=Math.min(o.instanceCount,s.count);for(let o=0;o<c;o++){x.start.fromBufferAttribute(s,o),x.end.fromBufferAttribute(l,o),x.applyMatrix4(n);let c=new i.Vector3,u=new i.Vector3;t.distanceSqToSegment(x.start,x.end,u,c),u.distanceTo(c)<.5*r&&a.push({point:u,pointOnLine:c,distance:t.origin.distanceTo(u),object:e,face:null,faceIndex:o,uv:null,uv1:null})}}(this,a):function(e,a,n){let o=a.projectionMatrix,s=e.material.resolution,l=e.matrixWorld,c=e.geometry,u=c.attributes.instanceStart,d=c.attributes.instanceEnd,f=Math.min(c.instanceCount,u.count),h=-a.near;t.at(1,v),v.w=1,v.applyMatrix4(a.matrixWorldInverse),v.applyMatrix4(o),v.multiplyScalar(1/v.w),v.x*=s.x/2,v.y*=s.y/2,v.z=0,y.copy(v),g.multiplyMatrices(a.matrixWorldInverse,l);for(let a=0;a<f;a++){if(p.fromBufferAttribute(u,a),m.fromBufferAttribute(d,a),p.w=1,m.w=1,p.applyMatrix4(g),m.applyMatrix4(g),p.z>h&&m.z>h)continue;if(p.z>h){let e=p.z-m.z,t=(p.z-h)/e;p.lerp(m,t)}else if(m.z>h){let e=m.z-p.z,t=(m.z-h)/e;m.lerp(p,t)}p.applyMatrix4(o),m.applyMatrix4(o),p.multiplyScalar(1/p.w),m.multiplyScalar(1/m.w),p.x*=s.x/2,p.y*=s.y/2,m.x*=s.x/2,m.y*=s.y/2,x.start.copy(p),x.start.z=0,x.end.copy(m),x.end.z=0;let c=x.closestPointToPointParameter(y,!0);x.at(c,w);let f=i.MathUtils.lerp(p.z,m.z,c),v=f>=-1&&f<=1,b=y.distanceTo(w)<.5*r;if(v&&b){x.start.fromBufferAttribute(u,a),x.end.fromBufferAttribute(d,a),x.start.applyMatrix4(l),x.end.applyMatrix4(l);let r=new i.Vector3,o=new i.Vector3;t.distanceSqToSegment(x.start,x.end,o,r),n.push({point:o,pointOnLine:r,distance:t.origin.distanceTo(o),object:e,face:null,faceIndex:a,uv:null,uv1:null})}}}(this,l,a))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(d),this.material.uniforms.resolution.value.set(d.z,d.w))}}e.s(["LineSegments2",0,A],92923)},52822,(e,t,r)=>{"use strict";var i=e.r(71645),a=e.r(2239),n="function"==typeof Object.is?Object.is:function(e,t){return e===t&&(0!==e||1/e==1/t)||e!=e&&t!=t},o=a.useSyncExternalStore,s=i.useRef,l=i.useEffect,c=i.useMemo,u=i.useDebugValue;r.useSyncExternalStoreWithSelector=function(e,t,r,i,a){var d=s(null);if(null===d.current){var f={hasValue:!1,value:null};d.current=f}else f=d.current;var h=o(e,(d=c(function(){function e(e){if(!l){if(l=!0,o=e,e=i(e),void 0!==a&&f.hasValue){var t=f.value;if(a(t,e))return s=t}return s=e}if(t=s,n(o,e))return t;var r=i(e);return void 0!==a&&a(t,r)?(o=e,t):(o=e,s=r)}var o,s,l=!1,c=void 0===r?null:r;return[function(){return e(t())},null===c?void 0:function(){return e(c())}]},[t,r,i,a]))[0],d[1]);return l(function(){f.hasValue=!0,f.value=h},[h]),u(h),h}},30224,(e,t,r)=>{"use strict";e.i(47167),t.exports=e.r(52822)}]);