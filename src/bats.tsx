import {useMemo, useRef} from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function wingShape() {
    const s = new THREE.Shape()
    s.moveTo(0, 0.04)
    s.lineTo(0.1, 0.13)
    s.lineTo(0.22, 0.1)
    s.lineTo(0.34, 0.2)
    s.lineTo(0.3, 0.03)
    s.lineTo(0.22, 0.0)
    s.lineTo(0.15, -0.09)
    s.lineTo(0.07, -0.03)
    s.closePath()
    return s
} 

function Bat({seed}: {seed: number}){
    const ref = useRef<THREE.Group>(null)
    const wing = useMemo(() => new THREE.ShapeGeometry(wingShape()), [])

    useFrame(({clock}) => {
        const g = ref.current
        if(!g)return
        const t = clock.elapsedTime * 0.35 + seed * Math.PI * 2
        const r = 2.6 + (Math.floor(seed * 10) % 3) * 0.6
        const b = Math.sin(1.7 * t + 5* seed)/2
        g.position.set(Math.cos(t)*r, 1.3 + b + (Math.floor(10*seed)  % 2) * 0.6, Math.sin(t) * r)
        g.rotation.y = -t
        g.scale.set(1, 0.55 + 0.45 * Math.sin(clock.elapsedTime * 14 + seed * 3), 1)
    })

    return(
        <group ref = {ref}>
            <mesh geometry={wing}>
                <meshBasicMaterial color="#07040d" side={THREE.DoubleSide} fog={false}/>
            </mesh>

            <mesh geometry={wing} scale={[-1,1,1]}>
                <meshBasicMaterial color="#07040d" side={THREE.DoubleSide} fog={false} />
            </mesh>
            <mesh>
                <sphereGeometry args={[0.05, 10, 10]} />
                <meshBasicMaterial color="#07040d" fog={false} />
            </mesh>
        </group>
    )
}

export default function Bats({count = 5}: {count?: number}){
    return(
        <>
        {Array.from({length: count}, (_, i) => (
            <Bat key={i} seed={i / count}/>
        ))}
        </>
    )
}