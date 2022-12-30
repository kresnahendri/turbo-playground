import { interval, map, mergeMap, of, startWith, toArray, zip } from "rxjs"
import { EMA } from "technicalindicators"
import {
  getCandles$,
  getCoinInfos$,
  getMaxLeverage$,
  getAggTrades$,
} from "../modules/binance"

const calculateEMA = (values: number[], period = 7) => {
  const emaValues = EMA.calculate({
    period,
    values,
    reversedInput: true,
  })
  const latestEma = emaValues[0] ?? values[0] ?? -999
  const priceRatio = values[0] / latestEma
  const pricePositionOverEma = priceRatio > 1 ? "top" : "bottom"
  const distanceToPrice = priceRatio > 1 ? priceRatio - 1 : 1 - priceRatio
  const distanceToPricePercentage = distanceToPrice * 100
  return {
    values: emaValues,
    latest: latestEma,
    distanceToPrice,
    distanceToPricePercentage,
    pricePositionOverEma,
  }
}
export const main$ = () => {
  return getCoinInfos$().pipe(
    mergeMap((infos) => {
      const coinSymbols = infos.map((it) => it.symbol)
      return of(...coinSymbols).pipe(
        mergeMap((symbol) => {
          return getCandles$({ symbol, interval: "5m" }).pipe(
            map((candles) => {
              const ema = calculateEMA(candles.map((it) => it.close))
              return {
                symbol,
                candles,
                ta: {
                  ema: {
                    values: ema.values,
                    latest: ema.latest,
                    distance: ema.distanceToPrice,
                    distanceP: ema.distanceToPricePercentage,
                    pricePos: ema.pricePositionOverEma,
                  },
                },
              }
            }),
          )
        }),
      )
    }),
    toArray(),
    map((res) => {
      return res.sort((a, b) => a.ta.ema.distanceP - b.ta.ema.distanceP)
    }),
    mergeMap((res) => {
      const top = res[0]
      const bottom = res[res.length - 1]
      return of(top, bottom).pipe(
        mergeMap((it) => {
          return zip([
            getAggTrades$({ symbol: it.symbol }),
            // getMaxLeverage$(it.symbol), // TODO
            of(25),
          ]).pipe(
            map(([aggTrades, maxLeverage]) => {
              return {
                ...it,
                aggTrades,
                maxLeverage,
              }
            }),
          )
        }),
      )
    }),
    toArray(),
    map((res) => {
      return res.sort((a, b) => a.ta.ema.distanceP - b.ta.ema.distanceP)
    }),
  )
}

export const runner$ = interval(30_000)
  .pipe(startWith(0), mergeMap(main$))
  .pipe(
    map((it) => {
      const coin = it[it.length - 1]

      let signal = null
      if (
        coin.aggTrades.buySellRatio > 1 &&
        coin.ta.ema.pricePos === "bottom"
      ) {
        signal = "buy"
      }
      if (coin.aggTrades.buySellRatio < 1 && coin.ta.ema.pricePos === "top") {
        signal = "sell"
      }
      const result = {
        symbol: coin.symbol,
        distanceP: coin.ta.ema.distanceP,
        pricePos: coin.ta.ema.pricePos,
        maxLeverage: coin.maxLeverage,
        volumeBuy: coin.aggTrades.volumeBuy,
        volumeSell: coin.aggTrades.volumeSell,
        buySellRatio: coin.aggTrades.buySellRatio,
        signal,
      }
      return result
    }),
  )
