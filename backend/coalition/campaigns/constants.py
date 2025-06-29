"""Constants for campaigns and legislative models."""

CHAMBER_CHOICES = [
    # Federal chambers
    ("house", "U.S. House"),
    ("senate", "U.S. Senate"),
    # Common state chambers
    ("state_house", "State House"),
    ("state_senate", "State Senate"),
    ("assembly", "State Assembly"),
    ("house_of_delegates", "House of Delegates"),
    ("house_of_representatives", "House of Representatives"),
    ("general_assembly", "General Assembly"),
]

LEVEL_CHOICES = [
    ("federal", "Federal"),
    ("state", "State"),
]

# Bill prefixes for different chambers
BILL_PREFIXES = {
    # Federal
    "house": "H.R.",
    "senate": "S.",
    # State chambers (common prefixes)
    "state_house": "HB",
    "state_senate": "SB",
    "assembly": "AB",
    "house_of_delegates": "HB",
    "house_of_representatives": "HB",
    "general_assembly": "GA",
}
