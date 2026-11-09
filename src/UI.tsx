import './ui.css'
import { PUMPKIN_KEYS, SCENE_PRESETS, SHAPE_PRESETS, useUI, type Settings } from './store'
import { FLICKERS, LIGHTS } from './lights'
import { NAMES } from './presets'

const SHAPES = ['circle', 'square', 'rectangle', 'triangle', 'star']

function Icon({name,size}:{name:string, size: number}){
    return(
        <img
        className='icon'
        src={`/icons/${name}.png`}
        alt=''
        width={size}
        height={size}
        draggable={false}
        onError={(e) => {
            e.currentTarget.style.opacity = '0'
        }}
        />
    )
}

function IconButton({icon, label, active, onClick, size = 52,}: {
  icon: string
  label: string
  active?: boolean
  onClick: () => void
  size?: number
}) {
    return (
    <button className={`ibtn${active ? ' on' : ''}`} title={label} aria-label={label} onClick={onClick}>
    <Icon name={icon} size={size} />
    </button>
    )
}

function Slider({
    label, value, min, max,step, onChange,
}: {
    label:string
    value:number
    min: number
    max: number
    step: number
    onChange: (v:number) => void
}) {
    return (
        <label className="row">
            <span>{label}</span>
            <input type='range' min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
            <em>{step < 1 ? value.toFixed(2): Math.round(value)}</em>
        </label>
    )
}

function ColorRow({label, value, onChange}: {label: string; value: string; onChange: (v:string) => void}){
    return(
        <label className='row color'>
            <span>{label}</span>
            <input type='color' value={value} onChange={(e) => onChange(e.target.value)}/>
        </label>
    )
}

function Check({label, value, onChange}: {label: string; value: boolean; onChange: (v:boolean) => void}){
    return(
        <label className='row check'>
            <span>{label}</span>
            <input type='checkbox' checked={value} onChange={(e) => onChange(e.target.checked)}/>
        </label>
    )
}

function Chips({
    options, value, onPick,
}: {
    options: string[]
    value?:string
    onPick: (o:string) => void
}) {
    return(
        <div className='chips'>
            {options.map((o) => (
                <button key={o} className={`chip${o === value ? `on`: ''}`} onClick={() => onPick(o)}>{o}</button>
            ))}
        </div>
    )
}

function PumpkinPanel() {
    const s = useUI()
    const set = s.update
    return(
        <div className='note panel'>
            <h3>pumpkin</h3>
            <Chips options={Object.keys(SHAPE_PRESETS)} onPick={(k) => set(SHAPE_PRESETS[k])}/>
            <Slider label='ribs' value={s.ribs} min={6} max={20} step={1} onChange={(k) => set({ribs: k})}/>
            <Slider label='rib depth' value={s.ribDepth} min={0} max={0.15} step={0.005} onChange={(k) => set({ribDepth: k})} />
            <Slider label='height' value={s.squash} min={0.5} max={1} step={0.01} onChange={(k) => set({squash: k})} />
            <Slider label='roundness' value={s.flatness} min={1} max={2} step={0.01} onChange={(k) => set({flatness: k})} />
            <Slider label='top dip' value={s.top} min={0} max={0.3} step={0.01} onChange={(k) => set({top: k})} />
            <ColorRow label='skin' value={s.color} onChange={(k) => set({color: k})} />
            <h4>stem</h4>
            <Slider label='length' value={s.stemHeight} min={0.1} max={0.6} step={0.01} onChange={(k) => set({stemHeight: k})} />
            <Slider label='thickness' value={s.stemWidth} min={0.5} max={2} step={0.05} onChange={(k) => set({stemWidth: k})} />
            <Slider label='bend' value={s.stemTilt} min={-0.5} max={0.5} step={0.01} onChange={(k) => set({stemTilt: k})} />
            <ColorRow label='stem color' value={s.stemColor} onChange={(k) => set({stemColor: k})}/>
            <button className="chip wide" onClick={() => s.reset(PUMPKIN_KEYS)}>reset pumpkin</button>
        </div>
    )
}

