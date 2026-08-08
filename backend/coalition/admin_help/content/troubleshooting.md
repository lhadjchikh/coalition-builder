## "Someone endorsed but says they never got the verification email"

Ask them to check spam and junk folders first. Then confirm the email address on
the record is spelled correctly — if it is wrong, correct it on the stakeholder
record. Then run the **Send verification emails** action.

Links expire 24 hours after they are sent, so for anyone who waited a day, simply
resending is the whole fix.

## "I approved it but it's not showing on the public page"

Walk the [five gates]({% url 'admin_help:page' 'endorsement-pipeline' %}) in order.

Nine times out of ten it is gate 5: you approved it but never ran **Approve for
public display**. For an automatically approved endorsement, also check gate 4:
someone must complete the human review and record themselves as the reviewer. Gate
1 is the other common one — the endorser unchecked the public display consent box,
and we do not override that.

Also confirm the campaign itself is **Active**. An inactive campaign has no public
page at all, so nothing on it can appear.

## "The campaign page says not found"

The campaign's **Active** box is unchecked. Inactive campaigns are hidden
completely, not merely unlisted.

## "There's no endorsement form on the campaign page"

**Allow endorsements** is unchecked on that campaign.

## "The same person seems to have endorsed twice"

Not possible for the same campaign — the system refuses duplicates. So check
whether the two entries are for *different* campaigns, whether they are two
different people at the same organization, or whether one person used two email
addresses.

Two email addresses means two separate stakeholder records. Flag it to
{{ supervisor_contact }} rather than deleting anything.

## "The bill won't save"

State bills require a State. Federal bills must have State left blank. The error
message on the form says which rule you hit.

## "I don't see the image I just uploaded in the campaign's dropdown"

If you uploaded it in a separate tab under
[Content → Images]({% url 'admin:content_image_changelist' %}), the campaign form
doesn't know about it yet. Save your campaign draft, reload the page, and it will
be there.

Using the green **+** button next to the Image field avoids this entirely.

## "I think I clicked the wrong bulk action"

Tell {{ supervisor_contact }} immediately. Don't try to quietly reverse it — some
actions send email that cannot be unsent, and knowing what happened matters more
than the mistake did.

## Something is actually broken

An error page, the site down, emails not sending at all: that is not a
you-clicked-something problem. Report it to {{ technical_contact }}, with the URL
you were on and what you were doing.
