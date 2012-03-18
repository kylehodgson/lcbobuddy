$(document).ready(function () {

    //Check if browser supports W3C Geolocation API
    if (navigator.geolocation) {
        //navigator.geolocation.getCurrentPosition(geoLocateSuccessFunction, geoLocateErrorFunction);
    }
    //pimp_my_app();
    cart_init();

    if (typeof window.winesnob === "undefined" || typeof window.winesnob.listings === "undefined") {
        $.mobile.showPageLoadingMsg();
        window.winesnob = Object();
        window.winesnob.more_button_drawn = false;
        var listingsHandler = jQuery.getJSON(
        "http://www.lcbobuddy.com/listings.php?callback=?", handle_listings);
        listingsHandler.error(get_local_data);
    }

    manage_routes();
});

function manage_routes() {

    //page_reviews_list
    
	// Listen for any attempts to call changePage().

    $(document).bind("pagebeforechange", function (e, data) {

        // We only want to handle changePage() calls where the caller is
        // asking us to load a page by URL.
        if (typeof data.toPage === "string") {

            // REVIEWS
            var u = $.mobile.path.parseUrl(data.toPage),
                re = /^#page_reviews_list/;
            if (u.hash.search(re) !== -1) {
                show_reviews_page(u, data.options);
                e.preventDefault();
                return;
            }
            
            // PRODUCT DETAILS
            var u = $.mobile.path.parseUrl(data.toPage),
                re = /^#page_product_details=/;
            if (u.hash.search(re) !== -1) {
                show_product_page(u, data.options);
                e.preventDefault();
                return;
            }

            // PRODUCT SEARCH
            re = /^#page_product_search/;
            if (u.hash.search(re) !== -1) {
                show_search_page(u, data.options);
                e.preventDefault();
                return;
            }

            // SEARCH DETAILS
            re = /^#page_search_details=/;
            if (u.hash.search(re) !== -1) {
                show_search_results_page(u, data.options);
                e.preventDefault();
                return;
            }

            // VIEW CART
            re = /^#page_details_cart/;
            if (u.hash.search(re) !== -1) {
                show_cart_details_page(u, data.options);
                e.preventDefault();
                return;
            }

            // VIEW CART
            re = /^#page_cart/;
            if (u.hash.search(re) !== -1) {
                show_cart_page(u, data.options);
                e.preventDefault();
                return;
            }
        }
    });
}

function show_reviews_page (u, options) {
    if (typeof window.winesnob === "undefined" || typeof window.winesnob.listings === "undefined") {
        $.mobile.showPageLoadingMsg();
        var listingsHandler = jQuery.getJSON(
        "http://www.lcbobuddy.com/listings.php?callback=?", handle_listings);
        listingsHandler.error(get_local_data);
    }

    var pageSelector = "#page_reviews_list";
    var $page = $(pageSelector),
                    $header = $page.children(":jqmData(role=header)");

    $header.find("h1").html("Wine Within Reach");
    $page.page();
    options.dataUrl = u.href;

    $.mobile.changePage($page, options);
}

function show_cart_page(u, options) {
    if ( u.hash.indexOf("?") != -1) {
        var pArray = u.hash.split("?")[1].split("&"); 
        var idx = pArray[0].split("=")[1],
            type = pArray[1].split("=")[1],
            product = Object();
    
        if ( type=="search") {
            product = map_lcbo_api_product_to_our_product(window.winesnob.results.result[idx]);
        } else if (type=="listing") {
            product = window.winesnob.listings[idx];
        }
        
        if (product != Object()) {
            cart_add_product(product);
        }
    }
    var pageSelector = "#page_cart";
    
    var $page = $(pageSelector),
        $content = $page.children(":jqmData(role=content)");
    
    $content.html(get_cart_content());
    $page.page();
    options.dataUrl = u.href;

    $.mobile.changePage($page, options);
    
}

function show_search_page(u, options) {

    $("#product_search_search_form").submit(function () {
        var search_term = $("#product_search_search_term").val();
        if (window.winesnob.current_search_term == undefined) window.winesnob.current_search_term = "";
        if (window.winesnob.current_search_term != search_term) {
            window.winesnob.current_search_term = search_term;
            $("#search_results_listview").html("");
        }
        if (search_term) {
            $.mobile.showPageLoadingMsg();
            window.winesnob.more_button_drawn = false;
            jQuery.getJSON("http://lcboapi.com/products?q=" + encodeURIComponent(search_term) + "&callback=?", display_lcbo_search_results_callback);
        }
    });

    var pageSelector = "#page_product_search";
    var $page = $(pageSelector),
                    $header = $page.children(":jqmData(role=header)");

    $header.find("h1").html("Search Results");
    $page.page();
    options.dataUrl = u.href;

    $.mobile.changePage($page, options);
    
}

