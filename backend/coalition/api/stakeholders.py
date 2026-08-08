from django.db.models import QuerySet
from django.http import HttpRequest
from ninja import Router
from ninja.errors import HttpError

from coalition.stakeholders.models import Stakeholder

from .schemas import StakeholderOut

router = Router()


@router.get("/", response=list[StakeholderOut])
def list_stakeholders(request: HttpRequest) -> QuerySet[Stakeholder]:
    if not request.user.is_authenticated or not request.user.is_staff:
        raise HttpError(403, "Admin access required for stakeholder list")
    return Stakeholder.objects.all()
