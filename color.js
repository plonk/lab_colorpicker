// 色変換の数式は http://www.easyrgb.com/index.php?X=MATH を元にしている。
function rgb_to_xyz(rgb) {
    var R = rgb.r / 255;
    var G = rgb.g / 255;
    var B = rgb.b / 255;

    var f = function(x) {
        if (x > 0.04045)
            return Math.pow((x + 0.055) / 1.055, 2.4);
        else
            return x / 12.92;
    };

    R = f(R) * 100;
    G = f(G) * 100;
    B = f(B) * 100;

    // Observer. = 2°, Illuminant = D65
    return { x: R * 0.4124 + G * 0.3576 + B * 0.1805,
             y: R * 0.2126 + G * 0.7152 + B * 0.0722,
             z: R * 0.0193 + G * 0.1192 + B * 0.9505 };
}

function lab_to_xyz(lab) {
    var y = (lab.l + 16) / 116;
    var x = lab.a / 500 + y;
    var z = y - lab.b / 200;

    var f = function (g) { 
        if (Math.pow(g,3) > 0.008856)
            return Math.pow(g,3);
        else
            return (g - 16/116) / 7.787;
    };

    var refX =  95.047;
    var refY = 100.000;
    var refZ = 108.883;
    return { x: refX * f(x), y: refY * f(y), z: refZ * f(z) };
}

function xyz_to_rgb(xyz) {
    var var_X = xyz.x / 100;
    var var_Y = xyz.y / 100;
    var var_Z = xyz.z / 100;

    var var_R = var_X *  3.2406 + var_Y * -1.5372 + var_Z * -0.4986;
    var var_G = var_X * -0.9689 + var_Y *  1.8758 + var_Z *  0.0415;
    var var_B = var_X *  0.0557 + var_Y * -0.2040 + var_Z *  1.0570;

    if (var_R > 0.0031308) {
        var_R = 1.055 * Math.pow(var_R, 1/2.4) - 0.055;
    } else {
        var_R = 12.92 * var_R;
    } 
    if (var_G > 0.0031308) {
        var_G = 1.055 * Math.pow(var_G, 1/2.4) - 0.055;
    } else {
        var_G = 12.92 * var_G;
    }
    if (var_B > 0.0031308) {
        var_B = 1.055 * Math.pow(var_B, 1/2.4) - 0.055;
    } else {
        var_B = 12.92 * var_B;
    }
    return { r: var_R * 255, g: var_G * 255, b: var_B * 255 };
}

function xyz_to_lab(xyz) {
    //Observer= 2°, Illuminant= D65
    var X = xyz.x /  95.047;
    var Y = xyz.y / 100.000;
    var Z = xyz.z / 108.883;

    var f = function (x) {
        if (x > 0.008856)
            return Math.pow(x, 1/3);
        else
            return 7.787 * x + 16 / 116;
    };

    return { l: (116 * f(Y)) - 16,
             a: 500 * (f(X) - f(Y)),
             b: 200 * (f(Y) - f(Z)) };
}

function lab_to_rgb(lab) {
    var xyz = lab_to_xyz(lab);
    // console.log(xyz);
    return xyz_to_rgb(xyz);
}

function rgb_to_lab(rgb) {
    var xyz = rgb_to_xyz(rgb);
    return xyz_to_lab(xyz);
}

function rgb_in_range(rgb) {
    var inrange = function (x) { 
        return x >= 0 && x <= 255;
    };

    return !!(inrange(Math.round(rgb.r)) &&
              inrange(Math.round(rgb.g)) &&
              inrange(Math.round(rgb.b)));
}

function rgb_to_string(rgb) {
    if (rgb_in_range(rgb))
        return "rgb("+Math.round(rgb.r)+","+Math.round(rgb.g)+","+Math.round(rgb.b)+")";
    else
        return "rgb(128,128,128)";
}

function pad_zero(str, n) {
    if (str.length >= n) {
        return str;
    } else {
        return str_repeat('0', n - str.length) + str;
    }
}

function rgb_to_hex(rgb) {
    if (rgb_in_range(rgb)) {
        var hex = [ rgb.r, rgb.g, rgb.b ].map(function (f) {
            return pad_zero(Math.round(f).toString(16), 2);
        }).join("");
        return "#" + hex;
    } else {
        return "#808080";
    }
}

function rgb_to_string_clipped(rgb) {
    var clip = function (x) {
        if (x < 0) return 0; else if (x > 255) return 255; else return x;
    };

    return "rgb("+clip(Math.round(rgb.r))+","+clip(Math.round(rgb.g))+","+clip(Math.round(rgb.b))+")";
}


function lab_rotate(lab, radian) {
    var theta = lab_hue(lab);
    var d = distance_origin(lab.a, lab.b)

    return { l: lab.l,
             a: Math.cos(theta + radian) * d,
             b: Math.sin(theta + radian) * d };
}

function lab_hue_degree(lab) {
    return Math.round((lab_hue_radian(lab) / Math.PI * 180 + 360) % 360);
}

function lab_hue_radian(lab) {
    return Math.atan2(lab.b, lab.a);
}

// 補色を得る
function lab_complement(lab) {
    return lab_rotate(lab, Math.PI);
}

function lab_tetrade(order, lab) {
    return lab_rotate(lab, Math.PI * 2 / 3 * order);
}

function lab_is_real(lab) {
    return rgb_in_range(lab_to_rgb(lab));
}

function desaturate(pos) {
    var i = 0;
    var alpha;

    for (i = 0; i <= 100; i++) {
        alpha = i * 0.01;
        var c = { l: pos.l,
                  a: 0 * alpha + (1-alpha) * pos.a,
                  b: 0 * alpha + (1-alpha) * pos.b };

        if (lab_is_real(c)) {
            return c;
        }
    }
    alert("desaturate: logic error");
}

function adjustl(pos) {
    if (lab_is_real(pos)) return pos;

    // l, a, b 
    var l, c;

    // l を上げてみる
    for (l = pos.l; l <= 100; l++) {
        c = { l: l, a: pos.a, b: pos.b};
        if (lab_is_real(c))
            return c;
    }

    // l を下げてみる
    for (l = pos.l; l >= 0; l -= 1) {
        c = { l: l, a: pos.a, b: pos.b};
        if (lab_is_real(c))
            return c;
    }

    // 元の値を返す
    return pos;
}
