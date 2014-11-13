// アプリケーションオブジェクト
App = {}


window.onload = function() {
    initialize_app();

    redraw(); // 最初の描画
}

function initialize_app() {
    App.ctl = {};

    // Canvas とコンテキストを用意する
    App.canvas = document.getElementById('plane');
    if (!App.canvas || !App.canvas.getContext) return false;
    App.ctx = App.canvas.getContext('2d');

    // App.canvas.addEventListener('mousemove', function(evt) {
    //     var mousePos = getMousePos(App.canvas, evt);
    //     var p = canvas_to_ab(mousePos);
    //     App.target = { l: App.target.l, a: p.a, b: p.b };
    //     redraw();
    // }, false);

    App.canvas.onclick = on_canvas_click;

    App.ctl.lightness_bar = document.getElementById('lightness_bar');

    App.ctl.lightness_bar.addEventListener('click', on_lightness_bar_click, false);


    App.ctl.color = document.getElementById('color');
    App.ctl.color.oninput = on_color_input;

    App.ctl.l = document.getElementById('l');
    App.ctl.a = document.getElementById('a');
    App.ctl.b = document.getElementById('b');

    App.ctl.l.oninput = on_lab_input;
    App.ctl.a.oninput = on_lab_input;
    App.ctl.b.oninput = on_lab_input;

    App.ctl.rgb_r = document.getElementById('rgb_r');
    App.ctl.rgb_g = document.getElementById('rgb_g');
    App.ctl.rgb_b = document.getElementById('rgb_b');

    App.ctl.rgb_r.oninput = on_rgb_input;
    App.ctl.rgb_g.oninput = on_rgb_input;
    App.ctl.rgb_b.oninput = on_rgb_input;

    App.ctl.hue = document.getElementById('hue');
    App.ctl.hue.oninput = on_hue_input;

    App.ctl.sample = document.getElementById('target_sample');
    App.ctl.sample.oninput = on_sample_input;

    App.ctl.desaturate = document.getElementById('desaturate');
    App.ctl.desaturate.onclick = on_desaturate_click;
    App.ctl.adjustl = document.getElementById('adjustl');
    App.ctl.adjustl.onclick = on_adjustl_click;

    App.target = { l: 50, a: 0, b: 0 };
}

function on_sample_input() {
    var rgb = parse_color(App.ctl.sample.value);

    console.log("sample1");
    if (!rgb) { return false; }
    console.log("sample2");

    App.target = rgb_to_lab(rgb);
    redraw();
    return true;
}

function on_hue_input() {
    var angle = +App.ctl.hue.value;
    if (angle < 0 || angle > 360) return false;

    var theta = angle / 180 * Math.PI;
    var d = distance_origin(App.target.a, App.target.b);
    App.target = { l: App.target.l,
             a: Math.cos(theta) * d,
             b: Math.sin(theta) * d };
    redraw();
}

function on_rgb_input() {
    console.log("input");
    var r = +App.ctl.rgb_r.value;
    var g = +App.ctl.rgb_g.value;
    var b = +App.ctl.rgb_b.value;

    App.target = rgb_to_lab({ r: r, g: g, b: b });
    redraw();
}

function on_canvas_click(event) {
    var pos = getMousePos(App.canvas, event);

    ab = canvas_to_ab(pos);
    App.target = { l: App.target.l, a: ab.a, b: ab.b };
    redraw();
}

function on_desaturate_click() {
    App.target = desaturate(App.target);
    redraw();
}

function on_adjustl_click() {
    App.target = adjustl(App.target);
    redraw();
}

function on_lightness_bar_click(event) {
    var pos = getMousePos(App.ctl.lightness_bar, event);

    var l = Math.round(pos.x / App.ctl.lightness_bar.width * 100);

    App.target = { l: l, a: App.target.a, b: App.target.b };
    redraw();
}

