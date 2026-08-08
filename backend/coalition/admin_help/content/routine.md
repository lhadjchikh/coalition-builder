## Every workday during an active campaign

- [ ] Filter endorsements by **Email verified: Yes** and **Reviewed by: Empty**, then clear the queue
- [ ] Approve the legitimate ones, reject the spam, note anything uncertain
- [ ] Run **Approve for public display** on the ones cleared for the public page
- [ ] Flag anything notable — a large organization, an unusual statement — to
      {{ supervisor_contact }}

## Every week

- [ ] Skim endorsements stuck in **Pending Email Verification** for more than a few
      days and resend verification emails where it makes sense
- [ ] Check that bill statuses are current, if the legislature is in session
- [ ] Open each active campaign's public page and confirm it still looks right

## Whenever a new campaign launches

- [ ] Run the publishing checklist on
      [Creating a campaign]({% url 'admin_help:page' 'campaigns' %})
- [ ] Submit a test endorsement with your own email, confirm the verification email
      arrives and the link works, then reject your own test record
- [ ] Watch the first few real endorsements closely to confirm the pipeline works
      end to end

## Do

- Ask when you are unsure. Always the right call.
- Write admin notes explaining your decisions.
- Check the public page after making changes.
- Treat endorsers' contact information as confidential.

## Don't

- Change a campaign's **Name** after it is public. It breaks every shared link.
- Rewrite the wording of someone's endorsement statement.
- Use **Mark as email verified**, or click the **Verification Link** yourself,
  without explicit approval.
- Delete anything. If something needs to go away, reject it or remove it from
  display — deletion destroys records we may need.
- Approve organizational endorsements you cannot plausibly verify.
- Export or share stakeholder contact data without asking.

## When something goes wrong

Say so quickly. Every mistake in this system is fixable, and most are fixable in
seconds — but only if somebody knows about it. An unreported mistake is the only
kind that does lasting damage.

Day-to-day questions and judgment calls go to {{ supervisor_contact }}. Technical
failures — the site is down, an error page, emails not sending — go to
{{ technical_contact }}.
