Bills are optional. Add them when a campaign is tied to specific legislation.

Scroll to the **Bills** section at the bottom of the campaign edit page and click
**Add another Bill**.

## The fields

| Field | What to enter |
|---|---|
| **Level** | Federal or State |
| **Title** | The bill's official title |
| **Chamber** | U.S. House, U.S. Senate, State House, State Senate, State Assembly, House of Delegates, House of Representatives, or General Assembly |
| **Number** | Just the digits — `442`, not "SB 442." The system adds the prefix based on the chamber. |
| **Session** | Congressional session (e.g. `119`) or state session (e.g. `2025-2026`) |
| **State** | Required for state bills. Must be left blank for federal bills. |
| **Introduced date** | The date it was filed |
| **Status** | Free text — "In Committee," "Passed House." Keep it current while the legislature is sitting. |
| **Is primary** | Check this for the single main bill of the campaign |

!!! warning "State and Level have to agree"
    A state bill without a state, or a federal bill with one, is refused when you
    save and the error message says which. This is the most common reason a bill
    won't save.

The system assembles the display name for you: a federal Senate bill numbered 442
shows as "S. 442"; a Maryland State Senate bill numbered 442 shows as
"Maryland SB 442."

## The fields that aren't on the campaign form

The inline form inside a campaign is deliberately short. To add the bill's official
URL, its sponsors and cosponsors, or a companion bill in the other chamber, save
the campaign first, then open the bill from
[Campaigns → Bills]({% url 'admin:campaigns_bill_changelist' %}) — the fuller edit
form lives there.

Note that **Is primary** is editable directly in the bill list, with a Save button
at the bottom of the page. Handy, and easy to click by mistake.
