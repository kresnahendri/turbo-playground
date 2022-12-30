import Binance, { CandleChartInterval_LT } from "binance-api-node"
import dayjs from "dayjs"
import { from, map } from "rxjs"

// const binance = Binance({
//   apiKey: process.env.BINANCE_API_KEY || "",
//   apiSecret: process.env.BINANCE_API_SECRET || "",
// })

const binance = Binance()

export const getAggTrades$ = ({ symbol }: { symbol: string }) => {
  const endTime = dayjs().toDate().getTime()
  const startTime = dayjs(endTime).add(-60, "minutes").toDate().getTime()
  console.log(dayjs(startTime).format("HH:mm"), dayjs(endTime).format("HH:mm"))
  return from(binance.futuresAggTrades({ symbol, endTime, startTime })).pipe(
    map((aggTrades) => {
      const data = aggTrades.map((trade) => {
        const volume = Number(trade.price) * Number(trade.quantity)
        const { price, isBuyerMaker } = trade
        return {
          volume,
          quantity: Number(trade.quantity),
          price: Number(price),
          side: isBuyerMaker ? "sell" : "buy",
        }
      })

      const volumeSell = data.reduce((acc, it) => {
        return it.side === "sell" ? acc + it.volume : acc
      }, 0)

      const volumeBuy = data.reduce((acc, it) => {
        return it.side === "buy" ? acc + it.volume : acc
      }, 0)
      const buySellRatio = volumeBuy / volumeSell
      return {
        data,
        volumeBuy,
        volumeSell,
        buySellRatio,
      }
    }),
  )
}

export const getCoinInfos$ = () => {
  return from(binance.futuresExchangeInfo()).pipe(
    map((info) => {
      return info.symbols.filter(
        (it) => it.symbol.endsWith("USDT") && it.status === "TRADING",
      )
    }),
  )
}

export const getMaxLeverage$ = (symbol: string) => {
  return from(
    binance.futuresLeverageBracket({
      symbol,
      recvWindow: new Date().getTime(),
    }),
  ).pipe(
    map((res) => {
      return res[0].brackets[0].initialLeverage
    }),
  )
}

export const getCandles$ = ({
  symbol,
  interval,
}: {
  symbol: string
  interval: CandleChartInterval_LT
}) => {
  return from(
    binance.futuresCandles({
      symbol,
      interval,
    }),
  ).pipe(
    map((res) => {
      return res.reverse().map((it) => {
        return {
          ...it,
          open: Number(it.open),
          close: Number(it.close),
          high: Number(it.high),
          low: Number(it.low),
          volume: Number(it.volume),
          quoteVolume: Number(it.quoteVolume),
          quoteAssetVolume: Number(it.quoteAssetVolume),
          baseAssetVolume: Number(it.baseAssetVolume),
        }
      })
    }),
  )
}
