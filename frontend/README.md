# MyWay Web

Interactive React/Vite client for the MyWay preference-aware route-ranking engine.

## Run locally

```bash
npm install
VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

`VITE_API_BASE_URL` may include a trailing slash; the client normalizes it before requesting `/rank-routes`.

## Build

```bash
npm run build
```

## Vite notes

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
