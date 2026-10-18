(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,67225,e=>{"use strict";var t=e.i(43476),a=e.i(71645),r=e.i(82897),o=e.i(60099),i=e.i(44909),n=e.i(90072);e.i(85269);var l=e.i(22831),s=e.i(83402),u=e.i(66799),c=e.i(85709),d=e.i(78461),h=e.i(9617);let m=new n.MeshBasicMaterial({transparent:!0,opacity:0,depthWrite:!1,colorWrite:!1,side:n.DoubleSide}),f=({y:e=-.3})=>{let{t:r}=(0,l.useTranslation)(),{placingWaypoint:o}=(0,a.useSyncExternalStore)(h.subscribeView,h.getViewState,h.getViewState),i=(0,c.useSignalKPath)("navigation.position"),{heading:n}=(0,d.default)(),f=(0,a.useRef)(!1),p=s.default.get("aisLengthScalingFactor")||.7;if(!o||!Number.isFinite(i?.latitude))return null;let v=async e=>{if(f.current||e.delta>8)return;e.stopPropagation();let t=e.object.worldToLocal(e.point.clone()),a=t.x/p,o=t.y/p,n=i.latitude,l=n+o/6371e3*180/Math.PI,s=i.longitude+a/(6371e3*Math.cos(n*Math.PI/180))*180/Math.PI,c=new Date,d=`WPT ${String(c.getHours()).padStart(2,"0")}:${String(c.getMinutes()).padStart(2,"0")}`;f.current=!0;try{let e=u.default.generateUUID();await u.default.saveWaypoint(e,u.default.createWaypointFeature(s,l,d,r("waypointPicker.description"))),await u.default.setDestinationWaypoint(e),(0,h.setPlacingWaypoint)(!1),(0,h.setViewMessage)(r("waypointPicker.set",{name:d,distance:(Math.hypot(a,o)/1852).toFixed(2)}))}catch(e){(0,h.setViewMessage)(r("waypointPicker.failed",{error:e.message}))}finally{f.current=!1}};return(0,t.jsx)("group",{rotation:[0,n,0],position:[0,e,0],children:(0,t.jsx)("mesh",{rotation:[-Math.PI/2,0,0],material:m,onClick:v,children:(0,t.jsx)("planeGeometry",{args:[2e4,2e4]})})})};var p=e.i(66326),v=e.i(80566),g=e.i(90874),x=e.i(93282),y=e.i(95393),M=n,b=e.i(8560);class w extends M.Mesh{constructor(e,t={}){super(e),this.isWater=!0;const a=this,r=void 0!==t.textureWidth?t.textureWidth:512,o=void 0!==t.textureHeight?t.textureHeight:512,i=void 0!==t.clipBias?t.clipBias:0,n=void 0!==t.alpha?t.alpha:1,l=void 0!==t.time?t.time:0,s=void 0!==t.waterNormals?t.waterNormals:null,u=void 0!==t.sunDirection?t.sunDirection:new M.Vector3(.70707,.70707,0),c=new M.Color(void 0!==t.sunColor?t.sunColor:0xffffff),d=new M.Color(void 0!==t.waterColor?t.waterColor:8355711),h=void 0!==t.eye?t.eye:new M.Vector3(0,0,0),m=void 0!==t.distortionScale?t.distortionScale:20,f=void 0!==t.side?t.side:M.FrontSide,p=void 0!==t.fog&&t.fog,v=new M.Plane,g=new M.Vector3,x=new M.Vector3,y=new M.Vector3,w=new M.Matrix4,S=new M.Vector3(0,0,-1),C=new M.Vector4,j=new M.Vector3,P=new M.Vector3,k=new M.Vector4,T=new M.Matrix4,D=new M.PerspectiveCamera,F=new M.WebGLRenderTarget(r,o,{type:M.HalfFloatType}),R={name:"MirrorShader",uniforms:M.UniformsUtils.merge([b.UniformsLib.fog,b.UniformsLib.lights,{normalSampler:{value:null},mirrorSampler:{value:null},alpha:{value:1},time:{value:0},size:{value:1},distortionScale:{value:20},textureMatrix:{value:new M.Matrix4},sunColor:{value:new M.Color(8355711)},sunDirection:{value:new M.Vector3(.70707,.70707,0)},eye:{value:new M.Vector3},waterColor:{value:new M.Color(5592405)}}]),vertexShader:`
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
					float rf0 = 0.02;
					float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );
					vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;
					vec3 albedo = mix( ( sunColor * diffuseLight * 0.3 + scatter ) * getShadowMask(), reflectionSample + specularLight, reflectance );
					vec3 outgoingLight = albedo;
					gl_FragColor = vec4( outgoingLight, alpha );

					#include <tonemapping_fragment>
					#include <colorspace_fragment>
					#include <fog_fragment>	
				}`},A=new M.ShaderMaterial({name:R.name,uniforms:M.UniformsUtils.clone(R.uniforms),vertexShader:R.vertexShader,fragmentShader:R.fragmentShader,lights:!0,side:f,fog:p});A.uniforms.mirrorSampler.value=F.texture,A.uniforms.textureMatrix.value=T,A.uniforms.alpha.value=n,A.uniforms.time.value=l,A.uniforms.normalSampler.value=s,A.uniforms.sunColor.value=c,A.uniforms.waterColor.value=d,A.uniforms.sunDirection.value=u,A.uniforms.distortionScale.value=m,A.uniforms.eye.value=h,a.material=A,a.onBeforeRender=function(e,t,r){if(x.setFromMatrixPosition(a.matrixWorld),y.setFromMatrixPosition(r.matrixWorld),w.extractRotation(a.matrixWorld),g.set(0,0,1),g.applyMatrix4(w),j.subVectors(x,y),j.dot(g)>0)return;j.reflect(g).negate(),j.add(x),w.extractRotation(r.matrixWorld),S.set(0,0,-1),S.applyMatrix4(w),S.add(y),P.subVectors(x,S),P.reflect(g).negate(),P.add(x),D.position.copy(j),D.up.set(0,1,0),D.up.applyMatrix4(w),D.up.reflect(g),D.lookAt(P),D.far=r.far,D.updateMatrixWorld(),D.projectionMatrix.copy(r.projectionMatrix),T.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),T.multiply(D.projectionMatrix),T.multiply(D.matrixWorldInverse),v.setFromNormalAndCoplanarPoint(g,x),v.applyMatrix4(D.matrixWorldInverse),C.set(v.normal.x,v.normal.y,v.normal.z,v.constant);let o=D.projectionMatrix;k.x=(Math.sign(C.x)+o.elements[8])/o.elements[0],k.y=(Math.sign(C.y)+o.elements[9])/o.elements[5],k.z=-1,k.w=(1+o.elements[10])/o.elements[14],C.multiplyScalar(2/C.dot(k)),o.elements[2]=C.x,o.elements[6]=C.y,o.elements[10]=C.z+1-i,o.elements[14]=C.w,h.setFromMatrixPosition(r.matrixWorld);let n=e.getRenderTarget(),l=e.xr.enabled,s=e.shadowMap.autoUpdate;a.visible=!1,e.xr.enabled=!1,e.shadowMap.autoUpdate=!1,e.setRenderTarget(F),e.state.buffers.depth.setMask(!0),!1===e.autoClear&&e.clear(),e.render(t,D),a.visible=!0,e.xr.enabled=l,e.shadowMap.autoUpdate=s,e.setRenderTarget(n);let u=r.viewport;void 0!==u&&e.state.viewport(u)}}}var S=n;class C extends S.Mesh{constructor(){const e=C.SkyShader,t=new S.ShaderMaterial({name:e.name,uniforms:S.UniformsUtils.clone(e.uniforms),vertexShader:e.vertexShader,fragmentShader:e.fragmentShader,side:S.BackSide,depthWrite:!1});super(new S.BoxGeometry(1,1,1),t),this.isSky=!0}}C.SkyShader={name:"SkyShader",uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new S.Vector3},cloudScale:{value:2e-4},cloudSpeed:{value:2e-5},cloudCoverage:{value:.4},cloudDensity:{value:.4},cloudElevation:{value:.5},showSunDisc:{value:1},time:{value:0}},vertexShader:`
		uniform vec3 sunPosition;
		uniform float rayleigh;
		uniform float turbidity;
		uniform float mieCoefficient;

		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying float vSunfade;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		// constants for atmospheric scattering
		const float e = 2.71828182845904523536028747135266249775724709369995957;
		const float pi = 3.141592653589793238462643383279502884197169;

		// wavelength of used primaries, according to preetham
		const vec3 lambda = vec3( 680E-9, 550E-9, 450E-9 );
		// this pre-calculation replaces older TotalRayleigh(vec3 lambda) function:
		// (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn))
		const vec3 totalRayleigh = vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 );

		// mie stuff
		// K coefficient for the primaries
		const float v = 4.0;
		const vec3 K = vec3( 0.686, 0.678, 0.666 );
		// MieConst = pi * pow( ( 2.0 * pi ) / lambda, vec3( v - 2.0 ) ) * K
		const vec3 MieConst = vec3( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 );

		// earth shadow hack
		// cutoffAngle = pi / 1.95;
		const float cutoffAngle = 1.6110731556870734;
		const float steepness = 1.5;
		const float EE = 1000.0;

		float sunIntensity( float zenithAngleCos ) {
			zenithAngleCos = clamp( zenithAngleCos, -1.0, 1.0 );
			return EE * max( 0.0, 1.0 - pow( e, -( ( cutoffAngle - acos( zenithAngleCos ) ) / steepness ) ) );
		}

		vec3 totalMie( float T ) {
			float c = ( 0.2 * T ) * 10E-18;
			return 0.434 * c * MieConst;
		}

		void main() {

			vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
			vWorldPosition = worldPosition.xyz;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			gl_Position.z = gl_Position.w; // set z to camera.far

			vSunDirection = normalize( sunPosition );

			vSunE = sunIntensity( vSunDirection.y );

			vSunfade = 1.0 - clamp( 1.0 - exp( ( sunPosition.y / 450000.0 ) ), 0.0, 1.0 );

			float rayleighCoefficient = rayleigh - ( 1.0 * ( 1.0 - vSunfade ) );

			// extinction (absorption + out scattering)
			// rayleigh coefficients
			vBetaR = totalRayleigh * rayleighCoefficient;

			// mie coefficients
			vBetaM = totalMie( turbidity ) * mieCoefficient;

		}`,fragmentShader:`
		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		uniform float mieDirectionalG;
		uniform float cloudScale;
		uniform float cloudSpeed;
		uniform float cloudCoverage;
		uniform float cloudDensity;
		uniform float cloudElevation;
		uniform float showSunDisc;
		uniform float time;

		// gradient at a lattice corner; sinless hash so every GPU produces the same clouds
		vec2 gradient( vec2 i ) {
			vec3 p = fract( i.xyx * vec3( 0.1031, 0.1030, 0.0973 ) );
			p += dot( p, p.yzx + 33.33 );
			return fract( ( p.xx + p.yz ) * p.zy ) * 2.0 - 1.0;
		}

		// 2D gradient noise: isotropic lobes like Perlin at value-noise cost
		float noise( vec2 p ) {
			vec2 i = floor( p );
			vec2 f = fract( p );
			vec2 u = f * f * f * ( f * ( f * 6.0 - 15.0 ) + 10.0 ); // quintic fade
			float a = dot( gradient( i ), f );
			float b = dot( gradient( i + vec2( 1.0, 0.0 ) ), f - vec2( 1.0, 0.0 ) );
			float c = dot( gradient( i + vec2( 0.0, 1.0 ) ), f - vec2( 0.0, 1.0 ) );
			float d = dot( gradient( i + vec2( 1.0, 1.0 ) ), f - vec2( 1.0, 1.0 ) );
			return mix( mix( a, b, u.x ), mix( c, d, u.x ), u.y ) * 1.6; // ~[-1,1]
		}

		// fbm; per-octave drift makes clouds billow instead of scrolling as a rigid stamp
		float fbm( vec2 p, float drift ) {
			float result = 0.0;
			float amplitude = 1.0;
			for ( int i = 0; i < 4; i ++ ) {
				result += amplitude * noise( p );
				amplitude *= 0.5;
				p = p * 2.0 + drift;
			}
			return result;
		}

		// constants for atmospheric scattering
		const float pi = 3.141592653589793238462643383279502884197169;

		const float n = 1.0003; // refractive index of air
		const float N = 2.545E25; // number of molecules per unit volume for air at 288.15K and 1013mb (sea level -45 celsius)

		// optical length at zenith for molecules
		const float rayleighZenithLength = 8.4E3;
		const float mieZenithLength = 1.25E3;
		// 66 arc seconds -> degrees, and the cosine of that
		const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

		// 3.0 / ( 16.0 * pi )
		const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
		// 1.0 / ( 4.0 * pi )
		const float ONE_OVER_FOURPI = 0.07957747154594767;

		float rayleighPhase( float cosTheta ) {
			return THREE_OVER_SIXTEENPI * ( 1.0 + pow( cosTheta, 2.0 ) );
		}

		float hgPhase( float cosTheta, float g ) {
			float g2 = pow( g, 2.0 );
			float inverse = 1.0 / pow( 1.0 - 2.0 * g * cosTheta + g2, 1.5 );
			return ONE_OVER_FOURPI * ( ( 1.0 - g2 ) * inverse );
		}

		void main() {

			vec3 direction = normalize( vWorldPosition - cameraPosition );

			// optical length
			// cutoff angle at 90 to avoid singularity in next formula.
			float zenithAngle = acos( max( 0.0, direction.y ) );
			float inverse = 1.0 / ( cos( zenithAngle ) + 0.15 * pow( 93.885 - ( ( zenithAngle * 180.0 ) / pi ), -1.253 ) );
			float sR = rayleighZenithLength * inverse;
			float sM = mieZenithLength * inverse;

			// combined extinction factor
			vec3 Fex = exp( -( vBetaR * sR + vBetaM * sM ) );

			// in scattering
			float cosTheta = dot( direction, vSunDirection );

			float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
			vec3 betaRTheta = vBetaR * rPhase;

			float mPhase = hgPhase( cosTheta, mieDirectionalG );
			vec3 betaMTheta = vBetaM * mPhase;

			vec3 Lin = pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - Fex ), vec3( 1.5 ) );
			Lin *= mix( vec3( 1.0 ), pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * Fex, vec3( 1.0 / 2.0 ) ), clamp( pow( 1.0 - vSunDirection.y, 5.0 ), 0.0, 1.0 ) );

			// nightsky
			float theta = acos( direction.y ); // elevation --> y-axis, [-pi/2, pi/2]
			float phi = atan( direction.z, direction.x ); // azimuth --> x-axis [-pi/2, pi/2]
			vec2 uv = vec2( phi, theta ) / vec2( 2.0 * pi, pi ) + vec2( 0.5, 0.0 );
			vec3 L0 = vec3( 0.1 ) * Fex;

			// composition + solar disc
			float sundisc = clamp( ( cosTheta - sunAngularDiameterCos ) * 50000.0, 0.0, 1.0 ) * showSunDisc;
			vec3 sundiscColor = ( 760.0 * sundisc ) * min( vSunE * Fex, 80.0 );

			vec3 texColor = ( Lin + L0 ) * 0.04 + sundiscColor + vec3( 0.0, 0.0003, 0.00075 );

			// Clouds
			if ( direction.y > 0.0 && cloudCoverage > 0.0 ) {

				// Project to cloud plane (higher elevation = clouds appear lower/closer)
				float elevation = mix( 1.0, 0.1, cloudElevation );
				vec2 cloudUV = direction.xz / ( direction.y * elevation );
				cloudUV *= cloudScale;
				cloudUV += time * cloudSpeed;

				// Cloud density field
				float evolve = time * cloudSpeed * 300.0;
				float cloudNoise = clamp( fbm( cloudUV * 1000.0, evolve ) * 0.7 + 0.5, 0.0, 1.0 );

				// Large-scale coverage variation: clear gaps next to dense banks
				float region = noise( cloudUV * 300.0 ) * 0.37 + 0.5;
				float cov = clamp( cloudCoverage + ( region - 0.5 ) * 0.6, 0.0, 1.0 );

				// Carve clouds where noise rises above the coverage level
				float threshold = 1.0 - cov;
				float cloudMask = smoothstep( threshold, threshold + 0.3, cloudNoise );

				// Fade clouds near horizon (adjusted by elevation)
				float horizonFade = smoothstep( 0.0, 0.03 + 0.06 * cloudElevation, direction.y );
				cloudMask *= horizonFade;

				// Cloud lighting from the sky's own radiance
				float dayFactor = smoothstep( -0.08, 0.3, vSunDirection.y );
				vec3 sunColor = vSunE * Fex * 0.22 * 0.04; // 0.22 ~ albedo/pi, 0.04 = exposure; the aerial composite adds the eye-leg extinction
				vec3 skyAmbient = Lin * 0.04 + vec3( 0.0, 0.0003, 0.00075 );

				// Beer-powder self-shadow from the sampled density
				float depth = max( 0.0, cloudNoise - threshold );
				float beer = exp( depth * -4.0 );
				float powder = 1.0 - beer * beer; // beer*beer == exp(-8*depth)
				float shade = mix( 0.45, 1.0, clamp( beer * powder * 2.6, 0.0, 1.0 ) ); // 2.6 = 1/0.385, normalizes beer*powder peak to 1

				// Henyey-Greenstein forward lobe ( g = 0.7 ): silver lining on rims toward the sun
				float silver = clamp( 0.51 / pow( 1.49 - cosTheta * 1.4, 1.5 ), 0.0, 3.0 ); // 0.51=1-g^2, 1.49=1+g^2, 1.4=2g
				float edge = cloudMask * ( 1.0 - cloudMask ) * 4.0;

				vec3 cloudColor = skyAmbient + sunColor * shade;
				cloudColor += sunColor * silver * edge * 0.6;
				cloudColor *= max( dayFactor, 0.03 );

				// Cloud opacity via Beer's law: density sets how solid the clouds get
				float alpha = ( 1.0 - exp( depth * cloudDensity * -12.0 ) ) * horizonFade;

				// Occlude the sun disc/glow behind opaque cloud
				texColor -= L0 * 0.04 * alpha;

				// Composite through the atmosphere so distant clouds dissolve into haze
				vec3 cloudAerial = mix( texColor, cloudColor, Fex );
				texColor = mix( texColor, cloudAerial, alpha );

			}

			gl_FragColor = vec4( texColor, 1.0 );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>

		}`};var j=e.i(67561),P=e.i(83934);let k=e=>e===Object(e)&&!Array.isArray(e)&&"function"!=typeof e;function T(e,t){let r=(0,g.useThree)(e=>e.gl),o=(0,x.useLoader)(n.TextureLoader,k(e)?Object.values(e):e);return(0,a.useLayoutEffect)(()=>{null==t||t(o)},[t]),(0,a.useEffect)(()=>{if("initTexture"in r){let e=[];Array.isArray(o)?e=o:o instanceof n.Texture?e=[o]:k(o)&&(e=Object.values(o)),e.forEach(e=>{e instanceof n.Texture&&r.initTexture(e)})}},[r,o]),(0,a.useMemo)(()=>{if(!k(e))return o;{let t={},a=0;for(let r in e)t[r]=o[a++];return t}},[e,o])}T.preload=e=>x.useLoader.preload(n.TextureLoader,e),T.clear=e=>x.useLoader.clear(n.TextureLoader,e);var D=n;let F=parseInt(n.REVISION.replace(/\D+/g,""));class R extends D.ShaderMaterial{constructor(){super({uniforms:{time:{value:0},fade:{value:1}},vertexShader:`
      uniform float time;
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 0.5);
        gl_PointSize = size * (30.0 / -mvPosition.z) * (3.0 + sin(time + 100.0));
        gl_Position = projectionMatrix * mvPosition;
      }`,fragmentShader:`
      uniform sampler2D pointTexture;
      uniform float fade;
      varying vec3 vColor;
      void main() {
        float opacity = 1.0;
        if (fade == 1.0) {
          float d = distance(gl_PointCoord, vec2(0.5, 0.5));
          opacity = 1.0 / (1.0 + exp(16.0 * (d - 0.25)));
        }
        gl_FragColor = vec4(vColor, opacity);

        #include <tonemapping_fragment>
	      #include <${F>=154?"colorspace_fragment":"encodings_fragment"}>
      }`})}}let A=e=>new D.Vector3().setFromSpherical(new D.Spherical(e,Math.acos(1-2*Math.random()),2*Math.random()*Math.PI)),z=a.forwardRef(({radius:e=100,depth:t=50,count:r=5e3,saturation:o=0,factor:i=4,fade:n=!1,speed:l=1},s)=>{let u=a.useRef(null),[c,d,h]=a.useMemo(()=>{let a=[],n=[],l=Array.from({length:r},()=>(.5+.5*Math.random())*i),s=new D.Color,u=e+t,c=t/r;for(let e=0;e<r;e++)u-=c*Math.random(),a.push(...A(u).toArray()),s.setHSL(e/r,o,.9),n.push(s.r,s.g,s.b);return[new Float32Array(a),new Float32Array(n),new Float32Array(l)]},[r,t,i,e,o]);(0,y.useFrame)(e=>u.current&&(u.current.uniforms.time.value=e.clock.elapsedTime*l));let[m]=a.useState(()=>new R);return a.createElement("points",{ref:s},a.createElement("bufferGeometry",null,a.createElement("bufferAttribute",{attach:"attributes-position",args:[c,3]}),a.createElement("bufferAttribute",{attach:"attributes-color",args:[d,3]}),a.createElement("bufferAttribute",{attach:"attributes-size",args:[h,1]})),a.createElement("primitive",{ref:u,object:m,attach:"material",blending:D.AdditiveBlending,"uniforms-fade-value":n,depthWrite:!1,transparent:!0,vertexColors:!0}))});var I=e.i(95430),E=e.i(14421);(0,v.extend)({Water:w,Sky:C});let W=new n.Color(17510),N=new n.Color(517),G=new n.Color,B=new n.Color,O=function({lite:e=!1,fogDensity:r=35e-5,water:o=!0,sky:i=!0,horizon:l,liteColor:u=0xb4cbd1}){let{nightMode:d}=(0,j.useOcearoContext)(),{getWindData:h,getCurrentWeather:m}=(0,P.useWeather)(),f=(0,a.useRef)(),p=(0,a.useRef)(),v=(0,a.useRef)(),M=(0,a.useRef)(),b=(0,a.useRef)(null),S=(0,c.useSignalKPath)("navigation.position"),C=(0,a.useRef)(null);(0,a.useEffect)(()=>{C.current=S},[S]);let k=(0,a.useRef)(0),D=(0,a.useRef)(1),F=(0,g.useThree)(e=>e.gl),R=(0,g.useThree)(e=>e.scene),A=(0,a.useMemo)(()=>new n.Vector3,[]),O=T("assets/moon.jpg"),_=(0,x.useLoader)(n.TextureLoader,"assets/waternormals.jpg");(0,a.useMemo)(()=>{_.wrapS=_.wrapT=n.RepeatWrapping},[_]);let L=(0,a.useMemo)(()=>new n.PlaneGeometry(4e3,4e3,144,144),[]),U=(0,a.useMemo)(()=>new n.MeshBasicMaterial({color:0xb4cbd1,depthWrite:!1}),[]),V=(0,a.useMemo)(()=>new n.Color(u),[u]),H=(0,a.useRef)({waveAmp:{value:0},waveTime:{value:0}}),$=(0,a.useRef)(),Z=(0,a.useRef)(),K=(0,a.useRef)(!1),X=(0,a.useMemo)(()=>{let e=document.createElement("canvas");e.width=e.height=128;let t=e.getContext("2d"),a=t.createRadialGradient(64,64,8,64,64,62);return a.addColorStop(0,"rgba(255,255,255,0.85)"),a.addColorStop(.55,"rgba(255,255,255,0.35)"),a.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=a,t.fillRect(0,0,128,128),new n.CanvasTexture(e)},[]),Y=(0,a.useMemo)(()=>{let e=[];for(let t=0;t<16;t++){let a=t/16*Math.PI*2+.6*Math.random(),r=500+1200*Math.random();e.push({position:[Math.cos(a)*r,260+180*Math.random(),Math.sin(a)*r],scale:[420+380*Math.random(),150+120*Math.random(),1]})}return e},[]),q=(0,a.useMemo)(()=>new n.SpriteMaterial({map:X,transparent:!0,opacity:0,depthWrite:!1,color:0xffffff}),[X]),Q=(0,a.useMemo)(()=>{let e=new Float32Array(3600);for(let t=0;t<1200;t++)e[3*t]=(2*Math.random()-1)*240,e[3*t+1]=220*Math.random(),e[3*t+2]=(2*Math.random()-1)*240;let t=new n.BufferGeometry;return t.setAttribute("position",new n.BufferAttribute(e,3)),t},[]),J=(0,a.useMemo)(()=>new n.PointsMaterial({color:0x9fc4d8,size:1.6,transparent:!0,opacity:.55,depthWrite:!1,sizeAttenuation:!0}),[]),ee=(0,a.useMemo)(()=>({textureWidth:256,textureHeight:256,waterNormals:_,sunDirection:new n.Vector3,sunColor:0xffffff,waterColor:7695,distortionScale:3.7,fog:void 0!==R.fog,format:F.outputColorSpace}),[_,F.outputColorSpace,R.fog]),et=(0,a.useMemo)(()=>{if(e)return null;let t=new w(L,ee),a=H.current;return t.material.onBeforeCompile=e=>{e.uniforms.waveAmp=a.waveAmp,e.uniforms.waveTime=a.waveTime,e.vertexShader=e.vertexShader.replace("void main() {",`
          uniform float waveAmp;
          uniform float waveTime;
          vec3 swellDisplace(vec3 p) {
            float fade = 1.0 - smoothstep(1500.0, 1900.0, max(abs(p.x), abs(p.y)));
            float w1 = sin(p.x * 0.076 + p.y * 0.048 + waveTime * 1.15);
            float w2 = sin(p.x * 0.041 - p.y * 0.052 + waveTime * 0.85);
            float w3 = sin(-p.x * 0.022 + p.y * 0.030 + waveTime * 0.55);
            p.z += waveAmp * fade * (0.55 * w1 + 0.30 * w2 + 0.15 * w3);
            return p;
          }
          void main() {
            vec3 wavePos = swellDisplace(position);
        `).replace(/vec4\( position, 1.0 \)/g,"vec4( wavePos, 1.0 )")},t},[L,ee,e]);return(0,y.useFrame)((t,a)=>{if(f.current&&(f.current.material.uniforms.time.value+=.5*a),H.current.waveTime.value+=a,$.current&&$.current.visible&&($.current.rotation.y+=.004*a),Z.current&&K.current){let e=Z.current.geometry.attributes.position,t=e.array,r=160*a;for(let e=1;e<t.length;e+=3)t[e]-=r,t[e]<0&&(t[e]+=220);e.needsUpdate=!0}if(D.current+=a,D.current<1)return;let r=D.current;D.current=0;let o=C.current,i=o&&"number"==typeof o.latitude?o.latitude:46.15,l=o&&"number"==typeof o.longitude?o.longitude:-1.15,u=(0,I.vesselNow)(),c=s.default.get("debugMode"),g=u;if(c){null===b.current&&(b.current=Date.now());let e=(Date.now()-b.current)/1e3*720%86400,t=Math.floor(e/3600),a=Math.floor(e%3600/60),r=new Date(u.getTime());r.setHours(t,a,0,0),g=r}let{elevation:x,azimuth:y}=(0,E.sunPosition)(i,l,g),w=0;w=x<=-10?1:x>=5?0:(5-x)/15;let S=d||x<=-5,j=S?Math.max(x,20):Math.max(x,5),P=n.MathUtils.degToRad(90-j),T=n.MathUtils.degToRad(y);if(A.setFromSphericalCoords(1,P,T),f.current){let e=h()?.speed??5;k.current+=(e-k.current)*Math.min(.5*r,1);let t=Math.min(Math.max(.5*k.current,0),8),a=f.current.material.uniforms;a.distortionScale.value=t,a.sunDirection.value.copy(A).normalize();let o=s.default.get("aisLengthScalingFactor")||.7,i=Math.min(.21*k.current**2/9.81,6);H.current.waveAmp.value=i/2*o,G.copy(W).lerp(N,w),a.sunColor.value.setHex(S?4491519:0xffffff),a.waterColor.value.copy(G)}e&&(G.copy(V).lerp(N,w),U.color.copy(G));let F=m(),R=Math.min(Math.max(F?.cloudCover??0,0),1),z=Math.max(F?.rain??0,0),O=z>.05;if($.current){$.current.visible=R>.08;let e=(1-.7*w)*(O?.55:1);B.setScalar(e),q.color.copy(B),q.opacity=.15+.55*R}if(K.current=O,Z.current&&(Z.current.visible=O,J.opacity=Math.min(.3+.15*z,.75)),p.current){let t=p.current.material.uniforms,a=.5+.5*(F?.humidity??.6)+9*R+4*!!O,r={turbidity:e?Math.min(a,2.5):a,rayleigh:1.2*(1-.5*R),mieCoefficient:.005+.02*R,mieDirectionalG:.8},o={turbidity:.05,rayleigh:.1,mieCoefficient:5e-4,mieDirectionalG:.95},i=e=>r[e]+(o[e]-r[e])*w;t.turbidity.value=i("turbidity"),t.rayleigh.value=i("rayleigh"),t.mieCoefficient.value=i("mieCoefficient"),t.mieDirectionalG.value=i("mieDirectionalG"),t.sunPosition.value.copy(A)}M.current&&(M.current.position.copy(A).multiplyScalar(4e3),M.current.visible=!S),v.current&&(v.current.position.copy(A).multiplyScalar(4e3),v.current.visible=S,v.current.lookAt(0,0,0))}),(0,a.useEffect)(()=>()=>{et&&(et.material.uniforms.mirrorSampler?.value?.renderTarget?.dispose(),et.material.dispose())},[et]),(0,a.useEffect)(()=>()=>{L.dispose(),U.dispose(),X.dispose(),q.dispose(),Q.dispose(),J.dispose()},[L,U,X,q,Q,J]),(0,a.useEffect)(()=>{let e=new n.Color(!i&&l?l:d?517:6694);return R.background=e,R.fog=new n.FogExp2(e,r),F.outputColorSpace=n.SRGBColorSpace,()=>{R.background=null,R.fog=null}},[R,d,F,r,i,l]),(0,t.jsxs)(t.Fragment,{children:[i&&d&&(0,t.jsx)(z,{radius:5e3,depth:50,count:1500,factor:4,saturation:0,fade:!0,speed:1}),i&&(0,t.jsx)("sky",{ref:p,scale:45e4}),i&&d&&(0,t.jsxs)("mesh",{ref:v,position:[600,200,-1500],children:[(0,t.jsx)("sphereGeometry",{args:[80,32,32]}),(0,t.jsx)("meshStandardMaterial",{map:O,emissive:0xffffff,emissiveIntensity:.8})]}),i&&(0,t.jsxs)("mesh",{ref:M,children:[(0,t.jsx)("sphereGeometry",{args:[200,32,32]}),(0,t.jsx)("meshBasicMaterial",{color:0xffffff})]}),i&&(0,t.jsx)("group",{ref:$,visible:!1,children:Y.map((e,a)=>(0,t.jsx)("sprite",{position:e.position,scale:e.scale,material:q},a))}),i&&(0,t.jsx)("points",{ref:Z,geometry:Q,material:J,visible:!1}),o?e?(0,t.jsx)("mesh",{geometry:L,material:U,"rotation-x":-Math.PI/2,position:[0,-.3,0],renderOrder:-1}):(0,t.jsx)("primitive",{ref:f,object:et,"rotation-x":-Math.PI/2,position:[0,-.3,0]}):null]})};var _=e.i(10502),L=e.i(43758),U=e.i(62588),V=e.i(77291),H=e.i(34297),$=e.i(8066),Z=e.i(98392);let K=e=>-5+10*e,X=Array.from({length:49},(e,t)=>{let a=t/48;return a*a*(3-2*a)*.3+.7*a}),Y=({beam:e,draft:t,freeboard:a,entry:r=.3,run:o=.15,transom:i=.85,bowRise:n=.25,deadrise:l=.15,bilge:s=.25,flare:u=.15})=>{let c=t=>Math.max(.015,e/2*Math.sin(Math.min(t/r,1)*Math.PI/2)**1.4*(t>1-o?1-(1-i)*((t-(1-o))/o)**1.6:1)),d=e=>a+n*Math.max(0,1-e/.4)**2,h=e=>{let a=c(e),r=t*Math.min(1,.2+e/.1)*(e>.85?1-.3*(e-.85)/.15:1),o=d(e),i=Math.min(s,.8*r,.55*a),n=a-i,h=[[0,-r],[.5*n,-r+r*l*.35],[n,-r+r*l*.6]],m=-r+r*l*.6+i;for(let e of[.25,.5,.75,1]){let t=-Math.PI/2+e*Math.PI/2;h.push([n+i*Math.cos(t),m+i*Math.sin(t)])}let f=u*a*Math.max(0,1-e/.35);return h.push([a+.4*f,(m+o)/2],[a+f,o]),h},m=(0,$.bothSides)((0,$.loft)(X.map(e=>({z:K(e),pts:h(e)})))),f=(0,$.bothSides)((0,$.loft)(X.map(e=>{let t=h(e)[h(e).length-1][0];return{z:K(e),pts:[[0,d(e)+.015],[.6*t,d(e)+.01],[t,d(e)]]}}),!0)),p=h(1),v=(0,$.cap)([...p.slice().reverse().map(([e,t])=>[-e,t]),...p.slice(1)],K(1)),g=(e,t)=>{let a=h(e);for(let e=1;e<a.length;e++)if(t<=a[e][1]){let[r,o]=a[e-1],[i,n]=a[e];return r+(i-r)*(0,$.clamp01)((t-o)/(n-o||1))}return a[a.length-1][0]},x=(0,$.bothSides)((0,$.loft)(X.slice(1).map(e=>({z:K(e),pts:[[g(e,-.02)+.006,-.02],[g(e,.06)+.006,.06]]}))));return{body:(0,$.merge)([m,f,v]),dark:x,deckAt:d,beamAt:c,sideX:g,flareAt:e=>u*Math.max(0,1-e/.35)}},q=(e,t,a,[r,o,i],n=.06)=>{let l=new H.RoundedBoxGeometry(e,t,a,2,Math.max(.001,.99*Math.min(n,e/2,t/2,a/2)));return l.translate(r,o+t/2,i),l},Q=(e,t,[a,r,o],i=.12)=>q(e+.02,i,t+.02,[a,r,o],.02),J=(e,t,a=0)=>{let r=new n.Shape(e.map(([e,t])=>new n.Vector2(-e,t))),o=new n.ExtrudeGeometry(r,{depth:t,bevelEnabled:!0,bevelThickness:.03,bevelSize:.03,bevelSegments:2});return o.rotateY(Math.PI/2),o.translate(a-t/2,0,0),o},ee=(e,t,[a,r,o],i=16,l=e)=>{let s=new n.CylinderGeometry(l,e,t,i);return s.translate(a,r+t/2,o),s},et=([e,t,a],r=.6)=>[ee(.03,r,[e,t,a],8,.022),q(.34,.03,.05,[e,t+.7*r,a],.01),q(.26,.035,.07,[e,t+r+.02,a],.015)],ea=([e,t,a],r=1)=>[ee(.07,.35,[e,t,a],12,.06),q(.14,.1,.16,[e,t+.35,a],.03),(0,$.tube)([e,t+.4,a],[e+.55*r,t+.75,a+.25],.025,.018,8)],er=([e,t,a],r=.32,o=.07,i=0)=>{let l=new n.CapsuleGeometry(o,r,4,10);return l.rotateX(Math.PI/2+i),l.translate(e,t,a),l},eo=([e,t,a],r,o=.32,i=.07)=>{let n=Math.sign(e)||1;return[er([e,t,a],o,i),(0,$.tube)([e-n*i*1.2,t-i,a-.35*o],[e+n*i*.4,r,a-.35*o],.012,.012,6),(0,$.tube)([e-n*i*1.2,t-i,a+.35*o],[e+n*i*.4,r,a+.35*o],.012,.012,6)]},ei=(e,t,a,r=.12)=>(0,$.bothSides)((0,$.loft)(Array.from({length:17},(o,i)=>{let n=t+i/16*(a-t),l=e.beamAt(n)*(1+.3*e.flareAt(n)),s=e.deckAt(n);return{z:K(n),pts:[[l-.035,s],[l-.035,s+r],[l,s+r],[l,s]]}}))),en=(e,t,a,r,o=.09)=>{let i=[];for(let l=0;l<=16;l++){let s=a+l/16*(r-a);i.push(new n.Vector3(e.sideX(s,t)+.6*o,t,K(s)))}let l=i.map(e=>new n.Vector3(-e.x,e.y,e.z)),s=0===a?[...l.reverse(),...i.slice(1)]:[...i,...l.reverse().slice(1)];return new n.TubeGeometry(new n.CatmullRomCurve3(s),64,o,8,!1)},el=(e,t,a,r,o)=>(0,$.bothSides)((0,$.loft)(Array.from({length:13},(i,n)=>{let l=t+n/12*(a-t);return{z:K(l),pts:[[e.sideX(l,r)+.01,r],[e.sideX(l,o)+.01,o]]}}))),es=(e,t,a)=>new n.Vector3(e,t,a),eu=(e,t,a,r={})=>{let o=(0,Z.makeSailGeometry)({tack:e,head:t,clew:a,camber:.07,draft:.4,twist:.08,leeward:1,rows:8,cols:6,...r});return o.deleteAttribute("uv"),o},ec=({beam:e,mast:t,mizzen:a=0,roof:r=.35,saloon:o=!1,freeboard:i=.55,overhang:n=0})=>{let l=Y({beam:e,draft:.25,freeboard:i,entry:.5,run:.28,transom:.86,bowRise:.1,deadrise:.55,bilge:.25,flare:.1}),s=l.deckAt(.5),u=.62*e,c=[l.body,J([[-2.3,0],[-1.6,r],[1.2,r],[1.35,0]],u).translate(0,s,0),(0,$.foil)({y:-.15,lead:-.85,chord:.8},{y:-1.55,lead:-.6,chord:.55},.12),q(.26,.24,1.1,[0,-1.8,-.35],.11),(0,$.foil)({y:0,lead:3.85,chord:.4},{y:-1,lead:3.95,chord:.28},.11)],d=[l.dark,J([[-2.1,.35*r],[-1.68,.82*r],[1,.82*r],[1.05,.35*r]],u+.03).translate(0,s,0),el(l,.3,.62,.55*i,.72*i),J([[1.2,0],[1.4,.9*r],[1.9,.95*r],[2,0]],.85*u).translate(0,s,0)];o&&(c.push(J([[-.9,0],[-.4,.42],[1.1,.42],[1.2,0]],.9*u).translate(0,s+r,0)),d.push(J([[-.78,.08],[-.45,.34],[1,.34],[1.05,.08]],.9*u+.03).translate(0,s+r,0)));let h=s+t;return c.push(ee(.07,t,[0,s,-.9],10,.045)),c.push((0,$.tube)([0,s+1,-.9],[0,s+1,2.7],.06)),c.push(eu(es(0,s+1.1,-.9+.08),es(0,h-.3,-.9+.08),es(0,s+1.15,2.6),{headWidth:.4})),c.push(eu(es(0,s+.15,-4.9-n),es(0,h-.12*t,-.9-.05),es(0,s+.6,-.9+1.4))),c.push((0,$.tube)([0,s+.1,-4.95-n],[0,h-.12*t,-.9],.012)),c.push((0,$.tube)([0,h,-.9],[0,s+.1,4.9],.012)),a&&(c.push(ee(.055,a,[0,s,3.2],10,.035)),c.push(eu(es(0,s+.8,3.2+.06),es(0,s+a-.2,3.2+.06),es(0,s+.85,4.9)))),{body:c,dark:d}},ed={30:()=>{let e=Y({beam:2.8,draft:.6,freeboard:.62,entry:.42,run:.2,transom:.82,bowRise:.5,deadrise:.35,bilge:.35,flare:.25}),t=e.deckAt(.45),a=new n.CylinderGeometry(.32,.32,1.2,18);return a.rotateZ(Math.PI/2),a.translate(0,t+.42,2.3),{body:[e.body,ei(e,.12,1,.16),q(1.8,.45,1.9,[0,t,-1],.06),J([[-1.85,0],[-1.65,.5],[-.45,.52],[-.4,0]],1.5).translate(0,t+.45,0),...et([.35,t+.97,-1],.35),ee(.05,1.7,[0,t+.97,-.5],10,.035),(0,$.tube)([0,t+1.4,-.5],[0,t+.55,1.5],.03,.025,8),(0,$.tube)([.7,t+.3,-.3],[.45,t+2.3,-.4],.03,.025,8),(0,$.tube)([-.7,t+.3,-.3],[-.45,t+2.3,-.4],.03,.025,8),a,q(.25,.42,.25,[-.75,t,2.3],.04),q(.25,.42,.25,[.75,t,2.3],.04),(0,$.tube)([-1.05,t,4.2],[-.95,t+1.35,4.2],.06),(0,$.tube)([1.05,t,4.2],[.95,t+1.35,4.2],.06),(0,$.tube)([-.95,t+1.35,4.2],[.95,t+1.35,4.2],.06),ee(.12,.22,[-.65,t+.97,-.3],10)],dark:[e.dark,J([[-1.75,.18],[-1.66,.42],[-.5,.44],[-.47,.18]],1.52).translate(0,t+.45,0),el(e,.05,.95,e.deckAt(.5)-.12,e.deckAt(.5)-.06)]}},31:()=>{let e=Y({beam:3.5,draft:.75,freeboard:.65,entry:.5,run:.25,transom:.78,bowRise:.35,deadrise:.3,bilge:.5,flare:.15}),t=e.deckAt(.45),a=(0,$.merge)([en(e,e.deckAt(.1)-.15,0,.22,.13),en(e,t-.12,.88,1,.1)]);return{body:[e.body,q(2.4,.65,3,[0,t,-.3],.1),q(1.9,.8,1.5,[0,t+.65,-.6],.1),ee(.05,1,[0,t+1.45,-.2]),q(.8,.45,.5,[0,t,3.4],.08),ee(.12,.5,[0,t,2.5]),a,...et([0,t+1.45,-.2],.55),...((e,t)=>{let a=[];for(let r=0;r<6;r++){let o=.28+r/5*.57;for(let r of[-1,1]){let i=new n.TorusGeometry(.09,.035,6,12);i.rotateY(Math.PI/2),i.translate(r*(e.sideX(o,t)+.03),t,K(o)),a.push(i)}}return a})(e,t-.12),ei(e,.18,1,.14)],dark:[e.dark,Q(1.9,1.5,[0,t+1.05,-.6],.35),Q(2.4,3,[0,t+.3,-.3],.08)]}},35:()=>{let e=Y({beam:1.3,draft:.35,freeboard:.6,entry:.42,run:.12,transom:.92,bowRise:.22,deadrise:.3,bilge:.15,flare:.3}),t=e.deckAt(.5),a=new n.ConeGeometry(.24,1.4,4);return a.rotateY(Math.PI/4),a.translate(0,t+1.5,.2),{body:[e.body,J([[-1.7,0],[-1.15,.82],[1.5,.82],[2.6,0]],1.05).translate(0,t,0),a,ee(.24,.2,[0,t,-2.75],12,.18),(0,$.tube)([0,t+.12,-2.75],[0,t+.18,-3.7],.035),q(1,.1,1.3,[0,t,3.7],.04),new n.SphereGeometry(.16,14,10).translate(0,t+2.25,.2),q(.5,.08,.4,[0,t,-2.1],.02),q(.4,.45,.5,[0,t+.82,.9],.04),ee(.12,.2,[.4,t+.82,1.4],10)],dark:[e.dark,J([[-1.42,.55],[-1.24,.72],[-.3,.72],[-.3,.55]],1.07).translate(0,t,0)]}},37:()=>{let e=Y({beam:3.1,draft:.38,freeboard:.85,entry:.45,run:.1,transom:.95,bowRise:.28,deadrise:.8,bilge:.14,flare:.3}),t=e.deckAt(.5);return{body:[e.body,J([[-1.9,0],[-.5,.72],[2.7,.75],[2.85,0]],2.5).translate(0,t,0),J([[.1,0],[.45,.32],[2.2,.32],[2.3,0]],2).translate(0,t+.75,0),(0,$.tube)([-.9,t+1.07,1.7],[0,t+1.6,1.8],.05),(0,$.tube)([.9,t+1.07,1.7],[0,t+1.6,1.8],.05),q(2.6,.06,.5,[0,.12,4.85],.02),q(.6,.04,.25,[0,t+1.62,1.8],.02)],dark:[e.dark,el(e,.3,.62,.42,.55),J([[.14,.1],[.38,.3],[.7,.3],[.7,.1]],2.03).translate(0,t+.75,0),J([[-1.55,.2],[-.62,.66],[2.4,.68],[2.5,.2]],2.53).translate(0,t,0)]}},40:()=>{let e=Y({beam:.72,draft:.3,freeboard:.75,entry:.55,run:.08,transom:.92,bowRise:.08,deadrise:.6,bilge:.1,flare:.05}),t=e=>(0,$.merge)([e.clone().translate(-1.25,0,0),e.clone().translate(1.25,0,0)]);return{body:[t(e.body),q(3.2,.25,8.4,[0,.55,.5],.08),J([[-3.6,0],[-2.2,.85],[4.2,.85],[4.45,0]],2.9).translate(0,.8,0),J([[-1.6,0],[-1.1,.35],[.4,.35],[.5,0]],1.5).translate(0,1.65,0),...et([0,2,-.2],.4)],dark:[t(e.dark),J([[-3.2,.35],[-2.35,.75],[4,.75],[4,.35]],2.93).translate(0,.8,0),J([[-1.45,.12],[-1.15,.3],[.3,.3],[.3,.12]],1.53).translate(0,1.65,0)]}},50:()=>{let e=Y({beam:3,draft:.45,freeboard:.8,entry:.45,run:.12,transom:.9,bowRise:.32,deadrise:.7,bilge:.18,flare:.3}),t=e.deckAt(.5);return{body:[e.body,J([[-1.2,0],[-.75,1],[1.65,1],[1.8,0]],2.1).translate(0,t,0),ee(.05,1.1,[0,t+1,.7]),q(1,.1,.14,[0,t+1.9,.7],.03),q(.3,.035,.07,[0,t+1.2,.2],.015)],dark:[e.dark,el(e,.1,.95,e.deckAt(.5)-.14,e.deckAt(.5)-.02),J([[-.95,.55],[-.8,.9],[1.55,.92],[1.6,.55]],2.13).translate(0,t,0)]}},60:()=>{let e=Y({beam:1.5,draft:.3,freeboard:.7,entry:.3,run:.1,transom:.9,bowRise:.12,deadrise:.05,bilge:.15,flare:.22}),t=e.deckAt(.5),a=[e.body,ei(e,0,.18,.1)],r=[e.dark,el(e,.12,.92,.38,.43),el(e,.15,.9,.53,.58)],o=t;[[-3,4.75,1.48,.3,.25],[-2.75,4.45,1.46,.28,.3],[-2.45,3.9,1.44,.28,.32],[-2.15,3.2,1.36,.26,.3],[-1.6,2.4,1.1,.22,.25]].forEach(([e,t,i,n,l],s)=>{if(a.push(J([[e+l,0],[e+.35*l,.35*n],[e,.75*n],[e+.04,n],[t,n],[t,0]],i).translate(0,o,0)),r.push(J([[e+.55*l-.01,.25*n],[e-.012,.7*n],[t-.12,.7*n],[t-.12,.25*n]],i+.024).translate(0,o,0)),2===s)for(let e of[-1,1])for(let t=0;t<4;t++)a.push(...eo([e*(i/2+.07),o+.1,-.9+.8*t],o+n+.02,.36,.07));3===s&&(a.push(q(1.6,.06,.32,[0,o+n-.06,e+.25],.02)),r.push(q(1.38,.08,.06,[0,o+.55*n,e-.01],.01))),o+=n});let i=J([[1.7,0],[1.95,.55],[2.5,.55],[2.4,0]],.42);for(let[n,l,s]of(i.translate(0,o-.22,0),a.push(i),r.push(J([[1.92,.47],[1.96,.56],[2.51,.56],[2.49,.47]],.44).translate(0,o-.22,0)),a.push(...et([0,o,-1],.45)),a.push(ee(.02,.35,[0,e.deckAt(.02),-4.6],8)),[[4.75,1.48,t+.3],[4.45,1.46,t+.58],[3.9,1.44,t+.86]]))a.push(q(l,.05,.02,[0,s+.05,n-.01],.005));return{body:a,dark:r}},70:()=>{let e=Y({beam:1.5,draft:.45,freeboard:.55,entry:.22,run:.14,transom:.82,bowRise:.18,deadrise:0,bilge:.12,flare:.12}),t=e.deckAt(.5),a=[e.body];for(let r=0;r<7;r++){let o=-3.45+.93*r,i=(o+5)/10,n=Math.min(1.36,2*e.beamAt(i)-.12),l=[2,3,4,4,4,4,3][r],s=Math.max(2,Math.round(n/.27));for(let e=0;e<s;e++){let i=l-((e+r)%3==0),u=-n/2+n/s*(e+.5);a.push(q(n/s-.025,.12*i,.84,[u,t,o],.015))}}return a.push(q(1.4,1.05,.62,[0,t,3.55],.06)),a.push(q(1.62,.1,.36,[0,t+1.05,3.4],.03)),a.push(q(.34,.42,.3,[0,t+1,3.72],.08)),a.push(q(1,.16,.55,[0,e.deckAt(.03)-.02,-4.4],.05)),a.push(...et([0,t+1.15,3.4],.45)),a.push(ee(.025,.55,[0,e.deckAt(.03)+.14,-4.3],8)),a.push(...ea([.55,t+.5,-1.2],1),...ea([-.55,t+.5,1.6],-1)),a.push(...eo([.78,t+.5,3.6],t+.66),...eo([-.78,t+.5,3.6],t+.66)),{body:a,dark:[e.dark,el(e,.05,.95,.42,.47),Q(1.64,.38,[0,t+1.06,3.4],.07),Q(1.4,.62,[0,t+.9,3.55]),Q(1.4,.62,[0,t+.62,3.55],.06),Q(1.4,.62,[0,t+.38,3.55],.06),q(.36,.08,.32,[0,t+1.38,3.72],.04)]}},80:()=>{let e=Y({beam:1.7,draft:.5,freeboard:.42,entry:.24,run:.12,transom:.84,bowRise:.14,deadrise:0,bilge:.12,flare:.1}),t=e.deckAt(.5),a=[e.body,q(.9,.12,6.4,[0,t,-.7],.04),q(1.5,1,.85,[0,t,3.65],.08),q(1.72,.08,.35,[0,t+1,3.5],.03),q(.4,.42,.32,[0,t+.95,3.85],.08),q(.9,.14,.6,[0,e.deckAt(.03)-.02,-4.35],.05),ee(.035,.7,[0,t+.12,-.6]),(0,$.tube)([0,t+.8,-.6],[.6,t+.55,-.2],.025)];for(let e of[-.25,0,.25])a.push((0,$.tube)([e,t+.17,-3.8],[e,t+.17,2.9],.03,.03,8));for(let e=0;e<6;e++)a.push(q(.06,.06,.06,[.42,t+.12,-3.5+1.2*e],.02));a.push(q(.12,.05,6.6,[-.45,t+.3,-.6],.02));for(let e=0;e<7;e++)a.push(ee(.012,.18,[-.45,t+.12,-3.6+1.1*e],6));for(let r of(a.push(...et([0,t+1.08,3.6],.5)),a.push(...ea([.6,t+.12,-.2],1)),a.push(q(.24,.05,.42,[0,t+.18,4.35],.02)),a.push(er([0,t+.32,4.36],.28,.075,-.3)),[-4,4.2]))for(let t of[-1,1])a.push(ee(.05,.08,[.45*t,e.deckAt((r+5)/10),r],10));return{body:a,dark:[e.dark,el(e,.05,.95,.32,.37),Q(1.74,.37,[0,t+1,3.5],.06),Q(1.5,.85,[0,t+.85,3.65]),Q(1.5,.85,[0,t+.58,3.65],.06),Q(1.5,.85,[0,t+.34,3.65],.06),q(.42,.08,.34,[0,t+1.33,3.85],.04)]}},"36s":()=>ec({beam:3,mast:12.5,roof:.3}),"36m":()=>ec({beam:3.3,mast:13.8,roof:.36}),"36k":()=>ec({beam:2.9,mast:12,mizzen:8,roof:.3,saloon:!0,freeboard:.5,overhang:.4}),"36y":()=>ec({beam:2.4,mast:14.5,roof:.28,saloon:!0,freeboard:.5}),"36c":()=>{let e=Y({beam:1.25,draft:.2,freeboard:.72,entry:.5,run:.1,transom:.92,bowRise:.08,deadrise:.6,bilge:.25,flare:.05}),t=e=>(0,$.merge)([e.clone().translate(-2,0,0),e.clone().translate(2,0,0)]),a=[t(e.body),q(3.6,.3,6.5,[0,.47,1.4],.1),J([[-1.8,0],[-1,.65],[2.4,.68],[2.4,0]],3.4).translate(0,.77,0),q(3.4,.06,1.6,[0,1.45,3.2],.03),...[-1,1].flatMap(e=>[4,2.5].map(t=>ee(.035,.68,[1.6*e,.77,t],8))),(0,$.tube)([-2,.72,-3.6],[2,.72,-3.6],.07),ee(.08,15,[0,.77,-1.7],10,.05),(0,$.tube)([0,1.72,-1.7],[0,1.72,2.6],.06),eu(es(0,1.82,-1.62),es(0,15.42,-1.62),es(0,.72+1.15,2.5),{headWidth:.6}),eu(es(0,.82,-3.6),es(0,13.72,-1.75),es(0,1.42,-.6))],r=[t(e.dark),J([[-1.6,.18],[-1.05,.58],[2.2,.6],[2.25,.18]],3.43).translate(0,.77,0)];for(let t of[-1,1])r.push(el(e,.3,.7,.42,.55).translate(2*t,0,0));return{body:a,dark:r}}},eh=new Map;Object.keys(ed);let em={normal:new n.MeshStandardMaterial({color:9080983,roughness:.5,metalness:.05,side:n.DoubleSide}),alert:new n.MeshStandardMaterial({color:0xd2504f,roughness:.6,metalness:0,side:n.DoubleSide,transparent:!0,opacity:.88}),selected:new n.MeshStandardMaterial({color:638975,roughness:.5,metalness:.05,side:n.DoubleSide}),yields:new n.MeshStandardMaterial({color:9406153,roughness:.6,metalness:0,side:n.DoubleSide,transparent:!0,opacity:.88}),close:new n.MeshStandardMaterial({color:0xd9a066,roughness:.6,metalness:0,side:n.DoubleSide,transparent:!0,opacity:.88})},ef=new n.MeshStandardMaterial({color:2501683,roughness:.6,metalness:0});function ep({code:e,scaleFactor:a,beamRatio:r}){let o=(e=>{if(!eh.has(e)){let t=(ed[e]||ed[70])(),a=(0,$.merge)(t.body),r=(0,$.merge)(t.dark);t.body[0].computeBoundingBox();let o=t.body[0].boundingBox;eh.set(e,{body:a,dark:r,beamRatio:(0,$.clamp01)((o.max.x-o.min.x)/10)||.25})}return eh.get(e)})(e),i=r?r/o.beamRatio:1;return(0,t.jsxs)("group",{scale:[a*i,a,a],children:[(0,t.jsx)("mesh",{geometry:o.body,material:em.normal}),(0,t.jsx)("mesh",{geometry:o.dark,material:ef,userData:{fixed:!0}})]})}let ev=e=>.7*Math.max(e||10,4),eg=new n.MeshBasicMaterial({colorWrite:!1,depthWrite:!1}),ex=({boatData:e,onClick:a,ref:r})=>{let{length:o,beam:i}=e,n=((e,t,a)=>{let r=Number(e);if(30===r)return 30;if(r>=31&&r<=32)return 31;if(r>=33&&r<=35)return 35;if(36===r)return t>0&&a>0&&a/t>.38?"36c":!(t>0)||t<9?"36s":t<15?"36m":t<24?"36k":"36y";if(37===r)return 37;if(r>=40&&r<=49)return 40;if(r>=50&&r<=59)return 50;if(r>=60&&r<=69)return 60;if(r>=70&&r<=79)return 70;if(r>=80&&r<=89)return 80;if(Number.isFinite(t)&&t>0){if(t<20)return 37;if(t<60)return 50}return 70})(e.shipType,o,i),l=ev(o)/10,s=o>0&&i>0?i/o:null,u=Math.max(1.2*ev(o),8);return(0,t.jsxs)("group",{ref:r,onClick:t=>{t.stopPropagation(),a&&a(e.mmsi)},children:[(0,t.jsx)(ep,{code:n,scaleFactor:l,beamRatio:s>=.08&&s<=.6?s:null}),(0,t.jsx)("mesh",{position:[0,u/4,0],material:eg,userData:{fixed:!0},children:(0,t.jsx)("boxGeometry",{args:[u,u/2,u]})})]})};var ey=e.i(83646);let eM=40*Math.PI/180,eb=({x:e,z:a,course:r,turn:o,color:i})=>{let l,s=[],u=r,c=e+6*Math.sin(r),d=a-6*Math.cos(r);for(let e=0;e<=16;e++)s.push([c,.4,d]),c+=30*Math.sin(u=r+o*eM*((e+1)/16))/16,d-=30*Math.cos(u)/16;let[h,,m]=s[s.length-1];return(0,t.jsxs)("group",{children:[(0,t.jsx)(L.default,{points:s,color:i,lineWidth:5,transparent:!0,opacity:.7}),(0,t.jsx)("group",{position:[h,.4,m],rotation:[0,-u,0],children:(0,t.jsxs)("mesh",{rotation:[-Math.PI/2,0,0],children:[(0,t.jsx)("shapeGeometry",{args:[((l=new n.Shape).moveTo(0,3.2),l.lineTo(-2,-.6),l.lineTo(2,-.6),l.closePath(),l)]}),(0,t.jsx)("meshBasicMaterial",{color:i,transparent:!0,opacity:.75,depthWrite:!1,side:n.DoubleSide})]})})]})},ew=({name:e,color:r})=>{let o=(0,a.useRef)(null);return(0,a.useEffect)(()=>{let e=()=>{let e=o.current;if(!e)return;let t=e.getBoundingClientRect(),a=[...document.querySelectorAll("[data-hud-solid]")].some(e=>{let a;return null!==e.offsetParent&&(a=e.getBoundingClientRect(),t.left<a.right&&t.right>a.left&&t.top<a.bottom&&t.bottom>a.top)});e.style.visibility=a?"hidden":"visible"};e();let t=setInterval(e,250);return()=>clearInterval(t)},[o]),(0,t.jsx)("div",{ref:o,className:"whitespace-nowrap max-w-[9rem] truncate px-2 py-0.5 rounded-full text-caption font-semibold text-white backdrop-blur-sm",style:{background:`color-mix(in srgb, ${r} 72%, transparent)`},children:e})},eS=()=>{let{scene:e}=(0,ey.default)(),{encounters:a}=(0,V.default)();return a.slice(0,5).map(({target:a,role:r})=>{let i="stand-on"===r.ownRole||"both"===r.ownRole,n=a.cog??a.cogMagnetic??a.heading??0,l=i?e.vesselYields:e.vesselDanger,s=r.targetTurn||1;return(0,t.jsxs)("group",{children:[(0,t.jsx)(o.Html,{position:[a.sceneX,12,a.sceneZ],center:!0,zIndexRange:[15,10],style:{pointerEvents:"none"},children:(0,t.jsx)(ew,{name:a.name,color:l})}),i&&(0,t.jsx)(eb,{x:a.sceneX,z:a.sceneZ,course:n,turn:s,color:l})]},a.mmsi)})},eC=new n.Vector3,ej=new n.Quaternion,eP=new n.Euler,ek={},eT=e=>{let t=[];return e.traverse(e=>{e.isMesh&&!e.userData.fixed&&t.push(e)}),t},eD=(e,t,a,r,o)=>{let{x:i,z:n}=(0,U.predictScenePosition)(t,r,o);eC.set(i,0,n),e.position.lerp(eC,a),eP.set(0,-t.rotationAngleY,0),ej.setFromEuler(eP),e.quaternion.slerp(ej,a)},eF=({targets:e,statuses:r,colors:o})=>(0,a.useMemo)(()=>e.filter(e=>"danger"===e.risk&&e.cpaScene&&e.visible).slice(0,5).map(e=>({mmsi:e.mmsi,sceneX:e.sceneX,sceneZ:e.sceneZ,cpaScene:{...e.cpaScene}})),[e]).map(e=>{let a=e.cpaScene,i="yields"===r[e.mmsi]?o.yields:o.giveWay;return(0,t.jsxs)("group",{children:[(0,t.jsx)(L.default,{points:[[e.sceneX,.3,e.sceneZ],[a.targetX,.3,a.targetZ]],color:i,lineWidth:2,dashed:!0,dashSize:3,gapSize:2.5,transparent:!0,opacity:.9}),(0,t.jsx)(L.default,{points:[[0,.3,0],[a.ownX,.3,a.ownZ]],color:i,lineWidth:1.5,dashed:!0,dashSize:2,gapSize:3,transparent:!0,opacity:.6}),(0,t.jsxs)("mesh",{position:[a.targetX,.25,a.targetZ],rotation:[-Math.PI/2,0,0],children:[(0,t.jsx)("ringGeometry",{args:[2.2,3,32]}),(0,t.jsx)("meshBasicMaterial",{color:i,transparent:!0,opacity:.8,depthWrite:!1})]})]},e.mmsi)}),eR=({onUpdateInfoPanel:e,selectedMmsi:r=null})=>{let{aisData:o,vesselIds:i,targets:n,targetsRef:l,motionRef:s}=(0,U.useAIS)(),{states:u}=(0,j.useOcearoContext)(),d=ek[u.oceanMode]??-.3,h=(0,a.useRef)({}),m=(0,a.useRef)({}),{scene:f}=(0,ey.default)();(0,a.useEffect)(()=>{em.normal.color.set(f.vessel),em.alert.color.set(f.vesselDanger),em.yields.color.set(f.vesselYields),em.close.color.set(f.vesselClose),em.selected.color.set(f.route)},[f]);let p=(0,a.useRef)(null),{statuses:v}=(0,V.default)(),g=(0,a.useRef)({});(0,a.useEffect)(()=>{g.current=v},[v]),(0,a.useEffect)(()=>{p.current=r},[r]);let x=(0,a.useMemo)(()=>["navigation.headingTrue","navigation.headingMagnetic","navigation.courseOverGroundTrue","navigation.courseOverGroundMagnetic"],[]),M=(0,c.useSignalKPaths)(x),b=(0,a.useMemo)(()=>{let e=M["navigation.headingTrue"]??M["navigation.headingMagnetic"],t=M["navigation.courseOverGroundTrue"]??M["navigation.courseOverGroundMagnetic"];return e??t??0},[M]);(0,y.useFrame)((e,t)=>{let a=1-Math.exp(-4*Math.min(t,.5)),r=l.current,o=s.current,i=Date.now();for(let e in h.current){let t=h.current[e],n=r[e];if(!t)continue;if(!n||!n.visible){t.visible=!1;continue}t.visible=!0,eD(t,n,a,o,i);let l=g.current[e],s="giveWay"===l?"alert":"yields"===l?"yields":p.current===e?"selected":"close"===l?"close":"normal",u=m.current[e];if(!u||0===u.length){if(0===(u=eT(t)).length)continue;m.current[e]=u,t.userData.look=void 0}if(s!==t.userData.look){let e=em[s];for(let t of u)t.material=e;t.userData.look=s}}});let w=(0,a.useCallback)(t=>{e?.(e=>e?.kind==="ais"&&e.mmsi===t?null:{kind:"ais",mmsi:t})},[e]),S=(0,a.useRef)({}),C=(0,a.useCallback)(e=>(S.current[e]||(S.current[e]=t=>{if(t){let a=l.current[e];t.userData.mmsi=e,t.position.set(a?.sceneX??0,0,a?.sceneZ??0),t.rotation.set(0,-(a?.rotationAngleY??0),0),h.current[e]=t}else delete h.current[e],delete m.current[e],delete S.current[e]}),S.current[e]),[l]),P=(0,a.useMemo)(()=>i.slice(0,50).map(e=>(0,t.jsx)(ex,{ref:C(e.mmsi),boatData:e,onClick:w},e.mmsi)),[i,w,C]);return(0,a.useEffect)(()=>{m.current={}},[i]),(0,t.jsx)(t.Fragment,{children:(0,t.jsxs)("group",{rotation:[0,b,0],position:[0,d,0],children:[P,(0,t.jsx)(eF,{targets:n,statuses:v,colors:{giveWay:f.vesselDanger,yields:f.vesselYields}}),(0,t.jsx)(eS,{})]})})};var eA=e.i(20840),ez=e.i(16196),eI=e.i(97776),eE=e.i(20705),eW=e.i(52260);let eN={red:"#c8102e",green:"#00843d",yellow:"#f2c200",black:"#1b1b1b",white:"#f0f0f0",orange:"#f07c00",blue:"#1f4fa0",grey:"#8a8a8a",brown:"#6b4a2b"},eG={north:{colours:["black","yellow"],topmark:"2 cones up"},south:{colours:["yellow","black"],topmark:"2 cones down"},east:{colours:["black","yellow","black"],topmark:"2 cones base together"},west:{colours:["yellow","black","yellow"],topmark:"2 cones point together"}},eB=(e,t)=>{let a=new n.Color(eN[e]||eN.grey);if(!t)return a;let r=.25+.75*(.299*a.r+.587*a.g+.114*a.b);return new n.Color(r,.36*r,.28*r)},eO=(e,t,a,r)=>{let o=e.index?e.toNonIndexed():e;o.deleteAttribute("uv");let i=o.attributes.position,l=new Float32Array(3*i.count);for(let e=0;e<i.count;e+=3){let o=(i.getX(e)+i.getX(e+1)+i.getX(e+2))/3,s=[i.getY(e),i.getY(e+1),i.getY(e+2)],u=(Math.min(...s)+Math.max(...s))/2,c=(i.getZ(e)+i.getZ(e+1)+i.getZ(e+2))/3,d=t(n.MathUtils.clamp((u-a)/Math.max(1e-6,r-a),0,.9999),Math.atan2(c,o)+Math.PI);for(let t=0;t<3;t++)l.set([d.r,d.g,d.b],(e+t)*3)}return o.setAttribute("color",new n.BufferAttribute(l,3)),o},e_=(e,t,a=0,r=0)=>(a&&e.rotateX(a),r&&e.rotateZ(r),e.translate(0,t,0),e),eL=(e,t)=>e_(new n.ConeGeometry(.42,.62,16),e+.31,t?0:Math.PI),eU=e=>e_(new n.SphereGeometry(.32,14,10),e+.32),eV=new Map,eH={Q:1,IQ:1,VQ:.5,IVQ:.5,UQ:.25,IUQ:.25},e$=e=>+(Math.max(1,e/80)**.5),eZ=["navigation.position","navigation.speedOverGround","navigation.courseOverGroundTrue"],eK={white:"#fff6dc",red:"#ff3b30",green:"#30ff7a",yellow:"#ffd23a",blue:"#4aa3ff"},eX=({waterLevel:e=-.3})=>{let r=!1!==s.default.get("showSeamarks3D"),o=!1!==s.default.get("seamarksOverpass"),i=s.default.get("aisLengthScalingFactor")||.7,{convertLatLonToXY:l}=(0,j.useOcearoContext)(),{id:u,scene:h}=(0,ey.default)(),m="night"===u,{heading:f,offset:p,hasFix:v}=(0,d.default)(),g=(0,c.useSignalKPaths)(eZ),x=g["navigation.position"],M=g["navigation.speedOverGround"],b=g["navigation.courseOverGroundTrue"],w=((e,t,r)=>{let[o,i]=(0,a.useState)({}),n=(0,a.useRef)(new Set),l=Number.isFinite(e)?Math.round(100*e)/100:null,s=Number.isFinite(t)?Math.round(100*t)/100:null,u=(0,a.useMemo)(()=>r&&null!==l&&null!==s?(0,eI.cellsAround)(l,s,5556):[],[r,l,s]),[c,d]=(0,a.useState)(0),h=(0,a.useRef)(!0),m=(0,a.useRef)(null);return(0,a.useEffect)(()=>()=>{h.current=!1,clearTimeout(m.current)},[]),(0,a.useEffect)(()=>{let e=u.filter(e=>!(e.key in o)&&!n.current.has(e.key));e.length&&(e.forEach(e=>n.current.add(e.key)),(0,eI.loadCells)(e).then(t=>{e.forEach(e=>n.current.delete(e.key)),h.current&&(Object.keys(t).length&&i(e=>({...e,...t})),e.some(e=>!(e.key in t))&&(clearTimeout(m.current),m.current=setTimeout(()=>d(e=>e+1),12e4)))}))},[u,o,c]),(0,a.useMemo)(()=>u.flatMap(e=>o[e.key]||[]),[u,o])})(x?.latitude,x?.longitude,r&&o&&v),{atons:S}=(0,U.useAIS)({passive:!r}),C=S.map(e=>`${e.id}|${e.latitude}|${e.longitude}|${e.atonType}|${e.virtual}|${e.offPosition}|${e.name}`).join(","),P=(0,a.useRef)(S);P.current=S;let k=(0,a.useMemo)(()=>(0,eE.mergeAtons)(w,P.current),[w,C]),T=(0,a.useMemo)(()=>{let e=(0,d.getSessionOrigin)();if(!e)return[];let t=new Set;return k.filter(e=>!t.has(e.id)&&t.add(e.id)).map(t=>{let{x:a,y:r}=l({lat:t.lat,lon:t.lon},e);return{...t,x:a,y:r}})},[k,l]),D=50*Math.round(p.x/50),F=50*Math.round(p.y/50),R=(0,a.useMemo)(()=>T.map(e=>({m:e,d:Math.hypot(e.x-D,e.y-F)})).filter(({d:e})=>e<=5556).sort((e,t)=>e.d-t.d).slice(0,120).map(({m:e,d:t})=>({...e,d:t})),[T,D,F]),A=(0,a.useMemo)(()=>new n.MeshStandardMaterial({vertexColors:!0,roughness:.55,metalness:.05}),[]),z=(0,a.useMemo)(()=>new n.MeshStandardMaterial({vertexColors:!0,roughness:.55,transparent:!0,opacity:.38,depthWrite:!1}),[]),W=(0,a.useMemo)(()=>{let e,t,a;return(e=document.createElement("canvas")).width=64,e.height=64,(a=(t=e.getContext("2d")).createRadialGradient(32,32,0,32,32,32)).addColorStop(0,"rgba(255,255,255,1)"),a.addColorStop(.2,"rgba(255,255,255,0.85)"),a.addColorStop(.5,"rgba(255,255,255,0.25)"),a.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=a,t.fillRect(0,0,64,64),new n.CanvasTexture(e)},[]),N=(0,a.useMemo)(()=>Object.fromEntries(Object.entries(eK).map(([e,t])=>[e,new n.SpriteMaterial({map:W,color:m?"#ff6a50":t,blending:n.AdditiveBlending,transparent:!0,depthWrite:!1,toneMapped:!1,fog:!1})])),[m,W]);(0,a.useEffect)(()=>()=>Object.values(N).forEach(e=>e.dispose()),[N]),(0,a.useEffect)(()=>()=>{A.dispose(),z.dispose(),W.dispose()},[A,z,W]);let G=(0,a.useMemo)(()=>R.map(e=>{let{geometry:t,lightY:a}=((e,t)=>{let a=JSON.stringify([e,t]);if(eV.has(a))return eV.get(a);let{parts:r,top:o}=(({beacon:e,shape:t,height:a})=>{if(e){let e=n.MathUtils.clamp(a||0,0,12)||("tower"===t?8:5);if("tower"===t||"lattice"===t)return{parts:[e_(new n.CylinderGeometry(.9,1.3,e,16,12),e/2)],top:e};if("cairn"===t)return{parts:[e_(new n.ConeGeometry(1.6,2.6,12,12),1.3)],top:2.6};let r="pile"===t?.35:.14;return{parts:[e_(new n.CylinderGeometry(r,r,e,10,12),e/2)],top:e}}switch(t){case"can":return{parts:[e_(new n.CylinderGeometry(.75,.75,1.5,20,12),.75)],top:1.5};case"conical":return{parts:[e_(new n.CylinderGeometry(.9,.9,.3,20,12),.15),e_(new n.ConeGeometry(.9,1.7,20,12),1.15)],top:2};case"spherical":return{parts:[e_(new n.SphereGeometry(.85,20,12),.6)],top:1.45};case"spar":return{parts:[e_(new n.CylinderGeometry(.22,.22,4,10,12),2)],top:4};case"barrel":return{parts:[e_(new n.CylinderGeometry(.6,.6,1.6,16,12),.45,0,Math.PI/2)],top:1.05};case"super-buoy":return{parts:[e_(new n.CylinderGeometry(2,2,1.2,24,12),.6)],top:1.2};default:return{parts:[e_(new n.CylinderGeometry(1,1,.5,20,12),.25),e_(new n.CylinderGeometry(.3,.45,2.8,14,12),1.9)],top:3.3}}})(e),i=e.colours.map(e=>eB(e,t)),l="vertical"===e.pattern&&i.length>1,s=(e,t)=>l?i[Math.floor(t/(2*Math.PI)*i.length*2)%i.length]:i[Math.min(i.length-1,Math.floor((1-e)*i.length))],u=r.map(e=>eO(e,s,0,o)),[c,d]=((e,t)=>{if(e.includes("2 cones"))return e.includes("up")?[[eL(t,!0),eL(t+.62+.12,!0)],t+1.24+.12]:e.includes("down")?[[eL(t,!1),eL(t+.62+.12,!1)],t+1.24+.12]:e.includes("base")?[[eL(t,!1),eL(t+.62,!0)],t+1.24]:[[eL(t,!0),eL(t+.62,!1)],t+1.24];if(e.includes("cone"))return[[eL(t,!e.includes("down"))],t+.62];if(e.includes("2 spheres"))return[[eU(t),eU(t+.64+.12)],t+1.28+.12];if(e.includes("sphere"))return[[eU(t)],t+.64];if(e.includes("cylinder")||"can"===e)return[[e_(new n.CylinderGeometry(.32,.32,.6,14),t+.3)],t+.6];if(e.includes("x")||e.includes("cross")||e.includes("saltire")){let e=e=>e_(new n.BoxGeometry(.9,.14,.14),t+.4,0,e);return[[e(Math.PI/4),e(-Math.PI/4)],t+.8]}return e.includes("square")||e.includes("board")||e.includes("rectangle")||e.includes("cube")?[[e_(new n.BoxGeometry(.6,.6,.6),t+.3)],t+.6]:[[],t]})(e.topmark,o+.35),h=eB(e.topColours[0]||"black",t),m=[...u,...c.map(e=>eO(e,()=>h,0,1))];c.length&&m.push(eO(e_(new n.CylinderGeometry(.05,.05,.35+.1,6),o+.175),()=>h,0,1));let f=(0,eW.mergeGeometries)(m);m.forEach(e=>e.dispose());let p={geometry:f,lightY:Math.max(d,o)+.25};return eV.set(a,p),p})((e=>{let{kind:t,category:a,system:r}=e,o=e.colours,i=e.pattern||"horizontal",n=e.topmark?.shape||"",l=e.topmark?.colours||[],s=e.shape;if("cardinal"===t){let e=eG[a]||eG.north;o.length||(o=e.colours),n||(n=e.topmark),l.length||(l=["black"]),s=s||"pillar"}else if("lateral"===t){let e,t,i=!a.includes("starboard")||a.startsWith("preferred_channel_port");o.length||(e="iala-b"===r?"green":"red",t="iala-b"===r?"red":"green",o=a.startsWith("preferred_channel_port")?[t,e,t]:a.startsWith("preferred_channel_starboard")?[e,t,e]:["starboard"===a?t:e]),n||(n=i?"cylinder":"cone, point up"),l.length||(l=[o[0]]),s=s||(i?"can":"conical")}else"isolated_danger"===t?(o.length||(o=["black","red","black"]),n||(n="2 spheres"),l.length||(l=["black"]),s=s||"pillar"):"safe_water"===t?(o.length||(o=["red","white"],i="vertical"),n||(n="sphere"),l.length||(l=["red"]),s=s||"pillar"):"station"===t?(o.length||(o=["grey"]),l=[],s=s||"pile"):(o.length||(o=["yellow"]),n||(n="x-shape"),l.length||(l=["yellow"]),s=s||"pillar");return{beacon:e.beacon,shape:s,colours:o,pattern:i,topmark:n,topColours:l,height:e.height}})(e),m),r=e.light?(({character:e,group:t,period:a},r=!1)=>{let[o,...i]=String(e||"").split("+"),n=r||i.some(e=>/LFl/.test(e))||/LFl/.test(String(t)),l=o.replace(/[^A-Za-z.]/g,""),s=l.split(".").pop(),u=Math.max(1,parseInt(t,10)||1),c=[],d=Number.isFinite(a)&&a>0?a:null;if("F"===s)return null;if(eH[l]||eH[s]){let e=eH[l]||eH[s],a=parseInt(t,10)?u:n?6:d?Math.round(d/e):1;for(let t=0;t<a;t++)c.push([.35*e,.65*e]);n&&c.push([2,1]),d=d||a*e}else if("Iso"===s)d=d||4,c.push([d/2,d/2]);else if("Oc"===s){d=d||4;for(let e=0;e<u;e++)c.push([+(0!==e),1])}else if("LFl"===s){d=d||10;for(let e=0;e<u;e++)c.push([2,1.5])}else if("Mo"===s)d=d||8,c.push([1.5,.5]);else{d=d||(1===u?5:1.5*u+4);for(let e=0;e<u;e++)c.push([.5,1])}let h=c.reduce((e,[t,a])=>e+t+a,0);return{steps:c,rest:Math.max(0,d-h),restOn:"Oc"===s,period:Math.max(d,h)}})(e.light,"cardinal"===e.kind&&"south"===e.category):null,o=[...String(e.id)].reduce((e,t)=>(31*e+t.charCodeAt(0))%997,7)/997*(r?.period||1);return{m:e,geometry:t,lightY:a,sequence:r,phase:o,hasLight:!!e.light}}),[R,m]),B=(0,a.useRef)({x:0,y:0,at:0,init:!1}),O=(0,a.useRef)({x:0,y:0});(0,a.useEffect)(()=>{B.current={x:p.x,y:p.y,at:performance.now()/1e3,init:!0}},[p]);let _=Number.isFinite(x?.latitude)?Math.round(10*x.latitude)/10:null,L=Number.isFinite(x?.longitude)?Math.round(10*x.longitude)/10:null,[V,H]=(0,a.useState)(!1);(0,a.useEffect)(()=>{let e=()=>{let e=(0,E.sunPosition)(_,L,(0,I.vesselNow)());H(!!e&&e.elevation<2)};e();let t=setInterval(e,6e4);return()=>clearInterval(t)},[_,L]);let $=(0,a.useRef)(),Z=(0,a.useRef)([]),K=(0,a.useRef)([]),X="day"!==u&&V;(0,y.useFrame)((e,t)=>{let a=B.current,r=O.current;if(!a.init||!$.current)return;let o=Math.min(t,.1),n=Number.isFinite(M)?M:0,l=Number.isFinite(b)?b:f,s=Math.sin(l)*n,u=Math.cos(l)*n,c=Math.min(3,performance.now()/1e3-a.at),d=a.x+s*c,h=a.y+u*c;Math.hypot(d-r.x,h-r.y)>60&&(r.x=d,r.y=h),r.x+=s*o+(d-r.x-s*o)*Math.min(1,3*o),r.y+=u*o+(h-r.y-u*o)*Math.min(1,3*o),$.current.position.set(-r.x*i,0,r.y*i);let m=e.clock.elapsedTime;G.forEach((e,t)=>{let a=Z.current[t];if(!a)return;let o=Math.hypot(e.m.x-r.x,e.m.y-r.y)*i;a.scale.setScalar(i*e$(o));let n=K.current[t];n&&(n.visible=X&&((e,t)=>{if(!e)return!0;let a=(t%e.period+e.period)%e.period;for(let[t,r]of e.steps){if(a<t)return!0;if((a-=t)<r)return!1;a-=r}return e.restOn})(e.sequence,m+e.phase))})});let Y=(0,a.useMemo)(()=>G.filter(e=>(e.m.name||e.m.ais)&&e.m.d*i<=900).slice(0,8).map(e=>({...e,text:[e.m.name,e.m.ais&&(e.m.virtual?"V-AIS":"AIS")].filter(Boolean).join(" · ")})),[G,i]);return r&&G.length?(0,t.jsx)("group",{rotation:[0,f,0],position:[0,e,0],children:(0,t.jsxs)("group",{ref:$,children:[G.map((e,a)=>(0,t.jsxs)("group",{position:[e.m.x*i,0,-e.m.y*i],ref:e=>{Z.current[a]=e},children:[(0,t.jsx)("mesh",{geometry:e.geometry,material:e.m.virtual?z:A}),e.hasLight&&(0,t.jsx)("sprite",{material:N[e.m.light.colour]||N.white,position:[0,e.lightY,0],scale:[3.4,3.4,1],ref:e=>{K.current[a]=e}})]},e.m.id)),Y.map(e=>{let a=e$(e.m.d*i);return(0,t.jsx)(eA.Billboard,{position:[e.m.x*i,(e.lightY+1)*i*a,-e.m.y*i],children:(0,t.jsx)(ez.Text,{fontSize:.9*a,color:h.compass,fillOpacity:.8,font:"fonts/Roboto-Bold.ttf",anchorX:"center",anchorY:"bottom",outlineWidth:.04*a,outlineColor:h.compassFace,children:e.text})},`label-${e.m.id}`)})]})}):null};var eY=e.i(31067);function eq(e,t){let r=e+"Geometry";return a.forwardRef(({args:e,children:o,...i},n)=>{let l=a.useRef(null);return a.useImperativeHandle(n,()=>l.current),a.useLayoutEffect(()=>void(null==t||t(l.current))),a.createElement("mesh",(0,eY.default)({ref:l},i),a.createElement(r,{attach:"geometry",args:e}),o)})}let eQ=eq("sphere"),eJ=eq("ring"),e0=a.default.memo(({radius:e,isOuter:r,markerColorPrimary:o,markerColorGreen:i,markerColorRed:l})=>{let s=(0,a.useMemo)(()=>{let a=[];for(let s=0;s<360;s+=10){let u=n.MathUtils.degToRad(s-90),c=s%30==0,d=r?c?.35:.15:c?.25:.1,h=(e+.5*d+.2)*Math.cos(u),m=(e+.5*d+.2)*Math.sin(u),f=r&&s>0&&s<61,p=r&&s>=300&&s<360,v=f?i:p?l:o;if(!r&&c){let e;e=0===s?"N":90===s?"E":180===s?"S":270===s?"W":s.toString(),a.push((0,t.jsx)(ez.Text,{characters:"NESW0123456789",position:[h,.02,m],color:o,fontSize:.6,rotation:[-Math.PI/2,0,Math.PI/2-u],font:"fonts/Roboto-Bold.ttf",anchorY:"middle",fillOpacity:.9,children:e},`text-${s}`))}else a.push((0,t.jsx)(eQ,{args:[d/2,16,16],position:[h,0,m],children:(0,t.jsx)("meshBasicMaterial",{color:v,transparent:!0,opacity:c?.8:.4})},`marker-${r?"outer":"inner"}-${s}`))}return a},[e,r,o,i,l]);return(0,t.jsx)(t.Fragment,{children:s})});e0.displayName="StaticMarkers";let e1=a.default.memo(({innerRadius:e,outerRadius:a,dialColor:r,opacity:o=1,transparent:i=!1})=>(0,t.jsx)(eJ,{args:[e,a,64],rotation:[Math.PI/2,0,0],children:(0,t.jsx)("meshBasicMaterial",{color:r,side:n.DoubleSide,transparent:i,opacity:o,depthWrite:!1})}));e1.displayName="StaticRing";let e2=({outerRadius:e,innerRadius:r})=>{let{scene:o}=(0,ey.default)(),i=o.compass,n=o.laylineStarboard,l=o.laylinePort,u=(0,a.useMemo)(()=>["navigation.headingTrue","navigation.headingMagnetic","navigation.courseOverGroundTrue","navigation.courseOverGroundMagnetic"],[]),d=(0,c.useSignalKPaths)(u),h=(0,a.useMemo)(()=>{let e=s.default.get("preferredHeadingPath")||"courseOverGroundTrue",t=d[`navigation.${e}`];if(null!=t)return t;let a=d["navigation.headingTrue"]||d["navigation.headingMagnetic"];return d["navigation.courseOverGroundTrue"]||d["navigation.courseOverGroundMagnetic"]||a||0},[d]),m=o.compassFace,f=s.default.get("compassNorthUp"),p=(0,a.useMemo)(()=>({innerRadius:r,outerRadius:e,dialColor:m,markerColorPrimary:i,markerColorGreen:n,markerColorRed:l}),[r,e,m,i,n,l]);return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)("group",{rotation:[0,h+(f?0:Math.PI),0],children:[(0,t.jsx)(e1,{innerRadius:p.innerRadius,outerRadius:p.outerRadius,dialColor:p.dialColor,transparent:!0,opacity:.1}),(0,t.jsx)(e0,{radius:p.innerRadius,isOuter:!1,markerColorPrimary:p.markerColorPrimary,markerColorGreen:p.markerColorGreen,markerColorRed:p.markerColorRed})]}),(0,t.jsxs)("group",{children:[(0,t.jsx)(e1,{innerRadius:p.innerRadius+.8,outerRadius:p.outerRadius+.8,dialColor:p.dialColor,transparent:!0,opacity:.15}),(0,t.jsx)(e0,{radius:p.innerRadius+.8,isOuter:!0,markerColorPrimary:p.markerColorPrimary,markerColorGreen:p.markerColorGreen,markerColorRed:p.markerColorRed})]})]})};e2.displayName="CompassDial";var e5=e.i(84226);let e3=({visible:e=!0,position:a,scale:r})=>!e||s.default.get("hide3DCompass")?null:(0,t.jsxs)("group",{position:a,scale:r,children:[(0,t.jsx)(e2,{outerRadius:5.6,innerRadius:5}),(0,t.jsx)(e5.default,{outerRadius:5.6+1.1})]});var e4=e.i(61969),e6=e.i(539),e8=e.i(37256),e7=e.i(3666);let e9=[...(0,e8.coursePaths)("bearingTrue","distance"),"navigation.speedOverGround"],te=e=>({x:Math.sin(e),y:Math.cos(e)}),tt=`
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,ta=`
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uFadeFrom;
    uniform float uFadeTo;
    varying vec2 vUv;
    void main() {
        float across = abs(vUv.x - 0.5) * 2.0;
        float body = 1.0 - smoothstep(0.7, 1.0, across);
        float rim = smoothstep(0.82, 0.92, across) * (1.0 - smoothstep(0.92, 1.0, across));
        float fade = mix(1.0, smoothstep(0.0, 0.35, vUv.y), uFadeFrom)
                   * mix(1.0, 1.0 - smoothstep(0.6, 1.0, vUv.y), uFadeTo);
        gl_FragColor = vec4(uColor, (body * uOpacity + rim * uOpacity * 1.4) * fade);
        #include <colorspace_fragment>
    }
