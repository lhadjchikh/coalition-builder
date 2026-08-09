def parse_inline_styles(markup: str) -> dict[str, str]:
    _, separator, markup_after_style = markup.partition('style="')
    if not separator:
        raise AssertionError("Expected rendered markup to include an inline style")

    style_attribute, _, _ = markup_after_style.partition('"')
    declarations = (
        declaration.split(":", maxsplit=1)
        for declaration in style_attribute.split(";")
        if declaration.strip()
    )
    return {
        property_name.strip(): property_value.strip()
        for property_name, property_value in declarations
    }


def contrast_ratio(first_color: str, second_color: str) -> float:
    lighter, darker = sorted(
        (_relative_luminance(first_color), _relative_luminance(second_color)),
        reverse=True,
    )
    return (lighter + 0.05) / (darker + 0.05)


def _relative_luminance(css_color: str) -> float:
    hex_color = "#ffffff" if css_color.lower() == "white" else css_color
    if len(hex_color) != 7 or not hex_color.startswith("#"):
        raise AssertionError(f"Unsupported CSS color: {css_color}")

    channels = [int(hex_color[index : index + 2], 16) / 255 for index in (1, 3, 5)]
    linear_channels = [
        channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4
        for channel in channels
    ]
    return sum(
        coefficient * channel
        for coefficient, channel in zip(
            (0.2126, 0.7152, 0.0722),
            linear_channels,
            strict=True,
        )
    )
