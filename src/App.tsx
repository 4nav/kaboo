import { OrbitControls, Sparkles, Stars } from "@react-three/drei";
import Pumpkin from "./Pumpkin"
import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import Bats from "./bats";
import UI from './UI'
import { useUI } from './store'

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
  const s = useUI()
  return (
    <div style={{width: '100vw', height: '100vh', background: '#0b0713'}}>
      <Canvas shadows gl={{ preserveDrawingBuffer: true }} camera = {{position: [0,0.8,3.5], fov: 45}}>
        <Background top={s.skyTop} bottom={s.skyBottom}/>
        <fogExp2 attach="fog" args={[s.skyBottom, s.fog]}/>

        <ambientLight intensity={0.2} color="#a69aff"/>

        <directionalLight position={[4,6,5]} intensity={0.8} color="#fff0d6" castShadow/>

        <pointLight position={[-3, 1.5, 2]} intensity={25} distance={10} color="#ff8c42" />
         <pointLight position={[2, 2, -3]} intensity={18} color="#7770ff" distance={10} />

        <Pumpkin/>

        {s.showGround && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0,-0.85, 0]}>
            <planeGeometry args={[40,40]}/>
             <meshStandardMaterial color={s.ground} roughness={1} />
          </mesh>
        )}

        {s.stars && <Stars radius={60} depth={40} count={1500} factor={5} fade speed={0.5}/>}
        {s.moon && (
          <mesh position={[-9,7,-18]}>
            <sphereGeometry args={[1.6,32,32]}/>
            <meshBasicMaterial color="#f3eed0" toneMapped={false} fog={false} />
          </mesh>
        )}
        {s.embers && <Sparkles count={50} scale={[6,3,6]} size={4} speed={0.3} opacity={0.8} color="#ffb060" position={[0,0.6,0]}/>}
        {s.bats && <Bats/>}
        <OrbitControls makeDefault enablePan={false} minDistance={2} maxDistance={8} maxPolarAngle={Math.PI / 2 + 0.05} />


        {s.bloom && (
          <EffectComposer>
            <Bloom mipmapBlur luminanceThreshold={s.bloomThreshold} intensity={s.bloomIntensity} />
          </EffectComposer>
        )}
      </Canvas>
      <UI />
    </div>
  )
}