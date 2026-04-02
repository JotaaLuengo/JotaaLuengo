# Polymarket Trading Bot

Bot automatizado para operar en [Polymarket](https://polymarket.com) usando la API CLOB oficial.

## Estructura

```
polymarket-bot/
├── bot.py           # Punto de entrada principal
├── client.py        # Wrapper sobre py-clob-client
├── markets.py       # Escáner de mercados y métricas
├── strategy.py      # Estrategias de trading
├── config.py        # Configuración via .env
├── requirements.txt
└── .env.example
```

## Requisitos previos

1. **Cuenta en Polymarket** con fondos USDC en Polygon.
2. **Clave privada** de la wallet vinculada a tu cuenta.
3. Python 3.11+.

## Instalación

```bash
cd polymarket-bot
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Configuración

```bash
cp .env.example .env
# Edita .env con tu clave privada y parámetros
```

Variables clave en `.env`:

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PRIVATE_KEY` | Clave privada de tu wallet (0x…) | **obligatorio** |
| `DRY_RUN` | `true` = simula sin órdenes reales | `true` |
| `MAX_POSITION_USDC` | Máximo USDC por posición | `50` |
| `MAX_OPEN_POSITIONS` | Máximo de posiciones abiertas | `5` |
| `MIN_EDGE` | Ventaja mínima para entrar (0.02 = 2%) | `0.02` |
| `STRATEGY` | `value` o `momentum` | `value` |
| `SCAN_INTERVAL_SECONDS` | Segundos entre escaneos | `60` |

## Ejecución

```bash
# Modo simulación (por defecto)
python bot.py

# Modo real (cambia DRY_RUN=false en .env)
python bot.py
```

Los logs se guardan en `logs/bot_YYYY-MM-DD.log`.

## Estrategias incluidas

### `value`
Asume que el precio justo de cada outcome binario es **50%**. Si el mercado lo
cotiza por debajo de `50% - MIN_EDGE`, compra; si lo cotiza por encima de
`50% + MIN_EDGE`, ignora (el complementario se encargará).

> Para resultados reales, reemplaza el método `_fair_probability` en
> `ValueStrategy` con tu propio modelo (ML, noticias, etc.).

### `momentum`
Compra outcomes cuyo precio está pegado al ask y con spread < 5 centavos,
interpretándolo como presión compradora reciente.

## Gestión de riesgo

- **Kelly fraccional** para el sizing (`KELLY_FRACTION * Kelly_completo`).
- Límite duro por posición (`MAX_POSITION_USDC`).
- Límite de posiciones abiertas simultáneas (`MAX_OPEN_POSITIONS`).
- Take-profit a +20%, stop-loss a -30% (activar descomentando las líneas en `bot.py`).

## Advertencia

Operar en mercados de predicción implica riesgo de pérdida total del capital
invertido. Usa siempre `DRY_RUN=true` para probar antes de arriesgar fondos
reales.