function show_cart_details_page(urlObj, options) {
    var idx = urlObj.hash.replace(/.*page_details_cart=/, ""),
        product = cart_get_product_by_index(idx),  // get_product_from_cart // window.winesnob.cart[idx]
        pageSelector = "#page_details_cart";


    if (product) {
        var $page = $(pageSelector),
            $header = $page.children(":jqmData(role=header)"),
            $content = $page.children(":jqmData(role=content)");
        var markup = get_product_description_content(product);

        $header.find("h1").html(product.name);
        $content.html(markup);
        $page.page();
        options.dataUrl = urlObj.href;

        $.mobile.changePage($page, options);
    }
}


function show_product_page(urlObj, options) {
    var idx = urlObj.hash.replace(/.*page_product_details=/, ""),
        product = window.winesnob.listings[idx],
        pageSelector = "#page_product_details";


    if (product) {
        var $page = $(pageSelector),
            $header = $page.children(":jqmData(role=header)"),
            $content = $page.children(":jqmData(role=content)");
        var $markup = $( get_product_description_content(product,  get_add_to_cart_button(idx, "listing")) );

        $header.find("h1").html(product.name);
        $content.html($markup).trigger('create');
        $page.page();
        options.dataUrl = urlObj.href;

        $.mobile.changePage($page, options);
    }
}

function show_search_results_page(urlObj, options) {
    var idx = urlObj.hash.replace(/.*page_search_details=/, ""),
        product = map_lcbo_api_product_to_our_product(window.winesnob.results.result[idx]),
        pageSelector = "#page_search_details";

    if (product) {
        var $page = $(pageSelector),
            $header = $page.children(":jqmData(role=header)"),
            $content = $page.children(":jqmData(role=content)");
        
        var $markup = $( get_product_description_content(product,get_add_to_cart_button(idx, "search")) );
        $header.find("h1").html(product.name);
        $content.html($markup).trigger('create');

        $page.page();
        options.dataUrl = urlObj.href;

        $.mobile.changePage($page, options);
    } 


}

function map_lcbo_api_product_to_our_product(result) {
    var product = Object();
    product.id = result.id ? result.id : "";
    product.image_url = result.image_url ? result.image_url : "";
    product.image_thumb_url = result.image_thumb_url ? result.image_thumb_url : "";
    product.name = result.name ? result.name : "";
    product.category = result.secondary_category ? result.secondary_category : "";
    product.region = result.origin ? result.origin : "";
    product.price = (result.regular_price_in_cents / 100).toString();
    product.rating = "na";
    product.description = result.tasting_note ? result.tasting_note : "";
    product.description = result.serving_suggestion ? " <p><strong>Serving suggestion: " + result.serving_suggestion + "</strong></p>" : "";
    return product;
}

function display_lcbo_search_results_callback(search_results) {
    $.mobile.hidePageLoadingMsg();
    if (search_results && search_results.pager !== undefined && search_results.pager.current_page_record_count > 0) {
        window.winesnob.results = search_results;
        for (var idx in search_results.result) {
            var result = search_results.result[idx];
            var product = map_lcbo_api_product_to_our_product(result);
            $("#search_results_listview").append(get_listing_content(product, idx, "search"));
        }
        
        if (search_results && search_results.pager && search_results.pager.next_page_path && window.winesnob.more_button_drawn==false) {
            draw_more_button();
        }
        
    }
}

function draw_more_button() {
    
    //<a id="search_results_listview_button" href="#" data-theme='c' data-role='button' data-icon='arrow-d'>More</a>
    $("#more_button").html("<a id='search_results_listview_button' href='#' data-theme='c' data-role='button' data-icon='arrow-d'>More</a>");

    $("#search_results_listview_button").bind("click", function (event, ui) {
        window.winesnob.more_button_drawn = true;
        $.mobile.showPageLoadingMsg();
        var urlString = "http://lcboapi.com/products?q=" + window.winesnob.current_search_term + "&page=" + window.winesnob.results.pager.next_page + "&callback=?";
        jQuery.getJSON(
                        urlString,
                        display_lcbo_search_results_callback);
        return false;
    });

    $("#search_results_listview_button").button();
}
function get_cart_content() {
    var markup = "";
    var cart = cart_get_products();
    for ( var idx in cart) {
        var product = cart[idx];
        markup += get_listing_content(product,idx,"cart");
    }
    return markup;
}

