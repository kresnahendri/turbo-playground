import Head from "next/head"
import { useQuery } from "react-query"
import { match, P } from "ts-pattern"

type Response = {
  symbol: string
  distanceP: number
  pricePos: string
  maxLeverage: number
  volumeBuy: number
  volumeSell: number
  buySellRatio: number
  signal: "sell" | "buy" | null
}
export default function Web() {
  const data = useQuery<Response, Error>(
    ["SignalEmaDistance"],
    () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/signals/ema-distance`).then(
        (res) => res.json(),
      ),
    {
      refetchInterval: 10_000,
    },
  )

  return (
    <>
      <Head>
        <title>Signals - EMA Distance</title>
      </Head>
      <div
        style={{
          width: "100%",
          height: "80vh",
          // padding: "70px 16px 16px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}>
        {match(data)
          .with({ status: "loading" }, () => <div>Loading...</div>)
          .with({ status: "error" }, () => <div>Error...</div>)
          .with({ data: P.select(P.not(P.nullish)) }, (it) => (
            <div>
              <h1>
                {it.symbol}{" "}
                <span
                  style={{
                    textTransform: "uppercase",
                    padding: 8,
                    color: "white",
                    backgroundColor: match(it.signal)
                      .with("buy", () => "green")
                      .with("sell", () => "red")
                      .otherwise(() => "black"),
                  }}>
                  {it.signal || "NONE"}
                </span>
              </h1>
              <div
                style={{
                  border: "1px solid black",
                  paddingLeft: 16,
                  paddingRight: 16,
                  marginTop: 20,
                }}>
                <p>B/S Ratio: {it.buySellRatio.toFixed(2)}</p>
                <p>EMA distance: {it.distanceP.toFixed(2)}</p>
                <p>Price-EMA Position: {it.pricePos}</p>
              </div>
            </div>
          ))
          .otherwise(() => (
            <div />
          ))}
      </div>
    </>
  )
}
