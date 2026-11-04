import { useMemo } from "react"
import * as THREE from "three"
import { useControls } from "leva"

type Shape = {
  ribs: number
  ribDepth: number
  squash: number
  flatness: number
  top: number
}


function makePumpkin({ribs, ribDepth, squash, flatness, top} : Shape){
    const g = new THREE.SphereGeometry(1,128,96)
    const pos = g.attributes.position
    const v = new THREE.Vector3()

    for(let i = 0; i < pos.count; ++i){
        v.fromBufferAttribute(pos, i)
        const angle = Math.atan2(v.z, v.x)
        const ring  = Math.sqrt(v.x * v.x + v.z * v.z)
        const lobe = Math.sqrt(Math.abs(Math.cos((angle * ribs) / 2)))
        const rib = 1 - ribDepth * (1 - lobe) * ring
        v.x *= rib
        v.z *= rib
        v.y = Math.sign(v.y) * Math.pow(Math.abs(v.y), flatness) * squash
        if(v.y > 0)v.y -= (top * Math.exp(-ring * ring * 10))
            pos.setXYZ(i, v.x, v.y, v.z)
    }
    g.computeVertexNormals()
    return g
}

export default function Pumpkin() {
    const shape = useControls('Pumpkin', {
        ribs: {value: 12, min: 6, max: 20, step: 1},
        ribDepth: {value: 0.06, min: 0, max: 0.15, step: 0.005},
        squash: {value: 0.75, min: 0.5, max: 1, step: 0.01},
        flatness: {value: 1.3, min: 1, max: 2, step: 0.01},
        top: {value: 0.1, min: 0, max: 0.3, step: 0.01},
    })

    const geometry = useMemo( () => makePumpkin(shape), [shape.ribs, shape.ribDepth, shape.squash, shape.flatness, shape.top])

    return (
        <group position = {[0, -0.85 + shape.squash, 0]}>
            <mesh geometry={geometry} castShadow>
                <meshStandardMaterial color="#e8731a" roughness={0.6}/>
            </mesh>
            <mesh position={[0,0.88,0]} rotation={[0,0,0.15]}>
                <cylinderGeometry args={[0.08,0.13,0.3,12]}/>
                <meshStandardMaterial color="#4a3320" roughness={0.9}/>
            </mesh>
        </group>
    )
}