(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,78461,e=>{"use strict";var t=e.i(71645),i=e.i(85709),r=e.i(67561);let n=["navigation.headingTrue","navigation.headingMagnetic","navigation.courseOverGroundTrue","navigation.courseOverGroundMagnetic","navigation.position"],a=null;e.s(["default",0,()=>{let{convertLatLonToXY:e}=(0,r.useOcearoContext)(),o=(0,i.useSignalKPaths)(n),s=o["navigation.headingTrue"]??o["navigation.headingMagnetic"]??o["navigation.courseOverGroundTrue"]??o["navigation.courseOverGroundMagnetic"],l=Number.isFinite(s),u=o["navigation.position"],d=Number.isFinite(u?.latitude)&&Number.isFinite(u?.longitude);return{heading:l?s:0,offset:(0,t.useMemo)(()=>{if(!d)return{x:0,y:0};let t={lat:u.latitude,lon:u.longitude};return e(t,(a||(a=t),a))},[u,d,e]),hasFix:d,hasHeading:l}}])},3666,3950,e=>{"use strict";let t="ocearo-offline-v2",i=["ocearo-offline-v1"],r=!1,n=async(e,{kind:n="tile"}={})=>{if(!("u">typeof caches))return fetch(e,{referrerPolicy:"strict-origin-when-cross-origin"});r||(r=!0,i.forEach(e=>caches.delete(e).catch(()=>{})));let a=await caches.open(t);if("tile"===n){let t=await a.match(e);if(t)return t}try{let t=await fetch(e,{mode:"cors",referrerPolicy:"strict-origin-when-cross-origin"});return t.ok&&await a.put(e,t.clone()),t}catch(i){let t=await a.match(e);if(t)return t;throw i}},a=async e=>{let t=await n(e,{kind:"tile"});if(!t.ok)throw Error(`${t.status} ${e}`);return createImageBitmap(await t.blob())},o=(e,t,i,r)=>{let n=2**r,a=(e,t)=>({x:Math.floor((t+180)/360*n),y:Math.floor((1-Math.log(Math.tan(e*Math.PI/180)+1/Math.cos(e*Math.PI/180))/Math.PI)/2*n)}),o=i/111320,s=i/(111320*Math.cos(e*Math.PI/180)),l=a(e+o,t-s),u=a(e-o,t+s),d=[];for(let e=l.x;e<=u.x;e++)for(let t=l.y;t<=u.y;t++)d.push({z:r,x:e,y:t});return d},s=async({lat:e,lon:t,radiusM:i,layers:r,urls:a=[],onProgress:s})=>{let l=[];for(let{template:n,zooms:a}of r)for(let r of a)for(let a of o(e,t,i,r))l.push(n.replace("{z}",a.z).replace("{x}",a.x).replace("{y}",a.y));l.push(...a);let u=0,d=0,c=[...l],f=async()=>{for(;c.length;){let e=c.shift();try{!(await n(e,{kind:e.includes("forecast")?"forecast":"tile"})).ok&&d++}catch{d++}u++,s?.(u,l.length,d)}};return await Promise.all(Array.from({length:4},f)),{done:u,failed:d,total:l.length}},l=async()=>{if(navigator.storage?.estimate){let{usage:e}=await navigator.storage.estimate();return e}return null};e.s(["cachedFetch",0,n,"cachedImage",0,a,"clearOfflineCache",0,()=>"u">typeof caches?caches.delete(t):Promise.resolve(!1),"offlineCacheSize",0,l,"prefetchArea",0,s],3950);let u={key:null,at:0,field:null},d=(e,t,i,r)=>({lat:e+(r/8*2-1)*4e4/6371e3*180/Math.PI,lon:t+(i/8*2-1)*4e4/(6371e3*Math.cos(e*Math.PI/180))*180/Math.PI}),c=(e,t)=>{let i=[],r=[];for(let n=0;n<9;n++)for(let a=0;a<9;a++){let o=d(e,t,a,n);i.push(o.lat.toFixed(4)),r.push(o.lon.toFixed(4))}return`https://api.open-meteo.com/v1/forecast?latitude=${i.join(",")}&longitude=${r.join(",")}&hourly=wind_speed_10m,wind_direction_10m&wind_speed_unit=ms&forecast_hours=48&timezone=GMT`},f=async(e,t)=>{let i=`${e.toFixed(1)},${t.toFixed(1)}`;if(u.field&&u.key===i&&Date.now()-u.at<18e5)return u.field;let r=c(e,t),a=await n(r,{kind:"forecast"});if(!a.ok)throw Error(`Open-Meteo ${a.status}`);let o=await a.json(),s=Array.isArray(o)?o:[o],l=s[0]?.hourly?.time||[],d=l.length,f=[],h=[];for(let e=0;e<d;e++){let t=new Float32Array(81),i=new Float32Array(81);s.forEach((r,n)=>{let a=r.hourly.wind_speed_10m[e]??0,o=(r.hourly.wind_direction_10m[e]??0)*Math.PI/180;t[n]=-a*Math.sin(o),i[n]=-a*Math.cos(o)}),f.push(t),h.push(i)}let m={origin:{lat:e,lon:t},start:Date.parse(`${l[0]}Z`),hours:d,u:f,v:h,source:"open-meteo"};return u={key:i,at:Date.now(),field:m},m},h=[[0,[98,113,183]],[1,[57,97,159]],[3,[74,148,169]],[5,[77,141,123]],[7,[83,165,83]],[9,[53,159,53]],[11,[167,157,81]],[13,[159,127,58]],[15,[161,108,92]],[17,[129,58,78]],[19,[175,80,136]],[21,[117,74,147]],[24,[109,97,163]],[27,[68,105,141]],[29,[92,144,152]],[36,[125,68,165]]];e.s(["HALF_EXTENT_M",0,4e4,"WINDY_SCALE",0,h,"fetchWindField",0,f,"sampleWind",0,(e,t,i,r=0)=>{let n=Math.min(9-1.001,Math.max(0,(t/4e4+1)/2*8)),a=Math.min(9-1.001,Math.max(0,(i/4e4+1)/2*8)),o=Math.floor(n),s=Math.floor(a),l=n-o,u=a-s,d=Math.min(e.hours-1,Math.max(0,Math.floor(r))),c=Math.min(e.hours-1,d+1),f=Math.min(1,Math.max(0,r-d)),h=(e,t)=>{let i=e[t],r=9*s+o;return(i[r]*(1-l)+i[r+1]*l)*(1-u)+(i[r+9]*(1-l)+i[r+9+1]*l)*u};return{u:h(e.u,d)*(1-f)+h(e.u,c)*f,v:h(e.v,d)*(1-f)+h(e.v,c)*f}},"uniformField",0,(e,t,i,r)=>{let n=new Float32Array(81).fill(-i*Math.sin(r)),a=new Float32Array(81).fill(-i*Math.cos(r));return{origin:{lat:e,lon:t},start:Date.now(),hours:1,u:[n],v:[a],source:"boat"}},"windColor",0,e=>{if(e<=h[0][0])return h[0][1];for(let t=1;t<h.length;t++)if(e<=h[t][0]){let[i,r]=h[t-1],[n,a]=h[t],o=(e-i)/(n-i);return r.map((e,t)=>e+(a[t]-e)*o)}return h[h.length-1][1]},"windFieldUrl",0,c],3666)},71415,e=>{"use strict";var t=e.i(43476),i=e.i(71645),r=e.i(90072),n=e.i(60099),a=e.i(43216),o=e.i(83646),s=e.i(83402),l=e.i(85709),u=e.i(78461),d=e.i(3950),c=e.i(48390);e.i(85269);var f=e.i(22831);let h="https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png",m=10,p=.1,v=["navigation.position","design.draft","environment.tide.heightNow","environment.tide.heightHigh","environment.tide.heightLow","environment.depth.belowSurface","environment.depth.belowKeel"],g=(e,t,i)=>{let r=2**i,n=e*Math.PI/180,a=(1-Math.log(Math.tan(n)+1/Math.cos(n))/Math.PI)/2*r;return{x:(t+180)/360*r,y:a}},y=(e,t,i)=>{let r=2**i;return{lat:180*Math.atan(Math.sinh(Math.PI*(1-2*t/r)))/Math.PI,lon:e/r*360-180}},x=new Map,w=async(e,t,i=h,r=m)=>{let n=g(e,t,r),a=Math.floor(n.x)-1,o=Math.floor(n.y)-1,s=`${i}|${r}/${a},${o}`;if(x.has(s))return x.get(s);let l=document.createElement("canvas");l.width=768,l.height=768;let u=l.getContext("2d",{willReadFrequently:!0});if(!(await Promise.all(Array.from({length:9},async(e,t)=>{let n=a+t%3,s=o+Math.floor(t/3),l=i.replace("{z}",r).replace("{x}",n).replace("{y}",s);try{let e=await (0,d.cachedImage)(l);return u.drawImage(e,t%3*256,256*Math.floor(t/3)),!0}catch{return!1}}))).some(Boolean))return null;let c=u.getImageData(0,0,768,768).data,f=new Float32Array(589824);for(let e=0;e<589824;e++)f[e]=c[4*e+3]<255?NaN:256*c[4*e]+c[4*e+1]+c[4*e+2]/256-32768;let p={heights:f,size:768,nw:y(a,o,r),se:y(a+3,o+3,r),z:r};return x.set(s,p),p},b=async(e,t)=>{let i=(0,c.bathymetryTileTemplate)(),[r,n]=await Promise.all([w(e,t),i?w(e,t,i,13).catch(()=>null):null]);if(!r&&!n)throw Error("No bathymetry");return{global:r,shom:n}},M=(e,t,i)=>{let{heights:r,size:n,nw:a,se:o,z:s}=e,l=(i-a.lon)/(o.lon-a.lon)*(n-1),u=g(a.lat,a.lon,s),d=g(o.lat,o.lon,s),c=(g(t,i,s).y-u.y)/(d.y-u.y)*(n-1);if(l<0||c<0||l>n-1||c>n-1)return NaN;let f=Math.min(n-2,Math.floor(l)),h=Math.min(n-2,Math.floor(c)),m=l-f,p=c-h,v=(e,t)=>r[t*n+e];return(v(f,h)*(1-m)+v(f+1,h)*m)*(1-p)+(v(f,h+1)*(1-m)+v(f+1,h+1)*m)*p},S=`
    attribute float aDepth;
    attribute float aDrying;
    attribute vec2 aGround;
    varying float vDepth;
    varying float vDrying;
    varying vec2 vGround;
    varying vec3 vWorld;
    void main() {
        vDepth = aDepth;
        vDrying = aDrying;
        vGround = aGround;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
    }
`,E=`
    uniform float uDanger;
    uniform vec3 uShallow;
    uniform vec3 uMid;
    uniform vec3 uDeep;
    uniform vec3 uLand;
    uniform vec3 uDrying;
    uniform vec3 uLine;
    uniform vec3 uDangerColor;
    uniform vec3 uFade;
    uniform float uFadeNear;
    uniform float uFadeFar;
    varying float vDepth;
    varying float vDrying;
    varying vec2 vGround;
    varying vec3 vWorld;

    float contour(float d, float level, float width) {
        float w = fwidth(d);
        return 1.0 - smoothstep(0.0, w * width, abs(d - level));
    }
    float gridLines(vec2 p, float spacing, float width) {
        vec2 g = abs(fract(p / spacing - 0.5) - 0.5) * spacing;
        vec2 w = fwidth(p) * width;
        vec2 l = 1.0 - smoothstep(vec2(0.0), w, g);
        return max(l.x, l.y);
    }

    void main() {
        vec3 c;
        if (vDepth <= 0.0) {
            c = vDrying > 0.5 ? uDrying : uLand;
        } else if (vDepth < 6.0) {
            c = mix(uShallow, uMid, vDepth / 6.0);
        } else {
            // Darker with depth, as light fades under water: the relief reads at a glance
            c = mix(uMid, uDeep, clamp((vDepth - 6.0) / 18.0, 0.0, 1.0));
        }
        // Relief: hill shading from the north-west, as on a shaded survey
        vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
        if (n.y < 0.0) n = -n;
        c *= 0.5 + 0.65 * clamp(dot(n, normalize(vec3(-0.6, 0.7, -0.5))), 0.0, 1.0);
        // Too shallow for us: orange hatching (not a fill, which reads as land)
        if (vDepth > 0.0 && vDepth < uDanger) {
            float hatch = step(0.55, fract((vGround.x + vGround.y) / 14.0));
            c = mix(c, uDangerColor, 0.25 + 0.45 * hatch);
        }
        // The survey grid, fading out with distance before it shimmers
        float dist = length(vWorld.xz);
        float gridFade = 1.0 - smoothstep(900.0, 1700.0, dist);
        float minor = gridLines(vGround, 50.0, 1.5) * 0.55;
        float major = gridLines(vGround, 250.0, 2.4) * 0.85;
        c = mix(c, uLine, max(minor, major) * gridFade * (vDepth > 0.0 ? 1.0 : 0.4));
        // Isobaths, the drying line bold
        float lines = max(max(contour(vDepth, 2.0, 1.5), contour(vDepth, 5.0, 1.5)), max(contour(vDepth, 10.0, 1.5), contour(vDepth, 20.0, 1.5)));
        lines = max(lines, max(contour(vDepth, 30.0, 1.2), contour(vDepth, 50.0, 1.2)) * 0.7);
        lines = max(lines, contour(vDepth, 0.0, 2.5));
        lines = max(lines, contour(vDepth, uDanger, 2.0) * 0.9);
        c = mix(c, uLine * 0.75, clamp(lines, 0.0, 1.0) * 0.85);
        c = mix(c, uFade, smoothstep(uFadeNear, uFadeFar, dist));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
    }
`,A={light:{water:"#8fd3ff",waterOpacity:.18,shallow:"#b5e0f2",mid:"#5fa8d8",deep:"#1c4f86",land:"#e2d6b8",drying:"#c7d3a6",line:"#0f3557",danger:"#e8873a",fade:"#e8eef3",text:"#0f2f4f",halo:"#ffffff"},dark:{water:"#7cc8f2",waterOpacity:.12,shallow:"#3a8fbc",mid:"#1d5f8c",deep:"#0b2238",land:"#4a4434",drying:"#34472e",line:"#8fdcff",danger:"#f0a060",fade:"#16191e",text:"#e6f4ff",halo:"#101216"},night:{water:"#c0503c",waterOpacity:.1,shallow:"#7a2a1e",mid:"#4f1a12",deep:"#24100c",land:"#3a1a10",drying:"#3a2410",line:"#ff8a72",danger:"#ffad80",fade:"#120807",text:"#ffb3a3",halo:"#0f0706"}},_=[96,40],D=`
    attribute vec3 aCenter;
    attribute vec2 aCell;
    uniform vec2 uAtlas;
    uniform float uSize;
    varying vec2 vUv;
    varying float vFade;
    void main() {
        vec4 mv = modelViewMatrix * vec4(aCenter, 1.0);
        float d = -mv.z;
        // Constant size on screen (like the HUD text), none right under the camera
        float size = d * uSize;
        mv.xy += position.xy * vec2(size * 2.4, size);
        vUv = (aCell + vec2(position.x + 0.5, 0.5 - position.y)) / uAtlas;
        vFade = (1.0 - smoothstep(1100.0, 1700.0, length(aCenter.xz))) * smoothstep(25.0, 60.0, d);
        gl_Position = projectionMatrix * mv;
    }
`,L=`
    uniform sampler2D uMap;
    varying vec2 vUv;
    varying float vFade;
    void main() {
        vec4 t = texture2D(uMap, vUv);
        if (t.a * vFade < 0.05) discard;
        gl_FragColor = vec4(t.rgb, t.a * vFade);
        #include <colorspace_fragment>
    }
`,F=({items:e,palette:n})=>{let{geometry:a,material:o}=(0,i.useMemo)(()=>{if(!e.length)return{};let[t,i]=_,a=Math.ceil(e.length/16),o=document.createElement("canvas");o.width=16*t,o.height=i*a;let s=o.getContext("2d");s.textAlign="center",s.textBaseline="middle";let l=new r.PlaneGeometry(1,1),u=new r.InstancedBufferGeometry;u.index=l.index,u.setAttribute("position",l.attributes.position);let d=new Float32Array(3*e.length),c=new Float32Array(2*e.length);e.forEach((e,r)=>{let a=r%16*t,o=Math.floor(r/16)*i;s.font=`${e.danger?700:600} 28px Inter, Roboto, Arial, sans-serif`,s.lineWidth=7,s.strokeStyle=n.halo,s.strokeText(e.text,a+t/2,o+i/2+1),s.fillStyle=e.danger?n.danger:n.text,s.fillText(e.text,a+t/2,o+i/2+1),d.set(e.position,3*r),c.set([r%16,Math.floor(r/16)],2*r)}),u.setAttribute("aCenter",new r.InstancedBufferAttribute(d,3)),u.setAttribute("aCell",new r.InstancedBufferAttribute(c,2)),u.instanceCount=e.length;let f=new r.CanvasTexture(o);f.colorSpace=r.SRGBColorSpace,f.flipY=!1,f.anisotropy=4;let h=new r.ShaderMaterial({uniforms:{uMap:{value:f},uAtlas:{value:new r.Vector2(16,a)},uSize:{value:.03}},vertexShader:D,fragmentShader:L,transparent:!0,depthWrite:!1});return l.dispose(),{geometry:u,material:h}},[e,n]);return((0,i.useEffect)(()=>()=>{a?.dispose(),o?.uniforms.uMap.value.dispose(),o?.dispose()},[a,o]),a)?(0,t.jsx)("mesh",{geometry:a,material:o,frustumCulled:!1,renderOrder:3}):null},P=e=>e<10?e.toFixed(1):String(Math.round(e));e.s(["BATHY_ZOOM",0,10,"TERRARIUM",0,h,"default",0,({y:e=-.1})=>{let d,c=(0,l.useSignalKPaths)(v),{t:h}=(0,f.useTranslation)(),{id:y}=(0,o.default)(),x=c["navigation.position"],{heading:w}=(0,u.default)(),[_,D]=(0,i.useState)(null),L=s.default.get("aisLengthScalingFactor")||.7,C=Number.isFinite(c["design.draft"]?.maximum)?c["design.draft"].maximum:Number(s.default.get("boatDraft"))||2,z=c["environment.depth.belowSurface"],U=c["environment.depth.belowKeel"],N=Number.isFinite(z)?z:Number.isFinite(U)?U+C:null,O=A[y]||A.light,I=x?.latitude,B=x?.longitude,T=Number.isFinite(I)?(d=g(I,B,m),`${Math.floor(d.x)},${Math.floor(d.y)}`):null;(0,i.useEffect)(()=>{if(!T)return;let e=!1;return b(I,B).then(t=>{e||D(t)}).catch(()=>{}),()=>{e=!0}},[T]);let j=Number.isFinite(I)?Math.round(5e3*I):null,R=Number.isFinite(B)?Math.round(5e3*B):null,W=(0,i.useMemo)(()=>_&&null!==j?{survey:_.shom?M(_.shom,I,B):NaN,global:_.global?M(_.global,I,B):NaN}:{},[_,j,R]),G=(({tideNow:e,tideHigh:t,tideLow:i,measured:r,surveyHere:n,globalHere:a})=>{let o=(e,t=p)=>Math.round(e/t)*t;if(Number.isFinite(e)){let r=Number.isFinite(t)&&Number.isFinite(i)?e-(t+i)/2:0;return{cd:o(e),msl:o(r),source:"tide"}}if(Number.isFinite(r)&&(Number.isFinite(n)||Number.isFinite(a))){let e=Number.isFinite(n)?r+n:0,t=Number.isFinite(a)?r+a:0;return{cd:o(e,.5),msl:o(t,.5),source:"sounder"}}return{cd:0,msl:0,source:"datum"}})({tideNow:c["environment.tide.heightNow"],tideHigh:c["environment.tide.heightHigh"],tideLow:c["environment.tide.heightLow"],measured:N,surveyHere:W.survey,globalHere:W.global}),H=G.cd,V=G.msl,$=(0,i.useMemo)(()=>_?(e,t)=>{let i=_.shom?M(_.shom,e,t):NaN;if(Number.isFinite(i))return{h:i-H,drying:i<6.5};let r=_.global?M(_.global,e,t):NaN;return Number.isFinite(r)?{h:r-V,drying:r<3}:null}:null,[_,H,V]),k=(0,i.useMemo)(()=>{let e,t;if(!$||!Number.isFinite(I))return null;let i=_.shom?240:160,n=_.shom?9:5,a=new r.PlaneGeometry(6e3*L,6e3*L,i,i),o=a.attributes.position,s=new Float32Array(o.count),l=new Float32Array(o.count),u=new Float32Array(2*o.count),d=111320*Math.cos(I*Math.PI/180),c=(e=Math.round(10*I)/10,t=Math.round(10*B)/10,{east:(B-t)*111320*Math.cos(e*Math.PI/180),north:(I-e)*111320});for(let e=0;e<o.count;e++){let t=o.getX(e)/L,i=o.getY(e)/L,r=$(I+i/111320,B+t/d),a=r?r.h:0;s[e]=-a,l[e]=+!!r?.drying,u[2*e]=c.east+t,u[2*e+1]=c.north+i,o.setZ(e,a<0?a*n*L:(.15+3*Math.min(a,4))*L)}a.setAttribute("aDepth",new r.BufferAttribute(s,1)),a.setAttribute("aDrying",new r.BufferAttribute(l,1)),a.setAttribute("aGround",new r.BufferAttribute(u,2)),a.computeVertexNormals();let f=[],h=250*Math.ceil((c.east-1500)/250),m=250*Math.ceil((c.north-1500)/250);for(let e=h;e<=c.east+1500;e+=250)for(let t=m;t<=c.north+1500;t+=250){let i=e-c.east+125,r=t-c.north+125;if(Math.hypot(i,r)>1500)continue;let a=$(I+r/111320,B+i/d);if(!a||a.h>=-.1)continue;let o=-a.h;f.push({text:P(o),danger:o<C+1,position:[i*L,a.h*n*L+2,-r*L]})}let p=$(I,B);return{geometry:a,items:f,exaggeration:n,bottom:p&&p.h<0?p.h*n*L:null,depthHere:p?-p.h:null}},[$,L,C,I&&Math.round(500*I),B&&Math.round(500*B)]);(0,i.useEffect)(()=>()=>k?.geometry.dispose(),[k]);let q=(0,i.useMemo)(()=>new r.ShaderMaterial({uniforms:{uDanger:{value:3},uShallow:{value:new r.Color},uMid:{value:new r.Color},uDeep:{value:new r.Color},uLand:{value:new r.Color},uDrying:{value:new r.Color},uLine:{value:new r.Color},uDangerColor:{value:new r.Color},uFade:{value:new r.Color},uFadeNear:{value:1500},uFadeFar:{value:2100}},vertexShader:S,fragmentShader:E}),[]);(0,i.useEffect)(()=>{let e=q.uniforms;e.uDanger.value=C+1,e.uShallow.value.set(O.shallow),e.uMid.value.set(O.mid),e.uDeep.value.set(O.deep),e.uLand.value.set(O.land),e.uDrying.value.set(O.drying),e.uLine.value.set(O.line),e.uDangerColor.value.set(O.danger),e.uFade.value.set(O.fade)},[q,C,O]),(0,i.useEffect)(()=>()=>q.dispose(),[q]);let K=(0,i.useMemo)(()=>new r.ShaderMaterial({uniforms:{uColor:{value:new r.Color},uOpacity:{value:.16}},vertexShader:`
            varying float vDist;
            void main() {
                vDist = length(position.xy);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,fragmentShader:`
            uniform vec3 uColor;
            uniform float uOpacity;
            varying float vDist;
            void main() {
                gl_FragColor = vec4(uColor, uOpacity * (1.0 - smoothstep(1500.0, 2100.0, vDist)));
                #include <colorspace_fragment>
            }`,transparent:!0,depthWrite:!1,side:r.DoubleSide}),[]);if((0,i.useEffect)(()=>{let e=K.uniforms;e.uColor.value.set(O.water),e.uOpacity.value=O.waterOpacity},[K,O]),(0,i.useEffect)(()=>()=>K.dispose(),[K]),!k||!Number.isFinite(I))return null;let Y=k.depthHere,Z=Number.isFinite(N)&&Number.isFinite(Y)&&"tide"===G.source?N-Y:null,X=(Number.isFinite(N)?-N*k.exaggeration*L:null)??k.bottom,Q=null!==Z&&Math.abs(Z)>=.3,J=Number.isFinite(N)?N:Y,ee=-C*L;return(0,t.jsxs)("group",{rotation:[0,w,0],position:[0,e,0],children:[(0,t.jsx)("mesh",{rotation:[-Math.PI/2,0,0],geometry:k.geometry,material:q,renderOrder:-2}),(0,t.jsx)("mesh",{rotation:[-Math.PI/2,0,0],material:K,renderOrder:1,children:(0,t.jsx)("circleGeometry",{args:[3e3*L,96]})}),(0,t.jsx)(F,{items:k.items,palette:O}),null!==X&&X<ee&&(0,t.jsxs)("group",{children:[(0,t.jsx)(a.Line,{points:[[0,ee,0],[0,X,0]],color:O.line,lineWidth:2,dashed:!0,dashSize:1.2,gapSize:.8}),(0,t.jsxs)("mesh",{position:[0,X,0],rotation:[-Math.PI/2,0,0],children:[(0,t.jsx)("ringGeometry",{args:[1.2,1.8,32]}),(0,t.jsx)("meshBasicMaterial",{color:O.line,transparent:!0,opacity:.8,side:r.DoubleSide})]}),Q&&null!==k.bottom&&(0,t.jsxs)("mesh",{position:[0,k.bottom,0],rotation:[-Math.PI/2,0,0],children:[(0,t.jsx)("ringGeometry",{args:[1,1.4,32]}),(0,t.jsx)("meshBasicMaterial",{color:O.danger,transparent:!0,opacity:.8,side:r.DoubleSide})]}),Number.isFinite(J)&&(0,t.jsx)(n.Html,{position:[0,X/2,0],zIndexRange:[5,0],style:{pointerEvents:"none"},children:(0,t.jsxs)("div",{className:"ml-3 -translate-y-1/2 whitespace-nowrap px-1.5 py-px rounded-md text-caption font-semibold tabular-nums text-hud-main bg-hud-bg/70 backdrop-blur-sm",children:[P(J)," m",Q&&(0,t.jsxs)("span",{className:"ml-1.5 font-normal text-hud-muted",children:[h("bathymetry.chartDepth",{depth:P(Y)})," ","(",Z>0?"+":"−",Math.abs(Z).toFixed(1),")"]}),"sounder"===G.source&&(0,t.jsx)("span",{className:"ml-1.5 font-normal text-hud-muted",children:h("bathymetry.levelFromSounder")})]})})]})]})}])},83646,e=>{"use strict";var t=e.i(67561);e.s(["default",0,()=>(0,t.useOcearoContext)().tokens])},58567,e=>{"use strict";var t=e.i(83402);e.s(["RENDER_QUALITIES",0,["auto","high","pi"],"getRenderProfile",0,()=>{let e=t.default.get("renderQuality")||"auto";return"pi"===e||"auto"===e&&(()=>{if("u"<typeof navigator)return!1;if(/aarch64|armv7|armv8|arm64|raspbian|raspberry/i.test(navigator.userAgent))return!0;let e=navigator.hardwareConcurrency||8,t=navigator.deviceMemory||8;return e<=4&&t<=4})()?{id:"pi",fps:30,dpr:1,antialias:!1}:{id:"high",fps:60,dpr:Math.min(window.devicePixelRatio||1,1.5),antialias:!0}}])},31067,e=>{"use strict";function t(){return(t=Object.assign.bind()).apply(null,arguments)}e.s(["default",()=>t])},43216,e=>{"use strict";let t,i;var r=e.i(31067),n=e.i(71645),a=e.i(90072),o=e.i(90874),s=a,l=e.i(32533),u=a,d=e.i(8560),c=e.i(31497);class f extends u.ShaderMaterial{constructor(e){super({type:"LineMaterial",uniforms:u.UniformsUtils.clone(u.UniformsUtils.merge([d.UniformsLib.common,d.UniformsLib.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new u.Vector2(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
				#include <common>
				#include <fog_pars_vertex>
				#include <logdepthbuf_pars_vertex>
				#include <clipping_planes_pars_vertex>

				uniform float linewidth;
				uniform vec2 resolution;

				attribute vec3 instanceStart;
				attribute vec3 instanceEnd;

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
						attribute vec4 instanceColorStart;
						attribute vec4 instanceColorEnd;
					#else
						varying vec3 vLineColor;
						attribute vec3 instanceColorStart;
						attribute vec3 instanceColorEnd;
					#endif
				#endif

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

				void trimSegment( const in vec4 start, inout vec4 end ) {

					// trim end segment so it terminates between the camera plane and the near plane

					// conservative estimate of the near plane
					float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
					float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
					float nearEstimate = - 0.5 * b / a;

					float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

					end.xyz = mix( start.xyz, end.xyz, alpha );

				}

				void main() {

					#ifdef USE_COLOR

						vLineColor = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

					#endif

					#ifdef USE_DASH

						vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
						vUv = uv;

					#endif

					float aspect = resolution.x / resolution.y;

					// camera space
					vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
					vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

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

							trimSegment( start, end );

						} else if ( end.z < 0.0 && start.z >= 0.0 ) {

							trimSegment( end, start );

						}

					}

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

						// get the offset direction as perpendicular to the view vector
						vec3 worldDir = normalize( end.xyz - start.xyz );
						vec3 offset;
						if ( position.y < 0.5 ) {

							offset = normalize( cross( start.xyz, worldDir ) );

						} else {

							offset = normalize( cross( end.xyz, worldDir ) );

						}

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

						// don't extend the line if we're rendering dashes because we
						// won't be rendering the endcaps
						#ifndef USE_DASH

							// extend the line bounds to encompass  endcaps
							start.xyz += - worldDir * linewidth * 0.5;
							end.xyz += worldDir * linewidth * 0.5;

							// shift the position of the quad so it hugs the forward edge of the line
							offset.xy -= dir * forwardOffset;
							offset.z += 0.5;

						#endif

						// endcaps
						if ( position.y > 1.0 || position.y < 0.0 ) {

							offset.xy += dir * 2.0 * forwardOffset;

						}

						// adjust for linewidth
						offset *= linewidth * 0.5;

						// set the world position
						worldPos = ( position.y < 0.5 ) ? start : end;
						worldPos.xyz += offset;

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
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
					#else
						varying vec3 vLineColor;
					#endif
				#endif

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

					#include <clipping_planes_fragment>

					#ifdef USE_DASH

						if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

						if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

					#endif

					float alpha = opacity;

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

					vec4 diffuseColor = vec4( diffuse, alpha );
					#ifdef USE_COLOR
						#ifdef USE_LINE_COLOR_ALPHA
							diffuseColor *= vLineColor;
						#else
							diffuseColor.rgb *= vLineColor;
						#endif
					#endif

					#include <logdepthbuf_fragment>

					gl_FragColor = diffuseColor;

					#include <tonemapping_fragment>
					#include <${c.version>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(e){this.uniforms.diffuse.value=e}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(e){!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(e){this.uniforms.linewidth.value=e}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(e){!!e!="USE_DASH"in this.defines&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(e){this.uniforms.dashScale.value=e}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(e){this.uniforms.dashSize.value=e}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(e){this.uniforms.dashOffset.value=e}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(e){this.uniforms.gapSize.value=e}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(e){this.uniforms.opacity.value=e}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(e){this.uniforms.resolution.value.copy(e)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(e){!!e!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),!0===e?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}let h=c.version>=125?"uv1":"uv2",m=new s.Vector4,p=new s.Vector3,v=new s.Vector3,g=new s.Vector4,y=new s.Vector4,x=new s.Vector4,w=new s.Vector3,b=new s.Matrix4,M=new s.Line3,S=new s.Vector3,E=new s.Box3,A=new s.Sphere,_=new s.Vector4;function D(e,t,r){return _.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),_.multiplyScalar(1/_.w),_.x=i/r.width,_.y=i/r.height,_.applyMatrix4(e.projectionMatrixInverse),_.multiplyScalar(1/_.w),Math.abs(Math.max(_.x,_.y))}class L extends s.Mesh{constructor(e=new l.LineSegmentsGeometry,t=new f({color:0xffffff*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,i=e.attributes.instanceEnd,r=new Float32Array(2*t.count);for(let e=0,n=0,a=t.count;e<a;e++,n+=2)p.fromBufferAttribute(t,e),v.fromBufferAttribute(i,e),r[n]=0===n?0:r[n-1],r[n+1]=r[n]+p.distanceTo(v);let n=new s.InstancedInterleavedBuffer(r,2,1);return e.setAttribute("instanceDistanceStart",new s.InterleavedBufferAttribute(n,1,0)),e.setAttribute("instanceDistanceEnd",new s.InterleavedBufferAttribute(n,1,1)),this}raycast(e,r){let n,a,o=this.material.worldUnits,l=e.camera;null!==l||o||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');let u=void 0!==e.params.Line2&&e.params.Line2.threshold||0;t=e.ray;let d=this.matrixWorld,c=this.geometry,f=this.material;if(i=f.linewidth+u,null===c.boundingSphere&&c.computeBoundingSphere(),A.copy(c.boundingSphere).applyMatrix4(d),o)n=.5*i;else{let e=Math.max(l.near,A.distanceToPoint(t.origin));n=D(l,e,f.resolution)}if(A.radius+=n,!1!==t.intersectsSphere(A)){if(null===c.boundingBox&&c.computeBoundingBox(),E.copy(c.boundingBox).applyMatrix4(d),o)a=.5*i;else{let e=Math.max(l.near,E.distanceToPoint(t.origin));a=D(l,e,f.resolution)}E.expandByScalar(a),!1!==t.intersectsBox(E)&&(o?function(e,r){let n=e.matrixWorld,a=e.geometry,o=a.attributes.instanceStart,l=a.attributes.instanceEnd,u=Math.min(a.instanceCount,o.count);for(let a=0;a<u;a++){M.start.fromBufferAttribute(o,a),M.end.fromBufferAttribute(l,a),M.applyMatrix4(n);let u=new s.Vector3,d=new s.Vector3;t.distanceSqToSegment(M.start,M.end,d,u),d.distanceTo(u)<.5*i&&r.push({point:d,pointOnLine:u,distance:t.origin.distanceTo(d),object:e,face:null,faceIndex:a,uv:null,[h]:null})}}(this,r):function(e,r,n){let a=r.projectionMatrix,o=e.material.resolution,l=e.matrixWorld,u=e.geometry,d=u.attributes.instanceStart,c=u.attributes.instanceEnd,f=Math.min(u.instanceCount,d.count),m=-r.near;t.at(1,x),x.w=1,x.applyMatrix4(r.matrixWorldInverse),x.applyMatrix4(a),x.multiplyScalar(1/x.w),x.x*=o.x/2,x.y*=o.y/2,x.z=0,w.copy(x),b.multiplyMatrices(r.matrixWorldInverse,l);for(let r=0;r<f;r++){if(g.fromBufferAttribute(d,r),y.fromBufferAttribute(c,r),g.w=1,y.w=1,g.applyMatrix4(b),y.applyMatrix4(b),g.z>m&&y.z>m)continue;if(g.z>m){let e=g.z-y.z,t=(g.z-m)/e;g.lerp(y,t)}else if(y.z>m){let e=y.z-g.z,t=(y.z-m)/e;y.lerp(g,t)}g.applyMatrix4(a),y.applyMatrix4(a),g.multiplyScalar(1/g.w),y.multiplyScalar(1/y.w),g.x*=o.x/2,g.y*=o.y/2,y.x*=o.x/2,y.y*=o.y/2,M.start.copy(g),M.start.z=0,M.end.copy(y),M.end.z=0;let u=M.closestPointToPointParameter(w,!0);M.at(u,S);let f=s.MathUtils.lerp(g.z,y.z,u),p=f>=-1&&f<=1,v=w.distanceTo(S)<.5*i;if(p&&v){M.start.fromBufferAttribute(d,r),M.end.fromBufferAttribute(c,r),M.start.applyMatrix4(l),M.end.applyMatrix4(l);let i=new s.Vector3,a=new s.Vector3;t.distanceSqToSegment(M.start,M.end,a,i),n.push({point:a,pointOnLine:i,distance:t.origin.distanceTo(a),object:e,face:null,faceIndex:r,uv:null,[h]:null})}}}(this,l,r))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(m),this.material.uniforms.resolution.value.set(m.z,m.w))}}var F=l;class P extends F.LineSegmentsGeometry{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,i=new Float32Array(2*t);for(let r=0;r<t;r+=3)i[2*r]=e[r],i[2*r+1]=e[r+1],i[2*r+2]=e[r+2],i[2*r+3]=e[r+3],i[2*r+4]=e[r+4],i[2*r+5]=e[r+5];return super.setPositions(i),this}setColors(e,t=3){let i=e.length-t,r=new Float32Array(2*i);if(3===t)for(let n=0;n<i;n+=t)r[2*n]=e[n],r[2*n+1]=e[n+1],r[2*n+2]=e[n+2],r[2*n+3]=e[n+3],r[2*n+4]=e[n+4],r[2*n+5]=e[n+5];else for(let n=0;n<i;n+=t)r[2*n]=e[n],r[2*n+1]=e[n+1],r[2*n+2]=e[n+2],r[2*n+3]=e[n+3],r[2*n+4]=e[n+4],r[2*n+5]=e[n+5],r[2*n+6]=e[n+6],r[2*n+7]=e[n+7];return super.setColors(r,t),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class C extends L{constructor(e=new P,t=new f({color:0xffffff*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let z=n.forwardRef(function({points:e,color:t=0xffffff,vertexColors:i,linewidth:s,lineWidth:u,segments:d,dashed:c,...h},m){var p,v;let g=(0,o.useThree)(e=>e.size),y=n.useMemo(()=>d?new L:new C,[d]),[x]=n.useState(()=>new f),w=(null==i||null==(p=i[0])?void 0:p.length)===4?4:3,b=n.useMemo(()=>{let r=d?new l.LineSegmentsGeometry:new P,n=e.map(e=>{let t=Array.isArray(e);return e instanceof a.Vector3||e instanceof a.Vector4?[e.x,e.y,e.z]:e instanceof a.Vector2?[e.x,e.y,0]:t&&3===e.length?[e[0],e[1],e[2]]:t&&2===e.length?[e[0],e[1],0]:e});if(r.setPositions(n.flat()),i){t=0xffffff;let e=i.map(e=>e instanceof a.Color?e.toArray():e);r.setColors(e.flat(),w)}return r},[e,d,i,w]);return n.useLayoutEffect(()=>{y.computeLineDistances()},[e,y]),n.useLayoutEffect(()=>{c?x.defines.USE_DASH="":delete x.defines.USE_DASH,x.needsUpdate=!0},[c,x]),n.useEffect(()=>()=>{b.dispose(),x.dispose()},[b]),n.createElement("primitive",(0,r.default)({object:y,ref:m},h),n.createElement("primitive",{object:b,attach:"geometry"}),n.createElement("primitive",(0,r.default)({object:x,attach:"material",color:t,vertexColors:!!i,resolution:[g.width,g.height],linewidth:null!=(v=null!=s?s:u)?v:1,dashed:c,transparent:4===w},h)))});e.s(["Line",0,z],43216)},60099,95393,e=>{"use strict";let t,i;var r=e.i(31067),n=e.i(71645),a=e.i(88014),o=e.i(90072),s=e.i(90874),l=e.i(61949);e.s(["useFrame",()=>l.F],95393);var l=l;let u=new o.Vector3,d=new o.Vector3,c=new o.Vector3,f=new o.Vector2;function h(e,t,i){let r=u.setFromMatrixPosition(e.matrixWorld);r.project(t);let n=i.width/2,a=i.height/2;return[r.x*n+n,-(r.y*a)+a]}let m=e=>1e-10>Math.abs(e)?0:e;function p(e,t,i=""){let r="matrix3d(";for(let i=0;16!==i;i++)r+=m(t[i]*e.elements[i])+(15!==i?",":")");return i+r}let v=(t=[1,-1,1,1,1,-1,1,1,1,-1,1,1,1,-1,1,1],e=>p(e,t)),g=(i=e=>[1/e,1/e,1/e,1,-1/e,-1/e,-1/e,-1,1/e,1/e,1/e,1,1,1,1,1],(e,t)=>p(e,i(t),"translate(-50%,-50%)")),y=n.forwardRef(({children:e,eps:t=.001,style:i,className:p,prepend:y,center:x,fullscreen:w,portal:b,distanceFactor:M,sprite:S=!1,transform:E=!1,occlude:A,onOcclude:_,castShadow:D,receiveShadow:L,material:F,geometry:P,zIndexRange:C=[0x1000037,0],calculatePosition:z=h,as:U="div",wrapperClass:N,pointerEvents:O="auto",...I},B)=>{let{gl:T,camera:j,scene:R,size:W,raycaster:G,events:H,viewport:V}=(0,s.useThree)(),[$]=n.useState(()=>document.createElement(U)),k=n.useRef(null),q=n.useRef(null),K=n.useRef(0),Y=n.useRef([0,0]),Z=n.useRef(null),X=n.useRef(null),Q=(null==b?void 0:b.current)||H.connected||T.domElement.parentNode,J=n.useRef(null),ee=n.useRef(!1),et=n.useMemo(()=>{var e;return A&&"blending"!==A||Array.isArray(A)&&A.length&&(e=A[0])&&"object"==typeof e&&"current"in e},[A]);n.useLayoutEffect(()=>{let e=T.domElement;A&&"blending"===A?(e.style.zIndex=`${Math.floor(C[0]/2)}`,e.style.position="absolute",e.style.pointerEvents="none"):(e.style.zIndex=null,e.style.position=null,e.style.pointerEvents=null)},[A]),n.useLayoutEffect(()=>{if(q.current){let e=k.current=a.createRoot($);if(R.updateMatrixWorld(),E)$.style.cssText="position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;";else{let e=z(q.current,j,W);$.style.cssText=`position:absolute;top:0;left:0;transform:translate3d(${e[0]}px,${e[1]}px,0);transform-origin:0 0;`}return Q&&(y?Q.prepend($):Q.appendChild($)),()=>{Q&&Q.removeChild($),e.unmount()}}},[Q,E]),n.useLayoutEffect(()=>{N&&($.className=N)},[N]);let ei=n.useMemo(()=>E?{position:"absolute",top:0,left:0,width:W.width,height:W.height,transformStyle:"preserve-3d",pointerEvents:"none"}:{position:"absolute",transform:x?"translate3d(-50%,-50%,0)":"none",...w&&{top:-W.height/2,left:-W.width/2,width:W.width,height:W.height},...i},[i,x,w,W,E]),er=n.useMemo(()=>({position:"absolute",pointerEvents:O}),[O]);n.useLayoutEffect(()=>{var t,r;ee.current=!1,E?null==(t=k.current)||t.render(n.createElement("div",{ref:Z,style:ei},n.createElement("div",{ref:X,style:er},n.createElement("div",{ref:B,className:p,style:i,children:e})))):null==(r=k.current)||r.render(n.createElement("div",{ref:B,style:ei,className:p,children:e}))});let en=n.useRef(!0);(0,l.F)(e=>{if(q.current){j.updateMatrixWorld(),q.current.updateWorldMatrix(!0,!1);let e=E?Y.current:z(q.current,j,W);if(E||Math.abs(K.current-j.zoom)>t||Math.abs(Y.current[0]-e[0])>t||Math.abs(Y.current[1]-e[1])>t){var i;let t,r,n,a,s=(i=q.current,t=u.setFromMatrixPosition(i.matrixWorld),r=d.setFromMatrixPosition(j.matrixWorld),n=t.sub(r),a=j.getWorldDirection(c),n.angleTo(a)>Math.PI/2),l=!1;et&&(Array.isArray(A)?l=A.map(e=>e.current):"blending"!==A&&(l=[R]));let h=en.current;l?en.current=function(e,t,i,r){let n=u.setFromMatrixPosition(e.matrixWorld),a=n.clone();a.project(t),f.set(a.x,a.y),i.setFromCamera(f,t);let o=i.intersectObjects(r,!0);if(o.length){let e=o[0].distance;return n.distanceTo(i.ray.origin)<e}return!0}(q.current,j,G,l)&&!s:en.current=!s,h!==en.current&&(_?_(!en.current):$.style.display=en.current?"block":"none");let p=Math.floor(C[0]/2),y=A?et?[C[0],p]:[p-1,0]:C;if($.style.zIndex=`${function(e,t,i){if(t instanceof o.PerspectiveCamera||t instanceof o.OrthographicCamera){let r=u.setFromMatrixPosition(e.matrixWorld),n=d.setFromMatrixPosition(t.matrixWorld),a=r.distanceTo(n),o=(i[1]-i[0])/(t.far-t.near),s=i[1]-o*t.far;return Math.round(o*a+s)}}(q.current,j,y)}`,E){let[e,t]=[W.width/2,W.height/2],i=j.projectionMatrix.elements[5]*t,{isOrthographicCamera:r,top:n,left:a,bottom:o,right:s}=j,l=v(j.matrixWorldInverse),u=r?`scale(${i})translate(${m(-(s+a)/2)}px,${m((n+o)/2)}px)`:`translateZ(${i}px)`,d=q.current.matrixWorld;S&&((d=j.matrixWorldInverse.clone().transpose().copyPosition(d).scale(q.current.scale)).elements[3]=d.elements[7]=d.elements[11]=0,d.elements[15]=1),$.style.width=W.width+"px",$.style.height=W.height+"px",$.style.perspective=r?"":`${i}px`,Z.current&&X.current&&(Z.current.style.transform=`${u}${l}translate(${e}px,${t}px)`,X.current.style.transform=g(d,1/((M||10)/400)))}else{let t=void 0===M?1:function(e,t){if(t instanceof o.OrthographicCamera)return t.zoom;if(!(t instanceof o.PerspectiveCamera))return 1;{let i=u.setFromMatrixPosition(e.matrixWorld),r=d.setFromMatrixPosition(t.matrixWorld);return 1/(2*Math.tan(t.fov*Math.PI/180/2)*i.distanceTo(r))}}(q.current,j)*M;$.style.transform=`translate3d(${e[0]}px,${e[1]}px,0) scale(${t})`}Y.current=e,K.current=j.zoom}}if(!et&&J.current&&!ee.current)if(E){if(Z.current){let e=Z.current.children[0];if(null!=e&&e.clientWidth&&null!=e&&e.clientHeight){let{isOrthographicCamera:t}=j;if(t||P)I.scale&&(Array.isArray(I.scale)?I.scale instanceof o.Vector3?J.current.scale.copy(I.scale.clone().divideScalar(1)):J.current.scale.set(1/I.scale[0],1/I.scale[1],1/I.scale[2]):J.current.scale.setScalar(1/I.scale));else{let t=(M||10)/400,i=e.clientWidth*t,r=e.clientHeight*t;J.current.scale.set(i,r,1)}ee.current=!0}}}else{let t=$.children[0];if(null!=t&&t.clientWidth&&null!=t&&t.clientHeight){let e=1/V.factor,i=t.clientWidth*e,r=t.clientHeight*e;J.current.scale.set(i,r,1),ee.current=!0}J.current.lookAt(e.camera.position)}});let ea=n.useMemo(()=>({vertexShader:E?void 0:`
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
      `}),[E]);return n.createElement("group",(0,r.default)({},I,{ref:q}),A&&!et&&n.createElement("mesh",{castShadow:D,receiveShadow:L,ref:J},P||n.createElement("planeGeometry",null),F||n.createElement("shaderMaterial",{side:o.DoubleSide,vertexShader:ea.vertexShader,fragmentShader:ea.fragmentShader})))});e.s(["Html",0,y],60099)},31497,e=>{"use strict";let t=parseInt(e.i(90072).REVISION.replace(/\D+/g,""));e.s(["version",0,t])},32533,e=>{"use strict";var t=e.i(90072);let i=new t.Box3,r=new t.Vector3;class n extends t.InstancedBufferGeometry{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new t.Float32BufferAttribute([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new t.Float32BufferAttribute([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,i=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),i.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let i;e instanceof Float32Array?i=e:Array.isArray(e)&&(i=new Float32Array(e));let r=new t.InstancedInterleavedBuffer(i,6,1);return this.setAttribute("instanceStart",new t.InterleavedBufferAttribute(r,3,0)),this.setAttribute("instanceEnd",new t.InterleavedBufferAttribute(r,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,i=3){let r;e instanceof Float32Array?r=e:Array.isArray(e)&&(r=new Float32Array(e));let n=new t.InstancedInterleavedBuffer(r,2*i,1);return this.setAttribute("instanceColorStart",new t.InterleavedBufferAttribute(n,i,0)),this.setAttribute("instanceColorEnd",new t.InterleavedBufferAttribute(n,i,i)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new t.WireframeGeometry(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new t.Box3);let e=this.attributes.instanceStart,r=this.attributes.instanceEnd;void 0!==e&&void 0!==r&&(this.boundingBox.setFromBufferAttribute(e),i.setFromBufferAttribute(r),this.boundingBox.union(i))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new t.Sphere),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,i=this.attributes.instanceEnd;if(void 0!==e&&void 0!==i){let t=this.boundingSphere.center;this.boundingBox.getCenter(t);let n=0;for(let a=0,o=e.count;a<o;a++)r.fromBufferAttribute(e,a),n=Math.max(n,t.distanceToSquared(r)),r.fromBufferAttribute(i,a),n=Math.max(n,t.distanceToSquared(r));this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}e.s(["LineSegmentsGeometry",0,n])},52822,(e,t,i)=>{"use strict";var r=e.r(71645),n=e.r(2239),a="function"==typeof Object.is?Object.is:function(e,t){return e===t&&(0!==e||1/e==1/t)||e!=e&&t!=t},o=n.useSyncExternalStore,s=r.useRef,l=r.useEffect,u=r.useMemo,d=r.useDebugValue;i.useSyncExternalStoreWithSelector=function(e,t,i,r,n){var c=s(null);if(null===c.current){var f={hasValue:!1,value:null};c.current=f}else f=c.current;var h=o(e,(c=u(function(){function e(e){if(!l){if(l=!0,o=e,e=r(e),void 0!==n&&f.hasValue){var t=f.value;if(n(t,e))return s=t}return s=e}if(t=s,a(o,e))return t;var i=r(e);return void 0!==n&&n(t,i)?(o=e,t):(o=e,s=i)}var o,s,l=!1,u=void 0===i?null:i;return[function(){return e(t())},null===u?void 0:function(){return e(u())}]},[t,i,r,n]))[0],c[1]);return l(function(){f.hasValue=!0,f.value=h},[h]),d(h),h}},30224,(e,t,i)=>{"use strict";e.i(47167),t.exports=e.r(52822)}]);