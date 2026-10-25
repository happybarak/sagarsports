from django.test import SimpleTestCase
from django.urls import resolve, reverse


class HealthCheckTests(SimpleTestCase):
    def test_health_check_url_resolves(self):
        match = resolve("/api/health/")
        self.assertEqual(match.view_name, "health-check")

    def test_health_check_reverse(self):
        self.assertEqual(reverse("health-check"), "/api/health/")

    def test_health_check_get_returns_ok(self):
        response = self.client.get("/api/health/", HTTP_HOST="localhost")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("Content-Type"), "application/json")
        self.assertEqual(response.json(), {"status": "ok"})
