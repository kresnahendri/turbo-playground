import { useRouter } from "next/router"
import { CSSProperties } from "react"
import { useQuery } from "react-query"

type AggTradesResponse = {
  data: {
    volume: number
    price: number
    side: "buy" | "sell"
  }[]
}
export default function Web() {
  const containerHeight = 500
  const router = useRouter()
  const symbol = (router.query.symbol as string) || "BTCUSDT"
  const aggTradesPrices = useQuery<AggTradesResponse, Error>(
    ["BinanceAggTrades", "Prices", symbol],
    () =>
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/binance/agg-trades/prices?symbol=${symbol}`,
      ).then((res) => res.json()),
    {
      refetchInterval: 1_000,
    },
  )
  const minPrice = Math.min(
    ...(aggTradesPrices.data?.data.map(({ price }) => price) ?? []),
  )
  const minVolume = Math.min(
    ...(aggTradesPrices.data?.data.map(({ volume }) => volume) ?? []),
  )
  const tradeWithScaledPrice = aggTradesPrices.data?.data.map((trade) => {
    return {
      ...trade,
      price: trade.price - minPrice,
      volume: trade.volume - minVolume,
    }
  })

  const calculatePriceBarHeight = (val: number) => {
    const maxValue = Math.max(
      ...(tradeWithScaledPrice?.map((it) => it.price) ?? []),
    )
    const multiply = containerHeight / maxValue
    return multiply * val
  }

  const calculateVolumeBarHeight = (val: number) => {
    const maxValue = Math.max(
      ...(tradeWithScaledPrice?.map((it) => it.volume) ?? []),
    )
    const multiply = containerHeight / maxValue
    return multiply * val
  }
  const barContainerStyle: CSSProperties = {
    width: "100%",
    position: "absolute",
    bottom: 0,
    height: containerHeight,
    backgroundColor: "lightgray",
    display: "flex",
    flexWrap: "nowrap",
    alignItems: "flex-end",
    paddingTop: 16,
    opacity: 0.5,
  }

  return (
    <div
      style={{ position: "relative", height: containerHeight, width: "100%" }}>
      <div style={barContainerStyle}>
        {tradeWithScaledPrice
          ?.map((trade) => {
            const barHeight = calculateVolumeBarHeight(trade.volume)
            return {
              ...trade,
              barHeight,
            }
          })
          .map(({ barHeight, side }, i) => {
            return (
              <div
                key={i}
                style={{
                  height: barHeight,
                  width: 12,
                  backgroundColor: side === "buy" ? "green" : "red",
                }}
              />
            )
          })}
      </div>
      <div style={barContainerStyle}>
        {tradeWithScaledPrice
          ?.map((trade) => {
            return calculatePriceBarHeight(trade.price)
          })
          .map((barHeight, i) => {
            return (
              <div
                key={i}
                style={{
                  height: barHeight,
                  width: 12,
                  backgroundColor: "black",
                  opacity: 0.5,
                }}
              />
            )
          })}
      </div>
    </div>
  )
}
