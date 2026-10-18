from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from apps.common.responses import success_response


class HealthCheckView(APIView):
    """
    GET /api/health/ — used to confirm the Django + DRF stack is up and
    correctly configured (settings, middleware, exception handler) before
    any real endpoints exist. Also useful later as an uptime check for
    deployment.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        return success_response(
            data={"status": "ok"},
            message="Sagar Sports API is running.",
        )
