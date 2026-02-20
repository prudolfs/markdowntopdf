import { index, type RouteConfig, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('editor', 'routes/editor.tsx'),
  route('export-pdf', 'routes/export-pdf.tsx'),
] satisfies RouteConfig
