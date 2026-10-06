(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,78461,e=>{"use strict";var t=e.i(71645),n=e.i(85709),i=e.i(67561);let r=["navigation.headingTrue","navigation.headingMagnetic","navigation.courseOverGroundTrue","navigation.courseOverGroundMagnetic","navigation.position"],a=null;e.s(["default",0,()=>{let{convertLatLonToXY:e}=(0,i.useOcearoContext)(),o=(0,n.useSignalKPaths)(r),s=o["navigation.headingTrue"]??o["navigation.headingMagnetic"]??o["navigation.courseOverGroundTrue"]??o["navigation.courseOverGroundMagnetic"],l=Number.isFinite(s),u=o["navigation.position"],c=Number.isFinite(u?.latitude)&&Number.isFinite(u?.longitude);return{heading:l?s:0,offset:(0,t.useMemo)(()=>{if(!c)return{x:0,y:0};let t={lat:u.latitude,lon:u.longitude};return e(t,(a||(a=t),a))},[u,c,e]),hasFix:c,hasHeading:l}}])},5941,e=>{"use strict";let t=[1,.8,.6];function n(e){return t[Math.min(Math.max(e,0),2)]}function i(e,t){return Math.max(.05,Math.min(1,1-.6*e-.3*t))}function r(e,t){return Math.PI/6*Math.max(0,1-1.9438444924574*t/30)*(1-e)}function a(e,t,n){let i=Math.min(1,1.9438444924574*(e.tws||0)/30),r=t.tension||.5;switch(n){case"mainSheet":return Math.min(1,.5*i+.3*r+.3*t.mainCar);case"jibSheet":return Math.min(1,.5*i+.3*r+.3*t.jibCar);case"vang":return Math.min(1,.6*i+.4*r);case"cunningham":return Math.min(1,.4*i+.6*r);case"backstay":return Math.min(1,Math.max(0,1-Math.abs(Math.atan2(Math.sin(e.awa||0),Math.cos(e.awa||0)))/Math.PI)*i*.9+.3*r);default:return r}}function o(e){let t=Math.max(0,Math.min(1,e));if(t<=.5){let e=2*t;return{r:e,g:1-.3*e,b:0}}return{r:1,g:.7*(1-(t-.5)*2),b:0}}e.s(["getReefHeightFactor",0,n,"tensionToColor",0,o,"updateSailTrim",0,function({tws:e=0,twa:t=0,awa:s=0,mainCar:l=.5,jibCar:u=.5,tension:c=.5}){let d,f=(d=1.9438444924574*e)>25?2:+(d>18),p=n(f),m=i(l,c),h=i(u,c),v=r(l,e),g=r(u,e),y={tws:e,twa:t,awa:s},b={mainCar:l,jibCar:u,tension:c},x={mainSheet:a(y,b,"mainSheet"),jibSheet:a(y,b,"jibSheet"),vang:a(y,b,"vang"),cunningham:a(y,b,"cunningham"),backstay:a(y,b,"backstay")},w={mainSheet:o(x.mainSheet),jibSheet:o(x.jibSheet),vang:o(x.vang),cunningham:o(x.cunningham),backstay:o(x.backstay)};return{reefLevel:f,reefHeightFactor:p,mainCamber:m,jibCamber:h,mainTwist:v,jibTwist:g,tensions:x,tensionColors:w}}])},77291,24752,e=>{"use strict";var t=e.i(71645),n=e.i(62588),i=e.i(85709),r=e.i(61969),a=e.i(539);let o=Math.PI/180,s={power:1,sail:2,fishing:3,restricted:4},l=e=>{let t=String(e.navState||"").toLowerCase();if(/not under command|restricted|constrained/.test(t))return"restricted";if(/fishing/.test(t))return"fishing";if(/sailing/.test(t))return"sail";if(/motoring|engine/.test(t))return"power";let n=Number(e.shipType);return 36===n?"sail":30===n?"fishing":33===n?"restricted":"power"},u=(e,t,n)=>(0,a.wrapPi)(Math.atan2(t.x-e.x,t.y-e.y)-n),c=(e,t,n)=>{let i={x:0,y:0},r=u(i,t,e.course),l=u(t,i,t.course),c=Math.sign(l)||1,d=e=>Math.abs(e)>112.5*o;if(d(r)&&t.speed>e.speed)return{ownRole:"stand-on",rule:"13",reason:"overtakenByTarget",targetTurn:0};if(d(l)&&e.speed>t.speed)return{ownRole:"give-way",rule:"13",reason:"overtaking",targetTurn:0};let f=s[e.category]??1,p=s[t.category]??1;if(f!==p)return f<p?{ownRole:"give-way",rule:"18",reason:`giveWayTo_${t.category}`,targetTurn:0}:{ownRole:"stand-on",rule:"18",reason:`standOnFrom_${t.category}`,targetTurn:c};if("sail"===e.category&&Number.isFinite(n)){let i=(0,a.wrapPi)(n-e.course)>=0?"starboard":"port";return i!==((0,a.wrapPi)(n-t.course)>=0?"starboard":"port")?"port"===i?{ownRole:"give-way",rule:"12a-i",reason:"portTack",targetTurn:0}:{ownRole:"stand-on",rule:"12a-i",reason:"targetPortTack",targetTurn:c}:t.x*Math.sin(n)+t.y*Math.cos(n)>0?{ownRole:"stand-on",rule:"12a-ii",reason:"targetWindward",targetTurn:c}:{ownRole:"give-way",rule:"12a-ii",reason:"ownWindward",targetTurn:0}}return Math.abs((0,a.wrapPi)(t.course-e.course-Math.PI))<10*o&&Math.abs(r)<6*o?{ownRole:"both",rule:"14",reason:"headOn",targetTurn:1}:r>0?{ownRole:"give-way",rule:"15",reason:"crossingStarboard",targetTurn:0}:{ownRole:"stand-on",rule:"15",reason:"crossingPort",targetTurn:c}};e.s(["rightOfWay",0,c,"targetCategory",0,l],24752);var d=e.i(83402),f=e.i(67561);let p=[],m=["navigation.speedOverGround","navigation.courseOverGroundTrue"];e.s(["default",0,({always:e=!1}={})=>{let a,o,{targets:s}=(0,n.useAIS)({passive:!0}),{states:u}=(0,f.useOcearoContext)(),h=e||u.ais?s:p,{twd:v,heading:g}=(0,r.default)(),y=(0,i.useSignalKPaths)(m),b=(a=(0,i.useSignalKPrefix)("propulsion."),o=d.default.get("ownVesselCategory"),(0,t.useMemo)(()=>"sail"===o||"power"===o?o:Object.entries(a).some(([e,t])=>e.endsWith(".revolutions")&&Number(t)>.5||e.endsWith(".state")&&"started"===t)?"power":"sail",[a,o])),x=d.default.get("aisLengthScalingFactor")||.7;return(0,t.useMemo)(()=>{let e=y["navigation.courseOverGroundTrue"]??g,t=y["navigation.speedOverGround"]??0,n=[];if(Number.isFinite(e))for(let i of h){if("danger"!==i.risk)continue;let r=i.cog??i.cogMagnetic??i.heading;if(!Number.isFinite(r)||null===i.sceneX)continue;let a=c({course:e,speed:t,category:b},{x:i.sceneX/x,y:-i.sceneZ/x,course:r,speed:i.sog??0,category:l(i)},v);n.push({target:{...i},role:a})}n.sort((e,t)=>(e.target.tcpaSeconds??1/0)-(t.target.tcpaSeconds??1/0));let i={};for(let e of h)"close"===e.risk?i[e.mmsi]="close":"danger"===e.risk&&(i[e.mmsi]="giveWay");for(let e of n)i[e.target.mmsi]="stand-on"===e.role.ownRole?"yields":"giveWay";let r=n.filter(e=>"stand-on"!==e.role.ownRole);return{ownCategory:b,encounters:n,statuses:i,giveWay:r.length>0,giveWayTo:r[0]||null,primary:n[0]||null}},[h,v,g,y,b,x])}],77291)},61969,e=>{"use strict";var t=e.i(71645),n=e.i(85709),i=e.i(539);let r=180/Math.PI,a=["navigation.speedThroughWater","navigation.speedOverGround","navigation.headingTrue","navigation.courseOverGroundTrue","environment.wind.speedTrue","environment.wind.angleTrueWater","environment.wind.directionTrue","performance.polarSpeed","performance.polarSpeedRatio","navigation.courseGreatCircle.nextPoint.bearingTrue"];e.s(["default",0,()=>{let e=(0,n.useSignalKPaths)(a);return(0,t.useMemo)(()=>{let t=e["navigation.speedThroughWater"]??e["navigation.speedOverGround"]??null,n=e["navigation.headingTrue"]??e["navigation.courseOverGroundTrue"]??null,a=e["environment.wind.speedTrue"]??null,o=e["environment.wind.angleTrueWater"]??null,s=e["environment.wind.directionTrue"]??null;null===s&&Number.isFinite(o)&&Number.isFinite(n)&&(s=(0,i.wrapPi)(n+o));let l=e["performance.polarSpeed"]??(Number.isFinite(a)&&Number.isFinite(o)?(0,i.polarSpeedSi)(a,o):null),u=e["performance.polarSpeedRatio"]??null;null===u&&Number.isFinite(t)&&Number.isFinite(l)&&l>.2&&(u=t/l);let c=Number.isFinite(t)&&Number.isFinite(l)?(t-l)*1.943844:null,d=null,f=null,p=!Number.isFinite(o)||Math.abs(o)<Math.PI/2;if(Number.isFinite(a)){let e=p?(0,i.optimalUpwind)(1.943844*a):(0,i.optimalDownwind)(1.943844*a);e&&(d=e.twa/r,Number.isFinite(s)&&Number.isFinite(o)&&(f=(0,i.wrapPi)(s-Math.sign(o||1)*d)))}let m=e["navigation.courseGreatCircle.nextPoint.bearingTrue"],h=null;if(Number.isFinite(m)&&Number.isFinite(s)&&Number.isFinite(a)){let e=(0,i.bestVmcHeading)({twd:s,tws:a,bearing:m}),t=Number.isFinite(n)?(0,i.vmcForHeading)({twd:s,tws:a,bearing:m,heading:n}):null;h=e?{bearing:m,best:e,current:t}:null}return{ratio:u,polarSpeed:l,boatSpeed:t,deltaKn:c,heading:n,twd:s,tws:a,twa:o,targetTwa:d,targetHeading:f,upwind:p,vmc:h}},[e])}])},83646,e=>{"use strict";var t=e.i(67561);e.s(["default",0,()=>(0,t.useOcearoContext)().tokens])},31067,e=>{"use strict";function t(){return(t=Object.assign.bind()).apply(null,arguments)}e.s(["default",()=>t])},43216,e=>{"use strict";let t,n;var i=e.i(31067),r=e.i(71645),a=e.i(90072),o=e.i(90874),s=a,l=e.i(32533),u=a,c=e.i(8560),d=e.i(31497);class f extends u.ShaderMaterial{constructor(e){super({type:"LineMaterial",uniforms:u.UniformsUtils.clone(u.UniformsUtils.merge([c.UniformsLib.common,c.UniformsLib.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new u.Vector2(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
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
					#include <${d.version>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(e){this.uniforms.diffuse.value=e}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(e){!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(e){this.uniforms.linewidth.value=e}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(e){!!e!="USE_DASH"in this.defines&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(e){this.uniforms.dashScale.value=e}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(e){this.uniforms.dashSize.value=e}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(e){this.uniforms.dashOffset.value=e}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(e){this.uniforms.gapSize.value=e}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(e){this.uniforms.opacity.value=e}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(e){this.uniforms.resolution.value.copy(e)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(e){!!e!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),!0===e?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}let p=d.version>=125?"uv1":"uv2",m=new s.Vector4,h=new s.Vector3,v=new s.Vector3,g=new s.Vector4,y=new s.Vector4,b=new s.Vector4,x=new s.Vector3,w=new s.Matrix4,S=new s.Line3,M=new s.Vector3,E=new s.Box3,_=new s.Sphere,A=new s.Vector4;function P(e,t,i){return A.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),A.multiplyScalar(1/A.w),A.x=n/i.width,A.y=n/i.height,A.applyMatrix4(e.projectionMatrixInverse),A.multiplyScalar(1/A.w),Math.abs(Math.max(A.x,A.y))}class T extends s.Mesh{constructor(e=new l.LineSegmentsGeometry,t=new f({color:0xffffff*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,n=e.attributes.instanceEnd,i=new Float32Array(2*t.count);for(let e=0,r=0,a=t.count;e<a;e++,r+=2)h.fromBufferAttribute(t,e),v.fromBufferAttribute(n,e),i[r]=0===r?0:i[r-1],i[r+1]=i[r]+h.distanceTo(v);let r=new s.InstancedInterleavedBuffer(i,2,1);return e.setAttribute("instanceDistanceStart",new s.InterleavedBufferAttribute(r,1,0)),e.setAttribute("instanceDistanceEnd",new s.InterleavedBufferAttribute(r,1,1)),this}raycast(e,i){let r,a,o=this.material.worldUnits,l=e.camera;null!==l||o||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');let u=void 0!==e.params.Line2&&e.params.Line2.threshold||0;t=e.ray;let c=this.matrixWorld,d=this.geometry,f=this.material;if(n=f.linewidth+u,null===d.boundingSphere&&d.computeBoundingSphere(),_.copy(d.boundingSphere).applyMatrix4(c),o)r=.5*n;else{let e=Math.max(l.near,_.distanceToPoint(t.origin));r=P(l,e,f.resolution)}if(_.radius+=r,!1!==t.intersectsSphere(_)){if(null===d.boundingBox&&d.computeBoundingBox(),E.copy(d.boundingBox).applyMatrix4(c),o)a=.5*n;else{let e=Math.max(l.near,E.distanceToPoint(t.origin));a=P(l,e,f.resolution)}E.expandByScalar(a),!1!==t.intersectsBox(E)&&(o?function(e,i){let r=e.matrixWorld,a=e.geometry,o=a.attributes.instanceStart,l=a.attributes.instanceEnd,u=Math.min(a.instanceCount,o.count);for(let a=0;a<u;a++){S.start.fromBufferAttribute(o,a),S.end.fromBufferAttribute(l,a),S.applyMatrix4(r);let u=new s.Vector3,c=new s.Vector3;t.distanceSqToSegment(S.start,S.end,c,u),c.distanceTo(u)<.5*n&&i.push({point:c,pointOnLine:u,distance:t.origin.distanceTo(c),object:e,face:null,faceIndex:a,uv:null,[p]:null})}}(this,i):function(e,i,r){let a=i.projectionMatrix,o=e.material.resolution,l=e.matrixWorld,u=e.geometry,c=u.attributes.instanceStart,d=u.attributes.instanceEnd,f=Math.min(u.instanceCount,c.count),m=-i.near;t.at(1,b),b.w=1,b.applyMatrix4(i.matrixWorldInverse),b.applyMatrix4(a),b.multiplyScalar(1/b.w),b.x*=o.x/2,b.y*=o.y/2,b.z=0,x.copy(b),w.multiplyMatrices(i.matrixWorldInverse,l);for(let i=0;i<f;i++){if(g.fromBufferAttribute(c,i),y.fromBufferAttribute(d,i),g.w=1,y.w=1,g.applyMatrix4(w),y.applyMatrix4(w),g.z>m&&y.z>m)continue;if(g.z>m){let e=g.z-y.z,t=(g.z-m)/e;g.lerp(y,t)}else if(y.z>m){let e=y.z-g.z,t=(y.z-m)/e;y.lerp(g,t)}g.applyMatrix4(a),y.applyMatrix4(a),g.multiplyScalar(1/g.w),y.multiplyScalar(1/y.w),g.x*=o.x/2,g.y*=o.y/2,y.x*=o.x/2,y.y*=o.y/2,S.start.copy(g),S.start.z=0,S.end.copy(y),S.end.z=0;let u=S.closestPointToPointParameter(x,!0);S.at(u,M);let f=s.MathUtils.lerp(g.z,y.z,u),h=f>=-1&&f<=1,v=x.distanceTo(M)<.5*n;if(h&&v){S.start.fromBufferAttribute(c,i),S.end.fromBufferAttribute(d,i),S.start.applyMatrix4(l),S.end.applyMatrix4(l);let n=new s.Vector3,a=new s.Vector3;t.distanceSqToSegment(S.start,S.end,a,n),r.push({point:a,pointOnLine:n,distance:t.origin.distanceTo(a),object:e,face:null,faceIndex:i,uv:null,[p]:null})}}}(this,l,i))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(m),this.material.uniforms.resolution.value.set(m.z,m.w))}}var L=l;class O extends L.LineSegmentsGeometry{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,n=new Float32Array(2*t);for(let i=0;i<t;i+=3)n[2*i]=e[i],n[2*i+1]=e[i+1],n[2*i+2]=e[i+2],n[2*i+3]=e[i+3],n[2*i+4]=e[i+4],n[2*i+5]=e[i+5];return super.setPositions(n),this}setColors(e,t=3){let n=e.length-t,i=new Float32Array(2*n);if(3===t)for(let r=0;r<n;r+=t)i[2*r]=e[r],i[2*r+1]=e[r+1],i[2*r+2]=e[r+2],i[2*r+3]=e[r+3],i[2*r+4]=e[r+4],i[2*r+5]=e[r+5];else for(let r=0;r<n;r+=t)i[2*r]=e[r],i[2*r+1]=e[r+1],i[2*r+2]=e[r+2],i[2*r+3]=e[r+3],i[2*r+4]=e[r+4],i[2*r+5]=e[r+5],i[2*r+6]=e[r+6],i[2*r+7]=e[r+7];return super.setColors(i,t),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class U extends T{constructor(e=new O,t=new f({color:0xffffff*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let z=r.forwardRef(function({points:e,color:t=0xffffff,vertexColors:n,linewidth:s,lineWidth:u,segments:c,dashed:d,...p},m){var h,v;let g=(0,o.useThree)(e=>e.size),y=r.useMemo(()=>c?new T:new U,[c]),[b]=r.useState(()=>new f),x=(null==n||null==(h=n[0])?void 0:h.length)===4?4:3,w=r.useMemo(()=>{let i=c?new l.LineSegmentsGeometry:new O,r=e.map(e=>{let t=Array.isArray(e);return e instanceof a.Vector3||e instanceof a.Vector4?[e.x,e.y,e.z]:e instanceof a.Vector2?[e.x,e.y,0]:t&&3===e.length?[e[0],e[1],e[2]]:t&&2===e.length?[e[0],e[1],0]:e});if(i.setPositions(r.flat()),n){t=0xffffff;let e=n.map(e=>e instanceof a.Color?e.toArray():e);i.setColors(e.flat(),x)}return i},[e,c,n,x]);return r.useLayoutEffect(()=>{y.computeLineDistances()},[e,y]),r.useLayoutEffect(()=>{d?b.defines.USE_DASH="":delete b.defines.USE_DASH,b.needsUpdate=!0},[d,b]),r.useEffect(()=>()=>{w.dispose(),b.dispose()},[w]),r.createElement("primitive",(0,i.default)({object:y,ref:m},p),r.createElement("primitive",{object:w,attach:"geometry"}),r.createElement("primitive",(0,i.default)({object:b,attach:"material",color:t,vertexColors:!!n,resolution:[g.width,g.height],linewidth:null!=(v=null!=s?s:u)?v:1,dashed:d,transparent:4===x},p)))});e.s(["Line",0,z],43216)},60099,95393,e=>{"use strict";let t,n;var i=e.i(31067),r=e.i(71645),a=e.i(88014),o=e.i(90072),s=e.i(90874),l=e.i(61949);e.s(["useFrame",()=>l.F],95393);var l=l;let u=new o.Vector3,c=new o.Vector3,d=new o.Vector3,f=new o.Vector2;function p(e,t,n){let i=u.setFromMatrixPosition(e.matrixWorld);i.project(t);let r=n.width/2,a=n.height/2;return[i.x*r+r,-(i.y*a)+a]}let m=e=>1e-10>Math.abs(e)?0:e;function h(e,t,n=""){let i="matrix3d(";for(let n=0;16!==n;n++)i+=m(t[n]*e.elements[n])+(15!==n?",":")");return n+i}let v=(t=[1,-1,1,1,1,-1,1,1,1,-1,1,1,1,-1,1,1],e=>h(e,t)),g=(n=e=>[1/e,1/e,1/e,1,-1/e,-1/e,-1/e,-1,1/e,1/e,1/e,1,1,1,1,1],(e,t)=>h(e,n(t),"translate(-50%,-50%)")),y=r.forwardRef(({children:e,eps:t=.001,style:n,className:h,prepend:y,center:b,fullscreen:x,portal:w,distanceFactor:S,sprite:M=!1,transform:E=!1,occlude:_,onOcclude:A,castShadow:P,receiveShadow:T,material:L,geometry:O,zIndexRange:U=[0x1000037,0],calculatePosition:z=p,as:C="div",wrapperClass:F,pointerEvents:R="auto",...B},N)=>{let{gl:I,camera:W,scene:D,size:j,raycaster:H,events:V,viewport:G}=(0,s.useThree)(),[k]=r.useState(()=>document.createElement(C)),$=r.useRef(null),q=r.useRef(null),K=r.useRef(0),X=r.useRef([0,0]),Z=r.useRef(null),J=r.useRef(null),Q=(null==w?void 0:w.current)||V.connected||I.domElement.parentNode,Y=r.useRef(null),ee=r.useRef(!1),et=r.useMemo(()=>{var e;return _&&"blending"!==_||Array.isArray(_)&&_.length&&(e=_[0])&&"object"==typeof e&&"current"in e},[_]);r.useLayoutEffect(()=>{let e=I.domElement;_&&"blending"===_?(e.style.zIndex=`${Math.floor(U[0]/2)}`,e.style.position="absolute",e.style.pointerEvents="none"):(e.style.zIndex=null,e.style.position=null,e.style.pointerEvents=null)},[_]),r.useLayoutEffect(()=>{if(q.current){let e=$.current=a.createRoot(k);if(D.updateMatrixWorld(),E)k.style.cssText="position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;";else{let e=z(q.current,W,j);k.style.cssText=`position:absolute;top:0;left:0;transform:translate3d(${e[0]}px,${e[1]}px,0);transform-origin:0 0;`}return Q&&(y?Q.prepend(k):Q.appendChild(k)),()=>{Q&&Q.removeChild(k),e.unmount()}}},[Q,E]),r.useLayoutEffect(()=>{F&&(k.className=F)},[F]);let en=r.useMemo(()=>E?{position:"absolute",top:0,left:0,width:j.width,height:j.height,transformStyle:"preserve-3d",pointerEvents:"none"}:{position:"absolute",transform:b?"translate3d(-50%,-50%,0)":"none",...x&&{top:-j.height/2,left:-j.width/2,width:j.width,height:j.height},...n},[n,b,x,j,E]),ei=r.useMemo(()=>({position:"absolute",pointerEvents:R}),[R]);r.useLayoutEffect(()=>{var t,i;ee.current=!1,E?null==(t=$.current)||t.render(r.createElement("div",{ref:Z,style:en},r.createElement("div",{ref:J,style:ei},r.createElement("div",{ref:N,className:h,style:n,children:e})))):null==(i=$.current)||i.render(r.createElement("div",{ref:N,style:en,className:h,children:e}))});let er=r.useRef(!0);(0,l.F)(e=>{if(q.current){W.updateMatrixWorld(),q.current.updateWorldMatrix(!0,!1);let e=E?X.current:z(q.current,W,j);if(E||Math.abs(K.current-W.zoom)>t||Math.abs(X.current[0]-e[0])>t||Math.abs(X.current[1]-e[1])>t){var n;let t,i,r,a,s=(n=q.current,t=u.setFromMatrixPosition(n.matrixWorld),i=c.setFromMatrixPosition(W.matrixWorld),r=t.sub(i),a=W.getWorldDirection(d),r.angleTo(a)>Math.PI/2),l=!1;et&&(Array.isArray(_)?l=_.map(e=>e.current):"blending"!==_&&(l=[D]));let p=er.current;l?er.current=function(e,t,n,i){let r=u.setFromMatrixPosition(e.matrixWorld),a=r.clone();a.project(t),f.set(a.x,a.y),n.setFromCamera(f,t);let o=n.intersectObjects(i,!0);if(o.length){let e=o[0].distance;return r.distanceTo(n.ray.origin)<e}return!0}(q.current,W,H,l)&&!s:er.current=!s,p!==er.current&&(A?A(!er.current):k.style.display=er.current?"block":"none");let h=Math.floor(U[0]/2),y=_?et?[U[0],h]:[h-1,0]:U;if(k.style.zIndex=`${function(e,t,n){if(t instanceof o.PerspectiveCamera||t instanceof o.OrthographicCamera){let i=u.setFromMatrixPosition(e.matrixWorld),r=c.setFromMatrixPosition(t.matrixWorld),a=i.distanceTo(r),o=(n[1]-n[0])/(t.far-t.near),s=n[1]-o*t.far;return Math.round(o*a+s)}}(q.current,W,y)}`,E){let[e,t]=[j.width/2,j.height/2],n=W.projectionMatrix.elements[5]*t,{isOrthographicCamera:i,top:r,left:a,bottom:o,right:s}=W,l=v(W.matrixWorldInverse),u=i?`scale(${n})translate(${m(-(s+a)/2)}px,${m((r+o)/2)}px)`:`translateZ(${n}px)`,c=q.current.matrixWorld;M&&((c=W.matrixWorldInverse.clone().transpose().copyPosition(c).scale(q.current.scale)).elements[3]=c.elements[7]=c.elements[11]=0,c.elements[15]=1),k.style.width=j.width+"px",k.style.height=j.height+"px",k.style.perspective=i?"":`${n}px`,Z.current&&J.current&&(Z.current.style.transform=`${u}${l}translate(${e}px,${t}px)`,J.current.style.transform=g(c,1/((S||10)/400)))}else{let t=void 0===S?1:function(e,t){if(t instanceof o.OrthographicCamera)return t.zoom;if(!(t instanceof o.PerspectiveCamera))return 1;{let n=u.setFromMatrixPosition(e.matrixWorld),i=c.setFromMatrixPosition(t.matrixWorld);return 1/(2*Math.tan(t.fov*Math.PI/180/2)*n.distanceTo(i))}}(q.current,W)*S;k.style.transform=`translate3d(${e[0]}px,${e[1]}px,0) scale(${t})`}X.current=e,K.current=W.zoom}}if(!et&&Y.current&&!ee.current)if(E){if(Z.current){let e=Z.current.children[0];if(null!=e&&e.clientWidth&&null!=e&&e.clientHeight){let{isOrthographicCamera:t}=W;if(t||O)B.scale&&(Array.isArray(B.scale)?B.scale instanceof o.Vector3?Y.current.scale.copy(B.scale.clone().divideScalar(1)):Y.current.scale.set(1/B.scale[0],1/B.scale[1],1/B.scale[2]):Y.current.scale.setScalar(1/B.scale));else{let t=(S||10)/400,n=e.clientWidth*t,i=e.clientHeight*t;Y.current.scale.set(n,i,1)}ee.current=!0}}}else{let t=k.children[0];if(null!=t&&t.clientWidth&&null!=t&&t.clientHeight){let e=1/G.factor,n=t.clientWidth*e,i=t.clientHeight*e;Y.current.scale.set(n,i,1),ee.current=!0}Y.current.lookAt(e.camera.position)}});let ea=r.useMemo(()=>({vertexShader:E?void 0:`
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
      `}),[E]);return r.createElement("group",(0,i.default)({},B,{ref:q}),_&&!et&&r.createElement("mesh",{castShadow:P,receiveShadow:T,ref:Y},O||r.createElement("planeGeometry",null),L||r.createElement("shaderMaterial",{side:o.DoubleSide,vertexShader:ea.vertexShader,fragmentShader:ea.fragmentShader})))});e.s(["Html",0,y],60099)},31497,e=>{"use strict";let t=parseInt(e.i(90072).REVISION.replace(/\D+/g,""));e.s(["version",0,t])},32533,e=>{"use strict";var t=e.i(90072);let n=new t.Box3,i=new t.Vector3;class r extends t.InstancedBufferGeometry{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new t.Float32BufferAttribute([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new t.Float32BufferAttribute([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,n=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),n.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));let i=new t.InstancedInterleavedBuffer(n,6,1);return this.setAttribute("instanceStart",new t.InterleavedBufferAttribute(i,3,0)),this.setAttribute("instanceEnd",new t.InterleavedBufferAttribute(i,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,n=3){let i;e instanceof Float32Array?i=e:Array.isArray(e)&&(i=new Float32Array(e));let r=new t.InstancedInterleavedBuffer(i,2*n,1);return this.setAttribute("instanceColorStart",new t.InterleavedBufferAttribute(r,n,0)),this.setAttribute("instanceColorEnd",new t.InterleavedBufferAttribute(r,n,n)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new t.WireframeGeometry(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new t.Box3);let e=this.attributes.instanceStart,i=this.attributes.instanceEnd;void 0!==e&&void 0!==i&&(this.boundingBox.setFromBufferAttribute(e),n.setFromBufferAttribute(i),this.boundingBox.union(n))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new t.Sphere),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,n=this.attributes.instanceEnd;if(void 0!==e&&void 0!==n){let t=this.boundingSphere.center;this.boundingBox.getCenter(t);let r=0;for(let a=0,o=e.count;a<o;a++)i.fromBufferAttribute(e,a),r=Math.max(r,t.distanceToSquared(i)),i.fromBufferAttribute(n,a),r=Math.max(r,t.distanceToSquared(i));this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}e.s(["LineSegmentsGeometry",0,r])},74452,(e,t,n)=>{t.exports={vpp:{angles:[52,60,75,90,110,120,135,150],speeds:[6,8,10,12,14,16,20],52:[4.98,5.86,6.31,6.45,6.51,6.52,6.41],60:[5.25,6.11,6.56,6.73,6.79,6.82,6.79],75:[5.45,6.33,6.77,7.01,7.13,7.2,7.24],90:[5.66,6.55,7,7.25,7.38,7.53,7.7],110:[5.49,6.49,7.04,7.4,7.69,7.97,8.38],120:[5.32,6.36,6.97,7.39,7.77,8.1,8.6],135:[4.81,5.92,6.68,7.15,7.55,7.95,8.85],150:[4.09,5.17,6.04,6.61,6.99,7.31,7.93],beat_angle:[43.6,42,41.2,41.2,41.7,42.1,44.2],beat_vmg:[3.26,3.91,4.24,4.34,4.36,4.34,4.16],run_angle:[144.8,147.8,148.5,149.6,171.8,175.4,177.2],run_vmg:[3.54,4.48,5.23,5.73,6.17,6.67,7.36]}}},539,e=>{"use strict";var t=e.i(74452);let n=180/Math.PI,i=t.default.vpp,r=(e,t,n)=>e+(t-e)*n,a=(e,t)=>{if(t<=e[0])return[0,0];let n=e.length-1;if(t>=e[n])return[n-1,1];let i=0;for(;t>e[i+1];)i++;return[i,(t-e[i])/(e[i+1]-e[i])]},o=i.speeds.map((e,t)=>(e=>{let t=i.beat_angle[e],r=i.run_angle[e],a=i.beat_vmg[e]/Math.cos(t/n),o=i.run_vmg[e]/Math.abs(Math.cos(r/n)),s=[[0,0],[.7*t,.55*a],[t,a]];for(let n of i.angles)n>t&&n<r&&s.push([n,i[String(n)][e]]);return s.push([r,o]),r<180&&s.push([180,i.run_vmg[e]]),s})(t)),s=(e,t)=>{let[n,i]=a(e.map(e=>e[0]),t);return r(e[n][1],e[n+1][1],i)},l=(e,t)=>{if(!Number.isFinite(e)||!Number.isFinite(t)||e<=0)return null;let n=Math.min(180,Math.abs((t+540)%360-180)),l=i.speeds;if(e<l[0])return s(o[0],n)*(e/l[0]);let[u,c]=a(l,e);return r(s(o[u],n),s(o[u+1],n),c)},u=(e,t)=>{let[n,o]=a(i.speeds,t);return r(e[n],e[n+1],o)},c=(e,t)=>{let i=l(1.943844*e,t*n);return null===i?null:i/1.943844},d=e=>{let t=(e+Math.PI)%(2*Math.PI);return t<0&&(t+=2*Math.PI),t-Math.PI};e.s(["bestVmcHeading",0,({twd:e,tws:t,bearing:i})=>{if(![e,t,i].every(Number.isFinite)||t<=0)return null;let r=null;for(let a=-100;a<=100;a++){let o=i+a/n,s=c(t,d(e-o));if(null===s)continue;let l=s*Math.cos(o-i);(!r||l>r.vmc)&&(r={heading:d(o),speed:s,vmc:l})}return r},"optimalDownwind",0,e=>{if(!Number.isFinite(e)||e<=0)return null;let t=u(i.run_angle,e),r=l(e,t);return{twa:t,speed:r,vmg:-r*Math.cos(t/n)}},"optimalUpwind",0,e=>{if(!Number.isFinite(e)||e<=0)return null;let t=u(i.beat_angle,e),r=l(e,t);return{twa:t,speed:r,vmg:r*Math.cos(t/n)}},"polarSpeed",0,l,"polarSpeedSi",0,c,"vmcForHeading",0,({twd:e,tws:t,bearing:n,heading:i})=>{if(![e,t,n,i].every(Number.isFinite))return null;let r=c(t,d(e-i));return null===r?null:r*Math.cos(i-n)},"wrapPi",0,d])}]);