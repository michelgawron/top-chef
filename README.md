# TOP CHEF

> Eat well and cheaper than usually

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Introduction](#introduction)
- [Objective - Workshop in 1 sentence](#objective---workshop-in-1-sentence)
- [How to do that?](#how-to-do-that)
  - [Stack](#stack)
- [Just tell me what to do](#just-tell-me-what-to-do)
- [Examples of steps to do](#examples-of-steps-to-do)
  - [Investigation](#investigation)
    - [Michelin Restaurant](#michelin-restaurant)
    - [Deals from LaFourchette](#deals-from-lafourchette)
    - [The web application](#the-web-application)
  - [Server-side with Node.js](#server-side-with-nodejs)
    - [require('michelin')](#requiremichelin)
    - [require('lafourchette')](#requirelafourchette)
  - [Client-side with React](#client-side-with-react)
  - [Notification (bonus)](#notification-bonus)
- [Don't forget](#dont-forget)
- [Licence](#licence)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Introduction

This document and the code on this repository is not intended to be reused for commercial purposes. 
It is an overview and a solution found for a workshop given as part of a school course.

# Investigation - [Michelin](https://restaurant.michelin.fr/ "Michelin Restaurants Website") website

After a bit of exploration on the [michelin](https://restaurant.michelin.fr/ "Michelin Restaurants Website") website, 
we could see that it is quite easy to scrape, as there is no dynamic content generated. 
Then, as we got only a couple of static pages to scrape, we explored a few possibilities to do so.
<br><br>
Node.js is a language that uses callbacks and asynchronous calls in order to execute tasks. Let's use
those properties to make our scraping module as efficient as it can be: the aim of this module is
to asynchronously hit several pages in order to get a list of restaurants. 

### PhantomJS - How to scrape website with a whole army

The first tool we thought could be useful to make such a scraping was PhantomJS.
As we have already used this headless browser, we first tried to scrape a single page using this tool.
The result was good as we managed to extract valuable data from the page.<br><br>
However, a headless browser is a heavy tool, and it needed one or two seconds to actually give a result back.
As said on the introduction, there is no dynamic content to process: using a headless browser is then a bit of an 
overkill for our task.

### Requests + cheerio - A light way to scrape

After a bit of testing with phantomJS, we found out that using requests with cheerio would be the easiest and lightest 
way to make our scraping. We tried making a request on a single page and it worked like a charm.
<br><br>

#### Scraping limits

However, problems appeared when we tried scraping the whole website:
we figured out that [michelin](https://restaurant.michelin.fr/ "Michelin Restaurants Website") 
restaurants website blocks you if you send too much requests at a time.
<br><br>
The limit seems to be around a hundred requests on less than a few seconds: after the hundredth request, 
their server keeps sending timedout errors. So, we needed to find a way to slow down those requests.
<br><br>
We first tried to run my requests one at a time. This solution worked, but the processing time was quite too long 
as the server needed two minutes to make the requests and receive their results. The good news here was that
the server accepts our requests if we do not make too much of it.
<br><br>
A way to make those requests without getting blocked and in a reasonable time is to process the urls by small batches. 
Each batch needs to be processed asynchronously which would allow us to work on a few batch at a time.
Inside every batch, we are going to make synchronous calls to our urls to let a time gap between requests.
<br><br>

# Investigation - [lafourchette](https://www.lafourchette.com "La Fourchette Website")

One thing that we learned while in class with Yassine was that 
[lafourchette](https://www.lafourchette.com "La Fourchette Website") uses a module protecting the website against
scraping. However, it can bne easily tricked, but we won't give the details about how to do so.

Our goal on [lafourchette](https://www.lafourchette.com "La Fourchette Website")
 is to check if the restaurants we scrape from michelin have some deals we can actually apply.

Let's then separate our research.

First of all, we are going to check how a restaurant with a single restaurant is display when we search it by name.
Then, we are going to try and find a restaurant giving us several results (and ideally several pages) in order to apply
an algorithm to select the one we actually found on michelin. We are also going to loo, for restaurants
that are not available on [lafourchette](https://www.lafourchette.com "La Fourchette Website"), 
in order to get a bit of insight on the website behaviour in this case.

### Single restaurant - a class affair

### Multiple results - hide and seek

### No result



# Solution

## Michelin

First of all, as we figured it out in the first part of my investigation, it was not possible to make a scraping module 
that processes all urls asynchronously as the website blocks excessive requests.

Then in order to scrape this website, we decided to create batches of 10 urls each. Batches will be processed
asynchronously. Inside each batch, we call each url synchronously in order not to send too many requests at once.

In node.js, for loops are synchronous. However, if a call to an async function is made inside the loop, it does not block
its execution. This means that calling a promise inside a for statement does not wait for it to be completed.
Thus, we had to come up with an ingenious way to call our functions to be ran against batches asynchronously while
making call to the website in a synchronous way.

The trick we used to get this running is to create an array of promises. Everyone of them processes a single batch.
Those promises call a function that runs on the batch, retrieves its urls and make an http request to retrieve its content.