The admin is plain and text-heavy. Don't let that fool you: every change you make
here is live on the public site the moment you save it.

## The sections you will use

| Section | What's in it |
|---|---|
| [Campaigns → Policy campaigns]({% url 'admin:campaigns_policycampaign_changelist' %}) | Every campaign. Where you create new ones. |
| [Campaigns → Bills]({% url 'admin:campaigns_bill_changelist' %}) | Every bill on its own. You'll usually add bills from inside a campaign instead. |
| [Endorsements → Endorsements]({% url 'admin:endorsements_endorsement_changelist' %}) | Your review queue. Home base. |
| [Stakeholders → Stakeholders]({% url 'admin:stakeholders_stakeholder_changelist' %}) | Everyone who has ever endorsed. Mostly for looking things up. |
| [Content → Images]({% url 'admin:content_image_changelist' %}) | The image library. Upload images here, or straight from the campaign form. |

## The sections you will not use

The admin also lists Themes, Homepage, Content blocks, Videos, Regions,
Legislators, Legal documents, and Terms acceptances. They belong to other people's
jobs and several of them change how the whole public site looks. Don't experiment
in them. If you think you need something there, ask {{ supervisor_contact }}.

## Four conventions worth knowing

**The list page versus the detail page.**
Clicking a section gives you a list of records. Clicking a row opens that one
record for editing. The two pages show different things, and some fields only exist
on the detail page.

**The filter sidebar** on the right of every list page narrows what you're looking
at — by status, by campaign, by date, and more. You will use it constantly.

**The search box** above the list searches the fields that matter for that section.
On the endorsement list it covers the endorser's name, organization, and email, the
campaign title, and the text of their statement. Searching statement text is the
fastest way to spot a batch of near-identical spam submissions.

**The Action dropdown** at the top-left of a list page performs an operation on many
records at once: tick the checkboxes on the left, choose an action, click **Go**.
This is the fast way to work through a review queue, and on the endorsement list
it is also the *correct* way — see
[Reviewing and approving endorsements]({% url 'admin_help:page' 'reviewing-endorsements' %}).

## Two places it is easy to slip

!!! warning "Some checkboxes are editable from the list page itself"
    On the campaign list, **Active** and **Allow endorsements** are live checkboxes
    in each row, with a **Save** button at the bottom of the page. That means you
    can publish or unpublish a campaign without ever opening it — including by
    accident, while you meant to be looking at something else. The bill list works
    the same way for **Is primary**.

    Nothing happens until you click Save at the bottom. If you tick something by
    mistake, navigate away instead of saving.

!!! warning "Nothing here has an undo"
    There is no undo button, and some actions send email that cannot be unsent.
    Read the action you picked before you click Go.

## Reading the campaign list

The campaign list shows a live **Endorsements** count and **Bills** count for each
campaign. After launching a campaign, that endorsement count going up is your
quickest confirmation that the public form is actually working.
