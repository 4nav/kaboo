export const LIGHTS: Record<string, { light: string; glow: string }> = {
  candle: { light: '#ffa040', glow: '#ff8a1f' },
  fire: { light: '#ff6a1a', glow: '#ff4a00' },
  green: { light: '#6dff6a', glow: '#22ff44' },
  'ghost blue': { light: '#6ab8ff', glow: '#2a7bff' },
  purple: { light: '#b56aff', glow: '#8a2bff' },
  red: { light: '#ff4040', glow: '#ff1a1a' },
  white: { light: '#fff4e0', glow: '#ffe9b0' },
}

export const FLICKERS = ['steady', 'candle', 'fire', 'pulse', 'faulty']

export function flicker(kind:string, t:number){
    switch(kind){
        case 'steady':
            return 1
        case 'fire':
            return 0.85 + 0.25*Math.sin(7*t) * Math.sin(3.1 * t) + 0.12 * Math.sin(19*t + 2)
        case 'pulse':
            return 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2.4))
        case 'faulty': {
            const base = 1 + 0.08 * Math.sin(t * 9) + 0.05 * Math.sin(t * 23 + 1.3)
            return Math.sin(t * 3.7) * Math.sin(t * 13) > 0.8 ? base * 0.25 : base
        }
        default:
            return 1 + 0.08 * Math.sin(9*t) + 0.05 * Math.sin(23 * t + 1.3)
    }
}