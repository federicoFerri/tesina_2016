$(document).ready(function() {
    $(".minHeight600").height($(window).height());
    $(window).resize(function() {
        $(".minHeight600").height($(window).height());
        $(".minHeight600").css("min-height", "600px")
    });
});
$(document).ready(function(e) {
    e(".scroll").click(function(t) {
        t.preventDefault();
        e("html,body").animate({
            scrollTop: e(this.hash).offset().top
        }, 1e3)
    })
});