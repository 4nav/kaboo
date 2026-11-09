# Kaboo 🎃

A 3D pumpkin carving studio where you can make and customize your own jack-o'-lantern.


[**Try Kaboo**](https://kaboo-gules.vercel.app/)

## Features

- **Free carving:** Draw directly onto the pumpkin to carve and erase parts of your design.
- **Image import:** Import your own images and stamp, move, rotate, and resize them on the pumpkin.
- **Shapes:** Add circles, rectangles, and triangles to your design.
- **Face presets:** Start with preset jack-o'-lantern faces.
- **Custom lighting:** Change the internal lights to get different glowing effects.
- **Scene customization:** Change the background, ground, and visual effects.
- **Save your work:** Your designs are saved locally in your browser.

## Running locally

You'll need Node.js and npm.

```bash
git clone https://github.com/4nav/kaboo
cd kaboo
npm install
npm run dev
```

Open the local URL printed in your terminal.

## How it works

The pumpkin is rendered using React Three Fiber. Carving is handled through a 2D canvas texture mapped onto the pumpkin. Raycasting gets the UV coordinates of the point you're drawing on, which lets the canvas update in the corresponding position.

The canvas is used as an alpha map to create actual holes in the pumpkin, with a darker interior and lighting to give the carved areas their glow.

## Credits

Built with React, TypeScript, Three.js, and React Three Fiber.

Some parts of the project were unfortunately developed with AI assistance, including UI styling, icon generation, the carving effect, and preset faces.
