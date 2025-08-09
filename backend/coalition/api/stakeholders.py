from django.db.models import QuerySet
from django.http import HttpRequest
from ninja import Router

from coalition.stakeholders.models import Stakeholder

from .schemas import StakeholderOut

router = Router()


@router.get("/", response=list[StakeholderOut])
def list_stakeholders(request: HttpRequest) -> QuerySet[Stakeholder]:
    return Stakeholder.objects.all()
