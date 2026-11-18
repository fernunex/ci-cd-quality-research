# Prototipo de verificación de calidad (Etapa 3, primera parte)

Código de práctica para verificar las reglas acordadas: cobertura de líneas >= 80 % y cero errores ESLint.
**Los JSON de examples/ son datos ficticios de desarrollo; NO son mediciones del experimento.**

## Requisitos
- Node.js >= 22.13.0 y npm

## Configuración
```bash
npm install --save-dev typescript tsx vitest @types/node
npm test
npm run typecheck
npm run verify:conventional -- examples/E1.json
npm run verify:conventional -- examples/E2.json
```

La verificación genera `prototype-data/conventional.jsonl` (excluido de Git).

## Diseño
- `src/quality-rules.ts`: validación de métricas y lógica determinista.
- `src/conventional.ts`: CLI, validación, decisión y registro local.
- `test/quality-rules.test.ts`: pruebas unitarias de las reglas.
- `examples/`: cuatro entradas ficticias para desarrollo.

Este prototipo inicial NO mide todavía tiempos experimentales y NO envía transacciones blockchain. La implementación del contrato Solidity, los reportes reales de Vitest y ESLint, la instrumentación de tiempo y el experimento emparejado se realizarán en las siguientes actividades.

Guarda y versiona `package-lock.json` después de `npm install` para fijar las dependencias.
