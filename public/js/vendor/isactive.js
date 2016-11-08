/*
 * TODO: Use utils.js instead of own library
 *
*/

function handleActive(target) {
    /* reset everything */
    $("[data-link]").removeClass('active');
    /* activate current element */
    target.addClass('active');
    /* activate parent elements */
    var attr = target.attr('data-link-parents');
    if(typeof attr !== typeof undefined) {
        var parents = attr.split(" ");
        _.each(parents, function(parent) {
            $('[data-link="' + parent + '"]').addClass('active');
        });
    }
}

function setActive(linkName) {
    handleActive($("[data-link=" + linkName + "]"));
}
