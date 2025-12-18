---
layout: splash
---

<div class="container hero-banner">
  <h1 class="page-title">Marc Micatka</h1>
  <div class="header-subtext">
    Welcome to my personal blog.<br>
    I write a bit about travel, about books, and about projects.<br>
    Sometimes these things involve a refreshing amount of danger.

  </div>
</div>

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