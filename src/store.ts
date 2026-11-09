import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Settings = {
    tool: 'brush' | 'eraser'
    brushSize: number
    faceSize: number

    ribs: number
    ribDepth: number
    squash: number
    flatness: number
    top: number
    color: string
    stemHeight: number
    stemWidth: number
    stemTilt: number
    stemColor: string

    lightOn: boolean
    lightColor: string
    flicker: string
    brightness: number
    lightHeight: number

    skyTop: string
    skyBottom: string
    ground: string
    showGround: boolean
    fog: number

    bloom: boolean
    bloomIntensity: number
    bloomThreshold: number
    moon: boolean
    stars: boolean
    embers: boolean
    bats: boolean

    imgMode: 'dark' | 'light'
    imgThreshold: number
    stampSize: number
    stampRotation: number
}

export const DEFAULTS: Settings = {
    tool: 'brush',
    brushSize: 30,
    faceSize: 1,
    ribs: 14,
    ribDepth: 0.05,
    squash: 0.8,
    flatness: 1,
    top: 0.06,
    color: '#e8731a',
    stemHeight: 0.3,
    stemWidth: 1,
    stemTilt: 0.15,
    stemColor: '#4a3320',
    lightOn: true,
    lightColor: 'candle',
    flicker: 'candle',
    brightness: 1,
    lightHeight: -0.4,
    skyTop: '#0b0713',
    skyBottom: '#2a1640',
    ground: '#3a2450',
    showGround: true,
    fog: 0.06,
    bloom: true,
    bloomIntensity: 1.2,
    bloomThreshold: 0.3,
    moon: true,
    stars: true,
    embers: true,
    bats: true,
    imgMode: 'dark',
    imgThreshold: 128,
    stampSize: 400,
    stampRotation: 0,
}

export const PUMPKIN_KEYS = [
    'ribs', 'ribDepth', 'squash', 'flatness', 'top', 'color', 'stemHeight',
    'stemWidth', 'stemTilt', 'stemColor'
] as (keyof Settings)[]

export const SHAPE_PRESETS: Record<string, Partial<Settings>> = {
  squat: { squash: 0.7, flatness: 1.4, ribs: 16, ribDepth: 0.07, top: 0.08 },
  tall: { squash: 1, flatness: 1, ribs: 12, ribDepth: 0.05, top: 0.06 },
  round: { squash: 0.92, flatness: 1, ribs: 10, ribDepth: 0.03, top: 0.05 },
  ribby: { squash: 0.78, flatness: 1.3, ribs: 18, ribDepth: 0.1, top: 0.07 },
}

export const SCENE_PRESETS: Record<string, Partial<Settings>> = {
  midnight: { skyTop: '#0b0713', skyBottom: '#2a1640', ground: '#3a2450' },
  dusk: { skyTop: '#1b1030', skyBottom: '#9a4a32', ground: '#4a2a2a' },
  haunted: { skyTop: '#06120e', skyBottom: '#24503c', ground: '#1f3a2c' },
  moonlit: { skyTop: '#0a1230', skyBottom: '#4a5c96', ground: '#2c3556' },
  foggy: { skyTop: '#1c1c24', skyBottom: '#64647a', ground: '#4a4a5a' },
}

export type Actions = {
  undo: () => void
  redo: () => void
  clear: () => void
  exportStencil: () => void
  exportRender: () => void
  importImage: () => void
  beginShape: (kind: string) => void
  stampFace: (name: string) => void
  apply: () => void
  cancel: () => void
}

const noop = () => {}

type Runtime = {
    panel: 'pumpkin' | 'light' | 'scene' | 'effects' | null
    menu: 'shapes' | 'faces' | null
    touchMode: 'paint' | 'rotate'
    stamping: null | 'image' | 'shape'
    actions: Actions
}

export type Store = Settings & Runtime & {
    update: (p:Partial<Settings & Runtime>) => void
    reset: (keys: (keyof Settings)[]) => void
    setActions: (a:Actions) => void
}

export const useUI = create<Store>()(
    persist(
        (set) => ({
            ...DEFAULTS,
            panel: null,
            menu: null,
            touchMode: 'paint',
            stamping: null,
            actions: {
            undo: noop, redo: noop, clear: noop, exportStencil: noop, exportRender: noop,
            importImage: noop, beginShape: noop, stampFace: noop, apply: noop, cancel: noop,
            },
            update: (p) => set(p),
            reset: (keys) => set(Object.fromEntries(keys.map((k) => [k, DEFAULTS[k]])) as Partial<Settings>),
            setActions: (actions) => set({ actions }),
        }),
        {
            name: 'kaboo-settings',
            partialize: (s) => Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k,s[k as keyof Settings]])) as Settings,
        }
    )
)

export function isTyping(e: KeyboardEvent) {
    const t = e.target as HTMLElement
    if(t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')return true
    if(t.tagName === 'INPUT'){
        const type = (t as HTMLInputElement).type
        return type === 'text' || type === 'number'
    }
    return false
}
