# Research de desempeño — SWE-bench Pro por modelo (junio 2026)

Datos para cargar el bloque `swePro` de `pricing.json`. Metodología **vendor-first** (confiar en el dato del proveedor). Alimenta las tareas de datos y la revisión humana de cierre. ⚠️ **Los valores `estimate` son provisionales**: requieren validación antes de fijarlos.

## Caveat metodológico (clave)

Confiamos en el número que **cada proveedor publica** para sus modelos. Implicaciones asumidas:

- **Los proveedores solo publican Pro de sus buque-insignia.** Confirmado en sus tablas: Anthropic publica Fable 5 y Opus 4.8; OpenAI publica GPT-5.5; Google publica Gemini 3.1 Pro. Sonnet 4.6, Haiku 4.5, GPT-5.4/mini/nano y los Flash **no tienen número de proveedor** → `estimate`.
- **Los scaffolds vendor inflan 15–30 puntos** sobre el estandarizado de Scale (SEAL) y **difieren entre proveedores**. Por eso el KPI sube respecto a una base SEAL y la comparación de desempeño **entre familias es indicativa, no equivalente**. El disclaimer de la UI lo advierte.

**Regla de carga**: (1) `vendor` si el proveedor publica el número → `high`; (2) `estimate` anclado al flagship de la **misma familia** cuando no lo publica → `low`; (3) `standard` (SEAL) solo como último recurso, marcado por no ser comparable con los anclas vendor de su familia → `medium`.

## Números publicados por el proveedor (base `vendor`)

| modelo | score | fuente |
|---|---|---|
| Claude Fable 5 | 80,3 | Anthropic (scaffold propio) |
| Claude Opus 4.8 | 69,2 | Anthropic (scaffold propio) |
| GPT-5.5 | 58,6 | OpenAI (scaffold propio) |
| Gemini 3.1 Pro | 46,1 | Google (set comercial) |

Referencia estandarizada SEAL (NO se cargan salvo último recurso; sirven para anclar las estimaciones intra-familia): GPT-5.4 xHigh 59,1 · Opus 4.6 51,9 · Opus 4.5 45,9 · Sonnet 4.5 43,6 · GPT-5.2 Codex 41,0 · Haiku 4.5 39,5.

## Carga propuesta a `pricing.json`

> `effective_date` 2026-06-13 salvo medición fechada. Estimaciones ancladas al flagship vendor de su familia usando las proporciones intra-familia del board SEAL.

### Anthropic (ancla: Opus 4.8 = 69,2 vendor)

| modelo | score | basis | confidence | razonamiento |
|---|---|---|---|---|
| fable | 80.3 | vendor | high | Publicado por Anthropic. |
| opus | 69.2 | vendor | high | Publicado por Anthropic. |
| sonnet | 62 | estimate | low | Sin Pro de Anthropic. En SEAL Sonnet 4.5 ≈ 95% de Opus 4.5 → sobre Opus vendor 69,2 ⇒ ~62 (Pro comprime mucho la distancia Opus↔Sonnet). |
| haiku | 54 | estimate | low | Sin Pro de Anthropic. SEAL Haiku/Opus 4.5 ≈ 0,86 → sobre 69,2 vendor ⇒ ~54 (escala vendor, no el 39,5 SEAL). |

### OpenAI (ancla: GPT-5.5 = 58,6 vendor)

| modelo | score | basis | confidence | razonamiento |
|---|---|---|---|---|
| gpt-5.5 | 58.6 | vendor | high | Publicado por OpenAI. |
| gpt-5.4 | 55 | estimate | low | Sin Pro vendor del 5.4 estándar (el 59,1 SEAL es a esfuerzo xHigh, no comparable). Un escalón por debajo del flagship. |
| gpt-5.4-mini | 42 | estimate | low | Sin medición; tier medio. |
| gpt-5.4-nano | 30 | estimate | low | Sin medición; tier ultra-barato. |

### Google (ancla: Gemini 3.1 Pro = 46,1)

| modelo | score | basis | confidence | razonamiento |
|---|---|---|---|---|
| gemini-3.1-pro-preview | 46.1 | vendor | high | Número de Google (set comercial). Rinde como un Sonnet, no como frontera. |
| gemini-3.5-flash | 38 | estimate | low | Sin medición; clase Flash, por debajo del Pro. |
| gemini-3.1-flash-lite | 25 | estimate | low | Sin medición; tier ultra-barato. |

## Lecturas para los `learnings` / disclaimer

- **Asimetría de gamas**: Google no tiene modelo de tier frontera (su "Pro" ≈ Sonnet); OpenAI no tiene halo tipo Fable; Anthropic carece de tier ultra-barato bajo Haiku.
- **Inflación vendor**: las cifras de Anthropic corren ~15–30 puntos por encima de las SEAL; comparar el % entre familias es orientativo.
- **Cobertura**: solo 4 números son de proveedor; el resto son estimaciones marcadas `≈`/`low` y pendientes de revisión humana.

## Fuentes

- SWE-bench Pro Leaderboard 2026, scores vendor por modelo (morphllm): https://www.morphllm.com/swe-bench-pro
- Claude benchmarks — Fable/Opus/Sonnet/Haiku (morphllm): https://www.morphllm.com/claude-benchmarks
- Scale SEAL — SWE-bench Pro (public, anclas de estimación): https://labs.scale.com/leaderboard/swe_bench_pro_public
- Best AI Model for Coding, jun 2026 (morphllm): https://www.morphllm.com/best-ai-model-for-coding
- SWE-bench Leaderboard 2026 (codeant): https://www.codeant.ai/blogs/swe-bench-scores
