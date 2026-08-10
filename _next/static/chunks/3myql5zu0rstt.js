(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,43216,e=>{"use strict";let t,i;var n=e.i(31067),r=e.i(71645),a=e.i(90072),o=e.i(28600),s=a,l=a;let d=new l.Box3,u=new l.Vector3;class f extends l.InstancedBufferGeometry{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new l.Float32BufferAttribute([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new l.Float32BufferAttribute([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,i=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),i.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let i=new l.InstancedInterleavedBuffer(t,6,1);return this.setAttribute("instanceStart",new l.InterleavedBufferAttribute(i,3,0)),this.setAttribute("instanceEnd",new l.InterleavedBufferAttribute(i,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let i;e instanceof Float32Array?i=e:Array.isArray(e)&&(i=new Float32Array(e));let n=new l.InstancedInterleavedBuffer(i,2*t,1);return this.setAttribute("instanceColorStart",new l.InterleavedBufferAttribute(n,t,0)),this.setAttribute("instanceColorEnd",new l.InterleavedBufferAttribute(n,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new l.WireframeGeometry(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new l.Box3);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;void 0!==e&&void 0!==t&&(this.boundingBox.setFromBufferAttribute(e),d.setFromBufferAttribute(t),this.boundingBox.union(d))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new l.Sphere),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(void 0!==e&&void 0!==t){let i=this.boundingSphere.center;this.boundingBox.getCenter(i);let n=0;for(let r=0,a=e.count;r<a;r++)u.fromBufferAttribute(e,r),n=Math.max(n,i.distanceToSquared(u)),u.fromBufferAttribute(t,r),n=Math.max(n,i.distanceToSquared(u));this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}var c=a,p=e.i(8560),h=e.i(31497);class m extends c.ShaderMaterial{constructor(e){super({type:"LineMaterial",uniforms:c.UniformsUtils.clone(c.UniformsUtils.merge([p.UniformsLib.common,p.UniformsLib.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new c.Vector2(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
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
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(e){this.uniforms.diffuse.value=e}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(e){!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(e){this.uniforms.linewidth.value=e}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(e){!!e!="USE_DASH"in this.defines&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(e){this.uniforms.dashScale.value=e}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(e){this.uniforms.dashSize.value=e}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(e){this.uniforms.dashOffset.value=e}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(e){this.uniforms.gapSize.value=e}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(e){this.uniforms.opacity.value=e}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(e){this.uniforms.resolution.value.copy(e)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(e){!!e!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),!0===e?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}let v=h.version>=125?"uv1":"uv2",g=new s.Vector4,y=new s.Vector3,S=new s.Vector3,x=new s.Vector4,w=new s.Vector4,b=new s.Vector4,E=new s.Vector3,A=new s.Matrix4,_=new s.Line3,L=new s.Vector3,U=new s.Box3,M=new s.Sphere,z=new s.Vector4;function B(e,t,n){return z.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),z.multiplyScalar(1/z.w),z.x=i/n.width,z.y=i/n.height,z.applyMatrix4(e.projectionMatrixInverse),z.multiplyScalar(1/z.w),Math.abs(Math.max(z.x,z.y))}class C extends s.Mesh{constructor(e=new f,t=new m({color:0xffffff*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,i=e.attributes.instanceEnd,n=new Float32Array(2*t.count);for(let e=0,r=0,a=t.count;e<a;e++,r+=2)y.fromBufferAttribute(t,e),S.fromBufferAttribute(i,e),n[r]=0===r?0:n[r-1],n[r+1]=n[r]+y.distanceTo(S);let r=new s.InstancedInterleavedBuffer(n,2,1);return e.setAttribute("instanceDistanceStart",new s.InterleavedBufferAttribute(r,1,0)),e.setAttribute("instanceDistanceEnd",new s.InterleavedBufferAttribute(r,1,1)),this}raycast(e,n){let r,a,o=this.material.worldUnits,l=e.camera;null!==l||o||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');let d=void 0!==e.params.Line2&&e.params.Line2.threshold||0;t=e.ray;let u=this.matrixWorld,f=this.geometry,c=this.material;if(i=c.linewidth+d,null===f.boundingSphere&&f.computeBoundingSphere(),M.copy(f.boundingSphere).applyMatrix4(u),o)r=.5*i;else{let e=Math.max(l.near,M.distanceToPoint(t.origin));r=B(l,e,c.resolution)}if(M.radius+=r,!1!==t.intersectsSphere(M)){if(null===f.boundingBox&&f.computeBoundingBox(),U.copy(f.boundingBox).applyMatrix4(u),o)a=.5*i;else{let e=Math.max(l.near,U.distanceToPoint(t.origin));a=B(l,e,c.resolution)}U.expandByScalar(a),!1!==t.intersectsBox(U)&&(o?function(e,n){let r=e.matrixWorld,a=e.geometry,o=a.attributes.instanceStart,l=a.attributes.instanceEnd,d=Math.min(a.instanceCount,o.count);for(let a=0;a<d;a++){_.start.fromBufferAttribute(o,a),_.end.fromBufferAttribute(l,a),_.applyMatrix4(r);let d=new s.Vector3,u=new s.Vector3;t.distanceSqToSegment(_.start,_.end,u,d),u.distanceTo(d)<.5*i&&n.push({point:u,pointOnLine:d,distance:t.origin.distanceTo(u),object:e,face:null,faceIndex:a,uv:null,[v]:null})}}(this,n):function(e,n,r){let a=n.projectionMatrix,o=e.material.resolution,l=e.matrixWorld,d=e.geometry,u=d.attributes.instanceStart,f=d.attributes.instanceEnd,c=Math.min(d.instanceCount,u.count),p=-n.near;t.at(1,b),b.w=1,b.applyMatrix4(n.matrixWorldInverse),b.applyMatrix4(a),b.multiplyScalar(1/b.w),b.x*=o.x/2,b.y*=o.y/2,b.z=0,E.copy(b),A.multiplyMatrices(n.matrixWorldInverse,l);for(let n=0;n<c;n++){if(x.fromBufferAttribute(u,n),w.fromBufferAttribute(f,n),x.w=1,w.w=1,x.applyMatrix4(A),w.applyMatrix4(A),x.z>p&&w.z>p)continue;if(x.z>p){let e=x.z-w.z,t=(x.z-p)/e;x.lerp(w,t)}else if(w.z>p){let e=w.z-x.z,t=(w.z-p)/e;w.lerp(x,t)}x.applyMatrix4(a),w.applyMatrix4(a),x.multiplyScalar(1/x.w),w.multiplyScalar(1/w.w),x.x*=o.x/2,x.y*=o.y/2,w.x*=o.x/2,w.y*=o.y/2,_.start.copy(x),_.start.z=0,_.end.copy(w),_.end.z=0;let d=_.closestPointToPointParameter(E,!0);_.at(d,L);let c=s.MathUtils.lerp(x.z,w.z,d),h=c>=-1&&c<=1,m=E.distanceTo(L)<.5*i;if(h&&m){_.start.fromBufferAttribute(u,n),_.end.fromBufferAttribute(f,n),_.start.applyMatrix4(l),_.end.applyMatrix4(l);let i=new s.Vector3,a=new s.Vector3;t.distanceSqToSegment(_.start,_.end,a,i),r.push({point:a,pointOnLine:i,distance:t.origin.distanceTo(a),object:e,face:null,faceIndex:n,uv:null,[v]:null})}}}(this,l,n))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(g),this.material.uniforms.resolution.value.set(g.z,g.w))}}class O extends f{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,i=new Float32Array(2*t);for(let n=0;n<t;n+=3)i[2*n]=e[n],i[2*n+1]=e[n+1],i[2*n+2]=e[n+2],i[2*n+3]=e[n+3],i[2*n+4]=e[n+4],i[2*n+5]=e[n+5];return super.setPositions(i),this}setColors(e,t=3){let i=e.length-t,n=new Float32Array(2*i);if(3===t)for(let r=0;r<i;r+=t)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5];else for(let r=0;r<i;r+=t)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5],n[2*r+6]=e[r+6],n[2*r+7]=e[r+7];return super.setColors(n,t),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class P extends C{constructor(e=new O,t=new m({color:0xffffff*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let j=r.forwardRef(function({points:e,color:t=0xffffff,vertexColors:i,linewidth:s,lineWidth:l,segments:d,dashed:u,...c},p){var h,v;let g=(0,o.useThree)(e=>e.size),y=r.useMemo(()=>d?new C:new P,[d]),[S]=r.useState(()=>new m),x=(null==i||null==(h=i[0])?void 0:h.length)===4?4:3,w=r.useMemo(()=>{let n=d?new f:new O,r=e.map(e=>{let t=Array.isArray(e);return e instanceof a.Vector3||e instanceof a.Vector4?[e.x,e.y,e.z]:e instanceof a.Vector2?[e.x,e.y,0]:t&&3===e.length?[e[0],e[1],e[2]]:t&&2===e.length?[e[0],e[1],0]:e});if(n.setPositions(r.flat()),i){t=0xffffff;let e=i.map(e=>e instanceof a.Color?e.toArray():e);n.setColors(e.flat(),x)}return n},[e,d,i,x]);return r.useLayoutEffect(()=>{y.computeLineDistances()},[e,y]),r.useLayoutEffect(()=>{u?S.defines.USE_DASH="":delete S.defines.USE_DASH,S.needsUpdate=!0},[u,S]),r.useEffect(()=>()=>{w.dispose(),S.dispose()},[w]),r.createElement("primitive",(0,n.default)({object:y,ref:p},c),r.createElement("primitive",{object:w,attach:"geometry"}),r.createElement("primitive",(0,n.default)({object:S,attach:"material",color:t,vertexColors:!!i,resolution:[g.width,g.height],linewidth:null!=(v=null!=s?s:l)?v:1,dashed:u,transparent:4===x},c)))});e.s(["Line",0,j],43216)},8418,e=>{"use strict";var t=e.i(43476),i=e.i(71645),n=e.i(28600),r=e.i(30297),a=e.i(82897),o=e.i(60099),s=e.i(43257),l=e.i(90072),d=e.i(67561),u=e.i(66326),f=e.i(43216),c=e.i(85709),p=e.i(48390);let h=(e,t)=>{let i=e=>e*Math.PI/180,n=i(t.latitude),r=i(e.latitude);return[6371e3*i(e.longitude-t.longitude)*Math.cos((n+r)/2)/1,-(6371e3*(r-n))/1]},m=()=>{let e=(0,c.useSignalKPath)("navigation.position"),n=(0,c.useSignalKPath)("navigation.anchor.position"),r=(0,c.useSignalKPath)("navigation.anchor.maxRadius"),a=(0,c.useSignalKPath)("navigation.headingTrue"),o=(0,c.useSignalKPath)("navigation.headingMagnetic"),s=(0,c.useSignalKPath)("navigation.courseOverGroundTrue"),[l,u]=(0,i.useState)([]);(0,i.useEffect)(()=>{let e=!1,t=null,i=0,n=!1,r=e=>{t&&clearInterval(t),t=setInterval(a,e)},a=async()=>{if(!n){n=!0;try{let t=await (0,p.getAnchorTrack)();if(e)return;i>=3&&r(15e3),i=0,u(Array.isArray(t?.track)?t.track:[])}catch{if(e)return;3==++i&&r(12e4)}finally{n=!1}}};return a(),r(15e3),()=>{e=!0,t&&clearInterval(t)}},[]);let m=(0,i.useMemo)(()=>n?.latitude!=null&&n?.longitude!=null?{latitude:n.latitude,longitude:n.longitude}:null,[n]),v=Number.isFinite(r)&&r>0,g=(v?r:30)/1,y=(0,i.useMemo)(()=>{if(e?.latitude==null||e?.longitude==null)return null;if(!m)return[0,-6.9,0];let[t,i]=h(m,e);return[t,-6.9,i]},[m,e]),S=(0,i.useMemo)(()=>{let e=a??o??s??0;return Number.isFinite(e)?e:0},[a,o,s]),x=(0,i.useMemo)(()=>{let e=[];for(let t=0;t<=64;t++){let i=t/64*Math.PI*2;e.push([g*Math.cos(i),0,g*Math.sin(i)])}return e},[g]),w=(0,i.useMemo)(()=>x.map(([e,t,i])=>[.8*e,t,.8*i]),[x]),b=(0,i.useMemo)(()=>{if(e?.latitude==null||e?.longitude==null||!l.length)return null;let t=l.filter(e=>Number.isFinite(e?.latitude)&&Number.isFinite(e?.longitude)).map(t=>{let[i,n]=h(t,e);return[i,-6.9+.05,n]});return t.push([0,-6.9+.05,0]),t.length>=2?t:null},[l,e]),E=(0,i.useMemo)(()=>y&&m?[y,[0,-6.9,0]]:null,[y,m]);if(!y)return null;let A=null!==m&&v&&Math.hypot(y[0],y[2])>g;return(0,t.jsxs)("group",{rotation:[0,S,0],children:[(0,t.jsxs)("group",{position:y,children:[(0,t.jsx)(f.Line,{points:x,color:A?d.oRed:d.oYellow,lineWidth:2,transparent:!0,opacity:.7}),(0,t.jsx)(f.Line,{points:w,color:d.oGray,lineWidth:1,dashed:!0,dashSize:2,gapSize:2,transparent:!0,opacity:.35}),(0,t.jsxs)("mesh",{position:[0,.1,0],rotation:[-Math.PI/2,0,0],children:[(0,t.jsx)("circleGeometry",{args:[Math.max(.6,.03*g),16]}),(0,t.jsx)("meshBasicMaterial",{color:d.oYellow,transparent:!0,opacity:.9})]})]}),E&&(0,t.jsx)(f.Line,{points:E,color:d.oGray,lineWidth:1,transparent:!0,opacity:.5}),b&&(0,t.jsx)(f.Line,{points:b,color:A?d.oRed:d.oYellow,lineWidth:2,transparent:!0,opacity:.85})]})};e.s(["default",0,({onUpdateInfoPanel:e})=>{let f=(0,i.useRef)(),{size:c}=(0,n.useThree)(),{nightMode:p}=(0,d.useOcearoContext)(),h=c.width/c.height;return(0,t.jsxs)(i.Suspense,{fallback:(0,t.jsx)(o.Html,{children:"Loading..."}),children:[(0,t.jsx)(a.PerspectiveCamera,{makeDefault:!0,fov:25,aspect:h,near:1,far:1e3,position:[32,10,-32]}),(0,t.jsx)(r.OrbitControls,{enableZoom:!0,enableRotate:!0,maxPolarAngle:Math.PI/2,minPolarAngle:Math.PI/4}),(0,t.jsx)(s.Environment,{files:"./assets/ocearo_env.hdr",background:!1}),(0,t.jsx)("ambientLight",{intensity:.2}),(0,t.jsx)("directionalLight",{position:[15,30,20],intensity:1.2,castShadow:!1,color:p?"#b0d8ff":"#ffffff"}),(0,t.jsx)("spotLight",{position:[0,50,100],intensity:.8,angle:.6,penumbra:1,color:p?"#4080ff":"#ffffff"}),(0,t.jsx)("pointLight",{position:[-10,10,-10],intensity:.5}),(0,t.jsx)(u.default,{ref:f,scale:[1.3,1.3,1.3],position:[0,-6,0],onUpdateInfoPanel:e}),(0,t.jsx)(m,{}),(0,t.jsxs)("mesh",{rotation:[-Math.PI/2,0,0],position:[0,-7,0],receiveShadow:!0,children:[(0,t.jsx)("planeGeometry",{args:[100,100]}),(0,t.jsx)("shaderMaterial",{uniforms:{uColor:{value:new l.Color(p?"#050505":"#0a0a0a")},uBlurRadius:{value:.15}},vertexShader:`
                            varying vec2 vUv;
                            void main() {
                                vUv = uv;
                                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                            }
                        `,fragmentShader:`
                            uniform vec3 uColor;
                            uniform float uBlurRadius;
                            varying vec2 vUv;

                            void main() {
                                float distanceToCenter = length(vUv - vec2(0.5));
                                float alpha = smoothstep(0.5 - uBlurRadius, 0.5 + uBlurRadius, distanceToCenter);
                                gl_FragColor = vec4(uColor, 1.0 - alpha);
                            }
                        `})]})]})}],8418)},69675,e=>{e.n(e.i(8418))}]);