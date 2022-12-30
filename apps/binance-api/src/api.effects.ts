import { r } from "@marblejs/http"
import { map } from "rxjs"
import { requestValidator$, t } from "@marblejs/middleware-io"

const HCQueryParams = t.union([
  t.undefined,
  t.type({
    message: t.union([t.undefined, t.string]),
  }),
])

export const api$ = r.pipe(
  r.matchPath("/hc"),
  r.matchType("GET"),
  r.useEffect((req$) =>
    req$.pipe(
      requestValidator$({
        query: HCQueryParams,
      }),
      map((req) => {
        return {
          body: `🚀 ${req.query ?? ""}`,
        }
      }),
    ),
  ),
)
