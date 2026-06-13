## MODIFIED Requirements

### Requirement: Formateo consciente de moneda en convención del locale activo

El formateo de toda cifra monetaria DEBE vivir en `src/lib/format.ts` y producir el símbolo de la moneda activa (€ o $) respetando la convención de **separadores y decimales del idioma activo** (`es-ES`, `fr-FR` o `en-US`: enteros para importes mensuales/anuales, 1 decimal para tarifas por hora). La **colocación del símbolo** DEBE seguir el idioma: sufijo con espacio en español y francés (p. ej. `6038 $`), prefijo pegado en inglés (p. ej. `$6,038`). El formateo DEBE recibir el locale activo (no fijar `es-ES`) y ningún componente ni gráfico DEBE contener literales de símbolo de moneda hardcodeados ni asumir un locale concreto.

#### Scenario: Importe mensual en español

- **WHEN** se formatea un importe mensual de 10.060 con idioma español
- **THEN** en EUR se muestra "10.060 €" y en USD "10.060 $", con el separador de miles es-ES y el símbolo como sufijo

#### Scenario: Importe mensual en inglés

- **WHEN** se formatea un importe mensual de 10060 con idioma inglés
- **THEN** en USD se muestra "$10,060" y en EUR "€10,060", con el separador de miles en-US y el símbolo como prefijo

#### Scenario: Importe mensual en francés

- **WHEN** se formatea un importe mensual de 10060 con idioma francés
- **THEN** se muestra con la convención fr-FR de separadores (espacio de miles) y el símbolo de la moneda activa como sufijo

#### Scenario: Tarifa por hora con un decimal según locale

- **WHEN** se formatea una tarifa de 13,8 por hora activa
- **THEN** en español/francés se muestra "13,8 €/h" o "13,8 $/h" y en inglés "$13.8/h" o "€13.8/h", según el idioma y la moneda activos
