(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,10502,97776,e=>{"use strict";var t=e.i(43476),a=e.i(71645),r=e.i(90874),i=e.i(95393),n=e.i(90072),o=e.i(85709),l=e.i(66799),s=e.i(83402),u=e.i(78461),h=e.i(3950),c=e.i(83646);let m="https://tile.openstreetmap.org/{z}/{x}/{y}.png",d="https://gis.charttools.noaa.gov/arcgis/rest/services/MCS/NOAAChartDisplay/MapServer/exts/MaritimeChartService/WMSServer?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=TRUE&STYLES=&LAYERS=0,1,2,3,4,5,6,7,8,9,10,11,12&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&BBOX={bbox}",f=[[24,50,-126,-66],[51,72,-180,-129],[18,23,-161,-154],[17,19,-68,-64],[13,21,144,146.5],[-15,-14,-171,-169]],p=(e,t)=>f.some(([a,r,i,n])=>e>=a&&e<=r&&t>=i&&t<=n),g={day:"brightness(0.72) saturate(1.15) contrast(1.05)",dark:"invert(1) hue-rotate(180deg) brightness(0.82) saturate(0.7) contrast(0.92)",night:"invert(1) brightness(0.55) sepia(1) hue-rotate(-38deg) saturate(2.4) contrast(0.95)"},v={day:"none",dark:"brightness(0.62)",night:"brightness(0.4) sepia(1) hue-rotate(-38deg) saturate(2)"},y={day:"none",dark:"brightness(0.9)",night:"sepia(1) hue-rotate(-38deg) saturate(2.4) brightness(0.7)"},w=h.tileUrl;function M(e,t){return 156543.03*Math.cos(e*Math.PI/180)/Math.pow(2,t)}let b=new Map,x=0,F=[];function N(e){if(b.has(e))return b.get(e);let t=()=>(0,h.cachedImage)(e).catch(()=>null),a=e.includes("WMSServer"),r=async()=>{for(let e=0;e<3;e++){let a=await t();if(a)return a;await new Promise(t=>{setTimeout(t,1500*(e+1))})}return null},i=a?new Promise(e=>{let t=()=>{x++,r().then(e,()=>e(null)).finally(()=>{x--,F.shift()?.()})};x<6?t():F.push(t)}).then(t=>(t||b.delete(e),t)):t();return b.set(e,i),i}async function S(e,t,a,r){let i=await N(w(e,t,a,r));if(i)return{img:i,sx:0,sy:0,sSize:256};for(let n=1;n<=3&&t-n>=1;n++){let o=t-n,l=a>>n,s=r>>n;if(i=await N(w(e,o,l,s))){let e=256/Math.pow(2,n);return{img:i,sx:(a-(l<<n))*e,sy:(r-(s<<n))*e,sSize:e}}}return null}let D=null;async function C(e,t,a,r,i=1,n="none"){let o,{latitude:l,longitude:s}=t,u=256*i,h=n&&"none"!==n,c=e;h&&(D||((D=document.createElement("canvas")).width=1024,D.height=1024),e=D.getContext("2d"));let m=(s+180)/360*Math.pow(2,a),d=(1-Math.log(Math.tan(o=l*Math.PI/180)+1/Math.cos(o))/Math.PI)/2*Math.pow(2,a),f=m*u-512,p=d*u-512,g=Math.floor(f/u),v=Math.floor(p/u),y=Math.ceil(1024/u)+2,w=Math.pow(2,a),M=[];for(let e=0;e<y;e++)for(let t=0;t<y;t++){let r=g+t,i=v+e;if(i<0||i>=w)continue;let n=(r%w+w)%w,o=Math.round(r*u-f),l=Math.round(i*u-p);M.push({z:a,x:n,y:i,screenLeft:o,screenTop:l})}let b=await Promise.all(M.map(e=>S(r,e.z,e.x,e.y)));h&&e.clearRect(0,0,1024,1024);for(let t=0;t<M.length;t++){let a=b[t];if(!a)continue;let{screenLeft:r,screenTop:i}=M[t];e.drawImage(a.img,a.sx,a.sy,a.sSize,a.sSize,r,i,u,u)}h&&(c.filter=n,c.drawImage(D,0,0),c.filter="none")}async function E(e,t,a,r){let i=e.getContext("2d");for(let e of(i.clearRect(0,0,1024,1024),r)){if(!e?.template||null!=e.maxBaseZoom&&a>e.maxBaseZoom)continue;let r=Math.min(a,e.maxZoom??a),n=Math.pow(2,a-r);await C(i,t,r,e.template,n,e.filter||"none")}}e.s(["NOAA_ENC_TEMPLATE",0,d,"default",0,function({mode:e="chart",opacity:h=1}){let{heading:f}=(0,u.default)(),w=(0,a.useRef)(),b=(0,a.useRef)(null),x=(0,a.useRef)(null),F=(0,a.useRef)(!1),N=(0,a.useRef)({position:null,zoom:null}),S=(0,a.useRef)(0),{id:D}=(0,c.default)(),C=h<1?"day":D,T=g[C]||g.day,$=(0,a.useRef)([]),{gl:k}=(0,r.useThree)(),P=s.default.get("aisLengthScalingFactor")||.7,[R,I]=(0,a.useState)(16),[z,A]=(0,a.useState)(500),j=(0,o.useSignalKPath)("navigation.position"),L=(0,a.useRef)(null);(0,a.useEffect)(()=>{L.current=j},[j]);let O=j?.latitude!=null&&j?.longitude!=null,G=O&&p(j.latitude,j.longitude),[U,_]=(0,a.useState)(!1),W=h<1&&(G||U)?Math.max(h,.55):h;(0,i.useFrame)(({camera:t})=>{if(S.current++,S.current%15!=0)return;let a=L.current;if(a?.latitude==null)return;let r=Math.min(Math.max(4*(t.position.length()/P),"meteo"===e?3e3:500),6e4),i=Math.max(3,Math.min("meteo"===e?15:$.current[0]?.template===m?19:18,Math.round(Math.log2(156543.03*Math.cos(a.latitude*Math.PI/180)/(r/1024)))));i!==R&&I(i)});let B=(0,a.useRef)(!1),H=(0,a.useRef)(null),Z=(0,a.useCallback)((e=!1)=>{if(F.current){B.current=!0;return}let t=L.current;if(t?.latitude==null||t?.longitude==null)return;let a=N.current;if(!e&&a.position&&a.zoom===R){let e=48*M(t.latitude,R)/111320,r=Math.abs(t.latitude-a.position.latitude),i=Math.abs(t.longitude-a.position.longitude);if(r<e&&i<e)return}let r=b.current,i=x.current;if(!r||!i)return;F.current=!0,N.current={position:t,zoom:R};let n=1024*M(t.latitude,R);E(r,t,R,$.current).then(()=>{i.needsUpdate=!0,A(n/2*P)}).catch(e=>console.warn("MapPlane3D: tile rendering failed:",e?.message||e)).finally(()=>{F.current=!1,B.current&&(B.current=!1,H.current?.())})},[R,P]);(0,a.useEffect)(()=>{H.current=Z},[Z]),(0,a.useEffect)(()=>{let e=document.createElement("canvas");e.width=1024,e.height=1024,b.current=e;let t=new n.CanvasTexture(e);return t.minFilter=n.LinearMipmapLinearFilter,t.magFilter=n.LinearFilter,t.anisotropy=k.capabilities.getMaxAnisotropy(),t.generateMipmaps=!0,x.current=t,w.current&&(w.current.material.map=t,w.current.material.needsUpdate=!0),()=>{t.dispose()}},[k]),(0,a.useEffect)(()=>{let t=!1,a=()=>{t||H.current?.(!0)},r=[{template:m,maxZoom:19,filter:T},..."meteo"===e?[]:G?[{template:d,maxZoom:18,filter:v[C]}]:[{template:"https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png",maxZoom:18,filter:y[C]}]];return($.current=r,"meteo"===e)?(a(),fetch("https://api.rainviewer.com/public/weather-maps.json").then(e=>e.json()).then(e=>{let r=e?.radar?.past,i=r?.[r.length-1]?.path;i&&!t&&($.current=[...$.current,{template:`https://tilecache.rainviewer.com${i}/256/{z}/{x}/{y}/2/1_1.png`,maxZoom:7,maxBaseZoom:12}],a())}).catch(()=>{}),()=>{t=!0}):(l.default.apiCall("/signalk/v1/api/resources/charts").then(e=>{if(t||!e||"object"!=typeof e)return;let r=Object.values(e),i=r.find(e=>"openstreetmap"!==e.identifier&&e.tilemapUrl)||r.find(e=>e.tilemapUrl);_(!!i?.tilemapUrl&&"openstreetmap"!==i.identifier),i?.tilemapUrl&&($.current=[{template:i.tilemapUrl.includes("{z}")?i.tilemapUrl:`${i.tilemapUrl}/{z}/{x}/{y}.png`,maxZoom:18,filter:v[C]}]),a()}).catch(()=>{t||($.current=r,a())}),()=>{t=!0})},[e,C,G]),(0,a.useEffect)(()=>{Z()},[j,e,R]),(0,a.useEffect)(()=>{w.current&&x.current&&(w.current.material.map=x.current,w.current.material.needsUpdate=!0)});let V=(0,a.useMemo)(()=>new n.PlaneGeometry(1,1),[]),Y=(0,a.useMemo)(()=>new n.MeshBasicMaterial({side:n.DoubleSide,transparent:h<1,opacity:h,depthWrite:h>=1,polygonOffset:!0,polygonOffsetFactor:2,polygonOffsetUnits:8}),[h]);return((0,a.useEffect)(()=>{Y.opacity=W},[Y,W]),(0,a.useEffect)(()=>()=>{V.dispose(),Y.dispose()},[V,Y]),O)?(0,t.jsx)("group",{rotation:[0,f,0],children:(0,t.jsx)("mesh",{ref:w,geometry:V,material:Y,rotation:[-Math.PI/2,0,0],position:[0,-.1,0],scale:[2*z,2*z,1]})}):null},"inUsWaters",0,p],10502);let T=["https://overpass-api.de/api/interpreter","https://maps.mail.ru/osm/tools/overpass/api/interpreter"],$=["cardinal","lateral","isolated_danger","safe_water","special_purpose"],k=`^(buoy|beacon)_(${$.join("|")})$`,P=e=>Math.round(10*e)/10,R=(e,t,a)=>{let r=a/111320,i=a/(111320*Math.max(.1,Math.cos(e*Math.PI/180))),n=[];for(let a=Math.floor((e-r)/.1);a<=Math.floor((e+r)/.1);a++)for(let e=Math.floor((t-i)/.1);e<=Math.floor((t+i)/.1);e++)n.push({s:P(.1*a),w:P(.1*e),key:`${a}:${e}`});return n},I=({s:e,w:t})=>`${T[0]}?data=${encodeURIComponent(`[out:json];node["seamark:type"~"${k}"](${e},${t},${P(e+.1)},${P(t+.1)});out body;`)}`,z=e=>e?String(e).split(";").map(e=>e.trim().toLowerCase()).filter(Boolean):[],A=e=>{let t=parseFloat(e);return Number.isFinite(t)?t:null},j=e=>{let t=e.tags||{},a=t["seamark:type"]||"",[r,...i]=a.split("_"),n=i.join("_"),o=e=>t[`seamark:${a}:${e}`],l=t["seamark:light:character"]?{character:t["seamark:light:character"],group:t["seamark:light:group"]||"",period:A(t["seamark:light:period"]),colour:z(t["seamark:light:colour"])[0]||"white"}:null;return{id:e.id,lat:e.lat,lon:e.lon,name:t["seamark:name"]||t.name||"",kind:n,beacon:"beacon"===r,category:(o("category")||"").toLowerCase(),shape:(o("shape")||"").toLowerCase(),colours:z(o("colour")),pattern:(o("colour_pattern")||"").toLowerCase(),system:(o("system")||"").toLowerCase(),height:A(o("height")),topmark:t["seamark:topmark:shape"]?{shape:t["seamark:topmark:shape"].toLowerCase(),colours:z(t["seamark:topmark:colour"])}:null,light:l}},L=0,O=e=>e.filter(e=>"node"===e.type&&Number.isFinite(e.lat)&&Number.isFinite(e.lon)).map(j).filter(e=>$.includes(e.kind)),G=async(e,t=25)=>{let a=Math.min(...e.map(e=>e.s)),r=Math.min(...e.map(e=>e.w)),i=P(Math.max(...e.map(e=>e.s))+.1),n=P(Math.max(...e.map(e=>e.w))+.1),o=`[out:json][timeout:${t}];node["seamark:type"~"${k}"](${a},${r},${i},${n});out body;`;for(let t of T)try{let a=await fetch(`${t}?data=${encodeURIComponent(o)}`,{referrerPolicy:"strict-origin-when-cross-origin"});if(!a.ok)continue;let r=await a.json();if(r.remark&&/error|timeout|runtime/i.test(r.remark))continue;let i=r.elements||[],n={};return await Promise.all(e.map(e=>{n[e.key]=i.filter(t=>t.lat>=e.s&&t.lat<e.s+.1&&t.lon>=e.w&&t.lon<e.w+.1);let t=JSON.stringify({elements:n[e.key]});return(0,h.storeCached)(I(e),new Response(t,{headers:{"Content-Type":"application/json"}}))})),n}catch{}throw Error("Overpass unreachable")},U=async e=>{let t={},a=[];for(let r of e){let e=await (0,h.readCached)(I(r)).catch(()=>null);e?t[r.key]=O((await e.json()).elements||[]):a.push(r)}if(a.length&&Date.now()>=L)try{let e=await G(a);Object.entries(e).forEach(([e,a])=>{t[e]=O(a)})}catch{L=Date.now()+12e4}return t},_=async(e,t,a)=>{let r=R(e,t,a);return r.length?Object.keys(await G(r,90)).length:0};e.s(["cellsAround",0,R,"loadCells",0,U,"prefetchSeamarks",0,_],97776)},71415,47233,e=>{"use strict";var t=e.i(43476),a=e.i(71645),r=e.i(90072),i=e.i(60099),n=e.i(43758),o=e.i(83646),l=e.i(83402),s=e.i(85709),u=e.i(78461),h=e.i(3950),c=e.i(48390);e.i(85269);var m=e.i(22831),d=e.i(95393),f=e.i(54983),p=e.i(78311),g=e.i(18032),v=e.i(54735),y=e.i(69435);let w=`
    attribute float aDepth;
    attribute vec2 aGround;
    varying float vDepth;
    varying vec2 vGround;
    varying vec3 vLocal;
    varying vec3 vWorld;
    void main() {
        vDepth = aDepth;
        vGround = aGround;
        vLocal = position;
        // Same expression as the seabed's: the same depth, no fighting
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
    }
`,M=`
    uniform vec3 uCam;          // camera in the mesh frame (x east, y north, z up)
    uniform float uScale;       // scene units per metre
    uniform float uTime;
    uniform float uMax;         // speed at the top of the colour map, m/s
    uniform float uOpacity;     // opacity of a deep column
    uniform float uDepthScale;  // metres of water for ~63 % of it
    uniform float uFlow;        // drift of the pattern, times the current
    uniform sampler2D uMap;
    varying float vDepth;
    varying vec2 vGround;
    varying vec3 vLocal;
    varying vec3 vWorld;
    ${y.NOISE_GLSL}
    ${y.FIELD_GLSL}

    void main() {
        if (vDepth <= 0.05) discard;
        // Water the view ray crosses from the surface down to this point of
        // the bottom, counted up to twice the depth: grazing rays cross
        // hundreds of metres, and the far seabed would vanish under the colour
        vec3 P = vLocal;
        vec3 C = uCam;
        vec3 E = C.z > 0.0 ? C + (P - C) * (C.z / (C.z - P.z)) : C;
        float L = min(length(P - E) / uScale, vDepth * 2.0);
        // Surface current; the column's mean is ~7/8 of it (1/7 power law)
        vec2 flow = flowAt(vGround);
        float t = clamp(length(flow) * 0.875 / uMax, 0.0, 1.0);
        vec3 col = texture2D(uMap, vec2(t, 0.5)).rgb;
        // A soft pattern drifting with the stream (sped up so it shows) and
        // stretched along it: the direction reads without a single line
        float fl = length(flow);
        vec2 dir = fl > 1e-3 ? flow / fl : vec2(0.0, 1.0);
        vec2 drift = vGround - flow * uTime * uFlow;
        vec2 q = vec2(dot(drift, dir) / 240.0, dot(drift, vec2(-dir.y, dir.x)) / 36.0);
        float n = fbm(vec3(q, uTime * 0.04));
        float streak = mix(1.0, 0.6 + 0.8 * n, smoothstep(0.02, 0.25, t));
        col *= 0.85 + 0.3 * n * smoothstep(0.02, 0.25, t);
        // Slack water stays light: the veil thickens with the speed too
        float alpha = uOpacity * (1.0 - exp(-L / uDepthScale)) * streak * mix(0.3, 1.0, t);
        alpha *= fieldMask(vGround) * (1.0 - smoothstep(1500.0, 2100.0, length(vWorld.xz)));
        if (alpha < 0.004) discard;
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
        #include <colorspace_fragment>
    }
`,b=({geometry:e})=>{let{field:i,hour:n,top:o}=(0,v.useCurrentField)(),s=l.default.get("aisLengthScalingFactor")||.7,u=l.default.get("currentColorMap")||v.DEFAULT_CURRENT_MAP,h=(0,y.useFieldTexture)(i,n,4),c=(0,a.useMemo)(()=>new r.ShaderMaterial({uniforms:{uCam:{value:new r.Vector3},uScale:{value:s},uTime:{value:0},uMax:{value:1},uOpacity:{value:Number(l.default.get("currentOpacity"))||.75},uDepthScale:{value:8},uFlow:{value:12},uMap:{value:null},uField:{value:null},uFieldHalf:{value:1},uFieldRange:{value:4}},vertexShader:w,fragmentShader:M,transparent:!0,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),[s]);(0,a.useEffect)(()=>()=>c.dispose(),[c]);let m=(0,a.useMemo)(()=>(0,f.colorMapTexture)(u),[u]);(0,a.useEffect)(()=>()=>m.dispose(),[m]),(0,a.useEffect)(()=>{let e=c.uniforms;e.uMap.value=m,e.uField.value=h,e.uFieldHalf.value=i?.half??1,e.uMax.value=o},[c,m,h,i,o]);let b=(0,a.useRef)(),x=(0,a.useMemo)(()=>new r.Vector3,[]),[F,N]=(0,a.useState)([]),S=(0,a.useRef)(1);return((0,d.useFrame)(({camera:t,clock:a,gl:r},l)=>{let h=b.current;if(!h)return;h.updateWorldMatrix(!0,!1);let m=h.worldToLocal(x.copy(t.position));if(c.uniforms.uCam.value.copy(m),c.uniforms.uTime.value=a.elapsedTime,S.current+=l,S.current<1||!i)return;S.current=0;let d=e.attributes.position,f=e.attributes.aGround,p=f.getX(0)-d.getX(0)/s,y=f.getY(0)-d.getY(0)/s,w=(0,v.currentMarkers)({field:i,hour:n,top:o,mapName:u,refE:p,refN:y,scale:s,radius:1450,z:.3,onScreen:(0,g.onScreenTest)(b.current,t,r.domElement),cx:p+m.x/s,cy:y+m.y/s,heightM:Math.max(5,m.z/s),isWater:(t,a)=>((e,t,a)=>{let{width:r,widthSegments:i}=e.parameters,n=(t+r/2)/r*i,o=(r/2-a)/r*i;if(n<0||o<0||n>=i||o>=i)return NaN;let l=Math.floor(n),s=Math.floor(o),u=n-l,h=o-s,c=e.attributes.aDepth.array,m=(e,t)=>c[t*(i+1)+e];return(m(l,s)*(1-u)+m(l+1,s)*u)*(1-h)+(m(l,s+1)*(1-u)+m(l+1,s+1)*u)*h})(e,t,a)>1.5});N(e=>(0,g.sameMarkers)(e,w)?e:w)}),i)?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("mesh",{ref:b,rotation:[-Math.PI/2,0,0],geometry:e,material:c,renderOrder:2}),(0,t.jsx)("group",{rotation:[-Math.PI/2,0,0],children:(0,t.jsx)(p.default,{items:F,width:v.CURRENT_ARROW_WIDTH,screen:1})})]}):null},x=(e,t)=>{let a=.09/Math.cos(e*Math.PI/180);return{south:e-.09,north:e+.09,west:t-a,east:t+a}},F={emodnet:{datum:"cd",pixels:192,url:(e,t)=>`https://ows.emodnet-bathymetry.eu/wcs?service=WCS&version=1.0.0&request=GetCoverage&coverage=emodnet:mean&crs=EPSG:4326&bbox=${e.west},${e.south},${e.east},${e.north}&format=image/tiff&width=${t}&height=${t}`},noaa:{datum:"msl",pixels:384,url:(e,t)=>`https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_mosaics/DEM_all/ImageServer/exportImage?bbox=${e.west},${e.south},${e.east},${e.north}&bboxSR=4326&imageSR=4326&size=${t},${t}&format=tiff&pixelType=F32&interpolation=RSP_BilinearInterpolation&f=image`}},N=new Map,S=async(e,t)=>{let a=F[e],r=await (0,h.cachedFetch)(a.url(t,a.pixels),{kind:"tile"});if(!r.ok)throw Error(`${e} ${r.status}`);let{width:i,height:n,values:o}=(e=>{let t=new DataView(e),a=18761===t.getUint16(0),r=e=>t.getUint16(e,a),i=e=>t.getUint32(e,a);if(42!==r(2))throw Error("Not a TIFF");let n=i(4),o={},l={1:1,3:2,4:4,11:4,12:8,16:8};for(let e=0;e<r(n);e++){let a=n+2+12*e,s=r(a),u=r(a+2),h=i(a+4),c=(l[u]||1)*h<=4?a+8:i(a+8),m=e=>3===u?r(c+2*e):4===u?i(c+4*e):t.getUint8(c+e);o[s]=Array.from({length:h},(e,t)=>m(t))}let s=o[256][0],u=o[257][0];if((o[259]?.[0]??1)!==1)throw Error("Compressed TIFF");if((o[258]?.[0]??32)!==32)throw Error("Not 32-bit");let h=new Float32Array(s*u).fill(NaN),c=(e,r,i,n,o)=>{for(let l=0;l<o;l++)for(let o=0;o<n;o++){if(r+o>=s||i+l>=u)continue;let c=t.getFloat32(e+(l*n+o)*4,a);h[(i+l)*s+r+o]=12e3>Math.abs(c)?c:NaN}};if(o[322]){let e=o[322][0],t=o[323][0],a=Math.ceil(s/e);o[324].forEach((r,i)=>c(r,i%a*e,Math.floor(i/a)*t,e,t))}else{let e=o[278]?.[0]??u;o[273].forEach((t,a)=>c(t,0,a*e,s,Math.min(e,u-a*e)))}return{width:s,height:u,values:h}})(await r.arrayBuffer()),l=0;for(let e=0;e<o.length;e++)Number.isFinite(o[e])&&l++;if(l<.2*o.length)throw Error(`${e}: not covered`);let s=(t.north-t.south)*111320/n;return{heights:o,width:i,height:n,nw:{lat:t.north,lon:t.west},se:{lat:t.south,lon:t.east},linear:!0,datum:a.datum,source:e,resolution:s}},D=(e,t)=>({lat:.04*Math.round(e/.04),lon:.04*Math.round(t/.04)}),C=(e,t)=>e>=15&&e<=90&&t>=-36&&t<=43?["emodnet","noaa"]:["noaa"],E=async(e,t)=>{let{lat:a,lon:r}=D(e,t),i=`${a.toFixed(2)},${r.toFixed(2)}`;if(N.has(i))return N.get(i);let n=x(a,r),o=C(a,r),l=null;for(let e of o)try{l=await S(e,n);break}catch(t){console.warn(`Regional bathymetry: ${e} unavailable (${t.message})`)}if(l)for(N.set(i,l);N.size>3;)N.delete(N.keys().next().value);return l},T=(e,t,a)=>{let{heights:r,width:i,height:n,nw:o,se:l}=e,s=(a-o.lon)/(l.lon-o.lon)*(i-1),u=(o.lat-t)/(o.lat-l.lat)*(n-1);if(s<0||u<0||s>i-1||u>n-1)return NaN;let h=Math.min(i-2,Math.floor(s)),c=Math.min(n-2,Math.floor(u)),m=s-h,d=u-c,f=(e,t)=>r[t*i+e];return(f(h,c)*(1-m)+f(h+1,c)*m)*(1-d)+(f(h,c+1)*(1-m)+f(h+1,c+1)*m)*d};e.s(["loadRegionalSeabed",0,E,"regionalHeightAt",0,T,"regionalSeabedUrls",0,(e,t)=>{let a=D(e,t),r=x(a.lat,a.lon);return C(a.lat,a.lon).map(e=>F[e].url(r,F[e].pixels))}],47233);let $="https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png",k=10,P=.1,R=["navigation.position","design.draft","environment.tide.heightNow","environment.tide.heightHigh","environment.tide.heightLow","environment.depth.belowSurface","environment.depth.belowKeel","environment.depth.belowTransducer","environment.depth.surfaceToTransducer"],I=(e,t,a)=>{let r=2**a,i=e*Math.PI/180,n=(1-Math.log(Math.tan(i)+1/Math.cos(i))/Math.PI)/2*r;return{x:(t+180)/360*r,y:n}},z=(e,t,a)=>{let r=2**a;return{lat:180*Math.atan(Math.sinh(Math.PI*(1-2*t/r)))/Math.PI,lon:e/r*360-180}},A=new Map,j=async(e,t,a=$,r=k)=>{let i=I(e,t,r),n=Math.floor(i.x)-1,o=Math.floor(i.y)-1,l=`${a}|${r}/${n},${o}`;if(A.has(l))return A.get(l);let s=document.createElement("canvas");s.width=768,s.height=768;let u=s.getContext("2d",{willReadFrequently:!0});if(!(await Promise.all(Array.from({length:9},async(e,t)=>{let i=n+t%3,l=o+Math.floor(t/3),s=a.replace("{z}",r).replace("{x}",i).replace("{y}",l);try{let e=await (0,h.cachedImage)(s);return u.drawImage(e,t%3*256,256*Math.floor(t/3)),!0}catch{return!1}}))).some(Boolean))return null;let c=u.getImageData(0,0,768,768).data,m=new Float32Array(589824);for(let e=0;e<589824;e++)m[e]=c[4*e+3]<255?NaN:256*c[4*e]+c[4*e+1]+c[4*e+2]/256-32768;let d={heights:m,size:768,nw:z(n,o,r),se:z(n+3,o+3,r),z:r};return A.set(l,d),d},L=async(e,t)=>{let a=(0,c.bathymetryTileTemplate)(),[r,i]=await Promise.all([j(e,t),a?j(e,t,a,13).catch(()=>null):null]);if(!r&&!i)throw Error("No bathymetry");return{global:r,shom:i}},O=(e,t,a)=>{let{heights:r,size:i,nw:n,se:o,z:l}=e,s=(a-n.lon)/(o.lon-n.lon)*(i-1),u=I(n.lat,n.lon,l),h=I(o.lat,o.lon,l),c=(I(t,a,l).y-u.y)/(h.y-u.y)*(i-1);if(s<0||c<0||s>i-1||c>i-1)return NaN;let m=Math.min(i-2,Math.floor(s)),d=Math.min(i-2,Math.floor(c)),f=s-m,p=c-d,g=(e,t)=>r[t*i+e];return(g(m,d)*(1-f)+g(m+1,d)*f)*(1-p)+(g(m,d+1)*(1-f)+g(m+1,d+1)*f)*p},G=`
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
`,U=`
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
`,_={light:{water:"#8fd3ff",waterOpacity:.18,shallow:"#b5e0f2",mid:"#5fa8d8",deep:"#1c4f86",land:"#e2d6b8",drying:"#c7d3a6",line:"#0f3557",danger:"#e8873a",fade:"#e8eef3",text:"#0f2f4f",halo:"#ffffff"},dark:{water:"#7cc8f2",waterOpacity:.12,shallow:"#3a8fbc",mid:"#1d5f8c",deep:"#0b2238",land:"#4a4434",drying:"#34472e",line:"#8fdcff",danger:"#f0a060",fade:"#16191e",text:"#e6f4ff",halo:"#101216"},night:{water:"#c0503c",waterOpacity:.1,shallow:"#7a2a1e",mid:"#4f1a12",deep:"#24100c",land:"#3a1a10",drying:"#3a2410",line:"#ff8a72",danger:"#ffad80",fade:"#120807",text:"#ffb3a3",halo:"#0f0706"}},W=[96,40],B=`
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
`,H=`
    uniform sampler2D uMap;
    varying vec2 vUv;
    varying float vFade;
    void main() {
        vec4 t = texture2D(uMap, vUv);
        if (t.a * vFade < 0.05) discard;
        gl_FragColor = vec4(t.rgb, t.a * vFade);
        #include <colorspace_fragment>
    }
`,Z=({items:e,palette:i})=>{let{geometry:n,material:o}=(0,a.useMemo)(()=>{if(!e.length)return{};let[t,a]=W,n=Math.ceil(e.length/16),o=document.createElement("canvas");o.width=16*t,o.height=a*n;let l=o.getContext("2d");l.textAlign="center",l.textBaseline="middle";let s=new r.PlaneGeometry(1,1),u=new r.InstancedBufferGeometry;u.index=s.index,u.setAttribute("position",s.attributes.position);let h=new Float32Array(3*e.length),c=new Float32Array(2*e.length);e.forEach((e,r)=>{let n=r%16*t,o=Math.floor(r/16)*a;l.font=`${e.danger?700:600} 28px Inter, Roboto, Arial, sans-serif`,l.lineWidth=7,l.strokeStyle=i.halo,l.strokeText(e.text,n+t/2,o+a/2+1),l.fillStyle=e.danger?i.danger:i.text,l.fillText(e.text,n+t/2,o+a/2+1),h.set(e.position,3*r),c.set([r%16,Math.floor(r/16)],2*r)}),u.setAttribute("aCenter",new r.InstancedBufferAttribute(h,3)),u.setAttribute("aCell",new r.InstancedBufferAttribute(c,2)),u.instanceCount=e.length;let m=new r.CanvasTexture(o);m.colorSpace=r.SRGBColorSpace,m.flipY=!1,m.anisotropy=4;let d=new r.ShaderMaterial({uniforms:{uMap:{value:m},uAtlas:{value:new r.Vector2(16,n)},uSize:{value:.03}},vertexShader:B,fragmentShader:H,transparent:!0,depthWrite:!1});return s.dispose(),{geometry:u,material:d}},[e,i]);return((0,a.useEffect)(()=>()=>{n?.dispose(),o?.uniforms.uMap.value.dispose(),o?.dispose()},[n,o]),n)?(0,t.jsx)("mesh",{geometry:n,material:o,frustumCulled:!1,renderOrder:3}):null},V=e=>e<10?e.toFixed(1):String(Math.round(e));e.s(["BATHY_ZOOM",0,10,"TERRARIUM",0,$,"default",0,({y:e=-.1,current:h=!1})=>{let d,f=(0,s.useSignalKPaths)(R),{t:p}=(0,m.useTranslation)(),{id:g}=(0,o.default)(),v=f["navigation.position"],{heading:y}=(0,u.default)(),[w,M]=(0,a.useState)(null),x=l.default.get("aisLengthScalingFactor")||.7,F=Number.isFinite(f["design.draft"]?.maximum)?f["design.draft"].maximum:Number(l.default.get("boatDraft"))||2,N=f["environment.depth.belowSurface"],S=f["environment.depth.belowKeel"],D=f["environment.depth.belowTransducer"],C=f["environment.depth.surfaceToTransducer"],$=Number.isFinite(N)?N:Number.isFinite(S)?S+F:Number.isFinite(D)?D+(Number.isFinite(C)?C:0):null,z=_[g]||_.light,A=v?.latitude,j=v?.longitude,W=Number.isFinite(A)?(d=I(A,j,k),`${Math.floor(d.x)},${Math.floor(d.y)}`):null;(0,a.useEffect)(()=>{if(!W)return;let e=!1,t=null,a=()=>L(A,j).then(r=>{!e&&(M(r),!r.shom&&(0,c.bathymetryTileTemplate)()&&(t=setTimeout(a,6e4)))}).catch(()=>{e||(t=setTimeout(a,6e4))});return a(),()=>{e=!0,clearTimeout(t)}},[W]);let[B,H]=(0,a.useState)(null),Y=Number.isFinite(A)?`${Math.round(A/.04)},${Math.round(j/.04)}`:null;(0,a.useEffect)(()=>{if(!Y)return;let e=!1,t=null,a=()=>E(A,j).then(r=>{e||(r?H(r):t=setTimeout(a,6e4))});return a(),()=>{e=!0,clearTimeout(t)}},[Y]);let K=(e,t)=>B?T(B,e,t):NaN,q=B&&B.resolution<60,X=Number.isFinite(A)?Math.round(5e3*A):null,J=Number.isFinite(j)?Math.round(5e3*j):null,Q=(0,a.useMemo)(()=>{if(!w&&!B||null===X)return{};let e=w?.shom?O(w?.shom,A,j):NaN,t=K(A,j);return{survey:Number.isFinite(e)?e:B?.datum==="cd"?t:NaN,global:B?.datum==="msl"&&Number.isFinite(t)?t:w?.global?O(w?.global,A,j):NaN}},[w,B,X,J]),ee=(({tideNow:e,tideHigh:t,tideLow:a,measured:r,surveyHere:i,globalHere:n})=>{let o=(e,t=P)=>Math.round(e/t)*t;if(Number.isFinite(e)){let r=Number.isFinite(t)&&Number.isFinite(a)?e-(t+a)/2:0;return{cd:o(e),msl:o(r),source:"tide"}}if(Number.isFinite(r)&&(Number.isFinite(i)||Number.isFinite(n))){let e=Number.isFinite(i)?r+i:0,t=Number.isFinite(n)?r+n:0;return{cd:o(e,.5),msl:o(t,.5),source:"sounder"}}return{cd:0,msl:0,source:"datum"}})({tideNow:f["environment.tide.heightNow"],tideHigh:f["environment.tide.heightHigh"],tideLow:f["environment.tide.heightLow"],measured:$,surveyHere:Q.survey,globalHere:Q.global}),[et,ea]=(0,a.useState)({cd:NaN,msl:NaN});(0,a.useEffect)(()=>{let e=(e,t)=>Number.isFinite(e)?1e-6>Math.abs(e-t):!Number.isFinite(t);if(e(et.cd,ee.cd)&&e(et.msl,ee.msl))return;let t={cd:ee.cd,msl:ee.msl},a=setTimeout(()=>ea(t),Number.isFinite(et.cd)||Number.isFinite(et.msl)?2e4:0);return()=>clearTimeout(a)},[ee.cd,ee.msl,et]);let er=Number.isFinite(et.cd)||!Number.isFinite(ee.cd)?et.cd:ee.cd,ei=Number.isFinite(et.msl)||!Number.isFinite(ee.msl)?et.msl:ee.msl,en=(0,a.useMemo)(()=>w||B?(e,t)=>{let a=w?.shom?O(w?.shom,e,t):NaN;if(Number.isFinite(a))return{h:a-er,drying:a<6.5};let r=K(e,t);if(Number.isFinite(r))return"cd"===B.datum?{h:r-er,drying:r<6.5}:{h:r-ei,drying:r<3};let i=w?.global?O(w?.global,e,t):NaN;return Number.isFinite(i)?{h:i-ei,drying:i<3}:null}:null,[w,B,er,ei]),eo=Math.round((Number.isFinite($)?$:F+1)*2)/2,el=(0,a.useMemo)(()=>{if(!en||!Number.isFinite(A))return en;let e=w?.shom&&Number.isFinite(O(w?.shom,A,j))||q&&Number.isFinite(K(A,j));return((e,t,a,r,i)=>{let n=e(t,a),o=-r;if(!n||n.h<=o)return e;let l=o-n.h,s=111320*Math.cos(t*Math.PI/180);return(r,n)=>{let o=e(r,n);if(!o)return o;let u=Math.hypot((r-t)*111320,(n-a)*s)/i;if(u>=1)return o;let h=1-u*u*(3-2*u);return{h:o.h+l*h,drying:!(h>.5)&&o.drying}}})(en,A,j,eo,e?60:350)},[en,eo,X,J]),es=(0,a.useMemo)(()=>{let e,t;if(!el||!Number.isFinite(A))return null;let a=w?.shom||q?240:160,i=(w?.shom,1),n=new r.PlaneGeometry(6e3*x,6e3*x,a,a),o=n.attributes.position,l=new Float32Array(o.count),s=new Float32Array(o.count),u=new Float32Array(2*o.count),h=111320*Math.cos(A*Math.PI/180),c=(e=Math.round(10*A)/10,t=Math.round(10*j)/10,{east:(j-t)*111320*Math.cos(e*Math.PI/180),north:(A-e)*111320});for(let e=0;e<o.count;e++){let t=o.getX(e)/x,a=o.getY(e)/x,r=el(A+a/111320,j+t/h),n=r?r.h:0;l[e]=-n,s[e]=+!!r?.drying,u[2*e]=c.east+t,u[2*e+1]=c.north+a,o.setZ(e,n<0?n*i*x:(.15+ +Math.min(n,4))*x)}n.setAttribute("aDepth",new r.BufferAttribute(l,1)),n.setAttribute("aDrying",new r.BufferAttribute(s,1)),n.setAttribute("aGround",new r.BufferAttribute(u,2)),n.computeVertexNormals();let m=[],d=250*Math.ceil((c.east-1500)/250),f=250*Math.ceil((c.north-1500)/250);for(let e=d;e<=c.east+1500;e+=250)for(let t=f;t<=c.north+1500;t+=250){let a=e-c.east+125,r=t-c.north+125;if(Math.hypot(a,r)>1500)continue;let n=el(A+r/111320,j+a/h);if(!n||n.h>=-.1)continue;let o=-n.h;m.push({text:V(o),danger:o<F+1,position:[a*x,n.h*i*x+2,-r*x]})}let p=el(A,j);return{geometry:n,items:m,exaggeration:i,bottom:p&&p.h<0?p.h*i*x:null,depthHere:p?-p.h:null}},[el,x,F,A&&Math.round(500*A),j&&Math.round(500*j)]);(0,a.useEffect)(()=>()=>es?.geometry.dispose(),[es]);let eu=(0,a.useMemo)(()=>new r.ShaderMaterial({uniforms:{uDanger:{value:3},uShallow:{value:new r.Color},uMid:{value:new r.Color},uDeep:{value:new r.Color},uLand:{value:new r.Color},uDrying:{value:new r.Color},uLine:{value:new r.Color},uDangerColor:{value:new r.Color},uFade:{value:new r.Color},uFadeNear:{value:1500},uFadeFar:{value:2100}},vertexShader:G,fragmentShader:U}),[]);(0,a.useEffect)(()=>{let e=eu.uniforms;e.uDanger.value=F+1,e.uShallow.value.set(z.shallow),e.uMid.value.set(z.mid),e.uDeep.value.set(z.deep),e.uLand.value.set(z.land),e.uDrying.value.set(z.drying),e.uLine.value.set(z.line),e.uDangerColor.value.set(z.danger),e.uFade.value.set(z.fade)},[eu,F,z]),(0,a.useEffect)(()=>()=>eu.dispose(),[eu]);let eh=(0,a.useMemo)(()=>new r.ShaderMaterial({uniforms:{uColor:{value:new r.Color},uOpacity:{value:.16}},vertexShader:`
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
            }`,transparent:!0,depthWrite:!1,side:r.DoubleSide}),[]);if((0,a.useEffect)(()=>{let e=eh.uniforms;e.uColor.value.set(z.water),e.uOpacity.value=z.waterOpacity},[eh,z]),(0,a.useEffect)(()=>()=>eh.dispose(),[eh]),!es||!Number.isFinite(A))return null;let ec=es.depthHere,em=Number.isFinite($)&&Number.isFinite(ec)&&"tide"===ee.source?$-ec:null,ed=(Number.isFinite($)?-$*es.exaggeration*x:null)??es.bottom,ef=null!==em&&Math.abs(em)>=.3,ep=Number.isFinite($)?$:ec,eg=-F*x;return(0,t.jsxs)("group",{rotation:[0,y,0],position:[0,e,0],children:[(0,t.jsx)("mesh",{rotation:[-Math.PI/2,0,0],geometry:es.geometry,material:eu,renderOrder:-2}),h&&(0,t.jsx)(b,{geometry:es.geometry}),(0,t.jsx)("mesh",{rotation:[-Math.PI/2,0,0],material:eh,renderOrder:1,children:(0,t.jsx)("circleGeometry",{args:[3e3*x,96]})}),(0,t.jsx)(Z,{items:es.items,palette:z}),null!==ed&&ed<eg&&(0,t.jsxs)("group",{children:[(0,t.jsx)(n.default,{points:[[0,eg,0],[0,ed,0]],color:z.line,lineWidth:2,dashed:!0,dashSize:1.2,gapSize:.8}),(0,t.jsxs)("mesh",{position:[0,ed,0],rotation:[-Math.PI/2,0,0],children:[(0,t.jsx)("ringGeometry",{args:[1.2,1.8,32]}),(0,t.jsx)("meshBasicMaterial",{color:z.line,transparent:!0,opacity:.8,side:r.DoubleSide})]}),ef&&null!==es.bottom&&(0,t.jsxs)("mesh",{position:[0,es.bottom,0],rotation:[-Math.PI/2,0,0],children:[(0,t.jsx)("ringGeometry",{args:[1,1.4,32]}),(0,t.jsx)("meshBasicMaterial",{color:z.danger,transparent:!0,opacity:.8,side:r.DoubleSide})]}),Number.isFinite(ep)&&(0,t.jsx)(i.Html,{position:[0,ed/2,0],zIndexRange:[5,0],style:{pointerEvents:"none"},children:(0,t.jsxs)("div",{className:"ml-3 -translate-y-1/2 whitespace-nowrap px-1.5 py-px rounded-md text-caption font-semibold tabular-nums text-hud-main bg-hud-bg/70 backdrop-blur-sm",children:[V(ep)," m",ef&&(0,t.jsxs)("span",{className:"ml-1.5 font-normal text-hud-muted",children:[p("bathymetry.chartDepth",{depth:V(ec)})," ","(",em>0?"+":"−",Math.abs(em).toFixed(1),")"]}),"sounder"===ee.source&&(0,t.jsx)("span",{className:"ml-1.5 font-normal text-hud-muted",children:p("bathymetry.levelFromSounder")})]})})]})]})}],71415)}]);