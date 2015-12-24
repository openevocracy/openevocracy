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

// NOTE
// Because a view change triggered in group_events.js and the group controller,
// it recreates all buttons directly afterwards.
// Therefore setActive MUST be called from the new view's onShow() method
// in order for this to work.
$(document.body).on('click', '[data-link]', function(event) {
    var target = $(event.target);
    if(target.is('span'))
        target = target.parent();
    handleActive(target);
});