`,tr=({from:e,to:r,width:o=2.4,color:i,opacity:l=.22,fadeFrom:s=!1,fadeTo:u=!1,y:c=0})=>{let d=r[0]-e[0],h=r[1]-e[1],m=Math.hypot(d,h),f=(0,a.useMemo)(()=>new n.ShaderMaterial({uniforms:{uColor:{value:new n.Color},uOpacity:{value:l},uFadeFrom:{value:0},uFadeTo:{value:0}},vertexShader:tt,fragmentShader:ta,transparent:!0,depthWrite:!1,side:n.DoubleSide}),[]);if((0,a.useEffect)(()=>{f.uniforms.uColor.value.set(i),f.uniforms.uOpacity.value=l,f.uniforms.uFadeFrom.value=+!!s,f.uniforms.uFadeTo.value=+!!u},[f,i,l,s,u]),(0,a.useEffect)(()=>()=>f.dispose(),[f]),m<.01)return null;let p=Math.atan2(d,-h);return(0,t.jsx)("group",{position:[(e[0]+r[0])/2,c,(e[1]+r[1])/2],rotation:[0,-p,0],children:(0,t.jsx)("mesh",{rotation:[-Math.PI/2,0,0],material:f,renderOrder:1,children:(0,t.jsx)("planeGeometry",{args:[o,m]})})})};var to=e.i(46991);let ti=(e,t)=>[e.x*t,-e.y*t],tn=e=>{if(!Number.isFinite(e))return null;let t=Math.round(e/60);return t>=60?`${Math.floor(t/60)}h${String(t%60).padStart(2,"0")}`:`${t} min`},tl=()=>{let e,r,o,{t:i}=(0,l.useTranslation)(),{scene:n}=(0,ey.default)(),{heading:h}=(0,d.default)(),m=(e=(0,c.useSignalKPaths)(e9),r=(0,e4.default)(),o=(()=>{let e=(0,c.useSignalKPath)("navigation.position"),t=e?.latitude,r=e?.longitude,o=Number.isFinite(t)?`${t.toFixed(1)},${r.toFixed(1)}`:null,[i,n]=(0,a.useState)(null),[l,s]=(0,a.useState)(null);(0,a.useEffect)(()=>{if(!o)return;let e=!1,[t,a]=o.split(",").map(Number);return(0,e7.fetchWindField)(t,a).then(t=>{e||n(t)}).catch(()=>{u.default.apiCall(`/signalk/v2/api/weather/observations?lat=${t}&lon=${a}`).then(t=>{let a=(Array.isArray(t)?t[0]:t)?.wind;!e&&a&&Number.isFinite(a.speedTrue)&&Number.isFinite(a.directionTrue)&&s({tws:a.speedTrue,twd:a.directionTrue})}).catch(()=>{})}),()=>{e=!0}},[o]);let d=Math.floor(Date.now()/6e5);return(0,a.useMemo)(()=>{if(!i||"open-meteo"!==i.source||!Number.isFinite(t))return l&&l.tws>0?l:null;let e=(r-i.origin.lon)*Math.PI/180*6371e3*Math.cos(i.origin.lat*Math.PI/180),a=(t-i.origin.lat)*Math.PI/180*6371e3,o=Math.max(0,(Date.now()-i.start)/36e5),{u:n,v:s}=(0,e7.sampleWind)(i,e,a,o),u=Math.hypot(n,s);return u>0?{tws:u,twd:(Math.atan2(-n,-s)+2*Math.PI)%(2*Math.PI)}:null},[i,l,t,r,d])})(),(0,a.useMemo)(()=>{let t=(0,e8.courseValue)(e,"bearingTrue"),a=(0,e8.courseValue)(e,"distance"),{heading:i}=r,n=Number.isFinite(r.tws)&&r.tws>0&&Number.isFinite(r.twd),l=!n&&null!==o,s=n?r.twd:o?.twd,u=n?r.tws:o?.tws,c=n?r.twa:Number.isFinite(i)&&Number.isFinite(s)?(0,e6.wrapPi)(s-i):void 0;if(![t,a,s,u].every(Number.isFinite)||u<=0)return null;let d={x:a*Math.sin(t),y:a*Math.cos(t)},h=Math.abs((0,e6.wrapPi)(s-t))<Math.PI/2,m=(h?(0,e6.optimalUpwind)(1.943844*u):(0,e6.optimalDownwind)(1.943844*u)).twa*Math.PI/180,f={heading:(0,e6.wrapPi)(s-m)},p={heading:(0,e6.wrapPi)(s+m)},v=null;if(Number.isFinite(i)&&Number.isFinite(c)){let t=c>=0?"starboard":"port",a=te(i),r=te(("starboard"===t?p:f).heading),o=-(a.x*r.y)- -(a.y*r.x);if(Math.abs(o)>1e-6){let i=(-(d.x*r.y)- -(d.y*r.x))/o,n=(a.x*d.y-a.y*d.x)/o;if(i>0&&n<0){let r=e["navigation.speedOverGround"];v={point:{x:a.x*i,y:a.y*i},distance:i,time:Number.isFinite(r)&&r>.2?i/r:null,onTack:t}}}}return{waypoint:d,upwind:h,port:p,starboard:f,tack:v,forecastWind:l}},[e,r,o])),f=s.default.get("aisLengthScalingFactor")||.7;if(!m)return null;let{waypoint:p,port:v,starboard:g,tack:x,upwind:y,forecastWind:M}=m,b=ti(p,f),w=Math.min(1.3*Math.hypot(b[0],b[1])+200,1500),S=e=>[b[0]-Math.sin(e)*w,b[1]+Math.cos(e)*w],C=x?ti(x.point,f):null,j=Math.min(25,Math.max(3,.015*Math.hypot(b[0],b[1]))),P=e=>[160*Math.sin(e),-(160*Math.cos(e))],k=x?`${i(y?"laylines.tack":"laylines.gybe")} ${(0,to.convertDistanceUnit)(x.distance)} ${(0,to.getDistanceUnitLabel)()}${tn(x.time)?` \xb7 ${tn(x.time)}`:""}${M?` \xb7 ${i("laylines.forecastWind")}`:""}`:null;return(0,t.jsxs)("group",{rotation:[0,h,0],children:[(0,t.jsx)(tr,{from:S(v.heading),to:b,color:n.laylinePort,y:-.15,width:j,opacity:.3,fadeFrom:!0}),(0,t.jsx)(tr,{from:S(g.heading),to:b,color:n.laylineStarboard,y:-.15,width:j,opacity:.3,fadeFrom:!0}),(0,t.jsx)(tr,{from:[0,0],to:P(v.heading),color:n.laylinePort,y:-.15,width:2.2,opacity:.35,fadeTo:!0}),(0,t.jsx)(tr,{from:[0,0],to:P(g.heading),color:n.laylineStarboard,y:-.15,width:2.2,opacity:.35,fadeTo:!0}),C&&(0,t.jsxs)("group",{children:[(0,t.jsx)(L.default,{points:[[0,-.15+.05,0],[C[0],-.15+.05,C[1]]],color:n.target,lineWidth:2,dashed:!0,dashSize:2.5,gapSize:2}),(0,t.jsxs)("mesh",{position:[C[0],-.09,C[1]],rotation:[-Math.PI/2,0,0],children:[(0,t.jsx)("ringGeometry",{args:[1.8,2.6,32]}),(0,t.jsx)("meshBasicMaterial",{color:n.target,transparent:!0,opacity:.9,depthWrite:!1})]}),(0,t.jsx)(eA.Billboard,{position:[C[0],5,C[1]],children:(0,t.jsx)(ez.Text,{fontSize:1.6,color:n.target,anchorX:"center",anchorY:"bottom",font:"fonts/Roboto-Bold.ttf",outlineWidth:.04,outlineColor:n.background,children:k})})]})]})},ts=Math.PI/180,tu=2*ts,tc=[5,10,15],td=["environment.wind.speedTrue","environment.wind.angleTrueWater","environment.current","navigation.headingTrue"],th=(e,t,a)=>{let r=Math.max(0,Math.min(1,(a-e)/(t-e)));return r*r*(3-2*r)},tm=({unitArc:e,outerSeconds:r,color:o})=>{let i=(0,a.useRef)([]),n=(0,a.useRef)([]);return(0,y.useFrame)(({clock:e})=>{let t=e.elapsedTime/3%1;for(let e=0;e<6;e++){let a=(e+1-t)/6,o=i.current[e],l=n.current[e];if(!o||!l)continue;let s=Math.max(1,a*r);o.scale.set(s,1,s),l.material.opacity=.35*th(.05,.25,a)*(1-th(.85,1,a))}}),Array.from({length:6},(a,r)=>(0,t.jsx)("group",{ref:e=>{i.current[r]=e},position:[0,.04,0],children:(0,t.jsx)(L.default,{ref:e=>{n.current[r]=e},points:e,color:o,lineWidth:1,transparent:!0,opacity:0})},r))};function tf({rings:e}){let r=(0,a.useRef)([]),i=(0,a.useRef)(0);return(0,y.useFrame)(()=>{if(i.current++%6)return;let e=[];r.current.forEach(t=>{if(!t)return;t.style.visibility="visible";let a=t.getBoundingClientRect();e.some(e=>a.left<e.right+4&&a.right>e.left-4&&a.top<e.bottom+2&&a.bottom>e.top-2)?t.style.visibility="hidden":e.push(a)})}),e.map((e,a)=>(0,t.jsx)(o.Html,{position:e.label,zIndexRange:[5,0],style:{pointerEvents:"none"},children:(0,t.jsxs)("div",{ref:e=>{r.current[a]=e},className:"ml-2 -translate-y-1/2 whitespace-nowrap px-1.5 py-px rounded-md text-caption font-semibold tabular-nums text-hud-main bg-hud-bg/70 backdrop-blur-sm",children:[e.min," min",null!=e.nm&&(0,t.jsxs)("span",{className:"text-hud-secondary",children:[" · ",e.nm.toFixed(2)," NM"]})]})},e.min))}let tp=function(){let{scene:e,accent:r}=(0,ey.default)(),o=(0,c.useSignalKPaths)(td),i=(o["environment.wind.speedTrue"]??0)*1.943844,n=o["environment.wind.angleTrueWater"],l=o["environment.current"],s=o["navigation.headingTrue"],u=(0,a.useMemo)(()=>{if(!(i>.5)||!Number.isFinite(n))return null;let e=((0,e6.optimalUpwind)(i)?.twa??42)*ts,t=0;for(let e=40;e<=180;e+=10)t=Math.max(t,(0,e6.polarSpeed)(i,e)??0);let a=60*tc[tc.length-1],r=45/Math.max(1,t/1.943844*a),o=0,u=0;if(l&&Number.isFinite(l.drift)&&Number.isFinite(l.setTrue)&&Number.isFinite(s)){let e=(0,e6.wrapPi)(l.setTrue-s);o=l.drift*Math.sin(e),u=-l.drift*Math.cos(e)}let c=(e,t)=>{let a=((0,e6.polarSpeed)(i,(0,e6.wrapPi)(n-e)/ts)??0)/1.943844*t;return[(Math.sin(e)*a+o*t)*r,.08,(-Math.cos(e)*a+u*t)*r]},d=[];for(let t=n+e;t<=n+2*Math.PI-e+1e-6;t+=tu)d.push(c(t,1).map((e,t)=>1===t?0:e));return d.push(c(n+2*Math.PI-e,1).map((e,t)=>1===t?0:e)),{fixed:tc.map((t,a)=>{let r=60*t,o=[];for(let t=n+e;t<=n+2*Math.PI-e+1e-6;t+=tu)o.push(c(t,r));o.push(c(n+2*Math.PI-e,r));let l=Math.abs((0,e6.wrapPi)(n))<e,s=l?null:c(0,r),u=l?null:((0,e6.polarSpeed)(i,(0,e6.wrapPi)(n)/ts)??0)/1.943844*r/1852,d=s??o[0];return{min:t,nm:u,arc:o,chord:[o[0],o[o.length-1]],here:s,label:[d[0],.6,d[2]],opacity:.8-.15*a}}),unitArc:d,outerSeconds:a}},[i,n,l,s]);return u?(0,t.jsxs)("group",{children:[(0,t.jsx)(tm,{unitArc:u.unitArc,outerSeconds:u.outerSeconds,color:e.compass}),u.fixed.map(a=>(0,t.jsxs)("group",{children:[(0,t.jsx)(L.default,{points:a.arc,color:e.compass,lineWidth:2,transparent:!0,opacity:a.opacity}),(0,t.jsx)(L.default,{points:a.chord,color:e.compassDim,lineWidth:1.5,dashed:!0,dashSize:1,gapSize:1,transparent:!0,opacity:.8*a.opacity}),a.here&&(0,t.jsxs)("mesh",{position:a.here,children:[(0,t.jsx)("sphereGeometry",{args:[.5,16,12]}),(0,t.jsx)("meshBasicMaterial",{color:r})]})]},a.min)),(0,t.jsx)(tf,{rings:u.fixed})]}):null};var tv=e.i(58567);let tg=Math.PI/180,tx=[[1,"Alpheratz",0,8,23.3,1,29,5,26,2.06],[2,"Ankaa",0,26,17,-1,42,18,22,2.4],[3,"Schedar",0,40,30.4,1,56,32,14,2.24],[4,"Diphda",0,43,35.4,-1,17,59,12,2.04],[5,"Achernar",1,37,42.8,-1,57,14,12,.46],[6,"Hamal",2,7,10.4,1,23,27,45,2],[7,"Acamar",2,58,15.7,-1,40,18,17,2.88],[8,"Menkar",3,2,16.8,1,4,5,23,2.54],[9,"Mirfak",3,24,19.4,1,49,51,40,1.79],[10,"Aldebaran",4,35,55.2,1,16,30,33,.86],[11,"Rigel",5,14,32.3,-1,8,12,6,.13],[12,"Capella",5,16,41.4,1,45,59,53,.08],[13,"Bellatrix",5,25,7.9,1,6,20,59,1.64],[14,"Elnath",5,26,17.5,1,28,36,27,1.65],[15,"Alnilam",5,36,12.8,-1,1,12,7,1.69],[16,"Betelgeuse",5,55,10.3,1,7,24,25,.5],[17,"Canopus",6,23,57.1,-1,52,41,45,-.74],[18,"Sirius",6,45,8.9,-1,16,42,58,-1.46],[19,"Adhara",6,58,37.5,-1,28,58,20,1.5],[20,"Procyon",7,39,18.1,1,5,13,30,.34],[21,"Pollux",7,45,18.9,1,28,1,34,1.14],[22,"Avior",8,22,30.8,-1,59,30,35,1.86],[23,"Suhail",9,7,59.8,-1,43,25,57,2.21],[24,"Miaplacidus",9,13,12,-1,69,43,2,1.67],[25,"Alphard",9,27,35.2,-1,8,39,31,1.98],[26,"Regulus",10,8,22.3,1,11,58,2,1.4],[27,"Dubhe",11,3,43.7,1,61,45,3,1.79],[28,"Denebola",11,49,3.6,1,14,34,19,2.14],[29,"Gienah",12,15,48.4,-1,17,32,31,2.59],[30,"Acrux",12,26,35.9,-1,63,5,57,.76],[31,"Gacrux",12,31,10,-1,57,6,48,1.64],[32,"Alioth",12,54,1.7,1,55,57,35,1.77],[33,"Spica",13,25,11.6,-1,11,9,41,.97],[34,"Alkaid",13,47,32.4,1,49,18,48,1.86],[35,"Hadar",14,3,49.4,-1,60,22,23,.61],[36,"Menkent",14,6,40.9,-1,36,22,12,2.06],[37,"Arcturus",14,15,39.7,1,19,10,57,-.05],[38,"Rigil Kentaurus",14,39,36.5,-1,60,50,2,-.27],[39,"Zubenelgenubi",14,50,52.7,-1,16,2,30,2.75],[40,"Kochab",14,50,42.3,1,74,9,20,2.08],[41,"Alphecca",15,34,41.3,1,26,42,53,2.23],[42,"Antares",16,29,24.5,-1,26,25,55,1.09],[43,"Atria",16,48,39.9,-1,69,1,40,1.91],[44,"Sabik",17,10,22.7,-1,15,43,29,2.43],[45,"Shaula",17,33,36.5,-1,37,6,14,1.62],[46,"Rasalhague",17,34,56.1,1,12,33,36,2.07],[47,"Eltanin",17,56,36.4,1,51,29,20,2.23],[48,"Kaus Australis",18,24,10.3,-1,34,23,5,1.85],[49,"Vega",18,36,56.3,1,38,47,1,.03],[50,"Nunki",18,55,15.9,-1,26,17,48,2.05],[51,"Altair",19,50,47,1,8,52,6,.77],[52,"Peacock",20,25,38.9,-1,56,44,6,1.94],[53,"Deneb",20,41,25.9,1,45,16,49,1.25],[54,"Enif",21,44,11.2,1,9,52,30,2.39],[55,"Al Na'ir",22,8,14,-1,46,57,40,1.73],[56,"Fomalhaut",22,57,39,-1,29,37,20,1.16],[57,"Markab",23,4,45.7,1,15,12,19,2.48],[0,"Polaris",2,31,49.1,1,89,15,51,1.98]].map(([e,t,a,r,o,i,n,l,s,u])=>{let c=(a+r/60+o/3600)*15*tg,d=i*(n+l/60+s/3600)*tg;return{number:e,name:t,magnitude:u,j2000:[Math.cos(d)*Math.cos(c),Math.cos(d)*Math.sin(c),Math.sin(d)]}}),ty=(e,t,a)=>{let r,o;if(!Number.isFinite(e)||!Number.isFinite(t)||!(a instanceof Date))return null;let i=e*tg;return{lst:(o=(r=a.getTime()/864e5+2440587.5-2451545)/36525,((280.46061837+360.98564736629*r+387933e-9*o*o)%360+360)%360*tg+t*tg),sinLat:Math.sin(i),cosLat:Math.cos(i)}},tM=(e,t,a,{lst:r,sinLat:o,cosLat:i})=>{let n=Math.hypot(e,t,a)||1,l=r-Math.atan2(t,e),s=Math.hypot(e,t)/n,u=a/n,c=-s*Math.sin(l),d=u*i-s*Math.cos(l)*o,h=u*o+s*Math.cos(l)*i;return{altitude:Math.asin(Math.max(-1,Math.min(1,h)))/tg,azimuth:(Math.atan2(c,d)/tg+360)%360,enu:[c,d,h]}},tb=Math.PI/180,tw=e=>Math.sin(e*tb),tS=e=>Math.cos(e*tb),tC={sun:e=>({N:0,i:0,w:282.9404+470935e-10*e,a:1,e:.016709-1151e-12*e,M:356.047+.9856002585*e}),moon:e=>({N:125.1228-.0529538083*e,i:5.1454,w:318.0634+.1643573223*e,a:60.2666,e:.0549,M:115.3654+13.0649929509*e}),venus:e=>({N:76.6799+24659e-9*e,i:3.3946+275e-10*e,w:54.891+138374e-10*e,a:.72333,e:.006773-1302e-12*e,M:48.0052+1.6021302244*e}),mars:e=>({N:49.5574+211081e-10*e,i:1.8497-178e-10*e,w:286.5016+292961e-10*e,a:1.523688,e:.093405+2516e-12*e,M:18.6021+.5240207766*e}),jupiter:e=>({N:100.4542+276854e-10*e,i:1.303-1557e-10*e,w:273.8777+164505e-10*e,a:5.20256,e:.048498+4469e-12*e,M:19.895+.0830853001*e}),saturn:e=>({N:113.6634+23898e-9*e,i:2.4886-1081e-10*e,w:339.3939+297661e-10*e,a:9.55475,e:.055546-9499e-12*e,M:316.967+.0334442282*e})},tj={venus:e=>-4.34+.013*e+42e-8*e*e*e,mars:e=>-1.51+.016*e,jupiter:e=>-9.25+.014*e,saturn:e=>-9+.044*e},tP=["venus","mars","jupiter","saturn"],tk=({N:e,i:t,w:a,a:r,e:o,M:i})=>{let n=(i%360+360)%360,l=n+o/tb*tw(n)*(1+o*tS(n));for(let e=0;e<8;e++){let e=(l-o/tb*tw(l)-n)/(1-o*tS(l));if(l-=e,1e-6>Math.abs(e))break}let s=r*(tS(l)-o),u=r*Math.sqrt(1-o*o)*tw(l),c=Math.atan2(u,s)/tb,d=Math.hypot(s,u),h=c+a;return[d*(tS(e)*tS(h)-tw(e)*tw(h)*tS(t)),d*(tw(e)*tS(h)+tS(e)*tw(h)*tS(t)),d*tw(h)*tw(t)]},tT=(e,t,a)=>[a*tS(e)*tS(t),a*tw(e)*tS(t),a*tw(t)],tD=([e,t,a])=>{let r=Math.hypot(e,t,a);return{lon:Math.atan2(t,e)/tb,lat:Math.asin(a/r)/tb,r}},tF=([e,t,a],r)=>[e,t*tS(r)-a*tw(r),t*tw(r)+a*tS(r)],tR=3600,tA=56,tz=tR*Math.tan(.7*Math.PI/180),tI=`
    attribute float aSize;
    attribute float aAlpha;
    varying float vAlpha;
    void main() {
        vAlpha = aAlpha;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize;
    }
