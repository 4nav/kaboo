import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Pumpkin from "./Pumpkin"

export default function App() {
  return (
    <div style={{width: '100vw', height: '100vh', background: '#0b0713'}}>
      <Canvas shadows camera = {{position: [0,0.8,3.5], fov: 45}}>
        <color attach="background" args={['#0b0713']}/>
        <ambientLight intensity={0.5} color="#a69aff"/>

        <directionalLight position={[4,6,5]} intensity={2.5} color="#fff0d6" castShadow/>

        <pointLight position={[-3, 1.5, 2]} intensity={25} distance={10} color="#ff8c42" />
         <pointLight position={[2, 2, -3]} intensity={18} color="#7770ff" distance={10} />

        <Pumpkin/>
        <mesh rotation={[-Math.PI/2, 0,0]} position={[0, -0.85, 0]}>
          <planeGeometry args = {[20,20]} />
          <meshStandardMaterial color="#1a1024" roughness={1}/>
        </mesh>
        <OrbitControls makeDefault enablePan={false} minDistance={2} maxDistance={8} />
      </Canvas>
    </div>
  )
}