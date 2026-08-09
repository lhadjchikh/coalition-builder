This is the daily job. It assumes you have read
[How an endorsement travels]({% url 'admin_help:page' 'endorsement-pipeline' %}).

## Finding your queue

Go to [Endorsements → Endorsements]({% url 'admin:endorsements_endorsement_changelist' %}).
In the filter sidebar on the right, under **Email verified**, click **Yes**. Then,
under **Reviewed at**, click **Empty**.

That is your work queue: verified people waiting on a human decision. The review
timestamp is the durable record that the decision happened; the reviewer's name can
later become unavailable if their staff account is removed. Most rows have
the status **Email Verified**. If automatic approval is enabled, some arrive with
the status **Approved for Display** but no review timestamp; they still require
your review.

The other filters are there when you need them — by campaign, by whether the email
is verified, by the endorser's consent, by your display decision, by date, and by
the stakeholder's type or state.

## Reading the list

Each row shows the endorser's name and organization, the endorsement type, the
campaign, a coloured status badge, whether the email is verified, the endorser's
consent, your display decision, the submission date, and who reviewed it.

The **Endorsement type** column is the one to read carefully. It shows one of:

- _Individual_ — no organization given
- _On behalf of [Organization]_ — they claim authority to speak for the organization
- _Individual (affiliated with [Organization])_ — they work there but are signing
  personally

The middle case carries the most weight and deserves the most scrutiny. An
organizational endorsement from someone who was not actually authorized to give it
is the single most damaging mistake available in this role.

## Reviewing one endorsement

Click a row to open it. The form is grouped into sections:

- **Endorsement Details** — who, which campaign, their statement, and their public
  display consent
- **Email Verification** — verification status, timestamps, and a **Verification
  Link**
- **Admin Review** — status, your display decision, admin notes, and who reviewed it
- **Terms & Authorization** _(collapsed — click to expand)_ — whether they accepted
  the Terms of Use, when, and whether they claimed organizational authority
- **Timestamps** _(collapsed)_

The submission details and email-verification fields are read-only. They preserve
what the endorser submitted and what the verification process recorded. If any of
them are wrong, record the problem in **Admin notes** and reject the endorsement;
do not rewrite the source record.

Then work through this mentally:

1. Is this a real person or organization? Does the name look plausible? Does the
   email domain match the organization they claim?
2. Is their statement appropriate — on topic, no profanity, no advertising, no
   attacks?
3. If they are endorsing on behalf of an organization, is that plausible for
   someone in their stated role? A communications director signing for a nonprofit:
   plausible. A personal webmail address signing for a Fortune 500 company: not.
4. Have we seen suspiciously similar submissions? Several near-identical statements
   from lookalike addresses submitted minutes apart is a coordinated spam pattern.
   Searching a distinctive phrase from the statement will show you the rest of the
   batch.

Use **Admin notes** to record your reasoning, especially for rejections and
anything you weren't sure about. Those notes are internal and never shown publicly.
Future you will be grateful.

## Approving

Use the bulk action, even when you are approving a single record:

1. From the list, tick the checkbox next to each endorsement you are approving
2. In the **Action** dropdown at the top, choose **Approve selected endorsements**
3. Click **Go**

This sets the status to Approved, records you as the reviewer with a timestamp, and
**sends the endorser a confirmation email** telling them their endorsement was
approved.

If a row in your queue is already **Approved for Display**, it was approved
automatically after email verification. Review it normally, then choose **Mark
auto-approved endorsements as reviewed**. This records you as the reviewer and
clears it from the queue without changing its status or sending a second email.

!!! warning "Changing Status on the detail page skips the email"
If you instead set the Status dropdown to "Approved" inside an individual
record and save, it approves the endorsement and records you as reviewer — but
**no confirmation email is sent**. For normal approvals, always use the bulk
action.

## Rejecting

Same pattern: tick the boxes, choose **Reject selected endorsements**, click **Go**.
The status becomes Rejected and you are recorded as the reviewer.

**The endorser is not notified.** Nothing is sent to them. The record stays in the
system for our files but never appears publicly.

Write the reason in **Admin notes** before or after rejecting.

## Selecting for public display

After approving, decide which endorsements to feature on the campaign page.

1. Tick the boxes for the approved endorsements you want to feature
2. Choose **Approve for public display**
3. Click **Go**

The system checks each one and **turns on only the ones that pass every gate** —
approved, email verified, reviewed by a human, and endorser-consented. If you select
ten and it reports "Successfully approved 7," three failed a gate. Almost always
those three unchecked the public display consent box on the form or still need a
reviewer recorded. That is correct behaviour, not an error.

To pull something back down, use **Remove from display**. It takes effect
immediately.

## The other actions, and when to use them

| Action                          | What it does                                                     | When                                                                 |
| ------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Send verification emails**    | Resends the verification link to endorsers who haven't verified  | Someone says they never got the email, or their 24-hour link expired |
| **Send approval notifications** | Re-sends the approval confirmation to already-approved endorsers | Rarely — an email failed to send the first time                      |
| **Mark as email verified**      | Flags the email as verified, skipping the link entirely          | **Almost never.** See below.                                         |

!!! warning "Mark as email verified destroys our proof"
Email verification is the evidence that an address is real and that its owner
agreed to endorse. Marking it verified by hand throws that away.

    The **Verification Link** on the detail page has the same problem: clicking it
    yourself verifies the endorsement as though the endorser had.

    Use either one only with {{ supervisor_contact }}'s explicit go-ahead — for
    example, an organization's mail server is blocking us and you have confirmed
    the person by phone. Record what happened in Admin notes when you do.
