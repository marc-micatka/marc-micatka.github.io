---
title: "The Books Database"
excerpt: "A Brief Reading Journey"
permalink: /books_database/
classes: wide
last_modified_at: 2025-12-13
header:
  teaser: /assets/images/books/thumbnail.jpg
  image: "/assets/images/books/header.jpg"
  
toc: true
toc_sticky: true
toc_label: "Books"
toc_icon: "book"

tags: 
  - Projects
  - Books
---

I put together a web-based visualization of a personal database of books I've read and reviewed over the last 10+ years. The database is <a href="/books/" target="_blank">here</a> and the data can be downloaded directly as a CSV from <a href="https://docs.google.com/spreadsheets/d/e/2PACX-1vT6eNcmziFeeUr186W7gMhlsOtCI-sJofslOPbh61gMVYOesPt9o0RVyVxWov9IAp2NrfnhiFRyd_z_/pub?gid=268068742&single=true&output=csv" target="_blank">here</a>.


## Background

Growing up, I was pretty into reading. Every parent likes to say that, but I swear I actually was - *Magic Treehouse*, and *Encyclopedia Brown* and *Great Illustrated Classics* featured prominently in my life. I shared a birthday with Harry Potter and read the series obsessively. Our childhood house had a great built-in shelf along an entire wall of the living room and it was crammed to overflowing. Books on top of, shoved behind, other books. 

I read a bit obnoxiously in highschool- pulling out ostentatiously, cumbersomely, large, volumes like *Gone With the Wind* in class. I'm not proud of this. 

In 2012, after my freshman year of college, I worked inside Mount Rainier National Park at the Paradise Lodge. I lived above the kitchen and worked in the bakery. This was, for a number of reasons, a transformative summer. I didn't have cell reception, internet, wi-fi, TV. What I had was time, loads of it. I worked from 6am to 2pm and spent the rest of the time hiking when the weather was good and reading when the weather was bad. I read in my room, in the lodge, from the comfort of my sleeping bag. I read easy, fun stuff - the Harry Potter series in six days, Neil Gaiman by the handful, the entire Game of Thrones series. I read classics, Huxley, Hesse, Atwood, Steinbeck. 

When I graduated college, I started keeping track of my reading goals and habits. Reading was something that was intellectually enriching and expanding. I like writing but I love reading. It felt like a worthwhile goal, to read certain authors and certain books and about certain subjects. I've had a long-standing goal to read a book a week and I've come  close to that goal for the last 10 years. 

Recently, I've made a more concerted effort to read more diverse authors and to read more non-fiction. This has been a big change in my life, introducing me to concepts and histories and people I had not come across much in the past. I would encourage everyone to think about the books they've read, the books they love, and whether they were written by white men. For me, the answer was a resounding "yes" and in the last few years, I've endeavored to change my habits.

## Database

Okay, my database. It has about 600 books, nearly 500 ratings, and about 70 reviews. I've kept it alive across various platforms, but it now lives as a Google Spreadsheet that I've copied and hosted publicly. I also have explored some data visualizations, using data from Goodreads to allow for some interesting comparisons between my reading habits and preferences and public ratings.

Yearly summary statistics are on the dedicated <a href="/books/" target="_blank">page</a> for the database. I'll explore a few interesting, specific elements here.

## Plots

I have explored some of my data via the charts below.

I started the exploration hoping I'd see some interesting correlations - maybe page length and rating, or fiction/non-fiction and ratings. Perhaps I finished more books of a certain genre in certain months? Unfortunately I mostly found normally distributed, particularily average trends!

### Goodreads Comparison

Originally, I was using Goodreads (GR, from now on) alongside a personal spreadsheet. Then, when I learned that GR was owned by Amazon, I removed my account. But I continue to reference the ratings and reviews for the sheer amount of information that is available. With that in mind, I've added comparison ratings to all my books, showing my personal rating alongside the GR rating (caveat, I multiple all GR ratings by 2 as their system is out of 5 and mine is out of 10).

#### Ratings Correlations?

I wanted to see if there was any correlation between my ratings and the ratings on GR:

{% include _plots/rating_comparison.html %}<br />

Okay, no. But also, weird clustering for GR data. Let's check the histogram:

{% include _plots/gr_histogram.html %}<br />

Oh right. Is there a name for this? How online reviews all seem to cluster around 4.0 with no real spread or diversity above or below? 

After seeing these results, I realized my analysis was hampered by the fact that I'd only recorded the average rating, and didn't have access to the individual ratings to check the spread WITHIN a result. Back to Goodreads to take some more data. Goodreads shows a histogram of ratings for each book that we can access and analyze.
Approximately 80% of all reviews are 4 or 5 stars. Also interesting is that the lowest rating I'll give a book seems to be 2 stars. Maybe that's my ratings floor - if you've taken the time to write a book, you get at least 2 stars!

{% include _plots/rating_distribution.html %}<br />

#### Ratings Differentials

Another fun thing we can do is check the largest positive and negative divergence of my ratings vs the community GR ratings:

{% include _plots/rating_differentials.html %}<br />

Yeah this seems about right! Basically all of the negative shifted reviews (positively reviewed by the community, negatively by me) still stand out to me as particularily weak books. Also, these shifts are reflective of the same tendency seen above - that GR ratings are tightly clustered about a mean

### Reading Trends

#### Trends by Genre and Format

I discovered [Libby](https://libbyapp.com/) as a source for free audiobooks during the pandemic. I'm still not sure why anyone is paying Amazon for Audible.

2018 seems like the high-water mark for pages read per day, not counting audiobooks. That would be the year we spent traveling and both Mary and I were not working.

{% include _plots/pages_by_genre.html %}<br />

{% include _plots/pages_by_format.html %}<br />


#### Genre Breakdown

Based on GR genre data, here's a sub-genre breakdown:

{% include _plots/nonfic_genre.html %}<br />

{% include _plots/fic_genre.html %}<br />


#### Most Read Authors

Here's my most read authors by page count. I like how some of these authors get on the list by dint of number of books (looking at you, Kurt). And Robert Caro gets on with two! 

{% include _plots/authors_by_page.html %}<br />



