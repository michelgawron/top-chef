# TOP CHEF

> Eat well and cheaper than usually

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*


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

If we got only one result for a query, then we can simply select the right class in ordrer to retrieve an element's data

### Multiple results - hide and seek

If we got several results for a search query, then we are going to compare the michelin postal code with the one
on la fourchette: if we got a match then we can almost be sure that it is our restaurant

### No result

When there is no result, the search page resolve with a 302 status code. We just have to pass a parameter to request
in order not to follow redirection and to catch a page with a 302 status code to know that no result has been found.



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

## La Fourchette

We tried to make a simple promise based module. First of all, we are going to make a search query using a restaurant's
name on la fourchette. Then, if we got only one result, we are going to select the element on the page.

If we got several elements, a function will call michelin in order to retrieve the restaurant's postal code and then
compare it with elements on the search page.

If we got no element, then we are simply going to throw an error message

### Scraping limit

When we tried to execute our modules on a small subset, it seemed to work greatly and provide good results.
However, upon switching on the whole dataset we noticed that we had a lot of rejected requests: this is probably due to
a behaviour similar to michelin's website. Then, we have to process our data using small batches for this module too.

But when testing our modules on a big part of the dataset, lafourchette blocked us. They probably use the datadome
cookie parameter in order to count requests from one source, and block a user when he reaches a certain limit.

We now use the mobile website in order to perform our scraping and it works like a charm.

