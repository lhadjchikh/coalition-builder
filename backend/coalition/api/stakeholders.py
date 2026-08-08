from django.db.models import QuerySet
from django.http import HttpRequest
from ninja import Router
from ninja.errors import HttpError

from coalition.stakeholders.models import Stakeholder

from .schemas import StakeholderOut

router = Router()


@router.get("/", response=list[StakeholderOut])
def list_stakeholders(request: HttpRequest) -> QuerySet[Stakeholder]:
    can_view_stakeholders = (
        request.user.is_authenticated
        and request.user.is_staff
        and request.user.has_perm("stakeholders.view_stakeholder")
    )
    if not can_view_stakeholders:
        raise HttpError(403, "Stakeholder view permission required")
    return Stakeholder.objects.all()
