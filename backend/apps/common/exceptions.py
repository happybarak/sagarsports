from rest_framework.views import exception_handler as drf_exception_handler


def custom_exception_handler(exc, context):
    """
    Wraps DRF's default exception handler so every error response —
    validation errors, 401s, 403s, 404s, throttling, uncaught 500s that DRF
    catches — comes back in the same shape:

        {
            "success": false,
            "message": "<human-readable summary>",
            "errors": <original DRF error detail: dict, list, or string>
        }

    This lets the frontend's Axios error handling treat every failed
    request the same way instead of branching on status code shape.
    """
    response = drf_exception_handler(exc, context)

    if response is None:
        return None

    original_detail = response.data

    if isinstance(original_detail, dict) and "detail" in original_detail and len(original_detail) == 1:
        message = str(original_detail["detail"])
    elif isinstance(original_detail, dict):
        message = "Validation failed."
    elif isinstance(original_detail, list) and original_detail:
        message = str(original_detail[0])
    else:
        message = "Something went wrong."

    response.data = {
        "success": False,
        "message": message,
        "errors": original_detail,
    }
    return response
