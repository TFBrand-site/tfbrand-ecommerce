import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 20 },
    { duration: "30s", target: 20 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<800"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  // A simulação de um checkout com idempotência seria um POST (ex: usando API route)
  // No caso da TFBrand, o Supabase é acessado via SDK do lado do cliente (browser).
  // Este teste serve para testar as rotas estáticas/server-side renders

  const resCheckout = http.get(`${BASE_URL}/checkout`);

  check(resCheckout, {
    "checkout page status is 200": (r) => r.status === 200,
  });

  sleep(1);
}
