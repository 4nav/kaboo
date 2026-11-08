import { OrbitControls, Sparkles, Stars } from "@react-three/drei";
import Pumpkin from "./Pumpkin"
import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { button, useControls } from 'leva'
import * as THREE from 'three'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import Bats from "./bats";

function Background({top, bottom}: {top: string, bottom: string}){
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const c = document.createElement('canvas')
    c.width = 2
    c.height = 512
    const ctx = c.getContext('2d')!
    const g= ctx.createLinearGradient(0,0,0,512)
    g.addColorStop(0,top)
    g.addColorStop(1,bottom)
    ctx.fillStyle = g
    ctx.fillRect(0,0,2,512)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    scene.background = tex
    return () => tex.dispose()
  }, [top, bottom, scene])
  return null
}

export default function App() {
  const [bg, setBg] = useControls('Scene', () => ({
    skyTop: '#0b0713',
    skyBottom: '#2a1640',
    ground: '#3a2450',
    showGround: true,
    fog: { value: 0.06, min: 0, max: 0.2, step: 0.005 },
  }))
  useControls('Scene presets', {
      midnight: button(() => setBg({ skyTop: '#0b0713', skyBottom: '#2a1640', ground: '#3a2450' })),
      dusk: button(() => setBg({ skyTop: '#1b1030', skyBottom: '#9a4a32', ground: '#4a2a2a' })),
      haunted: button(() => setBg({ skyTop: '#06120e', skyBottom: '#24503c', ground: '#1f3a2c' })),
      moonlit: button(() => setBg({ skyTop: '#0a1230', skyBottom: '#4a5c96', ground: '#2c3556' })),
      foggy: button(() => setBg({ skyTop: '#1c1c24', skyBottom: '#64647a', ground: '#4a4a5a' })),
  })

  const fx = useControls('Effects', {
    bloom: true,
    bloomIntensity: {value: 1.2, min: 0, max: 4, step: 0.05},
    bloomThreshold: {value: 0.3, min: 0, max: 1, step: 0.01},
    moon: true,
    stars: true,
    embers: true,
    bats: true,
  })

  return (
    <div style={{width: '100vw', height: '100vh', background: '#0b0713'}}>
      <Canvas shadows gl={{ preserveDrawingBuffer: true }} camera = {{position: [0,0.8,3.5], fov: 45}}>
        <Background top={bg.skyTop} bottom={bg.skyBottom}/>
        <fogExp2 attach="fog" args={[bg.skyBottom, bg.fog]}/>

        <ambientLight intensity={0.2} color="#a69aff"/>

        <directionalLight position={[4,6,5]} intensity={0.8} color="#fff0d6" castShadow/>

        <pointLight position={[-3, 1.5, 2]} intensity={25} distance={10} color="#ff8c42" />
         <pointLight position={[2, 2, -3]} intensity={18} color="#7770ff" distance={10} />

        <Pumpkin/>
        {fx.stars && <Stars radius={60} depth={40} count={1500} factor={5} fade speed={0.5}/>}
        {fx.moon && (
          <mesh position={[-9,7,-18]}>
            <sphereGeometry args={[1.6,32,32]}/>
            <meshBasicMaterial color="#f3eed0" toneMapped={false} fog={false} />
          </mesh>
        )}
        {fx.embers && <Sparkles count={50} scale={[6,3,6]} size={4} speed={0.3} opacity={0.8} color="#ffb060" position={[0,0.6,0]}/>}
        {fx.bats && <Bats/>}

        <EffectComposer>
          <Bloom
            mipmapBlur
            luminanceThreshold={fx.bloomThreshold}
            intensity={fx.bloom ? fx.bloomIntensity : 0}
          />
        </EffectComposer>
        {bg.showGround && (
          <mesh rotation={[-Math.PI/2, 0,0]} position={[0, -0.85, 0]}>
          <planeGeometry args = {[20,20]} />
          <meshStandardMaterial color={bg.ground} roughness={1}/>
        </mesh>
        )}
        <OrbitControls makeDefault enablePan={false} minDistance={2} maxDistance={8} maxPolarAngle={Math.PI / 2 + 0.05} />
      </Canvas>
    </div>
  )
}