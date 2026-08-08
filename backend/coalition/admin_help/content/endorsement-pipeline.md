This is the most important page in the guide. Read it twice.

## What the endorser does

Someone visits a campaign page and fills out the form. They provide:

- Their endorser type: farmer, waterman, business, nonprofit, scientist, health
  care professional, government, individual, or other
- First and last name
- Organization and role, both optional
- If they name an organization, they must choose one of two things: **endorsing on
  behalf of the organization**, confirming they are authorized to, or **endorsing
  as an individual** who happens to work there. This distinction matters enormously
  — see [What to approve, what to reject]({% url 'admin_help:page' 'judgment-calls' %}).
- Email address
- Full mailing address, used to map them to their legislative districts
- An optional personal statement about why they support the campaign
- Checkboxes: consent to public display, opt-in to email updates, and a required
  agreement to the Terms of Use

Behind the scenes the system runs spam checks, creates or matches their stakeholder
record, geocodes their address to a congressional and state district, and emails
them a verification link.

## The four statuses

| Status | Meaning | What you do |
|---|---|---|
| **Pending Email Verification** | Submitted, but they haven't clicked the link in their email yet. | Nothing. Wait. |
| **Email Verified** | They clicked the link. A real, reachable person. | **Review it.** This is your queue. |
| **Approved for Display** | You reviewed it and approved it. | Optionally select it for public display. |
| **Rejected** | You reviewed it and turned it down. | Nothing further. |

The verification link **expires 24 hours after it is sent**. Once it expires the
endorsement sits in Pending until someone resends the email.

## The four gates for appearing publicly

An endorsement shows up on the public campaign page **only when all four of these
are true at once**:

1. **Public display** — the endorser's own consent. This box is checked by default
   on the public form, so an endorsement that fails this gate is one where the
   person deliberately *unchecked* it. That is a clear "please don't put my name
   out there." The field is technically editable here, but **never tick it on
   someone's behalf.** If they opted out, they stay out.
2. **Email verified** — they clicked the link in their email.
3. **Status is Approved** — you approved it.
4. **Display publicly** — you separately selected it to appear on the page.

!!! warning "The two column names that trip everyone up"
    **Public display** is what the *endorser* consented to.
    **Display publicly** is what *you* decided.

    They sound identical. They mean opposite-facing things. Read them slowly, every
    time.

## Why approval and display are separate

"This is a legitimate endorsement we count in our totals" and "this is a name we
feature on the public page" are different decisions. An endorsement can be approved
and counted internally without being featured publicly — which is exactly what you
want for someone whose endorsement is real but who asked to stay off the page.

Publicly displayed endorsements appear newest first. There is no featuring or
ranking; every displayed endorsement is treated equally.
