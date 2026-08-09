The public team area has two levels. The `/team` page is a compact directory with each person's profile photo, name, and title. A person can also have an optional profile page containing their full biography.

## Create a group

1. Open [Person groups]({% url 'admin:content_persongroup_changelist' %}) and choose **Add person group**.
2. Enter the public name and optional description.
3. Use **Order** to place the group relative to the other groups. Lower numbers appear first.
4. Leave **Visible** selected when the group is ready for the public site.

The slug is created from the first name you save and does not change when you rename the group. Group names are ordinary data: use the wording your organization needs rather than trying to match a fixed list.

## Add a person

Open [People]({% url 'admin:content_person_changelist' %}) and choose **Add person**. Assign the person to a group, then enter their name and title. Email is for staff reference only and is never published. LinkedIn is optional and appears as a public link when present.

Use **Active** to control whether the person appears publicly. Within a group, lower **Order** values appear first. You can also change order and active status from the people table embedded in the group form.

## Prepare a profile photo

Use a square image, recommended at **800 × 800 pixels**. A formal portrait, candid photo, or illustration can all work as long as the person is easy to recognize at card size. Upload it through [Images]({% url 'admin:content_image_changelist' %}) with meaningful alt text and all required credit information, then select it as the person's profile photo. The site uses a neutral square placeholder when no profile photo is selected.

## Enable an optional profile page

Enter the person's full formatted biography, then select **Profile page enabled**. Their name on `/team` will link to `/team/<slug>/`. The main team directory never displays biographies or summaries. Clearing the checkbox removes that profile page and its link without removing the person from the directory.

## Hide or remove public team content

Hiding a group removes the entire group and all of its people from the public API, `/team`, and profile pages. Deactivating one person removes only that person. A group that still has assigned people cannot be deleted; reassign or delete those people first.

When the last active person in the last visible group is deactivated or deleted, `/team` returns 404 and the **Our Team** navigation link disappears. Reactivating a person in a visible group restores both.

## Publication timing

The team directory, optional profiles, team content blocks, and navigation availability are fetched without a stale server cache. After saving a group, person, biography, or team content block, the updated content appears on the **next public request**.