function get_product_description_content(product, button) {
    var markup = "<div data-role=\"content\">";
    markup += "<h2>" + product.name + "</h2>";
    if (product.image_thumb_url) markup += "<img align='right' width='150' id='product-image' src='" + product.image_url + "'>";
    markup += "<p>rating:<br /><div class='badge'>" + product.rating + "</div></p>";
    markup += "<p>region:<br /><strong>" + product.region + "</strong></p>";
    markup += "<p>price:<br /><strong>$" + product.price + "</strong></p>";
    markup += "<p>category:<br /><strong>" + product.category + "</strong></p>";
    //markup += "<p>Product Page: <a target='_new' href='http://www.lcbo.com/lcbo-ear/lcbo/product/details.do?language=EN&itemNumber=" + product.id + "'>LCBO #" + product.id + "</a></p>";
    markup += "<p>" + product.description + "</p>";
    if ( product.byline != undefined && product.byline != "") {
        markup += "<p><p><a target='_new' href='" + product.byline_link + "'>" + product.byline + "</a></p>";
    } 
    if (button !== undefined) markup += button;
    markup += "</div>";
    return markup;
}

function get_add_to_cart_button(idx, type) {
    if (type != "search" && type != "listing") return "";

    var markup = "<div><a id='button_add_to_cart' data-theme='c' href='#page_cart?index=" + idx + "&type=" + type + "' data-role='button' data-icon='plus'>Add to my list</a></div>";
    return markup;
}

function get_product_thumbnail_url(image) {
    if (image) {
        return image;
    } else {
        //        return "http://lcbo.ca/app/images/products/website/default.jpg";
        return "images/shim.png";
    }
}

function get_listing_content(listing, idx, type) {
    var rendered = "<li data-theme=\"c\" class=\"ui-btn ui-btn-icon-right ui-li-has-arrow ui-li ui-li-has-thumb ui-btn-hover-c ui-btn-up-c\">";
	rendered += "<div class=\"ui-btn-inner ui-li\">";
	rendered += "<div class=\"ui-btn-text\">";
	if (type == "listing") rendered += "<a href='#page_product_details=" + idx + "' class=\"ui-link-inherit\"  >";
	if (type == "cart") rendered += "<a href='#page_details_cart=" + idx + "' class=\"ui-link-inherit\"  >";
	if (type == "search") rendered += "<a href='#page_search_details=" + idx + "' class=\"ui-link-inherit\"  >";
	rendered += "<img src=\"" + get_product_thumbnail_url(listing.image_thumb_url) + "\" class=\"ui-li-thumb\">";
	rendered += "<h3 class=\"ui-li-heading\" >" + listing.name + "</h3>";
	rendered += "<p class=\"ui-li-desc\">$" + listing.price + " | rating: " + listing.rating + " | " + listing.region + " | " + listing.category + "</p>";
	rendered += "</a>";
	rendered += "</div>";
    rendered += "<span class=\"ui-icon ui-icon-arrow-r ui-icon-shadow\"></span>";
	rendered += "</div>";
	rendered += "</li>";
	return rendered;
}

function get_product_from_cart_by_lcboid(lcboid) {
    var products = cart_get_products();
    for (var idx in products) {
        var product = cart_get_product_by_index(idx);
        if (product.id == lcboid) return product;
    }
    return Object();
}

function cart_init() {
    if (localStorage == undefined) {
        if (window.winesnob.cart === undefined) window.winesnob.cart = Array();
    } else {
        if (localStorage.getItem("cart") == null) {
            var cart = Object();
            cart.items = Array();
            localStorage.setItem("cart", JSON.stringify(cart));
        }
    }
}
function cart_add_product(product) {
    if ( localStorage == undefined ) {
        if (window.winesnob.cart === undefined) window.winesnob.cart = Array();
        window.winesnob.cart.push(product);
    } else {
        var cart = JSON.parse( localStorage.getItem("cart") );
        cart.items.push(product);
        localStorage.setItem("cart", JSON.stringify(cart));
    }
}

