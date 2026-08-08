You do not need to know how to code to do this job. Everything in this guide
happens in a web browser, on the screens you are looking at right now.

## What this site does

{{ organization_name }} runs a public advocacy website. The core idea is simple:

**We publish policy campaigns. People and organizations who agree with us publicly
endorse them. We use that list of endorsers to show legislators there is real
support behind the policy.**

The site has two halves:

| Half | Who sees it | What it is |
|---|---|---|
| **The public site** | Anyone on the internet | Campaign pages, the endorsement form, the list of supporters |
| **The admin** | Only staff with a login | This control panel, where campaigns are built and endorsements are reviewed |

You will spend nearly all of your time in the admin.

One thing to internalize before anything else: **nothing an endorser submits
appears publicly on its own.** Automated spam checks screen submissions on the way
in, but a human — you — still has to review each one and turn it on. That is the
point of your role. It protects the organization's credibility.

## The vocabulary you need

The admin uses specific words for specific things. Learning these five makes
everything else click.

**Campaign** *(labelled "Policy campaign" in the admin)*
: A policy position we're advocating for. Each campaign gets its own public page
  with its own endorsement form. Example: a campaign supporting a bill to fund
  oyster restoration.

**Bill**
: A piece of actual legislation, federal or state, attached to a campaign. A
  campaign can have several bills, or none. Bills are optional context — a
  campaign works fine without one.

**Stakeholder**
: A person who has interacted with us, usually because they filled out an
  endorsement form. Their record holds their name, email, organization, address,
  and what kind of stakeholder they are: farmer, waterman, business, nonprofit,
  scientist, health care professional, government, individual, or other.

    Stakeholders are created **automatically** when someone endorses. You will
    rarely create one by hand. One email address means one stakeholder record,
    forever — if the same person endorses three campaigns, there is still just one
    stakeholder record with three endorsements hanging off it.

**Endorsement**
: The link between one stakeholder and one campaign. This is the thing you review.
  A stakeholder can endorse a given campaign only once; the system refuses
  duplicates.

**Status**
: Where an endorsement sits in the pipeline. Four values: Pending Email
  Verification → Email Verified → Approved for Display, or Rejected. An optional
  automatic-approval setting can move a verified endorsement directly to Approved
  for Display; it still needs a human reviewer. Explained in full on [How an
  endorsement travels]({% url 'admin_help:page' 'endorsement-pipeline' %}).

## Your first week

1. Read [How an endorsement travels]({% url 'admin_help:page' 'endorsement-pipeline' %}).
   Everything else in this job depends on understanding it.
2. Skim [A tour of the admin]({% url 'admin_help:page' 'admin-tour' %}) with the
   admin open in another tab, clicking along as you go.
3. Work through a real review queue alongside {{ supervisor_contact }} before doing
   one on your own.

If you read only one page of this guide, read the pipeline one.
