import { ContentBlock as ContentBlockType } from "../../types/index";

export const baseContentBlock: ContentBlockType = {
  id: 1,
  title: "Test Block",
  block_type: "text",
  page_type: "homepage",
  content: "<p>Test content</p>",
  image_url: "",
  image_alt_text: "",
  image_title: "",
  image_author: "",
  image_license: "",
  image_source_url: "",
  css_classes: "",
  background_color: "",
  order: 1,
  is_visible: true,
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
  animation_type: "none",
  animation_delay: 0,
};