`,tE=`
    uniform vec3 uColor;
    uniform float uOpacity;
    varying float vAlpha;
    void main() {
        // Round, soft-edged point
        float r = length(gl_PointCoord - 0.5) * 2.0;
        float a = smoothstep(1.0, 0.35, r) * vAlpha * uOpacity;
        if (a < 0.01) discard;
        gl_FragColor = vec4(uColor, a);
        #include <colorspace_fragment>
    }
`,tW=`
    varying vec3 vNormal;
    void main() {
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,tN=`
    uniform vec3 uColor;
    uniform vec3 uSun;
    uniform float uOpacity;
    varying vec3 vNormal;
    void main() {
        float lit = smoothstep(-0.04, 0.12, dot(normalize(vNormal), uSun));
        gl_FragColor = vec4(uColor * mix(0.1, 1.0, lit), uOpacity * mix(0.35, 1.0, lit));
        #include <colorspace_fragment>
    }
`,tG=e=>n.MathUtils.smoothstep(e,-.5,6),tB=([e,t,a],r=tR)=>[e*r,a*r,-t*r],tO=tx.length+tP.length,t_=()=>{let{t:e}=(0,l.useTranslation)(),{scene:r,id:o}=(0,ey.default)(),{heading:i}=(0,d.default)(),s=(0,c.useSignalKPaths)(["navigation.position"])["navigation.position"],u=Number.isFinite(s?.latitude)?Math.round(100*s.latitude)/100:null,h=Number.isFinite(s?.longitude)?Math.round(100*s.longitude)/100:null,[m,f]=(0,a.useState)(null);(0,a.useEffect)(()=>{let e=()=>{let e=(0,I.vesselNow)(),t=((e,t,a)=>{var r;let o,i,n,l,s,u,c,d,h,m,f=ty(e,t,a);if(!f)return null;let p=(r=(a.getTime()/864e5+2440587.5-2451545)/36525,i=(2306.2181*r+.30188*r*r+.017998*r*r*r)*(o=tg/3600),n=(2306.2181*r+1.09468*r*r+.018203*r*r*r)*o,l=(2004.3109*r-.42665*r*r-.041833*r*r*r)*o,s=Math.cos(i),u=Math.sin(i),c=Math.cos(n),d=Math.sin(n),[c*(h=Math.cos(l))*s-d*u,-c*h*u-d*s,-c*(m=Math.sin(l)),d*h*s+c*u,-d*h*u+c*s,-d*m,m*s,-m*u,h]);return tx.map(({number:e,name:t,magnitude:a,j2000:[r,o,i]})=>({number:e,name:t,magnitude:a,...tM(p[0]*r+p[1]*o+p[2]*i,p[3]*r+p[4]*o+p[5]*i,p[6]*r+p[7]*o+p[8]*i,f)}))})(u,h,e),a=((e,t,a)=>{let r=ty(e,t,a);if(!r)return null;let o=a.getTime()/864e5+2440587.5-2451543.5,i=23.4393-3563e-10*o,n=tk(tC.sun(o)),l=tF(n,i),s=tP.map(e=>{let t=((e,t)=>{let a=tk(tC[e](t));if("jupiter"!==e&&"saturn"!==e)return a;let r=tC.jupiter(t).M,o=tC.saturn(t).M,{lon:i,lat:n,r:l}=tD(a);return"jupiter"===e?i+=-.332*tw(2*r-5*o-67.6)-.056*tw(2*r-2*o+21)+.042*tw(3*r-5*o+21)-.036*tw(r-2*o)+.022*tS(r-o)+.023*tw(2*r-3*o+52)-.016*tw(r-5*o-69):(i+=.812*tw(2*r-5*o-67.6)-.229*tS(2*r-4*o-2)+.119*tw(r-2*o-3)+.046*tw(2*r-6*o-69)+.014*tw(r-3*o+32),n+=-.02*tS(2*r-4*o-2)+.018*tw(2*r-6*o-49)),tT(i,n,l)})(e,o),a=[t[0]+n[0],t[1]+n[1],t[2]+n[2]],l=Math.hypot(...t),s=Math.hypot(...a),u=Math.hypot(...n),c=Math.acos(Math.max(-1,Math.min(1,(l*l+s*s-u*u)/(2*l*s))))/tb,d=tj[e](c)+5*Math.log10(l*s);if("saturn"===e){let{lon:e,lat:t}=tD(a),r=tw(28.06)*tS(t)*tw(e-169.51-382e-7*o)-tS(28.06)*tw(t);d+=-2.6*Math.abs(r)+1.2*r*r}return{name:e,magnitude:d,...tM(...tF(a,i),r)}}),[u,c,d]=tF((e=>{let t=tC.moon(e),a=tC.sun(e),{lon:r,lat:o,r:i}=tD(tk(t)),n=a.M,l=t.M,s=l+t.w+t.N-(n+a.w),u=l+t.w;return r+=-1.274*tw(l-2*s)+.658*tw(2*s)-.186*tw(n)-.059*tw(2*l-2*s)-.057*tw(l-2*s+n)+.053*tw(l+2*s)+.046*tw(2*s-n)+.041*tw(l-n)-.035*tw(s)-.031*tw(l+n)-.015*tw(2*u-2*s)+.011*tw(l-4*s),tT(r,o+=-.173*tw(u-2*s)-.055*tw(l-u-2*s)-.046*tw(l+u-2*s)+.033*tw(u+2*s)+.017*tw(2*l+u),i+=-.58*tS(l-2*s)-.46*tS(2*s))})(o),i),h=[u-r.cosLat*Math.cos(r.lst),c-r.cosLat*Math.sin(r.lst),d-r.sinLat],m=Math.acos(Math.max(-1,Math.min(1,(h[0]*l[0]+h[1]*l[1]+h[2]*l[2])/(Math.hypot(...h)*Math.hypot(...l)))));return{sun:tM(...l,r),moon:{illuminated:(1-Math.cos(m))/2,...tM(...h,r)},planets:s}})(u,h,e);f(t&&a?{stars:t,...a}:null)};e();let t=setInterval(e,6e4);return()=>clearInterval(t)},[u,h]);let p=m?m.sun.altitude:90,v="day"===o?0:1-n.MathUtils.smoothstep(p,-8,-1),g=m?tG(m.moon.altitude)*(1-.45*n.MathUtils.smoothstep(p,-6,2)):0,x=(0,a.useMemo)(()=>{let e=new n.BufferGeometry;return e.setAttribute("position",new n.BufferAttribute(new Float32Array(3*tO),3)),e.setAttribute("aSize",new n.BufferAttribute(new Float32Array(tO),1)),e.setAttribute("aAlpha",new n.BufferAttribute(new Float32Array(tO),1)),e},[]),y=(0,a.useMemo)(()=>new n.ShaderMaterial({uniforms:{uColor:{value:new n.Color},uOpacity:{value:1}},vertexShader:tI,fragmentShader:tE,transparent:!0,depthWrite:!1,fog:!1}),[]),M=(0,a.useMemo)(()=>new n.ShaderMaterial({uniforms:{uColor:{value:new n.Color},uSun:{value:new n.Vector3(0,1,0)},uOpacity:{value:1}},vertexShader:tW,fragmentShader:tN,transparent:!0,depthWrite:!1,fog:!1}),[]);(0,a.useEffect)(()=>{if(!m)return;let e=x.attributes.position,t=x.attributes.aSize,a=x.attributes.aAlpha;[...m.stars,...m.planets].forEach(({enu:r,magnitude:o,altitude:i},l)=>{e.setXYZ(l,...tB(r)),t.setX(l,n.MathUtils.clamp(7.5-1.5*o,3.5,11)*Math.min(window.devicePixelRatio||1,2)),a.setX(l,n.MathUtils.clamp(1.15-.2*o,.5,1)*tG(i))}),e.needsUpdate=!0,t.needsUpdate=!0,a.needsUpdate=!0,x.computeBoundingSphere(),M.uniforms.uSun.value.set(...tB(m.sun.enu,1)).normalize()},[x,M,m]),(0,a.useEffect)(()=>{y.uniforms.uColor.value.set(r.light),y.uniforms.uOpacity.value=v,M.uniforms.uColor.value.set(r.light),M.uniforms.uOpacity.value=g},[y,M,r.light,v,g]),(0,a.useEffect)(()=>()=>{x.dispose(),y.dispose(),M.dispose()},[x,y,M]);let b=(0,a.useMemo)(()=>m?[...m.stars.filter(e=>e.magnitude<=1&&e.altitude>=4).map(e=>({key:e.name,text:e.name,enu:e.enu,gap:.9})),...m.planets.filter(e=>e.altitude>=4).map(t=>({key:t.name,text:e(`sky.${t.name}`),enu:t.enu,gap:1.1}))]:[],[m,e]);if(!m)return null;let w=({key:e,text:a,enu:o,gap:i},n,l=tA)=>{let[s,u,c]=tB(o);return(0,t.jsx)(eA.Billboard,{position:[s,u-l*i,c],children:(0,t.jsx)(ez.Text,{fontSize:l,color:r.light,fillOpacity:.55*n,font:"fonts/Roboto-Bold.ttf",anchorX:"center",anchorY:"top",renderOrder:-2,"material-depthWrite":!1,"material-fog":!1,children:a})},e)};return(0,t.jsxs)("group",{rotation:[0,i,0],children:[v>.01&&(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("points",{geometry:x,material:y,renderOrder:-2,frustumCulled:!1}),b.map(e=>w(e,v))]}),g>.01&&(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("mesh",{position:tB(m.moon.enu),material:M,renderOrder:-2,frustumCulled:!1,children:(0,t.jsx)("sphereGeometry",{args:[tz,32,16]})}),m.moon.altitude>=4&&w({key:"moon",text:e("sky.moon"),enu:m.moon.enu,gap:(tz+12)/tA},g)]})]})};var tL=e.i(29288);let tU=[4,1.35],tV=["environment.wind.speedTrue","environment.wind.directionTrue","navigation.speedThroughWater","navigation.speedOverGround","navigation.heave.range","navigation.heave.apparentFreqAvg","navigation.heave.apparentFreq"],tH=`
    uniform float uTime;
    uniform float uAmp;
    uniform float uDir;
    uniform float uWaveLength;
    uniform float uChop;
    uniform vec2 uOffset;
    uniform float uHeave;
`,t$=`
    ${tH}
    varying vec3 vPos;
    varying vec3 vNormalW;
    varying vec2 vSea;
    varying float vHeight;
    varying float vJacobian;
    varying float vDist;

    #define NW 6
    const float WL[NW] = float[NW](1.0, 0.74, 0.58, 0.45, 0.36, 0.29);
    const float WA[NW] = float[NW](0.46, 0.30, 0.22, 0.15, 0.11, 0.08);
    const float WD[NW] = float[NW](0.0, 0.43, -0.37, 0.86, -0.74, 0.18);
    const float WP[NW] = float[NW](0.0, 1.7, 4.1, 2.3, 5.2, 0.9);

    // Grid spacing around this vertex (the grid is warped x' = R\xb7(0.05\xb7u + 0.95\xb7u\xb3)):
    // a wave shorter than ~4 vertices cannot be drawn, it only shimmers
    float gSpacing;

    void wave(vec2 p, float angle, float L, float a, float steep, float phase,
              inout vec3 disp, inout vec3 dDx, inout vec3 dDy) {
        a *= 1.0 - smoothstep(0.3, 0.6, gSpacing / L);
        vec2 d = vec2(sin(angle), cos(angle));
        float k = 6.2831853 / L;
        float c = sqrt(9.81 * 0.70 / k);
        float f = k * (dot(d, p) - c * uTime) + phase;
        float q = clamp(steep / (k * a * float(NW) + 1e-4), 0.0, 1.0);
        float s = sin(f);
        float co = cos(f);
        disp += vec3(d.x * q * a * co, d.y * q * a * co, a * s);
        // Partial derivatives of the displaced surface (x, y, z) along x and y
        dDx += vec3(-q * d.x * d.x * k * a * s, -q * d.x * d.y * k * a * s, d.x * k * a * co);
        dDy += vec3(-q * d.x * d.y * k * a * s, -q * d.y * d.y * k * a * s, d.y * k * a * co);
    }

    void main() {
        vec2 local = position.xy;
        vec2 sea = local + uOffset;
        float dist = length(local);
        // Calmer far away (clean horizon) and under the hull, which does not heave
        float fade = (1.0 - smoothstep(900.0, 2200.0, dist)) * mix(0.4, 1.0, smoothstep(3.0, 16.0, dist));
        vec2 gu = pow(abs(local) / 2280.0, vec2(1.0 / 3.0));
        float gmax = max(gu.x, gu.y);
        gSpacing = 15.0000 * (0.05 + 2.85 * gmax * gmax);
        vec3 disp = vec3(0.0);
        vec3 dDx = vec3(0.0);
        vec3 dDy = vec3(0.0);
        for (int i = 0; i < NW; i++) {
            wave(sea, uDir + WD[i], uWaveLength * WL[i], uAmp * WA[i], uChop, WP[i], disp, dDx, dDy);
        }
        // Long swell, from a little off the wind
        wave(sea, uDir + 0.55, 70.0 * 0.70, 0.16 * 0.70, 0.2, 0.0, disp, dDx, dDy);
        disp *= fade;
        dDx *= fade;
        dDy *= fade;
        vec3 tx = vec3(1.0, 0.0, 0.0) + dDx;
        vec3 ty = vec3(0.0, 1.0, 0.0) + dDy;
        vNormalW = normalize(cross(tx, ty));
        // Horizontal compression: below ~0.6 the crest is about to break
        vJacobian = (1.0 + dDx.x) * (1.0 + dDy.y) - dDx.y * dDy.x;
        vHeight = disp.z / max(uAmp, 1e-3);
        vSea = sea + disp.xy;
        vDist = dist;
        // The water around the hull rises and falls with the boat (heave)
        vPos = vec3(local + disp.xy, disp.z + uHeave * (1.0 - smoothstep(6.0, 40.0, dist)));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(vPos, 1.0);
    }
`,tZ=`
    uniform vec3 uZenith;
    uniform vec3 uHorizon;
    uniform vec3 uSunDir;
    uniform float uSunI;
    // Sky radiance in a direction (z up): horizon haze to zenith, a soft sun
    vec3 skyColor(vec3 d) {
        float up = clamp(d.z, 0.0, 1.0);
        vec3 c = mix(uHorizon, uZenith, pow(up, 0.45));
        float s = max(dot(d, uSunDir), 0.0);
        c += uSunI * (pow(s, 6.0) * 0.18 + pow(s, 120.0) * 0.6) * vec3(1.0, 0.94, 0.82);
        return c;
    }
`,tK=`
    // Sin-free hash (Dave Hoskins): sin() of large arguments loses float
    // precision on the GPU and the noise falls apart into blocks far from
    // the session origin. Lattice wrapped to keep the inputs small.
    float hash(vec2 p) {
        vec3 p3 = fract(vec3(mod(p, 1024.0).xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
    }
    float vnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < FBM_OCTAVES; i++) { v += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.3); a *= 0.5; }
        return v;
    }
`,tX=`
    ${tH}
    ${tZ}
    ${tK}
    uniform vec3 uCam;
    uniform vec3 uDeep;
    uniform vec3 uScatter;
    uniform vec3 uFoamColor;
    uniform float uWind;
    uniform float uFog;
    uniform vec4 uTrail[32];
    uniform float uTrailReach;
    uniform vec2 uBow;
    uniform float uSpeed;
    uniform vec2 uHull;
    uniform float uOcclude;
    varying vec3 vPos;
    varying vec3 vNormalW;
    varying vec2 vSea;
    varying float vHeight;
    varying float vJacobian;
    varying float vDist;

    // Foam left by the hull: a turbulent band along our real track that
    // widens and fades with age, the two Kelvin arms (19.5\xb0) and the bow wave
    float wakeFoam(vec2 p) {
        if (length(p) > uTrailReach) return 0.0;
        float best = 1e6;
        float age = 0.0;
        for (int i = 0; i < TRAIL_SEGMENTS; i++) {
            vec4 a = uTrail[i];
            vec4 b = uTrail[i + 1];
            if (b.z < 0.0) break;
            vec2 ab = b.xy - a.xy;
            float t = clamp(dot(p - a.xy, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
            float d = length(p - a.xy - ab * t);
            if (d < best) { best = d; age = mix(a.z, b.z, t); }
        }
        float moving = smoothstep(0.3, 1.6, uSpeed);
        float width = uHull.y * 0.55 + age * 0.12;
        float grain = fbm(vSea * 1.3 + vec2(0.0, uTime * 0.2));
        float band = (1.0 - smoothstep(width * 0.35, width, best)) * exp(-age / 22.0);
        band *= 0.45 + 0.75 * grain;

        // Boat frame: x ahead, y to port
        vec2 side = vec2(-uBow.y, uBow.x);
        float ahead = dot(p, uBow);
        float lat = dot(p, side);
        float behind = -ahead - uHull.x * 0.6;
        float arms = 0.0;
        if (behind > 0.0) {
            float off = abs(abs(lat) - uHull.y * 0.7 - behind * 0.354);
            float w = 0.2 + behind * 0.02;
            arms = (1.0 - smoothstep(0.0, w, off)) * exp(-behind / (10.0 + uSpeed * 5.0));
            // Broken, lacy foam rather than a painted line
            arms *= smoothstep(0.42, 0.75, fbm(vSea * 2.4 - vec2(uTime * 0.3))) * 0.7;
        }
        // Bow wave and the water pushed along the topsides
        float e = length(vec2(ahead / uHull.x, lat / uHull.y));
        float hug = smoothstep(1.45, 1.0, e) * smoothstep(0.92, 1.05, e) * (0.35 + 0.65 * smoothstep(-0.6, 0.9, ahead / uHull.x));
        hug *= 0.5 + 0.7 * fbm(vSea * 3.0 + vec2(uTime * 0.5));
        return clamp((band + arms + hug * 0.9) * moving, 0.0, 1.0);
    }

    void main() {
        // Seen through the water: only the hull's underwater part gets this pass
        vec2 bowP = vec2(dot(vPos.xy, uBow), dot(vPos.xy, vec2(-uBow.y, uBow.x)));
        float inHull = length(bowP / uHull);
        if (uOcclude > 0.5 && inHull > 1.02) discard;

        // Short wind waves and ripples, in the normal only, faded with distance
        // and wherever a pixel spans too much sea to show them (they would
        // sparkle from one frame to the next near the horizon)
        float footprint = length(fwidth(vSea));
        float detail = (1.0 - smoothstep(30.0, 260.0, vDist)) * (0.5 + 0.5 * uWind);
        vec2 grad = vec2(0.0);
        for (int i = 0; i < RIPPLES; i++) {
            float fi = float(i);
            float ang = uDir + (hash(vec2(fi, 3.7)) - 0.5) * 2.2;
            vec2 d = vec2(sin(ang), cos(ang));
            float L = uWaveLength * (0.22 - fi * 0.028);
            float k = 6.2831853 / L;
            float f = k * (dot(d, vSea) - sqrt(9.81 * 0.70 / k) * uTime) + fi * 1.9;
            grad += d * cos(f) * 0.07 * (1.0 - smoothstep(0.15, 0.4, footprint / L));
        }
        // Capillary texture: soft noise drifting downwind (wide finite
        // differences, so no value-noise cells show in the sun glitter),
        // faded out before it would alias into stripes
        vec2 drift = vec2(sin(uDir), cos(uDir)) * uTime * 0.6;
        mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
        vec2 q = rot * (vSea * 0.7) - drift;
        float e1 = fbm(q);
        float e2 = fbm(q + vec2(0.35, 0.0));
        float e3 = fbm(q + vec2(0.0, 0.35));
        grad += vec2(e2 - e1, e3 - e1) * 0.45 * (0.3 + 0.7 * uWind) * (1.0 - smoothstep(15.0, 90.0, vDist)) * (1.0 - smoothstep(0.12, 0.5, footprint));
        vec3 n = normalize(vNormalW - vec3(grad * detail, 0.0));

        vec3 v = normalize(uCam - vPos);
        float ndv = max(dot(n, v), 0.0);
        float fresnel = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
        vec3 r = reflect(-v, n);
        r.z = abs(r.z);
        vec3 refl = skyColor(r);

        // Water body: deep colour, light scattered through the crests (more
        // when looking towards the sun), slopes facing the sky a little lighter
        float h = clamp(vHeight * 0.5 + 0.5, 0.0, 1.0);
        vec2 look = normalize(-v.xy + 1e-5);
        vec2 sunH = normalize(uSunDir.xy + 1e-5);
        float towardSun = pow(clamp(dot(look, sunH) * 0.5 + 0.5, 0.0, 1.0), 3.0);
        float sss = h * h * (0.45 + 0.75 * towardSun) * (0.35 + 0.65 * uSunI);
        vec3 body = mix(uDeep, uScatter, clamp(sss, 0.0, 1.0));
        float diffuse = max(dot(n, uSunDir), 0.0);
        body *= 0.78 + 0.22 * n.z + 0.18 * diffuse * uSunI;
        vec3 color = mix(body, refl, fresnel);

        // Sun glitter: a sharp core and a broad sheen
        vec3 hv = normalize(uSunDir + v);
        float nh = max(dot(n, hv), 0.0);
        float spec = pow(nh, 500.0) * 2.2 + pow(nh, 70.0) * 0.18;
        color += uSunI * step(0.0, uSunDir.z) * spec * vec3(1.0, 0.95, 0.86);

        // White water: breaking crests from the wind, foam patches, our wake
        float grain = fbm(vSea * 0.55 + vec2(uTime * 0.05, 0.0));
        float streak = fbm(vec2(dot(vSea, vec2(cos(uDir), -sin(uDir))) * 0.35, dot(vSea, vec2(sin(uDir), cos(uDir))) * 0.06));
        float crest = smoothstep(0.82, 0.38, vJacobian) * smoothstep(-0.1, 0.6, vHeight);
        float caps = crest * smoothstep(0.35, 0.8, grain + crest * 0.45) * uWind;
        caps += smoothstep(0.66, 0.9, streak) * 0.18 * uWind * uWind * (1.0 - smoothstep(60.0, 250.0, vDist));
        float foam = clamp(caps * (1.0 - smoothstep(300.0, 900.0, vDist)) + wakeFoam(vPos.xy), 0.0, 1.0);
        vec3 foamLit = uFoamColor * (0.82 + 0.18 * diffuse * uSunI);
        color = mix(color, foamLit, foam);

        // Aerial perspective: the sea dissolves into the horizon haze
        float fog = 1.0 - exp(-pow(vDist * uFog, 1.4));
        vec3 haze = skyColor(normalize(vec3(normalize(vPos.xy - uCam.xy + 1e-4), 0.02)));
        color = mix(color, haze, clamp(fog, 0.0, 1.0));

        gl_FragColor = vec4(color, uOcclude > 0.5 ? 0.72 : 1.0);
        #include <colorspace_fragment>
    }
`,tY=`
    varying vec3 vDir;
    void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,tq=`
    ${tZ}
    uniform vec3 uDeep;
    varying vec3 vDir;
    void main() {
        // World is y up; the shared sky function is z up
        vec3 d = normalize(vec3(vDir.x, -vDir.z, vDir.y));
        vec3 color = skyColor(d);
        // Below the horizon (seen only past the sea's edge): the sea's own tone
        color = mix(color, mix(uHorizon, uDeep, 0.35), smoothstep(0.0, -0.06, d.z));
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
    }