function LightPanel() {
    const s = useUI()
    const set = s.update
    return (
        <div className='note panel'>
            <h3>candle light</h3>
            <Check label="lit" value={s.lightOn} onChange={(v) => set({ lightOn: v })} />        
            <div className='dots'>
                {Object.keys(LIGHTS).map((k) => (
                    <button 
                    key={k}
                    title={k}
                    aria-label={k}
                    className={`dot${k === s.lightColor ? ' on': ''}`}
                    style={{background: LIGHTS[k].glow}}
                    onClick={() => set({lightColor: k})}
                    />
                ))}
            </div>
            <h4>flicker</h4>
            <Chips options={FLICKERS} value={s.flicker} onPick={(k) => set({flicker:k})} />
            <Slider label="brightness" value={s.brightness} min={0.2} max={3} step={0.05} onChange={(k) => set({brightness:k})}/>
            <Slider label="flame height" value={s.lightHeight} min={-0.8} max={0.6} step={0.05} onChange={(k) => set({lightHeight:k})}/>
        
        </div>
    )
}

function ScenePanel() {
  const s = useUI()
  const set = s.update
  return (
    <div className="note panel">
      <h3>scene</h3>
      <div className="chips">
        {Object.keys(SCENE_PRESETS).map((k) => {
          const p = SCENE_PRESETS[k] as Pick<Settings, 'skyTop' | 'skyBottom'>
          return (
            <button
              key={k}
              className="chip swatch"
              style={{ background: `linear-gradient(${p.skyTop}, ${p.skyBottom})` }}
              onClick={() => set(SCENE_PRESETS[k])}
            >
              {k}
            </button>
          )
        })}
      </div>
      <ColorRow label="sky top" value={s.skyTop} onChange={(v) => set({ skyTop: v })} />
      <ColorRow label="sky bottom" value={s.skyBottom} onChange={(v) => set({ skyBottom: v })} />
      <Check label="floor" value={s.showGround} onChange={(v) => set({ showGround: v })} />
      <ColorRow label="floor color" value={s.ground} onChange={(v) => set({ ground: v })} />
      <Slider label="fog" value={s.fog} min={0} max={0.2} step={0.005} onChange={(v) => set({ fog: v })} />
    </div>
  )
}
 
function EffectsPanel() {
    const s = useUI()
    const set = s.update
    return (
        <div className='note panel'>
            <h3>effects</h3>
            <Check label='glow (bloom)' value={s.bloom} onChange={(k) => set({bloom:k})}/>
            <Slider label="glow amount" value={s.bloomIntensity} min={0} max={4} step={0.05} onChange={(k) => set({bloomIntensity: k})}/>
            <Slider label="glow cutoff" value={s.bloomIntensity} min={0} max={1} step={0.01} onChange={(k) => set({bloomThreshold: k})}/>
            <Check label="moon" value={s.moon} onChange={(v) => set({ moon: v })} />
            <Check label="stars" value={s.stars} onChange={(v) => set({ stars: v })} />
            <Check label="embers" value={s.embers} onChange={(v) => set({ embers: v })} />
            <Check label="bats" value={s.bats} onChange={(v) => set({ bats: v })} />
        </div>
    )
}

