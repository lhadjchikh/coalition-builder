from django.db.models import QuerySet
from django.http import HttpRequest
from ninja import Router

from coalition.legislators.models import Legislator

from .schemas import LegislatorOut

router = Router()


@router.get("/", response=list[LegislatorOut])
def list_legislators(request: HttpRequest) -> QuerySet[Legislator]:
    return Legislator.objects.all()
