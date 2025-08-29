This is a [Vite](https://vitejs.dev) project bootstrapped with [`@farcaster/create-mini-app`](https://github.com/farcasterxyz/miniapps/tree/main/packages/create-mini-app).

For documentation and guides, visit [miniapps.farcaster.xyz](https://miniapps.farcaster.xyz/docs/getting-started).

## `farcaster.json`

The `/.well-known/farcaster.json` is served from the [public
directory](https://vite.dev/guide/assets) and can be updated by editing
`./public/.well-known/farcaster.json`.

You can also use the `public` directory to serve a static image for `splashBackgroundImageUrl`.

## Frame Embed

Add a the `fc:frame` in `index.html` to make your root app URL sharable in feeds:

```html
  <head>
    <!--- other tags --->
    <meta name="fc:frame" content='{"version":"next","imageUrl":"https://placehold.co/900x600.png?text=Frame%20Image","button":{"title":"Open","action":{"type":"launch_frame","name":"App Name","url":"https://app.com"}}}' /> 
  </head>
```

