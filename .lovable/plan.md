

## Domain in Vite-Config erlauben

### Problem
Die Custom Domain `verwaltung-fahrschule.de` wird von Vite blockiert, weil sie nicht in der `allowedHosts`-Liste steht.

### Aenderung in `vite.config.ts`

`server.allowedHosts` um `verwaltung-fahrschule.de` erweitern:

```typescript
server: {
  host: "::",
  port: 8080,
  allowedHosts: ["verwaltung-fahrschule.de"],
  hmr: {
    overlay: false,
  },
},
```

Eine einzelne Aenderung, eine Datei.

