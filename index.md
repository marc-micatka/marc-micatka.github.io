---
# title: "Marc Micatka"
layout: splash
# header:
#   overlay_color: "#000"
#   overlay_filter: "0.5"
#   overlay_image: /assets/images/site_images/nepal_full.jpg
---

<div class="custom-grid">
  {% for post in site.posts %}
    <a href="{{ post.url | relative_url }}" class="grid-item">
      {% if post.header.teaser %}
        <img src="{{ post.header.teaser | relative_url }}" alt="{{ post.title }}">
      {% elsif post.header.image %}
        <img src="{{ post.header.image | relative_url }}" alt="{{ post.title }}">
      {% else %}
        <img src="/assets/images/default-thumbnail.jpg" alt="{{ post.title }}">
      {% endif %}
      
      <div class="grid-overlay">
        <h3 class="grid-title">{{ post.title }}</h3>
      </div>
    </a>
  {% endfor %}
</div>