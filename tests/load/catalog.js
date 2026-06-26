import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 50 }, // Ramp up to 50 users
    { duration: "1m", target: 50 }, // Stay at 50 users for 1 min
    { duration: "30s", target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests must complete below 500ms
    http_req_failed: ["rate<0.01"], // Error rate must be less than 1%
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  // Simula um usuário abrindo a página inicial
  const resHome = http.get(`${BASE_URL}/`);

  check(resHome, {
    "home status is 200": (r) => r.status === 200,
  });

  sleep(1);

  // Simula um usuário navegando para a página de produtos (busca paginada)
  const resProducts = http.get(`${BASE_URL}/produtos`);

  check(resProducts, {
    "products status is 200": (r) => r.status === 200,
  });

  sleep(1);
}
