(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,67225,e=>{"use strict";let t,a;var r=e.i(43476),o=e.i(71645),i=e.i(82897),n=e.i(60099),s=e.i(44909),l=e.i(90072);e.i(85269);var u=e.i(22831),d=e.i(83402),c=e.i(66799),h=e.i(85709),f=e.i(78461),m=e.i(9617);let p=new l.MeshBasicMaterial({transparent:!0,opacity:0,depthWrite:!1,colorWrite:!1,side:l.DoubleSide}),v=({y:e=-.3})=>{let{t}=(0,u.useTranslation)(),{placingWaypoint:a}=(0,o.useSyncExternalStore)(m.subscribeView,m.getViewState,m.getViewState),i=(0,h.useSignalKPath)("navigation.position"),{heading:n}=(0,f.default)(),s=(0,o.useRef)(!1),l=d.default.get("aisLengthScalingFactor")||.7;if(!a||!Number.isFinite(i?.latitude))return null;let v=async e=>{if(s.current||e.delta>8)return;e.stopPropagation();let a=e.object.worldToLocal(e.point.clone()),r=a.x/l,o=a.y/l,n=i.latitude,u=n+o/6371e3*180/Math.PI,d=i.longitude+r/(6371e3*Math.cos(n*Math.PI/180))*180/Math.PI,h=new Date,f=`WPT ${String(h.getHours()).padStart(2,"0")}:${String(h.getMinutes()).padStart(2,"0")}`;s.current=!0;try{let e=c.default.generateUUID();await c.default.saveWaypoint(e,c.default.createWaypointFeature(d,u,f,t("waypointPicker.description"))),await c.default.setDestinationWaypoint(e),(0,m.setPlacingWaypoint)(!1),(0,m.setViewMessage)(t("waypointPicker.set",{name:f,distance:(Math.hypot(r,o)/1852).toFixed(2)}))}catch(e){(0,m.setViewMessage)(t("waypointPicker.failed",{error:e.message}))}finally{s.current=!1}};return(0,r.jsx)("group",{rotation:[0,n,0],position:[0,e,0],children:(0,r.jsx)("mesh",{rotation:[-Math.PI/2,0,0],material:p,onClick:v,children:(0,r.jsx)("planeGeometry",{args:[2e4,2e4]})})})};var g=e.i(66326),y=e.i(80566),x=e.i(90874),M=e.i(93282),b=e.i(95393),w=l,S=e.i(8560);class C extends w.Mesh{constructor(e,t={}){super(e),this.isWater=!0;const a=this,r=void 0!==t.textureWidth?t.textureWidth:512,o=void 0!==t.textureHeight?t.textureHeight:512,i=void 0!==t.clipBias?t.clipBias:0,n=void 0!==t.alpha?t.alpha:1,s=void 0!==t.time?t.time:0,l=void 0!==t.waterNormals?t.waterNormals:null,u=void 0!==t.sunDirection?t.sunDirection:new w.Vector3(.70707,.70707,0),d=new w.Color(void 0!==t.sunColor?t.sunColor:0xffffff),c=new w.Color(void 0!==t.waterColor?t.waterColor:8355711),h=void 0!==t.eye?t.eye:new w.Vector3(0,0,0),f=void 0!==t.distortionScale?t.distortionScale:20,m=void 0!==t.side?t.side:w.FrontSide,p=void 0!==t.fog&&t.fog,v=new w.Plane,g=new w.Vector3,y=new w.Vector3,x=new w.Vector3,M=new w.Matrix4,b=new w.Vector3(0,0,-1),C=new w.Vector4,j=new w.Vector3,P=new w.Vector3,k=new w.Vector4,T=new w.Matrix4,A=new w.PerspectiveCamera,D=new w.WebGLRenderTarget(r,o,{type:w.HalfFloatType}),z={name:"MirrorShader",uniforms:w.UniformsUtils.merge([S.UniformsLib.fog,S.UniformsLib.lights,{normalSampler:{value:null},mirrorSampler:{value:null},alpha:{value:1},time:{value:0},size:{value:1},distortionScale:{value:20},textureMatrix:{value:new w.Matrix4},sunColor:{value:new w.Color(8355711)},sunDirection:{value:new w.Vector3(.70707,.70707,0)},eye:{value:new w.Vector3},waterColor:{value:new w.Color(5592405)}}]),vertexShader:`
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
				}`},F=new w.ShaderMaterial({name:z.name,uniforms:w.UniformsUtils.clone(z.uniforms),vertexShader:z.vertexShader,fragmentShader:z.fragmentShader,lights:!0,side:m,fog:p});F.uniforms.mirrorSampler.value=D.texture,F.uniforms.textureMatrix.value=T,F.uniforms.alpha.value=n,F.uniforms.time.value=s,F.uniforms.normalSampler.value=l,F.uniforms.sunColor.value=d,F.uniforms.waterColor.value=c,F.uniforms.sunDirection.value=u,F.uniforms.distortionScale.value=f,F.uniforms.eye.value=h,a.material=F,a.onBeforeRender=function(e,t,r){if(y.setFromMatrixPosition(a.matrixWorld),x.setFromMatrixPosition(r.matrixWorld),M.extractRotation(a.matrixWorld),g.set(0,0,1),g.applyMatrix4(M),j.subVectors(y,x),j.dot(g)>0)return;j.reflect(g).negate(),j.add(y),M.extractRotation(r.matrixWorld),b.set(0,0,-1),b.applyMatrix4(M),b.add(x),P.subVectors(y,b),P.reflect(g).negate(),P.add(y),A.position.copy(j),A.up.set(0,1,0),A.up.applyMatrix4(M),A.up.reflect(g),A.lookAt(P),A.far=r.far,A.updateMatrixWorld(),A.projectionMatrix.copy(r.projectionMatrix),T.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),T.multiply(A.projectionMatrix),T.multiply(A.matrixWorldInverse),v.setFromNormalAndCoplanarPoint(g,y),v.applyMatrix4(A.matrixWorldInverse),C.set(v.normal.x,v.normal.y,v.normal.z,v.constant);let o=A.projectionMatrix;k.x=(Math.sign(C.x)+o.elements[8])/o.elements[0],k.y=(Math.sign(C.y)+o.elements[9])/o.elements[5],k.z=-1,k.w=(1+o.elements[10])/o.elements[14],C.multiplyScalar(2/C.dot(k)),o.elements[2]=C.x,o.elements[6]=C.y,o.elements[10]=C.z+1-i,o.elements[14]=C.w,h.setFromMatrixPosition(r.matrixWorld);let n=e.getRenderTarget(),s=e.xr.enabled,l=e.shadowMap.autoUpdate;a.visible=!1,e.xr.enabled=!1,e.shadowMap.autoUpdate=!1,e.setRenderTarget(D),e.state.buffers.depth.setMask(!0),!1===e.autoClear&&e.clear(),e.render(t,A),a.visible=!0,e.xr.enabled=s,e.shadowMap.autoUpdate=l,e.setRenderTarget(n);let u=r.viewport;void 0!==u&&e.state.viewport(u)}}}var j=l;class P extends j.Mesh{constructor(){const e=P.SkyShader,t=new j.ShaderMaterial({name:e.name,uniforms:j.UniformsUtils.clone(e.uniforms),vertexShader:e.vertexShader,fragmentShader:e.fragmentShader,side:j.BackSide,depthWrite:!1});super(new j.BoxGeometry(1,1,1),t),this.isSky=!0}}P.SkyShader={name:"SkyShader",uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new j.Vector3},cloudScale:{value:2e-4},cloudSpeed:{value:2e-5},cloudCoverage:{value:.4},cloudDensity:{value:.4},cloudElevation:{value:.5},showSunDisc:{value:1},time:{value:0}},vertexShader:`
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

		}`};var k=e.i(67561),T=e.i(83934);let A=e=>e===Object(e)&&!Array.isArray(e)&&"function"!=typeof e;function D(e,t){let a=(0,x.useThree)(e=>e.gl),r=(0,M.useLoader)(l.TextureLoader,A(e)?Object.values(e):e);return(0,o.useLayoutEffect)(()=>{null==t||t(r)},[t]),(0,o.useEffect)(()=>{if("initTexture"in a){let e=[];Array.isArray(r)?e=r:r instanceof l.Texture?e=[r]:A(r)&&(e=Object.values(r)),e.forEach(e=>{e instanceof l.Texture&&a.initTexture(e)})}},[a,r]),(0,o.useMemo)(()=>{if(!A(e))return r;{let t={},a=0;for(let o in e)t[o]=r[a++];return t}},[e,r])}D.preload=e=>M.useLoader.preload(l.TextureLoader,e),D.clear=e=>M.useLoader.clear(l.TextureLoader,e);var z=l;let F=parseInt(l.REVISION.replace(/\D+/g,""));class E extends z.ShaderMaterial{constructor(){super({uniforms:{time:{value:0},fade:{value:1}},vertexShader:`
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
      }`})}}let R=e=>new z.Vector3().setFromSpherical(new z.Spherical(e,Math.acos(1-2*Math.random()),2*Math.random()*Math.PI)),I=o.forwardRef(({radius:e=100,depth:t=50,count:a=5e3,saturation:r=0,factor:i=4,fade:n=!1,speed:s=1},l)=>{let u=o.useRef(null),[d,c,h]=o.useMemo(()=>{let o=[],n=[],s=Array.from({length:a},()=>(.5+.5*Math.random())*i),l=new z.Color,u=e+t,d=t/a;for(let e=0;e<a;e++)u-=d*Math.random(),o.push(...R(u).toArray()),l.setHSL(e/a,r,.9),n.push(l.r,l.g,l.b);return[new Float32Array(o),new Float32Array(n),new Float32Array(s)]},[a,t,i,e,r]);(0,b.useFrame)(e=>u.current&&(u.current.uniforms.time.value=e.clock.elapsedTime*s));let[f]=o.useState(()=>new E);return o.createElement("points",{ref:l},o.createElement("bufferGeometry",null,o.createElement("bufferAttribute",{attach:"attributes-position",args:[d,3]}),o.createElement("bufferAttribute",{attach:"attributes-color",args:[c,3]}),o.createElement("bufferAttribute",{attach:"attributes-size",args:[h,1]})),o.createElement("primitive",{ref:u,object:f,attach:"material",blending:z.AdditiveBlending,"uniforms-fade-value":n,depthWrite:!1,transparent:!0,vertexColors:!0}))});var _=e.i(95430),B=e.i(14421);(0,y.extend)({Water:C,Sky:P});let L=new l.Color(17510),N=new l.Color(517),W=new l.Color,U=new l.Color,G=function({lite:e=!1,fogDensity:t=35e-5,water:a=!0,sky:i=!0,horizon:n,liteColor:s=0xb4cbd1}){let{nightMode:u}=(0,k.useOcearoContext)(),{getWindData:c,getCurrentWeather:f}=(0,T.useWeather)(),m=(0,o.useRef)(),p=(0,o.useRef)(),v=(0,o.useRef)(),g=(0,o.useRef)(),y=(0,o.useRef)(null),w=(0,h.useSignalKPath)("navigation.position"),S=(0,o.useRef)(null);(0,o.useEffect)(()=>{S.current=w},[w]);let j=(0,o.useRef)(0),P=(0,o.useRef)(1),A=(0,x.useThree)(e=>e.gl),z=(0,x.useThree)(e=>e.scene),F=(0,o.useMemo)(()=>new l.Vector3,[]),E=D("assets/moon.jpg"),R=(0,M.useLoader)(l.TextureLoader,"assets/waternormals.jpg");(0,o.useMemo)(()=>{R.wrapS=R.wrapT=l.RepeatWrapping},[R]);let G=(0,o.useMemo)(()=>new l.PlaneGeometry(4e3,4e3,144,144),[]),O=(0,o.useMemo)(()=>new l.MeshBasicMaterial({color:0xb4cbd1,depthWrite:!1}),[]),V=(0,o.useMemo)(()=>new l.Color(s),[s]),H=(0,o.useRef)({waveAmp:{value:0},waveTime:{value:0}}),$=(0,o.useRef)(),Z=(0,o.useRef)(),X=(0,o.useRef)(!1),K=(0,o.useMemo)(()=>{let e=document.createElement("canvas");e.width=e.height=128;let t=e.getContext("2d"),a=t.createRadialGradient(64,64,8,64,64,62);return a.addColorStop(0,"rgba(255,255,255,0.85)"),a.addColorStop(.55,"rgba(255,255,255,0.35)"),a.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=a,t.fillRect(0,0,128,128),new l.CanvasTexture(e)},[]),q=(0,o.useMemo)(()=>{let e=[];for(let t=0;t<16;t++){let a=t/16*Math.PI*2+.6*Math.random(),r=500+1200*Math.random();e.push({position:[Math.cos(a)*r,260+180*Math.random(),Math.sin(a)*r],scale:[420+380*Math.random(),150+120*Math.random(),1]})}return e},[]),Y=(0,o.useMemo)(()=>new l.SpriteMaterial({map:K,transparent:!0,opacity:0,depthWrite:!1,color:0xffffff}),[K]),Q=(0,o.useMemo)(()=>{let e=new Float32Array(3600);for(let t=0;t<1200;t++)e[3*t]=(2*Math.random()-1)*240,e[3*t+1]=220*Math.random(),e[3*t+2]=(2*Math.random()-1)*240;let t=new l.BufferGeometry;return t.setAttribute("position",new l.BufferAttribute(e,3)),t},[]),J=(0,o.useMemo)(()=>new l.PointsMaterial({color:0x9fc4d8,size:1.6,transparent:!0,opacity:.55,depthWrite:!1,sizeAttenuation:!0}),[]),ee=(0,o.useMemo)(()=>({textureWidth:256,textureHeight:256,waterNormals:R,sunDirection:new l.Vector3,sunColor:0xffffff,waterColor:7695,distortionScale:3.7,fog:void 0!==z.fog,format:A.outputColorSpace}),[R,A.outputColorSpace,z.fog]),et=(0,o.useMemo)(()=>{if(e)return null;let t=new C(G,ee),a=H.current;return t.material.onBeforeCompile=e=>{e.uniforms.waveAmp=a.waveAmp,e.uniforms.waveTime=a.waveTime,e.vertexShader=e.vertexShader.replace("void main() {",`
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
        `).replace(/vec4\( position, 1.0 \)/g,"vec4( wavePos, 1.0 )")},t},[G,ee,e]);return(0,b.useFrame)((t,a)=>{if(m.current&&(m.current.material.uniforms.time.value+=.5*a),H.current.waveTime.value+=a,$.current&&$.current.visible&&($.current.rotation.y+=.004*a),Z.current&&X.current){let e=Z.current.geometry.attributes.position,t=e.array,r=160*a;for(let e=1;e<t.length;e+=3)t[e]-=r,t[e]<0&&(t[e]+=220);e.needsUpdate=!0}if(P.current+=a,P.current<1)return;let r=P.current;P.current=0;let o=S.current,i=o&&"number"==typeof o.latitude?o.latitude:46.15,n=o&&"number"==typeof o.longitude?o.longitude:-1.15,s=(0,_.vesselNow)(),h=d.default.get("debugMode"),x=s;if(h){null===y.current&&(y.current=Date.now());let e=(Date.now()-y.current)/1e3*720%86400,t=Math.floor(e/3600),a=Math.floor(e%3600/60),r=new Date(s.getTime());r.setHours(t,a,0,0),x=r}let{elevation:M,azimuth:b}=(0,B.sunPosition)(i,n,x),w=0;w=M<=-10?1:M>=5?0:(5-M)/15;let C=u||M<=-5,k=C?Math.max(M,20):Math.max(M,5),T=l.MathUtils.degToRad(90-k),A=l.MathUtils.degToRad(b);if(F.setFromSphericalCoords(1,T,A),m.current){let e=c()?.speed??5;j.current+=(e-j.current)*Math.min(.5*r,1);let t=Math.min(Math.max(.5*j.current,0),8),a=m.current.material.uniforms;a.distortionScale.value=t,a.sunDirection.value.copy(F).normalize();let o=d.default.get("aisLengthScalingFactor")||.7,i=Math.min(.21*j.current**2/9.81,6);H.current.waveAmp.value=i/2*o,W.copy(L).lerp(N,w),a.sunColor.value.setHex(C?4491519:0xffffff),a.waterColor.value.copy(W)}e&&(W.copy(V).lerp(N,w),O.color.copy(W));let D=f(),z=Math.min(Math.max(D?.cloudCover??0,0),1),E=Math.max(D?.rain??0,0),R=E>.05;if($.current){$.current.visible=z>.08;let e=(1-.7*w)*(R?.55:1);U.setScalar(e),Y.color.copy(U),Y.opacity=.15+.55*z}if(X.current=R,Z.current&&(Z.current.visible=R,J.opacity=Math.min(.3+.15*E,.75)),p.current){let t=p.current.material.uniforms,a=.5+.5*(D?.humidity??.6)+9*z+4*!!R,r={turbidity:e?Math.min(a,2.5):a,rayleigh:1.2*(1-.5*z),mieCoefficient:.005+.02*z,mieDirectionalG:.8},o={turbidity:.05,rayleigh:.1,mieCoefficient:5e-4,mieDirectionalG:.95},i=e=>r[e]+(o[e]-r[e])*w;t.turbidity.value=i("turbidity"),t.rayleigh.value=i("rayleigh"),t.mieCoefficient.value=i("mieCoefficient"),t.mieDirectionalG.value=i("mieDirectionalG"),t.sunPosition.value.copy(F)}g.current&&(g.current.position.copy(F).multiplyScalar(4e3),g.current.visible=!C),v.current&&(v.current.position.copy(F).multiplyScalar(4e3),v.current.visible=C,v.current.lookAt(0,0,0))}),(0,o.useEffect)(()=>()=>{et&&(et.material.uniforms.mirrorSampler?.value?.renderTarget?.dispose(),et.material.dispose())},[et]),(0,o.useEffect)(()=>()=>{G.dispose(),O.dispose(),K.dispose(),Y.dispose(),Q.dispose(),J.dispose()},[G,O,K,Y,Q,J]),(0,o.useEffect)(()=>{let e=new l.Color(!i&&n?n:u?517:6694);return z.background=e,z.fog=new l.FogExp2(e,t),A.outputColorSpace=l.SRGBColorSpace,()=>{z.background=null,z.fog=null}},[z,u,A,t,i,n]),(0,r.jsxs)(r.Fragment,{children:[i&&u&&(0,r.jsx)(I,{radius:5e3,depth:50,count:1500,factor:4,saturation:0,fade:!0,speed:1}),i&&(0,r.jsx)("sky",{ref:p,scale:45e4}),i&&u&&(0,r.jsxs)("mesh",{ref:v,position:[600,200,-1500],children:[(0,r.jsx)("sphereGeometry",{args:[80,32,32]}),(0,r.jsx)("meshStandardMaterial",{map:E,emissive:0xffffff,emissiveIntensity:.8})]}),i&&(0,r.jsxs)("mesh",{ref:g,children:[(0,r.jsx)("sphereGeometry",{args:[200,32,32]}),(0,r.jsx)("meshBasicMaterial",{color:0xffffff})]}),i&&(0,r.jsx)("group",{ref:$,visible:!1,children:q.map((e,t)=>(0,r.jsx)("sprite",{position:e.position,scale:e.scale,material:Y},t))}),i&&(0,r.jsx)("points",{ref:Z,geometry:Q,material:J,visible:!1}),a?e?(0,r.jsx)("mesh",{geometry:G,material:O,"rotation-x":-Math.PI/2,position:[0,-.3,0],renderOrder:-1}):(0,r.jsx)("primitive",{ref:m,object:et,"rotation-x":-Math.PI/2,position:[0,-.3,0]}):null]})};var O=e.i(3950),V=e.i(83646);let H="https://tile.openstreetmap.org/{z}/{x}/{y}.png",$={day:"brightness(0.72) saturate(1.15) contrast(1.05)",dark:"invert(1) hue-rotate(180deg) brightness(0.82) saturate(0.7) contrast(0.92)",night:"invert(1) brightness(0.55) sepia(1) hue-rotate(-38deg) saturate(2.4) contrast(0.95)"},Z={day:"none",dark:"brightness(0.62)",night:"brightness(0.4) sepia(1) hue-rotate(-38deg) saturate(2)"},X={day:"none",dark:"brightness(0.9)",night:"sepia(1) hue-rotate(-38deg) saturate(2.4) brightness(0.7)"};function K(e,t,a,r){return e.replace("{z}",t).replace("{x}",a).replace("{y}",r)}function q(e,t){return 156543.03*Math.cos(e*Math.PI/180)/Math.pow(2,t)}let Y=new Map;function Q(e){if(Y.has(e))return Y.get(e);let t=(0,O.cachedImage)(e).catch(()=>null);return Y.set(e,t),t}async function J(e,t,a,r){let o=await Q(K(e,t,a,r));if(o)return{img:o,sx:0,sy:0,sSize:256};for(let i=1;i<=3&&t-i>=1;i++){let n=t-i,s=a>>i,l=r>>i;if(o=await Q(K(e,n,s,l))){let e=256/Math.pow(2,i);return{img:o,sx:(a-(s<<i))*e,sy:(r-(l<<i))*e,sSize:e}}}return null}let ee=null;async function et(e,t,a,r,o=1,i="none"){let n,{latitude:s,longitude:l}=t,u=256*o,d=i&&"none"!==i,c=e;d&&(ee||((ee=document.createElement("canvas")).width=1024,ee.height=1024),e=ee.getContext("2d"));let h=(l+180)/360*Math.pow(2,a),f=(1-Math.log(Math.tan(n=s*Math.PI/180)+1/Math.cos(n))/Math.PI)/2*Math.pow(2,a),m=h*u-512,p=f*u-512,v=Math.floor(m/u),g=Math.floor(p/u),y=Math.ceil(1024/u)+2,x=Math.pow(2,a),M=[];for(let e=0;e<y;e++)for(let t=0;t<y;t++){let r=v+t,o=g+e;if(o<0||o>=x)continue;let i=(r%x+x)%x,n=Math.round(r*u-m),s=Math.round(o*u-p);M.push({z:a,x:i,y:o,screenLeft:n,screenTop:s})}let b=await Promise.all(M.map(e=>J(r,e.z,e.x,e.y)));d&&e.clearRect(0,0,1024,1024);for(let t=0;t<M.length;t++){let a=b[t];if(!a)continue;let{screenLeft:r,screenTop:o}=M[t];e.drawImage(a.img,a.sx,a.sy,a.sSize,a.sSize,r,o,u,u)}d&&(c.filter=i,c.drawImage(ee,0,0),c.filter="none")}async function ea(e,t,a,r){let o=e.getContext("2d");for(let e of(o.clearRect(0,0,1024,1024),r)){if(!e?.template||null!=e.maxBaseZoom&&a>e.maxBaseZoom)continue;let r=Math.min(a,e.maxZoom??a),i=Math.pow(2,a-r);await et(o,t,r,e.template,i,e.filter||"none")}}function er({mode:e="chart",opacity:t=1}){let{heading:a}=(0,f.default)(),i=(0,o.useRef)(),n=(0,o.useRef)(null),s=(0,o.useRef)(null),u=(0,o.useRef)(!1),m=(0,o.useRef)({position:null,zoom:null}),p=(0,o.useRef)(0),{id:v}=(0,V.default)(),g=t<1?"day":v,y=$[g]||$.day,M=(0,o.useRef)([]),{gl:w}=(0,x.useThree)(),S=d.default.get("aisLengthScalingFactor")||.7,[C,j]=(0,o.useState)(16),[P,k]=(0,o.useState)(500),T=(0,h.useSignalKPath)("navigation.position"),A=(0,o.useRef)(null);(0,o.useEffect)(()=>{A.current=T},[T]);let D=T?.latitude!=null&&T?.longitude!=null;(0,b.useFrame)(({camera:t})=>{if(p.current++,p.current%15!=0)return;let a=A.current;if(a?.latitude==null)return;let r=Math.min(Math.max(4*(t.position.length()/S),"meteo"===e?3e3:500),6e4),o=Math.max(3,Math.min("meteo"===e?15:M.current[0]?.template===H?19:18,Math.round(Math.log2(156543.03*Math.cos(a.latitude*Math.PI/180)/(r/1024)))));o!==C&&j(o)});let z=(0,o.useRef)(!1),F=(0,o.useRef)(null),E=(0,o.useCallback)((e=!1)=>{if(u.current){z.current=!0;return}let t=A.current;if(t?.latitude==null||t?.longitude==null)return;let a=m.current;if(!e&&a.position&&a.zoom===C){let e=48*q(t.latitude,C)/111320,r=Math.abs(t.latitude-a.position.latitude),o=Math.abs(t.longitude-a.position.longitude);if(r<e&&o<e)return}let r=n.current,o=s.current;if(!r||!o)return;u.current=!0,m.current={position:t,zoom:C};let i=1024*q(t.latitude,C);ea(r,t,C,M.current).then(()=>{o.needsUpdate=!0,k(i/2*S)}).catch(e=>console.warn("MapPlane3D: tile rendering failed:",e?.message||e)).finally(()=>{u.current=!1,z.current&&(z.current=!1,F.current?.())})},[C,S]);(0,o.useEffect)(()=>{F.current=E},[E]),(0,o.useEffect)(()=>{let e=document.createElement("canvas");e.width=1024,e.height=1024,n.current=e;let t=new l.CanvasTexture(e);return t.minFilter=l.LinearMipmapLinearFilter,t.magFilter=l.LinearFilter,t.anisotropy=w.capabilities.getMaxAnisotropy(),t.generateMipmaps=!0,s.current=t,i.current&&(i.current.material.map=t,i.current.material.needsUpdate=!0),()=>{t.dispose()}},[w]),(0,o.useEffect)(()=>{let t=!1,a=()=>{t||F.current?.(!0)},r=[{template:H,maxZoom:19,filter:y},..."meteo"===e?[]:[{template:"https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png",maxZoom:18,filter:X[g]}]];return(M.current=r,"meteo"===e)?(a(),fetch("https://api.rainviewer.com/public/weather-maps.json").then(e=>e.json()).then(e=>{let r=e?.radar?.past,o=r?.[r.length-1]?.path;o&&!t&&(M.current=[...M.current,{template:`https://tilecache.rainviewer.com${o}/256/{z}/{x}/{y}/2/1_1.png`,maxZoom:7,maxBaseZoom:12}],a())}).catch(()=>{}),()=>{t=!0}):(c.default.apiCall("/signalk/v1/api/resources/charts").then(e=>{if(t||!e||"object"!=typeof e)return;let r=Object.values(e),o=r.find(e=>"openstreetmap"!==e.identifier&&e.tilemapUrl)||r.find(e=>e.tilemapUrl);o?.tilemapUrl&&(M.current=[{template:o.tilemapUrl.includes("{z}")?o.tilemapUrl:`${o.tilemapUrl}/{z}/{x}/{y}.png`,maxZoom:18,filter:Z[g]}]),a()}).catch(()=>{t||(M.current=r,a())}),()=>{t=!0})},[e,g]),(0,o.useEffect)(()=>{E()},[T,e,C]),(0,o.useEffect)(()=>{i.current&&s.current&&(i.current.material.map=s.current,i.current.material.needsUpdate=!0)});let R=(0,o.useMemo)(()=>new l.PlaneGeometry(1,1),[]),I=(0,o.useMemo)(()=>new l.MeshBasicMaterial({side:l.DoubleSide,transparent:t<1,opacity:t,depthWrite:t>=1,polygonOffset:!0,polygonOffsetFactor:2,polygonOffsetUnits:8}),[t]);return((0,o.useEffect)(()=>()=>{R.dispose(),I.dispose()},[R,I]),D)?(0,r.jsx)("group",{rotation:[0,a,0],children:(0,r.jsx)("mesh",{ref:i,geometry:R,material:I,rotation:[-Math.PI/2,0,0],position:[0,-.1,0],scale:[2*P,2*P,1]})}):null}var eo=e.i(43216),ei=e.i(62588),en=e.i(77291),es=e.i(34297),el=e.i(8066),eu=e.i(98392);let ed=e=>-5+10*e,ec=Array.from({length:49},(e,t)=>{let a=t/48;return a*a*(3-2*a)*.3+.7*a}),eh=({beam:e,draft:t,freeboard:a,entry:r=.3,run:o=.15,transom:i=.85,bowRise:n=.25,deadrise:s=.15,bilge:l=.25,flare:u=.15})=>{let d=t=>Math.max(.015,e/2*Math.sin(Math.min(t/r,1)*Math.PI/2)**1.4*(t>1-o?1-(1-i)*((t-(1-o))/o)**1.6:1)),c=e=>a+n*Math.max(0,1-e/.4)**2,h=e=>{let a=d(e),r=t*Math.min(1,.2+e/.1)*(e>.85?1-.3*(e-.85)/.15:1),o=c(e),i=Math.min(l,.8*r,.55*a),n=a-i,h=[[0,-r],[.5*n,-r+r*s*.35],[n,-r+r*s*.6]],f=-r+r*s*.6+i;for(let e of[.25,.5,.75,1]){let t=-Math.PI/2+e*Math.PI/2;h.push([n+i*Math.cos(t),f+i*Math.sin(t)])}let m=u*a*Math.max(0,1-e/.35);return h.push([a+.4*m,(f+o)/2],[a+m,o]),h},f=(0,el.bothSides)((0,el.loft)(ec.map(e=>({z:ed(e),pts:h(e)})))),m=(0,el.bothSides)((0,el.loft)(ec.map(e=>{let t=h(e)[h(e).length-1][0];return{z:ed(e),pts:[[0,c(e)+.015],[.6*t,c(e)+.01],[t,c(e)]]}}),!0)),p=h(1),v=(0,el.cap)([...p.slice().reverse().map(([e,t])=>[-e,t]),...p.slice(1)],ed(1)),g=(e,t)=>{let a=h(e);for(let e=1;e<a.length;e++)if(t<=a[e][1]){let[r,o]=a[e-1],[i,n]=a[e];return r+(i-r)*(0,el.clamp01)((t-o)/(n-o||1))}return a[a.length-1][0]},y=(0,el.bothSides)((0,el.loft)(ec.slice(1).map(e=>({z:ed(e),pts:[[g(e,-.02)+.006,-.02],[g(e,.06)+.006,.06]]}))));return{body:(0,el.merge)([f,m,v]),dark:y,deckAt:c,beamAt:d,sideX:g,flareAt:e=>u*Math.max(0,1-e/.35)}},ef=(e,t,a,[r,o,i],n=.06)=>{let s=new es.RoundedBoxGeometry(e,t,a,2,Math.max(.001,.99*Math.min(n,e/2,t/2,a/2)));return s.translate(r,o+t/2,i),s},em=(e,t,[a,r,o],i=.12)=>ef(e+.02,i,t+.02,[a,r,o],.02),ep=(e,t,a=0)=>{let r=new l.Shape(e.map(([e,t])=>new l.Vector2(-e,t))),o=new l.ExtrudeGeometry(r,{depth:t,bevelEnabled:!0,bevelThickness:.03,bevelSize:.03,bevelSegments:2});return o.rotateY(Math.PI/2),o.translate(a-t/2,0,0),o},ev=(e,t,[a,r,o],i=16,n=e)=>{let s=new l.CylinderGeometry(n,e,t,i);return s.translate(a,r+t/2,o),s},eg=([e,t,a],r=.6)=>[ev(.03,r,[e,t,a],8,.022),ef(.34,.03,.05,[e,t+.7*r,a],.01),ef(.26,.035,.07,[e,t+r+.02,a],.015)],ey=([e,t,a],r=1)=>[ev(.07,.35,[e,t,a],12,.06),ef(.14,.1,.16,[e,t+.35,a],.03),(0,el.tube)([e,t+.4,a],[e+.55*r,t+.75,a+.25],.025,.018,8)],ex=([e,t,a],r=.32,o=.07,i=0)=>{let n=new l.CapsuleGeometry(o,r,4,10);return n.rotateX(Math.PI/2+i),n.translate(e,t,a),n},eM=([e,t,a],r,o=.32,i=.07)=>{let n=Math.sign(e)||1;return[ex([e,t,a],o,i),(0,el.tube)([e-n*i*1.2,t-i,a-.35*o],[e+n*i*.4,r,a-.35*o],.012,.012,6),(0,el.tube)([e-n*i*1.2,t-i,a+.35*o],[e+n*i*.4,r,a+.35*o],.012,.012,6)]},eb=(e,t,a,r=.12)=>(0,el.bothSides)((0,el.loft)(Array.from({length:17},(o,i)=>{let n=t+i/16*(a-t),s=e.beamAt(n)*(1+.3*e.flareAt(n)),l=e.deckAt(n);return{z:ed(n),pts:[[s-.035,l],[s-.035,l+r],[s,l+r],[s,l]]}}))),ew=(e,t,a,r,o=.09)=>{let i=[];for(let n=0;n<=16;n++){let s=a+n/16*(r-a);i.push(new l.Vector3(e.sideX(s,t)+.6*o,t,ed(s)))}let n=i.map(e=>new l.Vector3(-e.x,e.y,e.z)),s=0===a?[...n.reverse(),...i.slice(1)]:[...i,...n.reverse().slice(1)];return new l.TubeGeometry(new l.CatmullRomCurve3(s),64,o,8,!1)},eS=(e,t,a,r,o)=>(0,el.bothSides)((0,el.loft)(Array.from({length:13},(i,n)=>{let s=t+n/12*(a-t);return{z:ed(s),pts:[[e.sideX(s,r)+.01,r],[e.sideX(s,o)+.01,o]]}}))),eC=(e,t,a)=>new l.Vector3(e,t,a),ej=(e,t,a,r={})=>{let o=(0,eu.makeSailGeometry)({tack:e,head:t,clew:a,camber:.07,draft:.4,twist:.08,leeward:1,rows:8,cols:6,...r});return o.deleteAttribute("uv"),o},eP=({beam:e,mast:t,mizzen:a=0,roof:r=.35,saloon:o=!1,freeboard:i=.55,overhang:n=0})=>{let s=eh({beam:e,draft:.25,freeboard:i,entry:.5,run:.28,transom:.86,bowRise:.1,deadrise:.55,bilge:.25,flare:.1}),l=s.deckAt(.5),u=.62*e,d=[s.body,ep([[-2.3,0],[-1.6,r],[1.2,r],[1.35,0]],u).translate(0,l,0),(0,el.foil)({y:-.15,lead:-.85,chord:.8},{y:-1.55,lead:-.6,chord:.55},.12),ef(.26,.24,1.1,[0,-1.8,-.35],.11),(0,el.foil)({y:0,lead:3.85,chord:.4},{y:-1,lead:3.95,chord:.28},.11)],c=[s.dark,ep([[-2.1,.35*r],[-1.68,.82*r],[1,.82*r],[1.05,.35*r]],u+.03).translate(0,l,0),eS(s,.3,.62,.55*i,.72*i),ep([[1.2,0],[1.4,.9*r],[1.9,.95*r],[2,0]],.85*u).translate(0,l,0)];o&&(d.push(ep([[-.9,0],[-.4,.42],[1.1,.42],[1.2,0]],.9*u).translate(0,l+r,0)),c.push(ep([[-.78,.08],[-.45,.34],[1,.34],[1.05,.08]],.9*u+.03).translate(0,l+r,0)));let h=l+t;return d.push(ev(.07,t,[0,l,-.9],10,.045)),d.push((0,el.tube)([0,l+1,-.9],[0,l+1,2.7],.06)),d.push(ej(eC(0,l+1.1,-.9+.08),eC(0,h-.3,-.9+.08),eC(0,l+1.15,2.6),{headWidth:.4})),d.push(ej(eC(0,l+.15,-4.9-n),eC(0,h-.12*t,-.9-.05),eC(0,l+.6,-.9+1.4))),d.push((0,el.tube)([0,l+.1,-4.95-n],[0,h-.12*t,-.9],.012)),d.push((0,el.tube)([0,h,-.9],[0,l+.1,4.9],.012)),a&&(d.push(ev(.055,a,[0,l,3.2],10,.035)),d.push(ej(eC(0,l+.8,3.2+.06),eC(0,l+a-.2,3.2+.06),eC(0,l+.85,4.9)))),{body:d,dark:c}},ek={30:()=>{let e=eh({beam:2.8,draft:.6,freeboard:.62,entry:.42,run:.2,transom:.82,bowRise:.5,deadrise:.35,bilge:.35,flare:.25}),t=e.deckAt(.45),a=new l.CylinderGeometry(.32,.32,1.2,18);return a.rotateZ(Math.PI/2),a.translate(0,t+.42,2.3),{body:[e.body,eb(e,.12,1,.16),ef(1.8,.45,1.9,[0,t,-1],.06),ep([[-1.85,0],[-1.65,.5],[-.45,.52],[-.4,0]],1.5).translate(0,t+.45,0),...eg([.35,t+.97,-1],.35),ev(.05,1.7,[0,t+.97,-.5],10,.035),(0,el.tube)([0,t+1.4,-.5],[0,t+.55,1.5],.03,.025,8),(0,el.tube)([.7,t+.3,-.3],[.45,t+2.3,-.4],.03,.025,8),(0,el.tube)([-.7,t+.3,-.3],[-.45,t+2.3,-.4],.03,.025,8),a,ef(.25,.42,.25,[-.75,t,2.3],.04),ef(.25,.42,.25,[.75,t,2.3],.04),(0,el.tube)([-1.05,t,4.2],[-.95,t+1.35,4.2],.06),(0,el.tube)([1.05,t,4.2],[.95,t+1.35,4.2],.06),(0,el.tube)([-.95,t+1.35,4.2],[.95,t+1.35,4.2],.06),ev(.12,.22,[-.65,t+.97,-.3],10)],dark:[e.dark,ep([[-1.75,.18],[-1.66,.42],[-.5,.44],[-.47,.18]],1.52).translate(0,t+.45,0),eS(e,.05,.95,e.deckAt(.5)-.12,e.deckAt(.5)-.06)]}},31:()=>{let e=eh({beam:3.5,draft:.75,freeboard:.65,entry:.5,run:.25,transom:.78,bowRise:.35,deadrise:.3,bilge:.5,flare:.15}),t=e.deckAt(.45),a=(0,el.merge)([ew(e,e.deckAt(.1)-.15,0,.22,.13),ew(e,t-.12,.88,1,.1)]);return{body:[e.body,ef(2.4,.65,3,[0,t,-.3],.1),ef(1.9,.8,1.5,[0,t+.65,-.6],.1),ev(.05,1,[0,t+1.45,-.2]),ef(.8,.45,.5,[0,t,3.4],.08),ev(.12,.5,[0,t,2.5]),a,...eg([0,t+1.45,-.2],.55),...((e,t)=>{let a=[];for(let r=0;r<6;r++){let o=.28+r/5*.57;for(let r of[-1,1]){let i=new l.TorusGeometry(.09,.035,6,12);i.rotateY(Math.PI/2),i.translate(r*(e.sideX(o,t)+.03),t,ed(o)),a.push(i)}}return a})(e,t-.12),eb(e,.18,1,.14)],dark:[e.dark,em(1.9,1.5,[0,t+1.05,-.6],.35),em(2.4,3,[0,t+.3,-.3],.08)]}},35:()=>{let e=eh({beam:1.3,draft:.35,freeboard:.6,entry:.42,run:.12,transom:.92,bowRise:.22,deadrise:.3,bilge:.15,flare:.3}),t=e.deckAt(.5),a=new l.ConeGeometry(.24,1.4,4);return a.rotateY(Math.PI/4),a.translate(0,t+1.5,.2),{body:[e.body,ep([[-1.7,0],[-1.15,.82],[1.5,.82],[2.6,0]],1.05).translate(0,t,0),a,ev(.24,.2,[0,t,-2.75],12,.18),(0,el.tube)([0,t+.12,-2.75],[0,t+.18,-3.7],.035),ef(1,.1,1.3,[0,t,3.7],.04),new l.SphereGeometry(.16,14,10).translate(0,t+2.25,.2),ef(.5,.08,.4,[0,t,-2.1],.02),ef(.4,.45,.5,[0,t+.82,.9],.04),ev(.12,.2,[.4,t+.82,1.4],10)],dark:[e.dark,ep([[-1.42,.55],[-1.24,.72],[-.3,.72],[-.3,.55]],1.07).translate(0,t,0)]}},37:()=>{let e=eh({beam:3.1,draft:.38,freeboard:.85,entry:.45,run:.1,transom:.95,bowRise:.28,deadrise:.8,bilge:.14,flare:.3}),t=e.deckAt(.5);return{body:[e.body,ep([[-1.9,0],[-.5,.72],[2.7,.75],[2.85,0]],2.5).translate(0,t,0),ep([[.1,0],[.45,.32],[2.2,.32],[2.3,0]],2).translate(0,t+.75,0),(0,el.tube)([-.9,t+1.07,1.7],[0,t+1.6,1.8],.05),(0,el.tube)([.9,t+1.07,1.7],[0,t+1.6,1.8],.05),ef(2.6,.06,.5,[0,.12,4.85],.02),ef(.6,.04,.25,[0,t+1.62,1.8],.02)],dark:[e.dark,eS(e,.3,.62,.42,.55),ep([[.14,.1],[.38,.3],[.7,.3],[.7,.1]],2.03).translate(0,t+.75,0),ep([[-1.55,.2],[-.62,.66],[2.4,.68],[2.5,.2]],2.53).translate(0,t,0)]}},40:()=>{let e=eh({beam:.72,draft:.3,freeboard:.75,entry:.55,run:.08,transom:.92,bowRise:.08,deadrise:.6,bilge:.1,flare:.05}),t=e=>(0,el.merge)([e.clone().translate(-1.25,0,0),e.clone().translate(1.25,0,0)]);return{body:[t(e.body),ef(3.2,.25,8.4,[0,.55,.5],.08),ep([[-3.6,0],[-2.2,.85],[4.2,.85],[4.45,0]],2.9).translate(0,.8,0),ep([[-1.6,0],[-1.1,.35],[.4,.35],[.5,0]],1.5).translate(0,1.65,0),...eg([0,2,-.2],.4)],dark:[t(e.dark),ep([[-3.2,.35],[-2.35,.75],[4,.75],[4,.35]],2.93).translate(0,.8,0),ep([[-1.45,.12],[-1.15,.3],[.3,.3],[.3,.12]],1.53).translate(0,1.65,0)]}},50:()=>{let e=eh({beam:3,draft:.45,freeboard:.8,entry:.45,run:.12,transom:.9,bowRise:.32,deadrise:.7,bilge:.18,flare:.3}),t=e.deckAt(.5);return{body:[e.body,ep([[-1.2,0],[-.75,1],[1.65,1],[1.8,0]],2.1).translate(0,t,0),ev(.05,1.1,[0,t+1,.7]),ef(1,.1,.14,[0,t+1.9,.7],.03),ef(.3,.035,.07,[0,t+1.2,.2],.015)],dark:[e.dark,eS(e,.1,.95,e.deckAt(.5)-.14,e.deckAt(.5)-.02),ep([[-.95,.55],[-.8,.9],[1.55,.92],[1.6,.55]],2.13).translate(0,t,0)]}},60:()=>{let e=eh({beam:1.5,draft:.3,freeboard:.7,entry:.3,run:.1,transom:.9,bowRise:.12,deadrise:.05,bilge:.15,flare:.22}),t=e.deckAt(.5),a=[e.body,eb(e,0,.18,.1)],r=[e.dark,eS(e,.12,.92,.38,.43),eS(e,.15,.9,.53,.58)],o=t;[[-3,4.75,1.48,.3,.25],[-2.75,4.45,1.46,.28,.3],[-2.45,3.9,1.44,.28,.32],[-2.15,3.2,1.36,.26,.3],[-1.6,2.4,1.1,.22,.25]].forEach(([e,t,i,n,s],l)=>{if(a.push(ep([[e+s,0],[e+.35*s,.35*n],[e,.75*n],[e+.04,n],[t,n],[t,0]],i).translate(0,o,0)),r.push(ep([[e+.55*s-.01,.25*n],[e-.012,.7*n],[t-.12,.7*n],[t-.12,.25*n]],i+.024).translate(0,o,0)),2===l)for(let e of[-1,1])for(let t=0;t<4;t++)a.push(...eM([e*(i/2+.07),o+.1,-.9+.8*t],o+n+.02,.36,.07));3===l&&(a.push(ef(1.6,.06,.32,[0,o+n-.06,e+.25],.02)),r.push(ef(1.38,.08,.06,[0,o+.55*n,e-.01],.01))),o+=n});let i=ep([[1.7,0],[1.95,.55],[2.5,.55],[2.4,0]],.42);for(let[n,s,l]of(i.translate(0,o-.22,0),a.push(i),r.push(ep([[1.92,.47],[1.96,.56],[2.51,.56],[2.49,.47]],.44).translate(0,o-.22,0)),a.push(...eg([0,o,-1],.45)),a.push(ev(.02,.35,[0,e.deckAt(.02),-4.6],8)),[[4.75,1.48,t+.3],[4.45,1.46,t+.58],[3.9,1.44,t+.86]]))a.push(ef(s,.05,.02,[0,l+.05,n-.01],.005));return{body:a,dark:r}},70:()=>{let e=eh({beam:1.5,draft:.45,freeboard:.55,entry:.22,run:.14,transom:.82,bowRise:.18,deadrise:0,bilge:.12,flare:.12}),t=e.deckAt(.5),a=[e.body];for(let r=0;r<7;r++){let o=-3.45+.93*r,i=(o+5)/10,n=Math.min(1.36,2*e.beamAt(i)-.12),s=[2,3,4,4,4,4,3][r],l=Math.max(2,Math.round(n/.27));for(let e=0;e<l;e++){let i=s-((e+r)%3==0),u=-n/2+n/l*(e+.5);a.push(ef(n/l-.025,.12*i,.84,[u,t,o],.015))}}return a.push(ef(1.4,1.05,.62,[0,t,3.55],.06)),a.push(ef(1.62,.1,.36,[0,t+1.05,3.4],.03)),a.push(ef(.34,.42,.3,[0,t+1,3.72],.08)),a.push(ef(1,.16,.55,[0,e.deckAt(.03)-.02,-4.4],.05)),a.push(...eg([0,t+1.15,3.4],.45)),a.push(ev(.025,.55,[0,e.deckAt(.03)+.14,-4.3],8)),a.push(...ey([.55,t+.5,-1.2],1),...ey([-.55,t+.5,1.6],-1)),a.push(...eM([.78,t+.5,3.6],t+.66),...eM([-.78,t+.5,3.6],t+.66)),{body:a,dark:[e.dark,eS(e,.05,.95,.42,.47),em(1.64,.38,[0,t+1.06,3.4],.07),em(1.4,.62,[0,t+.9,3.55]),em(1.4,.62,[0,t+.62,3.55],.06),em(1.4,.62,[0,t+.38,3.55],.06),ef(.36,.08,.32,[0,t+1.38,3.72],.04)]}},80:()=>{let e=eh({beam:1.7,draft:.5,freeboard:.42,entry:.24,run:.12,transom:.84,bowRise:.14,deadrise:0,bilge:.12,flare:.1}),t=e.deckAt(.5),a=[e.body,ef(.9,.12,6.4,[0,t,-.7],.04),ef(1.5,1,.85,[0,t,3.65],.08),ef(1.72,.08,.35,[0,t+1,3.5],.03),ef(.4,.42,.32,[0,t+.95,3.85],.08),ef(.9,.14,.6,[0,e.deckAt(.03)-.02,-4.35],.05),ev(.035,.7,[0,t+.12,-.6]),(0,el.tube)([0,t+.8,-.6],[.6,t+.55,-.2],.025)];for(let e of[-.25,0,.25])a.push((0,el.tube)([e,t+.17,-3.8],[e,t+.17,2.9],.03,.03,8));for(let e=0;e<6;e++)a.push(ef(.06,.06,.06,[.42,t+.12,-3.5+1.2*e],.02));a.push(ef(.12,.05,6.6,[-.45,t+.3,-.6],.02));for(let e=0;e<7;e++)a.push(ev(.012,.18,[-.45,t+.12,-3.6+1.1*e],6));for(let r of(a.push(...eg([0,t+1.08,3.6],.5)),a.push(...ey([.6,t+.12,-.2],1)),a.push(ef(.24,.05,.42,[0,t+.18,4.35],.02)),a.push(ex([0,t+.32,4.36],.28,.075,-.3)),[-4,4.2]))for(let t of[-1,1])a.push(ev(.05,.08,[.45*t,e.deckAt((r+5)/10),r],10));return{body:a,dark:[e.dark,eS(e,.05,.95,.32,.37),em(1.74,.37,[0,t+1,3.5],.06),em(1.5,.85,[0,t+.85,3.65]),em(1.5,.85,[0,t+.58,3.65],.06),em(1.5,.85,[0,t+.34,3.65],.06),ef(.42,.08,.34,[0,t+1.33,3.85],.04)]}},"36s":()=>eP({beam:3,mast:12.5,roof:.3}),"36m":()=>eP({beam:3.3,mast:13.8,roof:.36}),"36k":()=>eP({beam:2.9,mast:12,mizzen:8,roof:.3,saloon:!0,freeboard:.5,overhang:.4}),"36y":()=>eP({beam:2.4,mast:14.5,roof:.28,saloon:!0,freeboard:.5}),"36c":()=>{let e=eh({beam:1.25,draft:.2,freeboard:.72,entry:.5,run:.1,transom:.92,bowRise:.08,deadrise:.6,bilge:.25,flare:.05}),t=e=>(0,el.merge)([e.clone().translate(-2,0,0),e.clone().translate(2,0,0)]),a=[t(e.body),ef(3.6,.3,6.5,[0,.47,1.4],.1),ep([[-1.8,0],[-1,.65],[2.4,.68],[2.4,0]],3.4).translate(0,.77,0),ef(3.4,.06,1.6,[0,1.45,3.2],.03),...[-1,1].flatMap(e=>[4,2.5].map(t=>ev(.035,.68,[1.6*e,.77,t],8))),(0,el.tube)([-2,.72,-3.6],[2,.72,-3.6],.07),ev(.08,15,[0,.77,-1.7],10,.05),(0,el.tube)([0,1.72,-1.7],[0,1.72,2.6],.06),ej(eC(0,1.82,-1.62),eC(0,15.42,-1.62),eC(0,.72+1.15,2.5),{headWidth:.6}),ej(eC(0,.82,-3.6),eC(0,13.72,-1.75),eC(0,1.42,-.6))],r=[t(e.dark),ep([[-1.6,.18],[-1.05,.58],[2.2,.6],[2.25,.18]],3.43).translate(0,.77,0)];for(let t of[-1,1])r.push(eS(e,.3,.7,.42,.55).translate(2*t,0,0));return{body:a,dark:r}}},eT=new Map;Object.keys(ek);let eA={normal:new l.MeshStandardMaterial({color:9080983,roughness:.5,metalness:.05,side:l.DoubleSide}),alert:new l.MeshStandardMaterial({color:0xd2504f,roughness:.6,metalness:0,side:l.DoubleSide,transparent:!0,opacity:.88}),selected:new l.MeshStandardMaterial({color:638975,roughness:.5,metalness:.05,side:l.DoubleSide}),yields:new l.MeshStandardMaterial({color:9406153,roughness:.6,metalness:0,side:l.DoubleSide,transparent:!0,opacity:.88}),close:new l.MeshStandardMaterial({color:0xd9a066,roughness:.6,metalness:0,side:l.DoubleSide,transparent:!0,opacity:.88})},eD=new l.MeshStandardMaterial({color:2501683,roughness:.6,metalness:0});function ez({code:e,scaleFactor:t,beamRatio:a}){let o=(e=>{if(!eT.has(e)){let t=(ek[e]||ek[70])(),a=(0,el.merge)(t.body),r=(0,el.merge)(t.dark);t.body[0].computeBoundingBox();let o=t.body[0].boundingBox;eT.set(e,{body:a,dark:r,beamRatio:(0,el.clamp01)((o.max.x-o.min.x)/10)||.25})}return eT.get(e)})(e),i=a?a/o.beamRatio:1;return(0,r.jsxs)("group",{scale:[t*i,t,t],children:[(0,r.jsx)("mesh",{geometry:o.body,material:eA.normal}),(0,r.jsx)("mesh",{geometry:o.dark,material:eD,userData:{fixed:!0}})]})}let eF=e=>.7*Math.max(e||10,4),eE=new l.MeshBasicMaterial({colorWrite:!1,depthWrite:!1}),eR=({boatData:e,onClick:t,ref:a})=>{let{length:o,beam:i}=e,n=((e,t,a)=>{let r=Number(e);if(30===r)return 30;if(r>=31&&r<=32)return 31;if(r>=33&&r<=35)return 35;if(36===r)return t>0&&a>0&&a/t>.38?"36c":!(t>0)||t<9?"36s":t<15?"36m":t<24?"36k":"36y";if(37===r)return 37;if(r>=40&&r<=49)return 40;if(r>=50&&r<=59)return 50;if(r>=60&&r<=69)return 60;if(r>=70&&r<=79)return 70;if(r>=80&&r<=89)return 80;if(Number.isFinite(t)&&t>0){if(t<20)return 37;if(t<60)return 50}return 70})(e.shipType,o,i),s=eF(o)/10,l=o>0&&i>0?i/o:null,u=Math.max(1.2*eF(o),8);return(0,r.jsxs)("group",{ref:a,onClick:a=>{a.stopPropagation(),t&&t(e.mmsi)},children:[(0,r.jsx)(ez,{code:n,scaleFactor:s,beamRatio:l>=.08&&l<=.6?l:null}),(0,r.jsx)("mesh",{position:[0,u/4,0],material:eE,userData:{fixed:!0},children:(0,r.jsx)("boxGeometry",{args:[u,u/2,u]})})]})},eI=40*Math.PI/180,e_=({x:e,z:t,course:a,turn:o,color:i})=>{let n,s=[],u=a,d=e+6*Math.sin(a),c=t-6*Math.cos(a);for(let e=0;e<=16;e++)s.push([d,.4,c]),d+=30*Math.sin(u=a+o*eI*((e+1)/16))/16,c-=30*Math.cos(u)/16;let[h,,f]=s[s.length-1];return(0,r.jsxs)("group",{children:[(0,r.jsx)(eo.Line,{points:s,color:i,lineWidth:5,transparent:!0,opacity:.7}),(0,r.jsx)("group",{position:[h,.4,f],rotation:[0,-u,0],children:(0,r.jsxs)("mesh",{rotation:[-Math.PI/2,0,0],children:[(0,r.jsx)("shapeGeometry",{args:[((n=new l.Shape).moveTo(0,3.2),n.lineTo(-2,-.6),n.lineTo(2,-.6),n.closePath(),n)]}),(0,r.jsx)("meshBasicMaterial",{color:i,transparent:!0,opacity:.75,depthWrite:!1,side:l.DoubleSide})]})})]})},eB=({name:e,color:t})=>{let a=(0,o.useRef)(null);return(0,o.useEffect)(()=>{let e=()=>{let e=a.current;if(!e)return;let t=e.getBoundingClientRect(),r=[...document.querySelectorAll("[data-hud-solid]")].some(e=>{let a;return null!==e.offsetParent&&(a=e.getBoundingClientRect(),t.left<a.right&&t.right>a.left&&t.top<a.bottom&&t.bottom>a.top)});e.style.visibility=r?"hidden":"visible"};e();let t=setInterval(e,250);return()=>clearInterval(t)},[a]),(0,r.jsx)("div",{ref:a,className:"whitespace-nowrap max-w-[9rem] truncate px-2 py-0.5 rounded-full text-caption font-semibold text-white backdrop-blur-sm",style:{background:`color-mix(in srgb, ${t} 72%, transparent)`},children:e})},eL=()=>{let{scene:e}=(0,V.default)(),{encounters:t}=(0,en.default)();return t.slice(0,5).map(({target:t,role:a})=>{let o="stand-on"===a.ownRole||"both"===a.ownRole,i=t.cog??t.cogMagnetic??t.heading??0,s=o?e.vesselYields:e.vesselDanger,l=a.targetTurn||1;return(0,r.jsxs)("group",{children:[(0,r.jsx)(n.Html,{position:[t.sceneX,12,t.sceneZ],center:!0,zIndexRange:[15,10],style:{pointerEvents:"none"},children:(0,r.jsx)(eB,{name:t.name,color:s})}),o&&(0,r.jsx)(e_,{x:t.sceneX,z:t.sceneZ,course:i,turn:l,color:s})]},t.mmsi)})},eN=new l.Vector3,eW=new l.Quaternion,eU=new l.Euler,eG={chart:-.1,meteo:-.1},eO=e=>{let t=[];return e.traverse(e=>{e.isMesh&&!e.userData.fixed&&t.push(e)}),t},eV=(e,t,a,r,o)=>{let{x:i,z:n}=(0,ei.predictScenePosition)(t,r,o);eN.set(i,0,n),e.position.lerp(eN,a),eU.set(0,-t.rotationAngleY,0),eW.setFromEuler(eU),e.quaternion.slerp(eW,a)},eH=({targets:e,statuses:t,colors:a})=>(0,o.useMemo)(()=>e.filter(e=>"danger"===e.risk&&e.cpaScene&&e.visible).slice(0,5).map(e=>({mmsi:e.mmsi,sceneX:e.sceneX,sceneZ:e.sceneZ,cpaScene:{...e.cpaScene}})),[e]).map(e=>{let o=e.cpaScene,i="yields"===t[e.mmsi]?a.yields:a.giveWay;return(0,r.jsxs)("group",{children:[(0,r.jsx)(eo.Line,{points:[[e.sceneX,.3,e.sceneZ],[o.targetX,.3,o.targetZ]],color:i,lineWidth:2,dashed:!0,dashSize:3,gapSize:2.5,transparent:!0,opacity:.9}),(0,r.jsx)(eo.Line,{points:[[0,.3,0],[o.ownX,.3,o.ownZ]],color:i,lineWidth:1.5,dashed:!0,dashSize:2,gapSize:3,transparent:!0,opacity:.6}),(0,r.jsxs)("mesh",{position:[o.targetX,.25,o.targetZ],rotation:[-Math.PI/2,0,0],children:[(0,r.jsx)("ringGeometry",{args:[2.2,3,32]}),(0,r.jsx)("meshBasicMaterial",{color:i,transparent:!0,opacity:.8,depthWrite:!1})]})]},e.mmsi)}),e$=({onUpdateInfoPanel:e,selectedMmsi:t=null})=>{let{aisData:a,vesselIds:i,targets:n,targetsRef:s,motionRef:l}=(0,ei.useAIS)(),{states:u}=(0,k.useOcearoContext)(),d=eG[u.oceanMode]??-.3,c=(0,o.useRef)({}),f=(0,o.useRef)({}),{scene:m}=(0,V.default)();(0,o.useEffect)(()=>{eA.normal.color.set(m.vessel),eA.alert.color.set(m.vesselDanger),eA.yields.color.set(m.vesselYields),eA.close.color.set(m.vesselClose),eA.selected.color.set(m.route)},[m]);let p=(0,o.useRef)(null),{statuses:v}=(0,en.default)(),g=(0,o.useRef)({});(0,o.useEffect)(()=>{g.current=v},[v]),(0,o.useEffect)(()=>{p.current=t},[t]);let y=(0,o.useMemo)(()=>["navigation.headingTrue","navigation.headingMagnetic","navigation.courseOverGroundTrue","navigation.courseOverGroundMagnetic"],[]),x=(0,h.useSignalKPaths)(y),M=(0,o.useMemo)(()=>{let e=x["navigation.headingTrue"]??x["navigation.headingMagnetic"],t=x["navigation.courseOverGroundTrue"]??x["navigation.courseOverGroundMagnetic"];return e??t??0},[x]);(0,b.useFrame)((e,t)=>{let a=1-Math.exp(-4*Math.min(t,.5)),r=s.current,o=l.current,i=Date.now();for(let e in c.current){let t=c.current[e],n=r[e];if(!t)continue;if(!n||!n.visible){t.visible=!1;continue}t.visible=!0,eV(t,n,a,o,i);let s=g.current[e],l="giveWay"===s?"alert":"yields"===s?"yields":p.current===e?"selected":"close"===s?"close":"normal",u=f.current[e];if(!u||0===u.length){if(0===(u=eO(t)).length)continue;f.current[e]=u,t.userData.look=void 0}if(l!==t.userData.look){let e=eA[l];for(let t of u)t.material=e;t.userData.look=l}}});let w=(0,o.useCallback)(t=>{e?.(e=>e?.kind==="ais"&&e.mmsi===t?null:{kind:"ais",mmsi:t})},[e]),S=(0,o.useRef)({}),C=(0,o.useCallback)(e=>(S.current[e]||(S.current[e]=t=>{if(t){let a=s.current[e];t.userData.mmsi=e,t.position.set(a?.sceneX??0,0,a?.sceneZ??0),t.rotation.set(0,-(a?.rotationAngleY??0),0),c.current[e]=t}else delete c.current[e],delete f.current[e],delete S.current[e]}),S.current[e]),[s]),j=(0,o.useMemo)(()=>i.slice(0,50).map(e=>(0,r.jsx)(eR,{ref:C(e.mmsi),boatData:e,onClick:w},e.mmsi)),[i,w,C]);return(0,o.useEffect)(()=>{f.current={}},[i]),(0,r.jsx)(r.Fragment,{children:(0,r.jsxs)("group",{rotation:[0,M,0],position:[0,d,0],children:[j,(0,r.jsx)(eH,{targets:n,statuses:v,colors:{giveWay:m.vesselDanger,yields:m.vesselYields}}),(0,r.jsx)(eL,{})]})})};var eZ=e.i(20840),eX=e.i(16196),eK=e.i(97776),eq=e.i(20705),eY=e.i(52260);let eQ={red:"#c8102e",green:"#00843d",yellow:"#f2c200",black:"#1b1b1b",white:"#f0f0f0",orange:"#f07c00",blue:"#1f4fa0",grey:"#8a8a8a",brown:"#6b4a2b"},eJ={north:{colours:["black","yellow"],topmark:"2 cones up"},south:{colours:["yellow","black"],topmark:"2 cones down"},east:{colours:["black","yellow","black"],topmark:"2 cones base together"},west:{colours:["yellow","black","yellow"],topmark:"2 cones point together"}},e0=(e,t)=>{let a=new l.Color(eQ[e]||eQ.grey);if(!t)return a;let r=.25+.75*(.299*a.r+.587*a.g+.114*a.b);return new l.Color(r,.36*r,.28*r)},e1=(e,t,a,r)=>{let o=e.index?e.toNonIndexed():e;o.deleteAttribute("uv");let i=o.attributes.position,n=new Float32Array(3*i.count);for(let e=0;e<i.count;e+=3){let o=(i.getX(e)+i.getX(e+1)+i.getX(e+2))/3,s=[i.getY(e),i.getY(e+1),i.getY(e+2)],u=(Math.min(...s)+Math.max(...s))/2,d=(i.getZ(e)+i.getZ(e+1)+i.getZ(e+2))/3,c=t(l.MathUtils.clamp((u-a)/Math.max(1e-6,r-a),0,.9999),Math.atan2(d,o)+Math.PI);for(let t=0;t<3;t++)n.set([c.r,c.g,c.b],(e+t)*3)}return o.setAttribute("color",new l.BufferAttribute(n,3)),o},e2=(e,t,a=0,r=0)=>(a&&e.rotateX(a),r&&e.rotateZ(r),e.translate(0,t,0),e),e5=(e,t)=>e2(new l.ConeGeometry(.42,.62,16),e+.31,t?0:Math.PI),e3=e=>e2(new l.SphereGeometry(.32,14,10),e+.32),e4=new Map,e6={Q:1,IQ:1,VQ:.5,IVQ:.5,UQ:.25,IUQ:.25},e8=e=>+(Math.max(1,e/80)**.5),e7=["navigation.position","navigation.speedOverGround","navigation.courseOverGroundTrue"],e9={white:"#fff6dc",red:"#ff3b30",green:"#30ff7a",yellow:"#ffd23a",blue:"#4aa3ff"},te=({waterLevel:e=-.3})=>{let t=!1!==d.default.get("showSeamarks3D"),a=!1!==d.default.get("seamarksOverpass"),i=d.default.get("aisLengthScalingFactor")||.7,{convertLatLonToXY:n}=(0,k.useOcearoContext)(),{id:s,scene:u}=(0,V.default)(),c="night"===s,{heading:m,offset:p,hasFix:v}=(0,f.default)(),g=(0,h.useSignalKPaths)(e7),y=g["navigation.position"],x=g["navigation.speedOverGround"],M=g["navigation.courseOverGroundTrue"],w=((e,t,a)=>{let[r,i]=(0,o.useState)({}),n=(0,o.useRef)(new Set),s=Number.isFinite(e)?Math.round(100*e)/100:null,l=Number.isFinite(t)?Math.round(100*t)/100:null,u=(0,o.useMemo)(()=>a&&null!==s&&null!==l?(0,eK.cellsAround)(s,l,5556):[],[a,s,l]),[d,c]=(0,o.useState)(0),h=(0,o.useRef)(!0),f=(0,o.useRef)(null);return(0,o.useEffect)(()=>()=>{h.current=!1,clearTimeout(f.current)},[]),(0,o.useEffect)(()=>{let e=u.filter(e=>!(e.key in r)&&!n.current.has(e.key));e.length&&(e.forEach(e=>n.current.add(e.key)),(0,eK.loadCells)(e).then(t=>{e.forEach(e=>n.current.delete(e.key)),h.current&&(Object.keys(t).length&&i(e=>({...e,...t})),e.some(e=>!(e.key in t))&&(clearTimeout(f.current),f.current=setTimeout(()=>c(e=>e+1),12e4)))}))},[u,r,d]),(0,o.useMemo)(()=>u.flatMap(e=>r[e.key]||[]),[u,r])})(y?.latitude,y?.longitude,t&&a&&v),{atons:S}=(0,ei.useAIS)({passive:!t}),C=S.map(e=>`${e.id}|${e.latitude}|${e.longitude}|${e.atonType}|${e.virtual}|${e.offPosition}|${e.name}`).join(","),j=(0,o.useRef)(S);j.current=S;let P=(0,o.useMemo)(()=>(0,eq.mergeAtons)(w,j.current),[w,C]),T=(0,o.useMemo)(()=>{let e=(0,f.getSessionOrigin)();if(!e)return[];let t=new Set;return P.filter(e=>!t.has(e.id)&&t.add(e.id)).map(t=>{let{x:a,y:r}=n({lat:t.lat,lon:t.lon},e);return{...t,x:a,y:r}})},[P,n]),A=50*Math.round(p.x/50),D=50*Math.round(p.y/50),z=(0,o.useMemo)(()=>T.map(e=>({m:e,d:Math.hypot(e.x-A,e.y-D)})).filter(({d:e})=>e<=5556).sort((e,t)=>e.d-t.d).slice(0,120).map(({m:e,d:t})=>({...e,d:t})),[T,A,D]),F=(0,o.useMemo)(()=>new l.MeshStandardMaterial({vertexColors:!0,roughness:.55,metalness:.05}),[]),E=(0,o.useMemo)(()=>new l.MeshStandardMaterial({vertexColors:!0,roughness:.55,transparent:!0,opacity:.38,depthWrite:!1}),[]),R=(0,o.useMemo)(()=>{let e,t,a;return(e=document.createElement("canvas")).width=64,e.height=64,(a=(t=e.getContext("2d")).createRadialGradient(32,32,0,32,32,32)).addColorStop(0,"rgba(255,255,255,1)"),a.addColorStop(.2,"rgba(255,255,255,0.85)"),a.addColorStop(.5,"rgba(255,255,255,0.25)"),a.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=a,t.fillRect(0,0,64,64),new l.CanvasTexture(e)},[]),I=(0,o.useMemo)(()=>Object.fromEntries(Object.entries(e9).map(([e,t])=>[e,new l.SpriteMaterial({map:R,color:c?"#ff6a50":t,blending:l.AdditiveBlending,transparent:!0,depthWrite:!1,toneMapped:!1,fog:!1})])),[c,R]);(0,o.useEffect)(()=>()=>Object.values(I).forEach(e=>e.dispose()),[I]),(0,o.useEffect)(()=>()=>{F.dispose(),E.dispose(),R.dispose()},[F,E,R]);let L=(0,o.useMemo)(()=>z.map(e=>{let{geometry:t,lightY:a}=((e,t)=>{let a=JSON.stringify([e,t]);if(e4.has(a))return e4.get(a);let{parts:r,top:o}=(({beacon:e,shape:t,height:a})=>{if(e){let e=l.MathUtils.clamp(a||0,0,12)||("tower"===t?8:5);if("tower"===t||"lattice"===t)return{parts:[e2(new l.CylinderGeometry(.9,1.3,e,16,12),e/2)],top:e};if("cairn"===t)return{parts:[e2(new l.ConeGeometry(1.6,2.6,12,12),1.3)],top:2.6};let r="pile"===t?.35:.14;return{parts:[e2(new l.CylinderGeometry(r,r,e,10,12),e/2)],top:e}}switch(t){case"can":return{parts:[e2(new l.CylinderGeometry(.75,.75,1.5,20,12),.75)],top:1.5};case"conical":return{parts:[e2(new l.CylinderGeometry(.9,.9,.3,20,12),.15),e2(new l.ConeGeometry(.9,1.7,20,12),1.15)],top:2};case"spherical":return{parts:[e2(new l.SphereGeometry(.85,20,12),.6)],top:1.45};case"spar":return{parts:[e2(new l.CylinderGeometry(.22,.22,4,10,12),2)],top:4};case"barrel":return{parts:[e2(new l.CylinderGeometry(.6,.6,1.6,16,12),.45,0,Math.PI/2)],top:1.05};case"super-buoy":return{parts:[e2(new l.CylinderGeometry(2,2,1.2,24,12),.6)],top:1.2};default:return{parts:[e2(new l.CylinderGeometry(1,1,.5,20,12),.25),e2(new l.CylinderGeometry(.3,.45,2.8,14,12),1.9)],top:3.3}}})(e),i=e.colours.map(e=>e0(e,t)),n="vertical"===e.pattern&&i.length>1,s=(e,t)=>n?i[Math.floor(t/(2*Math.PI)*i.length*2)%i.length]:i[Math.min(i.length-1,Math.floor((1-e)*i.length))],u=r.map(e=>e1(e,s,0,o)),[d,c]=((e,t)=>{if(e.includes("2 cones"))return e.includes("up")?[[e5(t,!0),e5(t+.62+.12,!0)],t+1.24+.12]:e.includes("down")?[[e5(t,!1),e5(t+.62+.12,!1)],t+1.24+.12]:e.includes("base")?[[e5(t,!1),e5(t+.62,!0)],t+1.24]:[[e5(t,!0),e5(t+.62,!1)],t+1.24];if(e.includes("cone"))return[[e5(t,!e.includes("down"))],t+.62];if(e.includes("2 spheres"))return[[e3(t),e3(t+.64+.12)],t+1.28+.12];if(e.includes("sphere"))return[[e3(t)],t+.64];if(e.includes("cylinder")||"can"===e)return[[e2(new l.CylinderGeometry(.32,.32,.6,14),t+.3)],t+.6];if(e.includes("x")||e.includes("cross")||e.includes("saltire")){let e=e=>e2(new l.BoxGeometry(.9,.14,.14),t+.4,0,e);return[[e(Math.PI/4),e(-Math.PI/4)],t+.8]}return e.includes("square")||e.includes("board")||e.includes("rectangle")||e.includes("cube")?[[e2(new l.BoxGeometry(.6,.6,.6),t+.3)],t+.6]:[[],t]})(e.topmark,o+.35),h=e0(e.topColours[0]||"black",t),f=[...u,...d.map(e=>e1(e,()=>h,0,1))];d.length&&f.push(e1(e2(new l.CylinderGeometry(.05,.05,.35+.1,6),o+.175),()=>h,0,1));let m=(0,eY.mergeGeometries)(f);f.forEach(e=>e.dispose());let p={geometry:m,lightY:Math.max(c,o)+.25};return e4.set(a,p),p})((e=>{let{kind:t,category:a,system:r}=e,o=e.colours,i=e.pattern||"horizontal",n=e.topmark?.shape||"",s=e.topmark?.colours||[],l=e.shape;if("cardinal"===t){let e=eJ[a]||eJ.north;o.length||(o=e.colours),n||(n=e.topmark),s.length||(s=["black"]),l=l||"pillar"}else if("lateral"===t){let e,t,i=!a.includes("starboard")||a.startsWith("preferred_channel_port");o.length||(e="iala-b"===r?"green":"red",t="iala-b"===r?"red":"green",o=a.startsWith("preferred_channel_port")?[t,e,t]:a.startsWith("preferred_channel_starboard")?[e,t,e]:["starboard"===a?t:e]),n||(n=i?"cylinder":"cone, point up"),s.length||(s=[o[0]]),l=l||(i?"can":"conical")}else"isolated_danger"===t?(o.length||(o=["black","red","black"]),n||(n="2 spheres"),s.length||(s=["black"]),l=l||"pillar"):"safe_water"===t?(o.length||(o=["red","white"],i="vertical"),n||(n="sphere"),s.length||(s=["red"]),l=l||"pillar"):"station"===t?(o.length||(o=["grey"]),s=[],l=l||"pile"):(o.length||(o=["yellow"]),n||(n="x-shape"),s.length||(s=["yellow"]),l=l||"pillar");return{beacon:e.beacon,shape:l,colours:o,pattern:i,topmark:n,topColours:s,height:e.height}})(e),c),r=e.light?(({character:e,group:t,period:a},r=!1)=>{let[o,...i]=String(e||"").split("+"),n=r||i.some(e=>/LFl/.test(e))||/LFl/.test(String(t)),s=o.replace(/[^A-Za-z.]/g,""),l=s.split(".").pop(),u=Math.max(1,parseInt(t,10)||1),d=[],c=Number.isFinite(a)&&a>0?a:null;if("F"===l)return null;if(e6[s]||e6[l]){let e=e6[s]||e6[l],a=parseInt(t,10)?u:n?6:c?Math.round(c/e):1;for(let t=0;t<a;t++)d.push([.35*e,.65*e]);n&&d.push([2,1]),c=c||a*e}else if("Iso"===l)c=c||4,d.push([c/2,c/2]);else if("Oc"===l){c=c||4;for(let e=0;e<u;e++)d.push([+(0!==e),1])}else if("LFl"===l){c=c||10;for(let e=0;e<u;e++)d.push([2,1.5])}else if("Mo"===l)c=c||8,d.push([1.5,.5]);else{c=c||(1===u?5:1.5*u+4);for(let e=0;e<u;e++)d.push([.5,1])}let h=d.reduce((e,[t,a])=>e+t+a,0);return{steps:d,rest:Math.max(0,c-h),restOn:"Oc"===l,period:Math.max(c,h)}})(e.light,"cardinal"===e.kind&&"south"===e.category):null,o=[...String(e.id)].reduce((e,t)=>(31*e+t.charCodeAt(0))%997,7)/997*(r?.period||1);return{m:e,geometry:t,lightY:a,sequence:r,phase:o,hasLight:!!e.light}}),[z,c]),N=(0,o.useRef)({x:0,y:0,at:0,init:!1}),W=(0,o.useRef)({x:0,y:0});(0,o.useEffect)(()=>{N.current={x:p.x,y:p.y,at:performance.now()/1e3,init:!0}},[p]);let U=Number.isFinite(y?.latitude)?Math.round(10*y.latitude)/10:null,G=Number.isFinite(y?.longitude)?Math.round(10*y.longitude)/10:null,[O,H]=(0,o.useState)(!1);(0,o.useEffect)(()=>{let e=()=>{let e=(0,B.sunPosition)(U,G,(0,_.vesselNow)());H(!!e&&e.elevation<2)};e();let t=setInterval(e,6e4);return()=>clearInterval(t)},[U,G]);let $=(0,o.useRef)(),Z=(0,o.useRef)([]),X=(0,o.useRef)([]),K="day"!==s&&O;(0,b.useFrame)((e,t)=>{let a=N.current,r=W.current;if(!a.init||!$.current)return;let o=Math.min(t,.1),n=Number.isFinite(x)?x:0,s=Number.isFinite(M)?M:m,l=Math.sin(s)*n,u=Math.cos(s)*n,d=Math.min(3,performance.now()/1e3-a.at),c=a.x+l*d,h=a.y+u*d;Math.hypot(c-r.x,h-r.y)>60&&(r.x=c,r.y=h),r.x+=l*o+(c-r.x-l*o)*Math.min(1,3*o),r.y+=u*o+(h-r.y-u*o)*Math.min(1,3*o),$.current.position.set(-r.x*i,0,r.y*i);let f=e.clock.elapsedTime;L.forEach((e,t)=>{let a=Z.current[t];if(!a)return;let o=Math.hypot(e.m.x-r.x,e.m.y-r.y)*i;a.scale.setScalar(i*e8(o));let n=X.current[t];n&&(n.visible=K&&((e,t)=>{if(!e)return!0;let a=(t%e.period+e.period)%e.period;for(let[t,r]of e.steps){if(a<t)return!0;if((a-=t)<r)return!1;a-=r}return e.restOn})(e.sequence,f+e.phase))})});let q=(0,o.useMemo)(()=>L.filter(e=>(e.m.name||e.m.ais)&&e.m.d*i<=900).slice(0,8).map(e=>({...e,text:[e.m.name,e.m.ais&&(e.m.virtual?"V-AIS":"AIS")].filter(Boolean).join(" · ")})),[L,i]);return t&&L.length?(0,r.jsx)("group",{rotation:[0,m,0],position:[0,e,0],children:(0,r.jsxs)("group",{ref:$,children:[L.map((e,t)=>(0,r.jsxs)("group",{position:[e.m.x*i,0,-e.m.y*i],ref:e=>{Z.current[t]=e},children:[(0,r.jsx)("mesh",{geometry:e.geometry,material:e.m.virtual?E:F}),e.hasLight&&(0,r.jsx)("sprite",{material:I[e.m.light.colour]||I.white,position:[0,e.lightY,0],scale:[3.4,3.4,1],ref:e=>{X.current[t]=e}})]},e.m.id)),q.map(e=>{let t=e8(e.m.d*i);return(0,r.jsx)(eZ.Billboard,{position:[e.m.x*i,(e.lightY+1)*i*t,-e.m.y*i],children:(0,r.jsx)(eX.Text,{fontSize:.9*t,color:u.compass,fillOpacity:.8,font:"fonts/Roboto-Bold.ttf",anchorX:"center",anchorY:"bottom",outlineWidth:.04*t,outlineColor:u.compassFace,children:e.text})},`label-${e.m.id}`)})]})}):null};var tt=e.i(31067);function ta(e,t){let a=e+"Geometry";return o.forwardRef(({args:e,children:r,...i},n)=>{let s=o.useRef(null);return o.useImperativeHandle(n,()=>s.current),o.useLayoutEffect(()=>void(null==t||t(s.current))),o.createElement("mesh",(0,tt.default)({ref:s},i),o.createElement(a,{attach:"geometry",args:e}),r)})}let tr=ta("sphere"),to=ta("ring"),ti=o.default.memo(({radius:e,isOuter:t,markerColorPrimary:a,markerColorGreen:i,markerColorRed:n})=>{let s=(0,o.useMemo)(()=>{let o=[];for(let s=0;s<360;s+=10){let u=l.MathUtils.degToRad(s-90),d=s%30==0,c=t?d?.35:.15:d?.25:.1,h=(e+.5*c+.2)*Math.cos(u),f=(e+.5*c+.2)*Math.sin(u),m=t&&s>0&&s<61,p=t&&s>=300&&s<360,v=m?i:p?n:a;if(!t&&d){let e;e=0===s?"N":90===s?"E":180===s?"S":270===s?"W":s.toString(),o.push((0,r.jsx)(eX.Text,{characters:"NESW0123456789",position:[h,.02,f],color:a,fontSize:.6,rotation:[-Math.PI/2,0,Math.PI/2-u],font:"fonts/Roboto-Bold.ttf",anchorY:"middle",fillOpacity:.9,children:e},`text-${s}`))}else o.push((0,r.jsx)(tr,{args:[c/2,16,16],position:[h,0,f],children:(0,r.jsx)("meshBasicMaterial",{color:v,transparent:!0,opacity:d?.8:.4})},`marker-${t?"outer":"inner"}-${s}`))}return o},[e,t,a,i,n]);return(0,r.jsx)(r.Fragment,{children:s})});ti.displayName="StaticMarkers";let tn=o.default.memo(({innerRadius:e,outerRadius:t,dialColor:a,opacity:o=1,transparent:i=!1})=>(0,r.jsx)(to,{args:[e,t,64],rotation:[Math.PI/2,0,0],children:(0,r.jsx)("meshBasicMaterial",{color:a,side:l.DoubleSide,transparent:i,opacity:o,depthWrite:!1})}));tn.displayName="StaticRing";let ts=({outerRadius:e,innerRadius:t})=>{let{scene:a}=(0,V.default)(),i=a.compass,n=a.laylineStarboard,s=a.laylinePort,l=(0,o.useMemo)(()=>["navigation.headingTrue","navigation.headingMagnetic","navigation.courseOverGroundTrue","navigation.courseOverGroundMagnetic"],[]),u=(0,h.useSignalKPaths)(l),c=(0,o.useMemo)(()=>{let e=d.default.get("preferredHeadingPath")||"courseOverGroundTrue",t=u[`navigation.${e}`];if(null!=t)return t;let a=u["navigation.headingTrue"]||u["navigation.headingMagnetic"];return u["navigation.courseOverGroundTrue"]||u["navigation.courseOverGroundMagnetic"]||a||0},[u]),f=a.compassFace,m=d.default.get("compassNorthUp"),p=(0,o.useMemo)(()=>({innerRadius:t,outerRadius:e,dialColor:f,markerColorPrimary:i,markerColorGreen:n,markerColorRed:s}),[t,e,f,i,n,s]);return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)("group",{rotation:[0,c+(m?0:Math.PI),0],children:[(0,r.jsx)(tn,{innerRadius:p.innerRadius,outerRadius:p.outerRadius,dialColor:p.dialColor,transparent:!0,opacity:.1}),(0,r.jsx)(ti,{radius:p.innerRadius,isOuter:!1,markerColorPrimary:p.markerColorPrimary,markerColorGreen:p.markerColorGreen,markerColorRed:p.markerColorRed})]}),(0,r.jsxs)("group",{children:[(0,r.jsx)(tn,{innerRadius:p.innerRadius+.8,outerRadius:p.outerRadius+.8,dialColor:p.dialColor,transparent:!0,opacity:.15}),(0,r.jsx)(ti,{radius:p.innerRadius+.8,isOuter:!0,markerColorPrimary:p.markerColorPrimary,markerColorGreen:p.markerColorGreen,markerColorRed:p.markerColorRed})]})]})};ts.displayName="CompassDial";var tl=e.i(84226);let tu=({visible:e=!0,position:t,scale:a})=>!e||d.default.get("hide3DCompass")?null:(0,r.jsxs)("group",{position:t,scale:a,children:[(0,r.jsx)(ts,{outerRadius:5.6,innerRadius:5}),(0,r.jsx)(tl.default,{outerRadius:5.6+1.1})]});var td=e.i(61969),tc=e.i(539),th=e.i(37256),tf=e.i(3666);let tm=[...(0,th.coursePaths)("bearingTrue","distance"),"navigation.speedOverGround"],tp=e=>({x:Math.sin(e),y:Math.cos(e)}),tv=`
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,tg=`
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
`,ty=({from:e,to:t,width:a=2.4,color:i,opacity:n=.22,fadeFrom:s=!1,fadeTo:u=!1,y:d=0})=>{let c=t[0]-e[0],h=t[1]-e[1],f=Math.hypot(c,h),m=(0,o.useMemo)(()=>new l.ShaderMaterial({uniforms:{uColor:{value:new l.Color},uOpacity:{value:n},uFadeFrom:{value:0},uFadeTo:{value:0}},vertexShader:tv,fragmentShader:tg,transparent:!0,depthWrite:!1,side:l.DoubleSide}),[]);if((0,o.useEffect)(()=>{m.uniforms.uColor.value.set(i),m.uniforms.uOpacity.value=n,m.uniforms.uFadeFrom.value=+!!s,m.uniforms.uFadeTo.value=+!!u},[m,i,n,s,u]),(0,o.useEffect)(()=>()=>m.dispose(),[m]),f<.01)return null;let p=Math.atan2(c,-h);return(0,r.jsx)("group",{position:[(e[0]+t[0])/2,d,(e[1]+t[1])/2],rotation:[0,-p,0],children:(0,r.jsx)("mesh",{rotation:[-Math.PI/2,0,0],material:m,renderOrder:1,children:(0,r.jsx)("planeGeometry",{args:[a,f]})})})};var tx=e.i(46991);let tM=(e,t)=>[e.x*t,-e.y*t],tb=e=>{if(!Number.isFinite(e))return null;let t=Math.round(e/60);return t>=60?`${Math.floor(t/60)}h${String(t%60).padStart(2,"0")}`:`${t} min`},tw=()=>{let e,t,a,{t:i}=(0,u.useTranslation)(),{scene:n}=(0,V.default)(),{heading:s}=(0,f.default)(),l=(e=(0,h.useSignalKPaths)(tm),t=(0,td.default)(),a=(()=>{let e=(0,h.useSignalKPath)("navigation.position"),t=e?.latitude,a=e?.longitude,r=Number.isFinite(t)?`${t.toFixed(1)},${a.toFixed(1)}`:null,[i,n]=(0,o.useState)(null),[s,l]=(0,o.useState)(null);(0,o.useEffect)(()=>{if(!r)return;let e=!1,[t,a]=r.split(",").map(Number);return(0,tf.fetchWindField)(t,a).then(t=>{e||n(t)}).catch(()=>{c.default.apiCall(`/signalk/v2/api/weather/observations?lat=${t}&lon=${a}`).then(t=>{let a=(Array.isArray(t)?t[0]:t)?.wind;!e&&a&&Number.isFinite(a.speedTrue)&&Number.isFinite(a.directionTrue)&&l({tws:a.speedTrue,twd:a.directionTrue})}).catch(()=>{})}),()=>{e=!0}},[r]);let u=Math.floor(Date.now()/6e5);return(0,o.useMemo)(()=>{if(!i||"open-meteo"!==i.source||!Number.isFinite(t))return s&&s.tws>0?s:null;let e=(a-i.origin.lon)*Math.PI/180*6371e3*Math.cos(i.origin.lat*Math.PI/180),r=(t-i.origin.lat)*Math.PI/180*6371e3,o=Math.max(0,(Date.now()-i.start)/36e5),{u:n,v:l}=(0,tf.sampleWind)(i,e,r,o),u=Math.hypot(n,l);return u>0?{tws:u,twd:(Math.atan2(-n,-l)+2*Math.PI)%(2*Math.PI)}:null},[i,s,t,a,u])})(),(0,o.useMemo)(()=>{let r=(0,th.courseValue)(e,"bearingTrue"),o=(0,th.courseValue)(e,"distance"),{heading:i}=t,n=Number.isFinite(t.tws)&&t.tws>0&&Number.isFinite(t.twd),s=!n&&null!==a,l=n?t.twd:a?.twd,u=n?t.tws:a?.tws,d=n?t.twa:Number.isFinite(i)&&Number.isFinite(l)?(0,tc.wrapPi)(l-i):void 0;if(![r,o,l,u].every(Number.isFinite)||u<=0)return null;let c={x:o*Math.sin(r),y:o*Math.cos(r)},h=Math.abs((0,tc.wrapPi)(l-r))<Math.PI/2,f=(h?(0,tc.optimalUpwind)(1.943844*u):(0,tc.optimalDownwind)(1.943844*u)).twa*Math.PI/180,m={heading:(0,tc.wrapPi)(l-f)},p={heading:(0,tc.wrapPi)(l+f)},v=null;if(Number.isFinite(i)&&Number.isFinite(d)){let t=d>=0?"starboard":"port",a=tp(i),r=tp(("starboard"===t?p:m).heading),o=-(a.x*r.y)- -(a.y*r.x);if(Math.abs(o)>1e-6){let i=(-(c.x*r.y)- -(c.y*r.x))/o,n=(a.x*c.y-a.y*c.x)/o;if(i>0&&n<0){let r=e["navigation.speedOverGround"];v={point:{x:a.x*i,y:a.y*i},distance:i,time:Number.isFinite(r)&&r>.2?i/r:null,onTack:t}}}}return{waypoint:c,upwind:h,port:p,starboard:m,tack:v,forecastWind:s}},[e,t,a])),m=d.default.get("aisLengthScalingFactor")||.7;if(!l)return null;let{waypoint:p,port:v,starboard:g,tack:y,upwind:x,forecastWind:M}=l,b=tM(p,m),w=Math.min(1.3*Math.hypot(b[0],b[1])+200,1500),S=e=>[b[0]-Math.sin(e)*w,b[1]+Math.cos(e)*w],C=y?tM(y.point,m):null,j=Math.min(25,Math.max(3,.015*Math.hypot(b[0],b[1]))),P=e=>[160*Math.sin(e),-(160*Math.cos(e))],k=y?`${i(x?"laylines.tack":"laylines.gybe")} ${(0,tx.convertDistanceUnit)(y.distance)} ${(0,tx.getDistanceUnitLabel)()}${tb(y.time)?` \xb7 ${tb(y.time)}`:""}${M?` \xb7 ${i("laylines.forecastWind")}`:""}`:null;return(0,r.jsxs)("group",{rotation:[0,s,0],children:[(0,r.jsx)(ty,{from:S(v.heading),to:b,color:n.laylinePort,y:-.15,width:j,opacity:.3,fadeFrom:!0}),(0,r.jsx)(ty,{from:S(g.heading),to:b,color:n.laylineStarboard,y:-.15,width:j,opacity:.3,fadeFrom:!0}),(0,r.jsx)(ty,{from:[0,0],to:P(v.heading),color:n.laylinePort,y:-.15,width:2.2,opacity:.35,fadeTo:!0}),(0,r.jsx)(ty,{from:[0,0],to:P(g.heading),color:n.laylineStarboard,y:-.15,width:2.2,opacity:.35,fadeTo:!0}),C&&(0,r.jsxs)("group",{children:[(0,r.jsx)(eo.Line,{points:[[0,-.15+.05,0],[C[0],-.15+.05,C[1]]],color:n.target,lineWidth:2,dashed:!0,dashSize:2.5,gapSize:2}),(0,r.jsxs)("mesh",{position:[C[0],-.09,C[1]],rotation:[-Math.PI/2,0,0],children:[(0,r.jsx)("ringGeometry",{args:[1.8,2.6,32]}),(0,r.jsx)("meshBasicMaterial",{color:n.target,transparent:!0,opacity:.9,depthWrite:!1})]}),(0,r.jsx)(eZ.Billboard,{position:[C[0],5,C[1]],children:(0,r.jsx)(eX.Text,{fontSize:1.6,color:n.target,anchorX:"center",anchorY:"bottom",font:"fonts/Roboto-Bold.ttf",outlineWidth:.04,outlineColor:n.background,children:k})})]})]})},tS=Math.PI/180,tC=2*tS,tj=[5,10,15],tP=["environment.wind.speedTrue","environment.wind.angleTrueWater","environment.current","navigation.headingTrue"],tk=(e,t,a)=>{let r=Math.max(0,Math.min(1,(a-e)/(t-e)));return r*r*(3-2*r)},tT=({unitArc:e,outerSeconds:t,color:a})=>{let i=(0,o.useRef)([]),n=(0,o.useRef)([]);return(0,b.useFrame)(({clock:e})=>{let a=e.elapsedTime/3%1;for(let e=0;e<6;e++){let r=(e+1-a)/6,o=i.current[e],s=n.current[e];if(!o||!s)continue;let l=Math.max(1,r*t);o.scale.set(l,1,l),s.material.opacity=.35*tk(.05,.25,r)*(1-tk(.85,1,r))}}),Array.from({length:6},(t,o)=>(0,r.jsx)("group",{ref:e=>{i.current[o]=e},position:[0,.04,0],children:(0,r.jsx)(eo.Line,{ref:e=>{n.current[o]=e},points:e,color:a,lineWidth:1,transparent:!0,opacity:0})},o))};function tA({rings:e}){let t=(0,o.useRef)([]),a=(0,o.useRef)(0);return(0,b.useFrame)(()=>{if(a.current++%6)return;let e=[];t.current.forEach(t=>{if(!t)return;t.style.visibility="visible";let a=t.getBoundingClientRect();e.some(e=>a.left<e.right+4&&a.right>e.left-4&&a.top<e.bottom+2&&a.bottom>e.top-2)?t.style.visibility="hidden":e.push(a)})}),e.map((e,a)=>(0,r.jsx)(n.Html,{position:e.label,zIndexRange:[5,0],style:{pointerEvents:"none"},children:(0,r.jsxs)("div",{ref:e=>{t.current[a]=e},className:"ml-2 -translate-y-1/2 whitespace-nowrap px-1.5 py-px rounded-md text-caption font-semibold tabular-nums text-hud-main bg-hud-bg/70 backdrop-blur-sm",children:[e.min," min",null!=e.nm&&(0,r.jsxs)("span",{className:"text-hud-secondary",children:[" · ",e.nm.toFixed(2)," NM"]})]})},e.min))}let tD=function(){let{scene:e,accent:t}=(0,V.default)(),a=(0,h.useSignalKPaths)(tP),i=(a["environment.wind.speedTrue"]??0)*1.943844,n=a["environment.wind.angleTrueWater"],s=a["environment.current"],l=a["navigation.headingTrue"],u=(0,o.useMemo)(()=>{if(!(i>.5)||!Number.isFinite(n))return null;let e=((0,tc.optimalUpwind)(i)?.twa??42)*tS,t=0;for(let e=40;e<=180;e+=10)t=Math.max(t,(0,tc.polarSpeed)(i,e)??0);let a=60*tj[tj.length-1],r=45/Math.max(1,t/1.943844*a),o=0,u=0;if(s&&Number.isFinite(s.drift)&&Number.isFinite(s.setTrue)&&Number.isFinite(l)){let e=(0,tc.wrapPi)(s.setTrue-l);o=s.drift*Math.sin(e),u=-s.drift*Math.cos(e)}let d=(e,t)=>{let a=((0,tc.polarSpeed)(i,(0,tc.wrapPi)(n-e)/tS)??0)/1.943844*t;return[(Math.sin(e)*a+o*t)*r,.08,(-Math.cos(e)*a+u*t)*r]},c=[];for(let t=n+e;t<=n+2*Math.PI-e+1e-6;t+=tC)c.push(d(t,1).map((e,t)=>1===t?0:e));return c.push(d(n+2*Math.PI-e,1).map((e,t)=>1===t?0:e)),{fixed:tj.map((t,a)=>{let r=60*t,o=[];for(let t=n+e;t<=n+2*Math.PI-e+1e-6;t+=tC)o.push(d(t,r));o.push(d(n+2*Math.PI-e,r));let s=Math.abs((0,tc.wrapPi)(n))<e,l=s?null:d(0,r),u=s?null:((0,tc.polarSpeed)(i,(0,tc.wrapPi)(n)/tS)??0)/1.943844*r/1852,c=l??o[0];return{min:t,nm:u,arc:o,chord:[o[0],o[o.length-1]],here:l,label:[c[0],.6,c[2]],opacity:.8-.15*a}}),unitArc:c,outerSeconds:a}},[i,n,s,l]);return u?(0,r.jsxs)("group",{children:[(0,r.jsx)(tT,{unitArc:u.unitArc,outerSeconds:u.outerSeconds,color:e.compass}),u.fixed.map(a=>(0,r.jsxs)("group",{children:[(0,r.jsx)(eo.Line,{points:a.arc,color:e.compass,lineWidth:2,transparent:!0,opacity:a.opacity}),(0,r.jsx)(eo.Line,{points:a.chord,color:e.compassDim,lineWidth:1.5,dashed:!0,dashSize:1,gapSize:1,transparent:!0,opacity:.8*a.opacity}),a.here&&(0,r.jsxs)("mesh",{position:a.here,children:[(0,r.jsx)("sphereGeometry",{args:[.5,16,12]}),(0,r.jsx)("meshBasicMaterial",{color:t})]})]},a.min)),(0,r.jsx)(tA,{rings:u.fixed})]}):null};var tz=e.i(58567);let tF=Math.PI/180,tE=[[1,"Alpheratz",0,8,23.3,1,29,5,26,2.06],[2,"Ankaa",0,26,17,-1,42,18,22,2.4],[3,"Schedar",0,40,30.4,1,56,32,14,2.24],[4,"Diphda",0,43,35.4,-1,17,59,12,2.04],[5,"Achernar",1,37,42.8,-1,57,14,12,.46],[6,"Hamal",2,7,10.4,1,23,27,45,2],[7,"Acamar",2,58,15.7,-1,40,18,17,2.88],[8,"Menkar",3,2,16.8,1,4,5,23,2.54],[9,"Mirfak",3,24,19.4,1,49,51,40,1.79],[10,"Aldebaran",4,35,55.2,1,16,30,33,.86],[11,"Rigel",5,14,32.3,-1,8,12,6,.13],[12,"Capella",5,16,41.4,1,45,59,53,.08],[13,"Bellatrix",5,25,7.9,1,6,20,59,1.64],[14,"Elnath",5,26,17.5,1,28,36,27,1.65],[15,"Alnilam",5,36,12.8,-1,1,12,7,1.69],[16,"Betelgeuse",5,55,10.3,1,7,24,25,.5],[17,"Canopus",6,23,57.1,-1,52,41,45,-.74],[18,"Sirius",6,45,8.9,-1,16,42,58,-1.46],[19,"Adhara",6,58,37.5,-1,28,58,20,1.5],[20,"Procyon",7,39,18.1,1,5,13,30,.34],[21,"Pollux",7,45,18.9,1,28,1,34,1.14],[22,"Avior",8,22,30.8,-1,59,30,35,1.86],[23,"Suhail",9,7,59.8,-1,43,25,57,2.21],[24,"Miaplacidus",9,13,12,-1,69,43,2,1.67],[25,"Alphard",9,27,35.2,-1,8,39,31,1.98],[26,"Regulus",10,8,22.3,1,11,58,2,1.4],[27,"Dubhe",11,3,43.7,1,61,45,3,1.79],[28,"Denebola",11,49,3.6,1,14,34,19,2.14],[29,"Gienah",12,15,48.4,-1,17,32,31,2.59],[30,"Acrux",12,26,35.9,-1,63,5,57,.76],[31,"Gacrux",12,31,10,-1,57,6,48,1.64],[32,"Alioth",12,54,1.7,1,55,57,35,1.77],[33,"Spica",13,25,11.6,-1,11,9,41,.97],[34,"Alkaid",13,47,32.4,1,49,18,48,1.86],[35,"Hadar",14,3,49.4,-1,60,22,23,.61],[36,"Menkent",14,6,40.9,-1,36,22,12,2.06],[37,"Arcturus",14,15,39.7,1,19,10,57,-.05],[38,"Rigil Kentaurus",14,39,36.5,-1,60,50,2,-.27],[39,"Zubenelgenubi",14,50,52.7,-1,16,2,30,2.75],[40,"Kochab",14,50,42.3,1,74,9,20,2.08],[41,"Alphecca",15,34,41.3,1,26,42,53,2.23],[42,"Antares",16,29,24.5,-1,26,25,55,1.09],[43,"Atria",16,48,39.9,-1,69,1,40,1.91],[44,"Sabik",17,10,22.7,-1,15,43,29,2.43],[45,"Shaula",17,33,36.5,-1,37,6,14,1.62],[46,"Rasalhague",17,34,56.1,1,12,33,36,2.07],[47,"Eltanin",17,56,36.4,1,51,29,20,2.23],[48,"Kaus Australis",18,24,10.3,-1,34,23,5,1.85],[49,"Vega",18,36,56.3,1,38,47,1,.03],[50,"Nunki",18,55,15.9,-1,26,17,48,2.05],[51,"Altair",19,50,47,1,8,52,6,.77],[52,"Peacock",20,25,38.9,-1,56,44,6,1.94],[53,"Deneb",20,41,25.9,1,45,16,49,1.25],[54,"Enif",21,44,11.2,1,9,52,30,2.39],[55,"Al Na'ir",22,8,14,-1,46,57,40,1.73],[56,"Fomalhaut",22,57,39,-1,29,37,20,1.16],[57,"Markab",23,4,45.7,1,15,12,19,2.48],[0,"Polaris",2,31,49.1,1,89,15,51,1.98]].map(([e,t,a,r,o,i,n,s,l,u])=>{let d=(a+r/60+o/3600)*15*tF,c=i*(n+s/60+l/3600)*tF;return{number:e,name:t,magnitude:u,j2000:[Math.cos(c)*Math.cos(d),Math.cos(c)*Math.sin(d),Math.sin(c)]}}),tR=(e,t,a)=>{let r,o;if(!Number.isFinite(e)||!Number.isFinite(t)||!(a instanceof Date))return null;let i=e*tF;return{lst:(o=(r=a.getTime()/864e5+2440587.5-2451545)/36525,((280.46061837+360.98564736629*r+387933e-9*o*o)%360+360)%360*tF+t*tF),sinLat:Math.sin(i),cosLat:Math.cos(i)}},tI=(e,t,a,{lst:r,sinLat:o,cosLat:i})=>{let n=Math.hypot(e,t,a)||1,s=r-Math.atan2(t,e),l=Math.hypot(e,t)/n,u=a/n,d=-l*Math.sin(s),c=u*i-l*Math.cos(s)*o,h=u*o+l*Math.cos(s)*i;return{altitude:Math.asin(Math.max(-1,Math.min(1,h)))/tF,azimuth:(Math.atan2(d,c)/tF+360)%360,enu:[d,c,h]}},t_=Math.PI/180,tB=e=>Math.sin(e*t_),tL=e=>Math.cos(e*t_),tN={sun:e=>({N:0,i:0,w:282.9404+470935e-10*e,a:1,e:.016709-1151e-12*e,M:356.047+.9856002585*e}),moon:e=>({N:125.1228-.0529538083*e,i:5.1454,w:318.0634+.1643573223*e,a:60.2666,e:.0549,M:115.3654+13.0649929509*e}),venus:e=>({N:76.6799+24659e-9*e,i:3.3946+275e-10*e,w:54.891+138374e-10*e,a:.72333,e:.006773-1302e-12*e,M:48.0052+1.6021302244*e}),mars:e=>({N:49.5574+211081e-10*e,i:1.8497-178e-10*e,w:286.5016+292961e-10*e,a:1.523688,e:.093405+2516e-12*e,M:18.6021+.5240207766*e}),jupiter:e=>({N:100.4542+276854e-10*e,i:1.303-1557e-10*e,w:273.8777+164505e-10*e,a:5.20256,e:.048498+4469e-12*e,M:19.895+.0830853001*e}),saturn:e=>({N:113.6634+23898e-9*e,i:2.4886-1081e-10*e,w:339.3939+297661e-10*e,a:9.55475,e:.055546-9499e-12*e,M:316.967+.0334442282*e})},tW={venus:e=>-4.34+.013*e+42e-8*e*e*e,mars:e=>-1.51+.016*e,jupiter:e=>-9.25+.014*e,saturn:e=>-9+.044*e},tU=["venus","mars","jupiter","saturn"],tG=({N:e,i:t,w:a,a:r,e:o,M:i})=>{let n=(i%360+360)%360,s=n+o/t_*tB(n)*(1+o*tL(n));for(let e=0;e<8;e++){let e=(s-o/t_*tB(s)-n)/(1-o*tL(s));if(s-=e,1e-6>Math.abs(e))break}let l=r*(tL(s)-o),u=r*Math.sqrt(1-o*o)*tB(s),d=Math.atan2(u,l)/t_,c=Math.hypot(l,u),h=d+a;return[c*(tL(e)*tL(h)-tB(e)*tB(h)*tL(t)),c*(tB(e)*tL(h)+tL(e)*tB(h)*tL(t)),c*tB(h)*tB(t)]},tO=(e,t,a)=>[a*tL(e)*tL(t),a*tB(e)*tL(t),a*tB(t)],tV=([e,t,a])=>{let r=Math.hypot(e,t,a);return{lon:Math.atan2(t,e)/t_,lat:Math.asin(a/r)/t_,r}},tH=([e,t,a],r)=>[e,t*tL(r)-a*tB(r),t*tB(r)+a*tL(r)],t$=3600,tZ=56,tX=t$*Math.tan(.7*Math.PI/180),tK=`
    attribute float aSize;
    attribute float aAlpha;
    varying float vAlpha;
    void main() {
        vAlpha = aAlpha;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize;
    }
