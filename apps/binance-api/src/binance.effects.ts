import { r } from "@marblejs/http"
import { requestValidator$, t } from "@marblejs/middleware-io"
import { map, mergeMap } from "rxjs"
import { getAggTrades$ } from "./modules/binance"
import { runner$ } from "./scanners/agg-trades-scanner"

const aggTradesPricesQuery = t.type({
  symbol: t.string,
})

export const getAggTradesPricesEffect$ = r.pipe(
  r.matchPath("/agg-trades/prices"),
  r.matchType("GET"),
  r.useEffect((req$) =>
    req$.pipe(
      requestValidator$({
        query: aggTradesPricesQuery,
      }),
      mergeMap((req) => getAggTrades$({ symbol: req.query.symbol })),
      map((trades) => {
        return {
          body: trades,
        }
      }),
    ),
  ),
)

type EmaDistanceSignalData = {
  symbol: string
  distanceP: number
  pricePos: string
  maxLeverage: number
  volumeBuy: number
  volumeSell: number
  buySellRatio: number
  signal: string | null
}
let emaDistanceSignalData: EmaDistanceSignalData | null = null

runner$.subscribe((res) => {
  emaDistanceSignalData = res
})

export const getEmaDistanceSignal$ = r.pipe(
  r.matchPath("/signals/ema-distance"),
  r.matchType("GET"),
  r.useEffect((req$) => {
    return req$.pipe(
      map(() => {
        return {
          body: emaDistanceSignalData,
        }
      }),
    )
  }),
)
