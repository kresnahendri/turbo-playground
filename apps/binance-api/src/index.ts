import { createServer } from "@marblejs/http"
import { IO } from "fp-ts/lib/IO"
import { listener } from "./http.listener"

const server = createServer({
  port: process.env.PORT ? Number(process.env.PORT) : 4000,
  hostname: "localhost",
  listener,
})

const main: IO<void> = async () => {
  await (
    await server
  )()
}

main()