export default function UI() {
    const s = useUI()
    const a = s.actions
    const set = s.update
    const togglePanel = (p: NonNullable<typeof s.panel>) => set({panel: s.panel === p ? null : p})
    const toggleMenu = (m: NonNullable<typeof s.menu>) => set({menu: s.menu === m ? null:m})

    return (
        <div className='ui'>
            <div className='logo'>Kaboo</div>

            <div className="tools">
            <IconButton icon="brush" label="carve" active={s.tool === 'brush'} onClick={() => set({ tool: 'brush', menu: null })} />
            <IconButton icon="eraser" label="un-carve" active={s.tool === 'eraser'} onClick={() => set({ tool: 'eraser', menu: null })} />
            <IconButton icon="circle" label="shapes" active={s.menu === 'shapes'} onClick={() => toggleMenu('shapes')} />
            <IconButton icon="faces" label="faces" active={s.menu === 'faces'} onClick={() => toggleMenu('faces')} />
            <IconButton icon="import_image" label="import an image" onClick={a.importImage} />
        </div>

        {s.menu === 'shapes' && (
            <div className='note menu'>
                <h3>shapes</h3>
                <div className="shapegrid">
                    {SHAPES.map((k) => (
                        <IconButton key={k} icon={k} label={k} size={46} onClick={() => a.beginShape(k)} />
                    ))}
                </div>
            </div>
        )}

        {s.menu === 'faces' && (
            <div className="note menu">
            <h3>faces</h3>
            <Chips options={NAMES} onPick={(n) => { a.stampFace(n); set({ menu: null }) }} />
            <Slider label="size" value={s.faceSize} min={0.5} max={1.6} step={0.05} onChange={(v) => set({ faceSize: v })} />
            <p className="hint">goes on the side facing you</p>
            </div>
        )}

    <div className="tabs">
        <IconButton icon="tab_pumpkin" label="pumpkin" active={s.panel === 'pumpkin'} onClick={() => togglePanel('pumpkin')} />
        <IconButton icon="tab_light" label="candle light" active={s.panel === 'light'} onClick={() => togglePanel('light')} />
        <IconButton icon="tab_scene" label="scene" active={s.panel === 'scene'} onClick={() => togglePanel('scene')} />
        <IconButton icon="tab_effects" label="effects" active={s.panel === 'effects'} onClick={() => togglePanel('effects')} />
      </div>

      {s.panel === 'pumpkin' && <PumpkinPanel />}
      {s.panel === 'light' && <LightPanel />}
      {s.panel === 'scene' && <ScenePanel />}
      {s.panel === 'effects' && <EffectsPanel />}
 
      <div className="note bar">
        <IconButton icon="undo" label="undo (Ctrl+Z)" size={44} onClick={a.undo} />
        <IconButton icon="redo" label="redo (Ctrl+Y)" size={44} onClick={a.redo} />
        <IconButton icon="clear" label="clear everything" size={44} onClick={a.clear} />
        <div className="sep" />
        <label className="brushsize" title="brush size">
          <span>{s.tool === 'eraser' ? 'eraser' : 'brush'}</span>
          <input type="range" min={4} max={120} step={1} value={s.brushSize} onChange={(e) => set({ brushSize: +e.target.value })} />
        </label>
        <div className="sep" />
        <IconButton icon="export_stencil" label="save stencil" size={44} onClick={a.exportStencil} />
        <IconButton icon="export_render" label="save picture" size={44} onClick={a.exportRender} />
        <div className="sep" />
        <IconButton
          icon={s.touchMode === 'paint' ? 'mode_paint' : 'mode_rotate'}
          label={s.touchMode === 'paint' ? 'painting (tap to switch to turning)' : 'turning (tap to switch to painting)'}
          size={44}
          onClick={() => set({ touchMode: s.touchMode === 'paint' ? 'rotate' : 'paint' })}
        />
      </div>
 
      {s.stamping && (
        <div className="note stampbar">
          <div className="stamprow">
            <IconButton icon="apply" label="place it (Enter)" size={46} onClick={a.apply} />
            <IconButton icon="cancel" label="never mind (Esc)" size={46} onClick={a.cancel} />
            <div className="grow">
              <Slider label="size" value={s.stampSize} min={40} max={2048} step={5} onChange={(v) => set({ stampSize: v })} />
              <Slider label="turn" value={s.stampRotation} min={-180} max={180} step={1} onChange={(v) => set({ stampRotation: v })} />
              {s.stamping === 'image' && (
                <>
                  <Chips
                    options={['dark', 'light']}
                    value={s.imgMode}
                    onPick={(m) => set({ imgMode: m as 'dark' | 'light' })}
                  />
                  <Slider label="cutoff" value={s.imgThreshold} min={1} max={254} step={1} onChange={(v) => set({ imgThreshold: v })} />
                </>
              )}
            </div>
          </div>
          <p className="hint">drag on the pumpkin to move it. scroll to resize, Q and E to turn.</p>
        </div>
      )}
        </div>
    )
}
