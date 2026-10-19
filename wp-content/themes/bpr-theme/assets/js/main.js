document.addEventListener('DOMContentLoaded', function () {
    // Mobile nav toggle
    var toggle = document.querySelector('.hdr__toggle');
    var nav = document.querySelector('.hdr__nav');
    if (toggle && nav) {
        toggle.addEventListener('click', function () {
            var open = nav.classList.toggle('active');
            toggle.setAttribute('aria-expanded', open);
            toggle.querySelector('.hdr__toggle-open').style.display = open ? 'none' : 'block';
            toggle.querySelector('.hdr__toggle-close').style.display = open ? 'block' : 'none';
        });
    }

    // FAQ accordion — plus/x rotation
    document.querySelectorAll('.faq-row__q').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var row = btn.closest('.faq-row');
            var wasOpen = row.classList.contains('open');
            document.querySelectorAll('.faq-row').forEach(function (r) {
                r.classList.remove('open');
                r.querySelector('.faq-row__q').setAttribute('aria-expanded', 'false');
            });
            if (!wasOpen) {
                row.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });
});
