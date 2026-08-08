Go to [Campaigns → Policy campaigns → Add policy campaign]({% url 'admin:campaigns_policycampaign_add' %}).

!!! tip "Fill in Title first, even though Name is above it"
    **Name** sits at the top of the form, but it fills itself in from **Title** as
    you type. Click into Title first and let Name populate. If you type into Name
    yourself, the automatic fill stops and you're maintaining it by hand.

## The fields, in order

### Name

The URL-friendly version of the title: lowercase, words joined by hyphens. It
becomes part of the public web address — a campaign named
`oyster-restoration-funding` lives at `{{ site_url }}/campaigns/oyster-restoration-funding`.

!!! warning "Do not change Name after a campaign is public"
    Changing it breaks every link anyone has shared, bookmarked, emailed, or
    posted. Get it right the first time, then leave it alone.

### Title

The public headline — what visitors actually read. Write it as a clear position,
not a bureaucratic label.

- Good: "Fund Oyster Restoration in the Chesapeake Bay"
- Bad: "SB 442 Advocacy Initiative FY26"

### Summary

A short, plain-language paragraph: what we want and why. It appears on the campaign
card in listings and near the top of the campaign page. Two or three sentences.
Plain text — formatting won't stick here.

### Description

The long version, with a rich text editor: bold, italic, headings, bullets, links.
Use it for background, the specifics of the policy, and what's at stake.

### Image

The banner photo for the campaign page. It's a dropdown of images already in the
system with a green **+** next to it. Click the **+** to upload a new image in a
pop-up without leaving the campaign form; when you save it there, it is selected in
the dropdown automatically. That is the normal path, and it avoids the refresh
problem described in [Troubleshooting]({% url 'admin_help:page' 'troubleshooting' %}).

Whichever way you upload, fill in:

- **Title** — so you can find it again later.
- **Alt text** — a short description of what is in the photo, for people using
  screen readers. Required. Write a real description, not "campaign image."
- **Author / License / Source URL** — where the photo came from and whether we are
  allowed to use it.

!!! warning "Only upload images we have the rights to use"
    If you are not certain we can use a photo, ask {{ supervisor_contact }} before
    uploading it.

### Active

The on/off switch for the whole campaign.

- **Unchecked** — invisible to the public. The campaign page returns "not found"
  and it appears in no listing.
- **Checked** — live on the public site.

Leave it **unchecked** while you're building the campaign. Check it only when the
content is finished and someone has reviewed it. Remember that this checkbox is
also editable straight from the campaign list, so it is possible to flip it without
meaning to.

### Allow endorsements

Controls whether the endorsement form appears on the campaign page. On by default.
Turn it off when you want the campaign visible as a reference but closed to new
endorsements — after a legislative session ends, for example.

### Endorsement statement

The exact sentence endorsers agree to when they sign, shown to them on the form.
Take it seriously: it is the substance of what they are committing to.

> I support full funding for oyster restoration in the Chesapeake Bay and urge the
> General Assembly to pass SB 442.

### Endorsement form instructions

Optional guidance shown above the form. Useful for notes like "Organizations:
please have an authorized representative complete this form."

## Before you check Active

- [ ] Title reads clearly to someone who has never heard of the issue
- [ ] Summary is plain-language and free of jargon
- [ ] Description is complete, spell-checked, and its links work
- [ ] Endorsement statement says exactly what we intend
- [ ] Image is attached and has real alt text
- [ ] Name (the URL) is correct — this is the last painless chance to change it
- [ ] {{ supervisor_contact }} has reviewed the content

Then check Active, save, and **open the public page yourself** to confirm it looks
right. Submitting a test endorsement with your own email address, confirming the
verification email arrives, and then rejecting your own test record is fifteen
minutes well spent on a campaign that matters.
