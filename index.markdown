---
title: "Marc Micatka"
layout: splash
header:
  overlay_color: "#000"
  overlay_filter: "0.5"
  overlay_image: /assets/images/nepal_full.jpg
excerpt: "Some projects. Some travel. Occasional Danger."

feature_row:
  - image_path: /assets/images/ptarmigan/thumbnail_big.jpg
    alt: "On the ridge."
    title: "Ptarmigan Loop"
    excerpt: "Some light mountaineering in the North Cascades."
    url: "ptarmigan"
    btn_label: "Read More"
    btn_class: "btn--primary"

  - image_path: /assets/images/seamcarving/thumbnail.png
    alt: "app play game screen"
    title: "Content Aware Image Resizing"
    excerpt: "Reducing image size while preserving image content."
    url: "seamcarving"
    btn_label: "Read More"
    btn_class: "btn--primary"

  - image_path: /assets/images/front_page/draw_symbol.png
    title: "Solving SET: Part II"
    excerpt: "Using Python and OpenCV to beat Mary at a card game."
    url: "set2"
    btn_label: "Read More"
    btn_class: "btn--primary"

feature_row2:
  - image_path: /assets/images/front_page/snow_lake.jpg
    alt: "Snow Lake"
    title: "Summer in Washington"
    excerpt: "Some outdoor adventures in the PNW."
    url: "washington"
    btn_label: "Read More"
    btn_class: "btn--primary"

feature_row3:
  - image_path: /assets/images/front_page/romney_hand.png
    alt: "bounding_box_romney"
    title: "Particle Filters and Mitt Romney"
    excerpt: "Implementing a particle filter for object tracking."
    url: "tracking"
    btn_label: "Read More"
    btn_class: "btn--primary"
  - image_path: assets/images/front_page/nepal.jpg
    alt: "Khumbu Valley"
    title: "Nepal Trip Report"
    excerpt: "Missing flights and hiking to Everest Base Camp."
    url: "nepal"
    btn_label: "Read More"
    btn_class: "btn--primary"

  - image_path: assets/images/front_page/ar_front.png
    alt: "ad on brick wall"
    title: "OpenCV and Augmented Reality"
    excerpt: "Introduction to AR, template matching, and perspective geometry."
    url: "ar"
    btn_label: "Read More"
    btn_class: "btn--primary"

feature_row4:
  - image_path: /assets/images/front_page/nz.jpg
    alt: "Mount Cook"
    title: "New Zealand Adventures"
    excerpt: "Caravanning through New Zealand, 2019."
    url: "oceania2"
    btn_label: "Read More"
    btn_class: "btn--primary"
---

{% include feature_row id="intro" type="center" %}

{% include feature_row %}

{% include feature_row id="feature_row2" type="left" %}

{% include feature_row id="feature_row3"%}

{% include feature_row id="feature_row4" type="right"%}