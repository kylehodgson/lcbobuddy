$(document).ready(function () {
    if (typeof window.winesnob === "undefined" || typeof window.winesnob.listings === "undefined") {
        initialize_listings_main();
    }
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
    $(document).bind("pagebeforechange", function (e, data) {

        // We only want to handle changePage() calls where the caller is
        // asking us to load a page by URL.
        if (typeof data.toPage === "string") {

            // PRODUCT DETAILS
            var u = $.mobile.path.parseUrl(data.toPage),
                re = /^#product_details=/;
            if (u.hash.search(re) !== -1) {
                show_product(u, data.options);
                e.preventDefault();
            }

            // PRODUCT SEARCH
            re = /^#product_search/;
            if (u.hash.search(re) !== -1) {
                show_search(u, data.options);
                e.preventDefault();
            }

            // SEARCH DETAILS
            re = /^#search_details=/;
            if (u.hash.search(re) !== -1) {
                show_product_search(u, data.options);
                e.preventDefault();
            }
        }
    });
}

function show_search(u, options) {
    $("#product_search_search_form").submit(function () {
        var search_term = $("#product_search_search_term").val();
        if (search_term) {
            jQuery.getJSON("http://lcboapi.com/products?q=" + encodeURIComponent(search_term) + "&callback=?", display_lcbo_search_results);
        }
    });

    var pageSelector = "#product_search";
    var $page = $(pageSelector),
                    $header = $page.children(":jqmData(role=header)");

    $header.find("h1").html("Search Results");
    $page.page();
    options.dataUrl = u.href;

    $.mobile.changePage($page, options);
}

function map_lcbo_api_product_to_our_product(result) {
    var product = Object();
    product.id = result.id;
    product.image_url = result.image_url;
    product.image_thumb_url = result.image_thumb_url;
    product.name = result.name;
    product.category = result.secondary_category;
    product.region = result.origin;
    product.price = (result.regular_price_in_cents / 100).toString();
    product.rating = "N/A";
    product.description = result.tasting_note + " <p>Serving suggestion: " + result.serving_suggestion + "</p>";
    return product;
}

function display_lcbo_search_results(search_results) {
    if (search_results && search_results.pager !== undefined && search_results.pager.current_page_record_count > 0) {
        window.winesnob.results = search_results;
        for (var idx in search_results.result) {
            var result = search_results.result[idx];
            var product = map_lcbo_api_product_to_our_product(result);
            $("#search_results_listview").append(render_listing_li(product, idx, "search")).listview("refresh");
        }
    }
}

function show_product_search(urlObj, options) {
    var idx = urlObj.hash.replace(/.*search_details=/, ""),
        product = map_lcbo_api_product_to_our_product(window.winesnob.results.result[idx]),
        pageSelector = "#search_details";


    if (product) {
        var $page = $(pageSelector),
	        $header = $page.children(":jqmData(role=header)"),
			$content = $page.children(":jqmData(role=content)"),
			markup = get_product_description_content(product);

        $header.find("h1").html(product.name);
        $content.html(markup);
        $page.page();
        options.dataUrl = urlObj.href;

        $.mobile.changePage($page, options);
    }
}

function show_product(urlObj, options) {
    var idx = urlObj.hash.replace(/.*product_details=/, ""),
        product = window.winesnob.listings[idx],
        pageSelector = "#product_details";
    

	if (product) {
	    var $page = $(pageSelector),
	        $header = $page.children(":jqmData(role=header)"),
			$content = $page.children(":jqmData(role=content)"),
			markup = get_product_description_content(product);

		$header.find("h1").html(product.name);
		$content.html(markup);
		$page.page();
		options.dataUrl = urlObj.href;

		$.mobile.changePage($page, options);
	}
}

function get_product_description_content(product) {
    var markup = "<div data-role=\"content\"><img align='right' width='200' id='product-image' src='" + get_product_image_url(product.image_url) + "'>";
    markup += "<p><strong>rating: " + product.rating + " <br /> region: " + product.region + " <br /> price: $" + product.price + " <br /> category: " + product.category + "</strong></p>";
    markup += "<p>" + product.description + "</p></div></div>";
    return markup;
}
function get_product_image_url(image) {
    if (image) {
        return image;
    } else {
        return "http://lcbo.ca/app/images/products/website/default.jpg";
    }
}

function render_listings_main(listings) {
	for (var idx in listings) {
		var listing = listings[idx];
		$("#listings_listview").append(render_listing_li(listing, idx, "listing")).listview("refresh");
	}
}

function render_listing_li(listing, idx, type) {
    var rendered = "<li data-theme=\"c\" class=\"ui-btn ui-btn-icon-right ui-li-has-arrow ui-li ui-li-has-thumb ui-btn-hover-c ui-btn-up-c\">";
	rendered += "<div class=\"ui-btn-inner ui-li\">";
	rendered += "<div class=\"ui-btn-text\">";
	if (type == "listing") rendered += "<a href='#product_details=" + idx + "' class=\"ui-link-inherit\"  >";
	if (type == "search") rendered += "<a href='#search_details=" + idx + "' class=\"ui-link-inherit\"  >";
	rendered += "<img src=\"" + get_product_image_url(listing.image_thumb_url) + "\" class=\"ui-li-thumb\">";
	rendered += "<h3 class=\"ui-li-heading\" >" + listing.name + "</h3>"; // 
	rendered += "<p class=\"ui-li-desc\">$" + listing.price + " | rating: " + listing.rating + " | " + listing.region + " | " + listing.category + "</p>";
	rendered += "</a>";
	rendered += "</div>";
    rendered += "<span class=\"ui-icon ui-icon-arrow-r ui-icon-shadow\"></span>";
	rendered += "</div>";
	rendered += "</li>";
	return rendered;
}
