"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[254],{58181:function(e,t,i){let n,r;i.d(t,{x:function(){return O}});var o=i(1119),a=i(2265),s=i(72079),l=i(21276);let d=new s.ZzF,u=new s.Pa4;class c extends s.L5s{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new s.a$l([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new s.a$l([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,i=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),i.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let i=new s.$TI(t,6,1);return this.setAttribute("instanceStart",new s.kB5(i,3,0)),this.setAttribute("instanceEnd",new s.kB5(i,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let i;e instanceof Float32Array?i=e:Array.isArray(e)&&(i=new Float32Array(e));let n=new s.$TI(i,2*t,1);return this.setAttribute("instanceColorStart",new s.kB5(n,t,0)),this.setAttribute("instanceColorEnd",new s.kB5(n,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new s.Uk6(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new s.ZzF);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;void 0!==e&&void 0!==t&&(this.boundingBox.setFromBufferAttribute(e),d.setFromBufferAttribute(t),this.boundingBox.union(d))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new s.aLr),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(void 0!==e&&void 0!==t){let i=this.boundingSphere.center;this.boundingBox.getCenter(i);let n=0;for(let r=0,o=e.count;r<o;r++)u.fromBufferAttribute(e,r),n=Math.max(n,i.distanceToSquared(u)),u.fromBufferAttribute(t,r),n=Math.max(n,i.distanceToSquared(u));this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}var f=i(51448),m=i(49074);class p extends s.jyz{constructor(e){super({type:"LineMaterial",uniforms:s.rDY.clone(s.rDY.merge([f.UniformsLib.common,f.UniformsLib.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new s.FM8(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
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
					#include <${m.i>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(e){this.uniforms.diffuse.value=e}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(e){!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(e){this.uniforms.linewidth.value=e}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(e){!!e!="USE_DASH"in this.defines&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(e){this.uniforms.dashScale.value=e}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(e){this.uniforms.dashSize.value=e}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(e){this.uniforms.dashOffset.value=e}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(e){this.uniforms.gapSize.value=e}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(e){this.uniforms.opacity.value=e}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(e){this.uniforms.resolution.value.copy(e)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(e){!!e!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),!0===e?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}let v=m.i>=125?"uv1":"uv2",h=new s.Ltg,g=new s.Pa4,y=new s.Pa4,w=new s.Ltg,x=new s.Ltg,S=new s.Ltg,b=new s.Pa4,_=new s.yGw,E=new s.Zzh,L=new s.Pa4,z=new s.ZzF,M=new s.aLr,C=new s.Ltg;function A(e,t,i){return C.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),C.multiplyScalar(1/C.w),C.x=r/i.width,C.y=r/i.height,C.applyMatrix4(e.projectionMatrixInverse),C.multiplyScalar(1/C.w),Math.abs(Math.max(C.x,C.y))}class U extends s.Kj0{constructor(e=new c,t=new p({color:16777215*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,i=e.attributes.instanceEnd,n=new Float32Array(2*t.count);for(let e=0,r=0,o=t.count;e<o;e++,r+=2)g.fromBufferAttribute(t,e),y.fromBufferAttribute(i,e),n[r]=0===r?0:n[r-1],n[r+1]=n[r]+g.distanceTo(y);let r=new s.$TI(n,2,1);return e.setAttribute("instanceDistanceStart",new s.kB5(r,1,0)),e.setAttribute("instanceDistanceEnd",new s.kB5(r,1,1)),this}raycast(e,t){let i,o;let a=this.material.worldUnits,l=e.camera;null!==l||a||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');let d=void 0!==e.params.Line2&&e.params.Line2.threshold||0;n=e.ray;let u=this.matrixWorld,c=this.geometry,f=this.material;if(r=f.linewidth+d,null===c.boundingSphere&&c.computeBoundingSphere(),M.copy(c.boundingSphere).applyMatrix4(u),a)i=.5*r;else{let e=Math.max(l.near,M.distanceToPoint(n.origin));i=A(l,e,f.resolution)}if(M.radius+=i,!1!==n.intersectsSphere(M)){if(null===c.boundingBox&&c.computeBoundingBox(),z.copy(c.boundingBox).applyMatrix4(u),a)o=.5*r;else{let e=Math.max(l.near,z.distanceToPoint(n.origin));o=A(l,e,f.resolution)}z.expandByScalar(o),!1!==n.intersectsBox(z)&&(a?function(e,t){let i=e.matrixWorld,o=e.geometry,a=o.attributes.instanceStart,l=o.attributes.instanceEnd,d=Math.min(o.instanceCount,a.count);for(let o=0;o<d;o++){E.start.fromBufferAttribute(a,o),E.end.fromBufferAttribute(l,o),E.applyMatrix4(i);let d=new s.Pa4,u=new s.Pa4;n.distanceSqToSegment(E.start,E.end,u,d),u.distanceTo(d)<.5*r&&t.push({point:u,pointOnLine:d,distance:n.origin.distanceTo(u),object:e,face:null,faceIndex:o,uv:null,[v]:null})}}(this,t):function(e,t,i){let o=t.projectionMatrix,a=e.material.resolution,l=e.matrixWorld,d=e.geometry,u=d.attributes.instanceStart,c=d.attributes.instanceEnd,f=Math.min(d.instanceCount,u.count),m=-t.near;n.at(1,S),S.w=1,S.applyMatrix4(t.matrixWorldInverse),S.applyMatrix4(o),S.multiplyScalar(1/S.w),S.x*=a.x/2,S.y*=a.y/2,S.z=0,b.copy(S),_.multiplyMatrices(t.matrixWorldInverse,l);for(let t=0;t<f;t++){if(w.fromBufferAttribute(u,t),x.fromBufferAttribute(c,t),w.w=1,x.w=1,w.applyMatrix4(_),x.applyMatrix4(_),w.z>m&&x.z>m)continue;if(w.z>m){let e=w.z-x.z,t=(w.z-m)/e;w.lerp(x,t)}else if(x.z>m){let e=x.z-w.z,t=(x.z-m)/e;x.lerp(w,t)}w.applyMatrix4(o),x.applyMatrix4(o),w.multiplyScalar(1/w.w),x.multiplyScalar(1/x.w),w.x*=a.x/2,w.y*=a.y/2,x.x*=a.x/2,x.y*=a.y/2,E.start.copy(w),E.start.z=0,E.end.copy(x),E.end.z=0;let d=E.closestPointToPointParameter(b,!0);E.at(d,L);let f=s.M8C.lerp(w.z,x.z,d),p=f>=-1&&f<=1,h=b.distanceTo(L)<.5*r;if(p&&h){E.start.fromBufferAttribute(u,t),E.end.fromBufferAttribute(c,t),E.start.applyMatrix4(l),E.end.applyMatrix4(l);let r=new s.Pa4,o=new s.Pa4;n.distanceSqToSegment(E.start,E.end,o,r),i.push({point:o,pointOnLine:r,distance:n.origin.distanceTo(o),object:e,face:null,faceIndex:t,uv:null,[v]:null})}}}(this,l,t))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(h),this.material.uniforms.resolution.value.set(h.z,h.w))}}class D extends c{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,i=new Float32Array(2*t);for(let n=0;n<t;n+=3)i[2*n]=e[n],i[2*n+1]=e[n+1],i[2*n+2]=e[n+2],i[2*n+3]=e[n+3],i[2*n+4]=e[n+4],i[2*n+5]=e[n+5];return super.setPositions(i),this}setColors(e,t=3){let i=e.length-t,n=new Float32Array(2*i);if(3===t)for(let r=0;r<i;r+=t)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5];else for(let r=0;r<i;r+=t)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5],n[2*r+6]=e[r+6],n[2*r+7]=e[r+7];return super.setColors(n,t),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class P extends U{constructor(e=new D,t=new p({color:16777215*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let O=a.forwardRef(function({points:e,color:t=16777215,vertexColors:i,linewidth:n,lineWidth:r,segments:d,dashed:u,...f},m){var v,h;let g=(0,l.D)(e=>e.size),y=a.useMemo(()=>d?new U:new P,[d]),[w]=a.useState(()=>new p),x=(null==i||null==(v=i[0])?void 0:v.length)===4?4:3,S=a.useMemo(()=>{let n=d?new c:new D,r=e.map(e=>{let t=Array.isArray(e);return e instanceof s.Pa4||e instanceof s.Ltg?[e.x,e.y,e.z]:e instanceof s.FM8?[e.x,e.y,0]:t&&3===e.length?[e[0],e[1],e[2]]:t&&2===e.length?[e[0],e[1],0]:e});if(n.setPositions(r.flat()),i){t=16777215;let e=i.map(e=>e instanceof s.Ilk?e.toArray():e);n.setColors(e.flat(),x)}return n},[e,d,i,x]);return a.useLayoutEffect(()=>{y.computeLineDistances()},[e,y]),a.useLayoutEffect(()=>{u?w.defines.USE_DASH="":delete w.defines.USE_DASH,w.needsUpdate=!0},[u,w]),a.useEffect(()=>()=>{S.dispose(),w.dispose()},[S]),a.createElement("primitive",(0,o.Z)({object:y,ref:m},f),a.createElement("primitive",{object:S,attach:"geometry"}),a.createElement("primitive",(0,o.Z)({object:w,attach:"material",color:t,vertexColors:!!i,resolution:[g.width,g.height],linewidth:null!==(h=null!=n?n:r)&&void 0!==h?h:1,dashed:u,transparent:4===x},f)))})},88345:function(e,t,i){i.d(t,{g:function(){return r}});var n=i(72079);function r(e,t,i,r){let o=class extends n.jyz{constructor(o={}){let a=Object.entries(e);super({uniforms:a.reduce((e,[t,i])=>{let r=n.rDY.clone({[t]:{value:i}});return{...e,...r}},{}),vertexShader:t,fragmentShader:i}),this.key="",a.forEach(([e])=>Object.defineProperty(this,e,{get:()=>this.uniforms[e].value,set:t=>this.uniforms[e].value=t})),Object.assign(this,o),r&&r(this)}};return o.key=n.M8C.generateUUID(),o}},1:function(e,t,i){i.d(t,{FM:function(){return s},aL:function(){return a}});var n=i(1119),r=i(2265);function o(e,t){let i=e+"Geometry";return r.forwardRef(({args:e,children:o,...a},s)=>{let l=r.useRef(null);return r.useImperativeHandle(s,()=>l.current),r.useLayoutEffect(()=>void(null==t||t(l.current))),r.createElement("mesh",(0,n.Z)({ref:l},a),r.createElement(i,{attach:"geometry",args:e}),o)})}let a=o("sphere"),s=o("ring")},54752:function(e,t,i){i.d(t,{B:function(){return o}});var n=i(72079),r=i(51448);class o extends n.Kj0{constructor(e,t={}){super(e),this.isWater=!0;let i=this,o=void 0!==t.textureWidth?t.textureWidth:512,a=void 0!==t.textureHeight?t.textureHeight:512,s=void 0!==t.clipBias?t.clipBias:0,l=void 0!==t.alpha?t.alpha:1,d=void 0!==t.time?t.time:0,u=void 0!==t.waterNormals?t.waterNormals:null,c=void 0!==t.sunDirection?t.sunDirection:new n.Pa4(.70707,.70707,0),f=new n.Ilk(void 0!==t.sunColor?t.sunColor:16777215),m=new n.Ilk(void 0!==t.waterColor?t.waterColor:8355711),p=void 0!==t.eye?t.eye:new n.Pa4(0,0,0),v=void 0!==t.distortionScale?t.distortionScale:20,h=void 0!==t.side?t.side:n.Wl3,g=void 0!==t.fog&&t.fog,y=new n.JOQ,w=new n.Pa4,x=new n.Pa4,S=new n.Pa4,b=new n.yGw,_=new n.Pa4(0,0,-1),E=new n.Ltg,L=new n.Pa4,z=new n.Pa4,M=new n.Ltg,C=new n.yGw,A=new n.cPb,U=new n.dd2(o,a),D={name:"MirrorShader",uniforms:n.rDY.merge([r.UniformsLib.fog,r.UniformsLib.lights,{normalSampler:{value:null},mirrorSampler:{value:null},alpha:{value:1},time:{value:0},size:{value:1},distortionScale:{value:20},textureMatrix:{value:new n.yGw},sunColor:{value:new n.Ilk(8355711)},sunDirection:{value:new n.Pa4(.70707,.70707,0)},eye:{value:new n.Pa4},waterColor:{value:new n.Ilk(5592405)}}]),vertexShader:`
				uniform mat4 textureMatrix;
				uniform float time;

				varying vec4 mirrorCoord;
				varying vec4 worldPosition;

				#include <common>
				#include <fog_pars_vertex>
				#include <shadowmap_pars_vertex>
				#include <logdepthbuf_pars_vertex>

				void main() {
					mirrorCoord = modelMatrix * vec4( position, 1.0 );
					worldPosition = mirrorCoord.xyzw;
					mirrorCoord = textureMatrix * mirrorCoord;
					vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );
					gl_Position = projectionMatrix * mvPosition;

				#include <beginnormal_vertex>
				#include <defaultnormal_vertex>
				#include <logdepthbuf_vertex>
				#include <fog_vertex>
				#include <shadowmap_vertex>
			}`,fragmentShader:`
				uniform sampler2D mirrorSampler;
				uniform float alpha;
				uniform float time;
				uniform float size;
				uniform float distortionScale;
				uniform sampler2D normalSampler;
				uniform vec3 sunColor;
				uniform vec3 sunDirection;
				uniform vec3 eye;
				uniform vec3 waterColor;

				varying vec4 mirrorCoord;
				varying vec4 worldPosition;

				vec4 getNoise( vec2 uv ) {
					vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);
					vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );
					vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );
					vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );
					vec4 noise = texture2D( normalSampler, uv0 ) +
						texture2D( normalSampler, uv1 ) +
						texture2D( normalSampler, uv2 ) +
						texture2D( normalSampler, uv3 );
					return noise * 0.5 - 1.0;
				}

				void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor ) {
					vec3 reflection = normalize( reflect( -sunDirection, surfaceNormal ) );
					float direction = max( 0.0, dot( eyeDirection, reflection ) );
					specularColor += pow( direction, shiny ) * sunColor * spec;
					diffuseColor += max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;
				}

				#include <common>
				#include <packing>
				#include <bsdfs>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <lights_pars_begin>
				#include <shadowmap_pars_fragment>
				#include <shadowmask_pars_fragment>

				void main() {

					#include <logdepthbuf_fragment>
					vec4 noise = getNoise( worldPosition.xz * size );
					vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );

					vec3 diffuseLight = vec3(0.0);
					vec3 specularLight = vec3(0.0);

					vec3 worldToEye = eye-worldPosition.xyz;
					vec3 eyeDirection = normalize( worldToEye );
					sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );

					float distance = length(worldToEye);

					vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale;
					vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.w + distortion ) );

					float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );
					float rf0 = 0.3;
					float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );
					vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;
					vec3 albedo = mix( ( sunColor * diffuseLight * 0.3 + scatter ) * getShadowMask(), ( vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight ), reflectance);
					vec3 outgoingLight = albedo;
					gl_FragColor = vec4( outgoingLight, alpha );

					#include <tonemapping_fragment>
					#include <colorspace_fragment>
					#include <fog_fragment>	
				}`},P=new n.jyz({name:D.name,uniforms:n.rDY.clone(D.uniforms),vertexShader:D.vertexShader,fragmentShader:D.fragmentShader,lights:!0,side:h,fog:g});P.uniforms.mirrorSampler.value=U.texture,P.uniforms.textureMatrix.value=C,P.uniforms.alpha.value=l,P.uniforms.time.value=d,P.uniforms.normalSampler.value=u,P.uniforms.sunColor.value=f,P.uniforms.waterColor.value=m,P.uniforms.sunDirection.value=c,P.uniforms.distortionScale.value=v,P.uniforms.eye.value=p,i.material=P,i.onBeforeRender=function(e,t,n){if(x.setFromMatrixPosition(i.matrixWorld),S.setFromMatrixPosition(n.matrixWorld),b.extractRotation(i.matrixWorld),w.set(0,0,1),w.applyMatrix4(b),L.subVectors(x,S),L.dot(w)>0)return;L.reflect(w).negate(),L.add(x),b.extractRotation(n.matrixWorld),_.set(0,0,-1),_.applyMatrix4(b),_.add(S),z.subVectors(x,_),z.reflect(w).negate(),z.add(x),A.position.copy(L),A.up.set(0,1,0),A.up.applyMatrix4(b),A.up.reflect(w),A.lookAt(z),A.far=n.far,A.updateMatrixWorld(),A.projectionMatrix.copy(n.projectionMatrix),C.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),C.multiply(A.projectionMatrix),C.multiply(A.matrixWorldInverse),y.setFromNormalAndCoplanarPoint(w,x),y.applyMatrix4(A.matrixWorldInverse),E.set(y.normal.x,y.normal.y,y.normal.z,y.constant);let r=A.projectionMatrix;M.x=(Math.sign(E.x)+r.elements[8])/r.elements[0],M.y=(Math.sign(E.y)+r.elements[9])/r.elements[5],M.z=-1,M.w=(1+r.elements[10])/r.elements[14],E.multiplyScalar(2/E.dot(M)),r.elements[2]=E.x,r.elements[6]=E.y,r.elements[10]=E.z+1-s,r.elements[14]=E.w,p.setFromMatrixPosition(n.matrixWorld);let o=e.getRenderTarget(),a=e.xr.enabled,l=e.shadowMap.autoUpdate;i.visible=!1,e.xr.enabled=!1,e.shadowMap.autoUpdate=!1,e.setRenderTarget(U),e.state.buffers.depth.setMask(!0),!1===e.autoClear&&e.clear(),e.render(t,A),i.visible=!0,e.xr.enabled=a,e.shadowMap.autoUpdate=l,e.setRenderTarget(o);let d=n.viewport;void 0!==d&&e.state.viewport(d)}}}}}]);