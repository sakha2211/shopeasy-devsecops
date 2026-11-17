import http from 'k6/http';
import { check, sleep } from 'k6';

// Performance SLA & Threshold Configuration
export const options = {
  stages: [
    { duration: '5s', target: 10 }, // Ramp-up to 10 Virtual Users (VUs) over 5 seconds
    { duration: '10s', target: 10 }, // Stay at 10 VUs for 10 seconds
    { duration: '5s', target: 0 },  // Ramp-down to 0 VUs over 5 seconds
  ],
  thresholds: {
    // Pipeline FAIL rule: 95% of requests must complete in under 200ms
    http_req_duration: ['p(95)<200'],
    // Pipeline FAIL rule: HTTP errors must be less than 1%
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8085';

export default function () {
  // 1. Load test GET /health
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });

  // 2. Load test GET /api/products
  const productsRes = http.get(`${BASE_URL}/api/products`);
  check(productsRes, {
    'products status is 200': (r) => r.status === 200,
  });

  // 3. Load test POST /api/orders
  const payload = JSON.stringify({ productId: 1, quantity: 2 });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const orderRes = http.post(`${BASE_URL}/api/orders`, payload, params);
  check(orderRes, {
    'order status is 201': (r) => r.status === 201,
  });

  // Simulate realistic user pause between actions
  sleep(1);
}