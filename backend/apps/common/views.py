from django.http import JsonResponse
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView


class HealthCheckView(APIView):
    """
    GET /api/health/ — lightweight production health-check endpoint for
    uptime monitoring (e.g. UptimeRobot).

    Returns HTTP 200 with:
        {"status": "ok"}

    No authentication required, no CSRF requirement for GET, no database
    queries, and no external service access.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        return JsonResponse({"status": "ok"})