function on_lab_input() {
    App.target = { l: Number(App.ctl.l.value),
                   a: Number(App.ctl.a.value),
                   b: Number(App.ctl.b.value) };
    redraw();
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function on_color_input() {
    var rgb = parse_color(App.ctl.color.value);
    if (rgb) {
        App.target = rgb_to_lab(rgb);
        redraw();
        return true;
    } else {
        return false;
    }
}

function canvas_to_ab(p) {
    var w = Number(App.canvas.width);
    var h = Number(App.canvas.height);
    var xnotch = w/256, ynotch = h/256;

    // Y 軸は上が+
    return { a: -128 + (p.x / xnotch),
             b:  128 - (p.y / ynotch) };
}

function lab_to_canvas(lab) {
    var w = Number(App.canvas.width);
    var h = Number(App.canvas.height);
    var x = (lab.a + 128) / 256 * w;
    var y = h - ((lab.b + 128) / 256 * h);

    return { x: x, y: y };
}

function draw_crosshair(context, lab_color, style) {
    var coords = lab_to_canvas(lab_color);
    var x = coords.x, y = coords.y;

    context.beginPath();

    context.lineWidth = 2;
    context.strokeStyle = style;

    context.moveTo(x, y - 4);
    context.lineTo(x, y - 9);
    context.stroke();

    context.moveTo(x, y + 4);
    context.lineTo(x, y + 9);
    context.stroke();

    context.moveTo(x - 4, y);
    context.lineTo(x - 9, y);
    context.stroke();

    context.moveTo(x + 4, y);
    context.lineTo(x + 9, y);
    context.stroke();

    context.closePath();
}

function draw_whitepoint(ctx, style) {
    var radius = 5;
    var whitepoint = lab_to_canvas({ l: 0, a: 0, b: 0});

    ctx.beginPath();

    ctx.lineWidth = 2;
    ctx.strokeStyle = style;

    console.log(whitepoint);
    ctx.arc(whitepoint.x, whitepoint.y,
            radius,
            0, 2*Math.PI);
    ctx.stroke();
}

function draw_plane(ctx, width, height, lightness) {
    ctx.fillStyle = "rgb(128,128,128)";
    ctx.fillRect(0, 0, width, height);
    draw_color_slice(ctx,  width, height, lightness);
    draw_crosshair(ctx, App.target, "#fff");
    draw_whitepoint(ctx, "#fff");
}

function draw_color_slice(ctx, width, height, lightness) {
    var x, y;
    var lab;
    var state; // before: 0, in: 1, out: 2
    var rgb;

    for (y = 0; y < height; y++) {
        inner:
        for (x = 0; x < width; x++) {
            state = 0;

            lab = canvas_to_ab({ x: x, y: y });
            rgb = lab_to_rgb({ l: lightness, a: lab.a, b: lab.b });

            switch (state) {
            case 0:
                if (rgb_in_range(rgb)) {
                    ctx.fillStyle = rgb_to_string(rgb);
                    ctx.fillRect(x, y, 1, 1);
                    state = 1;
                }
                break;
            case 1:
                if (rgb_in_range(rgb)) {
                    ctx.fillStyle = rgb_to_string(rgb);
                    ctx.fillRect(x, y, 1, 1);
                } else {
                    state = 2;
                }
                break;
            case 2:
                break inner;
            }
        }
    }
}

function parse_color(value) {
    var m;

    if (m = value.match(/^#(.)(.)(.)$/)) {
        return { r: parseInt("0x"+m[1]) / 15 * 255,
                 g: parseInt("0x"+m[2]) / 15 * 255,
                 b: parseInt("0x"+m[3]) / 15 * 255 };
    } else if (m = value.match(/^#(..)(..)(..)$/)) {
        return { r: parseInt("0x"+m[1]),
                 g: parseInt("0x"+m[2]),
                 b: parseInt("0x"+m[3]) };
    } else {
        return null;
    }
}

function fill_sample() {
    App.ctl.sample.value = rgb_to_hex(lab_to_rgb(App.target));
}

function distance_origin(x, y) {
    return Math.sqrt(x * x + y * y);
}

function redraw() {
    var width, height;

    if (!App.target) return false;

    width = Number(App.canvas.width);
    height = Number(App.canvas.height);

    draw_plane(App.ctx, width, height, App.target.l);

    update_controls();
}

function str_repeat(phrase, n) {
    var res = "";

    while (n >= 0) {
        res += phrase;
        n--;
    }
    return res;
}

function update_controls() {
    var rgb;

    App.ctl.l.value = Math.round(App.target.l);
    App.ctl.a.value = Math.round(App.target.a);
    App.ctl.b.value = Math.round(App.target.b);

    rgb = lab_to_rgb( App.target );
    App.ctl.rgb_r.value = Math.round(rgb.r);
    App.ctl.rgb_g.value = Math.round(rgb.g);
    App.ctl.rgb_b.value = Math.round(rgb.b);

    App.ctl.hue.value = lab_hue_degree(App.target);

    if (lab_is_real(App.target)) {
        App.ctl.color.value = rgb_to_hex(lab_to_rgb(App.target));
    } else {
        App.ctl.color.value = "n/a";
    }

    update_lightness_bar();

    fill_sample();
}

function update_lightness_bar() {
    var ctx = App.ctl.lightness_bar.getContext('2d');
    var w = Number( App.ctl.lightness_bar.width );
    var h = Number( App.ctl.lightness_bar.height );
    var xnotch = w / 100;
    var l;

    ctx.fillStyle = "#888";
    ctx.fillRect(0, 0, w, h);

    for (l = 0; l <= 100; l += 1) {
        ctx.fillStyle = rgb_to_string(
            lab_to_rgb({ l: l, a: App.target.a, b: App.target.b })
        );
        ctx.fillRect(l * xnotch - xnotch/2, 0, xnotch, h);
    }

    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.strokeStyle = "#fff";
    ctx.moveTo(App.target.l * xnotch, 0);
    ctx.lineTo(App.target.l * xnotch, App.ctl.lightness_bar.height / 2);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.strokeStyle = "#000";
    ctx.moveTo(App.target.l * xnotch, App.ctl.lightness_bar.height / 2);
    ctx.lineTo(App.target.l * xnotch, App.ctl.lightness_bar.height);
    ctx.stroke();

    ctx.closePath();
}
