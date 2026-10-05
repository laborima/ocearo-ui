(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,78461,e=>{"use strict";var t=e.i(71645),i=e.i(85709),n=e.i(67561);let r=["navigation.headingTrue","navigation.headingMagnetic","navigation.courseOverGroundTrue","navigation.courseOverGroundMagnetic","navigation.position"],a=null;e.s(["default",0,()=>{let{convertLatLonToXY:e}=(0,n.useOcearoContext)(),s=(0,i.useSignalKPaths)(r),o=s["navigation.headingTrue"]??s["navigation.headingMagnetic"]??s["navigation.courseOverGroundTrue"]??s["navigation.courseOverGroundMagnetic"],l=Number.isFinite(o),d=s["navigation.position"],u=Number.isFinite(d?.latitude)&&Number.isFinite(d?.longitude);return{heading:l?o:0,offset:(0,t.useMemo)(()=>{if(!u)return{x:0,y:0};let t={lat:d.latitude,lon:d.longitude};return e(t,(a||(a=t),a))},[d,u,e]),hasFix:u,hasHeading:l}}])},23549,e=>{"use strict";var t=e.i(43476),i=e.i(71645);e.i(85269);var n=e.i(22831),r=e.i(78461),a=e.i(37369),s=e.i(539),o=e.i(76247);let l=180/Math.PI;e.s(["default",0,()=>{let{t:e}=(0,n.useTranslation)(),d=(0,a.useBerth)(),u=(()=>{let{heading:e,offset:t}=(0,r.default)(),n=(0,a.useBerth)();return(0,i.useMemo)(()=>{if(!n.pose)return null;let{x:i,y:r,heading:a}=n.pose,l="stern"===n.type,d=l?1:-1,u={x:i+d*Math.sin(a)*o.BOAT.length*.5,y:r+d*Math.cos(a)*o.BOAT.length*.5},c=u.x-t.x,f=u.y-t.y,p=Math.hypot(c,f),h=(0,s.wrapPi)(Math.atan2(c,f)-e),m=-(c*Math.cos(a)-f*Math.sin(a));return{distance:p,bearing:h,headingError:(0,s.wrapPi)(a-e),lateral:m,astern:l}},[n,e,t])})(),{heading:c,offset:f}=(0,r.default)(),p=e=>`px-3 py-1.5 rounded-full text-caption font-semibold uppercase tracking-wider border transition-colors ${e?"bg-oBlue text-white border-oBlue":"border-hud text-hud-secondary hover:text-hud-main"}`,h=null;if(u){let t=Math.round(u.headingError*l),i=u.lateral,n=t=>e(t>=0?"parking.starboard":"parking.port");h=Math.abs(u.bearing)>.6*Math.PI?e("parking.behind"):Math.abs(i)>.4?e("parking.moveAcross",{metres:Math.abs(i).toFixed(1),side:n(-i)}):Math.abs(t)>4?e("parking.turn",{deg:Math.abs(t),side:n(t)}):e(u.astern?"parking.alignedAstern":"parking.aligned")}return(0,t.jsxs)("div",{className:"hud-halo flex flex-col items-center gap-2 select-none",children:[u&&(0,t.jsxs)("div",{className:"text-center leading-tight",children:[(0,t.jsx)("div",{className:"text-value font-semibold text-hud-main",children:h}),(0,t.jsxs)("div",{className:"text-caption text-hud-secondary",children:[e("parking.entry",{metres:u.distance.toFixed(0)}),u.astern?` \xb7 ${e("parking.astern")}`:"","virtual"===d.source?` \xb7 ${e("parking.virtual")}`:""]})]}),(0,t.jsxs)("div",{className:"flex flex-wrap justify-center gap-2",children:[a.BERTH_TYPES.map(i=>(0,t.jsx)("button",{type:"button",className:p(d.type===i),onClick:()=>"virtual"===d.source?(0,a.placeVirtualBerth)(f,c,i):(0,a.setBerth)({type:i}),children:e(`parking.type_${i}`)},i)),"side"===d.type&&(0,t.jsx)("button",{type:"button",className:p(!1),onClick:()=>(0,a.setBerth)({side:"port"===d.side?"starboard":"port"}),children:e("port"===d.side?"parking.portSide":"parking.starboardSide")}),(0,t.jsx)("button",{type:"button",className:p(!1),onClick:()=>(0,a.placeVirtualBerth)(f,c),children:e("parking.placeAhead")})]})]})}],23549)},36540,function(e){e.n(e.i(23549))},76247,37369,e=>{"use strict";var t=e.i(43476),i=e.i(71645),n=e.i(43216),r=e.i(83646),a=e.i(78461);let s={type:"bow",side:"starboard",pose:null,source:"virtual"},o=new Set,l=()=>s,d=e=>{s={...s,...e},o.forEach(e=>e())},u=e=>(o.add(e),()=>o.delete(e)),c=()=>(0,i.useSyncExternalStore)(u,l,l),f=(e,t,i=s.type,n=22)=>{d({type:i,pose:{x:e.x+Math.sin(t)*n,y:e.y+Math.cos(t)*n,heading:"stern"===i?t+Math.PI:t},source:"virtual"})};e.s(["BERTH_TYPES",0,["bow","stern","side","buoy"],"getBerth",0,l,"placeVirtualBerth",0,f,"setBerth",0,d,"useBerth",0,c],37369);let p={length:10.8,beam:3.9},h=p.length/2,m=p.beam/2,v=({size:e,position:i,color:n,opacity:r=1})=>(0,t.jsxs)("mesh",{position:i,children:[(0,t.jsx)("boxGeometry",{args:e}),(0,t.jsx)("meshLambertMaterial",{color:n,transparent:r<1,opacity:r})]}),g=({position:e,rotation:i=0,color:n,length:r=4})=>(0,t.jsxs)("group",{position:e,rotation:[0,i,0],children:[(0,t.jsxs)("mesh",{rotation:[-Math.PI/2,0,0],position:[0,.07,r/2-.6],children:[(0,t.jsx)("planeGeometry",{args:[.7,r-1.2]}),(0,t.jsx)("meshBasicMaterial",{color:n,transparent:!0,opacity:.85,depthWrite:!1})]}),(0,t.jsxs)("mesh",{rotation:[-Math.PI/2,0,0],position:[0,.07,-.6],children:[(0,t.jsx)("circleGeometry",{args:[1.2,3,Math.PI/2]}),(0,t.jsx)("meshBasicMaterial",{color:n,transparent:!0,opacity:.85,depthWrite:!1})]})]}),y=({type:e,side:r,colors:a})=>{let s,o=(0,i.useMemo)(()=>(()=>{let e=-h+3.5,t=[[-m,h],[m,h],[m,e]];for(let i=1;i<=8;i++){let n=i/8;t.push([m*(1-n)**1.6,e-(e+h)*Math.sin(n*Math.PI/2)])}for(let i=7;i>=0;i--){let n=i/8;t.push([-m*(1-n)**1.6,e-(e+h)*Math.sin(n*Math.PI/2)])}return t.push([-m,h]),t.map(([e,t])=>[e,.06,t])})(),[]),l="port"===r?-1:1;return(0,t.jsxs)("group",{children:[(0,t.jsx)(n.Line,{points:o,color:a.target,lineWidth:2.5,dashed:!0,dashSize:.8,gapSize:.5}),(0,t.jsxs)("mesh",{rotation:[-Math.PI/2,0,0],position:[0,.04,.3],children:[(0,t.jsx)("planeGeometry",{args:[.9*p.beam,p.length-1.6]}),(0,t.jsx)("meshBasicMaterial",{color:a.target,transparent:!0,opacity:.12,depthWrite:!1})]}),("bow"===e||"stern"===e)&&(s="bow"===e?-1:1,(0,t.jsxs)("group",{children:[(0,t.jsx)(v,{size:[32,.35,2.2],position:[0,.17,s*(h+.45+1.1)],color:a.pontoon}),(0,t.jsx)(v,{size:[.8,.3,9],position:[m+.45+.4,.15,s*(h-4.5+.45)],color:a.pontoon}),(0,t.jsx)(v,{size:[.95*p.beam,1,.95*p.length],position:[-(p.beam+.9),.5,0],color:a.neighbour,opacity:.45}),(0,t.jsx)(g,{position:[0,0,-s*(h+7)],rotation:"bow"===e?0:Math.PI,color:a.target})]})),"side"===e&&(0,t.jsxs)("group",{children:[(0,t.jsx)(v,{size:[2.4,.35,26],position:[l*(m+.45+1.2),.17,0],color:a.pontoon}),(0,t.jsx)(g,{position:[-(2.5*l),0,h+6],rotation:.25*l,color:a.target})]}),"buoy"===e&&(0,t.jsxs)("group",{children:[(0,t.jsxs)("mesh",{position:[0,.5,-(h+2.5)],children:[(0,t.jsx)("sphereGeometry",{args:[.6,20,14]}),(0,t.jsx)("meshLambertMaterial",{color:a.buoy})]}),(0,t.jsx)(n.Line,{points:[[0,.3,-(h+2.5)],[0,.3,-h]],color:a.pontoon,lineWidth:2}),(0,t.jsx)(g,{position:[0,0,h+6],color:a.target})]})]})};e.s(["BOAT",0,p,"default",0,({scale:e=.5})=>{let{scene:n,accent:s}=(0,r.default)(),{heading:o,offset:d,hasFix:u,hasHeading:p}=(0,a.default)(),h=c();(0,i.useEffect)(()=>{u&&p&&!l().pose&&f(d,o)},[d,o,u,p]);let m=(0,i.useMemo)(()=>({target:s,pontoon:n.rigging,neighbour:n.vessel,buoy:n.target}),[n,s]);if(!h.pose)return null;let{x:v,y:g,heading:x}=h.pose;return(0,t.jsx)("group",{rotation:[0,o,0],children:(0,t.jsx)("group",{position:[(v-d.x)*e,0,-(g-d.y)*e],rotation:[0,-x,0],scale:[e,e,e],children:(0,t.jsx)(y,{type:h.type,side:h.side,colors:m})})})}],76247)},83646,e=>{"use strict";var t=e.i(67561);e.s(["default",0,()=>(0,t.useOcearoContext)().tokens])},31067,e=>{"use strict";function t(){return(t=Object.assign.bind()).apply(null,arguments)}e.s(["default",()=>t])},43216,e=>{"use strict";let t,i;var n=e.i(31067),r=e.i(71645),a=e.i(90072),s=e.i(90874),o=a,l=e.i(32533),d=a,u=e.i(8560),c=e.i(31497);class f extends d.ShaderMaterial{constructor(e){super({type:"LineMaterial",uniforms:d.UniformsUtils.clone(d.UniformsUtils.merge([u.UniformsLib.common,u.UniformsLib.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new d.Vector2(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
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
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(e){this.uniforms.diffuse.value=e}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(e){!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(e){this.uniforms.linewidth.value=e}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(e){!!e!="USE_DASH"in this.defines&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(e){this.uniforms.dashScale.value=e}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(e){this.uniforms.dashSize.value=e}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(e){this.uniforms.dashOffset.value=e}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(e){this.uniforms.gapSize.value=e}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(e){this.uniforms.opacity.value=e}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(e){this.uniforms.resolution.value.copy(e)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(e){!!e!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),!0===e?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}let p=c.version>=125?"uv1":"uv2",h=new o.Vector4,m=new o.Vector3,v=new o.Vector3,g=new o.Vector4,y=new o.Vector4,x=new o.Vector4,b=new o.Vector3,S=new o.Matrix4,w=new o.Line3,M=new o.Vector3,_=new o.Box3,E=new o.Sphere,A=new o.Vector4;function L(e,t,n){return A.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),A.multiplyScalar(1/A.w),A.x=i/n.width,A.y=i/n.height,A.applyMatrix4(e.projectionMatrixInverse),A.multiplyScalar(1/A.w),Math.abs(Math.max(A.x,A.y))}class B extends o.Mesh{constructor(e=new l.LineSegmentsGeometry,t=new f({color:0xffffff*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,i=e.attributes.instanceEnd,n=new Float32Array(2*t.count);for(let e=0,r=0,a=t.count;e<a;e++,r+=2)m.fromBufferAttribute(t,e),v.fromBufferAttribute(i,e),n[r]=0===r?0:n[r-1],n[r+1]=n[r]+m.distanceTo(v);let r=new o.InstancedInterleavedBuffer(n,2,1);return e.setAttribute("instanceDistanceStart",new o.InterleavedBufferAttribute(r,1,0)),e.setAttribute("instanceDistanceEnd",new o.InterleavedBufferAttribute(r,1,1)),this}raycast(e,n){let r,a,s=this.material.worldUnits,l=e.camera;null!==l||s||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');let d=void 0!==e.params.Line2&&e.params.Line2.threshold||0;t=e.ray;let u=this.matrixWorld,c=this.geometry,f=this.material;if(i=f.linewidth+d,null===c.boundingSphere&&c.computeBoundingSphere(),E.copy(c.boundingSphere).applyMatrix4(u),s)r=.5*i;else{let e=Math.max(l.near,E.distanceToPoint(t.origin));r=L(l,e,f.resolution)}if(E.radius+=r,!1!==t.intersectsSphere(E)){if(null===c.boundingBox&&c.computeBoundingBox(),_.copy(c.boundingBox).applyMatrix4(u),s)a=.5*i;else{let e=Math.max(l.near,_.distanceToPoint(t.origin));a=L(l,e,f.resolution)}_.expandByScalar(a),!1!==t.intersectsBox(_)&&(s?function(e,n){let r=e.matrixWorld,a=e.geometry,s=a.attributes.instanceStart,l=a.attributes.instanceEnd,d=Math.min(a.instanceCount,s.count);for(let a=0;a<d;a++){w.start.fromBufferAttribute(s,a),w.end.fromBufferAttribute(l,a),w.applyMatrix4(r);let d=new o.Vector3,u=new o.Vector3;t.distanceSqToSegment(w.start,w.end,u,d),u.distanceTo(d)<.5*i&&n.push({point:u,pointOnLine:d,distance:t.origin.distanceTo(u),object:e,face:null,faceIndex:a,uv:null,[p]:null})}}(this,n):function(e,n,r){let a=n.projectionMatrix,s=e.material.resolution,l=e.matrixWorld,d=e.geometry,u=d.attributes.instanceStart,c=d.attributes.instanceEnd,f=Math.min(d.instanceCount,u.count),h=-n.near;t.at(1,x),x.w=1,x.applyMatrix4(n.matrixWorldInverse),x.applyMatrix4(a),x.multiplyScalar(1/x.w),x.x*=s.x/2,x.y*=s.y/2,x.z=0,b.copy(x),S.multiplyMatrices(n.matrixWorldInverse,l);for(let n=0;n<f;n++){if(g.fromBufferAttribute(u,n),y.fromBufferAttribute(c,n),g.w=1,y.w=1,g.applyMatrix4(S),y.applyMatrix4(S),g.z>h&&y.z>h)continue;if(g.z>h){let e=g.z-y.z,t=(g.z-h)/e;g.lerp(y,t)}else if(y.z>h){let e=y.z-g.z,t=(y.z-h)/e;y.lerp(g,t)}g.applyMatrix4(a),y.applyMatrix4(a),g.multiplyScalar(1/g.w),y.multiplyScalar(1/y.w),g.x*=s.x/2,g.y*=s.y/2,y.x*=s.x/2,y.y*=s.y/2,w.start.copy(g),w.start.z=0,w.end.copy(y),w.end.z=0;let d=w.closestPointToPointParameter(b,!0);w.at(d,M);let f=o.MathUtils.lerp(g.z,y.z,d),m=f>=-1&&f<=1,v=b.distanceTo(M)<.5*i;if(m&&v){w.start.fromBufferAttribute(u,n),w.end.fromBufferAttribute(c,n),w.start.applyMatrix4(l),w.end.applyMatrix4(l);let i=new o.Vector3,a=new o.Vector3;t.distanceSqToSegment(w.start,w.end,a,i),r.push({point:a,pointOnLine:i,distance:t.origin.distanceTo(a),object:e,face:null,faceIndex:n,uv:null,[p]:null})}}}(this,l,n))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(h),this.material.uniforms.resolution.value.set(h.z,h.w))}}var U=l;class z extends U.LineSegmentsGeometry{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,i=new Float32Array(2*t);for(let n=0;n<t;n+=3)i[2*n]=e[n],i[2*n+1]=e[n+1],i[2*n+2]=e[n+2],i[2*n+3]=e[n+3],i[2*n+4]=e[n+4],i[2*n+5]=e[n+5];return super.setPositions(i),this}setColors(e,t=3){let i=e.length-t,n=new Float32Array(2*i);if(3===t)for(let r=0;r<i;r+=t)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5];else for(let r=0;r<i;r+=t)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5],n[2*r+6]=e[r+6],n[2*r+7]=e[r+7];return super.setColors(n,t),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class j extends B{constructor(e=new z,t=new f({color:0xffffff*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let O=r.forwardRef(function({points:e,color:t=0xffffff,vertexColors:i,linewidth:o,lineWidth:d,segments:u,dashed:c,...p},h){var m,v;let g=(0,s.useThree)(e=>e.size),y=r.useMemo(()=>u?new B:new j,[u]),[x]=r.useState(()=>new f),b=(null==i||null==(m=i[0])?void 0:m.length)===4?4:3,S=r.useMemo(()=>{let n=u?new l.LineSegmentsGeometry:new z,r=e.map(e=>{let t=Array.isArray(e);return e instanceof a.Vector3||e instanceof a.Vector4?[e.x,e.y,e.z]:e instanceof a.Vector2?[e.x,e.y,0]:t&&3===e.length?[e[0],e[1],e[2]]:t&&2===e.length?[e[0],e[1],0]:e});if(n.setPositions(r.flat()),i){t=0xffffff;let e=i.map(e=>e instanceof a.Color?e.toArray():e);n.setColors(e.flat(),b)}return n},[e,u,i,b]);return r.useLayoutEffect(()=>{y.computeLineDistances()},[e,y]),r.useLayoutEffect(()=>{c?x.defines.USE_DASH="":delete x.defines.USE_DASH,x.needsUpdate=!0},[c,x]),r.useEffect(()=>()=>{S.dispose(),x.dispose()},[S]),r.createElement("primitive",(0,n.default)({object:y,ref:h},p),r.createElement("primitive",{object:S,attach:"geometry"}),r.createElement("primitive",(0,n.default)({object:x,attach:"material",color:t,vertexColors:!!i,resolution:[g.width,g.height],linewidth:null!=(v=null!=o?o:d)?v:1,dashed:c,transparent:4===b},p)))});e.s(["Line",0,O],43216)},31497,e=>{"use strict";let t=parseInt(e.i(90072).REVISION.replace(/\D+/g,""));e.s(["version",0,t])},32533,e=>{"use strict";var t=e.i(90072);let i=new t.Box3,n=new t.Vector3;class r extends t.InstancedBufferGeometry{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new t.Float32BufferAttribute([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new t.Float32BufferAttribute([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,i=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),i.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let i;e instanceof Float32Array?i=e:Array.isArray(e)&&(i=new Float32Array(e));let n=new t.InstancedInterleavedBuffer(i,6,1);return this.setAttribute("instanceStart",new t.InterleavedBufferAttribute(n,3,0)),this.setAttribute("instanceEnd",new t.InterleavedBufferAttribute(n,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,i=3){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));let r=new t.InstancedInterleavedBuffer(n,2*i,1);return this.setAttribute("instanceColorStart",new t.InterleavedBufferAttribute(r,i,0)),this.setAttribute("instanceColorEnd",new t.InterleavedBufferAttribute(r,i,i)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new t.WireframeGeometry(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new t.Box3);let e=this.attributes.instanceStart,n=this.attributes.instanceEnd;void 0!==e&&void 0!==n&&(this.boundingBox.setFromBufferAttribute(e),i.setFromBufferAttribute(n),this.boundingBox.union(i))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new t.Sphere),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,i=this.attributes.instanceEnd;if(void 0!==e&&void 0!==i){let t=this.boundingSphere.center;this.boundingBox.getCenter(t);let r=0;for(let a=0,s=e.count;a<s;a++)n.fromBufferAttribute(e,a),r=Math.max(r,t.distanceToSquared(n)),n.fromBufferAttribute(i,a),r=Math.max(r,t.distanceToSquared(n));this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}e.s(["LineSegmentsGeometry",0,r])},74452,(e,t,i)=>{t.exports={vpp:{angles:[52,60,75,90,110,120,135,150],speeds:[6,8,10,12,14,16,20],52:[4.98,5.86,6.31,6.45,6.51,6.52,6.41],60:[5.25,6.11,6.56,6.73,6.79,6.82,6.79],75:[5.45,6.33,6.77,7.01,7.13,7.2,7.24],90:[5.66,6.55,7,7.25,7.38,7.53,7.7],110:[5.49,6.49,7.04,7.4,7.69,7.97,8.38],120:[5.32,6.36,6.97,7.39,7.77,8.1,8.6],135:[4.81,5.92,6.68,7.15,7.55,7.95,8.85],150:[4.09,5.17,6.04,6.61,6.99,7.31,7.93],beat_angle:[43.6,42,41.2,41.2,41.7,42.1,44.2],beat_vmg:[3.26,3.91,4.24,4.34,4.36,4.34,4.16],run_angle:[144.8,147.8,148.5,149.6,171.8,175.4,177.2],run_vmg:[3.54,4.48,5.23,5.73,6.17,6.67,7.36]}}},539,e=>{"use strict";var t=e.i(74452);let i=180/Math.PI,n=t.default.vpp,r=(e,t,i)=>e+(t-e)*i,a=(e,t)=>{if(t<=e[0])return[0,0];let i=e.length-1;if(t>=e[i])return[i-1,1];let n=0;for(;t>e[n+1];)n++;return[n,(t-e[n])/(e[n+1]-e[n])]},s=n.speeds.map((e,t)=>(e=>{let t=n.beat_angle[e],r=n.run_angle[e],a=n.beat_vmg[e]/Math.cos(t/i),s=n.run_vmg[e]/Math.abs(Math.cos(r/i)),o=[[0,0],[.7*t,.55*a],[t,a]];for(let i of n.angles)i>t&&i<r&&o.push([i,n[String(i)][e]]);return o.push([r,s]),r<180&&o.push([180,n.run_vmg[e]]),o})(t)),o=(e,t)=>{let[i,n]=a(e.map(e=>e[0]),t);return r(e[i][1],e[i+1][1],n)},l=(e,t)=>{if(!Number.isFinite(e)||!Number.isFinite(t)||e<=0)return null;let i=Math.min(180,Math.abs((t+540)%360-180)),l=n.speeds;if(e<l[0])return o(s[0],i)*(e/l[0]);let[d,u]=a(l,e);return r(o(s[d],i),o(s[d+1],i),u)},d=(e,t)=>{let[i,s]=a(n.speeds,t);return r(e[i],e[i+1],s)},u=(e,t)=>{let n=l(1.943844*e,t*i);return null===n?null:n/1.943844},c=e=>{let t=(e+Math.PI)%(2*Math.PI);return t<0&&(t+=2*Math.PI),t-Math.PI};e.s(["bestVmcHeading",0,({twd:e,tws:t,bearing:n})=>{if(![e,t,n].every(Number.isFinite)||t<=0)return null;let r=null;for(let a=-100;a<=100;a++){let s=n+a/i,o=u(t,c(e-s));if(null===o)continue;let l=o*Math.cos(s-n);(!r||l>r.vmc)&&(r={heading:c(s),speed:o,vmc:l})}return r},"optimalDownwind",0,e=>{if(!Number.isFinite(e)||e<=0)return null;let t=d(n.run_angle,e),r=l(e,t);return{twa:t,speed:r,vmg:-r*Math.cos(t/i)}},"optimalUpwind",0,e=>{if(!Number.isFinite(e)||e<=0)return null;let t=d(n.beat_angle,e),r=l(e,t);return{twa:t,speed:r,vmg:r*Math.cos(t/i)}},"polarSpeed",0,l,"polarSpeedSi",0,u,"vmcForHeading",0,({twd:e,tws:t,bearing:i,heading:n})=>{if(![e,t,i,n].every(Number.isFinite))return null;let r=u(t,c(e-n));return null===r?null:r*Math.cos(n-i)},"wrapPi",0,c])}]);