function cart_get_product_by_index(idx) {
    if ( localStorage == undefined) {
        if (window.winesnob.cart === undefined) {
            window.winesnob.cart = Array();
            return Object();
        }

        if (window.winesnob.cart.length > idx) {
            return window.winesnob.cart[idx];
        }
        return Object(); 
    } else {
        var cart = JSON.parse(localStorage.getItem("cart"));
        if ( cart.items.length > idx) {
            return cart.items[idx];
        }
        return Object();
    }

}

function cart_get_products() {
    if ( localStorage == undefined) {
        if (window.winesnob.cart === undefined) {
            window.winesnob.cart = Array();
        }
        return window.winesnob.cart;
    } else {
        var cart = JSON.parse(localStorage.getItem("cart"));
        return cart.items;
    }

}

function geoLocateSuccessFunction(position) {
    if ( window.winesnob !== undefined && window.winesnob.lat == undefined) {
        window.winesnob.lat = position.coords.latitude;
        window.winesnob.lon = position.coords.longitude;
    } 
}

function geoLocateErrorFunction() {
    //alert("Geocoder failed");
}

function pimp_my_app() {
    var promotion = Object();
    promotion.platforms = Array();
    
    var bb = Object();
    bb.name = "BlackBerry";
    bb.app_url = "https://build.phonegap.com/apps/74129/download/blackberry";
    bb.promotion_title = "BlackBerry user?";
    bb.promotion_message = "BlackBerry users can download our app! Click here to get started: <a data-role='button' href='" + bb.app_url + "' >Install Now</a>";
    bb.user_agent_pattern = "blackberry";
    
    promotion.platforms.push(bb);
    
    var android = Object();
    android.name = "Android";
    android.app_url = "http://www.lcbobuddy.com/packages/LCBOBuddy-debug.apk";
    android.promotion_title = "Android user?";
    android.promotion_message = "Android users can download our app! Click here to get started: <a data-role='button' href='" + android.app_url + "' >Install Now</a>";
    android.user_agent_pattern = "android";

    promotion.platforms.push(android);

//    var chrome = Object();
//    chrome.name = "Chrome";
//    chrome.app_url = "https://build.phonegap.com/apps/74129/download/android";
//    chrome.promotion_title = "Chrome user?";
//    chrome.promotion_message = "Chrome users can download our app! Click here to get started: <a data-role='button' href='" + android.app_url + "' >Install Now</a>";
//    chrome.user_agent_pattern = "chrome";

//    promotion.platforms.push(chrome);
    
    promotion.pimp = function () {
        var ua = navigator.userAgent.toLowerCase();
        var is_our_website = document.URL.toLowerCase().indexOf("lcbobuddy") > -1;
        for (var idx in this.platforms) {
            if ( is_our_website) {
                $("#info_box").click(function () {
                    $("#info_box").html("");
                });
            }
            var platform = promotion.platforms[idx];
            var is_our_platform = ua.indexOf(platform.user_agent_pattern) > -1;
            if (is_our_platform && is_our_website) {
                $("#info_box").html($(info_box(platform.promotion_title, platform.promotion_message)));
            }
        }
    };
    
    $(document).ready(promotion.pimp());
    
}

function info_box(title,message) {

    var markup = "<div class='ui-bar ui-bar-e'>";
    markup += "<h3 style='float:left; margin-top:8px;'>" + title + " </h3>";
    markup += "<div style='float:right; margin-top:4px;'>";
    markup += "<a href='#' id='info_box_dismiss' data-role='button' data-icon='delete' data-iconpos='notext' data-corners='true' ";
    markup += "data-shadow='true' data-iconshadow='true' data-inline='false' data-wrapperels='span' title='Button' ";
    markup += "class='ui-btn ui-btn-up-e ui-btn-icon-notext ui-btn-corner-all ui-shadow'><span class='ui-btn-inner ui-btn-corner-all ui-corner-top ui-corner-bottom'>";
    markup += "<span class='ui-btn-text'>Button</span><span class='ui-icon ui-icon-delete ui-icon-shadow'></span></span></a></div>";
    markup += "<p style='clear:both; font-size:85%; margin-bottom:8px;'>" + message + "</p>";
    markup += "</div>";

    return markup;
}

function handle_listings(data) {
    window.winesnob.listings = data;
    for (var idx in window.winesnob.listings) {
        var listing = window.winesnob.listings[idx];
        $("#listings_listview").append(get_listing_content(listing, idx, "listing"));//.listview("refresh");
        $.mobile.hidePageLoadingMsg();
    }
}

function get_local_data() {
    jQuery.getJSON(
			"data/listings.json", handle_listings);
}