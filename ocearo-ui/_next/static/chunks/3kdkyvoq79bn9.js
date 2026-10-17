(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,43758,30728,27530,92923,e=>{"use strict";let t,i;var n=e.i(43476),r=e.i(71645),a=e.i(90072),o=e.i(90874),s=a,l=a;let u=new l.Box3,d=new l.Vector3;class c extends l.InstancedBufferGeometry{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new l.Float32BufferAttribute([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new l.Float32BufferAttribute([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,i=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),i.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let i=new l.InstancedInterleavedBuffer(t,6,1);return this.setAttribute("instanceStart",new l.InterleavedBufferAttribute(i,3,0)),this.setAttribute("instanceEnd",new l.InterleavedBufferAttribute(i,3,3)),this.instanceCount=this.attributes.instanceStart.count,this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let i=new l.InstancedInterleavedBuffer(t,6,1);return this.setAttribute("instanceColorStart",new l.InterleavedBufferAttribute(i,3,0)),this.setAttribute("instanceColorEnd",new l.InterleavedBufferAttribute(i,3,3)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new l.WireframeGeometry(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new l.Box3);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;void 0!==e&&void 0!==t&&(this.boundingBox.setFromBufferAttribute(e),u.setFromBufferAttribute(t),this.boundingBox.union(u))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new l.Sphere),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(void 0!==e&&void 0!==t){let i=this.boundingSphere.center;this.boundingBox.getCenter(i);let n=0;for(let r=0,a=e.count;r<a;r++)d.fromBufferAttribute(e,r),n=Math.max(n,i.distanceToSquared(d)),d.fromBufferAttribute(t,r),n=Math.max(n,i.distanceToSquared(d));this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}}e.s(["LineSegmentsGeometry",0,c],30728);var f=e.i(8560),h=a;f.UniformsLib.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new h.Vector2},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}},f.ShaderLib.line={uniforms:h.UniformsUtils.merge([f.UniformsLib.common,f.UniformsLib.fog,f.UniformsLib.line]),vertexShader:`
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
		`};class p extends h.ShaderMaterial{constructor(e){super({type:"LineMaterial",uniforms:h.UniformsUtils.clone(f.ShaderLib.line.uniforms),vertexShader:f.ShaderLib.line.vertexShader,fragmentShader:f.ShaderLib.line.fragmentShader,clipping:!0}),this.isLineMaterial=!0,this.setValues(e)}get color(){return this.uniforms.diffuse.value}set color(e){this.uniforms.diffuse.value=e}get worldUnits(){return"WORLD_UNITS"in this.defines}set worldUnits(e){!0===e!==this.worldUnits&&(this.needsUpdate=!0),!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(e){this.uniforms.linewidth&&(this.uniforms.linewidth.value=e)}get dashed(){return"USE_DASH"in this.defines}set dashed(e){!0===e!==this.dashed&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(e){this.uniforms.dashScale.value=e}get dashSize(){return this.uniforms.dashSize.value}set dashSize(e){this.uniforms.dashSize.value=e}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(e){this.uniforms.dashOffset.value=e}get gapSize(){return this.uniforms.gapSize.value}set gapSize(e){this.uniforms.gapSize.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}get resolution(){return this.uniforms.resolution.value}set resolution(e){this.uniforms.resolution.value.copy(e)}get alphaToCoverage(){return"USE_ALPHA_TO_COVERAGE"in this.defines}set alphaToCoverage(e){this.defines&&(!0===e!==this.alphaToCoverage&&(this.needsUpdate=!0),!0===e?this.defines.USE_ALPHA_TO_COVERAGE="":delete this.defines.USE_ALPHA_TO_COVERAGE)}}e.s(["LineMaterial",0,p],27530);let m=new s.Vector4,g=new s.Vector3,v=new s.Vector3,y=new s.Vector4,w=new s.Vector4,x=new s.Vector4,b=new s.Vector3,S=new s.Matrix4,M=new s.Line3,E=new s.Vector3,P=new s.Box3,_=new s.Sphere,A=new s.Vector4;function T(e,t,n){return A.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),A.multiplyScalar(1/A.w),A.x=i/n.width,A.y=i/n.height,A.applyMatrix4(e.projectionMatrixInverse),A.multiplyScalar(1/A.w),Math.abs(Math.max(A.x,A.y))}class z extends s.Mesh{constructor(e=new c,t=new p({color:0xffffff*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,i=e.attributes.instanceEnd,n=new Float32Array(2*t.count);for(let e=0,r=0,a=t.count;e<a;e++,r+=2)g.fromBufferAttribute(t,e),v.fromBufferAttribute(i,e),n[r]=0===r?0:n[r-1],n[r+1]=n[r]+g.distanceTo(v);let r=new s.InstancedInterleavedBuffer(n,2,1);return e.setAttribute("instanceDistanceStart",new s.InterleavedBufferAttribute(r,1,0)),e.setAttribute("instanceDistanceEnd",new s.InterleavedBufferAttribute(r,1,1)),this}raycast(e,n){let r,a,o=this.material.worldUnits,l=e.camera;if(null!==l||o||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.'),!1===o&&(0===this.material.resolution.x||0===this.material.resolution.y))return;let u=void 0!==e.params.Line2&&e.params.Line2.threshold||0;t=e.ray;let d=this.matrixWorld,c=this.geometry,f=this.material;if(i=f.linewidth+u,null===c.boundingSphere&&c.computeBoundingSphere(),_.copy(c.boundingSphere).applyMatrix4(d),o)r=.5*i;else{let e=Math.max(l.near,_.distanceToPoint(t.origin));r=T(l,e,f.resolution)}if(_.radius+=r,!1!==t.intersectsSphere(_)){if(null===c.boundingBox&&c.computeBoundingBox(),P.copy(c.boundingBox).applyMatrix4(d),o)a=.5*i;else{let e=Math.max(l.near,P.distanceToPoint(t.origin));a=T(l,e,f.resolution)}P.expandByScalar(a),!1!==t.intersectsBox(P)&&(o?function(e,n){let r=e.matrixWorld,a=e.geometry,o=a.attributes.instanceStart,l=a.attributes.instanceEnd,u=Math.min(a.instanceCount,o.count);for(let a=0;a<u;a++){M.start.fromBufferAttribute(o,a),M.end.fromBufferAttribute(l,a),M.applyMatrix4(r);let u=new s.Vector3,d=new s.Vector3;t.distanceSqToSegment(M.start,M.end,d,u),d.distanceTo(u)<.5*i&&n.push({point:d,pointOnLine:u,distance:t.origin.distanceTo(d),object:e,face:null,faceIndex:a,uv:null,uv1:null})}}(this,n):function(e,n,r){let a=n.projectionMatrix,o=e.material.resolution,l=e.matrixWorld,u=e.geometry,d=u.attributes.instanceStart,c=u.attributes.instanceEnd,f=Math.min(u.instanceCount,d.count),h=-n.near;t.at(1,x),x.w=1,x.applyMatrix4(n.matrixWorldInverse),x.applyMatrix4(a),x.multiplyScalar(1/x.w),x.x*=o.x/2,x.y*=o.y/2,x.z=0,b.copy(x),S.multiplyMatrices(n.matrixWorldInverse,l);for(let n=0;n<f;n++){if(y.fromBufferAttribute(d,n),w.fromBufferAttribute(c,n),y.w=1,w.w=1,y.applyMatrix4(S),w.applyMatrix4(S),y.z>h&&w.z>h)continue;if(y.z>h){let e=y.z-w.z,t=(y.z-h)/e;y.lerp(w,t)}else if(w.z>h){let e=w.z-y.z,t=(w.z-h)/e;w.lerp(y,t)}y.applyMatrix4(a),w.applyMatrix4(a),y.multiplyScalar(1/y.w),w.multiplyScalar(1/w.w),y.x*=o.x/2,y.y*=o.y/2,w.x*=o.x/2,w.y*=o.y/2,M.start.copy(y),M.start.z=0,M.end.copy(w),M.end.z=0;let u=M.closestPointToPointParameter(b,!0);M.at(u,E);let f=s.MathUtils.lerp(y.z,w.z,u),p=f>=-1&&f<=1,m=b.distanceTo(E)<.5*i;if(p&&m){M.start.fromBufferAttribute(d,n),M.end.fromBufferAttribute(c,n),M.start.applyMatrix4(l),M.end.applyMatrix4(l);let i=new s.Vector3,a=new s.Vector3;t.distanceSqToSegment(M.start,M.end,a,i),r.push({point:a,pointOnLine:i,distance:t.origin.distanceTo(a),object:e,face:null,faceIndex:n,uv:null,uv1:null})}}}(this,l,n))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(m),this.material.uniforms.resolution.value.set(m.z,m.w))}}e.s(["LineSegments2",0,z],92923);class U extends c{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,i=new Float32Array(2*t);for(let n=0;n<t;n+=3)i[2*n]=e[n],i[2*n+1]=e[n+1],i[2*n+2]=e[n+2],i[2*n+3]=e[n+3],i[2*n+4]=e[n+4],i[2*n+5]=e[n+5];return super.setPositions(i),this}setColors(e){let t=e.length-3,i=new Float32Array(2*t);for(let n=0;n<t;n+=3)i[2*n]=e[n],i[2*n+1]=e[n+1],i[2*n+2]=e[n+2],i[2*n+3]=e[n+3],i[2*n+4]=e[n+4],i[2*n+5]=e[n+5];return super.setColors(i),this}setFromPoints(e){let t=e.length-1,i=new Float32Array(6*t);for(let n=0;n<t;n++)i[6*n]=e[n].x,i[6*n+1]=e[n].y,i[6*n+2]=e[n].z||0,i[6*n+3]=e[n+1].x,i[6*n+4]=e[n+1].y,i[6*n+5]=e[n+1].z||0;return super.setPositions(i),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class F extends z{constructor(e=new U,t=new p({color:0xffffff*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let L=e=>e instanceof a.Vector3||e instanceof a.Vector4?[e.x,e.y,e.z]:e instanceof a.Vector2?[e.x,e.y,0]:Array.isArray(e)?2===e.length?[e[0],e[1],0]:[e[0],e[1],e[2]]:[e,0,0],B=e=>e instanceof a.Color?e.toArray():e,D=(0,r.forwardRef)(function({points:e,color:t=0xffffff,vertexColors:i,linewidth:a,lineWidth:s,segments:l,dashed:u,...d},f){let h=(0,o.useThree)(e=>e.size),m=(0,r.useMemo)(()=>l?new z:new F,[l]),[g]=(0,r.useState)(()=>new p),v=i?.[0]?.length===4?4:3,y=e.flatMap(L),w=y.join(","),x=i?i.flatMap(B):null,b=x?x.join(","):"",S=(0,r.useMemo)(()=>{let e=l?new c:new U;return e.setPositions(y),x&&e.setColors(x,v),e},[w,b,l,v]);return(0,r.useLayoutEffect)(()=>{m.computeLineDistances()},[S,m]),(0,r.useLayoutEffect)(()=>{u?g.defines.USE_DASH="":delete g.defines.USE_DASH,g.needsUpdate=!0},[u,g]),(0,r.useEffect)(()=>()=>S.dispose(),[S]),(0,r.useEffect)(()=>()=>g.dispose(),[g]),(0,n.jsxs)("primitive",{object:m,ref:f,...d,children:[(0,n.jsx)("primitive",{object:S,attach:"geometry"}),(0,n.jsx)("primitive",{object:g,attach:"material",color:i?0xffffff:t,vertexColors:!!i,resolution:[h.width,h.height],linewidth:a??s??1,dashed:u,transparent:4===v,...d})]})});e.s(["default",0,D],43758)},78461,e=>{"use strict";var t=e.i(71645),i=e.i(85709),n=e.i(67561);let r=["navigation.headingTrue","navigation.headingMagnetic","navigation.courseOverGroundTrue","navigation.courseOverGroundMagnetic","navigation.position"],a=null;e.s(["default",0,()=>{let{convertLatLonToXY:e}=(0,n.useOcearoContext)(),o=(0,i.useSignalKPaths)(r),s=o["navigation.headingTrue"]??o["navigation.headingMagnetic"]??o["navigation.courseOverGroundTrue"]??o["navigation.courseOverGroundMagnetic"],l=Number.isFinite(s),u=o["navigation.position"],d=Number.isFinite(u?.latitude)&&Number.isFinite(u?.longitude);return{heading:l?s:0,offset:(0,t.useMemo)(()=>{if(!d)return{x:0,y:0};let t={lat:u.latitude,lon:u.longitude};return e(t,(a||(a=t),a))},[u,d,e]),hasFix:d,hasHeading:l}},"getSessionOrigin",0,()=>a])},5941,e=>{"use strict";let t=[1,.8,.6];function i(e){return t[Math.min(Math.max(e,0),2)]}function n(e,t){return Math.max(.05,Math.min(1,1-.6*e-.3*t))}function r(e,t){return Math.PI/6*Math.max(0,1-1.9438444924574*t/30)*(1-e)}function a(e,t,i){let n=Math.min(1,1.9438444924574*(e.tws||0)/30),r=t.tension||.5;switch(i){case"mainSheet":return Math.min(1,.5*n+.3*r+.3*t.mainCar);case"jibSheet":return Math.min(1,.5*n+.3*r+.3*t.jibCar);case"vang":return Math.min(1,.6*n+.4*r);case"cunningham":return Math.min(1,.4*n+.6*r);case"backstay":return Math.min(1,Math.max(0,1-Math.abs(Math.atan2(Math.sin(e.awa||0),Math.cos(e.awa||0)))/Math.PI)*n*.9+.3*r);default:return r}}function o(e){let t=Math.max(0,Math.min(1,e));if(t<=.5){let e=2*t;return{r:e,g:1-.3*e,b:0}}return{r:1,g:.7*(1-(t-.5)*2),b:0}}e.s(["getReefHeightFactor",0,i,"tensionToColor",0,o,"updateSailTrim",0,function({tws:e=0,twa:t=0,awa:s=0,mainCar:l=.5,jibCar:u=.5,tension:d=.5}){let c,f=(c=1.9438444924574*e)>25?2:+(c>18),h=i(f),p=n(l,d),m=n(u,d),g=r(l,e),v=r(u,e),y={tws:e,twa:t,awa:s},w={mainCar:l,jibCar:u,tension:d},x={mainSheet:a(y,w,"mainSheet"),jibSheet:a(y,w,"jibSheet"),vang:a(y,w,"vang"),cunningham:a(y,w,"cunningham"),backstay:a(y,w,"backstay")},b={mainSheet:o(x.mainSheet),jibSheet:o(x.jibSheet),vang:o(x.vang),cunningham:o(x.cunningham),backstay:o(x.backstay)};return{reefLevel:f,reefHeightFactor:h,mainCamber:p,jibCamber:m,mainTwist:g,jibTwist:v,tensions:x,tensionColors:b}}])},77291,24752,e=>{"use strict";var t=e.i(71645),i=e.i(62588),n=e.i(85709),r=e.i(61969),a=e.i(539);let o=Math.PI/180,s={power:1,sail:2,fishing:3,restricted:4},l=e=>{let t=String(e.navState||"").toLowerCase();if(/not under command|restricted|constrained/.test(t))return"restricted";if(/fishing/.test(t))return"fishing";if(/sailing/.test(t))return"sail";if(/motoring|engine/.test(t))return"power";let i=Number(e.shipType);return 36===i?"sail":30===i?"fishing":33===i?"restricted":"power"},u=(e,t,i)=>(0,a.wrapPi)(Math.atan2(t.x-e.x,t.y-e.y)-i),d=(e,t,i)=>{let n={x:0,y:0},r=u(n,t,e.course),l=u(t,n,t.course),d=Math.sign(l)||1,c=e=>Math.abs(e)>112.5*o;if(c(r)&&t.speed>e.speed)return{ownRole:"stand-on",rule:"13",reason:"overtakenByTarget",targetTurn:0};if(c(l)&&e.speed>t.speed)return{ownRole:"give-way",rule:"13",reason:"overtaking",targetTurn:0};let f=s[e.category]??1,h=s[t.category]??1;if(f!==h)return f<h?{ownRole:"give-way",rule:"18",reason:`giveWayTo_${t.category}`,targetTurn:0}:{ownRole:"stand-on",rule:"18",reason:`standOnFrom_${t.category}`,targetTurn:d};if("sail"===e.category&&Number.isFinite(i)){let n=(0,a.wrapPi)(i-e.course)>=0?"starboard":"port";return n!==((0,a.wrapPi)(i-t.course)>=0?"starboard":"port")?"port"===n?{ownRole:"give-way",rule:"12a-i",reason:"portTack",targetTurn:0}:{ownRole:"stand-on",rule:"12a-i",reason:"targetPortTack",targetTurn:d}:t.x*Math.sin(i)+t.y*Math.cos(i)>0?{ownRole:"stand-on",rule:"12a-ii",reason:"targetWindward",targetTurn:d}:{ownRole:"give-way",rule:"12a-ii",reason:"ownWindward",targetTurn:0}}return Math.abs((0,a.wrapPi)(t.course-e.course-Math.PI))<10*o&&Math.abs(r)<6*o?{ownRole:"both",rule:"14",reason:"headOn",targetTurn:1}:r>0?{ownRole:"give-way",rule:"15",reason:"crossingStarboard",targetTurn:0}:{ownRole:"stand-on",rule:"15",reason:"crossingPort",targetTurn:d}};e.s(["rightOfWay",0,d,"targetCategory",0,l],24752);var c=e.i(83402),f=e.i(67561);let h=[],p=["navigation.speedOverGround","navigation.courseOverGroundTrue"];e.s(["default",0,({always:e=!1}={})=>{let a,o,{targets:s}=(0,i.useAIS)({passive:!0}),{states:u}=(0,f.useOcearoContext)(),m=u.anchorWatch||u.parkingMode||u.moored,g=(e||u.ais)&&!m?s:h,{twd:v,heading:y}=(0,r.default)(),w=(0,n.useSignalKPaths)(p),x=(a=(0,n.useSignalKPrefix)("propulsion."),o=c.default.get("ownVesselCategory"),(0,t.useMemo)(()=>"sail"===o||"power"===o?o:Object.entries(a).some(([e,t])=>e.endsWith(".revolutions")&&Number(t)>.5||e.endsWith(".state")&&"started"===t)?"power":"sail",[a,o])),b=c.default.get("aisLengthScalingFactor")||.7;return(0,t.useMemo)(()=>{let e=w["navigation.courseOverGroundTrue"]??y,t=w["navigation.speedOverGround"]??0,i=[];if(Number.isFinite(e))for(let n of g){if("danger"!==n.risk)continue;let r=n.cog??n.cogMagnetic??n.heading;if(!Number.isFinite(r)||null===n.sceneX)continue;let a=d({course:e,speed:t,category:x},{x:n.sceneX/b,y:-n.sceneZ/b,course:r,speed:n.sog??0,category:l(n)},v);i.push({target:{...n},role:a})}i.sort((e,t)=>(e.target.tcpaSeconds??1/0)-(t.target.tcpaSeconds??1/0));let n={};for(let e of g)"close"===e.risk?n[e.mmsi]="close":"danger"===e.risk&&(n[e.mmsi]="giveWay");for(let e of i)n[e.target.mmsi]="stand-on"===e.role.ownRole?"yields":"giveWay";let r=i.filter(e=>"stand-on"!==e.role.ownRole);return{ownCategory:x,encounters:i,statuses:n,giveWay:r.length>0,giveWayTo:r[0]||null,primary:i[0]||null}},[g,v,y,w,x,b])}],77291)},61969,e=>{"use strict";var t=e.i(71645),i=e.i(85709),n=e.i(539),r=e.i(37256);let a=180/Math.PI,o=["navigation.speedThroughWater","navigation.speedOverGround","navigation.headingTrue","navigation.courseOverGroundTrue","environment.wind.speedTrue","environment.wind.angleTrueWater","environment.wind.directionTrue","performance.polarSpeed","performance.polarSpeedRatio",...(0,r.coursePaths)("bearingTrue")];e.s(["default",0,()=>{let e=(0,i.useSignalKPaths)(o);return(0,t.useMemo)(()=>{let t=e["navigation.speedThroughWater"]??e["navigation.speedOverGround"]??null,i=e["navigation.headingTrue"]??e["navigation.courseOverGroundTrue"]??null,o=e["environment.wind.speedTrue"]??null,s=e["environment.wind.angleTrueWater"]??null,l=e["environment.wind.directionTrue"]??null;null===l&&Number.isFinite(s)&&Number.isFinite(i)&&(l=(0,n.wrapPi)(i+s));let u=e["performance.polarSpeed"]??(Number.isFinite(o)&&Number.isFinite(s)?(0,n.polarSpeedSi)(o,s):null),d=e["performance.polarSpeedRatio"]??null;null===d&&Number.isFinite(t)&&Number.isFinite(u)&&u>.2&&(d=t/u);let c=Number.isFinite(t)&&Number.isFinite(u)?(t-u)*1.943844:null,f=null,h=null,p=!Number.isFinite(s)||Math.abs(s)<Math.PI/2;if(Number.isFinite(o)){let e=p?(0,n.optimalUpwind)(1.943844*o):(0,n.optimalDownwind)(1.943844*o);e&&(f=e.twa/a,Number.isFinite(l)&&Number.isFinite(s)&&(h=(0,n.wrapPi)(l-Math.sign(s||1)*f)))}let m=(0,r.courseValue)(e,"bearingTrue"),g=null;if(Number.isFinite(m)&&Number.isFinite(l)&&Number.isFinite(o)){let e=(0,n.bestVmcHeading)({twd:l,tws:o,bearing:m}),t=Number.isFinite(i)?(0,n.vmcForHeading)({twd:l,tws:o,bearing:m,heading:i}):null;g=e?{bearing:m,best:e,current:t}:null}return{ratio:d,polarSpeed:u,boatSpeed:t,deltaKn:c,heading:i,twd:l,tws:o,twa:s,targetTwa:f,targetHeading:h,upwind:p,vmc:g}},[e])}])},83646,e=>{"use strict";var t=e.i(67561);e.s(["default",0,()=>(0,t.useOcearoContext)().tokens])},60099,31067,95393,e=>{"use strict";let t,i;function n(){return(n=Object.assign.bind()).apply(null,arguments)}e.s(["default",()=>n],31067);var r=e.i(71645),a=e.i(88014),o=e.i(90072),s=e.i(90874),l=e.i(61949);e.s(["useFrame",()=>l.F],95393);var l=l;let u=new o.Vector3,d=new o.Vector3,c=new o.Vector3,f=new o.Vector2;function h(e,t,i){let n=u.setFromMatrixPosition(e.matrixWorld);n.project(t);let r=i.width/2,a=i.height/2;return[n.x*r+r,-(n.y*a)+a]}let p=e=>1e-10>Math.abs(e)?0:e;function m(e,t,i=""){let n="matrix3d(";for(let i=0;16!==i;i++)n+=p(t[i]*e.elements[i])+(15!==i?",":")");return i+n}let g=(t=[1,-1,1,1,1,-1,1,1,1,-1,1,1,1,-1,1,1],e=>m(e,t)),v=(i=e=>[1/e,1/e,1/e,1,-1/e,-1/e,-1/e,-1,1/e,1/e,1/e,1,1,1,1,1],(e,t)=>m(e,i(t),"translate(-50%,-50%)")),y=r.forwardRef(({children:e,eps:t=.001,style:i,className:m,prepend:y,center:w,fullscreen:x,portal:b,distanceFactor:S,sprite:M=!1,transform:E=!1,occlude:P,onOcclude:_,castShadow:A,receiveShadow:T,material:z,geometry:U,zIndexRange:F=[0x1000037,0],calculatePosition:L=h,as:B="div",wrapperClass:D,pointerEvents:O="auto",...W},N)=>{let{gl:C,camera:R,scene:I,size:j,raycaster:V,events:H,viewport:G}=(0,s.useThree)(),[k]=r.useState(()=>document.createElement(B)),$=r.useRef(null),K=r.useRef(null),q=r.useRef(0),X=r.useRef([0,0]),Z=r.useRef(null),J=r.useRef(null),Q=(null==b?void 0:b.current)||H.connected||C.domElement.parentNode,Y=r.useRef(null),ee=r.useRef(!1),et=r.useMemo(()=>{var e;return P&&"blending"!==P||Array.isArray(P)&&P.length&&(e=P[0])&&"object"==typeof e&&"current"in e},[P]);r.useLayoutEffect(()=>{let e=C.domElement;P&&"blending"===P?(e.style.zIndex=`${Math.floor(F[0]/2)}`,e.style.position="absolute",e.style.pointerEvents="none"):(e.style.zIndex=null,e.style.position=null,e.style.pointerEvents=null)},[P]),r.useLayoutEffect(()=>{if(K.current){let e=$.current=a.createRoot(k);if(I.updateMatrixWorld(),E)k.style.cssText="position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;";else{let e=L(K.current,R,j);k.style.cssText=`position:absolute;top:0;left:0;transform:translate3d(${e[0]}px,${e[1]}px,0);transform-origin:0 0;`}return Q&&(y?Q.prepend(k):Q.appendChild(k)),()=>{Q&&Q.removeChild(k),e.unmount()}}},[Q,E]),r.useLayoutEffect(()=>{D&&(k.className=D)},[D]);let ei=r.useMemo(()=>E?{position:"absolute",top:0,left:0,width:j.width,height:j.height,transformStyle:"preserve-3d",pointerEvents:"none"}:{position:"absolute",transform:w?"translate3d(-50%,-50%,0)":"none",...x&&{top:-j.height/2,left:-j.width/2,width:j.width,height:j.height},...i},[i,w,x,j,E]),en=r.useMemo(()=>({position:"absolute",pointerEvents:O}),[O]);r.useLayoutEffect(()=>{var t,n;ee.current=!1,E?null==(t=$.current)||t.render(r.createElement("div",{ref:Z,style:ei},r.createElement("div",{ref:J,style:en},r.createElement("div",{ref:N,className:m,style:i,children:e})))):null==(n=$.current)||n.render(r.createElement("div",{ref:N,style:ei,className:m,children:e}))});let er=r.useRef(!0);(0,l.F)(e=>{if(K.current){R.updateMatrixWorld(),K.current.updateWorldMatrix(!0,!1);let e=E?X.current:L(K.current,R,j);if(E||Math.abs(q.current-R.zoom)>t||Math.abs(X.current[0]-e[0])>t||Math.abs(X.current[1]-e[1])>t){var i;let t,n,r,a,s=(i=K.current,t=u.setFromMatrixPosition(i.matrixWorld),n=d.setFromMatrixPosition(R.matrixWorld),r=t.sub(n),a=R.getWorldDirection(c),r.angleTo(a)>Math.PI/2),l=!1;et&&(Array.isArray(P)?l=P.map(e=>e.current):"blending"!==P&&(l=[I]));let h=er.current;l?er.current=function(e,t,i,n){let r=u.setFromMatrixPosition(e.matrixWorld),a=r.clone();a.project(t),f.set(a.x,a.y),i.setFromCamera(f,t);let o=i.intersectObjects(n,!0);if(o.length){let e=o[0].distance;return r.distanceTo(i.ray.origin)<e}return!0}(K.current,R,V,l)&&!s:er.current=!s,h!==er.current&&(_?_(!er.current):k.style.display=er.current?"block":"none");let m=Math.floor(F[0]/2),y=P?et?[F[0],m]:[m-1,0]:F;if(k.style.zIndex=`${function(e,t,i){if(t instanceof o.PerspectiveCamera||t instanceof o.OrthographicCamera){let n=u.setFromMatrixPosition(e.matrixWorld),r=d.setFromMatrixPosition(t.matrixWorld),a=n.distanceTo(r),o=(i[1]-i[0])/(t.far-t.near),s=i[1]-o*t.far;return Math.round(o*a+s)}}(K.current,R,y)}`,E){let[e,t]=[j.width/2,j.height/2],i=R.projectionMatrix.elements[5]*t,{isOrthographicCamera:n,top:r,left:a,bottom:o,right:s}=R,l=g(R.matrixWorldInverse),u=n?`scale(${i})translate(${p(-(s+a)/2)}px,${p((r+o)/2)}px)`:`translateZ(${i}px)`,d=K.current.matrixWorld;M&&((d=R.matrixWorldInverse.clone().transpose().copyPosition(d).scale(K.current.scale)).elements[3]=d.elements[7]=d.elements[11]=0,d.elements[15]=1),k.style.width=j.width+"px",k.style.height=j.height+"px",k.style.perspective=n?"":`${i}px`,Z.current&&J.current&&(Z.current.style.transform=`${u}${l}translate(${e}px,${t}px)`,J.current.style.transform=v(d,1/((S||10)/400)))}else{let t=void 0===S?1:function(e,t){if(t instanceof o.OrthographicCamera)return t.zoom;if(!(t instanceof o.PerspectiveCamera))return 1;{let i=u.setFromMatrixPosition(e.matrixWorld),n=d.setFromMatrixPosition(t.matrixWorld);return 1/(2*Math.tan(t.fov*Math.PI/180/2)*i.distanceTo(n))}}(K.current,R)*S;k.style.transform=`translate3d(${e[0]}px,${e[1]}px,0) scale(${t})`}X.current=e,q.current=R.zoom}}if(!et&&Y.current&&!ee.current)if(E){if(Z.current){let e=Z.current.children[0];if(null!=e&&e.clientWidth&&null!=e&&e.clientHeight){let{isOrthographicCamera:t}=R;if(t||U)W.scale&&(Array.isArray(W.scale)?W.scale instanceof o.Vector3?Y.current.scale.copy(W.scale.clone().divideScalar(1)):Y.current.scale.set(1/W.scale[0],1/W.scale[1],1/W.scale[2]):Y.current.scale.setScalar(1/W.scale));else{let t=(S||10)/400,i=e.clientWidth*t,n=e.clientHeight*t;Y.current.scale.set(i,n,1)}ee.current=!0}}}else{let t=k.children[0];if(null!=t&&t.clientWidth&&null!=t&&t.clientHeight){let e=1/G.factor,i=t.clientWidth*e,n=t.clientHeight*e;Y.current.scale.set(i,n,1),ee.current=!0}Y.current.lookAt(e.camera.position)}});let ea=r.useMemo(()=>({vertexShader:E?void 0:`
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
      `}),[E]);return r.createElement("group",n({},W,{ref:K}),P&&!et&&r.createElement("mesh",{castShadow:A,receiveShadow:T,ref:Y},U||r.createElement("planeGeometry",null),z||r.createElement("shaderMaterial",{side:o.DoubleSide,vertexShader:ea.vertexShader,fragmentShader:ea.fragmentShader})))});e.s(["Html",0,y],60099)},74452,(e,t,i)=>{t.exports={vpp:{angles:[52,60,75,90,110,120,135,150],speeds:[6,8,10,12,14,16,20],52:[4.98,5.86,6.31,6.45,6.51,6.52,6.41],60:[5.25,6.11,6.56,6.73,6.79,6.82,6.79],75:[5.45,6.33,6.77,7.01,7.13,7.2,7.24],90:[5.66,6.55,7,7.25,7.38,7.53,7.7],110:[5.49,6.49,7.04,7.4,7.69,7.97,8.38],120:[5.32,6.36,6.97,7.39,7.77,8.1,8.6],135:[4.81,5.92,6.68,7.15,7.55,7.95,8.85],150:[4.09,5.17,6.04,6.61,6.99,7.31,7.93],beat_angle:[43.6,42,41.2,41.2,41.7,42.1,44.2],beat_vmg:[3.26,3.91,4.24,4.34,4.36,4.34,4.16],run_angle:[144.8,147.8,148.5,149.6,171.8,175.4,177.2],run_vmg:[3.54,4.48,5.23,5.73,6.17,6.67,7.36]}}},539,e=>{"use strict";var t=e.i(74452);let i=180/Math.PI,n=t.default.vpp,r=(e,t,i)=>e+(t-e)*i,a=(e,t)=>{if(t<=e[0])return[0,0];let i=e.length-1;if(t>=e[i])return[i-1,1];let n=0;for(;t>e[n+1];)n++;return[n,(t-e[n])/(e[n+1]-e[n])]},o=n.speeds.map((e,t)=>(e=>{let t=n.beat_angle[e],r=n.run_angle[e],a=n.beat_vmg[e]/Math.cos(t/i),o=n.run_vmg[e]/Math.abs(Math.cos(r/i)),s=[[0,0],[.7*t,.55*a],[t,a]];for(let i of n.angles)i>t&&i<r&&s.push([i,n[String(i)][e]]);return s.push([r,o]),r<180&&s.push([180,n.run_vmg[e]]),s})(t)),s=(e,t)=>{let[i,n]=a(e.map(e=>e[0]),t);return r(e[i][1],e[i+1][1],n)},l=(e,t)=>{if(!Number.isFinite(e)||!Number.isFinite(t)||e<=0)return null;let i=Math.min(180,Math.abs((t+540)%360-180)),l=n.speeds;if(e<l[0])return s(o[0],i)*(e/l[0]);let[u,d]=a(l,e);return r(s(o[u],i),s(o[u+1],i),d)},u=(e,t)=>{let[i,o]=a(n.speeds,t);return r(e[i],e[i+1],o)},d=(e,t)=>{let n=l(1.943844*e,t*i);return null===n?null:n/1.943844},c=e=>{let t=(e+Math.PI)%(2*Math.PI);return t<0&&(t+=2*Math.PI),t-Math.PI};e.s(["bestVmcHeading",0,({twd:e,tws:t,bearing:n})=>{if(![e,t,n].every(Number.isFinite)||t<=0)return null;let r=null;for(let a=-100;a<=100;a++){let o=n+a/i,s=d(t,c(e-o));if(null===s)continue;let l=s*Math.cos(o-n);(!r||l>r.vmc)&&(r={heading:c(o),speed:s,vmc:l})}return r},"optimalDownwind",0,e=>{if(!Number.isFinite(e)||e<=0)return null;let t=u(n.run_angle,e),r=l(e,t);return{twa:t,speed:r,vmg:-r*Math.cos(t/i)}},"optimalUpwind",0,e=>{if(!Number.isFinite(e)||e<=0)return null;let t=u(n.beat_angle,e),r=l(e,t);return{twa:t,speed:r,vmg:r*Math.cos(t/i)}},"polarSpeed",0,l,"polarSpeedSi",0,d,"vmcForHeading",0,({twd:e,tws:t,bearing:i,heading:n})=>{if(![e,t,i,n].every(Number.isFinite))return null;let r=d(t,c(e-n));return null===r?null:r*Math.cos(n-i)},"wrapPi",0,c])}]);