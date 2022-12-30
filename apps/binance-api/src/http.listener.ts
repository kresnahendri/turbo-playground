import { logger$ } from "@marblejs/middleware-logger"
import { bodyParser$ } from "@marblejs/middleware-body"
import { combineRoutes, HttpListener, httpListener } from "@marblejs/http"
import { Reader } from "fp-ts/lib/Reader"
import { Context } from "@marblejs/core"
import { cors$ } from "@marblejs/middleware-cors"
import { api$ } from "./api.effects"
import {
  getAggTradesPricesEffect$,
  getEmaDistanceSignal$,
} from "./binance.effects"

const middlewares = [
  logger$(),
  bodyParser$({
    type: ["application/json"],
  }),
  cors$({
    origin: "*",
    allowHeaders: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
]
const binanceEffects$ = combineRoutes("/binance", {
  effects: [getAggTradesPricesEffect$],
})
const effects = [api$, binanceEffects$, getEmaDistanceSignal$]

export const listener: Reader<Context, HttpListener> = httpListener({
  middlewares,
  effects,
})
