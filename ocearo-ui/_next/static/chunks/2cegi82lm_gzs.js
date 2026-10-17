(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,43758,30728,27530,92923,e=>{"use strict";let t,r;var i=e.i(43476),n=e.i(71645),a=e.i(90072),o=e.i(90874),s=a,l=a;let u=new l.Box3,d=new l.Vector3;class c extends l.InstancedBufferGeometry{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new l.Float32BufferAttribute([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new l.Float32BufferAttribute([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,r=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),r.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let r=new l.InstancedInterleavedBuffer(t,6,1);return this.setAttribute("instanceStart",new l.InterleavedBufferAttribute(r,3,0)),this.setAttribute("instanceEnd",new l.InterleavedBufferAttribute(r,3,3)),this.instanceCount=this.attributes.instanceStart.count,this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let r=new l.InstancedInterleavedBuffer(t,6,1);return this.setAttribute("instanceColorStart",new l.InterleavedBufferAttribute(r,3,0)),this.setAttribute("instanceColorEnd",new l.InterleavedBufferAttribute(r,3,3)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new l.WireframeGeometry(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new l.Box3);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;void 0!==e&&void 0!==t&&(this.boundingBox.setFromBufferAttribute(e),u.setFromBufferAttribute(t),this.boundingBox.union(u))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new l.Sphere),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(void 0!==e&&void 0!==t){let r=this.boundingSphere.center;this.boundingBox.getCenter(r);let i=0;for(let n=0,a=e.count;n<a;n++)d.fromBufferAttribute(e,n),i=Math.max(i,r.distanceToSquared(d)),d.fromBufferAttribute(t,n),i=Math.max(i,r.distanceToSquared(d));this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}}e.s(["LineSegmentsGeometry",0,c],30728);var f=e.i(8560),h=a;f.UniformsLib.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new h.Vector2},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}},f.ShaderLib.line={uniforms:h.UniformsUtils.merge([f.UniformsLib.common,f.UniformsLib.fog,f.UniformsLib.line]),vertexShader:`
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
		`};class m extends h.ShaderMaterial{constructor(e){super({type:"LineMaterial",uniforms:h.UniformsUtils.clone(f.ShaderLib.line.uniforms),vertexShader:f.ShaderLib.line.vertexShader,fragmentShader:f.ShaderLib.line.fragmentShader,clipping:!0}),this.isLineMaterial=!0,this.setValues(e)}get color(){return this.uniforms.diffuse.value}set color(e){this.uniforms.diffuse.value=e}get worldUnits(){return"WORLD_UNITS"in this.defines}set worldUnits(e){!0===e!==this.worldUnits&&(this.needsUpdate=!0),!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(e){this.uniforms.linewidth&&(this.uniforms.linewidth.value=e)}get dashed(){return"USE_DASH"in this.defines}set dashed(e){!0===e!==this.dashed&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(e){this.uniforms.dashScale.value=e}get dashSize(){return this.uniforms.dashSize.value}set dashSize(e){this.uniforms.dashSize.value=e}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(e){this.uniforms.dashOffset.value=e}get gapSize(){return this.uniforms.gapSize.value}set gapSize(e){this.uniforms.gapSize.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}get resolution(){return this.uniforms.resolution.value}set resolution(e){this.uniforms.resolution.value.copy(e)}get alphaToCoverage(){return"USE_ALPHA_TO_COVERAGE"in this.defines}set alphaToCoverage(e){this.defines&&(!0===e!==this.alphaToCoverage&&(this.needsUpdate=!0),!0===e?this.defines.USE_ALPHA_TO_COVERAGE="":delete this.defines.USE_ALPHA_TO_COVERAGE)}}e.s(["LineMaterial",0,m],27530);let p=new s.Vector4,v=new s.Vector3,g=new s.Vector3,y=new s.Vector4,w=new s.Vector4,x=new s.Vector4,b=new s.Vector3,M=new s.Matrix4,S=new s.Line3,E=new s.Vector3,D=new s.Box3,A=new s.Sphere,F=new s.Vector4;function _(e,t,i){return F.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),F.multiplyScalar(1/F.w),F.x=r/i.width,F.y=r/i.height,F.applyMatrix4(e.projectionMatrixInverse),F.multiplyScalar(1/F.w),Math.abs(Math.max(F.x,F.y))}class z extends s.Mesh{constructor(e=new c,t=new m({color:0xffffff*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,r=e.attributes.instanceEnd,i=new Float32Array(2*t.count);for(let e=0,n=0,a=t.count;e<a;e++,n+=2)v.fromBufferAttribute(t,e),g.fromBufferAttribute(r,e),i[n]=0===n?0:i[n-1],i[n+1]=i[n]+v.distanceTo(g);let n=new s.InstancedInterleavedBuffer(i,2,1);return e.setAttribute("instanceDistanceStart",new s.InterleavedBufferAttribute(n,1,0)),e.setAttribute("instanceDistanceEnd",new s.InterleavedBufferAttribute(n,1,1)),this}raycast(e,i){let n,a,o=this.material.worldUnits,l=e.camera;if(null!==l||o||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.'),!1===o&&(0===this.material.resolution.x||0===this.material.resolution.y))return;let u=void 0!==e.params.Line2&&e.params.Line2.threshold||0;t=e.ray;let d=this.matrixWorld,c=this.geometry,f=this.material;if(r=f.linewidth+u,null===c.boundingSphere&&c.computeBoundingSphere(),A.copy(c.boundingSphere).applyMatrix4(d),o)n=.5*r;else{let e=Math.max(l.near,A.distanceToPoint(t.origin));n=_(l,e,f.resolution)}if(A.radius+=n,!1!==t.intersectsSphere(A)){if(null===c.boundingBox&&c.computeBoundingBox(),D.copy(c.boundingBox).applyMatrix4(d),o)a=.5*r;else{let e=Math.max(l.near,D.distanceToPoint(t.origin));a=_(l,e,f.resolution)}D.expandByScalar(a),!1!==t.intersectsBox(D)&&(o?function(e,i){let n=e.matrixWorld,a=e.geometry,o=a.attributes.instanceStart,l=a.attributes.instanceEnd,u=Math.min(a.instanceCount,o.count);for(let a=0;a<u;a++){S.start.fromBufferAttribute(o,a),S.end.fromBufferAttribute(l,a),S.applyMatrix4(n);let u=new s.Vector3,d=new s.Vector3;t.distanceSqToSegment(S.start,S.end,d,u),d.distanceTo(u)<.5*r&&i.push({point:d,pointOnLine:u,distance:t.origin.distanceTo(d),object:e,face:null,faceIndex:a,uv:null,uv1:null})}}(this,i):function(e,i,n){let a=i.projectionMatrix,o=e.material.resolution,l=e.matrixWorld,u=e.geometry,d=u.attributes.instanceStart,c=u.attributes.instanceEnd,f=Math.min(u.instanceCount,d.count),h=-i.near;t.at(1,x),x.w=1,x.applyMatrix4(i.matrixWorldInverse),x.applyMatrix4(a),x.multiplyScalar(1/x.w),x.x*=o.x/2,x.y*=o.y/2,x.z=0,b.copy(x),M.multiplyMatrices(i.matrixWorldInverse,l);for(let i=0;i<f;i++){if(y.fromBufferAttribute(d,i),w.fromBufferAttribute(c,i),y.w=1,w.w=1,y.applyMatrix4(M),w.applyMatrix4(M),y.z>h&&w.z>h)continue;if(y.z>h){let e=y.z-w.z,t=(y.z-h)/e;y.lerp(w,t)}else if(w.z>h){let e=w.z-y.z,t=(w.z-h)/e;w.lerp(y,t)}y.applyMatrix4(a),w.applyMatrix4(a),y.multiplyScalar(1/y.w),w.multiplyScalar(1/w.w),y.x*=o.x/2,y.y*=o.y/2,w.x*=o.x/2,w.y*=o.y/2,S.start.copy(y),S.start.z=0,S.end.copy(w),S.end.z=0;let u=S.closestPointToPointParameter(b,!0);S.at(u,E);let f=s.MathUtils.lerp(y.z,w.z,u),m=f>=-1&&f<=1,p=b.distanceTo(E)<.5*r;if(m&&p){S.start.fromBufferAttribute(d,i),S.end.fromBufferAttribute(c,i),S.start.applyMatrix4(l),S.end.applyMatrix4(l);let r=new s.Vector3,a=new s.Vector3;t.distanceSqToSegment(S.start,S.end,a,r),n.push({point:a,pointOnLine:r,distance:t.origin.distanceTo(a),object:e,face:null,faceIndex:i,uv:null,uv1:null})}}}(this,l,i))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(p),this.material.uniforms.resolution.value.set(p.z,p.w))}}e.s(["LineSegments2",0,z],92923);class P extends c{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,r=new Float32Array(2*t);for(let i=0;i<t;i+=3)r[2*i]=e[i],r[2*i+1]=e[i+1],r[2*i+2]=e[i+2],r[2*i+3]=e[i+3],r[2*i+4]=e[i+4],r[2*i+5]=e[i+5];return super.setPositions(r),this}setColors(e){let t=e.length-3,r=new Float32Array(2*t);for(let i=0;i<t;i+=3)r[2*i]=e[i],r[2*i+1]=e[i+1],r[2*i+2]=e[i+2],r[2*i+3]=e[i+3],r[2*i+4]=e[i+4],r[2*i+5]=e[i+5];return super.setColors(r),this}setFromPoints(e){let t=e.length-1,r=new Float32Array(6*t);for(let i=0;i<t;i++)r[6*i]=e[i].x,r[6*i+1]=e[i].y,r[6*i+2]=e[i].z||0,r[6*i+3]=e[i+1].x,r[6*i+4]=e[i+1].y,r[6*i+5]=e[i+1].z||0;return super.setPositions(r),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class C extends z{constructor(e=new P,t=new m({color:0xffffff*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let L=e=>e instanceof a.Vector3||e instanceof a.Vector4?[e.x,e.y,e.z]:e instanceof a.Vector2?[e.x,e.y,0]:Array.isArray(e)?2===e.length?[e[0],e[1],0]:[e[0],e[1],e[2]]:[e,0,0],N=e=>e instanceof a.Color?e.toArray():e,U=(0,n.forwardRef)(function({points:e,color:t=0xffffff,vertexColors:r,linewidth:a,lineWidth:s,segments:l,dashed:u,...d},f){let h=(0,o.useThree)(e=>e.size),p=(0,n.useMemo)(()=>l?new z:new C,[l]),[v]=(0,n.useState)(()=>new m),g=r?.[0]?.length===4?4:3,y=e.flatMap(L),w=y.join(","),x=r?r.flatMap(N):null,b=x?x.join(","):"",M=(0,n.useMemo)(()=>{let e=l?new c:new P;return e.setPositions(y),x&&e.setColors(x,g),e},[w,b,l,g]);return(0,n.useLayoutEffect)(()=>{p.computeLineDistances()},[M,p]),(0,n.useLayoutEffect)(()=>{u?v.defines.USE_DASH="":delete v.defines.USE_DASH,v.needsUpdate=!0},[u,v]),(0,n.useEffect)(()=>()=>M.dispose(),[M]),(0,n.useEffect)(()=>()=>v.dispose(),[v]),(0,i.jsxs)("primitive",{object:p,ref:f,...d,children:[(0,i.jsx)("primitive",{object:M,attach:"geometry"}),(0,i.jsx)("primitive",{object:v,attach:"material",color:r?0xffffff:t,vertexColors:!!r,resolution:[h.width,h.height],linewidth:a??s??1,dashed:u,transparent:4===g,...d})]})});e.s(["default",0,U],43758)},78461,e=>{"use strict";var t=e.i(71645),r=e.i(85709),i=e.i(67561);let n=["navigation.headingTrue","navigation.headingMagnetic","navigation.courseOverGroundTrue","navigation.courseOverGroundMagnetic","navigation.position"],a=null;e.s(["default",0,()=>{let{convertLatLonToXY:e}=(0,i.useOcearoContext)(),o=(0,r.useSignalKPaths)(n),s=o["navigation.headingTrue"]??o["navigation.headingMagnetic"]??o["navigation.courseOverGroundTrue"]??o["navigation.courseOverGroundMagnetic"],l=Number.isFinite(s),u=o["navigation.position"],d=Number.isFinite(u?.latitude)&&Number.isFinite(u?.longitude);return{heading:l?s:0,offset:(0,t.useMemo)(()=>{if(!d)return{x:0,y:0};let t={lat:u.latitude,lon:u.longitude};return e(t,(a||(a=t),a))},[u,d,e]),hasFix:d,hasHeading:l}},"getSessionOrigin",0,()=>a])},3666,3950,e=>{"use strict";let t="ocearo-offline-v2",r=["ocearo-offline-v1"],i=!1,n=async(e,{kind:n="tile"}={})=>{if(!("u">typeof caches))return fetch(e,{referrerPolicy:"strict-origin-when-cross-origin"});i||(i=!0,r.forEach(e=>caches.delete(e).catch(()=>{})));let a=await caches.open(t);if("tile"===n){let t=await a.match(e);if(t)return t}try{let t=await fetch(e,{mode:"cors",referrerPolicy:"strict-origin-when-cross-origin"});if(t.ok)await a.put(e,t.clone());else{let t=await a.match(e);if(t)return t}return t}catch(r){let t=await a.match(e);if(t)return t;throw r}},a=async e=>{let t=await n(e,{kind:"tile"});if(!t.ok)throw Error(`${t.status} ${e}`);return createImageBitmap(await t.blob())},o=(e,t,r,i)=>{let n=2**i,a=(e,t)=>({x:Math.floor((t+180)/360*n),y:Math.floor((1-Math.log(Math.tan(e*Math.PI/180)+1/Math.cos(e*Math.PI/180))/Math.PI)/2*n)}),o=r/111320,s=r/(111320*Math.cos(e*Math.PI/180)),l=a(e+o,t-s),u=a(e-o,t+s),d=[];for(let e=l.x;e<=u.x;e++)for(let t=l.y;t<=u.y;t++)d.push({z:i,x:e,y:t});return d},s=async({lat:e,lon:t,radiusM:r,layers:i,urls:a=[],onProgress:s})=>{let l=[];for(let{template:n,zooms:a}of i)for(let i of a)for(let a of o(e,t,r,i))l.push(n.replace("{z}",a.z).replace("{x}",a.x).replace("{y}",a.y));l.push(...a);let u=0,d=0,c=[...l],f=async()=>{for(;c.length;){let e=c.shift();try{!(await n(e,{kind:e.includes("forecast")?"forecast":"tile"})).ok&&d++}catch{d++}u++,s?.(u,l.length,d)}};return await Promise.all(Array.from({length:4},f)),{done:u,failed:d,total:l.length}},l=async()=>{if(navigator.storage?.estimate){let{usage:e}=await navigator.storage.estimate();return e}return null},u=async(e,r)=>{if(!("u">typeof caches))return!1;let i=await caches.open(t);return await i.put(e,r),!0},d=async e=>{if(!("u">typeof caches))return null;let r=await caches.open(t);return await r.match(e)||null};e.s(["cachedFetch",0,n,"cachedImage",0,a,"clearOfflineCache",0,()=>"u">typeof caches?caches.delete(t):Promise.resolve(!1),"offlineCacheSize",0,l,"prefetchArea",0,s,"readCached",0,d,"storeCached",0,u],3950);let c={key:null,at:0,field:null},f=(e,t,r,i)=>({lat:e+(i/8*2-1)*4e4/6371e3*180/Math.PI,lon:t+(r/8*2-1)*4e4/(6371e3*Math.cos(e*Math.PI/180))*180/Math.PI}),h=(e,t)=>{let r=[],i=[];for(let n=0;n<9;n++)for(let a=0;a<9;a++){let o=f(e,t,a,n);r.push(o.lat.toFixed(4)),i.push(o.lon.toFixed(4))}return`https://api.open-meteo.com/v1/forecast?latitude=${r.join(",")}&longitude=${i.join(",")}&hourly=wind_speed_10m,wind_direction_10m&wind_speed_unit=ms&forecast_hours=48&timezone=GMT`},m=async(e,t)=>{let r=`${e.toFixed(1)},${t.toFixed(1)}`;if(c.field&&c.key===r&&Date.now()-c.at<18e5)return c.field;let i=h(e,t),a=await n(i,{kind:"forecast"});if(!a.ok)throw Error(`Open-Meteo ${a.status}`);let o=await a.json(),s=Array.isArray(o)?o:[o],l=s[0]?.hourly?.time||[],u=l.length,d=[],f=[];for(let e=0;e<u;e++){let t=new Float32Array(81),r=new Float32Array(81);s.forEach((i,n)=>{let a=i.hourly.wind_speed_10m[e]??0,o=(i.hourly.wind_direction_10m[e]??0)*Math.PI/180;t[n]=-a*Math.sin(o),r[n]=-a*Math.cos(o)}),d.push(t),f.push(r)}let m={origin:{lat:e,lon:t},start:Date.parse(`${l[0]}Z`),hours:u,u:d,v:f,source:"open-meteo"};return c={key:r,at:Date.now(),field:m},m},p=[[0,[98,113,183]],[1,[57,97,159]],[3,[74,148,169]],[5,[77,141,123]],[7,[83,165,83]],[9,[53,159,53]],[11,[167,157,81]],[13,[159,127,58]],[15,[161,108,92]],[17,[129,58,78]],[19,[175,80,136]],[21,[117,74,147]],[24,[109,97,163]],[27,[68,105,141]],[29,[92,144,152]],[36,[125,68,165]]];e.s(["HALF_EXTENT_M",0,4e4,"WINDY_SCALE",0,p,"fetchWindField",0,m,"sampleWind",0,(e,t,r,i=0)=>{let n=Math.min(9-1.001,Math.max(0,(t/4e4+1)/2*8)),a=Math.min(9-1.001,Math.max(0,(r/4e4+1)/2*8)),o=Math.floor(n),s=Math.floor(a),l=n-o,u=a-s,d=Math.min(e.hours-1,Math.max(0,Math.floor(i))),c=Math.min(e.hours-1,d+1),f=Math.min(1,Math.max(0,i-d)),h=(e,t)=>{let r=e[t],i=9*s+o;return(r[i]*(1-l)+r[i+1]*l)*(1-u)+(r[i+9]*(1-l)+r[i+9+1]*l)*u};return{u:h(e.u,d)*(1-f)+h(e.u,c)*f,v:h(e.v,d)*(1-f)+h(e.v,c)*f}},"uniformField",0,(e,t,r,i)=>{let n=new Float32Array(81).fill(-r*Math.sin(i)),a=new Float32Array(81).fill(-r*Math.cos(i));return{origin:{lat:e,lon:t},start:Date.now(),hours:1,u:[n],v:[a],source:"boat"}},"windColor",0,e=>{if(e<=p[0][0])return p[0][1];for(let t=1;t<p.length;t++)if(e<=p[t][0]){let[r,i]=p[t-1],[n,a]=p[t],o=(e-r)/(n-r);return i.map((e,t)=>e+(a[t]-e)*o)}return p[p.length-1][1]},"windFieldUrl",0,h],3666)},71415,e=>{"use strict";var t=e.i(43476),r=e.i(71645),i=e.i(90072),n=e.i(60099),a=e.i(43758),o=e.i(83646),s=e.i(83402),l=e.i(85709),u=e.i(78461),d=e.i(3950),c=e.i(48390);e.i(85269);var f=e.i(22831);let h="https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png",m=10,p=.1,v=["navigation.position","design.draft","environment.tide.heightNow","environment.tide.heightHigh","environment.tide.heightLow","environment.depth.belowSurface","environment.depth.belowKeel","environment.depth.belowTransducer","environment.depth.surfaceToTransducer"],g=(e,t,r)=>{let i=2**r,n=e*Math.PI/180,a=(1-Math.log(Math.tan(n)+1/Math.cos(n))/Math.PI)/2*i;return{x:(t+180)/360*i,y:a}},y=(e,t,r)=>{let i=2**r;return{lat:180*Math.atan(Math.sinh(Math.PI*(1-2*t/i)))/Math.PI,lon:e/i*360-180}},w=new Map,x=async(e,t,r=h,i=m)=>{let n=g(e,t,i),a=Math.floor(n.x)-1,o=Math.floor(n.y)-1,s=`${r}|${i}/${a},${o}`;if(w.has(s))return w.get(s);let l=document.createElement("canvas");l.width=768,l.height=768;let u=l.getContext("2d",{willReadFrequently:!0});if(!(await Promise.all(Array.from({length:9},async(e,t)=>{let n=a+t%3,s=o+Math.floor(t/3),l=r.replace("{z}",i).replace("{x}",n).replace("{y}",s);try{let e=await (0,d.cachedImage)(l);return u.drawImage(e,t%3*256,256*Math.floor(t/3)),!0}catch{return!1}}))).some(Boolean))return null;let c=u.getImageData(0,0,768,768).data,f=new Float32Array(589824);for(let e=0;e<589824;e++)f[e]=c[4*e+3]<255?NaN:256*c[4*e]+c[4*e+1]+c[4*e+2]/256-32768;let p={heights:f,size:768,nw:y(a,o,i),se:y(a+3,o+3,i),z:i};return w.set(s,p),p},b=async(e,t)=>{let r=(0,c.bathymetryTileTemplate)(),[i,n]=await Promise.all([x(e,t),r?x(e,t,r,13).catch(()=>null):null]);if(!i&&!n)throw Error("No bathymetry");return{global:i,shom:n}},M=(e,t,r)=>{let{heights:i,size:n,nw:a,se:o,z:s}=e,l=(r-a.lon)/(o.lon-a.lon)*(n-1),u=g(a.lat,a.lon,s),d=g(o.lat,o.lon,s),c=(g(t,r,s).y-u.y)/(d.y-u.y)*(n-1);if(l<0||c<0||l>n-1||c>n-1)return NaN;let f=Math.min(n-2,Math.floor(l)),h=Math.min(n-2,Math.floor(c)),m=l-f,p=c-h,v=(e,t)=>i[t*n+e];return(v(f,h)*(1-m)+v(f+1,h)*m)*(1-p)+(v(f,h+1)*(1-m)+v(f+1,h+1)*m)*p},S=`
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
`,D={light:{water:"#8fd3ff",waterOpacity:.18,shallow:"#b5e0f2",mid:"#5fa8d8",deep:"#1c4f86",land:"#e2d6b8",drying:"#c7d3a6",line:"#0f3557",danger:"#e8873a",fade:"#e8eef3",text:"#0f2f4f",halo:"#ffffff"},dark:{water:"#7cc8f2",waterOpacity:.12,shallow:"#3a8fbc",mid:"#1d5f8c",deep:"#0b2238",land:"#4a4434",drying:"#34472e",line:"#8fdcff",danger:"#f0a060",fade:"#16191e",text:"#e6f4ff",halo:"#101216"},night:{water:"#c0503c",waterOpacity:.1,shallow:"#7a2a1e",mid:"#4f1a12",deep:"#24100c",land:"#3a1a10",drying:"#3a2410",line:"#ff8a72",danger:"#ffad80",fade:"#120807",text:"#ffb3a3",halo:"#0f0706"}},A=[96,40],F=`
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
`,_=`
    uniform sampler2D uMap;
    varying vec2 vUv;
    varying float vFade;
    void main() {
        vec4 t = texture2D(uMap, vUv);
        if (t.a * vFade < 0.05) discard;
        gl_FragColor = vec4(t.rgb, t.a * vFade);
        #include <colorspace_fragment>
    }
`,z=({items:e,palette:n})=>{let{geometry:a,material:o}=(0,r.useMemo)(()=>{if(!e.length)return{};let[t,r]=A,a=Math.ceil(e.length/16),o=document.createElement("canvas");o.width=16*t,o.height=r*a;let s=o.getContext("2d");s.textAlign="center",s.textBaseline="middle";let l=new i.PlaneGeometry(1,1),u=new i.InstancedBufferGeometry;u.index=l.index,u.setAttribute("position",l.attributes.position);let d=new Float32Array(3*e.length),c=new Float32Array(2*e.length);e.forEach((e,i)=>{let a=i%16*t,o=Math.floor(i/16)*r;s.font=`${e.danger?700:600} 28px Inter, Roboto, Arial, sans-serif`,s.lineWidth=7,s.strokeStyle=n.halo,s.strokeText(e.text,a+t/2,o+r/2+1),s.fillStyle=e.danger?n.danger:n.text,s.fillText(e.text,a+t/2,o+r/2+1),d.set(e.position,3*i),c.set([i%16,Math.floor(i/16)],2*i)}),u.setAttribute("aCenter",new i.InstancedBufferAttribute(d,3)),u.setAttribute("aCell",new i.InstancedBufferAttribute(c,2)),u.instanceCount=e.length;let f=new i.CanvasTexture(o);f.colorSpace=i.SRGBColorSpace,f.flipY=!1,f.anisotropy=4;let h=new i.ShaderMaterial({uniforms:{uMap:{value:f},uAtlas:{value:new i.Vector2(16,a)},uSize:{value:.03}},vertexShader:F,fragmentShader:_,transparent:!0,depthWrite:!1});return l.dispose(),{geometry:u,material:h}},[e,n]);return((0,r.useEffect)(()=>()=>{a?.dispose(),o?.uniforms.uMap.value.dispose(),o?.dispose()},[a,o]),a)?(0,t.jsx)("mesh",{geometry:a,material:o,frustumCulled:!1,renderOrder:3}):null},P=e=>e<10?e.toFixed(1):String(Math.round(e));e.s(["BATHY_ZOOM",0,10,"TERRARIUM",0,h,"default",0,({y:e=-.1})=>{let d,h=(0,l.useSignalKPaths)(v),{t:y}=(0,f.useTranslation)(),{id:w}=(0,o.default)(),x=h["navigation.position"],{heading:A}=(0,u.default)(),[F,_]=(0,r.useState)(null),C=s.default.get("aisLengthScalingFactor")||.7,L=Number.isFinite(h["design.draft"]?.maximum)?h["design.draft"].maximum:Number(s.default.get("boatDraft"))||2,N=h["environment.depth.belowSurface"],U=h["environment.depth.belowKeel"],T=h["environment.depth.belowTransducer"],B=h["environment.depth.surfaceToTransducer"],j=Number.isFinite(N)?N:Number.isFinite(U)?U+L:Number.isFinite(T)?T+(Number.isFinite(B)?B:0):null,I=D[w]||D.light,O=x?.latitude,R=x?.longitude,W=Number.isFinite(O)?(d=g(O,R,m),`${Math.floor(d.x)},${Math.floor(d.y)}`):null;(0,r.useEffect)(()=>{if(!W)return;let e=!1,t=null,r=()=>b(O,R).then(i=>{!e&&(_(i),!i.shom&&(0,c.bathymetryTileTemplate)()&&(t=setTimeout(r,6e4)))}).catch(()=>{e||(t=setTimeout(r,6e4))});return r(),()=>{e=!0,clearTimeout(t)}},[W]);let $=Number.isFinite(O)?Math.round(5e3*O):null,k=Number.isFinite(R)?Math.round(5e3*R):null,G=(0,r.useMemo)(()=>F&&null!==$?{survey:F.shom?M(F.shom,O,R):NaN,global:F.global?M(F.global,O,R):NaN}:{},[F,$,k]),V=(({tideNow:e,tideHigh:t,tideLow:r,measured:i,surveyHere:n,globalHere:a})=>{let o=(e,t=p)=>Math.round(e/t)*t;if(Number.isFinite(e)){let i=Number.isFinite(t)&&Number.isFinite(r)?e-(t+r)/2:0;return{cd:o(e),msl:o(i),source:"tide"}}if(Number.isFinite(i)&&(Number.isFinite(n)||Number.isFinite(a))){let e=Number.isFinite(n)?i+n:0,t=Number.isFinite(a)?i+a:0;return{cd:o(e,.5),msl:o(t,.5),source:"sounder"}}return{cd:0,msl:0,source:"datum"}})({tideNow:h["environment.tide.heightNow"],tideHigh:h["environment.tide.heightHigh"],tideLow:h["environment.tide.heightLow"],measured:j,surveyHere:G.survey,globalHere:G.global}),H=V.cd,K=V.msl,q=(0,r.useMemo)(()=>F?(e,t)=>{let r=F.shom?M(F.shom,e,t):NaN;if(Number.isFinite(r))return{h:r-H,drying:r<6.5};let i=F.global?M(F.global,e,t):NaN;return Number.isFinite(i)?{h:i-K,drying:i<3}:null}:null,[F,H,K]),Y=Math.round((Number.isFinite(j)?j:L+1)*2)/2,Z=(0,r.useMemo)(()=>{if(!q||!Number.isFinite(O))return q;let e=F.shom&&Number.isFinite(M(F.shom,O,R));return((e,t,r,i,n)=>{let a=e(t,r),o=-i;if(!a||a.h<=o)return e;let s=o-a.h,l=111320*Math.cos(t*Math.PI/180);return(i,a)=>{let o=e(i,a);if(!o)return o;let u=Math.hypot((i-t)*111320,(a-r)*l)/n;if(u>=1)return o;let d=1-u*u*(3-2*u);return{h:o.h+s*d,drying:!(d>.5)&&o.drying}}})(q,O,R,Y,e?60:350)},[q,Y,$,k]),X=(0,r.useMemo)(()=>{let e,t;if(!Z||!Number.isFinite(O))return null;let r=F.shom?240:160,n=(F.shom,1),a=new i.PlaneGeometry(6e3*C,6e3*C,r,r),o=a.attributes.position,s=new Float32Array(o.count),l=new Float32Array(o.count),u=new Float32Array(2*o.count),d=111320*Math.cos(O*Math.PI/180),c=(e=Math.round(10*O)/10,t=Math.round(10*R)/10,{east:(R-t)*111320*Math.cos(e*Math.PI/180),north:(O-e)*111320});for(let e=0;e<o.count;e++){let t=o.getX(e)/C,r=o.getY(e)/C,i=Z(O+r/111320,R+t/d),a=i?i.h:0;s[e]=-a,l[e]=+!!i?.drying,u[2*e]=c.east+t,u[2*e+1]=c.north+r,o.setZ(e,a<0?a*n*C:(.15+ +Math.min(a,4))*C)}a.setAttribute("aDepth",new i.BufferAttribute(s,1)),a.setAttribute("aDrying",new i.BufferAttribute(l,1)),a.setAttribute("aGround",new i.BufferAttribute(u,2)),a.computeVertexNormals();let f=[],h=250*Math.ceil((c.east-1500)/250),m=250*Math.ceil((c.north-1500)/250);for(let e=h;e<=c.east+1500;e+=250)for(let t=m;t<=c.north+1500;t+=250){let r=e-c.east+125,i=t-c.north+125;if(Math.hypot(r,i)>1500)continue;let a=Z(O+i/111320,R+r/d);if(!a||a.h>=-.1)continue;let o=-a.h;f.push({text:P(o),danger:o<L+1,position:[r*C,a.h*n*C+2,-i*C]})}let p=Z(O,R);return{geometry:a,items:f,exaggeration:n,bottom:p&&p.h<0?p.h*n*C:null,depthHere:p?-p.h:null}},[Z,C,L,O&&Math.round(500*O),R&&Math.round(500*R)]);(0,r.useEffect)(()=>()=>X?.geometry.dispose(),[X]);let J=(0,r.useMemo)(()=>new i.ShaderMaterial({uniforms:{uDanger:{value:3},uShallow:{value:new i.Color},uMid:{value:new i.Color},uDeep:{value:new i.Color},uLand:{value:new i.Color},uDrying:{value:new i.Color},uLine:{value:new i.Color},uDangerColor:{value:new i.Color},uFade:{value:new i.Color},uFadeNear:{value:1500},uFadeFar:{value:2100}},vertexShader:S,fragmentShader:E}),[]);(0,r.useEffect)(()=>{let e=J.uniforms;e.uDanger.value=L+1,e.uShallow.value.set(I.shallow),e.uMid.value.set(I.mid),e.uDeep.value.set(I.deep),e.uLand.value.set(I.land),e.uDrying.value.set(I.drying),e.uLine.value.set(I.line),e.uDangerColor.value.set(I.danger),e.uFade.value.set(I.fade)},[J,L,I]),(0,r.useEffect)(()=>()=>J.dispose(),[J]);let Q=(0,r.useMemo)(()=>new i.ShaderMaterial({uniforms:{uColor:{value:new i.Color},uOpacity:{value:.16}},vertexShader:`
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
            }`,transparent:!0,depthWrite:!1,side:i.DoubleSide}),[]);if((0,r.useEffect)(()=>{let e=Q.uniforms;e.uColor.value.set(I.water),e.uOpacity.value=I.waterOpacity},[Q,I]),(0,r.useEffect)(()=>()=>Q.dispose(),[Q]),!X||!Number.isFinite(O))return null;let ee=X.depthHere,et=Number.isFinite(j)&&Number.isFinite(ee)&&"tide"===V.source?j-ee:null,er=(Number.isFinite(j)?-j*X.exaggeration*C:null)??X.bottom,ei=null!==et&&Math.abs(et)>=.3,en=Number.isFinite(j)?j:ee,ea=-L*C;return(0,t.jsxs)("group",{rotation:[0,A,0],position:[0,e,0],children:[(0,t.jsx)("mesh",{rotation:[-Math.PI/2,0,0],geometry:X.geometry,material:J,renderOrder:-2}),(0,t.jsx)("mesh",{rotation:[-Math.PI/2,0,0],material:Q,renderOrder:1,children:(0,t.jsx)("circleGeometry",{args:[3e3*C,96]})}),(0,t.jsx)(z,{items:X.items,palette:I}),null!==er&&er<ea&&(0,t.jsxs)("group",{children:[(0,t.jsx)(a.default,{points:[[0,ea,0],[0,er,0]],color:I.line,lineWidth:2,dashed:!0,dashSize:1.2,gapSize:.8}),(0,t.jsxs)("mesh",{position:[0,er,0],rotation:[-Math.PI/2,0,0],children:[(0,t.jsx)("ringGeometry",{args:[1.2,1.8,32]}),(0,t.jsx)("meshBasicMaterial",{color:I.line,transparent:!0,opacity:.8,side:i.DoubleSide})]}),ei&&null!==X.bottom&&(0,t.jsxs)("mesh",{position:[0,X.bottom,0],rotation:[-Math.PI/2,0,0],children:[(0,t.jsx)("ringGeometry",{args:[1,1.4,32]}),(0,t.jsx)("meshBasicMaterial",{color:I.danger,transparent:!0,opacity:.8,side:i.DoubleSide})]}),Number.isFinite(en)&&(0,t.jsx)(n.Html,{position:[0,er/2,0],zIndexRange:[5,0],style:{pointerEvents:"none"},children:(0,t.jsxs)("div",{className:"ml-3 -translate-y-1/2 whitespace-nowrap px-1.5 py-px rounded-md text-caption font-semibold tabular-nums text-hud-main bg-hud-bg/70 backdrop-blur-sm",children:[P(en)," m",ei&&(0,t.jsxs)("span",{className:"ml-1.5 font-normal text-hud-muted",children:[y("bathymetry.chartDepth",{depth:P(ee)})," ","(",et>0?"+":"−",Math.abs(et).toFixed(1),")"]}),"sounder"===V.source&&(0,t.jsx)("span",{className:"ml-1.5 font-normal text-hud-muted",children:y("bathymetry.levelFromSounder")})]})})]})]})}])},97776,e=>{"use strict";var t=e.i(3950);let r=["https://overpass-api.de/api/interpreter","https://maps.mail.ru/osm/tools/overpass/api/interpreter"],i=["cardinal","lateral","isolated_danger","safe_water","special_purpose"],n=`^(buoy|beacon)_(${i.join("|")})$`,a=e=>Math.round(10*e)/10,o=(e,t,r)=>{let i=r/111320,n=r/(111320*Math.max(.1,Math.cos(e*Math.PI/180))),o=[];for(let r=Math.floor((e-i)/.1);r<=Math.floor((e+i)/.1);r++)for(let e=Math.floor((t-n)/.1);e<=Math.floor((t+n)/.1);e++)o.push({s:a(.1*r),w:a(.1*e),key:`${r}:${e}`});return o},s=({s:e,w:t})=>`${r[0]}?data=${encodeURIComponent(`[out:json];node["seamark:type"~"${n}"](${e},${t},${a(e+.1)},${a(t+.1)});out body;`)}`,l=e=>e?String(e).split(";").map(e=>e.trim().toLowerCase()).filter(Boolean):[],u=e=>{let t=parseFloat(e);return Number.isFinite(t)?t:null},d=e=>{let t=e.tags||{},r=t["seamark:type"]||"",[i,...n]=r.split("_"),a=n.join("_"),o=e=>t[`seamark:${r}:${e}`],s=t["seamark:light:character"]?{character:t["seamark:light:character"],group:t["seamark:light:group"]||"",period:u(t["seamark:light:period"]),colour:l(t["seamark:light:colour"])[0]||"white"}:null;return{id:e.id,lat:e.lat,lon:e.lon,name:t["seamark:name"]||t.name||"",kind:a,beacon:"beacon"===i,category:(o("category")||"").toLowerCase(),shape:(o("shape")||"").toLowerCase(),colours:l(o("colour")),pattern:(o("colour_pattern")||"").toLowerCase(),system:(o("system")||"").toLowerCase(),height:u(o("height")),topmark:t["seamark:topmark:shape"]?{shape:t["seamark:topmark:shape"].toLowerCase(),colours:l(t["seamark:topmark:colour"])}:null,light:s}},c=0,f=e=>e.filter(e=>"node"===e.type&&Number.isFinite(e.lat)&&Number.isFinite(e.lon)).map(d).filter(e=>i.includes(e.kind)),h=async(e,i=25)=>{let o=Math.min(...e.map(e=>e.s)),l=Math.min(...e.map(e=>e.w)),u=a(Math.max(...e.map(e=>e.s))+.1),d=a(Math.max(...e.map(e=>e.w))+.1),c=`[out:json][timeout:${i}];node["seamark:type"~"${n}"](${o},${l},${u},${d});out body;`;for(let i of r)try{let r=await fetch(`${i}?data=${encodeURIComponent(c)}`,{referrerPolicy:"strict-origin-when-cross-origin"});if(!r.ok)continue;let n=await r.json();if(n.remark&&/error|timeout|runtime/i.test(n.remark))continue;let a=n.elements||[],o={};return await Promise.all(e.map(e=>{o[e.key]=a.filter(t=>t.lat>=e.s&&t.lat<e.s+.1&&t.lon>=e.w&&t.lon<e.w+.1);let r=JSON.stringify({elements:o[e.key]});return(0,t.storeCached)(s(e),new Response(r,{headers:{"Content-Type":"application/json"}}))})),o}catch{}throw Error("Overpass unreachable")},m=async e=>{let r={},i=[];for(let n of e){let e=await (0,t.readCached)(s(n)).catch(()=>null);e?r[n.key]=f((await e.json()).elements||[]):i.push(n)}if(i.length&&Date.now()>=c)try{let e=await h(i);Object.entries(e).forEach(([e,t])=>{r[e]=f(t)})}catch{c=Date.now()+12e4}return r},p=async(e,t,r)=>{let i=o(e,t,r);return i.length?Object.keys(await h(i,90)).length:0};e.s(["cellsAround",0,o,"loadCells",0,m,"prefetchSeamarks",0,p])},83646,e=>{"use strict";var t=e.i(67561);e.s(["default",0,()=>(0,t.useOcearoContext)().tokens])},58567,e=>{"use strict";let t;var r=e.i(83402);let i=/v3d|videocore|mali|adreno|powervr|llvmpipe|swiftshader/i;e.s(["RENDER_QUALITIES",0,["auto","high","pi"],"getRenderProfile",0,()=>{let e=r.default.get("renderQuality")||"auto";return"pi"===e||"auto"===e&&(()=>{if("u"<typeof navigator)return!1;if(/aarch64|armv7|armv8|arm64|raspbian|raspberry/i.test(navigator.userAgent)||i.test((()=>{if(void 0!==t)return t;t="";try{let e=document.createElement("canvas").getContext("webgl"),r=e?.getExtension("WEBGL_debug_renderer_info");t=String(e?.getParameter(r?r.UNMASKED_RENDERER_WEBGL:e.RENDERER)||""),e?.getExtension("WEBGL_lose_context")?.loseContext()}catch{}return t})()))return!0;let e=navigator.hardwareConcurrency||8,r=navigator.deviceMemory||8;return e<=4&&r<=4})()?{id:"pi",fps:30,dpr:.75,antialias:!1}:{id:"high",fps:60,dpr:Math.min(window.devicePixelRatio||1,1.5),antialias:!0}}])},60099,31067,95393,e=>{"use strict";let t,r;function i(){return(i=Object.assign.bind()).apply(null,arguments)}e.s(["default",()=>i],31067);var n=e.i(71645),a=e.i(88014),o=e.i(90072),s=e.i(90874),l=e.i(61949);e.s(["useFrame",()=>l.F],95393);var l=l;let u=new o.Vector3,d=new o.Vector3,c=new o.Vector3,f=new o.Vector2;function h(e,t,r){let i=u.setFromMatrixPosition(e.matrixWorld);i.project(t);let n=r.width/2,a=r.height/2;return[i.x*n+n,-(i.y*a)+a]}let m=e=>1e-10>Math.abs(e)?0:e;function p(e,t,r=""){let i="matrix3d(";for(let r=0;16!==r;r++)i+=m(t[r]*e.elements[r])+(15!==r?",":")");return r+i}let v=(t=[1,-1,1,1,1,-1,1,1,1,-1,1,1,1,-1,1,1],e=>p(e,t)),g=(r=e=>[1/e,1/e,1/e,1,-1/e,-1/e,-1/e,-1,1/e,1/e,1/e,1,1,1,1,1],(e,t)=>p(e,r(t),"translate(-50%,-50%)")),y=n.forwardRef(({children:e,eps:t=.001,style:r,className:p,prepend:y,center:w,fullscreen:x,portal:b,distanceFactor:M,sprite:S=!1,transform:E=!1,occlude:D,onOcclude:A,castShadow:F,receiveShadow:_,material:z,geometry:P,zIndexRange:C=[0x1000037,0],calculatePosition:L=h,as:N="div",wrapperClass:U,pointerEvents:T="auto",...B},j)=>{let{gl:I,camera:O,scene:R,size:W,raycaster:$,events:k,viewport:G}=(0,s.useThree)(),[V]=n.useState(()=>document.createElement(N)),H=n.useRef(null),K=n.useRef(null),q=n.useRef(0),Y=n.useRef([0,0]),Z=n.useRef(null),X=n.useRef(null),J=(null==b?void 0:b.current)||k.connected||I.domElement.parentNode,Q=n.useRef(null),ee=n.useRef(!1),et=n.useMemo(()=>{var e;return D&&"blending"!==D||Array.isArray(D)&&D.length&&(e=D[0])&&"object"==typeof e&&"current"in e},[D]);n.useLayoutEffect(()=>{let e=I.domElement;D&&"blending"===D?(e.style.zIndex=`${Math.floor(C[0]/2)}`,e.style.position="absolute",e.style.pointerEvents="none"):(e.style.zIndex=null,e.style.position=null,e.style.pointerEvents=null)},[D]),n.useLayoutEffect(()=>{if(K.current){let e=H.current=a.createRoot(V);if(R.updateMatrixWorld(),E)V.style.cssText="position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;";else{let e=L(K.current,O,W);V.style.cssText=`position:absolute;top:0;left:0;transform:translate3d(${e[0]}px,${e[1]}px,0);transform-origin:0 0;`}return J&&(y?J.prepend(V):J.appendChild(V)),()=>{J&&J.removeChild(V),e.unmount()}}},[J,E]),n.useLayoutEffect(()=>{U&&(V.className=U)},[U]);let er=n.useMemo(()=>E?{position:"absolute",top:0,left:0,width:W.width,height:W.height,transformStyle:"preserve-3d",pointerEvents:"none"}:{position:"absolute",transform:w?"translate3d(-50%,-50%,0)":"none",...x&&{top:-W.height/2,left:-W.width/2,width:W.width,height:W.height},...r},[r,w,x,W,E]),ei=n.useMemo(()=>({position:"absolute",pointerEvents:T}),[T]);n.useLayoutEffect(()=>{var t,i;ee.current=!1,E?null==(t=H.current)||t.render(n.createElement("div",{ref:Z,style:er},n.createElement("div",{ref:X,style:ei},n.createElement("div",{ref:j,className:p,style:r,children:e})))):null==(i=H.current)||i.render(n.createElement("div",{ref:j,style:er,className:p,children:e}))});let en=n.useRef(!0);(0,l.F)(e=>{if(K.current){O.updateMatrixWorld(),K.current.updateWorldMatrix(!0,!1);let e=E?Y.current:L(K.current,O,W);if(E||Math.abs(q.current-O.zoom)>t||Math.abs(Y.current[0]-e[0])>t||Math.abs(Y.current[1]-e[1])>t){var r;let t,i,n,a,s=(r=K.current,t=u.setFromMatrixPosition(r.matrixWorld),i=d.setFromMatrixPosition(O.matrixWorld),n=t.sub(i),a=O.getWorldDirection(c),n.angleTo(a)>Math.PI/2),l=!1;et&&(Array.isArray(D)?l=D.map(e=>e.current):"blending"!==D&&(l=[R]));let h=en.current;l?en.current=function(e,t,r,i){let n=u.setFromMatrixPosition(e.matrixWorld),a=n.clone();a.project(t),f.set(a.x,a.y),r.setFromCamera(f,t);let o=r.intersectObjects(i,!0);if(o.length){let e=o[0].distance;return n.distanceTo(r.ray.origin)<e}return!0}(K.current,O,$,l)&&!s:en.current=!s,h!==en.current&&(A?A(!en.current):V.style.display=en.current?"block":"none");let p=Math.floor(C[0]/2),y=D?et?[C[0],p]:[p-1,0]:C;if(V.style.zIndex=`${function(e,t,r){if(t instanceof o.PerspectiveCamera||t instanceof o.OrthographicCamera){let i=u.setFromMatrixPosition(e.matrixWorld),n=d.setFromMatrixPosition(t.matrixWorld),a=i.distanceTo(n),o=(r[1]-r[0])/(t.far-t.near),s=r[1]-o*t.far;return Math.round(o*a+s)}}(K.current,O,y)}`,E){let[e,t]=[W.width/2,W.height/2],r=O.projectionMatrix.elements[5]*t,{isOrthographicCamera:i,top:n,left:a,bottom:o,right:s}=O,l=v(O.matrixWorldInverse),u=i?`scale(${r})translate(${m(-(s+a)/2)}px,${m((n+o)/2)}px)`:`translateZ(${r}px)`,d=K.current.matrixWorld;S&&((d=O.matrixWorldInverse.clone().transpose().copyPosition(d).scale(K.current.scale)).elements[3]=d.elements[7]=d.elements[11]=0,d.elements[15]=1),V.style.width=W.width+"px",V.style.height=W.height+"px",V.style.perspective=i?"":`${r}px`,Z.current&&X.current&&(Z.current.style.transform=`${u}${l}translate(${e}px,${t}px)`,X.current.style.transform=g(d,1/((M||10)/400)))}else{let t=void 0===M?1:function(e,t){if(t instanceof o.OrthographicCamera)return t.zoom;if(!(t instanceof o.PerspectiveCamera))return 1;{let r=u.setFromMatrixPosition(e.matrixWorld),i=d.setFromMatrixPosition(t.matrixWorld);return 1/(2*Math.tan(t.fov*Math.PI/180/2)*r.distanceTo(i))}}(K.current,O)*M;V.style.transform=`translate3d(${e[0]}px,${e[1]}px,0) scale(${t})`}Y.current=e,q.current=O.zoom}}if(!et&&Q.current&&!ee.current)if(E){if(Z.current){let e=Z.current.children[0];if(null!=e&&e.clientWidth&&null!=e&&e.clientHeight){let{isOrthographicCamera:t}=O;if(t||P)B.scale&&(Array.isArray(B.scale)?B.scale instanceof o.Vector3?Q.current.scale.copy(B.scale.clone().divideScalar(1)):Q.current.scale.set(1/B.scale[0],1/B.scale[1],1/B.scale[2]):Q.current.scale.setScalar(1/B.scale));else{let t=(M||10)/400,r=e.clientWidth*t,i=e.clientHeight*t;Q.current.scale.set(r,i,1)}ee.current=!0}}}else{let t=V.children[0];if(null!=t&&t.clientWidth&&null!=t&&t.clientHeight){let e=1/G.factor,r=t.clientWidth*e,i=t.clientHeight*e;Q.current.scale.set(r,i,1),ee.current=!0}Q.current.lookAt(e.camera.position)}});let ea=n.useMemo(()=>({vertexShader:E?void 0:`
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
      `}),[E]);return n.createElement("group",i({},B,{ref:K}),D&&!et&&n.createElement("mesh",{castShadow:F,receiveShadow:_,ref:Q},P||n.createElement("planeGeometry",null),z||n.createElement("shaderMaterial",{side:o.DoubleSide,vertexShader:ea.vertexShader,fragmentShader:ea.fragmentShader})))});e.s(["Html",0,y],60099)},52822,(e,t,r)=>{"use strict";var i=e.r(71645),n=e.r(2239),a="function"==typeof Object.is?Object.is:function(e,t){return e===t&&(0!==e||1/e==1/t)||e!=e&&t!=t},o=n.useSyncExternalStore,s=i.useRef,l=i.useEffect,u=i.useMemo,d=i.useDebugValue;r.useSyncExternalStoreWithSelector=function(e,t,r,i,n){var c=s(null);if(null===c.current){var f={hasValue:!1,value:null};c.current=f}else f=c.current;var h=o(e,(c=u(function(){function e(e){if(!l){if(l=!0,o=e,e=i(e),void 0!==n&&f.hasValue){var t=f.value;if(n(t,e))return s=t}return s=e}if(t=s,a(o,e))return t;var r=i(e);return void 0!==n&&n(t,r)?(o=e,t):(o=e,s=r)}var o,s,l=!1,u=void 0===r?null:r;return[function(){return e(t())},null===u?void 0:function(){return e(u())}]},[t,r,i,n]))[0],c[1]);return l(function(){f.hasValue=!0,f.value=h},[h]),d(h),h}},30224,(e,t,r)=>{"use strict";e.i(47167),t.exports=e.r(52822)}]);