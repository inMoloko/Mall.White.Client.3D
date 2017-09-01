var jsKeyboard = {
    settings: {
        lang: "RU", // default language
        buttonClass: "button", // default button class
        onclick: "jsKeyboard.write();", // default onclick event for button
        keyClass: "key", // default key class used to define style of text of the button
        text: {
            close: "close"
        }
    },
    "keyboard": [], // different keyboards can be set to this variable in order to switch between keyboards easily.
    init: function (elem, keyboard) {
        jsKeyboard.keyboard["default"] = jsKeyboard.defaultKeyboard;
        jsKeyboard.keyboardLayout = elem;

        if (keyboard != null && keyboard != undefined)
            jsKeyboard.generateKeyboard(keyboard);
        else
            jsKeyboard.generateKeyboard("default");

        jsKeyboard.addKeyDownEvent();

        //jsKeyboard.show();
        $(':input').not('[type="reset"]').not('[type="submit"]').on('focus, click', function (e) {
            jsKeyboard.currentElement = $(this);
            jsKeyboard.currentElementCursorPosition = $(this).getCursorPosition();
            //console.log('keyboard is now focused on ' + jsKeyboard.currentElement.attr('name') + ' at pos(' + jsKeyboard.currentElementCursorPosition + ')');
        });

        var timerId = 0;
        $("input, textarea").focusin(function (e) {
            clearTimeout(timerId);
            jsKeyboard.show();
        });
        $("input, textarea").focusout(function () {
            timerId = setTimeout(function () {
                //console.log("hide by timer");
                jsKeyboard.hide();
            }, 1000);
        });
    },
    focus: function (t) {
        jsKeyboard.currentElement = $(t);
        //jsKeyboard.show();
    },
    keyboardLayout: "", // it shows the html element where keyboard is generated
    currentKeyboard: "default", // it shows the which keyboard is used. If it's not set default keyboard is used.
    currentElement: null,
    generateKeyboard: function (keyboard) {
        var bClass = "";
        var kClass = "";
        var onclick = "";
        var text = "";

        var s = "";
        s += "<div id=\"keyboard\">";
        s += "<div id=\"keyboardHeader\"><span></span>";
        // s += "<div onclick=\"jsKeyboard.hide();\"><span>" + jsKeyboard.settings.text.close + "</span><span class=\"closex\"> X</span></div>"
        s += "</div>";

        /*small letter */
        s += "<div id=\"keyboardSmallLetter\">";
        $.each(jsKeyboard.keyboard[keyboard].smallLetter, function (i, key) {
            generate(key);
        });
        s += "</div>";

        /*capital letter*/
        s += "<div id=\"keyboardCapitalLetter\">";
        $.each(jsKeyboard.keyboard[keyboard].capitalLetter, function (i, key) {
            generate(key);
        });
        s += "</div>";

        /*en small letter */
        s += "<div id=\"keyboardEnSmallLetter\">";
        $.each(jsKeyboard.keyboard[keyboard].enSmallLetter, function (i, key) {
            generate(key);
        });
        s += "</div>";

        /*en capital letter*/
        s += "<div id=\"keyboardEnCapitalLetter\">";
        $.each(jsKeyboard.keyboard[keyboard].enCapitalLetter, function (i, key) {
            generate(key);
        });
        s += "</div>";

        /*number*/
        s += "<div id=\"keyboardNumber\">";
        $.each(jsKeyboard.keyboard[keyboard].number, function (i, key) {
            generate(key);
        });
        s += "</div>";

        /*symbols*/
        s += "<div id=\"keyboardSymbols\">";
        $.each(jsKeyboard.keyboard[keyboard].symbols, function (i, key) {
            generate(key);
        });
        s += "</div>";

        function generate(key) {
            bClass = key.buttonClass == undefined ? jsKeyboard.settings.buttonClass : key.buttonClass;
            kClass = key.keyClass == undefined ? jsKeyboard.settings.keyClass : key.keyClass;
            onclick = key.onclick == undefined ? jsKeyboard.settings.onclick.replace("()", "(" + key.value + ")") : key.onclick;

            text = (key.isChar != undefined || key.isChar == false) ? key.value : String.fromCharCode(key.value);

            s += "<div " + (key.width == undefined ? "" : "style=\"width:" + key.width + " !important;\"") + " class=\"" + bClass + "\" onclick=\"" + onclick + "\"><div class=\"" + kClass + "\">" + text + "</div></div>";

            bClass = "";
            kClass = "";
            onclick = "";
            text = "";
        }

        $("#" + jsKeyboard.keyboardLayout).html(s);
        $("#keyboard").click(function () {
            //console.log("keyboard clicked");
            jsKeyboard.updateCursor();
        });
    },
    addKeyDownEvent: function () {
        $("#keyboardCapitalLetter > div.button, #keyboardSmallLetter > div.button, #keyboardNumber > div.button, #keyboardSymbols > div.button, #keyboardEnCapitalLetter > div.button, #keyboardEnSmallLetter > div.button").bind('mousedown', (function () {
            $(this).addClass("buttonDown");
        })).bind('mouseup', (function () {
            $(this).removeClass("buttonDown");
        })).bind('mouseout', (function () {
            $(this).removeClass("buttonDown");
        }));

        //key focus down on actual keyboard key presses
        //todo:....

    },
    changeToSmallLetter: function () {
        $("#keyboardCapitalLetter,#keyboardNumber,#keyboardSymbols,#keyboardEnCapitalLetter,#keyboardEnSmallLetter").css("display", "none");
        $("#keyboardSmallLetter").css("display", "block");
        jsKeyboard.updateCursor();
    },
    changeToCapitalLetter: function () {
        $("#keyboardCapitalLetter").css("display", "block");
        $("#keyboardSmallLetter,#keyboardNumber,#keyboardSymbols,#keyboardEnCapitalLetter,#keyboardEnSmallLetter").css("display", "none");
        jsKeyboard.updateCursor();
    },
    changeToEnSmallLetter: function () {
        $("#keyboardCapitalLetter,#keyboardNumber,#keyboardSymbols,#keyboardEnCapitalLetter,#keyboardSmallLetter").css("display", "none");
        $("#keyboardEnSmallLetter").css("display", "block");
        jsKeyboard.updateCursor();
    },
    changeToEnCapitalLetter: function () {
        $("#keyboardEnCapitalLetter").css("display", "block");
        $("#keyboardSmallLetter,#keyboardNumber,#keyboardSymbols,#keyboardCapitalLetter,#keyboardEnSmallLetter").css("display", "none");
        jsKeyboard.updateCursor();
    },
    changeToNumber: function () {
        $("#keyboardNumber").css("display", "block");
        $("#keyboardSymbols,#keyboardCapitalLetter,#keyboardSmallLetter,#keyboardEnCapitalLetter,#keyboardEnSmallLetter").css("display", "none");
        jsKeyboard.updateCursor();
    },
    changeToSymbols: function () {
        $("#keyboardCapitalLetter,#keyboardNumber,#keyboardSmallLetter,#keyboardEnCapitalLetter,#keyboardEnSmallLetter").css("display", "none");
        $("#keyboardSymbols").css("display", "block");
        jsKeyboard.updateCursor();
    },
    updateCursor: function () {
        //input cursor focus and position during typing
        jsKeyboard.currentElement.setCursorPosition(jsKeyboard.currentElementCursorPosition);
        jsKeyboard.currentElement.focus();
        $('#keyboardHeader>span').text(jsKeyboard.currentElement.val());
    },
    write: function (m) {
        var a = jsKeyboard.currentElement.val(),
            b = String.fromCharCode(m),
            pos = jsKeyboard.currentElement.val().length,
            output = [a.slice(0, pos), b, a.slice(pos)].join('');
        jsKeyboard.updateCursor();
        jsKeyboard.currentElement.val(output);
        jsKeyboard.currentElementCursorPosition++; //+1 cursor
        jsKeyboard.updateCursor();
        jsKeyboard.currentElement.trigger("writeKeyboard");
    },
    del: function () {
        var a = jsKeyboard.currentElement.val(),
            pos = jsKeyboard.currentElementCursorPosition;
        var output = a;
        if (pos > 0) output = [a.slice(0, pos - 1), a.slice(pos)].join('');
        jsKeyboard.currentElement.val(output);
        if (jsKeyboard.currentElementCursorPosition > 0) jsKeyboard.currentElementCursorPosition--; //-1 cursor
        jsKeyboard.updateCursor();
        jsKeyboard.currentElement.trigger("writeKeyboard");
    },
    enter: function (e) {
        //var t = jsKeyboard.currentElement.val();
        //jsKeyboard.currentElement.val(t + "\n");
        if (e != undefined) e.stopPropagation();
        //console.log("hide by enter");
        jsKeyboard.hide();
    },
    space: function () {
        var a = jsKeyboard.currentElement.val(),
            b = " ",
            pos = jsKeyboard.currentElementCursorPosition,
            output = [a.slice(0, pos), b, a.slice(pos)].join('');
        jsKeyboard.currentElement.val(output);
        jsKeyboard.currentElementCursorPosition++; //+1 cursor
        jsKeyboard.updateCursor();
        jsKeyboard.currentElement.trigger("writeKeyboard");
    },
    writeSpecial: function (m) {
        var a = jsKeyboard.currentElement.val(),
            b = String.fromCharCode(m),
            pos = jsKeyboard.currentElementCursorPosition,
            output = [a.slice(0, pos), b, a.slice(pos)].join('');
        jsKeyboard.currentElement.val(output);
        jsKeyboard.currentElementCursorPosition++; //+1 cursor
        jsKeyboard.updateCursor();
        jsKeyboard.currentElement.trigger("writeKeyboard");
    },
    show: function () {
        //$("#keyboard").animate({ "bottom": "15" }, "fast", function () { });
        $("#keyboard").css("bottom", "15px");
        //$("#keyboard").bind("click", jsKeyboard.keyboardClick);
        if (jsKeyboard.currentElement)
            jsKeyboard.currentElement.trigger("show");
    },
    hide: function () {
        //console.log("hide");
        //$("#keyboard").animate({ "bottom": "-350px" }, "fast", function() { });
        $("#keyboard").clearQueue().stop().css("bottom", "-350px"); //.animate({"bottom": "-350px"}, "fast", function() {});
        //$("#keyboard").unbind("click", jsKeyboard.keyboardClick);
    },
    keyboardClick: function () {
        jsKeyboard.updateCursor();
    },
    defaultKeyboard: {
        enCapitalLetter:
            [
                // 1st row
                {value: 81}, {value: 87}, {value: 69}, {value: 82}, {value: 84}, {value: 89}, {value: 85}, {value: 73}, {value: 79}, {value: 80},
                {
                    value: "&larr;",
                    isChar: "false",
                    onclick: "jsKeyboard.del()",
                    buttonClass: "button button_del",
                    keyClass: "key key_del",
                    width: "188px"
                },
                // 2nd row
                {
                    value: 65,
                    buttonClass: "button row-2nd"
                }, {value: 83}, {value: 68}, {value: 70}, {value: 71}, {value: 72}, {value: 74}, {value: 75}, {value: 76},
                {
                    value: "OK",
                    isChar: "false",
                    buttonClass: "button button_special",
                    onclick: "jsKeyboard.enter(event);",
                    keyClass: "key key_enter",
                    width: "196px"
                },
                // 3rd row
                {
                    value: "abc",
                    isChar: "false",
                    buttonClass: "button button_special row-3rd",
                    onclick: "jsKeyboard.changeToEnSmallLetter();",
                    keyClass: "key key_smallletter"
                },
                {value: 90}, {value: 88}, {value: 67}, {value: 86}, {value: 66}, {value: 78}, {value: 77}, {value: 44}, {value: 46}, {value: 64},
                // 4th row
                {
                    value: "РУС",
                    isChar: "false",
                    buttonClass: "button button_special row-4th",
                    onclick: "jsKeyboard.changeToCapitalLetter();",
                    keyClass: "key key_number",
                    width: "74px"
                },
                {
                    value: "123",
                    isChar: "false",
                    buttonClass: "button button_special",
                    onclick: "jsKeyboard.changeToNumber();",
                    keyClass: "key key_number",
                    width: "129px"
                },
                {
                    value: "",
                    isChar: "false",
                    buttonClass: "button button_special",
                    onclick: "jsKeyboard.space();",
                    keyClass: "key key_space",
                    width: "376px"
                },
                {
                    value: "#%+",
                    isChar: "false",
                    buttonClass: "button button_special",
                    onclick: "jsKeyboard.changeToSymbols();",
                    keyClass: "key key_symbols",
                    width: "129px"
                }
            ],
        enSmallLetter: [
            // 1st row
            {value: 113}, {value: 119}, {value: 101}, {value: 114}, {value: 116}, {value: 121}, {value: 117}, {value: 105}, {value: 111}, {value: 112},
            {
                value: "&larr;",
                isChar: "false",
                onclick: "jsKeyboard.del()",
                buttonClass: "button button_del",
                keyClass: "key key_del",
                width: "188px"
            },
            // 2nd row
            {
                value: 97,
                buttonClass: "button row-2nd"
            }, {value: 115}, {value: 100}, {value: 102}, {value: 103}, {value: 104}, {value: 106}, {value: 107}, {value: 108},
            {
                value: "OK",
                isChar: "false",
                buttonClass: "button button_special",
                onclick: "jsKeyboard.enter(event);",
                keyClass: "key key_enter",
                width: "196px"
            },
            // 3rd row
            {
                value: "ABC",
                isChar: "false",
                buttonClass: "button button_special row-3rd",
                onclick: "jsKeyboard.changeToEnCapitalLetter();",
                keyClass: "key key_capitalletterleft"
            },
            {value: 122}, {value: 120}, {value: 99}, {value: 118}, {value: 98}, {value: 110}, {value: 109}, {value: 44}, {value: 46}, {value: 64},
            // 4th row
            {
                value: "РУС",
                isChar: "false",
                buttonClass: "button button_special row-4th",
                onclick: "jsKeyboard.changeToSmallLetter();",
                keyClass: "key key_number",
                width: "74px"
            },
            {
                value: "123",
                isChar: "false",
                buttonClass: "button button_special",
                onclick: "jsKeyboard.changeToNumber();",
                keyClass: "key key_number",
                width: "129px"
            },
            {
                value: "",
                isChar: "false",
                buttonClass: "button button_special",
                onclick: "jsKeyboard.space();",
                keyClass: "key key_space",
                width: "376px"
            },
            {
                value: "#%+",
                isChar: "false",
                buttonClass: "button button_special",
                onclick: "jsKeyboard.changeToSymbols();",
                keyClass: "key key_symbols",
                width: "129px"
            }
        ],
        capitalLetter:
            [
                // 1st row
                {value: 1049}, {value: 1062}, {value: 1059}, {value: 1050}, {value: 1045}, {value: 1053}, {value: 1043}, {value: 1064}, {value: 1065}, {value: 1047}, {value: 1061}, {value: 1066},
                {
                    value: "&larr;",
                    isChar: "false",
                    onclick: "jsKeyboard.del()",
                    buttonClass: "button button_del",
                    keyClass: "key key_del",
                    width: "103px"
                },
                // 2nd row
                {
                    value: 1060,
                    buttonClass: "button row-2nd"
                }, {value: 1067}, {value: 1042}, {value: 1040}, {value: 1055}, {value: 1056}, {value: 1054}, {value: 1051}, {value: 1044}, {value: 1046}, {value: 1069},
                {
                    value: "OK",
                    isChar: "false",
                    buttonClass: "button button_special",
                    onclick: "jsKeyboard.enter(event);",
                    keyClass: "key key_enter",
                    width: "103px"
                },
                // 3rd row
                {
                    value: "abc",
                    isChar: "false",
                    buttonClass: "button button_special row-3rd",
                    onclick: "jsKeyboard.changeToSmallLetter();",
                    keyClass: "key key_smallletter"
                },
                {value: 1071}, {value: 1063}, {value: 1057}, {value: 1052}, {value: 1048}, {value: 1058}, {value: 1068}, {value: 1041}, {value: 1070}, {value: 1025},
                // 4th row
                {
                    value: "ENG",
                    isChar: "false",
                    buttonClass: "button button_special row-4th",
                    onclick: "jsKeyboard.changeToEnCapitalLetter();",
                    keyClass: "key key_number",
                    width: "74px"
                },
                {
                    value: "123",
                    isChar: "false",
                    buttonClass: "button button_special",
                    onclick: "jsKeyboard.changeToNumber();",
                    keyClass: "key key_number",
                    width: "129px"
                },
                {
                    value: "",
                    isChar: "false",
                    buttonClass: "button button_special",
                    onclick: "jsKeyboard.space();",
                    keyClass: "key key_space",
                    width: "376px"
                },
                {
                    value: "#%+",
                    isChar: "false",
                    buttonClass: "button button_special",
                    onclick: "jsKeyboard.changeToSymbols();",
                    keyClass: "key key_symbols",
                    width: "129px"
                }
            ],
        smallLetter: [
            // 1st row
            {value: 1081}, {value: 1094}, {value: 1091}, {value: 1082}, {value: 1077}, {value: 1085}, {value: 1075}, {value: 1096}, {value: 1097}, {value: 1079}, {value: 1093}, {value: 1098},
            {
                value: "&larr;",
                isChar: "false",
                onclick: "jsKeyboard.del()",
                buttonClass: "button button_del",
                keyClass: "key key_del",
                width: "103px"
            },
            // 2nd row
            {
                value: 1092,
                buttonClass: "button row-2nd"
            }, {value: 1099}, {value: 1074}, {value: 1072}, {value: 1087}, {value: 1088}, {value: 1086}, {value: 1083}, {value: 1076}, {value: 1078}, {value: 1101},
            {
                value: "OK",
                isChar: "false",
                buttonClass: "button button_special",
                onclick: "jsKeyboard.enter(event);",
                keyClass: "key key_enter",
                width: "103px"
            },
            // 3rd row
            {
                value: "ABC",
                isChar: "false",
                buttonClass: "button button_special row-3rd",
                onclick: "jsKeyboard.changeToCapitalLetter();",
                keyClass: "key key_capitalletterleft"
            },
            {value: 1103}, {value: 1095}, {value: 1089}, {value: 1084}, {value: 1080}, {value: 1090}, {value: 1100}, {value: 1073}, {value: 1102}, {value: 1105},
            // 4th row
            {
                value: "ENG",
                isChar: "false",
                buttonClass: "button button_special row-4th",
                onclick: "jsKeyboard.changeToEnSmallLetter();",
                keyClass: "key key_number",
                width: "74px"
            },
            {
                value: "123",
                isChar: "false",
                buttonClass: "button button_special",
                onclick: "jsKeyboard.changeToNumber();",
                keyClass: "key key_number",
                width: "129px"
            },
            {
                value: "",
                isChar: "false",
                buttonClass: "button button_special",
                onclick: "jsKeyboard.space();",
                keyClass: "key key_space",
                width: "376px"
            },
            {
                value: "#%+",
                isChar: "false",
                buttonClass: "button button_special",
                onclick: "jsKeyboard.changeToSymbols();",
                keyClass: "key key_symbols",
                width: "129px"
            }
        ],
        number: [
            // 1st row
            {value: 49}, {value: 50}, {value: 51}, {value: 52}, {value: 53}, {value: 54}, {value: 55}, {value: 56}, {value: 57}, {value: 48},
            {
                value: "&larr;",
                isChar: "false",
                onclick: "jsKeyboard.del()",
                buttonClass: "button button_del",
                keyClass: "key key_del",
                width: "88px"
            },
            // 2nd row
            {
                value: 45,
                buttonClass: "button row-2nd"
            }, {value: 47}, {value: 58}, {value: 59}, {value: 40}, {value: 41}, {value: 36}, {value: 38}, {value: 64},
            {
                value: "OK",
                isChar: "false",
                buttonClass: "button button_special",
                onclick: "jsKeyboard.enter(event);",
                keyClass: "key key_enter",
                width: "106px"
            },
            //3rd row
            {
                value: 63,
                buttonClass: "button row-3rd"
            }, {value: 33}, {value: 34}, {value: 124}, {value: 92}, {value: 42}, {value: 61}, {value: 43}, {value: 46},

            // 4th row
            {
                value: "ABC",
                isChar: "false",
                buttonClass: "button button_special row-4th",
                onclick: "jsKeyboard.changeToCapitalLetter();",
                keyClass: "key key_capitalletterleft",
                width: "212px"
            },
            {
                value: "",
                isChar: "false",
                buttonClass: "button button_special",
                onclick: "jsKeyboard.space();",
                keyClass: "key key_space",
                width: "376px"
            },
            {
                value: "#%+",
                isChar: "false",
                buttonClass: "button button_special",
                onclick: "jsKeyboard.changeToSymbols();",
                keyClass: "key key_symbols",
                width: "129px"
            }
        ],
        symbols: [
            // 1st row
            {value: 91}, {value: 93}, {value: 123}, {value: 125}, {value: 35}, {value: 37}, {value: 94}, {value: 42}, {value: 43}, {value: 61},
            {
                value: "&larr;",
                isChar: "false",
                onclick: "jsKeyboard.del()",
                buttonClass: "button button_del",
                keyClass: "key key_del",
                width: "88px"
            },
            // 2nd row
            {
                value: 95,
                buttonClass: "button row-2nd"
            }, {value: 92}, {value: 124}, {value: 126}, {value: 60}, {value: 62},
            {
                value: "&euro;",
                isChar: "false",
                onclick: "jsKeyboard.writeSpecial('&euro;');"
            }, {value: 163}, {value: 165},
            {
                value: "OK",
                isChar: "false",
                buttonClass: "button button_special",
                onclick: "jsKeyboard.enter(event);",
                keyClass: "key key_enter",
                width: "106px"
            },
            // 3rd row
            {
                value: 46,
                buttonClass: "button row-3rd"
            }, {value: 44}, {value: 63}, {value: 33}, {value: 39}, {value: 34}, {value: 59}, {value: 92}, {value: 64},
            // 4th row
            {
                value: "123",
                isChar: "false",
                buttonClass: "button button_special row-4th",
                onclick: "jsKeyboard.changeToNumber();",
                keyClass: "key key_number",
                width: "212px"
            },
            {
                value: "",
                isChar: "false",
                buttonClass: "button button_special",
                onclick: "jsKeyboard.space();",
                keyClass: "key key_space",
                width: "376px"
            },
            {
                value: "ABC",
                isChar: "false",
                buttonClass: "button button_special",
                onclick: "jsKeyboard.changeToCapitalLetter();",
                keyClass: "key key_capitalletterleft",
                width: "129px"
            },
        ]
    }
}

// GET CURSOR POSITION
jQuery.fn.getCursorPosition = function () {
    if (this.lengh == 0) return -1;
    return $(this).getSelectionStart();
}

jQuery.fn.getSelectionStart = function () {
    if (this.lengh == 0) return -1;
    input = this[0];

    var pos = input.value.length;

    if (input.createTextRange) {
        var r = document.selection.createRange().duplicate();
        r.moveEnd('character', input.value.length);
        if (r.text == '')
            pos = input.value.length;
        pos = input.value.lastIndexOf(r.text);
    } else if (typeof (input.selectionStart) != "undefined")
        pos = input.selectionStart;

    return pos;
}

//SET CURSOR POSITION
jQuery.fn.setCursorPosition = function (pos) {
    this.each(function (index, elem) {
        if (elem.setSelectionRange) {
            elem.setSelectionRange(pos, pos);
        } else if (elem.createTextRange) {
            var range = elem.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    });
    return this;
};
