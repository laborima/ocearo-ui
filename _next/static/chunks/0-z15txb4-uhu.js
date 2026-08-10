(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,62588,e=>{"use strict";var t=e.i(43476),n=e.i(71645);e.i(49018);var i=e.i(83402),a=e.i(66799),r=e.i(67561),o=e.i(85709);let s=(0,n.createContext)(),l=(e,t,n,i)=>{let a=n.split(".").reduce((e,t)=>e?.[t],i);void 0!==a&&(e[t]=a)};e.s(["AISProvider",0,({children:e})=>{let[u,c]=(0,n.useState)({}),[d,f]=(0,n.useState)([]),p=(0,n.useRef)(null),h=(0,n.useRef)({}),v=(0,n.useRef)(null),{convertLatLonToXY:m}=(0,r.useOcearoContext)(),g=(0,o.useSignalKPath)("navigation.position"),y=(0,n.useRef)(),S=(0,n.useRef)(),b=(0,n.useCallback)(e=>{if(e.latitude&&e.longitude&&g&&g.latitude&&g.longitude&&e.latitude!=g.latitude&&e.longitude!=g.longitude){let t=i.default.get("aisLengthScalingFactor")||.7,{x:n,y:a}=m({lat:e.latitude,lon:e.longitude},{lat:g.latitude,lon:g.longitude});e.sceneX=n*t,e.sceneZ=-a*t,e.rotationAngleY=(e=>{if(!e)return 0;let t=e.heading||e.headingMagnetic;return e.cog||e.cogMagnetic||t||0})(e),e.distanceMeters=Math.sqrt(n**2+a**2);let r=e.visible;return e.visible=e.distanceMeters>10&&e.distanceMeters<=5e3,r!==e.visible}return!1},[g,m]),w=(0,n.useCallback)(()=>{v.current&&(clearTimeout(v.current),v.current=null);let e=Object.values(u).filter(e=>e.visible);((e,t)=>{if(e.length!==t.length)return!0;let n=new Set(e.map(e=>e.mmsi)),i=new Set(t.map(e=>e.mmsi));if(n.size!==i.size)return!0;for(let e of n)if(!i.has(e))return!0;return!1})(d,e)&&(console.log(`Updating visible vessels: ${e.length} vessels`),f(e))},[u,d]),x=(0,n.useCallback)(()=>{v.current&&clearTimeout(v.current),v.current=setTimeout(()=>{w(),v.current=null},100)},[w]);return(0,n.useEffect)(()=>{y.current=b,S.current=x},[b,x]),(0,n.useEffect)(()=>{let e=setInterval(()=>{let e=Date.now();c(t=>{let n=!1,i={...t};return(Object.entries(i).forEach(([t,a])=>{e-a.lastUpdate>6e5&&(delete i[t],n=!0)}),n)?(x(),i):t})},6e4);return()=>clearInterval(e)},[x]),(0,n.useEffect)(()=>{let e=async e=>{console.log("Fetching static vessel info...");try{let t=await e.API().then(e=>e.vessels()),n=Object.entries(t).map(([e,t])=>{let n={mmsi:e};return l(n,"name","name",t),l(n,"latitude","navigation.position.value.latitude",t),l(n,"longitude","navigation.position.value.longitude",t),l(n,"sog","navigation.speedOverGround.value",t),l(n,"cog","navigation.courseOverGroundTrue.value",t),l(n,"cogMagnetic","navigation.courseOverGroundMagnetic.value",t),l(n,"heading","navigation.headingTrue.value",t),l(n,"headingMagnetic","navigation.headingMagnetic.value",t),l(n,"length","design.length.value.overall",t),l(n,"beam","design.beam.value",t),l(n,"callsign","communication.callsignVhf",t),l(n,"shipType","design.aisShipType.value.id",t),n.lastUpdate=Date.now(),n.distanceMeters=null,n.sceneX=null,n.sceneZ=null,n.rotationAngleY=null,n.visible=!1,n}),i={};if(n.forEach(e=>{e.mmsi&&"self"!=e.mmsi&&(null!==e.latitude||null!==e.longitude)&&(y.current(e),i[e.mmsi]=e)}),console.log(`Fetched ${n.length} vessels.`),Object.keys(i).length>0){console.log(`Initializing AIS data with ${Object.keys(i).length} vessels`),c(i);let e=Object.values(i).filter(e=>e.visible);f(e),console.log(`${e.length} vessels initially visible`)}}catch(e){console.error("Error fetching static info:",e)}},t=e=>{if(!e?.updates)return void console.warn("Missing delta or no updates:",e);let t=e.context.replace("vessels.","");t?(h.current[t]=Date.now(),c(n=>{let i=n[t]||{mmsi:t,name:"unknown",latitude:null,longitude:null,sog:null,cog:null,cogMagnetic:null,heading:null,headingMagnetic:null,distanceMeters:null,sceneX:null,sceneZ:null,rotationAngleY:null,visible:!1,length:null,beam:null,shipType:null};i.lastUpdate=h.current[t];let a=!1,r=!1;return e.updates.forEach(e=>{e.values&&e.values.forEach(e=>{switch(e.path){case"name":i.name=e.value;break;case"navigation.position":i.latitude=e.value.latitude,i.longitude=e.value.longitude,a=!0;break;case"navigation.speedOverGround":i.sog=e.value;break;case"navigation.courseOverGroundTrue":i.cog=e.value,r=!0;break;case"navigation.courseOverGroundMagnetic":i.cogMagnetic=e.value,r=!0;break;case"navigation.headingTrue":i.heading=e.value,r=!0;break;case"navigation.headingMagnetic":i.headingMagnetic=e.value,r=!0;break;case"design.aisShipType":i.shipType=e.value?.id??e.value;break;case"design.length":i.length=e.value?.overall??e.value;break;case"design.beam":i.beam=e.value;break;case"communication.callsignVhf":i.callsign=e.value}})}),(y.current(i)||a||r)&&S.current(),{...n,[t]:i}})):console.warn("Update without MMSI context:",e)};return(async()=>{try{let{signalkUrl:n}=i.default.getAll();if(console.log("SignalK URL:",n),!n)throw Error("SignalK URL is undefined or invalid.");console.log(`Connecting to SignalK at: ${n}`);let r=a.default.createClient({subscriptions:[{context:"vessels.*",subscribe:[{path:"navigation.position"},{path:"navigation.speedOverGround"},{path:"navigation.courseOverGroundTrue"},{path:"navigation.courseOverGroundMagnetic"},{path:"navigation.headingTrue"},{path:"navigation.headingMagnetic"},{path:"name"},{path:"design.aisShipType"},{path:"design.length"},{path:"design.beam"},{path:"communication.callsignVhf"}]}]});p.current=r,await r.connect(),console.log("SignalK client connected."),await e(r),r.on("delta",t)}catch(e){console.warn("Error connecting to SignalK:",e)}})(),()=>{console.log("Disconnecting SignalK client..."),v.current&&clearTimeout(v.current),p.current?.disconnect()}},[]),(0,t.jsx)(s.Provider,{value:{aisData:u,vesselIds:d},children:e})},"useAIS",0,()=>(0,n.useContext)(s)])},43216,e=>{"use strict";let t,n;var i=e.i(31067),a=e.i(71645),r=e.i(90072),o=e.i(28600),s=r,l=r;let u=new l.Box3,c=new l.Vector3;class d extends l.InstancedBufferGeometry{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new l.Float32BufferAttribute([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new l.Float32BufferAttribute([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,n=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),n.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new l.InstancedInterleavedBuffer(t,6,1);return this.setAttribute("instanceStart",new l.InterleavedBufferAttribute(n,3,0)),this.setAttribute("instanceEnd",new l.InterleavedBufferAttribute(n,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));let i=new l.InstancedInterleavedBuffer(n,2*t,1);return this.setAttribute("instanceColorStart",new l.InterleavedBufferAttribute(i,t,0)),this.setAttribute("instanceColorEnd",new l.InterleavedBufferAttribute(i,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new l.WireframeGeometry(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new l.Box3);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;void 0!==e&&void 0!==t&&(this.boundingBox.setFromBufferAttribute(e),u.setFromBufferAttribute(t),this.boundingBox.union(u))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new l.Sphere),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(void 0!==e&&void 0!==t){let n=this.boundingSphere.center;this.boundingBox.getCenter(n);let i=0;for(let a=0,r=e.count;a<r;a++)c.fromBufferAttribute(e,a),i=Math.max(i,n.distanceToSquared(c)),c.fromBufferAttribute(t,a),i=Math.max(i,n.distanceToSquared(c));this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}var f=r,p=e.i(8560),h=e.i(31497);class v extends f.ShaderMaterial{constructor(e){super({type:"LineMaterial",uniforms:f.UniformsUtils.clone(f.UniformsUtils.merge([p.UniformsLib.common,p.UniformsLib.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new f.Vector2(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
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
					#include <${h.version>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(e){this.uniforms.diffuse.value=e}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(e){!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(e){this.uniforms.linewidth.value=e}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(e){!!e!="USE_DASH"in this.defines&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(e){this.uniforms.dashScale.value=e}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(e){this.uniforms.dashSize.value=e}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(e){this.uniforms.dashOffset.value=e}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(e){this.uniforms.gapSize.value=e}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(e){this.uniforms.opacity.value=e}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(e){this.uniforms.resolution.value.copy(e)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(e){!!e!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),!0===e?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}let m=h.version>=125?"uv1":"uv2",g=new s.Vector4,y=new s.Vector3,S=new s.Vector3,b=new s.Vector4,w=new s.Vector4,x=new s.Vector4,E=new s.Vector3,A=new s.Matrix4,_=new s.Line3,U=new s.Vector3,L=new s.Box3,M=new s.Sphere,O=new s.Vector4;function z(e,t,i){return O.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),O.multiplyScalar(1/O.w),O.x=n/i.width,O.y=n/i.height,O.applyMatrix4(e.projectionMatrixInverse),O.multiplyScalar(1/O.w),Math.abs(Math.max(O.x,O.y))}class B extends s.Mesh{constructor(e=new d,t=new v({color:0xffffff*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,n=e.attributes.instanceEnd,i=new Float32Array(2*t.count);for(let e=0,a=0,r=t.count;e<r;e++,a+=2)y.fromBufferAttribute(t,e),S.fromBufferAttribute(n,e),i[a]=0===a?0:i[a-1],i[a+1]=i[a]+y.distanceTo(S);let a=new s.InstancedInterleavedBuffer(i,2,1);return e.setAttribute("instanceDistanceStart",new s.InterleavedBufferAttribute(a,1,0)),e.setAttribute("instanceDistanceEnd",new s.InterleavedBufferAttribute(a,1,1)),this}raycast(e,i){let a,r,o=this.material.worldUnits,l=e.camera;null!==l||o||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');let u=void 0!==e.params.Line2&&e.params.Line2.threshold||0;t=e.ray;let c=this.matrixWorld,d=this.geometry,f=this.material;if(n=f.linewidth+u,null===d.boundingSphere&&d.computeBoundingSphere(),M.copy(d.boundingSphere).applyMatrix4(c),o)a=.5*n;else{let e=Math.max(l.near,M.distanceToPoint(t.origin));a=z(l,e,f.resolution)}if(M.radius+=a,!1!==t.intersectsSphere(M)){if(null===d.boundingBox&&d.computeBoundingBox(),L.copy(d.boundingBox).applyMatrix4(c),o)r=.5*n;else{let e=Math.max(l.near,L.distanceToPoint(t.origin));r=z(l,e,f.resolution)}L.expandByScalar(r),!1!==t.intersectsBox(L)&&(o?function(e,i){let a=e.matrixWorld,r=e.geometry,o=r.attributes.instanceStart,l=r.attributes.instanceEnd,u=Math.min(r.instanceCount,o.count);for(let r=0;r<u;r++){_.start.fromBufferAttribute(o,r),_.end.fromBufferAttribute(l,r),_.applyMatrix4(a);let u=new s.Vector3,c=new s.Vector3;t.distanceSqToSegment(_.start,_.end,c,u),c.distanceTo(u)<.5*n&&i.push({point:c,pointOnLine:u,distance:t.origin.distanceTo(c),object:e,face:null,faceIndex:r,uv:null,[m]:null})}}(this,i):function(e,i,a){let r=i.projectionMatrix,o=e.material.resolution,l=e.matrixWorld,u=e.geometry,c=u.attributes.instanceStart,d=u.attributes.instanceEnd,f=Math.min(u.instanceCount,c.count),p=-i.near;t.at(1,x),x.w=1,x.applyMatrix4(i.matrixWorldInverse),x.applyMatrix4(r),x.multiplyScalar(1/x.w),x.x*=o.x/2,x.y*=o.y/2,x.z=0,E.copy(x),A.multiplyMatrices(i.matrixWorldInverse,l);for(let i=0;i<f;i++){if(b.fromBufferAttribute(c,i),w.fromBufferAttribute(d,i),b.w=1,w.w=1,b.applyMatrix4(A),w.applyMatrix4(A),b.z>p&&w.z>p)continue;if(b.z>p){let e=b.z-w.z,t=(b.z-p)/e;b.lerp(w,t)}else if(w.z>p){let e=w.z-b.z,t=(w.z-p)/e;w.lerp(b,t)}b.applyMatrix4(r),w.applyMatrix4(r),b.multiplyScalar(1/b.w),w.multiplyScalar(1/w.w),b.x*=o.x/2,b.y*=o.y/2,w.x*=o.x/2,w.y*=o.y/2,_.start.copy(b),_.start.z=0,_.end.copy(w),_.end.z=0;let u=_.closestPointToPointParameter(E,!0);_.at(u,U);let f=s.MathUtils.lerp(b.z,w.z,u),h=f>=-1&&f<=1,v=E.distanceTo(U)<.5*n;if(h&&v){_.start.fromBufferAttribute(c,i),_.end.fromBufferAttribute(d,i),_.start.applyMatrix4(l),_.end.applyMatrix4(l);let n=new s.Vector3,r=new s.Vector3;t.distanceSqToSegment(_.start,_.end,r,n),a.push({point:r,pointOnLine:n,distance:t.origin.distanceTo(r),object:e,face:null,faceIndex:i,uv:null,[m]:null})}}}(this,l,i))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(g),this.material.uniforms.resolution.value.set(g.z,g.w))}}class C extends d{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,n=new Float32Array(2*t);for(let i=0;i<t;i+=3)n[2*i]=e[i],n[2*i+1]=e[i+1],n[2*i+2]=e[i+2],n[2*i+3]=e[i+3],n[2*i+4]=e[i+4],n[2*i+5]=e[i+5];return super.setPositions(n),this}setColors(e,t=3){let n=e.length-t,i=new Float32Array(2*n);if(3===t)for(let a=0;a<n;a+=t)i[2*a]=e[a],i[2*a+1]=e[a+1],i[2*a+2]=e[a+2],i[2*a+3]=e[a+3],i[2*a+4]=e[a+4],i[2*a+5]=e[a+5];else for(let a=0;a<n;a+=t)i[2*a]=e[a],i[2*a+1]=e[a+1],i[2*a+2]=e[a+2],i[2*a+3]=e[a+3],i[2*a+4]=e[a+4],i[2*a+5]=e[a+5],i[2*a+6]=e[a+6],i[2*a+7]=e[a+7];return super.setColors(i,t),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class T extends B{constructor(e=new C,t=new v({color:0xffffff*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let D=a.forwardRef(function({points:e,color:t=0xffffff,vertexColors:n,linewidth:s,lineWidth:l,segments:u,dashed:c,...f},p){var h,m;let g=(0,o.useThree)(e=>e.size),y=a.useMemo(()=>u?new B:new T,[u]),[S]=a.useState(()=>new v),b=(null==n||null==(h=n[0])?void 0:h.length)===4?4:3,w=a.useMemo(()=>{let i=u?new d:new C,a=e.map(e=>{let t=Array.isArray(e);return e instanceof r.Vector3||e instanceof r.Vector4?[e.x,e.y,e.z]:e instanceof r.Vector2?[e.x,e.y,0]:t&&3===e.length?[e[0],e[1],e[2]]:t&&2===e.length?[e[0],e[1],0]:e});if(i.setPositions(a.flat()),n){t=0xffffff;let e=n.map(e=>e instanceof r.Color?e.toArray():e);i.setColors(e.flat(),b)}return i},[e,u,n,b]);return a.useLayoutEffect(()=>{y.computeLineDistances()},[e,y]),a.useLayoutEffect(()=>{c?S.defines.USE_DASH="":delete S.defines.USE_DASH,S.needsUpdate=!0},[c,S]),a.useEffect(()=>()=>{w.dispose(),S.dispose()},[w]),a.createElement("primitive",(0,i.default)({object:y,ref:p},f),a.createElement("primitive",{object:w,attach:"geometry"}),a.createElement("primitive",(0,i.default)({object:S,attach:"material",color:t,vertexColors:!!n,resolution:[g.width,g.height],linewidth:null!=(m=null!=s?s:l)?m:1,dashed:c,transparent:4===b},f)))});e.s(["Line",0,D],43216)}]);