# Subject experimental definitivo: Gestión de pedidos e inventario

Este paquete **se incorpora a la raíz de `ci-cd-quality-research`**. No reemplaza `src/` ni `blockchain/` de los mecanismos A/B. Se entrega como aplicación experimental con **33 funciones exportadas**, pruebas Vitest, configuración de cobertura y ESLint, cuatro manifiestos de escenario y herramientas para fijar versiones reales en Git.

## Diseño científico

- **E1:** cobertura >= 80 %, cero errores ESLint — APROBADO.
- **E2:** cobertura < 80 %, cero errores ESLint — RECHAZADO.
- **E3:** cobertura >= 80 %, al menos un error ESLint — RECHAZADO.
- **E4:** cobertura < 80 %, al menos un error ESLint — RECHAZADO.

En todos los escenarios se usa **la misma aplicación**. Los perfiles `high` y `low` cambian la *selección* de pruebas; los perfiles `clean` y `lint-error` mantienen la misma lógica de negocio y cambian únicamente la anotación `rate: number` a `rate: any` en `calculateTax`, provocando `@typescript-eslint/no-explicit-any`. La medición requiere que Vitest y ESLint confirmen cada condición; no se falsifican métricas.

Los tipos y reexportaciones (`model.ts`, `index.ts`) se excluyen del denominador de cobertura por ser archivos sin lógica ejecutable. Sí quedan cubiertos por el análisis estático aplicable.

## Instalación (desde la raíz del repositorio)

```bash
VITEST_VERSION=$(node -p "require('./node_modules/vitest/package.json').version")
npm install -D "@vitest/coverage-v8@$VITEST_VERSION" eslint typescript-eslint
npm pkg set 'scripts.subject:typecheck=tsc -p subject/tsconfig.json --noEmit'
npm pkg set 'scripts.subject:build=tsc -p subject/tsconfig.json'
npm pkg set 'scripts.subject:demo=node subject/examples/demo.mjs'
npm pkg set 'scripts.subject:metrics=node scripts/collect-subject-metrics.mjs'
npm pkg set 'scripts.subject:pair=node scripts/run-subject-pair.mjs'
```

Añade al `.gitignore` las líneas de `.gitignore.additions`; **no** subas carpetas generadas ni métricas de desarrollo.

## Demostración funcional

```bash
npm run subject:build
npm run subject:demo
```

Muestra un flujo completo de compra con reserva de inventario, facturación, impuestos, envío y confirmación del pedido. Los archivos `subject/dist/` son generados y deben permanecer fuera de Git.

## Comprobación previa sin modificar Git

```bash
npm run subject:typecheck
node scripts/collect-subject-metrics.mjs E1 --development
node scripts/collect-subject-metrics.mjs E2 --development
node scripts/collect-subject-metrics.mjs E3 --development
node scripts/collect-subject-metrics.mjs E4 --development
```

La salida mostrará `coveragePercent`, `eslintErrors` y `decision` calculados por las herramientas. Con `--development`, `commitSha` no es real y **los registros no sirven para el estudio definitivo**.

## Congelar cuatro revisiones Git (commits + tags)

**Antes:** asegúrate de estar en tu rama de investigación, de que el directorio de subject esté limpio y de que todos los archivos de este paquete estén en un commit. No fuerces ni sobrescribas tags existentes.

```bash
# El commit de incorporación del paquete es una variante E1 limpia.
node scripts/set-subject-version.mjs E1
git add subject/experiment-profile.json subject/src/billing.ts
git diff --cached
# Si no hay cambios (normal), basta etiquetar el commit del paquete:
git tag subject-e1-v1

node scripts/set-subject-version.mjs E2
git add subject/experiment-profile.json subject/src/billing.ts
git commit -m "test: freeze E2 low-coverage subject"
git tag subject-e2-v1

node scripts/set-subject-version.mjs E3
git add subject/experiment-profile.json subject/src/billing.ts
git commit -m "test: freeze E3 lint-error high-coverage subject"
git tag subject-e3-v1

node scripts/set-subject-version.mjs E4
git add subject/experiment-profile.json subject/src/billing.ts
git commit -m "test: freeze E4 lint-error low-coverage subject"
git tag subject-e4-v1

# Opcional: devolver la rama de trabajo al código limpio; los tags quedan fijos.
node scripts/set-subject-version.mjs E1
git add subject/experiment-profile.json subject/src/billing.ts
git commit -m "chore: restore clean subject in working branch"

git push origin HEAD
git push origin subject-e1-v1 subject-e2-v1 subject-e3-v1 subject-e4-v1
```