`,tQ=new n.Vector3,tJ=()=>{let e=(0,c.useSignalKPaths)(["navigation.position"])["navigation.position"],[t,r]=(0,a.useState)(()=>({dir:new n.Vector3(.3,.6,.5).normalize(),intensity:1}));return(0,a.useEffect)(()=>{let t=()=>{let t=(0,E.sunPosition)(e?.latitude,e?.longitude,(0,I.vesselNow)()),a=t?t.elevation:35,o=(t?t.azimuth:200)*Math.PI/180,i=Math.max(a,4)*Math.PI/180;r({dir:new n.Vector3(Math.sin(o)*Math.cos(i),Math.cos(o)*Math.cos(i),Math.sin(i)).normalize(),intensity:n.MathUtils.smoothstep(a,-6,6)})};t();let a=setInterval(t,6e4);return()=>clearInterval(a)},[e?.latitude,e?.longitude]),t},t0=()=>{let{scene:e,id:r}=(0,ey.default)(),{heading:o}=(0,d.default)(),i=tJ(),l=(0,a.useMemo)(()=>({uZenith:{value:new n.Color},uHorizon:{value:new n.Color},uDeep:{value:new n.Color},uSunDir:{value:new n.Vector3},uSunI:{value:1}}),[]),s=(0,a.useMemo)(()=>new n.ShaderMaterial({uniforms:l,vertexShader:tY,fragmentShader:tq,side:n.BackSide,depthWrite:!1,fog:!1}),[l]);return(0,a.useEffect)(()=>{l.uZenith.value.set(e.skyZenith),l.uHorizon.value.set(e.skyHorizon),l.uDeep.value.set(e.sea)},[l,e]),(0,y.useFrame)(()=>{let{x:e,y:t,z:a}=i.dir,n=Math.cos(o),s=Math.sin(o);l.uSunDir.value.set(e*n-t*s,-(-e*s-t*n),a).normalize(),l.uSunI.value=i.intensity*("day"===r?1:.06)}),(0,a.useEffect)(()=>()=>s.dispose(),[s]),(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("mesh",{material:s,renderOrder:-3,frustumCulled:!1,children:(0,t.jsx)("sphereGeometry",{args:[3800,48,24]})}),(0,t.jsx)(t_,{})]})},t1=({y:e=-.3})=>{let{scene:r,id:o}=(0,ey.default)(),{heading:i,offset:l}=(0,d.default)(),s=(0,c.useSignalKPaths)(tV),u=s["environment.wind.speedTrue"],h=s["environment.wind.directionTrue"],m=s["navigation.speedThroughWater"]??s["navigation.speedOverGround"],f=s["navigation.heave.range"],p=s["navigation.heave.apparentFreqAvg"]??s["navigation.heave.apparentFreq"],v=(0,tL.default)(),g=tJ(),x=(0,a.useRef)(),M=(0,a.useRef)([]),b=(0,a.useMemo)(()=>({uTime:{value:0},uAmp:{value:.3},uDir:{value:0},uWaveLength:{value:15},uChop:{value:.6},uOffset:{value:new n.Vector2},uHeave:{value:0},uCam:{value:new n.Vector3},uSunDir:{value:new n.Vector3(.3,.6,.5).normalize()},uSunI:{value:1},uZenith:{value:new n.Color},uHorizon:{value:new n.Color},uDeep:{value:new n.Color},uScatter:{value:new n.Color},uFoamColor:{value:new n.Color},uWind:{value:.3},uFog:{value:1/2600},uTrail:{value:Array.from({length:32},()=>new n.Vector4(0,0,-1,0))},uTrailReach:{value:0},uBow:{value:new n.Vector2(0,1)},uSpeed:{value:0},uHull:{value:new n.Vector2(...tU)},uOcclude:{value:0}}),[]),w=(0,a.useMemo)(()=>{let e;return{FBM_OCTAVES:(e="pi"===(0,tv.getRenderProfile)().id)?2:4,RIPPLES:e?3:6,TRAIL_SEGMENTS:e?12:31}},[]),S=(0,a.useMemo)(()=>new n.ShaderMaterial({uniforms:b,defines:w,vertexShader:t$,fragmentShader:tX,depthWrite:!1}),[b,w]),C=(0,a.useMemo)(()=>new n.ShaderMaterial({uniforms:{...b,uOcclude:{value:1}},defines:w,vertexShader:t$,fragmentShader:tX,transparent:!0,depthWrite:!1}),[b,w]),j="day"===o?1:.06;(0,a.useEffect)(()=>{b.uDeep.value.set(r.sea),b.uScatter.value.set(r.seaScatter),b.uFoamColor.value.set(r.seaFoam),b.uZenith.value.set(r.skyZenith),b.uHorizon.value.set(r.skyHorizon)},[b,r]),(0,a.useEffect)(()=>{let e=Number.isFinite(u)?u:4,t=Number.isFinite(f)&&f>0,a=Number.isFinite(p)&&p>.03&&p<2,r=t?Math.min(f,6):Math.min(.21*e*e/9.81,2.5),o=a?9.81/(2*Math.PI*p*p):.5*e*e;b.uAmp.value=.7*Math.max(.15,r),b.uChop.value=.4+.5*n.MathUtils.smoothstep(e,3,13),b.uWaveLength.value=.7*Math.min(a?150:55,Math.max(6,o)),b.uWind.value=n.MathUtils.smoothstep(e,3.5,13),b.uDir.value=Number.isFinite(h)?h+Math.PI:Math.PI},[b,u,h,f,p]);let P=(0,a.useRef)({x:0,y:0,at:0,init:!1}),k=(0,a.useRef)({x:0,y:0});(0,a.useEffect)(()=>{P.current={x:.7*l.x,y:.7*l.y,at:performance.now()/1e3,init:!0}},[l]),(0,y.useFrame)((e,t)=>{let a=x.current;if(!a)return;let r=Math.min(t,.1);b.uTime.value+=r;let o=Number.isFinite(m)?m:0,n=Math.sin(i)*o*.7,l=Math.cos(i)*o*.7,s=P.current,u=k.current;if(s.init){let e=Math.min(3,performance.now()/1e3-s.at),t=s.x+n*e,a=s.y+l*e;Math.hypot(t-u.x,a-u.y)>40&&(u.x=t,u.y=a),u.x+=n*r+(t-u.x-n*r)*Math.min(1,3*r),u.y+=l*r+(a-u.y-l*r)*Math.min(1,3*r)}b.uOffset.value.set(u.x,u.y),b.uHeave.value=.7*v.current,a.updateWorldMatrix(!0,!1),b.uCam.value.copy(a.worldToLocal(tQ.copy(e.camera.position))),b.uSunDir.value.copy(g.dir),b.uSunI.value=g.intensity*j;let c=e.clock.elapsedTime,d=M.current,h=d[0];h&&Math.hypot(u.x-h.x,u.y-h.y)>60&&(d.length=0),(!d[0]||Math.hypot(u.x-d[0].x,u.y-d[0].y)>1.5)&&(d.unshift({x:u.x,y:u.y,t:c}),d.length>36&&(d.length=36)),b.uSpeed.value=o,b.uBow.value.set(Math.sin(i),Math.cos(i));let f=.85*tU[0],p=b.uTrail.value;p[0].set(-Math.sin(i)*f,-Math.cos(i)*f,0,0);let y=1,w=f;for(let e of d){if(y>=32)break;let t=e.x-u.x,a=e.y-u.y;Math.hypot(t,a)<=f+.5||(p[y++].set(t,a,c-e.t,0),w=Math.max(w,Math.hypot(t,a)))}for(;y<32;y++)p[y].set(0,0,-1,0);b.uTrailReach.value=w+60}),(0,a.useEffect)(()=>()=>{S.dispose(),C.dispose()},[S,C]);let T=(0,a.useMemo)(()=>{let e=new n.PlaneGeometry(2,2,320,320),t=e.attributes.position,a=e=>2400*(.05*e+.95*e*e*e);for(let e=0;e<t.count;e++)t.setXY(e,a(t.getX(e)),a(t.getY(e)));return e},[]),D=(0,a.useMemo)(()=>new n.PlaneGeometry(2.4*tU[0],2.4*tU[0],48,48),[]);return(0,a.useEffect)(()=>()=>{T.dispose(),D.dispose()},[T,D]),(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(t0,{}),(0,t.jsxs)("group",{rotation:[0,i,0],position:[0,e,0],children:[(0,t.jsx)("mesh",{ref:x,rotation:[-Math.PI/2,0,0],geometry:T,material:S,renderOrder:-1,frustumCulled:!1}),(0,t.jsx)("mesh",{rotation:[-Math.PI/2,0,0],geometry:D,material:C,renderOrder:10,frustumCulled:!1})]})]})};var t2=e.i(15126),t5=e.i(78311),t3=e.i(18032),t4=e.i(54735);let t6=({y:e=0})=>{let{field:r,hour:o,top:i,lat:l,lon:u}=(0,t4.useCurrentField)(),{heading:c}=(0,d.default)(),h=s.default.get("aisLengthScalingFactor")||.7,m=s.default.get("currentColorMap")||t4.DEFAULT_CURRENT_MAP,f=(0,a.useRef)(),p=(0,a.useMemo)(()=>new n.Vector3,[]),[v,g]=(0,a.useState)([]),x=(0,a.useRef)(1);return((0,y.useFrame)(({camera:e},t)=>{x.current+=t;let a=f.current;if(x.current<1||!r||!a||!Number.isFinite(l))return;x.current=0;let n=(u-r.origin.lon)*Math.PI/180*6371e3*Math.cos(r.origin.lat*Math.PI/180),s=(l-r.origin.lat)*Math.PI/180*6371e3;a.updateWorldMatrix(!0,!1);let c=a.worldToLocal(p.copy(e.position)),d=(0,t4.currentMarkers)({field:r,hour:o,top:i,mapName:m,refE:n,refN:s,scale:h,radius:1500,z:.3,cx:n+c.x/h,cy:s+c.y/h,heightM:Math.max(5,c.z/h)});g(e=>(0,t3.sameMarkers)(e,d)?e:d)}),r)?(0,t.jsx)("group",{rotation:[0,c,0],position:[0,e,0],children:(0,t.jsx)("group",{ref:f,rotation:[-Math.PI/2,0,0],children:(0,t.jsx)(t5.default,{items:v,width:t4.CURRENT_ARROW_WIDTH,screen:1})})}):null};var t8=e.i(71415),t7=e.i(71029);let t9=["navigation.position","environment.current","environment.wind.speedTrue","environment.wind.directionTrue"],ae=({color:e})=>{let r=(0,a.useRef)();return(0,y.useFrame)(({clock:e})=>{r.current&&(r.current.position.y=.15*Math.sin(1.6*e.elapsedTime),r.current.rotation.z=.12*Math.sin(1.1*e.elapsedTime))}),(0,t.jsxs)("group",{ref:r,scale:1.6,children:[(0,t.jsxs)("mesh",{position:[0,.15,0],children:[(0,t.jsx)("capsuleGeometry",{args:[.32,.35,6,12]}),(0,t.jsx)("meshStandardMaterial",{color:e,roughness:.6})]}),(0,t.jsxs)("mesh",{position:[0,.85,0],children:[(0,t.jsx)("sphereGeometry",{args:[.22,16,12]}),(0,t.jsx)("meshStandardMaterial",{color:"#e9c8a8",roughness:.7})]}),(0,t.jsxs)("mesh",{position:[.32,.95,0],rotation:[0,0,-.35],children:[(0,t.jsx)("capsuleGeometry",{args:[.08,.55,4,8]}),(0,t.jsx)("meshStandardMaterial",{color:e,roughness:.6})]})]})},at=()=>{let{t:e}=(0,l.useTranslation)(),{scene:r}=(0,ey.default)(),o=(0,t7.useActiveMobs)(),i=(0,c.useSignalKPaths)(t9),n=i["navigation.position"],[u,h]=(0,a.useState)(()=>(0,I.vesselNow)().getTime());(0,a.useEffect)(()=>{let e=setInterval(()=>h((0,I.vesselNow)().getTime()),1e3);return()=>clearInterval(e)},[]);let m=s.default.get("aisLengthScalingFactor")||.7,{heading:f}=(0,d.default)(),p=(0,a.useMemo)(()=>{let e=0,t=0,a=i["environment.current"];Number.isFinite(a?.drift)&&Number.isFinite(a?.setTrue)&&(e+=a.drift*Math.sin(a.setTrue),t+=a.drift*Math.cos(a.setTrue));let r=i["environment.wind.speedTrue"],o=i["environment.wind.directionTrue"];return Number.isFinite(r)&&Number.isFinite(o)&&(e-=.025*r*Math.sin(o),t-=.025*r*Math.cos(o)),{ve:e,vn:t}},[i]);return o.length&&Number.isFinite(n?.latitude)?(0,t.jsx)("group",{rotation:[0,f,0],children:o.filter(e=>Number.isFinite(e.position?.latitude)).map(a=>{let o,i=Math.max(0,(u-(Date.parse(a.createdAt)||u))/1e3),l={east:((o=a.position).longitude-n.longitude)*Math.PI/180*6371e3*Math.cos(n.latitude*Math.PI/180),north:(o.latitude-n.latitude)*Math.PI/180*6371e3},s={east:l.east+p.ve*i,north:l.north+p.vn*i},c={east:s.east+10*p.ve*60,north:s.north+10*p.vn*60},d=(e,t=.3)=>[e.east*m,t,-e.north*m],h=Math.hypot(s.east,s.north),f=Math.floor(i/60),v=Math.floor(i%60);return(0,t.jsxs)("group",{children:[(0,t.jsxs)("mesh",{position:d(l,.2),rotation:[-Math.PI/2,0,0],children:[(0,t.jsx)("ringGeometry",{args:[1.6,2.2,32]}),(0,t.jsx)("meshBasicMaterial",{color:r.vesselDanger,transparent:!0,opacity:.7,depthWrite:!1})]}),(0,t.jsx)(L.default,{points:[d(l),d(s)],color:r.vesselDanger,lineWidth:2.5}),(0,t.jsx)(L.default,{points:[d(s),d(c)],color:r.vesselDanger,lineWidth:1.5,dashed:!0,dashSize:1.5,gapSize:1.2,transparent:!0,opacity:.7}),(0,t.jsx)(L.default,{points:[[0,.3,0],d(s)],color:r.compass,lineWidth:1.2,dashed:!0,dashSize:2,gapSize:2,transparent:!0,opacity:.6}),(0,t.jsxs)("group",{position:d(s,0),children:[(0,t.jsx)(ae,{color:"#ff7a00"}),(0,t.jsxs)("mesh",{position:[0,.05,0],rotation:[-Math.PI/2,0,0],children:[(0,t.jsx)("ringGeometry",{args:[2.4,2.9,32]}),(0,t.jsx)("meshBasicMaterial",{color:r.vesselDanger,transparent:!0,opacity:.9,depthWrite:!1})]}),(0,t.jsx)(eA.Billboard,{position:[0,4.2,0],children:(0,t.jsx)(ez.Text,{fontSize:1.6,color:r.vesselDanger,anchorX:"center",anchorY:"bottom",font:"fonts/Roboto-Bold.ttf",outlineWidth:.12,outlineColor:r.background,children:`${e("mob.short","MOB")} \xb7 ${f}:${String(v).padStart(2,"0")} \xb7 ${Math.round(h)} m`})})]})]},a.path)})}):null};var aa=e.i(39271),ar=e.i(73919);let ao=()=>((0,y.useFrame)(({camera:e})=>{let t=Math.max(5,.05*e.position.length());Math.abs(t-e.near)>.1*e.near&&(e.near=t,e.updateProjectionMatrix())}),null);var ai=e.i(20440);let an=(0,e8.coursePaths)("bearingTrue","distance"),al=`
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,as=`
    uniform vec3 uColor;
    uniform vec3 uGlow;
    uniform float uLength;
    uniform float uTime;
    uniform float uChevronZone;
    varying vec2 vUv;

    void main() {
        float along = vUv.y * uLength;
        float across = abs(vUv.x - 0.5) * 2.0;

        // Soft edges and a fade towards the far end
        float edge = 1.0 - smoothstep(0.75, 1.0, across);
        float farFade = 1.0 - smoothstep(0.55, 1.0, vUv.y);
        float alpha = 0.32 * edge * farFade;

        // Chevrons streaming forward near the bow
        // "+ across": the chevron tips point along the route, towards the waypoint
        float chevronCoord = along * 0.35 + across * 1.2 - uTime * 1.6;
        float chevron = smoothstep(0.55, 0.62, fract(chevronCoord)) * (1.0 - smoothstep(0.82, 0.9, fract(chevronCoord)));
        float zone = 1.0 - smoothstep(uChevronZone * 0.6, uChevronZone, along);
        vec3 color = mix(uColor, uGlow, chevron * zone);
        alpha += chevron * zone * 0.45 * edge;

        // Bright rim lines along both edges
        alpha += smoothstep(0.86, 0.94, across) * (1.0 - smoothstep(0.94, 1.0, across)) * 0.35 * farFade;

        gl_FragColor = vec4(color, alpha);

        #include <colorspace_fragment>
    }
`,au=({y:e=-.2})=>{let{scene:r}=(0,ey.default)(),{heading:o}=(0,d.default)(),i=(0,c.useSignalKPaths)(an),l=(0,e8.courseValue)(i,"bearingTrue"),u=(0,e8.courseValue)(i,"distance"),h=s.default.get("aisLengthScalingFactor")||.7,m=Number.isFinite(u)?Math.min(u*h,1600):0,f=Number.isFinite(u)&&u*h<=1600,p=(0,a.useMemo)(()=>new n.ShaderMaterial({uniforms:{uColor:{value:new n.Color},uGlow:{value:new n.Color},uLength:{value:1},uTime:{value:0},uChevronZone:{value:45}},vertexShader:al,fragmentShader:as,transparent:!0,depthWrite:!1}),[]);return((0,a.useEffect)(()=>{p.uniforms.uColor.value.set(r.route),p.uniforms.uGlow.value.set(r.routeGlow)},[p,r]),(0,a.useEffect)(()=>{p.uniforms.uLength.value=Math.max(m,1)},[p,m]),(0,a.useEffect)(()=>()=>p.dispose(),[p]),(0,y.useFrame)((e,t)=>{p.uniforms.uTime.value+=t}),!Number.isFinite(l)||m<1)?null:(0,t.jsx)("group",{rotation:[0,o,0],position:[0,e,0],children:(0,t.jsxs)("group",{rotation:[0,-l,0],children:[(0,t.jsx)("mesh",{position:[0,0,-m/2],rotation:[-Math.PI/2,0,0],material:p,renderOrder:1,children:(0,t.jsx)("planeGeometry",{args:[3.2,m,1,1]})}),f&&(0,t.jsxs)("group",{position:[0,0,-m],children:[(0,t.jsxs)("mesh",{position:[0,4,0],children:[(0,t.jsx)("cylinderGeometry",{args:[.12,.12,8,8]}),(0,t.jsx)("meshBasicMaterial",{color:r.route})]}),(0,t.jsxs)("mesh",{position:[0,8.6,0],children:[(0,t.jsx)("sphereGeometry",{args:[.9,16,16]}),(0,t.jsx)("meshBasicMaterial",{color:r.route})]}),(0,t.jsxs)("mesh",{rotation:[-Math.PI/2,0,0],position:[0,.05,0],children:[(0,t.jsx)("ringGeometry",{args:[2.4,3.2,40]}),(0,t.jsx)("meshBasicMaterial",{color:r.route,transparent:!0,opacity:.7,depthWrite:!1})]})]})]})})},ac=(e,t,a)=>Number.isFinite(e)?e<.8?a.copy(t.bad):e<.95?a.copy(t.fair):a.copy(t.good):a.copy(t.foam),ad=({y:e=-.25})=>{let{scene:r}=(0,ey.default)(),{heading:o,offset:i}=(0,d.default)(),{ratio:l}=(0,e4.default)(),u=(0,a.useRef)([]),c=(0,a.useRef)(0),h=s.default.get("aisLengthScalingFactor")||.7,m=(0,a.useMemo)(()=>({good:new n.Color(r.wakeGood),fair:new n.Color(r.wakeFair),bad:new n.Color(r.wakeBad),foam:new n.Color(r.wakeFoam)}),[r]),f=(0,a.useMemo)(()=>{let e=new n.BufferGeometry;e.setAttribute("position",new n.BufferAttribute(new Float32Array(2160),3)),e.setAttribute("color",new n.BufferAttribute(new Float32Array(2880),4));let t=[];for(let e=0;e<359;e++){let a=2*e;t.push(a,a+1,a+2,a+1,a+3,a+2)}return e.setIndex(t),e.setDrawRange(0,0),e},[]),p=(0,a.useMemo)(()=>new n.MeshBasicMaterial({vertexColors:!0,transparent:!0,depthWrite:!1,side:n.DoubleSide}),[]);return(0,a.useEffect)(()=>()=>{f.dispose(),p.dispose()},[f,p]),(0,a.useEffect)(()=>{let e=Date.now(),t=u.current,a=t[t.length-1];if(e-c.current<1e3||a&&.5>Math.hypot(i.x-a.x,i.y-a.y))return;c.current=e;let r=Number.isFinite(l)?l:a?.ratio;for(t.push({x:i.x,y:i.y,ratio:r});t.length>360;)t.shift();let o=0;for(let e=t.length-1;e>0;e--)if((o+=Math.hypot(t[e].x-t[e-1].x,t[e].y-t[e-1].y))>900){t.splice(0,e-1);break}},[i,l]),(0,a.useEffect)(()=>{let e=u.current,t=f.attributes.position.array,a=f.attributes.color.array,r=new n.Color,o=e[e.length-1]?.ratio,s=[...e,{x:i.x,y:i.y,ratio:Number.isFinite(l)?l:o}],c=Math.min(s.length,360),d=s.length-c,p=s.some(e=>Number.isFinite(e.ratio));for(let e=0;e<c;e++){let o=s[d+e],n=s[Math.max(d,d+e-1)],l=s[Math.min(s.length-1,d+e+1)],u=l.x-n.x,f=l.y-n.y,v=Math.hypot(u,f)||1;u/=v,f/=v;let g=(o.x-i.x)*h,x=-(o.y-i.y)*h,y=-(.9*f),M=-(.9*u);t.set([g+y,0,x+M,g-y,0,x-M],6*e);let b=1-e/Math.max(1,c-1),w=!Number.isFinite(o.ratio)&&p?0:.5*(1-b)**.7;ac(o.ratio,m,r),a.set([r.r,r.g,r.b,w,r.r,r.g,r.b,w],8*e)}f.attributes.position.needsUpdate=!0,f.attributes.color.needsUpdate=!0,f.setDrawRange(0,Math.max(0,(c-1)*6)),f.computeBoundingSphere()},[f,i,l,m,h]),(0,t.jsx)("group",{rotation:[0,o,0],position:[0,e,0],children:(0,t.jsx)("mesh",{geometry:f,material:p,frustumCulled:!1,renderOrder:1})})};var ah=e.i(47167),am=e.i(78140);let af=ah.default.env.ASSET_PREFIX||"./",ap=`${af}/boats/default/assets/scene-transformed.glb`,av=({scale:e=.7})=>{let{scene:r}=(0,ey.default)(),{polarSpeed:o,boatSpeed:i}=(0,e4.default)(),{nodes:l}=(0,am.useGLTF)(ap,`${af}/draco/`),u=(0,a.useRef)(),c=(0,a.useRef)(0),d=(0,a.useRef)({polarSpeed:o,boatSpeed:i}),h=s.default.get("aisLengthScalingFactor")||.7;(0,a.useEffect)(()=>{d.current={polarSpeed:o,boatSpeed:i}},[o,i]);let m=(0,a.useMemo)(()=>new n.MeshLambertMaterial({transparent:!0,opacity:.28,depthWrite:!1}),[]);if((0,a.useEffect)(()=>{m.color.set(r.ghost)},[m,r]),(0,a.useEffect)(()=>()=>m.dispose(),[m]),(0,y.useFrame)((e,t)=>{let{polarSpeed:a,boatSpeed:r}=d.current,o=Math.min(t,.5),i=Math.exp(-o/60),l=Number.isFinite(a)&&Number.isFinite(r)?(a-r)*o*h:0;c.current=n.MathUtils.clamp(c.current*i+l,-70,70),u.current&&(u.current.position.z=-c.current,u.current.visible=Math.abs(c.current)>2)}),!Number.isFinite(o))return null;let f=[["govde_fiberglass_0",[0,.32,-.897],[0,Math.PI/2,0],[5.11,.454,1.212]],["govde_fiberglass2_0",[0,.32,-.897],[0,Math.PI/2,0],[5.11,.454,1.212]],["ustgovde_fiberglass_0",[0,.832,-2.741],[-Math.PI/2,0,0],[.566,.7,1.212]],["salma_fiberglass_0",[0,-1.953,-.739],[0,0,0],[.149,.108,.756]],["direk_fiberglass_0",[0,4.315,-1.056],[Math.PI/2,0,Math.PI],[-.113,.113,5.203]]];return(0,t.jsx)("group",{ref:u,scale:[e,e,e],visible:!1,children:f.map(([e,a,r,o])=>l[e]&&(0,t.jsx)("mesh",{geometry:l[e].geometry,material:m,position:a,rotation:r,scale:o,renderOrder:2},e))})};var ag=e.i(83524);let ax=()=>{let{scene:e}=(0,ey.default)(),a=(0,ag.default)();if(!a||"standOn"===a.kind||null===a.change)return null;let r=[90*Math.sin(a.change),-(90*Math.cos(a.change))],o="avoid"===a.kind?e.vesselDanger:e.target;return(0,t.jsx)(tr,{from:[0,-4],to:r,color:o,width:2,opacity:.28,fadeTo:!0,y:-.1})},ay=({angle:e,color:a,label:r})=>{let o=7.2*Math.sin(e),i=-(7.2*Math.cos(e));return(0,t.jsxs)("group",{position:[o,.05,i],rotation:[0,-e,0],children:[(0,t.jsxs)("mesh",{rotation:[-Math.PI/2,0,Math.PI],children:[(0,t.jsx)("circleGeometry",{args:[.45,3]}),(0,t.jsx)("meshBasicMaterial",{color:a})]}),(0,t.jsx)(ez.Text,{position:[0,.02,-.9],rotation:[-Math.PI/2,0,0],fontSize:.42,color:a,anchorX:"center",anchorY:"middle",font:"fonts/Roboto-Bold.ttf",children:r})]})},aM=()=>{let{scene:e}=(0,ey.default)(),{heading:a,targetHeading:r,vmc:o}=(0,e4.default)();return Number.isFinite(a)?(0,t.jsxs)("group",{children:[Number.isFinite(r)&&(0,t.jsx)(ay,{angle:(0,e6.wrapPi)(r-a),color:e.target,label:"TWA"}),o?.best&&(0,t.jsx)(ay,{angle:(0,e6.wrapPi)(o.best.heading-a),color:e.route,label:"VMG"})]}):null},ab={mainCar:.5,jibCar:.5,tension:.5,reefLevel:0};var aw=e.i(5941);let aS=[{label:"GV",centerDeg:180,colorKey:"accent",key:"mainCar",mode:"position"},{label:"FP",centerDeg:260,colorKey:"ok",key:"jibCar",side:"port",mode:"fill"},{label:"FS",centerDeg:100,colorKey:"danger",key:"jibCar",side:"starboard",mode:"fill"}];function aC(e,t){let a=n.MathUtils.degToRad(e-90);return[t*Math.cos(a),t*Math.sin(a)]}let aj=({label:e,value:r,centerDeg:o,color:i,dim:l})=>{let s=Math.max(0,Math.min(1,r)),u=(0,a.useMemo)(()=>{let e=[],a=o-15;for(let r=0;r<=12;r++){let o=r/12,[n,u]=aC(a+30*o,4.2),c=Math.abs(o-s),d=c<=.041666666666666664,h=c<=.125,m=.041666666666666664>=Math.abs(o-.5),f=l,p=.09,v=.3;d?(f=i,p=.16,v=1):h?(f=i,p=.09,v=.5):m&&(v=.5),e.push((0,t.jsx)(eQ,{args:[p,8,8],position:[n,0,u],children:(0,t.jsx)("meshBasicMaterial",{color:f,transparent:!0,opacity:v})},r))}return e},[s,o,i,l]),c=n.MathUtils.degToRad(o-90),d=3.6*Math.cos(c),h=3.6*Math.sin(c);return(0,t.jsxs)("group",{children:[u,(0,t.jsx)(ez.Text,{position:[d,-.4,h],color:i,fontSize:.3,rotation:[-Math.PI/2,0,Math.PI/2-c],font:"fonts/Roboto-Bold.ttf",anchorY:"middle",fillOpacity:.9,children:e})]})},aP=({label:e,value:r,centerDeg:o,color:i,active:l,dim:s,disabled:u})=>{let c=Math.max(0,Math.min(1,r)),d=(0,a.useMemo)(()=>{let e=[],a=o-15;for(let r=0;r<=12;r++){let o=r/12,[n,d]=aC(a+30*o,4.2),h=u,m=.09,f=.15;if(l){let e=o<=c;.041666666666666664>=Math.abs(o-c)?(h=i,m=.16,f=1):e?(h=i,f=.7):(h=s,f=.3)}e.push((0,t.jsx)(eQ,{args:[m,8,8],position:[n,0,d],children:(0,t.jsx)("meshBasicMaterial",{color:h,transparent:!0,opacity:f})},r))}return e},[c,o,i,l,s,u]),h=n.MathUtils.degToRad(o-90),m=3.6*Math.cos(h),f=3.6*Math.sin(h);return(0,t.jsxs)("group",{children:[d,(0,t.jsx)(ez.Text,{position:[m,-.4,f],color:l?i:u,fontSize:.3,rotation:[-Math.PI/2,0,Math.PI/2-h],font:"fonts/Roboto-Bold.ttf",anchorY:"middle",fillOpacity:l?.9:.2,children:e})]})},ak=()=>{let e=(0,ey.default)(),r=(0,c.useSignalKPath)("environment.wind.angleApparent",0),o=(0,c.useSignalKPath)("environment.wind.speedApparent",0),i=(0,a.useMemo)(()=>{let e=r;for(;e<0;)e+=2*Math.PI;for(;e>=2*Math.PI;)e-=2*Math.PI;return e>Math.PI},[r]),{mainCar:n,jibCar:l}=(0,a.useMemo)(()=>(function(e,t){let a=e;for(;a<0;)a+=2*Math.PI;for(;a>=2*Math.PI;)a-=2*Math.PI;let r=a>Math.PI,o=Math.max(0,1-(r?2*Math.PI-a:a)/(.75*Math.PI)),i=Math.min(1,Math.abs(t)/15),n=(1-o)*.4*i;return{mainCar:r?.5-n:.5+n,jibCar:Math.max(.05,Math.min(1,(1-o)*.7+.2*i+.1))}})(r,o),[r,o]);return(0,t.jsx)("group",{children:aS.map(a=>{let r="mainCar"===a.key?n:l,o=!0;return("port"===a.side&&(o=!i),"starboard"===a.side&&(o=i),"position"===a.mode)?(0,t.jsx)(aj,{label:a.label,value:r,centerDeg:a.centerDeg,color:e[a.colorKey],dim:e.scene.markerDim},a.label):(0,t.jsx)(aP,{label:a.label,value:r,centerDeg:a.centerDeg,color:e[a.colorKey],active:o,dim:e.scene.markerDim,disabled:e.scene.grid},a.label)})})},aT=[0,5,20];e.s(["default",0,({onUpdateInfoPanel:e,selection:n=null})=>{let{states:l}=(0,j.useOcearoContext)(),{scene:u,id:d}=(0,ey.default)(),h=(0,a.useRef)(),m=(0,aa.useReplay)().active,v=s.default.get("debugShowAxes"),g=(()=>{let e,[t,r]=(0,a.useState)(ab),o=s.default.get("preferredWindSpeedPath")||"speedTrue",i=s.default.get("preferredWindDirectionPath")||"angleTrueWater",n=(0,a.useMemo)(()=>[`environment.wind.${o}`,`environment.wind.${i}`,"environment.wind.speedTrue","environment.wind.angleTrueWater","environment.wind.angleApparent","environment.wind.speedApparent","environment.wind.directionTrue","environment.wind.angleTrueGround","navigation.headingTrue","navigation.courseOverGroundTrue"],[o,i]),l=(0,c.useSignalKPaths)(n),u=l[`environment.wind.${o}`]??l["environment.wind.speedTrue"]??0,d=l["navigation.headingTrue"]??l["navigation.courseOverGroundTrue"],h=l["environment.wind.directionTrue"],m=l["environment.wind.angleTrueWater"]??l["environment.wind.angleTrueGround"]??(Number.isFinite(h)&&Number.isFinite(d)?Math.atan2(Math.sin(e=h-d),Math.cos(e)):0),f=l["environment.wind.angleApparent"]??0,p=l["environment.wind.speedApparent"]??0,v=(0,a.useCallback)((e,t)=>{r(a=>({...a,[e]:t}))},[]),g=(0,a.useCallback)(e=>{v("mainCar",e)},[v]),x=(0,a.useCallback)(e=>{v("jibCar",e)},[v]),y=(0,a.useCallback)(e=>{v("tension",e)},[v]),M=(0,a.useCallback)(e=>{let t=1.9438444924574*e;return t>25?2:+(t>18)},[]),b=(0,a.useMemo)(()=>M(u),[u,M]),w=(0,a.useMemo)(()=>({tws:u,twa:m,awa:f,aws:p}),[u,m,f,p]),S=(0,a.useMemo)(()=>({...t,reefLevel:b,...w}),[t,b,w]);return{trimState:t,windData:w,reefLevel:b,sailTrimParams:S,setMainCar:g,setJibCar:x,setTension:y,setTrimValue:v}})(),x=(0,a.useMemo)(()=>({...(0,aw.updateSailTrim)({tws:g.windData.tws,twa:g.windData.twa,awa:g.windData.awa,mainCar:g.trimState.mainCar,jibCar:g.trimState.jibCar,tension:g.trimState.tension}),trimState:g.trimState,windData:g.windData}),[g.windData,g.trimState]);return(0,t.jsxs)(a.Suspense,{fallback:(0,t.jsx)(o.Html,{children:"Loading..."}),children:[(0,t.jsx)(r.PerspectiveCamera,{makeDefault:!0,fov:60,near:5,far:l.showWind?6e4:6e3,position:aT}),(0,t.jsx)(ao,{}),(0,t.jsx)(i.default,{home:aT,enableZoom:!0,enableRotate:!0,maxPolarAngle:Math.PI/2,minPolarAngle:Math.PI/4,enableDamping:!1,zoomSpeed:.5,rotateSpeed:.5}),(0,t.jsx)(ar.default,{backdrop:"black"===l.oceanMode||"water"===l.oceanMode,fogNear:600,fogFar:4200,fogColor:"water"===l.oceanMode?u.skyHorizon:void 0}),(0,t.jsxs)("group",{position:[0,-3,0],children:[(0,t.jsx)(p.default,{position:[0,.2*("depth"===l.oceanMode),0],scale:[.7,.7,.7],ref:h,showSail:!0,onUpdateInfoPanel:e,sailTrimData:x,heave:"water"===l.oceanMode}),!1!==s.default.get("showGhostBoat")&&(0,t.jsx)(av,{scale:.7}),"water"===l.oceanMode&&(0,t.jsx)(t1,{}),"depth"===l.oceanMode&&(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(t0,{}),(0,t.jsx)(O,{lite:!0,sky:!1,horizon:u.skyHorizon,liteColor:"day"===d?0xb4cbd1:u.sea,fogDensity:l.showWind?3e-5:void 0,water:!1}),(0,t.jsx)(t8.default,{current:!!l.showCurrent}),(0,t.jsx)(_.default,{mode:"chart",opacity:.2})]}),l.showWind&&("water"===l.oceanMode?(0,t.jsx)(t2.default,{sheet:!1,y:.8}):(0,t.jsx)(t2.default,{y:"black"===l.oceanMode?-.25:.05})),l.showCurrent&&"depth"!==l.oceanMode&&(0,t.jsx)(t6,{y:"water"===l.oceanMode?.6:-.25}),"black"===l.oceanMode&&(0,t.jsx)(ai.default,{}),(0,t.jsx)(au,{}),(0,t.jsx)(f,{y:"depth"===l.oceanMode?-.1:-.3}),(0,t.jsx)(ad,{}),l.showLaylines3D&&(0,t.jsx)(tl,{}),(0,t.jsx)(ax,{}),l.showPolar&&(0,t.jsx)(tp,{}),(0,t.jsx)(at,{}),l.showSeamarks&&(0,t.jsx)(eX,{waterLevel:-.3}),l.ais&&!m&&(0,t.jsx)(eR,{onUpdateInfoPanel:e,selectedMmsi:n?.kind==="ais"?n.mmsi:null}),(0,t.jsx)(e3,{visible:!0}),(0,t.jsx)(aM,{}),!1!==s.default.get("showSailTrimSliders")&&(0,t.jsx)(ak,{})]}),v&&(0,t.jsx)("axesHelper",{args:[100]})]})}],67225)},59465,function(e){e.n(e.i(67225))}]);