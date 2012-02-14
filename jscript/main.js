$(document).ready(function () {
    if (typeof window.winesnob === "undefined" || typeof window.winesnob.listings === "undefined") {
        initialize_listings_main();
    } //else {
       // render_listings_main(window.winesnob.listings);
    //}
    manage_routes();
});

function initialize_listings_main() {
    jQuery.getJSON(
			"data/listings.json",
			function (data) {
			    window.winesnob = new Object();
			    window.winesnob.listings = data;
			    render_listings_main(window.winesnob.listings);
			});
}
function manage_routes() {

	// Listen for any attempts to call changePage().
	$(document).bind("pagebeforechange", function(e, data) {

		// We only want to handle changePage() calls where the caller is
		// asking us to load a page by URL.
		if (typeof data.toPage === "string") {

			// We are being asked to load a page by URL, but we only
			// want to handle URLs that request the data for a specific
			// category.
			var u = $.mobile.path.parseUrl(data.toPage),
				re = /^#product_details=/;

			if (u.hash.search(re) !== -1) {

				// We're being asked to display the items for a specific product..
				// Call our internal method that builds the content for the product
				// on the fly based on our in-memory product data structure.
				show_product(u, data.options);

				// Make sure to tell changePage() we've handled this call so it doesn't
				// have to do anything.
				e.preventDefault();
			}
		}
	});
}

function show_product(urlObj, options) {
    var idx = urlObj.hash.replace( /.*product_details=/ , ""),
        // Get the object that represents the category we
        // are interested in. Note, that at this point we could
        // instead fire off an ajax request to fetch the data, but
        // for the purposes of this sample, it's already in memory.
        product = window.winesnob.listings[idx],
        // The pages we use to display our content are already in
        // the DOM. The id of the page we are going to write our
        // content into is specified in the hash before the '?'.
        pageSelector = "#product_details"; //urlObj.hash.replace( /\?.*$/ , "");

	if (product) {
		// Get the page we are going to dump our content into.
		var $page = $(pageSelector),
			// Get the header for the page.
			$header = $page.children(":jqmData(role=header)"),
			// Get the content area element for the page.
			$content = $page.children(":jqmData(role=content)"),
			// The markup we are going to inject into the content
            // area of the page.
			markup = "<div data-role=\"content\"><img align='right' width='200' id='product-image' src='" + product.image_url + "'>";
		markup += "<p><strong>rating: " + product.rating + " <br /> region: " + product.region + " <br /> price: $" + product.price + " <br /> category: " + product.category + "</strong></p>";
		markup += "<p>" + product.description + "</p></div></div><a href='#reviews_list' data-role=\"button\">Back to reviews</a>";


		// Find the h1 element in our header and inject the name of
		// the category into it.
		$header.find("h1").html(product.name);

		// Inject the category items markup into the content element.
		$content.html(markup);

		// Pages are lazily enhanced. We call page() on the page
		// element to make sure it is always enhanced before we
		// attempt to enhance the listview markup we just injected.
		// Subsequent calls to page() are ignored since a page/widget
		// can only be enhanced once.
		$page.page();

//		// Enhance the listview we just injected.
//	    $content.find(":jqmData(role=productdetails)");

		// We don't want the data-url of the page we just modified
		// to be the url that shows up in the browser's location field,
		// so set the dataUrl option to the URL for the category
		// we just loaded.
		options.dataUrl = urlObj.href;

		// Now call changePage() and tell it to switch to
		// the page we just modified.
		$.mobile.changePage($page, options);
	}
}

function render_listings_main(listings) {
	for (var idx in listings) {
		var listing = listings[idx];
		$("#listings_listview").append(render_listing_li(listing, idx)).listview("refresh");
	}
}

function render_listing_li(listing, idx) {
	var rendered = "<li data-theme=\"c\" class=\"ui-btn ui-btn-icon-right ui-li-has-arrow ui-li ui-li-has-thumb ui-btn-hover-c ui-btn-up-c\">";
	rendered += "<div class=\"ui-btn-inner ui-li\">";
	rendered += "<div class=\"ui-btn-text\">";
	rendered += "<a href='#product_details=" + idx + "' class=\"ui-link-inherit\"  >";
	if (listing.image_thumb_url != "") {
		rendered += "<img src=\"" + listing.image_thumb_url + "\" class=\"ui-li-thumb\">";
	} else {
		rendered += "<img src=\"http://lcbo.ca/app/images/products/website/default.jpg\" class=\"ui-li-thumb\">";
	}
	rendered += "<h3 class=\"ui-li-heading\" >" + listing.name + "</h3>"; // 
	rendered += "<p class=\"ui-li-desc\">$" + listing.price + " | rating: " + listing.rating + " | " + listing.region + " | " + listing.category + "</p>";
	rendered += "</a>";
	rendered += "</div>";
	rendered += "<span class=\"ui-icon ui-icon-arrow-r ui-icon-shadow\"></span>";
	rendered += "</div>";
	rendered += "</li>";
	return rendered;
}