IMPORTANTE: el tag `subject-e1-v1` debe señalar un commit que **ya contenga todos los archivos** de la aplicación y su perfil E1. Comprueba `git show subject-e1-v1:subject/experiment-profile.json` antes de medir. Si existen tags con esos nombres, no los recrees: usa una nueva versión de etiqueta acordada.

## Medición con versiones reales

```bash
node scripts/collect-subject-metrics.mjs E1 --repeat 1
node scripts/collect-subject-metrics.mjs E2 --repeat 1
node scripts/collect-subject-metrics.mjs E3 --repeat 1
node scripts/collect-subject-metrics.mjs E4 --repeat 1
```

El colector extrae los archivos exactamente del commit etiquetado con `git show`, prepara un workspace aislado, corre Vitest V8, analiza ESLint (un error de lint **no** se trata como fallo de herramienta), comprueba los umbrales y crea un JSON válido para ambos verificadores en `prototype-data/experimental-inputs/`.

Para **preparar** una pareja sin transacciones:

```bash
npm run subject:pair -- E1 --repeat 1
```

Para **enviar a Sepolia** (consume ETH de prueba y presupone las credenciales ya configuradas):

```bash
export TARGET_NETWORK=sepolia
npm run subject:pair -- E1 --repeat 1 --send
```

Por seguridad, `--send` está prohibido cuando se usa `--development`. **No automatices reintentos** si una transacción llegó a enviarse. Los IDs se generan una sola vez por invocación y se debe conservar el mismo archivo ante dudas de confirmación.

## Componentes

- `subject/src/`: lógica de negocio tipada, operaciones inmutables, dinero en centavos enteros.
- `subject/test/`: 51 casos de prueba Vitest con casos normales, límites y errores.
- `subject/examples/demo.mjs`: demostración ejecutable del flujo de negocio después de compilar.
- `subject/vitest.config.mts`: cobertura de líneas V8 sobre módulos ejecutables.
- `subject/eslint.config.mjs`: lint TypeScript.
- `scenarios/`: manifiestos versionados, perfiles y tags por escenario.
- `scripts/set-subject-version.mjs`: prepara la modificación que identifica el escenario.
- `scripts/collect-subject-metrics.mjs`: obtiene métricas reales y una entrada única A/B.
- `scripts/run-subject-pair.mjs`: opción separada y explícita para enviar una pareja a Sepolia.

## Alcance y cautelas

Esta aplicación es un *subject* experimental de tamaño controlado; no es un comercio productivo ni tiene persistencia de inventario ni acceso de usuarios. No representa los costos reales de un sistema de comercio electrónico. No alteres los umbrales después de observar resultados. Documenta en la tesis que **la cobertura varía por selección de pruebas** y **las infracciones de lint se introducen de forma controlada en el código**. El mismo JSON producido para un escenario y repetición se entrega a A y B.

Antes de la fase experimental, validaremos los cuatro perfiles en tu entorno de GitHub Actions, congelaremos las versiones y fijaremos el protocolo de 5 repeticiones por escenario.

## Comprobaciones realizadas al construir el paquete

Se compiló el código de negocio con TypeScript en modo estricto, se probaron manualmente operaciones representativas en Node.js, se verificó que existen **33 funciones exportadas** y se simuló la creación y recuperación de las cuatro etiquetas en un repositorio Git temporal. **No se ejecutaron las suites de Vitest ni ESLint en este entorno**, porque sus paquetes no están disponibles localmente y el registro de paquetes no es accesible. Por ello, las coberturas exactas y la condición de ESLint deben comprobarse con los cuatro comandos `--development` antes de congelar las versiones. El colector falla si un escenario no alcanza su condición esperada.