`,tq=`
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
`,tY=`
    varying vec3 vNormal;
    void main() {
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,tQ=`
    uniform vec3 uColor;
    uniform vec3 uSun;
    uniform float uOpacity;
    varying vec3 vNormal;
    void main() {
        float lit = smoothstep(-0.04, 0.12, dot(normalize(vNormal), uSun));
        gl_FragColor = vec4(uColor * mix(0.1, 1.0, lit), uOpacity * mix(0.35, 1.0, lit));
        #include <colorspace_fragment>
    }
`,tJ=e=>l.MathUtils.smoothstep(e,-.5,6),t0=([e,t,a],r=t$)=>[e*r,a*r,-t*r],t1=tE.length+tU.length,t2=()=>{let{t:e}=(0,u.useTranslation)(),{scene:t,id:a}=(0,V.default)(),{heading:i}=(0,f.default)(),n=(0,h.useSignalKPaths)(["navigation.position"])["navigation.position"],s=Number.isFinite(n?.latitude)?Math.round(100*n.latitude)/100:null,d=Number.isFinite(n?.longitude)?Math.round(100*n.longitude)/100:null,[c,m]=(0,o.useState)(null);(0,o.useEffect)(()=>{let e=()=>{let e=(0,_.vesselNow)(),t=((e,t,a)=>{var r;let o,i,n,s,l,u,d,c,h,f,m=tR(e,t,a);if(!m)return null;let p=(r=(a.getTime()/864e5+2440587.5-2451545)/36525,i=(2306.2181*r+.30188*r*r+.017998*r*r*r)*(o=tF/3600),n=(2306.2181*r+1.09468*r*r+.018203*r*r*r)*o,s=(2004.3109*r-.42665*r*r-.041833*r*r*r)*o,l=Math.cos(i),u=Math.sin(i),d=Math.cos(n),c=Math.sin(n),[d*(h=Math.cos(s))*l-c*u,-d*h*u-c*l,-d*(f=Math.sin(s)),c*h*l+d*u,-c*h*u+d*l,-c*f,f*l,-f*u,h]);return tE.map(({number:e,name:t,magnitude:a,j2000:[r,o,i]})=>({number:e,name:t,magnitude:a,...tI(p[0]*r+p[1]*o+p[2]*i,p[3]*r+p[4]*o+p[5]*i,p[6]*r+p[7]*o+p[8]*i,m)}))})(s,d,e),a=((e,t,a)=>{let r=tR(e,t,a);if(!r)return null;let o=a.getTime()/864e5+2440587.5-2451543.5,i=23.4393-3563e-10*o,n=tG(tN.sun(o)),s=tH(n,i),l=tU.map(e=>{let t=((e,t)=>{let a=tG(tN[e](t));if("jupiter"!==e&&"saturn"!==e)return a;let r=tN.jupiter(t).M,o=tN.saturn(t).M,{lon:i,lat:n,r:s}=tV(a);return"jupiter"===e?i+=-.332*tB(2*r-5*o-67.6)-.056*tB(2*r-2*o+21)+.042*tB(3*r-5*o+21)-.036*tB(r-2*o)+.022*tL(r-o)+.023*tB(2*r-3*o+52)-.016*tB(r-5*o-69):(i+=.812*tB(2*r-5*o-67.6)-.229*tL(2*r-4*o-2)+.119*tB(r-2*o-3)+.046*tB(2*r-6*o-69)+.014*tB(r-3*o+32),n+=-.02*tL(2*r-4*o-2)+.018*tB(2*r-6*o-49)),tO(i,n,s)})(e,o),a=[t[0]+n[0],t[1]+n[1],t[2]+n[2]],s=Math.hypot(...t),l=Math.hypot(...a),u=Math.hypot(...n),d=Math.acos(Math.max(-1,Math.min(1,(s*s+l*l-u*u)/(2*s*l))))/t_,c=tW[e](d)+5*Math.log10(s*l);if("saturn"===e){let{lon:e,lat:t}=tV(a),r=tB(28.06)*tL(t)*tB(e-169.51-382e-7*o)-tL(28.06)*tB(t);c+=-2.6*Math.abs(r)+1.2*r*r}return{name:e,magnitude:c,...tI(...tH(a,i),r)}}),[u,d,c]=tH((e=>{let t=tN.moon(e),a=tN.sun(e),{lon:r,lat:o,r:i}=tV(tG(t)),n=a.M,s=t.M,l=s+t.w+t.N-(n+a.w),u=s+t.w;return r+=-1.274*tB(s-2*l)+.658*tB(2*l)-.186*tB(n)-.059*tB(2*s-2*l)-.057*tB(s-2*l+n)+.053*tB(s+2*l)+.046*tB(2*l-n)+.041*tB(s-n)-.035*tB(l)-.031*tB(s+n)-.015*tB(2*u-2*l)+.011*tB(s-4*l),tO(r,o+=-.173*tB(u-2*l)-.055*tB(s-u-2*l)-.046*tB(s+u-2*l)+.033*tB(u+2*l)+.017*tB(2*s+u),i+=-.58*tL(s-2*l)-.46*tL(2*l))})(o),i),h=[u-r.cosLat*Math.cos(r.lst),d-r.cosLat*Math.sin(r.lst),c-r.sinLat],f=Math.acos(Math.max(-1,Math.min(1,(h[0]*s[0]+h[1]*s[1]+h[2]*s[2])/(Math.hypot(...h)*Math.hypot(...s)))));return{sun:tI(...s,r),moon:{illuminated:(1-Math.cos(f))/2,...tI(...h,r)},planets:l}})(s,d,e);m(t&&a?{stars:t,...a}:null)};e();let t=setInterval(e,6e4);return()=>clearInterval(t)},[s,d]);let p=c?c.sun.altitude:90,v="day"===a?0:1-l.MathUtils.smoothstep(p,-8,-1),g=c?tJ(c.moon.altitude)*(1-.45*l.MathUtils.smoothstep(p,-6,2)):0,y=(0,o.useMemo)(()=>{let e=new l.BufferGeometry;return e.setAttribute("position",new l.BufferAttribute(new Float32Array(3*t1),3)),e.setAttribute("aSize",new l.BufferAttribute(new Float32Array(t1),1)),e.setAttribute("aAlpha",new l.BufferAttribute(new Float32Array(t1),1)),e},[]),x=(0,o.useMemo)(()=>new l.ShaderMaterial({uniforms:{uColor:{value:new l.Color},uOpacity:{value:1}},vertexShader:tK,fragmentShader:tq,transparent:!0,depthWrite:!1,fog:!1}),[]),M=(0,o.useMemo)(()=>new l.ShaderMaterial({uniforms:{uColor:{value:new l.Color},uSun:{value:new l.Vector3(0,1,0)},uOpacity:{value:1}},vertexShader:tY,fragmentShader:tQ,transparent:!0,depthWrite:!1,fog:!1}),[]);(0,o.useEffect)(()=>{if(!c)return;let e=y.attributes.position,t=y.attributes.aSize,a=y.attributes.aAlpha;[...c.stars,...c.planets].forEach(({enu:r,magnitude:o,altitude:i},n)=>{e.setXYZ(n,...t0(r)),t.setX(n,l.MathUtils.clamp(7.5-1.5*o,3.5,11)*Math.min(window.devicePixelRatio||1,2)),a.setX(n,l.MathUtils.clamp(1.15-.2*o,.5,1)*tJ(i))}),e.needsUpdate=!0,t.needsUpdate=!0,a.needsUpdate=!0,y.computeBoundingSphere(),M.uniforms.uSun.value.set(...t0(c.sun.enu,1)).normalize()},[y,M,c]),(0,o.useEffect)(()=>{x.uniforms.uColor.value.set(t.light),x.uniforms.uOpacity.value=v,M.uniforms.uColor.value.set(t.light),M.uniforms.uOpacity.value=g},[x,M,t.light,v,g]),(0,o.useEffect)(()=>()=>{y.dispose(),x.dispose(),M.dispose()},[y,x,M]);let b=(0,o.useMemo)(()=>c?[...c.stars.filter(e=>e.magnitude<=1&&e.altitude>=4).map(e=>({key:e.name,text:e.name,enu:e.enu,gap:.9})),...c.planets.filter(e=>e.altitude>=4).map(t=>({key:t.name,text:e(`sky.${t.name}`),enu:t.enu,gap:1.1}))]:[],[c,e]);if(!c)return null;let w=({key:e,text:a,enu:o,gap:i},n,s=tZ)=>{let[l,u,d]=t0(o);return(0,r.jsx)(eZ.Billboard,{position:[l,u-s*i,d],children:(0,r.jsx)(eX.Text,{fontSize:s,color:t.light,fillOpacity:.55*n,font:"fonts/Roboto-Bold.ttf",anchorX:"center",anchorY:"top",renderOrder:-2,"material-depthWrite":!1,"material-fog":!1,children:a})},e)};return(0,r.jsxs)("group",{rotation:[0,i,0],children:[v>.01&&(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("points",{geometry:y,material:x,renderOrder:-2,frustumCulled:!1}),b.map(e=>w(e,v))]}),g>.01&&(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("mesh",{position:t0(c.moon.enu),material:M,renderOrder:-2,frustumCulled:!1,children:(0,r.jsx)("sphereGeometry",{args:[tX,32,16]})}),c.moon.altitude>=4&&w({key:"moon",text:e("sky.moon"),enu:c.moon.enu,gap:(tX+12)/tZ},g)]})]})};var t5=e.i(29288);let t3=[4,1.35],t4=["environment.wind.speedTrue","environment.wind.directionTrue","navigation.speedThroughWater","navigation.speedOverGround","navigation.heave.range","navigation.heave.apparentFreqAvg","navigation.heave.apparentFreq"],t6=`
    uniform float uTime;
    uniform float uAmp;
    uniform float uDir;
    uniform float uWaveLength;
    uniform float uChop;
    uniform vec2 uOffset;
    uniform float uHeave;
`,t8=`
    ${t6}
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
`,t7=`
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
`,t9=`
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
`,ae=`
    ${t6}
    ${t7}
    ${t9}
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
`,at=`
    varying vec3 vDir;
    void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,aa=`
    ${t7}
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
`,ar=new l.Vector3,ao=()=>{let e=(0,h.useSignalKPaths)(["navigation.position"])["navigation.position"],[t,a]=(0,o.useState)(()=>({dir:new l.Vector3(.3,.6,.5).normalize(),intensity:1}));return(0,o.useEffect)(()=>{let t=()=>{let t=(0,B.sunPosition)(e?.latitude,e?.longitude,(0,_.vesselNow)()),r=t?t.elevation:35,o=(t?t.azimuth:200)*Math.PI/180,i=Math.max(r,4)*Math.PI/180;a({dir:new l.Vector3(Math.sin(o)*Math.cos(i),Math.cos(o)*Math.cos(i),Math.sin(i)).normalize(),intensity:l.MathUtils.smoothstep(r,-6,6)})};t();let r=setInterval(t,6e4);return()=>clearInterval(r)},[e?.latitude,e?.longitude]),t},ai=()=>{let{scene:e,id:t}=(0,V.default)(),{heading:a}=(0,f.default)(),i=ao(),n=(0,o.useMemo)(()=>({uZenith:{value:new l.Color},uHorizon:{value:new l.Color},uDeep:{value:new l.Color},uSunDir:{value:new l.Vector3},uSunI:{value:1}}),[]),s=(0,o.useMemo)(()=>new l.ShaderMaterial({uniforms:n,vertexShader:at,fragmentShader:aa,side:l.BackSide,depthWrite:!1,fog:!1}),[n]);return(0,o.useEffect)(()=>{n.uZenith.value.set(e.skyZenith),n.uHorizon.value.set(e.skyHorizon),n.uDeep.value.set(e.sea)},[n,e]),(0,b.useFrame)(()=>{let{x:e,y:r,z:o}=i.dir,s=Math.cos(a),l=Math.sin(a);n.uSunDir.value.set(e*s-r*l,-(-e*l-r*s),o).normalize(),n.uSunI.value=i.intensity*("day"===t?1:.06)}),(0,o.useEffect)(()=>()=>s.dispose(),[s]),(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("mesh",{material:s,renderOrder:-3,frustumCulled:!1,children:(0,r.jsx)("sphereGeometry",{args:[3800,48,24]})}),(0,r.jsx)(t2,{})]})},an=({y:e=-.3})=>{let{scene:t,id:a}=(0,V.default)(),{heading:i,offset:n}=(0,f.default)(),s=(0,h.useSignalKPaths)(t4),u=s["environment.wind.speedTrue"],d=s["environment.wind.directionTrue"],c=s["navigation.speedThroughWater"]??s["navigation.speedOverGround"],m=s["navigation.heave.range"],p=s["navigation.heave.apparentFreqAvg"]??s["navigation.heave.apparentFreq"],v=(0,t5.default)(),g=ao(),y=(0,o.useRef)(),x=(0,o.useRef)([]),M=(0,o.useMemo)(()=>({uTime:{value:0},uAmp:{value:.3},uDir:{value:0},uWaveLength:{value:15},uChop:{value:.6},uOffset:{value:new l.Vector2},uHeave:{value:0},uCam:{value:new l.Vector3},uSunDir:{value:new l.Vector3(.3,.6,.5).normalize()},uSunI:{value:1},uZenith:{value:new l.Color},uHorizon:{value:new l.Color},uDeep:{value:new l.Color},uScatter:{value:new l.Color},uFoamColor:{value:new l.Color},uWind:{value:.3},uFog:{value:1/2600},uTrail:{value:Array.from({length:32},()=>new l.Vector4(0,0,-1,0))},uTrailReach:{value:0},uBow:{value:new l.Vector2(0,1)},uSpeed:{value:0},uHull:{value:new l.Vector2(...t3)},uOcclude:{value:0}}),[]),w=(0,o.useMemo)(()=>{let e;return{FBM_OCTAVES:(e="pi"===(0,tz.getRenderProfile)().id)?2:4,RIPPLES:e?3:6,TRAIL_SEGMENTS:e?12:31}},[]),S=(0,o.useMemo)(()=>new l.ShaderMaterial({uniforms:M,defines:w,vertexShader:t8,fragmentShader:ae,depthWrite:!1}),[M,w]),C=(0,o.useMemo)(()=>new l.ShaderMaterial({uniforms:{...M,uOcclude:{value:1}},defines:w,vertexShader:t8,fragmentShader:ae,transparent:!0,depthWrite:!1}),[M,w]),j="day"===a?1:.06;(0,o.useEffect)(()=>{M.uDeep.value.set(t.sea),M.uScatter.value.set(t.seaScatter),M.uFoamColor.value.set(t.seaFoam),M.uZenith.value.set(t.skyZenith),M.uHorizon.value.set(t.skyHorizon)},[M,t]),(0,o.useEffect)(()=>{let e=Number.isFinite(u)?u:4,t=Number.isFinite(m)&&m>0,a=Number.isFinite(p)&&p>.03&&p<2,r=t?Math.min(m,6):Math.min(.21*e*e/9.81,2.5),o=a?9.81/(2*Math.PI*p*p):.5*e*e;M.uAmp.value=.7*Math.max(.15,r),M.uChop.value=.4+.5*l.MathUtils.smoothstep(e,3,13),M.uWaveLength.value=.7*Math.min(a?150:55,Math.max(6,o)),M.uWind.value=l.MathUtils.smoothstep(e,3.5,13),M.uDir.value=Number.isFinite(d)?d+Math.PI:Math.PI},[M,u,d,m,p]);let P=(0,o.useRef)({x:0,y:0,at:0,init:!1}),k=(0,o.useRef)({x:0,y:0});(0,o.useEffect)(()=>{P.current={x:.7*n.x,y:.7*n.y,at:performance.now()/1e3,init:!0}},[n]),(0,b.useFrame)((e,t)=>{let a=y.current;if(!a)return;let r=Math.min(t,.1);M.uTime.value+=r;let o=Number.isFinite(c)?c:0,n=Math.sin(i)*o*.7,s=Math.cos(i)*o*.7,l=P.current,u=k.current;if(l.init){let e=Math.min(3,performance.now()/1e3-l.at),t=l.x+n*e,a=l.y+s*e;Math.hypot(t-u.x,a-u.y)>40&&(u.x=t,u.y=a),u.x+=n*r+(t-u.x-n*r)*Math.min(1,3*r),u.y+=s*r+(a-u.y-s*r)*Math.min(1,3*r)}M.uOffset.value.set(u.x,u.y),M.uHeave.value=.7*v.current,a.updateWorldMatrix(!0,!1),M.uCam.value.copy(a.worldToLocal(ar.copy(e.camera.position))),M.uSunDir.value.copy(g.dir),M.uSunI.value=g.intensity*j;let d=e.clock.elapsedTime,h=x.current,f=h[0];f&&Math.hypot(u.x-f.x,u.y-f.y)>60&&(h.length=0),(!h[0]||Math.hypot(u.x-h[0].x,u.y-h[0].y)>1.5)&&(h.unshift({x:u.x,y:u.y,t:d}),h.length>36&&(h.length=36)),M.uSpeed.value=o,M.uBow.value.set(Math.sin(i),Math.cos(i));let m=.85*t3[0],p=M.uTrail.value;p[0].set(-Math.sin(i)*m,-Math.cos(i)*m,0,0);let b=1,w=m;for(let e of h){if(b>=32)break;let t=e.x-u.x,a=e.y-u.y;Math.hypot(t,a)<=m+.5||(p[b++].set(t,a,d-e.t,0),w=Math.max(w,Math.hypot(t,a)))}for(;b<32;b++)p[b].set(0,0,-1,0);M.uTrailReach.value=w+60}),(0,o.useEffect)(()=>()=>{S.dispose(),C.dispose()},[S,C]);let T=(0,o.useMemo)(()=>{let e=new l.PlaneGeometry(2,2,320,320),t=e.attributes.position,a=e=>2400*(.05*e+.95*e*e*e);for(let e=0;e<t.count;e++)t.setXY(e,a(t.getX(e)),a(t.getY(e)));return e},[]),A=(0,o.useMemo)(()=>new l.PlaneGeometry(2.4*t3[0],2.4*t3[0],48,48),[]);return(0,o.useEffect)(()=>()=>{T.dispose(),A.dispose()},[T,A]),(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(ai,{}),(0,r.jsxs)("group",{rotation:[0,i,0],position:[0,e,0],children:[(0,r.jsx)("mesh",{ref:y,rotation:[-Math.PI/2,0,0],geometry:T,material:S,renderOrder:-1,frustumCulled:!1}),(0,r.jsx)("mesh",{rotation:[-Math.PI/2,0,0],geometry:A,material:C,renderOrder:10,frustumCulled:!1})]})]})};var as=l,al=l;let au=new al.Box3,ad=new al.Vector3;class ac extends al.InstancedBufferGeometry{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new al.Float32BufferAttribute([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new al.Float32BufferAttribute([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,a=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),a.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let a=new al.InstancedInterleavedBuffer(t,6,1);return this.setAttribute("instanceStart",new al.InterleavedBufferAttribute(a,3,0)),this.setAttribute("instanceEnd",new al.InterleavedBufferAttribute(a,3,3)),this.instanceCount=this.attributes.instanceStart.count,this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let a=new al.InstancedInterleavedBuffer(t,6,1);return this.setAttribute("instanceColorStart",new al.InterleavedBufferAttribute(a,3,0)),this.setAttribute("instanceColorEnd",new al.InterleavedBufferAttribute(a,3,3)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new al.WireframeGeometry(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new al.Box3);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;void 0!==e&&void 0!==t&&(this.boundingBox.setFromBufferAttribute(e),au.setFromBufferAttribute(t),this.boundingBox.union(au))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new al.Sphere),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(void 0!==e&&void 0!==t){let a=this.boundingSphere.center;this.boundingBox.getCenter(a);let r=0;for(let o=0,i=e.count;o<i;o++)ad.fromBufferAttribute(e,o),r=Math.max(r,a.distanceToSquared(ad)),ad.fromBufferAttribute(t,o),r=Math.max(r,a.distanceToSquared(ad));this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}}var ah=l;S.UniformsLib.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new ah.Vector2},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}},S.ShaderLib.line={uniforms:ah.UniformsUtils.merge([S.UniformsLib.common,S.UniformsLib.fog,S.UniformsLib.line]),vertexShader:`
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
		`};class af extends ah.ShaderMaterial{constructor(e){super({type:"LineMaterial",uniforms:ah.UniformsUtils.clone(S.ShaderLib.line.uniforms),vertexShader:S.ShaderLib.line.vertexShader,fragmentShader:S.ShaderLib.line.fragmentShader,clipping:!0}),this.isLineMaterial=!0,this.setValues(e)}get color(){return this.uniforms.diffuse.value}set color(e){this.uniforms.diffuse.value=e}get worldUnits(){return"WORLD_UNITS"in this.defines}set worldUnits(e){!0===e!==this.worldUnits&&(this.needsUpdate=!0),!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(e){this.uniforms.linewidth&&(this.uniforms.linewidth.value=e)}get dashed(){return"USE_DASH"in this.defines}set dashed(e){!0===e!==this.dashed&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(e){this.uniforms.dashScale.value=e}get dashSize(){return this.uniforms.dashSize.value}set dashSize(e){this.uniforms.dashSize.value=e}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(e){this.uniforms.dashOffset.value=e}get gapSize(){return this.uniforms.gapSize.value}set gapSize(e){this.uniforms.gapSize.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}get resolution(){return this.uniforms.resolution.value}set resolution(e){this.uniforms.resolution.value.copy(e)}get alphaToCoverage(){return"USE_ALPHA_TO_COVERAGE"in this.defines}set alphaToCoverage(e){this.defines&&(!0===e!==this.alphaToCoverage&&(this.needsUpdate=!0),!0===e?this.defines.USE_ALPHA_TO_COVERAGE="":delete this.defines.USE_ALPHA_TO_COVERAGE)}}let am=new as.Vector4,ap=new as.Vector3,av=new as.Vector3,ag=new as.Vector4,ay=new as.Vector4,ax=new as.Vector4,aM=new as.Vector3,ab=new as.Matrix4,aw=new as.Line3,aS=new as.Vector3,aC=new as.Box3,aj=new as.Sphere,aP=new as.Vector4;function ak(e,t,r){return aP.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),aP.multiplyScalar(1/aP.w),aP.x=a/r.width,aP.y=a/r.height,aP.applyMatrix4(e.projectionMatrixInverse),aP.multiplyScalar(1/aP.w),Math.abs(Math.max(aP.x,aP.y))}class aT extends as.Mesh{constructor(e=new ac,t=new af({color:0xffffff*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,a=e.attributes.instanceEnd,r=new Float32Array(2*t.count);for(let e=0,o=0,i=t.count;e<i;e++,o+=2)ap.fromBufferAttribute(t,e),av.fromBufferAttribute(a,e),r[o]=0===o?0:r[o-1],r[o+1]=r[o]+ap.distanceTo(av);let o=new as.InstancedInterleavedBuffer(r,2,1);return e.setAttribute("instanceDistanceStart",new as.InterleavedBufferAttribute(o,1,0)),e.setAttribute("instanceDistanceEnd",new as.InterleavedBufferAttribute(o,1,1)),this}raycast(e,r){let o,i,n=this.material.worldUnits,s=e.camera;if(null!==s||n||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.'),!1===n&&(0===this.material.resolution.x||0===this.material.resolution.y))return;let l=void 0!==e.params.Line2&&e.params.Line2.threshold||0;t=e.ray;let u=this.matrixWorld,d=this.geometry,c=this.material;if(a=c.linewidth+l,null===d.boundingSphere&&d.computeBoundingSphere(),aj.copy(d.boundingSphere).applyMatrix4(u),n)o=.5*a;else{let e=Math.max(s.near,aj.distanceToPoint(t.origin));o=ak(s,e,c.resolution)}if(aj.radius+=o,!1!==t.intersectsSphere(aj)){if(null===d.boundingBox&&d.computeBoundingBox(),aC.copy(d.boundingBox).applyMatrix4(u),n)i=.5*a;else{let e=Math.max(s.near,aC.distanceToPoint(t.origin));i=ak(s,e,c.resolution)}aC.expandByScalar(i),!1!==t.intersectsBox(aC)&&(n?function(e,r){let o=e.matrixWorld,i=e.geometry,n=i.attributes.instanceStart,s=i.attributes.instanceEnd,l=Math.min(i.instanceCount,n.count);for(let i=0;i<l;i++){aw.start.fromBufferAttribute(n,i),aw.end.fromBufferAttribute(s,i),aw.applyMatrix4(o);let l=new as.Vector3,u=new as.Vector3;t.distanceSqToSegment(aw.start,aw.end,u,l),u.distanceTo(l)<.5*a&&r.push({point:u,pointOnLine:l,distance:t.origin.distanceTo(u),object:e,face:null,faceIndex:i,uv:null,uv1:null})}}(this,r):function(e,r,o){let i=r.projectionMatrix,n=e.material.resolution,s=e.matrixWorld,l=e.geometry,u=l.attributes.instanceStart,d=l.attributes.instanceEnd,c=Math.min(l.instanceCount,u.count),h=-r.near;t.at(1,ax),ax.w=1,ax.applyMatrix4(r.matrixWorldInverse),ax.applyMatrix4(i),ax.multiplyScalar(1/ax.w),ax.x*=n.x/2,ax.y*=n.y/2,ax.z=0,aM.copy(ax),ab.multiplyMatrices(r.matrixWorldInverse,s);for(let r=0;r<c;r++){if(ag.fromBufferAttribute(u,r),ay.fromBufferAttribute(d,r),ag.w=1,ay.w=1,ag.applyMatrix4(ab),ay.applyMatrix4(ab),ag.z>h&&ay.z>h)continue;if(ag.z>h){let e=ag.z-ay.z,t=(ag.z-h)/e;ag.lerp(ay,t)}else if(ay.z>h){let e=ay.z-ag.z,t=(ay.z-h)/e;ay.lerp(ag,t)}ag.applyMatrix4(i),ay.applyMatrix4(i),ag.multiplyScalar(1/ag.w),ay.multiplyScalar(1/ay.w),ag.x*=n.x/2,ag.y*=n.y/2,ay.x*=n.x/2,ay.y*=n.y/2,aw.start.copy(ag),aw.start.z=0,aw.end.copy(ay),aw.end.z=0;let l=aw.closestPointToPointParameter(aM,!0);aw.at(l,aS);let c=as.MathUtils.lerp(ag.z,ay.z,l),f=c>=-1&&c<=1,m=aM.distanceTo(aS)<.5*a;if(f&&m){aw.start.fromBufferAttribute(u,r),aw.end.fromBufferAttribute(d,r),aw.start.applyMatrix4(s),aw.end.applyMatrix4(s);let a=new as.Vector3,i=new as.Vector3;t.distanceSqToSegment(aw.start,aw.end,i,a),o.push({point:i,pointOnLine:a,distance:t.origin.distanceTo(i),object:e,face:null,faceIndex:r,uv:null,uv1:null})}}}(this,s,r))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(am),this.material.uniforms.resolution.value.set(am.z,am.w))}}var aA=e.i(88608);let aD=["navigation.position","environment.wind.speedTrue","environment.wind.directionTrue"],az=({y:e=.05})=>{let t=(0,h.useSignalKPaths)(aD),a=t["navigation.position"],{heading:i}=(0,f.default)(),s=(0,o.useSyncExternalStore)(aA.subscribeForecast,aA.getForecastHour,aA.getForecastHour),[u,c]=(0,o.useState)(null),{id:m}=(0,V.default)(),p="day"===m?-.6:.45,v=(0,o.useRef)(),g=d.default.get("aisLengthScalingFactor")||.7,y=a?.latitude,x=a?.longitude,M=Number.isFinite(y)?`${y.toFixed(1)},${x.toFixed(1)}`:null,w=t["environment.wind.speedTrue"],S=t["environment.wind.directionTrue"];(0,o.useEffect)(()=>{if(!M)return;let e=!1,[t,a]=M.split(",").map(Number);return(0,tf.fetchWindField)(t,a).then(t=>{e||c(t)}).catch(()=>{!e&&Number.isFinite(w)&&Number.isFinite(S)&&c((0,tf.uniformField)(t,a,w,S))}),()=>{e=!0}},[M]);let C=(0,o.useMemo)(()=>{let e=new Uint8Array(65536),t=new l.DataTexture(e,128,128,l.RGBAFormat);return t.magFilter=l.LinearFilter,t.minFilter=l.LinearFilter,t.colorSpace=l.SRGBColorSpace,t},[]);(0,o.useEffect)(()=>{if(!u)return;let e=C.image.data;for(let t=0;t<128;t++)for(let a=0;a<128;a++){let r=(a/127*2-1)*tf.HALF_EXTENT_M,o=(t/127*2-1)*tf.HALF_EXTENT_M,i=(0,tf.sampleWind)(u,r,o,s),[n,l,d]=(0,tf.windColor)(Math.hypot(i.u,i.v)),c=(128*t+a)*4,h=Math.max(Math.abs(a/127*2-1),Math.abs(t/127*2-1));e[c]=n,e[c+1]=l,e[c+2]=d,e[c+3]=Math.round(255*Math.min(1,(1-h)*8))}C.needsUpdate=!0},[C,u,s]),(0,o.useEffect)(()=>()=>C.dispose(),[C]);let j=(0,o.useMemo)(()=>{let e=new ac;e.setPositions(new Float32Array(46200)),e.setColors(new Float32Array(46200));let t=new af({linewidth:3,vertexColors:!0,transparent:!0,opacity:.9,depthWrite:!1}),a=new aT(e,t);return a.frustumCulled=!1,a.renderOrder=2,{geo:e,material:t,object:a,state:Array.from({length:1100},()=>({x:0,y:0,age:4*Math.random(),life:2+3*Math.random()}))}},[]);(0,o.useEffect)(()=>()=>{j.geo.dispose(),j.material.dispose()},[j]);let[P,k]=(0,o.useState)([]),T=(0,o.useRef)(0),A=(0,o.useRef)({east:0,north:0});(0,o.useEffect)(()=>{let e,t;u&&Number.isFinite(y)&&(e=u.origin,A.current={east:((t={latitude:y,longitude:x}).longitude-e.lon)*Math.PI/180*6371e3*Math.cos(e.lat*Math.PI/180),north:(t.latitude-e.lat)*Math.PI/180*6371e3})},[u,y,x]);let D=(0,o.useRef)();if((0,b.useFrame)(({camera:e,size:t},a)=>{if(!u)return;if(D.current){let t=e.position.length()/g;D.current.opacity=l.MathUtils.clamp(.3+(t-300)/3e3*.3,.3,.6)}let r=Math.min(a,.1),o=Math.min(tf.HALF_EXTENT_M,Math.max(800,e.position.length()/g*2.5)),i=o/120,n=o/140,{east:d,north:c}=A.current;j.material.resolution.set(t.width,t.height);let h=j.geo.attributes.instanceStart.data.array,f=j.geo.attributes.instanceColorStart.data.array;if(j.state.forEach((e,t)=>{e.age+=r,(e.age>e.life||Math.abs(e.x)>o||Math.abs(e.y)>o)&&(e.x=(2*Math.random()-1)*o,e.y=(2*Math.random()-1)*o,e.age=0,e.life=2+3*Math.random());let a=(0,tf.sampleWind)(u,d+e.x,c+e.y,s),l=Math.hypot(a.u,a.v);e.x+=a.u*i*r/10,e.y+=a.v*i*r/10;let m=Math.min(1,e.age/.5,(e.life-e.age)/.7),[v,y,x]=(0,tf.windColor)(l),M=e=>p>=0?e/255*(1-p)+p:e/255*(1+p),b=M(v),w=M(y),S=M(x),C=v/255,j=y/255,P=x/255,k=n*Math.min(1.6,.5+l/10),T=e.x,A=e.y;for(let e=0;e<7;e++){let r=0===e?a:(0,tf.sampleWind)(u,d+T,c+A,s),o=Math.hypot(r.u,r.v)||1,i=T-r.u/o*k,n=A-r.v/o*k,l=(7*t+e)*6;h[l]=T*g,h[l+1]=A*g,h[l+2]=.2,h[l+3]=i*g,h[l+4]=n*g,h[l+5]=.2;let p=m*(1-e/7)**1.6,v=m*(1-(e+1)/7)**1.6,y=(7*t+e)*6;f[y]=C+(b-C)*p,f[y+1]=j+(w-j)*p,f[y+2]=P+(S-P)*p,f[y+3]=C+(b-C)*v,f[y+4]=j+(w-j)*v,f[y+5]=P+(S-P)*v,T=i,A=n}}),j.geo.attributes.instanceStart.data.needsUpdate=!0,j.geo.attributes.instanceColorStart.data.needsUpdate=!0,T.current+=a,T.current<1)return;T.current=0;let m=Math.max(400,100*Math.round(2*o/6/100)),y=Math.ceil((d-.8*o)/m)*m,x=Math.ceil((c-.8*o)/m)*m,M=[],b=v.current,w=new l.Vector3;for(let t=y;t<=d+.8*o;t+=m)for(let a=x;a<=c+.8*o;a+=m){if(b&&(w.set((t-d)*g,(a-c)*g,.5),b.localToWorld(w).project(e),w.z>1||Math.abs(w.x)>.85||w.y>.6||w.y<-.85))continue;let r=(0,tf.sampleWind)(u,t,a,s),o=1.943844*Math.hypot(r.u,r.v),i=180*Math.atan2(r.u,r.v)/Math.PI;M.push({key:`${t},${a}`,x:t-d,y:a-c,kn:Math.round(o),to:Math.round(i),d:Math.hypot(t-d,a-c)})}M.sort((e,t)=>e.d-t.d).splice(10),k(e=>e.length===M.length&&e.every((e,t)=>e.key===M[t].key&&e.kn===M[t].kn&&e.to===M[t].to&&20>Math.abs(e.x-M[t].x)&&20>Math.abs(e.y-M[t].y))?e:M)}),!u)return null;let{east:z,north:F}=A.current,E=2*tf.HALF_EXTENT_M*g;return(0,r.jsx)("group",{rotation:[0,i,0],position:[0,e,0],children:(0,r.jsxs)("group",{ref:v,rotation:[-Math.PI/2,0,0],children:[(0,r.jsxs)("mesh",{position:[-z*g,-F*g,0],renderOrder:1,children:[(0,r.jsx)("planeGeometry",{args:[E,E]}),(0,r.jsx)("meshBasicMaterial",{ref:D,map:C,transparent:!0,opacity:.6,depthWrite:!1,toneMapped:!1})]}),(0,r.jsx)("primitive",{object:j.object}),P.map(e=>{let[t,a,o]=(0,tf.windColor)(e.kn/1.943844);return(0,r.jsx)(n.Html,{position:[e.x*g,e.y*g,.5],center:!0,zIndexRange:[4,0],style:{pointerEvents:"none"},children:(0,r.jsxs)("div",{className:"flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-caption font-semibold tabular-nums text-white shadow",style:{background:`rgba(${Math.round(t)},${Math.round(a)},${Math.round(o)},0.85)`},children:[(0,r.jsx)("span",{style:{display:"inline-block",transform:`rotate(${e.to-180*i/Math.PI}deg)`},children:"↑"}),e.kn," kn"]})},e.key)})]})})};var aF=e.i(71415),aE=e.i(71029);let aR=["navigation.position","environment.current","environment.wind.speedTrue","environment.wind.directionTrue"],aI=({color:e})=>{let t=(0,o.useRef)();return(0,b.useFrame)(({clock:e})=>{t.current&&(t.current.position.y=.15*Math.sin(1.6*e.elapsedTime),t.current.rotation.z=.12*Math.sin(1.1*e.elapsedTime))}),(0,r.jsxs)("group",{ref:t,scale:1.6,children:[(0,r.jsxs)("mesh",{position:[0,.15,0],children:[(0,r.jsx)("capsuleGeometry",{args:[.32,.35,6,12]}),(0,r.jsx)("meshStandardMaterial",{color:e,roughness:.6})]}),(0,r.jsxs)("mesh",{position:[0,.85,0],children:[(0,r.jsx)("sphereGeometry",{args:[.22,16,12]}),(0,r.jsx)("meshStandardMaterial",{color:"#e9c8a8",roughness:.7})]}),(0,r.jsxs)("mesh",{position:[.32,.95,0],rotation:[0,0,-.35],children:[(0,r.jsx)("capsuleGeometry",{args:[.08,.55,4,8]}),(0,r.jsx)("meshStandardMaterial",{color:e,roughness:.6})]})]})},a_=()=>{let{t:e}=(0,u.useTranslation)(),{scene:t}=(0,V.default)(),a=(0,aE.useActiveMobs)(),i=(0,h.useSignalKPaths)(aR),n=i["navigation.position"],[s,l]=(0,o.useState)(()=>(0,_.vesselNow)().getTime());(0,o.useEffect)(()=>{let e=setInterval(()=>l((0,_.vesselNow)().getTime()),1e3);return()=>clearInterval(e)},[]);let c=d.default.get("aisLengthScalingFactor")||.7,{heading:m}=(0,f.default)(),p=(0,o.useMemo)(()=>{let e=0,t=0,a=i["environment.current"];Number.isFinite(a?.drift)&&Number.isFinite(a?.setTrue)&&(e+=a.drift*Math.sin(a.setTrue),t+=a.drift*Math.cos(a.setTrue));let r=i["environment.wind.speedTrue"],o=i["environment.wind.directionTrue"];return Number.isFinite(r)&&Number.isFinite(o)&&(e-=.025*r*Math.sin(o),t-=.025*r*Math.cos(o)),{ve:e,vn:t}},[i]);return a.length&&Number.isFinite(n?.latitude)?(0,r.jsx)("group",{rotation:[0,m,0],children:a.filter(e=>Number.isFinite(e.position?.latitude)).map(a=>{let o,i=Math.max(0,(s-(Date.parse(a.createdAt)||s))/1e3),l={east:((o=a.position).longitude-n.longitude)*Math.PI/180*6371e3*Math.cos(n.latitude*Math.PI/180),north:(o.latitude-n.latitude)*Math.PI/180*6371e3},u={east:l.east+p.ve*i,north:l.north+p.vn*i},d={east:u.east+10*p.ve*60,north:u.north+10*p.vn*60},h=(e,t=.3)=>[e.east*c,t,-e.north*c],f=Math.hypot(u.east,u.north),m=Math.floor(i/60),v=Math.floor(i%60);return(0,r.jsxs)("group",{children:[(0,r.jsxs)("mesh",{position:h(l,.2),rotation:[-Math.PI/2,0,0],children:[(0,r.jsx)("ringGeometry",{args:[1.6,2.2,32]}),(0,r.jsx)("meshBasicMaterial",{color:t.vesselDanger,transparent:!0,opacity:.7,depthWrite:!1})]}),(0,r.jsx)(eo.Line,{points:[h(l),h(u)],color:t.vesselDanger,lineWidth:2.5}),(0,r.jsx)(eo.Line,{points:[h(u),h(d)],color:t.vesselDanger,lineWidth:1.5,dashed:!0,dashSize:1.5,gapSize:1.2,transparent:!0,opacity:.7}),(0,r.jsx)(eo.Line,{points:[[0,.3,0],h(u)],color:t.compass,lineWidth:1.2,dashed:!0,dashSize:2,gapSize:2,transparent:!0,opacity:.6}),(0,r.jsxs)("group",{position:h(u,0),children:[(0,r.jsx)(aI,{color:"#ff7a00"}),(0,r.jsxs)("mesh",{position:[0,.05,0],rotation:[-Math.PI/2,0,0],children:[(0,r.jsx)("ringGeometry",{args:[2.4,2.9,32]}),(0,r.jsx)("meshBasicMaterial",{color:t.vesselDanger,transparent:!0,opacity:.9,depthWrite:!1})]}),(0,r.jsx)(eZ.Billboard,{position:[0,4.2,0],children:(0,r.jsx)(eX.Text,{fontSize:1.6,color:t.vesselDanger,anchorX:"center",anchorY:"bottom",font:"fonts/Roboto-Bold.ttf",outlineWidth:.12,outlineColor:t.background,children:`${e("mob.short","MOB")} \xb7 ${m}:${String(v).padStart(2,"0")} \xb7 ${Math.round(f)} m`})})]})]},a.path)})}):null};var aB=e.i(39271),aL=e.i(73919);let aN=()=>((0,b.useFrame)(({camera:e})=>{let t=Math.max(5,.05*e.position.length());Math.abs(t-e.near)>.1*e.near&&(e.near=t,e.updateProjectionMatrix())}),null);var aW=e.i(20440);let aU=(0,th.coursePaths)("bearingTrue","distance"),aG=`
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,aO=`
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
`,aV=({y:e=-.2})=>{let{scene:t}=(0,V.default)(),{heading:a}=(0,f.default)(),i=(0,h.useSignalKPaths)(aU),n=(0,th.courseValue)(i,"bearingTrue"),s=(0,th.courseValue)(i,"distance"),u=d.default.get("aisLengthScalingFactor")||.7,c=Number.isFinite(s)?Math.min(s*u,1600):0,m=Number.isFinite(s)&&s*u<=1600,p=(0,o.useMemo)(()=>new l.ShaderMaterial({uniforms:{uColor:{value:new l.Color},uGlow:{value:new l.Color},uLength:{value:1},uTime:{value:0},uChevronZone:{value:45}},vertexShader:aG,fragmentShader:aO,transparent:!0,depthWrite:!1}),[]);return((0,o.useEffect)(()=>{p.uniforms.uColor.value.set(t.route),p.uniforms.uGlow.value.set(t.routeGlow)},[p,t]),(0,o.useEffect)(()=>{p.uniforms.uLength.value=Math.max(c,1)},[p,c]),(0,o.useEffect)(()=>()=>p.dispose(),[p]),(0,b.useFrame)((e,t)=>{p.uniforms.uTime.value+=t}),!Number.isFinite(n)||c<1)?null:(0,r.jsx)("group",{rotation:[0,a,0],position:[0,e,0],children:(0,r.jsxs)("group",{rotation:[0,-n,0],children:[(0,r.jsx)("mesh",{position:[0,0,-c/2],rotation:[-Math.PI/2,0,0],material:p,renderOrder:1,children:(0,r.jsx)("planeGeometry",{args:[3.2,c,1,1]})}),m&&(0,r.jsxs)("group",{position:[0,0,-c],children:[(0,r.jsxs)("mesh",{position:[0,4,0],children:[(0,r.jsx)("cylinderGeometry",{args:[.12,.12,8,8]}),(0,r.jsx)("meshBasicMaterial",{color:t.route})]}),(0,r.jsxs)("mesh",{position:[0,8.6,0],children:[(0,r.jsx)("sphereGeometry",{args:[.9,16,16]}),(0,r.jsx)("meshBasicMaterial",{color:t.route})]}),(0,r.jsxs)("mesh",{rotation:[-Math.PI/2,0,0],position:[0,.05,0],children:[(0,r.jsx)("ringGeometry",{args:[2.4,3.2,40]}),(0,r.jsx)("meshBasicMaterial",{color:t.route,transparent:!0,opacity:.7,depthWrite:!1})]})]})]})})},aH=(e,t,a)=>Number.isFinite(e)?e<.8?a.copy(t.bad):e<.95?a.copy(t.fair):a.copy(t.good):a.copy(t.foam),a$=({y:e=-.25})=>{let{scene:t}=(0,V.default)(),{heading:a,offset:i}=(0,f.default)(),{ratio:n}=(0,td.default)(),s=(0,o.useRef)([]),u=(0,o.useRef)(0),c=d.default.get("aisLengthScalingFactor")||.7,h=(0,o.useMemo)(()=>({good:new l.Color(t.wakeGood),fair:new l.Color(t.wakeFair),bad:new l.Color(t.wakeBad),foam:new l.Color(t.wakeFoam)}),[t]),m=(0,o.useMemo)(()=>{let e=new l.BufferGeometry;e.setAttribute("position",new l.BufferAttribute(new Float32Array(2160),3)),e.setAttribute("color",new l.BufferAttribute(new Float32Array(2880),4));let t=[];for(let e=0;e<359;e++){let a=2*e;t.push(a,a+1,a+2,a+1,a+3,a+2)}return e.setIndex(t),e.setDrawRange(0,0),e},[]),p=(0,o.useMemo)(()=>new l.MeshBasicMaterial({vertexColors:!0,transparent:!0,depthWrite:!1,side:l.DoubleSide}),[]);return(0,o.useEffect)(()=>()=>{m.dispose(),p.dispose()},[m,p]),(0,o.useEffect)(()=>{let e=Date.now(),t=s.current,a=t[t.length-1];if(e-u.current<1e3||a&&.5>Math.hypot(i.x-a.x,i.y-a.y))return;u.current=e;let r=Number.isFinite(n)?n:a?.ratio;for(t.push({x:i.x,y:i.y,ratio:r});t.length>360;)t.shift();let o=0;for(let e=t.length-1;e>0;e--)if((o+=Math.hypot(t[e].x-t[e-1].x,t[e].y-t[e-1].y))>900){t.splice(0,e-1);break}},[i,n]),(0,o.useEffect)(()=>{let e=s.current,t=m.attributes.position.array,a=m.attributes.color.array,r=new l.Color,o=e[e.length-1]?.ratio,u=[...e,{x:i.x,y:i.y,ratio:Number.isFinite(n)?n:o}],d=Math.min(u.length,360),f=u.length-d,p=u.some(e=>Number.isFinite(e.ratio));for(let e=0;e<d;e++){let o=u[f+e],n=u[Math.max(f,f+e-1)],s=u[Math.min(u.length-1,f+e+1)],l=s.x-n.x,m=s.y-n.y,v=Math.hypot(l,m)||1;l/=v,m/=v;let g=(o.x-i.x)*c,y=-(o.y-i.y)*c,x=-(.9*m),M=-(.9*l);t.set([g+x,0,y+M,g-x,0,y-M],6*e);let b=1-e/Math.max(1,d-1),w=!Number.isFinite(o.ratio)&&p?0:.5*(1-b)**.7;aH(o.ratio,h,r),a.set([r.r,r.g,r.b,w,r.r,r.g,r.b,w],8*e)}m.attributes.position.needsUpdate=!0,m.attributes.color.needsUpdate=!0,m.setDrawRange(0,Math.max(0,(d-1)*6)),m.computeBoundingSphere()},[m,i,n,h,c]),(0,r.jsx)("group",{rotation:[0,a,0],position:[0,e,0],children:(0,r.jsx)("mesh",{geometry:m,material:p,frustumCulled:!1,renderOrder:1})})};var aZ=e.i(47167),aX=e.i(78140);let aK=aZ.default.env.ASSET_PREFIX||"./",aq=`${aK}/boats/default/assets/scene-transformed.glb`,aY=({scale:e=.7})=>{let{scene:t}=(0,V.default)(),{polarSpeed:a,boatSpeed:i}=(0,td.default)(),{nodes:n}=(0,aX.useGLTF)(aq,`${aK}/draco/`),s=(0,o.useRef)(),u=(0,o.useRef)(0),c=(0,o.useRef)({polarSpeed:a,boatSpeed:i}),h=d.default.get("aisLengthScalingFactor")||.7;(0,o.useEffect)(()=>{c.current={polarSpeed:a,boatSpeed:i}},[a,i]);let f=(0,o.useMemo)(()=>new l.MeshLambertMaterial({transparent:!0,opacity:.28,depthWrite:!1}),[]);if((0,o.useEffect)(()=>{f.color.set(t.ghost)},[f,t]),(0,o.useEffect)(()=>()=>f.dispose(),[f]),(0,b.useFrame)((e,t)=>{let{polarSpeed:a,boatSpeed:r}=c.current,o=Math.min(t,.5),i=Math.exp(-o/60),n=Number.isFinite(a)&&Number.isFinite(r)?(a-r)*o*h:0;u.current=l.MathUtils.clamp(u.current*i+n,-70,70),s.current&&(s.current.position.z=-u.current,s.current.visible=Math.abs(u.current)>2)}),!Number.isFinite(a))return null;let m=[["govde_fiberglass_0",[0,.32,-.897],[0,Math.PI/2,0],[5.11,.454,1.212]],["govde_fiberglass2_0",[0,.32,-.897],[0,Math.PI/2,0],[5.11,.454,1.212]],["ustgovde_fiberglass_0",[0,.832,-2.741],[-Math.PI/2,0,0],[.566,.7,1.212]],["salma_fiberglass_0",[0,-1.953,-.739],[0,0,0],[.149,.108,.756]],["direk_fiberglass_0",[0,4.315,-1.056],[Math.PI/2,0,Math.PI],[-.113,.113,5.203]]];return(0,r.jsx)("group",{ref:s,scale:[e,e,e],visible:!1,children:m.map(([e,t,a,o])=>n[e]&&(0,r.jsx)("mesh",{geometry:n[e].geometry,material:f,position:t,rotation:a,scale:o,renderOrder:2},e))})};var aQ=e.i(83524);let aJ=()=>{let{scene:e}=(0,V.default)(),t=(0,aQ.default)();if(!t||"standOn"===t.kind||null===t.change)return null;let a=[90*Math.sin(t.change),-(90*Math.cos(t.change))],o="avoid"===t.kind?e.vesselDanger:e.target;return(0,r.jsx)(ty,{from:[0,-4],to:a,color:o,width:2,opacity:.28,fadeTo:!0,y:-.1})},a0=({angle:e,color:t,label:a})=>{let o=7.2*Math.sin(e),i=-(7.2*Math.cos(e));return(0,r.jsxs)("group",{position:[o,.05,i],rotation:[0,-e,0],children:[(0,r.jsxs)("mesh",{rotation:[-Math.PI/2,0,Math.PI],children:[(0,r.jsx)("circleGeometry",{args:[.45,3]}),(0,r.jsx)("meshBasicMaterial",{color:t})]}),(0,r.jsx)(eX.Text,{position:[0,.02,-.9],rotation:[-Math.PI/2,0,0],fontSize:.42,color:t,anchorX:"center",anchorY:"middle",font:"fonts/Roboto-Bold.ttf",children:a})]})},a1=()=>{let{scene:e}=(0,V.default)(),{heading:t,targetHeading:a,vmc:o}=(0,td.default)();return Number.isFinite(t)?(0,r.jsxs)("group",{children:[Number.isFinite(a)&&(0,r.jsx)(a0,{angle:(0,tc.wrapPi)(a-t),color:e.target,label:"TWA"}),o?.best&&(0,r.jsx)(a0,{angle:(0,tc.wrapPi)(o.best.heading-t),color:e.route,label:"VMG"})]}):null},a2={mainCar:.5,jibCar:.5,tension:.5,reefLevel:0};var a5=e.i(5941);let a3=[{label:"GV",centerDeg:180,colorKey:"accent",key:"mainCar",mode:"position"},{label:"FP",centerDeg:260,colorKey:"ok",key:"jibCar",side:"port",mode:"fill"},{label:"FS",centerDeg:100,colorKey:"danger",key:"jibCar",side:"starboard",mode:"fill"}];function a4(e,t){let a=l.MathUtils.degToRad(e-90);return[t*Math.cos(a),t*Math.sin(a)]}let a6=({label:e,value:t,centerDeg:a,color:i,dim:n})=>{let s=Math.max(0,Math.min(1,t)),u=(0,o.useMemo)(()=>{let e=[],t=a-15;for(let a=0;a<=12;a++){let o=a/12,[l,u]=a4(t+30*o,4.2),d=Math.abs(o-s),c=d<=.041666666666666664,h=d<=.125,f=.041666666666666664>=Math.abs(o-.5),m=n,p=.09,v=.3;c?(m=i,p=.16,v=1):h?(m=i,p=.09,v=.5):f&&(v=.5),e.push((0,r.jsx)(tr,{args:[p,8,8],position:[l,0,u],children:(0,r.jsx)("meshBasicMaterial",{color:m,transparent:!0,opacity:v})},a))}return e},[s,a,i,n]),d=l.MathUtils.degToRad(a-90),c=3.6*Math.cos(d),h=3.6*Math.sin(d);return(0,r.jsxs)("group",{children:[u,(0,r.jsx)(eX.Text,{position:[c,-.4,h],color:i,fontSize:.3,rotation:[-Math.PI/2,0,Math.PI/2-d],font:"fonts/Roboto-Bold.ttf",anchorY:"middle",fillOpacity:.9,children:e})]})},a8=({label:e,value:t,centerDeg:a,color:i,active:n,dim:s,disabled:u})=>{let d=Math.max(0,Math.min(1,t)),c=(0,o.useMemo)(()=>{let e=[],t=a-15;for(let a=0;a<=12;a++){let o=a/12,[l,c]=a4(t+30*o,4.2),h=u,f=.09,m=.15;if(n){let e=o<=d;.041666666666666664>=Math.abs(o-d)?(h=i,f=.16,m=1):e?(h=i,m=.7):(h=s,m=.3)}e.push((0,r.jsx)(tr,{args:[f,8,8],position:[l,0,c],children:(0,r.jsx)("meshBasicMaterial",{color:h,transparent:!0,opacity:m})},a))}return e},[d,a,i,n,s,u]),h=l.MathUtils.degToRad(a-90),f=3.6*Math.cos(h),m=3.6*Math.sin(h);return(0,r.jsxs)("group",{children:[c,(0,r.jsx)(eX.Text,{position:[f,-.4,m],color:n?i:u,fontSize:.3,rotation:[-Math.PI/2,0,Math.PI/2-h],font:"fonts/Roboto-Bold.ttf",anchorY:"middle",fillOpacity:n?.9:.2,children:e})]})},a7=()=>{let e=(0,V.default)(),t=(0,h.useSignalKPath)("environment.wind.angleApparent",0),a=(0,h.useSignalKPath)("environment.wind.speedApparent",0),i=(0,o.useMemo)(()=>{let e=t;for(;e<0;)e+=2*Math.PI;for(;e>=2*Math.PI;)e-=2*Math.PI;return e>Math.PI},[t]),{mainCar:n,jibCar:s}=(0,o.useMemo)(()=>(function(e,t){let a=e;for(;a<0;)a+=2*Math.PI;for(;a>=2*Math.PI;)a-=2*Math.PI;let r=a>Math.PI,o=Math.max(0,1-(r?2*Math.PI-a:a)/(.75*Math.PI)),i=Math.min(1,Math.abs(t)/15),n=(1-o)*.4*i;return{mainCar:r?.5-n:.5+n,jibCar:Math.max(.05,Math.min(1,(1-o)*.7+.2*i+.1))}})(t,a),[t,a]);return(0,r.jsx)("group",{children:a3.map(t=>{let a="mainCar"===t.key?n:s,o=!0;return("port"===t.side&&(o=!i),"starboard"===t.side&&(o=i),"position"===t.mode)?(0,r.jsx)(a6,{label:t.label,value:a,centerDeg:t.centerDeg,color:e[t.colorKey],dim:e.scene.markerDim},t.label):(0,r.jsx)(a8,{label:t.label,value:a,centerDeg:t.centerDeg,color:e[t.colorKey],active:o,dim:e.scene.markerDim,disabled:e.scene.grid},t.label)})})},a9=[0,5,20];e.s(["default",0,({onUpdateInfoPanel:e,selection:t=null})=>{let{states:a}=(0,k.useOcearoContext)(),{scene:l,id:u}=(0,V.default)(),c=(0,o.useRef)(),f=(0,aB.useReplay)().active,m=d.default.get("debugShowAxes"),p=(()=>{let e,[t,a]=(0,o.useState)(a2),r=d.default.get("preferredWindSpeedPath")||"speedTrue",i=d.default.get("preferredWindDirectionPath")||"angleTrueWater",n=(0,o.useMemo)(()=>[`environment.wind.${r}`,`environment.wind.${i}`,"environment.wind.speedTrue","environment.wind.angleTrueWater","environment.wind.angleApparent","environment.wind.speedApparent","environment.wind.directionTrue","environment.wind.angleTrueGround","navigation.headingTrue","navigation.courseOverGroundTrue"],[r,i]),s=(0,h.useSignalKPaths)(n),l=s[`environment.wind.${r}`]??s["environment.wind.speedTrue"]??0,u=s["navigation.headingTrue"]??s["navigation.courseOverGroundTrue"],c=s["environment.wind.directionTrue"],f=s["environment.wind.angleTrueWater"]??s["environment.wind.angleTrueGround"]??(Number.isFinite(c)&&Number.isFinite(u)?Math.atan2(Math.sin(e=c-u),Math.cos(e)):0),m=s["environment.wind.angleApparent"]??0,p=s["environment.wind.speedApparent"]??0,v=(0,o.useCallback)((e,t)=>{a(a=>({...a,[e]:t}))},[]),g=(0,o.useCallback)(e=>{v("mainCar",e)},[v]),y=(0,o.useCallback)(e=>{v("jibCar",e)},[v]),x=(0,o.useCallback)(e=>{v("tension",e)},[v]),M=(0,o.useCallback)(e=>{let t=1.9438444924574*e;return t>25?2:+(t>18)},[]),b=(0,o.useMemo)(()=>M(l),[l,M]),w=(0,o.useMemo)(()=>({tws:l,twa:f,awa:m,aws:p}),[l,f,m,p]),S=(0,o.useMemo)(()=>({...t,reefLevel:b,...w}),[t,b,w]);return{trimState:t,windData:w,reefLevel:b,sailTrimParams:S,setMainCar:g,setJibCar:y,setTension:x,setTrimValue:v}})(),y=(0,o.useMemo)(()=>({...(0,a5.updateSailTrim)({tws:p.windData.tws,twa:p.windData.twa,awa:p.windData.awa,mainCar:p.trimState.mainCar,jibCar:p.trimState.jibCar,tension:p.trimState.tension}),trimState:p.trimState,windData:p.windData}),[p.windData,p.trimState]);return(0,r.jsxs)(o.Suspense,{fallback:(0,r.jsx)(n.Html,{children:"Loading..."}),children:[(0,r.jsx)(i.PerspectiveCamera,{makeDefault:!0,fov:60,near:5,far:"meteo"===a.oceanMode?6e4:6e3,position:a9}),(0,r.jsx)(aN,{}),(0,r.jsx)(s.default,{home:a9,enableZoom:!0,enableRotate:!0,maxPolarAngle:Math.PI/2,minPolarAngle:Math.PI/4,enableDamping:!1,zoomSpeed:.5,rotateSpeed:.5}),(0,r.jsx)(aL.default,{backdrop:"black"===a.oceanMode||"water"===a.oceanMode,fogNear:600,fogFar:4200,fogColor:"water"===a.oceanMode?l.skyHorizon:void 0}),(0,r.jsxs)("group",{position:[0,-3,0],children:[(0,r.jsx)(g.default,{position:[0,.2*("chart"===a.oceanMode||"depth"===a.oceanMode||"meteo"===a.oceanMode),0],scale:[.7,.7,.7],ref:c,showSail:!0,onUpdateInfoPanel:e,sailTrimData:y,heave:"water"===a.oceanMode}),!1!==d.default.get("showGhostBoat")&&(0,r.jsx)(aY,{scale:.7}),"water"===a.oceanMode&&(0,r.jsx)(an,{}),("chart"===a.oceanMode||"depth"===a.oceanMode||"meteo"===a.oceanMode)&&(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(ai,{}),(0,r.jsx)(G,{lite:!0,sky:!1,horizon:l.skyHorizon,liteColor:"day"===u?0xb4cbd1:l.sea,fogDensity:"meteo"===a.oceanMode?3e-5:void 0,water:"depth"!==a.oceanMode})]}),"depth"===a.oceanMode&&(0,r.jsx)(aF.default,{}),"depth"===a.oceanMode&&(0,r.jsx)(er,{mode:"chart",opacity:.2}),"meteo"===a.oceanMode&&(0,r.jsx)(az,{}),"chart"===a.oceanMode&&(0,r.jsx)(er,{mode:"chart"}),"meteo"===a.oceanMode&&(0,r.jsx)(er,{mode:"meteo"}),"black"===a.oceanMode&&(0,r.jsx)(aW.default,{}),(0,r.jsx)(aV,{}),(0,r.jsx)(v,{y:"chart"===a.oceanMode||"depth"===a.oceanMode||"meteo"===a.oceanMode?-.1:-.3}),(0,r.jsx)(a$,{}),a.showLaylines3D&&(0,r.jsx)(tw,{}),(0,r.jsx)(aJ,{}),a.showPolar&&"black"===a.oceanMode&&(0,r.jsx)(tD,{}),(0,r.jsx)(a_,{}),"meteo"!==a.oceanMode&&(0,r.jsx)(te,{waterLevel:"chart"===a.oceanMode?-.1:-.3}),a.ais&&!f&&(0,r.jsx)(e$,{onUpdateInfoPanel:e,selectedMmsi:t?.kind==="ais"?t.mmsi:null}),(0,r.jsx)(tu,{visible:!0}),(0,r.jsx)(a1,{}),!1!==d.default.get("showSailTrimSliders")&&(0,r.jsx)(a7,{})]}),m&&(0,r.jsx)("axesHelper",{args:[100]})]})}],67225)},59465,function(e){e.n(e.i(67225))}]);